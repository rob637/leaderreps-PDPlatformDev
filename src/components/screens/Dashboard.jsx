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
    metadata: globalMetadata, // FIXED 10/29/25: Use 'metadata' from context
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

  // FIXED 10/29/25: Try multiple possible paths in Firebase
  const focusArea = 
    developmentPlanData?.currentPlan?.focusArea || 
    developmentPlanData?.focusArea || 
    developmentPlanData?.weeklyFocus?.area ||
    developmentPlanData?.focus ||
    'Not Set';
  
  const devPlanProgress = 22;

  // **FIX 10/29/25**: Helper function to normalize array data from Firebase
  // This handles multiple possible Firebase structures:
  // - Direct array: REP_LIBRARY: [...]
  // - Wrapped in items: REP_LIBRARY: { items: [...] }
  // - Wrapped in data: REP_LIBRARY: { data: [...] }
  const getArrayFromMetadata = (key) => {
    if (!globalMetadata || !globalMetadata[key]) {
      console.log(`[Dashboard] ${key} not found in metadata`);
      return [];
    }
    
    const data = globalMetadata[key];
    
    // Case 1: Already an array
    if (Array.isArray(data)) {
      console.log(`[Dashboard] ${key} is direct array, length:`, data.length);
      return data;
    }
    
    // Case 2: Object with 'items' property (expected structure)
    if (data.items && Array.isArray(data.items)) {
      console.log(`[Dashboard] ${key}.items is array, length:`, data.items.length);
      return data.items;
    }
    
    // Case 3: Object with 'data' property
    if (data.data && Array.isArray(data.data)) {
      console.log(`[Dashboard] ${key}.data is array, length:`, data.data.length);
      return data.data;
    }
    
    // Case 4: Try to extract values if it's an object (treat as map)
    if (typeof data === 'object' && !Array.isArray(data)) {
      const values = Object.values(data);
      if (values.length > 0 && typeof values[0] === 'object') {
        console.log(`[Dashboard] ${key} converted from object to array, length:`, values.length);
        return values;
      }
    }
    
    console.warn(`[Dashboard] ${key} has unexpected structure, returning empty array`);
    return [];
  };

  const targetRepDetails = useMemo(() => {
    // DEBUG LOGGING (ADDED 10/29/25)
    console.log('========== TARGET REP DEBUG ==========');
    console.log('[Dashboard] targetRep value:', targetRep);
    console.log('[Dashboard] targetRep type:', typeof targetRep);
    console.log('[Dashboard] globalMetadata exists:', !!globalMetadata);
    console.log('[Dashboard] globalMetadata keys:', globalMetadata ? Object.keys(globalMetadata) : 'N/A');
    console.log('[Dashboard] REP_LIBRARY exists:', !!globalMetadata?.REP_LIBRARY);
    console.log('[Dashboard] REP_LIBRARY.items exists:', !!globalMetadata?.REP_LIBRARY?.items);
    console.log('[Dashboard] REP_LIBRARY.items is array:', Array.isArray(globalMetadata?.REP_LIBRARY?.items));
    console.log('[Dashboard] REP_LIBRARY.items length:', globalMetadata?.REP_LIBRARY?.items?.length);
    
    if (globalMetadata?.REP_LIBRARY?.items?.[0]) {
      console.log('[Dashboard] First rep structure:', globalMetadata.REP_LIBRARY.items[0]);
      console.log('[Dashboard] First rep keys:', Object.keys(globalMetadata.REP_LIBRARY.items[0]));
    }
    console.log('======================================');
    
    // This console.log is very helpful for debugging
    console.log('[Dashboard] Looking up target rep:', targetRep);
    
    // With the isLoading fix, globalMetadata should be populated here.
    if (!globalMetadata) {
      console.log('[Dashboard] globalMetadata is not yet available.');
      return null;
    }

    if (!targetRep) {
      console.log('[Dashboard] No target rep set');
      return null;
    }
    
    // FIX: Correct path is globalMetadata.REP_LIBRARY.items (not just .REP_LIBRARY)
    const repLibrary = getArrayFromMetadata('REP_LIBRARY'); // Use helper function
    
    if (!repLibrary || !Array.isArray(repLibrary)) {
      console.error('[Dashboard] REP_LIBRARY.items not found or not an array');
      console.log('[Dashboard] globalMetadata.REP_LIBRARY:', globalMetadata?.REP_LIBRARY);
      console.log('[Dashboard] Available metadata keys:', Object.keys(globalMetadata || {}));
      return {
        name: targetRep,
        description: 'Rep library not loaded yet',
        whatGreatLooksLike: 'Please wait or refresh the page'
      };
    }
    
    console.log('[Dashboard] Searching', repLibrary.length, 'reps for:', targetRep);
    
    // Match against rep ID (exact match)
    const repItem = repLibrary.find(rep => {
      if (!rep) return false;
      
      // Try exact ID match first (this is the most common case)
      if (rep.id === targetRep) {
        console.log('[Dashboard] Found exact ID match:', rep);
        return true;
      }
      
      // Try case-insensitive ID match
      if (rep.id?.toLowerCase() === targetRep.toLowerCase()) {
        console.log('[Dashboard] Found case-insensitive ID match:', rep);
        return true;
      }
      
      // Fallback: try matching against text/name
      if (rep.text === targetRep || rep.name === targetRep) {
        console.log('[Dashboard] Found text/name match:', rep);
        return true;
      }
      
      return false;
    });
    
    if (!repItem) {
      console.warn('[Dashboard] Target rep not found in catalog:', targetRep);
      console.log('[Dashboard] Sample rep IDs:', repLibrary.slice(0, 3).map(r => r.id));
      return {
        name: targetRep,
        description: 'Rep not found in catalog. Please check your Development Plan.',
        whatGreatLooksLike: 'Select a new target rep from your Development Plan'
      };
    }
    
    console.log('[Dashboard] Successfully found rep:', repItem);
    
    // Map Firebase fields to display fields
    return {
      id: repItem.id,
      name: repItem.text || repItem.name || targetRep,  // 'text' is the display name in Firebase
      description: repItem.definition || repItem.description || 'No description available',  // 'definition' is the description
      whatGreatLooksLike: repItem.definition || 'Practice this rep consistently',
      category: repItem.category || 'General',
      tier: repItem.tier_id || repItem.tier
    };
  }, [targetRep, globalMetadata]);

  const [identitySuggestions, setIdentitySuggestions] = useState([]);
  const [habitSuggestions, setHabitSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  
  useEffect(() => {
    console.log('[Dashboard] Loading anchor suggestions...');
    
    if (!globalMetadata) {
      console.log('[Dashboard] globalMetadata not available yet');
      return;
    }
    
    console.log('[Dashboard] globalMetadata keys:', Object.keys(globalMetadata));
    
    try {
      // FIX 10/29/25: Use helper function to handle any structure
      const identityItems = getArrayFromMetadata('IDENTITY_ANCHOR_CATALOG');
      const habitItems = getArrayFromMetadata('HABIT_ANCHOR_CATALOG');
      
      console.log('[Dashboard] Identity items:', identityItems.length, 'items');
      console.log('[Dashboard] Habit items:', habitItems.length, 'items');
      
      if (!Array.isArray(identityItems)) {
        console.warn('[Dashboard] Identity items not an array:', typeof identityItems);
      }
      if (!Array.isArray(habitItems)) {
        console.warn('[Dashboard] Habit items not an array:', typeof habitItems);
      }
      
      // These are already strings, just wrap them in objects with 'text' property
      const identity = identityItems.map(x => 
        typeof x === 'string' ? { text: x } : (x.text ? x : { text: String(x) })
      );
      const habits = habitItems.map(x => 
        typeof x === 'string' ? { text: x } : (x.text ? x : { text: String(x) })
      );
      
      setIdentitySuggestions(identity);
      setHabitSuggestions(habits);
      setIsLoadingSuggestions(false);
      
      console.log('[Dashboard] Loaded', identity.length, 'identity and', habits.length, 'habit suggestions');
    } catch (error) {
      console.error('[Dashboard] Failed to load anchor suggestions:', error);
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
    
    // CRITICAL FIX (10/29/25): Delete the duplicate flat fields that were created incorrectly
    try {
      const { deleteField } = await import('firebase/firestore');
      
      await updateDailyPracticeData({
        'eveningBookend.good': '',
        'eveningBookend.better': '',
        'eveningBookend.best': '',
        // Also delete the incorrect flat fields if they exist
        'eveningBookend.best': deleteField(),
        'eveningBookend.better': deleteField(),
        'eveningBookend.good': deleteField()
      });
    } catch (error) {
      console.error('[Dashboard] Error clearing reflection fields:', error);
    }
    
    showSaveSuccess('Evening reflection saved!');
    setReflectionGood('');
    setReflectionBetter('');
    setReflectionBest('');
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
      
      // FIXED 10/29/25: Use Firebase v9+ modular syntax
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      
      // Try the artifacts path first
      const appId = globalMetadata?.APP_ID || 'default-app-id';
      let podsRef = collection(db, 'artifacts', appId, 'pods');
      let q = query(podsRef, where('status', '==', 'active'));
      let podsSnapshot = await getDocs(q);
      
      // If no pods found, try root level
      if (podsSnapshot.empty) {
        console.log('[Dashboard] No pods in artifacts path, trying root level...');
        podsRef = collection(db, 'pods');
        q = query(podsRef, where('status', '==', 'active'));
        podsSnapshot = await getDocs(q);
      }
      
      // If still no pods, try community collection
      if (podsSnapshot.empty) {
        console.log('[Dashboard] No pods in root, trying community collection...');
        podsRef = collection(db, 'community', 'pods');
        q = query(podsRef, where('status', '==', 'active'));
        podsSnapshot = await getDocs(q);
      }
      
      let pods = podsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter pods with space
      pods = pods.filter(p => (p.memberCount || 0) < (p.maxMembers || 5));
      
      setAvailablePods(pods);
      console.log('[Dashboard] Found pods:', pods.length);
      
      if (pods.length === 0) {
        alert('No pods available at the moment. Please create a new pod or check back later.');
      }
    } catch (error) {
      console.error('[Dashboard] Error finding pods:', error);
      console.error('[Dashboard] Error code:', error.code);
      console.error('[Dashboard] Error message:', error.message);
      alert(`Unable to load pods: ${error.message}`);
      setShowFindPodModal(false);
    } finally {
      setIsLoadingPods(false);
    }
  };

  const handleJoinPod = async (podId) => {
    if (!db || !userEmail) return;
    
    try {
      // FIXED 10/29/25: Use Firebase v9+ modular syntax
      const { doc, updateDoc, arrayUnion, increment } = await import('firebase/firestore');
      
      // Use the same path logic as finding pods
      const appId = globalMetadata?.APP_ID || 'default-app-id';
      const podRef = doc(db, 'artifacts', appId, 'pods', podId);
      
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
      alert(`Failed to join pod: ${error.message}`);
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

            {/* 5. Daily Reflection Log */}
            <Card title="Daily Reflection Log">
              <p className="text-sm text-gray-600 mb-4">
                Review your past entries and reflections.
              </p>
              <Button 
                variant="outline" 
                onClick={() => navigate('reflection-log')}
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
              OR SELECT FROM SUGGESTIONS:
            </p>
            <div className="overflow-y-auto flex-1 space-y-2">
              {isLoadingSuggestions ? ( <p>Loading suggestions...</p> ) : 
               identitySuggestions.length > 0 ? (
                identitySuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const value = suggestion.text || suggestion.value || suggestion.name || suggestion;
                      setIdentityStatement(value);
                      handleSaveIdentityWithConfirmation(value);
                    }}
                    className="w-full text-left p-3 rounded-lg border-2 transition-all hover:border-teal-500 hover:bg-teal-50"
                    style={{ borderColor: COLORS.SUBTLE }}
                  >
                    <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>
                      ... <strong>{suggestion.text || suggestion.value || suggestion.name || suggestion}</strong>
                    </p>
                  </button>
                ))
               ) : ( <p className="text-sm text-gray-500">No suggestions loaded.</p> )
              }
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
              OR SELECT FROM SUGGESTIONS:
            </p>
            <div className="overflow-y-auto flex-1 space-y-2">
              {isLoadingSuggestions ? ( <p>Loading suggestions...</p> ) : 
               habitSuggestions.length > 0 ? (
                habitSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      const value = suggestion.text || suggestion.value || suggestion.name || suggestion;
                      setHabitAnchor(value);
                      handleSaveHabitWithConfirmation(value);
                    }}
                    className="w-full text-left p-3 rounded-lg border-2 transition-all hover:border-teal-500 hover:bg-teal-50"
                    style={{ borderColor: COLORS.SUBTLE }}
                  >
                    <p className="text-sm font-medium" style={{ color: COLORS.TEXT }}>
                      ... <strong>{suggestion.text || suggestion.value || suggestion.name || suggestion}</strong>
                    </p>
                  </button>
                ))
               ) : ( <p className="text-sm text-gray-500">No suggestions loaded.</p> )
              }
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