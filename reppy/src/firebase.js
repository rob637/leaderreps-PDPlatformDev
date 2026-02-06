// Firebase configuration for Reppy standalone app
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';

// Parse config from environment variable or use defaults
const parseConfig = () => {
  const configString = import.meta.env.VITE_FIREBASE_CONFIG;
  if (configString) {
    try {
      return JSON.parse(configString);
    } catch (e) {
      console.error('Failed to parse VITE_FIREBASE_CONFIG:', e);
    }
  }
  
  // Fallback to individual env vars
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
};

const firebaseConfig = parseConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// Initialize Analytics (only in browser environment)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    // Analytics may fail in some environments (e.g., ad blockers)
    console.warn('Analytics initialization failed:', e.message);
  }
}
export { analytics };

// Helper to log events safely
export const logEvent = (eventName, params = {}) => {
  if (analytics) {
    try {
      firebaseLogEvent(analytics, eventName, params);
    } catch (e) {
      // Silently fail if analytics is blocked
    }
  }
};

export default app;
