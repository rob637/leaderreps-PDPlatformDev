import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { dataUrlToBlob } from '../lib/captureScreenshot.js';

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
   * @param {Object} userInfo - User's email and displayName for follow-up
   * @returns {Promise<string>} The ID of the created report
   */
  submitReport: async (db, userId, reportData, systemInfo, userInfo = {}) => {
    if (!db) throw new Error('Firestore instance is required');
    
    try {
      // Upload screenshot FIRST so the URL is present when the doc is
      // created. The Cloud Function trigger (`onBugReportCreated`) fires
      // on document creation and sends the email immediately, so anything
      // added via a follow-up updateDoc would miss that email.
      let screenshotUrl = null;
      let screenshotPath = null;
      if (reportData.screenshotDataUrl) {
        try {
          const blob = dataUrlToBlob(reportData.screenshotDataUrl);
          if (blob) {
            const storage = getStorage();
            // Random ID keeps each report's screenshot at a unique path.
            const fileId =
              (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
            screenshotPath = `bug-reports/${fileId}/screenshot.jpg`;
            const storageRef = ref(storage, screenshotPath);
            await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
            screenshotUrl = await getDownloadURL(storageRef);
          }
        } catch (uploadErr) {
          console.warn('Bug report screenshot upload failed:', uploadErr);
          // Continue without the screenshot — never block the report itself.
        }
      }

      const report = {
        userId,
        // Store user info for follow-up capability
        userEmail: userInfo.email || null,
        userDisplayName: userInfo.displayName || null,
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
        screenshotUrl,
        screenshotPath,
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
