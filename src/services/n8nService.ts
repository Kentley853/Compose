export interface ProjectWizardData {
  // 1. Basic Project Info
  projectName: string;
  projectDescription: string;
  projectType: string;
  projectStage: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  architectName: string;
  createdAt: string;
  updatedAt: string;

  // 2. Client & Site Info
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  parcelNumber: string;
  siteArea: number;
  siteAreaUnit: 'sq ft' | 'acres' | 'sq meters';
  frontSetback: number; // in feet
  rearSetback: number;
  leftSetback: number;
  rightSetback: number;
  maxBuildingHeight: number; // in feet
  zoningClassification: string;
  localJurisdiction: string;
  latitude: string;
  longitude: string;
  siteOrientation: string;
  knownConstraints: string;
  floodZone: string;
  hoaRequirements: string;

  // 3. Building Requirements
  numberOfFloors: number;
  targetGrossFloorAreaSF: number;
  maxBudgetUSD: number;
  preferredStyle: string;
  bedrooms: number;
  bathrooms: number;
  targetOccupancy: number;
  garageCapacity: number;
  specialRooms: string[];

  // 4. Files & Documents
  files: Array<{
    id: string;
    name: string;
    size: string;
    category: string;
    uploadStatus: 'Uploaded' | 'Processed' | 'Pending';
    fileUrl?: string;
  }>;

  // 5. Design Preferences
  architecturalAesthetic: string;
  roofStyle: string;
  sustainabilityTargets: string[];
  preferredMaterials: string[];
  indoorOutdoorConnection: string;
  smartHomeRequirements: string;
  accessibilityRequirements: string;
  additionalNotes: string;
}

export interface N8nSubmissionPayload {
  submissionId: string;
  submittedAt: string;
  project: {
    name: string;
    description: string;
    type: string;
    stage: string;
    architectName: string;
    createdAt: string;
    updatedAt: string;
  };
  client: {
    name: string;
    email: string;
    phone: string;
  };
  site: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    parcelNumber: string;
    siteArea: number;
    siteAreaUnit: string;
    frontSetbackFeet: number;
    rearSetbackFeet: number;
    leftSetbackFeet: number;
    rightSetbackFeet: number;
    maxBuildingHeightFeet: number;
    zoningClassification: string;
    localJurisdiction: string;
    latitude: string;
    longitude: string;
    siteOrientation: string;
    knownConstraints: string;
    floodZone: string;
    hoaRequirements: string;
  };
  requirements: {
    numberOfFloors: number;
    targetGrossFloorAreaSF: number;
    maxBudgetUSD: number;
    preferredStyle: string;
    bedrooms: number;
    bathrooms: number;
    targetOccupancy: number;
    garageCapacity: number;
    specialRooms: string[];
  };
  designPreferences: {
    architecturalAesthetic: string;
    roofStyle: string;
    sustainabilityTargets: string[];
    preferredMaterials: string[];
    indoorOutdoorConnection: string;
    smartHomeRequirements: string;
    accessibilityRequirements: string;
    additionalNotes: string;
  };
  files: Array<{
    id: string;
    name: string;
    size: string;
    category: string;
    uploadStatus: string;
    fileUrl?: string;
  }>;
  generatedOutputs: {
    estimatedBudgetUSD: string;
    grossFloorAreaSqFt: string;
    primaryAlternativeName: string;
    roomsCount: number;
  };
  source: 'compose-ai-frontend';
  environment: 'production';
}

const DEFAULT_WEBHOOK_URL = 'https://droppflowwsystems.app.n8n.cloud/webhook/compose-submit';

export const getN8nWebhookUrl = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_N8N_SUBMIT_WEBHOOK_URL) {
    return import.meta.env.VITE_N8N_SUBMIT_WEBHOOK_URL;
  }
  return DEFAULT_WEBHOOK_URL;
};

export const getDraftStorageKey = (projectId: string = 'default'): string => {
  return `compose_ai_project_draft_${projectId}`;
};

export const saveProjectDraft = (projectId: string, data: Partial<ProjectWizardData>): void => {
  try {
    const key = getDraftStorageKey(projectId);
    localStorage.setItem(
      key,
      JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.warn('Failed to save project draft to localStorage:', err);
  }
};

export const loadProjectDraft = (projectId: string): Partial<ProjectWizardData> | null => {
  try {
    const key = getDraftStorageKey(projectId);
    const saved = localStorage.getItem(key);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn('Failed to load project draft from localStorage:', err);
  }
  return null;
};

export const clearProjectDraft = (projectId: string): void => {
  try {
    const key = getDraftStorageKey(projectId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('Failed to clear project draft from localStorage:', err);
  }
};

export interface SubmissionResult {
  success: boolean;
  submissionId: string;
  message: string;
  referenceUrl?: string;
  timestamp: string;
}

export const submitProjectToN8n = async (
  formData: ProjectWizardData,
  generatedOutputs: {
    estimatedBudgetUSD: string;
    grossFloorAreaSqFt: string;
    primaryAlternativeName: string;
    roomsCount: number;
  }
): Promise<SubmissionResult> => {
  const submissionId = `SUB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const timestamp = new Date().toISOString();

  const payload: N8nSubmissionPayload = {
    submissionId,
    submittedAt: timestamp,
    project: {
      name: formData.projectName,
      description: formData.projectDescription,
      type: formData.projectType,
      stage: formData.projectStage,
      architectName: formData.architectName,
      createdAt: formData.createdAt || timestamp,
      updatedAt: timestamp,
    },
    client: {
      name: formData.clientName,
      email: formData.clientEmail,
      phone: formData.clientPhone,
    },
    site: {
      streetAddress: formData.streetAddress,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      country: formData.country || 'United States',
      parcelNumber: formData.parcelNumber,
      siteArea: formData.siteArea,
      siteAreaUnit: formData.siteAreaUnit,
      frontSetbackFeet: formData.frontSetback,
      rearSetbackFeet: formData.rearSetback,
      leftSetbackFeet: formData.leftSetback,
      rightSetbackFeet: formData.rightSetback,
      maxBuildingHeightFeet: formData.maxBuildingHeight,
      zoningClassification: formData.zoningClassification,
      localJurisdiction: formData.localJurisdiction,
      latitude: formData.latitude,
      longitude: formData.longitude,
      siteOrientation: formData.siteOrientation,
      knownConstraints: formData.knownConstraints,
      floodZone: formData.floodZone,
      hoaRequirements: formData.hoaRequirements,
    },
    requirements: {
      numberOfFloors: formData.numberOfFloors,
      targetGrossFloorAreaSF: formData.targetGrossFloorAreaSF,
      maxBudgetUSD: formData.maxBudgetUSD,
      preferredStyle: formData.preferredStyle,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      targetOccupancy: formData.targetOccupancy,
      garageCapacity: formData.garageCapacity,
      specialRooms: formData.specialRooms,
    },
    designPreferences: {
      architecturalAesthetic: formData.architecturalAesthetic,
      roofStyle: formData.roofStyle,
      sustainabilityTargets: formData.sustainabilityTargets,
      preferredMaterials: formData.preferredMaterials,
      indoorOutdoorConnection: formData.indoorOutdoorConnection,
      smartHomeRequirements: formData.smartHomeRequirements,
      accessibilityRequirements: formData.accessibilityRequirements,
      additionalNotes: formData.additionalNotes,
    },
    files: formData.files.map((f) => ({
      id: f.id,
      name: f.name,
      size: f.size,
      category: f.category,
      uploadStatus: f.uploadStatus,
      fileUrl: f.fileUrl || `https://drive.google.com/mock-vault/${f.id}`,
    })),
    generatedOutputs,
    source: 'compose-ai-frontend',
    environment: 'production',
  };

  const webhookUrl = getN8nWebhookUrl();

  // Try proxy endpoint first to bypass any browser CORS restrictions
  try {
    const proxyRes = await fetch('/api/submit-n8n', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        success: true,
        submissionId,
        message: data?.data?.message || 'Project successfully synced to n8n automation & Google Sheets record.',
        referenceUrl: data?.data?.sheetUrl || data?.data?.url,
        timestamp,
      };
    }
  } catch (proxyErr) {
    // If proxy failed (e.g. running on client-only static hosting like Vercel), fall back to direct webhook
    console.info('Proxy endpoint /api/submit-n8n not reachable, falling back to direct webhook:', proxyErr);
  }

  // Direct webhook invocation
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`n8n webhook responded with HTTP ${response.status}: ${response.statusText}`);
    }

    let responseData: any = {};
    try {
      responseData = await response.json();
    } catch {
      responseData = { message: 'Processed' };
    }

    return {
      success: true,
      submissionId,
      message: responseData?.message || 'Project successfully synced to n8n automation & Google Sheets record.',
      referenceUrl: responseData?.sheetUrl || responseData?.url,
      timestamp,
    };
  } catch (err: any) {
    console.error('Error submitting project to n8n:', err);
    throw new Error(err.message || 'Network error connecting to n8n webhook.');
  }
};
