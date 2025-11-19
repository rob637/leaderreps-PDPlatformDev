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
   */
  getDateId: (date = new Date()) => {
    return date.toISOString().split('T')[0];
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
