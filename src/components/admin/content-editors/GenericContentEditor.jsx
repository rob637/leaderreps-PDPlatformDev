// src/components/admin/content-editors/GenericContentEditor.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, ArrowLeft } from 'lucide-react';
import { useAppServices } from '../../../services/useAppServices';
import { 
  addUnifiedContent, 
  updateUnifiedContent, 
  CONTENT_STATUS,
  DIFFICULTY_LEVELS,
  CONTENT_TYPES
} from '../../../services/unifiedContentService';

import ProgramDetailsEditor from './details/ProgramDetailsEditor';
import WorkoutDetailsEditor from './details/WorkoutDetailsEditor';
import ExerciseDetailsEditor from './details/ExerciseDetailsEditor';
import RepDetailsEditor from './details/RepDetailsEditor';

const GenericContentEditor = ({ item, type, onSave, onCancel }) => {
  const { db } = useAppServices();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: CONTENT_STATUS.DRAFT,
    difficulty: DIFFICULTY_LEVELS.FOUNDATION,
    details: {},
    ...item
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        details: item.details || {}
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDetailsUpdate = (key, value) => {
    setFormData(prev => ({
      ...prev,
      details: {
        ...prev.details,
        [key]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        type // Ensure type is set
      };

      if (item?.id) {
        await updateUnifiedContent(db, item.id, payload);
      } else {
        await addUnifiedContent(db, payload);
      }
      onSave();
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const renderDetailsEditor = () => {
    switch (type) {
      case CONTENT_TYPES.PROGRAM:
        return <ProgramDetailsEditor details={formData.details} onChange={handleDetailsUpdate} />;
      case CONTENT_TYPES.WORKOUT:
        return <WorkoutDetailsEditor details={formData.details} onChange={handleDetailsUpdate} />;
      case CONTENT_TYPES.EXERCISE:
        return <ExerciseDetailsEditor details={formData.details} onChange={handleDetailsUpdate} />;
      case CONTENT_TYPES.REP:
      case CONTENT_TYPES.READ_REP:
        return <RepDetailsEditor details={formData.details} onChange={handleDetailsUpdate} type={type} />;
      default:
        return (
          <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
            <p className="text-sm text-gray-500 mb-2">
              Raw JSON Details for {type}
            </p>
            <textarea
              value={JSON.stringify(formData.details, null, 2)}
              onChange={(e) => {
                try {
                  const details = JSON.parse(e.target.value);
                  setFormData(prev => ({ ...prev, details }));
                } catch (err) {
                  // ignore parse errors while typing
                }
              }}
              className="w-full font-mono text-xs p-2 border rounded h-32"
              placeholder="Raw JSON details..."
            />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-bold">
            {item?.id ? 'Edit' : 'New'} {type}
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Content'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Core Fields */}
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
            >
              {Object.values(CONTENT_STATUS).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
            >
              {Object.values(DIFFICULTY_LEVELS).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full p-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Type Specific Details */}
        <div className="border-t pt-6">
          {renderDetailsEditor()}
        </div>
      </form>
    </div>
  );
};

export default GenericContentEditor;
