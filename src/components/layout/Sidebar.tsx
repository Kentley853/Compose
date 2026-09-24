import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ScreenId } from '../../types/architecture';
import {
  LayoutDashboard,
  FolderKanban,
  Compass,
  Bot,
  Grid3X3,
  FileCode2,
  Box,
  Palette,
  ShieldCheck,
  Calculator,
  FileSpreadsheet,
  FolderArchive,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  HelpCircle,
  X,
  Database,
} from 'lucide-react';

interface NavItem {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<{ onOpenOnboarding?: () => void }> = ({ onOpenOnboarding }) => {
  const {
    currentScreen,
    setScreen,
    setSettingsOpen,
    project,
    mobileNavOpen,
    setMobileNavOpen,
  } = useProject();

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    home: true,
    design: true,
    review: true,
    workspace: true,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const navGroups: NavGroup[] = [
    {
      id: 'home',
      title: 'Home',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Company Projects', icon: FolderKanban, badge: 'Cloud' },
        { id: 'setup', label: 'Intake & Ingestion', icon: FolderKanban },
      ],
    },
    {
      id: 'design',
      title: 'Design Pipeline',
      items: [
        { id: 'plot', label: 'Site & Plot Intelligence', icon: Compass },
        { id: 'architect', label: 'AI Architect Dialogue', icon: Bot },
        { id: 'floorplan', label: 'Floor Plan Generation', icon: Grid3X3 },
        { id: 'coordinated2d', label: 'Coordinated 2D Drawing', icon: FileCode2 },
        { id: 'coordinated3d', label: 'Coordinated 3D Model', icon: Box },
        { id: 'exterior', label: 'Exterior & Materials', icon: Palette },
      ],
    },
    {
      id: 'review',
      title: 'Review & Estimates',
      items: [
        { id: 'compliance', label: 'Preliminary Compliance', icon: ShieldCheck },
        { id: 'boq', label: 'BOQ & Cost Analysis', icon: Calculator },
        { id: 'deliverables', label: 'Deliverables & Export', icon: FileSpreadsheet },
      ],
    },
    {
      id: 'workspace',
      title: 'Project Files',
      items: [
        { id: 'files', label: 'Files Workspace', icon: FolderArchive },
        { id: 'activity', label: 'Revisions & Activity', icon: History },
      ],
    },
  ];

  const handleNavClick = (screenId: ScreenId) => {
    setScreen(screenId);
    setMobileNavOpen(false);
  };

  const renderNavList = (isMobile: boolean = false) => (
    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
      {navGroups.map((group) => {
        const isOpen = openGroups[group.id] ?? true;
        return (
          <div key={group.id} className="space-y-1">
            {(!collapsed || isMobile) && (
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-[#667085] uppercase tracking-wider hover:text-[#172033]"
              >
                <span>{group.title}</span>
                {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>
            )}

            {(isOpen || collapsed) && (
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center rounded-lg text-xs font-medium transition-all ${
                        collapsed && !isMobile
                          ? 'justify-center p-2.5'
                          : 'justify-between px-2.5 py-2'
                      } ${
                        isActive
                          ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold shadow-2xs'
                          : 'text-[#344054] hover:bg-[#F9FAFB] hover:text-[#172033]'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-[#2563EB]' : 'text-[#667085]'
                          }`}
                        />
                        {(!collapsed || isMobile) && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {(!collapsed || isMobile) && item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                            item.badge === 'Cloud'
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'bg-[#F2F4F7] text-[#667085]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-[#E4E7EC] transition-all duration-200 z-10 select-none ${
          collapsed ? 'w-16' : 'w-60'
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 border-b border-[#E4E7EC] px-4 flex items-center justify-between">
          {!collapsed && (
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setScreen('dashboard')}
            >
              <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
                C
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-[#172033] tracking-tight leading-tight">
                  Compose AI
                </span>
                <span className="text-[10px] text-[#667085] leading-none">
                  Architectural Engine
                </span>
              </div>
            </div>
          )}

          {collapsed && (
            <div
              className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm mx-auto cursor-pointer"
              onClick={() => setScreen('dashboard')}
            >
              C
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`text-[#667085] hover:text-[#172033] p-1 rounded-md hover:bg-[#F2F4F7] transition-colors ${
              collapsed ? 'hidden' : 'block'
            }`}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Desktop Navigation Groups */}
        {renderNavList(false)}

        {/* Bottom Area */}
        <div className="p-3 border-t border-[#E4E7EC] bg-[#F9FAFB] space-y-2 text-xs">
          <button
            id="btn-sidebar-settings"
            onClick={() => setSettingsOpen(true)}
            className={`w-full flex items-center rounded-lg text-xs font-medium text-[#667085] hover:text-[#172033] hover:bg-white transition-colors ${
              collapsed ? 'justify-center p-2' : 'gap-2 px-2.5 py-1.5'
            }`}
            title="Project & AI Settings"
          >
            <Settings className="w-4 h-4 shrink-0 text-[#667085]" />
            {!collapsed && <span>Settings</span>}
          </button>

          {onOpenOnboarding && !collapsed && (
            <button
              onClick={onOpenOnboarding}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#2563EB] hover:bg-[#EEF4FF] transition-colors"
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-[#2563EB]" />
              <span>Beginner's Guide</span>
            </button>
          )}

          {!collapsed && (
            <div className="pt-2 border-t border-[#E4E7EC] space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E4E7EC]">
                <div className="min-w-0 pr-1">
                  <div className="text-[11px] font-semibold text-[#172033] truncate">
                    {project.identity.name}
                  </div>
                  <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Supabase DB Active</span>
                  </div>
                </div>
                <button
                  onClick={() => setScreen('projects')}
                  className="text-[10px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0"
                >
                  Switch
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer Header */}
            <div className="h-14 border-b border-[#E4E7EC] px-4 flex items-center justify-between">
              <div
                className="flex items-center gap-2"
                onClick={() => {
                  setScreen('dashboard');
                  setMobileNavOpen(false);
                }}
              >
                <div className="w-7 h-7 rounded-lg bg-[#2563EB] text-white flex items-center justify-center font-bold text-sm tracking-tight">
                  C
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-[#172033] tracking-tight leading-tight">
                    Compose AI
                  </span>
                  <span className="text-[10px] text-[#667085] leading-none">
                    Architectural Engine
                  </span>
                </div>
              </div>

              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1 rounded-md text-[#667085] hover:text-[#172033] hover:bg-[#F2F4F7]"
                aria-label="Close Navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Groups for Mobile */}
            {renderNavList(true)}

            {/* Bottom info in mobile drawer */}
            <div className="p-3 border-t border-[#E4E7EC] bg-[#F9FAFB] space-y-2">
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setMobileNavOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#667085] hover:text-[#172033] hover:bg-white"
              >
                <Settings className="w-4 h-4 text-[#667085]" />
                <span>Settings</span>
              </button>

              <div className="p-2 rounded-lg bg-white border border-[#E4E7EC]">
                <div className="text-[11px] font-semibold text-[#172033] truncate">
                  {project.identity.name}
                </div>
                <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Supabase DB Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
