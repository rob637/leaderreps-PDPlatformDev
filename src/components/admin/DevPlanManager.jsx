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
  FileText,
  Download,
  X,
  Copy,
  Printer
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
import { addContent, CONTENT_COLLECTIONS } from '../../services/contentService';
import ResourceSelector from './ResourceSelector';

const DevPlanManager = () => {
  const { db } = useAppServices();
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [newWeekData, setNewWeekData] = useState(null);
  const [lovs, setLovs] = useState({});
  const [lovIds, setLovIds] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'edit'
  const [showReport, setShowReport] = useState(false);

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
      let weeksData = weeksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // DEBUG: Log all documents to see duplicates
      console.log('[DevPlanManager] All documents from Firestore:', weeksData.map(w => ({
        docId: w.id,
        weekNumber: w.weekNumber,
        title: w.title
      })));
      
      // Deduplicate by weekNumber - if multiple docs have the same weekNumber,
      // prefer the one with a numeric ID over 'week-XX' format (legacy naming)
      const byWeekNumber = new Map();
      weeksData.forEach(week => {
        const existing = byWeekNumber.get(week.weekNumber);
        if (!existing) {
          byWeekNumber.set(week.weekNumber, week);
        } else {
          // If existing is 'week-XX' format and current is numeric, prefer current
          const existingIsLegacy = /^week-\d+$/i.test(existing.id);
          const currentIsLegacy = /^week-\d+$/i.test(week.id);
          if (existingIsLegacy && !currentIsLegacy) {
            console.log(`[DevPlanManager] Preferring doc "${week.id}" over legacy "${existing.id}" for weekNumber ${week.weekNumber}`);
            byWeekNumber.set(week.weekNumber, week);
          } else if (!existingIsLegacy && currentIsLegacy) {
            console.log(`[DevPlanManager] Keeping doc "${existing.id}" over legacy "${week.id}" for weekNumber ${week.weekNumber}`);
          } else {
            // Both are same type - keep the first one
            console.warn(`[DevPlanManager] Duplicate weekNumber ${week.weekNumber} found: "${existing.id}" and "${week.id}". Keeping first.`);
          }
        }
      });
      
      // Convert back to array and sort
      weeksData = Array.from(byWeekNumber.values()).sort((a, b) => a.weekNumber - b.weekNumber);
      console.log('[DevPlanManager] After deduplication:', weeksData.length, 'weeks');
      
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
          {viewMode === 'list' && (
            <>
              <button 
                onClick={() => setShowReport(true)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Generate Report
              </button>
              <button 
                onClick={handleCreateWeek}
                className="px-4 py-2 bg-corporate-teal text-white rounded-lg text-sm font-bold hover:bg-teal-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Week
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReport && (
        <DevPlanReportModal weeks={weeks} onClose={() => setShowReport(false)} />
      )}

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

  // Update multiple fields of an item
  const updateItemFields = (collectionName, index, updates) => {
    setFormData(prev => {
      const newItems = [...prev[collectionName]];
      newItems[index] = { ...newItems[index], ...updates };
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
                      <div className="md:col-span-1">
                        <ResourceSelector 
                          value={item.resourceId || item.contentItemId}
                          resourceType="content"
                          onChange={(id, resource) => {
                            updateItemFields('content', idx, {
                              contentItemId: id,
                              resourceId: id,
                              resourceType: resource.resourceType,
                              resourceThumbnail: resource.thumbnail,
                              // Auto-fill label if empty
                              contentItemLabel: item.contentItemLabel || resource.title,
                              // Auto-fill type if possible (map resource type to content type)
                              contentItemType: resource.resourceType === 'video' ? 'Video' : 
                                              resource.resourceType === 'reading' ? 'Reading' : 
                                              item.contentItemType
                            });
                          }}
                        />
                      </div>
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
                    <div className="flex items-center gap-2 pt-2 justify-between">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.day || 'Any'}
                          onChange={e => updateItem('content', idx, 'day', e.target.value)}
                          className="p-1 border rounded text-xs bg-slate-50"
                        >
                          {['Any', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={item.isRequiredContent}
                            onChange={e => updateItem('content', idx, 'isRequiredContent', e.target.checked)}
                          />
                          <span className="text-xs text-slate-500">Req</span>
                        </label>
                      </div>
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
                      <div className="md:col-span-1">
                        <ResourceSelector 
                          value={item.resourceId || item.communityItemId}
                          resourceType="community"
                          onChange={(id, resource) => {
                            updateItemFields('community', idx, {
                              communityItemId: id,
                              resourceId: id,
                              resourceType: resource.resourceType,
                              resourceThumbnail: resource.thumbnail,
                              communityItemLabel: item.communityItemLabel || resource.title
                            });
                          }}
                        />
                      </div>
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
                      <select
                        value={item.recommendedWeekDay || 'Any'}
                        onChange={e => updateItem('community', idx, 'recommendedWeekDay', e.target.value)}
                        className="p-2 border rounded text-sm"
                      >
                        {['Any', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
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
                      <div className="md:col-span-1">
                        <ResourceSelector 
                          value={item.resourceId || item.coachingItemId}
                          resourceType="coaching"
                          onChange={(id, resource) => {
                            updateItemFields('coaching', idx, {
                              coachingItemId: id,
                              resourceId: id,
                              resourceType: resource.resourceType,
                              resourceThumbnail: resource.thumbnail,
                              coachingItemLabel: item.coachingItemLabel || resource.title
                            });
                          }}
                        />
                      </div>
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
                    <div className="flex items-center gap-2 pt-2 justify-between">
                      <select
                        value={item.day || 'Any'}
                        onChange={e => updateItem('coaching', idx, 'day', e.target.value)}
                        className="p-1 border rounded text-xs bg-orange-50"
                      >
                        {['Any', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <button onClick={() => removeItem('coaching', idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
                    <div className="flex items-center gap-2 pt-2 justify-between">
                      <div className="flex items-center gap-2">
                        <select
                          value={item.day || 'Any'}
                          onChange={e => updateItem('reps', idx, 'day', e.target.value)}
                          className="p-1 border rounded text-xs bg-purple-50"
                        >
                          {['Any', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <label className="flex items-center gap-1 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={item.isRequired}
                            onChange={e => updateItem('reps', idx, 'isRequired', e.target.checked)}
                          />
                          <span className="text-xs text-slate-500">Req</span>
                        </label>
                      </div>
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

// Report Modal Component
const DevPlanReportModal = ({ weeks, onClose }) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'detailed'
  const [copied, setCopied] = useState(false);

  // Helper to count array items
  const countItems = (arr) => Array.isArray(arr) ? arr.length : 0;

  // Phase colors for badges
  const phaseColors = {
    'QuickStart': 'bg-green-100 text-green-700',
    'Spaced Learning': 'bg-yellow-100 text-yellow-700',
    'Clear Performance': 'bg-cyan-100 text-cyan-700',
    'Impact': 'bg-purple-100 text-purple-700'
  };

  // Difficulty colors
  const difficultyColors = {
    'Foundation': 'bg-blue-100 text-blue-700',
    'Intermediate': 'bg-orange-100 text-orange-700',
    'Advanced': 'bg-red-100 text-red-700'
  };

  // Calculate summary stats
  const stats = {
    totalWeeks: weeks.length,
    activeWeeks: weeks.filter(w => !w.isDraft).length,
    draftWeeks: weeks.filter(w => w.isDraft).length,
    totalContent: weeks.reduce((sum, w) => sum + countItems(w.content), 0),
    totalCommunity: weeks.reduce((sum, w) => sum + countItems(w.community), 0),
    totalCoaching: weeks.reduce((sum, w) => sum + countItems(w.coaching), 0),
    totalReps: weeks.reduce((sum, w) => sum + countItems(w.reps) + countItems(w.dailyReps), 0),
    totalTime: weeks.reduce((sum, w) => sum + (w.estimatedTimeMinutes || 0), 0)
  };

  // Phase breakdown
  const phaseBreakdown = {};
  weeks.forEach(w => {
    phaseBreakdown[w.phase] = (phaseBreakdown[w.phase] || 0) + 1;
  });

  // Pillar breakdown
  const pillarBreakdown = {};
  weeks.forEach(w => {
    (w.pillars || []).forEach(p => {
      pillarBreakdown[p] = (pillarBreakdown[p] || 0) + 1;
    });
  });

  // Generate CSV content
  const generateCSV = () => {
    const headers = ['Week', 'Title', 'Focus', 'Phase', 'Skills', 'Pillars', 'Difficulty', 'Time (min)', 'Content', 'Community', 'Coaching', 'Reps', 'Status'];
    const rows = weeks.map(w => [
      w.weekNumber,
      `"${w.title || ''}"`,
      `"${w.focus || ''}"`,
      `"${w.phase || ''}"`,
      `"${(w.skills || []).join(', ')}"`,
      `"${(w.pillars || []).join(', ')}"`,
      `"${w.difficultyLevel || ''}"`,
      w.estimatedTimeMinutes || '',
      countItems(w.content),
      countItems(w.community),
      countItems(w.coaching),
      countItems(w.reps) + countItems(w.dailyReps),
      w.isDraft ? 'Draft' : 'Active'
    ]);
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  // Download CSV
  const handleDownloadCSV = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `development-plan-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const handleCopyToClipboard = () => {
    const text = weeks.map(w => 
      `Week ${w.weekNumber}: ${w.title} | ${w.focus} | ${w.phase} | ${(w.skills || []).join(', ')} | ${w.isDraft ? 'DRAFT' : 'ACTIVE'}`
    ).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-corporate-navy flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Development Plan Report
            </h2>
            <p className="text-sm text-slate-500">
              Generated: {new Date().toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-slate-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'table' ? 'bg-white shadow font-bold' : 'text-slate-600'}`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 text-sm rounded ${viewMode === 'detailed' ? 'bg-white shadow font-bold' : 'text-slate-600'}`}
              >
                Detailed
              </button>
            </div>
            {/* Action buttons */}
            <button
              onClick={handleCopyToClipboard}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              title="Copy to clipboard"
            >
              {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
            <button
              onClick={handleDownloadCSV}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              title="Download CSV"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 rounded-lg text-slate-600 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-4 bg-gradient-to-r from-corporate-navy to-corporate-navy/90 text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{stats.totalWeeks}</div>
              <div className="text-xs opacity-75">Total Weeks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-300">{stats.activeWeeks}</div>
              <div className="text-xs opacity-75">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300">{stats.draftWeeks}</div>
              <div className="text-xs opacity-75">Draft</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalContent}</div>
              <div className="text-xs opacity-75">Content</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalCommunity}</div>
              <div className="text-xs opacity-75">Community</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalCoaching}</div>
              <div className="text-xs opacity-75">Coaching</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.totalReps}</div>
              <div className="text-xs opacity-75">Daily Reps</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{(stats.totalTime / 60).toFixed(1)}h</div>
              <div className="text-xs opacity-75">Total Time</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 print:p-0">
          {viewMode === 'table' ? (
            /* TABLE VIEW */
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse print:text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left font-bold border-b">Wk</th>
                    <th className="p-2 text-left font-bold border-b">Title</th>
                    <th className="p-2 text-left font-bold border-b">Focus</th>
                    <th className="p-2 text-left font-bold border-b">Phase</th>
                    <th className="p-2 text-left font-bold border-b">Skills</th>
                    <th className="p-2 text-left font-bold border-b">Pillars</th>
                    <th className="p-2 text-left font-bold border-b">Difficulty</th>
                    <th className="p-2 text-center font-bold border-b">Time</th>
                    <th className="p-2 text-center font-bold border-b" title="Content">📚</th>
                    <th className="p-2 text-center font-bold border-b" title="Community">👥</th>
                    <th className="p-2 text-center font-bold border-b" title="Coaching">🎯</th>
                    <th className="p-2 text-center font-bold border-b" title="Reps">🔄</th>
                    <th className="p-2 text-left font-bold border-b">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, idx) => (
                    <tr key={week.id || idx} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-bold text-corporate-navy">{week.weekNumber}</td>
                      <td className="p-2 font-medium">{week.title}</td>
                      <td className="p-2 text-slate-600">{week.focus}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${phaseColors[week.phase] || 'bg-slate-100'}`}>
                          {week.phase}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-slate-500 max-w-[150px] truncate" title={(week.skills || []).join(', ')}>
                        {(week.skills || []).join(', ')}
                      </td>
                      <td className="p-2 text-xs text-slate-500">
                        {(week.pillars || []).join(', ')}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${difficultyColors[week.difficultyLevel] || 'bg-slate-100'}`}>
                          {week.difficultyLevel}
                        </span>
                      </td>
                      <td className="p-2 text-center">{week.estimatedTimeMinutes || '-'}</td>
                      <td className="p-2 text-center">{countItems(week.content)}</td>
                      <td className="p-2 text-center">{countItems(week.community)}</td>
                      <td className="p-2 text-center">{countItems(week.coaching)}</td>
                      <td className="p-2 text-center">{countItems(week.reps) + countItems(week.dailyReps)}</td>
                      <td className="p-2">
                        {week.isDraft ? (
                          <span className="text-yellow-600 font-bold text-xs">DRAFT</span>
                        ) : (
                          <span className="text-green-600 font-bold text-xs">ACTIVE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* DETAILED VIEW */
            <div className="space-y-4">
              {weeks.map((week, idx) => (
                <div key={week.id || idx} className="border rounded-lg overflow-hidden">
                  {/* Week Header */}
                  <div className="bg-slate-100 p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-corporate-navy">#{week.weekNumber}</span>
                      <div>
                        <h3 className="font-bold text-corporate-navy">{week.title}</h3>
                        <p className="text-sm text-slate-500">{week.focus}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${phaseColors[week.phase] || 'bg-slate-200'}`}>
                        {week.phase}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${difficultyColors[week.difficultyLevel] || 'bg-slate-200'}`}>
                        {week.difficultyLevel}
                      </span>
                      {week.isDraft ? (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">DRAFT</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">ACTIVE</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Week Details - Daily Breakdown */}
                  <div className="p-3">
                    <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map(dayNum => {
                        const dayItems = [
                          ...(week.content || []).map(i => ({ ...i, type: 'content', label: i.contentItemLabel })),
                          ...(week.community || []).map(i => ({ ...i, type: 'community', label: i.communityItemLabel })),
                          ...(week.coaching || []).map(i => ({ ...i, type: 'coaching', label: i.coachingItemLabel })),
                          ...(week.reps || week.dailyReps || []).map(i => ({ ...i, type: 'rep', label: i.repLabel }))
                        ].filter(item => item.recommendedWeekDay === dayNum);

                        return (
                          <div key={dayNum} className="bg-slate-50 rounded p-2 min-h-[100px]">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-2 text-center">Day {dayNum}</div>
                            {dayItems.length > 0 ? (
                              <div className="space-y-1.5">
                                {dayItems.map((item, idx) => (
                                  <div key={idx} className="text-[10px] p-1.5 bg-white rounded border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      {item.type === 'content' && <BookOpen className="w-3 h-3 text-blue-500" />}
                                      {item.type === 'community' && <Users className="w-3 h-3 text-purple-500" />}
                                      {item.type === 'coaching' && <GraduationCap className="w-3 h-3 text-orange-500" />}
                                      {item.type === 'rep' && <Zap className="w-3 h-3 text-yellow-500" />}
                                      <span className="font-bold text-slate-700 capitalize">{item.type}</span>
                                    </div>
                                    <div className="text-slate-600 leading-tight line-clamp-2" title={item.label}>
                                      {item.label}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-300 text-center italic py-4">No items</div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Anytime / Unscheduled Items */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase mb-2">Anytime / Unscheduled</div>
                      <div className="flex flex-wrap gap-2">
                        {[
                          ...(week.content || []).map(i => ({ ...i, type: 'content', label: i.contentItemLabel })),
                          ...(week.community || []).map(i => ({ ...i, type: 'community', label: i.communityItemLabel })),
                          ...(week.coaching || []).map(i => ({ ...i, type: 'coaching', label: i.coachingItemLabel })),
                          ...(week.reps || week.dailyReps || []).map(i => ({ ...i, type: 'rep', label: i.repLabel }))
                        ].filter(item => !item.recommendedWeekDay).map((item, idx) => (
                          <div key={idx} className="text-[10px] px-2 py-1 bg-slate-50 rounded border border-slate-200 flex items-center gap-1.5">
                            {item.type === 'content' && <BookOpen className="w-3 h-3 text-blue-500" />}
                            {item.type === 'community' && <Users className="w-3 h-3 text-purple-500" />}
                            {item.type === 'coaching' && <GraduationCap className="w-3 h-3 text-orange-500" />}
                            {item.type === 'rep' && <Zap className="w-3 h-3 text-yellow-500" />}
                            <span className="text-slate-600 max-w-[200px] truncate">{item.label}</span>
                          </div>
                        ))}
                        {[
                          ...(week.content || []),
                          ...(week.community || []),
                          ...(week.coaching || []),
                          ...(week.reps || week.dailyReps || [])
                        ].filter(item => !item.recommendedWeekDay).length === 0 && (
                          <span className="text-xs text-slate-400 italic">All items are scheduled for specific days.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Stats & Legend */}
        <div className="p-3 border-t bg-slate-50 rounded-b-xl space-y-2">
          <div className="flex flex-wrap gap-4 text-xs text-slate-500">
            <span><strong>By Phase:</strong> {Object.entries(phaseBreakdown).map(([p, c]) => `${p}: ${c}`).join(' | ')}</span>
            <span><strong>By Pillar:</strong> {Object.entries(pillarBreakdown).map(([p, c]) => `${p}: ${c}`).join(' | ')}</span>
          </div>
          
          {/* Field Type Legend */}
          <div className="pt-2 border-t border-slate-200">
            <div className="text-xs text-slate-600 font-bold mb-1">📋 Field Types Key:</div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
              <div className="flex items-center gap-4">
                <span className="font-medium text-slate-500">LOV (List of Values):</span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">Phase</span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">Skills</span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">Pillars</span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">Difficulty</span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">Content Type</span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">Community Type</span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">Coaching Type</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-slate-500">Free-form:</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-dashed border-slate-300">Title</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-dashed border-slate-300">Focus</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-dashed border-slate-300">Description</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-dashed border-slate-300">Reflection</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded border border-dashed border-slate-300">Rep Labels</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium text-slate-500">Numeric:</span>
                <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded">Week #</span>
                <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded">Time (min)</span>
                <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded">Level</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevPlanManager;
