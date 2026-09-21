import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  FolderPlus,
  Compass,
  Building,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  ArrowRight,
  Plus,
  MapPin,
  Sparkles,
  Check,
} from 'lucide-react';
import { UploadedFile } from '../../types/architecture';
import { HelpTooltip } from '../common/HelpTooltip';

export const ProjectSetupScreen: React.FC = () => {
  const { project, updatePlot, updateRequirements, setScreen, addToast } = useProject();

  // Local state initialized from project
  const [identity, setIdentity] = useState(project.identity);
  const [plot, setPlot] = useState(project.plot);
  const [reqs, setReqs] = useState(project.requirements);
  const [uploads, setUploads] = useState<UploadedFile[]>(project.uploads);
  const [newPriority, setNewPriority] = useState('');

  const handleSaveAndAnalyze = () => {
    updatePlot(plot);
    updateRequirements(reqs);
    addToast('Site Ingestion Complete', 'Plot geometry and project parameters saved.', 'success');
    setScreen('plot');
  };

  const handleSimulatedUpload = (fileType: UploadedFile['type']) => {
    const fakeFile: UploadedFile = {
      id: 'up-' + Date.now(),
      name: `${fileType.replace(/\s+/g, '_')}_Import_${new Date().getFullYear()}.pdf`,
      type: fileType,
      size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
      uploadDate: 'Just now',
      status: 'Processed',
    };
    setUploads((prev) => [fakeFile, ...prev]);
    addToast('Document Ingested', `Simulated ${fileType} parsed into plot memory.`, 'info');
  };

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  const addPriority = () => {
    if (!newPriority.trim()) return;
    setReqs((prev) => ({
      ...prev,
      specialPriorities: [...prev.specialPriorities, newPriority.trim()],
    }));
    setNewPriority('');
  };

  const removePriority = (idx: number) => {
    setReqs((prev) => ({
      ...prev,
      specialPriorities: prev.specialPriorities.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <h1 className="text-fluid-xl font-bold text-[#172033] tracking-tight">Project Setup</h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                Deterministic Baseline
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Configure site boundaries, dimensional constraints, and architectural requirements.
            </p>
          </div>

          <button
            id="btn-analyze-plot-top"
            onClick={handleSaveAndAnalyze}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <span>Analyze Plot Geometry</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 cols: Form sections */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section A: Project Identity */}
            <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase tracking-wider pb-2 border-b border-[#E4E7EC]">
                <FolderPlus className="w-4 h-4 text-[#2563EB]" />
                <span>Section A: Project Identity</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Project Name</label>
                  <input
                    type="text"
                    value={identity.name}
                    onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Client / Owner Entity</label>
                  <input
                    type="text"
                    value={identity.clientName}
                    onChange={(e) => setIdentity({ ...identity, clientName: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Location / Municipality</label>
                  <input
                    type="text"
                    value={identity.location}
                    onChange={(e) => setIdentity({ ...identity, location: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Building Typology</label>
                  <input
                    type="text"
                    value={identity.buildingType}
                    onChange={(e) => setIdentity({ ...identity, buildingType: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Project Scope & Objectives</label>
                  <textarea
                    rows={2}
                    value={identity.description}
                    onChange={(e) => setIdentity({ ...identity, description: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none transition-colors leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Section B: Plot Geometry */}
            <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase tracking-wider pb-2 border-b border-[#E4E7EC]">
                <Compass className="w-4 h-4 text-[#2563EB]" />
                <span>Section B: Plot Geometry & Constraints</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Width (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={plot.width}
                    onChange={(e) => setPlot({ ...plot, width: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] font-mono focus:bg-white focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Depth (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={plot.depth}
                    onChange={(e) => setPlot({ ...plot, depth: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] font-mono focus:bg-white focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Calculated Area</label>
                  <div className="w-full bg-[#EEF4FF] border border-[#2563EB]/20 rounded-lg px-3 py-2 text-xs text-[#2563EB] font-bold font-mono">
                    {(plot.width * plot.depth).toFixed(1)} m²
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Road-Facing Side</label>
                  <select
                    value={plot.roadFacingSide}
                    onChange={(e) => setPlot({ ...plot, roadFacingSide: e.target.value as any })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="South">South Side (Default)</option>
                    <option value="North">North Side</option>
                    <option value="East">East Side</option>
                    <option value="West">West Side</option>
                  </select>
                </div>
              </div>

              {/* Setbacks Sub-grid */}
              <div className="pt-2">
                <div className="text-xs font-semibold text-[#667085] uppercase tracking-wider mb-2">
                  Conceptual Setbacks (Metres)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[#667085] text-[11px] mb-1">Front Setback (m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={plot.setbacks.front}
                      onChange={(e) =>
                        setPlot({
                          ...plot,
                          setbacks: { ...plot.setbacks, front: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[#667085] text-[11px] mb-1">Rear Setback (m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={plot.setbacks.rear}
                      onChange={(e) =>
                        setPlot({
                          ...plot,
                          setbacks: { ...plot.setbacks, rear: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[#667085] text-[11px] mb-1">Left Side Setback (m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={plot.setbacks.left}
                      onChange={(e) =>
                        setPlot({
                          ...plot,
                          setbacks: { ...plot.setbacks, left: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[#667085] text-[11px] mb-1">Right Side Setback (m)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={plot.setbacks.right}
                      onChange={(e) =>
                        setPlot({
                          ...plot,
                          setbacks: { ...plot.setbacks, right: parseFloat(e.target.value) || 0 },
                        })
                      }
                      className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section C: Requirements */}
            <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#172033] uppercase tracking-wider pb-2 border-b border-[#E4E7EC]">
                <Building className="w-4 h-4 text-[#2563EB]" />
                <span>Section C: Building Requirements</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Storeys</label>
                  <input
                    type="number"
                    value={reqs.floors}
                    onChange={(e) => setReqs({ ...reqs, floors: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Occupants</label>
                  <input
                    type="number"
                    value={reqs.occupants}
                    onChange={(e) => setReqs({ ...reqs, occupants: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Bedrooms</label>
                  <input
                    type="number"
                    value={reqs.bedrooms}
                    onChange={(e) => setReqs({ ...reqs, bedrooms: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Bathrooms</label>
                  <input
                    type="number"
                    value={reqs.bathrooms}
                    onChange={(e) => setReqs({ ...reqs, bathrooms: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Parking Bays</label>
                  <input
                    type="number"
                    value={reqs.parkingSpaces}
                    onChange={(e) => setReqs({ ...reqs, parkingSpaces: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Target GFA (m²)</label>
                  <input
                    type="number"
                    value={reqs.targetBuiltUpArea}
                    onChange={(e) => setReqs({ ...reqs, targetBuiltUpArea: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">Preferred Architectural Style</label>
                  <select
                    value={reqs.preferredStyle}
                    onChange={(e) => setReqs({ ...reqs, preferredStyle: e.target.value as any })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none"
                  >
                    <option value="Contemporary tropical">Contemporary Tropical</option>
                    <option value="Modern minimalist">Modern Minimalist</option>
                    <option value="Warm natural">Warm Natural</option>
                    <option value="Urban contemporary">Urban Contemporary</option>
                  </select>
                </div>
              </div>

              {/* Special Priorities Tags */}
              <div className="pt-2 text-xs">
                <label className="block text-xs font-semibold text-[#344054] mb-1.5">Design Priorities</label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {reqs.specialPriorities.map((p, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EEF4FF] border border-[#2563EB]/20 text-[#2563EB] text-xs font-medium"
                    >
                      <span>{p}</span>
                      <button
                        onClick={() => removePriority(idx)}
                        className="text-[#2563EB] hover:text-[#1D4ED8] ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add design priority (e.g. Cross-ventilation breezeway)..."
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addPriority()}
                    className="flex-1 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg px-3 py-1.5 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addPriority}
                    className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right 4 cols: Uploads & Ingestion */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-2">
                <div className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-[#2563EB]" />
                  <span>Site Documents</span>
                </div>
                <span className="text-xs text-[#667085]">{uploads.length} attached</span>
              </div>

              <div className="p-5 border-2 border-dashed border-[#E4E7EC] hover:border-[#2563EB]/50 rounded-xl text-center bg-[#F9FAFB] transition-colors">
                <UploadCloud className="w-8 h-8 text-[#98A2B3] mx-auto mb-2" />
                <div className="text-xs font-semibold text-[#172033]">Drop site documents here</div>
                <div className="text-[11px] text-[#667085] mt-1">DWG, PDF, DXF, or imagery up to 25MB</div>

                {/* Quick Simulated Ingestion Pills */}
                <div className="mt-3 pt-3 border-t border-[#E4E7EC] grid grid-cols-2 gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleSimulatedUpload('Site plan')}
                    className="px-2 py-1 rounded-md bg-white hover:bg-[#EEF4FF] text-[#172033] border border-[#E4E7EC] text-left truncate font-medium"
                  >
                    + Site Plan (.dwg)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulatedUpload('Survey')}
                    className="px-2 py-1 rounded-md bg-white hover:bg-[#EEF4FF] text-[#172033] border border-[#E4E7EC] text-left truncate font-medium"
                  >
                    + Cadastral Survey
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulatedUpload('Plot sketch')}
                    className="px-2 py-1 rounded-md bg-white hover:bg-[#EEF4FF] text-[#172033] border border-[#E4E7EC] text-left truncate font-medium"
                  >
                    + Concept Sketch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulatedUpload('Planning document')}
                    className="px-2 py-1 rounded-md bg-white hover:bg-[#EEF4FF] text-[#172033] border border-[#E4E7EC] text-left truncate font-medium"
                  >
                    + Zoning By-laws
                  </button>
                </div>
              </div>

              {/* Uploaded files list */}
              <div className="space-y-2 text-xs">
                {uploads.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <div className="truncate">
                        <div className="text-[#172033] font-medium truncate text-xs">{file.name}</div>
                        <div className="text-[10px] text-[#667085] font-mono">{file.type} • {file.size}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-semibold text-[#027A48] bg-[#ECFDF3] px-1.5 py-0.5 rounded border border-[#ABEFC6]">
                        {file.status}
                      </span>
                      <button
                        onClick={() => removeUpload(file.id)}
                        className="text-[#98A2B3] hover:text-[#B42318] p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Action */}
              <button
                id="btn-analyze-plot-bottom"
                onClick={handleSaveAndAnalyze}
                className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Save Baseline & Analyze</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
