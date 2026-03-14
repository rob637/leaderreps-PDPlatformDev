import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';

/**
 * Service for handling bug reports.
 * Stores reports in the 'bug_reports' collection.
 */
const bugReportService = {
  /**
   * Submit a new bug report.
   * @param {Object} db - Firestore database instance
   * @param {string} userId - ID of the user submitting the report
   * @param {Object} reportData - The report details (description, steps, etc.)
   * @param {Object} systemInfo - Automatically captured system info
   * @returns {Promise<string>} The ID of the created report
   */
  submitReport: async (db, userId, reportData, systemInfo) => {
    if (!db) throw new Error('Firestore instance is required');
    
    try {
      const report = {
        userId,
        description: reportData.description,
        steps: reportData.steps || '',
        severity: reportData.severity || 'low',
        category: reportData.category || 'bug',
        status: 'new', // new, reviewed, resolved, wontfix
        systemInfo: {
          ...systemInfo,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          url: window.location.href,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'bug_reports'), report);
      return docRef.id;
    } catch (error) {
      console.error('Error submitting bug report:', error);
      throw error;
    }
  },

  /**
   * Get recent bug reports for a user (optional, for history view).
   */
  getUserReports: async (db, userId, limitCount = 10) => {
    if (!db || !userId) return [];
    try {
      const q = query(
        collection(db, 'bug_reports'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return [];
    }
  }
};

export default bugReportService;
