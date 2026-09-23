import React, { useState, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import {
  ProjectSummary,
  fetchUserProjects,
  createNewProjectInSupabase,
  renameProjectInSupabase,
  duplicateProjectInSupabase,
  setProjectStatusInSupabase,
  deleteProjectFromSupabase,
  isSupabaseConfigured,
} from '../../services/supabase';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  MoreVertical,
  FolderOpen,
  Edit2,
  Copy,
  Archive,
  ArchiveRestore,
  Trash2,
  Calendar,
  MapPin,
  Building,
  CheckCircle2,
  AlertCircle,
  Database,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';

export const ProjectsListScreen: React.FC = () => {
  const { user, openSignIn } = useAuth();
  const { project: activeProject, openProjectById, createNewProject, setScreen, addToast } = useProject();

  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'name_asc' | 'created_desc'>('updated_desc');

  // Modals & Action States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('Austin, Texas');
  const [newProjectType, setNewProjectType] = useState('Single-family residential');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [targetProject, setTargetProject] = useState<ProjectSummary | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [isSubmittingRename, setIsSubmittingRename] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Active action menu popover
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const loadProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserProjects(user.id);
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to load user projects:', err);
      setError(err?.message || 'Could not retrieve project records from Supabase.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [user]);

  // Filter & Sort computation
  const filteredProjects = projects
    .filter((p) => {
      const matchesSearch =
        p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.project_type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' ? true : p.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'updated_desc') {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      if (sortBy === 'created_desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.project_name.localeCompare(b.project_name);
    });

  // Action: Open Project
  const handleOpenProject = async (p: ProjectSummary) => {
    try {
      await openProjectById(p.id);
      addToast('Project Loaded', `Switched to "${p.project_name}".`, 'success');
      setScreen('dashboard');
    } catch (err: any) {
      addToast('Failed to Open', err.message || 'Error restoring project data.', 'error');
    }
  };

  // Action: Create Project
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    if (!user) {
      openSignIn();
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const created = await createNewProjectInSupabase(
        user.id,
        newProjectName.trim(),
        newProjectLocation.trim(),
        newProjectType
      );
      await loadProjects();
      await openProjectById(created.id);
      setCreateModalOpen(false);
      setNewProjectName('');
      addToast('Project Created', `"${created.identity.name}" created and saved to Supabase.`, 'success');
      setScreen('setup');
    } catch (err: any) {
      addToast('Creation Error', err.message || 'Failed to create project in Supabase.', 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Action: Rename Project
  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProject || !renameValue.trim() || !user) return;

    setIsSubmittingRename(true);
    try {
      await renameProjectInSupabase(targetProject.id, user.id, renameValue.trim());
      await loadProjects();
      setRenameModalOpen(false);
      addToast('Project Renamed', `Project title updated to "${renameValue.trim()}".`, 'success');
    } catch (err: any) {
      addToast('Rename Error', err.message || 'Could not rename project.', 'error');
    } finally {
      setIsSubmittingRename(false);
    }
  };

  // Action: Duplicate Project
  const handleDuplicateProject = async (p: ProjectSummary) => {
    if (!user) return;
    try {
      const dup = await duplicateProjectInSupabase(p.id, user.id);
      await loadProjects();
      addToast('Project Duplicated', `Created duplicate "${dup.identity.name}".`, 'success');
    } catch (err: any) {
      addToast('Duplication Failed', err.message || 'Could not clone project.', 'error');
    }
  };

  // Action: Toggle Archive
  const handleToggleArchive = async (p: ProjectSummary) => {
    if (!user) return;
    const newStatus = p.status === 'archived' ? 'active' : 'archived';
    try {
      await setProjectStatusInSupabase(p.id, user.id, newStatus);
      await loadProjects();
      addToast(
        newStatus === 'archived' ? 'Project Archived' : 'Project Restored',
        `"${p.project_name}" marked as ${newStatus}.`,
        'info'
      );
    } catch (err: any) {
      addToast('Status Update Failed', err.message || 'Could not update project status.', 'error');
    }
  };

  // Action: Delete Project
  const handleDeleteSubmit = async () => {
    if (!targetProject || !user) return;

    setIsSubmittingDelete(true);
    try {
      await deleteProjectFromSupabase(targetProject.id, user.id);
      await loadProjects();
      setDeleteModalOpen(false);
      addToast('Project Deleted', `"${targetProject.project_name}" permanently removed.`, 'info');
    } catch (err: any) {
      addToast('Deletion Error', err.message || 'Could not delete project.', 'error');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  // If user is not authenticated
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mb-4 shadow-sm">
          <Database className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#172033]">Permanent Supabase Storage</h2>
        <p className="text-xs text-[#667085] mt-2 leading-relaxed">
          Sign in or create a Studio account to save architectural briefs, CAD floor plans, 3D WebGL massing models, and uploaded site surveys permanently to Supabase PostgreSQL.
        </p>
        <button
          onClick={openSignIn}
          className="mt-6 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Sign In / Create Account</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header Bar */}
      <div className="bg-white border border-[#E4E7EC] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              Architectural Projects Directory
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB] border border-[#2563EB]/20">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1">
            Permanent cloud project storage backed by Supabase PostgreSQL with Row Level Security.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadProjects}
            disabled={loading}
            className="p-2.5 rounded-lg border border-[#E4E7EC] hover:bg-[#F9FAFB] text-[#667085] hover:text-[#172033] transition-colors"
            title="Refresh list from database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Search, Filter Tabs & Sorting Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#F2F4F7] rounded-xl self-start overflow-x-auto max-w-full">
          {(['all', 'active', 'draft', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                statusFilter === tab
                  ? 'bg-white text-[#172033] shadow-xs'
                  : 'text-[#667085] hover:text-[#172033]'
              }`}
            >
              {tab === 'all' ? 'All Projects' : tab}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, site, client..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#E4E7EC] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-xs border border-[#E4E7EC] rounded-xl bg-white text-[#344054] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="updated_desc">Recently Modified</option>
              <option value="created_desc">Date Created</option>
              <option value="name_asc">Alphabetical (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadProjects}
            className="text-xs font-semibold text-rose-800 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && projects.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-[#E4E7EC] rounded-2xl p-5 space-y-4 animate-pulse"
            >
              <div className="h-5 bg-[#F2F4F7] rounded w-2/3" />
              <div className="h-3 bg-[#F2F4F7] rounded w-1/2" />
              <div className="h-16 bg-[#F2F4F7] rounded" />
              <div className="h-8 bg-[#F2F4F7] rounded w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div className="bg-white border border-[#E4E7EC] rounded-2xl p-10 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#172033]">No Architectural Projects Found</h3>
          <p className="text-xs text-[#667085]">
            {searchQuery
              ? `No projects matching "${searchQuery}". Clear your search query or change filters.`
              : 'Create your first project to start generating site intelligence, floor plans, and 3D models.'}
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Create New Project
          </button>
        </div>
      )}

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((p) => {
          const isCurrentlyActive = activeProject?.id === p.id;
          const updatedDateStr = new Date(p.updated_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div
              key={p.id}
              className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-md relative ${
                isCurrentlyActive
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'border-[#E4E7EC]'
              }`}
            >
              <div>
                {/* Header: Status badge, Active indicator, and Context Menu */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                        p.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'draft'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {p.status}
                    </span>

                    {isCurrentlyActive && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        Current Workspace
                      </span>
                    )}
                  </div>

                  {/* Dropdown Menu Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                      className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                      aria-label="Actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuId === p.id && (
                      <>
                        <div
                          className="fixed inset-0 z-20"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E4E7EC] rounded-xl shadow-xl z-30 py-1 text-xs">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              handleOpenProject(p);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] flex items-center gap-2 text-[#344054] font-medium"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span>Open Project</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setTargetProject(p);
                              setRenameValue(p.project_name);
                              setRenameModalOpen(true);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] flex items-center gap-2 text-[#344054]"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Rename</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              handleDuplicateProject(p);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] flex items-center gap-2 text-[#344054]"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Duplicate</span>
                          </button>

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              handleToggleArchive(p);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-[#F9FAFB] flex items-center gap-2 text-[#344054]"
                          >
                            {p.status === 'archived' ? (
                              <>
                                <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Unarchive</span>
                              </>
                            ) : (
                              <>
                                <Archive className="w-3.5 h-3.5 text-amber-600" />
                                <span>Archive</span>
                              </>
                            )}
                          </button>

                          <div className="border-t border-[#E4E7EC] my-1" />

                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setTargetProject(p);
                              setDeleteModalOpen(true);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete Project</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Project Title */}
                <h3
                  onClick={() => handleOpenProject(p)}
                  className="text-base font-bold text-[#172033] hover:text-blue-600 transition-colors cursor-pointer line-clamp-1"
                >
                  {p.project_name}
                </h3>

                {/* Location and Client */}
                <div className="mt-1.5 space-y-1 text-xs text-[#667085]">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{p.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{p.project_type}</span>
                  </div>
                </div>

                {/* Description snippet */}
                {p.description && (
                  <p className="mt-2.5 text-xs text-[#667085] line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                )}

                {/* Metric Badges */}
                <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E4E7EC] text-center">
                  <div>
                    <div className="text-[10px] text-[#667085] uppercase font-semibold">Area</div>
                    <div className="text-xs font-bold text-[#172033] font-mono mt-0.5">
                      {p.gfa_sf ? `${p.gfa_sf.toLocaleString()} sf` : '3,850 sf'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#667085] uppercase font-semibold">Spaces</div>
                    <div className="text-xs font-bold text-[#172033] font-mono mt-0.5">
                      {p.rooms_count || 10} rooms
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#667085] uppercase font-semibold">Rev</div>
                    <div className="text-xs font-bold text-blue-600 font-mono mt-0.5">
                      {p.active_revision || 'REV-01'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer */}
              <div className="mt-4 pt-3 border-t border-[#E4E7EC] flex items-center justify-between text-[11px] text-[#667085]">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Updated {updatedDateStr}</span>
                </div>

                <button
                  onClick={() => handleOpenProject(p)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-xs flex items-center gap-1 min-h-[36px]"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Open</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE PROJECT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#172033]">Create New Architectural Project</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Westlake Hillside Residence"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Site Location *</label>
                <input
                  type="text"
                  required
                  value={newProjectLocation}
                  onChange={(e) => setNewProjectLocation(e.target.value)}
                  placeholder="e.g. Austin, Texas"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Typology</label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Single-family residential">Single-family residential</option>
                  <option value="Multi-family residential">Multi-family residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Hospitality">Hospitality</option>
                  <option value="Renovation">Renovation</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 font-medium text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingCreate ? 'Saving...' : 'Create & Open Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {renameModalOpen && targetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <h3 className="text-base font-bold text-[#172033]">Rename Project</h3>
            <form onSubmit={handleRenameSubmit} className="space-y-3 text-xs">
              <input
                type="text"
                required
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRename}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingRename ? 'Updating...' : 'Save New Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && targetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-full bg-rose-50 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#172033]">Delete Project Permanently?</h3>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900">"{targetProject.project_name}"</strong>? This will remove all associated room schedules, 3D parameters, revisions, and storage files. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-xs disabled:opacity-50"
              >
                {isSubmittingDelete ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
