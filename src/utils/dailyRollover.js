import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Checks if the daily practice data belongs to a previous day and performs a rollover if needed.
 * 
 * Rollover Logic:
 * 1. Archive current data to `users/{userId}/daily_logs/{lastDate}`.
 * 2. Carry over uncompleted Wins (Win the Day).
 * 3. Carry over uncompleted Reps (Daily Reps).
 * 4. Clear completed items, reflections, and daily counters.
 * 5. Update `daily_practice/current` with the new date.
 * 
 * @param {Object} db - Firestore instance
 * @param {string} userId - User ID
 * @param {Object} currentData - The current daily_practice data
 */
export const checkAndPerformRollover = async (db, userId, currentData) => {
  if (!db || !userId || !currentData) return;

  // 1. Determine Dates
  // Use local date for "Today" to match user's perspective
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  
  // Get the date of the data. Fallback to lastUpdated or today if missing (to prevent loop on fresh doc)
  let dataDate = currentData.date;
  if (!dataDate && currentData.lastUpdated) {
    dataDate = currentData.lastUpdated.split('T')[0];
  }
  
  // If no date info found, assume it's fresh or we shouldn't touch it yet. 
  // But if it has data and no date, we might want to stamp it. 
  // For now, if dataDate is missing, we set it to today to start tracking.
  if (!dataDate) {
    console.log('[Rollover] No date found on data. Stamping with today.');
    const currentRef = doc(db, 'users', userId, 'daily_practice', 'current');
    await setDoc(currentRef, { ...currentData, date: today }, { merge: true });
    return;
  }

  // If dates match, we are good.
  if (dataDate === today) return;

  console.log(`[Rollover] Rollover needed. Data Date: ${dataDate}, Today: ${today}`);

  // 2. Archive Old Data (Locker)
  const archiveRef = doc(db, 'users', userId, 'daily_logs', dataDate);
  
  // Save the snapshot of yesterday's data
  await setDoc(archiveRef, {
    ...currentData,
    archivedAt: serverTimestamp(),
    rolloverSource: 'lazy-client'
  }, { merge: true });

  // 3. Calculate Carry-Over
  
  // Wins: Keep uncompleted
  const currentWins = currentData.morningBookend?.wins || [];
  const carriedWins = currentWins.filter(w => !w.completed && w.text && w.text.trim().length > 0).map(w => ({
    ...w,
    completed: false, // Ensure they are not completed
    saved: true // Keep them as saved tasks
  }));
  
  // Reps: Keep uncommitted (Pending)
  // active_commitments structure: { id, status: 'Committed'|'Pending', text }
  const currentReps = currentData.active_commitments || [];
  const carriedReps = currentReps.filter(r => r.status !== 'Committed');

  // 4. Prepare New State
  // We keep settings (anchors, etc) but reset daily progress
  const newState = {
    ...currentData,
    date: today,
    lastUpdated: new Date().toISOString(),
    
    // Reset Morning Bookend
    morningBookend: {
      ...currentData.morningBookend,
      // Wins: Carried over + empty slots to make 3
      wins: [
        ...carriedWins,
        ...Array(3).fill(null)
      ].slice(0, 3).map((w, i) => w || { 
          id: `win-${Date.now()}-${i}`, 
          text: '', 
          completed: false, 
          saved: false 
      }),
      winCompleted: false,
      completedAt: null,
      otherTasks: [] // Clear other tasks as requested ("Win the Day and Daily Reps" implied main ones)
    },

    // Reset Reps
    active_commitments: carriedReps,
    dailyTargetRepStatus: 'Pending', // Reset target rep status
    
    // Reset Evening Bookend (Reflections)
    eveningBookend: {
      good: '',
      better: '',
      best: '',
      habits: {},
      completedAt: null
    },
    
    // Reset Scorecard History? No, history is history. 
    // But we might want to reset the *current* scorecard display if it's stored in the doc.
    // The scorecard is usually calculated on the fly in hooks, but if stored:
    scorecard: { reps: { done: 0, total: 0, pct: 0 }, win: { done: 0, total: 0, pct: 0 } },
    
    // Reset Streak? 
    // If they missed yesterday, streak might break. 
    // But simple rollover just preserves the count. Streak calculation logic handles the break.
    // We leave streakCount as is.
  };

  // 5. Update Current Document
  const currentRef = doc(db, 'users', userId, 'daily_practice', 'current');
  
  // We use setDoc to overwrite/update. 
  // Note: We are updating the *same* document to be "Today".
  await setDoc(currentRef, newState);
  
  console.log('[Rollover] Rollover complete. Welcome to the new day.');
};
