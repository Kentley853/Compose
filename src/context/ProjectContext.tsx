import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  ScreenId,
  ProjectData,
  PlotData,
  ArchitecturalBrief,
  RoomData,
  ComplianceCheck,
  BOQItem,
  WorkflowStage,
  UploadedFile,
  FileCategory,
} from '../types/architecture';
import { INITIAL_JAKARTA_PROJECT, SAMPLE_PROJECTS_LIST } from '../data/sampleProjects';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface PresentationStepInfo {
  step: number;
  screenId: ScreenId;
  title: string;
  investorObjective: string;
  speakerCue: string;
}

export const PRESENTATION_STEPS: PresentationStepInfo[] = [
  {
    step: 1,
    screenId: 'dashboard',
    title: 'Project Overview & Pipeline',
    investorObjective: 'Unified architectural workflow replacing fragmented CAD, BIM, spreadsheet, and manual briefing tools.',
    speakerCue: 'Introduce the Austin Contemporary Residence: a 60 ft x 120 ft parcel in Austin, Texas with connected workflow stages.',
  },
  {
    step: 2,
    screenId: 'setup',
    title: 'Project Setup & Ingestion',
    investorObjective: 'Frictionless site data ingestion including DWG, PDF surveys, site constraints, and design priorities.',
    speakerCue: 'Highlight how client requirements and site boundaries are structured instantly into machine-readable parameters.',
  },
  {
    step: 3,
    screenId: 'plot',
    title: 'Deterministic Plot Intelligence',
    investorObjective: 'Instant geometric & solar site analysis with clear data attribution (user vs. code vs. AI).',
    speakerCue: 'Point to the interactive 60 ft x 120 ft canvas showing setbacks, solar pathing, and cross-ventilation analysis.',
  },
  {
    step: 4,
    screenId: 'architect',
    title: 'AI Architect Dialogue',
    investorObjective: 'Strategic design dialogue uncovering programmatic requirements and generating a structured brief.',
    speakerCue: 'Demonstrate interactive clarification questions regarding ground floor guest suite and service circulation.',
  },
  {
    step: 5,
    screenId: 'floorplan',
    title: 'Conceptual Floor Plan & Room Schedule',
    investorObjective: 'Rapid generation of 3 distinct architectural alternatives with real-time room inspection and edits.',
    speakerCue: 'Show Option 1 "Great Room & Lanai Flow", click any room to inspect dimensions and daylight metrics.',
  },
  {
    step: 6,
    screenId: 'coordinated2d',
    title: 'Coordinated 2D Architectural Plan',
    investorObjective: 'Professional CAD-like presentation with toggleable layers (walls, dimensions, openings, circulation).',
    speakerCue: 'Switch between Ground and First Floor; highlight version synchronization with REV-03.',
  },
  {
    step: 7,
    screenId: 'coordinated3d',
    title: 'Interactive 3D WebGL Model',
    investorObjective: 'Zero-latency browser 3D massing directly extruded from the 2D layout geometry.',
    speakerCue: 'Orbit around the 3D model, isolate floors, toggle roof, and switch to White Architectural Clay mode.',
  },
  {
    step: 8,
    screenId: 'exterior',
    title: 'Façade Materiality & Climate Adaptation',
    investorObjective: 'Real-time architectural materiality (Limestone & Cedar vs. Desert Modern) without cloud rendering lag.',
    speakerCue: 'Select exterior material palette to see synchronized facade section, render textures, and roof finishes update.',
  },
  {
    step: 9,
    screenId: 'compliance',
    title: 'Preliminary Compliance Intelligence',
    investorObjective: 'Early-stage risk detection flagging boundary setbacks, IRC requirements, and required engineer reviews.',
    speakerCue: 'Emphasize the responsible disclaimer: conceptual verification preventing expensive late-stage redesigns.',
  },
  {
    step: 10,
    screenId: 'deliverables',
    title: 'BOQ, Cost Estimation & Deliverables',
    investorObjective: 'Deterministic bill of quantities with regional US cost indices and one-click executive report export.',
    speakerCue: 'Review USD square-foot rates ($275/sq ft) and generate the investor deliverables package.',
  },
];

interface ProjectContextType {
  currentScreen: ScreenId;
  setScreen: (screen: ScreenId) => void;
  project: ProjectData;
  availableProjects: ProjectData[];
  selectProject: (projectId: string) => void;
  createNewProject: (name?: string, location?: string) => void;
  updatePlot: (plotUpdates: Partial<PlotData>) => void;
  updateRequirements: (reqUpdates: any) => void;
  updateBrief: (briefUpdates: Partial<ArchitecturalBrief>) => void;
  updateRoom: (roomId: string, updates: Partial<RoomData>) => void;
  selectAlternative: (altId: string) => void;
  approveRevision: (type: 'plot' | 'brief' | 'plan' | 'compliance', summary: string) => void;
  restoreRevision: (revCode: string) => void;
  regenerateDependentViews: () => void;
  activeFloor: 1 | 2;
  setActiveFloor: (floor: 1 | 2) => void;
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;
  selected3DStyle: string;
  setSelected3DStyle: (style: string) => void;
  selected3DMaterial: string;
  setSelected3DMaterial: (mat: string) => void;
  selectedLocation: string;
  setSelectedLocation: (loc: string) => void;
  wasteFactor: number;
  setWasteFactor: (factor: number) => void;
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  presentationMode: boolean;
  setPresentationMode: (active: boolean) => void;
  togglePresentationMode: () => void;
  presentationStep: number;
  currentStepInfo: PresentationStepInfo;
  nextPresentationStep: () => void;
  prevPresentationStep: () => void;
  goToPresentationStep: (step: number) => void;
  demoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  switchToDemoMode: () => void;
  switchToLiveMode: () => void;
  resetDemo: () => void;
  isAutosaving: boolean;
  autosaveTime: string;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  // File management
  deletedUploads: UploadedFile[];
  addUploads: (files: UploadedFile[]) => void;
  removeUpload: (fileId: string) => void;
  restoreUpload: (fileId: string) => void;
  renameUpload: (fileId: string, newName: string) => void;
  tagUpload: (fileId: string, category: FileCategory) => void;
  replaceUpload: (fileId: string, newFile: UploadedFile) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY_LIVE = 'compose_ai_live_project_state_v2';
const LOCAL_STORAGE_KEY_DEMO = 'compose_ai_demo_project_state_v2';

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [availableProjects] = useState<ProjectData[]>(SAMPLE_PROJECTS_LIST);
  const [demoMode, setDemoMode] = useState<boolean>(false); // Default to Live MVP mode

  // Load project state based on mode
  const [project, setProject] = useState<ProjectData>(() => {
    try {
      const liveSaved = localStorage.getItem(LOCAL_STORAGE_KEY_LIVE);
      if (liveSaved) {
        return JSON.parse(liveSaved);
      }
    } catch (e) {
      console.warn('Failed to parse localStorage project:', e);
    }
    // Default initial project for Live MVP
    return {
      ...INITIAL_JAKARTA_PROJECT,
      id: 'proj-live-01',
      identity: {
        ...INITIAL_JAKARTA_PROJECT.identity,
        name: 'Austin Modern Residence',
        clientName: 'Client Project Alpha',
        location: 'Austin, Texas',
        currentRevision: 'REV-01',
      },
      activeRevision: 'REV-01',
    };
  });

  const [deletedUploads, setDeletedUploads] = useState<UploadedFile[]>([]);
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>('g-great-room');
  const [selected3DStyle, setSelected3DStyle] = useState<string>('Contemporary warm modern');
  const [selected3DMaterial, setSelected3DMaterial] = useState<string>('Limestone & cedar');
  const [selectedLocation, setSelectedLocation] = useState<string>('Austin');
  const [wasteFactor, setWasteFactor] = useState<number>(8);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [presentationStep, setPresentationStep] = useState<number>(1);
  const [isAutosaving, setIsAutosaving] = useState<boolean>(false);
  const [autosaveTime, setAutosaveTime] = useState<string>('Just now');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);

  // Autosave to appropriate key
  useEffect(() => {
    setIsAutosaving(true);
    const timer = setTimeout(() => {
      try {
        const key = demoMode ? LOCAL_STORAGE_KEY_DEMO : LOCAL_STORAGE_KEY_LIVE;
        localStorage.setItem(key, JSON.stringify(project));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      setIsAutosaving(false);
      setAutosaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 500);
    return () => clearTimeout(timer);
  }, [project, demoMode]);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = {
      id,
      title,
      message,
      type,
      timestamp: 'Just now',
    };
    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const switchToDemoMode = () => {
    setDemoMode(true);
    try {
      const demoSaved = localStorage.getItem(LOCAL_STORAGE_KEY_DEMO);
      if (demoSaved) {
        setProject(JSON.parse(demoSaved));
      } else {
        setProject(JSON.parse(JSON.stringify(INITIAL_JAKARTA_PROJECT)));
      }
    } catch {
      setProject(JSON.parse(JSON.stringify(INITIAL_JAKARTA_PROJECT)));
    }
    addToast('Demo Mode Activated', 'Viewing sample project: Austin Contemporary Residence.', 'info');
  };

  const switchToLiveMode = () => {
    setDemoMode(false);
    try {
      const liveSaved = localStorage.getItem(LOCAL_STORAGE_KEY_LIVE);
      if (liveSaved) {
        setProject(JSON.parse(liveSaved));
      }
    } catch (e) {
      console.warn('Failed to load live project:', e);
    }
    addToast('Live MVP Mode', 'Switched to your active workspace.', 'success');
  };

  const selectProject = (projectId: string) => {
    const found = availableProjects.find((p) => p.id === projectId);
    if (found) {
      setProject(JSON.parse(JSON.stringify(found)));
      addToast('Project Switched', `Active workspace: ${found.identity.name}`, 'info');
    }
  };

  const createNewProject = (name: string = 'Untitled Concept Residence', location: string = 'Austin, Texas') => {
    const newId = `proj-${Date.now()}`;
    const newProj: ProjectData = {
      ...INITIAL_JAKARTA_PROJECT,
      id: newId,
      identity: {
        id: newId,
        name,
        clientName: 'Private Client',
        location,
        buildingType: 'Contemporary Single-Family Residence',
        description: 'Conceptual architectural design',
        leadArchitect: 'Atelier Studio Lead',
        projectType: 'Contemporary Residence',
        createdDate: new Date().toLocaleDateString(),
        lastModified: 'Just now',
        currentRevision: 'REV-01',
      },
      activeRevision: 'REV-01',
      uploads: [],
      revisions: [
        {
          id: `rev-${Date.now()}`,
          code: 'REV-01',
          timestamp: 'Just now',
          author: 'Studio Architect',
          summary: 'Initial project setup & plot definition',
          type: 'plot',
        },
      ],
      dependentOutputsOutdated: false,
    };
    setProject(newProj);
    setDemoMode(false);
    setCurrentScreen('setup');
    addToast('New Project Created', `Initialized "${name}" in Live MVP Mode.`, 'success');
  };

  const updatePlot = (plotUpdates: Partial<PlotData>) => {
    setProject((prev) => {
      const newPlot = { ...prev.plot, ...plotUpdates };
      newPlot.area = Number((newPlot.width * newPlot.depth).toFixed(1));
      newPlot.perimeter = 2 * (newPlot.width + newPlot.depth);
      const effWidth = Math.max(0, newPlot.width - (newPlot.setbacks.left + newPlot.setbacks.right));
      const effDepth = Math.max(0, newPlot.depth - (newPlot.setbacks.front + newPlot.setbacks.rear));
      newPlot.buildableArea = Number((effWidth * effDepth).toFixed(1));
      newPlot.coverageRatio = Number((newPlot.buildableArea / newPlot.area).toFixed(2));

      return {
        ...prev,
        plot: newPlot,
        dependentOutputsOutdated: true,
      };
    });
    addToast('Plot Updated', 'Boundaries & setbacks recalculated.', 'info');
  };

  const updateRequirements = (reqUpdates: any) => {
    setProject((prev) => ({
      ...prev,
      requirements: { ...prev.requirements, ...reqUpdates },
      dependentOutputsOutdated: true,
    }));
    addToast('Requirements Saved', 'Project requirements modified.', 'info');
  };

  const updateBrief = (briefUpdates: Partial<ArchitecturalBrief>) => {
    setProject((prev) => ({
      ...prev,
      brief: { ...prev.brief, ...briefUpdates },
    }));
    addToast('Brief Updated', 'Modifications recorded in design brief.', 'info');
  };

  const updateRoom = (roomId: string, updates: Partial<RoomData>) => {
    setProject((prev) => {
      const updatedAlternatives = prev.alternatives.map((alt) => {
        if (alt.id === prev.activeAlternativeId) {
          const updatedRooms = alt.rooms.map((r) => {
            if (r.id === roomId) {
              const merged = { ...r, ...updates };
              if (updates.width !== undefined || updates.height !== undefined) {
                merged.area = Number((merged.width * merged.height).toFixed(2));
              }
              return merged;
            }
            return r;
          });
          const totalGross = Number(updatedRooms.reduce((acc, rm) => acc + rm.area, 0).toFixed(1));
          return {
            ...alt,
            rooms: updatedRooms,
            grossArea: totalGross,
          };
        }
        return alt;
      });

      return {
        ...prev,
        alternatives: updatedAlternatives,
        dependentOutputsOutdated: true,
      };
    });
    addToast('Room Geometry Adjusted', 'Coordinated 2D/3D views marked as needing sync.', 'warning');
  };

  const selectAlternative = (altId: string) => {
    setProject((prev) => {
      const updated = prev.alternatives.map((a) => ({
        ...a,
        selected: a.id === altId,
      }));
      return {
        ...prev,
        alternatives: updated,
        activeAlternativeId: altId,
        dependentOutputsOutdated: true,
      };
    });
    addToast('Alternative Selected', `Active scheme switched. Synchronize views to align.`, 'info');
  };

  const approveRevision = (type: 'plot' | 'brief' | 'plan' | 'compliance', summary: string) => {
    setProject((prev) => {
      const revNum = prev.revisions.length + 1;
      const code = `REV-0${revNum}`;
      const newRev = {
        id: `rev-${Date.now()}`,
        code,
        timestamp: 'Just now',
        author: 'Lead Architect',
        summary,
        type,
      };

      const updatedWorkflow = prev.workflow.map((st) => {
        if (st.screenId === currentScreen) {
          return { ...st, status: 'approved' as const, revision: code };
        }
        return st;
      });

      return {
        ...prev,
        revisions: [...prev.revisions, newRev],
        activeRevision: code,
        identity: {
          ...prev.identity,
          currentRevision: code,
          lastModified: 'Just now',
        },
        workflow: updatedWorkflow,
        dependentOutputsOutdated: false,
      };
    });
    addToast('Revision Approved', `Created & approved ${project.identity.currentRevision} successfully.`, 'success');
  };

  const restoreRevision = (revCode: string) => {
    setProject((prev) => ({
      ...prev,
      activeRevision: revCode,
      identity: {
        ...prev.identity,
        currentRevision: revCode,
        lastModified: 'Restored from history',
      },
    }));
    addToast('Revision Restored', `Active project version set to ${revCode}.`, 'info');
  };

  const regenerateDependentViews = () => {
    setProject((prev) => ({
      ...prev,
      dependentOutputsOutdated: false,
      workflow: prev.workflow.map((w) => ({
        ...w,
        status: w.status === 'outdated' ? 'approved' : w.status,
      })),
    }));
    addToast('Views Synchronized', `2D, 3D, Compliance, and BOQ synchronized with ${project.activeRevision}.`, 'success');
  };

  const resetDemo = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY_DEMO);
    setProject(JSON.parse(JSON.stringify(INITIAL_JAKARTA_PROJECT)));
    setDemoMode(true);
    setCurrentScreen('dashboard');
    setPresentationMode(false);
    setPresentationStep(1);
    addToast('Demo Reset', 'Reset to initial pristine Austin Contemporary Residence demo state.', 'info');
  };

  // File management
  const addUploads = (newFiles: UploadedFile[]) => {
    setProject((prev) => ({
      ...prev,
      uploads: [...prev.uploads, ...newFiles],
    }));
    addToast('Files Uploaded', `Added ${newFiles.length} document(s) to project workspace.`, 'success');
  };

  const removeUpload = (fileId: string) => {
    const fileToRemove = project.uploads.find((f) => f.id === fileId);
    if (fileToRemove) {
      setDeletedUploads((prev) => [fileToRemove, ...prev]);
    }
    setProject((prev) => ({
      ...prev,
      uploads: prev.uploads.filter((f) => f.id !== fileId),
    }));
    addToast('File Removed', 'Moved to trash. You can restore it if needed.', 'info');
  };

  const restoreUpload = (fileId: string) => {
    const fileToRestore = deletedUploads.find((f) => f.id === fileId);
    if (fileToRestore) {
      setDeletedUploads((prev) => prev.filter((f) => f.id !== fileId));
      setProject((prev) => ({
        ...prev,
        uploads: [fileToRestore, ...prev.uploads],
      }));
      addToast('File Restored', `Restored ${fileToRestore.name} to workspace.`, 'success');
    }
  };

  const renameUpload = (fileId: string, newName: string) => {
    setProject((prev) => ({
      ...prev,
      uploads: prev.uploads.map((f) => (f.id === fileId ? { ...f, name: newName } : f)),
    }));
    addToast('File Renamed', `Updated file title to ${newName}`, 'info');
  };

  const tagUpload = (fileId: string, category: FileCategory) => {
    setProject((prev) => ({
      ...prev,
      uploads: prev.uploads.map((f) => (f.id === fileId ? { ...f, category, type: category } : f)),
    }));
    addToast('Category Tagged', `File categorized as "${category}"`, 'info');
  };

  const replaceUpload = (fileId: string, newFile: UploadedFile) => {
    setProject((prev) => ({
      ...prev,
      uploads: prev.uploads.map((f) => (f.id === fileId ? newFile : f)),
    }));
    addToast('File Replaced', `Replaced with ${newFile.name} (version updated)`, 'info');
  };

  const togglePresentationMode = () => {
    if (!presentationMode) {
      setPresentationMode(true);
      setPresentationStep(1);
      setCurrentScreen('dashboard');
      addToast('Presentation Mode Activated', 'Investor walkthrough initialized. Step 1 of 10.', 'info');
    } else {
      setPresentationMode(false);
      addToast('Presentation Mode Exited', 'Standard studio navigation restored.', 'info');
    }
  };

  const currentStepInfo = useMemo(() => {
    return PRESENTATION_STEPS[presentationStep - 1] || PRESENTATION_STEPS[0];
  }, [presentationStep]);

  const goToPresentationStep = (stepNum: number) => {
    if (stepNum >= 1 && stepNum <= PRESENTATION_STEPS.length) {
      setPresentationStep(stepNum);
      const target = PRESENTATION_STEPS[stepNum - 1];
      setCurrentScreen(target.screenId);
    }
  };

  const nextPresentationStep = () => {
    if (presentationStep < PRESENTATION_STEPS.length) {
      goToPresentationStep(presentationStep + 1);
    }
  };

  const prevPresentationStep = () => {
    if (presentationStep > 1) {
      goToPresentationStep(presentationStep - 1);
    }
  };

  return (
    <ProjectContext.Provider
      value={{
        currentScreen,
        setScreen: setCurrentScreen,
        project,
        availableProjects,
        selectProject,
        createNewProject,
        updatePlot,
        updateRequirements,
        updateBrief,
        updateRoom,
        selectAlternative,
        approveRevision,
        restoreRevision,
        regenerateDependentViews,
        activeFloor,
        setActiveFloor,
        selectedRoomId,
        setSelectedRoomId,
        selected3DStyle,
        setSelected3DStyle,
        selected3DMaterial,
        setSelected3DMaterial,
        selectedLocation,
        setSelectedLocation,
        wasteFactor,
        setWasteFactor,
        toasts,
        addToast,
        removeToast,
        presentationMode,
        setPresentationMode,
        togglePresentationMode,
        presentationStep,
        currentStepInfo,
        nextPresentationStep,
        prevPresentationStep,
        goToPresentationStep,
        demoMode,
        setDemoMode,
        switchToDemoMode,
        switchToLiveMode,
        resetDemo,
        isAutosaving,
        autosaveTime,
        settingsOpen,
        setSettingsOpen,
        onboardingOpen,
        setOnboardingOpen,
        deletedUploads,
        addUploads,
        removeUpload,
        restoreUpload,
        renameUpload,
        tagUpload,
        replaceUpload,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
