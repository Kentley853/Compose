import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { StageStatus, ScreenId } from '../../types/architecture';
import {
  ArrowRight,
  Compass,
  FileText,
  Grid3X3,
  Box,
  FileCode2,
  ShieldAlert,
  Calculator,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Cpu,
  Layers,
  MapPin,
  Calendar,
  Building2,
  Package,
  FolderOpen,
  History,
  Sparkles,
  HelpCircle,
  Database,
  FolderKanban,
} from 'lucide-react';
import { HelpTooltip } from '../common/HelpTooltip';

export const DashboardScreen: React.FC = () => {
  const {
    project,
    setScreen,
    companyProjects,
    autosaveStatus,
    autosaveTime,
  } = useProject();

  const getStageBadge = (status: StageStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#027A48] bg-[#ECFDF3] px-2 py-0.5 rounded-full border border-[#ABEFC6]">
            <CheckCircle2 className="w-3 h-3 text-[#12B76A]" /> Approved
          </span>
        );
      case 'needs_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B54708] bg-[#FFF4ED] px-2 py-0.5 rounded-full border border-[#FECDCA]">
            <AlertTriangle className="w-3 h-3 text-[#F79009]" /> Review
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] bg-[#EEF4FF] px-2 py-0.5 rounded-full border border-[#2563EB]/20">
            <Clock className="w-3 h-3 text-[#2563EB]" /> In Progress
          </span>
        );
      case 'outdated':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B42318] bg-[#FEE4E2] px-2 py-0.5 rounded-full border border-[#FECDCA]">
            <AlertTriangle className="w-3 h-3 text-[#F04438]" /> Outdated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#667085] bg-[#F2F4F7] px-2 py-0.5 rounded-full border border-[#E4E7EC]">
            Not Started
          </span>
        );
    }
  };

  const calculateCompletion = () => {
    const approved = project.workflow.filter((w) => w.status === 'approved').length;
    return Math.round((approved / project.workflow.length) * 100);
  };

  const handleContinue = () => {
    const nextStage = project.workflow.find((w) => w.status === 'needs_review' || w.status === 'in_progress');
    if (nextStage) {
      setScreen(nextStage.screenId);
    } else {
      setScreen('plot');
    }
  };

  const getStageIcon = (screenId: ScreenId) => {
    switch (screenId) {
      case 'plot':
        return <Compass className="w-4 h-4 text-[#2563EB]" />;
      case 'architect':
        return <Cpu className="w-4 h-4 text-[#7A5AF8]" />;
      case 'floorplan':
        return <Grid3X3 className="w-4 h-4 text-[#027A48]" />;
      case 'coordinated2d':
        return <FileCode2 className="w-4 h-4 text-[#B54708]" />;
      case 'coordinated3d':
        return <Box className="w-4 h-4 text-[#2563EB]" />;
      case 'compliance':
        return <ShieldAlert className="w-4 h-4 text-[#D92D20]" />;
      case 'boq':
        return <Calculator className="w-4 h-4 text-[#12B76A]" />;
      case 'deliverables':
        return <FileSpreadsheet className="w-4 h-4 text-[#7A5AF8]" />;
      default:
        return <Layers className="w-4 h-4 text-[#667085]" />;
    }
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Permanent Database Status Card */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#172033]">
                  Supabase Permanent Database & Storage
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]">
                  ONLINE
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Every floor plan, 3D model, BOQ, and uploaded file is saved permanently. Local work is backed up continuously.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setScreen('projects')}
              className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-semibold text-[#2563EB] flex items-center gap-1.5 transition-colors"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>All Projects ({companyProjects.length})</span>
            </button>
          </div>
        </div>

        {/* Project Header Banner */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-4 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#667085] mb-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span className="font-medium">{project.identity.location}</span>
              <span>•</span>
              <Building2 className="w-3.5 h-3.5 text-[#667085]" />
              <span className="font-medium">{project.identity.buildingType}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="break-words">{project.identity.name}</span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-[#EEF4FF] text-[#2563EB] border border-[#2563EB]/20 whitespace-nowrap">
                {project.activeRevision}
              </span>
            </h1>

            <p className="text-xs text-[#667085] mt-2 max-w-2xl leading-relaxed">
              Coordinated architectural workspace: site parameters, spatial briefing, 2D drawings, zero-latency 3D massing, code verification, and deterministic BOQ estimation.
            </p>
          </div>

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 shrink-0">
            <button
              onClick={() => setScreen('files')}
              className="px-3.5 py-2 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-semibold text-[#172033] flex items-center justify-center gap-1.5 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-[#2563EB]" />
              <span>Files Workspace ({project.uploads.length})</span>
            </button>

            <button
              id="btn-dashboard-continue"
              onClick={handleContinue}
              className="px-5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Continue Workflow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Site Land Area</div>
            <div className="text-xl sm:text-2xl font-bold text-[#172033] mt-1 font-mono">
              {project.plot.area} <span className="text-sm font-normal text-[#667085]">m²</span>
            </div>
            <div className="text-[11px] text-[#667085] mt-0.5">
              {project.plot.width}m × {project.plot.depth}m parcel
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Gross Floor Area (GFA)</div>
            <div className="text-xl sm:text-2xl font-bold text-[#172033] mt-1 font-mono">
              284 <span className="text-sm font-normal text-[#667085]">m²</span>
            </div>
            <div className="text-[11px] text-[#12B76A] mt-0.5 font-medium">
              FAR 0.95 (compliant)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Target Cost Range</div>
            <div className="text-xl sm:text-2xl font-bold text-[#172033] mt-1 font-mono">
              $213k <span className="text-sm font-normal text-[#667085]">USD</span>
            </div>
            <div className="text-[11px] text-[#667085] mt-0.5">
              Approx. $750 / m² construction
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#E4E7EC] shadow-xs">
            <div className="text-xs text-[#667085] font-medium">Workflow Completion</div>
            <div className="text-xl sm:text-2xl font-bold text-[#2563EB] mt-1 font-mono">
              {calculateCompletion()}%
            </div>
            <div className="w-full bg-[#F2F4F7] h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                style={{ width: `${calculateCompletion()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Coordinated Workflow Matrix */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#E4E7EC] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#172033]">Coordinated Design Stages</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Every stage updates synchronized geometry, compliance, and scheduled costs.
              </p>
            </div>
            <span className="text-xs text-[#667085] font-mono">
              {project.workflow.filter((w) => w.status === 'approved').length} of{' '}
              {project.workflow.length} Approved
            </span>
          </div>

          <div className="divide-y divide-[#E4E7EC]">
            {project.workflow.map((stage, idx) => (
              <div
                key={stage.id}
                onClick={() => setScreen(stage.screenId)}
                className="p-4 flex items-center justify-between hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#F2F4F7] border border-[#E4E7EC] flex items-center justify-center group-hover:border-[#2563EB]/40 transition-colors shrink-0">
                    {getStageIcon(stage.screenId)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#172033] group-hover:text-[#2563EB] transition-colors truncate">
                        {idx + 1}. {stage.name}
                      </span>
                    </div>
                    <div className="text-xs text-[#667085] truncate mt-0.5">
                      {stage.screenId === 'plot' && 'Zoning envelope, boundary setbacks, solar orientation'}
                      {stage.screenId === 'architect' && 'Spatial brief, client preferences, concept generation'}
                      {stage.screenId === 'floorplan' && 'Interactive room editor, alternatives evaluation'}
                      {stage.screenId === 'coordinated2d' && 'Structural grid, dimension strings, door & window schedule'}
                      {stage.screenId === 'coordinated3d' && 'Interactive 3D WebGL massing & sun study'}
                      {stage.screenId === 'compliance' && 'Preliminary building code & zoning checks'}
                      {stage.screenId === 'boq' && 'Quantity takeoff schedule & cost forecasting'}
                      {stage.screenId === 'deliverables' && 'Architectural brief, drawings, and ZIP export'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {getStageBadge(stage.status)}
                  <ArrowRight className="w-4 h-4 text-[#667085] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Access Card Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            onClick={() => setScreen('files')}
            className="p-4 rounded-xl bg-white border border-[#E4E7EC] hover:border-[#2563EB]/40 shadow-xs text-left transition-colors flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172033]">Files & Cloud Storage</div>
              <p className="text-[11px] text-[#667085] mt-0.5">
                {project.uploads.length} attached site plans, drawings, and models.
              </p>
            </div>
          </button>

          <button
            onClick={() => setScreen('activity')}
            className="p-4 rounded-xl bg-white border border-[#E4E7EC] hover:border-[#2563EB]/40 shadow-xs text-left transition-colors flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <History className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172033]">Activity & Baseline Logs</div>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Current baseline {project.activeRevision} • {project.revisions.length} snapshots.
              </p>
            </div>
          </button>

          <button
            onClick={() => setScreen('deliverables')}
            className="p-4 rounded-xl bg-white border border-[#E4E7EC] hover:border-[#2563EB]/40 shadow-xs text-left transition-colors flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#172033]">Export & Deliverables</div>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Client-ready PDF brief, CAD SVG, and BOQ schedules.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
