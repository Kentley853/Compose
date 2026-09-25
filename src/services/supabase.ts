import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ProjectData, UploadedFile, FileCategory, BuildingRequirements } from '../types/architecture';
import { INITIAL_JAKARTA_PROJECT } from '../data/sampleProjects';
import { createBlankBrief, createBlankProject, createBlankRequirements, createEmptyScheme } from '../data/blankProject';
import { friendlyDatabaseError } from '../lib/authErrors';

// Environment variable retrieval (Vite + Vercel / Next.js support)
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  '';

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

// Initialize Supabase Client (or local mock client if keys not provided)
const authStorage = {
  getItem(key: string) {
    const remember = localStorage.getItem('compose_auth_remember') !== '0';
    return (remember ? localStorage : sessionStorage).getItem(key);
  },
  setItem(key: string, value: string) {
    const remember = localStorage.getItem('compose_auth_remember') !== '0';
    if (remember) {
      sessionStorage.removeItem(key);
      localStorage.setItem(key, value);
    } else {
      localStorage.removeItem(key);
      sessionStorage.setItem(key, value);
    }
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: authStorage,
      },
    })
  : createClient('https://example.supabase.co', 'public-anon-key', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

// Project row representation in Supabase
export interface SupabaseProjectRow {
  id: string;
  user_id?: string;
  project_name: string;
  project_code?: string;
  description?: string;
  project_type?: string;
  project_stage?: string;
  status: 'active' | 'draft' | 'archived' | 'completed';
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
  project_name: string;
  project_code: string;
  description: string;
  project_type: string;
  project_stage: string;
  status: 'active' | 'draft' | 'archived' | 'completed';
  location: string;
  client_name: string;
  gfa_sf: number;
  rooms_count: number;
  active_revision: string;
  created_at: string;
  updated_at: string;
  schemes: { id: string; name: string; conceptTag: string }[];
}

export interface SupabaseFileRow {
  id: string;
  project_id: string;
  file_name: string;
  file_type: string;
  file_size: string;
  size_bytes: number;
  storage_path: string;
  category: string;
  description: string;
  upload_date: string;
  created_at: string;
}

// Local storage fallback key for offline resilience
const LOCAL_COMPANY_PROJECTS_KEY = 'compose_ai_company_projects_cache_v3';

export let lastProjectLoadWarning: string | null = null;

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error('Sign in before saving project data.');
  }
  return data.user.id;
}

function cacheKeyFor(userId: string): string {
  return `${LOCAL_COMPANY_PROJECTS_KEY}:${userId}`;
}

// -------------------------------------------------------------
// SERIALIZATION & DESERIALIZATION
// -------------------------------------------------------------

export function serializeProjectToRow(project: ProjectData): Omit<SupabaseProjectRow, 'created_at' | 'updated_at'> {
  const currentAlt =
    project.alternatives.find((a) => a.id === project.activeAlternativeId) ||
    project.alternatives[0];

  return {
    id: project.id,
    project_name: project.identity.name || 'Untitled Architectural Project',
    project_code: project.identity.currentRevision ? `PRJ-${project.identity.currentRevision}` : 'PRJ-001',
    description: project.identity.description || '',
    project_type: project.identity.buildingType || project.identity.projectType || 'Single-family residential',
    project_stage: 'Schematic design',
    status: 'active',
    client_information: {
      name: project.identity.clientName || '',
      location: project.identity.location || '',
      streetAddress: project.identity.streetAddress || '',
      city: project.identity.city || '',
      state: project.identity.state || '',
      zipCode: project.identity.zipCode || '',
      leadArchitect: project.identity.leadArchitect || '',
      sourcePrompt: project.identity.sourcePrompt || '',
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
      preferredStyle: project.requirements?.preferredStyle || 'Contemporary warm modern',
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
    compliance_results: project.complianceChecks || [],
    boq_data: project.boqItems || [],
  };
}

export function deserializeRowToProject(row: SupabaseProjectRow): ProjectData {
  const base = createBlankProject({
    id: row.id,
    name: row.project_name || 'Untitled architectural project',
  });

  const clientInfo = row.client_information || {};
  const siteInfo = row.site_information || {};
  const floorPlanData = row.floor_plan_data || {};
  const bldgReqs = row.building_requirements || {};
  const designPrefs = row.design_preferences || {};

  const restoredAlternatives =
    Array.isArray(floorPlanData.alternatives) && floorPlanData.alternatives.length > 0
      ? floorPlanData.alternatives
      : [createEmptyScheme()];

  const restoredActiveAltId =
    floorPlanData.activeAlternativeId || restoredAlternatives[0].id;

  return {
    id: row.id,
    identity: {
      ...base.identity,
      id: row.id,
      name: row.project_name || 'Untitled architectural project',
      clientName: clientInfo.name || '',
      location: clientInfo.location || '',
      streetAddress: clientInfo.streetAddress || '',
      city: clientInfo.city || '',
      state: clientInfo.state || '',
      zipCode: clientInfo.zipCode || '',
      buildingType: row.project_type || base.identity.buildingType,
      projectType: row.project_type || base.identity.projectType,
      description: row.description || '',
      sourcePrompt: clientInfo.sourcePrompt || '',
      leadArchitect: clientInfo.leadArchitect || '',
      currentRevision: floorPlanData.activeRevision || 'REV-01',
      createdDate: row.created_at ? new Date(row.created_at).toLocaleDateString() : base.identity.createdDate,
      lastModified: row.updated_at ? new Date(row.updated_at).toLocaleTimeString() : base.identity.lastModified,
    },
    plot: siteInfo.plot || base.plot,
    requirements: {
      ...createBlankRequirements(),
      ...bldgReqs,
    },
    observations: Array.isArray(siteInfo.observations) ? siteInfo.observations : base.observations,
    uploads: Array.isArray(floorPlanData.uploads) ? floorPlanData.uploads : [],
    brief: designPrefs.brief || createBlankBrief(),
    alternatives: restoredAlternatives,
    activeAlternativeId: restoredActiveAltId,
    complianceChecks: Array.isArray(row.compliance_results) ? row.compliance_results : [],
    boqItems: Array.isArray(row.boq_data) ? row.boq_data : [],
    workflow: Array.isArray(floorPlanData.workflow) && floorPlanData.workflow.length > 0
      ? floorPlanData.workflow
      : base.workflow,
    revisions: Array.isArray(floorPlanData.revisions) && floorPlanData.revisions.length > 0
      ? floorPlanData.revisions
      : base.revisions,
    activeRevision: floorPlanData.activeRevision || 'REV-01',
    dependentOutputsOutdated: false,
    selectedLocation: siteInfo.selectedLocation || clientInfo.city || '',
    locationIndexMultiplier: siteInfo.locationIndexMultiplier || 1,
  };
}

function toSummary(row: SupabaseProjectRow): ProjectSummary {
  const client = row.client_information || {};
  const floorPlan = row.floor_plan_data || {};
  const bldgReq = row.building_requirements || {};
  const currentAlt = floorPlan.alternatives?.[0];
  const roomsCount = currentAlt?.rooms?.length || 0;

  return {
    id: row.id,
    project_name: row.project_name,
    project_code: row.project_code || 'PRJ-001',
    description: row.description || '',
    project_type: row.project_type || 'Single-family residential',
    project_stage: row.project_stage || 'Schematic design',
    status: row.status || 'active',
    location: client.location || [client.city, client.state].filter(Boolean).join(', '),
    client_name: client.name || '',
    gfa_sf: bldgReq.targetBuiltUpArea || 0,
    rooms_count: roomsCount,
    active_revision: floorPlan.activeRevision || 'REV-01',
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
    schemes: Array.isArray(floorPlan.alternatives)
      ? floorPlan.alternatives.map((scheme: { id?: string; name?: string; conceptTag?: string }) => ({
          id: scheme.id || 'scheme',
          name: scheme.name || 'Untitled scheme',
          conceptTag: scheme.conceptTag || '',
        }))
      : [],
  };
}

// -------------------------------------------------------------
// COMPANY PROJECTS CRUD OPERATIONS
// -------------------------------------------------------------

// Fetch all company projects from Supabase
export async function fetchCompanyProjects(): Promise<ProjectSummary[]> {
  lastProjectLoadWarning = null;
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const userId = await requireUserId();

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      lastProjectLoadWarning = friendlyDatabaseError(error.message);
      const cached = getCachedCompanyProjects(userId);
      if (cached.length > 0) return cached;
      throw new Error(lastProjectLoadWarning);
    }

    const rows = (data || []) as SupabaseProjectRow[];
    localStorage.setItem(cacheKeyFor(userId), JSON.stringify(rows));
    return rows.map((row) => toSummary(row));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not load projects.';
    lastProjectLoadWarning = friendlyDatabaseError(message);
    const cached = getCachedCompanyProjects(userId);
    if (cached.length > 0 && !message.includes('not configured') && !message.includes('Sign in')) {
      return cached;
    }
    throw new Error(lastProjectLoadWarning);
  }
}

// Fetch single complete project by ID
export async function fetchProjectById(projectId: string): Promise<ProjectData | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const userId = await requireUserId();

  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      const cached = getCachedRowById(projectId, userId);
      if (cached) return deserializeRowToProject(cached);
      throw new Error(friendlyDatabaseError(error.message));
    }

    if (!data) {
      const cached = getCachedRowById(projectId, userId);
      return cached ? deserializeRowToProject(cached) : null;
    }

    const projectFiles = await fetchProjectFiles(projectId);
    const deserialized = deserializeRowToProject(data as SupabaseProjectRow);
    if (projectFiles.length > 0) {
      deserialized.uploads = projectFiles;
    }

    return deserialized;
  } catch (err: unknown) {
    const cached = getCachedRowById(projectId, userId);
    if (cached) return deserializeRowToProject(cached);
    const message = err instanceof Error ? err.message : 'Could not load this project.';
    throw new Error(friendlyDatabaseError(message));
  }
}

// Save or Update a project (Autosave & manual save)
export async function saveProjectToSupabase(project: ProjectData): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  const userId = await requireUserId();
  const rowData = serializeProjectToRow(project);

  try {
    const { error } = await supabase
      .from('projects')
      .upsert(
        {
          ...rowData,
          user_id: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      throw new Error(friendlyDatabaseError(error.message));
    }
    cacheProjectRow(rowData, userId);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Could not save this project.';
    throw new Error(friendlyDatabaseError(message));
  }
}

// Create a new project in Supabase
export interface CreateProjectOptions {
  description?: string;
  sourcePrompt?: string;
  city?: string;
  state?: string;
  clientName?: string;
  requirements?: Partial<BuildingRequirements>;
  unresolvedQuestions?: string[];
  template?: 'blank' | 'austin-starter';
}

export async function createNewProjectInSupabase(
  projectName: string,
  location: string = '',
  projectType: string = 'Single-family residential',
  options: CreateProjectOptions = {}
): Promise<ProjectData> {
  const newId = `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const [cityFromLocation, stateFromLocation] = location.split(',').map((part) => part.trim());

  let newProject: ProjectData;
  if (options.template === 'austin-starter') {
    newProject = {
      ...INITIAL_JAKARTA_PROJECT,
      id: newId,
      identity: {
        ...INITIAL_JAKARTA_PROJECT.identity,
        id: newId,
        name: projectName || 'Austin starter template',
        clientName: '',
        description:
          'Starter geometry for learning the workspace. These rooms are an example, not a survey of your site. Replace them before sharing the concept.',
        sourcePrompt: '',
        createdDate: new Date().toLocaleDateString(),
        lastModified: 'Just now',
        currentRevision: 'REV-01',
      },
      activeRevision: 'REV-01',
      uploads: [],
      dependentOutputsOutdated: false,
    };
  } else {
    newProject = createBlankProject({
      id: newId,
      name: projectName,
      location,
      city: options.city || cityFromLocation || '',
      state: options.state || stateFromLocation || '',
      projectType,
      description: options.description || '',
      sourcePrompt: options.sourcePrompt || '',
      clientName: options.clientName || '',
      requirements: options.requirements,
      unresolvedQuestions: options.unresolvedQuestions,
    });
  }

  await saveProjectToSupabase(newProject);
  return newProject;
}

// Rename a project
export async function renameProjectInSupabase(projectId: string, newName: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const userId = await requireUserId();
  const cachedList = getRawCachedList(userId);
  const match = cachedList.find((p) => p.id === projectId);
  if (match) {
    match.project_name = newName;
    match.updated_at = new Date().toISOString();
    localStorage.setItem(cacheKeyFor(userId), JSON.stringify(cachedList));
  }

  const { error } = await supabase
    .from('projects')
    .update({ project_name: newName, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw new Error(friendlyDatabaseError(error.message));
}

// Archive / Unarchive / change status of a project
export async function setProjectStatusInSupabase(
  projectId: string,
  status: 'active' | 'draft' | 'archived' | 'completed'
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const userId = await requireUserId();
  const cachedList = getRawCachedList(userId);
  const match = cachedList.find((p) => p.id === projectId);
  if (match) {
    match.status = status;
    match.updated_at = new Date().toISOString();
    localStorage.setItem(cacheKeyFor(userId), JSON.stringify(cachedList));
  }

  const { error } = await supabase
    .from('projects')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw new Error(friendlyDatabaseError(error.message));
}

// Duplicate a project
export async function duplicateProjectInSupabase(projectId: string): Promise<ProjectData> {
  const sourceProject = await fetchProjectById(projectId);
  if (!sourceProject) throw new Error('The project to duplicate was not found.');
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
        author: 'Compose AI Studio',
        summary: `Cloned from ${sourceProject.identity.name}`,
        type: 'plan',
      },
    ],
  };

  await saveProjectToSupabase(duplicatedProject);
  return duplicatedProject;
}

// Delete a project permanently after confirmation
export async function deleteProjectFromSupabase(projectId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }
  const userId = await requireUserId();
  const cachedList = getRawCachedList(userId).filter((p) => p.id !== projectId);
  localStorage.setItem(cacheKeyFor(userId), JSON.stringify(cachedList));

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);

  if (error) throw new Error(friendlyDatabaseError(error.message));
}

// -------------------------------------------------------------
// FILE STORAGE & PROJECT_FILES TABLE
// -------------------------------------------------------------

export interface UploadResult {
  fileId: string;
  storagePath: string;
  signedUrl: string;
  sizeBytes: number;
  sizeFormatted: string;
}

// Upload file to 'project-files' bucket and register in project_files table
export async function uploadProjectFileToStorage(
  projectId: string,
  file: File,
  category: FileCategory = 'Other',
  description: string = ''
): Promise<UploadResult> {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const userId = isSupabaseConfigured() ? await requireUserId() : 'local';
  const storagePath = `${userId}/${projectId}/${Date.now()}_${sanitizedName}`;

  const sizeFormatted =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

  const fileId = `file-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase storage is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  // 1. Upload to Supabase Storage bucket 'project-files'
  const { data, error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  // 2. Generate signed download URL (valid for 24 hours)
  const { data: signedData, error: signedError } = await supabase.storage
    .from('project-files')
    .createSignedUrl(storagePath, 86400);

  const signedUrl = signedData?.signedUrl || '';

  // 3. Save metadata record to project_files table
  try {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    await supabase.from('project_files').insert({
      id: fileId,
      project_id: projectId,
      user_id: userId,
      file_name: file.name,
      file_type: ext || file.type || 'Document',
      file_size: sizeFormatted,
      size_bytes: file.size,
      storage_path: data?.path || storagePath,
      category: category,
      description: description || 'Uploaded to project files workspace',
      upload_date: new Date().toISOString(),
    });
  } catch (metaErr) {
    console.warn('Could not insert project_files record:', metaErr);
  }

  return {
    fileId,
    storagePath: data?.path || storagePath,
    signedUrl,
    sizeBytes: file.size,
    sizeFormatted,
  };
}

// Fetch file metadata records for a project
export async function fetchProjectFiles(projectId: string): Promise<UploadedFile[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: SupabaseFileRow) => ({
      id: row.id,
      name: row.file_name,
      type: (row.category as FileCategory) || 'Other',
      category: (row.category as FileCategory) || 'Other',
      size: row.file_size || '0 KB',
      sizeBytes: row.size_bytes || 0,
      uploadDate: new Date(row.upload_date || row.created_at).toLocaleDateString(),
      status: 'Ready',
      extension: '.' + row.file_name.split('.').pop()?.toLowerCase(),
      notes: row.description || '',
      storagePath: row.storage_path,
    }));
  } catch {
    return [];
  }
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

// Delete file from Supabase Storage and project_files table
export async function deleteFileFromSupabase(
  projectId: string,
  fileId: string,
  storagePath?: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  // 1. Delete from storage if path provided
  if (storagePath) {
    try {
      await supabase.storage.from('project-files').remove([storagePath]);
    } catch (err) {
      console.warn('Storage deletion warning:', err);
    }
  }

  // 2. Delete metadata row
  try {
    await supabase
      .from('project_files')
      .delete()
      .eq('project_id', projectId)
      .eq('id', fileId);
  } catch (err) {
    console.warn('File metadata row deletion warning:', err);
  }
}

// -------------------------------------------------------------
// LOCAL CACHE & INITIALIZATION HELPERS
// -------------------------------------------------------------

function getRawCachedList(userId: string): SupabaseProjectRow[] {
  try {
    const raw = localStorage.getItem(cacheKeyFor(userId));
    if (raw) return JSON.parse(raw);
  } catch {
    return [];
  }
  return [];
}

function getCachedRowById(projectId: string, userId: string): SupabaseProjectRow | null {
  const list = getRawCachedList(userId);
  return list.find((p) => p.id === projectId) || null;
}

function cacheProjectRow(row: Omit<SupabaseProjectRow, 'created_at' | 'updated_at'>, userId: string): void {
  try {
    const list = getRawCachedList(userId);
    const existingIndex = list.findIndex((p) => p.id === row.id);
    const fullRow: SupabaseProjectRow = {
      ...row,
      user_id: userId,
      created_at: existingIndex >= 0 ? list[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      list[existingIndex] = fullRow;
    } else {
      list.unshift(fullRow);
    }
    localStorage.setItem(cacheKeyFor(userId), JSON.stringify(list));
  } catch (e) {
    console.warn('Could not cache project locally:', e);
  }
}

function getCachedCompanyProjects(userId: string): ProjectSummary[] {
  return getRawCachedList(userId).map((row) => toSummary(row));
}
