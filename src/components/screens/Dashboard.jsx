// src/components/screens/Dashboard.jsx
// COMPLETE VERSION with all fixes (10/29/25)

import React, { useState, useEffect } from 'react';
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
  SuggestionModal // NEW: For Identity/Habit suggestions
} from './dashboard/DashboardComponents.jsx';

// Import hooks
import { useDashboard } from './dashboard/DashboardHooks.jsx';

/* =========================================================
   MAIN DASHBOARD COMPONENT
========================================================= */
const Dashboard = ({ navigate }) => {
  
  // Get services from context
  const {
    dailyPracticeData,
    updateDailyPracticeData,
    featureFlags,
    db,
    userEmail,
    developmentPlanData,
    globalMetadata // NEW: Get global metadata for REP_LIBRARY lookups
  } = useAppServices();

  // Use consolidated dashboard hook
  const {
    // Arena Mode
    isArenaMode,
    isTogglingMode,
    handleToggleMode,

    // Target Rep
    targetRep,
    targetRepStatus,
    canCompleteTargetRep,
    isSavingRep,
    handleCompleteTargetRep,

    // Identity & Habit
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

    // Bookends
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

    // Streak
    streakCount,
    streakCoins,

    // Additional Reps
    additionalCommitments
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData,
    featureFlags,
    db,
    userEmail
  });

  // NEW: State for reminders
  const [showBestReminder, setShowBestReminder] = useState(false);
  const [showImprovementReminder, setShowImprovementReminder] = useState(false);
  const [celebrationShown, setCelebrationShown] = useState(false);

  // NEW: State for suggestion modals
  const [showIdentitySuggestions, setShowIdentitySuggestions] = useState(false);
  const [showHabitSuggestions, setShowHabitSuggestions] = useState(false);

  // NEW: Get dynamic focus area from dev plan
  const focusArea = developmentPlanData?.currentPlan?.focusArea || 'Not Set';
  
  // NEW: Calculate dev plan progress (simple version - can be enhanced)
  const devPlanProgress = 22; // Placeholder - should calculate based on actual progress

  // NEW: Lookup Target Rep details from REP_LIBRARY
  const targetRepDetails = useMemo(() => {
    if (!targetRep || !globalMetadata?.REP_LIBRARY?.items) return null;
    
    const repItem = globalMetadata.REP_LIBRARY.items.find(
      rep => rep.id === targetRep || rep.repId === targetRep
    );
    
    return repItem || null;
  }, [targetRep, globalMetadata?.REP_LIBRARY]);

  // NEW: Get suggestion catalogs
  const identitySuggestions = globalMetadata?.IDENTITY_ANCHOR_CATALOG?.items || [];
  const habitSuggestions = globalMetadata?.HABIT_ANCHOR_CATALOG?.items || [];

  /* =========================================================
     AUTO-UPDATE WATCHERS (NEW)
  ========================================================= */
  
  // Watch for AM WIN completion → Auto-update PM habit
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

  // Watch for all AM tasks completion → Auto-update PM habit
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

  // Watch for complete AM plan → Celebration
  useEffect(() => {
    if (!dailyPracticeData?.morningBookend || celebrationShown) return;
    
    const { winCompleted, otherTasks } = dailyPracticeData.morningBookend;
    const allTasksComplete = otherTasks && otherTasks.length > 0 && 
      otherTasks.every(task => task.completed);
    
    if (winCompleted && allTasksComplete) {
      const todayStr = new Date().toISOString().split('T')[0];
      const celebratedKey = `celebrated_am_${todayStr}`;
      
      if (!sessionStorage.getItem(celebratedKey)) {
        // Show celebration
        alert('🎉 Way to go, Leader! Morning plan crushed!');
        sessionStorage.setItem(celebratedKey, 'true');
        setCelebrationShown(true);
      }
    }
  }, [dailyPracticeData?.morningBookend, celebrationShown]);

  /* =========================================================
     NEXT-DAY REMINDERS (NEW)
  ========================================================= */
  
  useEffect(() => {
    if (!dailyPracticeData) return;
    
    const { tomorrowsReminder, improvementReminder } = dailyPracticeData;
    
    // Show Best reminder
    if (tomorrowsReminder && !sessionStorage.getItem('dismissed_best_reminder')) {
      setShowBestReminder(true);
    }
    
    // Show Improvement reminder
    if (improvementReminder && !sessionStorage.getItem('dismissed_improvement_reminder')) {
      setShowImprovementReminder(true);
    }
  }, [dailyPracticeData]);

  const handleDismissBestReminder = () => {
    setShowBestReminder(false);
    sessionStorage.setItem('dismissed_best_reminder', 'true');
    // Clear from database
    if (updateDailyPracticeData) {
      updateDailyPracticeData({ tomorrowsReminder: '' });
    }
  };

  const handleDismissImprovementReminder = () => {
    setShowImprovementReminder(false);
    sessionStorage.setItem('dismissed_improvement_reminder', 'true');
    // Clear from database
    if (updateDailyPracticeData) {
      updateDailyPracticeData({ improvementReminder: '' });
    }
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */
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

  /* =========================================================
     MAIN RENDER
  ========================================================= */
  return (
    <div className="min-h-screen pb-8 pt-20" style={{ background: COLORS.BG }}>
      
      {/* === HEADER === */}
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
              <StreakTracker count={streakCount} coins={streakCoins} />
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

      {/* === REMINDER BANNERS === */}
      {showBestReminder && (
        <div className="max-w-7xl mx-auto px-6 mb-6">
          {dailyPracticeData?.tomorrowsReminder && (
            <ReminderBanner 
              type="best"
              message={dailyPracticeData.tomorrowsReminder}
              onDismiss={handleDismissBestReminder}
            />
          )}
        </div>
      )}

      {showImprovementReminder && (
        <div className="max-w-7xl mx-auto px-6 mb-6">
          {dailyPracticeData?.improvementReminder && (
            <ReminderBanner 
              type="better"
              message={dailyPracticeData.improvementReminder}
              onDismiss={handleDismissImprovementReminder}
            />
          )}
        </div>
      )}

      {/* === MAIN CONTENT GRID === */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* === LEFT COLUMN (60% - DAILY FOCUS) === */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Today's Focus Rep */}
            <Card title="🎯 Today's Focus Rep" icon={Flag} accent='NAVY'>
              <div className="mb-4">
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.TEXT }}>
                  Target Rep:
                </p>
                <p className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                  {targetRepDetails ? targetRepDetails.name : (targetRep || 'No target rep set')}
                </p>
              </div>

              {targetRepDetails?.description && (
                <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: `${COLORS.TEAL}10` }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: COLORS.TEAL }}>
                    WHAT GOOD LOOKS LIKE:
                  </p>
                  <p className="text-sm italic" style={{ color: COLORS.TEXT }}>
                    {targetRepDetails.description}
                  </p>
                </div>
              )}

              {targetRepStatus === 'Pending' && (
                <Button 
                  onClick={handleCompleteTargetRep} 
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

              {/* Identity Anchor Display - FIXED: Full sentence format */}
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

            {/* NEW: Dev Plan Progress Link */}
            <DevPlanProgressLink 
              progress={devPlanProgress}
              focusArea={focusArea}
              onNavigate={() => navigate('development-plan')}
            />

            {/* Identity & Habit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <IdentityAnchorCard 
                identityStatement={identityStatement} 
                onEdit={() => setShowIdentityEditor(true)}
                onShowSuggestions={() => setShowIdentitySuggestions(true)} // NEW
              />
              <HabitAnchorCard 
                habitAnchor={habitAnchor} 
                onEdit={() => setShowHabitEditor(true)}
                onShowSuggestions={() => setShowHabitSuggestions(true)} // NEW
              />
            </div>

            {/* Additional Daily Reps */}
            {additionalCommitments.length > 0 && (
              <Card title="⏳ Additional Daily Reps" accent='TEAL'>
                <div className="space-y-2">
                  {additionalCommitments.map((commitment, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border"
                         style={{ borderColor: COLORS.SUBTLE }}>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4"
                        style={{ accentColor: COLORS.TEAL }}
                      />
                      <span className="text-sm" style={{ color: COLORS.TEXT }}>
                        {commitment.text || commitment}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Social Pod (Arena Mode Only) */}
            {isArenaMode && (
              <Card title="🤝 Social Pod Feed" accent='PURPLE'>
                <p className="text-sm text-center py-8" style={{ color: COLORS.MUTED }}>
                  Connect with your accountability pod members...
                </p>
              </Card>
            )}
          </div>

          {/* === RIGHT COLUMN (40% - BOOKENDS) === */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* NEW: Dynamic Bookend Container */}
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
                  onSave: handleSaveMorningBookend,
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
                  onSave: handleSaveEveningBookend,
                  isSaving: isSavingBookend,
                  onNavigate: navigate
                }}
                dailyPracticeData={dailyPracticeData}
              />
            )}

            {/* AI Coach Nudge */}
            <AICoachNudge 
              onOpenLab={() => navigate('coaching-lab')} 
              disabled={!(featureFlags?.enableLabs)}
            />
          </div>
        </div>
      </div>

      {/* === MODALS === */}
      
      {/* Identity Editor Modal */}
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
              <Button onClick={() => handleSaveIdentity(identityStatement)} variant="primary" size="md" className="flex-1">
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

      {/* Habit Editor Modal */}
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
              <Button onClick={() => handleSaveHabit(habitAnchor)} variant="primary" size="md" className="flex-1">
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

      {/* Identity Suggestions Modal */}
      {showIdentitySuggestions && (
        <SuggestionModal
          title="Identity Anchor Suggestions"
          prefix="I am the kind of leader who"
          suggestions={identitySuggestions}
          onSelect={(value) => {
            setIdentityStatement(value);
            handleSaveIdentity(value);
            setShowIdentitySuggestions(false);
          }}
          onClose={() => setShowIdentitySuggestions(false)}
        />
      )}

      {/* Habit Suggestions Modal */}
      {showHabitSuggestions && (
        <SuggestionModal
          title="Habit Anchor Suggestions"
          prefix="When I"
          suggestions={habitSuggestions}
          onSelect={(value) => {
            setHabitAnchor(value);
            handleSaveHabit(value);
            setShowHabitSuggestions(false);
          }}
          onClose={() => setShowHabitSuggestions(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
