import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
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
  Sparkles,
  ExternalLink,
  Menu,
  User as UserIcon,
  LogOut,
  FolderKanban,
  Database,
  AlertTriangle,
} from 'lucide-react';

export const Navbar: React.FC<{ onOpenOnboarding?: () => void }> = ({ onOpenOnboarding }) => {
  const {
    project,
    availableProjects,
    selectProject,
    createNewProject,
    currentScreen,
    setScreen,
    presentationMode,
    togglePresentationMode,
    isAutosaving,
    autosaveStatus,
    autosaveTime,
    retryAutosave,
    regenerateDependentViews,
    setSettingsOpen,
    demoMode,
    switchToDemoMode,
    switchToLiveMode,
    resetDemo,
    setMobileNavOpen,
  } = useProject();

  const { user, openSignIn, signOut } = useAuth();

  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
        <button
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
              <span className="text-xs font-bold text-[#172033] max-w-[100px] xs:max-w-[130px] sm:max-w-[200px] truncate">
                {project.identity.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#667085] shrink-0" />
            </div>
          </button>

          {projectMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-80 bg-white border border-[#E4E7EC] rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-[#667085] uppercase tracking-wider flex items-center justify-between border-b border-[#E4E7EC]">
                <span>Projects</span>
                <button
                  onClick={() => {
                    createNewProject();
                    setProjectMenuOpen(false);
                  }}
                  className="text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-medium capitalize text-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> New Project
                </button>
              </div>

              <div className="py-1 max-h-60 overflow-y-auto">
                {availableProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      selectProject(p.id);
                      setProjectMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-[#F9FAFB] transition-colors flex items-center justify-between ${
                      p.id === project.id ? 'bg-[#EEF4FF] text-[#2563EB] font-medium' : 'text-[#172033]'
                    }`}
                  >
                    <div>
                      <div className="font-medium text-[#172033]">{p.identity.name}</div>
                      <div className="text-[11px] text-[#667085]">
                        {p.identity.location} • {p.plot.area} m²
                      </div>
                    </div>
                    {p.id === project.id && <CheckCircle className="w-4 h-4 text-[#2563EB]" />}
                  </button>
                ))}
              </div>

              {/* Direct Link to full Supabase Projects Dashboard */}
              <div className="p-2 border-t border-[#E4E7EC] bg-white">
                <button
                  onClick={() => {
                    setScreen('projects');
                    setProjectMenuOpen(false);
                  }}
                  className="w-full py-1.5 px-2 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Manage All Projects</span>
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="p-2 border-t border-[#E4E7EC] bg-[#F9FAFB] flex items-center justify-between">
                <span className="text-[11px] text-[#667085]">Operating Mode</span>
                {demoMode ? (
                  <button
                    onClick={() => {
                      switchToLiveMode();
                      setProjectMenuOpen(false);
                    }}
                    className="text-xs text-[#2563EB] font-semibold hover:underline"
                  >
                    Switch to Live MVP
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      switchToDemoMode();
                      setProjectMenuOpen(false);
                    }}
                    className="text-xs text-[#B54708] font-semibold hover:underline"
                  >
                    Load Jakarta Demo
                  </button>
                )}
              </div>
            </div>
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

      {/* Center: Mode Indicator Badge */}
      <div className="hidden md:flex items-center gap-2">
        {demoMode ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FFF4ED] border border-[#FECDCA] rounded-full text-xs text-[#B54708]">
            <span className="w-2 h-2 rounded-full bg-[#F79009] animate-pulse" />
            <span className="font-semibold">Demo Project: Jakarta Urban Residence</span>
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
            <span className="font-semibold">Live MVP</span>
            <span className="text-[11px] text-[#027A48]/70">• Custom Workspace</span>
          </div>
        )}
      </div>

      {/* Right: Autosave status, Quick Guide, Presentation Mode, Settings, Auth Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Autosave Status Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono">
          {autosaveStatus === 'saving' && (
            <div className="flex items-center gap-1.5 text-blue-600">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Saving…</span>
            </div>
          )}
          {autosaveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-[#667085]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
              <span>Saved at {autosaveTime}</span>
            </div>
          )}
          {autosaveStatus === 'failed' && (
            <div className="flex items-center gap-1.5 text-rose-600">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Save failed</span>
              <button
                onClick={retryAutosave}
                className="ml-1 underline font-semibold text-rose-700 hover:text-rose-900"
              >
                Retry
              </button>
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
              : 'bg-[#F9FAFB] hover:bg-[#F2F4F7] text-[#172033] border border-[#E4E7EC]'
          }`}
          title="Toggle presentation deck walkthrough"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">{presentationMode ? 'Exit Demo' : 'Demo Walkthrough'}</span>
        </button>

        <button
          id="btn-open-settings"
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] border border-[#E4E7EC] flex items-center justify-center transition-colors"
          aria-label="Settings"
          title="Project & AI Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* User Account / Profile Menu */}
        <div className="relative">
          {user ? (
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 rounded-full bg-[#EEF4FF] hover:bg-[#D1E0FF] border border-[#2563EB]/30 flex items-center justify-center text-xs font-bold text-[#2563EB] transition-colors"
              title={user.email || 'Architect Account'}
            >
              {(user.email ? user.email.slice(0, 2) : 'AR').toUpperCase()}
            </button>
          ) : (
            <button
              onClick={openSignIn}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}

          {/* User Popover Dropdown */}
          {userMenuOpen && user && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#E4E7EC] rounded-xl shadow-xl z-30 overflow-hidden text-xs animate-in zoom-in-95 duration-100">
                <div className="p-3 bg-[#F9FAFB] border-b border-[#E4E7EC]">
                  <div className="font-semibold text-[#172033] truncate">
                    {user.user_metadata?.full_name || 'Architect Studio'}
                  </div>
                  <div className="text-[11px] text-[#667085] truncate font-mono mt-0.5">
                    {user.email}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded w-fit">
                    <Database className="w-3 h-3" />
                    <span>Supabase Connected</span>
                  </div>
                </div>

                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setScreen('projects');
                    }}
                    className="w-full px-2.5 py-2 text-left hover:bg-[#F2F4F7] rounded-lg flex items-center gap-2 text-[#344054] font-medium"
                  >
                    <FolderKanban className="w-4 h-4 text-blue-600" />
                    <span>My Projects</span>
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    className="w-full px-2.5 py-2 text-left hover:bg-[#F2F4F7] rounded-lg flex items-center gap-2 text-[#344054]"
                  >
                    <Sliders className="w-4 h-4 text-[#667085]" />
                    <span>Studio Settings</span>
                  </button>
                </div>

                <div className="p-1.5 border-t border-[#E4E7EC]">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    className="w-full px-2.5 py-2 text-left hover:bg-rose-50 rounded-lg flex items-center gap-2 text-rose-600 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
