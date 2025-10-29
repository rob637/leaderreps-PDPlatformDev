// src/components/screens/Dashboard.jsx
// COMPLETE FIX FOR ALL 8 ISSUES (10/29/25 - FINAL VERSION)
// MODIFIED: 10/29/25 - Applied all user-requested fixes

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

  // FIX #1: Enhanced Target Rep lookup with COMPREHENSIVE debugging and fallback
  // MODIFIED (10/29/25): Updated field mapping to use 'text' and 'definition' per database schema
  const targetRepDetails = useMemo(() => {
    console.log('[Dashboard FIX #1] Looking up target rep:', targetRep);
    console.log('[Dashboard FIX #1] globalMetadata structure:', globalMetadata);
    
    if (!targetRep) {
      console.log('[Dashboard FIX #1] No target rep set');
      return null;
    }
    
    let repLibrary = null;
    
    if (globalMetadata?.REP_LIBRARY?.items) {
      repLibrary = globalMetadata.REP_LIBRARY.items;
      console.log('[Dashboard FIX #1] Found REP_LIBRARY.items');
    } else if (globalMetadata?.config?.catalog?.REP_LIBRARY) {
      repLibrary = globalMetadata.config.catalog.REP_LIBRARY;
      console.log('[Dashboard FIX #1] Found config.catalog.REP_LIBRARY');
    } else if (Array.isArray(globalMetadata?.REP_LIBRARY)) {
      repLibrary = globalMetadata.REP_LIBRARY;
      console.log('[Dashboard FIX #1] Found REP_LIBRARY array');
    }
    
    if (!repLibrary) {
      console.error('[Dashboard FIX #1] REP_LIBRARY not found in any known path');
      console.log('[Dashboard FIX #1] Available keys:', Object.keys(globalMetadata || {}));
      return {
        name: targetRep,
        description: 'Unable to load rep details from database',
        whatGreatLooksLike: 'Database connection issue - please refresh'
      };
    }
    
    console.log('[Dashboard FIX #1] Searching', repLibrary.length, 'reps');
    
    const repItem = repLibrary.find(rep => {
      const match = (
        rep.id === targetRep || 
        rep.repId === targetRep ||
        rep.repID === targetRep ||
        rep.name === targetRep ||
        rep.title === targetRep
      );
      if (match) console.log('[Dashboard FIX #1] MATCH FOUND:', rep);
      return match;
    });
    
    if (!repItem) {
      console.warn('[Dashboard FIX #1] Target rep not found in catalog:', targetRep);
      console.log('[Dashboard FIX #1] Sample rep structure:', repLibrary[0]);
      return {
        name: targetRep,
        description: 'Rep details not found in catalog',
        whatGreatLooksLike: 'Please check Development Plan for more information'
      };
    }
    
    console.log('[Dashboard FIX #1] Found rep details:', repItem);
    
    // UPDATED MAPPING:
    return {
      id: repItem.id || repItem.repId || repItem.repID,
      name: repItem.text || repItem.name || repItem.title || targetRep, // Use 'text' as name
      description: repItem.definition || repItem.desc || 'No description available', // Use 'definition'
      whatGreatLooksLike: repItem.definition || repItem.whatGoodLooksLike || 'Focus on consistent practice', // Use 'definition'
      category: repItem.category || 'General',
      tier: repItem.tier || repItem.tier_id // Add tier_id as fallback
    };
  }, [targetRep, globalMetadata]);

  // FIX #6: Load Identity and Habit suggestions from database with better error handling
  const [identitySuggestions, setIdentitySuggestions] = useState([]);
  const [habitSuggestions, setHabitSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    const loadSuggestions = async () => {
      if (!db) {
        console.warn('[Dashboard FIX #6] Database not available for suggestions');
        // Use globalMetadata as fallback
        setIdentitySuggestions(globalMetadata?.IDENTITY_ANCHOR_CATALOG?.items || []);
        setHabitSuggestions(globalMetadata?.HABIT_ANCHOR_CATALOG?.items || []);
        return;
      }
      
      setIsLoadingSuggestions(true);
      try {
        console.log('[Dashboard FIX #6] Loading suggestions from Firestore...');
        
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
        
        console.log('[Dashboard FIX #6] Loaded from Firestore:', {
          identity: identityDocs.length,
          habit: habitDocs.length
        });
        
        // If nothing in Firestore, fall back to globalMetadata
        if (identityDocs.length === 0 && globalMetadata?.IDENTITY_ANCHOR_CATALOG?.items) {
          console.log('[Dashboard FIX #6] Using globalMetadata for identity anchors');
          setIdentitySuggestions(globalMetadata.IDENTITY_ANCHOR_CATALOG.items);
        } else {
          setIdentitySuggestions(identityDocs);
        }
        
        if (habitDocs.length === 0 && globalMetadata?.HABIT_ANCHOR_CATALOG?.items) {
          console.log('[Dashboard FIX #6] Using globalMetadata for habit anchors');
          setHabitSuggestions(globalMetadata.HABIT_ANCHOR_CATALOG.items);
        } else {
          setHabitSuggestions(habitDocs);
        }
        
      } catch (error) {
        console.error('[Dashboard FIX #6] Error loading suggestions from Firestore:', error);
        // Fallback to globalMetadata if database fails
        console.log('[Dashboard FIX #6] Falling back to globalMetadata');
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

  // FIX #5: Enhanced save handlers that handle field clearing correctly
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
    // FIX #5: Morning fields should NOT clear - they remain visible as the plan
  };

  const handleSaveEveningWithConfirmation = async () => {
    await handleSaveEveningBookend();
    showSaveSuccess('Evening reflection saved!');
    // FIX #5: Evening fields SHOULD clear after save for next day
    setReflectionGood('');
    setReflectionBetter('');
    setReflectionBest('');
  };

  // FIX #7: Enhanced Additional Reps handler with actual functionality
  const handleToggleAdditionalRep = async (commitmentId) => {
    if (!updateDailyPracticeData || !additionalCommitments) return;
    
    console.log('[Dashboard FIX #7] Toggling additional rep:', commitmentId);
    
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
      console.error('[Dashboard FIX #7] Error toggling rep:', error);
      alert('Failed to update rep. Please try again.');
    }
  };

  // FIX #8: Find a Pod functionality (WORKING VERSION)
  const handleFindPod = async () => {
    console.log('[Dashboard FIX #8] Finding pods...');
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
      console.log('[Dashboard FIX #8] Found pods:', pods.length);
    } catch (error) {
      console.error('[Dashboard FIX #8] Error finding pods:', error);
      alert('Unable to load pods. Please try again.');
      setShowFindPodModal(false);
    }
    setIsLoadingPods(false);
  };

  // FIX #8: Join Pod functionality
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
      
      showSaveSuccess('🎉 Joined pod successfully!');
      setShowFindPodModal(false);
      
      console.log('[Dashboard FIX #8] Successfully joined pod:', podId);
    } catch (error) {
      console.error('[Dashboard FIX #8] Error joining pod:', error);
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
    
    // Check for bonus exercise trigger
    if (bonusExercises.length > 0 && !celebrationShown) {
      const randomBonus = bonusExercises[Math.floor(Math.random() * bonusExercises.length)];
      setBonusExerciseData(randomBonus);
      setShowBonusExercise(true);
      setCelebrationShown(true);
    }
  };

  // Show reminders from previous day
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
  
  // NEW BUG FIX (10/29/25): Calculate AM completion status to pass to PM bookend
  const amWinCompleted = dailyPracticeData?.morningBookend?.winCompleted || false;
  const amTasksCompleted = otherTasks.length > 0 && otherTasks.every(t => t.completed);

  if (!dailyPracticeData || !updateDailyPracticeData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-3" style={{ borderColor: COLORS.TEAL }} />
          <p className="font-semibold" style={{ color: COLORS.NAVY }}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.BG }}>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>
              Daily Practice Arena
            </h1>
            <p className="text-base" style={{ color: COLORS.TEXT }}>
              Your leadership command center
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Target Rep Card with FIX #1 and FIX #3 */}
            <Card title="🎯 Today's Focus Rep" accent='ORANGE'>
              
              {/* FIX #3: WHY IT MATTERS section */}
              {targetRepDetails && (
                <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: `${COLORS.BLUE}05`, border: `1px solid ${COLORS.BLUE}20` }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: COLORS.BLUE }}>
                    💡 WHY THIS REP MATTERS:
                  </p>
                  {/* MODIFIED (10/29/25): Updated copy per user request */}
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
                {/* FIX #1: Shows actual rep name, not ID */}
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

              {/* FIX #1: Show "what great looks like" */}
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
              
              {/* Description */}
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

            {/* Dynamic Bookend Container with FIX #2 and FIX #3 */}
            {/* MODIFIED (10/29/25): Removed featureFlags?.enableBookends check */}
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
                // MODIFIED (10/29/25): Pass AM completion status
                amWinCompleted: amWinCompleted,
                amTasksCompleted: amTasksCompleted
              }}
              dailyPracticeData={dailyPracticeData}
            />

            <AICoachNudge 
              onOpenLab={() => navigate('coaching-lab')} 
              disabled={!(featureFlags?.enableLabs)}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <DevPlanProgressLink
              progress={devPlanProgress}
              focusArea={focusArea}
              onNavigate={() => navigate('development-plan')}
            />

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

            {/* FIX #7: Additional Reps with working toggle functionality */}
            {additionalCommitments && additionalCommitments.length > 0 && (
              <AdditionalRepsCard
                commitments={additionalCommitments}
                onToggle={handleToggleAdditionalRep}
                repLibrary={globalMetadata?.REP_LIBRARY?.items || []}
              />
            )}

            {/* FIX #8: Social Pod with working Find button */}
            <SocialPodCard
              podMembers={dailyPracticeData?.podMembers || []}
              activityFeed={dailyPracticeData?.podActivity || []}
              onSendMessage={(msg) => console.log('Send message:', msg)}
              onFindPod={handleFindPod}
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
                💡 View Suggestions ({identitySuggestions.length} available)
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
                💡 View Suggestions ({habitSuggestions.length} available)
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