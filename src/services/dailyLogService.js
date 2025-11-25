import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';

/**
 * Service to handle Daily Log operations (The Arena Dashboard)
 */
export const dailyLogService = {
  
  /**
   * Get the document ID for a specific date (YYYY-MM-DD)
   * Uses local time to ensure the "day" matches the user's perspective
   */
  getDateId: (date = new Date()) => {
    // Use Sweden/Canada format (YYYY-MM-DD) which is standard for sorting
    return date.toLocaleDateString('en-CA');
  },

  /**
   * Subscribe to a specific day's log for a user
   */
  subscribeToDailyLog: (db, userId, dateId, callback) => {
    if (!userId) return () => {};
    
    const docRef = doc(db, 'users', userId, 'daily_logs', dateId);
    
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        // Return default empty state if doc doesn't exist yet
        callback(null);
      }
    });
  },

  /**
   * Initialize or Update a daily log
   */
  saveDailyLog: async (db, userId, dateId, data) => {
    if (!userId) throw new Error('User ID required');
    
    const docRef = doc(db, 'users', userId, 'daily_logs', dateId);
    const docSnap = await getDoc(docRef);

    const payload = {
      ...data,
      lastUpdated: serverTimestamp()
    };

    if (docSnap.exists()) {
      await updateDoc(docRef, payload);
    } else {
      await setDoc(docRef, {
        createdAt: serverTimestamp(),
        ...payload
      });
    }
    return true;
  },

  /**
   * Add a WIN item (What's Important Now)
   */
  addWinItem: async (db, userId, dateId, text, type = 'win') => {
    const docRef = doc(db, 'users', userId, 'daily_logs', dateId);
    const docSnap = await getDoc(docRef);
    
    const newItem = {
      id: Date.now().toString(),
      text,
      completed: false,
      type // 'win' or 'priority'
    };

    if (docSnap.exists()) {
      const currentWins = docSnap.data().wins || [];
      await updateDoc(docRef, {
        wins: [...currentWins, newItem],
        lastUpdated: serverTimestamp()
      });
    } else {
      await setDoc(docRef, {
        createdAt: serverTimestamp(),
        wins: [newItem],
        lastUpdated: serverTimestamp()
      });
    }
  },

  /**
   * Toggle a WIN item completion status
   */
  toggleWinItem: async (db, userId, dateId, itemId) => {
    const docRef = doc(db, 'users', userId, 'daily_logs', dateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedWins = (data.wins || []).map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      );
      
      await updateDoc(docRef, {
        wins: updatedWins,
        lastUpdated: serverTimestamp()
      });
    }
  },

  /**
   * Delete a WIN item
   */
  deleteWinItem: async (db, userId, dateId, itemId) => {
    const docRef = doc(db, 'users', userId, 'daily_logs', dateId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedWins = (data.wins || []).filter(item => item.id !== itemId);
      
      await updateDoc(docRef, {
        wins: updatedWins,
        lastUpdated: serverTimestamp()
      });
    }
  },

  /**
   * Commits the current `daily_practice` data to a permanent daily log.
   * This should be run at the end of the day.
   */
  commitEndOfDay: async (db, userId) => {
    if (!userId) throw new Error('User ID required');

    const dateId = dailyLogService.getDateId();
    const dailyPracticeRef = doc(db, 'users', userId, 'daily_practice', 'current');
    const dailyLogRef = doc(db, 'users', userId, 'daily_logs', dateId);

    try {
      const dailyPracticeSnap = await getDoc(dailyPracticeRef);
      if (!dailyPracticeSnap.exists()) {
        console.log('No daily practice data to commit.');
        return;
      }

      const practiceData = dailyPracticeSnap.data();

      // Merge with existing log data if any
      const existingLogSnap = await getDoc(dailyLogRef);
      const existingData = existingLogSnap.exists() ? existingLogSnap.data() : {};

      const commitData = {
        ...existingData,
        ...practiceData,
        committedAt: serverTimestamp(),
      };

      await setDoc(dailyLogRef, commitData, { merge: true });
      console.log(`Successfully committed end-of-day log for ${dateId}`);

      // Optional: Reset daily_practice document for the new day
      // await setDoc(dailyPracticeRef, { lastReset: serverTimestamp() });

    } catch (error) {
      console.error('Error committing end-of-day log:', error);
    }
  },

  /**
   * Get reflection history (last 7 days with reflections)
   */
  getReflectionHistory: async (db, userId, limitCount = 7) => {
    if (!userId) return [];
    
    try {
      const logsRef = collection(db, 'users', userId, 'daily_logs');
      const q = query(
        logsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const history = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only include if there is at least one reflection field
        if (data.reflectionGood || data.reflectionWork || data.reflectionTomorrow) {
          history.push({
            id: doc.id, // dateId
            date: doc.id,
            ...data
          });
        }
      });
      
      return history;
    } catch (error) {
      console.error("Error fetching reflection history:", error);
      return [];
    }
  }
};
