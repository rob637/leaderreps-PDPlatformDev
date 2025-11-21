import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, FlaskConical, ArrowUp, ArrowDown, Edit3, Plus, Trash2, RefreshCw, Save, Flame, Bell, Target, Calendar, Moon, BookOpen, Play, Book, Video, FileText, Users, MessageSquare, UserPlus, Search, Radio, History, BarChart2, Bot, Cpu, Dumbbell, TrendingUp } from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import { useWidgetEditor } from '../../providers/WidgetEditorProvider';
import { WIDGET_TEMPLATES, FEATURE_METADATA } from '../../config/widgetTemplates';

const FeatureManager = () => {
  const { features, toggleFeature, updateFeatureOrder, saveFeature, deleteFeature, isFeatureEnabled } = useFeatures();
  const { openEditor } = useWidgetEditor();
  const [isAdding, setIsAdding] = useState(false);
  const [newWidget, setNewWidget] = useState({ name: '', id: '', group: 'dashboard', description: '' });
  const [activeGroup, setActiveGroup] = useState('dashboard');

  const initialGroups = {
    header: ['dashboard-header'],
    dashboard: ['identity-builder', 'habit-stack', 'win-the-day', 'gamification', 'exec-summary', 'calendar-sync', 'weekly-focus', 'notifications', 'scorecard', 'pm-bookend'],
    'development-plan': ['dev-plan-header', 'dev-plan-stats', 'dev-plan-actions', 'dev-plan-focus-areas', 'dev-plan-goal'],
    content: ['course-library', 'reading-hub', 'leadership-videos', 'strat-templates'],
    community: ['community-feed', 'my-discussions', 'mastermind', 'mentor-match', 'live-events'],
    coaching: ['practice-history', 'progress-analytics', 'ai-roleplay', 'scenario-sim', 'feedback-gym', 'roi-report'],
    locker: ['locker-wins-history', 'locker-scorecard-history', 'locker-latest-reflection']
  };

  // Group features dynamically
  const groups = {
    header: [],
    dashboard: [],
    'development-plan': [],
    content: [],
    community: [],
    coaching: [],
    locker: []
  };

  // 1. Determine canonical order of IDs to prevent jumping
  // Start with Metadata keys to preserve default order
  const orderedIds = Object.keys(FEATURE_METADATA);
  // Append any custom IDs from DB that aren't in metadata
  Object.keys(features).forEach(id => {
    if (!FEATURE_METADATA[id]) {
      orderedIds.push(id);
    }
  });

  // 2. Iterate and populate groups
  orderedIds.forEach((id, index) => {
    // Prefer DB data, fallback to metadata/defaults
    const dbData = features[id];
    const meta = FEATURE_METADATA[id] || {};
    const templateCode = WIDGET_TEMPLATES[id] || '';

    // Determine group
    let group = 'dashboard';
    if (dbData && dbData.group) {
      group = dbData.group;
    } else {
      // Fallback to initialGroups mapping
      if (initialGroups.header.includes(id)) group = 'header';
      else if (initialGroups['development-plan'].includes(id)) group = 'development-plan';
      else if (initialGroups.content.includes(id)) group = 'content';
      else if (initialGroups.community.includes(id)) group = 'community';
      else if (initialGroups.coaching.includes(id)) group = 'coaching';
      else if (initialGroups.locker.includes(id)) group = 'locker';
      else if (initialGroups.dashboard.includes(id)) group = 'dashboard';
    }

    // Construct feature object
    const featureObj = {
      id,
      name: dbData?.name || meta.name || id,
      description: dbData?.description || meta.description || '',
      enabled: dbData ? dbData.enabled : true, // Default to enabled if not in DB
      order: dbData?.order ?? 999,
      code: dbData?.code || templateCode,
      isUnsaved: !dbData, // Flag to indicate it's using default/template
      originalIndex: index // Tie-breaker for stable sorting
    };

    if (groups[group]) {
      groups[group].push(featureObj);
    }
  });

  // Sort groups with stability
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => {
        const orderDiff = a.order - b.order;
        if (orderDiff !== 0) return orderDiff;
        return a.originalIndex - b.originalIndex;
    });
  });

  const handleSyncDefaults = async () => {
    if (!window.confirm('This will populate the database with default widgets. Continue?')) return;
    
    for (const [id, meta] of Object.entries(FEATURE_METADATA)) {
       if (!features[id] || !features[id].name) {
         await saveFeature(id, {
           name: meta.name,
           description: meta.description,
           code: WIDGET_TEMPLATES[id] || '',
           group: initialGroups.dashboard.includes(id) ? 'dashboard' : 
                  initialGroups.header.includes(id) ? 'header' :
                  initialGroups.content.includes(id) ? 'content' :
                  initialGroups.community.includes(id) ? 'community' : 
                  initialGroups.coaching.includes(id) ? 'coaching' : 
                  initialGroups.locker.includes(id) ? 'locker' : 
                  initialGroups['development-plan'].includes(id) ? 'development-plan' : 'dashboard',
           enabled: true,
           order: 999
         });
       }
    }
    alert('Defaults synced!');
  };

  const handleAddWidget = async () => {
    if (!newWidget.name || !newWidget.id) return;
    
    // Calculate max order to put at bottom
    const currentGroupList = groups[newWidget.group] || [];
    const maxOrder = currentGroupList.reduce((max, item) => Math.max(max, item.order), 0);

    await saveFeature(newWidget.id, {
      ...newWidget,
      code: '<div className="p-4 bg-white rounded-lg shadow border border-gray-200"><h3>New Widget</h3><p>Start editing...</p></div>',
      enabled: true,
      order: maxOrder + 10
    });
    setIsAdding(false);
    setNewWidget({ name: '', id: '', group: 'dashboard', description: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      await deleteFeature(id);
    }
  };

  const handleMove = (groupKey, index, direction) => {
    const currentList = [...groups[groupKey]];
    if (direction === 'up' && index > 0) {
      [currentList[index], currentList[index - 1]] = [currentList[index - 1], currentList[index]];
    } else if (direction === 'down' && index < currentList.length - 1) {
      [currentList[index], currentList[index + 1]] = [currentList[index + 1], currentList[index]];
    } else {
      return;
    }
    
    // Update orders
    currentList.forEach((item, idx) => {
        saveFeature(item.id, { ...features[item.id], order: idx });
    });
  };

  const handleToggleAll = async () => {
    const currentGroupWidgets = groups[activeGroup];
    if (!currentGroupWidgets || currentGroupWidgets.length === 0) return;

    // Check if all are enabled
    const allEnabled = currentGroupWidgets.every(w => w.enabled);
    const newState = !allEnabled; // If all enabled, disable all. Otherwise enable all.

    if (!window.confirm(`Are you sure you want to ${newState ? 'ENABLE' : 'DISABLE'} all widgets in ${groupTitles[activeGroup]}?`)) return;

    // We need to update each widget
    // Since we don't have a batch update function exposed, we'll loop.
    // Ideally, we'd add a batch update to FeatureProvider, but this works for now.
    for (const widget of currentGroupWidgets) {
        if (widget.enabled !== newState) {
             if (widget.isUnsaved) {
                await saveFeature(widget.id, {
                    name: widget.name,
                    description: widget.description,
                    code: widget.code,
                    group: activeGroup,
                    enabled: newState,
                    order: widget.order
                });
            } else {
                await toggleFeature(widget.id, newState);
            }
        }
    }
  };

  const groupTitles = {
    header: 'Header',
    dashboard: 'Dashboard',
    'development-plan': 'Development Plan',
    content: 'Content',
    community: 'Community',
    coaching: 'Coaching',
    locker: 'Locker'
  };

  const MOCK_SCOPE = {
    user: { displayName: 'Admin User' },
    greeting: 'Hey, Admin.',
    dailyQuote: 'Leadership is not about being in charge. It is about taking care of those in your charge.|Simon Sinek',
    allQuotes: [
      'Leadership is not about being in charge. It is about taking care of those in your charge.|Simon Sinek',
      'Innovation distinguishes between a leader and a follower.|Steve Jobs',
      'A leader is one who knows the way, goes the way, and shows the way.|John C. Maxwell'
    ],
    weeklyFocus: 'Strategic Planning',
    scorecard: {
      reps: { done: 3, total: 5, pct: 60 },
      win: { done: 1, total: 1, pct: 100 }
    },
    streakCount: 12,
    dailyRepName: 'Active Listening',
    dailyRepCompleted: false,
    amWinCompleted: true,
    morningWIN: 'Finish the Q3 Report',
    otherTasks: [
      { id: 1, text: 'Email the team', completed: false },
      { id: 2, text: 'Review budget', completed: true }
    ],
    reflectionGood: 'Had a great meeting.',
    reflectionBetter: 'Need to be more concise.',
    isSavingBookend: false,
    isSavingWIN: false,
    isWinSaved: false,
    hasLIS: true,
    lisRead: false,
    additionalCommitments: [],
    navigate: (path) => console.log(`Navigating to: ${path}`),
    handleHabitCheck: (key, val) => console.log(`Habit Check: ${key} = ${val}`),
    setIsAnchorModalOpen: (val) => console.log(`Anchor Modal: ${val}`),
    setIsCalendarModalOpen: (val) => console.log(`Calendar Modal: ${val}`),
    handleToggleAdditionalRep: (id, status) => console.log(`Toggle Rep: ${id} -> ${status}`),
    setMorningWIN: (val) => console.log(`Set WIN: ${val}`),
    handleSaveWINWrapper: () => console.log('Save WIN'),
    handleToggleWIN: () => console.log('Toggle WIN'),
    handleToggleTask: (id) => console.log(`Toggle Task: ${id}`),
    handleRemoveTask: (id) => console.log(`Remove Task: ${id}`),
    setNewTaskText: (val) => console.log(`New Task Text: ${val}`),
    handleAddOtherTask: () => console.log('Add Other Task'),
    setReflectionGood: (val) => console.log(`Reflection Good: ${val}`),
    setReflectionBetter: (val) => console.log(`Reflection Better: ${val}`),
    handleSaveEveningBookend: () => console.log('Save Evening Bookend'),
    // Mock Components
    Checkbox: ({ checked, label, subLabel, onChange }) => (
      <div onClick={onChange} className="p-2 border rounded cursor-pointer hover:bg-gray-50">
        <div className="font-bold flex items-center gap-2">
          <div className={`w-4 h-4 border ${checked ? 'bg-teal-500' : 'bg-white'}`} />
          {label}
        </div>
        {subLabel && <div className="text-xs text-gray-500 ml-6">{subLabel}</div>}
      </div>
    )
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy font-serif">Widget Lab</h2>
          <p className="text-gray-500 text-sm">Manage, design, and deploy widgets for each module.</p>
        </div>
        <div className="flex gap-2">
            <select
              value={activeGroup}
              onChange={(e) => setActiveGroup(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              {Object.entries(groupTitles).map(([key, title]) => (
                <option key={key} value={key}>{title}</option>
              ))}
            </select>

            <button 
                onClick={handleToggleAll}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors"
                title={`Toggle all widgets in ${groupTitles[activeGroup]}`}
            >
                {groups[activeGroup]?.every(w => w.enabled) ? (
                    <>
                        <ToggleRight className="w-4 h-4 text-corporate-teal" /> Disable All
                    </>
                ) : (
                    <>
                        <ToggleLeft className="w-4 h-4 text-gray-400" /> Enable All
                    </>
                )}
            </button>

            <button 
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors"
            >
                <Plus className="w-4 h-4" /> Add Widget
            </button>
            <button 
                onClick={handleSyncDefaults}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg flex items-center gap-2 hover:bg-slate-200 transition-colors"
                title="Restore default widgets to database"
            >
                <RefreshCw className="w-4 h-4" /> Sync Defaults
            </button>
        </div>
      </div>

      {/* Add Widget Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-96 space-y-4">
                <h3 className="font-bold text-lg">Add New Widget</h3>
                <input 
                    className="w-full p-2 border rounded" 
                    placeholder="Widget Name" 
                    value={newWidget.name}
                    onChange={e => setNewWidget({...newWidget, name: e.target.value, id: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                />
                <input 
                    className="w-full p-2 border rounded" 
                    placeholder="Widget ID" 
                    value={newWidget.id}
                    onChange={e => setNewWidget({...newWidget, id: e.target.value})}
                />
                <select 
                    className="w-full p-2 border rounded"
                    value={newWidget.group}
                    onChange={e => setNewWidget({...newWidget, group: e.target.value})}
                >
                    <option value="header">Header</option>
                    <option value="dashboard">Dashboard</option>
                    <option value="content">Content</option>
                    <option value="community">Community</option>
                    <option value="coaching">Coaching</option>
                    <option value="locker">Locker</option>
                    <option value="development-plan">Development Plan</option>
                </select>
                <textarea 
                    className="w-full p-2 border rounded" 
                    placeholder="Description" 
                    value={newWidget.description}
                    onChange={e => setNewWidget({...newWidget, description: e.target.value})}
                />
                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                    <button onClick={handleAddWidget} className="px-4 py-2 bg-teal-600 text-white rounded">Add</button>
                </div>
            </div>
        </div>
      )}

      <div className="space-y-8">
        {Object.keys(groups)
          .filter(key => key === activeGroup)
          .map((groupKey) => (
          <div key={groupKey} className="space-y-4">
            <h3 className="text-lg font-bold text-gray-700 border-b border-gray-200 pb-2">
              {groupTitles[groupKey]}
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {groups[groupKey].length === 0 && (
                  <p className="text-gray-400 italic">No widgets in this group.</p>
              )}
              {groups[groupKey].map((feature, index) => (
                  <div key={feature.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      {/* Reorder Controls */}
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleMove(groupKey, index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-corporate-navy disabled:opacity-30"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleMove(groupKey, index, 'down')}
                          disabled={index === groups[groupKey].length - 1}
                          className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-corporate-navy disabled:opacity-30"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <h4 
                            className="font-bold text-corporate-navy text-lg cursor-pointer hover:text-teal-600 hover:underline decoration-dotted underline-offset-4"
                            onClick={() => {
                                console.log('Opening editor for:', feature.name);
                                openEditor({
                                  widgetId: feature.id,
                                  widgetName: feature.name,
                                  scope: MOCK_SCOPE, 
                                  initialCode: feature.code
                                });
                            }}
                            title="Click to edit widget design"
                          >
                            {feature.name}
                          </h4>
                          <button 
                            onClick={() => {
                                console.log('Opening editor (button) for:', feature.name);
                                openEditor({
                                  widgetId: feature.id,
                                  widgetName: feature.name,
                                  scope: MOCK_SCOPE,
                                  initialCode: feature.code
                                });
                            }}
                            className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-colors"
                            title="Edit Widget Design"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {feature.enabled ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">Active</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">Disabled</span>
                          )}
                          {feature.isUnsaved && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase">Default</span>
                          )}
                        </div>
                        <p className="text-gray-500 mt-1 text-sm">{feature.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <button 
                        onClick={() => {
                            // If unsaved, we need to save the full object first
                            if (feature.isUnsaved) {
                                saveFeature(feature.id, {
                                    name: feature.name,
                                    description: feature.description,
                                    code: feature.code,
                                    group: activeGroup,
                                    enabled: !feature.enabled,
                                    order: feature.order
                                });
                            } else {
                                toggleFeature(feature.id, !feature.enabled);
                            }
                        }}
                        className={`
                            transition-colors duration-200
                            ${feature.enabled ? 'text-corporate-teal' : 'text-gray-300 hover:text-gray-400'}
                        `}
                        >
                        {feature.enabled ? (
                            <ToggleRight className="w-10 h-10" />
                        ) : (
                            <ToggleLeft className="w-10 h-10" />
                        )}
                        </button>
                        <button 
                            onClick={() => handleDelete(feature.id)}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            title="Delete Widget"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm text-yellow-800">
        <strong>Note:</strong> Feature toggles and order are persisted globally via Firestore. Changes affect all users immediately.
      </div>
    </div>
  );
};

export default FeatureManager;
