// src/components/admin/MediaLibrary.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getMediaAssets, 
  uploadMediaAsset, 
  deleteMediaAsset, 
  MEDIA_TYPES 
} from '../../services/mediaService';

const MediaLibrary = () => {
  const { db, storage } = useAppServices();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('GRID'); // GRID | LIST
  const [dragActive, setDragActive] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMediaAssets(db, filterType);
      setAssets(data);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  }, [db, filterType]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

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
  );

  const getIconForType = (type) => {
    switch (type) {
      case MEDIA_TYPES.VIDEO: return <Film size={24} className="text-purple-500" />;
      case MEDIA_TYPES.IMAGE: return <ImageIcon size={24} className="text-blue-500" />;
      default: return <FileText size={24} className="text-gray-500" />;
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Vault</h1>
          <p className="text-sm text-gray-500">Manage digital assets (Videos, PDFs, Images)</p>
        </div>
        <div className="flex gap-2">
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
        <div className="bg-blue-50 px-6 py-2 border-b border-blue-100">
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
                  : 'bg-white border text-gray-600 hover:bg-gray-50'
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
          <div className="flex border rounded-lg bg-white">
            <button 
              onClick={() => setViewMode('GRID')}
              className={`p-2 ${viewMode === 'GRID' ? 'bg-gray-100 text-blue-600' : 'text-gray-400'}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('LIST')}
              className={`p-2 ${viewMode === 'LIST' ? 'bg-gray-100 text-blue-600' : 'text-gray-400'}`}
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
          <div className="text-center py-20 border-2 border-dashed border-gray-300 rounded-xl bg-white">
            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
              <Upload size={64} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Vault is empty</h3>
            <p className="text-gray-500 mt-1">Upload assets to get started</p>
          </div>
        ) : viewMode === 'GRID' ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAssets.map(asset => (
              <div key={asset.id} className="group bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow relative">
                <div className="aspect-video bg-gray-100 flex items-center justify-center relative overflow-hidden">
                  {asset.type === MEDIA_TYPES.IMAGE ? (
                    <img src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                  ) : asset.type === MEDIA_TYPES.VIDEO ? (
                    <video src={asset.url} className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={48} className="text-gray-300" />
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a 
                      href={asset.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-white/20 text-white rounded-full hover:bg-white/40"
                      title="Open"
                    >
                      <ExternalLink size={18} />
                    </a>
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
                    <div className="truncate font-medium text-sm text-gray-900" title={asset.title}>
                      {asset.title}
                    </div>
                    {getIconForType(asset.type)}
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                    <span>{formatSize(asset.size)}</span>
                    <span className="uppercase">{asset.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAssets.map(asset => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                          {asset.type === MEDIA_TYPES.IMAGE ? (
                            <img src={asset.url} alt="" className="h-10 w-10 rounded object-cover" />
                          ) : getIconForType(asset.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{asset.title}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">{asset.fileName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {asset.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatSize(asset.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.createdAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <a href={asset.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-900">
                          <ExternalLink size={18} />
                        </a>
                        <button onClick={() => handleDelete(asset)} className="text-red-600 hover:text-red-900">
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
    </div>
  );
};

export default MediaLibrary;
