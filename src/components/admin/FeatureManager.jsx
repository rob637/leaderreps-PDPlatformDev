import React, { useState, useEffect } from 'react';
import { 
  ToggleLeft, ToggleRight, FlaskConical, ArrowUp, ArrowDown, Edit3, Plus, Trash2, RefreshCw, Save, Flame, Bell, Target, Calendar, Moon, BookOpen, Play, Book, Video, FileText, Users, MessageSquare, UserPlus, Search, Radio, History, BarChart2, Bot, Cpu, Dumbbell, TrendingUp,
  CheckSquare, Square, X, Trophy, ChevronRight, ArrowRight, Loader
} from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import { useWidgetEditor } from '../../providers/WidgetEditorProvider';
import { WIDGET_TEMPLATES, FEATURE_METADATA } from '../../config/widgetTemplates';
import { useAppServices } from '../../services/useAppServices';
import { useDashboard } from '../screens/dashboard/DashboardHooks';
import { createWidgetSDK } from '../../services/WidgetSDK';

const FeatureManager = () => {
  const { features, toggleFeature, updateFeatureOrder, saveFeature, deleteFeature, isFeatureEnabled } = useFeatures();
  const { openEditor } = useWidgetEditor();
  const { 
    user, 
    dailyPracticeData, 
    updateDailyPracticeData,
    developmentPlanData,
    globalMetadata,
    userData,
    navigate
  } = useAppServices();

  // --- HOOKS FOR REAL DATA ---
  const {
    // Identity & Anchors
    identityStatement,
    habitAnchor,
    whyStatement,
    handleSaveIdentity,
    handleSaveHabit,
    handleSaveWhy,
    
    // AM Bookend (Win the Day)
    morningWIN,
    setMorningWIN,
    otherTasks,
    handleAddTask,
    handleToggleTask,
    handleRemoveTask,
    handleToggleWIN,
    handleSaveWIN,
    isSavingWIN,
    amWinCompleted,
    
    // PM Bookend (Reflection)
    reflectionGood,
    setReflectionGood,
    reflectionBetter,
    setReflectionBetter,
    handleSaveEveningBookend,
    isSavingBookend,
    
    // Habits / Reps
    habitsCompleted,
    handleHabitToggle,
    
    // Streak
    streakCount,
    
    // Additional Reps
    additionalCommitments,
    handleToggleAdditionalRep,

    // Scorecard
    scorecard
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData,
    globalMetadata
  });

  // --- DERIVED DATA FOR SCOPE ---
  // NO MOCK DATA - If data is missing, pass null/undefined so the widget knows.
  const greeting = user?.displayName ? `Hey, ${user.displayName.split(' ')[0]}.` : null;
  
  const dailyQuote = React.useMemo(() => {
    const quotes = globalMetadata?.SYSTEM_QUOTES || [];
    if (quotes.length === 0) return null;
    const today = new Date().getDate();
    return quotes[today % quotes.length];
  }, [globalMetadata]);

  const weeklyFocus = globalMetadata?.weeklyFocus || developmentPlanData?.currentPlan?.focusAreas?.[0]?.name || null;
  const hasLIS = !!identityStatement;
  const lisRead = habitsCompleted?.readLIS || false;
  
  const dailyRepName = React.useMemo(() => {
    const repId = dailyPracticeData?.dailyTargetRepId;
    if (!repId) return null;
    const catalog = Array.isArray(globalMetadata?.REP_LIBRARY) ? globalMetadata.REP_LIBRARY : [];
    const rep = catalog.find(r => r.id === repId);
    return rep ? rep.name : repId;
  }, [dailyPracticeData, globalMetadata]);

  const dailyRepCompleted = habitsCompleted?.completedDailyRep || false;

  // --- MOCK HANDLERS FOR EDITOR (To prevent actual DB writes during preview if desired, or use real ones) ---
  // The user requested REAL data. We will pass the real handlers, but maybe wrap them to log?
  // Actually, for the editor, we might want to prevent accidental saves. 
  // But the user said "NO MOCK DATA". Let's pass the real state, but maybe mock the *save* functions 
  // so they don't actually write to DB while editing? 
  // Or just pass them as is. The user is an admin, they might want to test functionality.
  // However, `WidgetEditorModal` proxies functions to log them. 
  // Let's pass the real functions. The proxy in `WidgetEditorModal` will intercept them and log them, 
  // AND execute them (it calls `scope[key](...args)`).
  // So if we pass real functions, they WILL execute.
  // This might be dangerous if the user clicks "Save" in the preview.
  // But for "reading" data (like quotes), it's fine.
  
  const sdk = React.useMemo(() => createWidgetSDK({ navigate, user }), [navigate, user]);

  // Mock Checkbox for the editor preview if needed, or use a real one.
  // Dashboard4 defines a local Checkbox component. We should probably provide a generic one in the scope.
  const Checkbox = ({ checked, onChange, label, subLabel, disabled }) => (
    <div 
      onClick={!disabled ? onChange : undefined}
      className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
        checked 
          ? 'bg-teal-50 border-teal-500' 
          : 'bg-white border-gray-200 hover:border-teal-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center border-2 transition-colors ${
        checked ? 'bg-teal-500 border-teal-500' : 'bg-white border-gray-300'
      }`}>
        {checked && <CheckSquare className="w-4 h-4 text-white" />}
      </div>
      <div className="flex-1">
        <p className={`font-semibold ${checked ? 'text-teal-900' : 'text-gray-700'}`}>
          {label}
        </p>
        {subLabel && (
          <p className="text-xs text-gray-500 mt-0.5">{subLabel}</p>
        )}
      </div>
    </div>
  );

  const REAL_SCOPE = {
    // SDK
    sdk,

    // Icons
    CheckSquare, Square, Plus, Save, X, Trophy, Flame, 
    MessageSquare, Bell, Calendar, ChevronRight, ArrowRight,
    Edit3, Loader,
    
    // Components
    Checkbox,
    
    // Functions
    navigate,
    // We wrap these to ensure they work in the isolated scope if needed, 
    // but passing them directly is usually fine.
    handleHabitCheck: (key, val) => handleHabitToggle(key, val), // This one was wrapped in Dashboard4
    setIsAnchorModalOpen: () => console.log('Open Anchor Modal (Mocked for Editor)'),
    setIsCalendarModalOpen: () => console.log('Open Calendar Modal (Mocked for Editor)'),
    handleToggleAdditionalRep,
    setMorningWIN,
    handleSaveWINWrapper: handleSaveWIN, // Dashboard4 wrapper just added a timeout
    handleToggleWIN,
    handleToggleTask,
    handleRemoveTask,
    setNewTaskText: () => {}, // Local state in Dashboard4
    handleAddOtherTask: () => {}, // Local state in Dashboard4
    setReflectionGood,
    setReflectionBetter,
    handleSaveEveningBookend,
    
    // State
    weeklyFocus,
    hasLIS,
    lisRead,
    dailyRepName,
    dailyRepCompleted,
    additionalCommitments,
    amWinCompleted,
    morningWIN,
    isSavingWIN,
    isWinSaved: false, // Local state
    otherTasks,
    newTaskText: '', // Local state
    scorecard,
    streakCount,
    reflectionGood,
    reflectionBetter,
    isSavingBookend,
    
    // User Data
    user,
    greeting,
    dailyQuote,
    allQuotes: globalMetadata?.SYSTEM_QUOTES || []
  };

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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Feature Manager
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Manage and customize your dashboard features.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Sync Defaults Button */}
          <button 
            onClick={handleSyncDefaults} 
            className="flex items-center justify-center px-4 py-2 text-sm sm:text-base font-semibold rounded-lg bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Sync Default Widgets
          </button>
        </div>
      </div>

      {/* Groups Navigation - Desktop */}
      <div className="hidden sm:flex sm:gap-4 mb-6">
        {Object.keys(groups).map((key) => (
          <button
            key={key}
            onClick={() => setActiveGroup(key)}
            className={`flex-1 px-4 py-2 text-sm sm:text-base font-semibold rounded-lg transition-all 
              ${activeGroup === key 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {groupTitles[key]}
          </button>
        ))}
      </div>

      {/* Active Group Features */}
      <div>
        {/* Group Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {groupTitles[activeGroup]} Features
          </h2>
          <button 
            onClick={() => setIsAdding(true)} 
            className="flex items-center px-3 py-2 text-sm sm:text-base font-semibold rounded-lg bg-green-600 text-white shadow-md hover:bg-green-700 transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Widget
          </button>
        </div>

        {/* Features List */}
        <div className="space-y-4">
          {(groups[activeGroup] || []).map((feature, index) => (
            <div key={feature.id} className="p-4 bg-white rounded-lg shadow border border-gray-200">
              {/* Feature Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{feature.name}</h3>
                  <p className="text-xs text-gray-500">{feature.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {/* Move Up/Down Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleMove(activeGroup, index, 'up')} 
                      disabled={index === 0}
                      className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleMove(activeGroup, index, 'down')} 
                      disabled={index === (groups[activeGroup].length - 1)}
                      className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Toggle Feature Button */}
                  <button 
                    onClick={() => toggleFeature(feature.id)} 
                    className={`p-2 rounded-full transition-all 
                      ${feature.enabled 
                        ? 'bg-red-100 text-red-500 hover:bg-red-200' 
                        : 'bg-green-100 text-green-500 hover:bg-green-200'
                      }`}
                  >
                    {feature.enabled ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {/* Edit Button */}
                  <button 
                    onClick={() => openEditor(feature.id)} 
                    className="p-2 rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200 transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(feature.id)} 
                    className="p-2 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Feature Content (Preview) */}
              <div className="text-sm text-gray-700">
                {feature.code ? (
                  <div dangerouslySetInnerHTML={{ __html: feature.code }} />
                ) : (
                  <p className="italic text-gray-400">No preview available. This widget may require additional configuration.</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* No features message */}
        {groups[activeGroup]?.length === 0 && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              No features found in this group. Widgets that you add will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      {isAdding && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4">Add New Widget</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget Name
              </label>
              <input 
                type="text" 
                value={newWidget.name} 
                onChange={(e) => setNewWidget({ ...newWidget, name: e.target.value })} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter widget name"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Widget ID
              </label>
              <input 
                type="text" 
                value={newWidget.id} 
                onChange={(e) => setNewWidget({ ...newWidget, id: e.target.value })} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter widget ID"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea 
                value={newWidget.description} 
                onChange={(e) => setNewWidget({ ...newWidget, description: e.target.value })} 
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Enter widget description"
                rows="3"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsAdding(false)} 
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddWidget} 
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white shadow-md hover:bg-green-700 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Widget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureManager;
