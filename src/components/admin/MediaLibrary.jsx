// src/components/admin/MediaLibrary.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Film, 
  Trash2, 
  Search, 
  Filter,
  Grid,
  List,
  MoreVertical,
  Download,
  ExternalLink,
  Edit,
  X,
  RefreshCw,
  CheckCircle,
  HardDrive,
  Link,
  AlertCircle
} from 'lucide-react';
import { getApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAppServices } from '../../services/useAppServices';
import { 
  getMediaAssets, 
  uploadMediaAsset, 
  deleteMediaAsset, 
  updateMediaAsset,
  replaceMediaAsset,
  updateAssetReferences,
  MEDIA_TYPES 
} from '../../services/mediaService';
import { getUnifiedContent } from '../../services/unifiedContentService';

/**
 * Extract Google Drive file IDs from various URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/document/d/FILE_ID/...
 * - https://drive.google.com/drive/folders/FOLDER_ID
 * - Just a raw file ID
 */
const parseDriveLinks = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const parsed = [];
  
  for (const line of lines) {
    // Try /d/FILE_ID pattern
    let match = line.match(/\/d\/([a-zA-Z0-9_-]{10,})/);
    if (match) {
      parsed.push({ id: match[1], url: line, type: 'file' });
      continue;
    }
    // Try ?id=FILE_ID pattern
    match = line.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
    if (match) {
      parsed.push({ id: match[1], url: line, type: 'file' });
      continue;
    }
    // Try /folders/FOLDER_ID pattern
    match = line.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
    if (match) {
      parsed.push({ id: match[1], url: line, type: 'folder' });
      continue;
    }
    // Try raw file ID (long alphanumeric string)
    if (/^[a-zA-Z0-9_-]{10,}$/.test(line)) {
      parsed.push({ id: line, url: line, type: 'file' });
      continue;
    }
  }
  return parsed;
};

const MediaLibrary = () => {
  const { db, storage } = useAppServices();
  const [assets, setAssets] = useState([]);
  const [wrappedUrlMap, setWrappedUrlMap] = useState(new Map()); // Map<url, contentItem>
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('LIST'); // GRID | LIST
  const [dragActive, setDragActive] = useState(false);
  
  // Edit/Replace State
  const [editingAsset, setEditingAsset] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [replacingAsset, setReplacingAsset] = useState(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceLinksText, setReplaceLinksText] = useState('');
  const [replaceParsedLinks, setReplaceParsedLinks] = useState([]);
  const replaceInputRef = useRef(null);

  // Google Drive Import State
  const [driveImporting, setDriveImporting] = useState(false);
  const [driveProgress, setDriveProgress] = useState('');
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveLinksText, setDriveLinksText] = useState('');
  const [parsedLinks, setParsedLinks] = useState([]);
  const [serviceAccountEmail, setServiceAccountEmail] = useState('');
  const [saCopied, setSaCopied] = useState(false);

  // Parse links as user types
  useEffect(() => {
    if (driveLinksText.trim()) {
      setParsedLinks(parseDriveLinks(driveLinksText));
    } else {
      setParsedLinks([]);
    }
  }, [driveLinksText]);

  // Parse replace links as user types
  useEffect(() => {
    if (replaceLinksText.trim()) {
      setReplaceParsedLinks(parseDriveLinks(replaceLinksText));
    } else {
      setReplaceParsedLinks([]);
    }
  }, [replaceLinksText]);

  // Fetch service account email when modal opens
  useEffect(() => {
    if (showDriveModal && !serviceAccountEmail) {
      (async () => {
        try {
          const functions = getFunctions(getApp(), 'us-central1');
          const importFromDrive = httpsCallable(functions, 'importFromDrive', { timeout: 30000 });
          const res = await importFromDrive({ getServiceAccountEmail: true });
          if (res.data?.serviceAccountEmail) {
            setServiceAccountEmail(res.data.serviceAccountEmail);
          }
        } catch (e) {
          console.error('Failed to fetch service account email:', e);
        }
      })();
    }
  }, [showDriveModal, serviceAccountEmail]);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const [assetsData, contentData] = await Promise.all([
        getMediaAssets(db, filterType),
        getUnifiedContent(db, 'ALL') // Fetch all content to check for wrappers
      ]);
      
      setAssets(assetsData);

      // Build map of wrapped URLs
      const urlMap = new Map();
      contentData.forEach(item => {
        const details = item.details || {};
        // Check all possible URL fields
        const urls = [
          details.externalUrl,
          details.url,
          details.videoUrl,
          details.pdfUrl,
          details.coverUrl
        ].filter(Boolean);

        urls.forEach(url => {
          // Store the first wrapper found for this URL
          if (!urlMap.has(url)) {
            urlMap.set(url, item);
          }
        });
      });
      setWrappedUrlMap(urlMap);

    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  }, [db, filterType]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const handleDriveImport = useCallback(async () => {
    const fileLinks = parsedLinks.filter(l => l.type === 'file');
    const folderLinks = parsedLinks.filter(l => l.type === 'folder');
    
    if (fileLinks.length === 0 && folderLinks.length === 0) {
      alert('No valid Google Drive links found. Paste file or folder share links.');
      return;
    }

    setShowDriveModal(false);
    setDriveImporting(true);
    setDriveProgress(`Importing ${fileLinks.length} file(s)${folderLinks.length > 0 ? ` + ${folderLinks.length} folder(s)` : ''} from Google Drive...`);

    try {
      const functions = getFunctions(getApp(), 'us-central1');
      const importFromDrive = httpsCallable(functions, 'importFromDrive', { timeout: 540000 });
      
      const result = await importFromDrive({
        fileIds: fileLinks.map(l => l.id),
        folderIds: folderLinks.map(l => l.id),
      });

      const { successCount, totalCount, results } = result.data;
      
      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        const failNames = failures.map(f => `${f.name || f.fileId}: ${f.error}`).join('\n');
        alert(`Imported ${successCount}/${totalCount} files.\n\nFailed:\n${failNames}`);
      } else {
        setDriveProgress(`Successfully imported ${successCount} file(s)!`);
      }

      setDriveLinksText('');
      setParsedLinks([]);
      await loadAssets();
    } catch (error) {
      console.error('Drive import error:', error);
      alert('Import failed: ' + (error.message || 'Unknown error'));
    } finally {
      setTimeout(() => {
        setDriveImporting(false);
        setDriveProgress('');
      }, 2000);
    }
  }, [parsedLinks, loadAssets]);

  const handleFilesUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    const fileList = Array.from(files);
    let completed = 0;

    try {
      for (const file of fileList) {
        await uploadMediaAsset(
          { storage, db }, 
          file, 
          'vault', 
          (progress) => {
            // Calculate overall progress roughly
            const overallProgress = ((completed * 100) + progress) / fileList.length;
            setUploadProgress(overallProgress);
          }
        );
        completed++;
      }
      await loadAssets();
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleReplaceClick = (asset) => {
    setReplacingAsset(asset);
    setShowReplaceModal(true);
  };

  const handleReplaceFromUpload = () => {
    setShowReplaceModal(false);
    setTimeout(() => replaceInputRef.current?.click(), 100);
  };

  const handleReplaceFromDrive = useCallback(async () => {
    if (!replacingAsset || replaceParsedLinks.length === 0) return;
    
    // Only allow single file for replacement
    const fileLinks = replaceParsedLinks.filter(l => l.type === 'file');
    if (fileLinks.length !== 1) {
      alert('Please provide exactly one file link for replacement.');
      return;
    }

    setShowReplaceModal(false);
    setDriveImporting(true);
    setDriveProgress(`Importing replacement file from Google Drive...`);

    try {
      const functions = getFunctions(getApp(), 'us-central1');
      const importFromDrive = httpsCallable(functions, 'importFromDrive', { timeout: 540000 });
      
      const result = await importFromDrive({
        fileIds: [fileLinks[0].id],
        folderIds: [],
        forReplacement: true, // Signal that this is for replacement
      });

      const { results } = result.data;
      const importedFile = results?.[0];
      
      if (!importedFile?.success) {
        throw new Error(importedFile?.error || 'Failed to import file');
      }

      // Now update asset references in the database
      const oldUrl = replacingAsset.url;
      const newUrl = importedFile.downloadUrl;
      const count = await updateAssetReferences(db, oldUrl, newUrl);

      // Update the asset record itself
      await updateMediaAsset(db, replacingAsset.id, {
        url: newUrl,
        storagePath: importedFile.storagePath,
        size: importedFile.size,
        updatedAt: new Date(),
      });

      alert(`Asset replaced successfully!\nUpdated ${count} references in the database.`);
      await loadAssets();
      setReplaceLinksText('');
      setReplaceParsedLinks([]);
    } catch (error) {
      console.error('Drive replace error:', error);
      alert('Replacement failed: ' + (error.message || 'Unknown error'));
    } finally {
      setDriveImporting(false);
      setDriveProgress('');
      setReplacingAsset(null);
    }
  }, [replacingAsset, replaceParsedLinks, db, loadAssets]);

  const handleReplaceFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !replacingAsset) return;

    if (!window.confirm(`Replace "${replacingAsset.title}" with "${file.name}"?\n\nThis will update the file content and automatically update any links in the Content Library.`)) {
      setReplacingAsset(null);
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const oldUrl = replacingAsset.url;
      const newUrl = await replaceMediaAsset(
        { storage, db }, 
        replacingAsset, 
        file, 
        (p) => setUploadProgress(p)
      );

      const count = await updateAssetReferences(db, oldUrl, newUrl);
      
      alert(`Asset replaced successfully!\nUpdated ${count} references in the database.`);
      await loadAssets();
    } catch (error) {
      console.error(error);
      alert('Replacement failed: ' + error.message);
    } finally {
      setUploading(false);
      setReplacingAsset(null);
      e.target.value = '';
    }
  };

  const handleEditClick = (asset) => {
    setEditingAsset(asset);
    setEditTitle(asset.title);
  };

  const handleSaveEdit = async () => {
    if (!editingAsset || !editTitle.trim()) return;

    try {
      await updateMediaAsset(db, editingAsset.id, { title: editTitle.trim() });
      
      // Update local state
      setAssets(prev => prev.map(a => 
        a.id === editingAsset.id ? { ...a, title: editTitle.trim() } : a
      ));
      
      setEditingAsset(null);
      setEditTitle('');
    } catch (error) {
      alert('Update failed: ' + error.message);
    }
  };

  const handleDelete = async (asset) => {
    if (window.confirm(`Are you sure you want to delete "${asset.title}"? This cannot be undone.`)) {
      try {
        await deleteMediaAsset({ storage, db }, asset);
        setAssets(prev => prev.filter(a => a.id !== asset.id));
      } catch (error) {
        alert('Delete failed');
      }
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const filteredAssets = assets.filter(asset => 
    asset.title.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.title.localeCompare(b.title));

  const getIconForType = (type) => {
    switch (type) {
      case MEDIA_TYPES.VIDEO: return <Film size={24} className="text-purple-500" />;
      case MEDIA_TYPES.IMAGE: return <ImageIcon size={24} className="text-blue-500" />;
      default: return <FileText size={24} className="text-gray-500 dark:text-gray-400" />;
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderWrappedIndicator = (asset) => {
    const wrapper = wrappedUrlMap.get(asset.url);
    if (!wrapper) return null;

    return (
      <div className="absolute top-2 right-2 z-10" title={`Wrapped by: ${wrapper.title}`}>
        <div className="bg-green-500 text-white p-1 rounded-full shadow-sm">
          <CheckCircle size={14} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Media Vault</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage digital assets (Videos, PDFs, Images)</p>
        </div>
        <div className="flex gap-2">
          <input 
            type="file" 
            ref={replaceInputRef}
            className="hidden" 
            onChange={handleReplaceFile}
            disabled={uploading}
          />
          <button
            onClick={() => setShowDriveModal(true)}
            disabled={driveImporting}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <HardDrive size={20} />
            Import from Drive
          </button>
          <label className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
            <Upload size={20} />
            Upload Asset
            <input 
              type="file" 
              multiple
              className="hidden" 
              onChange={(e) => handleFilesUpload(e.target.files)}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-2 border-b border-blue-100 dark:border-blue-800">
          <div className="flex justify-between text-xs text-blue-700 mb-1">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Drive Import Progress */}
      {driveImporting && (
        <div className="bg-green-50 dark:bg-green-900/20 px-6 py-3 border-b border-green-100 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
            <span className="text-sm text-green-700 dark:text-green-300 font-medium">{driveProgress}</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="px-6 py-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          {['ALL', 'VIDEO', 'IMAGE', 'DOCUMENT'].map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                filterType === type 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white dark:bg-slate-800 border text-gray-600 dark:text-gray-300 hover:bg-gray-50'
              }`}
            >
              {type === 'ALL' ? 'All Assets' : type + 's'}
            </button>
          ))}
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search vault..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex border rounded-lg bg-white dark:bg-slate-800">
            <button 
              onClick={() => setViewMode('GRID')}
              className={`p-2 ${viewMode === 'GRID' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600' : 'text-gray-400'}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('LIST')}
              className={`p-2 ${viewMode === 'LIST' ? 'bg-gray-100 dark:bg-gray-700 text-blue-600' : 'text-gray-400'}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-y-auto px-6 pb-6"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {dragActive && (
          <div className="absolute inset-0 bg-blue-500/10 border-4 border-blue-500 border-dashed z-50 flex items-center justify-center backdrop-blur-sm m-4 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">Drop files to upload to Vault</div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-slate-800">
            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
              <Upload size={64} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Vault is empty</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Upload assets or import from Google Drive to get started</p>
            <button
              onClick={() => setShowDriveModal(true)}
              className="mt-4 inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HardDrive size={18} />
              Import from Google Drive
            </button>
          </div>
        ) : viewMode === 'GRID' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAssets.map(asset => (
              <div key={asset.id} className="group bg-white dark:bg-slate-800 border rounded-lg overflow-hidden hover:shadow-md transition-shadow relative">
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden">
                  {asset.type === MEDIA_TYPES.IMAGE ? (
                    <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                  ) : asset.type === MEDIA_TYPES.VIDEO ? (
                    <video src={asset.url} className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={48} className="text-gray-300" />
                  )}
                  
                  {renderWrappedIndicator(asset)}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleReplaceClick(asset)}
                      className="p-2 bg-white/20 dark:bg-slate-800/20 text-white rounded-full hover:bg-white/40"
                      title="Replace File"
                    >
                      <RefreshCw size={18} />
                    </button>
                    <button 
                      onClick={() => handleEditClick(asset)}
                      className="p-2 bg-white/20 dark:bg-slate-800/20 text-white rounded-full hover:bg-white/40"
                      title="Rename"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(asset)}
                      className="p-2 bg-red-500/80 text-white rounded-full hover:bg-red-600"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="truncate font-medium text-sm text-gray-900 dark:text-gray-100" title={asset.title}>
                      {asset.title}
                    </div>
                    {getIconForType(asset.type)}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatSize(asset.size)}</span>
                    <span className="uppercase">{asset.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center relative">
                          {asset.type === MEDIA_TYPES.IMAGE ? (
                            <img src={asset.url} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : getIconForType(asset.type)}
                          {wrappedUrlMap.has(asset.url) && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border border-white" title="Wrapped">
                              <CheckCircle size={10} />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{asset.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{asset.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatSize(asset.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {(asset.createdAt?.toDate?.() || (asset.createdAt ? new Date(asset.createdAt) : null))?.toLocaleDateString() || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleReplaceClick(asset)} className="text-green-600 hover:text-green-900" title="Replace File">
                          <RefreshCw size={18} />
                        </button>
                        <button onClick={() => handleEditClick(asset)} className="text-blue-600 hover:text-blue-900" title="Rename">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(asset)} className="text-red-600 hover:text-red-900" title="Delete">
                          <Trash2 size={18} />
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

      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Rename Asset</h3>
              <button onClick={() => setEditingAsset(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Asset Name</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setEditingAsset(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={!editTitle.trim()}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Import Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <HardDrive size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Import from Google Drive</h3>
                  <p className="text-xs text-gray-500">Paste share links below</p>
                </div>
              </div>
              <button onClick={() => { setShowDriveModal(false); setDriveLinksText(''); }} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">How to use:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Share your Drive folder/files with this service account (Viewer is enough):</li>
                  {serviceAccountEmail ? (
                    <li className="ml-4 flex items-center gap-1 flex-wrap">
                      <code className="bg-blue-100 dark:bg-blue-800 px-1.5 py-0.5 rounded text-[11px] font-mono select-all">
                        {serviceAccountEmail}
                      </code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(serviceAccountEmail); setSaCopied(true); setTimeout(() => setSaCopied(false), 2000); }}
                        className="text-blue-600 hover:text-blue-800 text-[11px] underline"
                      >
                        {saCopied ? '✓ Copied' : 'Copy'}
                      </button>
                    </li>
                  ) : (
                    <li className="ml-4 text-xs text-gray-400 italic">Loading service account email...</li>
                  )}
                  <li>In Google Drive, right-click → <strong>Share</strong> → paste the email above</li>
                  <li>Copy the file or folder link and paste below</li>
                </ol>
                <p className="text-xs mt-2 text-blue-600 dark:text-blue-400">
                  Tip: Share a whole folder, then paste the folder link to import all files at once.
                </p>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Drive Links
                </label>
                <textarea
                  value={driveLinksText}
                  onChange={(e) => setDriveLinksText(e.target.value)}
                  placeholder={`https://drive.google.com/file/d/abc123.../view\nhttps://drive.google.com/file/d/def456.../view\nhttps://drive.google.com/drive/folders/xyz789...`}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono h-36 resize-none"
                  autoFocus
                />
              </div>

              {/* Parsed Links Preview */}
              {parsedLinks.length > 0 && (
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Detected {parsedLinks.length} link(s):
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {parsedLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                        <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        <span className="truncate">
                          {link.type === 'folder' ? '📁 Folder' : '📄 File'}: {link.id.substring(0, 20)}...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {driveLinksText.trim() && parsedLinks.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertCircle size={16} />
                  <span>No valid Google Drive links detected. Check the format.</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 px-6 py-4 border-t bg-gray-50 dark:bg-slate-700/50 rounded-b-xl">
              <button 
                onClick={() => { setShowDriveModal(false); setDriveLinksText(''); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleDriveImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                disabled={parsedLinks.length === 0}
              >
                <Download size={18} />
                Import {parsedLinks.length > 0 ? `${parsedLinks.length} Item(s)` : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Asset Modal */}
      {showReplaceModal && replacingAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <RefreshCw size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Replace Asset</h3>
                  <p className="text-xs text-gray-500 truncate max-w-xs">{replacingAsset.title}</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowReplaceModal(false); setReplacingAsset(null); setReplaceLinksText(''); setReplaceParsedLinks([]); }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              {/* Option 1: Upload from Computer */}
              <button
                onClick={handleReplaceFromUpload}
                className="w-full flex items-center gap-4 p-4 border-2 border-dashed rounded-lg hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
              >
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-blue-200">
                  <Upload size={24} className="text-blue-600" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-gray-100">Upload from Computer</p>
                  <p className="text-xs text-gray-500">Select a file from your device</p>
                </div>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              </div>

              {/* Option 2: Import from Drive */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <HardDrive size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Import from Google Drive</p>
                    <p className="text-xs text-gray-500">Paste a single file share link</p>
                  </div>
                </div>

                {/* Service Account Info */}
                {serviceAccountEmail && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2 mb-3 text-xs text-blue-700 dark:text-blue-300">
                    <span>Share with: </span>
                    <code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded font-mono select-all">
                      {serviceAccountEmail.substring(0, 30)}...
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(serviceAccountEmail); setSaCopied(true); setTimeout(() => setSaCopied(false), 2000); }}
                      className="ml-2 text-blue-600 hover:text-blue-800 underline"
                    >
                      {saCopied ? '✓' : 'Copy'}
                    </button>
                  </div>
                )}

                <textarea
                  value={replaceLinksText}
                  onChange={(e) => setReplaceLinksText(e.target.value)}
                  placeholder="https://drive.google.com/file/d/abc123.../view"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm font-mono h-20 resize-none"
                />

                {replaceParsedLinks.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                    <CheckCircle size={14} />
                    <span>File detected: {replaceParsedLinks[0].id.substring(0, 20)}...</span>
                  </div>
                )}

                {replaceParsedLinks.length > 1 && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-amber-600">
                    <AlertCircle size={14} />
                    <span>Only one file can be used for replacement. The first will be used.</span>
                  </div>
                )}

                <button
                  onClick={handleReplaceFromDrive}
                  disabled={replaceParsedLinks.length === 0}
                  className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Download size={16} />
                  Replace from Drive
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end px-6 py-4 border-t bg-gray-50 dark:bg-slate-700/50 rounded-b-xl">
              <button 
                onClick={() => { setShowReplaceModal(false); setReplacingAsset(null); setReplaceLinksText(''); setReplaceParsedLinks([]); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;
