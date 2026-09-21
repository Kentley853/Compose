import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useProject } from '../../context/ProjectContext';
import * as THREE from 'three';
import {
  Box,
  Layers,
  Sun,
  Eye,
  RotateCw,
  Palette,
  Maximize2,
  Minimize2,
  RefreshCw,
  ArrowRight,
  Info,
  Compass,
  Sliders,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Split,
  EyeOff,
  Crosshair,
  Lock,
  Tag,
  Camera,
  Grid,
} from 'lucide-react';
import { formatFeetInches, formatSqFt } from '../../utils/geometry';

type SectionDirection = 'top-to-bottom' | 'front-to-back' | 'left-to-right';
type CameraPreset = 'axon' | 'top' | 'front' | 'back' | 'left' | 'right';
type ModelStyle = 'material' | 'clay' | 'wireframe';

export const Coordinated3DModelScreen: React.FC = () => {
  const {
    project,
    activeFloor,
    setActiveFloor,
    selectedRoomId,
    setSelectedRoomId,
    setScreen,
    regenerateDependentViews,
  } = useProject();

  // Mount element & Three.js refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | THREE.OrthographicCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);

  // Group references for vertical exploded translation and floor isolation
  const modelRootGroupRef = useRef<THREE.Group | null>(null);
  const groundFloorGroupRef = useRef<THREE.Group | null>(null);
  const secondFloorGroupRef = useRef<THREE.Group | null>(null);
  const roofGroupRef = useRef<THREE.Group | null>(null);
  const roomMeshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());

  // Clipping Plane reference for real-time section cut
  const clippingPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, -1, 0), 40));

  // Inspection states
  const [modelStyle, setModelStyle] = useState<ModelStyle>('material');
  const [floorIsolation, setFloorIsolation] = useState<'all' | 'ground' | 'second'>('all');
  const [showRoof, setShowRoof] = useState<boolean>(true);
  const [hideExteriorWalls, setHideExteriorWalls] = useState<boolean>(false);
  const [showRoomLabels, setShowRoomLabels] = useState<boolean>(true);
  const [isTurntable, setIsTurntable] = useState<boolean>(false);
  const [isOrtho, setIsOrtho] = useState<boolean>(false);
  const [sunHour, setSunHour] = useState<number>(14); // 2:00 PM
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);
  // Below `lg` the model gets the whole canvas: the inspector becomes a bottom
  // sheet and the floating control panels collapse behind one toggle.
  const isCompact = useMediaQuery('(max-width: 1023px)');
  const [overlaysOpen, setOverlaysOpen] = useState<boolean>(true);

  // Default to an uncluttered model on small screens; both panels are one tap
  // away in the toolbar.
  useEffect(() => {
    setInspectorOpen(!isCompact);
    setOverlaysOpen(!isCompact);
  }, [isCompact]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // 1. SECTION CUT TOOL STATES (True Three.js local clipping plane)
  // Building total height ~ 28 ft (Ground: 0-11ft, Second: 11-22ft, Roof: 22-26ft)
  const [sectionHeightFeet, setSectionHeightFeet] = useState<number>(30); // 30 = full building (no cut)
  const [sectionDirection, setSectionDirection] = useState<SectionDirection>('top-to-bottom');
  const [sectionActive, setSectionActive] = useState<boolean>(false);

  // 2. EXPLODED FLOOR SEPARATION (0 = assembled, 1 = max separation)
  const [explodedSeparation, setExplodedSeparation] = useState<number>(0);

  const currentAlternative = useMemo(() => {
    return (
      project.alternatives.find((a) => a.id === project.activeAlternativeId) ||
      project.alternatives[0]
    );
  }, [project.alternatives, project.activeAlternativeId]);

  const selectedRoom = useMemo(() => {
    return currentAlternative.rooms.find((r) => r.id === selectedRoomId) || null;
  }, [currentAlternative, selectedRoomId]);

  // Test WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);

  // Update Three.js clipping plane whenever section slider or direction changes
  useEffect(() => {
    if (!rendererRef.current) return;
    const plane = clippingPlaneRef.current;

    if (!sectionActive && sectionHeightFeet >= 28) {
      rendererRef.current.clippingPlanes = [];
      return;
    }

    if (sectionDirection === 'top-to-bottom') {
      // Normal vector pointing down (0, -1, 0)
      // Plane equation: n.dot(p) + constant = 0
      // To keep everything below sectionHeightFeet:
      plane.normal.set(0, -1, 0);
      plane.constant = sectionHeightFeet * 0.3048; // convert feet to meters for 3D world
    } else if (sectionDirection === 'front-to-back') {
      plane.normal.set(0, 0, -1);
      plane.constant = (sectionHeightFeet - 14) * 0.3048;
    } else {
      plane.normal.set(-1, 0, 0);
      plane.constant = (sectionHeightFeet - 14) * 0.3048;
    }

    rendererRef.current.clippingPlanes = [plane];
  }, [sectionHeightFeet, sectionDirection, sectionActive]);

  // Update Floor Group vertical translations for Exploded View
  useEffect(() => {
    const secondGroup = secondFloorGroupRef.current;
    const roofGroup = roofGroupRef.current;
    if (!secondGroup || !roofGroup) return;

    // Scale factor: at max separation, second floor moves up by 4.5m, roof by 9m
    const separationMeters = explodedSeparation * 4.5;
    secondGroup.position.y = separationMeters;
    roofGroup.position.y = separationMeters * 2.0;
  }, [explodedSeparation]);

  // Initialize Three.js Scene, Camera, Renderer, and Orbit interaction
  useEffect(() => {
    if (!mountRef.current || !webglSupported) return;

    const width = mountRef.current.clientWidth || 800;
    const height = mountRef.current.clientHeight || 600;

    // Scene setup with neutral architectural environment
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#F7F8FA');
    sceneRef.current = scene;

    // Camera setup (Perspective default)
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 1000);
    camera.position.set(28, 22, 32);
    camera.lookAt(0, 3.5, 0);
    cameraRef.current = camera;

    // Renderer with localClippingEnabled for genuine Section Cuts
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.localClippingEnabled = true;
    rendererRef.current = renderer;

    mountRef.current.innerHTML = '';
    mountRef.current.appendChild(renderer.domElement);

    // Architectural Ground Grid
    const grid = new THREE.GridHelper(50, 50, '#CBD5E1', '#E2E8F0');
    grid.position.y = -0.05;
    scene.add(grid);

    // Site base ground slab with subtle shadow reception
    const siteGeo = new THREE.PlaneGeometry(44, 44);
    const siteMat = new THREE.MeshStandardMaterial({
      color: '#FFFFFF',
      roughness: 0.95,
      metalness: 0.05,
    });
    const siteMesh = new THREE.Mesh(siteGeo, siteMat);
    siteMesh.rotation.x = -Math.PI / 2;
    siteMesh.position.y = -0.1;
    siteMesh.receiveShadow = true;
    scene.add(siteMesh);

    // Lighting setup
    const ambientLight = new THREE.AmbientLight('#E2E8F0', 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight('#FFFBEB', 1.65);
    dirLight.position.set(20, 28, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -25;
    dirLight.shadow.camera.right = 25;
    dirLight.shadow.camera.top = 25;
    dirLight.shadow.camera.bottom = -25;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    const fillLight = new THREE.DirectionalLight('#BAE6FD', 0.5);
    fillLight.position.set(-20, 15, -20);
    scene.add(fillLight);

    // Root model container
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);
    modelRootGroupRef.current = rootGroup;

    // Floor Sub-groups for exploded view
    const groundGroup = new THREE.Group();
    const secondGroup = new THREE.Group();
    const roofGroup = new THREE.Group();

    rootGroup.add(groundGroup);
    rootGroup.add(secondGroup);
    rootGroup.add(roofGroup);

    groundFloorGroupRef.current = groundGroup;
    secondFloorGroupRef.current = secondGroup;
    roofGroupRef.current = roofGroup;

    // Orbit Controls variables
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let sphericalTheta = Math.PI / 4;
    let sphericalPhi = Math.PI / 3.2;
    let radius = 48;
    const target = new THREE.Vector3(0, 3.5, 0);

    const updateCameraPos = () => {
      camera.position.x = target.x + radius * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      camera.position.y = target.y + radius * Math.cos(sphericalPhi);
      camera.position.z = target.z + radius * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      camera.lookAt(target);
    };
    updateCameraPos();

    // Raycaster for 3D Room Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const dom = renderer.domElement;

    // Orbit / pick / pinch. Pointer events give the same gestures to a mouse,
    // a finger and a stylus; two fingers dolly the camera like the wheel does.
    const livePointers = new Map<number, { x: number; y: number }>();
    let pinchStartDist = 0;
    let pinchStartRadius = radius;

    const pointerSpread = () => {
      const pts = [...livePointers.values()];
      if (pts.length < 2) return 0;
      return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    };

    const onPointerDown = (e: PointerEvent) => {
      livePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dom.setPointerCapture?.(e.pointerId);

      if (livePointers.size === 2) {
        isDragging = false;
        pinchStartDist = pointerSpread();
        pinchStartRadius = radius;
        return;
      }

      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (livePointers.has(e.pointerId)) {
        livePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (livePointers.size >= 2 && pinchStartDist > 0) {
        const spread = pointerSpread();
        if (spread > 0) {
          radius = Math.max(12, Math.min(85, pinchStartRadius * (pinchStartDist / spread)));
          updateCameraPos();
        }
        return;
      }

      if (!isDragging) return;
      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      sphericalTheta -= deltaX * 0.008;
      sphericalPhi = Math.max(0.08, Math.min(Math.PI / 2 - 0.04, sphericalPhi - deltaY * 0.008));
      updateCameraPos();
    };

    const onPointerUp = (e: PointerEvent) => {
      const wasPinching = livePointers.size >= 2;
      livePointers.delete(e.pointerId);
      if (livePointers.size < 2) pinchStartDist = 0;

      // Check if it was a quick click without drag (room selection)
      const dist = Math.abs(e.clientX - prevX) + Math.abs(e.clientY - prevY);
      isDragging = false;

      if (!wasPinching && dist < 4 && mountRef.current) {
        const rect = mountRef.current.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const meshes = Array.from(roomMeshMapRef.current.values());
        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
          const clickedMesh = intersects[0].object as THREE.Mesh;
          const roomId = clickedMesh.userData.roomId;
          if (roomId) {
            setSelectedRoomId(roomId);
          }
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(12, Math.min(85, radius + e.deltaY * 0.04));
      updateCameraPos();
    };

    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (modelRootGroupRef.current && isTurntable) {
        modelRootGroupRef.current.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

    // ResizeObserver for dynamic full workspace responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(mountRef.current);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      resizeObserver.disconnect();
      renderer.dispose();
      siteGeo.dispose();
      siteMat.dispose();
    };
  }, [webglSupported, isTurntable, setSelectedRoomId]);

  // Rebuild 3D Building Geometry synchronized with 2D floor plan
  useEffect(() => {
    const groundGroup = groundFloorGroupRef.current;
    const secondGroup = secondFloorGroupRef.current;
    const roofGroup = roofGroupRef.current;
    if (!groundGroup || !secondGroup || !roofGroup) return;

    // Clear previous geometries
    groundGroup.clear();
    secondGroup.clear();
    roofGroup.clear();
    roomMeshMapRef.current.clear();

    const scaleMetersPerFoot = 0.28; // converts feet dimensions to 3D world units
    const wallHeightM = 3.2; // ~10.5 ft floor-to-ceiling
    const slabThicknessM = 0.3; // slab thickness

    // Material definitions based on modelStyle
    const wallMat =
      modelStyle === 'clay'
        ? new THREE.MeshStandardMaterial({ color: '#F1F5F9', roughness: 0.9 })
        : modelStyle === 'wireframe'
        ? new THREE.MeshBasicMaterial({ color: '#2563EB', wireframe: true })
        : new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.85, metalness: 0.05 });

    const selectedRoomMat = new THREE.MeshStandardMaterial({
      color: '#3B82F6',
      emissive: '#1D4ED8',
      emissiveIntensity: 0.3,
      roughness: 0.5,
    });

    const timberMat =
      modelStyle === 'material'
        ? new THREE.MeshStandardMaterial({ color: '#B45309', roughness: 0.6 }) // Natural Cedar Accents
        : wallMat;

    const slabMat =
      modelStyle === 'wireframe'
        ? new THREE.MeshBasicMaterial({ color: '#64748B', wireframe: true })
        : new THREE.MeshStandardMaterial({ color: '#E2E8F0', roughness: 0.95 });

    const glassMat =
      modelStyle === 'wireframe'
        ? new THREE.MeshBasicMaterial({ color: '#38BDF8', wireframe: true })
        : new THREE.MeshPhysicalMaterial({
            color: '#BAE6FD',
            transparent: true,
            opacity: 0.45,
            roughness: 0.1,
            metalness: 0.1,
          });

    const rooms = currentAlternative.rooms;
    // Center geometry around origin (0,0)
    const centerFootX = 22; // ~half of 44 ft width
    const centerFootY = 26; // ~half of 52 ft depth

    // 1. Ground Floor Assembly (Level 01)
    if (floorIsolation === 'all' || floorIsolation === 'ground') {
      const gRooms = rooms.filter((r) => r.floor === 1);

      // Ground Floor Concrete Slab
      const slabGeo = new THREE.BoxGeometry(46 * scaleMetersPerFoot, slabThicknessM, 54 * scaleMetersPerFoot);
      const slabMesh = new THREE.Mesh(slabGeo, slabMat);
      slabMesh.position.set(0, slabThicknessM / 2, 0);
      slabMesh.receiveShadow = true;
      groundGroup.add(slabMesh);

      // Ground Floor Rooms
      gRooms.forEach((r) => {
        const rw = r.width * scaleMetersPerFoot;
        const rd = r.height * scaleMetersPerFoot;
        const posX = (r.x + r.width / 2 - centerFootX) * scaleMetersPerFoot;
        const posZ = (r.y + r.height / 2 - centerFootY) * scaleMetersPerFoot;
        const posY = slabThicknessM + wallHeightM / 2;

        const isSel = r.id === selectedRoomId;
        const isAccent = r.name.toLowerCase().includes('great') || r.name.toLowerCase().includes('living');
        const mat = isSel ? selectedRoomMat : isAccent ? timberMat : wallMat;

        // Skip exterior room box if user clicked "Hide Exterior Walls"
        if (!hideExteriorWalls || isSel) {
          const roomGeo = new THREE.BoxGeometry(rw, wallHeightM, rd);
          const roomMesh = new THREE.Mesh(roomGeo, mat);
          roomMesh.position.set(posX, posY, posZ);
          roomMesh.castShadow = true;
          roomMesh.receiveShadow = true;
          roomMesh.userData = { roomId: r.id, roomName: r.name, floor: 1 };
          groundGroup.add(roomMesh);
          roomMeshMapRef.current.set(r.id, roomMesh);
        }

        // Glazing multi-slide doors for Great Room & Foyer
        if (r.name.toLowerCase().includes('great') || r.name.toLowerCase().includes('foyer')) {
          const winGeo = new THREE.BoxGeometry(rw * 0.75, wallHeightM * 0.7, 0.15);
          const winMesh = new THREE.Mesh(winGeo, glassMat);
          winMesh.position.set(posX, posY - 0.2, posZ + rd / 2 + 0.08);
          groundGroup.add(winMesh);
        }
      });
    }

    // 2. Second Floor Assembly (Level 02)
    if (floorIsolation === 'all' || floorIsolation === 'second') {
      const uRooms = rooms.filter((r) => r.floor === 2);
      const l1HeightM = slabThicknessM + wallHeightM;

      // Second Floor Inter-floor Slab
      const slab2Geo = new THREE.BoxGeometry(44 * scaleMetersPerFoot, slabThicknessM, 50 * scaleMetersPerFoot);
      const slab2Mesh = new THREE.Mesh(slab2Geo, slabMat);
      slab2Mesh.position.set(0, l1HeightM + slabThicknessM / 2, 0);
      slab2Mesh.receiveShadow = true;
      slab2Mesh.castShadow = true;
      secondGroup.add(slab2Mesh);

      // Second Floor Rooms
      uRooms.forEach((r) => {
        const rw = r.width * scaleMetersPerFoot;
        const rd = r.height * scaleMetersPerFoot;
        const posX = (r.x + r.width / 2 - centerFootX) * scaleMetersPerFoot;
        const posZ = (r.y + r.height / 2 - centerFootY) * scaleMetersPerFoot;
        const posY = l1HeightM + slabThicknessM + wallHeightM / 2;

        const isSel = r.id === selectedRoomId;
        const isAccent = r.name.toLowerCase().includes('primary') || r.name.toLowerCase().includes('suite');
        const mat = isSel ? selectedRoomMat : isAccent ? timberMat : wallMat;

        if (!hideExteriorWalls || isSel) {
          const roomGeo = new THREE.BoxGeometry(rw, wallHeightM, rd);
          const roomMesh = new THREE.Mesh(roomGeo, mat);
          roomMesh.position.set(posX, posY, posZ);
          roomMesh.castShadow = true;
          roomMesh.receiveShadow = true;
          roomMesh.userData = { roomId: r.id, roomName: r.name, floor: 2 };
          secondGroup.add(roomMesh);
          roomMeshMapRef.current.set(r.id, roomMesh);
        }

        // Bedroom windows
        const winGeo = new THREE.BoxGeometry(rw * 0.6, wallHeightM * 0.5, 0.15);
        const winMesh = new THREE.Mesh(winGeo, glassMat);
        winMesh.position.set(posX, posY, posZ + rd / 2 + 0.08);
        secondGroup.add(winMesh);
      });

      // 3. Roof Overhang Assembly
      if (showRoof && floorIsolation === 'all') {
        const roofElevationM = l1HeightM + slabThicknessM + wallHeightM + slabThicknessM / 2;
        const roofGeo = new THREE.BoxGeometry(
          48 * scaleMetersPerFoot, // generous cantilever overhang
          slabThicknessM * 1.5,
          54 * scaleMetersPerFoot
        );
        const roofMesh = new THREE.Mesh(roofGeo, slabMat);
        roofMesh.position.set(0, roofElevationM, 0);
        roofMesh.castShadow = true;
        roofGroup.add(roofMesh);
      }
    }
  }, [modelStyle, floorIsolation, showRoof, hideExteriorWalls, selectedRoomId, currentAlternative]);

  // Adjust Sun Direction
  useEffect(() => {
    if (!dirLightRef.current) return;
    const angle = ((sunHour - 8) / 10) * Math.PI;
    const sunDist = 36;
    const sunX = Math.cos(angle) * sunDist;
    const sunY = Math.sin(angle) * 26 + 6;
    const sunZ = 18;
    dirLightRef.current.position.set(sunX, sunY, sunZ);
  }, [sunHour]);

  // Camera Presets
  const setCameraPreset = (preset: CameraPreset) => {
    if (!cameraRef.current) return;
    const cam = cameraRef.current;
    if (preset === 'axon') {
      cam.position.set(28, 22, 32);
    } else if (preset === 'top') {
      cam.position.set(0, 52, 0.1);
    } else if (preset === 'front') {
      cam.position.set(0, 8, 44);
    } else if (preset === 'back') {
      cam.position.set(0, 8, -44);
    } else if (preset === 'left') {
      cam.position.set(-44, 8, 0);
    } else if (preset === 'right') {
      cam.position.set(44, 8, 0);
    }
    cam.lookAt(0, 3.5, 0);
  };

  // Focus camera on selected room
  const focusSelectedRoom = useCallback(() => {
    if (!selectedRoom || !cameraRef.current) return;
    const centerFootX = 22;
    const centerFootY = 26;
    const scaleMetersPerFoot = 0.28;
    const posX = (selectedRoom.x + selectedRoom.width / 2 - centerFootX) * scaleMetersPerFoot;
    const posZ = (selectedRoom.y + selectedRoom.height / 2 - centerFootY) * scaleMetersPerFoot;
    const posY = selectedRoom.floor === 1 ? 2.5 : 6.5;

    cameraRef.current.position.set(posX + 10, posY + 8, posZ + 12);
    cameraRef.current.lookAt(posX, posY, posZ);
  }, [selectedRoom]);

  // Section Height Presets
  const applySectionPreset = (stop: 'full' | 'roof_off' | 'second_cut' | 'second_plan' | 'ground_cut' | 'ground_plan' | 'foundation') => {
    setSectionActive(true);
    switch (stop) {
      case 'full':
        setSectionHeightFeet(30);
        setSectionActive(false);
        break;
      case 'roof_off':
        setSectionHeightFeet(24);
        break;
      case 'second_cut':
        setSectionHeightFeet(18);
        break;
      case 'second_plan':
        setSectionHeightFeet(13);
        break;
      case 'ground_cut':
        setSectionHeightFeet(7);
        break;
      case 'ground_plan':
        setSectionHeightFeet(2);
        break;
      case 'foundation':
        setSectionHeightFeet(0);
        break;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] overflow-hidden select-none">
      {/* 1. Top Architectural Toolbar */}
      <header className="h-12 bg-white border-b border-[#E4E7EC] px-2 sm:px-4 flex items-center gap-2 sm:gap-3 shrink-0 z-20">
        {/* Style, camera and floor-isolation groups share one scroller so they
            stay reachable on a phone; the action cluster stays pinned right. */}
        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
        {/* Left: View Presets & Camera controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Style Selector */}
          <div className="flex items-center bg-[#F2F4F7] p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setModelStyle('material')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                modelStyle === 'material' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              Material
            </button>
            <button
              onClick={() => setModelStyle('clay')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                modelStyle === 'clay' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              White Clay
            </button>
            <button
              onClick={() => setModelStyle('wireframe')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                modelStyle === 'wireframe' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              Wireframe
            </button>
          </div>

          <div className="h-4 w-[1px] bg-[#E4E7EC] mx-1 hidden sm:block" />

          {/* Camera Angles */}
          <div className="hidden xl:flex items-center gap-1 text-xs">
            {(['axon', 'top', 'front', 'back', 'left', 'right'] as CameraPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setCameraPreset(p)}
                className="px-2 py-1 rounded hover:bg-[#F2F4F7] text-[#667085] hover:text-[#172033] font-medium capitalize"
              >
                {p === 'axon' ? 'Axon 3D' : p}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Floor Isolation buttons */}
        <div className="flex items-center gap-1 bg-[#F2F4F7] p-1 rounded-lg text-xs font-semibold shrink-0 whitespace-nowrap">
          <button
            onClick={() => setFloorIsolation('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              floorIsolation === 'all' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <span className="hidden xl:inline">All Floors</span>
            <span className="xl:hidden">All</span>
          </button>
          <button
            onClick={() => setFloorIsolation('ground')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              floorIsolation === 'ground' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <span className="hidden xl:inline">Ground Only</span>
            <span className="xl:hidden">Ground</span>
          </button>
          <button
            onClick={() => setFloorIsolation('second')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              floorIsolation === 'second' ? 'bg-white text-[#2563EB] shadow-xs' : 'text-[#667085] hover:text-[#172033]'
            }`}
          >
            <span className="hidden xl:inline">Second Only</span>
            <span className="xl:hidden">Second</span>
          </button>
        </div>

        </div>

        {/* Right: Quick Actions & Toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Floating-panel toggle (compact screens only) */}
          <button
            onClick={() => setOverlaysOpen(!overlaysOpen)}
            className={`lg:hidden p-1.5 rounded-lg border border-[#E4E7EC] transition-colors ${
              overlaysOpen ? 'bg-[#EEF4FF] text-[#2563EB]' : 'text-[#667085] hover:text-[#172033]'
            }`}
            aria-pressed={overlaysOpen}
            title={overlaysOpen ? 'Hide model controls' : 'Show model controls'}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {/* Roof Toggle */}
          <button
            onClick={() => setShowRoof(!showRoof)}
            className={`hidden sm:block px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
              showRoof ? 'bg-white text-[#344054] border-[#E4E7EC]' : 'bg-[#F2F4F7] text-[#98A2B3] border-transparent'
            }`}
            title="Toggle Roof Slab"
          >
            Roof: {showRoof ? 'ON' : 'OFF'}
          </button>

          {/* Hide Exterior Walls Toggle */}
          <button
            onClick={() => setHideExteriorWalls(!hideExteriorWalls)}
            className={`hidden md:block px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
              hideExteriorWalls
                ? 'bg-[#EEF4FF] text-[#2563EB] border-[#2563EB]/30'
                : 'bg-white text-[#344054] border-[#E4E7EC]'
            }`}
            title="Hide Exterior Walls to inspect interior spaces"
          >
            <span className="hidden xl:inline">
              {hideExteriorWalls ? 'Interior Exposed' : 'Solid Facade'}
            </span>
            <span className="xl:hidden">{hideExteriorWalls ? 'Interior' : 'Facade'}</span>
          </button>

          {/* Turntable Auto-rotate */}
          <button
            onClick={() => setIsTurntable(!isTurntable)}
            className={`hidden sm:block p-1.5 rounded-lg border border-[#E4E7EC] transition-colors ${
              isTurntable ? 'bg-[#EEF4FF] text-[#2563EB]' : 'text-[#667085] hover:text-[#172033]'
            }`}
            title="Auto-rotate turntable"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Quick-switch to 2D Floor Plan */}
          <button
            onClick={() => setScreen('floorplan')}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <span className="hidden sm:inline">2D Plan</span>
            <span className="sm:hidden">2D</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Inspector Toggle */}
          <button
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className={`p-1.5 rounded-lg border border-[#E4E7EC] transition-colors ${
              inspectorOpen ? 'bg-[#EEF4FF] text-[#2563EB]' : 'text-[#667085] hover:text-[#172033]'
            }`}
            title="Toggle Inspector"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Central Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Central 3D Canvas Mount (Dominant Space) */}
        <div className="flex-1 relative h-full bg-[#F7F8FA]">
          <div ref={mountRef} className="w-full h-full touch-none cursor-grab active:cursor-grabbing" />

          {/* Left Overlay: SECTION CUT SLIDER ("Section Height") */}
          <div
            className={`${
              overlaysOpen ? 'flex' : 'hidden'
            } lg:flex flex-col absolute top-3 left-3 lg:top-4 lg:left-4 right-3 lg:right-auto bg-white/95 backdrop-blur-md p-3 lg:p-3.5 rounded-xl border border-[#E4E7EC] shadow-lg z-10 w-auto lg:w-64 max-w-[20rem] space-y-3 max-h-[45%] overflow-y-auto overscroll-contain`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#E4E7EC]">
              <div className="flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#172033]">Section Height</span>
              </div>
              <span className="text-xs font-mono font-bold text-[#2563EB]">
                {formatFeetInches(sectionHeightFeet)}
              </span>
            </div>

            {/* Vertical slider */}
            <div className="space-y-1.5">
              <input
                type="range"
                min={0}
                max={30}
                step={0.5}
                value={sectionHeightFeet}
                onChange={(e) => {
                  setSectionActive(true);
                  setSectionHeightFeet(Number(e.target.value));
                }}
                className="w-full accent-[#2563EB] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#98A2B3] font-mono">
                <span>Foundation (0')</span>
                <span>Roof (26')</span>
              </div>
            </div>

            {/* Section Presets */}
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button
                onClick={() => applySectionPreset('roof_off')}
                className="p-1 rounded bg-[#F2F4F7] hover:bg-[#E4E7EC] font-medium text-[#344054]"
              >
                Roof Removed
              </button>
              <button
                onClick={() => applySectionPreset('second_cut')}
                className="p-1 rounded bg-[#F2F4F7] hover:bg-[#E4E7EC] font-medium text-[#344054]"
              >
                Second Floor Cut
              </button>
              <button
                onClick={() => applySectionPreset('second_plan')}
                className="p-1 rounded bg-[#F2F4F7] hover:bg-[#E4E7EC] font-medium text-[#344054]"
              >
                Second Fl. Plan
              </button>
              <button
                onClick={() => applySectionPreset('ground_cut')}
                className="p-1 rounded bg-[#F2F4F7] hover:bg-[#E4E7EC] font-medium text-[#344054]"
              >
                Ground Floor Cut
              </button>
            </div>

            {/* Reset Section button */}
            <button
              onClick={() => applySectionPreset('full')}
              className="w-full py-1 text-center text-[11px] font-semibold text-[#667085] hover:text-[#172033] hover:bg-[#F2F4F7] rounded transition-colors"
            >
              Reset Section (Full Building)
            </button>
          </div>

          {/* Bottom Center Overlay: EXPLODED FLOOR SEPARATION ("Separate Floors") */}
          <div
            className={`${
              overlaysOpen ? 'flex' : 'hidden'
            } lg:flex absolute bottom-3 lg:bottom-4 left-3 right-3 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 bg-white/95 backdrop-blur-md px-3 lg:px-4 py-2 lg:py-2.5 rounded-xl border border-[#E4E7EC] shadow-lg z-10 items-center justify-center flex-wrap lg:flex-nowrap gap-2 lg:gap-3 text-xs`}
          >
            <div className="flex items-center gap-1.5 font-bold text-[#172033] shrink-0">
              <Split className="w-4 h-4 text-[#2563EB]" />
              <span className="hidden xs:inline">Separate Floors:</span>
              <span className="xs:hidden">Floors</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={explodedSeparation}
              onChange={(e) => setExplodedSeparation(Number(e.target.value))}
              className="flex-1 min-w-[6rem] max-w-[12rem] accent-[#2563EB] cursor-pointer"
            />
            <span className="font-mono text-[11px] font-bold text-[#2563EB] w-12">
              {Math.round(explodedSeparation * 100)}%
            </span>

            {/* Exploded Presets */}
            <div className="hidden sm:flex items-center gap-1 border-l border-[#E4E7EC] pl-2 shrink-0">
              <button
                onClick={() => setExplodedSeparation(0)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  explodedSeparation === 0 ? 'bg-[#EEF4FF] text-[#2563EB] font-bold' : 'text-[#667085]'
                }`}
              >
                Assembled
              </button>
              <button
                onClick={() => setExplodedSeparation(0.35)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  explodedSeparation > 0.2 && explodedSeparation < 0.5 ? 'bg-[#EEF4FF] text-[#2563EB] font-bold' : 'text-[#667085]'
                }`}
              >
                Slight
              </button>
              <button
                onClick={() => setExplodedSeparation(1)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                  explodedSeparation === 1 ? 'bg-[#EEF4FF] text-[#2563EB] font-bold' : 'text-[#667085]'
                }`}
              >
                Exploded
              </button>
            </div>
          </div>

          {/* Bottom Right: Sun Study Slider — sits above the exploded panel on
              compact screens, where both would otherwise share the same row. */}
          <div
            className={`${
              overlaysOpen ? 'flex' : 'hidden'
            } lg:flex absolute bottom-20 right-3 lg:bottom-4 lg:right-4 bg-white/95 backdrop-blur-md p-2 lg:p-2.5 rounded-xl border border-[#E4E7EC] shadow-lg items-center gap-2 text-xs z-10`}
          >
            <Sun className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span className="text-[#667085] font-medium">Sun: {sunHour}:00</span>
            <input
              type="range"
              min={8}
              max={18}
              step={1}
              value={sunHour}
              onChange={(e) => setSunHour(Number(e.target.value))}
              className="w-20 accent-[#2563EB]"
            />
          </div>
        </div>

        {/* 3. Massing & Space Inspector — right column on desktop, bottom sheet
               over the model on compact screens. */}
        {inspectorOpen && isCompact && (
          <div
            onClick={() => setInspectorOpen(false)}
            className="absolute inset-0 z-30 bg-[#0F172A]/35 animate-in fade-in duration-150"
            aria-hidden="true"
          />
        )}
        {inspectorOpen && (
          <div
            className={
              isCompact
                ? 'absolute inset-x-0 bottom-0 z-40 max-h-[72%] bg-white border-t border-[#E4E7EC] rounded-t-2xl flex flex-col shadow-2xl animate-in slide-sheet pb-safe'
                : 'w-80 bg-white border-l border-[#E4E7EC] flex flex-col shrink-0 z-20 shadow-xs'
            }
          >
            {isCompact && (
              <button
                onClick={() => setInspectorOpen(false)}
                aria-label="Close inspector"
                className="w-full pt-2.5 pb-1 flex justify-center shrink-0"
              >
                <span className="w-10 h-1.5 rounded-full bg-[#D0D5DD]" />
              </button>
            )}
            <div className="p-3.5 border-b border-[#E4E7EC] flex items-center justify-between shrink-0">
              <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                3D Model & Space Inspector
              </span>
              <button
                onClick={() => setInspectorOpen(false)}
                className="p-1 rounded text-[#667085] hover:text-[#172033]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 text-xs">
              {/* Selected Room Details (Synchronized with 2D) */}
              {selectedRoom ? (
                <div className="p-3.5 rounded-xl bg-[#EEF4FF] border border-[#2563EB]/20 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB]">
                      Selected 3D Space
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-bold">
                      Level 0{selectedRoom.floor}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-[#172033]">{selectedRoom.name}</div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-[#667085]">Dimensions</span>
                      <div className="font-mono font-semibold text-[#172033]">
                        {formatFeetInches(selectedRoom.width)} × {formatFeetInches(selectedRoom.height)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[#667085]">Measured Area</span>
                      <div className="font-mono font-bold text-[#2563EB]">
                        {formatSqFt(selectedRoom.area || selectedRoom.width * selectedRoom.height)}
                      </div>
                    </div>
                  </div>

                  {/* Focus Camera on Room */}
                  <button
                    onClick={focusSelectedRoom}
                    className="w-full mt-2 py-1.5 rounded-lg bg-white border border-[#2563EB]/30 hover:bg-[#DBEAFE] text-[#2563EB] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Focus Camera in 3D</span>
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] text-[#667085] space-y-1">
                  <div className="font-semibold text-[#172033]">Click any 3D room</div>
                  <p className="text-[11px] leading-relaxed">
                    Click any volume in the 3D model to inspect its properties, focus the camera, or isolate it.
                  </p>
                </div>
              )}

              {/* Building Massing Stats */}
              <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2.5">
                <span className="text-[11px] font-bold text-[#344054] uppercase tracking-wider">
                  Building Volumetric Matrix
                </span>

                <div className="flex items-center justify-between">
                  <span className="text-[#667085]">Total Conditioned Area:</span>
                  <span className="font-mono font-bold text-[#172033]">
                    {project.requirements.targetBuiltUpArea.toLocaleString()} SF
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#667085]">Building Footprint:</span>
                  <span className="font-mono font-semibold text-[#172033]">
                    {formatFeetInches(44)} × {formatFeetInches(52)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#667085]">Zoning Envelope:</span>
                  <span className="font-mono font-semibold text-[#12B76A]">COMPLIANT (Austin IRC)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#667085]">Active Scheme:</span>
                  <span className="font-semibold text-[#2563EB]">{currentAlternative.name}</span>
                </div>
              </div>

              {/* Inspection Shortcuts Guide */}
              <div className="space-y-1.5 text-[11px] text-[#667085] leading-relaxed">
                <span className="font-bold text-[#344054] uppercase text-[10px]">Controls</span>
                <p>• Left Click + Drag: Orbit camera</p>
                <p>• Scroll Wheel: Smooth zoom</p>
                <p>• Section Height Slider: Progressive clipping plane</p>
                <p>• Separate Floors: Vertical exploded massing</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
