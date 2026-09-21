import React, { useEffect, useRef, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  FolderOpen,
  ChevronDown,
  RefreshCw,
  Sliders,
  CheckCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Plus,
  Menu,
} from 'lucide-react';

interface NavbarProps {
  onOpenOnboarding?: () => void;
  /** Opens the off-canvas sidebar. */
  onOpenNav?: () => void;
  /** True while the shell is in drawer mode (below `lg`). */
  showNavToggle?: boolean;
  navOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenOnboarding,
  onOpenNav,
  showNavToggle = false,
  navOpen = false,
}) => {
  const {
    project,
    availableProjects,
    selectProject,
    createNewProject,
    currentScreen,
    presentationMode,
    togglePresentationMode,
    isAutosaving,
    autosaveTime,
    regenerateDependentViews,
    setSettingsOpen,
    demoMode,
    switchToDemoMode,
    switchToLiveMode,
    resetDemo,
  } = useProject();

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef<HTMLDivElement | null>(null);

  // Dismiss the project menu on outside tap/click and on Escape. `pointerdown`
  // covers mouse, touch and pen with one listener across all engines.
  useEffect(() => {
    if (!projectMenuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!projectMenuRef.current?.contains(event.target as Node)) {
        setProjectMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProjectMenuOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [projectMenuOpen]);

  const getStatusBadge = () => {
    if (project.dependentOutputsOutdated) {
      return (
        <button
          onClick={regenerateDependentViews}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-[#FFF4ED] text-[#B54708] border border-[#FECDCA] rounded-md hover:bg-[#FEE4E2] transition-colors whitespace-nowrap"
          title="Floor plan changed. Click to align 2D & 3D models."
        >
          <RefreshCw className="w-3 h-3 animate-spin text-[#B54708]" style={{ animationDuration: '3s' }} />
          <span>Views Need Sync</span>
        </button>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] rounded-md whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
        Synchronized
      </span>
    );
  };

  const getScreenBreadcrumb = () => {
    switch (currentScreen) {
      case 'dashboard':
        return 'Project Dashboard';
      case 'setup':
        return 'Projects & Ingestion';
      case 'plot':
        return 'Site & Plot Intelligence';
      case 'architect':
        return 'AI Architect Dialogue';
      case 'floorplan':
        return 'Conceptual Floor Plan';
      case 'coordinated2d':
        return 'Coordinated 2D Drawing';
      case 'coordinated3d':
        return 'Coordinated 3D Model';
      case 'exterior':
        return 'Exterior Concept & Materials';
      case 'compliance':
        return 'Preliminary Compliance';
      case 'boq':
        return 'BOQ & Cost Analysis';
      case 'deliverables':
        return 'Deliverables & Export';
      case 'files':
        return 'Files Workspace';
      case 'activity':
        return 'Activity & Revisions';
      default:
        return 'Studio';
    }
  };

  return (
    <header
      data-print-hide
      className="h-14 shrink-0 border-b border-[#E4E7EC] bg-white pl-safe pr-safe px-2 sm:px-4 flex items-center justify-between gap-2 z-20 sticky top-0 shadow-2xs select-none"
    >
      {/* Left: Nav toggle, Project Selector & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {showNavToggle && (
          <button
            onClick={onOpenNav}
            aria-label="Open navigation"
            aria-controls="app-sidebar"
            aria-expanded={navOpen}
            className="tap shrink-0 p-2 -ml-1 rounded-lg text-[#344054] hover:text-[#172033] hover:bg-[#F9FAFB] active:bg-[#F2F4F7] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative min-w-0" ref={projectMenuRef}>
          <button
            id="nav-project-selector"
            onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            aria-haspopup="menu"
            aria-expanded={projectMenuOpen}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-[#F9FAFB] border border-[#E4E7EC] text-left transition-colors max-w-full"
          >
            <FolderOpen className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span className="text-xs font-bold text-[#172033] max-w-[7rem] xs:max-w-[10rem] sm:max-w-[12rem] truncate">
              {project.identity.name}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#667085] shrink-0 transition-transform ${
                projectMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {projectMenuOpen && (
            <div
              role="menu"
              className="absolute top-full left-0 mt-1.5 w-[min(20rem,calc(100vw-1.5rem))] bg-white border border-[#E4E7EC] rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95"
            >
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider flex items-center justify-between gap-2 border-b border-[#E4E7EC]">
                <span>Projects</span>
                <button
                  onClick={() => {
                    createNewProject();
                    setProjectMenuOpen(false);
                  }}
                  className="text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-medium capitalize text-xs shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> New Project
                </button>
              </div>

              <div className="py-1 max-h-[min(15rem,45vh)] overflow-y-auto overscroll-contain">
                {availableProjects.map((p) => (
                  <button
                    key={p.id}
                    role="menuitem"
                    onClick={() => {
                      selectProject(p.id);
                      setProjectMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-xs hover:bg-[#F9FAFB] transition-colors flex items-center justify-between gap-2 ${
                      p.id === project.id ? 'bg-[#EEF4FF] text-[#2563EB] font-medium' : 'text-[#172033]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-[#172033] truncate">{p.identity.name}</div>
                      <div className="text-[11px] text-[#667085] truncate">
                        {p.identity.location} • {p.plot.area} m²
                      </div>
                    </div>
                    {p.id === project.id && <CheckCircle className="w-4 h-4 text-[#2563EB] shrink-0" />}
                  </button>
                ))}
              </div>

              <div className="p-2 border-t border-[#E4E7EC] bg-[#F9FAFB] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#667085]">Operating Mode</span>
                {demoMode ? (
                  <button
                    onClick={() => {
                      switchToLiveMode();
                      setProjectMenuOpen(false);
                    }}
                    className="text-xs text-[#2563EB] font-semibold hover:underline shrink-0"
                  >
                    Switch to Live MVP
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      switchToDemoMode();
                      setProjectMenuOpen(false);
                    }}
                    className="text-xs text-[#B54708] font-semibold hover:underline shrink-0"
                  >
                    Load Jakarta Demo
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-[#E4E7EC] hidden md:block shrink-0" />

        <div className="hidden md:flex items-center gap-2 min-w-0">
          <span className="text-xs text-[#667085] font-medium truncate">{getScreenBreadcrumb()}</span>
          <span className="hidden lg:inline-flex">{getStatusBadge()}</span>
          <span className="hidden xl:inline text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#F9FAFB] border border-[#E4E7EC] text-[#172033] font-semibold">
            {project.activeRevision}
          </span>
        </div>
      </div>

      {/* Center: Mode Indicator Badge */}
      <div className="hidden xl:flex items-center gap-2 shrink-0">
        {demoMode ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF4ED] border border-[#FECDCA] rounded-full text-xs text-[#B54708]">
            <span className="w-2 h-2 rounded-full bg-[#F79009] animate-pulse" />
            <span className="font-semibold whitespace-nowrap">Demo: Jakarta Urban Residence</span>
            <button
              onClick={resetDemo}
              className="ml-1 text-[11px] text-[#B54708] hover:text-[#7A271A] underline flex items-center gap-0.5"
              title="Reset sample data"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#ECFDF3] border border-[#ABEFC6] rounded-full text-xs text-[#027A48]">
            <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
            <span className="font-semibold whitespace-nowrap">Live MVP</span>
            <span className="hidden 2xl:inline text-[11px] text-[#027A48]/70">• Custom Workspace</span>
          </div>
        )}
      </div>

      {/* Right: Autosave status, Quick Guide, Presentation Mode, Settings */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] text-[#667085] font-mono">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isAutosaving ? 'bg-[#2563EB] animate-pulse' : 'bg-[#12B76A]'
            }`}
          />
          <span className="whitespace-nowrap">
            {isAutosaving ? 'Saving...' : `Autosaved ${autosaveTime}`}
          </span>
        </div>

        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E4E7EC] text-xs font-medium text-[#172033] hover:bg-[#F9FAFB] transition-colors"
            title="Open Quick Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Guide</span>
          </button>
        )}

        <button
          id="btn-toggle-presentation"
          onClick={togglePresentationMode}
          className={`tap flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            presentationMode
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-[#F9FAFB] hover:bg-[#F2F4F7] text-[#172033] border border-[#E4E7EC]'
          }`}
          title="Toggle presentation deck walkthrough"
          aria-label={presentationMode ? 'Exit demo walkthrough' : 'Start demo walkthrough'}
        >
          <Play className="w-3 h-3 fill-current shrink-0" />
          <span className="hidden lg:inline whitespace-nowrap">
            {presentationMode ? 'Exit Demo' : 'Demo Walkthrough'}
          </span>
        </button>

        <button
          id="btn-open-settings"
          onClick={() => setSettingsOpen(true)}
          className="tap flex items-center justify-center p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] border border-[#E4E7EC] transition-colors"
          aria-label="Settings"
          title="Project & AI Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* User initials avatar */}
        <div className="hidden sm:flex w-7 h-7 shrink-0 rounded-full bg-[#EEF4FF] border border-[#2563EB]/30 items-center justify-center text-xs font-bold text-[#2563EB]">
          CA
        </div>
      </div>
    </header>
  );
};
