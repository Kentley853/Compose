import React, { useEffect, useRef, useState } from 'react';
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
  X,
  HelpCircle,
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

interface SidebarProps {
  /** Below `lg` the sidebar renders as an overlay drawer instead of a column. */
  isDrawer?: boolean;
  /** Drawer visibility. Ignored in column mode. */
  open?: boolean;
  onClose?: () => void;
  onOpenOnboarding?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDrawer = false,
  open = false,
  onClose,
  onOpenOnboarding,
}) => {
  const { currentScreen, setScreen, setSettingsOpen, project, demoMode } = useProject();

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    home: true,
    design: true,
    review: true,
    workspace: true,
  });

  const panelRef = useRef<HTMLElement | null>(null);

  // A drawer is always fully expanded — an icon rail inside an overlay is
  // just a narrow overlay, which reads as broken on a phone.
  const isCollapsed = collapsed && !isDrawer;

  // Move focus into the drawer when it opens so keyboard and screen-reader
  // users land on the navigation rather than behind the scrim.
  useEffect(() => {
    if (!isDrawer || !open) return;
    const firstControl = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    firstControl?.focus({ preventScroll: true });
  }, [isDrawer, open]);

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const go = (id: ScreenId) => {
    setScreen(id);
    if (isDrawer) onClose?.();
  };

  const navGroups: NavGroup[] = [
    {
      id: 'home',
      title: 'Home',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'setup', label: 'Projects', icon: FolderKanban },
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
        { id: 'deliverables', label: 'Deliverables', icon: FileSpreadsheet },
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

  const widthClass = isDrawer
    ? 'w-[min(84vw,20rem)]'
    : isCollapsed
    ? 'w-[72px]'
    : 'w-[200px] xl:w-[240px]';

  const positionClass = isDrawer
    ? `fixed inset-y-0 left-0 z-50 shadow-2xl pl-safe ${
        open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`
    : 'sticky top-0 shrink-0';

  return (
    <aside
      ref={panelRef}
      id="app-sidebar"
      aria-label="Primary navigation"
      aria-hidden={isDrawer && !open}
      inert={isDrawer && !open ? true : undefined}
      className={`border-r border-[#E4E7EC] bg-white flex flex-col h-app select-none
        transition-transform lg:transition-[width] duration-200 ease-out will-change-transform
        ${widthClass} ${positionClass}`}
    >
      {/* Brand & Toggle Header */}
      <div className="h-14 shrink-0 px-3.5 border-b border-[#E4E7EC] flex items-center justify-between gap-2">
        {!isCollapsed ? (
          <button
            onClick={() => go('dashboard')}
            className="flex items-center gap-2 text-left group min-w-0"
            title="Compose AI Home"
          >
            <div className="w-7 h-7 shrink-0 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-xs">
              <span className="font-bold text-xs tracking-wider">C</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold tracking-tight text-[#172033] flex items-center gap-1.5">
                Compose <span className="text-[#2563EB] text-xs font-semibold">AI</span>
              </div>
              <div className="text-[10px] text-[#667085] leading-none truncate">
                Architectural Studio
              </div>
            </div>
          </button>
        ) : (
          <button
            onClick={() => go('dashboard')}
            className="w-8 h-8 mx-auto rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-xs"
            title="Compose AI Home"
          >
            <span className="font-bold text-xs">C</span>
          </button>
        )}

        {isDrawer ? (
          <button
            onClick={onClose}
            className="tap text-[#667085] hover:text-[#172033] p-2 rounded-md hover:bg-[#F9FAFB] transition-colors shrink-0"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#667085] hover:text-[#172033] p-1.5 rounded-md hover:bg-[#F9FAFB] transition-colors shrink-0"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle Sidebar"
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto overscroll-contain px-2 py-3 space-y-4">
        {navGroups.map((group) => {
          const isOpen = openGroups[group.id] !== false;

          return (
            <div key={group.id} className="space-y-0.5">
              {!isCollapsed ? (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-[#667085] uppercase hover:text-[#172033] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span>{group.title}</span>
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#667085]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#667085]" />
                  )}
                </button>
              ) : (
                <div className="h-px bg-[#E4E7EC] my-2 mx-2" />
              )}

              {/* Group items (shown if expanded or collapsed) */}
              {(isOpen || isCollapsed) &&
                group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentScreen === item.id;

                  return (
                    <div key={item.id} className="relative group/nav">
                      <button
                        id={`nav-${item.id}`}
                        onClick={() => go(item.id)}
                        aria-current={isActive ? 'page' : undefined}
                        className={`w-full flex items-center rounded-lg text-xs font-medium transition-all ${
                          isCollapsed
                            ? 'justify-center p-2.5'
                            : `justify-between px-2.5 ${isDrawer ? 'py-2.5' : 'py-2'}`
                        } ${
                          isActive
                            ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold shadow-xs'
                            : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] active:bg-[#F2F4F7]'
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-[#2563EB]' : 'text-[#667085]'
                            }`}
                          />
                          {!isCollapsed && (
                            <span className={`truncate ${isDrawer ? 'text-[13px]' : ''}`}>
                              {item.label}
                            </span>
                          )}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-[#2563EB]/10 text-[#2563EB]'
                                : 'bg-[#F9FAFB] text-[#667085] border border-[#E4E7EC]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>

                      {/* Hover tooltip for the collapsed desktop rail. Hidden on
                          touch devices, where there is no hover state. */}
                      {isCollapsed && (
                        <div className="hidden [@media(hover:hover)]:block absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-[#172033] text-white text-xs rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover/nav:opacity-100 transition-opacity z-50">
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
      </nav>

      {/* Bottom Area: Settings, Help, and Active Project Info */}
      <div className="shrink-0 p-3 pb-safe border-t border-[#E4E7EC] bg-[#F9FAFB] space-y-2 text-xs">
        <button
          id="btn-sidebar-settings"
          onClick={() => {
            setSettingsOpen(true);
            if (isDrawer) onClose?.();
          }}
          className={`w-full flex items-center rounded-lg text-xs font-medium text-[#667085] hover:text-[#172033] hover:bg-white transition-colors ${
            isCollapsed ? 'justify-center p-2' : 'gap-2 px-2.5 py-2'
          }`}
          title="Project & AI Settings"
        >
          <Settings className="w-4 h-4 shrink-0 text-[#667085]" />
          {!isCollapsed && <span>Settings</span>}
        </button>

        {onOpenOnboarding && !isCollapsed && (
          <button
            onClick={() => {
              onOpenOnboarding();
              if (isDrawer) onClose?.();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#2563EB] hover:bg-[#EEF4FF] transition-colors"
          >
            <HelpCircle className="w-4 h-4 shrink-0 text-[#2563EB]" />
            <span>Beginner's Guide</span>
          </button>
        )}

        {/* User / Mode badge */}
        {!isCollapsed && (
          <div className="pt-2 border-t border-[#E4E7EC] flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#172033] truncate">
                {demoMode ? 'Jakarta Residence' : project.identity.name}
              </div>
              <div className="text-[10px] text-[#667085] flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 shrink-0 rounded-full ${
                    demoMode ? 'bg-[#F79009]' : 'bg-[#12B76A]'
                  }`}
                />
                <span className="truncate">{demoMode ? 'Demo Project' : 'Live MVP'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
