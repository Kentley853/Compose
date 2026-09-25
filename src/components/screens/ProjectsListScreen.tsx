import React, { useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { ProjectSummary } from '../../services/supabase';
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
  Layers,
  Sparkles,
  AlertTriangle,
  X,
} from 'lucide-react';

export const ProjectsListScreen: React.FC = () => {
  const {
    project: activeProject,
    companyProjects,
    isLoadingProjects,
    loadAllProjects,
    openProjectById,
    createNewProject,
    renameProject,
    archiveProject,
    duplicateProject,
    deleteProject,
    setScreen,
    addToast,
  } = useProject();

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'name_asc' | 'created_desc'>('updated_desc');

  // Modals & Action States
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLocation, setNewProjectLocation] = useState('');
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

  // Filter & Sort computation
  const filteredProjects = companyProjects
    .filter((p) => {
      const matchesSearch =
        p.project_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.project_name.localeCompare(b.project_name);
      if (sortBy === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  // Action handlers
  const handleOpenProject = async (p: ProjectSummary) => {
    try {
      await openProjectById(p.id);
    } catch {
      // Error handled inside openProjectById
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      addToast('Name Required', 'Please enter a name for the new project.', 'warning');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      await createNewProject(newProjectName.trim(), newProjectLocation, newProjectType);
      setCreateModalOpen(false);
      setNewProjectName('');
    } catch {
      // createNewProject already reports the failure.
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProject || !renameValue.trim()) return;

    setIsSubmittingRename(true);
    try {
      await renameProject(targetProject.id, renameValue.trim());
      setRenameModalOpen(false);
      setTargetProject(null);
    } catch (err: any) {
      addToast('Rename Error', err.message || 'Could not rename project.', 'error');
    } finally {
      setIsSubmittingRename(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!targetProject) return;

    setIsSubmittingDelete(true);
    try {
      await deleteProject(targetProject.id);
      setDeleteModalOpen(false);
      setTargetProject(null);
    } catch (err: any) {
      addToast('Delete Error', err.message || 'Could not delete project.', 'error');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  const handleDuplicate = async (p: ProjectSummary) => {
    setActiveMenuId(null);
    try {
      await duplicateProject(p.id);
    } catch (err: any) {
      addToast('Duplicate Error', err.message, 'error');
    }
  };

  const handleToggleArchive = async (p: ProjectSummary) => {
    setActiveMenuId(null);
    const nextStatus = p.status === 'archived' ? 'active' : 'archived';
    await archiveProject(p.id, nextStatus);
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen flex flex-col selection:bg-[#2563EB] selection:text-white">
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
                Company Architectural Projects
              </h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                {companyProjects.length} saved
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Centralized repository stored permanently in Supabase PostgreSQL. Accessible across company devices.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadAllProjects()}
              disabled={isLoadingProjects}
              className="p-2 rounded-lg border border-[#E4E7EC] bg-white text-[#667085] hover:text-[#172033] transition-colors"
              title="Refresh project list from Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingProjects ? 'animate-spin text-[#2563EB]' : ''}`} />
            </button>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E7EC] shadow-xs">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by project name, location, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E7EC] focus:outline-hidden focus:border-[#2563EB]"
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F9FAFB] p-1 rounded-lg border border-[#E4E7EC]">
              {(['all', 'active', 'draft', 'archived'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
                    statusFilter === status
                      ? 'bg-white text-[#172033] shadow-xs font-semibold'
                      : 'text-[#667085] hover:text-[#172033]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#667085]">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-[#E4E7EC] bg-white text-xs text-[#344054] focus:outline-hidden"
              >
                <option value="updated_desc">Recently Modified</option>
                <option value="created_desc">Newest Created</option>
                <option value="name_asc">Project Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoadingProjects ? (
          <div className="bg-white border border-[#E4E7EC] rounded-2xl p-12 text-center shadow-xs">
            <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto mb-3" />
            <div className="text-sm font-semibold text-[#172033]">Loading company projects...</div>
            <p className="text-xs text-[#667085] mt-1">Connecting to Supabase PostgreSQL database</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white border border-[#E4E7EC] rounded-2xl p-12 text-center shadow-xs">
            <FolderKanban className="w-12 h-12 text-[#98A2B3] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-[#172033]">No Projects Found</h3>
            <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search query or status filter.'
                : 'Create your first company project to begin architectural layout and 3D modeling.'}
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#1D4ED8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </button>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((p) => {
              const isActive = activeProject.id === p.id;
              const isArchived = p.status === 'archived';

              return (
                <div
                  key={p.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs transition-all relative flex flex-col justify-between ${
                    isActive
                      ? 'border-[#2563EB] ring-2 ring-[#2563EB]/10'
                      : 'border-[#E4E7EC] hover:border-[#2563EB]/40'
                  }`}
                >
                  <div>
                    {/* Top Row: Status badge & Menu */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            p.status === 'active'
                              ? 'bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]'
                              : p.status === 'archived'
                              ? 'bg-[#F2F4F7] text-[#475467] border border-[#E4E7EC]'
                              : 'bg-[#FFF4ED] text-[#B54708] border border-[#FECDCA]'
                          }`}
                        >
                          {p.status}
                        </span>

                        {isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB] border border-[#B2CCFF]">
                            Active Now
                          </span>
                        )}
                      </div>

                      {/* Action Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === p.id ? null : p.id)}
                          className="p-1 rounded-md text-[#667085] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuId === p.id && (
                          <>
                            <div
                              className="fixed inset-0 z-20"
                              onClick={() => setActiveMenuId(null)}
                            />
                            <div className="absolute right-0 mt-1 w-44 bg-white border border-[#E4E7EC] rounded-xl shadow-lg z-30 py-1.5 text-xs text-[#344054]">
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleOpenProject(p);
                                }}
                                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F9FAFB] text-[#172033] font-medium"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>Open Project</span>
                              </button>

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setTargetProject(p);
                                  setRenameValue(p.project_name);
                                  setRenameModalOpen(true);
                                }}
                                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F9FAFB]"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#667085]" />
                                <span>Rename</span>
                              </button>

                              <button
                                onClick={() => handleDuplicate(p)}
                                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F9FAFB]"
                              >
                                <Copy className="w-3.5 h-3.5 text-[#667085]" />
                                <span>Duplicate</span>
                              </button>

                              <button
                                onClick={() => handleToggleArchive(p)}
                                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F9FAFB]"
                              >
                                {isArchived ? (
                                  <>
                                    <ArchiveRestore className="w-3.5 h-3.5 text-[#667085]" />
                                    <span>Unarchive</span>
                                  </>
                                ) : (
                                  <>
                                    <Archive className="w-3.5 h-3.5 text-[#667085]" />
                                    <span>Archive</span>
                                  </>
                                )}
                              </button>

                              <div className="my-1 border-t border-[#E4E7EC]" />

                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setTargetProject(p);
                                  setDeleteModalOpen(true);
                                }}
                                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#FEE4E2] text-[#B42318]"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Project</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Project Title & Code */}
                    <div className="mb-2">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-[#172033] hover:text-[#2563EB] cursor-pointer truncate" onClick={() => handleOpenProject(p)}>
                          {p.project_name}
                        </h3>
                      </div>
                      <p className="text-xs text-[#667085] line-clamp-2 mt-1 min-h-[2rem]">
                        {p.description || 'Architectural project managed in Compose AI Studio.'}
                      </p>
                    </div>

                    {/* Key Attributes */}
                    <div className="space-y-1.5 text-xs text-[#667085] pt-2 border-t border-[#E4E7EC]/60">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
                        <span className="truncate">{p.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
                        <span className="truncate">{p.project_type}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
                        <span>Modified {new Date(p.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Open Project CTA Button */}
                  <div className="mt-4 pt-3 border-t border-[#E4E7EC] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#667085]">
                      {p.active_revision || 'REV-01'}
                    </span>

                    <button
                      onClick={() => handleOpenProject(p)}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors flex items-center gap-1"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Open Project</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE PROJECT MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Create New Project</h3>
                  <p className="text-xs text-[#667085]">Saved permanently to company Supabase database</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-[#667085] hover:text-[#172033] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Westlake Hilltop Villa"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E7EC] focus:outline-hidden focus:border-[#2563EB]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Site Location
                </label>
                <input
                  type="text"
                  placeholder="City, State (e.g. Austin, Texas)"
                  value={newProjectLocation}
                  onChange={(e) => setNewProjectLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E7EC] focus:outline-hidden focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Building Typology
                </label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E7EC] bg-white focus:outline-hidden focus:border-[#2563EB]"
                >
                  <option value="Single-family residential">Single-family residential</option>
                  <option value="Multi-family residential">Multi-family residential</option>
                  <option value="Commercial & Office">Commercial & Office</option>
                  <option value="Hospitality & Resort">Hospitality & Resort</option>
                  <option value="Mixed-use">Mixed-use</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E4E7EC] text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmittingCreate ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create & Open</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME PROJECT MODAL */}
      {renameModalOpen && targetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#172033]">Rename Project</h3>
              <button
                onClick={() => setRenameModalOpen(false)}
                className="text-[#667085] hover:text-[#172033] p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#E4E7EC] focus:outline-hidden focus:border-[#2563EB]"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRenameModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E4E7EC] text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRename}
                  className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  {isSubmittingRename ? 'Saving...' : 'Save Title'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && targetProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FEE4E2] text-[#B42318] flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172033]">Confirm Deletion</h3>
                <p className="text-xs text-[#667085]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-[#344054] bg-[#F9FAFB] p-3 rounded-lg border border-[#E4E7EC]">
              Are you sure you want to permanently delete <strong>"{targetProject.project_name}"</strong> from Supabase? All associated floor plans, models, and file records will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E4E7EC] text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isSubmittingDelete}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                {isSubmittingDelete ? 'Deleting...' : 'Delete Project'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
