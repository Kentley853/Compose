import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DisclaimerProps {
  className?: string;
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerProps> = ({ className = '', compact = false }) => {
  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/60 border border-slate-800/80 px-2.5 py-1 rounded ${className}`}>
        <AlertCircle className="w-3 h-3 text-amber-500/80 shrink-0" />
        <span>Conceptual output requiring review by a qualified professional.</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-3 px-3 py-1.5 bg-slate-900/80 border border-slate-800 text-xs text-slate-400 rounded-md ${className}`}>
      <div className="flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-amber-500/90 shrink-0" />
        <span>
          <strong className="text-slate-300 font-medium">Important Notice:</strong> Conceptual output requiring review by a qualified professional. Not statutory approval or construction documentation.
        </span>
      </div>
      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded">
        Stage 0 / Feasibility
      </span>
    </div>
  );
};
