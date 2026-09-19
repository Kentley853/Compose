import React, { useState } from 'react';
import {
  Sparkles,
  FolderPlus,
  Compass,
  FileText,
  Grid3X3,
  Box,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const ONBOARDING_STEPS = [
  {
    step: 1,
    title: 'Create your project',
    subtitle: 'Start with a clean slate or choose a curated architectural sample',
    description:
      'Set project location, client details, and initial building type. Work in Live MVP Mode with your own data or explore Demo Mode with the completed Jakarta Urban Residence.',
    icon: FolderPlus,
    tip: 'Switch anytime between Live MVP and Demo Project from the top bar.',
  },
  {
    step: 2,
    title: 'Add site information and files',
    subtitle: 'Define plot boundaries, orientation, and upload site documents',
    description:
      'Enter parcel dimensions, road frontages, and setbacks. Drop your site surveys, CAD drawings, sketches, or PDF briefs. The engine calculates buildable envelopes deterministically.',
    icon: Compass,
    tip: 'Supported formats include DWG, DXF, PDF, PNG, JPG, and CSV up to 25MB.',
  },
  {
    step: 3,
    title: 'Review the AI-generated architectural brief',
    subtitle: 'Collaborate with the AI Architect to clarify programmatic requirements',
    description:
      'Engage in strategic architectural dialogue to uncover functional priorities—like ground-floor elder access, service kitchen separation, and passive tropical ventilation paths.',
    icon: FileText,
    tip: 'All assumptions are clearly documented with professional review reminders.',
  },
  {
    step: 4,
    title: 'Generate and refine your concept',
    subtitle: 'Evaluate 3 distinct spatial layouts and customize room geometry',
    description:
      'Compare spatial alternatives for daylight exposure, privacy, and circulation efficiency. Click any room on the interactive floor plan to resize walls or inspect environmental scores.',
    icon: Grid3X3,
    tip: 'Adjusting room dimensions automatically updates coordinated 2D plans and 3D models.',
  },
  {
    step: 5,
    title: 'Review 2D, 3D, compliance & estimated cost',
    subtitle: 'Inspect coordinated CAD drawings, WebGL massing, and preliminary BOQ',
    description:
      'View coordinated 2D plans with toggleable structural grids, orbit the 3D model under dynamic solar angles, check regional statutory limits, and review material trade quantities.',
    icon: Box,
    tip: 'All checks clearly indicate responsible disciplines (Architect, Structural Engineer, MEP).',
  },
  {
    step: 6,
    title: 'Export your project package',
    subtitle: 'Download complete architectural dossiers, CAD, BOQ, and ZIP archives',
    description:
      'Produce client-ready PDF presentation booklets, vector DXF CAD plans, CSV spreadsheets, and a complete ZIP project archive containing all project files and manifests.',
    icon: CheckCircle2,
    tip: 'One-click ZIP download bundles all approved briefs, drawings, and cost schedules.',
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const stepData = ONBOARDING_STEPS[currentStep - 1];
  const Icon = stepData.icon;

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('compose_ai_onboarding_completed', 'true');
    }
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#E4E7EC] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-[#E4E7EC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center text-xs font-bold font-mono">
              {currentStep}/6
            </span>
            <span className="text-xs font-medium text-[#667085] uppercase tracking-wider">
              Quick Guide • Step {currentStep} of 6
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#667085] hover:text-[#172033] p-1 rounded-md hover:bg-[#F9FAFB] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1">
          <div className="w-12 h-12 rounded-xl bg-[#EEF4FF] border border-[#2563EB]/20 text-[#2563EB] flex items-center justify-center mb-4">
            <Icon className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-[#172033] tracking-tight">{stepData.title}</h2>
          <p className="text-sm font-medium text-[#2563EB] mt-0.5">{stepData.subtitle}</p>
          <p className="text-sm text-[#667085] mt-3 leading-relaxed">{stepData.description}</p>

          <div className="mt-4 p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-xs text-[#667085] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span>
              <strong className="text-[#172033]">Pro-tip:</strong> {stepData.tip}
            </span>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {ONBOARDING_STEPS.map((s) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`h-1.5 rounded-full transition-all ${
                  s.step === currentStep ? 'w-6 bg-[#2563EB]' : 'w-2 bg-[#E4E7EC] hover:bg-[#667085]'
                }`}
                aria-label={`Go to step ${s.step}`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E4E7EC] flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-[#667085] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-[#E4E7EC] text-[#2563EB] focus:ring-[#2563EB]"
            />
            <span>Do not show again</span>
          </label>

          <div className="flex items-center gap-2">
            {currentStep > 1 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] text-xs font-medium text-[#667085] hover:bg-white transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] text-xs font-medium text-[#667085] hover:bg-white transition-colors"
              >
                Skip
              </button>
            )}

            {currentStep < 6 ? (
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
              >
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-4 py-1.5 rounded-lg bg-[#12B76A] hover:bg-[#0E9355] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1"
              >
                Get Started <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
