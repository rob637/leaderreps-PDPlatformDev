// src/components/screens/Dashboard.jsx
// FINAL VERSION - Updated 10/30/25
// FIX: Anchor deletion logic implemented in handleDeletePlanAndReset (Issue 1).
// FIX: Added defensive checks for arrays after deletion to prevent React error #31.
// UX: Implemented floating/blinking Anchor FAB and Test Utilities.
// UX: REMOVED LeadershipAnchorsCard for prominence of FAB.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService } from '../../services/membershipService.js';
import { ArrowRight, Edit3, Loader, X, Users, Send, Target, Clock, Zap, Shield, Trash2, Anchor, ChevronDown, ChevronUp } from 'lucide-react'; 
import { deleteField, updateDoc, doc } from 'firebase/firestore'; // Used for reminder dismissals
import { MembershipGate } from '../ui/MembershipGate.jsx';
import { COLORS } from './dashboard/dashboardConstants.js';
import * as LucideIcons from 'lucide-react';
import { 
  Card as DevCard, 
  Button as DevButton, 
  ProgressBar, 
  Badge, 
  StatCard 
} from './developmentplan/DevPlanComponents';

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
  DailyProgressSummary,
  WinsList,
  // === UNIFIED IMPORTS ===
  UnifiedAnchorEditorModal,
  AdditionalRepsCard
  // LeadershipAnchorsCard REMOVED per user request
  // ===========================
} from './dashboard/DashboardComponents.jsx';
import TestUtilsModal from './dashboard/TestUtilsModal.jsx';// Arena v1.0 Scope: Import Daily Tasks component to replace Social Pod
import DailyTasksCard from './dashboard/DailyTasksCard.jsx';
import WidgetRenderer from '../admin/WidgetRenderer.jsx';

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
const GetStartedCard = ({ onNavigate, membershipData, developmentPlanData, currentTier, userData, identityStatement, habitAnchor, whyStatement }) => {
  const [showAnchors, setShowAnchors] = useState(false);
  
  const hasCompletedPlan = developmentPlanData?.currentPlan && 
    developmentPlanData.currentPlan.focusAreas && 
    developmentPlanData.currentPlan.focusAreas.length > 0;
  
  const hasAnyAnchor = identityStatement || habitAnchor || whyStatement;

  // Base members -> Show upgrade page
  if (currentTier === 'free') {
    return (
      <Card accent="ORANGE">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:p-4 lg:p-6">
          <div className="flex-1">
            <h2 className="corporate-heading-lg mb-3">
              Unlock Your Leadership Potential
            </h2>
            <p className="corporate-text-body">
              Upgrade to Arena Premium to access assessments, development plans, and accountability pods.
            </p>
          </div>
          <Button
            onClick={() => {
              if (userData?.isDeveloperMode) {
                alert('🔵 View Plans button clicked!\nAttempting to navigate to: membership-upgrade');
              }
              onNavigate('membership-upgrade');
              if (userData?.isDeveloperMode) {
                alert('🔵 onNavigate called with membership-upgrade');
              }
            }}
            variant="primary"
            size="lg"
            className="btn-corporate-primary flex-shrink-0 w-full sm:w-auto"
          >
            View Plans <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Pro/Premium members without plan -> Assessment & Plan flow
  if (currentTier === 'premium' && !hasCompletedPlan) {
    return (
      <Card accent="BLUE">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:p-4 lg:p-6">
          <div className="flex-1">
            <h2 className="corporate-heading-lg mb-3">
              Create Your Development Plan
            </h2>
            <p className="corporate-text-body">
              Take your leadership assessment and create your personalized development plan.
            </p>
          </div>
          <Button
            onClick={() => onNavigate('development-plan')}
            variant="primary"
            size="lg"
            className="btn-corporate-primary flex-shrink-0 w-full sm:w-auto"
          >
            Take Assessment <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </Card>
    );
  }

  // Pro/Premium members with plan -> This Week's Focus
  if (currentTier === 'premium' && hasCompletedPlan) {
    const currentWeekFocus = developmentPlanData?.currentPlan?.focusAreas?.[0]?.name || 'Leadership Development';
    
    return (
      <Card accent="TEAL">
        <div className="flex flex-col gap-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <h2 className="corporate-heading-lg mb-3">
                This Week's Focus
              </h2>
              <p className="corporate-heading-md mb-2" style={{ color: COLORS.TEAL }}>
                {currentWeekFocus}
              </p>
              <p className="corporate-text-muted">
                Continue building your skills in this key area
              </p>
            </div>
            <Button
              onClick={() => onNavigate('development-plan')}
              variant="outline"
              size="lg"
              className="btn-corporate-secondary flex-shrink-0 w-full sm:w-auto"
            >
              View Your Plan <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          {/* Identity Anchors Dropdown */}
          {hasAnyAnchor && (
            <div className="mt-2">
              <button
                onClick={() => setShowAnchors(!showAnchors)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                title="View your identity anchors"
              >
                <span>Identity Anchors</span>
                {showAnchors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              
              {showAnchors && (
                <div className="mt-2 space-y-2 text-sm pl-2">
                  {identityStatement && (
                    <div>
                      <p className="font-medium text-xs text-gray-500">Identity:</p>
                      <p className="text-gray-700 text-sm">{identityStatement}</p>
                    </div>
                  )}
                  {habitAnchor && (
                    <div>
                      <p className="font-medium text-xs text-gray-500">Habit:</p>
                      <p className="text-gray-700 text-sm">{habitAnchor}</p>
                    </div>
                  )}
                  {whyStatement && (
                    <div>
                      <p className="font-medium text-xs text-gray-500">Why:</p>
                      <p className="text-gray-700 text-sm">{whyStatement}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Fallback to original behavior
  return (
    <Card accent="TEAL">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.NAVY }}>
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
  // Base scope for all widgets to prevent ReferenceErrors
  const baseWidgetScope = {
    ...LucideIcons,
    Card: DevCard,
    Button: DevButton,
    ProgressBar,
    Badge,
    StatCard,
    COLORS
  };

  const { 
    db, 
    user, 
    dailyPracticeData, 
    updateDailyPracticeData,
    membershipData,
    userData,
    localAnchor,
    setLocalAnchor,
    developmentPlanData,
    progressData,
    userAnchorData,
    quickstartData,
    repsData,
    isAdmin
  } = useAppServices();
  
  // Get setCurrentScreen, simulatedTier, and isDeveloperMode from props (passed from ScreenRouter)
  const { simulatedTier, setCurrentScreen: _setCurrentScreen, isDeveloperMode } = props;
  
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
    setMorningWIN,
    otherTasks,
    handleAddTask,
    handleToggleTask,
    handleRemoveTask,
    handleToggleWIN,
    handleSaveMorningBookend,
    handleSaveWIN,
    isSavingWIN,
    amWinCompleted,
    winsList,
    handleDeleteWin
  } = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData
  });

  // Wrapper for setCurrentScreen
  const setCurrentScreen = (screen) => {
    if (typeof _setCurrentScreen === 'function') {
      _setCurrentScreen(screen);
    } else {
      console.error('[Dashboard] ERROR: setCurrentScreen is not a function!', {
  });
      if (userData?.isDeveloperMode) {
        alert(`Navigation error: Cannot navigate to ${screen}. Please refresh the page.`);
      }
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
  const currentTier = simulatedTier || membershipData?.currentTier || 'free';
  
  const isMemberPro = useMemo(() => {
    return membershipService.hasAccess(currentTier, 'premium');
  }, [currentTier]);
  
  const isMemberPremium = useMemo(() => {
    return membershipService.hasAccess(currentTier, 'premium');
  }, [currentTier]);
  
  // Width debugging - FULL PARENT CHAIN
  React.useEffect(() => {
    console.log('🔍 [DASHBOARD] Width debug useEffect FIRED');
    
    const checkWidth = () => {
      const pageCorporate = document.querySelector('.page-corporate');
      console.log('🔍 [DASHBOARD] Found .page-corporate?', !!pageCorporate);
      
      if (pageCorporate) {
        // Log FULL parent chain FIRST
        let current = pageCorporate;
        const fullChain = [];
        while (current && current !== document.body) {
          fullChain.push({
            tag: current.tagName,
            classes: current.className,
            width: current.offsetWidth
          });
          current = current.parentElement;
        }
        console.log('🔗 [DASHBOARD] FULL Parent Chain:', fullChain);
        
        const rect = pageCorporate.getBoundingClientRect();
        const computed = window.getComputedStyle(pageCorporate);
        
        // Check ALL parent elements
        let parent = pageCorporate.parentElement;
        let parentChain = [];
        while (parent && parentChain.length < 6) {
          const parentComputed = window.getComputedStyle(parent);
          parentChain.push({
            tag: parent.tagName,
            classes: parent.className,
            width: `${parent.offsetWidth}px`,
            maxWidth: parentComputed.maxWidth,
            overflow: parentComputed.overflow,
            display: parentComputed.display
          });
          parent = parent.parentElement;
        }
        
        // Log ALL layout-related CSS properties
        const layoutProps = ['width', 'minWidth', 'maxWidth', 'flexBasis', 'flexGrow', 'flexShrink', 'display', 'position', 'boxSizing'];
        const styles = {};
        layoutProps.forEach(prop => { styles[prop] = computed[prop]; });
        
        console.log('🎨 [DASHBOARD] ALL LAYOUT STYLES:', styles);
        console.log('📐 [DASHBOARD] Width Measurements:', {
          component: 'Dashboard',
          actualWidth: `${rect.width}px`,
          offsetWidth: `${pageCorporate.offsetWidth}px`,
          clientWidth: `${pageCorporate.clientWidth}px`,
          maxWidth: computed.maxWidth,
          padding: computed.padding,
          margin: computed.margin,
          classList: pageCorporate.className,
          viewport: `${window.innerWidth}px`,
          parentChain
        });
      } else {
        console.warn('⚠️ [DASHBOARD] Could not find .page-corporate element');
      }
    };
    
    // Try immediately
    checkWidth();
    
    // Also try after a delay
    setTimeout(checkWidth, 100);
    setTimeout(checkWidth, 500);
  }, []);

  // -------------------------------
  // Compute Anchor State (Unified)
  // -------------------------------
  const hasActiveAnchor = useMemo(() => {
    // Check if any of the three new anchor types are set
    return Boolean(identityStatement || habitAnchor || whyStatement);
  }, [identityStatement, habitAnchor, whyStatement]);

  const anchorText = useMemo(() => {
    // Return a summary of set anchors
    if (identityStatement) return `Identity: ${identityStatement}`;
    if (habitAnchor) return `Habit: ${habitAnchor}`;
    if (whyStatement) return `Why: ${whyStatement}`;
    return '';
  }, [identityStatement, habitAnchor, whyStatement]);

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
    
    // DEBUG: Measure actual widths
    setTimeout(() => {
      const pageEl = document.querySelector('.page-corporate');
      const contentEl = document.querySelector('.content-full');
      console.log('📏 DASHBOARD Width Measurements:', {
        pageWidth: pageEl?.offsetWidth,
        contentWidth: contentEl?.offsetWidth,
        pageComputedMaxWidth: window.getComputedStyle(pageEl || document.body).maxWidth,
        contentComputedMaxWidth: window.getComputedStyle(contentEl || document.body).maxWidth
      });
    }, 100);
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
      const promises = [];
      
      if (anchorData.identity && handleSaveIdentity) {
        promises.push(handleSaveIdentity(anchorData.identity));
      }
      if (anchorData.habit && handleSaveHabit) {
        promises.push(handleSaveHabit(anchorData.habit));
      }
      if (anchorData.why && handleSaveWhy) {
        promises.push(handleSaveWhy(anchorData.why));
      }
      
      // Wait for all saves to complete
      await Promise.all(promises);
      
      // Close modal and show success
      setIsEditorOpen(false);
      if (userData?.isDeveloperMode) {
        alert('✅ Leadership Anchors saved! Your identity, habit, and why are now set.');
      }
      
    } catch (error) {
      console.error('Error saving anchors:', error);
      alert('❌ Error saving anchors. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [handleSaveIdentity, handleSaveHabit, handleSaveWhy]);

  const handleDeleteAnchor = useCallback(async () => {
    if (!user || !db) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'user_anchors', user.uid), {
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
    <div className="page-corporate container-corporate animate-corporate-fade-in min-w-full">
      <div className="content-full min-w-full">
      <div className="min-w-full">
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

      {/* Mode Switch (Arena 1.0 – Show for Pro/Premium only) - COMMENTED OUT FOR NOW */}
      {/* TEMPORARILY COMMENTED OUT - Solo Mode functionality disabled
      {visibleComponents.includes('mode') && (isMemberPro || isMemberPremium) && (
        <ModeSwitch
          dailyMode={dailyMode}
          onToggle={toggleDailyMode}
          isMemberPro={isMemberPro}
          isMemberPremium={isMemberPremium}
        />
      )}
      */}

      {/* Streak Tracker - COMMENTED OUT FOR NOW */}
      {/* {visibleComponents.includes('streak') && isAdmin && (
        <div className="section-corporate">
          <StreakTracker progressData={progressData} userEmail={user?.email} />
        </div>
      )} */}



      {/* Get Started / Onboarding Card */}
      {visibleComponents.includes('getStarted') && (
        <div className="section-corporate">
          <WidgetRenderer 
            widgetId="identity-builder"
            scope={{
              ...baseWidgetScope,
              onNavigate: setCurrentScreen,
              membershipData,
              developmentPlanData,
              currentTier,
              userData,
              identityStatement,
              habitAnchor,
              whyStatement,
              hasLIS: !!identityStatement,
              lisRead: false, // TODO: Hook up real state
              handleHabitCheck: () => {}, // TODO: Hook up real state
              setIsAnchorModalOpen: () => setShowAnchorModal(true)
            }}
          >
            <GetStartedCard
              onNavigate={setCurrentScreen}
              membershipData={membershipData}
              developmentPlanData={developmentPlanData}
              currentTier={currentTier}
              userData={userData}
              identityStatement={identityStatement}
              habitAnchor={habitAnchor}
              whyStatement={whyStatement}
            />
          </WidgetRenderer>
        </div>
      )}

      {/* Daily Progress Summary - Shows WIN and Reflections */}
      {visibleComponents.includes('dynamicBookend') && (
        <div className="section-corporate">
          <WidgetRenderer widgetId="scorecard" scope={{ ...baseWidgetScope, dailyPracticeData }}>
            <DailyProgressSummary dailyPracticeData={dailyPracticeData} />
          </WidgetRenderer>
        </div>
      )}

      {/* Dynamic Bookend (Morning/Evening Practice) */}
      {visibleComponents.includes('dynamicBookend') && (
        <div className="section-corporate">
        <WidgetRenderer 
          widgetId="win-the-day" 
          scope={{
            ...baseWidgetScope,
            morningProps: {
              dailyWIN: morningWIN,
              setDailyWIN: setMorningWIN,
              otherTasks,
              onAddTask: handleAddTask,
              onToggleTask: handleToggleTask,
              onRemoveTask: handleRemoveTask,
              showLIS: false,
              setShowLIS: () => {},
              identityStatement,
              onSave: handleSaveMorningBookend,
              onSaveWIN: handleSaveWIN,
              isSavingWIN,
              isSaving: isSavingBookend,
              winCompleted: amWinCompleted
            },
            eveningProps: {
              reflectionGood,
              setReflectionGood,
              reflectionBetter,
              setReflectionBetter,
              reflectionBest,
              setReflectionBest,
              habitsCompleted,
              onHabitToggle: handleHabitToggle,
              onSave: handleSaveEveningBookend,
              isSaving: isSavingBookend,
              otherTasks,
              onAddTask: handleAddTask,
              onToggleTask: handleToggleTask,
              onRemoveTask: handleRemoveTask
            },
            dailyPracticeData: {}
          }}
        >
          <DynamicBookendContainer
            morningProps={{
              dailyWIN: morningWIN,
              setDailyWIN: setMorningWIN,
              otherTasks,
              onAddTask: handleAddTask,
              onToggleTask: handleToggleTask,
              onRemoveTask: handleRemoveTask,
              showLIS: false,
              setShowLIS: () => {},
              identityStatement,
              onSave: handleSaveMorningBookend,
              onSaveWIN: handleSaveWIN,
              isSavingWIN,
              isSaving: isSavingBookend,
              winCompleted: amWinCompleted
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
              isSaving: isSavingBookend,
              // Add task management to evening bookend
              otherTasks,
              onAddTask: handleAddTask,
              onToggleTask: handleToggleTask,
              onRemoveTask: handleRemoveTask
            }}
            dailyPracticeData={{}}
          />
        </WidgetRenderer>
        </div>
      )}

      {/* Wins List - Display cumulative wins */}
      <div className="section-corporate">
        <WinsList winsList={winsList} onDeleteWin={handleDeleteWin} />
      </div>

      {/* AI Coach Nudge (Arena 1.0 – Show for Premium only) */}
      {visibleComponents.includes('aiCoachNudge') && isMemberPremium && (
        <div className="section-corporate">
          <WidgetRenderer widgetId="ai-roleplay" scope={{ ...baseWidgetScope, onOpenLab: () => setCurrentScreen('coaching-lab') }}>
            <AICoachNudge onOpenLab={() => setCurrentScreen('coaching-lab')} />
          </WidgetRenderer>
        </div>
      )}

      {/* Additional Reps (Bonus Exercises) (Arena 1.0 – Show for Pro/Premium only) */}
      {(isMemberPro || isMemberPremium) && bonusExercises.length > 0 && (
        <div className="section-corporate">
          <WidgetRenderer widgetId="course-library" scope={{ ...baseWidgetScope, bonusExercises, onExerciseClick: handleBonusExerciseClick }}>
            <AdditionalRepsCard
              bonusExercises={bonusExercises}
              onExerciseClick={handleBonusExerciseClick}
            />
          </WidgetRenderer>
        </div>
      )}

      {/* Social Pod / Daily Tasks (Arena 1.0 Scope) */}
      {dailyMode ? (
        <WidgetRenderer 
          widgetId="habit-stack" 
          scope={{
            ...baseWidgetScope,
            otherTasks: otherTasks || [],
            morningWIN: morningWIN || '',
            winCompleted: amWinCompleted || false,
            onToggleTask: handleToggleTask,
            onRemoveTask: handleRemoveTask,
            onAddTask: handleAddTask,
            onToggleWIN: handleToggleWIN
          }}
        >
          <DailyTasksCard
            otherTasks={otherTasks || []}
            morningWIN={morningWIN || ''}
            winCompleted={amWinCompleted || false}
            onToggleTask={handleToggleTask}
            onRemoveTask={handleRemoveTask}
            onAddTask={handleAddTask}
            onToggleWIN={handleToggleWIN}
          />
        </WidgetRenderer>
      ) : (
        <SocialPodCard onNavigate={setCurrentScreen} />
      )}

      {/* Unified Anchor FAB */}
      {showAnchorFAB && (
        <button
          onClick={handleOpenEditor}
          className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 ${!hasActiveAnchor ? 'animate-bounce' : ''}`}
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
            className="bg-white rounded-2xl shadow-2xl p-4 sm:p-3 sm:p-4 lg:p-6 lg:p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
            style={{ borderTop: `4px solid ${COLORS.TEAL}` }}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl sm:text-2xl font-bold" style={{ color: COLORS.NAVY }}>
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
                  Set My Anchor
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
      </div>
    </div>
  );
};

export default Dashboard;