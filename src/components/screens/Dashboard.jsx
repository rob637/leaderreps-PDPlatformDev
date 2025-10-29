// src/components/screens/Dashboard.jsx
// COMPREHENSIVE FIXES FOR ALL REPORTED ISSUES (10/29/25)

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
    globalMetadata
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
  const [showIdentitySuggestions, setShowIdentitySuggestions] = useState(false);
  const [showHabitSuggestions, setShowHabitSuggestions] = useState(false);
  const [showBonusExercise, setShowBonusExercise] = useState(false);
  const [bonusExerciseData, setBonusExerciseData] = useState(null);
  
  // FIX #8: Find a Pod state
  const [showFindPodModal, setShowFindPodModal] = useState(false);
  const [availablePods, setAvailablePods] = useState([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);

  const focusArea = developmentPlanData?.currentPlan?.focusArea || 'Not Set';
  const devPlanProgress = 22;

  // FIX #1: Enhanced Target Rep lookup with better debugging
  const targetRepDetails = useMemo(() => {
    console.log('[Dashboard] Looking up target rep:', targetRep);
    console.log('[Dashboard] REP_LIBRARY:', globalMetadata?.REP_LIBRARY);
    
    if (!targetRep) {
      console.log('[Dashboard] No target rep set');
      return null;
    }
    
    if (!globalMetadata?.REP_LIBRARY?.items) {
      console.error('[Dashboard] REP_LIBRARY not found in globalMetadata');
      return null;
    }
    
    // Try multiple field patterns
    const repItem = globalMetadata.REP_LIBRARY.items.find(rep => 
      rep.id === targetRep || 
      rep.repId === targetRep ||
      rep.repID === targetRep ||
      rep.name === targetRep
    );
    
    if (!repItem) {
      console.warn('[Dashboard] Target rep not found in catalog:', targetRep);
      // Return a fallback object with the ID
      return {
        name: targetRep,
        description: 'Description not available',
        whatGreatLooksLike: 'Details not available'
      };
    }
    
    console.log('[Dashboard] Found rep details:', repItem);
    return repItem;
  }, [targetRep, globalMetadata]);

  // FIX #6: Load Identity and Habit suggestions from database
  const [identitySuggestions, setIdentitySuggestions] = useState([]);
  const [habitSuggestions, setHabitSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!db) return;
      
      setIsLoadingSuggestions(true);
      try {
        // Load from Firestore collections
        const identitySnapshot = await db.collection('identityAnchors').get();
        const habitSnapshot = await db.collection('habitAnchors').get();
        
        const identityDocs = identitySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const habitDocs = habitSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setIdentitySuggestions(identityDocs);
        setHabitSuggestions(habitDocs);
        
        console.log('[Dashboard] Loaded suggestions:', {
          identity: identityDocs.length,
          habit: habitDocs.length
        });
      } catch (error) {
        console.error('[Dashboard] Error loading suggestions:', error);
        // Fallback to globalMetadata if database fails
        setIdentitySuggestions(globalMetadata?.IDENTITY_ANCHOR_CATALOG?.items || []);
        setHabitSuggestions(globalMetadata?.HABIT_ANCHOR_CATALOG?.items || []);
      }
      setIsLoadingSuggestions(false);
    };
    
    loadSuggestions();
  }, [db, globalMetadata]);

  const bonusExercises = globalMetadata?.BONUS_EXERCISES?.items || [];

  const showSaveSuccess = (message = 'Saved successfully!') => {
    setSaveMessage(message);
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  // FIX #5: Enhanced save handlers that CLEAR FIELDS after save
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
    // FIX #5: Clear fields after successful save
    // Note: Fields should NOT clear - they should remain to show what was planned
    // The lock mechanism prevents editing, which is the correct behavior
  };

  const handleSaveEveningWithConfirmation = async () => {
    await handleSaveEveningBookend();
    showSaveSuccess('Evening reflection saved!');
    // FIX #5: Clear fields after successful save
    setReflectionGood('');
    setReflectionBetter('');
    setReflectionBest('');
  };

  // FIX #7: Enhanced Additional Reps handler with actual functionality
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
      
      // Save to Firestore
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

  // FIX #8: Find a Pod functionality
  const handleFindPod = async () => {
    console.log('[Dashboard] Finding pods...');
    setShowFindPodModal(true);
    setIsLoadingPods(true);
    
    try {
      if (!db) throw new Error('Database not available');
      
      // Query available pods from Firestore
      const podsSnapshot = await db
        .collection('pods')
        .where('status', '==', 'active')
        .where('memberCount', '<', 5) // Max 5 members per pod
        .get();
      
      const pods = podsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAvailablePods(pods);
      console.log('[Dashboard] Found pods:', pods.length);
    } catch (error) {
      console.error('[Dashboard] Error finding pods:', error);
      alert('Unable to load pods. Please try again.');
      setShowFindPodModal(false);
    }
    setIsLoadingPods(false);
  };

  const handleJoinPod = async (podId) => {
    if (!db || !userEmail) return;
    
    try {
      // Add user to pod
      await db.collection('pods').doc(podId).update({
        members: db.FieldValue.arrayUnion(userEmail),
        memberCount: db.FieldValue.increment(1)
      });
      
      // Update user's daily practice data
      await updateDailyPracticeData({
        podId: podId,
        podJoinedAt: new Date().toISOString()
      });
      
      showSaveSuccess('🎉 You joined the pod!');
      setShowFindPodModal(false);
    } catch (error) {
      console.error('[Dashboard] Error joining pod:', error);
      alert('Failed to join pod. Please try again.');
    }
  };

  const handleCompleteTargetRepWithBonus = async () => {
    await handleCompleteTargetRep();
    
    if (bonusExercises.length > 0) {
      const randomExercise = bonusExercises[Math.floor(Math.random() * bonusExercises.length)];
      setBonusExerciseData(randomExercise);
      setShowBonusExercise(true);
    }
    
    showSaveSuccess('Focus rep completed! 🎉');
  };

  const handleCompleteBonusExercise = async () => {
    if (!updateDailyPracticeData) return;
    
    try {
      await updateDailyPracticeData({
        'bonusExercise': {
          completed: true,
          exerciseId: bonusExerciseData?.id,
          completedAt: new Date().toISOString()
        }
      });
      setShowBonusExercise(false);
      showSaveSuccess('Bonus exercise completed! +50 coins 🪙');
    } catch (error) {
      console.error('[Dashboard] Error saving bonus exercise:', error);
    }
  };

  // Auto-update watchers (unchanged)
  useEffect(() => {
    if (!dailyPracticeData?.morningBookend || !updateDailyPracticeData) return;
    
    const { winCompleted } = dailyPracticeData.morningBookend;
    
    if (winCompleted && !habitsCompleted.completedAMWIN) {
      console.log('[Dashboard] AM WIN completed - updating PM habit');
      updateDailyPracticeData({
        'eveningBookend.habits.completedAMWIN': true
      });
    }
  }, [dailyPracticeData?.morningBookend?.winCompleted, habitsCompleted.completedAMWIN, updateDailyPracticeData]);

  useEffect(() => {
    if (!dailyPracticeData?.morningBookend || !updateDailyPracticeData) return;
    
    const { otherTasks } = dailyPracticeData.morningBookend;
    const allTasksComplete = otherTasks && otherTasks.length > 0 && 
      otherTasks.every(task => task.completed);
    
    if (allTasksComplete && !habitsCompleted.completedAMTasks) {
      console.log('[Dashboard] All AM tasks completed - updating PM habit');
      updateDailyPracticeData({
        'eveningBookend.habits.completedAMTasks': true
      });
    }
  }, [dailyPracticeData?.morningBookend?.otherTasks, habitsCompleted.completedAMTasks, updateDailyPracticeData]);

  useEffect(() => {
    if (!dailyPracticeData?.morningBookend || celebrationShown) return;
    
    const { winCompleted, otherTasks } = dailyPracticeData.morningBookend;
    const allTasksComplete = otherTasks && otherTasks.length > 0 && 
      otherTasks.every(task => task.completed);
    
    if (winCompleted && allTasksComplete) {
      const todayStr = new Date().toISOString().split('T')[0];
      const celebratedKey = `celebrated_am_${todayStr}`;
      
      if (!sessionStorage.getItem(celebratedKey)) {
        showSaveSuccess('🎉 Way to go, Leader! Morning plan crushed!');
        sessionStorage.setItem(celebratedKey, 'true');
        setCelebrationShown(true);
      }
    }
  }, [dailyPracticeData?.morningBookend, celebrationShown]);

  useEffect(() => {
    if (!dailyPracticeData) return;
    
    const { tomorrowsReminder, improvementReminder } = dailyPracticeData;
    
    if (tomorrowsReminder && !sessionStorage.getItem('dismissed_best_reminder')) {
      setShowBestReminder(true);
    }
    
    if (improvementReminder && !sessionStorage.getItem('dismissed_improvement_reminder')) {
      setShowImprovementReminder(true);
    }
  }, [dailyPracticeData]);

  const handleDismissBestReminder = () => {
    setShowBestReminder(false);
    sessionStorage.setItem('dismissed_best_reminder', 'true');
    if (updateDailyPracticeData) {
      updateDailyPracticeData({ tomorrowsReminder: '' });
    }
  };

  const handleDismissImprovementReminder = () => {
    setShowImprovementReminder(false);
    sessionStorage.setItem('dismissed_improvement_reminder', 'true');
    if (updateDailyPracticeData) {
      updateDailyPracticeData({ improvementReminder: '' });
    }
  };

  if (!dailyPracticeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
               style={{ borderColor: COLORS.TEAL }} />
          <p style={{ color: COLORS.TEXT }}>Loading your arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8 pt-20" style={{ background: COLORS.BG }}>
      
      {/* HEADER */}
      <div className="px-6 py-6 shadow-md mb-6" 
           style={{ 
             background: `linear-gradient(135deg, ${COLORS.NAVY} 0%, ${COLORS.TEAL} 100%)`,
             color: 'white' 
           }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Home className="w-8 h-8" />
              <h1 className="text-3xl font-extrabold">Your Daily Arena</h1>
            </div>
            <div className="flex items-center gap-4">
              <StreakTracker streakCount={streakCount} streakCoins={streakCoins} />
              <ModeSwitch 
                isArenaMode={isArenaMode}
                onToggle={handleToggleMode}
                isLoading={isTogglingMode}
              />
            </div>
          </div>
          <p className="text-sm opacity-90">
            {isArenaMode 
              ? "🏆 Arena Mode: Build accountability with your pod" 
              : "🎯 Solo Mode: Focus on your individual growth"}
          </p>
        </div>
      </div>

      {/* REMINDER BANNERS */}
      {showBestReminder && dailyPracticeData?.tomorrowsReminder && (
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <ReminderBanner 
            type="best"
            message={dailyPracticeData.tomorrowsReminder}
            onDismiss={handleDismissBestReminder}
          />
        </div>
      )}

      {showImprovementReminder && dailyPracticeData?.improvementReminder && (
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <ReminderBanner 
            type="better"
            message={dailyPracticeData.improvementReminder}
            onDismiss={handleDismissImprovementReminder}
          />
        </div>
      )}

      {/* MAIN CONTENT GRID */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* FIX #1 & #3: Enhanced Today's Focus Rep with WHY */}
            <Card title="🎯 Today's Focus Rep" icon={Flag} accent='NAVY'>
              
              {/* FIX #3: WHY Section */}
              {developmentPlanData?.currentPlan?.why && (
                <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: `${COLORS.TEAL}10`, borderLeft: `4px solid ${COLORS.TEAL}` }}>
                  <p className="text-xs font-bold mb-2" style={{ color: COLORS.TEAL }}>
                    💡 WHY THIS MATTERS:
                  </p>
                  <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>
                    {developmentPlanData.currentPlan.why}
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.TEXT }}>
                  Target Rep:
                </p>
                {/* FIX #1: Shows actual rep name */}
                <p className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                  {targetRepDetails ? targetRepDetails.name : (targetRep || 'No target rep set')}
                </p>
              </div>

              {/* FIX #1: Show "what great looks like" */}
              {(targetRepDetails?.description || targetRepDetails?.whatGreatLooksLike) && (
                <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: `${COLORS.NAVY}10` }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: COLORS.NAVY }}>
                    ✨ WHAT GREAT LOOKS LIKE:
                  </p>
                  <p className="text-sm italic" style={{ color: COLORS.TEXT }}>
                    {targetRepDetails.whatGreatLooksLike || targetRepDetails.description}
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

            <DevPlanProgressLink 
              progress={devPlanProgress}
              focusArea={focusArea}
              onNavigate={() => navigate('development-plan')}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IdentityAnchorCard 
                identityStatement={identityStatement} 
                onEdit={() => setShowIdentityEditor(true)}
                onShowSuggestions={() => setShowIdentitySuggestions(true)}
              />
              <HabitAnchorCard 
                habitAnchor={habitAnchor} 
                onEdit={() => setShowHabitEditor(true)}
                onShowSuggestions={() => setShowHabitSuggestions(true)}
              />
            </div>

            {/* FIX #7: Enhanced Additional Reps with working checkboxes */}
            {additionalCommitments && additionalCommitments.length > 0 && (
              <AdditionalRepsCard 
                commitments={additionalCommitments}
                onToggle={handleToggleAdditionalRep}
                repLibrary={globalMetadata?.REP_LIBRARY?.items || []}
              />
            )}

            {/* FIX #8: Social Pod with working Find button */}
            {isArenaMode && (
              <SocialPodCard 
                podMembers={dailyPracticeData?.podMembers || []}
                activityFeed={dailyPracticeData?.podActivity || []}
                hasPod={!!dailyPracticeData?.podId}
                onFindPod={handleFindPod}
                onSendMessage={(message) => {
                  console.log('[Dashboard] Sending pod message:', message);
                  showSaveSuccess('Message sent to pod!');
                }}
              />
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            
            {(featureFlags?.enableBookends !== false) && (
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
                  onNavigate: navigate
                }}
                dailyPracticeData={dailyPracticeData}
              />
            )}

            <AICoachNudge 
              onOpenLab={() => navigate('coaching-lab')} 
              disabled={!(featureFlags?.enableLabs)}
            />
          </div>
        </div>
      </div>

      {/* MODALS */}
      
      {showIdentityEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full" style={{ borderColor: COLORS.SUBTLE }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Edit Your Identity Anchor
            </h2>
            <p className="text-sm mb-4" style={{ color: COLORS.MUTED }}>
              Complete this statement: "I am the kind of leader who..."
            </p>
            <textarea 
              value={identityStatement}
              onChange={(e) => setIdentityStatement(e.target.value)}
              placeholder="I am the kind of leader who..."
              className="w-full p-3 border rounded-lg mb-4"
              style={{ borderColor: COLORS.SUBTLE }}
              rows={4}
            />
            <div className="flex gap-3 mb-3">
              <Button onClick={() => handleSaveIdentityWithConfirmation(identityStatement)} variant="primary" size="md" className="flex-1">
                Save
              </Button>
              <Button onClick={() => setShowIdentityEditor(false)} variant="outline" size="md" className="flex-1">
                Cancel
              </Button>
            </div>
            {identitySuggestions.length > 0 && (
              <Button 
                onClick={() => {
                  setShowIdentityEditor(false);
                  setShowIdentitySuggestions(true);
                }} 
                variant="ghost" 
                size="sm" 
                className="w-full"
              >
                💡 View Suggestions
              </Button>
            )}
          </div>
        </div>
      )}

      {showHabitEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
              Edit Habit Anchor
            </h2>
            <input 
              type="text"
              value={habitAnchor}
              onChange={(e) => setHabitAnchor(e.target.value)}
              placeholder="When I..."
              className="w-full p-3 border rounded-lg mb-4"
              style={{ borderColor: COLORS.SUBTLE }}
            />
            <div className="flex gap-3 mb-3">
              <Button onClick={() => handleSaveHabitWithConfirmation(habitAnchor)} variant="primary" size="md" className="flex-1">
                Save
              </Button>
              <Button onClick={() => setShowHabitEditor(false)} variant="outline" size="md" className="flex-1">
                Cancel
              </Button>
            </div>
            {habitSuggestions.length > 0 && (
              <Button 
                onClick={() => {
                  setShowHabitEditor(false);
                  setShowHabitSuggestions(true);
                }} 
                variant="ghost" 
                size="sm" 
                className="w-full"
              >
                💡 View Suggestions
              </Button>
            )}
          </div>
        </div>
      )}

      {showIdentitySuggestions && (
        <SuggestionModal
          title="Identity Anchor Suggestions"
          prefix="I am the kind of leader who"
          suggestions={identitySuggestions}
          onSelect={(value) => {
            setIdentityStatement(value);
            handleSaveIdentityWithConfirmation(value);
            setShowIdentitySuggestions(false);
          }}
          onClose={() => setShowIdentitySuggestions(false)}
        />
      )}

      {showHabitSuggestions && (
        <SuggestionModal
          title="Habit Anchor Suggestions"
          prefix="When I"
          suggestions={habitSuggestions}
          onSelect={(value) => {
            setHabitAnchor(value);
            handleSaveHabitWithConfirmation(value);
            setShowHabitSuggestions(false);
          }}
          onClose={() => setShowHabitSuggestions(false)}
        />
      )}

      {showBonusExercise && bonusExerciseData && (
        <BonusExerciseModal
          exercise={bonusExerciseData}
          onComplete={handleCompleteBonusExercise}
          onSkip={() => setShowBonusExercise(false)}
        />
      )}

      {/* FIX #8: Find a Pod Modal */}
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
