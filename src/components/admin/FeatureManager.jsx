import React, { useState } from 'react';
import { 
  ToggleLeft, ToggleRight, FlaskConical, ArrowUp, ArrowDown, Plus, Trash2, RefreshCw, Save, Flame, Bell, Target, Calendar, Moon, BookOpen, Play, Book, Video, FileText, Users, MessageSquare, UserPlus, Search, Radio, History, BarChart2, Bot, Cpu, Dumbbell, TrendingUp,
  CheckSquare, Square, X, Trophy, ChevronRight, ArrowRight, Loader, Eye, EyeOff, Settings, Lightbulb, Zap, Crosshair, Flag, Circle, PenTool, CheckCircle, Edit3
} from 'lucide-react';
import { useFeatures } from '../../providers/FeatureProvider';
import { WIDGET_TEMPLATES, FEATURE_METADATA } from '../../config/widgetTemplates';
import { useAppServices } from '../../services/useAppServices';
import { useDashboard } from '../screens/dashboard/DashboardHooks';
import { useDevPlan } from '../../hooks/useDevPlan';
import { createWidgetSDK } from '../../services/WidgetSDK';
import { Card } from '../ui';
import { Button, ProgressBar } from '../screens/developmentplan/DevPlanComponents';
import { ENHANCEMENT_IDEAS } from '../../data/enhancementIdeas';

const FeatureManager = () => {
  const { features, toggleFeature, updateFeatureOrder, isFeatureEnabled, saveFeature, deleteFeature } = useFeatures();
  const { 
    user, 
    dailyPracticeData, 
    updateDailyPracticeData,
    developmentPlanData,
    globalMetadata,
    navigate
  } = useAppServices();

  // --- DEV PLAN HOOK ---
  const { currentWeek: devPlanCurrentWeek, userState: devPlanUserState, simulatedNow } = useDevPlan();
  const currentWeekNumber = devPlanUserState?.currentWeekIndex != null 
    ? devPlanUserState.currentWeekIndex + 1 
    : null;

  // --- HOOKS FOR REAL DATA ---
  const {
    // Identity & Anchors
    identityStatement,
    setIdentityStatement,
    handleSaveIdentity,
    habitAnchor,
    setHabitAnchor,
    handleSaveHabit,
    whyStatement,
    setWhyStatement,
    handleSaveWhy,
    
    // AM Bookend (Win the Day)
    morningWIN,
    setMorningWIN,
    morningWins, // New Array - REAL DATA
    setMorningWins,
    handleUpdateWin, // REAL HANDLER
    handleSaveSingleWin, // REAL HANDLER
    handleToggleWinComplete, // REAL HANDLER
    handleSaveAllWins, // REAL HANDLER
    otherTasks,
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
    reflectionBest,
    setReflectionBest,
    handleSaveEveningBookend,
    isSavingBookend,
    
    // Habits / Reps
    habitsCompleted,
    handleHabitToggle,
    handleSaveReps,
    
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
    // Core
    React,

    // SDK
    sdk,

    // Icons
    CheckSquare, Square, Plus, Save, X, Trophy, Flame, 
    MessageSquare, Bell, Calendar, ChevronRight, ArrowRight,
    Edit3, Loader, PenTool,
    
    // Components
    Checkbox,
    Card,
    
    // Functions
    navigate,
    isFeatureEnabled,
    // We wrap these to ensure they work in the isolated scope if needed, 
    // but passing them directly is usually fine.
    handleHabitCheck: (key, val) => handleHabitToggle(key, val), // This one was wrapped in Dashboard4
    handleSaveReps,
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
    setReflectionBest,
    handleSaveEveningBookend,
    
    // Identity & Anchors Handlers
    setIdentityStatement,
    handleSaveIdentity,
    setHabitAnchor,
    handleSaveHabit,
    setWhyStatement,
    handleSaveWhy,
    
    // New Win Functions (Real Data from useDashboard)
    handleUpdateWin,
    handleSaveSingleWin,
    handleToggleWinComplete,
    
    // State
    weeklyFocus,
    currentWeekNumber,
    simulatedNow,
    devPlanCurrentWeek,
    hasLIS,
    lisRead,
    dailyRepName,
    dailyRepCompleted,
    additionalCommitments,
    amWinCompleted,
    morningWIN,
    morningWins, // Real data from useDashboard, not mock
    isSavingWIN,
    isWinSaved: false, // Local state
    otherTasks,
    newTaskText: '', // Local state
    scorecard,
    streakCount,
    reflectionGood,
    reflectionBetter,
    reflectionBest,
    isSavingBookend,
    
    // Identity & Anchors State
    identityStatement,
    habitAnchor,
    whyStatement,
    
    // Development Plan Data (Mocked)
    developmentPlanData: {
        reps: [
            { id: 'r1', label: 'Review Calendar', time: '2m' },
            { id: 'r2', label: 'Check Team Pulse', time: '5m' },
            { id: 'r3', label: 'Clear Inbox', time: '15m' }
        ]
    },
    
    // User Data
    user: user ? {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    } : null,
    greeting,
    dailyQuote,
    allQuotes: globalMetadata?.SYSTEM_QUOTES || []
  };

  const getScopeForWidget = (widgetId) => {
    if (widgetId === 'daily-quote') {
      return {
        allQuotes: globalMetadata?.SYSTEM_QUOTES || [],
        dailyQuote,
        options: features[widgetId]?.options || {},
        // Minimal common tools
        React,
      };
    }

    if (widgetId.startsWith('dev-plan-') || widgetId === 'development-plan') {
      return {
        ...REAL_SCOPE,
        options: features[widgetId]?.options || {},
        // Mock Data for Development Plan Widgets
        plan: {
          focusAreas: [
            { name: 'Strategic Thinking', why: 'To lead better.', reps: [1,2], courses: [1] }
          ],
          openEndedAnswer: 'Become a better leader.'
        },
        summary: {
          totalSkills: 10,
          completedSkills: 2,
          currentWeek: 3,
          progress: 20
        },
        cycle: 1,
        currentWeek: {
          title: 'Week 3',
          focus: 'Strategy',
          phase: 'Execution',
          description: 'Focus on strategy.',
          content: [],
          community: [],
          coaching: []
        },
        userProgress: {
          completedItems: [],
          reflectionResponse: ''
        },
        handleEdit: () => console.log('Edit Plan'),
        handleShowBreakdown: () => console.log('Show Breakdown'),
        handleScan: () => console.log('Scan'),
        handleTimeline: () => console.log('Timeline'),
        handleDetail: () => console.log('Detail'),
        handleItemToggle: () => console.log('Toggle Item'),
        handleReflectionUpdate: () => console.log('Update Reflection'),
        // Components & Icons
        Button, ProgressBar,
        Zap, Crosshair, Flag, Circle, Video, Users, BookOpen, CheckCircle, MessageSquare
      };
    }

    // Default full scope
    return { ...REAL_SCOPE, options: features[widgetId]?.options || {} };
  };

  const getInputDescriptionsForWidget = (widgetId) => {
    const common = {};

    switch (widgetId) {
      case 'daily-quote':
        return {
          ...common,
          'Input': {
            'allQuotes': 'List of Values (LOV) of System Quotes.',
            'dailyQuote': 'Selected quote for today.'
          },
          'Output': { 'Display': 'No output (Display only).' }
        };
      case 'welcome-message':
        return {
            ...common,
            'Input': { 'greeting': 'User Profile (First Name).' },
            'Output': { 'Display': 'No output (Display only).' }
        };
      case 'weekly-focus':
        return {
          ...common,
          'Input': {
            'developmentPlan': 'Static display based on information from the Development Plan (to be built).'
          },
          'Output': {
            'None': 'No output.'
          }
        };
      case 'daily-leader-reps':
        return {
          ...common,
          'Input': {
            'developmentPlan': 'Reps are loaded from the Development Plan (read-only).',
            'completion': 'Checkbox to mark reps as complete. Saved to temporary file.'
          },
          'Output': {
            'Locker': 'At 11:59:59 PM, completion data is saved to Locker and fields reset for the next day.'
          }
        };
      case 'lis-maker':
        return {
            ...common,
            'Input': { 
                'hasLIS': 'User Profile (Saved Identity Statement).',
                'lisRead': 'Daily Practice Data (Read Status).'
            },
            'Output': { 'User Profile': 'Updates User Profile (Identity Statement).' }
        };
      case 'habit-stack':
        return {
            ...common,
            'Input': {
                'dailyRepName': 'Details from the Development Plan (Target Rep).',
                'dailyRepCompleted': 'Daily Practice Data (Completion Status).'
            },
            'Output': { 'Daily Practice': 'Updates Daily Practice Data (Habit Completion).' }
        };
      case 'grounding-rep':
        return {
          ...common,
          'Input': {
            'leadershipIdentity': 'Input from the Leadership Identity Widget (To be built).'
          },
          'Output': {
            'None': 'No output.'
          }
        };
      case 'win-the-day':
        return {
          ...common,
          'Input': {
            'morningWins': 'User enters 3 high-impact actions. Can be updated throughout the day. Auto-saved temporarily.',
            'completion': 'Checkbox to mark items as complete.'
          },
          'Output': {
            'Locker': 'At 11:59:59 PM, data is saved to Locker and fields reset for the next day.'
          }
        };
      case 'pm-bookend':
        return {
          ...common,
          'Input': {
            'reflectionGood': 'User Input (Reflection Text).',
            'reflectionBetter': 'User Input (Reflection Text).'
          },
          'Output': {
            'Locker': 'Output to Your Locker (Reflection History).'
          }
        };
      case 'scorecard':
        return {
            ...common,
            'Input': {
                'scorecard': 'Calculated from Daily Practice Data (Reps & Wins).',
                'streakCount': 'Calculated from Daily Practice Data (Streak).'
            },
            'Output': { 'Display': 'No output (Display only).' }
        };
      case 'notifications':
        return {
            ...common,
            'Input': { 'notifications': 'System Alerts (Waiting to be built).' },
            'Output': { 'Navigation': 'Navigation to relevant feature.' }
        };
      case 'gamification':
        return {
            ...common,
            'Input': { 'stats': 'User Statistics (XP, Rank - Waiting to be built).' },
            'Output': { 'Display': 'No output.' }
        };
      case 'exec-summary':
        return {
            ...common,
            'Input': { 'data': 'Aggregated User Data (Waiting to be built).' },
            'Output': { 'Display': 'No output.' }
        };
      case 'calendar-sync':
        return {
            ...common,
            'Input': { 'provider': 'External Calendar Provider (Waiting to be built).' },
            'Output': { 'External': 'Syncs to Outlook/Google Calendar.' }
        };
      case 'course-library':
      case 'leadership-videos':
        return {
            ...common,
            'Input': { 'content': 'Content Management System (Videos).' },
            'Output': { 'Player': 'Video Player.' }
        };
      case 'reading-hub':
        return {
            ...common,
            'Input': { 'content': 'Content Management System (Books).' },
            'Output': { 'External': 'External Link/Reader.' }
        };
      case 'strat-templates':
        return {
            ...common,
            'Input': { 'content': 'Content Management System (Files).' },
            'Output': { 'Download': 'File Download.' }
        };
      case 'community-feed':
        return {
            ...common,
            'Input': { 'posts': 'Community Database (Posts).' },
            'Output': { 'Database': 'Updates Community Database (New Post).' }
        };
      case 'my-discussions':
        return {
            ...common,
            'Input': { 'threads': 'Community Database (User Threads).' },
            'Output': { 'Navigation': 'Navigation to Thread.' }
        };
      case 'mastermind':
        return {
            ...common,
            'Input': { 'groups': 'Group Data (Waiting to be built).' },
            'Output': { 'Navigation': 'Navigation to Group.' }
        };
      case 'mentor-match':
        return {
            ...common,
            'Input': { 'mentors': 'Mentor Database (Waiting to be built).' },
            'Output': { 'Request': 'Match Request.' }
        };
      case 'live-events':
        return {
            ...common,
            'Input': { 'schedule': 'Event Schedule (Waiting to be built).' },
            'Output': { 'Stream': 'Video Stream.' }
        };
      case 'practice-history':
        return {
            ...common,
            'Input': { 'logs': 'Practice Logs.' },
            'Output': { 'Display': 'No output.' }
        };
      case 'progress-analytics':
        return {
            ...common,
            'Input': { 'data': 'Performance Data.' },
            'Output': { 'Display': 'No output.' }
        };
      case 'ai-roleplay':
        return {
            ...common,
            'Input': { 'scenarios': 'AI Scenarios.' },
            'Output': { 'Session': 'Practice Session.' }
        };
      case 'scenario-sim':
        return {
            ...common,
            'Input': { 'simulations': 'Simulation Scenarios.' },
            'Output': { 'Results': 'Simulation Results.' }
        };
      case 'feedback-gym':
        return {
            ...common,
            'Input': { 'drills': 'Drill Library.' },
            'Output': { 'Results': 'Drill Results.' }
        };
      case 'roi-report':
        return {
            ...common,
            'Input': { 'metrics': 'Aggregated Metrics.' },
            'Output': { 'Download': 'PDF Download.' }
        };
      case 'locker-wins-history':
        return {
            ...common,
            'Input': { 'history': 'AM Bookend History Data.' },
            'Output': { 'Display': 'No output.' }
        };
      case 'locker-scorecard-history':
        return {
            ...common,
            'Input': { 'history': 'Scorecard History Data.' },
            'Output': { 'Display': 'No output.' }
        };
      case 'locker-latest-reflection':
        return {
            ...common,
            'Input': { 'history': 'PM Bookend History Data.' },
            'Output': { 'Display': 'No output.' }
        };
      default:
        // Check for dev-plan widgets
        if (widgetId.startsWith('dev-plan-') || widgetId === 'development-plan') {
             return {
                ...common,
                'Input': { 'plan': 'Development Plan Data.' },
                'Output': { 'Navigation': 'Navigation/Edit Mode.' }
            };
        }
        return {
          ...common,
          'Input': {
             'globalMetadata': 'Global configuration.'
          },
          'Output': { 'Display': 'No output.' }
        };
    }
  };

  const [isAdding, setIsAdding] = useState(false);
  const [newWidget, setNewWidget] = useState({ name: '', id: '', group: 'dashboard', description: '' });
  const [activeGroup, setActiveGroup] = useState('dashboard');
  const [expandedSettingsId, setExpandedSettingsId] = useState(null);
  const [newOption, setNewOption] = useState({ key: '', value: '' });

  const initialGroups = {
    dashboard: [
      'daily-quote', 'welcome-message', 'lis-maker', 'habit-stack', 'win-the-day', 
      'exec-summary', 'weekly-focus', 'notifications', 'scorecard', 'pm-bookend'
    ],
    'development-plan': [
      'dev-plan-header', 'dev-plan-stats', 'dev-plan-actions', 'dev-plan-focus-areas', 'dev-plan-goal', 'baseline-assessment', 'development-plan'
    ],
    content: [
      'course-library', 'reading-hub', 'leadership-videos', 'strat-templates'
    ],
    community: [
      'community-feed', 'my-discussions', 'mastermind', 'mentor-match', 'live-events'
    ],
    coaching: [
      'practice-history', 'progress-analytics', 'ai-roleplay', 'scenario-sim', 'feedback-gym', 'roi-report'
    ],
    locker: [
      'locker-wins-history', 'locker-scorecard-history', 'locker-latest-reflection',
      'locker-controller', 'locker-reminders', 'locker-reps-history'
    ],
    system: [
      'system-reminders-controller', 'time-traveler', 'admin-access-viewer'
    ]
  };

  // Group features dynamically
  const groups = {
    dashboard: [],
    'development-plan': [],
    content: [],
    community: [],
    coaching: [],
    locker: [],
    system: []
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
    
    // Force development-plan to be in development-plan group if it's in the initialGroups list
    // This overrides DB state if it was incorrectly set to dashboard
    if (initialGroups['development-plan'].includes(id)) {
        group = 'development-plan';
    } else if (dbData && dbData.group) {
      group = dbData.group;
    } else {
      // Fallback to initialGroups mapping
      if (initialGroups['development-plan'].includes(id)) group = 'development-plan';
      else if (initialGroups.content.includes(id)) group = 'content';
      else if (initialGroups.community.includes(id)) group = 'community';
      else if (initialGroups.coaching.includes(id)) group = 'coaching';
      else if (initialGroups.locker.includes(id)) group = 'locker';
      else if (initialGroups.system?.includes(id)) group = 'system';
      else if (initialGroups.dashboard.includes(id)) group = 'dashboard';
    }

    // Construct feature object
    const featureObj = {
      id,
      name: dbData?.name || meta.name || id,
      group, // Include group for global operations
      // Force metadata description for dashboard-header to ensure it says "Quotes"
      description: (dbData?.description || meta.description) || '',
      enabled: dbData ? dbData.enabled : true, // Default to enabled if not in DB
      order: dbData?.order ?? 999,
      code: dbData?.code || templateCode,
      options: dbData?.options || {},
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
       const current = features[id];
       const templateCode = WIDGET_TEMPLATES[id];

       // Determine expected group
       let expectedGroup = 'dashboard';
       if (initialGroups['development-plan'].includes(id)) expectedGroup = 'development-plan';
       else if (initialGroups.content.includes(id)) expectedGroup = 'content';
       else if (initialGroups.community.includes(id)) expectedGroup = 'community';
       else if (initialGroups.coaching.includes(id)) expectedGroup = 'coaching';
       else if (initialGroups.locker.includes(id)) expectedGroup = 'locker';
       else if (initialGroups.system?.includes(id)) expectedGroup = 'system';
       
       // Update if missing, name/desc mismatch, OR if template exists and code doesn't match, OR group mismatch
       if (!current || 
           current.name !== meta.name || 
           current.description !== meta.description ||
           (templateCode && current.code !== templateCode) ||
           (current.group !== expectedGroup)) {
         
         await saveFeature(id, {
           ...current,
           name: meta.name,
           description: meta.description,
           code: templateCode || current?.code || '',
           group: expectedGroup,
           enabled: current?.enabled !== undefined ? current.enabled : true,
           order: current?.order !== undefined ? current.order : 999
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

  const handleSaveOption = async (widgetId, key, value) => {
    const currentFeature = features[widgetId];
    if (!currentFeature) return;

    const newOptions = { ...currentFeature.options, [key]: value };
    await saveFeature(widgetId, { ...currentFeature, options: newOptions });
    setNewOption({ key: '', value: '' });
  };

  const handleDeleteOption = async (widgetId, key) => {
    const currentFeature = features[widgetId];
    if (!currentFeature) return;

    const newOptions = { ...currentFeature.options };
    delete newOptions[key];
    await saveFeature(widgetId, { ...currentFeature, options: newOptions });
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

  const handleGlobalToggle = async () => {
    // Flatten all widgets from all groups
    const allWidgets = Object.values(groups).flat();
    if (allWidgets.length === 0) return;

    // Check if all are enabled
    const allEnabled = allWidgets.every(w => w.enabled);
    const newState = !allEnabled;

    if (!window.confirm(`Are you sure you want to ${newState ? 'ENABLE' : 'DISABLE'} ALL widgets across the entire platform?`)) return;

    for (const widget of allWidgets) {
        if (widget.enabled !== newState) {
             if (widget.isUnsaved) {
                await saveFeature(widget.id, {
                    name: widget.name,
                    description: widget.description,
                    code: widget.code,
                    group: widget.group,
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
    dashboard: 'Dashboard',
    'development-plan': 'Development Plan',
    content: 'Content',
    community: 'Community',
    coaching: 'Coaching',
    locker: 'Locker',
    system: 'System'
  };

  // Configuration Schema for Specific Widgets
  const WIDGET_CONFIG_SCHEMA = {
    'daily-quote': [
      {
        key: 'scrollMode',
        label: 'Scrolling Mode',
        type: 'boolean',
        description: 'Enable marquee scrolling for quotes instead of a static daily quote.'
      }
    ]
  };

  return (
    <div className="p-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Widget Manager</h1>
          <p className="text-xs text-gray-500">Manage and customize your dashboard widgets.</p>
        </div>
        <div className="flex gap-2">
          {/* Global Toggle Button */}
          <button 
            onClick={handleGlobalToggle} 
            className="flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-600 text-white shadow hover:bg-purple-700 transition-all"
          >
            <ToggleLeft className="w-4 h-4 mr-1" />
            Toggle
          </button>

          {/* Sync Defaults Button */}
          <button 
            onClick={handleSyncDefaults} 
            className="flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white shadow hover:bg-blue-700 transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Widgets
          </button>
        </div>
      </div>

      {/* Groups Navigation - Desktop - Wrap on smaller screens */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(groups).map((key) => (
          <button
            key={key}
            onClick={() => setActiveGroup(key)}
            className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap
              ${activeGroup === key 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {groupTitles[key]}
          </button>
        ))}
      </div>

      {/* Active Group Widgets */}
      <div>
        {/* Group Header */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <h2 className="text-lg font-bold text-gray-900 mr-auto">
            {groupTitles[activeGroup]} Widgets
          </h2>
          <button 
            onClick={() => setIsAdding(true)} 
            className="flex items-center px-2 py-1 text-xs font-semibold rounded-lg bg-green-600 text-white shadow-md hover:bg-green-700 transition-all"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </button>
          <button 
            onClick={handleToggleAll} 
            className="flex items-center px-2 py-1 text-xs font-semibold rounded-lg bg-purple-600 text-white shadow-md hover:bg-purple-700 transition-all"
          >
            <ToggleRight className="w-3 h-3 mr-1" />
            Toggle All
          </button>
        </div>

        {/* Widgets List */}
        <div className="space-y-2">
          {(groups[activeGroup] || []).map((feature, index) => (
            <div key={feature.id} className="p-3 bg-white rounded-lg shadow border border-gray-200">
              {/* Widget Header */}
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-800 text-left truncate">{feature.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{feature.description}</p>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {/* Move Up/Down Buttons */}
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleMove(activeGroup, index, 'up')} 
                      disabled={index === 0}
                      className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleMove(activeGroup, index, 'down')} 
                      disabled={index === (groups[activeGroup].length - 1)}
                      className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all disabled:opacity-50"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  {/* Toggle Widget Button */}
                  <button 
                    onClick={() => toggleFeature(feature.id, !feature.enabled)} 
                    className={`p-1.5 rounded-full transition-all 
                      ${feature.enabled 
                        ? 'bg-green-100 text-green-500 hover:bg-green-200' 
                        : 'bg-red-100 text-red-500 hover:bg-red-200'
                      }`}
                  >
                    {feature.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  {/* Settings Button */}
                  <button 
                    onClick={() => setExpandedSettingsId(expandedSettingsId === feature.id ? null : feature.id)} 
                    className={`p-1.5 rounded-full transition-all ${expandedSettingsId === feature.id ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                  {/* Delete Button */}
                  <button 
                    onClick={() => handleDelete(feature.id)} 
                    className="p-1.5 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {/* Settings Panel */}
              {expandedSettingsId === feature.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Widget Options
                  </h4>

                  {/* Predefined Options (Schema Based) */}
                  {WIDGET_CONFIG_SCHEMA[feature.id] && (
                    <div className="mb-4 space-y-3 border-b border-gray-200 pb-4">
                      {WIDGET_CONFIG_SCHEMA[feature.id].map((config) => {
                        const currentValue = feature.options?.[config.key];
                        // Handle boolean types (stored as strings usually, but let's handle both)
                        const isChecked = String(currentValue) === 'true';

                        return (
                          <div key={config.key} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
                            <div>
                              <p className="text-sm font-bold text-gray-800">{config.label}</p>
                              <p className="text-xs text-gray-500">{config.description}</p>
                            </div>
                            {config.type === 'boolean' && (
                              <button
                                onClick={() => handleSaveOption(feature.id, config.key, isChecked ? 'false' : 'true')}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                  isChecked ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    isChecked ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Existing Custom Options */}
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Custom Options</p>
                    {feature.options && Object.entries(feature.options).length > 0 ? (
                      Object.entries(feature.options).map(([key, value]) => {
                        // Skip schema keys to avoid duplication
                        if (WIDGET_CONFIG_SCHEMA[feature.id]?.some(c => c.key === key)) return null;

                        return (
                          <div key={key} className="flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
                            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{key}</span>
                            <span className="text-sm text-gray-600 flex-1 truncate">{String(value)}</span>
                            <button 
                              onClick={() => handleDeleteOption(feature.id, key)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-gray-400 italic">No custom options configured.</p>
                    )}
                  </div>

                  {/* Add New Option */}
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Key</label>
                      <input 
                        type="text" 
                        placeholder="e.g. scrollMode"
                        className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newOption.key}
                        onChange={(e) => setNewOption({ ...newOption, key: e.target.value })}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-gray-500 mb-1">Value</label>
                      <input 
                        type="text" 
                        placeholder="e.g. true"
                        className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newOption.value}
                        onChange={(e) => setNewOption({ ...newOption, value: e.target.value })}
                      />
                    </div>
                    <button 
                      onClick={() => handleSaveOption(feature.id, newOption.key, newOption.value)}
                      disabled={!newOption.key || !newOption.value}
                      className="px-3 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* No features message */}
        {groups[activeGroup]?.length === 0 && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              No widgets found in this group. Widgets that you add will appear here.
            </p>
          </div>
        )}

        {/* Future Enhancements List */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
            Future Enhancements: {groupTitles[activeGroup]}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ENHANCEMENT_IDEAS[activeGroup]?.map((idea, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-bold text-slate-800 text-sm">{idea.title}</h4>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">Planned</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{idea.desc}</p>
              </div>
            ))}
          </div>
        </div>
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
