import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export function safeInitFirebase() {
  const missing = Object.entries(cfg).filter(([,v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.warn('Firebase config missing:', missing);
    return null; // Do not crash—UI will show a message.
  }
  const app = getApps()[0] || initializeApp(cfg);
  return { app, auth: getAuth(app), db: getFirestore(app) };
}
