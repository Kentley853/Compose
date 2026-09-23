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
    demoMode,
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
        { id: 'setup', label: 'Projects & Ingestion', icon: FolderKanban },
      ],
    },
    {
      id: 'design',
      title: 'Design Workspace',
      items: [
        { id: 'plot', label: 'Site & Plot', icon: Compass },
        { id: 'architect', label: 'AI Architect', icon: Bot, badge: 'Active' },
        { id: 'floorplan', label: 'Floor Plan', icon: Grid3X3 },
        { id: 'coordinated2d', label: '2D Drawing', icon: FileCode2 },
        { id: 'coordinated3d', label: '3D Model', icon: Box },
        { id: 'exterior', label: 'Exterior', icon: Palette },
      ],
    },
    {
      id: 'review',
      title: 'Review',
      items: [
        { id: 'compliance', label: 'Compliance', icon: ShieldCheck, badge: '4 Signals' },
        { id: 'boq', label: 'BOQ & Cost', icon: Calculator },
        { id: 'deliverables', label: 'Deliverables & Export', icon: FileSpreadsheet },
      ],
    },
    {
      id: 'workspace',
      title: 'Workspace',
      items: [
        { id: 'files', label: 'Files', icon: FolderArchive, badge: `${project.uploads.length}` },
        { id: 'activity', label: 'Activity', icon: History },
      ],
    },
  ];

  const handleNavItemClick = (screenId: ScreenId) => {
    setScreen(screenId);
    setMobileNavOpen(false);
  };

  // Nav list rendering for both desktop and mobile drawer
  const renderNavList = (isMobileDrawer: boolean) => (
    <div className={`flex-1 overflow-y-auto ${isMobileDrawer ? 'px-3 py-3 space-y-4' : 'px-2 py-3 space-y-4'}`}>
      {navGroups.map((group) => {
        const isOpen = openGroups[group.id] !== false;

        return (
          <div key={group.id} className="space-y-1">
            {!collapsed || isMobileDrawer ? (
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#667085] uppercase hover:text-[#172033] transition-colors"
              >
                <span>{group.title}</span>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#667085]" />
                )}
              </button>
            ) : (
              <div className="h-[1px] bg-[#E4E7EC] my-2 mx-2" />
            )}

            {/* Group items */}
            {(isOpen || (collapsed && !isMobileDrawer)) &&
              group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentScreen === item.id;

                return (
                  <div key={item.id} className="relative group/nav">
                    <button
                      id={`nav-${item.id}${isMobileDrawer ? '-mobile' : ''}`}
                      onClick={() => handleNavItemClick(item.id)}
                      className={`w-full flex items-center rounded-lg text-xs font-medium transition-all ${
                        isMobileDrawer
                          ? 'justify-between px-3 py-2.5 min-h-[44px]'
                          : collapsed
                          ? 'justify-center p-2.5'
                          : 'justify-between px-2.5 py-2'
                      } ${
                        isActive
                          ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold shadow-xs'
                          : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
                      }`}
                      title={collapsed && !isMobileDrawer ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isActive ? 'text-[#2563EB]' : 'text-[#667085]'
                          }`}
                        />
                        {(!collapsed || isMobileDrawer) && <span className="truncate">{item.label}</span>}
                      </div>

                      {(!collapsed || isMobileDrawer) && item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-[#2563EB]/10 text-[#2563EB]'
                              : 'bg-[#F9FAFB] text-[#667085] border border-[#E4E7EC]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Tooltip on collapsed desktop state */}
                    {collapsed && !isMobileDrawer && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#172033] text-white text-xs rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity z-50">
                        {item.label}
                        {item.badge && ` (${item.badge})`}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {/* 1. Mobile Drawer Overlay & Slide-over Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop overlay */}
          <div
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            aria-hidden="true"
          />

          {/* Slide-over menu panel */}
          <div className="relative w-[280px] max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            {/* Mobile Header with Close Button */}
            <div className="h-14 px-4 border-b border-[#E4E7EC] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
                  <span className="font-bold text-xs tracking-wider">C</span>
                </div>
                <div>
                  <div className="text-sm font-bold tracking-tight text-[#172033] flex items-center gap-1.5">
                    Compose <span className="text-[#2563EB] text-xs font-semibold">AI</span>
                  </div>
                  <div className="text-[10px] text-[#667085]">Architectural Studio</div>
                </div>
              </div>

              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-10 h-10 min-h-[44px] min-w-[44px] rounded-lg text-[#667085] hover:text-[#172033] flex items-center justify-center hover:bg-[#F9FAFB]"
                aria-label="Close Navigation Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation items for Mobile */}
            {renderNavList(true)}

            {/* Mobile Drawer Footer */}
            <div className="p-3 border-t border-[#E4E7EC] bg-[#F9FAFB] space-y-2 text-xs shrink-0">
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setMobileNavOpen(false);
                }}
                className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#667085] hover:text-[#172033] hover:bg-white transition-colors"
              >
                <Settings className="w-4 h-4 shrink-0 text-[#667085]" />
                <span>Project & AI Settings</span>
              </button>

              {onOpenOnboarding && (
                <button
                  onClick={() => {
                    onOpenOnboarding();
                    setMobileNavOpen(false);
                  }}
                  className="w-full min-h-[44px] flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-[#2563EB] hover:bg-[#EEF4FF] transition-colors"
                >
                  <HelpCircle className="w-4 h-4 shrink-0 text-[#2563EB]" />
                  <span>Beginner's Guide</span>
                </button>
              )}

              <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#172033] truncate">
                    {demoMode ? 'Jakarta Residence' : project.identity.name}
                  </div>
                  <div className="text-[10px] text-[#667085] flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${demoMode ? 'bg-[#F79009]' : 'bg-[#12B76A]'}`}
                    />
                    <span>{demoMode ? 'Demo Project' : 'Live MVP'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Desktop Sticky Sidebar (hidden on mobile) */}
      <aside
        className={`hidden md:flex border-r border-[#E4E7EC] bg-white flex-col h-screen shrink-0 sticky top-0 transition-all duration-200 select-none z-30 ${
          collapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
      >
        {/* Brand & Toggle Header */}
        <div className="h-14 px-3.5 border-b border-[#E4E7EC] flex items-center justify-between">
          {!collapsed ? (
            <button
              onClick={() => setScreen('dashboard')}
              className="flex items-center gap-2 text-left group"
              title="Compose AI Home"
            >
              <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
                <span className="font-bold text-xs tracking-wider">C</span>
              </div>
              <div>
                <div className="text-sm font-bold tracking-tight text-[#172033] flex items-center gap-1.5">
                  Compose <span className="text-[#2563EB] text-xs font-semibold">AI</span>
                </div>
                <div className="text-[10px] text-[#667085] leading-none">Architectural Studio</div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => setScreen('dashboard')}
              className="w-8 h-8 mx-auto rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-xs"
              title="Compose AI Home"
            >
              <span className="font-bold text-xs">C</span>
            </button>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#667085] hover:text-[#172033] p-1.5 rounded-md hover:bg-[#F9FAFB] transition-colors"
            title={collapsed ? 'Expand sidebar (240px)' : 'Collapse sidebar (72px)'}
            aria-label="Toggle Sidebar"
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
            <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-xs font-medium text-[#172033] truncate">
                  {demoMode ? 'Jakarta Residence' : project.identity.name}
                </div>
                <div className="text-[10px] text-[#667085] flex items-center gap-1">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${demoMode ? 'bg-[#F79009]' : 'bg-[#12B76A]'}`}
                  />
                  <span>{demoMode ? 'Demo Project' : 'Live MVP'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
