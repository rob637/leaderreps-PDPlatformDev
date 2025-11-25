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
  Check
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getAllContentAdmin, 
  addContent, 
  updateContent, 
  deleteContent, 
  CONTENT_COLLECTIONS 
} from '../../services/contentService';

const LOVManager = () => {
  const { db, navigate } = useAppServices();
  const [lovs, setLovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

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

  const handleAdd = () => {
    setEditingItem({
      title: '', // The name of the list (e.g., "Industries")
      description: '',
      items: [], // Array of strings
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

  const handleItemChange = (index, value) => {
    const newItems = [...editingItem.items];
    newItems[index] = value;
    setEditingItem({ ...editingItem, items: newItems });
  };

  const addItem = () => {
    setEditingItem({ 
      ...editingItem, 
      items: [...editingItem.items, ''] 
    });
  };

  const removeItem = (index) => {
    const newItems = editingItem.items.filter((_, i) => i !== index);
    setEditingItem({ ...editingItem, items: newItems });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin" className="text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" className="bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('admin-content-home')}
          className="flex items-center gap-2 text-sm mb-4 hover:opacity-70"
          className="text-slate-500"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <List className="w-8 h-8" className="text-corporate-teal" />
            <h1 className="text-3xl font-bold" className="text-corporate-navy">
              List of Values (LOV)
            </h1>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all"
            className="bg-corporate-teal"
          >
            <Plus className="w-5 h-5" />
            Create New List
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border-2" className="border-corporate-teal">
          <h2 className="text-xl font-bold mb-4" className="text-corporate-navy">
            {isAddingNew ? 'Create New List' : `Edit List: ${editingItem.title}`}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1" className="text-corporate-navy">
                List Name (Key) *
              </label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g., Industries"
                disabled={!isAddingNew} // Lock name after creation to prevent breaking references
              />
              {!isAddingNew && <p className="text-xs text-gray-500 mt-1">List name cannot be changed once created.</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" className="text-corporate-navy">
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

            <div>
              <label className="block text-sm font-semibold mb-1" className="text-corporate-navy">
                List Items
              </label>
              {editingItem.title === 'System Quotes' && (
                <p className="text-xs text-orange-600 mb-2 bg-orange-50 p-2 rounded border border-orange-200">
                  Format: <strong>Quote Text | Author Name</strong> (use pipe symbol to separate)
                </p>
              )}
              <div className="space-y-2 max-h-96 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                {editingItem.items.map((item, index) => (
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
                ))}
                <button
                  onClick={addItem}
                  className="w-full py-2 text-sm text-teal-600 font-semibold hover:bg-teal-50 rounded-lg border border-dashed border-teal-300 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white"
                className="bg-corporate-teal"
              >
                <Save className="w-4 h-4" />
                Save List
              </button>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setIsAddingNew(false);
                }}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold bg-slate-50 text-slate-500"
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
          lovs.map((lov) => (
            <div
              key={lov.id}
              className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition-all"
              className="border-corporate-teal"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg" className="text-corporate-navy">
                    {lov.title}
                  </h3>
                  <p className="text-xs text-gray-500">{lov.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(lov)}
                    className="p-1.5 rounded hover:bg-gray-100"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" className="text-corporate-navy" />
                  </button>
                  <button
                    onClick={() => handleDelete(lov)}
                    className="p-1.5 rounded hover:bg-gray-100"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" className="text-corporate-orange" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 h-32 overflow-hidden relative">
                <ul className="space-y-1">
                  {lov.items?.slice(0, 5).map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                      {item}
                    </li>
                  ))}
                </ul>
                {lov.items?.length > 5 && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-50 to-transparent flex items-end justify-center pb-2">
                    <span className="text-xs font-semibold text-teal-600">
                      + {lov.items.length - 5} more items
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 text-xs text-gray-400 text-right">
                {lov.items?.length || 0} items
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LOVManager;
