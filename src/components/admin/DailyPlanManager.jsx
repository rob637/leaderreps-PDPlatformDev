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
  MoreVertical,
  X,
  Link,
  FileText,
  Video,
  BookOpen,
  Users,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff
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
import ResourceSelector from './ResourceSelector';
import { CONTENT_COLLECTIONS } from '../../services/contentService';
import { FEATURE_METADATA } from '../../config/widgetTemplates';
import { useFeatures } from '../../providers/FeatureProvider';

// Categories of widgets that can be toggled per-day in the Daily Plan
// Excludes system widgets like 'program-status-debug' which shouldn't be toggled per-day
// Also excludes Locker-specific widgets and non-core features (Learning, Community, etc.)
const DAILY_PLAN_WIDGET_CATEGORIES = [
  'Dashboard',      // Main dashboard widgets (prep-welcome-banner, this-weeks-actions, etc.)
  'Planning',       // Planning widgets (am-bookend-header, weekly-focus, grounding-rep, win-the-day, daily-reps)
  'Habits',         // Habit tracking widgets (habit-stack)
  'Actions',        // Action-related widgets
  'Reflection',     // Reflection widgets (pm-bookend-header, pm-bookend)
  'Tracking',       // Progress tracking (scorecard/Daily Progress, progress-feedback)
  'Inspiration',    // Inspirational content (daily-quote)
  'General',        // General widgets (notifications, welcome-message)
];

// Get all widget IDs from FEATURE_METADATA that belong to allowed categories
const getDashboardWidgetIds = () => {
  return Object.entries(FEATURE_METADATA)
    .filter(([, meta]) => DAILY_PLAN_WIDGET_CATEGORIES.includes(meta.category))
    .map(([id]) => id);
};

// Action Types with icons
const ACTION_TYPES = {
  task: { label: 'Task', icon: CheckCircle, color: 'teal' },
  video: { label: 'Watch Video', icon: Video, color: 'blue' },
  reading: { label: 'Reading', icon: BookOpen, color: 'amber' },
  community: { label: 'Community', icon: Users, color: 'purple' },
  document: { label: 'Document', icon: FileText, color: 'slate' }
};

// --- Sub-components ---

const DayCard = ({ day, onEdit, displayDayNumber }) => {
  const isWeekend = day.isWeekend;
  const isPrepPhase = day.weekNumber !== undefined && day.weekNumber <= 0;
  const linkedResourceCount = (day.actions || []).filter(a => a.resourceId).length;
  const weeklyResourceCount = day.weeklyResources ? (
    (day.weeklyResources.weeklyContent?.length || 0) +
    (day.weeklyResources.weeklyCommunity?.length || 0) +
    (day.weeklyResources.weeklyCoaching?.length || 0) +
    (day.weeklyResources.weeklyWorkouts?.length || 0) +
    (day.weeklyResources.weeklyTools?.length || 0)
  ) : 0;
  
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
          ${isPrepPhase ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
        `}>
          {isPrepPhase ? 'Item' : 'Day'} {displayDayNumber || day.dayNumber}
        </span>
        <div className="flex items-center gap-1">
          {weeklyResourceCount > 0 && (
            <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium">
              {weeklyResourceCount} wk
            </span>
          )}
          {day.isWeekend && <span className="text-xs text-slate-400 font-medium">Weekend</span>}
        </div>
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
          {linkedResourceCount > 0 && (
            <span className="flex items-center gap-1 text-blue-600">
              <Link className="w-3 h-3" />
              <span className="font-bold">{linkedResourceCount}</span> Linked
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const DayEditor = ({ day, onSave, onCancel, allDays, displayDayNumber }) => {
  const { db } = useAppServices();
  const { isFeatureEnabled, getFeatureOrder } = useFeatures(); // Use Feature Provider
  const [formData, setFormData] = useState({ ...day });
  const [showContentPicker, setShowContentPicker] = useState(false);
  const [pickerType, setPickerType] = useState(null); // 'daily_rep' only (action_link uses ResourceSelector)

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
      isCompleted: false,
      enabled: true
    };
    setFormData(prev => ({
      ...prev,
      actions: [...(prev.actions || []), newAction]
    }));
  };

  const updateAction = (index, field, value) => {
    setFormData(prev => {
      const newActions = [...(prev.actions || [])];
      newActions[index] = { ...newActions[index], [field]: value };
      return { ...prev, actions: newActions };
    });
  };

  // Update multiple fields on an action at once (prevents race conditions)
  const updateActionMultiple = (index, updates) => {
    setFormData(prev => {
      const newActions = [...(prev.actions || [])];
      newActions[index] = { ...newActions[index], ...updates };
      return { ...prev, actions: newActions };
    });
  };

  const removeAction = (index) => {
    const newActions = [...(formData.actions || [])];
    newActions.splice(index, 1);
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  const moveAction = (index, direction) => {
    const actions = formData.actions || [];
    const currentAction = actions[index];
    const isDailyRep = currentAction.type === 'daily_rep';
    
    let targetIndex = -1;
    
    if (direction === 'up') {
      for (let i = index - 1; i >= 0; i--) {
        if ((actions[i].type === 'daily_rep') === isDailyRep) {
          targetIndex = i;
          break;
        }
      }
    } else {
      for (let i = index + 1; i < actions.length; i++) {
        if ((actions[i].type === 'daily_rep') === isDailyRep) {
          targetIndex = i;
          break;
        }
      }
    }
    
    if (targetIndex !== -1) {
      const newActions = [...actions];
      [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];
      setFormData(prev => ({ ...prev, actions: newActions }));
    }
  };

  const toggleActionEnabled = (index) => {
    const newActions = [...(formData.actions || [])];
    newActions[index] = { ...newActions[index], enabled: !newActions[index].enabled };
    setFormData(prev => ({ ...prev, actions: newActions }));
  };

  const handlePickerSelect = (item) => {
    // Only used for Daily Reps Library picker now
    // Resource linking is handled by ResourceSelector inline
    if (pickerType === 'daily_rep') {
      // Add as an action (pre-fills from library)
      const newAction = {
        id: `action-${Date.now()}`,
        type: 'daily_rep',
        label: item.title || '',
        description: item.description || '', // Copy description from library, default to empty string
        resourceId: item.id || null,
        resourceTitle: item.title || '',
        resourceType: item.type || 'content',
        isCompleted: false
      };
      setFormData(prev => ({
        ...prev,
        actions: [...(prev.actions || []), newAction]
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
          <h3 className="font-bold text-corporate-navy">Edit {formData.weekNumber < 1 ? 'Login' : 'Day'} {displayDayNumber || formData.dayNumber}</h3>
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
        {/* Daily Reps Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-teal-600"></div>
              Daily Reps
            </label>
            <div className="flex gap-1">
              <button 
                onClick={() => { setPickerType('daily_rep'); setShowContentPicker(true); }}
                className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 px-2 py-1 rounded flex items-center gap-1 border border-teal-100"
              >
                <Plus className="w-3 h-3" /> Add Rep
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {(formData.actions || []).map((action, idx) => ({ action, idx }))
              .filter(({ action }) => action.type === 'daily_rep')
              .map(({ action, idx }, listIdx, listArr) => (
              <div key={action.id || idx} className={`flex flex-col gap-2 p-2 rounded border ${action.enabled !== false ? 'bg-slate-50 border-slate-100' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <div className="flex gap-2 items-center">
                  {/* Move Up/Down */}
                  <div className="flex flex-col gap-0.5">
                    <button 
                      onClick={() => moveAction(idx, 'up')} 
                      disabled={listIdx === 0}
                      className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => moveAction(idx, 'down')} 
                      disabled={listIdx === listArr.length - 1}
                      className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Enable/Disable Toggle */}
                  <button 
                    onClick={() => toggleActionEnabled(idx)}
                    className={`p-1 rounded ${action.enabled !== false ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`}
                    title={action.enabled !== false ? 'Enabled - click to disable' : 'Disabled - click to enable'}
                  >
                    {action.enabled !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  
                  {/* Type indicator */}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#0d9488' }} />
                  
                  {/* Label input */}
                  <input 
                    type="text"
                    value={action.label || ''}
                    onChange={e => updateAction(idx, 'label', e.target.value)}
                    className="flex-1 bg-white text-sm border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-corporate-teal focus:border-corporate-teal min-w-0"
                    placeholder="Rep description..."
                  />
                  
                  {/* Delete button */}
                  <button onClick={() => removeAction(idx)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {/* Optional Toggle */}
                <div className="flex items-center gap-2 pl-8 mb-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={action.optional === true}
                      onChange={e => updateAction(idx, 'optional', e.target.checked)}
                      className="w-3 h-3 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Optional (not required)</span>
                  </label>
                </div>

                {/* Link Resource - Using ResourceSelector */}
                <div className="flex items-center gap-2 pl-8">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex-shrink-0">Link:</span>
                  <div className="flex-1 min-w-0">
                    <ResourceSelector 
                      value={action.resourceId || null}
                      onChange={(id, resource) => {
                        if (resource) {
                          updateActionMultiple(idx, {
                            resourceId: resource.id,
                            resourceTitle: resource.title,
                            resourceType: resource.resourceType || resource.type,
                            url: resource.url || resource.videoUrl || resource.link || ''
                          });
                        } else {
                          updateActionMultiple(idx, {
                            resourceId: null,
                            resourceTitle: null,
                            resourceType: null,
                            url: null
                          });
                        }
                      }}
                      resourceType="content"
                    />
                  </div>
                </div>
              </div>
            ))}
            {(formData.actions || []).filter(a => a.type === 'daily_rep').length === 0 && (
              <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                No daily reps defined
              </div>
            )}
          </div>
        </div>

        {/* Actions Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-bold text-orange-500 uppercase flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              Actions
            </label>
            <div className="flex gap-1">
              <button 
                onClick={() => handlePropagate('actions')}
                className="text-[10px] text-blue-600 hover:underline px-1 mr-2"
                title="Copy these actions to Mon-Fri of this week"
              >
                Propagate
              </button>
              <button 
                onClick={() => { setPickerType('content'); setShowContentPicker(true); }}
                className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-2 py-1 rounded flex items-center gap-1 border border-orange-100"
              >
                <Plus className="w-3 h-3" /> Lib
              </button>
              <button 
                onClick={() => addAction('content')}
                className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-2 py-1 rounded flex items-center gap-1 border border-orange-100"
              >
                <Plus className="w-3 h-3" /> Add Action
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            {(formData.actions || []).map((action, idx) => ({ action, idx }))
              .filter(({ action }) => action.type !== 'daily_rep')
              .map(({ action, idx }, listIdx, listArr) => (
              <div key={action.id || idx} className={`flex flex-col gap-2 p-2 rounded border ${action.enabled !== false ? 'bg-slate-50 border-slate-100' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                <div className="flex gap-2 items-center">
                  {/* Move Up/Down */}
                  <div className="flex flex-col gap-0.5">
                    <button 
                      onClick={() => moveAction(idx, 'up')} 
                      disabled={listIdx === 0}
                      className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => moveAction(idx, 'down')} 
                      disabled={listIdx === listArr.length - 1}
                      className="p-0.5 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                  
                  {/* Enable/Disable Toggle */}
                  <button 
                    onClick={() => toggleActionEnabled(idx)}
                    className={`p-1 rounded ${action.enabled !== false ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-200'}`}
                    title={action.enabled !== false ? 'Enabled - click to disable' : 'Disabled - click to enable'}
                  >
                    {action.enabled !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  
                  {/* Type indicator */}
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#fb923c' }} />
                  
                  {/* Label input */}
                  <input 
                    type="text"
                    value={action.label || ''}
                    onChange={e => updateAction(idx, 'label', e.target.value)}
                    className="flex-1 bg-white text-sm border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-corporate-teal focus:border-corporate-teal min-w-0"
                    placeholder="Action description..."
                  />
                  
                  {/* Delete button */}
                  <button onClick={() => removeAction(idx)} className="text-slate-400 hover:text-red-500 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {/* Optional Toggle */}
                <div className="flex items-center gap-2 pl-8 mb-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={action.optional === true}
                      onChange={e => updateAction(idx, 'optional', e.target.checked)}
                      className="w-3 h-3 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
                    />
                    <span className="text-[10px] text-slate-500 font-medium">Optional (not required)</span>
                  </label>
                </div>

                {/* Link Resource - Using ResourceSelector */}
                <div className="flex items-center gap-2 pl-8">
                  <span className="text-[10px] text-slate-400 uppercase font-bold flex-shrink-0">Link:</span>
                  <div className="flex-1 min-w-0">
                    <ResourceSelector 
                      value={action.resourceId || null}
                      onChange={(id, resource) => {
                        if (resource) {
                          // Use updateActionMultiple to prevent race conditions
                          updateActionMultiple(idx, {
                            resourceId: resource.id,
                            resourceTitle: resource.title,
                            resourceType: resource.resourceType || resource.type,
                            // Explicitly save the URL to ensure it's available in the widget
                            url: resource.url || resource.videoUrl || resource.link || ''
                          });
                        } else {
                          updateActionMultiple(idx, {
                            resourceId: null,
                            resourceTitle: null,
                            resourceType: null,
                            url: null
                          });
                        }
                      }}
                      resourceType="content"
                    />
                  </div>
                </div>
              </div>
            ))}
            {(formData.actions || []).filter(a => a.type !== 'daily_rep').length === 0 && (
              <div className="text-center p-4 border-2 border-dashed border-slate-200 rounded-lg text-xs text-slate-400">
                No actions defined
              </div>
            )}
          </div>
        </div>

        {/* Linked Resources Summary */}
        {(formData.actions || []).some(a => a.resourceId) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <label className="text-xs font-bold text-blue-700 uppercase mb-2 block flex items-center gap-1">
              <Link className="w-3 h-3" />
              Unlocked Resources ({(formData.actions || []).filter(a => a.resourceId).length})
            </label>
            <p className="text-[10px] text-blue-600 mb-2">
              Resources linked to actions above are automatically unlocked for users on this day.
            </p>
            <div className="flex flex-wrap gap-1">
              {(formData.actions || [])
                .filter(a => a.resourceId)
                .map((action, idx) => (
                  <span key={idx} className="bg-white text-blue-700 text-[10px] px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                    {action.resourceType === 'video' && <Video className="w-2.5 h-2.5" />}
                    {action.resourceType === 'document' && <FileText className="w-2.5 h-2.5" />}
                    {action.resourceType === 'book' && <BookOpen className="w-2.5 h-2.5" />}
                    {action.resourceType === 'group' && <Users className="w-2.5 h-2.5" />}
                    {action.resourceTitle || 'Linked'}
                  </span>
                ))}
            </div>
          </div>
        )}

        {/* Weekly Resources (from Legacy Plan) */}
        {formData.weeklyResources && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <label className="text-xs font-bold text-purple-700 uppercase mb-2 block flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Week {formData.weekNumber} Resources (from Legacy Plan)
            </label>
            
            {formData.weeklyResources.weekTitle && (
              <div className="mb-2">
                <span className="text-xs font-bold text-purple-800">{formData.weeklyResources.weekTitle}</span>
                {formData.weeklyResources.weekFocus && (
                  <p className="text-[10px] text-purple-600">{formData.weeklyResources.weekFocus}</p>
                )}
              </div>
            )}
            
            <div className="space-y-1 text-[10px]">
              {formData.weeklyResources.weeklyContent?.length > 0 && (
                <div className="flex items-center gap-1">
                  <Video className="w-3 h-3 text-purple-500" />
                  <span className="text-purple-700">{formData.weeklyResources.weeklyContent.length} Content Items</span>
                </div>
              )}
              {formData.weeklyResources.weeklyCommunity?.length > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-purple-500" />
                  <span className="text-purple-700">{formData.weeklyResources.weeklyCommunity.length} Community Activities</span>
                </div>
              )}
              {formData.weeklyResources.weeklyCoaching?.length > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-purple-500" />
                  <span className="text-purple-700">{formData.weeklyResources.weeklyCoaching.length} Coaching Elements</span>
                </div>
              )}
              {formData.weeklyResources.weeklyWorkouts?.length > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-purple-500" />
                  <span className="text-purple-700">{formData.weeklyResources.weeklyWorkouts.length} Workouts</span>
                </div>
              )}
              {formData.weeklyResources.weeklyTools?.length > 0 && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3 text-purple-500" />
                  <span className="text-purple-700">{formData.weeklyResources.weeklyTools.length} Tools</span>
                </div>
              )}
            </div>
            
            <p className="text-[9px] text-purple-500 mt-2 italic">
              These resources are inherited from the Legacy Plan. Edit in Legacy Plan Manager to update.
            </p>
          </div>
        )}

        {/* Dashboard Config */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Dashboard Widgets</label>
          <p className="text-xs text-slate-400 mb-3">Toggle which Dashboard widgets are visible on this specific day.</p>
          <div className="space-y-2">
            {/* Only show widgets that appear on the Dashboard screen and are globally enabled */}
            {getDashboardWidgetIds()
              .filter(key => isFeatureEnabled(key) && FEATURE_METADATA[key])
              .sort((a, b) => getFeatureOrder(a) - getFeatureOrder(b))
              .map(key => {
                const meta = FEATURE_METADATA[key];
                return (
                  <label key={key} className="flex items-center justify-between p-2 border rounded hover:bg-slate-50 cursor-pointer bg-white">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{meta.name}</span>
                      <span className="text-[10px] text-slate-400">{meta.category}</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={formData.dashboard?.[key] !== false} 
                      onChange={() => handleDashboardToggle(key)}
                    />
                  </label>
                );
              })}
          </div>
        </div>

      </div>

      {/* Picker - Only for Daily Reps Library */}
      {showContentPicker && pickerType === 'daily_rep' && (
        <ContentPicker 
          type={CONTENT_COLLECTIONS.DAILY_REPS}
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
  const [selectedWeek, setSelectedWeek] = useState(-2); // Start with Prep Phase
  const [selectedPhase, setSelectedPhase] = useState('prep'); // 'prep', 'dev', 'post'
  const [selectedPrepSection, setSelectedPrepSection] = useState('required'); // 'required' or 'explore'
  const [editingDay, setEditingDay] = useState(null);

  // Phase configuration
  const PHASES = {
    prep: { 
      id: 'prep', 
      name: 'Prep Phase', 
      emoji: '📋',
      description: 'Required prep items that unlock app features',
      weekRange: [-2, 0], // Weeks -2 to 0
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-300',
      activeColor: 'bg-amber-500',
      dayOffset: 0,
      isProgressBased: true // NEW: Flag for progress-based phases
    },
    dev: { 
      id: 'dev', 
      name: 'Dev Plan', 
      emoji: '🎯',
      description: '8-Week Core Program (Days 1-56)',
      weekRange: [1, 8], // Weeks 1-8
      bgColor: 'bg-teal-50',
      textColor: 'text-corporate-teal',
      borderColor: 'border-corporate-teal',
      activeColor: 'bg-corporate-teal',
      dayOffset: 14
    },
    post: { 
      id: 'post', 
      name: 'Post Phase', 
      emoji: '🔄',
      description: 'Ongoing development (Days 1-7)',
      weekRange: [9, 99], // Weeks 9+
      bgColor: 'bg-slate-50',
      textColor: 'text-slate-600',
      borderColor: 'border-slate-300',
      activeColor: 'bg-slate-500',
      dayOffset: 70
    }
  };
  
  // Prep Phase section configuration
  const PREP_SECTIONS = {
    required: {
      id: 'required',
      name: 'Required Prep',
      emoji: '⚡',
      description: 'Required items that must be completed to unlock app features',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-300',
      activeColor: 'bg-amber-500'
    },
    explore: {
      id: 'explore',
      name: 'Explore',
      emoji: '🔓',
      description: 'Optional content unlocked after completing Required Prep',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-300',
      activeColor: 'bg-purple-500'
    }
  };

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
  
  // Filter weeks by selected phase
  const currentPhase = PHASES[selectedPhase];
  const phaseWeekNumbers = weekNumbers.filter(w => 
    w >= currentPhase.weekRange[0] && w <= currentPhase.weekRange[1]
  );
  
  // Get all prep phase days (for progress-based view)
  const prepDays = useMemo(() => {
    return days.filter(day => day.weekNumber !== undefined && day.weekNumber <= 0);
  }, [days]);
  
  // Separate prep days into Required vs Additional based on content
  const { requiredPrepDays, additionalPrepDays } = useMemo(() => {
    // Required prep: Days that contain the 5 required prep items
    // These are typically the first few days (Day 1-3) in the data
    // We identify them by looking for specific action labels/IDs
    const required = [];
    const additional = [];
    
    prepDays.forEach(day => {
      const actions = day.actions || [];
      const hasRequiredItem = actions.some(action => {
        const id = (action.id || '').toLowerCase();
        const label = (action.label || '').toLowerCase();
        
        // Check for required prep items
        if (id.includes('action-prep-001') || id.includes('action-prep-002') || id.includes('action-prep-003')) return true;
        if (label.includes('foundation') && (label.includes('video') || label.includes('workbook'))) return true;
        if (label.includes('prep exercises') || label.includes('session 1 prep')) return true;
        if (label.includes('leader profile') || label.includes('baseline assessment')) return true;
        
        return false;
      });
      
      // Also check if day is marked as required prep (new field)
      if (hasRequiredItem || day.isRequiredPrep) {
        required.push(day);
      } else {
        additional.push(day);
      }
    });
    
    return { 
      requiredPrepDays: required.sort((a, b) => a.dayNumber - b.dayNumber),
      additionalPrepDays: additional.sort((a, b) => a.dayNumber - b.dayNumber)
    };
  }, [prepDays]);
  
  // Current days to display based on phase and section
  const currentWeekDays = useMemo(() => {
    if (selectedPhase === 'prep') {
      // Prep phase has two sections: Required Prep and Explore Your Tools
      return selectedPrepSection === 'required' ? requiredPrepDays : additionalPrepDays;
    }
    return weeks[selectedWeek] || [];
  }, [selectedPhase, selectedPrepSection, requiredPrepDays, additionalPrepDays, weeks, selectedWeek]);

  // Handle phase change - jump to first week of that phase
  const handlePhaseChange = (phaseId) => {
    setSelectedPhase(phaseId);
    const phase = PHASES[phaseId];
    if (phaseId !== 'prep') {
      const firstWeekInPhase = weekNumbers.find(w => 
        w >= phase.weekRange[0] && w <= phase.weekRange[1]
      );
      if (firstWeekInPhase !== undefined) {
        setSelectedWeek(firstWeekInPhase);
      } else {
        // Default to the start of the range if no data exists yet
        setSelectedWeek(phase.weekRange[0]);
      }
    }
  };

  // Helper to remove undefined values (Firestore doesn't support them)
  const removeUndefined = (obj) => {
    if (obj === undefined) return null;
    if (obj === null) return null;
    if (typeof obj !== 'object') return obj;
    
    // Check for Firestore Timestamp (has toMillis method) or Date
    if ((obj.toMillis && typeof obj.toMillis === 'function') || obj instanceof Date) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(removeUndefined);
    }
    
    const newObj = {};
    Object.keys(obj).forEach(key => {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = removeUndefined(value);
      } else {
        newObj[key] = null;
      }
    });
    return newObj;
  };

  const handleSaveDay = async (updatedDay) => {
    try {
      const cleanDay = removeUndefined(updatedDay);
      const ref = doc(db, 'daily_plan_v1', cleanDay.id);
      await setDoc(ref, {
        ...cleanDay,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      setDays(prev => prev.map(d => d.id === cleanDay.id ? cleanDay : d));
      setEditingDay(null);
    } catch (error) {
      console.error("Error saving day:", error);
      alert("Failed to save day. Check console for details.");
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
      {/* Header with Phase Selector */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-corporate-navy flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Daily Plan Manager
            </h2>
            <p className="text-slate-500 text-sm">
              Manage the day-by-day journey. {days.length} days defined.
            </p>
          </div>
        </div>
        
        {/* Phase Tabs - Primary Navigation */}
        <div className="flex gap-2 mb-4">
          {Object.values(PHASES).map(phase => (
            <button
              key={phase.id}
              onClick={() => handlePhaseChange(phase.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all
                ${selectedPhase === phase.id 
                  ? `${phase.activeColor} text-white shadow-md` 
                  : `${phase.bgColor} ${phase.textColor} hover:opacity-80 border ${phase.borderColor}`
                }
              `}
            >
              <span>{phase.emoji}</span>
              <span>{phase.name}</span>
              <span className={`
                text-xs px-1.5 py-0.5 rounded-full
                ${selectedPhase === phase.id ? 'bg-white/20' : 'bg-black/5'}
              `}>
                {weekNumbers.filter(w => w >= phase.weekRange[0] && w <= phase.weekRange[1]).length} wks
              </span>
            </button>
          ))}
        </div>
        
        {/* Week/Section Selector - Context-aware based on phase */}
        {selectedPhase === 'prep' ? (
          // PREP PHASE: Section selector (Required Prep vs Explore Your Tools)
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase">SECTION:</span>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              {Object.values(PREP_SECTIONS).map(section => (
                <button
                  key={section.id}
                  onClick={() => setSelectedPrepSection(section.id)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all
                    ${selectedPrepSection === section.id 
                      ? `${section.activeColor} text-white` 
                      : 'hover:bg-white text-slate-600'
                    }
                  `}
                >
                  <span>{section.emoji}</span>
                  <span>{section.name}</span>
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded-full
                    ${selectedPrepSection === section.id ? 'bg-white/20' : 'bg-black/5'}
                  `}>
                    {section.id === 'required' ? requiredPrepDays.length : additionalPrepDays.length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // DEV/POST PHASE: Week-based selector
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase">Week:</span>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => {
                  const currentIdx = phaseWeekNumbers.indexOf(selectedWeek);
                  if (currentIdx > 0) setSelectedWeek(phaseWeekNumbers[currentIdx - 1]);
                }}
                disabled={phaseWeekNumbers.indexOf(selectedWeek) === 0 || phaseWeekNumbers.length === 0}
                className="p-1.5 hover:bg-white rounded-md disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Week Pills */}
              <div className="flex gap-1 px-2">
                {phaseWeekNumbers.length > 0 ? (
                  phaseWeekNumbers.map(weekNum => (
                    <button
                      key={weekNum}
                      onClick={() => setSelectedWeek(weekNum)}
                      className={`
                        px-3 py-1 rounded-md text-xs font-bold transition-all
                        ${selectedWeek === weekNum 
                          ? `${currentPhase.activeColor} text-white` 
                          : 'hover:bg-white text-slate-600'
                        }
                      `}
                    >
                      {selectedPhase === 'dev' 
                        ? `Wk ${weekNum}` 
                        : `W${weekNum - 8}`
                      }
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 px-2">No weeks defined</span>
                )}
              </div>
              
              <button 
                onClick={() => {
                  const currentIdx = phaseWeekNumbers.indexOf(selectedWeek);
                  if (currentIdx < phaseWeekNumbers.length - 1) setSelectedWeek(phaseWeekNumbers[currentIdx + 1]);
                }}
                disabled={phaseWeekNumbers.indexOf(selectedWeek) === phaseWeekNumbers.length - 1 || phaseWeekNumbers.length === 0}
                className="p-1.5 hover:bg-white rounded-md disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Phase/Section Description Banner */}
      {selectedPhase === 'prep' ? (
        <div className={`px-6 py-2 text-sm font-medium ${PREP_SECTIONS[selectedPrepSection].bgColor} ${PREP_SECTIONS[selectedPrepSection].textColor} border-b ${PREP_SECTIONS[selectedPrepSection].borderColor}`}>
          {PREP_SECTIONS[selectedPrepSection].emoji} {PREP_SECTIONS[selectedPrepSection].description}
        </div>
      ) : (
        <div className={`px-6 py-2 text-sm font-medium ${currentPhase.bgColor} ${currentPhase.textColor} border-b ${currentPhase.borderColor}`}>
          {currentPhase.emoji} {currentPhase.description}
        </div>
      )}

      {/* Day Cards Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {currentWeekDays.map((day, idx) => {
            // For prep phase, show sequential item numbers within the section
            const displayDay = selectedPhase === 'prep' 
              ? idx + 1 
              : day.dayNumber - (currentPhase.dayOffset || 0);
            
            return (
              <DayCard 
                key={day.id} 
                day={day} 
                displayDayNumber={displayDay}
                onEdit={setEditingDay} 
              />
            );
          })}
          {currentWeekDays.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-400">
              {selectedPhase === 'prep' ? (
                <>
                  <p className="text-lg font-medium mb-2">No Required Prep items found</p>
                  <p className="text-sm">Configure prep content in the daily_plan_v1 collection.</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">No days found for Week {selectedWeek}</p>
                  <p className="text-sm">Days for this phase haven't been configured yet.</p>
                </>
              )}
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
            displayDayNumber={editingDay.dayNumber - (currentPhase.dayOffset || 0)}
          />
        </div>
      )}
    </div>
  );
};

export default DailyPlanManager;
