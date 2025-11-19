import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp 
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
  }
};
