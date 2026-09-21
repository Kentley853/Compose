import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  History,
  GitCommit,
  CheckCircle2,
  RotateCcw,
  Clock,
  User,
  ShieldAlert,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { HelpTooltip } from '../common/HelpTooltip';

export const ActivityScreen: React.FC = () => {
  const { project, restoreRevision, setScreen, approveRevision } = useProject();
  const [newRevisionSummary, setNewRevisionSummary] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const handleCreateRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevisionSummary.trim()) return;
    approveRevision('plan', newRevisionSummary.trim());
    setNewRevisionSummary('');
    setIsApproving(false);
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <h1 className="text-fluid-xl font-bold text-[#172033] tracking-tight">Project Activity & Revisions</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB] font-semibold">
                Current: {project.activeRevision}
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Audit log of approved architectural baselines, design modifications, and synchronized states.
            </p>
          </div>

          <button
            onClick={() => setIsApproving(!isApproving)}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start"
          >
            <GitCommit className="w-4 h-4" />
            <span>Tag New Revision</span>
          </button>
        </div>

        {/* New Revision Prompt Box (if toggled) */}
        {isApproving && (
          <form
            onSubmit={handleCreateRevision}
            className="bg-white border border-[#2563EB]/40 rounded-xl p-5 shadow-xs space-y-3 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                Snapshot Current Workspace Baseline
              </span>
              <span className="text-[11px] text-[#667085]">
                Generates REV-0{project.revisions.length + 1}
              </span>
            </div>
            <input
              type="text"
              value={newRevisionSummary}
              onChange={(e) => setNewRevisionSummary(e.target.value)}
              placeholder="e.g. Adjusted master bedroom dimensions and updated ground floor glazing..."
              className="w-full px-3 py-2 rounded-lg border border-[#E4E7EC] text-xs text-[#172033] focus:outline-none focus:border-[#2563EB]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsApproving(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] text-xs font-medium text-[#667085] hover:bg-[#F9FAFB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold"
              >
                Approve & Tag Revision
              </button>
            </div>
          </form>
        )}

        {/* Timeline of Revisions */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-4">
            <span className="text-sm font-bold text-[#172033]">Revision History Timeline</span>
            <span className="text-xs text-[#667085]">
              {project.revisions.length} total snapshot(s)
            </span>
          </div>

          <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E4E7EC]">
            {project.revisions
              .slice()
              .reverse()
              .map((rev, index) => {
                const isCurrent = rev.code === project.activeRevision;

                return (
                  <div key={rev.id} className="relative group">
                    {/* Circle on timeline */}
                    <div
                      className={`absolute -left-[27px] top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isCurrent
                          ? 'border-[#2563EB] bg-[#EEF4FF] text-[#2563EB]'
                          : 'border-[#E4E7EC] bg-white text-[#667085]'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[#2563EB]' : 'bg-[#667085]'}`}
                      />
                    </div>

                    <div className="p-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] hover:border-[#2563EB]/40 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#172033] px-2 py-0.5 rounded bg-white border border-[#E4E7EC]">
                            {rev.code}
                          </span>
                          {isCurrent && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]">
                              Active Baseline
                            </span>
                          )}
                          <span className="text-xs font-semibold text-[#172033] capitalize">
                            {rev.type} Synchronization
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-[#667085]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {rev.timestamp}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" /> {rev.author}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-[#667085] mt-2 leading-relaxed">{rev.summary}</p>

                      <div className="mt-3 pt-3 border-t border-[#E4E7EC] flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[#667085]">
                          Coordinated across 2D, 3D, and Cost Models
                        </span>
                        {!isCurrent && (
                          <button
                            onClick={() => restoreRevision(rev.code)}
                            className="px-2.5 py-1 rounded-md bg-white border border-[#E4E7EC] hover:bg-[#EEF4FF] text-xs font-semibold text-[#2563EB] flex items-center gap-1 transition-colors"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore this version
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
