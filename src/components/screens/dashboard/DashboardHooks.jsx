// src/components/screens/dashboard/DashboardHooks.jsx
// Extracted State & Logic from Dashboard (10/28/25)
// FINALIZED: Ensures updateDailyPracticeData dependency is used correctly and safely within callbacks.
// FIXED (10/30/25): Final fix for Issue 5 (Reflections not clearing) by clearing local state explicitly.

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { serverTimestamp } from 'firebase/firestore';

// Helper function to check if developer mode is enabled
const isDeveloperMode = () => localStorage.getItem('arena-developer-mode') === 'true';

/* =========================================================
   MAIN DASHBOARD HOOK
   Consolidates all state and logic for Dashboard
========================================================= */
export const useDashboard = ({
  dailyPracticeData,
  updateDailyPracticeData, // <--- Prop from useAppServices
  globalMetadata // <--- Added for Scorecard calculation
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
  const [whyStatement, setWhyStatement] = useState('');
  const [showIdentityEditor, setShowIdentityEditor] = useState(false);
  const [showHabitEditor, setShowHabitEditor] = useState(false);

  // === BOOKEND STATE (NEW 10/28/25) ===
  const [morningWIN, setMorningWIN] = useState('');
  const [otherTasks, setOtherTasks] = useState([]);
  const [showLIS, setShowLIS] = useState(false);
  const [reflectionGood, setReflectionGood] = useState('');
  const [reflectionBetter, setReflectionBetter] = useState('');
  const [reflectionBest, setReflectionBest] = useState('');
  const [winsList, setWinsList] = useState([]); // New: Cumulative wins list
  const [habitsCompleted, setHabitsCompleted] = useState({
  });
  const [isSavingBookend, setIsSavingBookend] = useState(false);
  
  // FIXED 10/29/25: Track when we're intentionally clearing reflections
  const [shouldSkipReflectionLoad, setShouldSkipReflectionLoad] = useState(false);
  
  // NEW: Track last local update to prevent stale overwrites
  const lastHabitUpdateTime = useRef(0);

  // === STREAK STATE ===
  const [streakCount, setStreakCount] = useState(0);
  const [streakCoins, setStreakCoins] = useState(0);

  // === ADDITIONAL REPS STATE ===
  const [additionalCommitments, setAdditionalCommitments] = useState([]);

  /* =========================================================
     LOAD DATA FROM FIRESTORE (Dependency on dailyPracticeData)
  ========================================================= */

  // Helper to sanitize Firestore Timestamps
  const sanitizeTimestamps = useCallback((obj) => {
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
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitizeTimestamps(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  }, []);
  
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

  // Load Identity & Habit & Why
  useEffect(() => {
    if (dailyPracticeData?.identityAnchor) {
      setIdentityStatement(dailyPracticeData.identityAnchor);
    }
    if (dailyPracticeData?.habitAnchor) {
      setHabitAnchor(dailyPracticeData.habitAnchor);
    }
    if (dailyPracticeData?.whyStatement) {
      setWhyStatement(dailyPracticeData.whyStatement);
    }
  }, [dailyPracticeData?.identityAnchor, dailyPracticeData?.habitAnchor, dailyPracticeData?.whyStatement]);

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
    // Support both snake_case (new) and camelCase (legacy/mock)
    const commitments = dailyPracticeData?.active_commitments || dailyPracticeData?.activeCommitments;
    if (commitments) {
      setAdditionalCommitments(sanitizeTimestamps(commitments));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dailyPracticeData?.active_commitments), JSON.stringify(dailyPracticeData?.activeCommitments)]);

  const handleToggleAdditionalRep = useCallback(async (commitmentId, currentStatus) => {
    const newStatus = currentStatus === 'Committed' ? 'Pending' : 'Committed';
    
    // Optimistic update
    const updatedCommitments = additionalCommitments.map(c => 
      c.id === commitmentId ? { ...c, status: newStatus } : c
    );
    setAdditionalCommitments(updatedCommitments);

    if (updateDailyPracticeData) {
      try {
        await updateDailyPracticeData({
          active_commitments: updatedCommitments
        });
      } catch (error) {
        console.error('Error toggling commitment:', error);
        // Revert
        setAdditionalCommitments(additionalCommitments);
      }
    }
  }, [additionalCommitments, updateDailyPracticeData]);

  // Load Morning Bookend
  useEffect(() => {
    if (dailyPracticeData?.morningBookend) {
      const mb = dailyPracticeData.morningBookend;
      setMorningWIN(mb.dailyWIN || '');
      setOtherTasks(sanitizeTimestamps(mb.otherTasks || []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dailyPracticeData?.morningBookend)]);

  // Load Evening Bookend (Issue 5 Fix)
  useEffect(() => {
    // Skip load if we just saved and cleared
    if (shouldSkipReflectionLoad) {
      // Clear flag after skipping the load cycle
      setShouldSkipReflectionLoad(false); 
      return;
    }
    
    // Skip load if we recently updated locally (within 2 seconds)
    if (Date.now() - lastHabitUpdateTime.current < 2000) {
      return;
    }
    
    if (dailyPracticeData?.eveningBookend) {
      const eb = dailyPracticeData.eveningBookend;
      setReflectionGood(eb.good || '');
      setReflectionBetter(eb.better || '');
      setReflectionBest(eb.best || '');
      setHabitsCompleted(eb.habits || {
  });
    } else {
      // If no evening bookend data, reset to default state
      setReflectionGood('');
      setReflectionBetter('');
      setReflectionBest('');
      setHabitsCompleted({
  });
    }

    // Load cumulative wins list from stored data
    if (dailyPracticeData?.winsList) {
      setWinsList(dailyPracticeData.winsList);
    } else {
      setWinsList([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dailyPracticeData?.eveningBookend), JSON.stringify(dailyPracticeData?.winsList), shouldSkipReflectionLoad]);

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
      }
    } catch (error) {
      console.error('Error changing mode:', error);
      const isDeveloperMode = localStorage.getItem('arena-developer-mode') === 'true';
      if (isDeveloperMode) {
        alert('Error changing mode. Please try again.');
      }
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
      }
        } catch (error) {
      console.error('Error completing rep:', error);
      const isDeveloperMode = localStorage.getItem('arena-developer-mode') === 'true';
      if (isDeveloperMode) {
        alert('Error completing rep. Please try again.');
      }
    } finally {
      setIsSavingRep(false);
    }
  }, [updateDailyPracticeData, isSavingRep]); // Explicitly include prop

  /* =========================================================
     IDENTITY & HABIT HANDLERS (Dependency on updateDailyPracticeData)
  ========================================================= */
  const handleSaveIdentity = useCallback(async (newIdentity) => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) return false;

    try {
      const success = await updateDailyPracticeData({ identityAnchor: newIdentity });
      if (success) {
        setIdentityStatement(newIdentity);
        setShowIdentityEditor(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving identity:', error);
      throw error;
    }
  }, [updateDailyPracticeData]); // Explicitly include prop

  const handleSaveHabit = useCallback(async (newHabit) => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) return false;

    try {
      const success = await updateDailyPracticeData({ habitAnchor: newHabit });
      if (success) {
        setHabitAnchor(newHabit);
        setShowHabitEditor(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving habit:', error);
      throw error;
    }
  }, [updateDailyPracticeData]); // Explicitly include prop

  const handleSaveWhy = useCallback(async (newWhy) => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) return false;

    try {
      const success = await updateDailyPracticeData({ whyStatement: newWhy });
      if (success) {
        setWhyStatement(newWhy);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving why statement:', error);
      throw error;
    }
  }, [updateDailyPracticeData]); // Explicitly include prop

  /* =========================================================
     COMPUTED VALUES (Moved Up for Dependency Access)
  ========================================================= */
  // Derived AM flags for UI auto-tracking
  const amCompletedAt = useMemo(() => dailyPracticeData?.morningBookend?.completedAt || null, [dailyPracticeData]);
  const amWinCompleted = useMemo(() => !!(dailyPracticeData?.morningBookend?.winCompleted), [dailyPracticeData]);
  const amTasksCompleted = useMemo(() => Array.isArray(otherTasks) && otherTasks.length > 0 && otherTasks.every(t => !!t.completed), [otherTasks]);

  const targetRep = useMemo(() => {
    return dailyPracticeData?.dailyTargetRepId || null;
  }, [dailyPracticeData?.dailyTargetRepId]);

  const canCompleteTargetRep = useMemo(() => {
    return targetRepStatus === 'Pending' && !isSavingRep;
  }, [targetRepStatus, isSavingRep]);

  // NEW: Scorecard Calculation (Moved from Dashboard4)
  const scorecard = useMemo(() => {
    // 1. Reps Logic
    const hasLIS = !!identityStatement;
    const lisRead = habitsCompleted?.readLIS || false;
    const dailyRepCompleted = habitsCompleted?.completedDailyRep || false;
    
    // Determine if there is a daily rep (Target Rep)
    // We check if an ID exists. Name resolution happens in UI, but existence is enough for score.
    const hasDailyRep = !!dailyPracticeData?.dailyTargetRepId;

    let repsTotal = 1; // LIS is always a rep
    let repsDone = lisRead ? 1 : 0;
    
    if (hasDailyRep) {
      repsTotal++;
      if (dailyRepCompleted) repsDone++;
    }
    
    // Add additional commitments
    if (additionalCommitments && additionalCommitments.length > 0) {
      repsTotal += additionalCommitments.length;
      repsDone += additionalCommitments.filter(c => c.status === 'Committed').length;
    }
    
    const repsPct = repsTotal > 0 ? Math.round((repsDone / repsTotal) * 100) : 0;

    // 2. Win the Day Logic
    // Components: Top Priority (WIN) + Other Tasks
    let winTotal = 1; // Top Priority
    let winDone = amWinCompleted ? 1 : 0;
    
    if (otherTasks && otherTasks.length > 0) {
      winTotal += otherTasks.length;
      winDone += otherTasks.filter(t => t.completed).length;
    }
    
    const winPct = winTotal > 0 ? Math.round((winDone / winTotal) * 100) : 0;

    return {
      reps: { done: repsDone, total: repsTotal, pct: repsPct },
      win: { done: winDone, total: winTotal, pct: winPct }
    };
  }, [identityStatement, habitsCompleted, dailyPracticeData?.dailyTargetRepId, additionalCommitments, amWinCompleted, otherTasks]);

  /* =========================================================
     BOOKEND HANDLERS (Dependency on updateDailyPracticeData)
  ========================================================= */
  const handleSaveMorningBookend = useCallback(async () => {
    console.log('☀️ [MORNING BOOKEND] Save initiated:', {
      dailyWIN: morningWIN,
      otherTasks,
      readLIS: showLIS
    });
    
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

      console.log('☀️ [MORNING BOOKEND] Calling updateDailyPracticeData with:', updates);
      const success = await updateDailyPracticeData(updates);
      console.log('☀️ [MORNING BOOKEND] Save result:', success);
      if (!success) throw new Error('Update failed');
      // Always show success message with warm feeling
      const message = '✅ Morning Plan Saved Successfully!\n\n' +
                     '🎯 Your WIN is locked in for today\n' +
                     '📋 Tasks are ready to track\n' +
                     '🚀 You\'re all set to make today count!';
      alert(message);
    } catch (error) {
      console.error('Error saving morning plan:', error);
      alert('Error saving morning plan. Please try again.');
    } finally {
      setIsSavingBookend(false);
    }
  }, [morningWIN, otherTasks, showLIS, updateDailyPracticeData]); // Explicitly include prop

  const handleSaveEveningBookend = useCallback(async () => {
    console.log('💾 [EVENING BOOKEND] Save initiated:', {
      good: reflectionGood,
      better: reflectionBetter,
      best: reflectionBest,
      habits: habitsCompleted
    });
    
    // Use the destructured prop directly
    if (!updateDailyPracticeData) {
      console.error('[Dashboard] Cannot save evening bookend - updateDailyPracticeData is not available');
      alert('Error: Unable to save. Please try again.');
      return;
    }

    setIsSavingBookend(true);
    try {
      // Create reminders from the evening bookend data
      const newReminders = [];
      
      // Add tomorrow's reminder if provided
      if (reflectionBest && reflectionBest.trim()) {
        newReminders.push({
  });
      }
      
      // Add improvement reminder if provided
      if (reflectionBetter && reflectionBetter.trim()) {
        newReminders.push({
  });
      }

      // Add new win to cumulative wins list if provided
      const updatedWinsList = [...winsList];
      if (reflectionGood && reflectionGood.trim()) {
        const newWin = {
          id: Date.now(),
          text: reflectionGood.trim(),
          date: new Date().toLocaleDateString(),
          timestamp: new Date().toISOString()
        };
        updatedWinsList.push(newWin);
        setWinsList(updatedWinsList); // Update local state immediately
      }

      // NEW: Save Scorecard History
      const todayDate = new Date().toLocaleDateString();
      const currentScore = `${scorecard.reps.pct}/${scorecard.win.pct}`;
      
      // Get existing history or init empty
      const existingHistory = dailyPracticeData?.scorecardHistory || [];
      // Remove today's entry if exists to overwrite
      const historyWithoutToday = existingHistory.filter(h => h.date !== todayDate);
      
      const newHistoryEntry = {
          date: todayDate,
          score: currentScore,
          timestamp: new Date().toISOString()
      };
      
      const updatedHistory = [...historyWithoutToday, newHistoryEntry];

      const updates = {
        eveningBookend: {
          good: reflectionGood,
          better: reflectionBetter,
          best: reflectionBest,
          habits: habitsCompleted,
          completedAt: serverTimestamp()
        },
        // Save cumulative wins list
        winsList: updatedWinsList,
        // Save Scorecard History
        scorecardHistory: updatedHistory,
        // NEW: Set tomorrow's reminders from today's reflection
        tomorrowsReminder: reflectionBest,
        improvementReminder: reflectionBetter
      };

      // Add reminders to updates if any were created
      if (newReminders.length > 0) {
        // Get existing reminders and append new ones
        const existingReminders = dailyPracticeData?.reminders || [];
        updates.reminders = [...existingReminders, ...newReminders];
      }

      console.log('💾 [EVENING BOOKEND] Calling updateDailyPracticeData with:', updates);
      const success = await updateDailyPracticeData(updates);
      console.log('💾 [EVENING BOOKEND] Save result:', success);
      
      if (!success) throw new Error('Update failed');

      // Auto-check evening reflection habit
      setHabitsCompleted(prev => ({ ...prev, eveningReflection: true }));
      
      // FIXED (Issue 5): Clear local state and activate reload guard flag
      setReflectionGood('');
      setReflectionBetter('');
      setReflectionBest('');
      setShouldSkipReflectionLoad(true); // <-- Set flag to skip next listener update
      
      
      // Always show success message with warm feeling
      let message = '✅ Evening Reflection Saved Successfully!\n\n';
      message += '🏆 Your wins have been added to your victory collection\n';
      message += '📈 Growth insights captured for your leadership journey\n';
      message += '🎯 Tomorrow\'s focus areas are now clear\n';
      if (newReminders.length > 0) {
        message += `\n🔔 ${newReminders.length} smart reminder(s) created for tomorrow based on your insights`;
      }
      message += '\n\n🌟 Great work closing out your day with intention!';
      alert(message);
    } catch (error) {
      console.error('[Dashboard] Error saving evening bookend:', error);
      console.error('[Dashboard] Error details:', {
  });
      alert(`Error saving reflection: ${error.message}. Please try again.`);
    } finally {
      setIsSavingBookend(false);
    }
  }, [reflectionGood, reflectionBetter, reflectionBest, habitsCompleted, updateDailyPracticeData, dailyPracticeData]); // Explicitly include prop

  const handleAddTask = useCallback((taskText) => {
    // Developer mode check removed for now
    
    if (!taskText.trim()) {
      return;
    }
    if (otherTasks.length >= 5) {
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
        morningBookend: {
          ...dailyPracticeData?.morningBookend,
          otherTasks: updatedTasks
        }
      }).then(() => {
        // Simple confirmation without cluttering the UI
      }).catch(error => {
        console.error('[Dashboard] Error auto-saving task:', error);
        console.error('[Dashboard] Error details:', {
  });
        alert(`Error saving task: ${error.message}`);
      });
    } else {
      console.error('[Dashboard] updateDailyPracticeData is not available!');
      alert('Error: Cannot save task. Please refresh the page.');
    }
  }, [otherTasks, updateDailyPracticeData]); // Explicitly include prop

  const handleToggleTask = useCallback(async (taskId) => {
    const updatedTasks = otherTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setOtherTasks(updatedTasks);
    
    // Update winsList based on completion
    const task = otherTasks.find(t => t.id === taskId);
    const newStatus = !task.completed; // This is the new status
    
    let updatedWinsList = [...winsList];
    const todayDate = new Date().toLocaleDateString();
    const winId = `task-win-${taskId}`; 

    if (newStatus) {
         if (!updatedWinsList.find(w => w.id === winId)) {
            updatedWinsList.push({
                id: winId,
                text: task.text,
                date: todayDate,
                completed: true,
                timestamp: new Date().toISOString()
            });
         }
    } else {
        updatedWinsList = updatedWinsList.filter(w => w.id !== winId);
    }
    setWinsList(updatedWinsList);

    // Auto-save to Firestore immediately
    // Use the destructured prop directly
    if (updateDailyPracticeData) {
      try {
        await updateDailyPracticeData({
          morningBookend: {
            ...dailyPracticeData?.morningBookend,
            otherTasks: updatedTasks
          },
          winsList: updatedWinsList
        });
      } catch (error) {
        console.error('[Dashboard] Error auto-saving task toggle:', error);
      }
    }
  }, [otherTasks, updateDailyPracticeData, winsList, dailyPracticeData]); // Explicitly include prop

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
          morningBookend: {
            ...dailyPracticeData?.morningBookend,
            otherTasks: updatedTasks
          }
        });
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
    
    // Update winsList
    let updatedWinsList = [...winsList];
    const todayDate = new Date().toLocaleDateString();
    const winId = `morning-win-${new Date().toISOString().split('T')[0]}`; 

    const existing

    if (existingWinIndex >= 0) {
        // Update existing
        updatedWinsList[existingWinIndex] = {
            ...updatedWinsList[existingWinIndex],
            completed: newStatus
        };
    } else {
        // Should exist if saved, but if not (legacy or unsaved flow), add it
        updatedWinsList.push({
            id: winId,
            text: morningWIN || 'Morning Win',
            date: todayDate,
            completed: newStatus,
            timestamp: new Date().toISOString()
        });
    }
    setWinsList(updatedWinsList);

    try {
      await updateDailyPracticeData({
        'morningBookend.winCompleted': newStatus,
        winsList: updatedWinsList
      });
    } catch (error) {
      console.error('[Dashboard] Error toggling WIN:', error);
    }
  }, [dailyPracticeData, updateDailyPracticeData, winsList, morningWIN]); // Explicitly include prop

  const handleHabitToggle = useCallback((habitKey, isChecked) => {
    lastHabitUpdateTime.current = Date.now();
    setHabitsCompleted(prev => ({ ...prev, [habitKey]: isChecked }));
  }, []);

  const handleDeleteWin = useCallback(async (winId) => {
    if (!updateDailyPracticeData) return;
    
    const updatedWinsList = winsList.filter(win => win.id !== winId);
    setWinsList(updatedWinsList);
    
    try {
      await updateDailyPracticeData({ winsList: updatedWinsList });
    } catch (error) {
      console.error('Error deleting win:', error);
      // Revert on error
      setWinsList(winsList);
      alert('Error deleting win. Please try again.');
    }
  }, [winsList, updateDailyPracticeData]);

  // NEW: Handle saving WIN separately
  const [isSavingWIN, setIsSavingWIN] = useState(false);
  
  const handleSaveWIN = useCallback(async () => {
    // Use the destructured prop directly
    if (!updateDailyPracticeData) {
      console.error('[Dashboard] Cannot save WIN - updateDailyPracticeData not available');
      alert('⚠️ Error: Cannot save WIN. Please refresh.');
      return;
    }
    
    setIsSavingWIN(true);
    
    try {
      // NEW: Add to winsList as Pending so it shows in Locker
      const todayDate = new Date().toLocaleDateString();
      const winId = `morning-win-${new Date().toISOString().split('T')[0]}`;
      
      let updatedWinsList = [...winsList];
      const existingWinIndex = updatedWinsList.findIndex(w => w.id === winId);
      
      const winData = {
        id: winId,
        text: morningWIN,
        date: todayDate,
        completed: false, // Pending initially
        timestamp: new Date().toISOString()
      };

      if (existingWinIndex >= 0) {
        // Update existing (e.g. text change), preserving completion status if it was already there
        updatedWinsList[existingWinIndex] = {
            ...updatedWinsList[existingWinIndex],
            text: morningWIN
        };
      } else {
        // Add new
        updatedWinsList.push(winData);
      }
      
      setWinsList(updatedWinsList);

      // Use nested object structure instead of dot notation
      const success = await updateDailyPracticeData({
        morningBookend: {
          dailyWIN: morningWIN
        },
        winsList: updatedWinsList
      });
      
      if (success) {
        // Always show feedback, not just in dev mode
      } else {
        throw new Error('Update returned false');
      }
    } catch (error) {
      console.error('[Dashboard] Error saving WIN:', error);
      alert('❌ Error saving WIN: ' + error.message);
    } finally {
      setIsSavingWIN(false);
    }
  }, [morningWIN, updateDailyPracticeData, winsList]); // Explicitly include prop

  // NEW: Handle saving Scorecard separately
  const [isSavingScorecard, setIsSavingScorecard] = useState(false);

  const handleSaveScorecard = useCallback(async () => {
    if (!updateDailyPracticeData) return;
    
    setIsSavingScorecard(true);
    try {
      const todayDate = new Date().toLocaleDateString();
      const currentScore = `${scorecard.reps.pct}/${scorecard.win.pct}`;
      
      // Get existing history or init empty
      const existingHistory = dailyPracticeData?.scorecardHistory || [];
      // Remove today's entry if exists to overwrite
      const historyWithoutToday = existingHistory.filter(h => h.date !== todayDate);
      
      const newHistoryEntry = {
          date: todayDate,
          score: currentScore,
          timestamp: new Date().toISOString()
      };
      
      const updatedHistory = [...historyWithoutToday, newHistoryEntry];

      await updateDailyPracticeData({
        scorecardHistory: updatedHistory
      });
      
      alert('✅ Scorecard saved to Locker!');
    } catch (error) {
      console.error('Error saving scorecard:', error);
      alert('Error saving scorecard. Please try again.');
    } finally {
      setIsSavingScorecard(false);
    }
  }, [scorecard, dailyPracticeData, updateDailyPracticeData]);


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

    // Identity & Habit & Why
    identityStatement,
    setIdentityStatement,
    habitAnchor,
    setHabitAnchor,
    whyStatement,
    setWhyStatement,
    showIdentityEditor,
    setShowIdentityEditor,
    showHabitEditor,
    setShowHabitEditor,
    handleSaveIdentity,
    handleSaveHabit,
    handleSaveWhy,

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
    winsList,
    setWinsList,
    habitsCompleted,
    isSavingBookend,
    handleSaveMorningBookend,
    handleSaveEveningBookend,
    handleAddTask,
    handleToggleTask,
    handleRemoveTask,
    handleToggleWIN,
    handleHabitToggle,
    handleDeleteWin,
    handleSaveWIN,
    isSavingWIN,
    handleSaveScorecard,
    isSavingScorecard,

    // Computed Values
    amCompletedAt,
    amWinCompleted,
    amTasksCompleted,
    scorecard, // <--- Exported

    // Streak & Additional Reps
    streakCount,
    streakCoins,
    additionalCommitments,
    handleToggleAdditionalRep
  };
};