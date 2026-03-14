// src/components/admin/ConditioningConfig.jsx
// Admin UI for managing Conditioning Layer configuration
// Manages: Rep Types, Categories, Situations, Prompts, Milestone Unlocks
// Pattern: Similar to LOVManager - tabbed interface with CRUD operations

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Edit, Trash2, Save, X, Loader, ChevronUp, ChevronDown,
  Target, MessageSquare, Sparkles, Milestone, RefreshCw,
  AlertTriangle, Check, GripVertical, Eye, EyeOff,
  BookOpen, CheckCircle, Link2, ClipboardCheck
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, getDocs, doc, setDoc, updateDoc, deleteDoc, 
  writeBatch, serverTimestamp, query, orderBy 
} from 'firebase/firestore';
import { Button } from '../ui';

// ============================================
// TAB CONFIGURATION
// ============================================
const TABS = [
  { id: 'rep-types', label: 'Rep Types', icon: Target, description: 'The 10 canonical leadership rep types' },
  { id: 'categories', label: 'Categories', icon: MessageSquare, description: 'Rep type groupings (Lead the Work, Team, Yourself)' },
  { id: 'situations', label: 'Situations', icon: Sparkles, description: 'Suggested situations per rep type' },
  { id: 'prompts', label: 'Prompts', icon: MessageSquare, description: 'Behavior focus and active rep reminders' },
  { id: 'prep-prompts', label: 'Prep', icon: BookOpen, description: 'Optional prep prompts (60-120 sec alignment check)' },
  { id: 'debrief', label: 'Debrief', icon: CheckCircle, description: 'System debrief pass criteria and coaching prompts' },
  { id: 'linked-reps', label: 'Linked', icon: Link2, description: 'Which RRs auto-create follow-up RRs' },
  { id: 'complete', label: 'Complete', icon: ClipboardCheck, description: 'Questions for completing the conditioning loop' },
  { id: 'milestones', label: 'Milestones', icon: Milestone, description: 'Which reps unlock at each milestone' }
];

// ============================================
// CATEGORY V2 DEFINITIONS (for reference)
// ============================================
const DEFAULT_CATEGORIES = [
  { id: 'lead_the_work', label: 'Lead the Work', shortLabel: 'Work', icon: 'Target', color: 'blue', sortOrder: 1 },
  { id: 'lead_the_team', label: 'Lead the Team', shortLabel: 'Team', icon: 'Users', color: 'teal', sortOrder: 2 },
  { id: 'lead_yourself', label: 'Lead Yourself', shortLabel: 'Self', icon: 'User', color: 'corporate-teal', sortOrder: 3 }
];

// ============================================
// FIRESTORE COLLECTION NAMES
// ============================================
const COLLECTIONS = {
  REP_TYPES: 'conditioning_rep_types',
  CATEGORIES: 'conditioning_categories',
  SITUATIONS: 'conditioning_situations',
  PROMPTS: 'conditioning_prompts',
  PREP_PROMPTS: 'conditioning_prep_prompts',
  DEBRIEF_STANDARDS: 'conditioning_debrief_standards',
  LINKED_REPS: 'conditioning_linked_reps',
  COMPLETE_CONFIG: 'conditioning_complete_config',
  MILESTONE_CONFIG: 'conditioning_milestone_config'
};

// ============================================
// MAIN COMPONENT
// ============================================
const ConditioningConfig = () => {
  const { db } = useAppServices();
  const [activeTab, setActiveTab] = useState('rep-types');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Data state
  const [repTypes, setRepTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [situations, setSituations] = useState({});
  const [prompts, setPrompts] = useState({});
  const [prepPrompts, setPrepPrompts] = useState({});
  const [debriefStandards, setDebriefStandards] = useState({});
  const [linkedReps, setLinkedReps] = useState({});
  const [completeConfig, setCompleteConfig] = useState({});
  const [milestoneConfig, setMilestoneConfig] = useState({});
  
  // Edit state
  const [editingItem, setEditingItem] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // ============================================
  // DATA LOADING
  // ============================================
  const loadData = useCallback(async () => {
    if (!db) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load rep types
      const repTypesSnap = await getDocs(
        query(collection(db, COLLECTIONS.REP_TYPES), orderBy('sortOrder', 'asc'))
      );
      const repTypesData = repTypesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRepTypes(repTypesData);
      
      // Load categories
      const categoriesSnap = await getDocs(
        query(collection(db, COLLECTIONS.CATEGORIES), orderBy('sortOrder', 'asc'))
      );
      const categoriesData = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategories(categoriesData.length > 0 ? categoriesData : DEFAULT_CATEGORIES);
      
      // Load situations (keyed by repTypeId)
      const situationsSnap = await getDocs(collection(db, COLLECTIONS.SITUATIONS));
      const situationsData = {};
      situationsSnap.docs.forEach(d => {
        situationsData[d.id] = d.data().suggestions || [];
      });
      setSituations(situationsData);
      
      // Load prompts
      const promptsSnap = await getDocs(collection(db, COLLECTIONS.PROMPTS));
      const promptsData = {};
      promptsSnap.docs.forEach(d => {
        promptsData[d.id] = d.data();
      });
      setPrompts(promptsData);
      
      // Load prep prompts (2 prompts per rep type for optional prep)
      const prepPromptsSnap = await getDocs(collection(db, COLLECTIONS.PREP_PROMPTS));
      const prepPromptsData = {};
      prepPromptsSnap.docs.forEach(d => {
        prepPromptsData[d.id] = d.data();
      });
      setPrepPrompts(prepPromptsData);
      
      // Load debrief standards (pass criteria and coaching prompts)
      const debriefSnap = await getDocs(collection(db, COLLECTIONS.DEBRIEF_STANDARDS));
      const debriefData = {};
      debriefSnap.docs.forEach(d => {
        debriefData[d.id] = d.data();
      });
      setDebriefStandards(debriefData);
      
      // Load linked reps config (which RRs auto-create follow-ups)
      const linkedSnap = await getDocs(collection(db, COLLECTIONS.LINKED_REPS));
      const linkedData = {};
      linkedSnap.docs.forEach(d => {
        linkedData[d.id] = d.data();
      });
      setLinkedReps(linkedData);
      
      // Load complete config (questions for loop completion)
      const completeSnap = await getDocs(collection(db, COLLECTIONS.COMPLETE_CONFIG));
      const completeData = {};
      completeSnap.docs.forEach(d => {
        completeData[d.id] = d.data();
      });
      setCompleteConfig(completeData);
      
      // Load milestone config
      const milestoneSnap = await getDocs(collection(db, COLLECTIONS.MILESTONE_CONFIG));
      const milestoneData = {};
      milestoneSnap.docs.forEach(d => {
        milestoneData[d.id] = d.data().repTypes || [];
      });
      setMilestoneConfig(milestoneData);
      
    } catch (err) {
      console.error('Error loading conditioning config:', err);
      setError('Failed to load configuration. Data may be using hardcoded defaults.');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // SUCCESS/ERROR FEEDBACK
  // ============================================
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // ============================================
  // REP TYPES TAB
  // ============================================
  const RepTypesTab = () => {
    const [localRepTypes, setLocalRepTypes] = useState([]);
    const [editing, setEditing] = useState(null);
    const [adding, setAdding] = useState(false);

    useEffect(() => {
      setLocalRepTypes([...repTypes]);
    }, []);

    const handleSaveRepType = async (repType, isNew = false) => {
      try {
        setSaving(true);
        const docRef = doc(db, COLLECTIONS.REP_TYPES, repType.id);
        
        const data = {
          ...repType,
          updatedAt: serverTimestamp()
        };
        
        if (isNew) {
          data.createdAt = serverTimestamp();
        }
        
        await setDoc(docRef, data, { merge: true });
        await loadData();
        setEditing(null);
        setAdding(false);
        showSuccess(`Rep type "${repType.label}" saved successfully`);
      } catch (err) {
        console.error('Error saving rep type:', err);
        setError('Failed to save rep type');
      } finally {
        setSaving(false);
      }
    };

    const handleDeleteRepType = async (repTypeId) => {
      if (!confirm('Are you sure you want to delete this rep type? This cannot be undone.')) return;
      
      try {
        setSaving(true);
        await deleteDoc(doc(db, COLLECTIONS.REP_TYPES, repTypeId));
        await loadData();
        showSuccess('Rep type deleted');
      } catch (err) {
        console.error('Error deleting rep type:', err);
        setError('Failed to delete rep type');
      } finally {
        setSaving(false);
      }
    };

    const handleReorder = async (index, direction) => {
      const newList = [...localRepTypes];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex < 0 || targetIndex >= newList.length) return;
      
      [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
      
      // Update sortOrder values
      newList.forEach((item, i) => {
        item.sortOrder = i + 1;
      });
      
      setLocalRepTypes(newList);
      
      // Save to Firestore
      try {
        setSaving(true);
        const batch = writeBatch(db);
        newList.forEach((item) => {
          const docRef = doc(db, COLLECTIONS.REP_TYPES, item.id);
          batch.update(docRef, { sortOrder: item.sortOrder, updatedAt: serverTimestamp() });
        });
        await batch.commit();
        await loadData();
      } catch (err) {
        console.error('Error reordering:', err);
        setError('Failed to save order');
      } finally {
        setSaving(false);
      }
    };

    const emptyRepType = {
      id: '',
      categoryId: 'lead_the_work',
      label: '',
      shortLabel: '',
      description: '',
      sortOrder: repTypes.length + 1,
      prepOptional: true,
      allowSoloRep: false,
      isActive: true
    };

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            Define the canonical leadership rep types that leaders practice.
          </p>
          <Button
            onClick={() => { setEditing(emptyRepType); setAdding(true); }}
            className="bg-corporate-teal hover:bg-corporate-teal/90 text-white"
            disabled={saving}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Rep Type
          </Button>
        </div>

        {/* Edit/Add Form */}
        {editing && (
          <RepTypeForm
            repType={editing}
            categories={categories}
            isNew={adding}
            onSave={(data) => handleSaveRepType(data, adding)}
            onCancel={() => { setEditing(null); setAdding(false); }}
            saving={saving}
          />
        )}

        {/* Rep Types List */}
        <div className="space-y-2">
          {(localRepTypes.length > 0 ? localRepTypes : repTypes).map((rt, index) => (
            <div 
              key={rt.id}
              className={`p-4 bg-white dark:bg-slate-800 rounded-lg border ${
                rt.isActive === false ? 'border-gray-300 opacity-60' : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <button 
                      onClick={() => handleReorder(index, 'up')}
                      disabled={index === 0 || saving}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleReorder(index, 'down')}
                      disabled={index === repTypes.length - 1 || saving}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-corporate-navy dark:text-white">
                        {rt.label}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">
                        {rt.categoryId}
                      </span>
                      {rt.isActive === false && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                          <EyeOff className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{rt.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditing(rt); setAdding(false); }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRepType(rt.id)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {repTypes.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>No rep types configured yet.</p>
              <p className="text-sm">Click "Add Rep Type" or run the migration script to populate defaults.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // REP TYPE FORM
  // ============================================
  const RepTypeForm = ({ repType, categories, isNew, onSave, onCancel, saving }) => {
    const [form, setForm] = useState({ ...repType });

    const handleSubmit = (e) => {
      e.preventDefault();
      
      if (!form.id || !form.label) {
        setError('ID and Label are required');
        return;
      }
      
      onSave(form);
    };

    return (
      <form onSubmit={handleSubmit} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4">
        <h3 className="font-semibold text-corporate-navy dark:text-white">
          {isNew ? 'Add New Rep Type' : 'Edit Rep Type'}
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">ID (unique, snake_case)</label>
            <input
              type="text"
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
              disabled={!isNew}
              className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 disabled:opacity-50"
              placeholder="e.g., deliver_feedback"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
              placeholder="e.g., Deliver Reinforcing Feedback"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Short Label</label>
            <input
              type="text"
              value={form.shortLabel}
              onChange={(e) => setForm({ ...form, shortLabel: e.target.value })}
              className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
              placeholder="e.g., Reinforcing Feedback"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
            placeholder="What this rep type is about..."
          />
        </div>
        
        {/* Prerequisites - linked reps that must be completed first */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Prerequisites <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">
            Select reps that must be completed before this one becomes available. User must complete ANY one of these.
          </p>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded border dark:border-slate-600 max-h-48 overflow-y-auto">
            {repTypes
              .filter(rt => rt.id !== form.id) // Can't require itself
              .map(rt => {
                const isSelected = (form.prerequisiteRepIds || []).includes(rt.id);
                return (
                  <button
                    key={rt.id}
                    type="button"
                    onClick={() => {
                      const current = form.prerequisiteRepIds || [];
                      const updated = isSelected
                        ? current.filter(id => id !== rt.id)
                        : [...current, rt.id];
                      setForm({ ...form, prerequisiteRepIds: updated });
                    }}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      isSelected
                        ? 'bg-corporate-teal text-white border-corporate-teal'
                        : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 hover:border-corporate-teal'
                    }`}
                  >
                    {rt.shortLabel || rt.label}
                    {isSelected && <span className="ml-1">✓</span>}
                  </button>
                );
              })}
          </div>
          {(form.prerequisiteRepIds || []).length > 0 && (
            <p className="text-xs text-corporate-teal mt-1">
              User must complete any one of: {(form.prerequisiteRepIds || []).map(id => {
                const rt = repTypes.find(r => r.id === id);
                return rt?.shortLabel || rt?.label || id;
              }).join(' OR ')}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.prepOptional ?? true}
              onChange={(e) => setForm({ ...form, prepOptional: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Prep is optional</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.allowSoloRep ?? false}
              onChange={(e) => setForm({ ...form, allowSoloRep: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Allow solo rep (no "who")</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive ?? true}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Active</span>
          </label>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" className="bg-corporate-teal text-white" disabled={saving}>
            {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isNew ? 'Create' : 'Save'}
          </Button>
        </div>
      </form>
    );
  };

  // ============================================
  // CATEGORIES TAB
  // ============================================
  const CategoriesTab = () => {
    const [localCategories, setLocalCategories] = useState([]);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
      setLocalCategories([...categories]);
    }, []);

    const handleSaveCategory = async (category) => {
      try {
        setSaving(true);
        const docRef = doc(db, COLLECTIONS.CATEGORIES, category.id);
        await setDoc(docRef, {
          ...category,
          updatedAt: serverTimestamp()
        }, { merge: true });
        await loadData();
        setEditing(null);
        showSuccess(`Category "${category.label}" saved`);
      } catch (err) {
        console.error('Error saving category:', err);
        setError('Failed to save category');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Categories group rep types into high-level leadership domains.
        </p>

        {editing && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 space-y-4">
            <h3 className="font-semibold">Edit Category</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Label</label>
                <input
                  type="text"
                  value={editing.label}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short Label</label>
                <input
                  type="text"
                  value={editing.shortLabel}
                  onChange={(e) => setEditing({ ...editing, shortLabel: e.target.value })}
                  className="w-full p-2 border rounded dark:bg-slate-800"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon (Lucide name)</label>
              <input
                type="text"
                value={editing.icon}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                className="w-full p-2 border rounded dark:bg-slate-800"
                placeholder="e.g., Target, Users, User"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={() => handleSaveCategory(editing)} className="bg-corporate-teal text-white">
                Save
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(localCategories.length > 0 ? localCategories : categories).map((cat) => (
            <div key={cat.id} className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <span className="font-medium">{cat.label}</span>
                <span className="text-sm text-gray-500 ml-2">({cat.shortLabel})</span>
                <span className="text-xs text-gray-400 ml-2">Icon: {cat.icon}</span>
              </div>
              <button onClick={() => setEditing(cat)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded">
                <Edit className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================================
  // SITUATIONS TAB
  // ============================================
  const SituationsTab = () => {
    const [selectedRepType, setSelectedRepType] = useState(repTypes[0]?.id || '');
    const [localSituations, setLocalSituations] = useState([]);
    const [newSituation, setNewSituation] = useState('');

    useEffect(() => {
      if (selectedRepType) {
        setLocalSituations(situations[selectedRepType] || []);
      }
    }, [selectedRepType, situations]);

    const handleSaveSituations = async () => {
      try {
        setSaving(true);
        const docRef = doc(db, COLLECTIONS.SITUATIONS, selectedRepType);
        await setDoc(docRef, {
          repTypeId: selectedRepType,
          suggestions: localSituations,
          updatedAt: serverTimestamp()
        });
        await loadData();
        showSuccess('Situations saved');
      } catch (err) {
        console.error('Error saving situations:', err);
        setError('Failed to save situations');
      } finally {
        setSaving(false);
      }
    };

    const addSituation = () => {
      if (newSituation.trim()) {
        setLocalSituations([...localSituations, newSituation.trim()]);
        setNewSituation('');
      }
    };

    const removeSituation = (index) => {
      setLocalSituations(localSituations.filter((_, i) => i !== index));
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Define suggested situations that appear when leaders commit to each rep type.
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">Select Rep Type</label>
          <select
            value={selectedRepType}
            onChange={(e) => setSelectedRepType(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          >
            {repTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.label}</option>
            ))}
          </select>
        </div>

        {selectedRepType && (
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4">
            <h3 className="font-medium">Situations for: {repTypes.find(r => r.id === selectedRepType)?.label}</h3>
            
            <div className="space-y-2">
              {localSituations.map((sit, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-slate-700 rounded">
                  <span className="flex-1">{sit}</span>
                  <button
                    onClick={() => removeSituation(index)}
                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newSituation}
                onChange={(e) => setNewSituation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSituation())}
                placeholder="Add a suggested situation..."
                className="flex-1 p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
              />
              <Button onClick={addSituation} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveSituations} className="bg-corporate-teal text-white" disabled={saving}>
                {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Situations
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // PROMPTS TAB
  // ============================================
  const PromptsTab = () => {
    const [selectedRepType, setSelectedRepType] = useState(repTypes[0]?.id || '');
    const [behaviorFocus, setBehaviorFocus] = useState('');
    const [activeReminder, setActiveReminder] = useState('');

    useEffect(() => {
      if (selectedRepType && prompts[selectedRepType]) {
        setBehaviorFocus(prompts[selectedRepType].behaviorFocus || '');
        setActiveReminder(prompts[selectedRepType].activeReminder || '');
      } else {
        setBehaviorFocus('');
        setActiveReminder('');
      }
    }, [selectedRepType, prompts]);

    const handleSavePrompts = async () => {
      try {
        setSaving(true);
        const docRef = doc(db, COLLECTIONS.PROMPTS, selectedRepType);
        await setDoc(docRef, {
          repTypeId: selectedRepType,
          behaviorFocus,
          activeReminder,
          updatedAt: serverTimestamp()
        });
        await loadData();
        showSuccess('Prompts saved');
      } catch (err) {
        console.error('Error saving prompts:', err);
        setError('Failed to save prompts');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Configure behavior focus reminders (shown at commit time) and active rep reminders (shown on rep cards).
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">Select Rep Type</label>
          <select
            value={selectedRepType}
            onChange={(e) => setSelectedRepType(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          >
            {repTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.label}</option>
            ))}
          </select>
        </div>

        {selectedRepType && (
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Behavior Focus Reminder</label>
              <p className="text-xs text-gray-500 mb-2">Shown at commit time to remind leaders what to focus on</p>
              <textarea
                value={behaviorFocus}
                onChange={(e) => setBehaviorFocus(e.target.value)}
                rows={3}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                placeholder="e.g., Notice the specific behavior and name why it matters so it gets repeated."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Active Rep Reminder</label>
              <p className="text-xs text-gray-500 mb-2">Shown on committed rep cards as a reminder</p>
              <textarea
                value={activeReminder}
                onChange={(e) => setActiveReminder(e.target.value)}
                rows={3}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                placeholder="e.g., Remember: Be specific about the behavior and its impact."
              />
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSavePrompts} className="bg-corporate-teal text-white" disabled={saving}>
                {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Prompts
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // PREP PROMPTS TAB
  // ============================================
  const PrepPromptsTab = () => {
    const [selectedRepType, setSelectedRepType] = useState(repTypes[0]?.id || '');
    const [prompt1, setPrompt1] = useState('');
    const [prompt1MaxChars, setPrompt1MaxChars] = useState(100);
    const [prompt2, setPrompt2] = useState('');
    const [prompt2MaxChars, setPrompt2MaxChars] = useState(100);

    useEffect(() => {
      if (selectedRepType && prepPrompts[selectedRepType]) {
        const data = prepPrompts[selectedRepType];
        setPrompt1(data.prompts?.[0]?.prompt || '');
        setPrompt1MaxChars(data.prompts?.[0]?.maxChars || 100);
        setPrompt2(data.prompts?.[1]?.prompt || '');
        setPrompt2MaxChars(data.prompts?.[1]?.maxChars || 100);
      } else {
        setPrompt1('');
        setPrompt1MaxChars(100);
        setPrompt2('');
        setPrompt2MaxChars(100);
      }
    }, [selectedRepType, prepPrompts]);

    const handleSavePrepPrompts = async () => {
      try {
        setSaving(true);
        const docRef = doc(db, COLLECTIONS.PREP_PROMPTS, selectedRepType);
        await setDoc(docRef, {
          repTypeId: selectedRepType,
          prompts: [
            { prompt: prompt1, maxChars: prompt1MaxChars },
            { prompt: prompt2, maxChars: prompt2MaxChars }
          ],
          updatedAt: serverTimestamp()
        });
        await loadData();
        showSuccess('Prep prompts saved');
      } catch (err) {
        console.error('Error saving prep prompts:', err);
        setError('Failed to save prep prompts');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Configure the 2 prompts shown during optional prep (60-120 second alignment check). 
          Hard character limits prevent over-thinking.
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">Select Rep Type</label>
          <select
            value={selectedRepType}
            onChange={(e) => setSelectedRepType(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          >
            {repTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.label}</option>
            ))}
          </select>
        </div>

        {selectedRepType && (
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prompt 1</label>
              <p className="text-xs text-gray-500 mb-2">First alignment question (e.g., "What behavior are you reinforcing?")</p>
              <input
                type="text"
                value={prompt1}
                onChange={(e) => setPrompt1(e.target.value)}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 mb-2"
                placeholder="Enter prompt question..."
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Max chars:</label>
                <input
                  type="number"
                  value={prompt1MaxChars}
                  onChange={(e) => setPrompt1MaxChars(parseInt(e.target.value) || 100)}
                  className="w-20 p-1 border rounded text-sm dark:bg-slate-800 dark:border-slate-600"
                  min="50"
                  max="200"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Prompt 2</label>
              <p className="text-xs text-gray-500 mb-2">Second alignment question (e.g., "Why does it matter?")</p>
              <input
                type="text"
                value={prompt2}
                onChange={(e) => setPrompt2(e.target.value)}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600 mb-2"
                placeholder="Enter prompt question..."
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500">Max chars:</label>
                <input
                  type="number"
                  value={prompt2MaxChars}
                  onChange={(e) => setPrompt2MaxChars(parseInt(e.target.value) || 100)}
                  className="w-20 p-1 border rounded text-sm dark:bg-slate-800 dark:border-slate-600"
                  min="50"
                  max="200"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSavePrepPrompts} className="bg-corporate-teal text-white" disabled={saving}>
                {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Prep Prompts
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // DEBRIEF STANDARDS TAB
  // ============================================
  const DebriefTab = () => {
    const [selectedRepType, setSelectedRepType] = useState(repTypes[0]?.id || '');
    const [passCriteria, setPassCriteria] = useState('');
    const [coachingPrompt, setCoachingPrompt] = useState('');
    const [cameraTestPrompt, setCameraTestPrompt] = useState('');

    useEffect(() => {
      if (selectedRepType && debriefStandards[selectedRepType]) {
        const data = debriefStandards[selectedRepType];
        setPassCriteria(data.passCriteria || '');
        setCoachingPrompt(data.coachingPrompt || '');
        setCameraTestPrompt(data.cameraTestPrompt || '');
      } else {
        setPassCriteria('');
        setCoachingPrompt('');
        setCameraTestPrompt('');
      }
    }, [selectedRepType, debriefStandards]);

    const handleSaveDebrief = async () => {
      try {
        setSaving(true);
        const docRef = doc(db, COLLECTIONS.DEBRIEF_STANDARDS, selectedRepType);
        await setDoc(docRef, {
          repTypeId: selectedRepType,
          passCriteria,
          coachingPrompt,
          cameraTestPrompt,
          updatedAt: serverTimestamp()
        });
        await loadData();
        showSuccess('Debrief standards saved');
      } catch (err) {
        console.error('Error saving debrief standards:', err);
        setError('Failed to save debrief standards');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Configure system debrief standards. The system scores evidence against these criteria and surfaces
          coaching questions (not corrections) to help leaders self-assess.
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">Select Rep Type</label>
          <select
            value={selectedRepType}
            onChange={(e) => setSelectedRepType(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          >
            {repTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.label}</option>
            ))}
          </select>
        </div>

        {selectedRepType && (
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pass Criteria</label>
              <p className="text-xs text-gray-500 mb-2">What must be true for evidence to "pass"? (System uses this for scoring)</p>
              <textarea
                value={passCriteria}
                onChange={(e) => setPassCriteria(e.target.value)}
                rows={3}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                placeholder="e.g., Specific behavior named, impact stated, commitment requested"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Coaching Prompt (If Criteria Not Met)</label>
              <p className="text-xs text-gray-500 mb-2">A question to prompt reflection — NOT a correction</p>
              <textarea
                value={coachingPrompt}
                onChange={(e) => setCoachingPrompt(e.target.value)}
                rows={2}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                placeholder="e.g., Does your evidence name the specific behavior observed?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Camera Test Prompt</label>
              <p className="text-xs text-gray-500 mb-2">Prompt to check if evidence is observable</p>
              <textarea
                value={cameraTestPrompt}
                onChange={(e) => setCameraTestPrompt(e.target.value)}
                rows={2}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                placeholder="e.g., Does your evidence pass the Camera Test?"
              />
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveDebrief} className="bg-corporate-teal text-white" disabled={saving}>
                {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Debrief Standards
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // LINKED REPS TAB
  // ============================================
  const LinkedRepsTab = () => {
    const [selectedRepType, setSelectedRepType] = useState(repTypes[0]?.id || '');
    const [createsFollowUp, setCreatesFollowUp] = useState('');
    const [requiresPrerequisite, setRequiresPrerequisite] = useState('');

    useEffect(() => {
      if (selectedRepType && linkedReps[selectedRepType]) {
        const data = linkedReps[selectedRepType];
        setCreatesFollowUp(data.createsFollowUp || '');
        setRequiresPrerequisite(data.requiresPrerequisite || '');
      } else {
        setCreatesFollowUp('');
        setRequiresPrerequisite('');
      }
    }, [selectedRepType, linkedReps]);

    const handleSaveLinkedReps = async () => {
      try {
        setSaving(true);
        const docRef = doc(db, COLLECTIONS.LINKED_REPS, selectedRepType);
        await setDoc(docRef, {
          repTypeId: selectedRepType,
          createsFollowUp: createsFollowUp || null,
          requiresPrerequisite: requiresPrerequisite || null,
          updatedAt: serverTimestamp()
        });
        await loadData();
        showSuccess('Linked reps config saved');
      } catch (err) {
        console.error('Error saving linked reps:', err);
        setError('Failed to save linked reps config');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Configure which rep types automatically create follow-up reps or require prerequisite reps.
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">Select Rep Type</label>
          <select
            value={selectedRepType}
            onChange={(e) => setSelectedRepType(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          >
            {repTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.label}</option>
            ))}
          </select>
        </div>

        {selectedRepType && (
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Creates Follow-Up RR</label>
              <p className="text-xs text-gray-500 mb-2">When this RR is completed, auto-create this follow-up RR (e.g., "Redirecting Feedback" → "Close the Loop")</p>
              <select
                value={createsFollowUp}
                onChange={(e) => setCreatesFollowUp(e.target.value)}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
              >
                <option value="">None</option>
                {repTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Requires Prerequisite RR</label>
              <p className="text-xs text-gray-500 mb-2">This RR can only be committed if user has completed one of these first (e.g., "Make a Clean Handoff" requires "Set Clear Expectations")</p>
              <select
                value={requiresPrerequisite}
                onChange={(e) => setRequiresPrerequisite(e.target.value)}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
              >
                <option value="">None (always available)</option>
                {repTypes.map(rt => (
                  <option key={rt.id} value={rt.id}>{rt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveLinkedReps} className="bg-corporate-teal text-white" disabled={saving}>
                {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Linked Reps
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // COMPLETE CONFIG TAB
  // ============================================
  const CompleteTab = () => {
    const [selectedRepType, setSelectedRepType] = useState(repTypes[0]?.id || '');
    const [completionQuestion, setCompletionQuestion] = useState('');
    const [lockInPrompt, setLockInPrompt] = useState('');

    useEffect(() => {
      if (selectedRepType && completeConfig[selectedRepType]) {
        const data = completeConfig[selectedRepType];
        setCompletionQuestion(data.completionQuestion || '');
        setLockInPrompt(data.lockInPrompt || '');
      } else {
        setCompletionQuestion('');
        setLockInPrompt('');
      }
    }, [selectedRepType, completeConfig]);

    const handleSaveComplete = async () => {
      try {
        setSaving(true);
        const docRef = doc(db, COLLECTIONS.COMPLETE_CONFIG, selectedRepType);
        await setDoc(docRef, {
          repTypeId: selectedRepType,
          completionQuestion,
          lockInPrompt,
          updatedAt: serverTimestamp()
        });
        await loadData();
        showSuccess('Complete config saved');
      } catch (err) {
        console.error('Error saving complete config:', err);
        setError('Failed to save complete config');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Configure questions for the "Complete" step that lock in future behavior and link to new RRs.
        </p>

        <div>
          <label className="block text-sm font-medium mb-2">Select Rep Type</label>
          <select
            value={selectedRepType}
            onChange={(e) => setSelectedRepType(e.target.value)}
            className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
          >
            {repTypes.map(rt => (
              <option key={rt.id} value={rt.id}>{rt.label}</option>
            ))}
          </select>
        </div>

        {selectedRepType && (
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Completion Question</label>
              <p className="text-xs text-gray-500 mb-2">Question to lock in learning (e.g., "What will you do differently next time?")</p>
              <textarea
                value={completionQuestion}
                onChange={(e) => setCompletionQuestion(e.target.value)}
                rows={2}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                placeholder="e.g., What's one thing you'll carry forward from this rep?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Lock-In Prompt</label>
              <p className="text-xs text-gray-500 mb-2">Prompt that reinforces the behavior change</p>
              <textarea
                value={lockInPrompt}
                onChange={(e) => setLockInPrompt(e.target.value)}
                rows={2}
                className="w-full p-2 border rounded dark:bg-slate-800 dark:border-slate-600"
                placeholder="e.g., How will you notice the next opportunity to run this rep?"
              />
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleSaveComplete} className="bg-corporate-teal text-white" disabled={saving}>
                {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Complete Config
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // MILESTONES TAB
  // ============================================
  const MilestonesTab = () => {
    const [selectedMilestone, setSelectedMilestone] = useState('1');
    const [unlockRepTypes, setUnlockRepTypes] = useState([]);

    const milestones = ['1', '2', '3', '4', '5'];

    useEffect(() => {
      setUnlockRepTypes(milestoneConfig[`milestone_${selectedMilestone}`] || []);
    }, [selectedMilestone, milestoneConfig]);

    const handleToggleRepType = (repTypeId) => {
      if (unlockRepTypes.includes(repTypeId)) {
        setUnlockRepTypes(unlockRepTypes.filter(id => id !== repTypeId));
      } else {
        setUnlockRepTypes([...unlockRepTypes, repTypeId]);
      }
    };

    const handleSaveMilestone = async () => {
      try {
        setSaving(true);
        const docRef = doc(db, COLLECTIONS.MILESTONE_CONFIG, `milestone_${selectedMilestone}`);
        await setDoc(docRef, {
          milestone: parseInt(selectedMilestone),
          repTypes: unlockRepTypes,
          updatedAt: serverTimestamp()
        });
        await loadData();
        showSuccess(`Milestone ${selectedMilestone} configuration saved`);
      } catch (err) {
        console.error('Error saving milestone config:', err);
        setError('Failed to save milestone configuration');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Configure which rep types unlock at each Foundation milestone. Leaders can see all types but can only commit to unlocked ones.
        </p>

        <div className="flex gap-2">
          {milestones.map(m => (
            <button
              key={m}
              onClick={() => setSelectedMilestone(m)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedMilestone === m
                  ? 'bg-corporate-teal text-white'
                  : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Milestone {m}
            </button>
          ))}
        </div>

        <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 space-y-4">
          <h3 className="font-medium">Rep Types Unlocked at Milestone {selectedMilestone}</h3>
          
          <div className="grid grid-cols-2 gap-2">
            {repTypes.map(rt => (
              <label
                key={rt.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  unlockRepTypes.includes(rt.id)
                    ? 'bg-corporate-teal/10 border-corporate-teal'
                    : 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={unlockRepTypes.includes(rt.id)}
                  onChange={() => handleToggleRepType(rt.id)}
                  className="rounded text-corporate-teal"
                />
                <div>
                  <div className="font-medium text-sm">{rt.label}</div>
                  <div className="text-xs text-gray-500">{rt.categoryId}</div>
                </div>
              </label>
            ))}
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleSaveMilestone} className="bg-corporate-teal text-white" disabled={saving}>
              {saving ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Milestone {selectedMilestone}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER TAB CONTENT
  // ============================================
  const renderTabContent = () => {
    switch (activeTab) {
      case 'rep-types':
        return <RepTypesTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'situations':
        return <SituationsTab />;
      case 'prompts':
        return <PromptsTab />;
      case 'prep-prompts':
        return <PrepPromptsTab />;
      case 'debrief':
        return <DebriefTab />;
      case 'linked-reps':
        return <LinkedRepsTab />;
      case 'complete':
        return <CompleteTab />;
      case 'milestones':
        return <MilestonesTab />;
      default:
        return <RepTypesTab />;
    }
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
            Conditioning Configuration
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Manage rep types, categories, situations, and milestone unlocks
          </p>
        </div>
        
        <Button
          onClick={loadData}
          variant="outline"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-center gap-2">
          <Check className="w-4 h-4" />
          {successMessage}
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-corporate-teal text-white'
                : 'bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Description */}
      <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-slate-400">
          {TABS.find(t => t.id === activeTab)?.description}
        </p>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
        </div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

export default ConditioningConfig;
