import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Share2,
  FileText,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Layers,
  Box,
  Compass,
  FileDown,
  Sparkles,
  SlidersHorizontal,
  Table,
  Building2,
  Eye,
  Info,
} from 'lucide-react';
import {
  exportProjectJSON,
  exportPresentationPDF,
  PDFExportOptions,
} from '../../services/exportPackage';
import { formatFeetInches, formatSqFt, formatCurrency } from '../../utils/geometry';

export const DeliverablesScreen: React.FC = () => {
  const { project, setScreen, togglePresentationMode, addToast } = useProject();

  const [activeTab, setActiveTab] = useState<'overview' | 'floorplan' | '3d' | 'boq'>('overview');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // PDF Export Configuration options
  const [pdfOptions, setPdfOptions] = useState<PDFExportOptions>({
    includeFloorPlans: true,
    include3DVisualization: true,
    includeBOQSummary: true,
    includeDisclaimers: true,
  });

  const currentAlt =
    project.alternatives.find((a) => a.id === project.activeAlternativeId) ||
    project.alternatives[0];

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      exportPresentationPDF(project, pdfOptions);
      addToast(
        'Presentation PDF Exported',
        'Aggregated 4-page client presentation dossier downloaded successfully.',
        'success'
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
      addToast('Export Error', 'Failed to generate PDF document.', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportJSON = () => {
    const jsonStr = exportProjectJSON(project);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.identity.name}_Project_Data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast('Project Data Exported', 'Structured JSON package downloaded.', 'success');
  };

  const totalBOQCost = project.boqItems.reduce((sum, item) => sum + item.expectedEstimate, 0);

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Executive Deliverables & PDF Dossier</h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                Client Presentation Ready
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Aggregated architectural deliverable combining 2D conceptual floor plans, coordinated 3D visualization, and complete BOQ cost summary.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* Primary Action: Export Client Presentation PDF */}
            <button
              id="btn-export-presentation-pdf"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
            >
              <FileDown className="w-4 h-4" />
              <span>{isExportingPDF ? 'Generating PDF...' : 'Export Presentation PDF'}</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-medium text-[#172033] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={togglePresentationMode}
              className="px-3.5 py-2 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-medium text-[#172033] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Play className="w-3.5 h-3.5 text-[#2563EB] fill-current" />
              <span>Live Walkthrough</span>
            </button>
          </div>
        </div>

        {/* Aggregated PDF Feature Callout Card */}
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#1E293B] to-[#0F172A] text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#38BDF8]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                Automated Presentation Engine
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold">
              Complete Client Presentation PDF Document
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Generates a structured, multi-page landscape architectural presentation document incorporating the active scheme's conceptual floor plans, 3D volumetric study, and itemized bill of quantities with financial benchmarks.
            </p>
          </div>

          {/* PDF Inclusion Options & Export Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="bg-slate-800/80 backdrop-blur-md p-2 rounded-lg border border-slate-700 text-xs space-y-1">
              <div className="text-[10px] text-slate-400 font-semibold uppercase px-1">Included in PDF:</div>
              <div className="flex items-center gap-3 px-1 text-[11px] text-slate-200">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeFloorPlans}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, includeFloorPlans: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>2D Plans</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfOptions.include3DVisualization}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, include3DVisualization: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>3D Model</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pdfOptions.includeBOQSummary}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, includeBOQSummary: e.target.checked })}
                    className="rounded text-[#2563EB]"
                  />
                  <span>BOQ Summary</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 rounded-lg bg-[#38BDF8] hover:bg-[#0284C7] text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Aggregated Preview Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E4E7EC]">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('floorplan')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'floorplan'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Conceptual Floor Plans ({currentAlt.rooms.length} Spaces)</span>
          </button>

          <button
            onClick={() => setActiveTab('3d')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === '3d'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>3D Visualization & Massing</span>
          </button>

          <button
            onClick={() => setActiveTab('boq')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'boq'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-[#667085] hover:text-[#172033]'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>BOQ Cost Summary ({formatCurrency(totalBOQCost)})</span>
          </button>
        </div>

        {/* Tab 1: Executive Overview */}
        {activeTab === 'overview' && (
          <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[#E4E7EC]">
              <div>
                <div className="text-[11px] font-mono font-semibold uppercase tracking-widest text-[#2563EB] mb-1">
                  ARCHITECTURAL CONCEPT DOSSIER • FEASIBILITY STAGE
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">
                  {project.identity.name}
                </h2>
                <div className="text-xs text-[#667085] mt-1 font-mono">
                  {project.identity.location} • {project.plot.area} SF Parcel • 2-Storey Private Residence
                </div>
              </div>

              <div className="text-left sm:text-right font-mono text-xs text-[#667085] space-y-1">
                <div>Document No: <span className="text-[#172033] font-semibold">CA-2026-ATX01</span></div>
                <div>Revision: <span className="text-[#2563EB] font-bold">{project.activeRevision}</span></div>
                <div>Date: <span className="text-[#344054]">{new Date().toLocaleDateString()}</span></div>
                <div>Status: <span className="text-[#027A48] font-semibold">Pre-Engineering Feasibility</span></div>
              </div>
            </div>

            {/* Project Key Data Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                <div className="text-[#667085] text-[10px] uppercase">Plot Footprint</div>
                <div className="text-base font-bold text-[#172033] mt-0.5">{project.plot.area} SF</div>
                <div className="text-[10px] text-[#667085]">{project.plot.width}' × {project.plot.depth}' Rectangular</div>
              </div>

              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                <div className="text-[#667085] text-[10px] uppercase">Gross Floor Area</div>
                <div className="text-base font-bold text-[#2563EB] mt-0.5">
                  {project.requirements.targetBuiltUpArea.toLocaleString()} SF
                </div>
                <div className="text-[10px] text-[#667085]">Conditioned Area</div>
              </div>

              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                <div className="text-[#667085] text-[10px] uppercase">Site Coverage</div>
                <div className="text-base font-bold text-[#027A48] mt-0.5">51.9%</div>
                <div className="text-[10px] text-[#667085]">Below Statutory Limit</div>
              </div>

              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
                <div className="text-[#667085] text-[10px] uppercase">Estimated Investment</div>
                <div className="text-base font-bold text-[#172033] mt-0.5">
                  {formatCurrency(totalBOQCost)}
                </div>
                <div className="text-[10px] text-[#667085]">Class 5 Cost Benchmark</div>
              </div>
            </div>

            {/* Coordinated Sheet Index */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#172033] uppercase tracking-wider">
                Included Technical Drawing Sheets in PDF Package
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  { sheet: 'Sheet A-001', name: 'Project Cover & Executive Design Strategy Statement' },
                  { sheet: 'Sheet A-101', name: 'Ground & Upper Level Conceptual Floor Plans (1/8" = 1\'-0")' },
                  { sheet: 'Sheet A-301', name: '3D Coordinated Axonometric Projection & Shading Strategy' },
                  { sheet: 'Sheet C-101', name: 'Itemized Preliminary Bill of Quantities (BOQ) Schedule' },
                ].map((s) => (
                  <div
                    key={s.sheet}
                    className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#2563EB] text-xs">{s.sheet}</span>
                      <span className="text-[#344054] text-xs">{s.name}</span>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-[#027A48] shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Regulatory Disclaimer & Sign-off Block */}
            <div className="p-4 rounded-xl bg-[#FFFAEB] border border-[#FEDF89] text-xs space-y-2">
              <div className="flex items-center gap-2 text-[#B54708] font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4" />
                <span>Formal Product Boundary & Professional Review Notice</span>
              </div>
              <p className="text-[#B54708] leading-relaxed text-xs">
                <strong>Conceptual output requiring review by a qualified professional.</strong> This document is generated for pre-feasibility planning and programmatic design alignment. It does not constitute certified construction documents, structural calculations, or statutory building permit approvals under IRC / IBC regulations.
              </p>
              <div className="pt-3 border-t border-[#FEDF89] grid grid-cols-2 gap-6 text-[10px] font-mono text-[#B54708]">
                <div>
                  <div>REGISTERED ARCHITECT (AIA) SIGNATURE:</div>
                  <div className="h-10 border-b border-dashed border-[#D0D5DD] mt-2" />
                </div>
                <div>
                  <div>LICENSED STRUCTURAL ENGINEER (PE) SIGNATURE:</div>
                  <div className="h-10 border-b border-dashed border-[#D0D5DD] mt-2" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Conceptual Floor Plans Aggregated View */}
        {activeTab === 'floorplan' && (
          <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Conceptual Floor Plan Schedule</h3>
                <p className="text-xs text-[#667085]">
                  Scheme: <span className="font-semibold text-[#2563EB]">{currentAlt.name}</span> • {currentAlt.rooms.length} Coordinated Spaces
                </p>
              </div>
              <button
                onClick={() => setScreen('floorplan')}
                className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-semibold text-[#2563EB] flex items-center gap-1.5"
              >
                <span>Open in 2D Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Room Schedule Table */}
            <div className="overflow-x-auto border border-[#E4E7EC] rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F9FAFB] border-b border-[#E4E7EC] text-[10px] font-bold uppercase text-[#667085]">
                  <tr>
                    <th className="p-3">Space Name</th>
                    <th className="p-3">Level</th>
                    <th className="p-3">Zone</th>
                    <th className="p-3">Dimensions (W × D)</th>
                    <th className="p-3">Area (SF)</th>
                    <th className="p-3">Daylight</th>
                    <th className="p-3">Ventilation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC]">
                  {currentAlt.rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-[#F9FAFB]">
                      <td className="p-3 font-semibold text-[#172033]">{room.name}</td>
                      <td className="p-3 text-[#667085]">Level 0{room.floor}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] text-[10px] font-medium">
                          {room.zone}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[#667085]">
                        {formatFeetInches(room.width)} × {formatFeetInches(room.height)}
                      </td>
                      <td className="p-3 font-mono font-bold text-[#2563EB]">
                        {formatSqFt(room.area || room.width * room.height)}
                      </td>
                      <td className="p-3 font-mono text-[#027A48]">{room.daylightScore}%</td>
                      <td className="p-3 font-mono text-[#0284C7]">{room.ventilationScore}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: 3D Visualization Aggregated View */}
        {activeTab === '3d' && (
          <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">3D Coordinated Volumetric Study</h3>
                <p className="text-xs text-[#667085]">
                  Integrated digital twin model with floor elevation heights and massing geometry
                </p>
              </div>
              <button
                onClick={() => setScreen('coordinated3d')}
                className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-semibold text-[#2563EB] flex items-center gap-1.5"
              >
                <span>Open in 3D Viewer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Massing Diagram Presentation Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2">
                <div className="text-xs font-bold text-[#344054] uppercase">Floor Elevations</div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Roof Ridge:</span>
                    <span className="font-bold text-[#172033]">+ 24'-6"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Second Level:</span>
                    <span className="font-bold text-[#172033]">+ 11'-0"</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Ground Finish:</span>
                    <span className="font-bold text-[#172033]">+ 0'-0"</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2">
                <div className="text-xs font-bold text-[#344054] uppercase">Zoning Compliance</div>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Lot Coverage:</span>
                    <span className="font-bold text-[#027A48]">51.9% (PASS)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Height Limit:</span>
                    <span className="font-bold text-[#027A48]">24.5' / 35' (PASS)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#667085]">Front Setback:</span>
                    <span className="font-bold text-[#027A48]">25'-0" (PASS)</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2">
                <div className="text-xs font-bold text-[#344054] uppercase">Envelope Materials</div>
                <div className="space-y-1 text-xs text-[#667085]">
                  <p>• Off-white stucco finish</p>
                  <p>• Western red cedar slats</p>
                  <p>• Low-E Argon double glazing</p>
                  <p>• Zinc standing seam roof</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: BOQ Summary Aggregated View */}
        {activeTab === 'boq' && (
          <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#172033]">Bill of Quantities (BOQ) Summary</h3>
                <p className="text-xs text-[#667085]">
                  Class 5 preliminary estimate • Austin / Regional US indices
                </p>
              </div>
              <button
                onClick={() => setScreen('boq')}
                className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-xs font-semibold text-[#2563EB] flex items-center gap-1.5"
              >
                <span>Open in BOQ Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* BOQ Schedule Table */}
            <div className="overflow-x-auto border border-[#E4E7EC] rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#F9FAFB] border-b border-[#E4E7EC] text-[10px] font-bold uppercase text-[#667085]">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Item Description</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Unit</th>
                    <th className="p-3">Unit Rate</th>
                    <th className="p-3">Total Cost</th>
                    <th className="p-3">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC]">
                  {project.boqItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F9FAFB]">
                      <td className="p-3 font-semibold text-[#172033]">{item.category}</td>
                      <td className="p-3 text-[#344054]">{item.item}</td>
                      <td className="p-3 font-mono text-[#667085]">{item.quantity.toLocaleString()}</td>
                      <td className="p-3 text-[#667085]">{item.unit}</td>
                      <td className="p-3 font-mono text-[#667085]">{formatCurrency(item.unitRate)}</td>
                      <td className="p-3 font-mono font-bold text-[#172033]">
                        {formatCurrency(item.expectedEstimate)}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.confidence === 'High'
                              ? 'bg-[#ECFDF5] text-[#027A48]'
                              : item.confidence === 'Medium'
                              ? 'bg-[#FEF6EE] text-[#B54708]'
                              : 'bg-[#FEF3F2] text-[#D92D20]'
                          }`}
                        >
                          {item.confidence}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Grand Total Bar */}
            <div className="p-4 rounded-xl bg-[#0F172A] text-white flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Projected Construction Total
                </div>
                <div className="text-sm text-slate-300">
                  Based on {project.requirements.targetBuiltUpArea.toLocaleString()} SF Conditioned Envelope
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-white">
                  {formatCurrency(totalBOQCost)}
                </div>
                <div className="text-xs font-mono text-slate-400">
                  ~${Math.round(totalBOQCost / (project.requirements.targetBuiltUpArea || 3200))}/SF benchmark
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-[#E4E7EC] flex items-center justify-between">
          <button
            onClick={() => setScreen('dashboard')}
            className="px-4 py-2 rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#344054] transition-colors"
          >
            Back to Dashboard
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Client Presentation PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
