// src/components/admin/DailyRepsLibrary.jsx
// Centralized library for defining Daily Reps with descriptions
// These can then be selected in the Dev Plan Manager for each week

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Dumbbell,
  Loader,
  Check,
  Search,
  Calendar,
  Copy,
  AlertCircle
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  getAllContentAdmin, 
  addContent, 
  updateContent, 
  deleteContent, 
  CONTENT_COLLECTIONS 
} from '../../services/contentService';

const DailyRepsLibrary = () => {
  const { db } = useAppServices();
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadReps();
  }, []);

  const loadReps = async () => {
    try {
      setLoading(true);
      const data = await getAllContentAdmin(db, CONTENT_COLLECTIONS.DAILY_REPS);
      // Sort by title
      setReps(data.sort((a, b) => (a.title || '').localeCompare(b.title || '')));
    } catch (error) {
      console.error('Error loading Daily Reps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem({
      title: '',
      description: '',
      category: 'Challenge', // Default category
      startDay: 'Any', // Which day of week this rep starts (Any = available all week)
      isActive: true,
      usageCount: 0 // Track how many weeks use this rep
    });
    setIsAddingNew(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (item) => {
    setEditingItem({ ...item });
    setIsAddingNew(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!editingItem.title?.trim()) {
      alert('Please enter a title for the Daily Rep');
      return;
    }

    try {
      setSaving(true);
      if (isAddingNew) {
        await addContent(db, CONTENT_COLLECTIONS.DAILY_REPS, {
          ...editingItem,
          createdAt: new Date().toISOString()
        });
      } else {
        const { id, ...updates } = editingItem;
        await updateContent(db, CONTENT_COLLECTIONS.DAILY_REPS, id, {
          ...updates,
          updatedAt: new Date().toISOString()
        });
      }
      setEditingItem(null);
      setIsAddingNew(false);
      await loadReps();
    } catch (error) {
      console.error('Error saving Daily Rep:', error);
      alert('Error saving Daily Rep. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?\n\nThis may affect weeks in the Dev Plan that reference this rep.`)) return;
    
    try {
      await deleteContent(db, CONTENT_COLLECTIONS.DAILY_REPS, item.id);
      await loadReps();
    } catch (error) {
      console.error('Error deleting Daily Rep:', error);
      alert('Error deleting Daily Rep. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const copyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter reps by search query
  const filteredReps = reps.filter(rep => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      rep.title?.toLowerCase().includes(q) ||
      rep.description?.toLowerCase().includes(q) ||
      rep.category?.toLowerCase().includes(q)
    );
  });

  const categories = ['Challenge', 'Practice', 'Reflection', 'Habit', 'Skill', 'Mindset'];
  const days = ['Any', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Dumbbell className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-corporate-navy">Daily Reps Library</h1>
            <p className="text-sm text-slate-500">Define reusable daily reps with descriptions</p>
          </div>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Daily Rep
        </button>
      </div>

      {/* Editor Panel */}
      {editingItem && (
        <div className="bg-white rounded-xl border-2 border-purple-200 shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-corporate-navy">
              {isAddingNew ? 'Create New Daily Rep' : 'Edit Daily Rep'}
            </h2>
            <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingItem.title || ''}
                onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                placeholder="e.g., Practice Active Listening"
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={editingItem.category || 'Challenge'}
                onChange={e => setEditingItem({ ...editingItem, category: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
              <span className="text-slate-400 font-normal ml-2">(shown when user taps the rep)</span>
            </label>
            <textarea
              value={editingItem.description || ''}
              onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
              placeholder="Provide context, instructions, or tips for this daily rep..."
              rows={4}
              className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Start Day */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Available From Day
              </label>
              <select
                value={editingItem.startDay || 'Any'}
                onChange={e => setEditingItem({ ...editingItem, startDay: e.target.value })}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {days.map(day => (
                  <option key={day} value={day}>{day === 'Any' ? 'Any day (all week)' : day}</option>
                ))}
              </select>
            </div>

            {/* Active Toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingItem.isActive !== false}
                  onChange={e => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                  className="w-5 h-5 rounded text-purple-600"
                />
                <span className="text-sm text-slate-700">Active (available for selection)</span>
              </label>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !editingItem.title?.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Daily Rep'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search daily reps..."
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-slate-500">
        <span>{reps.length} total reps</span>
        <span>•</span>
        <span>{reps.filter(r => r.isActive !== false).length} active</span>
        {searchQuery && (
          <>
            <span>•</span>
            <span>{filteredReps.length} matching "{searchQuery}"</span>
          </>
        )}
      </div>

      {/* Reps List */}
      <div className="space-y-3">
        {filteredReps.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl">
            <Dumbbell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {searchQuery ? 'No daily reps match your search' : 'No daily reps defined yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAdd}
                className="mt-3 text-purple-600 hover:text-purple-700 font-medium"
              >
                Create your first daily rep
              </button>
            )}
          </div>
        ) : (
          filteredReps.map(rep => (
            <div
              key={rep.id}
              className={`bg-white rounded-xl border p-4 transition-all hover:shadow-md ${
                rep.isActive === false ? 'opacity-60 border-slate-200' : 'border-purple-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-corporate-navy truncate">{rep.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      rep.category === 'Challenge' ? 'bg-orange-100 text-orange-700' :
                      rep.category === 'Practice' ? 'bg-blue-100 text-blue-700' :
                      rep.category === 'Reflection' ? 'bg-purple-100 text-purple-700' :
                      rep.category === 'Habit' ? 'bg-green-100 text-green-700' :
                      rep.category === 'Skill' ? 'bg-teal-100 text-teal-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {rep.category || 'Uncategorized'}
                    </span>
                    {rep.startDay && rep.startDay !== 'Any' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        From {rep.startDay}
                      </span>
                    )}
                    {rep.isActive === false && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  {rep.description ? (
                    <p className="text-sm text-slate-600 line-clamp-2">{rep.description}</p>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No description</p>
                  )}

                  {/* ID for reference */}
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded font-mono">
                      {rep.id}
                    </code>
                    <button
                      onClick={() => copyId(rep.id)}
                      className="text-slate-400 hover:text-purple-600"
                      title="Copy ID"
                    >
                      {copiedId === rep.id ? (
                        <Check className="w-3 h-3 text-green-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(rep)}
                    className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rep)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-purple-50 rounded-xl border border-purple-100">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-purple-800">
            <p className="font-medium mb-1">How to use Daily Reps</p>
            <p className="text-purple-700">
              Define your daily reps here with descriptions. Then in the Dev Plan Manager, 
              you can select these reps for each week. The description will automatically 
              appear when users tap on the rep in their dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyRepsLibrary;
