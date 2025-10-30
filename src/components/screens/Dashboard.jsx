// src/components/screens/Dashboard.jsx
// FINAL VERSION - Updated 10/29/25
// Implements the 60/40 layout from the boss's mockup.
// Prioritizes "Focus Rep" and "Bookends" as the two primary "bananas".
// Uses the fixed components from DashboardComponents.jsx.

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';

// Import modular components from the file you provided
import {
  COLORS,
  Button,
  Card,
  ModeSwitch,
  StreakTracker,
  DynamicBookendContainer, // The 40% "Action" column
  DevPlanProgressLink,    // The "Focus Area" card
  IdentityAnchorCard,     // The "Anchor" card
  HabitAnchorCard,        // The "Habit Anchor" card
  AICoachNudge,
  ReminderBanner,         // For the "Best" and "Better" reminders
  SuggestionModal,
  SaveIndicator,
  BonusExerciseModal,
  AdditionalRepsCard,
  SocialPodCard           // The "Accountability Pod" card
} from './dashboard/DashboardComponents.jsx';

// Import hooks from the file you provided
import { useDashboard } from './dashboard/DashboardHooks.jsx';

const Dashboard = ({ navigate }) => {
  
  const {
    dailyPracticeData,
    updateDailyPracticeData,
    featureFlags,
    db,
    userEmail,
    developmentPlanData,
    metadata: globalMetadata,
    isLoading 
  } = useAppServices();

  // All state and logic is handled by the hook you provided
  const {
    isArenaMode, isTogglingMode, handleToggleMode,
    targetRep, targetRepStatus, canCompleteTargetRep, isSavingRep, handleCompleteTargetRep,
    identityStatement, setIdentityStatement,
    habitAnchor, setHabitAnchor,
    showIdentityEditor, setShowIdentityEditor,
    showHabitEditor, setShowHabitEditor,
    handleSaveIdentity, handleSaveHabit,
    morningWIN, setMorningWIN,
    otherTasks,
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
  const [showFindPodModal, setShowFindPodModal] = useState(false);
  const [availablePods, setAvailablePods] = useState([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);

  // --- Data Lookups ---

  // Get Focus Area and Progress
  const focusArea = 
    developmentPlanData?.currentPlan?.focusArea || 
    developmentPlanData?.focusArea || 
    'Not Set';
  
  // This is a placeholder. You'll need to calculate this from the dev plan.
  const devPlanProgress = 22; 

  // Helper to safely get arrays from metadata
  const getArrayFromMetadata = (key) => {
    if (!globalMetadata || !globalMetadata[key]) return [];
    const data = globalMetadata[key];
    if (Array.isArray(data)) return data;
    if (data.items && Array.isArray(data.items)) return data.items;
    if (typeof data === 'object') return Object.values(data);
    return [];
  };

  // Find the details for "Today's Focus Rep"
  const targetRepDetails = useMemo(() => {
    if (!globalMetadata || !targetRep) return null;
    const repLibrary = getArrayFromMetadata('REP_LIBRARY');
    if (!repLibrary || repLibrary.length === 0) return null;
    
    const repItem = repLibrary.find(rep => rep.id === targetRep);
    
    if (!repItem) {
      return {
        name: targetRep,
        whatGreatLooksLike: 'Rep not found in catalog. Please check your Development Plan.',
        // This is where we update the copy per your boss's request
        whyItMatters: "This rep couldn't be found. Please select a new rep from your Development Plan to get back on track."
      };
    }
    
    return {
      id: repItem.id,
      name: repItem.text || repItem.name,
      // This is the updated "Why It Matters" copy
      whyItMatters: "This is your anchor rep. It converts reflection into forward motion and builds the awareness that is the heart of leadership learning.",
      whatGreatLooksLike: repItem.definition || 'Practice this rep consistently',
      category: repItem.category,
      tier: repItem.tier_id
    };
  }, [targetRep, globalMetadata]);

  // Load suggestions for Anchors
  const identitySuggestions = useMemo(() => getArrayFromMetadata('IDENTITY_ANCHOR_CATALOG').map(s => ({ text: s })), [globalMetadata]);
  const habitSuggestions = useMemo(() => getArrayFromMetadata('HABIT_ANCHOR_CATALOG').map(s => ({ text: s })), [globalMetadata]);
  const bonusExercises = useMemo(() => getArrayFromMetadata('BONUS_EXERCISES'), [globalMetadata]);

  // --- UI Handlers ---

  const showSaveSuccess = (message = "Saved!") => {
    setSaveMessage(message);
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  const handleSaveIdentityWithConfirmation = async (value) => {
    await handleSaveIdentity(value);
    showSaveSuccess('Identity anchor saved!');
    setShowIdentityEditor(false);
  };

  const handleSaveHabitWithConfirmation = async (value) => {
    await handleSaveHabit(value);
    showSaveSuccess('Habit anchor saved!');
    setShowHabitEditor(false);
  };

  const handleSaveMorningWithConfirmation = async () => {
    await handleSaveMorningBookend();
    showSaveSuccess('Morning plan locked in!');
    // This will trigger the "celebration"
    triggerCelebration("Way to go, Leader!");
  };

  const handleSaveEveningWithConfirmation = async () => {
    await handleSaveEveningBookend();
    showSaveSuccess('Evening reflection saved!');
    setReflectionGood('');
    setReflectionBetter('');
    setReflectionBest('');
  };
  
  // This is the "Visual Celebration"
  const triggerCelebration = (message) => {
    setSaveMessage(message);
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3500);
  };

  const handleCompleteTargetRepWithBonus = async () => {
    await handleCompleteTargetRep();
    triggerCelebration('🎯 Target rep completed!');
    
    // Check for bonus
    if (bonusExercises.length > 0 && !celebrationShown) {
      const randomBonus = bonusExercises[Math.floor(Math.random() * bonusExercises.length)];
      setBonusExerciseData(randomBonus);
      setShowBonusExercise(true);
      setCelebrationShown(true);
    }
  };

  // Find Pod (dummy handler, as in your file)
  const handleFindPod = () => {
    console.log("Finding pod...");
    // Logic from your file
  };

  // --- Reminder Banners (The "Cool Ideas") ---
  useEffect(() => {
    // This is "Cool Idea 1"
    const yesterdayBest = dailyPracticeData?.tomorrowsReminder;
    if (yesterdayBest) {
      setShowBestReminder(true);
    }
    
    // This is "Cool Idea 2"
    const yesterdayBetter = dailyPracticeData?.improvementReminder;
    if (yesterdayBetter) {
      setShowImprovementReminder(true);
    }
  }, [dailyPracticeData]);

  // --- Computed Values for PM Bookend (The "Cool Idea 3") ---
  const amWinCompleted = dailyPracticeData?.morningBookend?.winCompleted || false;
  const amTasksCompleted = otherTasks.length > 0 && otherTasks.every(t => t.completed);

  // --- Loading Guard ---
  if (isLoading || !dailyPracticeData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
        {/* ... loading spinner ... */}
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
              Welcome to the Arena, Leader…
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

        {/* Reminders (Your Boss's "Cool Ideas") */}
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
            
            {/* 1. Focus Area (with Progress & Drill-Down) */}
            <DevPlanProgressLink
              progress={devPlanProgress}
              focusArea={focusArea}
              onNavigate={() => navigate('development-plan')}
            />

            {/* 2. Today's Focus Rep (The "Big Banana" for this column) */}
            <Card title="🎯 Today's Focus Rep" accent='ORANGE'>
              
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.BLUE}05`, border: `1px solid ${COLORS.BLUE}20` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: COLORS.BLUE }}>
                  💡 WHY IT MATTERS:
                </p>
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
                    "{identityStatement}"
                  </p>
                </div>
              )}
            </Card>

            {/* 3. Identity Anchor (Answers "where does this go?") */}
            <IdentityAnchorCard
              identityStatement={identityStatement}
              onEdit={() => setShowIdentityEditor(true)}
            />

            {/* 4. Habit Anchor (Answers "where does this go?") */}
            <HabitAnchorCard
              habitAnchor={habitAnchor}
              onEdit={() => setShowHabitEditor(true)}
            />

            {/* 5. Accountability Pod */}
            <SocialPodCard
              podMembers={dailyPracticeData?.podMembers || []}
              activityFeed={dailyPracticeData?.podActivity || []}
              onSendMessage={(msg) => console.log('Send message:', msg)}
              onFindPod={handleFindPod}
            />

            {/* 6. AI Coach (Kept as secondary CTA) */}
            <AICoachNudge 
              onOpenLab={() => navigate('coaching-lab')} 
              disabled={!(featureFlags?.enableLabs)}
            />

          </div>

          {/* === 40% "ACTION" COLUMN (RIGHT) === */}
          <div className="space-y-6">

            {/* 1. AM/PM Bookends (The "Big Banana" for this column) */}
            <DynamicBookendContainer
              morningProps={{
                dailyWIN: morningWIN,
                setDailyWIN: setMorningWIN,
                otherTasks: otherTasks,
                onAddTask: handleAddTask,
                onToggleTask: handleToggleTask,
                onRemoveTask: handleRemoveTask,
                showLIS: showLIS,
                setShowLIS: setShowLIS,
                identityStatement: identityStatement,
                // This is the "Complete" button
                onSave: handleSaveMorningWithConfirmation,
                // This is the separate "Save WIN" button
                onSaveWIN: handleSaveWIN,
                // This is for the WIN checkbox
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
                // This passes the navigate function to the "View History" button
                onNavigate: navigate,
                // These are for "Cool Idea 3"
                amWinCompleted: amWinCompleted,
                amTasksCompleted: amTasksCompleted,
              }}
              dailyPracticeData={dailyPracticeData}
            />
            
            {/* NOTE: 
              - "Daily Reflection Log" is now a button *inside* the PM Bookend.
              - "Additional Reps" card is removed from V1 Dashboard to simplify.
            */}

          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* Merged Identity Edit/Suggestion Modal */}
      {showIdentityEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Edit Your Identity Anchor
            </h2>
            <p className="text-sm mb-4" style={{ color: COLORS.MUTED }}>
              Complete this statement: "I am the kind of leader who..."
            </p>
            <textarea 
              value={identityStatement}
              onChange={(e) => setIdentityStatement(e.target.value)}
              placeholder="...prioritizes team well-being."
              className="w-full p-3 border rounded-lg mb-4"
              style={{ borderColor: COLORS.SUBTLE }}
              rows={3}
            />
            <div className="flex gap-3 mb-4">
              <Button onClick={() => handleSaveIdentityWithConfirmation(identityStatement)} variant="primary" size="md" className="flex-1">
                Save
              </Button>
              <Button onClick={() => setShowIdentityEditor(false)} variant="outline" size="md" className="flex-1">
                Cancel
              </Button>
            </div>
            <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
              OR SELECT FROM SUGGESTIONS:
            </p>
            <div className="overflow-y-auto flex-1 space-y-2">
              {identitySuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSaveIdentityWithConfirmation(suggestion.text)}
                  className="w-full text-left p-3 rounded-lg border-2 transition-all hover:border-teal-500 hover:bg-teal-50"
                  style={{ borderColor: COLORS.SUBTLE }}
                >
                  <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>
                    ... <strong>{suggestion.text}</strong>
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Merged Habit Edit/Suggestion Modal */}
      {showHabitEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Edit Your Habit Anchor
            </h2>
            <p className="text-sm mb-4" style={{ color: COLORS.MUTED }}>
              Your daily cue: "When I..."
            </p>
            <input 
              type="text"
              value={habitAnchor}
              onChange={(e) => setHabitAnchor(e.target.value)}
              placeholder="...open my laptop for the day."
              className="w-full p-3 border rounded-lg mb-4"
              style={{ borderColor: COLORS.SUBTLE }}
            />
            <div className="flex gap-3 mb-4">
              <Button onClick={() => handleSaveHabitWithConfirmation(habitAnchor)} variant="primary" size="md" className="flex-1">
                Save
              </Button>
              <Button onClick={() => setShowHabitEditor(false)} variant="outline" size="md" className="flex-1">
                Cancel
              </Button>
            </div>
            <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
              OR SELECT FROM SUGGESTIONS:
            </p>
            <div className="overflow-y-auto flex-1 space-y-2">
              {habitSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSaveHabitWithConfirmation(suggestion.text)}
                  className="w-full text-left p-3 rounded-lg border-2 transition-all hover:border-teal-500 hover:bg-teal-50"
                  style={{ borderColor: COLORS.SUBTLE }}
                >
                  <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>
                    ... <strong>{suggestion.text}</strong>
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Other Modals... */}
      {showBonusExercise && bonusExerciseData && (
        <BonusExerciseModal
          exercise={bonusExerciseData}
          onComplete={handleCompleteBonusExercise}
          onSkip={() => setShowBonusExercise(false)}
        />
      )}
      
      {/* ... Find Pod Modal ... */}
      
      <SaveIndicator show={showSaveConfirmation} message={saveMessage} />
    </div>
  );
};

export default Dashboard;