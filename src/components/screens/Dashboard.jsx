// src/components/screens/Dashboard.jsx
// FIXED: Wait for main 'isLoading' flag to ensure globalMetadata is loaded from catalog.
// FIXED: Re-ordered layout to match design screenshot.
// FIXED: Removed 'amCompletedAt' ref to fix crash.
// FIXED: Merged Anchor "Edit" and "Suggestion" modals per user request.
// **NEW FIX**: Handle multiple possible structures for REP_LIBRARY, IDENTITY_STATEMENTS, and HABIT_ANCHORS

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
    metadata: globalMetadata,
    isLoading
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
  
  const [showBonusExercise, setShowBonusExercise] = useState(false);
  const [bonusExerciseData, setBonusExerciseData] = useState(null);
  
  const [showFindPodModal, setShowFindPodModal] = useState(false);
  const [availablePods, setAvailablePods] = useState([]);
  const [isLoadingPods, setIsLoadingPods] = useState(false);

  const focusArea = 
    developmentPlanData?.currentPlan?.focusArea || 
    developmentPlanData?.focusArea || 
    developmentPlanData?.weeklyFocus?.area ||
    developmentPlanData?.focus ||
    'Not Set';
  
  const devPlanProgress = 22;

  // **FIX**: Helper function to normalize array data from Firebase
  const getArrayFromMetadata = (key) => {
    if (!globalMetadata || !globalMetadata[key]) {
      console.log(`[Dashboard] ${key} not found in metadata`);
      return [];
    }
    
    const data = globalMetadata[key];
    console.log(`[Dashboard] ${key} structure:`, data);
    
    // Case 1: Already an array
    if (Array.isArray(data)) {
      console.log(`[Dashboard] ${key} is array, length:`, data.length);
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
    // DEBUG LOGGING
    console.log('========== TARGET REP DEBUG ==========');
    console.log('[Dashboard] targetRep value:', targetRep);
    console.log('[Dashboard] targetRep type:', typeof targetRep);
    console.log('[Dashboard] globalMetadata exists:', !!globalMetadata);
    console.log('[Dashboard] globalMetadata keys:', globalMetadata ? Object.keys(globalMetadata) : 'N/A');
    
    if (!globalMetadata) {
      console.log('[Dashboard] globalMetadata is not yet available.');
      return null;
    }

    if (!targetRep) {
      console.log('[Dashboard] No target rep set');
      return null;
    }
    
    // **FIX**: Use the helper function to get the array
    const repLibrary = getArrayFromMetadata('REP_LIBRARY');
    
    if (!repLibrary || repLibrary.length === 0) {
      console.error('[Dashboard] REP_LIBRARY is empty or not loaded');
      return {
        name: targetRep,
        description: 'Rep library not loaded yet. Check your Firebase metadata/catalog document.',
        whatGreatLooksLike: 'Please ensure the REP_LIBRARY exists in your database'
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
      console.log('[Dashboard] Sample rep IDs:', repLibrary.slice(0, 3).map(r => r?.id || 'no-id'));
      return {
        name: targetRep,
        description: 'Rep not found in catalog. Please check your Development Plan.',
        whatGreatLooksLike: 'Select a new target rep from your Development Plan'
      };
    }
    
    console.log('[Dashboard] Found rep item:', repItem);
    console.log('======================================');
    
    return {
      name: repItem.text || repItem.name || repItem.id,
      description: repItem.description || repItem.text || 'No description available',
      whatGreatLooksLike: repItem.whatGreatLooksLike || repItem.description || 'Complete this practice consistently'
    };
  }, [targetRep, globalMetadata]);

  // **FIX**: Load suggestions using the helper function
  const [identitySuggestions, setIdentitySuggestions] = useState([]);
  const [habitSuggestions, setHabitSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!globalMetadata) return;
    
    console.log('[Dashboard] Loading anchor suggestions...');
    setIsLoadingSuggestions(true);
    
    try {
      // **FIX**: Use helper function for both
      const identityItems = getArrayFromMetadata('IDENTITY_STATEMENTS');
      const habitItems = getArrayFromMetadata('HABIT_ANCHORS');
      
      console.log('[Dashboard] globalMetadata keys:', Object.keys(globalMetadata));
      console.log('[Dashboard] Identity items:', identityItems.length, 'items');
      console.log('[Dashboard] Habit items:', habitItems.length, 'items');
      
      setIdentitySuggestions(identityItems);
      setHabitSuggestions(habitItems);
    } catch (error) {
      console.error('[Dashboard] Error loading suggestions:', error);
      setIdentitySuggestions([]);
      setHabitSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  }, [globalMetadata]);

  const handleSaveIdentityWithConfirmation = async (value) => {
    await handleSaveIdentity(value);
    setSaveMessage('Identity Anchor saved!');
    setShowSaveConfirmation(true);
    setShowIdentityEditor(false);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  const handleSaveHabitWithConfirmation = async (value) => {
    await handleSaveHabit(value);
    setSaveMessage('Habit Anchor saved!');
    setShowSaveConfirmation(true);
    setShowHabitEditor(false);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  const handleRepCompleteWithFeedback = async () => {
    await handleCompleteTargetRep();
    setSaveMessage('Target Rep completed! Great work! 🎯');
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  const triggerBestReminder = () => {
    setShowBestReminder(true);
    setTimeout(() => setShowBestReminder(false), 5000);
  };

  const triggerImprovementReminder = () => {
    setShowImprovementReminder(true);
    setTimeout(() => setShowImprovementReminder(false), 5000);
  };

  const handleCompleteBonusExercise = async () => {
    console.log('[Dashboard] Bonus exercise completed');
    setShowBonusExercise(false);
    setSaveMessage('Bonus exercise completed! 🌟');
    setShowSaveConfirmation(true);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  const handleFindPod = async () => {
    setShowFindPodModal(true);
    setIsLoadingPods(true);
    
    setTimeout(() => {
      setAvailablePods([
        {
          id: 'pod-1',
          name: 'Morning Momentum Crew',
          memberCount: 3,
          focusArea: 'Morning Routines',
          description: 'Dedicated to building strong morning habits and accountability'
        },
        {
          id: 'pod-2',
          name: 'Strategic Leaders',
          memberCount: 4,
          focusArea: 'Strategic Thinking',
          description: 'Focus on long-term planning and strategic decision-making'
        }
      ]);
      setIsLoadingPods(false);
    }, 1000);
  };

  const handleJoinPod = async (podId) => {
    console.log('[Dashboard] Joining pod:', podId);
    setSaveMessage('Successfully joined pod! 🎉');
    setShowSaveConfirmation(true);
    setShowFindPodModal(false);
    setTimeout(() => setShowSaveConfirmation(false), 3000);
  };

  useEffect(() => {
    if (targetRepStatus === 'completed' && !celebrationShown) {
      setCelebrationShown(true);
      setSaveMessage('🎉 Daily Rep Completed! Excellent work!');
      setShowSaveConfirmation(true);
      setTimeout(() => {
        setShowSaveConfirmation(false);
        setCelebrationShown(false);
      }, 5000);
    }
  }, [targetRepStatus, celebrationShown]);

  // Show loading state while metadata loads
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mb-3" 
               style={{ borderColor: COLORS.TEAL }} />
          <p className="font-semibold" style={{ color: COLORS.NAVY }}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10 min-h-screen" style={{ background: COLORS.BG }}>
      <header className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold flex items-center gap-3" style={{ color: COLORS.NAVY }}>
            <Home className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: COLORS.TEAL }} /> Arena Dashboard
          </h1>
          <ModeSwitch 
            isArenaMode={isArenaMode}
            isToggling={isTogglingMode}
            onToggle={handleToggleMode}
          />
        </div>
        <p className="text-sm sm:text-base md:text-lg" style={{ color: COLORS.MUTED }}>
          {isArenaMode ? 'Daily Practice Mode - Build Your Habits' : 'Strategic Planning Mode - Shape Your Future'}
        </p>
      </header>

      {showBestReminder && (
        <ReminderBanner 
          message="Don't forget to reflect on your 'Best' outcome for tomorrow!"
          type="info"
        />
      )}

      {showImprovementReminder && (
        <ReminderBanner 
          message="Consider what you could improve from today."
          type="warning"
        />
      )}

      <div className="space-y-6">
        {isArenaMode ? (
          <>
            <StreakTracker 
              streakCount={streakCount}
              streakCoins={streakCoins}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Today's Target Rep" icon={Flag} accent="TEAL">
                {!targetRep ? (
                  <div className="text-center py-8">
                    <p className="text-lg mb-4" style={{ color: COLORS.TEXT }}>
                      No target rep assigned yet
                    </p>
                    <Button onClick={() => navigate('development-plan')} variant="primary">
                      Set Your Target Rep
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
                      {targetRepDetails?.name || targetRep}
                    </h3>
                    <p className="text-sm mb-4" style={{ color: COLORS.TEXT }}>
                      {targetRepDetails?.description || 'Practice this rep today'}
                    </p>
                    {targetRepDetails?.whatGreatLooksLike && (
                      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-4">
                        <p className="text-xs font-semibold mb-1" style={{ color: COLORS.TEAL }}>
                          WHAT GREAT LOOKS LIKE:
                        </p>
                        <p className="text-sm" style={{ color: COLORS.TEXT }}>
                          {targetRepDetails.whatGreatLooksLike}
                        </p>
                      </div>
                    )}
                    <Button 
                      onClick={handleRepCompleteWithFeedback}
                      disabled={!canCompleteTargetRep || isSavingRep || targetRepStatus === 'completed'}
                      variant={targetRepStatus === 'completed' ? 'outline' : 'primary'}
                      className="w-full"
                    >
                      {targetRepStatus === 'completed' ? '✅ Completed Today' : 'Complete Target Rep'}
                    </Button>
                  </>
                )}
              </Card>

              <DevPlanProgressLink 
                focusArea={focusArea}
                progress={devPlanProgress}
                onNavigate={() => navigate('development-plan')}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <IdentityAnchorCard 
                statement={identityStatement}
                onEdit={() => setShowIdentityEditor(true)}
              />
              
              <HabitAnchorCard 
                anchor={habitAnchor}
                onEdit={() => setShowHabitEditor(true)}
              />
            </div>

            <DynamicBookendContainer 
              morningWIN={morningWIN}
              setMorningWIN={setMorningWIN}
              otherTasks={otherTasks}
              showLIS={showLIS}
              setShowLIS={setShowLIS}
              reflectionGood={reflectionGood}
              setReflectionGood={setReflectionGood}
              reflectionBetter={reflectionBetter}
              setReflectionBetter={setReflectionBetter}
              reflectionBest={reflectionBest}
              setReflectionBest={setReflectionBest}
              habitsCompleted={habitsCompleted}
              isSavingBookend={isSavingBookend}
              onSaveMorning={handleSaveMorningBookend}
              onSaveEvening={handleSaveEveningBookend}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onRemoveTask={handleRemoveTask}
              onToggleWIN={handleToggleWIN}
              onSaveWIN={handleSaveWIN}
              onHabitToggle={handleHabitToggle}
              onBestReminder={triggerBestReminder}
              onImprovementReminder={triggerImprovementReminder}
            />

            {featureFlags?.enableAdditionalReps && additionalCommitments?.length > 0 && (
              <AdditionalRepsCard commitments={additionalCommitments} />
            )}

            {featureFlags?.enableSocialPods && (
              <SocialPodCard onFindPod={handleFindPod} />
            )}

            <AICoachNudge 
              onViewExercise={(exercise) => {
                setBonusExerciseData(exercise);
                setShowBonusExercise(true);
              }}
            />
          </>
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
              Strategic Planning Mode
            </h2>
            <p className="text-lg mb-6" style={{ color: COLORS.TEXT }}>
              Navigate to specific planning tools using the sidebar.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={() => navigate('development-plan')} variant="primary">
                Development Plan
              </Button>
              <Button onClick={() => navigate('planning-hub')} variant="outline">
                Planning Hub
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      
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
               ) : ( <p className="text-sm text-gray-500">No suggestions loaded. Check your Firebase metadata.</p> )
              }
            </div>
          </div>
        </div>
      )}

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
               ) : ( <p className="text-sm text-gray-500">No suggestions loaded. Check your Firebase metadata.</p> )
              }
            </div>
          </div>
        </div>
      )}

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
