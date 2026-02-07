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
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  setLogLevel,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

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
import { ThemeProvider } from './providers/ThemeProvider.jsx';

// --- Mobile Experience Enhancements ---
import { OfflineProvider } from './components/offline/useOffline.jsx';
import { OfflineBanner } from './components/offline';
import LiveRegion from './components/accessibility/LiveRegion.jsx';
import SkipLinks from './components/accessibility/SkipLinks.jsx';

/* =========================================================
   MAIN APP COMPONENT
========================================================= */

// Admin-only screens that shouldn't be restored for regular users
const ADMIN_ONLY_SCREENS = [
  'admin-portal', 'admin-functions', 'admin-data-maintenance', 
  'admin-content-home', 'admin-content-manager', 'admin-wrapper-document',
  'admin-wrapper-video', 'admin-wrapper-course', 'admin-wrapper-readrep',
  'admin-wrapper-book', 'admin-wrapper-interactive', 'test-center'
];

function App() {
  const [firebaseConfig, setFirebaseConfig] = useState(null);
  const [firebaseServices, setFirebaseServices] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState(() => {
    // Restore last screen from localStorage or default to 'dashboard'
    const savedScreen = localStorage.getItem('lastScreen') || 'dashboard';
    // Don't restore admin screens on initial load - user may have changed
    // Admin screens will be properly navigated to if user is admin
    if (ADMIN_ONLY_SCREENS.includes(savedScreen)) {
      localStorage.removeItem('lastScreen');
      return 'dashboard';
    }
    return savedScreen;
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
    goBack,
    canGoBack
  } = useNavigationHistory();

  useEffect(() => {
    const config = typeof window.__FIREBASE_CONFIG__ !== 'undefined' ? window.__FIREBASE_CONFIG__ : undefined;
    if (config) {
      setFirebaseConfig(config);
      const app = initializeApp(config);
      const auth = getAuth(app);
      const db = getFirestore(app);
      const storage = getStorage(app);
      const functions = getFunctions(app, 'us-central1');
      setLogLevel('error');
      setFirebaseServices({ app, auth, db, storage, functions });
    }
  }, []);

  // Track previous user to detect user changes
  const prevUserUidRef = React.useRef(null);

  useEffect(() => {
    if (!firebaseServices) return;
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      // Check for invitation link
      const params = new URLSearchParams(window.location.search);
      const inviteToken = params.get('token') || params.get('invite');

      if (user && inviteToken) {
        // If user follows an invite link while logged in, sign them out
        // so they can accept the invite correctly via AuthPanel.
        console.log("🔒 User logged in but Invite Access detected. Signing out...");
        
        // Save the token to sessionStorage so AuthPanel can retrieve it after signout
        sessionStorage.setItem('pendingInviteToken', inviteToken);
        
        // Clear the token from URL to prevent infinite loop
        window.history.replaceState({}, document.title, window.location.pathname);
        
        signOut(firebaseServices.auth).then(() => {
          setUser(null);
          setIsAuthReady(true);
        });
        return;
      }

      // Detect user change (new login or different user)
      // Reset to dashboard if we're on an admin screen - new user may not be admin
      const previousUid = prevUserUidRef.current;
      const currentUid = user?.uid || null;
      if (currentUid && currentUid !== previousUid) {
        // User changed - check if we need to reset screen
        setCurrentScreen(prev => {
          if (ADMIN_ONLY_SCREENS.includes(prev)) {
            console.log('🔒 User changed, resetting from admin screen to dashboard');
            localStorage.removeItem('lastScreen');
            return 'dashboard';
          }
          return prev;
        });
      }
      prevUserUidRef.current = currentUid;

      setUser(user);
      setIsAuthReady(true);
      if (user) {
        // Small delay to allow AuthPanel to finish writing cohortId for new users
        // This prevents a race condition where ensureUserDocs creates profile before
        // AuthPanel has a chance to write the cohortId from the invite
        setTimeout(() => {
          ensureUserDocs(firebaseServices.db, user);
        }, 500);
      }
    });
    return () => unsubscribe();
  }, [firebaseServices]);

  const navigate = useCallback((screen, params = {}) => {
    console.log('🧭 [App.jsx] Navigate called:', { from: currentScreen, to: screen, params });
    setCurrentScreen(screen);
    setNavParams(params);
    
    // Scroll to top on navigation
    window.scrollTo(0, 0);
    
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
      {/* Accessibility: Skip Links for keyboard users */}
      <SkipLinks 
        links={[
          { id: 'main-content', label: 'Skip to main content' },
          { id: 'main-nav', label: 'Skip to navigation' },
        ]} 
      />
      
      {/* Accessibility: Live region for screen reader announcements */}
      <LiveRegion />
      
      <ThemeProvider>
      <TimeProvider>
        <OfflineProvider>
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
                    {/* Offline Banner - shows when connection is lost */}
                    <OfflineBanner position="top" />
                    
                    {isAuthRequired ? (
                      <AuthPanel 
                        auth={firebaseServices.auth} 
                        db={firebaseServices.db}
                        functions={firebaseServices.functions}
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
        </OfflineProvider>
      </TimeProvider>
      </ThemeProvider>
      
      {/* PWA Update Notification */}
      <UpdateNotification />
    </>
  );
}

export default App;