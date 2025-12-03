import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layout, 
  Calendar, 
  List, 
  Plus, 
  Save, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Eye,
  Zap,
  Users,
  BookOpen,
  Wrench,
  Bell,
  Target,
  GraduationCap,
  Clock,
  FileText
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { SEED_DATA } from '../../data/seedLovs';
import { SEED_WEEKS } from '../../data/seedWeeks';
import { addContent, CONTENT_COLLECTIONS } from '../../services/contentService';

const DevPlanManager = () => {
  const { db } = useAppServices();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [newWeekData, setNewWeekData] = useState(null);
  const [lovs, setLovs] = useState({});
  const [lovIds, setLovIds] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'edit'

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load LOVs
      const lovSnapshot = await getDocs(collection(db, CONTENT_COLLECTIONS.LOV));
      const lovData = {};
      const ids = {};
      lovSnapshot.docs.forEach(doc => {
        const data = doc.data();
        lovData[data.title] = data.items;
        ids[data.title] = doc.id;
      });
      setLovs(lovData);
      setLovIds(ids);

      // 2. Load Weeks
      const weeksRef = collection(db, 'development_plan_v1');
      const q = query(weeksRef, orderBy('weekNumber', 'asc'));
      const weeksSnapshot = await getDocs(q);
      const weeksData = weeksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setWeeks(weeksData);

    } catch (error) {
      console.error("Error loading Dev Plan data:", error);
    } finally {
      setLoading(false);
    }
  }, [db]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSeedLovs = async () => {
    if (!confirm('This will sync LOVs from the seed file to the database. Existing LOVs will be updated. Continue?')) return;
    try {
      for (const lov of SEED_DATA) {
        // Check if exists
        if (lovIds[lov.title]) {
          // Update existing
          await updateDoc(doc(db, CONTENT_COLLECTIONS.LOV, lovIds[lov.title]), {
            items: lov.items,
            description: lov.description,
            updatedAt: serverTimestamp()
          });
          console.log(`Updated LOV: ${lov.title}`);
        } else {
          // Add new
          await addContent(db, CONTENT_COLLECTIONS.LOV, lov);
          console.log(`Seeded LOV: ${lov.title}`);
        }
      }
      await loadData(); // Reload
      alert('LOVs synced successfully!');
    } catch (error) {
      console.error("Error seeding LOVs:", error);
      alert('Error seeding LOVs.');
    }
  };

  const handleSeedWeeks = async () => {
    if (!confirm('This will overwrite the first 8 weeks of the plan. Continue?')) return;
    try {
      for (const week of SEED_WEEKS) {
        const docId = `week-${String(week.weekNumber).padStart(2, '0')}`;
        await setDoc(doc(db, 'development_plan_v1', docId), {
          ...week,
          weekBlockId: docId,
          updatedAt: serverTimestamp()
        });
        console.log(`Seeded Week: ${week.weekNumber}`);
      }
      await loadData();
      alert('Weeks 1-8 seeded successfully!');
    } catch (error) {
      console.error("Error seeding weeks:", error);
      alert('Error seeding weeks.');
    }
  };

  const handleCreateWeek = () => {
    const nextWeekNum = weeks.length + 1;
    const newWeek = {
      // Core Identity
      weekBlockId: `week-${String(nextWeekNum).padStart(2, '0')}`,
      weekNumber: nextWeekNum,
      title: `Week ${nextWeekNum}`,
      focus: '',
      phase: '',
      description: '',
      
      // Scheduling
      startOffsetWeeks: nextWeekNum - 1,
      estimatedTimeMinutes: 90,
      
      // Workouts & Tools
      workouts: [],         // Primary workouts for the week
      optionalWorkouts: [], // Optional/bonus workouts (e.g., for managers with teams)
      tools: [],            // Frameworks, checklists, tools taught this week
      
      // Daily Reps (static text tasks users should do daily)
      dailyReps: [],
      
      // Resources (Content, Community, Coaching)
      content: [],    // Content unlocks (videos, workbooks, PDFs)
      community: [],  // Community activities (live meetings, forums, Ask the Trainer)
      coaching: [],   // Coaching elements (AI coach, live coaching, 1:1s)
      
      // Legacy reps field (special week-specific reps)
      reps: [],
      
      // Classification & Metadata
      skills: [],
      pillars: [],
      difficultyLevel: 'Foundation',
      level: 100,           // Course level (100, 200, 300)
      prerequisites: [],    // Prerequisite week IDs
      prerequisiteSkills: [], // Required skills before this week
      
      // Reminders & Notifications
      reminderTemplates: [],
      
      // Status
      isDraft: true
    };
    setNewWeekData(newWeek);
    setSelectedWeekId('new');
    setViewMode('edit');
  };

  const handleEditWeek = (week) => {
    setSelectedWeekId(week.id);
    setViewMode('edit');
  };

  const handleDeleteWeek = async (weekId) => {
    if (!confirm('Are you sure you want to delete this week? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'development_plan_v1', weekId));
      await loadData();
    } catch (error) {
      console.error("Error deleting week:", error);
      alert("Failed to delete week.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-corporate-navy flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Development Plan Manager
          </h2>
          <p className="text-slate-500 text-sm">
            Manage the 26-week journey. {weeks.length} weeks defined.
          </p>
        </div>
        <div className="flex gap-2">
          {Object.keys(lovs).length > 0 && (
            <button 
              onClick={handleSeedLovs}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-200"
            >
              Sync System LOVs
            </button>
          )}
          {Object.keys(lovs).length === 0 && (
            <button 
              onClick={handleSeedLovs}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-bold hover:bg-orange-200"
            >
              Seed System LOVs
            </button>
          )}
          <button 
            onClick={handleSeedWeeks}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200"
          >
            Seed Weeks 1-8
          </button>
          {viewMode === 'list' && (
            <button 
              onClick={handleCreateWeek}
              className="px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-bold hover:bg-teal-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Week
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {viewMode === 'list' ? (
          <WeekListView 
            weeks={weeks} 
            onEdit={handleEditWeek} 
            onDelete={handleDeleteWeek}
          />
        ) : (
          <WeekEditor 
            weekId={selectedWeekId} 
            initialData={selectedWeekId === 'new' ? newWeekData : weeks.find(w => w.id === selectedWeekId)}
            lovs={lovs}
            onSave={async (data) => {
              try {
                const docId = data.weekBlockId || `week-${String(data.weekNumber).padStart(2, '0')}`;
                await setDoc(doc(db, 'development_plan_v1', docId), {
                  ...data,
                  updatedAt: serverTimestamp()
                });
                await loadData();
                setViewMode('list');
              } catch (e) {
                console.error("Save error:", e);
                alert("Failed to save week.");
              }
            }}
            onCancel={() => setViewMode('list')}
            allWeeks={weeks}
          />
        )}
      </div>
    </div>
  );
};

// Sub-component: List View
const WeekListView = ({ weeks, onEdit, onDelete }) => {
  if (weeks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <Calendar className="w-12 h-12 mb-2 opacity-50" />
        <p>No weeks defined yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider border-b">Week</th>
            <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider border-b">Title & Focus</th>
            <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider border-b">Phase</th>
            <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider border-b">Workouts</th>
            <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider border-b">Resources</th>
            <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider border-b">Reps</th>
            <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider border-b">Status</th>
            <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider border-b text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {weeks.map((week) => (
            <tr key={week.id} className="hover:bg-slate-50 transition-colors group">
              <td className="p-3 font-mono text-slate-500 font-bold">
                <div className="text-corporate-navy">#{week.weekNumber}</div>
                <div className="text-[10px] text-slate-400">ID: {week.weekBlockId || week.id}</div>
              </td>
              <td className="p-3">
                <div className="font-bold text-corporate-navy">{week.title}</div>
                <div className="text-xs text-slate-500 italic">{week.focus}</div>
              </td>
              <td className="p-3">
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                  {week.phase}
                </span>
                {week.level && (
                  <div className="text-[10px] text-slate-400 mt-1">Level {week.level}</div>
                )}
              </td>
              <td className="p-3 text-xs">
                <div className="flex flex-col gap-1">
                  {week.workouts?.length > 0 && (
                    <span className="text-purple-600">{week.workouts.length} workout(s)</span>
                  )}
                  {week.tools?.length > 0 && (
                    <span className="text-orange-600">{week.tools.length} tool(s)</span>
                  )}
                </div>
              </td>
              <td className="p-3 text-xs text-slate-500">
                <div className="flex flex-col gap-1">
                  <span title="Content Items" className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-blue-500" /> {week.content?.length || 0}
                  </span>
                  <span title="Community Items" className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-green-500" /> {week.community?.length || 0}
                  </span>
                  <span title="Coaching Items" className="flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-orange-500" /> {week.coaching?.length || 0}
                  </span>
                </div>
              </td>
              <td className="p-3 text-xs">
                <span className="text-purple-600">{week.dailyReps?.length || week.reps?.length || 0} rep(s)</span>
              </td>
              <td className="p-3">
                {week.isDraft ? (
                  <span className="flex items-center gap-1 text-orange-600 text-xs font-bold">
                    <AlertCircle className="w-3 h-3" /> Draft
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-green-600 text-xs font-bold">
                    <CheckCircle className="w-3 h-3" /> Live
                  </span>
                )}
              </td>
              <td className="p-3 text-right flex justify-end gap-2">
                <button 
                  onClick={() => onEdit(week)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-600 hover:bg-white hover:border-corporate-teal hover:text-corporate-teal transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(week.id)}
                  className="px-3 py-1.5 border border-slate-200 rounded text-xs font-bold text-red-400 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Sub-component: Editor
const WeekEditor = ({ weekId, initialData, lovs, onSave, onCancel, allWeeks }) => {
  // Default empty state
  const defaultData = {
    weekBlockId: '',
    weekNumber: 1,
    title: '',
    focus: '',
    phase: '',
    description: '',
    startOffsetWeeks: 0,
    estimatedTimeMinutes: 90,
    skills: [],
    pillars: [],
    difficultyLevel: 'Foundation',
    level: '',
    prerequisites: '',
    prerequisiteSkills: '',
    workouts: [],
    tools: [],
    optional: '',
    content: [],
    community: [],
    coaching: [],
    reps: [],
    reminderTemplates: [],
    isDraft: true
  };

  const [formData, setFormData] = useState(initialData || defaultData);
  const [activeTab, setActiveTab] = useState('identity'); // identity, resources, metadata, reminders

  // Navigation helpers
  const currentIdx = allWeeks.findIndex(w => w.id === weekId);
  const prevWeek = currentIdx > 0 ? allWeeks[currentIdx - 1] : null;
  const nextWeek = currentIdx < allWeeks.length - 1 ? allWeeks[currentIdx + 1] : null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generic array item adder
  const addItem = (collectionName, template) => {
    setFormData(prev => ({
      ...prev,
      [collectionName]: [...(prev[collectionName] || []), template]
    }));
  };

  // Generic array item remover
  const removeItem = (collectionName, index) => {
    setFormData(prev => ({
      ...prev,
      [collectionName]: prev[collectionName].filter((_, i) => i !== index)
    }));
  };

  // Generic array item updater
  const updateItem = (collectionName, index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev[collectionName]];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, [collectionName]: newItems };
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="font-bold text-corporate-navy text-lg">
            {weekId === 'new' ? 'New Week' : `Editing: ${formData.title}`}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Navigation Buttons */}
          {prevWeek && (
            <button className="p-2 text-slate-400 hover:text-corporate-navy" title={`Go to ${prevWeek.title}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {nextWeek && (
            <button className="p-2 text-slate-400 hover:text-corporate-navy" title={`Go to ${nextWeek.title}`}>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
          
          <div className="h-6 w-px bg-slate-300 mx-2"></div>
          
          <button 
            onClick={() => onSave(formData)}
            className="px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-bold hover:bg-teal-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-4">
        {['identity', 'resources', 'metadata', 'reminders'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${
              activeTab === tab 
                ? 'border-corporate-teal text-corporate-teal' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 border-b pb-2">Core Identity</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Week Block ID</label>
                  <input 
                    type="text" 
                    value={formData.weekBlockId} 
                    onChange={e => handleChange('weekBlockId', e.target.value)}
                    className="w-full p-2 border rounded font-mono"
                    placeholder="e.g. 100, 110, 120"
                  />
                  <p className="text-xs text-slate-400 mt-1">Unique identifier</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Week Number</label>
                  <input 
                    type="number" 
                    value={formData.weekNumber} 
                    onChange={e => handleChange('weekNumber', parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-slate-400 mt-1">Sequential order</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => handleChange('title', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. QuickStart S1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Focus (Action Verb)</label>
                <input 
                  type="text" 
                  value={formData.focus} 
                  onChange={e => handleChange('focus', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Delivering CLEAR Feedback"
                />
                <p className="text-xs text-slate-400 mt-1">Displayed weekly to help users concentrate</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phase</label>
                <select 
                  value={formData.phase} 
                  onChange={e => handleChange('phase', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Phase...</option>
                  {lovs['Program Phases']?.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Program structure (e.g., QS Level 1, QS Challenge)</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 border-b pb-2">Scheduling & Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Offset (Weeks)</label>
                  <input 
                    type="number" 
                    value={formData.startOffsetWeeks} 
                    onChange={e => handleChange('startOffsetWeeks', parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-slate-400 mt-1">-2 = Prep, 0 = Week 1</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Est. Time (Minutes)</label>
                  <input 
                    type="number" 
                    value={formData.estimatedTimeMinutes} 
                    onChange={e => handleChange('estimatedTimeMinutes', parseInt(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                  <p className="text-xs text-slate-400 mt-1">e.g., 90 min, 180 min</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => handleChange('description', e.target.value)}
                  className="w-full p-2 border rounded h-24"
                  placeholder="Brief summary of the week..."
                />
              </div>

              <div className="flex items-center gap-2 pt-4">
                <input 
                  type="checkbox" 
                  id="isDraft"
                  checked={formData.isDraft} 
                  onChange={e => handleChange('isDraft', e.target.checked)}
                  className="w-4 h-4 text-corporate-teal rounded"
                />
                <label htmlFor="isDraft" className="text-sm font-bold text-slate-700">Draft Mode (Hidden from users)</label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-8 max-w-5xl">
            {/* Workouts Section */}
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                  <Target className="w-5 h-5" /> Workouts
                </h4>
                <button 
                  onClick={() => addItem('workouts', { workoutId: '', workoutName: '', workoutLevel: '' })}
                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Workout
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.workouts?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded border border-indigo-200">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input 
                        type="text" 
                        placeholder="ID (e.g. feedback-1)" 
                        value={item.workoutId}
                        onChange={e => updateItem('workouts', idx, 'workoutId', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Name (e.g. Feedback One)" 
                        value={item.workoutName}
                        onChange={e => updateItem('workouts', idx, 'workoutName', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Level (e.g. 100)" 
                        value={item.workoutLevel}
                        onChange={e => updateItem('workouts', idx, 'workoutLevel', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                    </div>
                    <button onClick={() => removeItem('workouts', idx)} className="text-red-400 hover:text-red-600 pt-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!formData.workouts || formData.workouts.length === 0) && (
                  <p className="text-sm text-slate-400 italic text-center py-4">No workouts added.</p>
                )}
              </div>
            </div>

            {/* Tools Section */}
            <div className="bg-teal-50 p-4 rounded-xl border border-teal-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-teal-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5" /> Tools
                </h4>
                <button 
                  onClick={() => addItem('tools', { toolId: '', toolName: '', toolDescription: '' })}
                  className="text-xs font-bold text-teal-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Tool
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.tools?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded border border-teal-200">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input 
                        type="text" 
                        placeholder="ID" 
                        value={item.toolId}
                        onChange={e => updateItem('tools', idx, 'toolId', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Name (e.g. CLEAR Framework)" 
                        value={item.toolName}
                        onChange={e => updateItem('tools', idx, 'toolName', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Description" 
                        value={item.toolDescription}
                        onChange={e => updateItem('tools', idx, 'toolDescription', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                    </div>
                    <button onClick={() => removeItem('tools', idx)} className="text-red-400 hover:text-red-600 pt-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Section */}
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
              <h4 className="font-bold text-yellow-900 flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" /> Optional / Bonus Content
              </h4>
              <p className="text-xs text-yellow-700 mb-3">For conditional content (e.g., bonus workouts for managers with larger teams)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Optional Reference</label>
                  <select 
                    value={formData.optional || ''}
                    onChange={e => handleChange('optional', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="">(None)</option>
                    <option value="Team1">Team1 - Small Team Bonus</option>
                    <option value="Team2">Team2 - Medium Team Bonus</option>
                    <option value="Team3">Team3 - Large Team Bonus</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Optional Notes</label>
                  <input 
                    type="text" 
                    value={formData.optionalNotes || ''}
                    onChange={e => handleChange('optionalNotes', e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="Additional context..."
                  />
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-corporate-navy flex items-center gap-2">
                  <List className="w-5 h-5" /> Content Items (Unlocking)
                </h4>
                <button 
                  onClick={() => addItem('content', { contentItemId: '', contentItemType: 'Workout', contentItemLabel: '', isRequiredContent: true })}
                  className="text-xs font-bold text-corporate-teal hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.content?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded border border-slate-200">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input 
                        type="text" 
                        placeholder="ID (e.g. qs-session-1)" 
                        value={item.contentItemId}
                        onChange={e => updateItem('content', idx, 'contentItemId', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <select 
                        value={item.contentItemType}
                        onChange={e => updateItem('content', idx, 'contentItemType', e.target.value)}
                        className="p-2 border rounded text-sm"
                      >
                        {lovs['Content Types']?.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Label (Display Name)" 
                        value={item.contentItemLabel}
                        onChange={e => updateItem('content', idx, 'contentItemLabel', e.target.value)}
                        className="p-2 border rounded text-sm md:col-span-2"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox" 
                        checked={item.isRequiredContent}
                        onChange={e => updateItem('content', idx, 'isRequiredContent', e.target.checked)}
                      />
                      <span className="text-xs text-slate-500">Req</span>
                      <button onClick={() => removeItem('content', idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {(!formData.content || formData.content.length === 0) && (
                  <p className="text-sm text-slate-400 italic text-center py-4">No content items added.</p>
                )}
              </div>
            </div>

            {/* Community Section */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                  <Layout className="w-5 h-5" /> Community Items
                </h4>
                <button 
                  onClick={() => addItem('community', { communityItemId: '', communityItemType: 'Leader Circle', communityItemLabel: '', recommendedWeekDay: '' })}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.community?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded border border-blue-100">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input 
                        type="text" 
                        placeholder="ID" 
                        value={item.communityItemId}
                        onChange={e => updateItem('community', idx, 'communityItemId', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <select 
                        value={item.communityItemType}
                        onChange={e => updateItem('community', idx, 'communityItemType', e.target.value)}
                        className="p-2 border rounded text-sm"
                      >
                        {lovs['Community Types']?.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Label" 
                        value={item.communityItemLabel}
                        onChange={e => updateItem('community', idx, 'communityItemLabel', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Day (e.g. Thursday)" 
                        value={item.recommendedWeekDay}
                        onChange={e => updateItem('community', idx, 'recommendedWeekDay', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                    </div>
                    <button onClick={() => removeItem('community', idx)} className="text-red-400 hover:text-red-600 pt-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Coaching Section */}
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-orange-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Coaching Items
                </h4>
                <button 
                  onClick={() => addItem('coaching', { coachingItemId: '', coachingItemType: 'Open Gym', coachingItemLabel: '', isOptionalCoachingItem: true })}
                  className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.coaching?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded border border-orange-100">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input 
                        type="text" 
                        placeholder="ID" 
                        value={item.coachingItemId}
                        onChange={e => updateItem('coaching', idx, 'coachingItemId', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <select 
                        value={item.coachingItemType}
                        onChange={e => updateItem('coaching', idx, 'coachingItemType', e.target.value)}
                        className="p-2 border rounded text-sm"
                      >
                        {lovs['Coaching Types']?.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Label" 
                        value={item.coachingItemLabel}
                        onChange={e => updateItem('coaching', idx, 'coachingItemLabel', e.target.value)}
                        className="p-2 border rounded text-sm md:col-span-2"
                      />
                    </div>
                    <button onClick={() => removeItem('coaching', idx)} className="text-red-400 hover:text-red-600 pt-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Reps Section */}
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-purple-900 flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Daily Reps
                </h4>
                <button 
                  onClick={() => addItem('reps', { repId: '', repType: 'Challenge', repLabel: '', isRequired: true })}
                  className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.reps?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded border border-purple-100">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input 
                        type="text" 
                        placeholder="ID" 
                        value={item.repId}
                        onChange={e => updateItem('reps', idx, 'repId', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Type (e.g. Challenge)" 
                        value={item.repType}
                        onChange={e => updateItem('reps', idx, 'repType', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Label" 
                        value={item.repLabel}
                        onChange={e => updateItem('reps', idx, 'repLabel', e.target.value)}
                        className="p-2 border rounded text-sm md:col-span-2"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input 
                        type="checkbox" 
                        checked={item.isRequired}
                        onChange={e => updateItem('reps', idx, 'isRequired', e.target.checked)}
                      />
                      <span className="text-xs text-slate-500">Req</span>
                      <button onClick={() => removeItem('reps', idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
            {/* Skills */}
            <div>
              <h4 className="font-bold text-slate-800 mb-3">Skills</h4>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-64 overflow-y-auto">
                {lovs['Skills']?.map(skill => (
                  <label key={skill} className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                    <input 
                      type="checkbox"
                      checked={formData.skills?.includes(skill)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, skills: [...(prev.skills || []), skill] }));
                        } else {
                          setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
                        }
                      }}
                      className="rounded text-corporate-teal"
                    />
                    <span className="text-sm text-slate-700">{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Pillars */}
            <div>
              <h4 className="font-bold text-slate-800 mb-3">Pillars</h4>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-64 overflow-y-auto">
                {lovs['Pillars']?.map(pillar => (
                  <label key={pillar} className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                    <input 
                      type="checkbox"
                      checked={formData.pillars?.includes(pillar)}
                      onChange={e => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, pillars: [...(prev.pillars || []), pillar] }));
                        } else {
                          setFormData(prev => ({ ...prev, pillars: prev.pillars.filter(p => p !== pillar) }));
                        }
                      }}
                      className="rounded text-corporate-teal"
                    />
                    <span className="text-sm text-slate-700">{pillar}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Difficulty & Level */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Difficulty Level</h4>
                <select 
                  value={formData.difficultyLevel}
                  onChange={e => handleChange('difficultyLevel', e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {lovs['Difficulty Levels']?.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Level (e.g. 100, 200)</h4>
                <input 
                  type="text" 
                  value={formData.level} 
                  onChange={e => handleChange('level', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. 100"
                />
              </div>
            </div>

            {/* Prerequisites */}
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Prerequisites</h4>
                <input 
                  type="text" 
                  value={formData.prerequisites} 
                  onChange={e => handleChange('prerequisites', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. QuickStart S1"
                />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 mb-3">Prerequisite Skills</h4>
                <input 
                  type="text" 
                  value={formData.prerequisiteSkills} 
                  onChange={e => handleChange('prerequisiteSkills', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="e.g. Feedback 1"
                />
              </div>
            </div>

            {/* Reflection Prompt */}
            <div className="md:col-span-2">
              <h4 className="font-bold text-slate-800 mb-3">Reflection Prompt</h4>
              <textarea 
                value={formData.reflectionPrompt}
                onChange={e => handleChange('reflectionPrompt', e.target.value)}
                className="w-full p-2 border rounded h-24"
                placeholder="Question for the user at end of week..."
              />
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-8 max-w-5xl">
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-red-900 flex items-center gap-2">
                  <Bell className="w-5 h-5" /> Reminders
                </h4>
                <button 
                  onClick={() => addItem('reminderTemplates', { templateId: '', frequency: '', channel: 'Email', message: '' })}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Reminder
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.reminderTemplates?.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start bg-white p-3 rounded border border-red-200">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <input 
                        type="text" 
                        placeholder="Template ID (e.g. RT1)" 
                        value={item.templateId}
                        onChange={e => updateItem('reminderTemplates', idx, 'templateId', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <input 
                        type="text" 
                        placeholder="Frequency (e.g. 1)" 
                        value={item.frequency}
                        onChange={e => updateItem('reminderTemplates', idx, 'frequency', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                      <select 
                        value={item.channel}
                        onChange={e => updateItem('reminderTemplates', idx, 'channel', e.target.value)}
                        className="p-2 border rounded text-sm"
                      >
                        <option value="Email">Email</option>
                        <option value="Text">Text</option>
                        <option value="Push">Push</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="Message" 
                        value={item.message}
                        onChange={e => updateItem('reminderTemplates', idx, 'message', e.target.value)}
                        className="p-2 border rounded text-sm"
                      />
                    </div>
                    <button onClick={() => removeItem('reminderTemplates', idx)} className="text-red-400 hover:text-red-600 pt-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(!formData.reminderTemplates || formData.reminderTemplates.length === 0) && (
                  <p className="text-sm text-slate-400 italic text-center py-4">No reminders added.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevPlanManager;
