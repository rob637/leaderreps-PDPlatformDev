// src/components/admin/LOVManager.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  ArrowLeft,
  List,
  Loader,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getAllContentAdmin, 
  addContent, 
  updateContent, 
  deleteContent, 
  CONTENT_COLLECTIONS 
} from '../../services/contentService';

// Content group LOVs use object items instead of string items
const CONTENT_GROUP_LOVS = ['content_programs', 'content_workouts', 'content_skills'];

const LOVManager = () => {
  const { db, navigate } = useAppServices();
  const [lovs, setLovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingObjectItem, setEditingObjectItem] = useState(null);
  const [editingObjectIndex, setEditingObjectIndex] = useState(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getAllContentAdmin(db, CONTENT_COLLECTIONS.LOV);
      setLovs(data);
    } catch (error) {
      console.error('Error loading LOVs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if a LOV uses object items (content groups)
  const isContentGroupLov = (lov) => {
    return CONTENT_GROUP_LOVS.includes(lov?.id) || 
           (lov?.items?.length > 0 && typeof lov.items[0] === 'object');
  };

  const handleAdd = () => {
    setEditingItem({
      title: '',
      description: '',
      items: [],
      isActive: true
    });
    setIsAddingNew(true);
  };

  const handleEdit = (item) => {
    setEditingItem({ 
      ...item,
      items: item.items || []
    });
    setIsAddingNew(false);
    setEditingObjectItem(null);
    setEditingObjectIndex(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    try {
      if (isAddingNew) {
        await addContent(db, CONTENT_COLLECTIONS.LOV, editingItem);
      } else {
        const { id, ...updates } = editingItem;
        await updateContent(db, CONTENT_COLLECTIONS.LOV, id, updates);
      }
      setEditingItem(null);
      setIsAddingNew(false);
      setEditingObjectItem(null);
      setEditingObjectIndex(null);
      await loadContent();
    } catch (error) {
      console.error('Error saving LOV:', error);
      alert('Error saving LOV. Please try again.');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete the list "${item.title}"?`)) return;
    
    try {
      await deleteContent(db, CONTENT_COLLECTIONS.LOV, item.id);
      await loadContent();
    } catch (error) {
      console.error('Error deleting LOV:', error);
      alert('Error deleting LOV. Please try again.');
    }
  };

  // String item handlers
  const handleItemChange = (index, value) => {
    const newItems = [...editingItem.items];
    newItems[index] = value;
    setEditingItem({ ...editingItem, items: newItems });
  };

  const addItem = () => {
    if (isContentGroupLov(editingItem)) {
      // Add new object item for content groups
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        label: '',
        description: '',
        thumbnail: '',
        displayOrder: editingItem.items.length,
        isActive: true,
        isHiddenUntilUnlocked: false,
        unlockDay: null,
        createdAt: new Date().toISOString()
      };
      setEditingItem({ 
        ...editingItem, 
        items: [...editingItem.items, newItem] 
      });
      // Open editor for the new item
      setEditingObjectItem(newItem);
      setEditingObjectIndex(editingItem.items.length);
    } else {
      // Add string item
      setEditingItem({ 
        ...editingItem, 
        items: [...editingItem.items, ''] 
      });
    }
  };

  const removeItem = (index) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    const newItems = editingItem.items.filter((_, i) => i !== index);
    setEditingItem({ ...editingItem, items: newItems });
    if (editingObjectIndex === index) {
      setEditingObjectItem(null);
      setEditingObjectIndex(null);
    }
  };

  // Object item handlers
  const handleEditObjectItem = (item, index) => {
    setEditingObjectItem({ ...item });
    setEditingObjectIndex(index);
  };

  const handleSaveObjectItem = () => {
    if (editingObjectIndex === null) return;
    const newItems = [...editingItem.items];
    newItems[editingObjectIndex] = editingObjectItem;
    setEditingItem({ ...editingItem, items: newItems });
    setEditingObjectItem(null);
    setEditingObjectIndex(null);
  };

  const handleCancelObjectEdit = () => {
    setEditingObjectItem(null);
    setEditingObjectIndex(null);
  };

  const moveItem = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editingItem.items.length) return;
    
    const newItems = [...editingItem.items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    
    // Update displayOrder for all items
    newItems.forEach((item, i) => {
      if (typeof item === 'object') {
        item.displayOrder = i;
      }
    });
    
    setEditingItem({ ...editingItem, items: newItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  const isObjectMode = editingItem && isContentGroupLov(editingItem);

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
            <List className="w-8 h-8 text-corporate-teal" />
            <h1 className="text-3xl font-bold text-corporate-navy">
              List of Values (LOV)
            </h1>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all bg-corporate-teal"
          >
            <Plus className="w-5 h-5" />
            Create New List
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border-2 border-corporate-teal">
          <h2 className="text-xl font-bold mb-4 text-corporate-navy">
            {isAddingNew ? 'Create New List' : `Edit List: ${editingItem.title}`}
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                  List Name (Key) *
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., Industries"
                  disabled={!isAddingNew}
                />
                {!isAddingNew && <p className="text-xs text-gray-500 mt-1">List name cannot be changed once created.</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                  Description
                </label>
                <input
                  type="text"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Where is this list used?"
                />
              </div>
            </div>

            {/* Items Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-corporate-navy">
                  List Items ({editingItem.items?.length || 0})
                </label>
                {isObjectMode && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    Content Group Mode
                  </span>
                )}
              </div>
              
              {editingItem.title === 'System Quotes' && (
                <p className="text-xs text-orange-600 mb-2 bg-orange-50 p-2 rounded border border-orange-200">
                  Format: <strong>Quote Text | Author Name</strong> (use pipe symbol to separate)
                </p>
              )}

              {/* Object Item Editor Modal */}
              {editingObjectItem && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <h4 className="font-bold text-blue-800 mb-3">
                    {editingObjectIndex === editingItem.items.length - 1 && !editingItem.items[editingObjectIndex]?.label 
                      ? 'Add New Item' 
                      : `Edit: ${editingObjectItem.label || '(unnamed)'}`}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700">Label *</label>
                      <input
                        type="text"
                        value={editingObjectItem.label || ''}
                        onChange={(e) => setEditingObjectItem({ ...editingObjectItem, label: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="Display name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700">ID</label>
                      <input
                        type="text"
                        value={editingObjectItem.id || ''}
                        className="w-full p-2 border rounded-lg text-sm bg-gray-100"
                        disabled
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1 text-gray-700">Description</label>
                      <textarea
                        value={editingObjectItem.description || ''}
                        onChange={(e) => setEditingObjectItem({ ...editingObjectItem, description: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                        rows={2}
                        placeholder="Brief description..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700">Thumbnail URL</label>
                      <input
                        type="text"
                        value={editingObjectItem.thumbnail || ''}
                        onChange={(e) => setEditingObjectItem({ ...editingObjectItem, thumbnail: e.target.value })}
                        className="w-full p-2 border rounded-lg text-sm"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-gray-700">Display Order</label>
                      <input
                        type="number"
                        value={editingObjectItem.displayOrder || 0}
                        onChange={(e) => setEditingObjectItem({ ...editingObjectItem, displayOrder: parseInt(e.target.value) || 0 })}
                        className="w-full p-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingObjectItem.isActive !== false}
                          onChange={(e) => setEditingObjectItem({ ...editingObjectItem, isActive: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Active</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingObjectItem.isHiddenUntilUnlocked || false}
                          onChange={(e) => setEditingObjectItem({ ...editingObjectItem, isHiddenUntilUnlocked: e.target.checked })}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm">Locked</span>
                      </label>
                    </div>
                    {editingObjectItem.isHiddenUntilUnlocked && (
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-gray-700">Unlock Day</label>
                        <input
                          type="number"
                          value={editingObjectItem.unlockDay || ''}
                          onChange={(e) => setEditingObjectItem({ ...editingObjectItem, unlockDay: e.target.value ? parseInt(e.target.value) : null })}
                          className="w-full p-2 border rounded-lg text-sm"
                          placeholder="Day number"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveObjectItem}
                      disabled={!editingObjectItem.label?.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" /> Save Item
                    </button>
                    <button
                      onClick={handleCancelObjectEdit}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm"
                    >
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2 max-h-96 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                {editingItem.items.map((item, index) => {
                  const isObjectItem = typeof item === 'object';
                  
                  if (isObjectItem) {
                    // Object item row
                    return (
                      <div 
                        key={item.id || index} 
                        className={`flex items-center gap-2 p-2 bg-white rounded-lg border ${
                          editingObjectIndex === index ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === editingItem.items.length - 1}
                            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-gray-400 text-xs w-6 text-center">{index + 1}</span>
                        {item.thumbnail && (
                          <img src={item.thumbnail} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{item.label || '(unnamed)'}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 truncate">{item.description}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {item.isHiddenUntilUnlocked && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Day {item.unlockDay || '?'}
                            </span>
                          )}
                          {item.isActive === false && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Inactive</span>
                          )}
                          <button
                            onClick={() => handleEditObjectItem(item, index)}
                            className="p-1.5 hover:bg-blue-100 rounded text-blue-600"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeItem(index)}
                            className="p-1.5 hover:bg-red-100 rounded text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    // String item row
                    return (
                      <div key={index} className="flex gap-2">
                        <span className="p-2 text-gray-400 text-xs w-8 text-center">{index + 1}</span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleItemChange(index, e.target.value)}
                          className="flex-1 p-2 border rounded-lg bg-white"
                          placeholder="Value..."
                        />
                        <button
                          onClick={() => removeItem(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  }
                })}
                
                {/* Add Item Button */}
                <button
                  onClick={addItem}
                  className="w-full py-2 text-sm text-teal-600 font-semibold hover:bg-teal-50 rounded-lg border border-dashed border-teal-300 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add {isObjectMode ? 'Group Item' : 'Item'}
                </button>
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white bg-corporate-teal hover:bg-corporate-teal/90"
              >
                <Save className="w-4 h-4" />
                Save List
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddingNew(false);
                  setEditingObjectItem(null);
                  setEditingObjectIndex(null);
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lovs.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl">
            <p className="text-slate-500">No lists defined yet.</p>
          </div>
        ) : (
          lovs.map((lov) => {
            const isContentGroup = isContentGroupLov(lov);
            return (
              <div
                key={lov.id}
                className={`p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-all ${
                  isContentGroup ? 'border-blue-400' : 'border-corporate-teal'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-corporate-navy">
                        {lov.title}
                      </h3>
                      {isContentGroup && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                          Groups
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{lov.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEdit(lov)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-corporate-navy" />
                    </button>
                    <button
                      onClick={() => handleDelete(lov)}
                      className="p-1.5 rounded hover:bg-gray-100"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-corporate-orange" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 h-32 overflow-hidden relative">
                  <ul className="space-y-1">
                    {lov.items?.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isContentGroup ? 'bg-blue-400' : 'bg-teal-400'}`}></div>
                        <span className="truncate">
                          {typeof item === 'string' ? item : item?.label || item?.title || '(unnamed)'}
                        </span>
                        {typeof item === 'object' && item?.isHiddenUntilUnlocked && (
                          <Lock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        )}
                      </li>
                    ))}
                  </ul>
                  {lov.items?.length > 5 && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent flex items-end justify-center pb-2">
                      <span className={`text-xs font-semibold ${isContentGroup ? 'text-blue-600' : 'text-teal-600'}`}>
                        + {lov.items.length - 5} more items
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-xs text-gray-400 text-right">
                  {lov.items?.length || 0} items
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LOVManager;
