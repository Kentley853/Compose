import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  Plus,
  MapPin,
  Sparkles,
  Check,
  Save,
  Send,
  Loader2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sliders,
  DollarSign,
  Layers,
} from 'lucide-react';
import {
  ProjectWizardData,
  submitProjectToN8n,
  saveProjectDraft,
  loadProjectDraft,
  clearProjectDraft,
  getN8nWebhookUrl,
  SubmissionResult,
} from '../../services/n8nService';

const WIZARD_STAGES = [
  { id: 'info', label: 'Project Info', description: 'Core details & identity' },
  { id: 'site', label: 'Client & Site', description: 'Location & lot zoning' },
  { id: 'requirements', label: 'Requirements', description: 'Floors, rooms & budget' },
  { id: 'files', label: 'Documents', description: 'Surveys & site plans' },
  { id: 'preferences', label: 'Preferences', description: 'Aesthetics & finishes' },
  { id: 'review', label: 'Review & Submit', description: 'Verify & push to n8n' },
];

export const ProjectSetupScreen: React.FC = () => {
  const { project, updatePlot, updateRequirements, setScreen, addToast } = useProject();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<SubmissionResult | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [newPriorityInput, setNewPriorityInput] = useState<string>('');

  // Initial Wizard Data populated from active project or local draft
  const [formData, setFormData] = useState<ProjectWizardData>(() => {
    const draft = loadProjectDraft(project.id);
    return {
      projectName: draft?.projectName || project.identity.name || 'Austin Modern Residence',
      projectDescription:
        draft?.projectDescription ||
        project.identity.description ||
        'Custom single-family residence optimizing passive solar exposure and indoor-outdoor entertainment.',
      projectType: draft?.projectType || 'Single-family residential',
      projectStage: draft?.projectStage || 'Schematic design',
      clientName: draft?.clientName || project.identity.clientName || 'Private Client Group',
      clientEmail: draft?.clientEmail || 'client@austinhomes.example.com',
      clientPhone: draft?.clientPhone || '(512) 555-0198',
      architectName: draft?.architectName || 'Lead Design Director, Compose AI',
      createdAt: draft?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      streetAddress: draft?.streetAddress || '2408 South Congress Ave',
      city: draft?.city || 'Austin',
      state: draft?.state || 'TX',
      zipCode: draft?.zipCode || '78704',
      country: draft?.country || 'United States',
      parcelNumber: draft?.parcelNumber || 'LOT-782-B2',
      siteArea: draft?.siteArea || 7200,
      siteAreaUnit: (draft?.siteAreaUnit as any) || 'sq ft',
      frontSetback: draft?.frontSetback !== undefined ? draft.frontSetback : 25,
      rearSetback: draft?.rearSetback !== undefined ? draft.rearSetback : 10,
      leftSetback: draft?.leftSetback !== undefined ? draft.leftSetback : 5,
      rightSetback: draft?.rightSetback !== undefined ? draft.rightSetback : 5,
      maxBuildingHeight: draft?.maxBuildingHeight || 32,
      zoningClassification: draft?.zoningClassification || 'SF-3 Single Family Residential',
      localJurisdiction: draft?.localJurisdiction || 'City of Austin Development Services',
      latitude: draft?.latitude || '30.2520° N',
      longitude: draft?.longitude || '97.7490° W',
      siteOrientation: draft?.siteOrientation || 'South',
      knownConstraints:
        draft?.knownConstraints ||
        'Heritage live oak canopy on northwest quadrant; 4-foot grade drop toward rear boundary.',
      floodZone: draft?.floodZone || 'Zone X (Minimal Flood Hazard)',
      hoaRequirements: draft?.hoaRequirements || 'Maximum 32 ft ridge height; neutral exterior earth tone palette.',

      numberOfFloors: draft?.numberOfFloors || project.requirements.floors || 2,
      targetGrossFloorAreaSF: draft?.targetGrossFloorAreaSF || project.requirements.targetBuiltUpArea || 3850,
      maxBudgetUSD: draft?.maxBudgetUSD || 1050000,
      preferredStyle: draft?.preferredStyle || 'Contemporary Austin Modern',
      bedrooms: draft?.bedrooms || project.requirements.bedrooms || 4,
      bathrooms: draft?.bathrooms || project.requirements.bathrooms || 3.5,
      targetOccupancy: draft?.targetOccupancy || project.requirements.occupants || 5,
      garageCapacity: draft?.garageCapacity || project.requirements.parkingSpaces || 2,
      specialRooms:
        draft?.specialRooms ||
        project.requirements.specialPriorities || [
          'Ground-Floor Guest Suite',
          'Butler Prep Scullery',
          'Covered Cedar Lanai',
          'Upper Family Media Loft',
          'Dedicated Home Office',
        ],

      files: draft?.files || [
        {
          id: 'file-01',
          name: 'Travis_County_Cadastral_Survey_2025.pdf',
          size: '3.4 MB',
          category: 'Survey',
          uploadStatus: 'Processed',
          fileUrl: 'https://drive.google.com/mock-vault/survey-austin-01.pdf',
        },
        {
          id: 'file-02',
          name: 'Austin_Subchapter_F_Zoning_Review.pdf',
          size: '1.8 MB',
          category: 'Zoning document',
          uploadStatus: 'Processed',
          fileUrl: 'https://drive.google.com/mock-vault/zoning-subchapter-f.pdf',
        },
      ],

      architecturalAesthetic:
        draft?.architecturalAesthetic ||
        'Warm modernism with native Texas limestone, dark bronze aluminium glazing frames, and natural cedar soffits.',
      roofStyle: draft?.roofStyle || 'Low-slope standing seam metal roof with 4-ft cantilevered overhangs',
      sustainabilityTargets: draft?.sustainabilityTargets || [
        'Passive Solar Orientation (South Glazing)',
        'Rainwater Cistern Integration',
        'High-Efficiency Variable Speed Heat Pumps',
        'EV 240V Level 2 Charger in Garage',
      ],
      preferredMaterials: draft?.preferredMaterials || [
        'Texas White Limestone',
        'Western Red Cedar Siding',
        'Thermally Broken Bronze Windows',
        'Engineered White Oak Flooring',
      ],
      indoorOutdoorConnection:
        draft?.indoorOutdoorConnection ||
        'Zero-threshold pocketing sliding glass doors opening Great Room to covered cedar lanai and rear courtyard.',
      smartHomeRequirements:
        draft?.smartHomeRequirements || 'Central Lutron lighting control, smart HVAC zoning, video intercom.',
      accessibilityRequirements:
        draft?.accessibilityRequirements ||
        'Step-free ground floor entry, 36-inch wide corridors, zero-barrier primary shower.',
      additionalNotes:
        draft?.additionalNotes ||
        'Client plans construction start in Q3 2026 pending Austin Development Services expedited permitting.',
    };
  });

  // Auto-save form draft locally on changes
  useEffect(() => {
    saveProjectDraft(project.id, formData);
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(now);
  }, [formData, project.id]);

  const handleNext = () => {
    if (currentStep < WIZARD_STAGES.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleManualSaveDraft = () => {
    saveProjectDraft(project.id, formData);
    addToast('Draft Saved', `All 6 wizard stages saved to local storage at ${lastSavedTime}.`, 'success');
  };

  const handleAddSpecialRoom = () => {
    if (!newPriorityInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      specialRooms: [...prev.specialRooms, newPriorityInput.trim()],
    }));
    setNewPriorityInput('');
  };

  const handleRemoveSpecialRoom = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      specialRooms: prev.specialRooms.filter((_, i) => i !== idx),
    }));
  };

  const handleSimulatedFileUpload = (category: string) => {
    const newFile = {
      id: `file-${Date.now()}`,
      name: `${category.replace(/\s+/g, '_')}_${formData.projectName.replace(/\s+/g, '_')}.pdf`,
      size: `${(Math.random() * 2.5 + 1.2).toFixed(1)} MB`,
      category,
      uploadStatus: 'Processed' as const,
      fileUrl: `https://drive.google.com/mock-vault/file-${Date.now()}.pdf`,
    };
    setFormData((prev) => ({
      ...prev,
      files: [newFile, ...prev.files],
    }));
    addToast('Document Attached', `${newFile.name} indexed and staged for n8n Google Drive sync.`, 'info');
  };

  const handleRemoveFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }));
  };

  const handleSubmitToN8n = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    // Sync updated form values into ProjectContext so the app views reflect this immediately
    updatePlot({
      width: 60,
      depth: 120,
      unit: 'feet',
      roadFacingSide: (formData.siteOrientation as any) || 'South',
      setbacks: {
        front: formData.frontSetback,
        rear: formData.rearSetback,
        left: formData.leftSetback,
        right: formData.rightSetback,
      },
    });

    updateRequirements({
      floors: formData.numberOfFloors,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      occupants: formData.targetOccupancy,
      parkingSpaces: formData.garageCapacity,
      targetBuiltUpArea: formData.targetGrossFloorAreaSF,
      specialPriorities: formData.specialRooms,
    });

    const activeAlternative =
      project.alternatives.find((a) => a.id === project.activeAlternativeId) || project.alternatives[0];

    const generatedOutputs = {
      estimatedBudgetUSD: `$${formData.maxBudgetUSD.toLocaleString()}`,
      grossFloorAreaSqFt: `${formData.targetGrossFloorAreaSF.toLocaleString()} SF`,
      primaryAlternativeName: activeAlternative.name,
      roomsCount: activeAlternative.rooms.length,
    };

    try {
      const result = await submitProjectToN8n(formData, generatedOutputs);
      setSubmissionSuccess(result);
      addToast(
        'Project Submitted Successfully',
        `Transferred to n8n webhook (ID: ${result.submissionId}).`,
        'success'
      );
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmissionError(err.message || 'Webhook transmission failed. Please retry.');
      addToast('Submission Notice', 'Failed to reach n8n endpoint. Check internet or retry.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen">
      <div className="max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Header & Draft Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Project Setup Wizard</h1>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse" />
                <span>n8n Cloud Automation</span>
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Step-by-step guided onboarding syncing directly to n8n, Google Sheets & Drive records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleManualSaveDraft}
              className="px-3.5 py-2 min-h-[44px] rounded-lg border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-medium text-[#344054] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Save className="w-4 h-4 text-[#2563EB]" />
              <span>Save Draft ({lastSavedTime})</span>
            </button>

            <button
              onClick={() => setScreen('plot')}
              className="px-3.5 py-2 min-h-[44px] rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Plot Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Wizard Progress Indicator Bar */}
        <div className="bg-white border border-[#E4E7EC] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#667085] mb-2 font-medium">
            <span>
              Stage {currentStep + 1} of {WIZARD_STAGES.length}:{' '}
              <strong className="text-[#172033]">{WIZARD_STAGES[currentStep].label}</strong>
            </span>
            <span>{Math.round(((currentStep + 1) / WIZARD_STAGES.length) * 100)}% Complete</span>
          </div>

          {/* Stepper progress track */}
          <div className="w-full bg-[#F2F4F7] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2563EB] h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentStep + 1) / WIZARD_STAGES.length) * 100}%` }}
            />
          </div>

          {/* Stage pills (Horizontal scrollable on mobile) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 pt-2 border-t border-[#E4E7EC]">
            {WIZARD_STAGES.map((stage, idx) => {
              const isDone = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <button
                  key={stage.id}
                  onClick={() => setCurrentStep(idx)}
                  className={`p-2 rounded-xl text-left transition-all min-h-[44px] flex flex-col justify-center ${
                    isCurrent
                      ? 'bg-[#EEF4FF] border border-[#2563EB]/40 ring-1 ring-[#2563EB]/20 text-[#2563EB]'
                      : isDone
                      ? 'bg-[#F9FAFB] hover:bg-[#F2F4F7] text-[#344054]'
                      : 'text-[#98A2B3] hover:text-[#667085]'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#12B76A] shrink-0" />
                    ) : (
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                          isCurrent ? 'bg-[#2563EB] text-white' : 'bg-[#E4E7EC] text-[#667085]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    )}
                    <span className="truncate">{stage.label}</span>
                  </div>
                  <span className="text-[10px] text-[#667085] truncate mt-0.5 hidden sm:block">
                    {stage.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Wizard Main Step Container */}
        <div className="bg-white border border-[#E4E7EC] rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
          {/* ============================================================== */}
          {/* STAGE 0: BASIC PROJECT INFORMATION */}
          {/* ============================================================== */}
          {currentStep === 0 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-[#E4E7EC] pb-3">
                <h2 className="text-lg font-bold text-[#172033]">Stage 1: Basic Project Information</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Define project naming, typology classification, development stage, and team contacts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Project Name <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.projectName}
                    onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                    placeholder="e.g. Austin Contemporary Residence"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Project Description & Scope <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.projectDescription}
                    onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none leading-relaxed"
                    placeholder="Provide a high-level summary of the architectural vision, goals, and programmatic intent..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Project Type <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                  >
                    <option value="Single-family residential">Single-family residential</option>
                    <option value="Multi-family residential">Multi-family residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Retail">Retail</option>
                    <option value="Office">Office</option>
                    <option value="Hospitality">Hospitality</option>
                    <option value="Mixed-use">Mixed-use</option>
                    <option value="Renovation">Renovation</option>
                    <option value="Interior design">Interior design</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Project Stage <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <select
                    value={formData.projectStage}
                    onChange={(e) => setFormData({ ...formData, projectStage: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                  >
                    <option value="Early concept">Early concept</option>
                    <option value="Feasibility study">Feasibility study</option>
                    <option value="Schematic design">Schematic design</option>
                    <option value="Design development">Design development</option>
                    <option value="Existing building renovation">Existing building renovation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Client Name <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                    placeholder="Client or entity name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Client Email <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                    placeholder="client@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Client Phone <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                    placeholder="(555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Architect / Team Member <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.architectName}
                    onChange={(e) => setFormData({ ...formData, architectName: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] focus:bg-white focus:border-[#2563EB] focus:outline-none min-h-[44px]"
                    placeholder="Project Architect Name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 1: CLIENT AND SITE INFORMATION */}
          {/* ============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-[#E4E7EC] pb-3">
                <h2 className="text-lg font-bold text-[#172033]">Stage 2: Client & Site Information</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Configure US street address, parcel identification, setbacks, zoning code, and environmental constraints.
                </p>
              </div>

              {/* Address sub-grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Street Address <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.streetAddress}
                    onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                    placeholder="e.g. 2408 South Congress Ave"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    City <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                    placeholder="Austin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    State & ZIP <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-2.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                      placeholder="TX"
                    />
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-2.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                      placeholder="78704"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Country <span className="text-[#98A2B3]">(Default US)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Parcel or Lot Number <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.parcelNumber}
                    onChange={(e) => setFormData({ ...formData, parcelNumber: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                    placeholder="LOT-782-B2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Site Area <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.siteArea}
                    onChange={(e) => setFormData({ ...formData, siteArea: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Site Area Unit <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <select
                    value={formData.siteAreaUnit}
                    onChange={(e) => setFormData({ ...formData, siteAreaUnit: e.target.value as any })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                  >
                    <option value="sq ft">Square Feet (sq ft)</option>
                    <option value="acres">Acres (ac)</option>
                    <option value="sq meters">Square Meters (m²)</option>
                  </select>
                </div>
              </div>

              {/* Setbacks & Dimensional Constraints */}
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-3">
                <div className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#2563EB]" />
                  <span>Boundary Setbacks (Feet) & Maximum Height</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-[#667085] text-[11px] mb-1">Front Setback (ft)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.frontSetback}
                      onChange={(e) => setFormData({ ...formData, frontSetback: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs font-mono min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#667085] text-[11px] mb-1">Rear Setback (ft)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.rearSetback}
                      onChange={(e) => setFormData({ ...formData, rearSetback: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs font-mono min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#667085] text-[11px] mb-1">Left Setback (ft)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.leftSetback}
                      onChange={(e) => setFormData({ ...formData, leftSetback: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs font-mono min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#667085] text-[11px] mb-1">Right Setback (ft)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.rightSetback}
                      onChange={(e) => setFormData({ ...formData, rightSetback: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs font-mono min-h-[40px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#667085] text-[11px] mb-1">Max Height (ft)</label>
                    <input
                      type="number"
                      step="1"
                      value={formData.maxBuildingHeight}
                      onChange={(e) => setFormData({ ...formData, maxBuildingHeight: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-white border border-[#E4E7EC] rounded-lg px-3 py-2 text-xs font-mono min-h-[40px]"
                    />
                  </div>
                </div>
              </div>

              {/* Zoning, Jurisdiction, Orientation & Constraints */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Zoning Classification <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.zoningClassification}
                    onChange={(e) => setFormData({ ...formData, zoningClassification: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                    placeholder="e.g. Austin SF-3 Residential"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Local Jurisdiction <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.localJurisdiction}
                    onChange={(e) => setFormData({ ...formData, localJurisdiction: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                    placeholder="City of Austin Development Services"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Primary Road / Site Orientation <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <select
                    value={formData.siteOrientation}
                    onChange={(e) => setFormData({ ...formData, siteOrientation: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                  >
                    <option value="South">South Facing (Optimal Solar)</option>
                    <option value="North">North Facing</option>
                    <option value="East">East Facing (Morning Sun)</option>
                    <option value="West">West Facing</option>
                    <option value="South-East">South-East Facing</option>
                    <option value="South-West">South-West Facing</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Known Site Constraints, Trees & Topography <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.knownConstraints}
                    onChange={(e) => setFormData({ ...formData, knownConstraints: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2 text-xs text-[#172033] leading-relaxed"
                    placeholder="Protected heritage trees, utility easements, drainage slopes..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Flood Zone Info <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.floodZone}
                    onChange={(e) => setFormData({ ...formData, floodZone: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2 text-xs text-[#172033] min-h-[44px]"
                    placeholder="e.g. Zone X minimal flood"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    HOA Architectural Guidelines <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.hoaRequirements}
                    onChange={(e) => setFormData({ ...formData, hoaRequirements: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2 text-xs text-[#172033] min-h-[44px]"
                    placeholder="Ridge height limits, exterior material palettes..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 2: BUILDING REQUIREMENTS */}
          {/* ============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-[#E4E7EC] pb-3">
                <h2 className="text-lg font-bold text-[#172033]">Stage 3: Building Requirements</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Define floors, gross floor area, target USD budget, bedroom count, and specialized spaces.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Number of Floors <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={formData.numberOfFloors}
                    onChange={(e) => setFormData({ ...formData, numberOfFloors: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Target GFA (Sq Ft) <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.targetGrossFloorAreaSF}
                    onChange={(e) =>
                      setFormData({ ...formData, targetGrossFloorAreaSF: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Max Budget (USD) <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    step={10000}
                    value={formData.maxBudgetUSD}
                    onChange={(e) => setFormData({ ...formData, maxBudgetUSD: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Garage / Parking <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.garageCapacity}
                    onChange={(e) => setFormData({ ...formData, garageCapacity: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Bedrooms <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Bathrooms <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Target Occupancy <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    value={formData.targetOccupancy}
                    onChange={(e) => setFormData({ ...formData, targetOccupancy: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] font-mono min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Architectural Style <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <select
                    value={formData.preferredStyle}
                    onChange={(e) => setFormData({ ...formData, preferredStyle: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                  >
                    <option value="Contemporary Austin Modern">Contemporary Austin Modern</option>
                    <option value="Desert Minimalist">Desert Minimalist</option>
                    <option value="Warm Scandinavian Modern">Warm Scandinavian Modern</option>
                    <option value="Urban Industrial Contemporary">Urban Industrial Contemporary</option>
                    <option value="Modern Farmhouse">Modern Farmhouse</option>
                  </select>
                </div>
              </div>

              {/* Special Room Requirements */}
              <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#172033] uppercase tracking-wider">
                    Specialized Programmatic Spaces & Priorities
                  </div>
                  <span className="text-[11px] text-[#667085]">{formData.specialRooms.length} configured</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.specialRooms.map((room, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF4FF] border border-[#2563EB]/30 text-[#2563EB] text-xs font-semibold"
                    >
                      <span>{room}</span>
                      <button
                        onClick={() => handleRemoveSpecialRoom(idx)}
                        className="hover:text-[#D92D20] ml-0.5 text-sm"
                        title="Remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newPriorityInput}
                    onChange={(e) => setNewPriorityInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSpecialRoom()}
                    placeholder="Add custom room (e.g. Wine cellar, Gym, Workshop)..."
                    className="flex-1 bg-white border border-[#E4E7EC] rounded-xl px-3.5 py-2 text-xs text-[#172033] min-h-[44px]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialRoom}
                    className="px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] min-h-[44px] flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Space</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 3: FILES AND DOCUMENTS */}
          {/* ============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-[#E4E7EC] pb-3">
                <h2 className="text-lg font-bold text-[#172033]">Stage 4: Files and Documents</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Attach site surveys, zoning documentation, sketches, or budget files. Metadata and URLs will sync to n8n and Google Drive.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="p-6 border-2 border-dashed border-[#E4E7EC] hover:border-[#2563EB]/60 rounded-2xl text-center bg-[#F9FAFB] transition-colors space-y-3">
                <UploadCloud className="w-10 h-10 text-[#2563EB] mx-auto" />
                <div>
                  <div className="text-sm font-bold text-[#172033]">Upload Site Documentation</div>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Attach PDF, DWG, DXF, PNG, or XLSX files up to 50MB. File URLs and metadata will be recorded in Google Sheets.
                  </p>
                </div>

                {/* Quick Add Pills */}
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  {[
                    'Site plan',
                    'Survey',
                    'Zoning document',
                    'Inspiration images',
                    'Sketches',
                    'Existing floor plans',
                    'Budget sheet',
                    'Notes or brief',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleSimulatedFileUpload(cat)}
                      className="px-3 py-1.5 min-h-[38px] rounded-lg bg-white border border-[#E4E7EC] hover:border-[#2563EB] hover:text-[#2563EB] text-xs font-medium text-[#344054] transition-colors shadow-xs"
                    >
                      + Add {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Uploaded Files Table */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center justify-between">
                  <span>Attached Documents & Staged Files ({formData.files.length})</span>
                  <span className="text-[10px] text-[#027A48] font-mono">Google Drive URL Mock Enabled</span>
                </div>

                <div className="overflow-x-auto border border-[#E4E7EC] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F9FAFB] text-[#667085] text-[11px] uppercase font-semibold border-b border-[#E4E7EC]">
                      <tr>
                        <th className="py-2.5 px-3">File Name</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">File Size</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4E7EC] text-xs">
                      {formData.files.map((file) => (
                        <tr key={file.id} className="hover:bg-[#F9FAFB]">
                          <td className="py-2.5 px-3 font-medium text-[#172033] flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                            <span className="truncate max-w-[220px]">{file.name}</span>
                          </td>
                          <td className="py-2.5 px-3 text-[#667085]">{file.category}</td>
                          <td className="py-2.5 px-3 text-[#667085] font-mono text-[11px]">{file.size}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ECFDF3] text-[#027A48] border border-[#ABEFC6]">
                              {file.uploadStatus}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleRemoveFile(file.id)}
                              className="p-1 rounded text-[#98A2B3] hover:text-[#D92D20]"
                              title="Delete file"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 4: DESIGN PREFERENCES */}
          {/* ============================================================== */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-[#E4E7EC] pb-3">
                <h2 className="text-lg font-bold text-[#172033]">Stage 5: Design Preferences</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Set architectural materiality, roof type, sustainability goals, smart home, and accessibility specs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Architectural Aesthetic & Massing <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.architecturalAesthetic}
                    onChange={(e) => setFormData({ ...formData, architecturalAesthetic: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Roof Style & Shading Overhangs <span className="text-[#D92D20] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.roofStyle}
                    onChange={(e) => setFormData({ ...formData, roofStyle: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Indoor-Outdoor Connection Strategy <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.indoorOutdoorConnection}
                    onChange={(e) => setFormData({ ...formData, indoorOutdoorConnection: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Smart Home & Automation <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.smartHomeRequirements}
                    onChange={(e) => setFormData({ ...formData, smartHomeRequirements: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Accessibility & Universal Design <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.accessibilityRequirements}
                    onChange={(e) => setFormData({ ...formData, accessibilityRequirements: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] min-h-[44px]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#344054] mb-1.5">
                    Additional Architect Notes & Client Directives <span className="text-[#98A2B3]">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    className="w-full bg-[#F9FAFB] border border-[#E4E7EC] rounded-xl px-3.5 py-2 text-xs text-[#172033] leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 5: REVIEW AND SUBMIT */}
          {/* ============================================================== */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-[#E4E7EC] pb-3">
                <h2 className="text-lg font-bold text-[#172033]">Stage 6: Review and Submit Project</h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Confirm structured project specifications before transmitting payload to the production n8n webhook.
                </p>
              </div>

              {/* Webhook endpoint notification banner */}
              <div className="p-3.5 rounded-xl bg-[#EEF4FF] border border-[#2563EB]/20 text-xs flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-[#172033]">Production n8n Automation Ready</div>
                  <p className="text-[#475467] leading-relaxed">
                    Upon submission, your complete architectural package will be securely POSTed to{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded font-mono text-[#2563EB] text-[11px] border border-[#2563EB]/20">
                      {getN8nWebhookUrl()}
                    </code>{' '}
                    to generate live Google Sheets records and catalog attached files in cloud storage.
                  </p>
                </div>
              </div>

              {/* Review Matrix Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2">
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                    1. Identity & Client
                  </span>
                  <div className="font-bold text-[#172033] text-sm">{formData.projectName}</div>
                  <div className="text-[#667085]">Client: {formData.clientName}</div>
                  <div className="text-[#667085]">Email: {formData.clientEmail}</div>
                  <div className="text-[#667085]">Typology: {formData.projectType}</div>
                  <div className="text-[#667085]">Stage: {formData.projectStage}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2">
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                    2. Site & Zoning
                  </span>
                  <div className="font-bold text-[#172033] text-sm">
                    {formData.streetAddress}, {formData.city}, {formData.state}
                  </div>
                  <div className="text-[#667085]">
                    Lot Size: {formData.siteArea.toLocaleString()} {formData.siteAreaUnit}
                  </div>
                  <div className="text-[#667085]">Zoning: {formData.zoningClassification}</div>
                  <div className="text-[#667085]">Orientation: {formData.siteOrientation} Facing</div>
                  <div className="text-[#667085]">
                    Setbacks: {formData.frontSetback}'F / {formData.rearSetback}'R / {formData.leftSetback}'L
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] space-y-2">
                  <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider block">
                    3. Building & Budget
                  </span>
                  <div className="font-bold text-[#2563EB] text-sm font-mono">
                    {currencyFormatter.format(formData.maxBudgetUSD)}
                  </div>
                  <div className="text-[#667085]">
                    Conditioned Area: {formData.targetGrossFloorAreaSF.toLocaleString()} SF
                  </div>
                  <div className="text-[#667085]">
                    Layout: {formData.numberOfFloors} Floors • {formData.bedrooms} Beds • {formData.bathrooms} Baths
                  </div>
                  <div className="text-[#667085]">Parking: {formData.garageCapacity} Bay Garage</div>
                  <div className="text-[#667085]">Attached Files: {formData.files.length} documents</div>
                </div>
              </div>

              {/* Submission Error Alert */}
              {submissionError && (
                <div className="p-4 rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-[#D92D20] text-xs flex items-center justify-between gap-3 animate-in shake duration-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="font-bold">Transmission Alert</div>
                      <div>{submissionError} (All form data has been preserved locally).</div>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmitToN8n}
                    className="px-3 py-1.5 rounded-lg bg-[#D92D20] text-white font-semibold text-xs min-h-[38px] shrink-0 hover:bg-[#B42318]"
                  >
                    Retry Submission
                  </button>
                </div>
              )}

              {/* Big Prominent Submit Box */}
              <div className="p-6 rounded-2xl bg-[#F8FAFC] border-2 border-[#2563EB]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <div className="text-base font-bold text-[#172033]">Ready to Submit to n8n Automation?</div>
                  <p className="text-xs text-[#667085]">
                    Pushes structured project specs to n8n webhook, creates Google Sheet records, and logs deliverables.
                  </p>
                </div>

                <button
                  id="btn-submit-project-to-n8n"
                  onClick={handleSubmitToN8n}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 min-h-[48px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-[#98A2B3] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transmitting to n8n...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Project to n8n</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#E4E7EC]">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-4 py-2.5 min-h-[44px] rounded-xl border border-[#E4E7EC] text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                currentStep === 0
                  ? 'text-[#D0D5DD] bg-[#F9FAFB] cursor-not-allowed border-transparent'
                  : 'text-[#344054] bg-white hover:bg-[#F2F4F7]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleManualSaveDraft}
                className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-[#E4E7EC] bg-white hover:bg-[#F9FAFB] text-xs font-semibold text-[#667085] hover:text-[#172033] hidden sm:flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4 text-[#2563EB]" />
                <span>Save Draft</span>
              </button>

              {currentStep < WIZARD_STAGES.length - 1 ? (
                <button
                  id="btn-wizard-continue"
                  onClick={handleNext}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitToN8n}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#12B76A] hover:bg-[#027A48] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Submit Project</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SUCCESS CONFIRMATION MODAL */}
        {/* ============================================================== */}
        {submissionSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#E4E7EC] animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-[#ECFDF3] border border-[#ABEFC6] text-[#027A48] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-[#172033]">Project Synchronized to n8n!</h3>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Your project specifications and file attachments have been transmitted to the production n8n webhook and logged to Google Sheets.
                </p>
              </div>

              <div className="p-3 bg-[#F9FAFB] rounded-xl border border-[#E4E7EC] text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#667085]">Submission Ref:</span>
                  <span className="font-bold text-[#2563EB]">{submissionSuccess.submissionId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Timestamp:</span>
                  <span className="text-[#172033]">{new Date(submissionSuccess.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Destination:</span>
                  <span className="text-[#027A48]">Google Sheets / Drive</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => {
                    setSubmissionSuccess(null);
                    setScreen('plot');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <span>Plot Analysis</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSubmissionSuccess(null);
                    setScreen('floorplan');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#F2F4F7] hover:bg-[#E4E7EC] text-[#344054] font-semibold text-xs flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <span>2D Floor Plan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
