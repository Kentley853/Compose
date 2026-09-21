import React, { useEffect, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ScreenId } from '../../types/architecture';
import { ArrowRight, ArrowLeft, Check, HelpCircle } from 'lucide-react';

interface StageDefinition {
  id: number;
  label: string;
  screenId: ScreenId;
  actionText: string;
  /** Abbreviated label for the phone-width stepper. */
  shortText: string;
}

export const WORKFLOW_STAGES: StageDefinition[] = [
  { id: 1, label: 'Project Setup', screenId: 'setup', actionText: 'Continue to Site Analysis', shortText: 'Site' },
  { id: 2, label: 'Site & Plot', screenId: 'plot', actionText: 'Review Design Brief', shortText: 'Brief' },
  { id: 3, label: 'Design Brief', screenId: 'architect', actionText: 'Generate Floor Plan', shortText: 'Plan' },
  { id: 4, label: 'Floor Plan', screenId: 'floorplan', actionText: 'Open 2D Drawing', shortText: '2D' },
  { id: 5, label: '2D & 3D', screenId: 'coordinated2d', actionText: 'Review Compliance', shortText: 'Review' },
  { id: 6, label: 'Review', screenId: 'compliance', actionText: 'View Cost Estimate', shortText: 'Cost' },
  { id: 7, label: 'Cost', screenId: 'boq', actionText: 'Export Project', shortText: 'Export' },
  { id: 8, label: 'Export', screenId: 'deliverables', actionText: 'Finish & Package', shortText: 'Finish' },
];

export const GuidedWorkflowBar: React.FC<{ onOpenHelp?: () => void }> = ({ onOpenHelp }) => {
  const { currentScreen, setScreen, project, isAutosaving, autosaveTime } = useProject();
  const stepsRef = useRef<HTMLDivElement | null>(null);

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

  // On narrow screens the stepper scrolls; keep the active step in view.
  useEffect(() => {
    const container = stepsRef.current;
    const active = container?.querySelector<HTMLElement>('[data-active="true"]');
    if (!container || !active) return;

    const overflows = container.scrollWidth > container.clientWidth + 1;
    if (!overflows) return;

    container.scrollTo({
      left: active.offsetLeft - (container.clientWidth - active.offsetWidth) / 2,
      behavior: 'smooth',
    });
  }, [activeIndex]);

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

  const isLastStage = activeIndex === WORKFLOW_STAGES.length - 1;

  return (
    <div
      data-print-hide
      className="bg-white border-b border-[#E4E7EC] px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 select-none shrink-0 shadow-xs z-20"
    >
      {/* Left: Previous step button */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          aria-label="Previous step"
          className={`tap px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            activeIndex === 0
              ? 'border-[#E4E7EC] text-[#667085]/50 cursor-not-allowed bg-[#F9FAFB]'
              : 'border-[#E4E7EC] text-[#172033] hover:bg-[#F9FAFB] hover:border-[#667085]/30'
          }`}
          title={activeIndex > 0 ? `Back to ${WORKFLOW_STAGES[activeIndex - 1].label}` : 'Start of workflow'}
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">Back</span>
        </button>

        <div className="h-4 w-px bg-[#E4E7EC] hidden xl:block" />

        <div className="hidden xl:flex items-center gap-2 text-xs min-w-0">
          <span className="font-semibold text-[#172033] truncate max-w-[12rem]">
            {project.identity.name}
          </span>
          <span className="text-[#667085]">•</span>
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#F9FAFB] border border-[#E4E7EC] text-[#667085]">
            {project.activeRevision}
          </span>
          <span className="text-[11px] text-[#667085] flex items-center gap-1 whitespace-nowrap">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isAutosaving ? 'bg-[#2563EB] animate-pulse' : 'bg-[#12B76A]'
              }`}
            />
            {isAutosaving ? 'Saving...' : `Saved ${autosaveTime}`}
          </span>
        </div>
      </div>

      {/* Center: Progress stages — scrolls horizontally when space runs out */}
      <div
        ref={stepsRef}
        role="tablist"
        aria-label="Workflow progress"
        className="flex-1 min-w-0 flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar overscroll-x-contain scroll-smooth justify-start lg:justify-center py-0.5"
      >
        {WORKFLOW_STAGES.map((stage, idx) => {
          const isCurrent = idx === activeIndex;
          const isCompleted = idx < activeIndex;

          return (
            <button
              key={stage.id}
              role="tab"
              aria-selected={isCurrent}
              data-active={isCurrent}
              onClick={() => setScreen(stage.screenId)}
              title={stage.label}
              className={`shrink-0 flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1.5 rounded-md text-xs transition-all ${
                isCurrent
                  ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold shadow-xs'
                  : isCompleted
                  ? 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
                  : 'text-[#667085]/60 hover:text-[#667085]'
              }`}
            >
              <span
                className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent
                    ? 'bg-[#2563EB] text-white'
                    : isCompleted
                    ? 'bg-[#12B76A] text-white'
                    : 'bg-[#E4E7EC] text-[#667085]'
                }`}
              >
                {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : stage.id}
              </span>
              {/* Only the active step is labelled on phones, so all eight
                  markers stay visible without a cramped scroll. */}
              <span className={`${isCurrent ? 'inline' : 'hidden'} lg:inline whitespace-nowrap`}>
                {stage.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right: Continue primary action button and Help */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {onOpenHelp && (
          <button
            onClick={onOpenHelp}
            className="tap hidden sm:flex items-center justify-center p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB] border border-transparent hover:border-[#E4E7EC] transition-colors"
            title="Workflow Guide & Terms"
            aria-label="Workflow Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handleNext}
          disabled={isLastStage}
          aria-label={currentStage.actionText}
          className={`tap px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs ${
            isLastStage
              ? 'bg-[#12B76A] hover:bg-[#0E9355] text-white'
              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
          }`}
          title={currentStage.actionText}
        >
          {/* Full call-to-action on desktop, abbreviated on small screens. */}
          <span className="hidden lg:inline whitespace-nowrap">{currentStage.actionText}</span>
          <span className="lg:hidden whitespace-nowrap">{currentStage.shortText}</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
    </div>
  );
};
