import React from 'react';

export const ComposeLogo: React.FC<{ compact?: boolean; inverted?: boolean }> = ({
  compact = false,
  inverted = false,
}) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-[#6546F5] to-[#5267F7] text-white grid place-items-center shadow-sm">
      <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
        <path
          d="M12 3.2 19.5 7.4v9.2L12 20.8 4.5 16.6V7.4L12 3.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path d="M12 12.2 19.4 8M12 12.2 4.6 8M12 12.2v8.4" fill="none" stroke="currentColor" strokeWidth="1.7" />
      </svg>
    </div>
    {!compact && (
      <div className="min-w-0 leading-tight">
        <div className={`font-semibold tracking-tight ${inverted ? 'text-white' : 'text-[#172033]'}`}>
          Compose
        </div>
        <div className={`text-[10px] font-semibold tracking-[0.16em] ${inverted ? 'text-white/70' : 'text-[#667085]'}`}>
          AI ARCHITECT
        </div>
      </div>
    )}
  </div>
);
