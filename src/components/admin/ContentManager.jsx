// src/components/admin/ContentManager.jsx
// Generic Content Management UI for any content type

import React, { useState, useEffect, useRef } from 'react';
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
  Loader
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getAllContentAdmin, 
  addContent, 
  updateContent, 
  deleteContent, 
  CONTENT_COLLECTIONS 
} from '../../services/contentService';

// Content type configurations
const CONTENT_TYPES = {
  [CONTENT_COLLECTIONS.READINGS]: {
    label: 'Readings',
    icon: BookOpen,
    fields: ['title', 'description', 'url', 'tier', 'category', 'thumbnail']
  },
  [CONTENT_COLLECTIONS.VIDEOS]: {
    label: 'Videos',
    icon: Film,
    fields: ['title', 'description', 'url', 'tier', 'category', 'thumbnail', 'duration']
  },
  [CONTENT_COLLECTIONS.COURSES]: {
    label: 'Courses',
    icon: GraduationCap,
    fields: ['title', 'description', 'tier', 'category', 'thumbnail']
  }
};

const ContentManager = ({ contentType }) => {
  const { db, navigate } = useAppServices();
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const editFormRef = useRef(null);
  
  const config = CONTENT_TYPES[contentType];
  const Icon = config.icon;

  // Load content
  useEffect(() => {
    loadContent();
  }, [contentType]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getAllContentAdmin(db, contentType);
      setContent(data);
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem({
      title: '',
      description: '',
      url: '',
      tier: 'free',
      category: '',
      thumbnail: '',
      isActive: true,
      order: 999
    });
    setIsAddingNew(true);
  };

  const handleEdit = (item) => {
    console.log('[ContentManager] Editing item:', { id: item.id, title: item.title });
    // Deep copy to avoid reference issues
    setEditingItem({ 
      ...item, 
      metadata: item.metadata ? { ...item.metadata } : {} 
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
        <Loader className="w-8 h-8 animate-spin text-[#47A88D]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('admin-content-home')}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-70 text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-8 h-8 text-[#47A88D]" />
            <h1 className="text-3xl font-bold text-[#002E47]">
              Manage {config.label}
            </h1>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all bg-[#47A88D] hover:bg-[#3d917a]"
          >
            <Plus className="w-5 h-5" />
            Add New
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div ref={editFormRef} className="mb-6 p-6 bg-white rounded-xl shadow-lg border-2 border-[#47A88D]">
          <h2 className="text-xl font-bold mb-4 text-[#002E47]">
            {isAddingNew ? 'Add New Item' : `Edit: ${editingItem.title || 'Untitled'}`}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                Title *
              </label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                placeholder="Enter title"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                Description
              </label>
              <textarea
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                rows="3"
                placeholder="Enter description"
              />
            </div>

            {config.fields.includes('url') && (
              <div>
                <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                  URL *
                </label>
                <input
                  type="url"
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                  placeholder="https://"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                  Tier *
                </label>
                <select
                  value={editingItem.tier}
                  onChange={(e) => setEditingItem({ ...editingItem, tier: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                  Category
                </label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                  placeholder="e.g., leadership"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={editingItem.thumbnail}
                onChange={(e) => setEditingItem({ ...editingItem, thumbnail: e.target.value })}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                placeholder="https://"
              />
            </div>

            {/* Additional metadata fields for readings */}
            {contentType === CONTENT_COLLECTIONS.READINGS && editingItem.metadata && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                    Author
                  </label>
                  <input
                    type="text"
                    value={editingItem.metadata.author || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, author: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                    placeholder="Book author"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                      Duration (pages)
                    </label>
                    <input
                      type="text"
                      value={editingItem.metadata.duration || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, duration: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                      placeholder="e.g., 320"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                      Complexity
                    </label>
                    <select
                      value={editingItem.metadata.complexity || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, complexity: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                    Focus Areas
                  </label>
                  <input
                    type="text"
                    value={editingItem.metadata.focus || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, focus: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                    placeholder="Key concepts (comma separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                    Executive Brief HTML
                  </label>
                  <textarea
                    value={editingItem.metadata.executiveBriefHTML || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, executiveBriefHTML: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                    rows="4"
                    placeholder="<h3>Executive Brief HTML content...</h3>"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1 text-[#002E47]">
                    Full Flyer HTML
                  </label>
                  <textarea
                    value={editingItem.metadata.fullFlyerHTML || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, fullFlyerHTML: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#47A88D] focus:border-[#47A88D] outline-none"
                    rows="6"
                    placeholder="<h2>Full Flyer HTML content...</h2>"
                  />
                </div>
              </>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingItem.isActive}
                onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                className="w-4 h-4 text-[#47A88D] focus:ring-[#47A88D]"
              />
              <label className="text-sm font-semibold text-[#002E47]">
                Active (visible to users)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white bg-[#47A88D] hover:bg-[#3d917a]"
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
              className={`p-4 bg-white rounded-xl shadow-sm border flex items-center justify-between ${item.isActive ? 'border-[#47A88D]' : 'border-slate-300 opacity-60'}`}
            >
              <div className="flex-1">
                <h3 className="font-bold text-[#002E47]">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {item.description?.substring(0, 100)}
                  {item.description?.length > 100 ? '...' : ''}
                </p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="px-2 py-1 rounded bg-[#47A88D]/20 text-[#47A88D]">
                    {item.tier}
                  </span>
                  {item.category && (
                    <span className="px-2 py-1 rounded bg-[#002E47]/10 text-[#002E47]">
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
                    <Eye className="w-5 h-5 text-[#47A88D]" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="w-5 h-5 text-[#002E47]" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5 text-[#E04E1B]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContentManager;
