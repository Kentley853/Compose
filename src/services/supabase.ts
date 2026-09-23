import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { ProjectData, UploadedFile, FileCategory } from '../types/architecture';
import { INITIAL_JAKARTA_PROJECT } from '../data/sampleProjects';

// Environment variable retrieval
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validation helper
export const isSupabaseConfigured = (): boolean => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('your-project.supabase.co') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// Initialize Supabase Client (or dummy client if not yet configured)
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
      },
    })
  : createClient('https://mock-supabase.supabase.co', 'mock-anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

// Project row representation in Supabase
export interface SupabaseProjectRow {
  id: string;
  user_id: string;
  project_name: string;
  description: string;
  project_type: string;
  project_stage: string;
  status: 'active' | 'draft' | 'archived';
  client_information: any;
  site_information: any;
  building_requirements: any;
  design_preferences: any;
  room_program: any;
  floor_plan_data: any;
  model_3d_data: any;
  compliance_results: any;
  boq_data: any;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary {
  id: string;
  user_id: string;
  project_name: string;
  description: string;
  project_type: string;
  project_stage: string;
  status: 'active' | 'draft' | 'archived';
  location: string;
  client_name: string;
  gfa_sf: number;
  rooms_count: number;
  active_revision: string;
  created_at: string;
  updated_at: string;
}

// Local mock storage key for when Supabase keys are not yet configured
const LOCAL_MOCK_PROJECTS_KEY = 'compose_ai_mock_supabase_projects_v1';
const LOCAL_MOCK_USER_KEY = 'compose_ai_mock_supabase_user_v1';

// Helper to serialize ProjectData into Supabase row structure
export function serializeProjectToRow(project: ProjectData, userId: string): Omit<SupabaseProjectRow, 'created_at' | 'updated_at'> {
  const currentAlt =
    project.alternatives.find((a) => a.id === project.activeAlternativeId) ||
    project.alternatives[0];

  return {
    id: project.id,
    user_id: userId,
    project_name: project.identity.name || 'Untitled Architectural Project',
    description: project.identity.description || '',
    project_type: project.identity.buildingType || project.identity.projectType || 'Single-family residential',
    project_stage: 'Schematic design',
    status: 'active',
    client_information: {
      name: project.identity.clientName || 'Private Client',
      location: project.identity.location || 'Austin, Texas',
      streetAddress: project.identity.streetAddress,
      city: project.identity.city,
      state: project.identity.state,
      zipCode: project.identity.zipCode,
      leadArchitect: project.identity.leadArchitect || 'Lead Architect',
    },
    site_information: {
      plot: project.plot,
      observations: project.observations,
      selectedLocation: project.selectedLocation,
      locationIndexMultiplier: project.locationIndexMultiplier,
    },
    building_requirements: project.requirements,
    design_preferences: {
      brief: project.brief,
      preferredStyle: project.requirements.preferredStyle,
    },
    room_program: {
      rooms: currentAlt ? currentAlt.rooms : [],
      activeFloor: 1,
    },
    floor_plan_data: {
      alternatives: project.alternatives,
      activeAlternativeId: project.activeAlternativeId,
      activeRevision: project.activeRevision,
      revisions: project.revisions,
      workflow: project.workflow,
      uploads: project.uploads,
    },
    model_3d_data: {
      selected3DStyle: 'Contemporary warm modern',
      selected3DMaterial: 'Limestone & cedar',
    },
    compliance_results: project.complianceChecks,
    boq_data: project.boqItems,
  };
}

// Helper to deserialize Supabase row back into complete ProjectData
export function deserializeRowToProject(row: SupabaseProjectRow): ProjectData {
  const base = INITIAL_JAKARTA_PROJECT;

  const clientInfo = row.client_information || {};
  const siteInfo = row.site_information || {};
  const floorPlanData = row.floor_plan_data || {};
  const bldgReqs = row.building_requirements || {};
  const designPrefs = row.design_preferences || {};

  const restoredAlternatives =
    floorPlanData.alternatives && floorPlanData.alternatives.length > 0
      ? floorPlanData.alternatives
      : base.alternatives;

  const restoredActiveAltId =
    floorPlanData.activeAlternativeId ||
    (restoredAlternatives[0] ? restoredAlternatives[0].id : 'alt-1');

  return {
    id: row.id,
    identity: {
      ...base.identity,
      id: row.id,
      name: row.project_name || 'Untitled Project',
      clientName: clientInfo.name || 'Private Client',
      location: clientInfo.location || 'Austin, Texas',
      streetAddress: clientInfo.streetAddress || '',
      city: clientInfo.city || '',
      state: clientInfo.state || '',
      zipCode: clientInfo.zipCode || '',
      buildingType: row.project_type || base.identity.buildingType,
      projectType: row.project_type || base.identity.buildingType,
      description: row.description || '',
      leadArchitect: clientInfo.leadArchitect || 'Lead Architect',
      currentRevision: floorPlanData.activeRevision || 'REV-01',
      createdDate: row.created_at ? new Date(row.created_at).toLocaleDateString() : 'Today',
      lastModified: row.updated_at ? new Date(row.updated_at).toLocaleTimeString() : 'Just now',
    },
    plot: siteInfo.plot || base.plot,
    requirements: {
      ...base.requirements,
      ...bldgReqs,
    },
    observations: siteInfo.observations || base.observations,
    uploads: Array.isArray(floorPlanData.uploads) ? floorPlanData.uploads : [],
    brief: designPrefs.brief || base.brief,
    alternatives: restoredAlternatives,
    activeAlternativeId: restoredActiveAltId,
    complianceChecks: Array.isArray(row.compliance_results) && row.compliance_results.length > 0
      ? row.compliance_results
      : base.complianceChecks,
    boqItems: Array.isArray(row.boq_data) && row.boq_data.length > 0
      ? row.boq_data
      : base.boqItems,
    workflow: Array.isArray(floorPlanData.workflow) && floorPlanData.workflow.length > 0
      ? floorPlanData.workflow
      : base.workflow,
    revisions: Array.isArray(floorPlanData.revisions) && floorPlanData.revisions.length > 0
      ? floorPlanData.revisions
      : base.revisions,
    activeRevision: floorPlanData.activeRevision || 'REV-01',
    dependentOutputsOutdated: false,
    selectedLocation: siteInfo.selectedLocation || 'Austin',
    locationIndexMultiplier: siteInfo.locationIndexMultiplier || 1.0,
  };
}

// -------------------------------------------------------------
// PROJECT DATABASE OPERATIONS
// -------------------------------------------------------------

// Fetch all project summaries for a user
export async function fetchUserProjects(userId: string): Promise<ProjectSummary[]> {
  if (!isSupabaseConfigured()) {
    // Return from local mock storage
    const raw = localStorage.getItem(LOCAL_MOCK_PROJECTS_KEY);
    if (!raw) return getInitialMockProjects(userId);
    try {
      const parsed: SupabaseProjectRow[] = JSON.parse(raw);
      return parsed
        .filter((p) => p.user_id === userId)
        .map((row) => toSummary(row));
    } catch {
      return getInitialMockProjects(userId);
    }
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects from Supabase:', error);
    throw new Error(error.message);
  }

  return (data || []).map((row) => toSummary(row as SupabaseProjectRow));
}

// Fetch single project by ID
export async function fetchProjectById(projectId: string, userId: string): Promise<ProjectData> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(LOCAL_MOCK_PROJECTS_KEY);
    if (raw) {
      try {
        const parsed: SupabaseProjectRow[] = JSON.parse(raw);
        const match = parsed.find((p) => p.id === projectId && p.user_id === userId);
        if (match) return deserializeRowToProject(match);
      } catch (e) {
        console.warn('Error reading mock project by ID:', e);
      }
    }
    // Return sample if matching ID or default
    return {
      ...INITIAL_JAKARTA_PROJECT,
      id: projectId,
    };
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error loading project by ID from Supabase:', error);
    throw new Error(error?.message || 'Project not found or access denied.');
  }

  return deserializeRowToProject(data as SupabaseProjectRow);
}

// Save or Update a project (Used by Autosave and manual saves)
export async function saveProjectToSupabase(project: ProjectData, userId: string): Promise<void> {
  const rowData = serializeProjectToRow(project, userId);

  if (!isSupabaseConfigured()) {
    // Offline local mock storage save
    const raw = localStorage.getItem(LOCAL_MOCK_PROJECTS_KEY);
    let list: SupabaseProjectRow[] = [];
    if (raw) {
      try {
        list = JSON.parse(raw);
      } catch {
        list = [];
      }
    }
    const existingIndex = list.findIndex((p) => p.id === project.id && p.user_id === userId);
    const fullRow: SupabaseProjectRow = {
      ...rowData,
      created_at: existingIndex >= 0 ? list[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      list[existingIndex] = fullRow;
    } else {
      list.unshift(fullRow);
    }
    localStorage.setItem(LOCAL_MOCK_PROJECTS_KEY, JSON.stringify(list));
    return;
  }

  const { error } = await supabase
    .from('projects')
    .upsert(
      {
        ...rowData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

  if (error) {
    console.error('Failed to save project to Supabase:', error);
    throw new Error(error.message);
  }
}

// Create a new project row in Supabase
export async function createNewProjectInSupabase(
  userId: string,
  projectName: string,
  location: string = 'Austin, Texas',
  projectType: string = 'Single-family residential'
): Promise<ProjectData> {
  const newId = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const timestamp = new Date().toISOString();

  const newProject: ProjectData = {
    ...INITIAL_JAKARTA_PROJECT,
    id: newId,
    identity: {
      ...INITIAL_JAKARTA_PROJECT.identity,
      id: newId,
      name: projectName,
      clientName: 'New Client',
      location: location,
      buildingType: projectType,
      projectType: projectType,
      currentRevision: 'REV-01',
      createdDate: new Date().toLocaleDateString(),
      lastModified: 'Just now',
    },
    activeRevision: 'REV-01',
    dependentOutputsOutdated: false,
    uploads: [],
  };

  await saveProjectToSupabase(newProject, userId);
  return newProject;
}

// Rename a project
export async function renameProjectInSupabase(projectId: string, userId: string, newName: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(LOCAL_MOCK_PROJECTS_KEY);
    if (raw) {
      try {
        const list: SupabaseProjectRow[] = JSON.parse(raw);
        const match = list.find((p) => p.id === projectId && p.user_id === userId);
        if (match) {
          match.project_name = newName;
          match.updated_at = new Date().toISOString();
          localStorage.setItem(LOCAL_MOCK_PROJECTS_KEY, JSON.stringify(list));
        }
      } catch {}
    }
    return;
  }

  const { error } = await supabase
    .from('projects')
    .update({ project_name: newName, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// Archive or Unarchive a project
export async function setProjectStatusInSupabase(
  projectId: string,
  userId: string,
  status: 'active' | 'draft' | 'archived'
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(LOCAL_MOCK_PROJECTS_KEY);
    if (raw) {
      try {
        const list: SupabaseProjectRow[] = JSON.parse(raw);
        const match = list.find((p) => p.id === projectId && p.user_id === userId);
        if (match) {
          match.status = status;
          match.updated_at = new Date().toISOString();
          localStorage.setItem(LOCAL_MOCK_PROJECTS_KEY, JSON.stringify(list));
        }
      } catch {}
    }
    return;
  }

  const { error } = await supabase
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// Duplicate a project
export async function duplicateProjectInSupabase(projectId: string, userId: string): Promise<ProjectData> {
  const sourceProject = await fetchProjectById(projectId, userId);
  const newId = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const duplicateName = `${sourceProject.identity.name} (Copy)`;

  const duplicatedProject: ProjectData = {
    ...sourceProject,
    id: newId,
    identity: {
      ...sourceProject.identity,
      id: newId,
      name: duplicateName,
      createdDate: new Date().toLocaleDateString(),
      lastModified: 'Just now',
      currentRevision: 'REV-01',
    },
    activeRevision: 'REV-01',
    revisions: [
      {
        id: 'rev-01',
        code: 'REV-01',
        timestamp: new Date().toISOString(),
        author: 'Lead Architect',
        summary: `Cloned from ${sourceProject.identity.name}`,
        type: 'plan',
      },
    ],
  };

  await saveProjectToSupabase(duplicatedProject, userId);
  return duplicatedProject;
}

// Delete a project
export async function deleteProjectFromSupabase(projectId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const raw = localStorage.getItem(LOCAL_MOCK_PROJECTS_KEY);
    if (raw) {
      try {
        let list: SupabaseProjectRow[] = JSON.parse(raw);
        list = list.filter((p) => !(p.id === projectId && p.user_id === userId));
        localStorage.setItem(LOCAL_MOCK_PROJECTS_KEY, JSON.stringify(list));
      } catch {}
    }
    return;
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw new Error(error.message);
}

// -------------------------------------------------------------
// SUPABASE STORAGE OPERATIONS
// -------------------------------------------------------------

export interface UploadResult {
  storagePath: string;
  signedUrl: string;
  sizeBytes: number;
  sizeFormatted: string;
}

// Upload file to Supabase Storage in user_id/project_id/files/
export async function uploadProjectFileToStorage(
  userId: string,
  projectId: string,
  file: File
): Promise<UploadResult> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${userId}/${projectId}/files/${Date.now()}_${sanitizedName}`;

  const sizeFormatted =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

  if (!isSupabaseConfigured()) {
    // Local in-memory URL for mock/demo mode
    const objectUrl = URL.createObjectURL(file);
    return {
      storagePath,
      signedUrl: objectUrl,
      sizeBytes: file.size,
      sizeFormatted,
    };
  }

  // Upload to Supabase bucket 'project-files'
  const { data, error } = await supabase.storage
    .from('project-files')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Supabase Storage upload error:', error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // Generate a signed URL valid for 24 hours (86400 seconds)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('project-files')
    .createSignedUrl(storagePath, 86400);

  if (signedError || !signedData?.signedUrl) {
    console.warn('Could not generate signed URL immediately:', signedError);
  }

  return {
    storagePath: data?.path || storagePath,
    signedUrl: signedData?.signedUrl || '',
    sizeBytes: file.size,
    sizeFormatted,
  };
}

// Retrieve fresh signed download URL for private files
export async function getFileDownloadUrl(storagePath: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    return '#';
  }

  const { data, error } = await supabase.storage
    .from('project-files')
    .createSignedUrl(storagePath, 3600, {
      download: true,
    });

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Failed to generate signed download link.');
  }

  return data.signedUrl;
}

// Delete file from Supabase Storage
export async function deleteFileFromStorage(storagePath: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const { error } = await supabase.storage.from('project-files').remove([storagePath]);
  if (error) {
    console.warn('Storage deletion warning:', error);
  }
}

// Helper to convert row to summary
function toSummary(row: SupabaseProjectRow): ProjectSummary {
  const client = row.client_information || {};
  const floorPlan = row.floor_plan_data || {};
  const bldgReq = row.building_requirements || {};
  const currentAlt = floorPlan.alternatives?.[0];
  const roomsCount = currentAlt?.rooms?.length || 0;

  return {
    id: row.id,
    user_id: row.user_id,
    project_name: row.project_name,
    description: row.description || '',
    project_type: row.project_type || 'Single-family residential',
    project_stage: row.project_stage || 'Early concept',
    status: row.status || 'active',
    location: client.location || 'Austin, Texas',
    client_name: client.name || 'Private Client',
    gfa_sf: bldgReq.targetBuiltUpArea || 3850,
    rooms_count: roomsCount || 10,
    active_revision: floorPlan.activeRevision || 'REV-01',
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// Initial mock projects when no credentials are configured
function getInitialMockProjects(userId: string): ProjectSummary[] {
  return [
    {
      id: 'proj-live-01',
      user_id: userId,
      project_name: 'Austin Contemporary Residence',
      description: 'Two-story passive solar home on 60 ft x 120 ft infill lot with double-height great room and courtyard lanai.',
      project_type: 'Single-family residential',
      project_stage: 'Schematic design',
      status: 'active',
      location: 'Austin, Texas',
      client_name: 'Client Project Alpha',
      gfa_sf: 3850,
      rooms_count: 10,
      active_revision: 'REV-01',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'proj-jakarta-01',
      user_id: userId,
      project_name: 'Jakarta Urban Residence',
      description: 'Compact urban residence on 15m x 24m lot with cross-ventilation lightwell and tropical overhangs.',
      project_type: 'Single-family residential',
      project_stage: 'Feasibility study',
      status: 'draft',
      location: 'South Jakarta, Indonesia',
      client_name: 'Bpk. Hendra Gunawan',
      gfa_sf: 3050,
      rooms_count: 8,
      active_revision: 'REV-03',
      created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}
