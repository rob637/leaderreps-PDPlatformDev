// src/components/screens/Dashboard.jsx
// FINAL VERSION - Updated 10/30/25
// FIX: Anchor deletion logic implemented in handleDeletePlanAndReset (Issue 1).
// FIX: Added defensive checks for arrays after deletion to prevent React error #31.
// UX: Implemented floating/blinking Anchor FAB and Test Utilities.
// UX: REMOVED LeadershipAnchorsCard for prominence of FAB.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowRight, Edit3, Loader, X, Users, Send, Target, Clock, Zap, Shield, Trash2, Anchor } from 'lucide-react'; 
import { deleteField } from 'firebase/firestore'; // Used for reminder dismissals
import { MembershipGate } from '../ui/MembershipGate.jsx';

// Import modular components from the file you provided
import {
  COLORS,
  Button,
  Card,
  ModeSwitch,
  StreakTracker,
  DynamicBookendContainer,
  DevPlanProgressLink,
  AICoachNudge,
  ReminderBanner,
  SaveIndicator,
  BonusExerciseModal,
  SocialPodCard,
  // === UNIFIED IMPORTS ===
  UnifiedAnchorEditorModal,
AdditionalRepsCard // <--- ADD THIS LINE 
  // LeadershipAnchorsCard REMOVED per user request
  // ===========================
} from './dashboard/DashboardComponents.jsx';

// Arena v1.0 Scope: Import Daily Tasks component to replace Social Pod
import DailyTasksCard from './dashboard/DailyTasksCard.jsx';

// Import hooks from the file you provided
import { useDashboard } from './dashboard/DashboardHooks.jsx';

// --- Helper function to sanitize Firestore Timestamps ---
const sanitizeTimestamps = (obj) => {
  if (!obj) return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeTimestamps(item));
  }
  
  // Handle Firestore Timestamp objects
  if (obj && typeof obj === 'object' && typeof obj.toDate === 'function') {
    return obj.toDate();
  }
  
  // Handle plain objects
  if (obj && typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeTimestamps(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};


// --- Helper Components (Membership-Aware Start Card per Arena v1.0 Scope) ---
const GetStartedCard = ({ onNavigate, membershipData, developmentPlanData }) => {
  const currentTier = membershipData?.currentTier || 'basic';
  const hasCompletedPlan = developmentPlanData?.currentPlan && 
    developmentPlanData.currentPlan.focusAreas && 
    developmentPlanData.currentPlan.focusAreas.length > 0;

  // Base members -> Show upgrade page
  if (currentTier === 'basic') {
    return (
      <Card accent="ORANGE">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
              Unlock Your Leadership Potential
            </h2>
            <p className="text-base mt-1" style={{ color: COLORS.MUTED }}>
              Upgrade to Arena Professional to access assessments, development plans, and accountability pods.
            </p>
          </div>
          <Button
            onClick={() => onNavigate('membership-upgrade')}
            variant="primary"
            size="md"
            className="flex-shrink-0 w-full sm:w-auto"
            style={{ background: `linear-gradient(135deg, ${COLORS.ORANGE}, ${COLORS.TEAL})` }}
          >
            View Plans <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Pro/Premium members without plan -> Assessment & Plan flow
  if ((currentTier === 'professional' || currentTier === 'elite') && !hasCompletedPlan) {
    return (
      <Card accent="BLUE">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
              Create Your Development Plan
            </h2>
            <p className="text-base mt-1" style={{ color: COLORS.MUTED }}>
              Take your leadership assessment and create your personalized development plan.
            </p>
          </div>
          <Button
            onClick={() => onNavigate('development-plan')}
            variant="primary"
            size="md"
            className="flex-shrink-0 w-full sm:w-auto"
          >
            Take Assessment <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Pro/Premium members with plan -> This Week's Focus
  if ((currentTier === 'professional' || currentTier === 'elite') && hasCompletedPlan) {
    const currentWeekFocus = developmentPlanData?.currentPlan?.focusAreas?.[0]?.name || 'Leadership Development';
    
    return (
      <Card accent="TEAL">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
              This Week's Focus
            </h2>
            <p className="text-lg font-semibold mt-1" style={{ color: COLORS.TEAL }}>
              {currentWeekFocus}
            </p>
            <p className="text-sm mt-1" style={{ color: COLORS.MUTED }}>
              Continue building your skills in this key area
            </p>
          </div>
          <Button
            onClick={() => onNavigate('development-plan')}
            variant="outline"
            size="md"
            className="flex-shrink-0 w-full sm:w-auto"
          >
            View Your Plan <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Fallback to original behavior
  return (
    <Card accent="TEAL">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
            Start Your Leadership Journey
          </h2>
          <p className="text-base mt-1" style={{ color: COLORS.MUTED }}>
            Create your personalized Development Plan to unlock your daily reps.
          </p>
        </div>
        <Button
          onClick={() => onNavigate('development-plan')}
          variant="primary"
          size="md"
          className="flex-shrink-0 w-full sm:w-auto"
        >
          Get Started <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
};

const Dashboard = ({ navigate }) => {
  
  const {
    user, 
    dailyPracticeData,
    // CRITICAL FIX: Ensure update functions are explicitly destructured here
    updateDailyPracticeData, 
    updateDevelopmentPlanData, 
    // END CRITICAL FIX
    featureFlags,
    db,
    userEmail,
    developmentPlanData,
    metadata: globalMetadata,
    isLoading,
    isAdmin,
    membershipData
  } = useAppServices();

  // Developer Mode Toggle - Arena v1.0 Enhancement
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    return localStorage.getItem('arena-developer-mode') === 'true';
  });

  const toggleDeveloperMode = () => {
    const newMode = !isDeveloperMode;
    setIsDeveloperMode(newMode);
    localStorage.setItem('arena-developer-mode', newMode.toString());
  };

  const {
    isArenaMode, isTogglingMode, handleToggleMode,
    targetRep, targetRepStatus, canCompleteTargetRep, isSavingRep, handleCompleteTargetRep,
    identityStatement, setIdentityStatement,
    habitAnchor, setHabitAnchor,
    handleSaveIdentity, 
    handleSaveHabit,    
    morningWIN, setMorningWIN,
    otherTasks: originalOtherTasks,
    showLIS, setShowLIS,
    reflectionGood, setReflectionGood,
    reflectionBetter, setReflectionBetter,
    reflectionBest, setReflectionBest,
    habitsCompleted,
    isSavingBookend,
    handleSaveMorningBookend, handleSaveEveningBookend,
    handleAddTask, handleToggleTask, handleRemoveTask,
    handleToggleWIN, handleSaveWIN,
    handleHabitToggle,
    streakCount, streakCoins,
    additionalCommitments
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData,
    featureFlags,
    db,
    userEmail
  });

  // Local UI state
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showBestReminder, setShowBestReminder] = useState(false);
  const [showImprovementReminder, setShowImprovementReminder] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  const [showBonusExercise, setShowBonusExercise] = useState(false);
  const [bonusExerciseData, setBonusExerciseData] = useState(null);
  
  // --- UNIFIED ANCHOR EDITOR STATE ---
  const [showAnchorEditor, setShowAnchorEditor] = useState(false);
  const [showTestUtils, setShowTestUtils] = useState(false); // NEW STATE for Test Utils
  
  // --- POD/WHY STATE ---
  const [showFindPodModal, setShowFindPodModal] = useState(false);
  const [availablePods, setAvailablePods] = useState([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);
  const [whyStatement, setWhyStatement] = useState(dailyPracticeData?.whyStatement || ''); // Still need local state access


  // --- Data Lookups (Unchanged logic) ---

  const focusAreasArray = useMemo(() => {
    if (!developmentPlanData) return [];
    const areas = developmentPlanData.currentPlan?.focusAreas || developmentPlanData.focusAreas;
    // Ensure we always return an array, even if the data is corrupted
    return Array.isArray(areas) ? areas : [];
  }, [developmentPlanData]);

  const primaryFocusAreaName = useMemo(() => {
    if (focusAreasArray.length > 0) {
      // NOTE: This logic is why you see "Unnamed Focus" if the plan data is incomplete.
      return focusAreasArray[0].name || focusAreasArray[0].category || 'Unnamed Focus';
    }
    return null;
  }, [focusAreasArray]);

  const focusArea = primaryFocusAreaName || 'Not Set';
  
  const devPlanProgress = (focusArea === 'Not Set') 
    ? 0 
    : (developmentPlanData?.currentPlan?.progress || 0);

  const getArrayFromMetadata = (key) => {
    if (!globalMetadata || !globalMetadata[key]) return [];
    const data = globalMetadata[key];
    
    // Handle null or undefined
    if (!data) return [];
    
    // Handle Firebase deleteField placeholder objects
    if (typeof data === 'object' && data._methodName === 'FieldValue.delete') {
      return [];
    }
    
    if (data && data.items && Array.isArray(data.items)) {
      return data.items;
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn(`[getArrayFromMetadata] Metadata for key '${key}' is not in the expected { items: [...] } format or a simple array. Got:`, typeof data);
    return [];
  };

  const targetRepDetails = useMemo(() => {
    if (!globalMetadata || !targetRep) return null;
    const repLibrary = getArrayFromMetadata('REP_LIBRARY');
    if (!repLibrary || repLibrary.length === 0) return null;
    
    const repItem = repLibrary.find(rep => rep.id === targetRep);
    
    if (!repItem) {
      return {
        name: targetRep,
        whatGreatLooksLike: 'Rep not found in catalog. Please check your Development Plan.',
        whyItMatters: "This rep couldn't be found. Please select a new rep from your Development Plan to get back on track."
      };
    }
    
    return {
      id: repItem.id,
      name: repItem.text || repItem.name,
      whyItMatters: repItem.whyItMatters || "This is your anchor rep. It converts reflection into forward motion and builds the awareness that is the heart of leadership learning.",
      whatGreatLooksLike: repItem.definition || 'Practice this rep consistently',
      category: repItem.category,
      tier: repItem.tier_id
    };
  }, [targetRep, globalMetadata]);

  // Load suggestions for Anchors with defensive checks
  const identitySuggestions = useMemo(() => {
    const arr = getArrayFromMetadata('IDENTITY_ANCHOR_CATALOG');
    return Array.isArray(arr) ? arr.map(s => ({ text: typeof s === 'string' ? s : s.text || '' })) : [];
  }, [globalMetadata]);
  
  const habitSuggestions = useMemo(() => {
    const arr = getArrayFromMetadata('HABIT_ANCHOR_CATALOG');
    return Array.isArray(arr) ? arr.map(s => ({ text: typeof s === 'string' ? s : s.text || '' })) : [];
  }, [globalMetadata]);
  
  const whySuggestions = useMemo(() => {
    const arr = getArrayFromMetadata('WHY_CATALOG');
    return Array.isArray(arr) ? arr.map(s => ({ text: typeof s === 'string' ? s : s.text || '' })) : [];
  }, [globalMetadata]);
  
  const bonusExercises = useMemo(() => {
    const arr = getArrayFromMetadata('EXERCISE_LIBRARY');
    return Array.isArray(arr) ? arr : [];
  }, [globalMetadata]);

  // --- UI Handlers ---

  const showSaveSuccess = (message = "Saved!") => {
    setSaveMessage(message);
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  // --- FIX: Memoized Reminder Dismissal Handlers to prevent re-render crashes ---
  const handleDismissBestReminder = useCallback(() => {
      setShowBestReminder(false);
      // Data mutation safely wrapped in a callback
      updateDailyPracticeData({ tomorrowsReminder: deleteField() });
  }, [updateDailyPracticeData]);
  
  const handleDismissImprovementReminder = useCallback(() => {
      setShowImprovementReminder(false);
      // Data mutation safely wrapped in a callback
      updateDailyPracticeData({ improvementReminder: deleteField() });
  }, [updateDailyPracticeData]);
  // --- END FIX ---

  // --- UNIFIED SAVE HANDLER ---
  const handleSaveAllAnchors = async ({ identity, habit, why }) => {
    // Collect all updates
    const updates = {};
    let saveMessage = 'Anchors saved!';

    if (identity !== identityStatement) {
      updates.identityAnchor = identity;
      setIdentityStatement(identity);
    }
    if (habit !== habitAnchor) {
      updates.habitAnchor = habit;
      setHabitAnchor(habit);
    }
    if (why !== whyStatement) {
      updates.whyStatement = why;
      setWhyStatement(why);
    }

    if (Object.keys(updates).length > 0) {
      await updateDailyPracticeData(updates);
    } else {
      saveMessage = 'No changes detected.';
    }
    showSaveSuccess(saveMessage);
    setShowAnchorEditor(false);
  };
  // --- END UNIFIED SAVE HANDLER ---

  const handleSaveMorningWithConfirmation = async () => {
    await handleSaveMorningBookend();
    showSaveSuccess('Morning plan locked in!');
    triggerCelebration("Way to go, Leader!");
  };
  
  const handleSaveWINWithConfirmation = async () => {
    await handleSaveWIN();
    showSaveSuccess("Today's WIN saved!");
    setMorningWIN(''); 
  };

  const handleSaveEveningWithConfirmation = async () => {
    await handleSaveEveningBookend();
    showSaveSuccess('Evening reflection saved!');
    setReflectionGood('');
    setReflectionBetter('');
    setReflectionBest('');
  };
  
  const triggerCelebration = (message) => {
    setSaveMessage(message);
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3500);
  };

  const handleCompleteBonusExercise = () => {
      setShowBonusExercise(false);
      triggerCelebration('+50 Coins earned! Great work!');
  };

  const handleCompleteTargetRepWithBonus = async () => {
    await handleCompleteTargetRep();
    triggerCelebration('🎯 Target rep completed!');
    
    if (bonusExercises.length > 0 && !celebrationShown) {
      const randomBonus = bonusExercises[Math.floor(Math.random() * bonusExercises.length)];
      setBonusExerciseData(randomBonus);
      setShowBonusExercise(true);
      setCelebrationShown(true);
    }
  };

  const handleFindPod = () => {
    setShowFindPodModal(true);
    setIsLoadingPods(true);
    setTimeout(() => {
      setAvailablePods([
        { id: 'pod1', name: 'West Coast Leaders', members: 8, activity: 'High' },
        { id: 'pod2', name: 'East Coast Go-Getters', members: 12, activity: 'Medium' },
        { id: 'pod3', name: 'Global Leadership Forum', members: 4, activity: 'High' },
      ]);
      setIsLoadingPods(false);
    }, 1500);
  };
  
  // --- FIX (Issue 1): Reset Plan ---
  // 🛑 CRITICAL FIX: Direct implementation using update functions with complete overwrite
  // This ensures ALL residual data is properly removed with a forced overwrite (merge: false)
  const handleDeletePlanAndReset = useCallback(async () => {
    console.log('[Dashboard] Executing Delete Plan and Reset with direct overwrite...');
    
    try {
      // 1. CLEAR DEVELOPMENT PLAN to default state with OVERWRITE (merge: false)
      const defaultPlanPayload = {
        currentPlan: null, // CRITICAL: Set to null to trigger Baseline view
        currentCycle: 1,
        lastAssessmentDate: null,
        assessmentHistory: [], 
        planHistory: [],
      };
      
      // Use merge: false to completely overwrite the document (removes ALL fields)
      const planCleared = await updateDevelopmentPlanData(defaultPlanPayload, { merge: false });
      
      // 2. CLEAR DAILY PRACTICE to default state  
      const todayStr = new Date().toISOString().split('T')[0];
      const defaultDailyPracticePayload = {
        activeCommitments: [], 
        identityAnchor: '', 
        habitAnchor: '', 
        whyStatement: '',
        dailyTargetRepId: null, 
        dailyTargetRepDate: null, 
        dailyTargetRepStatus: 'Pending', 
        streakCount: 0,
        streakCoins: 0,
        lastUpdated: todayStr,
        completedRepsToday: [],
        morningBookend: {},
        eveningBookend: {},
      };
      
      // Daily practice update
      await updateDailyPracticeData(defaultDailyPracticePayload);
      
      if (planCleared) {
        console.log('[Dashboard] Plan and anchors successfully cleared');
        setShowTestUtils(false);
        // Navigate to the Development Plan screen to show the Baseline
        navigate('development-plan'); 
        triggerCelebration('Plan and progress reset. Start fresh!');
      } else {
        console.error('[Dashboard] Failed to clear plan');
        triggerCelebration('Error resetting plan. Please try again.');
      }
    } catch (error) {
      console.error('[Dashboard] Error during delete:', error);
      triggerCelebration('Error resetting plan. Please try again.');
    }
  }, [updateDevelopmentPlanData, updateDailyPracticeData, navigate]);

  // --- Reminder Banners (Cool Ideas) ---
  useEffect(() => {
    const yesterdayBest = dailyPracticeData?.tomorrowsReminder;
    if (yesterdayBest) {
      setShowBestReminder(true);
    }
    
    const yesterdayBetter = dailyPracticeData?.improvementReminder;
    if (yesterdayBetter) {
      setShowImprovementReminder(true);
    }
  }, [dailyPracticeData]);
  
  // --- UX ENHANCEMENT: Anchor FAB Logic ---
  const isFullyDefined = !!identityStatement && !!habitAnchor && !!whyStatement;
  
  const handleOpenAnchorEditor = () => setShowAnchorEditor(true);
  
  // --- Augmented Task List (Uses UNIFIED Anchor Editor) ---
  const augmentedOtherTasks = useMemo(() => {
    const newTasks = [];
    
    if (focusArea === 'Not Set') {
      newTasks.push({
        id: 'system-dev-plan',
        text: 'Start your Development Plan',
        completed: false,
        isSystem: true,
        onClick: () => navigate('development-plan') 
      });
    }
    
    if (!isFullyDefined) {
      const definedCount = [identityStatement, habitAnchor, whyStatement].filter(Boolean).length;
      newTasks.push({
        id: 'system-anchors',
        text: `Define your Leadership Anchors (${definedCount}/3 Set) - Click to Edit`,
        completed: false,
        isSystem: true,
        onClick: handleOpenAnchorEditor // Directs to the unified editor
      });
    }

    // Sanitize originalOtherTasks in case they contain Firestore Timestamps
    return [...newTasks, ...sanitizeTimestamps(originalOtherTasks)];
  }, [
    originalOtherTasks, 
    focusArea, 
    identityStatement, 
    habitAnchor, 
    whyStatement, 
    navigate,
    isFullyDefined,
    handleOpenAnchorEditor
  ]);


  // --- Computed Values for PM Bookend (Cool Idea 3) ---
  const amWinCompleted = dailyPracticeData?.morningBookend?.winCompleted || false;
  const amTasksCompleted = originalOtherTasks.length > 0 && originalOtherTasks.every(t => t.completed);

  // --- Loading Guard ---
  if (isLoading || !dailyPracticeData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
        <Loader className="animate-spin h-10 w-10" style={{ color: COLORS.TEAL }} />
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen gradient-corporate-hero">
      <div className="container mx-auto max-w-7xl" style={{ padding: 'var(--spacing-xl)' }}>
        
        {/* Corporate Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" style={{ marginBottom: 'var(--spacing-2xl)' }}>
          <div>
            <h1 className="corporate-heading-xl" style={{ color: COLORS.NAVY }}>
              The Arena
              {isDeveloperMode && (
                <span className="ml-3 px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                  🔧 Developer View
                </span>
              )}
            </h1>
            <p className="corporate-text-body" style={{ color: COLORS.TEXT }}>
              Welcome to the Arena, {user?.name || 'Leader'}! We're glad you're here.
              {isDeveloperMode && (
                <span className="block text-sm text-purple-600 font-medium mt-1">
                  You're viewing the full developer experience - toggle to "User Mode" to see what regular users see.
                </span>
              )}
            </p>
          </div>
          {/* Developer Mode Toggle & Arena Features */}
          <div className="flex gap-3 items-center">
            {/* Developer/User Mode Toggle */}
            <button
              onClick={toggleDeveloperMode}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                isDeveloperMode 
                  ? 'bg-purple-600 text-white shadow-lg' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isDeveloperMode ? '🔧 Developer Mode' : '👤 User Mode'}
            </button>

            {/* Arena Mode and Coins - Developer Mode Only */}
            {isDeveloperMode && (
              <>
                <ModeSwitch 
                  isArenaMode={isArenaMode} 
                  onToggle={handleToggleMode} 
                  isLoading={isTogglingMode}
                />
                <StreakTracker streakCount={streakCount} streakCoins={streakCoins} />
              </>
            )}
          </div>
        </div>

        {/* Reminders (Cool Ideas) */}
        {showBestReminder && (
          <div className="mb-4">
            <ReminderBanner
              message={dailyPracticeData.tomorrowsReminder}
              onDismiss={handleDismissBestReminder} // <-- FIX APPLIED HERE
              type="best"
            />
          </div>
        )}
        {showImprovementReminder && (
          <div className="mb-4">
            <ReminderBanner
              message={dailyPracticeData.improvementReminder}
              onDismiss={handleDismissImprovementReminder} // <-- FIX APPLIED HERE
              type="improvement"
            />
          </div>
        )}

        {/* --- NEW 60/40 LAYOUT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* === 60% "FOCUS" COLUMN (LEFT) === */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Dev Plan Progress / Get Started */}
            {focusArea === 'Not Set' ? (
              <GetStartedCard 
                onNavigate={navigate} 
                membershipData={membershipData}
                developmentPlanData={developmentPlanData}
              />
            ) : (
              <MembershipGate requiredTier="basic" featureName="Development Plan">
                <DevPlanProgressLink
                  progress={devPlanProgress}
                  focusArea={focusArea}
                  onNavigate={() => navigate('development-plan')}
                />
              </MembershipGate>
            )}

            {/* 2. Today's Focus Rep */}
            {focusArea !== 'Not Set' && (
              <Card title="🎯 Today's Focus Rep" accent='ORANGE'>
                
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.BLUE}05`, border: `1px solid ${COLORS.BLUE}20` }}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-semibold" style={{ color: COLORS.BLUE }}>
                      💡 WHY IT MATTERS:
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: COLORS.TEXT }}>
                    {targetRepDetails?.whyItMatters}
                  </p>
                </div>
                
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.TEXT }}>
                  Target Rep:
                </p>
                <p className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                  {targetRepDetails ? targetRepDetails.name : (targetRep || 'No target rep set')}
                </p>
                
                <div className="mt-4 p-4 rounded-lg border-2" 
                    style={{ backgroundColor: `${COLORS.TEAL}10`, borderColor: `${COLORS.TEAL}30` }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: COLORS.TEAL }}>
                    ✨ WHAT GREAT LOOKS LIKE:
                  </p>
                  <p className="text-sm italic" style={{ color: COLORS.TEXT }}>
                    {targetRepDetails?.whatGreatLooksLike}
                  </p>
                </div>
                
                {targetRepStatus === 'Pending' && (
                  <Button 
                    onClick={handleCompleteTargetRepWithBonus} 
                    disabled={!canCompleteTargetRep}
                    variant="primary" 
                    size="md" 
                    className="w-full mt-4"
                  >
                    {isSavingRep ? 'Completing...' : '⚡ Complete Focus Rep'}
                  </Button>
                )}
                {targetRepStatus === 'Committed' && (
                  <div className="mt-4 p-3 rounded-lg text-center" 
                      style={{ backgroundColor: `${COLORS.GREEN}20`, color: COLORS.GREEN }}>
                    <strong>✓ Completed Today!</strong>
                  </div>
                )}
                
                {identityStatement && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
                      🎯 TODAY'S FOCUS:
                    </p>
                    <p className="text-sm italic font-medium" style={{ color: COLORS.TEXT }}>
                      "I am the kind of leader who {identityStatement}"
                    </p>
                  </div>
                )}
              </Card>
            )}

            {/* 3. Daily Tasks - Replaces Social Pod per Arena v1.0 Scope */}
            <DailyTasksCard
              otherTasks={augmentedOtherTasks}
              morningWIN={morningWIN}
              winCompleted={dailyPracticeData?.morningBookend?.winCompleted || false}
              onToggleTask={handleToggleTask}
              onRemoveTask={handleRemoveTask}
              onAddTask={handleAddTask}
              onToggleWIN={handleToggleWIN}
              onSaveWIN={handleSaveWINWithConfirmation}
            />

            {/* ===== BOSS V1 SCOPE: AI COACH DISABLED ===== */}
            {/* AI Coach feature moved to future scope per boss requirements */}
            {/* {featureFlags?.enableLabs && (
              <MembershipGate requiredTier="elite" featureName="AI Coaching Lab">
                <AICoachNudge 
                  onOpenLab={() => navigate('coaching-lab')} 
                  disabled={!(featureFlags?.enableLabs)}
                />
              </MembershipGate>
            )} */}
            
            {/* 5. Additional Reps Card (if any) */}
            {Array.isArray(additionalCommitments) && additionalCommitments.length > 0 && (
              <AdditionalRepsCard
                commitments={additionalCommitments}
                onToggle={(id) => console.log('Toggle additional rep:', id)}
                repLibrary={getArrayFromMetadata('REP_LIBRARY')}
              />
            )}

          </div>

          {/* === 40% "ACTION" COLUMN (RIGHT) === */}
          <div className="space-y-6">

            {/* 1. AM/PM Bookends */}
            <DynamicBookendContainer
              morningProps={{
                dailyWIN: morningWIN,
                setDailyWIN: setMorningWIN,
                otherTasks: augmentedOtherTasks,
                onAddTask: handleAddTask,
                onToggleTask: handleToggleTask,
                onRemoveTask: handleRemoveTask,
                showLIS: showLIS,
                setShowLIS: setShowLIS,
                identityStatement: identityStatement,
                onSave: handleSaveMorningWithConfirmation,
                onSaveWIN: handleSaveWINWithConfirmation,
                onToggleWIN: handleToggleWIN,
                isSaving: isSavingBookend,
                completedAt: dailyPracticeData?.morningBookend?.completedAt?.toDate?.() || null,
                winCompleted: dailyPracticeData?.morningBookend?.winCompleted
              }}
              eveningProps={{
                reflectionGood: reflectionGood,
                setReflectionGood: setReflectionGood,
                reflectionBetter: reflectionBetter,
                setReflectionBetter: setReflectionBetter,
                reflectionBest: reflectionBest,
                setReflectionBest: setReflectionBest,
                habitsCompleted: habitsCompleted,
                onHabitToggle: handleHabitToggle,
                onSave: handleSaveEveningWithConfirmation,
                onNavigate: navigate,
                amWinCompleted: amWinCompleted,
                amTasksCompleted: amTasksCompleted,
              }}
              dailyPracticeData={sanitizeTimestamps(dailyPracticeData)}
            />

            {/* 2. Developer Mode: Test Utilities Button */}
            {isDeveloperMode && (
              <div className="text-center">
                  <Button onClick={() => setShowTestUtils(true)} variant="nav-back" size="sm" className="w-full">
                      <Shield className="w-4 h-4 mr-2 text-red-500" /> Test Utilities (Developer)
                  </Button>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* NEW: Floating Anchor Button (FAB) - MORE VISIBLE */}
      <button 
        onClick={handleOpenAnchorEditor}
        className={`fixed bottom-6 right-6 z-50 flex items-center px-6 py-3 rounded-full font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.05] 
            ${!isFullyDefined ? 'animate-bounce bg-purple-700' : 'bg-teal-600 opacity-90'}`}
        style={{ 
            boxShadow: `0 8px 20px ${!isFullyDefined ? COLORS.PURPLE : COLORS.TEAL}80` 
        }}
      >
        <Anchor className={`w-5 h-5 mr-3 ${!isFullyDefined ? 'animate-pulse' : ''}`} />
        {isFullyDefined ? 'Edit Your Anchors' : 'DEFINE YOUR ANCHORS!'}
      </button>

      {/* UNIFIED Anchor Editor Modal */}
      {showAnchorEditor && (
        <UnifiedAnchorEditorModal
          initialIdentity={identityStatement}
          initialHabit={habitAnchor}
          initialWhy={whyStatement}
          identitySuggestions={identitySuggestions}
          habitSuggestions={habitSuggestions}
          whySuggestions={whySuggestions}
          onSave={handleSaveAllAnchors}
          onClose={() => setShowAnchorEditor(false)}
        />
      )}
      
      {/* NEW: Test Utilities Modal */}
      {showTestUtils && (
        <TestUtilsModal
            onDeletePlan={handleDeletePlanAndReset}
            onClose={() => setShowTestUtils(false)}
        />
      )}
      
      {/* Pod Modal */}
      {showFindPodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                Find an Accountability Pod
              </h2>
              <button onClick={() => setShowFindPodModal(false)} className="p-1 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" style={{ color: COLORS.MUTED }} />
              </button>
            </div>
            
            {isLoadingPods ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader className="animate-spin h-10 w-10" style={{ color: COLORS.TEAL }} />
                <p className="mt-3 font-semibold" style={{ color: COLORS.MUTED }}>
                  Searching for available pods...
                </p>
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-3">
                <p className="text-sm mb-3" style={{ color: COLORS.TEXT }}>
                  Found {availablePods.length} pods. Request to join a group to stay accountable.
                </p>
                {availablePods.map((pod) => (
                  <div 
                    key={pod.id} 
                    className="flex justify-between items-center p-4 rounded-lg border"
                    style={{ borderColor: COLORS.SUBTLE }}
                  >
                    <div>
                      <p className="font-bold" style={{ color: COLORS.NAVY }}>{pod.name}</p>
                      <p className="text-xs" style={{ color: COLORS.MUTED }}>
                        <Users className="w-3 h-3 inline-block mr-1" /> {pod.members} members
                        <Send className="w-3 h-3 inline-block ml-3 mr-1" /> {pod.activity} activity
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Request to Join
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bonus Exercise Modal */}
      {showBonusExercise && bonusExerciseData && (
        <BonusExerciseModal
          exercise={bonusExerciseData}
          onComplete={handleCompleteBonusExercise}
          onSkip={() => setShowBonusExercise(false)}
        />
      )}
      
      <SaveIndicator show={showSaveConfirmation} message={saveMessage} />
    </div>
  );
};

// --- NEW TEST UTILS MODAL (Defined locally for Dashboard) ---
const TestUtilsModal = ({ onDeletePlan, onClose }) => {
    const [confirmDelete, setConfirmDelete] = useState(false);
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
                    ⚙️ Test Utilities (Danger Zone)
                </h2>
                <p className="text-sm text-red-600 mb-4">
                    WARNING: These actions cannot be undone and are for testing only.
                </p>
                
                {confirmDelete ? (
                    <>
                        <p className="text-base font-semibold mb-3">
                            Are you sure? This will delete all plan and daily rep progress.
                        </p>
                        <Button onClick={onDeletePlan} variant="danger" size="md" className="w-full mb-2">
                            <Trash2 className="w-4 h-4 mr-2" /> Yes, Delete Plan & Reset
                        </Button>
                        <Button onClick={() => setConfirmDelete(false)} variant="outline" size="sm" className="w-full">
                            Cancel
                        </Button>
                    </>
                ) : (
                    <Button onClick={() => setConfirmDelete(true)} variant="secondary" size="md" className="w-full">
                        Delete Plan and Start Over
                    </Button>
                )}
                
                <div className="pt-4 mt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                    <Button onClick={onClose} variant="ghost" size="sm" className="w-full">Close</Button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;