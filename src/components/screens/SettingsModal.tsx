import React from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  X,
  Sliders,
  RotateCcw,
  Cpu,
  Shield,
  HelpCircle,
  FileText,
  Info,
  Building,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const { settingsOpen, setSettingsOpen, resetDemo, demoMode, setDemoMode, addToast } = useProject();

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88dvh] overflow-y-auto overscroll-contain p-4 sm:p-6 pb-safe space-y-5 text-xs text-slate-300 relative animate-in slide-sheet sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white text-sm">Studio Preferences & Specifications</span>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: AI Reasoning & Engine */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Reasoning Architecture</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3">
              <span className="text-slate-200 font-medium">Server-Side Gemini Model:</span>
              <span className="font-mono text-blue-400 break-all sm:text-right">gemini-3.8-flash</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3">
              <span className="text-slate-400">Security:</span>
              <span className="text-emerald-400 font-mono break-all sm:text-right">
                Server-side proxy (/api/gemini/architect)
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-3">
              <span className="text-slate-400">Fallback Engine:</span>
              <span className="text-slate-300 font-mono sm:text-right">
                Deterministic Architectural Rulebase
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Demo Mode Control */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Demo Reliability Settings</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-slate-200 font-medium">Deterministic Investor Demo Mode</div>
              <div className="text-[10px] text-slate-400">
                Guarantees sub-second latency and zero external network fragility during investor pitches.
              </div>
            </div>
            <button
              onClick={() => {
                setDemoMode(!demoMode);
                addToast('Demo Mode', `Investor demo resilience mode ${!demoMode ? 'enabled' : 'disabled'}.`, 'info');
              }}
              className={`shrink-0 self-start xs:self-auto px-3 py-1.5 rounded font-mono text-xs transition-colors ${
                demoMode
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {demoMode ? 'ACTIVE' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Section 3: Reset Workspace */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Demo Workspace</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col xs:flex-row xs:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-slate-200 font-medium">Restore Pristine Jakarta Demo</div>
              <div className="text-[10px] text-slate-400">
                Clears modified rooms, restores initial 15m × 24m geometry and resets revisions.
              </div>
            </div>
            <button
              onClick={() => {
                resetDemo();
                setSettingsOpen(false);
              }}
              className="shrink-0 self-start xs:self-auto px-3 py-1.5 rounded bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-medium transition-colors whitespace-nowrap"
            >
              Reset Demo
            </button>
          </div>
        </div>

        {/* Product Boundary Note */}
        <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed font-mono">
          Product Boundary Notice: Compose AI is an architectural concept platform for pre-feasibility and conceptual planning. Outputs require formal review by qualified licensed professionals.
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setSettingsOpen(false)}
            className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
