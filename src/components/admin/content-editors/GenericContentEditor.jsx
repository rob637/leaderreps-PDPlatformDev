// src/components/admin/content-editors/GenericContentEditor.jsx
import React, { useState, useEffect } from 'react';
import { Save, X, ArrowLeft, Plus, Tag, Layout, Dumbbell, CheckSquare, BookOpen } from 'lucide-react';
import { useAppServices } from '../../../services/useAppServices';
import { 
  addUnifiedContent, 
  updateUnifiedContent, 
  CONTENT_STATUS,
  DIFFICULTY_LEVELS,
  ROLE_LEVELS,
  CONTENT_TYPES
} from '../../../services/unifiedContentService';
import { 
  getContentGroups,
  GROUP_TYPES 
} from '../../../services/contentGroupsService';

import ProgramDetailsEditor from './details/ProgramDetailsEditor';
import WorkoutDetailsEditor from './details/WorkoutDetailsEditor';
import ExerciseDetailsEditor from './details/ExerciseDetailsEditor';
import RepDetailsEditor from './details/RepDetailsEditor';
import SkillDetailsEditor from './details/SkillDetailsEditor';
import VideoDetailsEditor from './details/VideoDetailsEditor';
import DocumentDetailsEditor from './details/DocumentDetailsEditor';
import ToolDetailsEditor from './details/ToolDetailsEditor';
import ContentPicker from './pickers/ContentPicker';

const GenericContentEditor = ({ item, type, onSave, onCancel }) => {
  const { db } = useAppServices();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: CONTENT_STATUS.DRAFT,
    difficulty: DIFFICULTY_LEVELS.FOUNDATION,
    roleLevel: ROLE_LEVELS.ALL,
    estimatedTime: '', // in minutes
    isHiddenUntilUnlocked: false,
    visibility: [], // Array of CONTENT_TYPES to display in
    // NEW: Arrays of group IDs for the simplified model
    programs: [],   // Array of program IDs from LOV
    workouts: [],   // Array of workout IDs from LOV
    skills: [],     // Array of skill IDs from LOV
    details: {},
    ...item
  });
  
  // Content Groups from LOVs
  const [availablePrograms, setAvailablePrograms] = useState([]);
  const [availableWorkouts, setAvailableWorkouts] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        ...item,
        details: item.details || {},
        programs: item.programs || [],
        workouts: item.workouts || [],
        skills: item.skills || [],
        visibility: item.visibility || []
      });
    } else {
      // For new items, default visibility includes the primary type
      setFormData(prev => ({
        ...prev,
        visibility: [type]
      }));
    }

    // Fetch available Programs, Workouts, and Skills from LOVs
    const fetchGroups = async () => {
      try {
        const [programs, workouts, skills] = await Promise.all([
          getContentGroups(db, GROUP_TYPES.PROGRAMS),
          getContentGroups(db, GROUP_TYPES.WORKOUTS),
          getContentGroups(db, GROUP_TYPES.SKILLS)
        ]);
        setAvailablePrograms(programs);
        setAvailableWorkouts(workouts);
        setAvailableSkills(skills);
      } catch (error) {
        console.error("Error fetching content groups:", error);
      }
    };
    fetchGroups();
  }, [item, db, type]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleVisibilityChange = (contentType) => {
    setFormData(prev => {
      const current = prev.visibility || [];
      if (current.includes(contentType)) {
        return { ...prev, visibility: current.filter(t => t !== contentType) };
      } else {
        return { ...prev, visibility: [...current, contentType] };
      }
    });
  };

  // NEW: Handle group selection changes (Programs, Workouts, Skills)
  const handleGroupChange = (groupField, groupId) => {
    setFormData(prev => {
      const current = prev[groupField] || [];
      if (current.includes(groupId)) {
        return { ...prev, [groupField]: current.filter(id => id !== groupId) };
      } else {
        return { ...prev, [groupField]: [...current, groupId] };
      }
    });
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
        // No longer pass pushTargets - groups are stored directly on the content item
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
      case CONTENT_TYPES.VIDEO:
        return <VideoDetailsEditor details={formData.details} onChange={handleDetailsUpdate} />;
      case CONTENT_TYPES.DOCUMENT:
        return <DocumentDetailsEditor details={formData.details} onChange={handleDetailsUpdate} />;
      case CONTENT_TYPES.TOOL:
        return <ToolDetailsEditor details={formData.details} onChange={handleDetailsUpdate} />;
      case CONTENT_TYPES.SKILL:
        return <SkillDetailsEditor details={formData.details} onChange={handleDetailsUpdate} />;
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

          {/* Special Case: Author for Read & Rep (Moved up for better UX) */}
          {type === CONTENT_TYPES.READ_REP && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
              <input
                type="text"
                value={formData.details?.author || ''}
                onChange={(e) => handleDetailsUpdate('author', e.target.value)}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. James Clear"
              />
            </div>
          )}

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Level</label>
            <select
              name="roleLevel"
              value={formData.roleLevel || ROLE_LEVELS.ALL}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
            >
              {Object.values(ROLE_LEVELS).map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time (mins)</label>
            <input
              type="number"
              name="estimatedTime"
              value={formData.estimatedTime || ''}
              onChange={handleChange}
              placeholder="e.g. 15"
              className="w-full p-2 border rounded-lg"
            />
          </div>

          <div className="col-span-2 flex items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <input
              type="checkbox"
              id="isHiddenUntilUnlocked"
              name="isHiddenUntilUnlocked"
              checked={formData.isHiddenUntilUnlocked}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="isHiddenUntilUnlocked" className="text-sm font-medium text-gray-700 cursor-pointer">
              Hide until unlocked (Vault & Key)
              <p className="text-xs text-gray-500 font-normal mt-0.5">
                If checked, this content will only be visible to users who have it assigned in their Development Plan.
                Uncheck to make it available to everyone in the Library.
              </p>
            </label>
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

          {/* --- NEW: Display In (Visibility) --- */}
          <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Layout size={16} /> Display In Libraries
            </h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.visibility || []).includes(CONTENT_TYPES.VIDEO)}
                  onChange={() => handleVisibilityChange(CONTENT_TYPES.VIDEO)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Videos</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.visibility || []).includes(CONTENT_TYPES.TOOL)}
                  onChange={() => handleVisibilityChange(CONTENT_TYPES.TOOL)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Tools</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.visibility || []).includes(CONTENT_TYPES.DOCUMENT)}
                  onChange={() => handleVisibilityChange(CONTENT_TYPES.DOCUMENT)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Documents</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.visibility || []).includes(CONTENT_TYPES.READ_REP)}
                  onChange={() => handleVisibilityChange(CONTENT_TYPES.READ_REP)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Read & Reps</span>
              </label>
            </div>
          </div>

          {/* --- Programs (from LOV) --- */}
          <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Layout size={16} /> Programs
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Select which programs this content belongs to.
            </p>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white p-2">
              {availablePrograms.length === 0 ? (
                <p className="text-xs text-gray-500 p-2">No programs defined. Add programs in LOV Manager.</p>
              ) : (
                availablePrograms.map(prog => (
                  <label key={prog.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.programs || []).includes(prog.id)}
                      onChange={() => handleGroupChange('programs', prog.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 truncate">{prog.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* --- Workouts (from LOV) --- */}
          <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <Dumbbell size={16} /> Workouts
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Select which workouts this content belongs to.
            </p>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md bg-white p-2">
              {availableWorkouts.length === 0 ? (
                <p className="text-xs text-gray-500 p-2">No workouts defined. Add workouts in LOV Manager.</p>
              ) : (
                availableWorkouts.map(workout => (
                  <label key={workout.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.workouts || []).includes(workout.id)}
                      onChange={() => handleGroupChange('workouts', workout.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 truncate">{workout.label}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* --- Skills (from LOV) --- */}
          <div className="col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
              <BookOpen size={16} /> Skills
            </h3>
            <p className="text-xs text-gray-500 mb-2">
              Tag this content with relevant skills.
            </p>
            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md bg-white p-2">
              {availableSkills.length === 0 ? (
                <p className="text-xs text-gray-500 p-2">No skills defined. Add skills in LOV Manager.</p>
              ) : (
                availableSkills.map(skill => (
                  <label key={skill.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.skills || []).includes(skill.id)}
                      onChange={() => handleGroupChange('skills', skill.id)}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 truncate">{skill.label}</span>
                  </label>
                ))
              )}
            </div>
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
