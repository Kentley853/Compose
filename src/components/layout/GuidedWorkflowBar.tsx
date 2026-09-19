import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { ScreenId } from '../../types/architecture';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';

interface StageDefinition {
  id: number;
  label: string;
  screenId: ScreenId;
  actionText: string;
}

export const WORKFLOW_STAGES: StageDefinition[] = [
  { id: 1, label: 'Project Setup', screenId: 'setup', actionText: 'Continue to Site Analysis' },
  { id: 2, label: 'Site & Plot', screenId: 'plot', actionText: 'Review Design Brief' },
  { id: 3, label: 'Design Brief', screenId: 'architect', actionText: 'Generate Floor Plan' },
  { id: 4, label: 'Floor Plan', screenId: 'floorplan', actionText: 'Open 2D Drawing' },
  { id: 5, label: '2D & 3D', screenId: 'coordinated2d', actionText: 'Review Compliance' },
  { id: 6, label: 'Review', screenId: 'compliance', actionText: 'View Cost Estimate' },
  { id: 7, label: 'Cost', screenId: 'boq', actionText: 'Export Project' },
  { id: 8, label: 'Export', screenId: 'deliverables', actionText: 'Finish & Package' },
];

export const GuidedWorkflowBar: React.FC<{ onOpenHelp?: () => void }> = ({ onOpenHelp }) => {
  const { currentScreen, setScreen, project, isAutosaving, autosaveTime } = useProject();

  // Determine which workflow step corresponds to the current screen
  const getActiveStepIndex = (): number => {
    switch (currentScreen) {
      case 'setup':
        return 0;
      case 'plot':
        return 1;
      case 'architect':
        return 2;
      case 'floorplan':
        return 3;
      case 'coordinated2d':
      case 'coordinated3d':
      case 'exterior':
        return 4;
      case 'compliance':
        return 5;
      case 'boq':
        return 6;
      case 'deliverables':
        return 7;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveStepIndex();
  const currentStage = WORKFLOW_STAGES[activeIndex];

  const handlePrev = () => {
    if (activeIndex > 0) {
      setScreen(WORKFLOW_STAGES[activeIndex - 1].screenId);
    }
  };

  const handleNext = () => {
    if (activeIndex < WORKFLOW_STAGES.length - 1) {
      setScreen(WORKFLOW_STAGES[activeIndex + 1].screenId);
    }
  };

  return (
    <div className="bg-white border-b border-[#E4E7EC] px-4 py-2.5 flex items-center justify-between gap-4 select-none shrink-0 shadow-xs z-20">
      {/* Left: Previous step button */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
            activeIndex === 0
              ? 'border-[#E4E7EC] text-[#667085]/50 cursor-not-allowed bg-[#F9FAFB]'
              : 'border-[#E4E7EC] text-[#172033] hover:bg-[#F9FAFB] hover:border-[#667085]/30'
          }`}
          title={activeIndex > 0 ? `Back to ${WORKFLOW_STAGES[activeIndex - 1].label}` : 'Start of workflow'}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="h-4 w-[1px] bg-[#E4E7EC] hidden sm:block" />

        <div className="hidden lg:flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#172033]">{project.identity.name}</span>
          <span className="text-[#667085]">•</span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#F9FAFB] border border-[#E4E7EC] text-[#667085]">
            {project.activeRevision}
          </span>
          <span className="text-[11px] text-[#667085] flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isAutosaving ? 'bg-[#2563EB] animate-pulse' : 'bg-[#12B76A]'}`} />
            {isAutosaving ? 'Saving...' : `Saved ${autosaveTime}`}
          </span>
        </div>
      </div>

      {/* Center: Simplified Progress Stages (showing current and adjacent) */}
      <div className="flex items-center gap-1 sm:gap-2">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isCurrent = idx === activeIndex;
          const isCompleted = idx < activeIndex;

          return (
            <button
              key={stage.id}
              onClick={() => setScreen(stage.screenId)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-xs transition-all ${
                isCurrent
                  ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold shadow-xs'
                  : isCompleted
                  ? 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
                  : 'text-[#667085]/60 hover:text-[#667085]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white'
                    : isCompleted
                    ? 'bg-[#12B76A] text-white'
                    : 'bg-[#E4E7EC] text-[#667085]'
                }`}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : stage.id}
              </span>
              <span className={`hidden md:inline ${isCurrent ? 'text-[#2563EB]' : ''}`}>{stage.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right: Continue primary action button and Help */}
      <div className="flex items-center gap-2">
        {onOpenHelp && (
          <button
            onClick={onOpenHelp}
            className="p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] border border-transparent hover:border-[#E4E7EC] transition-colors"
            title="Workflow Guide & Terms"
            aria-label="Workflow Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={activeIndex === WORKFLOW_STAGES.length - 1}
          className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
            activeIndex === WORKFLOW_STAGES.length - 1
              ? 'bg-[#12B76A] hover:bg-[#0E9355] text-white'
              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
          }`}
        >
          <span>{currentStage.actionText}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
