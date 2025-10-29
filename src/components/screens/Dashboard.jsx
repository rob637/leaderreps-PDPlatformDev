// src/components/screens/Dashboard.jsx
// FIXED: Wait for main 'isLoading' flag to ensure globalMetadata is loaded from catalog.
// FIXED: Re-ordered layout to match design screenshot.
// FIXED: Removed 'amCompletedAt' ref to fix crash.
// FIXED: Merged Anchor "Edit" and "Suggestion" modals per user request.

import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  Flag, Home 
} from 'lucide-react';

// Import modular components
import {
  COLORS,
  Button,
  Card,
  ModeSwitch,
  StreakTracker,
  DynamicBookendContainer,
  DevPlanProgressLink,
  IdentityAnchorCard,
  HabitAnchorCard,
  AICoachNudge,
  ReminderBanner,
  SuggestionModal,
  SaveIndicator,
  BonusExerciseModal,
  AdditionalRepsCard,
  SocialPodCard
} from './dashboard/DashboardComponents.jsx';

// Import hooks
import { useDashboard } from './dashboard/DashboardHooks.jsx';

const Dashboard = ({ navigate }) => {
  
  const {
    dailyPracticeData,
    updateDailyPracticeData,
    featureFlags,
    db,
    userEmail,
    developmentPlanData,
    globalMetadata,
    isLoading // <-- FIX: Added main loading flag
  } = useAppServices();

  const {
    isArenaMode,
    isTogglingMode,
    handleToggleMode,
    targetRep,
    targetRepStatus,
    canCompleteTargetRep,
    isSavingRep,
    handleCompleteTargetRep,
    identityStatement,
    setIdentityStatement,
    habitAnchor,
    setHabitAnchor,
    showIdentityEditor,
    setShowIdentityEditor,
    showHabitEditor,
    setShowHabitEditor,
    handleSaveIdentity,
    handleSaveHabit,
    morningWIN,
    setMorningWIN,
    otherTasks,
    showLIS,
    setShowLIS,
    reflectionGood,
    setReflectionGood,
    reflectionBetter,
    setReflectionBetter,
    reflectionBest,
    setReflectionBest,
    habitsCompleted,
    isSavingBookend,
    handleSaveMorningBookend,
    handleSaveEveningBookend,
    handleAddTask,
    handleToggleTask,
    handleRemoveTask,
    handleToggleWIN,
    handleSaveWIN,
    handleHabitToggle,
    streakCount,
    streakCoins,
    additionalCommitments
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData,
    featureFlags,
    db,
    userEmail
  });

  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [showBestReminder, setShowBestReminder] = useState(false);
  const [showImprovementReminder, setShowImprovementReminder] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);
  
  // These states are no longer needed as modals are merged
  // const [showIdentitySuggestions, setShowIdentitySuggestions] = useState(false);
  // const [showHabitSuggestions, setShowHabitSuggestions] = useState(false);

  const [showBonusExercise, setShowBonusExercise] = useState(false);
  const [bonusExerciseData, setBonusExerciseData] = useState(null);
  
  const [showFindPodModal, setShowFindPodModal] = useState(false);
  const [availablePods, setAvailablePods] = useState([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);

  // FIX #1: Check multiple possible property names for focus area
  const focusArea = useMemo(() => {
    const plan = developmentPlanData?.currentPlan;
    if (!plan) return 'Not Set';
    
    // Check direct properties first
    if (plan.focusArea) return plan.focusArea;
    if (plan.targetSkill) return plan.targetSkill;
    if (plan.primarySkill) return plan.primarySkill;
    if (plan.skill) return plan.skill;
    if (plan.focus) return plan.focus;
    
    // Check phases structure (based on DevelopmentPlan.jsx structure)
    if (plan.phases && Array.isArray(plan.phases) && plan.phases.length > 0) {
      const firstPhase = plan.phases[0];
      if (firstPhase.skills && Array.isArray(firstPhase.skills) && firstPhase.skills.length > 0) {
        return firstPhase.skills[0];
      }
    }
    
    return 'Not Set';
  }, [developmentPlanData?.currentPlan]);
  
  const devPlanProgress = 22;

  const targetRepDetails = useMemo(() => {
    // FIX #2: Enhanced target rep lookup with better debugging
    console.log('[Dashboard] Looking up target rep:', targetRep);
    console.log('[Dashboard] globalMetadata keys:', Object.keys(globalMetadata || {}));
    
    if (!globalMetadata) {
      console.log('[Dashboard] globalMetadata is not yet available.');
      return null;
    }

    if (!targetRep) {
      console.log('[Dashboard] No target rep set');
      return null;
    }
    
    let repLibrary = null;
    
    // Try all possible paths where REP_LIBRARY might be stored
    if (globalMetadata?.REP_LIBRARY?.items) {
      repLibrary = globalMetadata.REP_LIBRARY.items;
      console.log('[Dashboard] Found REP_LIBRARY.items:', repLibrary.length);
    } else if (Array.isArray(globalMetadata?.REP_LIBRARY)) {
      repLibrary = globalMetadata.REP_LIBRARY;
      console.log('[Dashboard] Found REP_LIBRARY as array:', repLibrary.length);
    } else if (globalMetadata?.reps) {
      repLibrary = globalMetadata.reps;
      console.log('[Dashboard] Found reps:', repLibrary.length);
    } else if (globalMetadata?.repLibrary) {
      repLibrary = globalMetadata.repLibrary;
      console.log('[Dashboard] Found repLibrary:', repLibrary.length);
    }
    
    if (!repLibrary || !Array.isArray(repLibrary)) {
      console.error('[Dashboard] REP_LIBRARY not found or not an array');
      console.log('[Dashboard] Available metadata:', globalMetadata);
      return {
        name: targetRep,
        description: 'Loading rep details...',
        whatGreatLooksLike: 'Please wait while we load the rep catalog'
      };
    }
    
    console.log('[Dashboard] Searching', repLibrary.length, 'reps for:', targetRep);
    if (repLibrary.length > 0) {
      console.log('[Dashboard] First rep structure:', repLibrary[0]);
    }
    
    // Enhanced matching logic - try multiple ID formats
    const repItem = repLibrary.find(rep => {
      if (!rep) return false;
      
      // Try exact matches first
      if (rep.id === targetRep || 
          rep.repId === targetRep ||
          rep.repID === targetRep ||
          rep.rep_id === targetRep) {
        console.log('[Dashboard] Found exact ID match:', rep);
        return true;
      }
      
      // Try case-insensitive matches
      const targetLower = targetRep.toLowerCase();
      if (rep.id?.toLowerCase() === targetLower ||
          rep.repId?.toLowerCase() === targetLower ||
          rep.repID?.toLowerCase() === targetLower) {
        console.log('[Dashboard] Found case-insensitive match:', rep);
        return true;
      }
      
      // Try name matches
      if (rep.name === targetRep || 
          rep.title === targetRep ||
          rep.text === targetRep) {
        console.log('[Dashboard] Found name match:', rep);
        return true;
      }
      
      return false;
    });
    
    if (!repItem) {
      console.warn('[Dashboard] Target rep not found in catalog:', targetRep);
      if (repLibrary.length > 0) {
        console.log('[Dashboard] Sample IDs from catalog:', 
          repLibrary.slice(0, 5).map(r => ({ 
            id: r.id, 
            repId: r.repId, 
            name: r.name 
          }))
        );
      }
      return {
        name: targetRep,
        description: 'Rep not found in catalog',
        whatGreatLooksLike: 'Please check your Development Plan or contact support'
      };
    }
    
    console.log('[Dashboard] Successfully found rep:', repItem);
    
    return {
      id: repItem.id || repItem.repId || repItem.repID,
      name: repItem.text || repItem.name || repItem.title || targetRep,
      description: repItem.definition || repItem.description || repItem.desc || 'No description available',
      whatGreatLooksLike: repItem.whatGoodLooksLike || repItem.definition || 'Focus on consistent practice',
      category: repItem.category || 'General',
      tier: repItem.tier || repItem.tier_id
    };
  }, [targetRep, globalMetadata]);

  const [identitySuggestions, setIdentitySuggestions] = useState([]);
  const [habitSuggestions, setHabitSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  
  useEffect(() => {
    // FIX #7: Enhanced suggestions loading with better debugging
    console.log('[Dashboard] Loading suggestions from metadata');
    console.log('[Dashboard] globalMetadata available:', !!globalMetadata);
    
    if (!globalMetadata) {
      console.log('[Dashboard] globalMetadata is null/undefined');
      return;
    }
    
    console.log('[Dashboard] globalMetadata keys:', Object.keys(globalMetadata));
    console.log('[Dashboard] IDENTITY_ANCHOR_CATALOG:', globalMetadata.IDENTITY_ANCHOR_CATALOG);
    console.log('[Dashboard] HABIT_ANCHOR_CATALOG:', globalMetadata.HABIT_ANCHOR_CATALOG);
    
    try {
      // Try multiple paths for identity anchors
      let identityItems = 
        globalMetadata?.IDENTITY_ANCHOR_CATALOG?.items ||
        globalMetadata?.IDENTITY_ANCHORS?.items ||
        globalMetadata?.identityAnchors?.items ||
        globalMetadata?.identityAnchors ||
        globalMetadata?.IDENTITY_ANCHOR_CATALOG ||
        [];
      
      // Try multiple paths for habit anchors
      let habitItems = 
        globalMetadata?.HABIT_ANCHOR_CATALOG?.items ||
        globalMetadata?.HABIT_ANCHORS?.items ||
        globalMetadata?.habitAnchors?.items ||
        globalMetadata?.habitAnchors ||
        globalMetadata?.HABIT_ANCHOR_CATALOG ||
        [];
      
      console.log('[Dashboard] Raw identity items:', identityItems);
      console.log('[Dashboard] Raw habit items:', habitItems);
      
      // Ensure items are arrays
      if (!Array.isArray(identityItems)) {
        console.warn('[Dashboard] Identity items not an array:', typeof identityItems);
        identityItems = [];
      }
      if (!Array.isArray(habitItems)) {
        console.warn('[Dashboard] Habit items not an array:', typeof habitItems);
        habitItems = [];
      }
      
      // Normalize items to objects with text property
      const identity = identityItems.map(x => {
        if (typeof x === 'string') return { text: x };
        if (x && typeof x === 'object') return x;
        return { text: String(x) };
      });
      
      const habits = habitItems.map(x => {
        if (typeof x === 'string') return { text: x };
        if (x && typeof x === 'object') return x;
        return { text: String(x) };
      });
      
      console.log('[Dashboard] Normalized identity suggestions:', identity.length);
      console.log('[Dashboard] Normalized habit suggestions:', habits.length);
      if (identity.length > 0) console.log('[Dashboard] Sample identity:', identity[0]);
      if (habits.length > 0) console.log('[Dashboard] Sample habit:', habits[0]);
      
      setIdentitySuggestions(identity);
      setHabitSuggestions(habits);
      setIsLoadingSuggestions(false);
      console.log('[Dashboard] Suggestions loaded from metadata catalogs', { identity: identity.length, habits: habits.length });
    } catch (error) {
      console.error('[Dashboard] Failed to parse metadata catalogs', error);
      setIdentitySuggestions([]);
      setHabitSuggestions([]);
      setIsLoadingSuggestions(false);
    }
  }, [globalMetadata]);


  const bonusExercises = globalMetadata?.BONUS_EXERCISES?.items || [];

  const showSaveSuccess = (message = 'Saved successfully!') => {
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
  };

  const handleSaveEveningWithConfirmation = async () => {
    await handleSaveEveningBookend();
    
    // FIX #3: Clear the reflection inputs in Firestore for next day
    if (updateDailyPracticeData) {
      await updateDailyPracticeData({
        'eveningBookend.good': '',
        'eveningBookend.better': '',
        'eveningBookend.best': ''
      });
    }
    
    // Clear local state
    setReflectionGood('');
    setReflectionBetter('');
    setReflectionBest('');
    
    showSaveSuccess('Evening reflection saved!');
  };

  const handleToggleAdditionalRep = async (commitmentId) => {
    if (!updateDailyPracticeData || !additionalCommitments) return;
    
    console.log('[Dashboard] Toggling additional rep:', commitmentId);
    
    try {
      const updated = additionalCommitments.map(c => 
        c.id === commitmentId ? { 
          ...c, 
          completed: !c.completed,
          completedAt: !c.completed ? new Date().toISOString() : null
        } : c
      );
      
      await updateDailyPracticeData({ 
        activeCommitments: updated 
      });
      
      showSaveSuccess(
        updated.find(c => c.id === commitmentId)?.completed 
          ? '✓ Rep completed!' 
          : 'Rep marked incomplete'
      );
    } catch (error) {
      console.error('[Dashboard] Error toggling rep:', error);
      alert('Failed to update rep. Please try again.');
    }
  };

  const handleFindPod = async () => {
    console.log('[Dashboard] Finding pods...');
    setShowFindPodModal(true);
    setIsLoadingPods(true);
    
    try {
      if (!db) throw new Error('Database not available');
      
      // FIX #6: Use Firestore v9 syntax
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      // Create query using v9 syntax
      const podsRef = collection(db, 'pods');
      const q = query(podsRef, where('status', '==', 'active'));
      const podsSnapshot = await getDocs(q);
      
      // Map documents to data
      let pods = podsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter for pods with space
      pods = pods.filter(p => (p.memberCount || 0) < 5);
      setAvailablePods(pods);
      console.log('[Dashboard] Found pods:', pods.length);
    } catch (error) {
      console.error('[Dashboard] Error finding pods:', error);
      console.error('[Dashboard] Error details:', error.message, error.stack);
      alert('Unable to load pods. Please try again.');
      setShowFindPodModal(false);
    } finally {
      setIsLoadingPods(false);
    }
  };

  const handleJoinPod = async (podId) => {
    if (!db || !userEmail) {
      console.error('[Dashboard] Missing db or userEmail');
      return;
    }
    
    try {
      // FIX #6: Use Firestore v9 syntax
      const { doc, updateDoc, arrayUnion, increment } = await import('firebase/firestore');
      
      const podRef = doc(db, 'pods', podId);
      
      // Use Firestore v9 syntax for updates
      await updateDoc(podRef, {
        members: arrayUnion(userEmail),
        memberCount: increment(1)
      });
      
      await updateDailyPracticeData({
        podId: podId,
        podJoinedAt: new Date().toISOString()
      });
      
      showSaveSuccess('🎉 Joined pod successfully!');
      setShowFindPodModal(false);
      
      console.log('[Dashboard] Successfully joined pod:', podId);
    } catch (error) {
      console.error('[Dashboard] Error joining pod:', error);
      alert('Failed to join pod. Please try again.');
    }
  };

  const handleCompleteBonusExercise = async () => {
    if (!updateDailyPracticeData) return;
    
    try {
      await updateDailyPracticeData({
        streakCoins: (streakCoins || 0) + 50,
        bonusExerciseCompleted: bonusExerciseData?.id,
        bonusExerciseCompletedAt: new Date().toISOString()
      });
      
      setShowBonusExercise(false);
      showSaveSuccess('🎉 Bonus exercise completed! +50 coins!');
    } catch (error) {
      console.error('[Dashboard] Error completing bonus exercise:', error);
    }
  };

  const handleCompleteTargetRepWithBonus = async () => {
    await handleCompleteTargetRep();
    showSaveSuccess('🎯 Target rep completed!');
    
    if (bonusExercises.length > 0 && !celebrationShown) {
      const randomBonus = bonusExercises[Math.floor(Math.random() * bonusExercises.length)];
      setBonusExerciseData(randomBonus);
      setShowBonusExercise(true);
      setCelebrationShown(true);
    }
  };

  useEffect(() => {
    const yesterday = dailyPracticeData?.tomorrowsReminder;
    const improvement = dailyPracticeData?.improvementReminder;
    
    if (yesterday && !showBestReminder) {
      setShowBestReminder(true);
    }
    
    if (improvement && !showImprovementReminder) {
      setShowImprovementReminder(true);
    }
  }, [dailyPracticeData]);
  
  const amWinCompleted = dailyPracticeData?.morningBookend?.winCompleted || false;
  const amTasksCompleted = otherTasks.length > 0 && otherTasks.every(t => t.completed);

  // --- FIX: UPDATED LOADING GUARD ---
  if (isLoading || !dailyPracticeData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-3" style={{ borderColor: COLORS.TEAL }} />
          <p className="font-semibold" style={{ color: COLORS.NAVY }}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }
  // --- END FIX ---

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

        {/* Reminders */}
        {showBestReminder && dailyPracticeData?.tomorrowsReminder && (
          <div className="mb-4">
            <ReminderBanner
              message={dailyPracticeData.tomorrowsReminder}
              onDismiss={() => setShowBestReminder(false)}
              type="best"
            />
          </div>
        )}

        {showImprovementReminder && dailyPracticeData?.improvementReminder && (
          <div className="mb-4">
            <ReminderBanner
              message={dailyPracticeData.improvementReminder}
              onDismiss={() => setShowImprovementReminder(false)}
              type="improvement"
            />
          </div>
        )}

        {/* // --- FIX: RE-ORDERED MAIN CONTENT GRID ---
        // The layout is now changed to match the screenshot:
        // Left Column (col-span-2): DevPlan, Focus Rep, Anchors, Reflection Log, etc.
        // Right Column (col-span-1): Bookends, Social Pod
        */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Dev Plan / Focus Area (Moved from right) */}
            <DevPlanProgressLink
              progress={devPlanProgress}
              focusArea={focusArea}
              onNavigate={() => navigate('development-plan')}
            />

            {/* 2. Today's Focus Rep (Was already here) */}
            <Card title="🎯 Today's Focus Rep" accent='ORANGE'>
              
              {targetRepDetails && (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.BLUE}05`, border: `1px solid ${COLORS.BLUE}20` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: COLORS.BLUE }}>
                    💡 WHY THIS REP MATTERS:
                  </p>
                  <p className="text-xs" style={{ color: COLORS.TEXT }}>
                    This is your anchor rep. It converts reflection into forward motion and 
                    builds the awareness that is the heart of leadership learning.
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.TEXT }}>
                  Target Rep:
                </p>
                <p className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                  {targetRepDetails ? targetRepDetails.name : (targetRep || 'No target rep set')}
                </p>
                {targetRepDetails?.category && (
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold mt-2"
                        style={{ backgroundColor: `${COLORS.BLUE}20`, color: COLORS.BLUE }}>
                    {targetRepDetails.category}
                  </span>
                )}
              </div>

              {targetRepDetails?.whatGreatLooksLike && (
                <div className="mb-4 p-4 rounded-lg border-2" 
                     style={{ backgroundColor: `${COLORS.TEAL}10`, borderColor: `${COLORS.TEAL}30` }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: COLORS.TEAL }}>
                    ✨ WHAT GREAT LOOKS LIKE:
                  </p>
                  <p className="text-sm italic" style={{ color: COLORS.TEXT }}>
                    {targetRepDetails.whatGreatLooksLike}
                  </p>
                </div>
              )}
              
              {targetRepDetails?.description && targetRepDetails.description !== targetRepDetails.whatGreatLooksLike && (
                <div className="mb-4">
                  <p className="text-sm" style={{ color: COLORS.TEXT }}>
                    {targetRepDetails.description}
                  </p>
                </div>
              )}

              {targetRepStatus === 'Pending' && (
                <Button 
                  onClick={handleCompleteTargetRepWithBonus} 
                  disabled={!canCompleteTargetRep}
                  variant="primary" 
                  size="md" 
                  className="w-full"
                >
                  {isSavingRep ? 'Completing...' : '⚡ Complete Focus Rep'}
                </Button>
              )}

              {targetRepStatus === 'Committed' && (
                <div className="p-3 rounded-lg text-center" 
                     style={{ backgroundColor: `${COLORS.GREEN}20`, color: COLORS.GREEN }}>
                  <strong>✓ Completed Today!</strong>
                </div>
              )}
            </Card>

            {/* 3. Identity Anchor (Moved from right) */}
            <IdentityAnchorCard
              identityStatement={identityStatement}
              onEdit={() => setShowIdentityEditor(true)}
            />

            {/* 4. Habit Anchor (Moved from right) */}
            <HabitAnchorCard
              habitAnchor={habitAnchor}
              onEdit={() => setShowHabitEditor(true)}
            />

            {/* 5. Daily Reflection Log (NEW: Added from screenshot) */}
            <Card title="Daily Reflection Log">
              <p className="text-sm text-gray-600 mb-4">
                Review your past entries and reflections.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('reflection-log')} // Assuming a 'reflection-log' route
                className="w-full"
              >
                View Reflection Log
              </Button>
            </Card>

            {/* 6. Additional Reps (Moved from right) */}
            {additionalCommitments && additionalCommitments.length > 0 && (
              <AdditionalRepsCard
                commitments={additionalCommitments}
                onToggle={handleToggleAdditionalRep}
                repLibrary={globalMetadata?.REP_LIBRARY?.items || []}
              />
            )}

            {/* 7. AI Coach Nudge (Was already here) */}
            <AICoachNudge 
              onOpenLab={() => navigate('coaching-lab')} 
              disabled={!(featureFlags?.enableLabs)}
            />

          </div>

          {/* Right Column */}
          <div className="space-y-6">

            {/* 1. AM/PM Bookend (Moved from left) */}
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
                onSave: handleSaveMorningWithConfirmation,
                onSaveWIN: handleSaveWIN,
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
                // **CRASH FIX**: Removed the undefined variable
                // amCompletedAt: amCompletedAt 
              }}
              dailyPracticeData={dailyPracticeData}
            />
            
            {/* 2. Social Pod (Was already here) */}
            <SocialPodCard
              podMembers={dailyPracticeData?.podMembers || []}
              activityFeed={dailyPracticeData?.podActivity || []}
              onSendMessage={(msg) => console.log('Send message:', msg)}
              onFindPod={handleFindPod}
            />

          </div>
        </div>
        {/* --- END FIX --- */}
      </div>

      {/* MODALS */}
      
      {/* **MODAL FIX**: Merged Edit/Suggestion Modal for Identity */}
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
              OR SELECT FROM SUGGESTIONS ({identitySuggestions.length} available):
            </p>
            <div className="overflow-y-auto flex-1 space-y-2">
              {isLoadingSuggestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" 
                       style={{ borderColor: COLORS.TEAL }} />
                  <p className="text-sm">Loading suggestions...</p>
                </div>
              ) : identitySuggestions.length > 0 ? (
                identitySuggestions.map((suggestion, index) => {
                  const displayText = suggestion?.text || suggestion?.value || suggestion?.name || String(suggestion);
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setIdentityStatement(displayText);
                        handleSaveIdentityWithConfirmation(displayText);
                      }}
                      className="w-full text-left p-3 rounded-lg border-2 transition-all hover:border-teal-500 hover:bg-teal-50"
                      style={{ borderColor: COLORS.SUBTLE }}
                    >
                      <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>
                        I am the kind of leader who <strong>{displayText}</strong>
                      </p>
                      {suggestion.description && (
                        <p className="text-xs mt-1 text-gray-500">{suggestion.description}</p>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 mb-2">No suggestions available.</p>
                  <p className="text-xs text-gray-500">
                    The suggestion catalog may not be loaded. Please check your metadata configuration or check the browser console for details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* **MODAL FIX**: Merged Edit/Suggestion Modal for Habit */}
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
              OR SELECT FROM SUGGESTIONS ({habitSuggestions.length} available):
            </p>
            <div className="overflow-y-auto flex-1 space-y-2">
              {isLoadingSuggestions ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-2" 
                       style={{ borderColor: COLORS.TEAL }} />
                  <p className="text-sm">Loading suggestions...</p>
                </div>
              ) : habitSuggestions.length > 0 ? (
                habitSuggestions.map((suggestion, index) => {
                  const displayText = suggestion?.text || suggestion?.value || suggestion?.name || String(suggestion);
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setHabitAnchor(displayText);
                        handleSaveHabitWithConfirmation(displayText);
                      }}
                      className="w-full text-left p-3 rounded-lg border-2 transition-all hover:border-teal-500 hover:bg-teal-50"
                      style={{ borderColor: COLORS.SUBTLE }}
                    >
                      <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>
                        When I <strong>{displayText}</strong>
                      </p>
                      {suggestion.description && (
                        <p className="text-xs mt-1 text-gray-500">{suggestion.description}</p>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-600 mb-2">No suggestions available.</p>
                  <p className="text-xs text-gray-500">
                    The suggestion catalog may not be loaded. Please check your metadata configuration or check the browser console for details.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* **MODAL FIX**: Removed separate suggestion modals */}
      {/* {showIdentitySuggestions && (...)} */}
      {/* {showHabitSuggestions && (...)} */}

      {showBonusExercise && bonusExerciseData && (
        <BonusExerciseModal
          exercise={bonusExerciseData}
          onComplete={handleCompleteBonusExercise}
          onSkip={() => setShowBonusExercise(false)}
        />
      )}

      {showFindPodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
              Find Your Accountability Pod
            </h2>
            
            {isLoadingPods ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
                     style={{ borderColor: COLORS.TEAL }} />
                <p style={{ color: COLORS.TEXT }}>Finding pods...</p>
              </div>
            ) : availablePods.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg mb-4" style={{ color: COLORS.TEXT }}>
                  No pods available right now.
                </p>
                <p className="text-sm mb-6" style={{ color: COLORS.MUTED }}>
                  New pods are created regularly. Check back soon or create your own!
                </p>
                <Button onClick={() => setShowFindPodModal(false)} variant="outline">
                  Close
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  {availablePods.map(pod => (
                    <div key={pod.id} className="border rounded-lg p-4" style={{ borderColor: COLORS.SUBTLE }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg" style={{ color: COLORS.NAVY }}>
                            {pod.name}
                          </h3>
                          <p className="text-sm" style={{ color: COLORS.MUTED }}>
                            {pod.memberCount || 0}/5 members • Focus: {pod.focusArea || 'General'}
                          </p>
                        </div>
                        <Button 
                          onClick={() => handleJoinPod(pod.id)}
                          variant="primary"
                          size="sm"
                        >
                          Join Pod
                        </Button>
                      </div>
                      {pod.description && (
                        <p className="text-sm mt-2" style={{ color: COLORS.TEXT }}>
                          {pod.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <Button 
                  onClick={() => setShowFindPodModal(false)} 
                  variant="outline" 
                  className="w-full"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <SaveIndicator show={showSaveConfirmation} message={saveMessage} />
    </div>
  );
};

export default Dashboard;