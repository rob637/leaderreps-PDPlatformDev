import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Loader,
  Plus,
  Trash2,
  Copy,
  ArrowRight,
  CheckCircle,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { Card } from '../ui';
import ContentPicker from './content-editors/pickers/ContentPicker';
import { CONTENT_COLLECTIONS } from '../../services/contentService';

// --- Sub-components ---

const DayCard = ({ day, onEdit }) => {
  const isWeekend = day.isWeekend;
  
  return (
    <div 
      onClick={() => onEdit(day)}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md
        ${isWeekend ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-200 hover:border-corporate-teal'}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`
          text-xs font-bold px-2 py-1 rounded-full
          ${day.dayNumber < 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
        `}>
          Day {day.dayNumber}
        </span>
        {day.isWeekend && <span className="text-xs text-slate-400 font-medium">Weekend</span>}
      </div>
      
      <h4 className="font-bold text-corporate-navy mb-1 line-clamp-2 h-10">
        {day.title || 'Untitled Day'}
      </h4>
      
      <div className="space-y-2 mt-3">
        {/* Focus */}
        {day.focus && (
          <div className="text-xs text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
            <span className="font-bold text-corporate-teal">Focus:</span> {day.focus}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="font-bold">{day.actions?.length || 0}</span> Actions
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold">{day.content?.length || 0}</span> Content
          </span>
        </div>
      </div>
    </div>
  );
};

const DayEditor = ({ day, onSave, onCancel, allDays }) => {
  const { db } = useAppServices();
  const [formData, setFormData] = useState({ ...day });
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'daily_rep', 'content', or 'action_link'
  const [targetActionIndex, setTargetActionIndex] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDashboardToggle = (key) => {
    setFormData(prev => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        [key]: !prev.dashboard?.[key]
      }
    }));
  };

  // --- Actions Management ---
  const addAction = (type = 'daily_rep', label = '') => {
    const newAction = {
      id: `action-${Date.now()}`,
      type,
      label,
      isCompleted: false
    };
    setFormData(prev => ({
      ...prev,
      actions: [...(prev.actions || []), newAction]
    }));
  };

  const updateAction = (index, field, value) => {
    const newActions = [...(formData.actions || [])];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  const removeAction = (index) => {
    const newActions = [...(formData.actions || [])];
    newActions.splice(index, 1);
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  // --- Content Management ---
  const removeContent = (index) => {
    const newContent = [...(formData.content || [])];
    newContent.splice(index, 1);
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const handlePickerSelect = (item) => {
    if (pickerType === 'daily_rep') {
      // Add as an action
      addAction('daily_rep', item.title); // Or link by ID if we prefer
    } else if (pickerType === 'action_link') {
      // Link resource to existing action
      if (targetActionIndex !== null) {
        updateAction(targetActionIndex, 'resourceId', item.id);
        updateAction(targetActionIndex, 'resourceTitle', item.title);
        updateAction(targetActionIndex, 'resourceType', item.type);
        setTargetActionIndex(null);
      }
    } else if (pickerType === 'content') {
      // Add as content
      const newContent = {
        id: item.id,
        type: item.type,
        title: item.title,
        thumbnail: item.thumbnail || ''
      };
      setFormData(prev => ({
        ...prev,
        content: [...(prev.content || []), newContent]
      }));
    }
    setShowContentPicker(false);
  };

  // --- Propagate Feature ---
  const handlePropagate = async (sourceField) => {
    if (!confirm(`Apply this day's ${sourceField} to all other days in this week (Mon-Fri)?`)) return;
    
    // Find other days in this week
    const weekDays = allDays.filter(d => 
      d.weekNumber === formData.weekNumber && 
      d.dayNumber !== formData.dayNumber &&
      !d.isWeekend // Skip weekends
    );

    const batch = writeBatch(db);
    
    weekDays.forEach(d => {
      const ref = doc(db, 'daily_plan_v1', d.id);
      batch.update(ref, {
        [sourceField]: formData[sourceField],
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
    alert(`Propagated ${sourceField} to ${weekDays.length} days.`);
  };

  return (
    <div className="bg-white border-l border-slate-200 h-full flex flex-col w-96 shadow-xl fixed right-0 top-0 z-50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="font-bold text-corporate-navy">Edit Day {formData.dayNumber}</h3>
          <p className="text-xs text-slate-500">Week {formData.weekNumber}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full">
            <ChevronRight className="w-5 h-5 text-slate-500" />
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="p-2 bg-corporate-teal text-white rounded-full hover:bg-teal-700 shadow-sm"
          >
            <Save className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Basic Info */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={e => handleChange('title', e.target.value)}
              className="w-full p-2 border rounded text-sm font-bold text-corporate-navy"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Daily Focus</label>
            <textarea 
              value={formData.focus} 
              onChange={e => handleChange('focus', e.target.value)}
              className="w-full p-2 border rounded text-sm h-20"
              placeholder="What is the main theme for today?"
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={formData.isWeekend} 
              onChange={e => handleChange('isWeekend', e.target.checked)}
              id="isWeekend"
            />
            <label htmlFor="isWeekend" className="text-sm text-slate-700">Is Weekend / Rest Day</label>
          </div>
        </div>

        {/* Actions / Daily Reps */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Actions & Reps</label>
            <div className="flex gap-1">
              <button 
                onClick={() => handlePropagate('actions')}
                className="text-[10px] text-blue-600 hover:underline px-1"
                title="Copy these actions to Mon-Fri of this week"
              >
                Propagate
              </button>
              <button 
                onClick={() => { setPickerType('daily_rep'); setShowContentPicker(true); }}
                className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Lib
              </button>
              <button 
                onClick={() => addAction('daily_rep')}
                className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Custom
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {(formData.actions || []).map((action, idx) => (
              <div key={idx} className="flex flex-col gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                <div className="flex gap-2 items-start">
                  <div className="mt-1">
                    {action.type === 'daily_rep' ? <div className="w-2 h-2 rounded-full bg-corporate-teal" /> : <div className="w-2 h-2 rounded-full bg-orange-400" />}
                  </div>
                  <input 
                    type="text"
                    value={action.label}
                    onChange={e => updateAction(idx, 'label', e.target.value)}
                    className="flex-1 bg-transparent text-sm border-none p-0 focus:ring-0"
                    placeholder="Action description..."
                  />
                  <button onClick={() => removeAction(idx)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                
                {/* Link Resource */}
                <div className="flex items-center gap-2 pl-4">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Link:</span>
                  {action.resourceId ? (
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-2 py-0.5 text-xs">
                      <span className="truncate max-w-[150px]">{action.resourceTitle || action.resourceId}</span>
                      <button 
                        onClick={() => updateAction(idx, 'resourceId', null)}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setTargetActionIndex(idx);
                        setPickerType('action_link'); 
                        setShowContentPicker(true); 
                      }}
                      className="text-[10px] text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Attach Content
                    </button>
                  )}
                </div>
              </div>
            ))}
            {(formData.actions || []).length === 0 && (
              <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                No actions defined
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-slate-500 uppercase">Unlocked Content</label>
            <button 
              onClick={() => { setPickerType('content'); setShowContentPicker(true); }}
              className="text-xs bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
          
          <div className="space-y-2">
            {(formData.content || []).map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-100">
                <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-500">
                  {item.type?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.type}</div>
                </div>
                <button onClick={() => removeContent(idx)} className="text-slate-400 hover:text-red-500">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
             {(formData.content || []).length === 0 && (
              <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                No content unlocks
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Config */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Dashboard Widgets</label>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <span className="text-sm">AM Bookend (Start Strong)</span>
              <input 
                type="checkbox" 
                checked={formData.dashboard?.showAMBookend !== false} 
                onChange={() => handleDashboardToggle('showAMBookend')}
              />
            </label>
            <label className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <span className="text-sm">Weekly Focus</span>
              <input 
                type="checkbox" 
                checked={formData.dashboard?.showWeeklyFocus !== false} 
                onChange={() => handleDashboardToggle('showWeeklyFocus')}
              />
            </label>
            <label className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <span className="text-sm">LIS Builder</span>
              <input 
                type="checkbox" 
                checked={formData.dashboard?.showLISBuilder} 
                onChange={() => handleDashboardToggle('showLISBuilder')}
              />
            </label>
            <label className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <span className="text-sm">Grounding Rep</span>
              <input 
                type="checkbox" 
                checked={formData.dashboard?.showGroundingRep} 
                onChange={() => handleDashboardToggle('showGroundingRep')}
              />
            </label>
            <label className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <span className="text-sm">Win The Day</span>
              <input 
                type="checkbox" 
                checked={formData.dashboard?.showWinTheDay} 
                onChange={() => handleDashboardToggle('showWinTheDay')}
              />
            </label>
            <label className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <span className="text-sm">Daily Reps</span>
              <input 
                type="checkbox" 
                checked={formData.dashboard?.showDailyReps} 
                onChange={() => handleDashboardToggle('showDailyReps')}
              />
            </label>
            <label className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <span className="text-sm">Notifications</span>
              <input 
                type="checkbox" 
                checked={formData.dashboard?.showNotifications} 
                onChange={() => handleDashboardToggle('showNotifications')}
              />
            </label>
            <label className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <span className="text-sm">PM Reflection</span>
              <input 
                type="checkbox" 
                checked={formData.dashboard?.showPMReflection} 
                onChange={() => handleDashboardToggle('showPMReflection')}
              />
            </label>
            <label className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer">
              <span className="text-sm">Scorecard</span>
              <input 
                type="checkbox" 
                checked={formData.dashboard?.showScorecard} 
                onChange={() => handleDashboardToggle('showScorecard')}
              />
            </label>
          </div>
        </div>

      </div>

      {/* Pickers */}
      {showContentPicker && (
        <ContentPicker 
          type={pickerType === 'daily_rep' ? CONTENT_COLLECTIONS.DAILY_REPS : 'ALL'} // 'ALL' needs support in picker or specific type
          onSelect={handlePickerSelect}
          onClose={() => setShowContentPicker(false)}
        />
      )}
    </div>
  );
};

// --- Main Component ---

const DailyPlanManager = () => {
  const { db } = useAppServices();
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [editingDay, setEditingDay] = useState(null);

  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'daily_plan_v1'), orderBy('dayNumber', 'asc'));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setDays(data);
      } catch (error) {
        console.error("Error loading daily plan:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [db]);

  // Group by Week
  const weeks = useMemo(() => {
    const groups = {};
    days.forEach(day => {
      const w = day.weekNumber || 0;
      if (!groups[w]) groups[w] = [];
      groups[w].push(day);
    });
    return groups;
  }, [days]);

  const weekNumbers = Object.keys(weeks).map(Number).sort((a, b) => a - b);
  const currentWeekDays = weeks[selectedWeek] || [];

  const handleSaveDay = async (updatedDay) => {
    try {
      const ref = doc(db, 'daily_plan_v1', updatedDay.id);
      await setDoc(ref, {
        ...updatedDay,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setDays(prev => prev.map(d => d.id === updatedDay.id ? updatedDay : d));
      setEditingDay(null);
    } catch (error) {
      console.error("Error saving day:", error);
      alert("Failed to save day.");
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
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-corporate-navy flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Daily Plan Manager
          </h2>
          <p className="text-slate-500 text-sm">
            Manage the day-by-day journey. {days.length} days defined.
          </p>
        </div>
        
        {/* Week Selector */}
        <div className="flex items-center gap-4 bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setSelectedWeek(prev => Math.max(weekNumbers[0], prev - 1))}
            disabled={selectedWeek === weekNumbers[0]}
            className="p-2 hover:bg-white rounded-md disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 font-bold text-corporate-navy min-w-[100px] text-center">
            {selectedWeek < 0 ? 'Prep Phase' : `Week ${selectedWeek}`}
          </div>
          <button 
            onClick={() => setSelectedWeek(prev => Math.min(weekNumbers[weekNumbers.length - 1], prev + 1))}
            disabled={selectedWeek === weekNumbers[weekNumbers.length - 1]}
            className="p-2 hover:bg-white rounded-md disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentWeekDays.map(day => (
            <DayCard 
              key={day.id} 
              day={day} 
              onEdit={setEditingDay} 
            />
          ))}
          {currentWeekDays.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-400">
              No days found for this week.
            </div>
          )}
        </div>
      </div>

      {/* Editor Sidebar */}
      {editingDay && (
        <div className="absolute inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditingDay(null)} />
          <DayEditor 
            day={editingDay} 
            onSave={handleSaveDay} 
            onCancel={() => setEditingDay(null)}
            allDays={days}
          />
        </div>
      )}
    </div>
  );
};

export default DailyPlanManager;
