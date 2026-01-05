// src/components/admin/ContentManager.jsx
// Generic Content Management UI for any content type

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  ArrowLeft,
  BookOpen,
  Film,
  GraduationCap,
  Loader,
  Upload,
  FileText,
  Link as LinkIcon,
  Database
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getAllContentAdmin, 
  addContent, 
  updateContent, 
  deleteContent, 
  CONTENT_COLLECTIONS 
} from '../../services/contentService';
import MediaSelector from './MediaSelector';

// Content type configurations
const CONTENT_TYPES = {
  [CONTENT_COLLECTIONS.READINGS]: {
    label: 'Read & Reps (Books)',
    icon: BookOpen,
    fields: ['title', 'description', 'url', 'category', 'thumbnail', 'author', 'readTime', 'tags']
  },
  [CONTENT_COLLECTIONS.DOCUMENTS]: {
    label: 'Documents',
    icon: FileText,
    fields: ['title', 'description', 'url', 'category', 'thumbnail', 'tags']
  },
  [CONTENT_COLLECTIONS.VIDEOS]: {
    label: 'Videos',
    icon: Film,
    fields: ['title', 'description', 'url', 'category', 'thumbnail', 'duration', 'speaker', 'transcriptUrl', 'tags']
  },
  [CONTENT_COLLECTIONS.COURSES]: {
    label: 'Courses',
    icon: GraduationCap,
    fields: ['title', 'description', 'category', 'thumbnail', 'instructor', 'level', 'totalDuration']
  }
};

const ContentManager = ({ contentType, title, description }) => {
  const { db, navigate } = useAppServices();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // eslint-disable-line no-unused-vars
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const editFormRef = useRef(null);
  
  const config = CONTENT_TYPES[contentType];
  const Icon = config.icon;
  const displayTitle = title || config.label;
  const displayDesc = description || '';

  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllContentAdmin(db, contentType);
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  }, [db, contentType]);

  // Load content
  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const handleAdd = () => {
    setEditingItem({
      title: '',
      description: '',
      url: '',
      tier: 'free',
      category: '',
      thumbnail: '',
      isActive: true,
      order: 999,
      resourceType: 'link' // 'link' or 'file'
    });
    setIsAddingNew(true);
  };

  const handleEdit = (item) => {
    console.log('[ContentManager] Editing item:', { id: item.id, title: item.title });
    // Deep copy to avoid reference issues
    setEditingItem({ 
      ...item, 
      metadata: item.metadata ? { ...item.metadata } : {},
      resourceType: item.metadata?.isUploadedFile ? 'file' : 'link'
    });
    setIsAddingNew(false);
    // Scroll to edit form after state update
    setTimeout(() => {
      if (editFormRef.current) {
        const yOffset = -100; // Offset to show some context above
        const y = editFormRef.current.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  };

  /*
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const folder = contentType === CONTENT_COLLECTIONS.VIDEOS ? 'resources/videos' : 'resources/documents';
      const { url, metadata } = await uploadResourceFile(file, folder);
      
      setEditingItem(prev => ({
        ...prev,
        url: url,
        metadata: {
          ...prev.metadata,
          isUploadedFile: true,
          fileName: metadata.name,
          fileSize: metadata.size,
          fileType: metadata.type,
          storagePath: metadata.fullPath
        }
      }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  */

  const handleSave = async () => {
    try {
      if (isAddingNew) {
        await addContent(db, contentType, editingItem);
      } else {
        const { id, ...updates } = editingItem;
        try {
          await updateContent(db, contentType, id, updates);
        } catch (updateError) {
          if (updateError.message && updateError.message.includes('No document to update')) {
            const shouldCreate = window.confirm(
              'This item could not be found in the database (it may have been deleted). \n\nDo you want to save it as a NEW item?'
            );
            if (shouldCreate) {
              await addContent(db, contentType, updates);
            } else {
              return;
            }
          } else {
            throw updateError;
          }
        }
      }
      setEditingItem(null);
      setIsAddingNew(false);
      await loadContent();
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Error saving content. Please try again.');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    
    try {
      await deleteContent(db, contentType, item.id);
      await loadContent();
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Error deleting content. Please try again.');
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateContent(db, contentType, item.id, { isActive: !item.isActive });
      await loadContent();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-6 w-full bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('admin-content-home')}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-70 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Content Wrapper
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-8 h-8 text-corporate-teal" />
            <div>
              <h1 className="text-3xl font-bold text-corporate-navy">
                {displayTitle}
              </h1>
              <p className="text-slate-500">
                {displayDesc}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all bg-corporate-teal hover:bg-corporate-teal-dark"
          >
            <Plus className="w-5 h-5" />
            Add New
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div ref={editFormRef} className="mb-6 p-6 bg-white rounded-xl shadow-lg border-2 border-corporate-teal">
          <h2 className="text-xl font-bold mb-4 text-corporate-navy">
            {isAddingNew ? 'Add New Item' : `Edit: ${editingItem.title || 'Untitled'}`}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                Title *
              </label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                placeholder="Enter title"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                Description
              </label>
              <textarea
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                rows="3"
                placeholder="Enter description"
              />
            </div>

            {config.fields.includes('url') && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-corporate-navy">
                  Resource Type
                </label>
                <div className="flex gap-4 mb-2">
                  <button
                    onClick={() => setEditingItem({ ...editingItem, resourceType: 'link' })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      editingItem.resourceType === 'link'
                        ? 'bg-corporate-teal text-white border-corporate-teal'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <LinkIcon className="w-4 h-4" />
                    External Link
                  </button>
                  <button
                    onClick={() => setEditingItem({ ...editingItem, resourceType: 'file' })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                      editingItem.resourceType === 'file'
                        ? 'bg-corporate-teal text-white border-corporate-teal'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    From Media Vault
                  </button>
                </div>

                {editingItem.resourceType === 'file' ? (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                    <div className="flex flex-col items-center justify-center">
                      <Database className="w-10 h-10 text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-700">
                        Select content from Media Vault
                      </p>
                      <button
                        onClick={() => setShowMediaSelector(true)}
                        className="mt-3 px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"
                      >
                        Open Vault
                      </button>
                    </div>
                    
                    {editingItem.url && editingItem.resourceType === 'file' && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 text-left">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-800 truncate">
                            {editingItem.metadata?.fileName || 'Selected File'}
                          </p>
                          <p className="text-xs text-green-600 truncate">{editingItem.url}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      External URL *
                    </label>
                    <input
                      type="url"
                      value={editingItem.url}
                      onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="https://"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                  Category
                </label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                  placeholder="e.g., leadership"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={editingItem.thumbnail}
                onChange={(e) => setEditingItem({ ...editingItem, thumbnail: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                placeholder="https://"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="checkbox"
                id="isHiddenUntilUnlocked"
                checked={editingItem.isHiddenUntilUnlocked || false}
                onChange={(e) => setEditingItem({ ...editingItem, isHiddenUntilUnlocked: e.target.checked })}
                className="w-4 h-4 text-corporate-teal border-gray-300 rounded focus:ring-corporate-teal"
              />
              <label htmlFor="isHiddenUntilUnlocked" className="text-sm font-medium text-corporate-navy cursor-pointer select-none">
                Hide from Library until Unlocked via Development Plan
              </label>
            </div>

            {/* Additional metadata fields for readings */}
            {contentType === CONTENT_COLLECTIONS.READINGS && editingItem.metadata && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Author
                    </label>
                    <input
                      type="text"
                      value={editingItem.metadata.author || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, author: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="Book author"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Read Time (min)
                    </label>
                    <input
                      type="text"
                      value={editingItem.metadata.readTime || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, readTime: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="e.g., 15"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Duration (pages)
                    </label>
                    <input
                      type="text"
                      value={editingItem.metadata.duration || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, duration: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="e.g., 320"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Complexity
                    </label>
                    <select
                      value={editingItem.metadata.complexity || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, complexity: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Additional metadata fields for VIDEOS */}
            {contentType === CONTENT_COLLECTIONS.VIDEOS && editingItem.metadata && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Speaker / Host
                    </label>
                    <input
                      type="text"
                      value={editingItem.metadata.speaker || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, speaker: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="e.g. Simon Sinek"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={editingItem.metadata.duration || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, duration: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="e.g. 15:30"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                    Transcript URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={editingItem.metadata.transcriptUrl || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, transcriptUrl: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            {/* Additional metadata fields for COURSES */}
            {contentType === CONTENT_COLLECTIONS.COURSES && editingItem.metadata && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Instructor
                    </label>
                    <input
                      type="text"
                      value={editingItem.metadata.instructor || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, instructor: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                      placeholder="e.g. Dr. Sarah Chen"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                      Level
                    </label>
                    <select
                      value={editingItem.metadata.level || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, level: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                    Total Duration
                  </label>
                  <input
                    type="text"
                    value={editingItem.metadata.totalDuration || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, totalDuration: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                    placeholder="e.g. 4 weeks, 2 hours"
                  />
                </div>
              </>
            )}

            {/* Common Tags Field */}
            <div>
              <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={editingItem.metadata?.tags ? (Array.isArray(editingItem.metadata.tags) ? editingItem.metadata.tags.join(', ') : editingItem.metadata.tags) : ''}
                onChange={(e) => setEditingItem({ 
                  ...editingItem, 
                  metadata: { 
                    ...editingItem.metadata, 
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) 
                  }
                })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal outline-none"
                placeholder="leadership, communication, trust"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingItem.isActive}
                onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                className="w-4 h-4 text-corporate-teal focus:ring-corporate-teal"
              />
              <label className="text-sm font-semibold text-corporate-navy">
                Active (visible to users)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white bg-corporate-teal hover:bg-corporate-teal-dark"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddingNew(false);
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content List */}
      <div className="space-y-3">
        {content.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-500">No {config.label.toLowerCase()} yet. Click "Add New" to create one.</p>
          </div>
        ) : (
          content.map((item) => (
            <div
              key={item.id}
              className={`p-4 bg-white rounded-xl shadow-sm border flex items-center justify-between ${item.isActive ? 'border-corporate-teal' : 'border-slate-300 opacity-60'}`}
            >
              <div className="flex-1">
                <h3 className="font-bold text-corporate-navy">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {item.description?.substring(0, 100)}
                  {item.description?.length > 100 ? '...' : ''}
                </p>
                <div className="flex gap-3 mt-2 text-xs">
                  {item.category && (
                    <span className="px-2 py-1 rounded bg-corporate-navy/10 text-corporate-navy">
                      {item.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(item)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title={item.isActive ? 'Deactivate' : 'Activate'}
                >
                  {item.isActive ? (
                    <Eye className="w-5 h-5 text-corporate-teal" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="w-5 h-5 text-corporate-navy" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5 text-corporate-orange" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Media Selector Modal */}
      {showMediaSelector && (
        <MediaSelector
          mediaType={contentType === CONTENT_COLLECTIONS.VIDEOS ? 'video' : 'document'}
          value={editingItem?.url}
          onChange={(url, asset) => {
            setEditingItem(prev => ({
              ...prev,
              url: url,
              metadata: {
                ...prev.metadata,
                isUploadedFile: true,
                fileName: asset.title || asset.fileName,
                fileSize: asset.size,
                fileType: asset.type,
                storagePath: asset.storagePath
              }
            }));
          }}
          onClose={() => setShowMediaSelector(false)}
        />
      )}
    </div>
  );
};

export default ContentManager;
