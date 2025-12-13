// src/components/admin/CoachingManager.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Save, 
  X, 
  ArrowLeft,
  Target,
  Users,
  BrainCircuit,
  Loader,
  Calendar,
  Database,
  AlertTriangle,
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
import { seedCoachingData, clearCoachingData } from '../../services/coachingService';

const CoachingManager = () => {
  const { db, navigate } = useAppServices();
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  
  // Session data management state
  const [sessionDataExpanded, setSessionDataExpanded] = useState(false);
  const [seedingData, setSeedingData] = useState(false);
  const [clearingData, setClearingData] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getAllContentAdmin(db, CONTENT_COLLECTIONS.COACHING);
      setScenarios(data);
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem({
      title: '',
      description: '',
      persona: '',
      context: '',
      suggestedApproach: '',
      learningObjectives: [], // Array of strings
      difficultyLevel: 50,
      isActive: true,
      order: 999
    });
    setIsAddingNew(true);
  };

  const handleEdit = (item) => {
    setEditingItem({ 
      ...item,
      learningObjectives: item.learningObjectives || []
    });
    setIsAddingNew(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    try {
      const scenarioData = {
        ...editingItem,
        difficultyLevel: parseInt(editingItem.difficultyLevel) || 50
      };

      if (isAddingNew) {
        await addContent(db, CONTENT_COLLECTIONS.COACHING, scenarioData);
      } else {
        const { id, ...updates } = scenarioData;
        try {
          await updateContent(db, CONTENT_COLLECTIONS.COACHING, id, updates);
        } catch (updateError) {
          // Handle case where document doesn't exist (e.g. stale cache or deleted)
          if (updateError.message && updateError.message.includes('No document to update')) {
            const shouldCreate = window.confirm(
              'This scenario could not be found in the database (it may have been deleted externally). \n\nDo you want to save your changes as a NEW scenario?'
            );
            
            if (shouldCreate) {
              await addContent(db, CONTENT_COLLECTIONS.COACHING, updates);
            } else {
              return; // User cancelled, keep form open
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
      console.error('Error saving scenario:', error);
      alert('Error saving scenario. Please try again.');
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"?`)) return;
    
    try {
      await deleteContent(db, CONTENT_COLLECTIONS.COACHING, item.id);
      await loadContent();
    } catch (error) {
      console.error('Error deleting scenario:', error);
      alert(`Error deleting scenario: ${error.message}`);
    }
  };

  const toggleActive = async (item) => {
    try {
      await updateContent(db, CONTENT_COLLECTIONS.COACHING, item.id, { isActive: !item.isActive });
      await loadContent();
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert(`Error updating status: ${error.message}`);
    }
  };

  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...editingItem.learningObjectives];
    newObjectives[index] = value;
    setEditingItem({ ...editingItem, learningObjectives: newObjectives });
  };

  const addObjective = () => {
    setEditingItem({ 
      ...editingItem, 
      learningObjectives: [...editingItem.learningObjectives, ''] 
    });
  };

  const removeObjective = (index) => {
    const newObjectives = editingItem.learningObjectives.filter((_, i) => i !== index);
    setEditingItem({ ...editingItem, learningObjectives: newObjectives });
  };

  // Session Data Management Functions
  const handleSeedSessionData = async () => {
    if (!confirm('This will create sample coaching session types and 4 weeks of upcoming sessions. Continue?')) {
      return;
    }
    
    setSeedingData(true);
    setSessionMessage(null);
    
    try {
      const result = await seedCoachingData(db);
      setSessionMessage({
        type: 'success',
        text: `Successfully seeded ${result.sessionTypes} session types and ${result.sessions} sessions!`
      });
    } catch (error) {
      console.error('Error seeding coaching data:', error);
      setSessionMessage({
        type: 'error',
        text: `Error seeding data: ${error.message}`
      });
    } finally {
      setSeedingData(false);
    }
  };

  const handleClearSessionData = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL coaching session types, sessions, and registrations. This cannot be undone. Continue?')) {
      return;
    }
    
    setClearingData(true);
    setSessionMessage(null);
    
    try {
      const result = await clearCoachingData(db);
      setSessionMessage({
        type: 'success',
        text: `Cleared ${result.sessionTypes} session types, ${result.sessions} sessions, and ${result.registrations} registrations.`
      });
    } catch (error) {
      console.error('Error clearing coaching data:', error);
      setSessionMessage({
        type: 'error',
        text: `Error clearing data: ${error.message}`
      });
    } finally {
      setClearingData(false);
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
            <BrainCircuit className="w-8 h-8 text-corporate-teal" />
            <h1 className="text-3xl font-bold text-corporate-navy">
              Coaching Scenarios
            </h1>
          </div>
          
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white transition-all bg-corporate-teal"
          >
            <Plus className="w-5 h-5" />
            Add Scenario
          </button>
        </div>
      </div>

      {/* Session Data Management */}
      <div className="mb-6 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <button
          onClick={() => setSessionDataExpanded(!sessionDataExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-purple-600" />
            <div className="text-left">
              <h2 className="text-lg font-bold text-corporate-navy">Live Session Data</h2>
              <p className="text-sm text-slate-500">Manage coaching session types and scheduled sessions</p>
            </div>
          </div>
          {sessionDataExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>
        
        {sessionDataExpanded && (
          <div className="p-4 pt-0 border-t border-slate-100">
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-slate-600 mb-2">
                <strong>Seed Data</strong> creates sample session types (Open Gym, Leader Circle, Live Workout, Workshop) 
                and 4 weeks of upcoming sessions.
              </p>
              <p className="text-sm text-slate-600">
                <strong>Clear Data</strong> removes all session types, sessions, and registrations.
              </p>
            </div>
            
            {sessionMessage && (
              <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                sessionMessage.type === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {sessionMessage.type === 'error' && <AlertTriangle className="w-5 h-5" />}
                {sessionMessage.text}
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleSeedSessionData}
                disabled={seedingData || clearingData}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {seedingData ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Database className="w-4 h-4" />
                )}
                {seedingData ? 'Seeding...' : 'Seed Sample Data'}
              </button>
              
              <button
                onClick={handleClearSessionData}
                disabled={seedingData || clearingData}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {clearingData ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {clearingData ? 'Clearing...' : 'Clear All Data'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Form */}
      {editingItem && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow-lg border-2 border-corporate-teal">
          <h2 className="text-xl font-bold mb-4 text-corporate-navy">
            {isAddingNew ? 'Add New Scenario' : 'Edit Scenario'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                Scenario Title *
              </label>
              <input
                type="text"
                value={editingItem.title}
                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g., Dealing with a Defensive Team Member"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                Description (Short) *
              </label>
              <textarea
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows="2"
                placeholder="Brief overview for the card..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                  Persona (Role) *
                </label>
                <input
                  type="text"
                  value={editingItem.persona}
                  onChange={(e) => setEditingItem({ ...editingItem, persona: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., Defensive Alex"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                  Difficulty Level (0-100)
                </label>
                <input
                  type="number"
                  value={editingItem.difficultyLevel}
                  onChange={(e) => setEditingItem({ ...editingItem, difficultyLevel: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                Context (Detailed Background)
              </label>
              <textarea
                value={editingItem.context}
                onChange={(e) => setEditingItem({ ...editingItem, context: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows="3"
                placeholder="Detailed background info for the AI..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                Suggested Approach
              </label>
              <textarea
                value={editingItem.suggestedApproach}
                onChange={(e) => setEditingItem({ ...editingItem, suggestedApproach: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows="3"
                placeholder="Tips for the user on how to handle this..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-corporate-navy">
                Learning Objectives
              </label>
              <div className="space-y-2">
                {editingItem.learningObjectives.map((obj, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      className="flex-1 p-2 border rounded-lg"
                      placeholder="Objective..."
                    />
                    <button
                      onClick={() => removeObjective(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addObjective}
                  className="text-sm text-teal-600 font-semibold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Objective
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingItem.isActive}
                onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <label className="text-sm font-semibold text-corporate-navy">
                Active (visible in library)
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold text-white bg-corporate-teal"
              >
                <Save className="w-4 h-4" />
                Save
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

      {/* Scenarios List */}
      <div className="space-y-4">
        {scenarios.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-500">No scenarios yet. Create your first one.</p>
          </div>
        ) : (
          scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`p-4 bg-white rounded-xl shadow-sm border flex items-center justify-between ${scenario.isActive ? 'border-corporate-teal' : 'border-slate-300 opacity-60'}`}
            >
              <div className="flex-1">
                <h3 className="font-bold text-lg text-corporate-navy">
                  {scenario.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{scenario.description}</p>
                <div className="flex gap-3 text-xs">
                  <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">
                    {scenario.persona}
                  </span>
                  <span className="px-2 py-1 rounded bg-orange-50 text-orange-700 font-medium">
                    Difficulty: {scenario.difficultyLevel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => toggleActive(scenario)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title={scenario.isActive ? 'Deactivate' : 'Activate'}
                >
                  {scenario.isActive ? (
                    <Eye className="w-5 h-5 text-corporate-teal" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-slate-500" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(scenario)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Edit"
                >
                  <Edit className="w-5 h-5 text-corporate-navy" />
                </button>
                <button
                  onClick={() => handleDelete(scenario)}
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
    </div>
  );
};

export default CoachingManager;
