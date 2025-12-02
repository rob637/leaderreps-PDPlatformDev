// src/components/screens/dashboard/DashboardHooks.jsx
// Extracted State & Logic from Dashboard (10/28/25)
// FINALIZED: Ensures updateDailyPracticeData dependency is used correctly and safely within callbacks.
// FIXED (10/30/25): Final fix for Issue 5 (Reflections not clearing) by clearing local state explicitly.
// ENHANCED (12/02/25): Added midnight rollover logic for Time Traveler testing

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { serverTimestamp } from 'firebase/firestore';
import { useAppServices } from '../../../hooks/useAppServices';
import { timeService } from '../../../services/timeService';

// Helper function to check if developer mode is enabled
const isDeveloperMode = () => localStorage.getItem('arena-developer-mode') === 'true';

/* =========================================================
   MAIN DASHBOARD HOOK
   Consolidates all state and logic for Dashboard
========================================================= */
export const useDashboard = ({
  dailyPracticeData,
  updateDailyPracticeData, // <--- Prop from useAppServices
  globalMetadata, // <--- Added for Scorecard calculation
  db,
  userId
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
  const [morningWins, setMorningWins] = useState([
    { id: 'win-1', text: '', completed: false, saved: false },
    { id: 'win-2', text: '', completed: false, saved: false },
    { id: 'win-3', text: '', completed: false, saved: false }
  ]);
  const [otherTasks, setOtherTasks] = useState([]);
  const [showLIS, setShowLIS] = useState(false);
  const [reflectionGood, setReflectionGood] = useState('');
  const [reflectionBetter, setReflectionBetter] = useState('');
  const [reflectionBest, setReflectionBest] = useState('');
  const [winsList, setWinsList] = useState([]); // New: Cumulative wins list
  const [repsHistory, setRepsHistory] = useState([]); // New: Reps History
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
  const [isSavingReps, setIsSavingReps] = useState(false); // NEW


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

  const handleToggleAdditionalRep = useCallback(async (commitmentId, currentStatus, text = '') => {
    const newStatus = currentStatus === 'Committed' ? 'Pending' : 'Committed';
    
    let updatedCommitments;
    const exists = additionalCommitments.find(c => c.id === commitmentId);
    
    if (exists) {
      updatedCommitments = additionalCommitments.map(c => 
        c.id === commitmentId ? { ...c, status: newStatus } : c
      );
    } else {
      // Add new commitment if it doesn't exist
      updatedCommitments = [...additionalCommitments, {
        id: commitmentId,
        status: newStatus,
        text: text,
        createdAt: timeService.getISOString()
      }];
    }
    
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
    // === NUCLEAR DEBUG: Morning Bookend Load ===
    console.log('%c[WIN-THE-DAY DEBUG] useEffect TRIGGERED for morningBookend load', 'background: #ff6600; color: white; font-weight: bold; padding: 4px 8px;');
    console.log('[WIN-THE-DAY DEBUG] Full dailyPracticeData:', JSON.stringify(dailyPracticeData, null, 2));
    console.log('[WIN-THE-DAY DEBUG] morningBookend specifically:', dailyPracticeData?.morningBookend);
    
    if (dailyPracticeData?.morningBookend) {
      const mb = dailyPracticeData.morningBookend;
      console.log('%c[WIN-THE-DAY DEBUG] Found morningBookend data:', 'color: green; font-weight: bold;', mb);
      
      // Load 3 Wins
      if (mb.wins && Array.isArray(mb.wins)) {
        console.log('%c[WIN-THE-DAY DEBUG] Loading wins from mb.wins:', 'color: blue; font-weight: bold;', mb.wins);
        setMorningWins(mb.wins);
      } else if (mb.dailyWIN) {
        console.log('%c[WIN-THE-DAY DEBUG] MIGRATION: Loading from old dailyWIN format:', 'color: orange; font-weight: bold;', mb.dailyWIN);
        // Migration: Put old single win in first slot
        setMorningWins([
          { id: 'win-1', text: mb.dailyWIN, completed: mb.winCompleted || false, saved: true },
          { id: 'win-2', text: '', completed: false, saved: false },
          { id: 'win-3', text: '', completed: false, saved: false }
        ]);
      } else {
        console.log('%c[WIN-THE-DAY DEBUG] WARNING: morningBookend exists but NO wins or dailyWIN found!', 'color: red; font-weight: bold;');
      }

      setOtherTasks(sanitizeTimestamps(mb.otherTasks || []));
    } else {
      console.log('%c[WIN-THE-DAY DEBUG] NO morningBookend in dailyPracticeData!', 'color: red; font-weight: bold;');
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

    // Load Reps History
    if (dailyPracticeData?.repsHistory) {
      setRepsHistory(dailyPracticeData.repsHistory);
    } else {
      setRepsHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dailyPracticeData?.eveningBookend), JSON.stringify(dailyPracticeData?.winsList), JSON.stringify(dailyPracticeData?.repsHistory), shouldSkipReflectionLoad]);

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
        dailyTargetRepDate: timeService.getISOString().split('T')[0]
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
    // Components: 3 Daily Priorities (Wins)
    // We count how many are defined (text exists) and how many are completed
    const definedWins = morningWins.filter(w => w.text && w.text.trim().length > 0);
    const winTotal = definedWins.length > 0 ? definedWins.length : 3; // Default to 3 if none defined yet
    const winDone = definedWins.filter(w => w.completed).length;
    
    const winPct = winTotal > 0 ? Math.round((winDone / winTotal) * 100) : 0;

    return {
      reps: { done: repsDone, total: repsTotal, pct: repsPct },
      win: { done: winDone, total: winTotal, pct: winPct }
    };
  }, [identityStatement, habitsCompleted, dailyPracticeData?.dailyTargetRepId, additionalCommitments, morningWins, otherTasks]);

  /* =========================================================
     MIDNIGHT ROLLOVER LOGIC (Time Traveler Feature)
     When day transitions at midnight:
     - Finalize completed wins to history
     - Clear morning wins, carrying over incomplete items
     - Clear PM reflection fields
     - Reset scorecard
  ========================================================= */
  const handleDayTransition = useCallback(async (oldDate, newDate) => {
    console.log('🌙 [MIDNIGHT ROLLOVER] Day transition detected!', { oldDate, newDate });
    
    if (!updateDailyPracticeData) {
      console.warn('[MIDNIGHT ROLLOVER] No updateDailyPracticeData available');
      return;
    }

    try {
      // 1. Prepare to finalize current day's wins
      const completedWins = morningWins.filter(w => w.text && w.text.trim().length > 0);
      const incompleteWins = morningWins.filter(w => w.text && w.text.trim().length > 0 && !w.completed);
      
      // Add today's wins to winsList (history)
      const winsToAdd = completedWins.map(w => ({
        ...w,
        date: oldDate,
        finalizedAt: timeService.getISOString()
      }));
      
      const updatedWinsList = [...(winsList || []), ...winsToAdd];

      // 2. Create new morning wins - carry over incomplete items
      const newMorningWins = [
        { id: 'win-1', text: incompleteWins[0]?.text || '', completed: false, saved: false, carriedOver: !!incompleteWins[0] },
        { id: 'win-2', text: incompleteWins[1]?.text || '', completed: false, saved: false, carriedOver: !!incompleteWins[1] },
        { id: 'win-3', text: incompleteWins[2]?.text || '', completed: false, saved: false, carriedOver: !!incompleteWins[2] }
      ];

      // 3. Finalize scorecard for the old day (if not already saved)
      const oldDayScorecard = {
        date: oldDate,
        score: `${scorecard.reps.done + scorecard.win.done}/${scorecard.reps.total + scorecard.win.total}`,
        repsScore: `${scorecard.reps.done}/${scorecard.reps.total}`,
        winsScore: `${scorecard.win.done}/${scorecard.win.total}`,
        finalizedAt: timeService.getISOString()
      };
      
      const existingHistory = dailyPracticeData?.scorecardHistory || [];
      const historyWithoutOldDate = existingHistory.filter(h => h.date !== oldDate);
      const updatedScorecardHistory = [...historyWithoutOldDate, oldDayScorecard];

      // 4. Finalize PM Reflection to history (if has content)
      const existingReflectionHistory = dailyPracticeData?.reflectionHistory || [];
      const reflectionHistoryWithoutOldDate = existingReflectionHistory.filter(h => h.date !== oldDate);
      let updatedReflectionHistory = reflectionHistoryWithoutOldDate;
      
      if (reflectionGood || reflectionBetter || reflectionBest) {
        const reflectionEntry = {
          id: `ref-${oldDate}`,
          date: oldDate,
          reflectionGood: reflectionGood || '',
          reflectionWork: reflectionBetter || '',
          reflectionTomorrow: reflectionBest || '',
          finalizedAt: timeService.getISOString()
        };
        updatedReflectionHistory = [reflectionEntry, ...reflectionHistoryWithoutOldDate];
      }

      // 5. Prepare Firestore update for the NEW day
      const updates = {
        // Reset morning bookend for new day
        morningBookend: {
          wins: newMorningWins,
          completedAt: null
        },
        // Clear evening bookend
        eveningBookend: {
          good: '',
          better: '',
          best: '',
          habits: {},
          completedAt: null
        },
        // Clear active commitments for new day (fresh start)
        active_commitments: [],
        // Update histories
        winsList: updatedWinsList,
        scorecardHistory: updatedScorecardHistory,
        reflectionHistory: updatedReflectionHistory,
        // Update the date marker
        date: newDate,
        // Clear reminders that were for the old day
        tomorrowsReminder: '',
        improvementReminder: ''
      };

      console.log('🌙 [MIDNIGHT ROLLOVER] Saving finalized data...', updates);
      await updateDailyPracticeData(updates);

      // 6. Reset local state for new day
      setMorningWins(newMorningWins);
      setOtherTasks([]);
      setShowLIS(false);
      setReflectionGood('');
      setReflectionBetter('');
      setReflectionBest('');
      setHabitsCompleted({});
      setAdditionalCommitments([]);
      setTargetRepStatus('Pending');
      
      // Update local history state
      setWinsList(updatedWinsList);

      console.log('🌙 [MIDNIGHT ROLLOVER] Day transition complete! Welcome to', newDate);
      
    } catch (error) {
      console.error('[MIDNIGHT ROLLOVER] Error during day transition:', error);
    }
  }, [
    updateDailyPracticeData, 
    morningWins, 
    winsList, 
    reflectionGood, 
    reflectionBetter, 
    reflectionBest,
    dailyPracticeData?.scorecardHistory,
    dailyPracticeData?.reflectionHistory,
    scorecard
  ]);

  // Day transition detection for time travel - using inline useEffect instead of external hook
  // to avoid hook ordering issues
  const lastDateRef = useRef(timeService.getTodayStr());
  
  useEffect(() => {
    // Only run when time travel is active
    if (!timeService.isActive()) return;

    const checkInterval = setInterval(() => {
      const currentDate = timeService.getTodayStr();
      const lastDate = lastDateRef.current;

      if (currentDate !== lastDate) {
        console.log('[DayTransition] Day transition detected!', {
          from: lastDate,
          to: currentDate,
          time: timeService.getNow().toLocaleTimeString()
        });

        // Update ref before calling callback to prevent multiple triggers
        lastDateRef.current = currentDate;

        // Call the transition handler
        handleDayTransition(lastDate, currentDate);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [handleDayTransition]);

  // Process pending midnight crossings from time warp (runs once after reload)
  const hasProcessedCrossingsRef = useRef(false);
  
  useEffect(() => {
    // Only process once and only if we have the update function ready
    if (hasProcessedCrossingsRef.current || !updateDailyPracticeData) return;
    
    const pendingCrossings = timeService.getPendingMidnightCrossings();
    
    if (pendingCrossings && pendingCrossings.length > 0) {
      hasProcessedCrossingsRef.current = true;
      
      console.log('🚀 [TIME WARP] Processing pending midnight crossings:', pendingCrossings);
      
      // Process each crossing sequentially
      // For a multi-day warp, we process each day's rollover
      const processCrossings = async () => {
        for (const crossing of pendingCrossings) {
          console.log(`🌙 [TIME WARP] Processing midnight rollover: ${crossing.oldDate} → ${crossing.newDate}`);
          await handleDayTransition(crossing.oldDate, crossing.newDate);
          
          // Small delay between crossings to ensure state updates properly
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('✅ [TIME WARP] All midnight rollovers processed!');
      };
      
      processCrossings();
    }
  }, [updateDailyPracticeData, handleDayTransition]);

  /* =========================================================
     BOOKEND HANDLERS (Dependency on updateDailyPracticeData)
  ========================================================= */
  const handleSaveMorningBookend = useCallback(async () => {
    console.log('☀️ [MORNING BOOKEND] Save initiated:', {
      wins: morningWins,
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
          wins: morningWins,
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
                     '🎯 Your 3 Wins are locked in for today\n' +
                     '🚀 You\'re all set to make today count!';
      alert(message);
    } catch (error) {
      console.error('Error saving morning plan:', error);
      alert('Error saving morning plan. Please try again.');
    } finally {
      setIsSavingBookend(false);
    }
  }, [morningWins, otherTasks, showLIS, updateDailyPracticeData]);

  const handleSaveEveningBookend = useCallback(async () => {
    console.log('🌙 [EVENING BOOKEND] Save initiated:', {
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
          id: Date.now() + 1,
          text: `Reminder: ${reflectionBest}`,
          completed: false,
          createdAt: timeService.getISOString()
        });
      }
      
      // Add improvement reminder if provided
      if (reflectionBetter && reflectionBetter.trim()) {
        newReminders.push({
          id: Date.now() + 2,
          text: `Improve: ${reflectionBetter}`,
          completed: false,
          createdAt: timeService.getISOString()
        });
      }

      // Add new win to cumulative wins list if provided
      const updatedWinsList = [...winsList];
      if (reflectionGood && reflectionGood.trim()) {
        const newWin = {
          id: Date.now(),
          text: reflectionGood.trim(),
          date: timeService.getNow().toLocaleDateString(),
          timestamp: timeService.getISOString()
        };
        updatedWinsList.push(newWin);
        setWinsList(updatedWinsList); // Update local state immediately
      }

      // NEW: Save Scorecard History
      const todayDate = timeService.getNow().toLocaleDateString();
      // Calculate combined score: total done / total possible
      const totalDone = scorecard.reps.done + scorecard.win.done;
      const totalPossible = scorecard.reps.total + scorecard.win.total;
      const currentScore = `${totalDone}/${totalPossible}`;
      
      // Get existing history or init empty
      const existingHistory = dailyPracticeData?.scorecardHistory || [];
      // Remove today's entry if exists to overwrite
      const historyWithoutToday = existingHistory.filter(h => h.date !== todayDate);
      
      const newHistoryEntry = {
          date: todayDate,
          score: currentScore,
          repsScore: `${scorecard.reps.done}/${scorecard.reps.total}`,
          winsScore: `${scorecard.win.done}/${scorecard.win.total}`,
          timestamp: timeService.getISOString()
      };
      
      const updatedHistory = [...historyWithoutToday, newHistoryEntry];

      // NEW: Save Reflection History for the Locker
      const existingReflectionHistory = dailyPracticeData?.reflectionHistory || [];
      // Remove today's entry if exists to overwrite
      const reflectionHistoryWithoutToday = existingReflectionHistory.filter(h => h.date !== todayDate);
      
      // Only add entry if there's at least one reflection field
      let updatedReflectionHistory = reflectionHistoryWithoutToday;
      if (reflectionGood || reflectionBetter || reflectionBest) {
        const newReflectionEntry = {
          id: `ref-${todayDate}`,
          date: todayDate,
          reflectionGood: reflectionGood || '',
          reflectionWork: reflectionBetter || '',
          reflectionTomorrow: reflectionBest || '',
          timestamp: timeService.getISOString()
        };
        updatedReflectionHistory = [newReflectionEntry, ...reflectionHistoryWithoutToday];
      }

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
        // Save Reflection History for the Locker
        reflectionHistory: updatedReflectionHistory,
        // NEW: Set tomorrow's reminders from today's reflection
        tomorrowsReminder: reflectionBest,
        improvementReminder: reflectionBetter,
        date: timeService.getNow().toLocaleDateString('en-CA') // Ensure date is updated
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
  }, [reflectionGood, reflectionBetter, reflectionBest, habitsCompleted, updateDailyPracticeData, dailyPracticeData, scorecard, winsList]); // Explicitly include prop

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
          wins: morningWins, // Ensure wins are preserved from local state
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
  }, [otherTasks, updateDailyPracticeData, dailyPracticeData, morningWins]); // Explicitly include prop

  const handleToggleTask = useCallback(async (taskId) => {
    const updatedTasks = otherTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setOtherTasks(updatedTasks);
    
    // Update winsList based on completion
    const task = otherTasks.find(t => t.id === taskId);
    const newStatus = !task.completed; // This is the new status
    
    let updatedWinsList = [...winsList];
    const todayDate = timeService.getNow().toLocaleDateString();
    const winId = `task-win-${taskId}`; 

    if (newStatus) {
         if (!updatedWinsList.find(w => w.id === winId)) {
            updatedWinsList.push({
                id: winId,
                text: task.text,
                date: todayDate,
                completed: true,
                timestamp: timeService.getISOString()
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
            wins: morningWins, // Ensure wins are preserved from local state
            otherTasks: updatedTasks
          },
          winsList: updatedWinsList
        });
      } catch (error) {
        console.error('[Dashboard] Error auto-saving task toggle:', error);
      }
    }
  }, [otherTasks, updateDailyPracticeData, winsList, dailyPracticeData, morningWins]); // Explicitly include prop

  const handleUpdateTask = useCallback(async (taskId, newText) => {
    const updatedTasks = otherTasks.map(task =>
      task.id === taskId ? { ...task, text: newText } : task
    );
    setOtherTasks(updatedTasks);
    
    // Auto-save to Firestore immediately
    if (updateDailyPracticeData) {
      try {
        await updateDailyPracticeData({
          morningBookend: {
            ...dailyPracticeData?.morningBookend,
            wins: morningWins, // Ensure wins are preserved from local state
            otherTasks: updatedTasks
          }
        });
      } catch (error) {
        console.error('[Dashboard] Error auto-saving task update:', error);
      }
    }
  }, [otherTasks, updateDailyPracticeData, dailyPracticeData, morningWins]);

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
            wins: morningWins, // Ensure wins are preserved from local state
            otherTasks: updatedTasks
          }
        });
      } catch (error) {
        console.error('[Dashboard] Error auto-saving task removal:', error);
      }
    }
  }, [otherTasks, updateDailyPracticeData, dailyPracticeData, morningWins]); // Explicitly include prop

  // NEW: Handle WIN checkbox toggle
  const handleToggleWIN = useCallback(async () => {
    if (!updateDailyPracticeData) return;

    const newWins = [...morningWins];
    if (!newWins[0]) return;
    
    newWins[0] = { ...newWins[0], completed: !newWins[0].completed };
    setMorningWins(newWins);

    try {
      await updateDailyPracticeData({
        morningBookend: {
            ...dailyPracticeData?.morningBookend,
            wins: newWins,
            otherTasks: otherTasks // Ensure otherTasks are preserved from local state
        }
      });
    } catch (error) {
      console.error('Error toggling win:', error);
    }
  }, [morningWins, updateDailyPracticeData, dailyPracticeData, otherTasks]);

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
  // NEW: Handle saving WIN separately (Now handles array of 3)
  const [isSavingWIN, setIsSavingWIN] = useState(false);
  
  const handleUpdateWin = useCallback((index, text) => {
    const newWins = [...morningWins];
    if (!newWins[index]) return;
    newWins[index] = { ...newWins[index], text };
    setMorningWins(newWins);
  }, [morningWins]);

  const handleSaveSingleWin = useCallback(async (index) => {
    // === NUCLEAR DEBUG: Save Single Win ===
    console.log('%c[WIN-THE-DAY DEBUG] handleSaveSingleWin CALLED for index:', 'background: #0088ff; color: white; font-weight: bold; padding: 4px 8px;', index);
    console.log('[WIN-THE-DAY DEBUG] Current morningWins:', JSON.stringify(morningWins, null, 2));
    
    if (!updateDailyPracticeData) {
      console.log('%c[WIN-THE-DAY DEBUG] ABORT: updateDailyPracticeData is falsy!', 'color: red; font-weight: bold;');
      return;
    }
    
    setIsSavingWIN(true);
    try {
      const newWins = [...morningWins];
      newWins[index] = { ...newWins[index], saved: true };
      console.log('[WIN-THE-DAY DEBUG] newWins after update:', JSON.stringify(newWins, null, 2));
      setMorningWins(newWins);

      // === Sync to winsList for Locker History ===
      const todayDate = timeService.getNow().toLocaleDateString();
      const existingWinsList = [...winsList].filter(w => w.date !== todayDate);
      const todaysWins = newWins
        .filter(w => w.text && w.text.trim().length > 0)
        .map((w, idx) => ({
          id: `win-${todayDate}-${idx}`,
          text: w.text,
          completed: w.completed,
          date: todayDate,
          timestamp: timeService.getISOString()
        }));
      const updatedWinsList = [...existingWinsList, ...todaysWins];
      setWinsList(updatedWinsList);

      const firestorePayload = {
        morningBookend: {
            ...dailyPracticeData?.morningBookend,
            wins: newWins,
            otherTasks: otherTasks
        },
        winsList: updatedWinsList,
        date: timeService.getNow().toLocaleDateString('en-CA')
      };
      
      console.log('%c[WIN-THE-DAY DEBUG] FIRESTORE PAYLOAD (single win):', 'background: yellow; color: black; font-weight: bold;');
      console.log(JSON.stringify(firestorePayload, null, 2));

      // Update Firestore
      const result = await updateDailyPracticeData(firestorePayload);
      console.log('%c[WIN-THE-DAY DEBUG] Firestore save result:', 'color: green; font-weight: bold;', result);
    } catch (error) {
      console.error('%c[WIN-THE-DAY DEBUG] ERROR saving win:', 'color: red; font-weight: bold;', error);
    } finally {
      setIsSavingWIN(false);
    }
  }, [morningWins, updateDailyPracticeData, dailyPracticeData, otherTasks, winsList]);

  const handleSaveAllWins = useCallback(async () => {
    // === NUCLEAR DEBUG: Save All Wins ===
    console.log('%c[WIN-THE-DAY DEBUG] handleSaveAllWins CALLED', 'background: #00ff00; color: black; font-weight: bold; padding: 4px 8px;');
    console.log('[WIN-THE-DAY DEBUG] updateDailyPracticeData exists:', !!updateDailyPracticeData);
    console.log('[WIN-THE-DAY DEBUG] Current morningWins state:', JSON.stringify(morningWins, null, 2));
    console.log('[WIN-THE-DAY DEBUG] Current dailyPracticeData?.morningBookend:', dailyPracticeData?.morningBookend);
    
    if (!updateDailyPracticeData) {
      console.log('%c[WIN-THE-DAY DEBUG] ABORT: updateDailyPracticeData is falsy!', 'color: red; font-weight: bold;');
      return;
    }
    
    setIsSavingWIN(true);
    try {
      // Mark all as saved
      const newWins = morningWins.map(win => ({ ...win, saved: true }));
      console.log('%c[WIN-THE-DAY DEBUG] newWins after marking saved:', 'color: blue;', JSON.stringify(newWins, null, 2));
      setMorningWins(newWins);

      // === Sync to winsList for Locker History ===
      const todayDate = timeService.getNow().toLocaleDateString();
      const existingWinsList = [...winsList].filter(w => w.date !== todayDate);
      const todaysWins = newWins
        .filter(w => w.text && w.text.trim().length > 0)
        .map((w, idx) => ({
          id: `win-${todayDate}-${idx}`,
          text: w.text,
          completed: w.completed,
          date: todayDate,
          timestamp: timeService.getISOString()
        }));
      const updatedWinsList = [...existingWinsList, ...todaysWins];
      setWinsList(updatedWinsList);

      // Build the payload
      const firestorePayload = {
        morningBookend: {
            ...dailyPracticeData?.morningBookend,
            wins: newWins,
            otherTasks: otherTasks
        },
        winsList: updatedWinsList,
        date: timeService.getNow().toLocaleDateString('en-CA')
      };
      
      console.log('%c[WIN-THE-DAY DEBUG] FIRESTORE PAYLOAD being sent:', 'background: yellow; color: black; font-weight: bold;');
      console.log(JSON.stringify(firestorePayload, null, 2));

      // Update Firestore
      const result = await updateDailyPracticeData(firestorePayload);
      console.log('%c[WIN-THE-DAY DEBUG] Firestore save result:', 'color: green; font-weight: bold;', result);
      
    } catch (error) {
      console.error('%c[WIN-THE-DAY DEBUG] ERROR saving all wins:', 'color: red; font-weight: bold;', error);
    } finally {
      setIsSavingWIN(false);
      console.log('%c[WIN-THE-DAY DEBUG] handleSaveAllWins COMPLETE', 'background: #00ff00; color: black; font-weight: bold; padding: 4px 8px;');
    }
  }, [morningWins, updateDailyPracticeData, dailyPracticeData, otherTasks, winsList]);

  const handleToggleWinComplete = useCallback(async (index) => {
    if (!updateDailyPracticeData) return;

    const newWins = [...morningWins];
    newWins[index] = { ...newWins[index], completed: !newWins[index].completed };
    setMorningWins(newWins);

    // === Sync to winsList for Locker History ===
    const todayDate = timeService.getNow().toLocaleDateString();
    const existingWinsList = [...winsList].filter(w => w.date !== todayDate);
    const todaysWins = newWins
      .filter(w => w.text && w.text.trim().length > 0)
      .map((w, idx) => ({
        id: `win-${todayDate}-${idx}`,
        text: w.text,
        completed: w.completed,
        date: todayDate,
        timestamp: timeService.getISOString()
      }));
    const updatedWinsList = [...existingWinsList, ...todaysWins];
    setWinsList(updatedWinsList);

    try {
      await updateDailyPracticeData({
        morningBookend: {
            ...dailyPracticeData?.morningBookend,
            wins: newWins,
            otherTasks: otherTasks
        },
        winsList: updatedWinsList,
        date: timeService.getNow().toLocaleDateString('en-CA')
      });
    } catch (error) {
      console.error('Error toggling win:', error);
    }
  }, [morningWins, updateDailyPracticeData, dailyPracticeData, otherTasks, winsList]);

  // Legacy handler kept for compatibility but unused in new UI
  const handleSaveWIN = useCallback(async () => {
     // ...
  }, []);
  // NEW: Handle saving Scorecard separately
  const [isSavingScorecard, setIsSavingScorecard] = useState(false);

  const handleSaveScorecard = useCallback(async () => {
    if (!updateDailyPracticeData) return;
    
    setIsSavingScorecard(true);
    try {
      const todayDate = timeService.getNow().toLocaleDateString();
      // Calculate combined score: total done / total possible
      const totalDone = scorecard.reps.done + scorecard.win.done;
      const totalPossible = scorecard.reps.total + scorecard.win.total;
      const currentScore = `${totalDone}/${totalPossible}`;
      
      // Get existing history or init empty
      const existingHistory = dailyPracticeData?.scorecardHistory || [];
      // Remove today's entry if exists to overwrite
      const historyWithoutToday = existingHistory.filter(h => h.date !== todayDate);
      
      const newHistoryEntry = {
          date: todayDate,
          score: currentScore,
          repsScore: `${scorecard.reps.done}/${scorecard.reps.total}`,
          winsScore: `${scorecard.win.done}/${scorecard.win.total}`,
          timestamp: timeService.getISOString()
      };
      
      const updatedHistory = [...historyWithoutToday, newHistoryEntry];

      await updateDailyPracticeData({
        scorecardHistory: updatedHistory,
        date: timeService.getNow().toLocaleDateString('en-CA') // Ensure date is updated
      });
      
      alert('✅ Scorecard saved to Locker!');
    } catch (error) {
      console.error('Error saving scorecard:', error);
      alert('Error saving scorecard. Please try again.');
    } finally {
      setIsSavingScorecard(false);
    }
  }, [scorecard, dailyPracticeData, updateDailyPracticeData]);


  // Legacy compatibility
  const morningWIN = morningWins[0]?.text || '';
  const setMorningWIN = (val) => {
      const newWins = [...morningWins];
      if (!newWins[0]) newWins[0] = { id: 'win-1', text: '', completed: false };
      newWins[0] = { ...newWins[0], text: val };
      setMorningWins(newWins);
  };

  // NEW: Save Reps Handler
  const handleSaveReps = useCallback(async () => {
    // Since reps save on toggle, this is a confirmation action
    // We could force a save here if needed, but for now just confirm
    if (updateDailyPracticeData) {
       setIsSavingReps(true);
       // Force a re-save of current commitments to be safe
       try {
           // Create history entry
           const todayDate = timeService.getNow().toLocaleDateString();
           const completedReps = additionalCommitments.filter(c => c.status === 'Committed');
           const historyEntry = {
               date: todayDate,
               completedCount: completedReps.length,
               totalCount: additionalCommitments.length,
               items: completedReps.map(r => ({ id: r.id, text: r.text || r.label })),
               timestamp: timeService.getISOString()
           };
           
           // Update history
           const existingHistory = dailyPracticeData?.repsHistory || [];
           const historyWithoutToday = existingHistory.filter(h => h.date !== todayDate);
           const updatedHistory = [...historyWithoutToday, historyEntry];

           await updateDailyPracticeData({
               active_commitments: additionalCommitments,
               repsHistory: updatedHistory, // Save history
               date: timeService.getNow().toLocaleDateString('en-CA') // Ensure date is updated
           });
           // Removed alert, UI should handle success state via isSavingReps
       } catch (e) {
           console.error(e);
           alert('Error saving reps.');
       } finally {
           setIsSavingReps(false);
       }
    }
  }, [updateDailyPracticeData, additionalCommitments, dailyPracticeData]);

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

    // Bookends - Morning
    morningWIN, // Legacy
    setMorningWIN, // Legacy
    morningWins, // New Array
    setMorningWins, // New Array
    handleUpdateWin,
    handleSaveSingleWin,
    handleSaveAllWins,
    handleToggleWinComplete,
    handleSaveMorningBookend, // Exposed
    
    amCompletedAt, // Exposed
    amWinCompleted, // Exposed
    amTasksCompleted, // Exposed

    otherTasks,
    handleAddTask,
    handleToggleTask,
    handleUpdateTask,
    handleRemoveTask,
    
    showLIS,
    setShowLIS,
    
    // Bookends - Evening
    reflectionGood,
    setReflectionGood,
    reflectionBetter,
    setReflectionBetter,
    reflectionBest,
    setReflectionBest,
    handleSaveEveningBookend,
    isSavingBookend,
    
    winsList,
    handleDeleteWin,
    
    // Habits
    habitsCompleted,
    handleHabitToggle,

    // Scorecard
    scorecard,
    handleSaveScorecard,
    isSavingScorecard,

    // Streak
    streakCount,
    streakCoins,
    
    // Additional Reps
    additionalCommitments,
    handleToggleAdditionalRep,
    handleSaveReps,
    isSavingReps,
    repsHistory, // New
    
    // Legacy / Deprecated but kept for safety
    handleToggleWIN,
    handleSaveWIN,
    isSavingWIN
  };
};
/* =========================================================
   ADAPTER HOOK FOR ATOMIC DASHBOARD
   Maps legacy useDashboard logic to the new data structure
========================================================= */
export const useDashboardData = (user) => {
  const { dailyPracticeData, updateDailyPracticeData, globalMetadata, isLoading } = useAppServices();
  
  // Use the existing logic hook
  const dashboard = useDashboard({
    dailyPracticeData,
    updateDailyPracticeData,
    globalMetadata
  });

  // Map to new structure
  const dashboardData = {
    morningMindset: {
      focus: dashboard.morningWIN,
      gratitude: '', 
      completed: !!dashboard.amCompletedAt
    },
    dailyReps: {
      reps: dashboard.additionalCommitments.map(c => ({
        id: c.id,
        text: c.text,
        completed: c.status === 'Committed'
      })),
      completed: dashboard.scorecard.reps.pct === 100
    },
    eveningReflection: {
      wins: dashboard.reflectionGood,
      lessons: dashboard.reflectionBetter,
      plannedTomorrow: !!dashboard.reflectionBest,
      completed: !!dashboard.habitsCompleted?.eveningReflection
    },
    anchors: {
      identity: dashboard.identityStatement,
      habit: dashboard.habitAnchor,
      why: dashboard.whyStatement
    },
    streak: {
      count: dashboard.streakCount,
      coins: dashboard.streakCoins
    }
  };

  const updateDashboardData = async (section, data) => {
    if (section === 'morningMindset') {
      dashboard.setMorningWIN(data.focus);
    } else if (section === 'eveningReflection') {
      dashboard.setReflectionGood(data.wins);
      dashboard.setReflectionBetter(data.lessons);
    } else if (section === 'anchors') {
      if (data.identity !== undefined) dashboard.handleSaveIdentity(data.identity);
      if (data.habit !== undefined) dashboard.handleSaveHabit(data.habit);
      if (data.why !== undefined) dashboard.handleSaveWhy(data.why);
    } else if (section === 'dailyReps') {
       const newReps = data.reps;
       const oldReps = dashboardData.dailyReps.reps;
       
       for (let i = 0; i < newReps.length; i++) {
           const newRep = newReps[i];
           const oldRep = oldReps.find(r => r.id === newRep.id);
           if (oldRep && oldRep.completed !== newRep.completed) {
               dashboard.handleToggleAdditionalRep(newRep.id, oldRep.completed ? 'Committed' : 'Pending');
           }
       }
    } else if (section === 'save') {
        if (data === 'morning') {
            dashboard.handleSaveMorningBookend();
        } else if (data === 'evening') {
            dashboard.handleSaveEveningBookend();
        }
    }
  };

  return {
    loading: isLoading,
    dashboardData,
    updateDashboardData,
    refreshData: () => {}
  };
};
