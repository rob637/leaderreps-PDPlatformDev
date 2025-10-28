// src/components/screens/Dashboard.jsx
// Refactored into modular structure (10/28/25)

import React from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { 
  Flag, Briefcase, Home 
} from 'lucide-react';

// Import modular components
import {
  COLORS,
  Button,
  Card,
  ModeSwitch,
  StreakTracker,
  MorningBookend,
  EveningBookend,
  WhyItMattersCard,
  HabitAnchorCard,
  AICoachNudge
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
    developmentPlanData
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
    <div className="min-h-screen p-6" style={{ backgroundColor: COLORS.BG }}>
      
      {/* === HEADER === */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>
              <Home className="inline w-8 h-8 mr-2" /> The Arena
            </h1>
            <p className="text-lg" style={{ color: COLORS.TEXT }}>
              Welcome to The Arena, <strong>{userEmail?.split('@')[0] || 'Leader'}</strong>. 
              Focus Area: <strong>Team Health & Culture</strong>
            </p>
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
        <div className="h-1 w-full mt-4 rounded-full" 
             style={{ background: `linear-gradient(90deg, ${COLORS.TEAL}, ${COLORS.ORANGE})` }} />
      </div>

      {/* === MAIN CONTENT GRID === */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* === LEFT COLUMN === */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Morning Bookend (NEW) */}
            {(featureFlags?.enableBookends !== false) && (
              <MorningBookend 
                dailyWIN={morningWIN}
                setDailyWIN={setMorningWIN}
                otherTasks={otherTasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onRemoveTask={handleRemoveTask}
                showLIS={showLIS}
                setShowLIS={setShowLIS}
                identityStatement={identityStatement}
                onSave={handleSaveMorningBookend}
                isSaving={isSavingBookend}
              />
            )}

            {/* Today's Focus Rep */}
            <Card title="🎯 Today's Focus Rep" icon={Flag} accent='NAVY'>
              <div className="mb-4">
                <p className="text-sm font-semibold mb-1" style={{ color: COLORS.TEXT }}>
                  Target Rep:
                </p>
                <p className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                  {targetRep || 'No target rep set'}
                </p>
              </div>

              <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: `${COLORS.TEAL}10` }}>
                <p className="text-xs font-semibold mb-2" style={{ color: COLORS.TEAL }}>
                  WHAT GOOD LOOKS LIKE:
                </p>
                <p className="text-sm italic" style={{ color: COLORS.TEXT }}>
                  You actively reward and promote a psychologically safe environment, 
                  fostering a culture where team members feel comfortable expressing themselves.
                </p>
              </div>

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

              {/* Identity Anchor Display */}
              {identityStatement && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: COLORS.MUTED }}>
                    🎯 IDENTITY ANCHOR:
                  </p>
                  <p className="text-sm italic" style={{ color: COLORS.TEXT }}>
                    "{identityStatement}"
                  </p>
                </div>
              )}
            </Card>

            {/* Why & Habit Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WhyItMattersCard 
                whyStatement={identityStatement || "Define your leadership identity..."} 
                onEdit={() => setShowIdentityEditor(true)} 
              />
              <HabitAnchorCard 
                habitAnchor={habitAnchor || "When I start my workday"} 
                onEdit={() => setShowHabitEditor(true)} 
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

          {/* === RIGHT COLUMN === */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Evening Bookend (NEW) */}
            {(featureFlags?.enableBookends !== false) && (
              <EveningBookend 
                reflectionGood={reflectionGood}
                setReflectionGood={setReflectionGood}
                reflectionBetter={reflectionBetter}
                setReflectionBetter={setReflectionBetter}
                reflectionBest={reflectionBest}
                setReflectionBest={setReflectionBest}
                habitsCompleted={habitsCompleted}
                onHabitToggle={handleHabitToggle}
                onSave={handleSaveEveningBookend}
                isSaving={isSavingBookend}
              />
            )}

            {/* Daily Reflection Log */}
            <Card title="📝 Daily Reflection Log" accent='TEAL'>
              <p className="text-sm mb-4" style={{ color: COLORS.TEXT }}>
                Track your daily insights and growth moments...
              </p>
              <Button 
                onClick={() => {/* TODO: Open reflection log */}} 
                variant="outline" 
                size="sm" 
                className="w-full"
              >
                View Full Reflection Log
              </Button>
            </Card>

            {/* AI Coach Nudge */}
            <AICoachNudge 
              onOpenLab={() => navigate('coaching-lab')} 
              disabled={!(featureFlags?.enableLabs)}
            />
          </div>
        </div>
      </div>

      {/* === MODALS === */}
      {showIdentityEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full" style={{ borderColor: COLORS.SUBTLE }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
              Edit Leadership Identity
            </h2>
            <textarea 
              value={identityStatement}
              onChange={(e) => setIdentityStatement(e.target.value)}
              placeholder="I'm the kind of leader who..."
              className="w-full p-3 border rounded-lg mb-4"
              style={{ borderColor: COLORS.SUBTLE }}
              rows={4}
            />
            <div className="flex gap-3">
              <Button onClick={() => handleSaveIdentity(identityStatement)} variant="primary" size="md" className="flex-1">
                Save
              </Button>
              <Button onClick={() => setShowIdentityEditor(false)} variant="outline" size="md" className="flex-1">
                Cancel
              </Button>
            </div>
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
            <div className="flex gap-3">
              <Button onClick={() => handleSaveHabit(habitAnchor)} variant="primary" size="md" className="flex-1">
                Save
              </Button>
              <Button onClick={() => setShowHabitEditor(false)} variant="outline" size="md" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
