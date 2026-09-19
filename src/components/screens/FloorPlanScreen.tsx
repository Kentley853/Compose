import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import { RoomData, PlanAlternative } from '../../types/architecture';
import {
  MousePointer,
  Hand,
  Ruler,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Compass,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Share2,
  Printer,
  FileCode2,
  Box,
  HelpCircle,
  Hash,
  ArrowUpRight,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  formatFeetInches,
  parseFeetInches,
  formatSqFt,
  calculatePlanBounds,
  calculateFitViewport,
  validateRoom,
  resolveRoomLabelPlacement,
} from '../../utils/geometry';

type ToolMode = 'select' | 'pan' | 'measure';
type DisplayPreset = 'presentation' | 'architectural' | 'technical' | 'minimal' | 'print';

export const FloorPlanScreen: React.FC = () => {
  const {
    project,
    activeFloor,
    setActiveFloor,
    selectedRoomId,
    setSelectedRoomId,
    updateRoom,
    selectAlternative,
    setScreen,
    addToast,
  } = useProject();

  // Container & Canvas references
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasSvgRef = useRef<SVGSVGElement>(null);

  // Layout & Panel states
  const [leftRailOpen, setLeftRailOpen] = useState(true);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorWidth, setInspectorWidth] = useState(320); // 300 - 340px resizable
  const [isResizingInspector, setIsResizingInspector] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  // Tools & Viewport transforms
  const [activeTool, setActiveTool] = useState<ToolMode>('select');
  const [displayPreset, setDisplayPreset] = useState<DisplayPreset>('architectural');
  const [allFloorsOverlay, setAllFloorsOverlay] = useState(false);

  // Viewport transform (scale: px per foot; panX, panY: pixel offset)
  const [scale, setScale] = useState<number>(14);
  const [panX, setPanX] = useState<number>(50);
  const [panY, setPanY] = useState<number>(50);
  const [viewportSize, setViewportSize] = useState({ width: 800, height: 600 });
  const [mouseCoord, setMouseCoord] = useState<{ xFt: number; yFt: number } | null>(null);

  // Measurement tool state (two-point measurement in world feet)
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureCurrent, setMeasureCurrent] = useState<{ x: number; y: number } | null>(null);

  // Scheme selector dropdown
  const [schemeDropdownOpen, setSchemeDropdownOpen] = useState(false);

  // Dimension lock states
  const [lockedRooms, setLockedRooms] = useState<Record<string, boolean>>({});

  // Active Alternative & Rooms
  const currentAlternative = useMemo(() => {
    return (
      project.alternatives.find((a) => a.id === project.activeAlternativeId) ||
      project.alternatives[0]
    );
  }, [project.alternatives, project.activeAlternativeId]);

  const groundRooms = useMemo(() => currentAlternative.rooms.filter((r) => r.floor === 1), [currentAlternative]);
  const upperRooms = useMemo(() => currentAlternative.rooms.filter((r) => r.floor === 2), [currentAlternative]);
  const activeRooms = useMemo(
    () => currentAlternative.rooms.filter((r) => r.floor === activeFloor),
    [currentAlternative, activeFloor]
  );
  const overlayRooms = useMemo(
    () => (allFloorsOverlay ? currentAlternative.rooms.filter((r) => r.floor !== activeFloor) : []),
    [allFloorsOverlay, currentAlternative, activeFloor]
  );

  const selectedRoom = useMemo(() => {
    return currentAlternative.rooms.find((r) => r.id === selectedRoomId) || null;
  }, [currentAlternative, selectedRoomId]);

  // Bounding box of entire building geometry and plot
  const planBounds = useMemo(() => {
    return calculatePlanBounds(currentAlternative.rooms, project.plot);
  }, [currentAlternative.rooms, project.plot]);

  // Fit Plan to Viewport calculation
  const fitPlan = useCallback(() => {
    if (viewportSize.width <= 0 || viewportSize.height <= 0) return;
    const fit = calculateFitViewport(planBounds, viewportSize, 0.10);
    setScale(fit.scale);
    setPanX(fit.offsetX);
    setPanY(fit.offsetY);
  }, [planBounds, viewportSize]);

  // Fit Selected Room to Viewport
  const fitSelectedRoom = useCallback(() => {
    if (!selectedRoom || viewportSize.width <= 0 || viewportSize.height <= 0) {
      fitPlan();
      return;
    }
    const roomBounds = {
      minX: selectedRoom.x,
      minY: selectedRoom.y,
      maxX: selectedRoom.x + selectedRoom.width,
      maxY: selectedRoom.y + selectedRoom.height,
      width: selectedRoom.width,
      depth: selectedRoom.height,
    };
    const fit = calculateFitViewport(roomBounds, viewportSize, 0.30);
    setScale(Math.min(fit.scale, 28)); // don't overzoom
    setPanX(fit.offsetX);
    setPanY(fit.offsetY);
  }, [selectedRoom, viewportSize, fitPlan]);

  // Auto-fit on initial mount or when alternative changes
  useEffect(() => {
    fitPlan();
  }, [project.activeAlternativeId, fitPlan]);

  // ResizeObserver on canvas container
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setViewportSize({ width, height });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Keyboard shortcuts: 1, 2, 0, F, Esc, H, V, M, Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === '1') {
        setActiveFloor(1);
        setAllFloorsOverlay(false);
      } else if (e.key === '2') {
        setActiveFloor(2);
        setAllFloorsOverlay(false);
      } else if (e.key === '0') {
        setAllFloorsOverlay((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f') {
        fitPlan();
      } else if (e.key === 'Escape') {
        setSelectedRoomId(null);
        setMeasureStart(null);
        setMeasureCurrent(null);
      } else if (e.key.toLowerCase() === 'h') {
        setInspectorOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'm') {
        setActiveTool('measure');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveFloor, fitPlan, setSelectedRoomId]);

  // Mouse wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const newScale = Math.max(4, Math.min(60, scale * zoomFactor));

    // Keep world coordinate under mouse stationary:
    // mouseX = panX + worldX * scale => worldX = (mouseX - panX) / scale
    // mouseX = newPanX + worldX * newScale => newPanX = mouseX - worldX * newScale
    const worldX = (mouseX - panX) / scale;
    const worldY = (mouseY - panY) / scale;

    const newPanX = mouseX - worldX * newScale;
    const newPanY = mouseY - worldY * newScale;

    setScale(newScale);
    setPanX(newPanX);
    setPanY(newPanY);
  };

  // Pan interaction
  const isPanningRef = useRef(false);
  const startPanPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    const isMiddleClick = e.button === 1;
    const isSpacePan = activeTool === 'pan' || e.shiftKey;

    if (isMiddleClick || isSpacePan) {
      isPanningRef.current = true;
      startPanPosRef.current = { x: e.clientX - panX, y: e.clientY - panY };
      e.preventDefault();
      return;
    }

    if (activeTool === 'measure') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const xPix = e.clientX - rect.left;
      const yPix = e.clientY - rect.top;
      const xFt = (xPix - panX) / scale;
      const yFt = (yPix - panY) / scale;

      if (!measureStart) {
        setMeasureStart({ x: xFt, y: yFt });
        setMeasureCurrent({ x: xFt, y: yFt });
      } else {
        // Finalize measurement
        setMeasureStart(null);
        setMeasureCurrent(null);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const xPix = e.clientX - rect.left;
      const yPix = e.clientY - rect.top;
      const xFt = (xPix - panX) / scale;
      const yFt = (yPix - panY) / scale;
      setMouseCoord({ xFt, yFt });

      if (activeTool === 'measure' && measureStart) {
        setMeasureCurrent({ x: xFt, y: yFt });
      }
    }

    if (isPanningRef.current) {
      setPanX(e.clientX - startPanPosRef.current.x);
      setPanY(e.clientY - startPanPosRef.current.y);
    }
  };

  const handleMouseUp = () => {
    isPanningRef.current = false;
  };

  // Resizing inspector panel
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingInspector(true);
    const startX = e.clientX;
    const startWidth = inspectorWidth;

    const handleMouseMoveDoc = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      const newWidth = Math.max(280, Math.min(420, startWidth + delta));
      setInspectorWidth(newWidth);
    };

    const handleMouseUpDoc = () => {
      setIsResizingInspector(false);
      window.removeEventListener('mousemove', handleMouseMoveDoc);
      window.removeEventListener('mouseup', handleMouseUpDoc);
    };

    window.addEventListener('mousemove', handleMouseMoveDoc);
    window.addEventListener('mouseup', handleMouseUpDoc);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.parentElement?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Room Inspector field updates
  const handleDimensionChange = (field: 'width' | 'height', val: number) => {
    if (!selectedRoom || val <= 0.5) return;
    if (lockedRooms[selectedRoom.id]) {
      addToast('Dimension Locked', 'Unlock this room to modify its dimensions.', 'warning');
      return;
    }
    const rounded = Math.round(val * 10) / 10;
    updateRoom(selectedRoom.id, { [field]: rounded });
  };

  // Preset Visual Styles
  const getPresetStyles = (preset: DisplayPreset) => {
    switch (preset) {
      case 'architectural':
        return {
          bg: '#FFFFFF',
          gridColor: '#F1F5F9',
          wallExtStroke: '#0F172A',
          wallExtWidth: 4.5,
          wallIntStroke: '#334155',
          wallIntWidth: 2.2,
          roomFill: '#F8FAFC',
          roomHoverFill: '#EFF6FF',
          selectedFill: '#DBEAFE',
          selectedStroke: '#2563EB',
          doorStroke: '#475569',
          windowStroke: '#0284C7',
          dimColor: '#64748B',
          textColor: '#0F172A',
        };
      case 'presentation':
        return {
          bg: '#F8FAFC',
          gridColor: '#E2E8F0',
          wallExtStroke: '#1E293B',
          wallExtWidth: 4.0,
          wallIntStroke: '#475569',
          wallIntWidth: 2.0,
          roomFill: 'zone',
          roomHoverFill: '#E0E7FF',
          selectedFill: '#EEF2FF',
          selectedStroke: '#4F46E5',
          doorStroke: '#4338CA',
          windowStroke: '#0284C7',
          dimColor: '#64748B',
          textColor: '#1E293B',
        };
      case 'technical':
        return {
          bg: '#FFFFFF',
          gridColor: '#E2E8F0',
          wallExtStroke: '#000000',
          wallExtWidth: 5.0,
          wallIntStroke: '#1E293B',
          wallIntWidth: 2.5,
          roomFill: '#FFFFFF',
          roomHoverFill: '#F1F5F9',
          selectedFill: '#E0F2FE',
          selectedStroke: '#0284C7',
          doorStroke: '#0F172A',
          windowStroke: '#0284C7',
          dimColor: '#0F172A',
          textColor: '#000000',
        };
      case 'minimal':
        return {
          bg: '#FFFFFF',
          gridColor: 'transparent',
          wallExtStroke: '#334155',
          wallExtWidth: 3.5,
          wallIntStroke: '#64748B',
          wallIntWidth: 1.8,
          roomFill: '#FAFAFA',
          roomHoverFill: '#F4F4F5',
          selectedFill: '#E4E4E7',
          selectedStroke: '#18181B',
          doorStroke: '#71717A',
          windowStroke: '#71717A',
          dimColor: '#A1A1AA',
          textColor: '#18181B',
        };
      case 'print':
        return {
          bg: '#FFFFFF',
          gridColor: 'transparent',
          wallExtStroke: '#000000',
          wallExtWidth: 4.5,
          wallIntStroke: '#1E293B',
          wallIntWidth: 2.2,
          roomFill: '#FFFFFF',
          roomHoverFill: '#F8FAFC',
          selectedFill: '#F1F5F9',
          selectedStroke: '#000000',
          doorStroke: '#000000',
          windowStroke: '#000000',
          dimColor: '#000000',
          textColor: '#000000',
        };
    }
  };

  const presetStyle = getPresetStyles(displayPreset);

  // Zone colors for presentation mode
  const getZoneFill = (zone: RoomData['zone'], isSelected: boolean, isHovered: boolean) => {
    if (isSelected) return presetStyle.selectedFill;
    if (isHovered) return presetStyle.roomHoverFill;
    if (displayPreset !== 'presentation') return presetStyle.roomFill;

    switch (zone) {
      case 'Public':
        return '#F0F9FF'; // soft sky
      case 'Private':
        return '#FAF5FF'; // soft purple
      case 'Service':
        return '#F8FAFC'; // slate
      case 'Circulation':
        return '#F1F5F9'; // neutral
      case 'Outdoor':
        return '#F0FDF4'; // mint
      default:
        return '#F8FAFC';
    }
  };

  // Label placements for collision-free drawing
  const activeLabelPlacements = useMemo(() => {
    const map = new Map<string, ReturnType<typeof resolveRoomLabelPlacement>>();
    activeRooms.forEach((r, idx) => {
      map.set(r.id, resolveRoomLabelPlacement(r, scale, idx));
    });
    return map;
  }, [activeRooms, scale]);

  // Small rooms requiring legend entries
  const compactLegendRooms = useMemo(() => {
    return activeRooms
      .map((r, idx) => ({ room: r, placement: activeLabelPlacements.get(r.id)!, index: idx + 1 }))
      .filter((item) => item.placement?.mode === 'marker');
  }, [activeRooms, activeLabelPlacements]);

  // Calculate gross area on active floor
  const floorGfa = useMemo(() => {
    return activeRooms.reduce((sum, r) => sum + (r.area || r.width * r.height), 0);
  }, [activeRooms]);

  // Validation state of selected room
  const selectedRoomValidation = useMemo(() => {
    if (!selectedRoom) return null;
    return validateRoom(selectedRoom, currentAlternative.rooms);
  }, [selectedRoom, currentAlternative.rooms]);

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] overflow-hidden select-none">
      {/* 1. Compact Architectural Top Toolbar (48–56px) */}
      <header className="h-12 sm:h-13 bg-white border-b border-[#E4E7EC] px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-20">
        {/* Left: Floor Switcher (Ground Floor, Second Floor, All Floors Overlay) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-[#F2F4F7] p-1 rounded-lg">
            <button
              id="btn-floor-ground"
              onClick={() => {
                setActiveFloor(1);
                setAllFloorsOverlay(false);
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFloor === 1 && !allFloorsOverlay
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
              title="Switch to Ground Floor (Key: 1)"
            >
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span>Ground Floor</span>
              <span className="hidden md:inline text-[10px] text-[#667085] font-mono">
                ({groundRooms.length} rms • {Math.round(groundRooms.reduce((a, r) => a + (r.area || r.width * r.height), 0))} SF)
              </span>
            </button>

            <button
              id="btn-floor-second"
              onClick={() => {
                setActiveFloor(2);
                setAllFloorsOverlay(false);
              }}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeFloor === 2 && !allFloorsOverlay
                  ? 'bg-white text-[#2563EB] shadow-xs'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
              title="Switch to Second Floor (Key: 2)"
            >
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span>Second Floor</span>
              <span className="hidden md:inline text-[10px] text-[#667085] font-mono">
                ({upperRooms.length} rms • {Math.round(upperRooms.reduce((a, r) => a + (r.area || r.width * r.height), 0))} SF)
              </span>
            </button>

            <button
              id="btn-floor-overlay"
              onClick={() => setAllFloorsOverlay(!allFloorsOverlay)}
              className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                allFloorsOverlay
                  ? 'bg-[#EEF4FF] text-[#2563EB] border border-[#2563EB]/20 shadow-xs'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
              title="Toggle All Floors Overlay (Key: 0)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Floors Overlay</span>
            </button>
          </div>
        </div>

        {/* Center: Compact Scheme Selector */}
        <div className="relative">
          <button
            onClick={() => setSchemeDropdownOpen(!schemeDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-semibold text-[#172033] transition-colors"
          >
            <span className="text-[#667085]">Scheme:</span>
            <span className="text-[#2563EB] font-bold">{currentAlternative.name}</span>
            <span className="text-[#667085] text-[11px] font-mono hidden sm:inline">
              ({currentAlternative.grossArea} m²)
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
          </button>

          {schemeDropdownOpen && (
            <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 w-72 bg-white rounded-xl shadow-xl border border-[#E4E7EC] p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#667085] px-2 py-1">
                Select Design Scheme
              </div>
              {project.alternatives.map((alt) => (
                <button
                  key={alt.id}
                  onClick={() => {
                    selectAlternative(alt.id);
                    setSchemeDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    alt.id === currentAlternative.id
                      ? 'bg-[#EEF4FF] text-[#2563EB] font-bold'
                      : 'hover:bg-[#F9FAFB] text-[#172033]'
                  }`}
                >
                  <div>
                    <div>{alt.name}</div>
                    <div className="text-[11px] text-[#667085] font-normal">{alt.conceptTag}</div>
                  </div>
                  <div className="text-right font-mono text-[11px] text-[#667085]">
                    {alt.efficiency}% eff.
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Display Preset, 3D Quick-link, Fullscreen, Inspector Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Preset Selector */}
          <select
            value={displayPreset}
            onChange={(e) => setDisplayPreset(e.target.value as DisplayPreset)}
            className="text-xs bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-2.5 py-1.5 font-medium text-[#344054] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
            title="Display Style Preset"
          >
            <option value="architectural">Style: Architectural</option>
            <option value="presentation">Style: Presentation</option>
            <option value="technical">Style: Technical (CAD)</option>
            <option value="minimal">Style: Minimalist</option>
            <option value="print">Style: Print Preview</option>
          </select>

          {/* Quick-switch to 3D */}
          <button
            onClick={() => setScreen('coordinated3d')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-semibold text-[#172033] transition-colors"
            title="Inspect 3D Coordinated Model"
          >
            <Box className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>3D Model</span>
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] border border-[#E4E7EC]"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Drawing Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Toggle Inspector Button */}
          <button
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className={`p-1.5 rounded-lg border border-[#E4E7EC] transition-colors ${
              inspectorOpen ? 'bg-[#EEF4FF] text-[#2563EB]' : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
            }`}
            title={inspectorOpen ? 'Hide Inspector (Key: H)' : 'Show Inspector (Key: H)'}
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Main Workspace Body: Left Tool Rail + Dominant Central Canvas + Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Tool Rail: 56–64px */}
        <div
          className={`bg-white border-r border-[#E4E7EC] flex flex-col items-center py-3 gap-2 shrink-0 z-10 transition-all ${
            leftRailOpen ? 'w-14' : 'w-0 overflow-hidden'
          }`}
        >
          {/* Select Tool (V) */}
          <button
            id="tool-select"
            onClick={() => setActiveTool('select')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              activeTool === 'select'
                ? 'bg-[#EEF4FF] text-[#2563EB] shadow-xs'
                : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
            }`}
            title="Select Tool (V) - Click rooms to inspect"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Pan Tool (H / Space) */}
          <button
            id="tool-pan"
            onClick={() => setActiveTool('pan')}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              activeTool === 'pan'
                ? 'bg-[#EEF4FF] text-[#2563EB] shadow-xs'
                : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
            }`}
            title="Pan Tool (Hand / Middle Mouse / Space)"
          >
            <Hand className="w-4 h-4" />
          </button>

          {/* Measure Tool (M) */}
          <button
            id="tool-measure"
            onClick={() => {
              setActiveTool('measure');
              setMeasureStart(null);
              setMeasureCurrent(null);
            }}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              activeTool === 'measure'
                ? 'bg-[#EEF4FF] text-[#2563EB] shadow-xs'
                : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
            }`}
            title="Measure Dimension Tool (M) - Click two points to measure distance"
          >
            <Ruler className="w-4 h-4" />
          </button>

          <div className="w-8 h-[1px] bg-[#E4E7EC] my-1" />

          {/* Fit Plan (F) */}
          <button
            id="btn-fit-plan"
            onClick={fitPlan}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] transition-colors"
            title="Fit Plan to Viewport (F)"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Zoom In (+) */}
          <button
            onClick={() => {
              setScale((s) => Math.min(60, s * 1.2));
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Zoom Out (-) */}
          <button
            onClick={() => {
              setScale((s) => Math.max(4, s * 0.83));
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Reset View (1:1 scale) */}
          <button
            onClick={() => {
              setScale(14);
              fitPlan();
            }}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] transition-colors"
            title="Reset Scale & View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Large Central Drawing Canvas: Dominant Element (70-80% of workspace) */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className={`flex-1 relative overflow-hidden flex items-center justify-center select-none ${
            activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : activeTool === 'measure' ? 'cursor-crosshair' : 'cursor-default'
          }`}
          style={{ backgroundColor: presetStyle.bg }}
        >
          {/* Floating Compass Badge */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 backdrop-blur-md border border-[#E4E7EC] text-xs font-mono text-[#344054] shadow-xs pointer-events-none">
            <Compass className="w-4 h-4 text-[#2563EB]" />
            <span className="font-semibold">North 0°</span>
            <span className="text-[#98A2B3]">|</span>
            <span>Lot: {project.plot.width}' × {project.plot.depth}'</span>
          </div>

          {/* Measure Tool Active Banner */}
          {activeTool === 'measure' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full bg-[#172033] text-white text-xs font-medium shadow-lg flex items-center gap-2 animate-bounce">
              <Ruler className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>{measureStart ? 'Click second point to measure distance' : 'Click starting point to measure'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTool('select');
                  setMeasureStart(null);
                  setMeasureCurrent(null);
                }}
                className="ml-2 text-xs text-white/60 hover:text-white"
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {/* SVG Floor Plan Drawing Canvas with World Coordinates */}
          <svg
            ref={canvasSvgRef}
            width={viewportSize.width}
            height={viewportSize.height}
            className="w-full h-full block"
          >
            <defs>
              {/* Drafting Grid Pattern */}
              <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill={presetStyle.gridColor} />
              </pattern>

              {/* Architectural Dimension Arrowheads / Tick marks */}
              <marker
                id="archTick"
                markerWidth="8"
                markerHeight="8"
                refX="4"
                refY="4"
                orient="auto"
              >
                <path d="M 1 7 L 7 1" stroke={presetStyle.dimColor} strokeWidth="1.5" strokeLinecap="round" />
              </marker>

              {/* North Arrow Symbol */}
              <g id="northArrowSymbol">
                <circle cx="0" cy="0" r="16" fill="white" stroke="#0F172A" strokeWidth="1.5" />
                <polygon points="0,-13 4,4 0,0 -4,4" fill="#0F172A" />
                <text x="0" y="-18" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">
                  N
                </text>
              </g>
            </defs>

            {/* Background Grid */}
            <rect width="100%" height="100%" fill="url(#archGrid)" />

            {/* Transformed Drawing Content Group */}
            <g transform={`translate(${panX}, ${panY}) scale(${scale})`}>
              {/* 1. Property Boundary & Setbacks */}
              <g id="site-boundary">
                {/* Lot Boundary (Dashed Slate) */}
                <rect
                  x="0"
                  y="0"
                  width={project.plot.width || 60}
                  height={project.plot.depth || 120}
                  fill="none"
                  stroke="#94A3B8"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />

                {/* Setback Envelope (Dashed Blue-Grey) */}
                <rect
                  x={project.plot.setbacks.left || 5}
                  y={project.plot.setbacks.front || 25}
                  width={(project.plot.width || 60) - (project.plot.setbacks.left || 5) - (project.plot.setbacks.right || 5)}
                  height={(project.plot.depth || 120) - (project.plot.setbacks.front || 25) - (project.plot.setbacks.rear || 10)}
                  fill="none"
                  stroke="#64748B"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />

                {/* Road Frontage Indicator (South) */}
                <rect
                  x="-2"
                  y={(project.plot.depth || 120) + 2}
                  width={(project.plot.width || 60) + 4}
                  height="6"
                  fill="#334155"
                  rx="1"
                />
                <text
                  x={(project.plot.width || 60) / 2}
                  y={(project.plot.depth || 120) + 6}
                  fill="#FFFFFF"
                  fontSize="2.4"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  PRIMARY RESIDENTIAL STREET FRONTAGE (SOUTH)
                </text>
              </g>

              {/* 2. Underlying Floor in Overlay Mode (0.35 Opacity) */}
              {allFloorsOverlay && overlayRooms.length > 0 && (
                <g id="overlay-rooms-group" opacity="0.35">
                  {overlayRooms.map((room) => (
                    <rect
                      key={`overlay-${room.id}`}
                      x={room.x}
                      y={room.y}
                      width={room.width}
                      height={room.height}
                      fill="#E2E8F0"
                      stroke="#64748B"
                      strokeWidth="1.2"
                      strokeDasharray="2 2"
                    />
                  ))}
                </g>
              )}

              {/* 3. Active Floor Room Geometry */}
              <g id="active-rooms-group">
                {activeRooms.map((room, idx) => {
                  const isSelected = room.id === selectedRoomId;
                  const isHovered = room.id === hoveredRoomId;
                  const placement = activeLabelPlacements.get(room.id);
                  const fill = getZoneFill(room.zone, isSelected, isHovered);

                  return (
                    <g
                      key={room.id}
                      id={`room-${room.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeTool === 'select') {
                          setSelectedRoomId(room.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredRoomId(room.id)}
                      onMouseLeave={() => setHoveredRoomId(null)}
                      className="cursor-pointer transition-all duration-150"
                    >
                      {/* Room Interior Polygon */}
                      <rect
                        x={room.x}
                        y={room.y}
                        width={room.width}
                        height={room.height}
                        fill={fill}
                        stroke={isSelected ? presetStyle.selectedStroke : presetStyle.wallIntStroke}
                        strokeWidth={isSelected ? 3.0 / scale : presetStyle.wallIntWidth / scale}
                        rx={1.5 / scale}
                      />

                      {/* Exterior Wall Highlight if along boundary */}
                      <rect
                        x={room.x}
                        y={room.y}
                        width={room.width}
                        height={room.height}
                        fill="none"
                        stroke={presetStyle.wallExtStroke}
                        strokeWidth={presetStyle.wallExtWidth / scale}
                        pointerEvents="none"
                        rx={1.5 / scale}
                      />

                      {/* Door Swings */}
                      {room.openings?.doors?.map((door, dIdx) => {
                        const dWidth = door.width || 3.0;
                        const dPos = door.pos || 2.0;
                        let dx = room.x;
                        let dy = room.y;
                        let arcPath = '';

                        if (door.wall === 'south') {
                          dx = room.x + dPos;
                          dy = room.y + room.height;
                          arcPath = `M ${dx} ${dy} A ${dWidth} ${dWidth} 0 0 0 ${dx + dWidth} ${dy - dWidth} L ${dx} ${dy}`;
                        } else if (door.wall === 'north') {
                          dx = room.x + dPos;
                          dy = room.y;
                          arcPath = `M ${dx} ${dy} A ${dWidth} ${dWidth} 0 0 1 ${dx + dWidth} ${dy + dWidth} L ${dx} ${dy}`;
                        } else if (door.wall === 'west') {
                          dx = room.x;
                          dy = room.y + dPos;
                          arcPath = `M ${dx} ${dy} A ${dWidth} ${dWidth} 0 0 0 ${dx + dWidth} ${dy + dWidth} L ${dx} ${dy}`;
                        } else {
                          dx = room.x + room.width;
                          dy = room.y + dPos;
                          arcPath = `M ${dx} ${dy} A ${dWidth} ${dWidth} 0 0 1 ${dx - dWidth} ${dy + dWidth} L ${dx} ${dy}`;
                        }

                        return (
                          <g key={`door-${room.id}-${dIdx}`} pointerEvents="none">
                            {/* Swing Arc */}
                            <path
                              d={arcPath}
                              fill="none"
                              stroke={presetStyle.doorStroke}
                              strokeWidth={1.2 / scale}
                              strokeDasharray={`${2 / scale} ${2 / scale}`}
                            />
                            {/* Door Leaf Line */}
                            <line
                              x1={dx}
                              y1={dy}
                              x2={door.wall === 'south' ? dx + dWidth : dx + dWidth * 0.7}
                              y2={door.wall === 'south' ? dy - dWidth : dy + dWidth * 0.7}
                              stroke={presetStyle.doorStroke}
                              strokeWidth={2.0 / scale}
                            />
                          </g>
                        );
                      })}

                      {/* Window Glazing Openings */}
                      {room.openings?.windows?.map((win, wIdx) => {
                        const wWidth = win.width || 4.0;
                        const wPos = win.pos || 2.0;
                        let wx = room.x;
                        let wy = room.y;
                        let wx2 = room.x;
                        let wy2 = room.y;

                        if (win.wall === 'north') {
                          wx = room.x + wPos;
                          wy = room.y;
                          wx2 = wx + wWidth;
                          wy2 = wy;
                        } else if (win.wall === 'south') {
                          wx = room.x + wPos;
                          wy = room.y + room.height;
                          wx2 = wx + wWidth;
                          wy2 = wy;
                        } else if (win.wall === 'west') {
                          wx = room.x;
                          wy = room.y + wPos;
                          wx2 = wx;
                          wy2 = wy + wWidth;
                        } else {
                          wx = room.x + room.width;
                          wy = room.y + wPos;
                          wx2 = wx;
                          wy2 = wy + wWidth;
                        }

                        return (
                          <g key={`win-${room.id}-${wIdx}`} pointerEvents="none">
                            {/* Double line for architectural glazing */}
                            <line
                              x1={wx}
                              y1={wy}
                              x2={wx2}
                              y2={wy2}
                              stroke={presetStyle.windowStroke}
                              strokeWidth={3.0 / scale}
                            />
                          </g>
                        );
                      })}

                      {/* Stair Direction if Room is Circulation / Foyer */}
                      {room.name.toLowerCase().includes('foyer') && (
                        <g pointerEvents="none" opacity="0.6">
                          {/* Stair treads */}
                          {[0, 1, 2, 3, 4].map((step) => (
                            <line
                              key={`stair-${step}`}
                              x1={room.x + 1}
                              y1={room.y + 4 + step * 1.2}
                              x2={room.x + 4.5}
                              y2={room.y + 4 + step * 1.2}
                              stroke="#64748B"
                              strokeWidth={1.2 / scale}
                            />
                          ))}
                          <line
                            x1={room.x + 2.75}
                            y1={room.y + 9}
                            x2={room.x + 2.75}
                            y2={room.y + 4.5}
                            stroke="#0F172A"
                            strokeWidth={1.4 / scale}
                          />
                          <polygon
                            points={`${room.x + 2.75},${room.y + 4} ${room.x + 2.35},${room.y + 4.8} ${room.x + 3.15},${room.y + 4.8}`}
                            fill="#0F172A"
                          />
                          <text
                            x={room.x + 2.75}
                            y={room.y + 10.2}
                            fontSize={1.6}
                            fontWeight="bold"
                            textAnchor="middle"
                            fill="#475569"
                            fontFamily="sans-serif"
                          >
                            UP
                          </text>
                        </g>
                      )}

                      {/* Room Label: Name + Area OR Numbered Marker */}
                      {placement && (
                        <g pointerEvents="none">
                          {placement.mode === 'marker' ? (
                            /* Numbered Circular Marker */
                            <g transform={`translate(${room.x + room.width / 2}, ${room.y + room.height / 2})`}>
                              <circle
                                r={12 / scale}
                                fill={isSelected ? '#2563EB' : '#FFFFFF'}
                                stroke={isSelected ? '#1D4ED8' : '#334155'}
                                strokeWidth={1.5 / scale}
                              />
                              <text
                                y={4 / scale}
                                textAnchor="middle"
                                fontSize={11 / scale}
                                fontWeight="bold"
                                fill={isSelected ? '#FFFFFF' : '#0F172A'}
                                fontFamily="sans-serif"
                              >
                                {placement.markerNumber}
                              </text>
                            </g>
                          ) : (
                            /* Full or Wrapped Room Label with Area */
                            <g transform={`translate(${room.x + room.width / 2}, ${room.y + room.height / 2})`}>
                              {/* Label Backdrop Pill in presentation mode */}
                              {displayPreset === 'presentation' && (
                                <rect
                                  x={(-room.width * scale * 0.4) / scale}
                                  y={(-placement.lines.length * 10) / scale}
                                  width={(room.width * scale * 0.8) / scale}
                                  height={((placement.lines.length + 1) * 16) / scale}
                                  fill="#FFFFFF"
                                  opacity="0.8"
                                  rx={4 / scale}
                                />
                              )}

                              {/* Room Name Lines */}
                              {placement.lines.map((line, lIdx) => (
                                <text
                                  key={`line-${lIdx}`}
                                  y={
                                    placement.canFitArea
                                      ? ((-placement.lines.length / 2 + lIdx) * 13) / scale
                                      : ((-placement.lines.length / 2 + lIdx + 0.5) * 13) / scale
                                  }
                                  textAnchor="middle"
                                  fontSize={placement.fontSizeName / scale}
                                  fontWeight="bold"
                                  fill={isSelected ? '#1D4ED8' : presetStyle.textColor}
                                  fontFamily="sans-serif"
                                >
                                  {line}
                                </text>
                              ))}

                              {/* Area below Room Name in sq ft */}
                              {placement.canFitArea && (
                                <text
                                  y={((placement.lines.length / 2 + 0.3) * 13 + 8) / scale}
                                  textAnchor="middle"
                                  fontSize={placement.fontSizeArea / scale}
                                  fontWeight="medium"
                                  fill={isSelected ? '#2563EB' : '#64748B'}
                                  fontFamily="monospace"
                                >
                                  {placement.displayArea}
                                </text>
                              )}
                            </g>
                          )}
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>

              {/* 4. Overall Building Dimensions String */}
              <g id="dimension-strings" pointerEvents="none">
                {/* Horizontal overall dimension (e.g. 44'-0") */}
                <line
                  x1={planBounds.minX}
                  y1={planBounds.minY - 5}
                  x2={planBounds.maxX}
                  y2={planBounds.minY - 5}
                  stroke={presetStyle.dimColor}
                  strokeWidth={1.2 / scale}
                  markerStart="url(#archTick)"
                  markerEnd="url(#archTick)"
                />
                <line
                  x1={planBounds.minX}
                  y1={planBounds.minY - 7}
                  x2={planBounds.minX}
                  y2={planBounds.minY - 1}
                  stroke={presetStyle.dimColor}
                  strokeWidth={0.8 / scale}
                />
                <line
                  x1={planBounds.maxX}
                  y1={planBounds.minY - 7}
                  x2={planBounds.maxX}
                  y2={planBounds.minY - 1}
                  stroke={presetStyle.dimColor}
                  strokeWidth={0.8 / scale}
                />
                <text
                  x={(planBounds.minX + planBounds.maxX) / 2}
                  y={planBounds.minY - 6}
                  textAnchor="middle"
                  fontSize={11 / scale}
                  fontWeight="bold"
                  fill={presetStyle.dimColor}
                  fontFamily="monospace"
                >
                  {formatFeetInches(planBounds.width)} OVERALL WIDTH
                </text>

                {/* Vertical overall dimension (e.g. 52'-0") */}
                <line
                  x1={planBounds.minX - 5}
                  y1={planBounds.minY}
                  x2={planBounds.minX - 5}
                  y2={planBounds.maxY}
                  stroke={presetStyle.dimColor}
                  strokeWidth={1.2 / scale}
                  markerStart="url(#archTick)"
                  markerEnd="url(#archTick)"
                />
                <line
                  x1={planBounds.minX - 7}
                  y1={planBounds.minY}
                  x2={planBounds.minX - 1}
                  y2={planBounds.minY}
                  stroke={presetStyle.dimColor}
                  strokeWidth={0.8 / scale}
                />
                <line
                  x1={planBounds.minX - 7}
                  y1={planBounds.maxY}
                  x2={planBounds.minX - 1}
                  y2={planBounds.maxY}
                  stroke={presetStyle.dimColor}
                  strokeWidth={0.8 / scale}
                />
                <text
                  x={planBounds.minX - 6.5}
                  y={(planBounds.minY + planBounds.maxY) / 2}
                  textAnchor="middle"
                  fontSize={11 / scale}
                  fontWeight="bold"
                  fill={presetStyle.dimColor}
                  fontFamily="monospace"
                  transform={`rotate(-90 ${planBounds.minX - 6.5} ${(planBounds.minY + planBounds.maxY) / 2})`}
                >
                  {formatFeetInches(planBounds.depth)} OVERALL DEPTH
                </text>
              </g>

              {/* 5. Main Entrance Marker */}
              <g id="main-entry-marker" transform="translate(29, 0)">
                <polygon points="0,-4 3,0 -3,0" fill="#2563EB" />
                <text
                  x="0"
                  y="-5.5"
                  fontSize={2.2}
                  fontWeight="bold"
                  fill="#2563EB"
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  MAIN ENTRANCE
                </text>
              </g>

              {/* 6. Active Two-Point Measurement Line */}
              {activeTool === 'measure' && measureStart && measureCurrent && (
                <g id="active-measure-line" pointerEvents="none">
                  <line
                    x1={measureStart.x}
                    y1={measureStart.y}
                    x2={measureCurrent.x}
                    y2={measureCurrent.y}
                    stroke="#EF4444"
                    strokeWidth={2.0 / scale}
                    strokeDasharray={`${3 / scale} ${3 / scale}`}
                  />
                  <circle cx={measureStart.x} cy={measureStart.y} r={4 / scale} fill="#EF4444" />
                  <circle cx={measureCurrent.x} cy={measureCurrent.y} r={4 / scale} fill="#EF4444" />
                  {(() => {
                    const distFeet = Math.sqrt(
                      Math.pow(measureCurrent.x - measureStart.x, 2) +
                      Math.pow(measureCurrent.y - measureStart.y, 2)
                    );
                    const midX = (measureStart.x + measureCurrent.x) / 2;
                    const midY = (measureStart.y + measureCurrent.y) / 2;
                    return (
                      <g transform={`translate(${midX}, ${midY})`}>
                        <rect
                          x={-35 / scale}
                          y={-12 / scale}
                          width={70 / scale}
                          height={20 / scale}
                          fill="#1E293B"
                          rx={3 / scale}
                        />
                        <text
                          y={3 / scale}
                          textAnchor="middle"
                          fontSize={11 / scale}
                          fontWeight="bold"
                          fill="#FFFFFF"
                          fontFamily="monospace"
                        >
                          {formatFeetInches(distFeet)}
                        </text>
                      </g>
                    );
                  })()}
                </g>
              )}
            </g>

            {/* 7. Architectural Title Block Stamp (Fixed in Bottom-Right) */}
            <g
              transform={`translate(${viewportSize.width - 240}, ${viewportSize.height - 85})`}
              className="pointer-events-none"
            >
              <rect
                width="225"
                height="70"
                fill="#FFFFFF"
                stroke="#CBD5E1"
                strokeWidth="1"
                rx="4"
                opacity="0.95"
              />
              <text x="12" y="18" fontSize="11" fontWeight="bold" fill="#0F172A" fontFamily="sans-serif">
                {project.identity.name}
              </text>
              <text x="12" y="32" fontSize="9" fill="#64748B" fontFamily="monospace">
                SHEET A-10{activeFloor} • {activeFloor === 1 ? 'GROUND FLOOR' : 'SECOND FLOOR'} PLAN
              </text>
              <text x="12" y="46" fontSize="9" fill="#64748B" fontFamily="monospace">
                SCALE: 1/4" = 1'-0" • REV: {project.activeRevision}
              </text>
              <text x="12" y="60" fontSize="8" fill="#94A3B8" fontFamily="sans-serif">
                COMPOSE AI CONCEPTUAL INTELLIGENCE
              </text>
            </g>

            {/* 8. Graphical Scale Bar (Fixed in Bottom-Left) */}
            <g
              transform={`translate(24, ${viewportSize.height - 45})`}
              className="pointer-events-none"
            >
              <rect width="180" height="28" fill="#FFFFFF" opacity="0.9" rx="3" stroke="#E2E8F0" />
              <line x1="15" y1="18" x2="165" y2="18" stroke="#0F172A" strokeWidth="1.5" />
              {/* Ticks at 0, 5, 10, 20 FT */}
              {[
                { ft: 0, x: 15 },
                { ft: 5, x: 52 },
                { ft: 10, x: 90 },
                { ft: 20, x: 165 },
              ].map((tick) => (
                <g key={`tick-${tick.ft}`}>
                  <line x1={tick.x} y1="13" x2={tick.x} y2="18" stroke="#0F172A" strokeWidth="1.5" />
                  <text x={tick.x} y="10" fontSize="8" fontFamily="monospace" textAnchor="middle" fill="#0F172A">
                    {tick.ft}'
                  </text>
                </g>
              ))}
            </g>
          </svg>

          {/* Floating Compact Room Legend (Bottom-Left) for Numbered Rooms */}
          {showLegend && compactLegendRooms.length > 0 && (
            <div className="absolute bottom-16 left-4 bg-white/95 backdrop-blur-md border border-[#E4E7EC] rounded-xl p-3 shadow-lg max-w-xs z-10 animate-in fade-in">
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E4E7EC] text-xs font-bold text-[#172033]">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Room Schedule Legend</span>
                </div>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-[#98A2B3] hover:text-[#172033] text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 pt-2 max-h-48 overflow-y-auto text-xs">
                {compactLegendRooms.map(({ room, index }) => (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    onMouseEnter={() => setHoveredRoomId(room.id)}
                    onMouseLeave={() => setHoveredRoomId(null)}
                    className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                      room.id === selectedRoomId
                        ? 'bg-[#EEF4FF] text-[#2563EB] font-bold'
                        : hoveredRoomId === room.id
                        ? 'bg-[#F9FAFB]'
                        : 'text-[#344054]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#1E293B] text-white flex items-center justify-center text-[10px] font-bold font-mono">
                        {index}
                      </span>
                      <span>{room.name}</span>
                    </div>
                    <span className="font-mono text-[#667085] text-[11px]">
                      {formatSqFt(room.area || room.width * room.height)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Collapsible & Resizable Right Inspector Panel (300–340px) */}
        {inspectorOpen && (
          <div
            style={{ width: `${inspectorWidth}px` }}
            className="bg-white border-l border-[#E4E7EC] flex flex-col shrink-0 z-20 relative shadow-xs"
          >
            {/* Drag Handle for Resizing Inspector */}
            <div
              onMouseDown={handleResizeStart}
              className={`absolute top-0 bottom-0 -left-1.5 w-3 cursor-col-resize hover:bg-[#2563EB]/20 transition-colors z-30 ${
                isResizingInspector ? 'bg-[#2563EB]/40' : ''
              }`}
              title="Drag to resize inspector width (300-340px)"
            />

            {/* Inspector Header */}
            <div className="p-3.5 border-b border-[#E4E7EC] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                  Room Inspector
                </span>
              </div>

              <div className="flex items-center gap-1">
                {selectedRoom && (
                  <button
                    onClick={() => {
                      setLockedRooms((prev) => ({
                        ...prev,
                        [selectedRoom.id]: !prev[selectedRoom.id],
                      }));
                    }}
                    className={`p-1.5 rounded-md border text-xs transition-colors ${
                      lockedRooms[selectedRoom.id]
                        ? 'bg-[#FEF3F2] text-[#D92D20] border-[#FECDCA]'
                        : 'text-[#667085] hover:text-[#172033] border-[#E4E7EC]'
                    }`}
                    title={lockedRooms[selectedRoom.id] ? 'Unlock room dimensions' : 'Lock dimensions to prevent edits'}
                  >
                    {lockedRooms[selectedRoom.id] ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button
                  onClick={() => setInspectorOpen(false)}
                  className="p-1 rounded text-[#667085] hover:text-[#172033]"
                  title="Close Inspector"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inspector Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {selectedRoom ? (
                <>
                  {/* Room Name & Zone */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-[#667085] uppercase">
                      Space Designation
                    </label>
                    <input
                      type="text"
                      value={selectedRoom.name}
                      onChange={(e) => updateRoom(selectedRoom.id, { name: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-[#E4E7EC] text-xs font-bold text-[#172033] focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                    />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <span className="text-[10px] text-[#667085]">Level</span>
                        <div className="font-semibold text-[#172033]">Level 0{selectedRoom.floor}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#667085]">Zone</span>
                        <select
                          value={selectedRoom.zone}
                          onChange={(e) => updateRoom(selectedRoom.id, { zone: e.target.value as any })}
                          className="w-full px-2 py-1 rounded border border-[#E4E7EC] text-xs font-medium"
                        >
                          <option value="Public">Public</option>
                          <option value="Private">Private</option>
                          <option value="Service">Service</option>
                          <option value="Circulation">Circulation</option>
                          <option value="Outdoor">Outdoor</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Physical Dimensions (Feet & Inches Direct Entry) */}
                  <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#344054] uppercase tracking-wider">
                        Physical Dimensions
                      </span>
                      {lockedRooms[selectedRoom.id] && (
                        <span className="text-[10px] text-[#D92D20] font-semibold">LOCKED</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Width in Feet & Inches */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#667085]">Width (X)</label>
                        <input
                          type="text"
                          defaultValue={formatFeetInches(selectedRoom.width)}
                          key={`w-${selectedRoom.id}-${selectedRoom.width}`}
                          disabled={lockedRooms[selectedRoom.id]}
                          onBlur={(e) => {
                            const parsed = parseFeetInches(e.target.value);
                            if (parsed !== null) handleDimensionChange('width', parsed);
                          }}
                          className="w-full px-2.5 py-1 rounded border border-[#D0D5DD] font-mono text-xs font-semibold text-[#172033] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                        />
                        <span className="text-[10px] text-[#98A2B3] font-mono">{selectedRoom.width} ft decimal</span>
                      </div>

                      {/* Depth in Feet & Inches */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#667085]">Depth (Y)</label>
                        <input
                          type="text"
                          defaultValue={formatFeetInches(selectedRoom.height)}
                          key={`h-${selectedRoom.id}-${selectedRoom.height}`}
                          disabled={lockedRooms[selectedRoom.id]}
                          onBlur={(e) => {
                            const parsed = parseFeetInches(e.target.value);
                            if (parsed !== null) handleDimensionChange('height', parsed);
                          }}
                          className="w-full px-2.5 py-1 rounded border border-[#D0D5DD] font-mono text-xs font-semibold text-[#172033] bg-white focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                        />
                        <span className="text-[10px] text-[#98A2B3] font-mono">{selectedRoom.height} ft decimal</span>
                      </div>
                    </div>

                    {/* Calculated Floor Area */}
                    <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between">
                      <span className="text-[#667085]">Conditioned Area:</span>
                      <span className="font-mono text-sm font-bold text-[#2563EB]">
                        {formatSqFt(selectedRoom.area || selectedRoom.width * selectedRoom.height)}
                      </span>
                    </div>
                  </div>

                  {/* Architectural Parameters: Ceiling Height & Performance */}
                  <div className="p-3.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2.5">
                    <span className="text-[11px] font-bold text-[#344054] uppercase tracking-wider">
                      Architectural Parameters
                    </span>

                    <div className="flex items-center justify-between">
                      <span className="text-[#667085]">Ceiling Height:</span>
                      <select className="px-2 py-1 rounded border border-[#E4E7EC] text-xs font-medium bg-white">
                        <option value="9">9'-0" Standard</option>
                        <option value="10">10'-0" High Volume</option>
                        <option value="12">12'-0" Great Room Double</option>
                        <option value="8">8'-0" Minimum Code</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#667085]">Daylight Exposure:</span>
                      <span className="font-mono font-semibold text-[#12B76A]">
                        {selectedRoom.daylightScore}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#667085]">Cross Ventilation:</span>
                      <span className="font-mono font-semibold text-[#0284C7]">
                        {selectedRoom.ventilationScore}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#667085]">Openings:</span>
                      <span className="font-mono text-[#344054]">
                        {selectedRoom.openings?.doors?.length || 0} Doors • {selectedRoom.openings?.windows?.length || 0} Windows
                      </span>
                    </div>
                  </div>

                  {/* Validation Alerts if any */}
                  {selectedRoomValidation && selectedRoomValidation.warnings.length > 0 && (
                    <div className="p-3 rounded-lg bg-[#FFFAEB] border border-[#FEDF89] space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-[#B54708] font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Architectural Advisory</span>
                      </div>
                      {selectedRoomValidation.warnings.map((warn, wIdx) => (
                        <p key={`warn-${wIdx}`} className="text-[#B54708] text-[11px] leading-relaxed">
                          • {warn}
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Quick Action: Fit this room in viewport */}
                  <button
                    onClick={fitSelectedRoom}
                    className="w-full py-2 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-semibold text-[#344054] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Maximize2 className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Focus View on this Space</span>
                  </button>
                </>
              ) : (
                /* No Room Selected State */
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-[#F2F4F7] flex items-center justify-center mx-auto text-[#667085]">
                    <MousePointer className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-[#172033]">No Space Selected</div>
                    <p className="text-[#667085] text-[11px] leading-relaxed">
                      Click any room on the floor plan canvas to inspect properties, adjust physical dimensions, and check spatial parameters.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Compact Bottom Status Bar (28–32px) */}
      <footer className="h-7 bg-white border-t border-[#E4E7EC] px-3 sm:px-4 flex items-center justify-between text-[11px] text-[#667085] font-mono shrink-0 z-20">
        {/* Left: Active Tool and Mouse World Coordinates */}
        <div className="flex items-center gap-3">
          <span className="text-[#344054] font-semibold uppercase">Tool: {activeTool}</span>
          <span>|</span>
          <span>
            Cursor:{' '}
            {mouseCoord
              ? `X: ${formatFeetInches(mouseCoord.xFt)}  Y: ${formatFeetInches(mouseCoord.yFt)}`
              : '--'}
          </span>
        </div>

        {/* Center: Floor stats */}
        <div className="hidden sm:flex items-center gap-3">
          <span>
            {activeFloor === 1 ? 'Level 01 (Ground)' : 'Level 02 (Second)'} • {activeRooms.length} Spaces •{' '}
            {Math.round(floorGfa)} SF Measured
          </span>
          <span>|</span>
          <span className="text-[#2563EB] font-semibold">{currentAlternative.name}</span>
        </div>

        {/* Right: Scale & Keyboard shortcuts reminder */}
        <div className="flex items-center gap-3">
          <span>Scale: {Math.round(scale)} px/ft</span>
          <span className="hidden md:inline text-[#98A2B3]">
            [1: Ground | 2: Upper | 0: Overlay | F: Fit | Esc: Clear]
          </span>
        </div>
      </footer>
    </div>
  );
};
