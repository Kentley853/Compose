import React, { useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import { UploadedFile, FileCategory, FileProcessingStatus } from '../../types/architecture';
import {
  FolderArchive,
  UploadCloud,
  FileText,
  Image,
  Search,
  Filter,
  Download,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Edit2,
  Tag,
  FileCode2,
  FileSpreadsheet,
  Box,
  Layers,
  Sparkles,
  X,
  Package,
} from 'lucide-react';
import {
  generateAndDownloadProjectZip,
  generateBOQCSV,
  generateComplianceMarkdown,
  generateArchitecturalBriefMarkdown,
  generatePlanSVG,
  downloadText,
} from '../../services/exportPackage';
import { HelpTooltip } from '../common/HelpTooltip';

const FILE_CATEGORIES: FileCategory[] = [
  'Site Plan',
  'Survey',
  'Sketch',
  'Regulation',
  'Project Brief',
  'Reference Image',
  'BOQ',
  '3D Reference',
  'Other',
];

const ACCEPTED_EXTENSIONS = [
  '.dwg',
  '.dxf',
  '.pdf',
  '.svg',
  '.png',
  '.jpg',
  '.jpeg',
  '.docx',
  '.xlsx',
  '.csv',
  '.glb',
  '.gltf',
  '.obj',
  '.ifc',
];

export const FilesScreen: React.FC = () => {
  const {
    project,
    addUploads,
    removeUpload,
    restoreUpload,
    renameUpload,
    tagUpload,
    replaceUpload,
    deletedUploads,
    addToast,
  } = useProject();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [activeUploads, setActiveUploads] = useState<
    Array<{ id: string; name: string; progress: number; size: string; error?: string }>
  >([]);

  // Modals & Selection
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [taggingFileId, setTaggingFileId] = useState<string | null>(null);
  const [replacingFileId, setReplacingFileId] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // File Upload handler with validation & simulated async progress
  const handleFilesChosen = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newUploadedFiles: UploadedFile[] = [];
    const uploadTasks: Array<{ id: string; name: string; progress: number; size: string; error?: string }> = [];

    Array.from(fileList).forEach((file) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      // Validation 1: Empty file check
      if (file.size === 0) {
        addToast('Invalid File', `"${file.name}" is empty (0 bytes).`, 'error');
        return;
      }

      // Validation 2: Max 25MB check
      if (file.size > 25 * 1024 * 1024) {
        addToast('File Too Large', `"${file.name}" exceeds the 25MB limit.`, 'error');
        return;
      }

      // Validation 3: Supported extension check
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        addToast('Unsupported Format', `Extension ${ext} is not supported.`, 'warning');
        return;
      }

      // Auto-determine category & experimental badge
      let category: FileCategory = 'Other';
      if (['.dwg', '.dxf', '.ifc'].includes(ext)) category = 'Site Plan';
      else if (['.png', '.jpg', '.jpeg', '.svg'].includes(ext)) category = 'Reference Image';
      else if (['.csv', '.xlsx'].includes(ext)) category = 'BOQ';
      else if (['.glb', '.gltf', '.obj'].includes(ext)) category = '3D Reference';
      else if (['.pdf', '.docx'].includes(ext)) category = 'Project Brief';

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      uploadTasks.push({
        id: fileId,
        name: file.name,
        progress: 15,
        size: sizeStr,
      });

      newUploadedFiles.push({
        id: fileId,
        name: file.name,
        type: category,
        category,
        size: sizeStr,
        sizeBytes: file.size,
        uploadDate: 'Just now',
        status: ['dwg', 'ifc', 'obj'].includes(ext.replace('.', '')) ? 'Needs review' : 'Ready',
        extension: ext,
        usedByRevision: project.activeRevision,
        isExperimental: ['.dwg', '.ifc', '.obj'].includes(ext),
        notes: file.name.includes('survey') ? 'Site boundary coordinates extracted.' : 'Document ingested for concept synthesis.',
      });
    });

    if (uploadTasks.length > 0) {
      setActiveUploads((prev) => [...prev, ...uploadTasks]);

      // Progress animation
      let currentProgress = 20;
      const interval = setInterval(() => {
        currentProgress += 25;
        setActiveUploads((prev) =>
          prev.map((t) => (uploadTasks.some((ut) => ut.id === t.id) ? { ...t, progress: Math.min(100, currentProgress) } : t))
        );

        if (currentProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setActiveUploads((prev) => prev.filter((t) => !uploadTasks.some((ut) => ut.id === t.id)));
            addUploads(newUploadedFiles);
          }, 300);
        }
      }, 200);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesChosen(e.dataTransfer.files);
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replacingFileId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const old = project.uploads.find((f) => f.id === replacingFileId);
    if (!old) return;

    const replaced: UploadedFile = {
      ...old,
      name: file.name,
      size: sizeStr,
      uploadDate: 'Just now',
      extension: ext,
      notes: `Replaced previous file on ${new Date().toLocaleDateString()}`,
    };

    replaceUpload(replacingFileId, replaced);
    setReplacingFileId(null);
  };

  const handleDownloadFile = (file: UploadedFile) => {
    // Produce mock content or SVG/Text based on file type
    if (file.name.endsWith('.svg')) {
      downloadText(generatePlanSVG(project), file.name, 'image/svg+xml');
    } else if (file.name.endsWith('.csv')) {
      downloadText(generateBOQCSV(project), file.name, 'text/csv');
    } else {
      const summaryText = `Compose AI Ingested Document: ${file.name}\nProject: ${project.identity.name}\nCategory: ${file.category || file.type}\nRevision: ${file.usedByRevision || project.activeRevision}\nTimestamp: ${new Date().toISOString()}\n`;
      downloadText(summaryText, file.name);
    }
    addToast('Download Started', `Saved "${file.name}" to disk.`, 'info');
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      await generateAndDownloadProjectZip(project);
      addToast('Project Archive Downloaded', 'Complete ZIP package created successfully.', 'success');
    } catch (err) {
      console.error('ZIP packaging error:', err);
      addToast('Export Error', 'Could not generate ZIP package.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  // Filtered files
  const filteredFiles = project.uploads.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.category && f.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory || f.type === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getFileIcon = (ext?: string, category?: string) => {
    if (ext === '.pdf') return <FileText className="w-5 h-5 text-[#F04438]" />;
    if (['.png', '.jpg', '.jpeg', '.svg'].includes(ext || '')) return <Image className="w-5 h-5 text-[#2563EB]" />;
    if (['.csv', '.xlsx'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-[#12B76A]" />;
    if (['.glb', '.gltf', '.obj'].includes(ext || '')) return <Box className="w-5 h-5 text-[#7A5AF8]" />;
    if (['.dwg', '.dxf', '.ifc'].includes(ext || '')) return <FileCode2 className="w-5 h-5 text-[#F79009]" />;
    return <FileText className="w-5 h-5 text-[#667085]" />;
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen flex flex-col">
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header with Title and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Files Workspace</h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                {project.uploads.length} files
              </span>
            </div>
            <p className="text-sm text-[#667085] mt-1">
              Manage site plans, surveys, reference models, and download generated Compose AI packages.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowTrash(!showTrash)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showTrash
                  ? 'bg-[#FEE4E2] border-[#FECDCA] text-[#B42318]'
                  : 'bg-white border-[#E4E7EC] text-[#667085] hover:text-[#172033]'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Trash ({deletedUploads.length})</span>
            </button>

            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Package className="w-4 h-4" />
              <span>{isZipping ? 'Archiving...' : 'Download Project ZIP'}</span>
            </button>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-white ${
            isDragging
              ? 'border-[#2563EB] bg-[#EEF4FF]/50 scale-[0.99]'
              : 'border-[#E4E7EC] hover:border-[#2563EB]/50 hover:bg-[#F9FAFB]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFilesChosen(e.target.files)}
            multiple
            accept=".dwg,.dxf,.pdf,.svg,.png,.jpg,.jpeg,.docx,.xlsx,.csv,.glb,.gltf,.obj,.ifc"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="text-sm font-semibold text-[#172033]">
            Click to upload or drag and drop files here
          </div>
          <p className="text-xs text-[#667085] mt-1 max-w-lg mx-auto">
            Upload site surveys, CAD plot drawings, client briefs, or reference images for AI reasoning.
          </p>

          {/* Accepted formats chip bar */}
          <div className="mt-4 pt-3 border-t border-[#E4E7EC]/60 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-[#667085]">
            <span className="font-semibold text-[#172033]">Accepted:</span>
            <span className="px-1.5 py-0.5 rounded bg-[#F2F4F7] border border-[#E4E7EC]">PDF</span>
            <span className="px-1.5 py-0.5 rounded bg-[#F2F4F7] border border-[#E4E7EC]">SVG</span>
            <span className="px-1.5 py-0.5 rounded bg-[#F2F4F7] border border-[#E4E7EC]">PNG / JPG</span>
            <span className="px-1.5 py-0.5 rounded bg-[#F2F4F7] border border-[#E4E7EC]">CSV / XLSX</span>
            <span className="px-1.5 py-0.5 rounded bg-[#F2F4F7] border border-[#E4E7EC]">GLB / GLTF</span>
            <span className="px-1.5 py-0.5 rounded bg-[#FFF4ED] text-[#B54708] border border-[#FECDCA]">
              DWG / DXF (CAD)*
            </span>
            <span className="px-1.5 py-0.5 rounded bg-[#FFF4ED] text-[#B54708] border border-[#FECDCA]">
              IFC (BIM)*
            </span>
            <span className="text-[#667085]/80 text-[10px] ml-1">Max 25MB (*CAD/BIM experimental preview)</span>
          </div>
        </div>

        {/* Active Uploads Progress Bar */}
        {activeUploads.length > 0 && (
          <div className="bg-white border border-[#E4E7EC] rounded-xl p-4 shadow-xs space-y-3">
            <div className="text-xs font-semibold text-[#172033] flex items-center justify-between">
              <span>Uploading {activeUploads.length} file(s)...</span>
              <span className="text-[#2563EB] font-mono text-[11px]">In progress</span>
            </div>
            {activeUploads.map((t) => (
              <div key={t.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs text-[#667085]">
                  <span className="truncate max-w-xs text-[#172033] font-medium">{t.name}</span>
                  <span className="font-mono text-[11px]">{t.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#F2F4F7] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB] transition-all duration-200 rounded-full"
                    style={{ width: `${t.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Trash / Recently Deleted Accordion (if open) */}
        {showTrash && (
          <div className="bg-[#FFF4ED]/40 border border-[#FECDCA] rounded-xl p-4 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#B42318] flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Trash ({deletedUploads.length} items)
              </span>
              <span className="text-[11px] text-[#667085]">Files can be restored at any time</span>
            </div>
            {deletedUploads.length === 0 ? (
              <div className="text-xs text-[#667085] py-2 text-center">Trash is empty.</div>
            ) : (
              <div className="divide-y divide-[#FECDCA]/60">
                {deletedUploads.map((f) => (
                  <div key={f.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#172033] font-medium">{f.name}</span>
                      <span className="text-[10px] text-[#667085]">({f.size})</span>
                    </div>
                    <button
                      onClick={() => restoreUpload(f.id)}
                      className="px-2.5 py-1 rounded bg-white border border-[#E4E7EC] text-xs font-semibold text-[#2563EB] hover:bg-[#EEF4FF] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search, Category Filters & File Table */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-[#E4E7EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-[#667085] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files by name or tag..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#E4E7EC] text-xs text-[#172033] placeholder-[#667085] focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold'
                    : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
                }`}
              >
                All ({project.uploads.length})
              </button>
              {FILE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold'
                      : 'text-[#667085] hover:text-[#172033] hover:bg-[#F9FAFB]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {filteredFiles.length === 0 ? (
            <div className="p-8 text-center">
              <FolderArchive className="w-10 h-10 text-[#667085]/40 mx-auto mb-2" />
              <div className="text-sm font-semibold text-[#172033]">No documents found</div>
              <p className="text-xs text-[#667085] mt-1">
                Upload your first site drawing or clear active filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E7EC] bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                    <th className="py-2.5 px-4">File Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Size</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Used In</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E7EC] text-xs">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-[#F9FAFB] transition-colors group">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.extension, file.category)}
                          <div className="min-w-0">
                            {editingFileId === file.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="px-2 py-0.5 rounded border border-[#2563EB] text-xs"
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    if (editName.trim()) renameUpload(file.id, editName.trim());
                                    setEditingFileId(null);
                                  }}
                                  className="text-[#12B76A] hover:underline font-semibold text-[11px]"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingFileId(null)}
                                  className="text-[#667085] hover:underline text-[11px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#172033]">{file.name}</span>
                                {file.isExperimental && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FFF4ED] text-[#B54708] border border-[#FECDCA]">
                                    Experimental
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="text-[11px] text-[#667085] mt-0.5">
                              Added {file.uploadDate} {file.notes && `• ${file.notes}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {taggingFileId === file.id ? (
                          <select
                            value={file.category || file.type}
                            onChange={(e) => {
                              tagUpload(file.id, e.target.value as FileCategory);
                              setTaggingFileId(null);
                            }}
                            onBlur={() => setTaggingFileId(null)}
                            autoFocus
                            className="px-2 py-1 rounded border border-[#2563EB] text-xs bg-white"
                          >
                            {FILE_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <button
                            onClick={() => setTaggingFileId(file.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F2F4F7] text-[#344054] hover:bg-[#EEF4FF] hover:text-[#2563EB] transition-colors"
                            title="Click to change tag"
                          >
                            <Tag className="w-3 h-3" />
                            <span>{file.category || file.type}</span>
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[#667085]">{file.size}</td>

                      <td className="py-3 px-4">
                        {file.status === 'Ready' || file.status === 'Processed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] font-medium text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-[#12B76A]" />
                            Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FFF4ED] text-[#B54708] font-medium text-[11px]">
                            <AlertCircle className="w-3 h-3 text-[#F79009]" />
                            {file.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#667085]">
                        {file.usedByRevision || project.activeRevision}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1 rounded-md text-[#667085] hover:text-[#2563EB] hover:bg-[#EEF4FF] transition-colors"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDownloadFile(file)}
                            className="p-1 rounded-md text-[#667085] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setEditingFileId(file.id);
                              setEditName(file.name);
                            }}
                            className="p-1 rounded-md text-[#667085] hover:text-[#172033] hover:bg-[#F2F4F7] transition-colors"
                            title="Rename"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setReplacingFileId(file.id);
                              replaceInputRef.current?.click();
                            }}
                            className="p-1 rounded-md text-[#667085] hover:text-[#2563EB] hover:bg-[#EEF4FF] transition-colors"
                            title="Replace file version"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => removeUpload(file.id)}
                            className="p-1 rounded-md text-[#667085] hover:text-[#F04438] hover:bg-[#FEE4E2] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hidden File Input for Replace Action */}
        <input
          type="file"
          ref={replaceInputRef}
          onChange={handleReplaceFile}
          className="hidden"
        />

        {/* Compose AI Generated Outputs Download Hub */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#172033]">Export Compose AI Project Artifacts</h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Download generated design models, vector CAD sheets, and scheduled quantities.
              </p>
            </div>
            <span className="text-xs font-mono text-[#2563EB] bg-[#EEF4FF] px-2.5 py-1 rounded-md">
              {project.activeRevision}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Card 1: 2D CAD SVG */}
            <div className="p-3.5 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] hover:border-[#2563EB]/40 transition-colors flex flex-col justify-between">
              <div>
                <FileCode2 className="w-5 h-5 text-[#2563EB] mb-2" />
                <div className="text-xs font-bold text-[#172033]">2D Coordinated Plan (SVG)</div>
                <p className="text-[11px] text-[#667085] mt-1">
                  Vector floor plan with structural grids and dimensions.
                </p>
              </div>
              <button
                onClick={() =>
                  downloadText(
                    generatePlanSVG(project, 1),
                    `${project.identity.name}_L1_Plan.svg`,
                    'image/svg+xml'
                  )
                }
                className="mt-3 w-full py-1.5 rounded-lg bg-white border border-[#E4E7EC] hover:bg-[#EEF4FF] text-xs font-semibold text-[#2563EB] transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download SVG
              </button>
            </div>

            {/* Card 2: BOQ Spreadsheet */}
            <div className="p-3.5 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] hover:border-[#12B76A]/40 transition-colors flex flex-col justify-between">
              <div>
                <FileSpreadsheet className="w-5 h-5 text-[#12B76A] mb-2" />
                <div className="text-xs font-bold text-[#172033]">BOQ Schedule (CSV)</div>
                <p className="text-[11px] text-[#667085] mt-1">
                  Scheduled quantities, labor rates, and total cost estimates.
                </p>
              </div>
              <button
                onClick={() =>
                  downloadText(
                    generateBOQCSV(project),
                    `${project.identity.name}_BOQ.csv`,
                    'text/csv'
                  )
                }
                className="mt-3 w-full py-1.5 rounded-lg bg-white border border-[#E4E7EC] hover:bg-[#ECFDF3] text-xs font-semibold text-[#027A48] transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download CSV
              </button>
            </div>

            {/* Card 3: Brief & Compliance */}
            <div className="p-3.5 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] hover:border-[#F79009]/40 transition-colors flex flex-col justify-between">
              <div>
                <FileText className="w-5 h-5 text-[#F79009] mb-2" />
                <div className="text-xs font-bold text-[#172033]">Architectural Brief (MD)</div>
                <p className="text-[11px] text-[#667085] mt-1">
                  Design rationale, spatial program, and statutory screening.
                </p>
              </div>
              <button
                onClick={() =>
                  downloadText(
                    generateArchitecturalBriefMarkdown(project),
                    `${project.identity.name}_Brief.md`
                  )
                }
                className="mt-3 w-full py-1.5 rounded-lg bg-white border border-[#E4E7EC] hover:bg-[#FFF4ED] text-xs font-semibold text-[#B54708] transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download Markdown
              </button>
            </div>

            {/* Card 4: Full ZIP Package */}
            <div className="p-3.5 rounded-xl border border-[#2563EB]/30 bg-[#EEF4FF]/50 flex flex-col justify-between">
              <div>
                <Package className="w-5 h-5 text-[#2563EB] mb-2" />
                <div className="text-xs font-bold text-[#172033]">Complete Project Archive</div>
                <p className="text-[11px] text-[#667085] mt-1">
                  Full ZIP with drawings, brief, BOQ, manifest, and source files.
                </p>
              </div>
              <button
                onClick={handleDownloadAllZip}
                disabled={isZipping}
                className="mt-3 w-full py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> {isZipping ? 'Archiving...' : 'Download ZIP'}
              </button>
            </div>
          </div>
        </div>

        {/* File Preview Modal */}
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white border border-[#E4E7EC] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="px-6 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {getFileIcon(previewFile.extension, previewFile.category)}
                  <div>
                    <h3 className="text-sm font-bold text-[#172033]">{previewFile.name}</h3>
                    <div className="text-[11px] text-[#667085]">
                      {previewFile.category || previewFile.type} • {previewFile.size} • {previewFile.uploadDate}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="text-[#667085] hover:text-[#172033] p-1 rounded-md hover:bg-[#F9FAFB]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-[#F9FAFB]">
                {previewFile.extension === '.svg' ? (
                  <div
                    className="p-4 bg-white rounded-lg border border-[#E4E7EC] flex items-center justify-center overflow-auto"
                    dangerouslySetInnerHTML={{ __html: generatePlanSVG(project, 1) }}
                  />
                ) : ['.png', '.jpg', '.jpeg'].includes(previewFile.extension || '') ? (
                  <div className="p-4 bg-white rounded-lg border border-[#E4E7EC] text-center">
                    <div className="w-32 h-32 rounded-lg bg-[#EEF4FF] border border-[#2563EB]/20 text-[#2563EB] flex items-center justify-center mx-auto mb-2">
                      <Image className="w-12 h-12" />
                    </div>
                    <p className="text-xs text-[#667085]">
                      High-resolution site photograph referenced during AI massing orientation.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-white rounded-lg border border-[#E4E7EC] font-mono text-xs text-[#172033] whitespace-pre-wrap leading-relaxed">
                    {`[FILE METADATA & PARSED SCHEMATIC]
File Name: ${previewFile.name}
Category: ${previewFile.category || previewFile.type}
Size: ${previewFile.size}
Status: ${previewFile.status}
Referenced Revision: ${previewFile.usedByRevision || project.activeRevision}
Parsing Engine: Compose AI Ingestion Worker v2.4

--- EXTRACTED ATTRIBUTES ---
- Coordinate Reference: UTM Zone 48S (Jakarta WGS84)
- North Vector: 0° True North aligned
- Setbacks Extracted: Front 5.0m, Rear 3.0m, Lateral 2.0m
- Ingestion Notes: ${previewFile.notes || 'Successfully parsed and linked to spatial graph.'}`}
                  </div>
                )}
              </div>

              <div className="px-6 py-3.5 bg-white border-t border-[#E4E7EC] flex items-center justify-between">
                <span className="text-xs text-[#667085]">
                  Conceptual file preview • Qualified review required
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadFile(previewFile)}
                    className="px-3 py-1.5 rounded-lg bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="px-3 py-1.5 rounded-lg border border-[#E4E7EC] text-xs font-medium text-[#172033] hover:bg-[#F9FAFB]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
