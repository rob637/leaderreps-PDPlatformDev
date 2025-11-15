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

// --- Custom Hooks ---
import useNavigationHistory from './hooks/useNavigationHistory.js';

// --- New Structure ---
import NavigationProvider from './providers/NavigationProvider.jsx';
import AuthPanel from './components/auth/AuthPanel.jsx';
import AppContent from './components/layout/AppContent.jsx';
import DataProvider from './providers/DataProvider.jsx';
import ConfigError from './components/system/ConfigError.jsx';

// 🔍 DEBUG: Log all imports to verify they're defined
console.log('🔍 [App.jsx] Import checks:');
console.log('  - AuthPanel:', typeof AuthPanel, AuthPanel);
console.log('  - AppContent:', typeof AppContent, AppContent);
console.log('  - DataProvider:', typeof DataProvider, DataProvider);
console.log('  - ConfigError:', typeof ConfigError, ConfigError);

// 🔍 DEBUG: Verify imports are not undefined
if (typeof AuthPanel === 'undefined') {
  console.error('❌ [App.jsx] AuthPanel is UNDEFINED!');
}
if (typeof AppContent === 'undefined') {
  console.error('❌ [App.jsx] AppContent is UNDEFINED!');
}
if (typeof DataProvider === 'undefined') {
  console.error('❌ [App.jsx] DataProvider is UNDEFINED!');
}
if (typeof ConfigError === 'undefined') {
  console.error('❌ [App.jsx] ConfigError is UNDEFINED!');
}


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
  
  // Debug logging for screen changes
  useEffect(() => {
    console.log('[App.jsx] currentScreen changed to:', currentScreen);
    // Only show alert in developer mode
    const isDeveloperMode = localStorage.getItem('arena-developer-mode') === 'true';
    if (isDeveloperMode) {
      alert(`🔥 SCREEN CHANGE: ${currentScreen}`);
    }
  }, [currentScreen]);
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Navigation history manager for browser back/forward buttons
  const {
    pushNavigationState,
    getCurrentState,
    goBack,
    canGoBack,
    clearHistory
  } = useNavigationHistory();

  // Handle navigation state changes
  useEffect(() => {
    const currentState = getCurrentState();
    if (currentState) {
      console.log('[App] Restoring navigation state:', currentState);
      setCurrentScreen(currentState.screen || 'dashboard');
      setNavParams(currentState.params || {});
    }
  }, [getCurrentState]);

  // Clear history on user change
  useEffect(() => {
    if (user) {
      clearHistory();
      // Push initial dashboard state
      pushNavigationState({ screen: 'dashboard', params: {} });
    }
  }, [user?.uid, clearHistory, pushNavigationState]);

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
    console.log('[App] Navigating to:', screen, params);
    setCurrentScreen(screen);
    setNavParams(params);
    
    // Push to navigation history for browser back/forward support
    pushNavigationState({ screen, params });
  }, [pushNavigationState]);

  const isAuthRequired = !user && isAuthReady;

  console.log('🔍 [App.jsx] Render state:', {
    firebaseConfig: !!firebaseConfig,
    isAuthReady,
    user: !!user,
    isAuthRequired
  });

  if (!firebaseConfig) {
    console.log('🔍 [App.jsx] Rendering ConfigError');
    if (typeof ConfigError === 'undefined') {
      console.error('❌ [App.jsx] ConfigError is UNDEFINED at render time!');
      return <div>Error: ConfigError component is undefined</div>;
    }
    return <ConfigError message="Firebase configuration is missing." />;
  }

  if (!isAuthReady) {
    console.log('🔍 [App.jsx] Rendering loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-10 w-10 text-corporate-teal" />
      </div>
    );
  }

  console.log('🔍 [App.jsx] About to render main app');
  console.log('🔍 [App.jsx] Pre-render component checks:');
  console.log('  - DataProvider:', typeof DataProvider);
  console.log('  - AuthPanel:', typeof AuthPanel);
  console.log('  - AppContent:', typeof AppContent);

  if (typeof DataProvider === 'undefined') {
    console.error('❌ [App.jsx] DataProvider is UNDEFINED at render time!');
    return <div>Error: DataProvider component is undefined</div>;
  }

  if (isAuthRequired && typeof AuthPanel === 'undefined') {
    console.error('❌ [App.jsx] AuthPanel is UNDEFINED at render time!');
    return <div>Error: AuthPanel component is undefined</div>;
  }

  if (!isAuthRequired && typeof AppContent === 'undefined') {
    console.error('❌ [App.jsx] AppContent is UNDEFINED at render time!');
    return <div>Error: AppContent component is undefined</div>;
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
        <NavigationProvider
          navigate={navigate}
          canGoBack={canGoBack}
          goBack={goBack}
          currentScreen={currentScreen}
          navParams={navParams}
        >
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
        </NavigationProvider>
      )}
    </DataProvider>
  );
}

export default App;