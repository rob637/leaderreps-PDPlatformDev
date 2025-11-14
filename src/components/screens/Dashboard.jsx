// src/components/screens/Dashboard.jsx
// FINAL VERSION - Updated 10/30/25
// FIX: Anchor deletion logic implemented in handleDeletePlanAndReset (Issue 1).
// FIX: Added defensive checks for arrays after deletion to prevent React error #31.
// UX: Implemented floating/blinking Anchor FAB and Test Utilities.
// UX: REMOVED LeadershipAnchorsCard for prominence of FAB.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService } from '../../services/membershipService.js';
import { ArrowRight, Edit3, Loader, X, Users, Send, Target, Clock, Zap, Shield, Trash2, Anchor } from 'lucide-react'; 
import { deleteField, updateDoc, doc } from 'firebase/firestore'; // Used for reminder dismissals
import { MembershipGate } from '../ui/MembershipGate.jsx';
import { COLORS } from './dashboard/dashboardConstants.js';

// Import modular components from the file you provided
import {
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
  AdditionalRepsCard
  // LeadershipAnchorsCard REMOVED per user request
  // ===========================
} from './dashboard/DashboardComponents.jsx';
import TestUtilsModal from './dashboard/TestUtilsModal.jsx';// Arena v1.0 Scope: Import Daily Tasks component to replace Social Pod
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
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeTimestamps(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};


// --- Helper Components (Membership-Aware Start Card per Arena v1.0 Scope) ---
const GetStartedCard = ({ onNavigate, membershipData, developmentPlanData, currentTier }) => {
  const hasCompletedPlan = developmentPlanData?.currentPlan && 
    developmentPlanData.currentPlan.focusAreas && 
    developmentPlanData.currentPlan.focusAreas.length > 0;
  
  console.log('[GetStartedCard] Rendering with tier:', currentTier, 'hasCompletedPlan:', hasCompletedPlan);
  console.log('[GetStartedCard] onNavigate type:', typeof onNavigate);
  console.log('[GetStartedCard] onNavigate function:', onNavigate);

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
            onClick={() => {
              console.log('[Dashboard] View Plans button clicked, navigating to membership-upgrade');
              onNavigate('membership-upgrade');
            }}
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
          onClick={() => onNavigate('/development-plan')}
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

const Dashboard = (props) => {
  const { 
    db, 
    user, 
    dailyPracticeData, 
    updateDailyPracticeData,
    membershipData,
    setCurrentScreen: _setCurrentScreen,
    userData,
    localAnchor,
    setLocalAnchor,
    developmentPlanData,
    progressData,
    userAnchorData,
    quickstartData,
    repsData
  } = useAppServices();
  
  // Get simulatedTier from props (passed from ScreenRouter)
  const { simulatedTier } = props;
  
  const {
    // Add anchor data from DashboardHooks
    identityStatement,
    habitAnchor,
    whyStatement,
    handleSaveIdentity,
    handleSaveHabit,
    handleSaveWhy,
    // Add evening bookend data
    reflectionGood,
    setReflectionGood,
    reflectionBetter,
    setReflectionBetter,
    reflectionBest,
    setReflectionBest,
    habitsCompleted,
    handleHabitToggle,
    handleSaveEveningBookend,
    isSavingBookend,
    // Add morning bookend and task data
    morningWIN,
    otherTasks,
    handleAddTask,
    handleToggleTask,
    handleRemoveTask,
    handleToggleWIN,
    amWinCompleted
  } = useDashboard({
    ...props,
    dailyPracticeData,
    updateDailyPracticeData
  });

  console.log('[Dashboard] Component rendering, simulatedTier:', props.simulatedTier);
  console.log('[Dashboard] _setCurrentScreen type:', typeof _setCurrentScreen);

  // Debug wrapper for setCurrentScreen
  const setCurrentScreen = (screen) => {
    console.log('[Dashboard] setCurrentScreen called with:', screen);
    if (typeof _setCurrentScreen === 'function') {
      _setCurrentScreen(screen);
    } else {
      console.error('[Dashboard] setCurrentScreen is not a function:', typeof _setCurrentScreen);
    }
  };

  const [visibleComponents, setVisibleComponents] = useState([
    'mode', 'streak', 'getStarted', 'dynamicBookend', 'devPlanProgress', 'aiCoachNudge'
  ]);
  const [reminders, setReminders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [selectedBonusExercise, setSelectedBonusExercise] = useState(null);
  const [testUtilsOpen, setTestUtilsOpen] = useState(false);

  // Anchor states (Unified)
  const [showAnchorModal, setShowAnchorModal] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Use simulatedTier if available (for testing), otherwise use actual membershipData
  const currentTier = simulatedTier || membershipData?.currentTier || 'basic';
  const isMemberPro = membershipService.hasAccess(currentTier, 'professional');
  const isMemberPremium = membershipService.hasAccess(currentTier, 'elite');

  // -------------------------------
  // Compute Anchor State (Unified)
  // -------------------------------
  const hasActiveAnchor = useMemo(() => {
    return Boolean(
      (localAnchor && localAnchor.text) ||
      (userAnchorData && userAnchorData.anchor && userAnchorData.anchor.text)
    );
  }, [localAnchor, userAnchorData]);

  const anchorText = useMemo(() => {
    return localAnchor?.text || userAnchorData?.anchor?.text || '';
  }, [localAnchor, userAnchorData]);

  const anchorSetDate = useMemo(() => {
    let date = localAnchor?.createdAt || userAnchorData?.anchor?.createdAt;
    if (date && typeof date.toDate === 'function') {
      return date.toDate();
    }
    if (date instanceof Date) {
      return date;
    }
    return null;
  }, [localAnchor, userAnchorData]);

  // This anchor FAB should be visible IF there is an active plan and the user is Pro/Premium:
  const hasDevelopmentPlan = Boolean(
    developmentPlanData?.currentPlan &&
    developmentPlanData.currentPlan.focusAreas &&
    developmentPlanData.currentPlan.focusAreas.length > 0
  );

  const showAnchorFAB = hasDevelopmentPlan && (isMemberPro || isMemberPremium);

  // Daily practice mode
  const [dailyMode, setDailyMode] = useState(
    membershipData?.isStudyMode !== undefined ? membershipData.isStudyMode : true
  );

  useEffect(() => {
    if (membershipData?.isStudyMode !== undefined) {
      setDailyMode(membershipData.isStudyMode);
    }
  }, [membershipData?.isStudyMode]);

  const toggleDailyMode = useCallback(async () => {
    const newMode = !dailyMode;
    setDailyMode(newMode);

    if (user && db) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          isStudyMode: newMode
        });
      } catch (error) {
        console.error('Error updating daily mode:', error);
        setDailyMode(!newMode);
      }
    }
  }, [dailyMode, user, db]);

  // Load reminders from progressData
  useEffect(() => {
    if (!progressData) return;
    const activeReminders = [];
    if (progressData.reminders) {
      Object.entries(progressData.reminders).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value.dismissedAt === undefined) {
          activeReminders.push({ ...value, key });
        }
      });
    }
    setReminders(activeReminders);
  }, [progressData]);

  // Dismiss reminder handler
  const handleDismissReminder = useCallback(async (reminderKey) => {
    if (user && db) {
      try {
        const updates = {
          [`reminders.${reminderKey}`]: deleteField()
        };
        await updateDoc(doc(db, 'progress', user.uid), updates);
        setReminders(prevReminders => prevReminders.filter(r => r.key !== reminderKey));
      } catch (error) {
        console.error('Error dismissing reminder:', error);
      }
    }
  }, [user, db]);

  // Dynamic Bookend (Morning/Evening)
  const bookendType = useMemo(() => {
    const hour = new Date().getHours();
    return (hour >= 5 && hour < 12) ? 'morning' : 'evening';
  }, []);

  // Current week from development plan (if available)
  const currentWeekNumber = useMemo(() => {
    return developmentPlanData?.currentPlan?.currentWeek || 1;
  }, [developmentPlanData]);

  // Bonus exercises (AdditionalRepsCard)
  const bonusExercises = useMemo(() => {
    if (!developmentPlanData?.currentPlan?.focusAreas?.length) return [];
    const allExercises = developmentPlanData.currentPlan.focusAreas
      .flatMap((area, areaIndex) => {
        const weekData = area.weeks?.[currentWeekNumber - 1];
        if (!weekData?.bonusExercises) return [];
        return weekData.bonusExercises.map((ex, exIndex) => ({
          ...ex,
          areaIndex,
          areaName: area.name,
          weekNumber: currentWeekNumber
        }));
      });
    return allExercises;
  }, [developmentPlanData, currentWeekNumber]);

  const handleBonusExerciseClick = useCallback((exercise) => {
    setSelectedBonusExercise(exercise);
    setShowBonusModal(true);
  }, []);

  const handleBonusModalClose = useCallback(() => {
    setShowBonusModal(false);
    setSelectedBonusExercise(null);
  }, []);

  // --------------------
  // ANCHOR HANDLERS (Unified)
  // --------------------
  const handleSaveAnchor = useCallback(async (anchorData) => {
    if (!anchorData) return;
    
    setIsSaving(true);
    
    try {
      // Save all three anchors using the hook functions
      if (anchorData.identity && handleSaveIdentity) {
        await handleSaveIdentity(anchorData.identity);
      }
      if (anchorData.habit && handleSaveHabit) {
        await handleSaveHabit(anchorData.habit);
      }
      if (anchorData.why && handleSaveWhy) {
        await handleSaveWhy(anchorData.why);
      }
      
      setIsEditorOpen(false);
    } catch (error) {
      console.error('Error saving anchors:', error);
    } finally {
      setIsSaving(false);
    }
  }, [handleSaveIdentity, handleSaveHabit, handleSaveWhy]);

  const handleDeleteAnchor = useCallback(async () => {
    if (!user || !db) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'user_anchors', user.uid), {
        anchor: deleteField()
      });
      setLocalAnchor(null);
      setShowAnchorModal(false);
      setIsEditorOpen(false);
    } catch (error) {
      console.error('Error deleting anchor:', error);
    } finally {
      setIsSaving(false);
    }
  }, [user, db, setLocalAnchor]);

  const handleAnchorModalOpen = useCallback(() => {
    setShowAnchorModal(true);
  }, []);

  const handleAnchorModalClose = useCallback(() => {
    setShowAnchorModal(false);
  }, []);

  const handleOpenEditor = useCallback(() => {
    setIsEditorOpen(true);
  }, []);

  const handleCloseEditor = useCallback(() => {
    setIsEditorOpen(false);
  }, []);

  // --- RENDER ---
  return (
    <div className="relative space-y-6 p-4 sm:p-6" style={{ color: COLORS.NAVY }}>
      {/* Save indicator */}
      <SaveIndicator isSaving={isSaving} />

      {/* Reminders */}
      {reminders.map((reminder) => (
        <ReminderBanner
          key={reminder.key}
          message={reminder.message}
          actionLabel={reminder.actionLabel}
          actionScreen={reminder.actionScreen}
          onAction={reminder.actionScreen ? () => setCurrentScreen(reminder.actionScreen) : undefined}
          onDismiss={() => handleDismissReminder(reminder.key)}
        />
      ))}

      {/* Mode Switch (Arena 1.0 – Show for Pro/Premium only) */}
      {visibleComponents.includes('mode') && (isMemberPro || isMemberPremium) && (
        <ModeSwitch
          dailyMode={dailyMode}
          onToggle={toggleDailyMode}
          isMemberPro={isMemberPro}
          isMemberPremium={isMemberPremium}
        />
      )}

      {/* Streak Tracker */}
      {visibleComponents.includes('streak') && <StreakTracker progressData={progressData} />}

      {/* Get Started / Onboarding Card */}
      {visibleComponents.includes('getStarted') && (
        <GetStartedCard
          onNavigate={setCurrentScreen}
          membershipData={membershipData}
          developmentPlanData={developmentPlanData}
          currentTier={currentTier}
        />
      )}

      {/* Dynamic Bookend (Morning/Evening Practice) */}
      {visibleComponents.includes('dynamicBookend') && (
        <DynamicBookendContainer
          morningProps={{
            // Add morning props here when needed
          }}
          eveningProps={{
            reflectionGood,
            setReflectionGood,
            reflectionBetter,
            setReflectionBetter,
            reflectionBest,
            setReflectionBest,
            habitsCompleted,
            onHabitToggle: handleHabitToggle,
            onSave: handleSaveEveningBookend,
            isSaving: isSavingBookend
          }}
          dailyPracticeData={{}}
        />
      )}

      {/* Development Plan Progress Link (Arena 1.0 – Show for Pro/Premium only) */}
      {visibleComponents.includes('devPlanProgress') && (isMemberPro || isMemberPremium) && (
        <DevPlanProgressLink onNavigate={setCurrentScreen} />
      )}

      {/* AI Coach Nudge (Arena 1.0 – Show for Premium only) */}
      {visibleComponents.includes('aiCoachNudge') && isMemberPremium && (
        <AICoachNudge onNavigate={setCurrentScreen} />
      )}

      {/* Additional Reps (Bonus Exercises) (Arena 1.0 – Show for Pro/Premium only) */}
      {(isMemberPro || isMemberPremium) && bonusExercises.length > 0 && (
        <AdditionalRepsCard
          bonusExercises={bonusExercises}
          onExerciseClick={handleBonusExerciseClick}
        />
      )}

      {/* Social Pod / Daily Tasks (Arena 1.0 Scope) */}
      {dailyMode ? (
        <DailyTasksCard
          otherTasks={otherTasks || []}
          morningWIN={morningWIN || ''}
          winCompleted={amWinCompleted || false}
          onToggleTask={handleToggleTask}
          onRemoveTask={handleRemoveTask}
          onAddTask={handleAddTask}
          onToggleWIN={handleToggleWIN}
        />
      ) : (
        <SocialPodCard onNavigate={setCurrentScreen} />
      )}

      {/* Unified Anchor FAB */}
      {showAnchorFAB && (
        <button
          onClick={handleAnchorModalOpen}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 animate-bounce"
          style={{
            background: hasActiveAnchor
              ? `linear-gradient(135deg, ${COLORS.TEAL}, ${COLORS.BLUE})`
              : `linear-gradient(135deg, ${COLORS.ORANGE}, ${COLORS.TEAL})`,
            color: '#fff'
          }}
          title={hasActiveAnchor ? "View Your Anchor" : "Set Your Anchor"}
        >
          <Anchor className="w-6 h-6" />
        </button>
      )}

      {/* Unified Anchor Modal */}
      {showAnchorModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleAnchorModalClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ borderTop: `4px solid ${COLORS.TEAL}` }}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                Your Anchor
              </h2>
              <button
                onClick={handleAnchorModalClose}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                <X className="w-6 h-6" style={{ color: COLORS.MUTED }} />
              </button>
            </div>

            {hasActiveAnchor ? (
              <>
                <p className="text-lg mb-4" style={{ color: COLORS.NAVY }}>
                  {anchorText}
                </p>
                {anchorSetDate && (
                  <p className="text-sm mb-6" style={{ color: COLORS.MUTED }}>
                    Set on {anchorSetDate.toLocaleDateString()}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={handleOpenEditor}
                    variant="primary"
                    size="md"
                    className="flex-1"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Anchor
                  </Button>
                  <Button
                    onClick={handleDeleteAnchor}
                    variant="outline"
                    size="md"
                    className="flex-1"
                    disabled={isSaving}
                    style={{ borderColor: COLORS.ORANGE, color: COLORS.ORANGE }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isSaving ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-base mb-6" style={{ color: COLORS.MUTED }}>
                  You haven't set your Leadership Anchor yet. An anchor keeps you focused on your core purpose.
                </p>
                <Button
                  onClick={handleOpenEditor}
                  variant="primary"
                  size="md"
                  className="w-full"
                >
                  <Anchor className="w-4 h-4 mr-2" />
                  Set Your Anchor
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Unified Anchor Editor Modal */}
      <UnifiedAnchorEditorModal
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveAnchor}
        initialIdentity={identityStatement || ''}
        initialHabit={habitAnchor || ''}
        initialWhy={whyStatement || ''}
        identitySuggestions={[]}
        habitSuggestions={[]}
        whySuggestions={[]}
      />

      {/* Bonus Exercise Modal */}
      {showBonusModal && selectedBonusExercise && (
        <BonusExerciseModal
          exercise={selectedBonusExercise}
          onClose={handleBonusModalClose}
        />
      )}

      {/* Floating Test Utils FAB (Dev Mode Only) */}
      {userData?.isDeveloperMode && (
        <button
          onClick={() => setTestUtilsOpen(true)}
          className="fixed bottom-24 right-6 z-40 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          style={{ background: COLORS.NAVY, color: '#fff' }}
          title="Test Utilities"
        >
          <Zap className="w-5 h-5" />
        </button>
      )}

      <TestUtilsModal isOpen={testUtilsOpen} onClose={() => setTestUtilsOpen(false)} />
    </div>
  );
};

export default Dashboard;