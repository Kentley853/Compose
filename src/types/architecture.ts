export type ScreenId =
  | 'landing'
  | 'dashboard'
  | 'setup'
  | 'plot'
  | 'architect'
  | 'floorplan'
  | 'coordinated2d'
  | 'coordinated3d'
  | 'exterior'
  | 'compliance'
  | 'boq'
  | 'deliverables'
  | 'files'
  | 'activity'
  | 'settings';

export type StageStatus = 'not_started' | 'in_progress' | 'needs_review' | 'approved' | 'outdated';

export interface WorkflowStage {
  id: string;
  name: string;
  shortName?: string;
  status: StageStatus;
  screenId: ScreenId;
  revision?: string;
  notes?: string;
  description?: string;
  lastUpdated?: string;
}

export type Orientation = 'North' | 'South' | 'East' | 'West' | 'North-East' | 'North-West' | 'South-East' | 'South-West';

export interface PlotData {
  width: number; // in feet (or meters if unit is meters)
  depth: number; // in feet
  area: number; // width * depth (sq ft or sqm)
  unit: 'feet' | 'meters';
  shape: 'rectangular' | 'irregular' | 'corner' | 't-junction';
  roadFacingSide: 'South' | 'North' | 'East' | 'West';
  northDirectionDeg: number; // 0 = top, 90 = right
  openSides: ('South' | 'North' | 'East' | 'West')[];
  setbacks: {
    front: number; // feet (or meters)
    rear: number;
    left: number;
    right: number;
  };
  coordinates?: string;
  buildableArea: number;
  perimeter: number;
  coverageRatio: number; // buildable / plot
}

export interface ObservationItem {
  id: string;
  title: string;
  description: string;
  category: 'access' | 'daylight' | 'ventilation' | 'privacy' | 'zoning';
  source: 'User input' | 'Deterministic calculation' | 'Uploaded document' | 'AI interpretation' | 'Regulatory source not configured';
  type: 'info' | 'positive' | 'warning' | 'caution';
}

export interface ProjectIdentity {
  id?: string;
  name: string;
  clientName: string;
  location: string;
  streetAddress?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  county?: string;
  parcelNumber?: string;
  latitude?: string;
  longitude?: string;
  jurisdiction?: string;
  codeEdition?: string;
  buildingType: string;
  description: string;
  createdDate: string;
  lastModified: string;
  currentRevision: string;
  leadArchitect?: string;
  projectType?: string;
  unitSystem?: 'imperial' | 'metric';
}

export interface BuildingRequirements {
  floors: number;
  occupants: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  preferredStyle: 'Contemporary warm modern' | 'Modern minimalist' | 'Warm natural' | 'Urban contemporary' | 'Desert contemporary';
  targetBuiltUpArea: number; // sq ft (conditioned)
  finishLevel?: 'Economy' | 'Standard' | 'Premium' | 'Luxury';
  constructionQuality?: 'Standard' | 'High Quality' | 'Custom Architectural';
  projectCategory?: 'New Construction' | 'Major Renovation';
  budgetBand?: 'Economical' | 'Standard' | 'Premium Executive' | 'Luxury Bespoke';
  requiredRooms: string[];
  specialPriorities: string[];
}

export type FileCategory =
  | 'Site Plan'
  | 'Survey'
  | 'Sketch'
  | 'Regulation'
  | 'Project Brief'
  | 'Reference Image'
  | 'BOQ'
  | '3D Reference'
  | 'Other';

export type FileProcessingStatus =
  | 'Uploading'
  | 'Processing'
  | 'Ready'
  | 'Needs review'
  | 'Unsupported'
  | 'Failed'
  | 'Processed'
  | 'Analyzing'
  | 'Pending review';

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  category?: FileCategory;
  size: string;
  sizeBytes?: number;
  uploadDate: string;
  status: FileProcessingStatus;
  extension?: string;
  progress?: number;
  usedByRevision?: string;
  isExperimental?: boolean;
  notes?: string;
  previewUrl?: string;
  textContent?: string;
}

export interface RoomData {
  id: string;
  name: string;
  floor: 1 | 2;
  x: number; // relative meters from plot origin
  y: number;
  width: number;
  height: number;
  area: number;
  zone: 'Public' | 'Private' | 'Service' | 'Circulation' | 'Outdoor';
  daylightScore: number; // 1-100
  ventilationScore: number; // 1-100
  openings: {
    doors: { wall: 'north' | 'south' | 'east' | 'west'; pos: number; width: number }[];
    windows: { wall: 'north' | 'south' | 'east' | 'west'; pos: number; width: number }[];
  };
  color?: string;
}

export interface PlanAlternative {
  id: string;
  name: string;
  conceptTag: string;
  description: string;
  grossArea: number;
  efficiency: number; // percentage
  circulationPercentage: number;
  daylightScore: number; // out of 100
  privacyScore: number; // out of 100
  warningCount: number;
  rooms: RoomData[];
  selected?: boolean;
}

export interface ArchitecturalBrief {
  id: string;
  revision: string;
  approvedDate?: string;
  projectObjectives: string[];
  occupantProfile: string;
  spaceRequirements: { room: string; targetArea: number; floor: 1 | 2; zone: string }[];
  zoningStrategy: {
    publicZone: string[];
    privateZone: string[];
    serviceZone: string[];
    circulation: string[];
  };
  adjacencyRequirements: string[];
  circulationStrategy: string;
  daylightPriorities: string[];
  ventilationPriorities: string[];
  privacyPriorities: string[];
  verticalCirculation: string;
  designAssumptions: string[];
  unresolvedQuestions: string[];
}

export interface ComplianceCheck {
  id: string;
  name: string;
  category:
    | 'Lot & Zoning'
    | 'Setbacks'
    | 'Building Height'
    | 'Lot Coverage'
    | 'FAR'
    | 'Parking'
    | 'Egress'
    | 'Stairs & Guards'
    | 'Fire Separation'
    | 'Accessibility'
    | 'Energy Code'
    | 'Structure'
    | 'MEP'
    | 'Permit Review';
  status: 'Pass' | 'Warning' | 'Fail' | 'Professional review required';
  explanation: string;
  source:
    | 'Deterministic geometry check'
    | 'User-provided requirement'
    | 'Configured regulatory source'
    | 'AI interpretation'
    | 'Professional review required'
    | 'Not checked';
  applicableRevision: string;
  recommendedAction: string;
}

export interface BOQItem {
  id: string;
  category:
    | 'General conditions'
    | 'Site work'
    | 'Concrete'
    | 'Framing'
    | 'Sheathing'
    | 'Roofing'
    | 'Insulation'
    | 'Drywall'
    | 'Doors'
    | 'Windows'
    | 'Interior finishes'
    | 'Plumbing'
    | 'HVAC'
    | 'Electrical'
    | 'Landscaping'
    | 'Preliminaries'
    | 'Earthworks'
    | 'Masonry'
    | 'Doors and windows'
    | 'Finishes'
    | 'External works';
  item: string;
  unit: string; // 'Each' | 'LF' | 'SF' | 'CY' | 'LS' | 'Allowance' | 'Set' | 'Points' | 'm²' | 'm³'
  quantity: number;
  unitRate: number; // in USD base
  lowEstimate: number;
  expectedEstimate: number;
  highEstimate: number;
  source: 'Calculated from plan geometry' | 'Regional benchmark rate' | 'Standard waste coefficient';
  confidence: 'High' | 'Medium' | 'Conceptual';
}

export interface ExteriorMaterialPreset {
  id: string;
  name: string;
  façadeRender: string;
  accentMaterial: string;
  glazingTint: string;
  roofFinish: string;
  landscapeTone: string;
  description: string;
}

export interface ProjectData {
  id: string;
  identity: ProjectIdentity;
  plot: PlotData;
  requirements: BuildingRequirements;
  observations: ObservationItem[];
  uploads: UploadedFile[];
  brief: ArchitecturalBrief;
  alternatives: PlanAlternative[];
  activeAlternativeId: string;
  complianceChecks: ComplianceCheck[];
  boqItems: BOQItem[];
  workflow: WorkflowStage[];
  revisions: {
    id: string;
    code: string;
    timestamp: string;
    author: string;
    summary: string;
    type: 'plot' | 'brief' | 'plan' | 'compliance';
  }[];
  activeRevision: string;
  dependentOutputsOutdated: boolean;
  selectedLocation: 'Austin' | 'Seattle' | 'Scottsdale' | 'Denver' | string;
  locationIndexMultiplier: number;
}
