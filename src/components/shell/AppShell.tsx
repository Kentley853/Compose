import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  FolderKanban,
  Home,
  Images,
  LayoutTemplate,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { ComposeLogo } from '../brand/ComposeLogo';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { ToastContainer } from '../common/Toast';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Home', icon: Home },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/designs', label: 'My Designs', icon: Sparkles },
  { to: '/inspiration', label: 'Inspiration', icon: Images },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/tools', label: 'AI Tools', icon: Sparkles },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const AppShell: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toasts, createNewProject, setMobileNavOpen } = useProject();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const email = user?.email || 'Signed in';
  const initial = email.slice(0, 1).toUpperCase();

  const startProject = async () => {
    setCreating(true);
    try {
      await createNewProject('Untitled architectural project');
    } catch {
      navigate('/projects');
    } finally {
      setCreating(false);
    }
  };

  const navLinks = (onNavigate?: () => void) =>
    NAV_ITEMS.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium ${
              isActive ? 'bg-[#F1EDFF] text-[#6546F5]' : 'text-[#344054] hover:bg-[#F8F9FC]'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      );
    });

  return (
    <div className="min-h-[100dvh] bg-[#F6F7FB] text-[#172033]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#E7E9F2] bg-white px-4 py-4 lg:flex">
        <ComposeLogo />
        <nav className="mt-6 flex flex-1 flex-col gap-1">{navLinks()}</nav>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-left text-sm text-[#344054] hover:bg-[#F8F9FC]"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F1EDFF] text-xs font-semibold text-[#6546F5]">
            {initial}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{email}</span>
            <span className="block text-xs text-[#667085]">Sign out</span>
          </span>
          <LogOut className="h-4 w-4 text-[#667085]" />
        </button>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-[#172033]/40" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />
          <div className="relative flex h-full w-[min(100%,300px)] flex-col bg-white p-4">
            <div className="flex items-center justify-between">
              <ComposeLogo />
              <button className="grid h-11 w-11 place-items-center" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-6 flex flex-col gap-1">{navLinks(() => setDrawerOpen(false))}</nav>
          </div>
        </div>
      )}

      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-[#E7E9F2] bg-white/90 px-4 backdrop-blur">
          <button className="grid h-11 w-11 place-items-center rounded-xl lg:hidden" onClick={() => { setDrawerOpen(true); setMobileNavOpen(true); }} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={startProject}
            disabled={creating}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#6546F5] px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
          <button className="relative grid h-11 w-11 place-items-center rounded-full border border-[#E7E9F2]" onClick={() => setNotesOpen((open) => !open)} aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </button>
          <button className="grid h-11 w-11 place-items-center rounded-full bg-[#F1EDFF] text-sm font-semibold text-[#6546F5]" onClick={() => setMenuOpen((open) => !open)} aria-label="Account menu">
            {initial}
          </button>
          {notesOpen && (
            <div className="absolute right-4 top-16 w-[min(100vw-2rem,320px)] rounded-2xl border border-[#E7E9F2] bg-white p-4 shadow-lg">
              <div className="text-sm font-semibold">Notifications</div>
              {toasts.length === 0 ? (
                <p className="mt-2 text-sm text-[#667085]">No notifications.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {toasts.map((toast) => (
                    <li key={toast.id} className="text-sm">
                      <div className="font-medium">{toast.title}</div>
                      <div className="text-[#667085]">{toast.message}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {menuOpen && (
            <div className="absolute right-4 top-16 w-56 rounded-2xl border border-[#E7E9F2] bg-white p-2 shadow-lg">
              <div className="truncate px-3 py-2 text-sm text-[#667085]">{email}</div>
              <button className="flex min-h-11 w-full items-center rounded-xl px-3 text-sm hover:bg-[#F8F9FC]" onClick={() => { setMenuOpen(false); navigate('/settings'); }}>
                Settings
              </button>
              <button className="flex min-h-11 w-full items-center rounded-xl px-3 text-sm hover:bg-[#F8F9FC]" onClick={() => signOut()}>
                Sign out
              </button>
            </div>
          )}
        </header>
        <main className="px-4 py-6 pb-24 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[#E7E9F2] bg-white lg:hidden">
        {[
          NAV_ITEMS[0],
          NAV_ITEMS[1],
          NAV_ITEMS[2],
          NAV_ITEMS[5],
          NAV_ITEMS[7],
        ].map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center text-[11px] ${isActive ? 'text-[#6546F5]' : 'text-[#667085]'}`}>
              <Icon className="h-4 w-4" />
              {item.label.replace('My ', '')}
            </NavLink>
          );
        })}
      </nav>
      <ToastContainer />
    </div>
  );
};
