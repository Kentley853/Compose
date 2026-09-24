import React from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  X,
  Sliders,
  Database,
  Cpu,
  Shield,
  HelpCircle,
  FileText,
  Info,
  Building,
  Save,
  CheckCircle2,
} from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const {
    settingsOpen,
    setSettingsOpen,
    saveCurrentProjectNow,
    autosaveStatus,
    autosaveTime,
    addToast,
  } = useProject();

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto overscroll-contain">
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-xl shadow-2xl max-w-lg w-full max-h-[92dvh] sm:max-h-[88dvh] overflow-y-auto overscroll-contain p-4 sm:p-6 pb-safe space-y-5 text-xs text-slate-300 relative animate-in slide-sheet sm:zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-white text-sm">Company Studio Settings</span>
          </div>
          <button
            onClick={() => setSettingsOpen(false)}
            className="p-1 text-slate-500 hover:text-slate-300 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Supabase PostgreSQL Persistence */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Database & Cloud Storage</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-medium">Supabase Database:</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active PostgreSQL
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Private Storage Bucket:</span>
              <span className="font-mono text-blue-400">project-files</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Autosave Engine:</span>
              <span className="text-slate-300 font-mono">1.2s delay • {autosaveStatus === 'saved' ? `Saved at ${autosaveTime}` : autosaveStatus}</span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={async () => {
                  await saveCurrentProjectNow();
                  addToast('Manual Save', 'Project synced immediately to Supabase.', 'success');
                }}
                className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Project Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: AI Reasoning & Engine */}
        <div className="space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Reasoning & Webhook Engine</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-200 font-medium">Model:</span>
              <span className="font-mono text-blue-400">gemini-2.5-flash</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Security:</span>
              <span className="text-emerald-400 font-mono">
                Server-side proxy (/api/gemini/architect)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reporting Webhook:</span>
              <span className="text-slate-300 font-mono text-[11px]">
                n8n Google Sheets Pipeline
              </span>
            </div>
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
