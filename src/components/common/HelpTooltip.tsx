import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface HelpTooltipProps {
  term: string;
  explanation: string;
  learnMoreUrl?: string;
  className?: string;
}

export const ARCHITECTURAL_TERMS: Record<string, string> = {
  buildableArea: 'Buildable area: The portion of your site where a building may potentially be placed after statutory setbacks.',
  setback: 'Setback: The required or assumed distance between a building wall and a plot boundary line.',
  revision: 'Revision: A saved, immutable version of your approved project and architectural outputs.',
  boq: 'BOQ: Bill of Quantities — an early scheduled list of estimated construction materials, labor, and costs.',
  kdb: 'KDB / Coverage Ratio: The maximum ground floor footprint percentage permitted relative to the overall plot size.',
  klb: 'KLB / Floor Area Ratio (FAR): The maximum total gross floor area (across all levels) allowed on this plot.',
  gsb: 'GSB (Garis Sempadan Bangunan): Front statutory building line defining distance from road center or curb.',
  daylight: 'Daylight Score: Percentage metric of natural solar illumination reaching active interior living spaces.',
  crossVentilation: 'Cross-Ventilation: Passive natural airflow path moving between opposing or adjacent exterior openings.',
  zone: 'Spatial Zone: Functional privacy tier separating public entertainment, private family retreats, and service areas.',
};

export const HelpTooltip: React.FC<HelpTooltipProps> = ({
  term,
  explanation,
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <span ref={ref} className={`relative inline-flex items-center ml-1 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-[#667085] hover:text-[#2563EB] transition-colors p-0.5 rounded focus:outline-none"
        title={`What is ${term}?`}
        aria-label={`Explanation of ${term}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[min(16rem,calc(100vw-2rem))] p-3 bg-white text-[#172033] border border-[#E4E7EC] rounded-lg shadow-xl text-xs z-50 animate-in fade-in zoom-in-95">
          <div className="flex items-start justify-between gap-1 pb-1 mb-1 border-b border-[#E4E7EC]">
            <span className="font-semibold text-[#172033]">{term}</span>
            <button
              onClick={() => setOpen(false)}
              className="text-[#667085] hover:text-[#172033] p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="text-[#667085] leading-relaxed text-[11px]">{explanation}</p>
        </div>
      )}
    </span>
  );
};
