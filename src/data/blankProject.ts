import {
  ArchitecturalBrief,
  BuildingRequirements,
  PlanAlternative,
  PlotData,
  ProjectData,
  WorkflowStage,
} from '../types/architecture';

export const BLANK_WORKFLOW: WorkflowStage[] = [
  { id: 'wf-setup', name: 'Project setup', shortName: 'Setup', status: 'not_started', screenId: 'setup' },
  { id: 'wf-files', name: 'Document ingestion', shortName: 'Files', status: 'not_started', screenId: 'files' },
  { id: 'wf-plot', name: 'Plot intelligence', shortName: 'Plot', status: 'not_started', screenId: 'plot' },
  { id: 'wf-brief', name: 'Design brief', shortName: 'Brief', status: 'not_started', screenId: 'architect' },
  { id: 'wf-program', name: 'Room program', shortName: 'Rooms', status: 'not_started', screenId: 'floorplan' },
  { id: 'wf-2d', name: '2D plan', shortName: '2D', status: 'not_started', screenId: 'coordinated2d' },
  { id: 'wf-3d', name: '3D model', shortName: '3D', status: 'not_started', screenId: 'coordinated3d' },
  { id: 'wf-exterior', name: 'Exterior', shortName: 'Exterior', status: 'not_started', screenId: 'exterior' },
  { id: 'wf-compliance', name: 'Compliance screening', shortName: 'Compliance', status: 'not_started', screenId: 'compliance' },
  { id: 'wf-boq', name: 'BOQ and cost', shortName: 'Cost', status: 'not_started', screenId: 'boq' },
  { id: 'wf-deliverables', name: 'Deliverables', shortName: 'Export', status: 'not_started', screenId: 'deliverables' },
];

export function createEmptyScheme(name = 'Scheme 1'): PlanAlternative {
  return {
    id: 'scheme-1',
    name,
    conceptTag: 'Draft',
    description: 'No rooms have been programmed yet. Add a room program before treating this as a design scheme.',
    grossArea: 0,
    efficiency: 0,
    circulationPercentage: 0,
    daylightScore: 0,
    privacyScore: 0,
    warningCount: 0,
    rooms: [],
    selected: true,
  };
}

export function createBlankPlot(): PlotData {
  return {
    width: 0,
    depth: 0,
    area: 0,
    unit: 'feet',
    shape: 'rectangular',
    roadFacingSide: 'South',
    northDirectionDeg: 0,
    openSides: [],
    setbacks: { front: 0, rear: 0, left: 0, right: 0 },
    buildableArea: 0,
    perimeter: 0,
    coverageRatio: 0,
  };
}

export function createBlankRequirements(): BuildingRequirements {
  return {
    floors: 0,
    occupants: 0,
    bedrooms: 0,
    bathrooms: 0,
    parkingSpaces: 0,
    preferredStyle: 'Contemporary warm modern',
    targetBuiltUpArea: 0,
    requiredRooms: [],
    specialPriorities: [],
  };
}

export function createBlankBrief(unresolved: string[] = []): ArchitecturalBrief {
  return {
    id: 'brief-draft',
    revision: 'REV-01',
    projectObjectives: [],
    occupantProfile: '',
    spaceRequirements: [],
    zoningStrategy: {
      publicZone: [],
      privateZone: [],
      serviceZone: [],
      circulation: [],
    },
    adjacencyRequirements: [],
    circulationStrategy: '',
    daylightPriorities: [],
    ventilationPriorities: [],
    privacyPriorities: [],
    verticalCirculation: '',
    designAssumptions: [],
    unresolvedQuestions: unresolved,
  };
}

export interface BlankProjectInput {
  id?: string;
  name?: string;
  clientName?: string;
  location?: string;
  city?: string;
  state?: string;
  projectType?: string;
  description?: string;
  sourcePrompt?: string;
  requirements?: Partial<BuildingRequirements>;
  unresolvedQuestions?: string[];
}

export function createBlankProject(input: BlankProjectInput = {}): ProjectData {
  const id = input.id || `proj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date();
  const cityState = [input.city, input.state].filter(Boolean).join(', ');
  const location = input.location || cityState || '';

  return {
    id,
    identity: {
      id,
      name: input.name || 'Untitled architectural project',
      clientName: input.clientName || '',
      location,
      city: input.city || '',
      state: input.state || '',
      zipCode: '',
      streetAddress: '',
      buildingType: input.projectType || 'Single-family residential',
      projectType: input.projectType || 'Single-family residential',
      description: input.description || '',
      sourcePrompt: input.sourcePrompt || '',
      createdDate: now.toLocaleDateString(),
      lastModified: now.toLocaleTimeString(),
      currentRevision: 'REV-01',
      leadArchitect: '',
      unitSystem: 'imperial',
    },
    plot: createBlankPlot(),
    requirements: {
      ...createBlankRequirements(),
      ...input.requirements,
    },
    observations: [
      {
        id: 'obs-zoning-unverified',
        title: 'Zoning is not verified',
        description: 'No verified zoning, setback, height, coverage, or parking rule is stored for this project.',
        category: 'zoning',
        source: 'Regulatory source not configured',
        type: 'caution',
      },
    ],
    uploads: [],
    brief: createBlankBrief(
      input.unresolvedQuestions || [
        'Confirm the site address, lot area, and number of floors.',
        'Zoning requirements are not verified.',
      ],
    ),
    alternatives: [createEmptyScheme()],
    activeAlternativeId: 'scheme-1',
    complianceChecks: [],
    boqItems: [],
    workflow: BLANK_WORKFLOW.map((stage) => ({ ...stage })),
    revisions: [
      {
        id: 'rev-01',
        code: 'REV-01',
        timestamp: now.toISOString(),
        author: 'Project owner',
        summary: 'Draft project created. Requirements still need review.',
        type: 'brief',
      },
    ],
    activeRevision: 'REV-01',
    dependentOutputsOutdated: false,
    selectedLocation: input.city || '',
    locationIndexMultiplier: 1,
  };
}
