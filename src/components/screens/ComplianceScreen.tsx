import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ComplianceCheck } from '../../types/architecture';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  X,
  ChevronDown,
  ChevronRight,
  UserCheck,
  XCircle,
  ArrowRight,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { HelpTooltip } from '../common/HelpTooltip';

export const ComplianceScreen: React.FC = () => {
  const { project, approveRevision, setScreen, addToast } = useProject();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [expandedCheckIds, setExpandedCheckIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedCheckIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApproveCompliance = () => {
    approveRevision('compliance', 'Preliminary statutory review validated. Baseline checks acknowledged.');
    addToast('Compliance Review Saved', 'Signals noted for qualified engineer review.', 'success');
    setScreen('boq');
  };

  // Plain language title mappings for technical rules
  const getPlainTitle = (name: string): string => {
    if (name.includes('Setbacks') || name.includes('Encroachment')) {
      return 'Boundary Setbacks & Buffer Envelopes';
    }
    if (name.includes('Coverage') || name.includes('KDB') || name.includes('Impervious')) {
      return 'Site Coverage & Building Footprint (Max 40%)';
    }
    if (name.includes('FAR') || name.includes('KLB')) {
      return 'Floor Area Ratio (FAR Limit 0.40)';
    }
    if (name.includes('Stair') || name.includes('Egress') || name.includes('Corridor')) {
      return 'Main Egress Circulation & Exit Access (IRC R311)';
    }
    if (name.includes('Daylight') || name.includes('Ventilation') || name.includes('Window')) {
      return 'Natural Glazing & Ventilation (IRC R303)';
    }
    if (name.includes('Height') || name.includes('Ceiling')) {
      return 'Minimum Ceiling Heights (IRC R305)';
    }
    return name;
  };

  const getStatusBadge = (status: ComplianceCheck['status']) => {
    switch (status) {
      case 'Pass':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#027A48] bg-[#ECFDF3] px-2.5 py-1 rounded-full border border-[#ABEFC6]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#12B76A]" /> Passed
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B54708] bg-[#FFF4ED] px-2.5 py-1 rounded-full border border-[#FECDCA]">
            <AlertTriangle className="w-3.5 h-3.5 text-[#F79009]" /> Needs attention
          </span>
        );
      case 'Professional review required':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] bg-[#EEF4FF] px-2.5 py-1 rounded-full border border-[#2563EB]/20">
            <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" /> Review required
          </span>
        );
      case 'Fail':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B42318] bg-[#FEE4E2] px-2.5 py-1 rounded-full border border-[#FECDCA]">
            <XCircle className="w-3.5 h-3.5 text-[#F04438]" /> Flagged
          </span>
        );
    }
  };

  const categories = ['all', 'Boundary', 'Geometry', 'Circulation', 'Openings', 'Life Safety', 'Structure'];

  const filteredChecks = project.complianceChecks.filter((c) => {
    if (filterCategory !== 'all' && c.category !== filterCategory) return false;
    return true;
  });

  const passedCount = project.complianceChecks.filter((c) => c.status === 'Pass').length;
  const warningCount = project.complianceChecks.filter((c) => c.status === 'Warning').length;
  const reviewCount = project.complianceChecks.filter(
    (c) => c.status === 'Professional review required'
  ).length;

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Compact, clean Amber Advisory Notice as specified */}
        <div className="bg-[#FFF4ED] border border-[#FECDCA] rounded-xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-[#B54708]">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 text-[#F79009] shrink-0" />
            <span className="truncate">
              <strong>Preliminary review only.</strong> Professional verification is required before regulatory or construction use.
            </span>
          </div>
          <button
            onClick={() => setShowLearnMoreModal(true)}
            className="text-xs font-semibold text-[#B54708] hover:text-[#7A271A] underline shrink-0"
          >
            Learn more
          </button>
        </div>

        {/* Screen Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Preliminary Compliance Review</h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                {project.activeRevision}
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Early geometric check against regional guidelines, setback envelopes, and egress routes.
            </p>
          </div>

          <button
            onClick={handleApproveCompliance}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Proceed to Cost & BOQ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Clean Summary Cards as specified in Section 12 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Checks completed</div>
            <div className="text-2xl font-bold text-[#172033] mt-1 font-mono">
              {project.complianceChecks.length}
            </div>
            <div className="text-[11px] text-[#667085] mt-0.5">Automated screening</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Passed</div>
            <div className="text-2xl font-bold text-[#027A48] mt-1 font-mono">{passedCount}</div>
            <div className="text-[11px] text-[#12B76A] mt-0.5">Clear statutory envelope</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Needs attention</div>
            <div className="text-2xl font-bold text-[#B54708] mt-1 font-mono">{warningCount}</div>
            <div className="text-[11px] text-[#F79009] mt-0.5">Refinements recommended</div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Professional review</div>
            <div className="text-2xl font-bold text-[#2563EB] mt-1 font-mono">{reviewCount}</div>
            <div className="text-[11px] text-[#2563EB] mt-0.5">Architect & Engineer</div>
          </div>
        </div>

        {/* Filter Category Tabs */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-[#667085] shrink-0 mr-1" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  filterCategory === cat
                    ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold'
                    : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#667085] font-medium">
            Model: <span className="text-[#172033] font-semibold">International Residential Code (IRC 2021) / Austin Land Development Code</span>
          </div>
        </div>

        {/* Simplified Cards List with Collapsible Technical Details */}
        <div className="space-y-3">
          {filteredChecks.map((check) => {
            const isExpanded = expandedCheckIds[check.id] || false;
            const plainTitle = getPlainTitle(check.name);

            return (
              <div
                key={check.id}
                className="bg-white border border-[#E4E7EC] rounded-xl overflow-hidden shadow-xs hover:border-[#2563EB]/40 transition-colors"
              >
                {/* Main Card Header */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-sm font-bold text-[#172033]">{plainTitle}</h3>
                      {getStatusBadge(check.status)}
                    </div>
                    <p className="text-xs text-[#667085] leading-relaxed max-w-2xl">
                      {check.explanation}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => toggleExpand(check.id)}
                      className="px-2.5 py-1 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-medium text-[#667085] hover:text-[#172033] flex items-center gap-1 transition-colors"
                    >
                      <span>Technical Details</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Collapsible Accordion: Technical Details, Statutory Limits, Recommendations */}
                {isExpanded && (
                  <div className="px-4 py-3.5 bg-[#F9FAFB] border-t border-[#E4E7EC] text-xs space-y-2 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="font-semibold text-[#172033]">Official Code & Source:</span>
                        <div className="text-[#667085] mt-0.5">
                          {check.name} ({check.source})
                        </div>
                      </div>
                      <div>
                        <span className="font-semibold text-[#172033]">Recommended Action:</span>
                        <div className="text-[#667085] mt-0.5">{check.recommendedAction}</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[#E4E7EC]/60 text-[11px] text-[#667085] flex items-center justify-between">
                      <span>Category: {check.category} • Revision: {check.applicableRevision}</span>
                      <span className="text-[#2563EB] font-mono">Assessed by Compose AI Engine</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Learn More Modal */}
        {showLearnMoreModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white border border-[#E4E7EC] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                  <h3 className="text-base font-bold text-[#172033]">Preliminary Compliance Boundary</h3>
                </div>
                <button
                  onClick={() => setShowLearnMoreModal(false)}
                  className="text-[#667085] hover:text-[#172033] p-1 rounded-md hover:bg-[#F9FAFB]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 text-xs text-[#667085] space-y-3 leading-relaxed">
                <p>
                  <strong>Compose AI is a conceptual design platform.</strong> It helps architects, builders, and project owners identify spatial opportunities and early zoning envelope limits before committing capital to full documentation.
                </p>
                <div className="p-3 bg-[#FFF4ED] border border-[#FECDCA] rounded-lg text-[#B54708]">
                  <strong>Statutory Notice:</strong> Outputs generated by this software do not constitute sealed architectural, structural, fire life safety, or civil engineering documents.
                </div>
                <p>
                  Before submitting for residential building permits (City of Austin Development Services Department or local Authority Having Jurisdiction), all drawings, calculations, and specifications must be reviewed, finalized, and stamped by:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[#172033]">
                  <li>A State-Licensed Architect (AIA / Texas Board of Architectural Examiners)</li>
                  <li>A certified Professional Structural Engineer (PE)</li>
                  <li>Licensed MEP and civil site engineering specialists</li>
                </ul>
              </div>

              <div className="px-6 py-3.5 bg-[#F9FAFB] border-t border-[#E4E7EC] flex justify-end">
                <button
                  onClick={() => setShowLearnMoreModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8]"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
