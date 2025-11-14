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

  // Prevent browser back/forward navigation from leaving the app
  useEffect(() => {
    // Push a dummy state to create history entry
    window.history.pushState(null, '', window.location.href);
    
    const handlePopState = (e) => {
      // Prevent navigation and stay in the app
      window.history.pushState(null, '', window.location.href);
      console.log('[App] Blocked browser back/forward navigation');
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

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