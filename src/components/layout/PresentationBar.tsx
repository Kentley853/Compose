import React from 'react';
import { useProject, PRESENTATION_STEPS } from '../../context/ProjectContext';
import { ChevronLeft, ChevronRight, X, PlayCircle, Eye, Sparkles } from 'lucide-react';

export const PresentationBar: React.FC = () => {
  const {
    presentationMode,
    togglePresentationMode,
    presentationStep,
    currentStepInfo,
    nextPresentationStep,
    prevPresentationStep,
    goToPresentationStep,
  } = useProject();

  if (!presentationMode) return null;

  return (
    <div className="fixed top-14 left-64 right-0 z-40 bg-slate-900/95 border-b border-blue-500/30 backdrop-blur-md px-6 py-2.5 shadow-xl transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Step info & Speaker Cue */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono shrink-0">
            <PlayCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>STEP {presentationStep} / 10</span>
          </div>

          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-100 flex items-center gap-2 truncate">
              {currentStepInfo.title}
              <span className="hidden xl:inline text-slate-500 font-normal">•</span>
              <span className="hidden xl:inline text-xs font-normal text-slate-300 truncate">
                {currentStepInfo.investorObjective}
              </span>
            </div>
            <div className="text-[11px] text-blue-300/90 truncate flex items-center gap-1">
              <span className="font-mono text-[10px] uppercase text-slate-400">Speaker cue:</span>
              <span>{currentStepInfo.speakerCue}</span>
            </div>
          </div>
        </div>

        {/* Step jump dots / pills */}
        <div className="hidden lg:flex items-center gap-1 shrink-0">
          {PRESENTATION_STEPS.map((step) => (
            <button
              key={step.step}
              onClick={() => goToPresentationStep(step.step)}
              title={`${step.step}. ${step.title}`}
              className={`h-2 rounded-full transition-all ${
                step.step === presentationStep
                  ? 'w-6 bg-blue-400'
                  : step.step < presentationStep
                  ? 'w-2 bg-blue-600/70 hover:bg-blue-500'
                  : 'w-2 bg-slate-700 hover:bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Controls: Prev, Next, Exit */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="btn-pres-prev"
            onClick={prevPresentationStep}
            disabled={presentationStep === 1}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs disabled:opacity-40 disabled:pointer-events-none transition-colors border border-slate-700"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <button
            id="btn-pres-next"
            onClick={nextPresentationStep}
            disabled={presentationStep === PRESENTATION_STEPS.length}
            className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-sm"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            id="btn-pres-exit"
            onClick={togglePresentationMode}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-1"
            title="Exit Presentation Mode"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
