import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';
import {
  FolderOpen,
  ChevronDown,
  RefreshCw,
  Sliders,
  CheckCircle,
  HelpCircle,
  Play,
  Plus,
  Sparkles,
  ExternalLink,
  Menu,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenOnboarding?: () => void }> = ({ onOpenOnboarding }) => {
  const {
    project,
    companyProjects,
    openProjectById,
    createNewProject,
    currentScreen,
    setScreen,
    presentationMode,
    togglePresentationMode,
    autosaveStatus,
    autosaveTime,
    retryAutosave,
    regenerateDependentViews,
    setSettingsOpen,
    setMobileNavOpen,
  } = useProject();

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  const getStatusBadge = () => {
    if (project.dependentOutputsOutdated) {
      return (
        <button
          onClick={regenerateDependentViews}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-[#FFF4ED] text-[#B54708] border border-[#FECDCA] rounded-md hover:bg-[#FEE4E2] transition-colors"
          title="Floor plan changed. Click to align 2D & 3D models."
        >
          <RefreshCw className="w-3 h-3 animate-spin text-[#B54708]" style={{ animationDuration: '3s' }} />
          <span>Views Need Sync</span>
        </button>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] rounded-md">
        <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
        Synchronized
      </span>
    );
  };

  const getScreenBreadcrumb = () => {
    switch (currentScreen) {
      case 'projects':
        return 'Projects Directory';
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
    <header className="h-14 border-b border-[#E4E7EC] bg-white px-3 sm:px-4 flex items-center justify-between z-20 sticky top-0 shadow-2xs select-none">
      {/* Left: Hamburger (Mobile) + Project Selector & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Toggle Button */}
        <Link
          to="/dashboard"
          className="hidden sm:inline-flex min-h-10 items-center rounded-lg px-2 text-xs font-semibold text-[#6546F5] hover:bg-[#F4F1FF]"
        >
          Home
        </Link>
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="md:hidden w-10 h-10 min-h-[44px] min-w-[44px] -ml-1 rounded-lg text-[#344054] hover:text-[#172033] hover:bg-[#F9FAFB] flex items-center justify-center transition-colors"
          aria-label="Open Navigation Drawer"
          title="Open Navigation Drawer"
        >
          <Menu className="w-5 h-5 text-[#344054]" />
        </button>

        <div className="relative">
          <button
            id="nav-project-selector"
            onClick={() => setProjectMenuOpen(!projectMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg hover:bg-[#F9FAFB] border border-[#E4E7EC] text-left transition-colors min-h-[40px]"
          >
            <FolderOpen className="w-4 h-4 text-[#2563EB] shrink-0" />
            <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
              <span className="text-xs font-bold text-[#172033] max-w-[110px] xs:max-w-[140px] sm:max-w-[200px] truncate">
                {project.identity.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#667085] shrink-0" />
            </div>
          </button>

          {projectMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProjectMenuOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1.5 w-80 bg-white border border-[#E4E7EC] rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider flex items-center justify-between border-b border-[#E4E7EC]">
                  <span>Saved Projects ({companyProjects.length})</span>
                  <button
                    onClick={() => {
                      setProjectMenuOpen(false);
                      setScreen('projects');
                    }}
                    className="text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-semibold capitalize text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> New
                  </button>
                </div>

                <div className="py-1 max-h-64 overflow-y-auto">
                  {companyProjects.length === 0 ? (
                    <div className="p-3 text-center text-xs text-[#667085]">
                      No projects found.
                    </div>
                  ) : (
                    companyProjects.map((p) => {
                      const isCurrent = p.id === project.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            openProjectById(p.id);
                            setProjectMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F9FAFB] transition-colors flex items-center justify-between ${
                            isCurrent ? 'bg-[#EEF4FF] text-[#2563EB] font-medium' : 'text-[#172033]'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold truncate">{p.project_name}</div>
                            <div className="text-[11px] text-[#667085] truncate">
                              {p.location} • {p.project_type}
                            </div>
                          </div>
                          {isCurrent && <CheckCircle className="w-4 h-4 text-[#2563EB] shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Direct Link to full Projects Dashboard */}
                <div className="p-2 border-t border-[#E4E7EC] bg-white">
                  <button
                    onClick={() => {
                      setScreen('projects');
                      setProjectMenuOpen(false);
                    }}
                    className="w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>Manage All Projects</span>
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-4 w-[1px] bg-[#E4E7EC] hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-[#667085] font-medium">{getScreenBreadcrumb()}</span>
          {getStatusBadge()}
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#F9FAFB] border border-[#E4E7EC] text-[#172033] font-semibold">
            {project.activeRevision}
          </span>
        </div>
      </div>

      {/* Right: Autosave status, Quick Guide, Presentation Mode, Settings */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Autosave Status Indicator */}
        <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border border-[#E4E7EC] bg-[#F9FAFB]">
          {autosaveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-blue-600">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span className="font-mono text-[11px]">Saving…</span>
            </div>
          )}
          {autosaveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono text-[11px]">Saved at {autosaveTime}</span>
            </div>
          )}
          {autosaveStatus === 'failed' && (
            <div className="flex items-center gap-1.5 text-rose-600">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="font-mono text-[11px]">Save failed</span>
              <button
                onClick={retryAutosave}
                className="underline font-bold text-rose-700 hover:text-rose-900 ml-0.5"
              >
                Retry
              </button>
            </div>
          )}
          {autosaveStatus === 'idle' && (
            <div className="flex items-center gap-1.5 text-[#667085]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="font-mono text-[11px]">Saved</span>
            </div>
          )}
        </div>

        {onOpenOnboarding && (
          <button
            onClick={onOpenOnboarding}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E4E7EC] text-xs font-medium text-[#172033] hover:bg-[#F9FAFB] transition-colors"
            title="Open Quick Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Guide</span>
          </button>
        )}

        <button
          id="btn-toggle-presentation"
          onClick={togglePresentationMode}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold min-h-[40px] transition-all ${
            presentationMode
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'bg-white border border-[#E4E7EC] text-[#344054] hover:bg-[#F9FAFB] hover:text-[#172033]'
          }`}
          title="Investor Presentation Mode (Full Pipeline)"
        >
          <Play className="w-3.5 h-3.5 text-[#2563EB] fill-current" />
          <span className="hidden xs:inline">Investor Walkthrough</span>
          <span className="xs:hidden">Pitch</span>
        </button>

        <button
          id="btn-navbar-settings"
          onClick={() => setSettingsOpen(true)}
          className="p-2 min-h-[40px] min-w-[40px] rounded-lg border border-[#E4E7EC] text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] transition-colors flex items-center justify-center"
          title="Project & Studio Settings"
        >
          <Sliders className="w-4 h-4 text-[#667085]" />
        </button>
      </div>
    </header>
  );
};
