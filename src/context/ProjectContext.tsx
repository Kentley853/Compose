import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  fetchCompanyProjects,
  fetchProjectById,
  saveProjectToSupabase,
  createNewProjectInSupabase,
  renameProjectInSupabase,
  setProjectStatusInSupabase,
  duplicateProjectInSupabase,
  deleteProjectFromSupabase,
  deleteFileFromSupabase,
  ProjectSummary,
  isSupabaseConfigured,
} from '../services/supabase';

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
  companyProjects: ProjectSummary[];
  isLoadingProjects: boolean;
  loadAllProjects: () => Promise<void>;
  openProjectById: (projectId: string) => Promise<void>;
  createNewProject: (name?: string, location?: string, projectType?: string) => Promise<void>;
  renameProject: (projectId: string, newName: string) => Promise<void>;
  archiveProject: (projectId: string, status: 'active' | 'archived') => Promise<void>;
  duplicateProject: (projectId: string) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string) => void;
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
  isAutosaving: boolean;
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'failed';
  autosaveTime: string;
  retryAutosave: () => void;
  saveCurrentProjectNow: () => Promise<void>;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
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

const ACTIVE_PROJECT_ID_STORAGE_KEY = 'compose_ai_active_project_id';
const LOCAL_STORAGE_KEY_BACKUP = 'compose_ai_active_project_backup_v2';

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [companyProjects, setCompanyProjects] = useState<ProjectSummary[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);

  // Initialize active project from local backup or default
  const [project, setProject] = useState<ProjectData>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY_BACKUP);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {}
    return {
      ...INITIAL_JAKARTA_PROJECT,
      id: 'proj-company-alpha-01',
      identity: {
        ...INITIAL_JAKARTA_PROJECT.identity,
        id: 'proj-company-alpha-01',
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
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('saved');
  const [autosaveTime, setAutosaveTime] = useState<string>('Just now');
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  const addToast = useCallback((title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
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
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initial Load: Fetch all saved company projects from Supabase when the app opens
  const loadAllProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const list = await fetchCompanyProjects();
      setCompanyProjects(list);

      // Check if user previously opened a specific project
      const lastOpenedId = localStorage.getItem(ACTIVE_PROJECT_ID_STORAGE_KEY);
      if (lastOpenedId) {
        const found = list.find((p) => p.id === lastOpenedId);
        if (found) {
          const loaded = await fetchProjectById(lastOpenedId);
          setProject(loaded);
          localStorage.setItem(LOCAL_STORAGE_KEY_BACKUP, JSON.stringify(loaded));
          return;
        }
      }

      // If no last-opened or not found, load the top project from Supabase
      if (list.length > 0) {
        const loaded = await fetchProjectById(list[0].id);
        setProject(loaded);
        localStorage.setItem(LOCAL_STORAGE_KEY_BACKUP, JSON.stringify(loaded));
        localStorage.setItem(ACTIVE_PROJECT_ID_STORAGE_KEY, loaded.id);
      }
    } catch (err: any) {
      console.warn('Failed to load company projects:', err);
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    loadAllProjects();
  }, [loadAllProjects]);

  // Keep active project ID stored in localStorage so refresh stays on this project
  useEffect(() => {
    if (project?.id) {
      localStorage.setItem(ACTIVE_PROJECT_ID_STORAGE_KEY, project.id);
      localStorage.setItem(LOCAL_STORAGE_KEY_BACKUP, JSON.stringify(project));
    }
  }, [project]);

  // 2. Autosave: Automatically save changes after a short delay (1200ms)
  const saveCurrentProjectNow = useCallback(async () => {
    setIsAutosaving(true);
    setAutosaveStatus('saving');
    try {
      // Offline local preservation
      localStorage.setItem(LOCAL_STORAGE_KEY_BACKUP, JSON.stringify(project));

      // Supabase PostgreSQL permanent persistence (no duplicate records)
      await saveProjectToSupabase(project);

      setAutosaveStatus('saved');
      setAutosaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (e: any) {
      console.warn('Autosave failed:', e);
      // Local work is preserved, flag failed status so user can click Retry
      setAutosaveStatus('failed');
    } finally {
      setIsAutosaving(false);
    }
  }, [project]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveCurrentProjectNow();
    }, 1200);

    return () => clearTimeout(timer);
  }, [project, saveCurrentProjectNow]);

  const retryAutosave = () => {
    saveCurrentProjectNow();
  };

  // Open existing project from Supabase
  const openProjectById = async (projectId: string) => {
    setIsLoadingProjects(true);
    try {
      const loaded = await fetchProjectById(projectId);
      setProject(loaded);
      localStorage.setItem(ACTIVE_PROJECT_ID_STORAGE_KEY, loaded.id);
      localStorage.setItem(LOCAL_STORAGE_KEY_BACKUP, JSON.stringify(loaded));
      setCurrentScreen('dashboard');
      addToast('Project Opened', `Loaded "${loaded.identity.name}". All fields restored.`, 'success');
    } catch (err: any) {
      console.error('Failed to open project:', err);
      addToast('Open Failed', err.message || 'Could not load project from Supabase.', 'error');
      throw err;
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Switch project from top dropdown
  const selectProject = (projectId: string) => {
    openProjectById(projectId);
  };

  // Create new project in Supabase
  const createNewProject = async (
    name: string = 'Untitled Architectural Project',
    location: string = 'Austin, Texas',
    projectType: string = 'Single-family residential'
  ) => {
    setIsLoadingProjects(true);
    try {
      const created = await createNewProjectInSupabase(name, location, projectType);
      setProject(created);
      localStorage.setItem(ACTIVE_PROJECT_ID_STORAGE_KEY, created.id);
      localStorage.setItem(LOCAL_STORAGE_KEY_BACKUP, JSON.stringify(created));
      setCurrentScreen('setup');
      addToast('Project Created', `Initialized "${created.identity.name}".`, 'success');
      await loadAllProjects();
    } catch (err: any) {
      console.error('Failed to create project:', err);
      addToast('Creation Error', err.message || 'Could not create project.', 'error');
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Rename project in Supabase
  const renameProject = async (projectId: string, newName: string) => {
    try {
      await renameProjectInSupabase(projectId, newName);
      if (project.id === projectId) {
        setProject((prev) => ({
          ...prev,
          identity: {
            ...prev.identity,
            name: newName,
          },
        }));
      }
      await loadAllProjects();
      addToast('Project Renamed', `Project title updated to "${newName}".`, 'info');
    } catch (err: any) {
      addToast('Rename Failed', err.message || 'Could not rename project.', 'error');
    }
  };

  // Archive or unarchive project
  const archiveProject = async (projectId: string, status: 'active' | 'archived') => {
    try {
      await setProjectStatusInSupabase(projectId, status);
      await loadAllProjects();
      addToast(
        status === 'archived' ? 'Project Archived' : 'Project Restored',
        status === 'archived' ? 'Project moved to archive.' : 'Project marked as active.',
        'info'
      );
    } catch (err: any) {
      addToast('Action Failed', err.message, 'error');
    }
  };

  // Duplicate project in Supabase
  const duplicateProject = async (projectId: string) => {
    try {
      const duplicated = await duplicateProjectInSupabase(projectId);
      await loadAllProjects();
      addToast('Project Duplicated', `Created copy "${duplicated.identity.name}".`, 'success');
    } catch (err: any) {
      addToast('Duplicate Failed', err.message, 'error');
    }
  };

  // Delete project from Supabase permanently after confirmation
  const deleteProject = async (projectId: string) => {
    try {
      await deleteProjectFromSupabase(projectId);
      addToast('Project Deleted', 'Project removed from company database.', 'info');
      await loadAllProjects();
      // If deleted current project, open another
      const remaining = companyProjects.filter((p) => p.id !== projectId);
      if (remaining.length > 0) {
        await openProjectById(remaining[0].id);
      }
    } catch (err: any) {
      addToast('Delete Failed', err.message, 'error');
    }
  };

  // Model & State Mutators
  const updatePlot = (plotUpdates: Partial<PlotData>) => {
    setProject((prev) => ({
      ...prev,
      plot: { ...prev.plot, ...plotUpdates },
      dependentOutputsOutdated: true,
      workflow: prev.workflow.map((w) =>
        ['coordinated2d', 'coordinated3d', 'compliance', 'boq'].includes(w.screenId)
          ? { ...w, status: 'outdated' }
          : w
      ),
    }));
    addToast('Site Geometry Updated', 'Setbacks and boundary recalculated.', 'info');
  };

  const updateRequirements = (reqUpdates: any) => {
    setProject((prev) => ({
      ...prev,
      requirements: { ...prev.requirements, ...reqUpdates },
      dependentOutputsOutdated: true,
    }));
    addToast('Requirements Saved', 'Design program parameters refreshed.', 'info');
  };

  const updateBrief = (briefUpdates: Partial<ArchitecturalBrief>) => {
    setProject((prev) => ({
      ...prev,
      brief: { ...prev.brief, ...briefUpdates },
    }));
    addToast('Design Brief Updated', 'Spatial guidelines synchronized.', 'info');
  };

  const updateRoom = (roomId: string, updates: Partial<RoomData>) => {
    setProject((prev) => {
      const newAlternatives = prev.alternatives.map((alt) => {
        if (alt.id === prev.activeAlternativeId) {
          return {
            ...alt,
            rooms: alt.rooms.map((r) => (r.id === roomId ? { ...r, ...updates } : r)),
          };
        }
        return alt;
      });

      return {
        ...prev,
        alternatives: newAlternatives,
        dependentOutputsOutdated: true,
        workflow: prev.workflow.map((w) =>
          ['coordinated2d', 'coordinated3d', 'compliance', 'boq'].includes(w.screenId)
            ? { ...w, status: 'outdated' }
            : w
        ),
      };
    });
  };

  const selectAlternative = (altId: string) => {
    setProject((prev) => ({
      ...prev,
      activeAlternativeId: altId,
      dependentOutputsOutdated: true,
    }));
    addToast('Alternative Selected', `Active floor plan option changed.`, 'info');
  };

  const approveRevision = (type: 'plot' | 'brief' | 'plan' | 'compliance', summary: string) => {
    const revIndex = project.revisions.length + 1;
    const code = `REV-0${revIndex}`;
    const newRev = {
      id: `rev-0${revIndex}`,
      code,
      timestamp: new Date().toISOString(),
      author: 'Compose AI Studio Lead',
      summary,
      type,
    };

    setProject((prev) => {
      const updatedWorkflow = prev.workflow.map((w) => {
        if (
          (type === 'plot' && w.screenId === 'plot') ||
          (type === 'brief' && w.screenId === 'architect') ||
          (type === 'plan' && w.screenId === 'floorplan') ||
          (type === 'compliance' && w.screenId === 'compliance')
        ) {
          return { ...w, status: 'approved' as const };
        }
        return w;
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
    addToast('Revision Approved', `Created & approved ${code} successfully.`, 'success');
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

  // File management
  const addUploads = (newFiles: UploadedFile[]) => {
    setProject((prev) => ({
      ...prev,
      uploads: [...prev.uploads, ...newFiles],
    }));
    addToast('Files Uploaded', `Added ${newFiles.length} file(s) to project workspace.`, 'success');
  };

  const removeUpload = async (fileId: string) => {
    const fileToRemove = project.uploads.find((f) => f.id === fileId);
    if (fileToRemove) {
      setDeletedUploads((prev) => [fileToRemove, ...prev]);
      // Remove from Supabase project_files and storage bucket
      await deleteFileFromSupabase(project.id, fileId, fileToRemove.storagePath);
    }
    setProject((prev) => ({
      ...prev,
      uploads: prev.uploads.filter((f) => f.id !== fileId),
    }));
    addToast('File Removed', 'File deleted from project workspace.', 'info');
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
        companyProjects,
        isLoadingProjects,
        loadAllProjects,
        openProjectById,
        createNewProject,
        renameProject,
        archiveProject,
        duplicateProject,
        deleteProject,
        selectProject,
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
        isAutosaving,
        autosaveStatus,
        autosaveTime,
        retryAutosave,
        saveCurrentProjectNow,
        settingsOpen,
        setSettingsOpen,
        onboardingOpen,
        setOnboardingOpen,
        mobileNavOpen,
        setMobileNavOpen,
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

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
