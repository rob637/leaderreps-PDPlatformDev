// src/components/screens/Dashboard.jsx
// FINAL VERSION - Updated 10/30/25
// Implements the 60/40 layout from the boss's mockup.
// Prioritizes "Focus Rep" and "Bookends" as the two primary "bananas".
// Uses the fixed components from DashboardComponents.jsx.

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { ArrowRight, Edit3, Loader, X, Users, Send } from 'lucide-react'; // Import icons

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

// --- NEW "Get Started" Card ---
// This card replaces the progress link for new users (Req #2)
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

const Dashboard = ({ navigate }) => {
  
  const {
    user, // <-- REQ #1: Get user object
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
    otherTasks: originalOtherTasks, // Renamed to avoid conflict
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
  
  // --- NEW STATE FOR MODALS (Req #11, #13) ---
  const [showWhyEditor, setShowWhyEditor] = useState(false);
  const [showFindPodModal, setShowFindPodModal] = useState(false);
  const [availablePods, setAvailablePods] = useState([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);
  const [customWhyInput, setCustomWhyInput] = useState(dailyPracticeData?.customWhyStatement || '');

  // --- Data Lookups ---

  // Get Focus Area and Progress
  const focusArea = 
    developmentPlanData?.currentPlan?.focusArea || 
    developmentPlanData?.focusArea || 
    'Not Set';
  
  // REQ #3: Default progress to 0 if no plan exists
  const devPlanProgress = (focusArea === 'Not Set') 
    ? 0 
    : (developmentPlanData?.currentPlan?.progress || 0);

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
      // REQ #11: Pulling from repItem first, then falling back
      whyItMatters: repItem.whyItMatters || "This is your anchor rep. It converts reflection into forward motion and builds the awareness that is the heart of leadership learning.",
      whatGreatLooksLike: repItem.definition || 'Practice this rep consistently',
      category: repItem.category,
      tier: repItem.tier_id
    };
  }, [targetRep, globalMetadata]);

  // Load suggestions for Anchors
  const identitySuggestions = useMemo(() => getArrayFromMetadata('IDENTITY_ANCHOR_CATALOG').map(s => ({ text: typeof s === 'string' ? s : s.text })), [globalMetadata]);
  
  // REQ #8: Fix for habit suggestions (handles strings or objects)
  const habitSuggestions = useMemo(() => getArrayFromMetadata('HABIT_ANCHOR_CATALOG').map(s => ({ text: typeof s === 'string' ? s : s.text })), [globalMetadata]);
  
  // REQ #11: Load "Why" suggestions
  const whySuggestions = useMemo(() => getArrayFromMetadata('WHY_CATALOG').map(s => ({ text: typeof s === 'string' ? s : s.text })), [globalMetadata]);
  
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
  
  // REQ #4: Add confirmation for saving WIN
  const handleSaveWINWithConfirmation = async () => {
    await handleSaveWIN();
    showSaveSuccess("Today's WIN saved!");
  };

  // REQ #11: Handler for saving custom "Why"
  const handleSaveCustomWhy = async (value) => {
    const newWhy = value.trim();
    await updateDailyPracticeData({ customWhyStatement: newWhy });
    setCustomWhyInput(newWhy); // Update local input state
    showSaveSuccess('Your "Why" has been saved!');
    setShowWhyEditor(false);
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

  // REQ #13: Add functionality to Find Pod button
  const handleFindPod = () => {
    setShowFindPodModal(true);
    setIsLoadingPods(true);
    // Simulate API call
    setTimeout(() => {
      setAvailablePods([
        { id: 'pod1', name: 'West Coast Leaders', members: 8, activity: 'High' },
        { id: 'pod2', name: 'East Coast Go-Getters', members: 12, activity: 'Medium' },
        { id: 'pod3', name: 'Global Leadership Forum', members: 4, activity: 'High' },
      ]);
      setIsLoadingPods(false);
    }, 1500);
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
  
  // --- REQ #5, #6, #7, #12: Augmented Task List ---
  const augmentedOtherTasks = useMemo(() => {
    const newTasks = [];
    
    // Req #5: Add Dev Plan task
    if (focusArea === 'Not Set') {
      newTasks.push({
        id: 'system-dev-plan',
        text: 'Start your Development Plan',
        completed: false,
        isSystem: true,
        onClick: () => navigate('development-plan')
      });
    }
    
    // Req #6: Add Identity Anchor task
    if (!identityStatement) {
      newTasks.push({
        id: 'system-identity',
        text: 'Set your Identity Anchor',
        completed: false,
        isSystem: true,
        onClick: () => setShowIdentityEditor(true)
      });
    }
    
    // Req #7: Add Habit Anchor task
    if (!habitAnchor) {
      newTasks.push({
        id: 'system-habit',
        text: 'Set your Habit Anchor',
        completed: false,
        isSystem: true,
        onClick: () => setShowHabitEditor(true)
      });
    }
    
    // Req #12: Add "Define Why" task
    if (!dailyPracticeData?.customWhyStatement && focusArea !== 'Not Set') {
       newTasks.push({
        id: 'system-why',
        text: "Define 'Why' this rep matters",
        completed: false,
        isSystem: true,
        onClick: () => {
          setCustomWhyInput(dailyPracticeData?.customWhyStatement || targetRepDetails?.whyItMatters || '');
          setShowWhyEditor(true);
        }
      });
    }

    return [...newTasks, ...originalOtherTasks];
  }, [
    originalOtherTasks, 
    focusArea, 
    identityStatement, 
    habitAnchor, 
    dailyPracticeData?.customWhyStatement,
    targetRepDetails?.whyItMatters,
    navigate
  ]);


  // --- Computed Values for PM Bookend (The "Cool Idea 3") ---
  const amWinCompleted = dailyPracticeData?.morningBookend?.winCompleted || false;
  const amTasksCompleted = originalOtherTasks.length > 0 && originalOtherTasks.every(t => t.completed);

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
            {/* REQ #1: Use user's first name */}
            <p className="text-base" style={{ color: COLORS.TEXT }}>
              Welcome to the Arena, {user?.name || 'Leader'}…
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
            
            {/* REQ #2: Conditional "Get Started" Card */}
            {focusArea === 'Not Set' ? (
              <GetStartedCard onNavigate={navigate} />
            ) : (
              <DevPlanProgressLink
                progress={devPlanProgress}
                focusArea={focusArea}
                onNavigate={() => navigate('development-plan')}
              />
            )}

            {/* 2. Today's Focus Rep (The "Big Banana" for this column) */}
            {/* Only show this card if a plan exists */}
            {focusArea !== 'Not Set' && (
              <Card title="🎯 Today's Focus Rep" accent='ORANGE'>
                
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.BLUE}05`, border: `1px solid ${COLORS.BLUE}20` }}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-xs font-semibold" style={{ color: COLORS.BLUE }}>
                      💡 WHY IT MATTERS:
                    </p>
                    {/* REQ #11: Edit "Why" Button */}
                    <button
                      onClick={() => {
                        setCustomWhyInput(dailyPracticeData?.customWhyStatement || targetRepDetails?.whyItMatters || '');
                        setShowWhyEditor(true);
                      }}
                      className="flex items-center text-xs font-semibold"
                      style={{ color: COLORS.BLUE }}
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                  </div>
                  {/* REQ #11: Display custom "Why" or default */}
                  <p className="text-xs" style={{ color: COLORS.TEXT }}>
                    {dailyPracticeData?.customWhyStatement || targetRepDetails?.whyItMatters}
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
                    {/* REQ #10: Add full sentence */}
                    <p className="text-sm italic font-medium" style={{ color: COLORS.TEXT }}>
                      "I am the kind of leader who {identityStatement}"
                    </p>
                  </div>
                )}
              </Card>
            )}

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
              onFindPod={handleFindPod} // <-- REQ #13: Hooked up
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
                // REQ #5, #6, #7, #12: Pass augmented tasks
                otherTasks: augmentedOtherTasks,
                onAddTask: handleAddTask,
                onToggleTask: handleToggleTask,
                onRemoveTask: handleRemoveTask,
                showLIS: showLIS,
                setShowLIS: setShowLIS,
                identityStatement: identityStatement,
                // This is the "Complete" button
                onSave: handleSaveMorningWithConfirmation,
                // REQ #4: Use new handler
                onSaveWIN: handleSaveWINWithConfirmation,
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
                  // REQ #9: Sleeker style - removed border-2
                  className="w-full text-left p-3 rounded-lg border transition-all hover:bg-teal-50"
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
                  // REQ #9: Sleeker style - removed border-2
                  className="w-full text-left p-3 rounded-lg border transition-all hover:bg-teal-50"
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
      
      {/* REQ #11: "Why It Matters" Editor Modal */}
      {showWhyEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Define Your "Why"
            </h2>
            <p className="text-sm mb-4" style={{ color: COLORS.MUTED }}>
              Why does this rep matter *to you*? This will override the default.
            </p>
            <textarea 
              value={customWhyInput}
              onChange={(e) => setCustomWhyInput(e.target.value)}
              placeholder="e.g., This matters because my team needs me to be present and clear..."
              className="w-full p-3 border rounded-lg mb-4"
              style={{ borderColor: COLORS.SUBTLE }}
              rows={4}
            />
            <div className="flex gap-3 mb-4">
              <Button onClick={() => handleSaveCustomWhy(customWhyInput)} variant="primary" size="md" className="flex-1">
                Save My "Why"
              </Button>
              <Button onClick={() => setShowWhyEditor(false)} variant="outline" size="md" className="flex-1">
                Cancel
              </Button>
            </div>
            <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
              OR SELECT FROM SUGGESTIONS:
            </p>
            <div className="overflow-y-auto flex-1 space-y-2">
              {whySuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSaveCustomWhy(suggestion.text)}
                  className="w-full text-left p-3 rounded-lg border transition-all hover:bg-teal-50"
                  style={{ borderColor: COLORS.SUBTLE }}
                >
                  <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>
                    {suggestion.text}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* REQ #13: Find a Pod Modal */}
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

      {/* Other Modals... */}
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