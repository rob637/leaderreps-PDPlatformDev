// src/App.jsx

import React, { useState, useEffect, useCallback, Suspense } from 'react';

// --- Core Services & Context ---
import {
  ensureUserDocs,
} from './services/ensureUserDocs.js';

// --- Firebase Imports (Authentication & Firestore) ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  setLogLevel,
} from 'firebase/firestore';

// --- UI/UX & Icons ---
import { Loader } from 'lucide-react';

// --- New Structure ---
import AuthPanel from './components/auth/AuthPanel.jsx';
import AppContent from './components/layout/AppContent.jsx';
import DataProvider from './providers/DataProvider.jsx';
import ConfigError from './components/system/ConfigError.jsx';


/* =========================================================
   MAIN APP COMPONENT
========================================================= */
function App() {
  const [firebaseConfig, setFirebaseConfig] = useState(null);
  const [firebaseServices, setFirebaseServices] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [navParams, setNavParams] = useState({});
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const config = typeof window.__FIREBASE_CONFIG__ !== 'undefined' ? window.__FIREBASE_CONFIG__ : undefined;
    if (config) {
      setFirebaseConfig(config);
      const app = initializeApp(config);
      const auth = getAuth(app);
      const db = getFirestore(app);
      setLogLevel('error');
      setFirebaseServices({ app, auth, db });
    }
  }, []);

  useEffect(() => {
    if (!firebaseServices) return;
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (user) {
        ensureUserDocs(firebaseServices.db, user.uid);
      }
    });
    return () => unsubscribe();
  }, [firebaseServices]);

  const navigate = useCallback((screen, params = {}) => {
    setCurrentScreen(screen);
    setNavParams(params);
  }, []);

  const isAuthRequired = !user && isAuthReady;

  if (!firebaseConfig) {
    return <ConfigError message="Firebase configuration is missing." />;
  }

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-10 w-10 text-corporate-teal" />
      </div>
    );
  }

  return (
    <DataProvider
      firebaseServices={firebaseServices}
      userId={user?.uid}
      isAuthReady={isAuthReady}
      navigate={navigate}
      user={user}
    >
      {isAuthRequired ? (
        <AuthPanel auth={firebaseServices.auth} onSuccess={() => {}} />
      ) : (
        <AppContent
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          user={user}
          navParams={navParams}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isAuthRequired={isAuthRequired}
          isNavExpanded={isNavExpanded}
          setIsNavExpanded={setIsNavExpanded}
          auth={firebaseServices.auth}
        />
      )}
    </DataProvider>
  );
}

export default App;