import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { ScreenId } from '../../types/architecture';
import { LayoutDashboard, Bot, Grid3X3, Box, FileSpreadsheet } from 'lucide-react';

interface Tab {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Screens that should light this tab up, beyond `id` itself. */
  aliases?: ScreenId[];
}

/** The five steps worth reaching in one thumb tap on a phone. */
const TABS: Tab[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, aliases: ['setup'] },
  { id: 'architect', label: 'Brief', icon: Bot, aliases: ['plot'] },
  { id: 'floorplan', label: 'Plan', icon: Grid3X3 },
  { id: 'coordinated3d', label: '3D', icon: Box, aliases: ['coordinated2d', 'exterior'] },
  { id: 'deliverables', label: 'Export', icon: FileSpreadsheet, aliases: ['boq', 'compliance'] },
];

/**
 * Thumb-reachable bottom navigation, phones only.
 *
 * It participates in the shell's flex column rather than floating, so it can
 * never cover content, and it pads itself past the iOS home indicator.
 */
export const MobileTabBar: React.FC = () => {
  const { currentScreen, setScreen, presentationMode } = useProject();

  // Presentation mode is a full-bleed walkthrough; chrome would spoil it.
  if (presentationMode) return null;

  return (
    <nav
      aria-label="Quick navigation"
      data-print-hide
      className="sm:hidden shrink-0 border-t border-[#E4E7EC] bg-white/95 backdrop-blur-md pb-safe z-30"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentScreen === tab.id || (tab.aliases?.includes(currentScreen) ?? false);

          return (
            <li key={tab.id}>
              <button
                onClick={() => setScreen(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-[3.25rem] flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 transition-colors active:bg-[#F2F4F7] ${
                  isActive ? 'text-[#2563EB]' : 'text-[#667085]'
                }`}
              >
                <span
                  className={`flex items-center justify-center w-9 h-6 rounded-full transition-colors ${
                    isActive ? 'bg-[#EEF4FF]' : 'bg-transparent'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                </span>
                <span className={`text-[10px] leading-none ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
