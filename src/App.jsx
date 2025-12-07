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
import { getStorage } from 'firebase/storage';

// --- UI/UX & Icons ---
import { Loader } from 'lucide-react';

// --- Custom Hooks ---
import useNavigationHistory from './hooks/useNavigationHistory.js';

// --- New Structure ---
import AuthPanel from './components/auth/AuthPanel.jsx';
import AppContent from './components/layout/AppContent.jsx';
import DataProvider from './providers/DataProvider.jsx';
import { FeatureProvider } from './providers/FeatureProvider.jsx';
import { LayoutProvider } from './providers/LayoutProvider.jsx';
import ConfigError from './components/system/ConfigError.jsx';
import UpdateNotification from './components/ui/UpdateNotification.jsx';
import { NotificationProvider } from './providers/NotificationProvider.jsx';
import { TimeProvider } from './providers/TimeProvider.jsx';
import { AccessControlProvider } from './providers/AccessControlProvider.jsx';

/* =========================================================
   MAIN APP COMPONENT
========================================================= */
function App() {
  const [firebaseConfig, setFirebaseConfig] = useState(null);
  const [firebaseServices, setFirebaseServices] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(() => {
    // Restore last screen from localStorage or default to 'dashboard'
    return localStorage.getItem('lastScreen') || 'dashboard';
  });
  const [navParams, setNavParams] = useState(() => {
    try {
      const savedParams = localStorage.getItem('lastNavParams');
      return savedParams ? JSON.parse(savedParams) : {};
    } catch (e) {
      return {};
    }
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Navigation history manager for browser back/forward buttons
  const {
    pushNavigationState,
    getCurrentState,
    goBack,
    canGoBack,
    clearHistory
  } = useNavigationHistory();

  useEffect(() => {
    const config = typeof window.__FIREBASE_CONFIG__ !== 'undefined' ? window.__FIREBASE_CONFIG__ : undefined;
    if (config) {
      setFirebaseConfig(config);
      const app = initializeApp(config);
      const auth = getAuth(app);
      const db = getFirestore(app);
      const storage = getStorage(app);
      setLogLevel('error');
      setFirebaseServices({ app, auth, db, storage });
    }
  }, []);

  useEffect(() => {
    if (!firebaseServices) return;
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (user) {
        // Pass full user object to save profile data (email, displayName, etc.)
        ensureUserDocs(firebaseServices.db, user);
      }
    });
    return () => unsubscribe();
  }, [firebaseServices]);

  const navigate = useCallback((screen, params = {}) => {
    console.log('🧭 [App.jsx] Navigate called:', { from: currentScreen, to: screen, params });
    setCurrentScreen(screen);
    setNavParams(params);
    
    // Persist navigation state
    localStorage.setItem('lastScreen', screen);
    localStorage.setItem('lastNavParams', JSON.stringify(params));
    
    // Push to navigation history for browser back/forward support
    pushNavigationState({ screen, params });
  }, [pushNavigationState, currentScreen]);

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
    <>
      <TimeProvider>
        <DataProvider
          firebaseServices={firebaseServices}
          userId={user?.uid}
          isAuthReady={isAuthReady}
          navigate={navigate}
          user={user}
        >
          <FeatureProvider db={firebaseServices?.db}>
            <LayoutProvider>
              <AccessControlProvider>
                <NotificationProvider>
                  {isAuthRequired ? (
                    <AuthPanel 
                      auth={firebaseServices.auth} 
                      onSuccess={() => navigate('dashboard')} 
                    />
                  ) : (
                    <AppContent
                      currentScreen={currentScreen}
                      user={user}
                      navParams={navParams}
                      isMobileOpen={isMobileOpen}
                      setIsMobileOpen={setIsMobileOpen}
                      isAuthRequired={isAuthRequired}
                      auth={firebaseServices.auth}
                      goBack={goBack}
                      canGoBack={canGoBack}
                    />
                  )}
                </NotificationProvider>
              </AccessControlProvider>
            </LayoutProvider>
          </FeatureProvider>
        </DataProvider>
      </TimeProvider>
      
      {/* PWA Update Notification */}
      <UpdateNotification />
    </>
  );
}

export default App;