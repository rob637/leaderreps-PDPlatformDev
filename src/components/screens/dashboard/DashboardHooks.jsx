// src/components/screens/dashboard/DashboardHooks.jsx
// Extracted State & Logic from Dashboard (10/28/25)
// FINALIZED: Ensures updateDailyPracticeData dependency is used correctly and safely within callbacks.
// FIXED (10/30/25): Final fix for Issue 5 (Reflections not clearing) by clearing local state explicitly.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { serverTimestamp } from 'firebase/firestore';

/* =========================================================
   MAIN DASHBOARD HOOK
   Consolidates all state and logic for Dashboard
========================================================= */
export const useDashboard = ({
  dailyPracticeData,
  updateDailyPracticeData, // <--- Prop from useAppServices
  featureFlags,
  db,
  userEmail
}) => {
  
  // === ARENA MODE STATE ===
  const [isArenaMode, setIsArenaMode] = useState(true);
  const [isTogglingMode, setIsTogglingMode] = useState(false);

  // === TARGET REP STATE ===
  const [targetRepStatus, setTargetRepStatus] = useState('Pending');
  const [isSavingRep, setIsSavingRep] = useState(false);

  // === IDENTITY & HABIT STATE ===
  const [identityStatement, setIdentityStatement] = useState('');
  const [habitAnchor, setHabitAnchor] = useState('');
  const [showIdentityEditor, setShowIdentityEditor] = useState(false);
  const [showHabitEditor, setShowHabitEditor] = useState(false);

  // === BOOKEND STATE (NEW 10/28/25) ===
  const [morningWIN, setMorningWIN] = useState('');
  const [otherTasks, setOtherTasks] = useState([]);
  const [showLIS, setShowLIS] = useState(false);
  const [reflectionGood, setReflectionGood] = useState('');
  const [reflectionBetter, setReflectionBetter] = useState('');
  const [reflectionBest, setReflectionBest] = useState('');
  const [habitsCompleted, setHabitsCompleted] = useState({
      readLIS: false,
      completedDailyRep: false,
      eveningReflection: false
  });
  const [isSavingBookend, setIsSavingBookend] = useState(false);
  
  // FIXED 10/29/25: Track when we're intentionally clearing reflections
  const [shouldSkipReflectionLoad, setShouldSkipReflectionLoad] = useState(false);

  // === STREAK STATE ===
  const [streakCount, setStreakCount] = useState(0);
  const [streakCoins, setStreakCoins] = useState(0);

  // === ADDITIONAL REPS STATE ===
  const [additionalCommitments, setAdditionalCommitments] = useState([]);

  /* =========================================================
     LOAD DATA FROM FIRESTORE (Dependency on dailyPracticeData)
  ========================================================= */
  
  // Load Arena Mode
  useEffect(() => {
    if (dailyPracticeData?.arenaMode !== undefined) {
      setIsArenaMode(dailyPracticeData.arenaMode);
    }
  }, [dailyPracticeData?.arenaMode]);

  // Load Target Rep Status
  useEffect(() => {
    if (dailyPracticeData?.dailyTargetRepStatus) {
      setTargetRepStatus(dailyPracticeData.dailyTargetRepStatus);
    }
  }, [dailyPracticeData?.dailyTargetRepStatus]);

  // Load Identity & Habit
  useEffect(() => {
    if (dailyPracticeData?.identityAnchor) {
      setIdentityStatement(dailyPracticeData.identityAnchor);
    }
    if (dailyPracticeData?.habitAnchor) {
      setHabitAnchor(dailyPracticeData.habitAnchor);
    }
  }, [dailyPracticeData?.identityAnchor, dailyPracticeData?.habitAnchor]);

  // Load Streak Data
  useEffect(() => {
    if (dailyPracticeData?.streakCount !== undefined) {
      setStreakCount(dailyPracticeData.streakCount);
    }
    if (dailyPracticeData?.streakCoins !== undefined) {
      setStreakCoins(dailyPracticeData.streakCoins);
    }
  }, [dailyPracticeData?.streakCount, dailyPracticeData?.streakCoins]);

  // Load Additional Commitments
  useEffect(() => {
    if (dailyPracticeData?.activeCommitments) {
      setAdditionalCommitments(sanitizeTimestamps(dailyPracticeData.activeCommitments));
    }
  }, [dailyPracticeData?.activeCommitments]);

  // Helper to sanitize Firestore Timestamps
  const sanitizeTimestamps = (obj) => {
    if (!obj) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeTimestamps(item));
    }
    if (obj && typeof obj === 'object' && typeof obj.toDate === 'function') {
      return obj.toDate();
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitizeTimestamps(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Load Morning Bookend
  useEffect(() => {
    if (dailyPracticeData?.morningBookend) {
      const mb = dailyPracticeData.morningBookend;
      setMorningWIN(mb.dailyWIN || '');
      setOtherTasks(sanitizeTimestamps(mb.otherTasks || []));
    }
  }, [dailyPracticeData?.morningBookend]);

  // Load Evening Bookend (Issue 5 Fix)
  useEffect(() => {
    // Skip load if we just saved and cleared
    if (shouldSkipReflectionLoad) {
      // Clear flag after skipping the load cycle
      setShouldSkipReflectionLoad(false); 
      return;
    }
    
    if (dailyPracticeData?.eveningBookend) {
      const eb = dailyPracticeData.eveningBookend;
      setReflectionGood(eb.good || '');
      setReflectionBetter(eb.better || '');
      setReflectionBest(eb.best || '');
      setHabitsCompleted(eb.habits || {
        readLIS: false,
        completedDailyRep: false,
        eveningReflection: false
      });
    }
  }, [dailyPracticeData?.eveningBookend, shouldSkipReflectionLoad]);

  /* =========================================================
     MODE TOGGLE HANDLER (Dependency on updateDailyPracticeData)
  ========================================================= */
  const handleToggleMode = useCallback(async () => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData || isTogglingMode) return;

    setIsTogglingMode(true);
    const newMode = !isArenaMode;

    try {
      const success = await updateDailyPracticeData({ arenaMode: newMode });
      if (success) {
        setIsArenaMode(newMode);
        console.log(`[Dashboard] Mode toggled to ${newMode ? 'Arena' : 'Solo'}`);
      }
    } catch (error) {
      console.error('[Dashboard] Error toggling mode:', error);
      alert('Error changing mode. Please try again.');
    } finally {
      setIsTogglingMode(false);
    }
  }, [isArenaMode, isTogglingMode, updateDailyPracticeData]); // Explicitly include prop

  /* =========================================================
     TARGET REP HANDLERS (Dependency on updateDailyPracticeData)
  ========================================================= */
  const handleCompleteTargetRep = useCallback(async () => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData || isSavingRep) return;

    setIsSavingRep(true);
    try {
      const updates = {
        dailyTargetRepStatus: 'Committed',
        dailyTargetRepDate: new Date().toISOString().split('T')[0]
      };

      const success = await updateDailyPracticeData(updates);
      if (success) {
        setTargetRepStatus('Committed');
        // Update habits
        setHabitsCompleted(prev => ({ ...prev, completedDailyRep: true }));
        console.log('[Dashboard] Target rep completed');
      }
    } catch (error) {
      console.error('[Dashboard] Error completing target rep:', error);
      alert('Error completing rep. Please try again.');
    } finally {
      setIsSavingRep(false);
    }
  }, [updateDailyPracticeData, isSavingRep]); // Explicitly include prop

  /* =========================================================
     IDENTITY & HABIT HANDLERS (Dependency on updateDailyPracticeData)
  ========================================================= */
  const handleSaveIdentity = useCallback(async (newIdentity) => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) return;

    try {
      const success = await updateDailyPracticeData({ identityAnchor: newIdentity });
      if (success) {
        setIdentityStatement(newIdentity);
        setShowIdentityEditor(false);
        console.log('[Dashboard] Identity saved');
      }
    } catch (error) {
      console.error('[Dashboard] Error saving identity:', error);
      alert('Error saving identity. Please try again.');
    }
  }, [updateDailyPracticeData]); // Explicitly include prop

  const handleSaveHabit = useCallback(async (newHabit) => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) return;

    try {
      const success = await updateDailyPracticeData({ habitAnchor: newHabit });
      if (success) {
        setHabitAnchor(newHabit);
        setShowHabitEditor(false);
        console.log('[Dashboard] Habit anchor saved');
      }
    } catch (error) {
      console.error('[Dashboard] Error saving habit:', error);
      alert('Error saving habit. Please try again.');
    }
  }, [updateDailyPracticeData]); // Explicitly include prop

  /* =========================================================
     BOOKEND HANDLERS (Dependency on updateDailyPracticeData)
  ========================================================= */
  const handleSaveMorningBookend = useCallback(async () => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) {
      console.error('[Dashboard] Cannot save morning bookend');
      alert('Error: Unable to save. Please try again.');
      return;
    }

    setIsSavingBookend(true);
    try {
      const updates = {
        morningBookend: {
          dailyWIN: morningWIN,
          otherTasks: otherTasks,
          readLIS: showLIS,
          completedAt: serverTimestamp()
        }
      };

      const success = await updateDailyPracticeData(updates);
      if (!success) throw new Error('Update failed');
      console.log('[Dashboard] Morning bookend saved');
    } catch (error) {
      console.error('[Dashboard] Error saving morning bookend:', error);
      alert('Error saving morning plan. Please try again.');
    } finally {
      setIsSavingBookend(false);
    }
  }, [morningWIN, otherTasks, showLIS, updateDailyPracticeData]); // Explicitly include prop

  const handleSaveEveningBookend = useCallback(async () => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) {
      console.error('[Dashboard] Cannot save evening bookend');
      alert('Error: Unable to save. Please try again.');
      return;
    }

    setIsSavingBookend(true);
    try {
      const updates = {
        eveningBookend: {
          good: reflectionGood,
          better: reflectionBetter,
          best: reflectionBest,
          habits: habitsCompleted,
          completedAt: serverTimestamp()
        },
        // NEW: Set tomorrow's reminders from today's reflection
        tomorrowsReminder: reflectionBest,
        improvementReminder: reflectionBetter
      };

      const success = await updateDailyPracticeData(updates);
      if (!success) throw new Error('Update failed');

      // Auto-check evening reflection habit
      setHabitsCompleted(prev => ({ ...prev, eveningReflection: true }));
      
      // FIXED (Issue 5): Clear local state and activate reload guard flag
      setReflectionGood('');
      setReflectionBetter('');
      setReflectionBest('');
      setShouldSkipReflectionLoad(true); // <-- Set flag to skip next listener update
      
      console.log('[Dashboard] Evening bookend saved with next-day reminders');
    } catch (error) {
      console.error('[Dashboard] Error saving evening bookend:', error);
      alert('Error saving reflection. Please try again.');
    } finally {
      setIsSavingBookend(false);
    }
  }, [reflectionGood, reflectionBetter, reflectionBest, habitsCompleted, updateDailyPracticeData]); // Explicitly include prop

  const handleAddTask = useCallback((taskText) => {
    if (!taskText.trim()) return;
    if (otherTasks.length >= 5) {
      alert('Maximum 5 tasks allowed');
      return;
    }
    
    const newTask = {
      id: `task-${Date.now()}`,
      text: taskText,
      completed: false
    };
    
    const updatedTasks = [...otherTasks, newTask];
    setOtherTasks(updatedTasks);
    
    // NEW: Auto-save to Firestore immediately
    // Use the destructured prop directly
    if (updateDailyPracticeData) {
      updateDailyPracticeData({
        'morningBookend.otherTasks': updatedTasks
      }).catch(error => {
        console.error('[Dashboard] Error auto-saving task:', error);
      });
    }
  }, [otherTasks, updateDailyPracticeData]); // Explicitly include prop

  const handleToggleTask = useCallback(async (taskId) => {
    const updatedTasks = otherTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setOtherTasks(updatedTasks);
    
    // Auto-save to Firestore immediately
    // Use the destructured prop directly
    if (updateDailyPracticeData) {
      try {
        await updateDailyPracticeData({
          'morningBookend.otherTasks': updatedTasks
        });
        console.log('[Dashboard] Task toggled and saved');
      } catch (error) {
        console.error('[Dashboard] Error auto-saving task toggle:', error);
      }
    }
  }, [otherTasks, updateDailyPracticeData]); // Explicitly include prop

  const handleRemoveTask = useCallback(async (taskKey) => {
    let updatedTasks;
    if (typeof taskKey === 'number') {
      updatedTasks = otherTasks.filter((_, idx) => idx !== taskKey);
    } else {
      updatedTasks = otherTasks.filter(task => task.id !== taskKey);
      // If not found and taskKey looks like an index string, try parseInt
      if (updatedTasks.length === otherTasks.length && typeof taskKey === 'string' && taskKey.match(/^\d+$/)) {
        const idx = parseInt(taskKey, 10);
        updatedTasks = otherTasks.filter((_, i) => i !== idx);
      }
    }
    // If still same length, nothing to remove
    if (updatedTasks.length === otherTasks.length) return;
    setOtherTasks(updatedTasks);
    
    // Auto-save to Firestore immediately
    // Use the destructured prop directly
    if (updateDailyPracticeData) {
      try {
        await updateDailyPracticeData({
          'morningBookend.otherTasks': updatedTasks
        });
        console.log('[Dashboard] Task removed and saved');
      } catch (error) {
        console.error('[Dashboard] Error auto-saving task removal:', error);
      }
    }
  }, [otherTasks, updateDailyPracticeData]); // Explicitly include prop

  // NEW: Handle WIN checkbox toggle
  const handleToggleWIN = useCallback(async () => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) return;
    
    const currentStatus = dailyPracticeData?.morningBookend?.winCompleted || false;
    const newStatus = !currentStatus;
    
    try {
      await updateDailyPracticeData({
        'morningBookend.winCompleted': newStatus
      });
      console.log('[Dashboard] WIN toggled:', newStatus);
    } catch (error) {
      console.error('[Dashboard] Error toggling WIN:', error);
    }
  }, [dailyPracticeData, updateDailyPracticeData]); // Explicitly include prop

  const handleHabitToggle = useCallback((habitKey, checked) => {
    setHabitsCompleted(prev => ({ ...prev, [habitKey]: checked }));
  }, []);

  // NEW: Handle saving WIN separately
  const handleSaveWIN = useCallback(async () => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) return;
    
    try {
      await updateDailyPracticeData({
        'morningBookend.dailyWIN': morningWIN
      });
      console.log('[Dashboard] WIN saved');
    } catch (error) {
      console.error('[Dashboard] Error saving WIN:', error);
      alert('Error saving WIN. Please try again.');
    }
  }, [morningWIN, updateDailyPracticeData]); // Explicitly include prop

  /* =========================================================
     COMPUTED VALUES
  ========================================================= */
  // Derived AM flags for UI auto-tracking
  const amCompletedAt = dailyPracticeData?.morningBookend?.completedAt || null;
  const amWinCompleted = !!(dailyPracticeData?.morningBookend?.winCompleted);
  const amTasksCompleted = Array.isArray(otherTasks) && otherTasks.length > 0 && otherTasks.every(t => !!t.completed);

  const targetRep = useMemo(() => {
    return dailyPracticeData?.dailyTargetRepId || null;
  }, [dailyPracticeData?.dailyTargetRepId]);

  const canCompleteTargetRep = useMemo(() => {
    return targetRepStatus === 'Pending' && !isSavingRep;
  }, [targetRepStatus, isSavingRep]);

  /* =========================================================
     RETURN ALL STATE & HANDLERS
  ========================================================= */
  return {
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
    handleToggleWIN, // NEW
    handleSaveWIN, // NEW
    handleHabitToggle,
    setShouldSkipReflectionLoad, // FIXED 10/29/25: Export flag setter

    // Streak
    streakCount,
    streakCoins,

    // Additional Reps
    additionalCommitments,
  };
};