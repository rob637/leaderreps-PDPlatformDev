// src/components/screens/Dashboard.jsx
// FINAL VERSION - Updated 10/30/25
// FIXED: Removed all redundant local definitions and unused imports to ensure clean build.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowRight, Edit3, Loader, X, Users, Send, Target, Clock, Zap } from 'lucide-react'; 
import { deleteField } from 'firebase/firestore'; // Import deleteField

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
  // === NEW/UNIFIED IMPORTS ===
  LeadershipAnchorsCard, // Imported from DashboardComponents.jsx
  UnifiedAnchorEditorModal // Imported from DashboardComponents.jsx
  // ===========================
} from './dashboard/DashboardComponents.jsx';

// Import hooks from the file you provided
import { useDashboard } from './dashboard/DashboardHooks.jsx';


// --- Helper Components (Get Started Card, SuggestionButton are used locally) ---
const GetStartedCard = ({ onNavigate }) => (
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

const SuggestionButton = ({ text, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left p-3 rounded-lg border border-transparent transition-all"
    style={{ background: COLORS.BG }}
  >
    <p className="text-sm font-medium" style={{ color: COLORS.NAVY }}>
      {text}
    </p>
  </button>
);


const Dashboard = ({ navigate }) => {
  
  const {
    user, 
    dailyPracticeData,
    updateDailyPracticeData,
    featureFlags,
    db,
    userEmail,
    developmentPlanData,
    metadata: globalMetadata,
    isLoading 
  } = useAppServices();

  const {
    isArenaMode, isTogglingMode, handleToggleMode,
    targetRep, targetRepStatus, canCompleteTargetRep, isSavingRep, handleCompleteTargetRep,
    identityStatement, setIdentityStatement,
    habitAnchor, setHabitAnchor,
    // Removed: showIdentityEditor, setShowIdentityEditor,
    // Removed: showHabitEditor, setShowHabitEditor,
    handleSaveIdentity, // Note: Keeping these for potential future single-save logic if needed
    handleSaveHabit,    // Note: Keeping these for potential future single-save logic if needed
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
  
  // --- POD/WHY STATE ---
  const [showFindPodModal, setShowFindPodModal] = useState(false);
  const [availablePods, setAvailablePods] = useState([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);
  const [whyStatement, setWhyStatement] = useState(dailyPracticeData?.whyStatement || ''); // Still need local state access


  // --- Data Lookups (Unchanged logic) ---

  const focusAreasArray = useMemo(() => {
    if (!developmentPlanData) return null;
    return developmentPlanData.currentPlan?.focusAreas || developmentPlanData.focusAreas;
  }, [developmentPlanData]);

  const primaryFocusAreaName = useMemo(() => {
    if (Array.isArray(focusAreasArray) && focusAreasArray.length > 0) {
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
    
    if (data && data.items && Array.isArray(data.items)) {
      return data.items;
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    console.warn(`[getArrayFromMetadata] Metadata for key '${key}' is not in the expected { items: [...] } format or a simple array.`);
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

  // Load suggestions for Anchors
  const identitySuggestions = useMemo(() => getArrayFromMetadata('IDENTITY_ANCHOR_CATALOG').map(s => ({ text: typeof s === 'string' ? s : s.text })), [globalMetadata]);
  
  const habitSuggestions = useMemo(() => getArrayFromMetadata('HABIT_ANCHOR_CATALOG').map(s => ({ text: typeof s === 'string' ? s : s.text })), [globalMetadata]);
  
  const whySuggestions = useMemo(() => getArrayFromMetadata('WHY_CATALOG').map(s => ({ text: typeof s === 'string' ? s : s.text })), [globalMetadata]);
  
  const bonusExercises = useMemo(() => getArrayFromMetadata('EXERCISE_LIBRARY'), [globalMetadata]);

  // --- UI Handlers ---

  const showSaveSuccess = (message = "Saved!") => {
    setSaveMessage(message);
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

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
    
    const isAnyAnchorMissing = !identityStatement || !habitAnchor || !whyStatement;

    if (isAnyAnchorMissing) {
      const definedCount = [identityStatement, habitAnchor, whyStatement].filter(Boolean).length;
      newTasks.push({
        id: 'system-anchors',
        text: `Define your Leadership Anchors (${definedCount}/3 Set)`,
        completed: false,
        isSystem: true,
        onClick: () => setShowAnchorEditor(true) // Directs to the unified editor
      });
    }

    return [...newTasks, ...originalOtherTasks];
  }, [
    originalOtherTasks, 
    focusArea, 
    identityStatement, 
    habitAnchor, 
    whyStatement, 
    navigate
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
    <div className="min-h-screen" style={{ background: COLORS.BG }}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>
              The Arena
            </h1>
            <p className="text-base" style={{ color: COLORS.TEXT }}>
              Welcome to the Arena, {user?.name || 'Leader'}! We're glad you're here.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <ModeSwitch 
              isArenaMode={isArenaMode} 
              onToggle={handleToggleMode} 
              isLoading={isTogglingMode}
            />
            <StreakTracker streakCount={streakCount} streakCoins={streakCoins} />
          </div>
        </div>

        {/* Reminders (Cool Ideas) */}
        {showBestReminder && (
          <div className="mb-4">
            <ReminderBanner
              message={dailyPracticeData.tomorrowsReminder}
              onDismiss={() => {
                setShowBestReminder(false);
                updateDailyPracticeData({ tomorrowsReminder: deleteField() });
              }}
              type="best"
            />
          </div>
        )}
        {showImprovementReminder && (
          <div className="mb-4">
            <ReminderBanner
              message={dailyPracticeData.improvementReminder}
              onDismiss={() => {
                setShowImprovementReminder(false);
                updateDailyPracticeData({ improvementReminder: deleteField() });
              }}
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
              <GetStartedCard onNavigate={navigate} />
            ) : (
              <DevPlanProgressLink
                progress={devPlanProgress}
                focusArea={focusArea}
                onNavigate={() => navigate('development-plan')}
              />
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

            {/* 3. Leadership Anchors Card (UNIFIED) */}
            <LeadershipAnchorsCard
                identityStatement={identityStatement}
                habitAnchor={habitAnchor}
                whyStatement={whyStatement}
                onDefine={() => setShowAnchorEditor(true)}
                onEdit={() => setShowAnchorEditor(true)}
            />

            {/* 4. Accountability Pod */}
            <SocialPodCard
              podMembers={dailyPracticeData?.podMembers || []}
              activityFeed={dailyPracticeData?.podActivity || []}
              onSendMessage={(msg) => console.log('Send message:', msg)}
              onFindPod={handleFindPod}
            />

            {/* 5. AI Coach */}
            <AICoachNudge 
              onOpenLab={() => navigate('coaching-lab')} 
              disabled={!(featureFlags?.enableLabs)}
            />

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
                completedAt: dailyPracticeData?.morningBookend?.completedAt,
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
                isSaving: isSavingBookend,
                onNavigate: navigate,
                amWinCompleted: amWinCompleted,
                amTasksCompleted: amTasksCompleted,
              }}
              dailyPracticeData={dailyPracticeData}
            />

          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
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

export default Dashboard;