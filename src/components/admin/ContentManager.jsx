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

const COLORS = {
  NAVY: '#002E47',
  ORANGE: '#E04E1B',
  TEAL: '#47A88D',
  LIGHT_GRAY: '#FCFCFA',
  MUTED: '#6B7280'
};

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
        await updateContent(db, contentType, id, updates);
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
        <Loader className="w-8 h-8 animate-spin" style={{ color: COLORS.TEAL }} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" style={{ backgroundColor: COLORS.LIGHT_GRAY, minHeight: '100vh' }}>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('admin-content-home')}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-70"
          style={{ color: COLORS.MUTED }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className="w-8 h-8" style={{ color: COLORS.TEAL }} />
            <h1 className="text-3xl font-bold" style={{ color: COLORS.NAVY }}>
              Manage {config.label}
            </h1>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all"
            style={{ backgroundColor: COLORS.TEAL }}
          >
            <Plus className="w-5 h-5" />
            Add New
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div ref={editFormRef} className="mb-6 p-6 bg-white rounded-xl shadow-lg border-2" style={{ borderColor: COLORS.TEAL }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
            {isAddingNew ? 'Add New Item' : `Edit: ${editingItem.title || 'Untitled'}`}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                Title *
              </label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter title"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                Description
              </label>
              <textarea
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows="3"
                placeholder="Enter description"
              />
            </div>

            {config.fields.includes('url') && (
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  URL *
                </label>
                <input
                  type="url"
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="https://"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  Tier *
                </label>
                <select
                  value={editingItem.tier}
                  onChange={(e) => setEditingItem({ ...editingItem, tier: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="elite">Elite</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                  Category
                </label>
                <input
                  type="text"
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., leadership"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                Thumbnail URL
              </label>
              <input
                type="url"
                value={editingItem.thumbnail}
                onChange={(e) => setEditingItem({ ...editingItem, thumbnail: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="https://"
              />
            </div>

            {/* Additional metadata fields for readings */}
            {contentType === CONTENT_COLLECTIONS.READINGS && editingItem.metadata && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                    Author
                  </label>
                  <input
                    type="text"
                    value={editingItem.metadata.author || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, author: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Book author"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                      Duration (pages)
                    </label>
                    <input
                      type="text"
                      value={editingItem.metadata.duration || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, duration: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="e.g., 320"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                      Complexity
                    </label>
                    <select
                      value={editingItem.metadata.complexity || ''}
                      onChange={(e) => setEditingItem({ 
                        ...editingItem, 
                        metadata: { ...editingItem.metadata, complexity: e.target.value }
                      })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="">Select...</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                    Focus Areas
                  </label>
                  <input
                    type="text"
                    value={editingItem.metadata.focus || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, focus: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Key concepts (comma separated)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                    Executive Brief HTML
                  </label>
                  <textarea
                    value={editingItem.metadata.executiveBriefHTML || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, executiveBriefHTML: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg font-mono text-sm"
                    rows="4"
                    placeholder="<h3>Executive Brief HTML content...</h3>"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: COLORS.NAVY }}>
                    Full Flyer HTML
                  </label>
                  <textarea
                    value={editingItem.metadata.fullFlyerHTML || ''}
                    onChange={(e) => setEditingItem({ 
                      ...editingItem, 
                      metadata: { ...editingItem.metadata, fullFlyerHTML: e.target.value }
                    })}
                    className="w-full p-2 border rounded-lg font-mono text-sm"
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
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold" style={{ color: COLORS.NAVY }}>
                Active (visible to users)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: COLORS.TEAL }}
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddingNew(false);
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: COLORS.LIGHT_GRAY, color: COLORS.MUTED }}
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
            <p style={{ color: COLORS.MUTED }}>No {config.label.toLowerCase()} yet. Click "Add New" to create one.</p>
          </div>
        ) : (
          content.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white rounded-xl shadow-sm border flex items-center justify-between"
              style={{ 
                borderColor: item.isActive ? COLORS.TEAL : COLORS.MUTED,
                opacity: item.isActive ? 1 : 0.6
              }}
            >
              <div className="flex-1">
                <h3 className="font-bold" style={{ color: COLORS.NAVY }}>
                  {item.title}
                </h3>
                <p className="text-sm" style={{ color: COLORS.MUTED }}>
                  {item.description?.substring(0, 100)}
                  {item.description?.length > 100 ? '...' : ''}
                </p>
                <div className="flex gap-3 mt-2 text-xs">
                  <span className="px-2 py-1 rounded" style={{ backgroundColor: `${COLORS.TEAL}20`, color: COLORS.TEAL }}>
                    {item.tier}
                  </span>
                  {item.category && (
                    <span className="px-2 py-1 rounded" style={{ backgroundColor: `${COLORS.NAVY}10`, color: COLORS.NAVY }}>
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
                    <Eye className="w-5 h-5" style={{ color: COLORS.TEAL }} />
                  ) : (
                    <EyeOff className="w-5 h-5" style={{ color: COLORS.MUTED }} />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="w-5 h-5" style={{ color: COLORS.NAVY }} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" style={{ color: COLORS.ORANGE }} />
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
