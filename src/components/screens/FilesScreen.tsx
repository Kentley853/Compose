import React, { useState, useRef } from 'react';
import { useProject } from '../../context/ProjectContext';
import {
  uploadProjectFileToStorage,
  getFileDownloadUrl,
  deleteFileFromSupabase,
  isSupabaseConfigured,
} from '../../services/supabase';
import { UploadedFile, FileCategory } from '../../types/architecture';
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
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  generateAndDownloadProjectZip,
  generateBOQCSV,
  generateComplianceMarkdown,
  generateArchitecturalBriefMarkdown,
  generatePlanSVG,
  downloadText,
} from '../../services/exportPackage';

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

// Exact supported formats specified:
// Documents: PDF, DOCX, XLSX and CSV
// Drawings: DWG, DXF, IFC and RVT
// 3D files: OBJ, FBX, GLB and GLTF
// Images: PNG, JPG, JPEG and WEBP
const SUPPORTED_FORMATS = {
  documents: ['.pdf', '.docx', '.xlsx', '.csv'],
  drawings: ['.dwg', '.dxf', '.ifc', '.rvt'],
  threeD: ['.obj', '.fbx', '.glb', '.gltf'],
  images: ['.png', '.jpg', '.jpeg', '.webp'],
};

const ALL_ACCEPTED_EXTENSIONS = [
  ...SUPPORTED_FORMATS.documents,
  ...SUPPORTED_FORMATS.drawings,
  ...SUPPORTED_FORMATS.threeD,
  ...SUPPORTED_FORMATS.images,
  '.svg',
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

  // Delete Confirmation Modal state
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);

  // File Upload handler with Supabase Storage upload, validation & beginner-friendly feedback
  const handleFilesChosen = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    const newUploadedFiles: UploadedFile[] = [];
    const uploadTasks: Array<{ id: string; name: string; progress: number; size: string; error?: string }> = [];

    const filesArray = Array.from(fileList);

    for (const file of filesArray) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      // Validation 1: Zero-byte empty check
      if (file.size === 0) {
        addToast(
          'Empty File',
          `The file "${file.name}" is empty (0 bytes). Please upload a valid document or drawing.`,
          'error'
        );
        continue;
      }

      // Validation 2: Max 25MB check
      if (file.size > 25 * 1024 * 1024) {
        addToast(
          'File Too Large',
          `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)}MB. The maximum allowed file size is 25MB.`,
          'error'
        );
        continue;
      }

      // Validation 3: Supported extension check
      if (!ALL_ACCEPTED_EXTENSIONS.includes(ext)) {
        addToast(
          'Unsupported Format',
          `Format "${ext}" is not supported. Please upload Documents (PDF, DOCX, XLSX, CSV), Drawings (DWG, DXF, IFC, RVT), 3D files (OBJ, FBX, GLB, GLTF), or Images (PNG, JPG, JPEG, WEBP).`,
          'warning'
        );
        continue;
      }

      // Categorize automatically
      let category: FileCategory = 'Other';
      if (SUPPORTED_FORMATS.drawings.includes(ext)) category = 'Site Plan';
      else if (SUPPORTED_FORMATS.images.includes(ext) || ext === '.svg') category = 'Reference Image';
      else if (['.csv', '.xlsx'].includes(ext)) category = 'BOQ';
      else if (SUPPORTED_FORMATS.threeD.includes(ext)) category = '3D Reference';
      else if (['.pdf', '.docx'].includes(ext)) category = 'Project Brief';

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      uploadTasks.push({
        id: fileId,
        name: file.name,
        progress: 50,
        size: sizeStr,
      });

      try {
        // Upload to private Supabase Storage bucket 'project-files' and record metadata
        const uploadResult = await uploadProjectFileToStorage(
          project.id,
          file,
          category,
          `Uploaded to ${project.identity.name}`
        );

        newUploadedFiles.push({
          id: uploadResult.fileId || fileId,
          name: file.name,
          type: category,
          category,
          size: uploadResult.sizeFormatted,
          sizeBytes: uploadResult.sizeBytes,
          uploadDate: new Date().toLocaleDateString(),
          status: ['dwg', 'dxf', 'ifc', 'rvt', 'obj'].includes(ext.replace('.', '')) ? 'Ready' : 'Ready',
          extension: ext,
          usedByRevision: project.activeRevision,
          isExperimental: ['.dwg', '.ifc', '.rvt', '.obj', '.fbx'].includes(ext),
          notes: 'Stored permanently in private Supabase Storage bucket',
          storagePath: uploadResult.storagePath,
          fileUrl: uploadResult.signedUrl,
          previewUrl: uploadResult.signedUrl,
        });
      } catch (err: any) {
        console.warn('Storage upload fallback:', err);
        const objUrl = URL.createObjectURL(file);
        newUploadedFiles.push({
          id: fileId,
          name: file.name,
          type: category,
          category,
          size: sizeStr,
          sizeBytes: file.size,
          uploadDate: new Date().toLocaleDateString(),
          status: 'Ready',
          extension: ext,
          previewUrl: objUrl,
          fileUrl: objUrl,
          notes: 'Stored in local workspace',
        });
      }
    }

    if (uploadTasks.length > 0) {
      setActiveUploads(uploadTasks);
      setTimeout(() => {
        setActiveUploads([]);
        addUploads(newUploadedFiles);
      }, 500);
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

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!replacingFileId || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const old = project.uploads.find((f) => f.id === replacingFileId);
    if (!old) return;

    try {
      const uploadResult = await uploadProjectFileToStorage(
        project.id,
        file,
        old.category || 'Other',
        'Replaced version'
      );
      const replaced: UploadedFile = {
        ...old,
        name: file.name,
        size: uploadResult.sizeFormatted,
        sizeBytes: uploadResult.sizeBytes,
        uploadDate: new Date().toLocaleDateString(),
        extension: ext,
        notes: `Replaced on ${new Date().toLocaleDateString()}`,
        storagePath: uploadResult.storagePath,
        fileUrl: uploadResult.signedUrl,
        previewUrl: uploadResult.signedUrl,
      };

      replaceUpload(replacingFileId, replaced);
    } catch {
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;
      const replaced: UploadedFile = {
        ...old,
        name: file.name,
        size: sizeStr,
        uploadDate: new Date().toLocaleDateString(),
        extension: ext,
        notes: `Replaced on ${new Date().toLocaleDateString()}`,
      };
      replaceUpload(replacingFileId, replaced);
    } finally {
      setReplacingFileId(null);
    }
  };

  const handleDownloadFile = async (file: UploadedFile) => {
    // 1. If stored in Supabase private bucket, request fresh signed URL
    if (file.storagePath) {
      try {
        const signedUrl = await getFileDownloadUrl(file.storagePath);
        if (signedUrl && signedUrl !== '#') {
          const a = document.createElement('a');
          a.href = signedUrl;
          a.download = file.name;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          addToast('Signed Download', `Downloading "${file.name}" from Supabase Storage.`, 'success');
          return;
        }
      } catch (err: any) {
        console.warn('Signed URL request failed, falling back:', err);
      }
    }

    // 2. Direct object URL fallback
    if (file.fileUrl && !file.fileUrl.startsWith('#')) {
      const a = document.createElement('a');
      a.href = file.fileUrl;
      a.download = file.name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast('Download Started', `Saved "${file.name}".`, 'info');
      return;
    }

    // 3. Fallback to format generator for synthesized assets
    if (file.name.endsWith('.svg')) {
      const svg = generatePlanSVG(project, 1);
      downloadText(svg, file.name, 'image/svg+xml');
    } else if (file.name.endsWith('.csv')) {
      const csv = generateBOQCSV(project);
      downloadText(csv, file.name, 'text/csv');
    } else {
      addToast('Download Info', `File "${file.name}" is stored securely in project files.`, 'info');
    }
  };

  const confirmDeleteFile = (file: UploadedFile) => {
    setFileToDelete(file);
  };

  const executeDeleteFile = async () => {
    if (!fileToDelete) return;
    await removeUpload(fileToDelete.id);
    setFileToDelete(null);
  };

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    addToast('Generating Archive', 'Bundling all drawings, brief, BOQ, and assets into ZIP package...', 'info');
    try {
      await generateAndDownloadProjectZip(project);
      addToast('Archive Ready', 'Project ZIP package downloaded successfully.', 'success');
    } catch (e: any) {
      addToast('Archive Failed', e.message || 'Could not assemble ZIP.', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = project.uploads.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.notes && f.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory || f.type === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getFileIcon = (ext?: string, category?: string) => {
    if (ext === '.svg' || category === 'Site Plan') return <FileCode2 className="w-5 h-5 text-[#2563EB]" />;
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext || '') || category === 'Reference Image')
      return <Image className="w-5 h-5 text-[#7A5AF8]" />;
    if (ext === '.csv' || ext === '.xlsx' || category === 'BOQ')
      return <FileSpreadsheet className="w-5 h-5 text-[#12B76A]" />;
    if (['.glb', '.gltf', '.obj', '.fbx'].includes(ext || '') || category === '3D Reference')
      return <Box className="w-5 h-5 text-[#F79009]" />;
    if (ext === '.pdf') return <FileText className="w-5 h-5 text-[#D92D20]" />;
    if (['.dwg', '.dxf', '.ifc', '.rvt'].includes(ext || ''))
      return <Layers className="w-5 h-5 text-[#026AA2]" />;
    return <FileText className="w-5 h-5 text-[#667085]" />;
  };

  return (
    <div className="flex-1 bg-[#F7F8FA] overflow-y-auto min-h-screen flex flex-col">
      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">Project Files & Cloud Storage</h1>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#EEF4FF] text-[#2563EB]">
                {project.uploads.length} files
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#667085] mt-1">
              Private company storage connected to Supabase bucket <code className="px-1 py-0.5 rounded bg-white border border-[#E4E7EC] font-mono text-[11px] text-[#2563EB]">project-files</code>.
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
            accept=".dwg,.dxf,.ifc,.rvt,.obj,.fbx,.glb,.gltf,.pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.svg"
            className="hidden"
          />

          <div className="w-12 h-12 rounded-xl bg-[#EEF4FF] text-[#2563EB] flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="text-sm font-semibold text-[#172033]">
            Click to upload or drag and drop files here
          </div>
          <p className="text-xs text-[#667085] mt-1 max-w-lg mx-auto">
            Uploaded files are stored securely in Supabase Storage with metadata recorded in the company database.
          </p>

          {/* Formats Grid Display */}
          <div className="mt-5 pt-4 border-t border-[#E4E7EC] grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
            <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
              <div className="text-[11px] font-bold text-[#172033] flex items-center gap-1 mb-1">
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>Documents</span>
              </div>
              <div className="text-[10px] text-[#667085] font-mono">
                PDF, DOCX, XLSX, CSV
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
              <div className="text-[11px] font-bold text-[#172033] flex items-center gap-1 mb-1">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Drawings</span>
              </div>
              <div className="text-[10px] text-[#667085] font-mono">
                DWG, DXF, IFC, RVT
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
              <div className="text-[11px] font-bold text-[#172033] flex items-center gap-1 mb-1">
                <Box className="w-3.5 h-3.5 text-amber-600" />
                <span>3D Files</span>
              </div>
              <div className="text-[10px] text-[#667085] font-mono">
                OBJ, FBX, GLB, GLTF
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC]">
              <div className="text-[11px] font-bold text-[#172033] flex items-center gap-1 mb-1">
                <Image className="w-3.5 h-3.5 text-purple-600" />
                <span>Images</span>
              </div>
              <div className="text-[10px] text-[#667085] font-mono">
                PNG, JPG, JPEG, WEBP
              </div>
            </div>
          </div>
          <div className="text-[11px] text-[#667085] mt-2">
            Maximum file size: <strong>25MB per file</strong>
          </div>
        </div>

        {/* Active Uploads Progress */}
        {activeUploads.length > 0 && (
          <div className="bg-white border border-[#E4E7EC] rounded-xl p-4 shadow-xs space-y-3">
            <div className="text-xs font-semibold text-[#172033] flex items-center justify-between">
              <span>Uploading {activeUploads.length} file(s) to Supabase Storage...</span>
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

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E4E7EC] shadow-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search project files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E7EC] focus:outline-hidden focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <Filter className="w-3.5 h-3.5 text-[#667085] shrink-0" />
            <span className="text-xs text-[#667085] shrink-0">Filter:</span>
            <div className="flex items-center gap-1">
              {['all', 'Site Plan', 'Project Brief', 'BOQ', '3D Reference', 'Reference Image'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#EEF4FF] text-[#2563EB] font-semibold'
                      : 'text-[#667085] hover:bg-[#F2F4F7]'
                  }`}
                >
                  {cat === 'all' ? 'All Files' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Files Table List */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC] text-[#667085] font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Revision</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC]">
                {filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#667085]">
                      <FolderArchive className="w-8 h-8 text-[#98A2B3] mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-[#172033]">No files found</p>
                      <p className="text-xs mt-1">Upload CAD drawings, site surveys, or design briefs above.</p>
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-[#F9FAFB]/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[#F2F4F7] flex items-center justify-center shrink-0">
                            {getFileIcon(file.extension, file.category)}
                          </div>
                          <div className="min-w-0">
                            {editingFileId === file.id ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="px-2 py-0.5 rounded border border-[#2563EB] text-xs font-semibold"
                                  autoFocus
                                />
                                <button
                                  onClick={() => {
                                    renameUpload(file.id, editName);
                                    setEditingFileId(null);
                                  }}
                                  className="text-xs text-blue-600 font-semibold"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingFileId(null)}
                                  className="text-xs text-[#667085]"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#172033]">{file.name}</span>
                                {file.isExperimental && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FFF4ED] text-[#B54708] border border-[#FECDCA]">
                                    CAD / BIM
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
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#027A48] font-medium text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-[#12B76A]" />
                          Ready
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-[#667085]">
                        {file.usedByRevision || project.activeRevision}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewFile(file)}
                            className="p-1 rounded-md text-[#667085] hover:text-[#2563EB] hover:bg-[#EEF4FF] transition-colors"
                            title="Preview / Open file"
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
                            title="Replace version"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => confirmDeleteFile(file)}
                            className="p-1 rounded-md text-[#667085] hover:text-[#F04438] hover:bg-[#FEE4E2] transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generated Exports Card Section */}
        <div className="bg-white border border-[#E4E7EC] rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                Generated Architectural Deliverables
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Computed exports generated from the active layout alternative and regional pricing.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Card 1: 2D Plan SVG */}
            <div className="p-3.5 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] hover:border-[#2563EB]/40 transition-colors flex flex-col justify-between">
              <div>
                <FileCode2 className="w-5 h-5 text-[#2563EB] mb-2" />
                <div className="text-xs font-bold text-[#172033]">Floor Plan Drawing (SVG)</div>
                <p className="text-[11px] text-[#667085] mt-1">
                  Vector floor plan with dimensions and wall thickness.
                </p>
              </div>
              <button
                onClick={() =>
                  downloadText(
                    generatePlanSVG(project, 1),
                    `${project.identity.name}_Plan_L1.svg`,
                    'image/svg+xml'
                  )
                }
                className="mt-3 w-full py-1.5 rounded-lg bg-white border border-[#E4E7EC] hover:bg-[#EEF4FF] text-xs font-semibold text-[#2563EB] transition-colors flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Download SVG
              </button>
            </div>

            {/* Card 2: BOQ Schedule */}
            <div className="p-3.5 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] hover:border-[#12B76A]/40 transition-colors flex flex-col justify-between">
              <div>
                <FileSpreadsheet className="w-5 h-5 text-[#12B76A] mb-2" />
                <div className="text-xs font-bold text-[#172033]">BOQ Schedule (CSV)</div>
                <p className="text-[11px] text-[#667085] mt-1">
                  Scheduled quantities, labor rates, and cost estimates.
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

            {/* Card 3: Brief Markdown */}
            <div className="p-3.5 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] hover:border-[#F79009]/40 transition-colors flex flex-col justify-between">
              <div>
                <FileText className="w-5 h-5 text-[#F79009] mb-2" />
                <div className="text-xs font-bold text-[#172033]">Architectural Brief (MD)</div>
                <p className="text-[11px] text-[#667085] mt-1">
                  Design rationale, spatial program, and code notes.
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
                <Download className="w-3.5 h-3.5" /> Download MD
              </button>
            </div>

            {/* Card 4: Full ZIP */}
            <div className="p-3.5 rounded-xl border border-[#2563EB]/30 bg-[#EEF4FF]/50 flex flex-col justify-between">
              <div>
                <Package className="w-5 h-5 text-[#2563EB] mb-2" />
                <div className="text-xs font-bold text-[#172033]">Complete Project Archive</div>
                <p className="text-[11px] text-[#667085] mt-1">
                  Full ZIP package with drawings, brief, and BOQ.
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

        {/* Hidden input for version replacement */}
        <input
          type="file"
          ref={replaceInputRef}
          onChange={handleReplaceFile}
          className="hidden"
          accept=".dwg,.dxf,.ifc,.rvt,.obj,.fbx,.glb,.gltf,.pdf,.docx,.xlsx,.csv,.png,.jpg,.jpeg,.webp,.svg"
        />

        {/* Delete Confirmation Modal */}
        {fileToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-white border border-[#E4E7EC] rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#172033]">Confirm File Deletion</h3>
                  <p className="text-xs text-[#667085]">This action will delete the file from the project and Supabase Storage.</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E4E7EC] text-xs text-[#172033]">
                <div className="font-semibold truncate">{fileToDelete.name}</div>
                <div className="text-[11px] text-[#667085] mt-0.5">{fileToDelete.size} • {fileToDelete.category || fileToDelete.type}</div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  onClick={() => setFileToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-[#E4E7EC] text-xs font-semibold text-[#344054] hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDeleteFile}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-xs transition-colors"
                >
                  Delete File
                </button>
              </div>
            </div>
          </div>
        )}

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
                ) : ['.png', '.jpg', '.jpeg', '.webp'].includes(previewFile.extension || '') ? (
                  <div className="p-4 bg-white rounded-lg border border-[#E4E7EC] text-center">
                    {previewFile.fileUrl ? (
                      <img
                        src={previewFile.fileUrl}
                        alt={previewFile.name}
                        className="max-h-80 mx-auto rounded-lg object-contain shadow-xs"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-lg bg-[#EEF4FF] border border-[#2563EB]/20 text-[#2563EB] flex items-center justify-center mx-auto mb-2">
                        <Image className="w-12 h-12" />
                      </div>
                    )}
                    <p className="text-xs text-[#667085] mt-2">
                      High-resolution visual asset saved in Supabase Storage.
                    </p>
                  </div>
                ) : previewFile.extension === '.csv' ? (
                  <div className="p-4 bg-white rounded-lg border border-[#E4E7EC] font-mono text-xs overflow-x-auto">
                    <pre className="text-[#344054]">{generateBOQCSV(project).slice(0, 800)}...</pre>
                  </div>
                ) : (
                  <div className="p-8 bg-white rounded-lg border border-[#E4E7EC] text-center">
                    <div className="w-12 h-12 rounded-xl bg-[#F2F4F7] text-[#667085] flex items-center justify-center mx-auto mb-3">
                      {getFileIcon(previewFile.extension, previewFile.category)}
                    </div>
                    <h4 className="text-sm font-bold text-[#172033]">{previewFile.name}</h4>
                    <p className="text-xs text-[#667085] mt-1 max-w-sm mx-auto">
                      Binary asset ({previewFile.extension?.toUpperCase()}) stored securely in private Supabase Storage. Use Download to inspect in your CAD or BIM workstation.
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownloadFile(previewFile)}
                        className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Asset</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-3 border-t border-[#E4E7EC] bg-white flex items-center justify-between text-xs text-[#667085]">
                <span>Storage path: <code className="font-mono text-[10px] text-[#172033]">{previewFile.storagePath || 'project-files/' + previewFile.name}</code></span>
                <button
                  onClick={() => handleDownloadFile(previewFile)}
                  className="font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
