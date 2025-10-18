// src/App.jsx
import React, {
  useState, useEffect, useMemo, useCallback, createContext, useContext
} from 'react';

import { initializeApp, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// Project data & hooks
import {
  allBooks, SECRET_SIGNUP_CODE, IconMap, LEADERSHIP_TIERS, PDP_COLLECTION, PDP_DOCUMENT
} from './data/Constants';
import { usePDPData, useCommitmentData, usePlanningData } from './firebase/Hooks';

// ✅ ApiHelpers with explicit .js extension for Netlify/Linux
import { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY } from './utils/ApiHelpers.js';

// Screens
import DashboardScreen, { QuickStartScreen, AppSettingsScreen } from './components/screens/Dashboard';
import ProfDevPlanScreen from './components/screens/DevPlan';
import Labs from './components/screens/Labs';
import NavSidebar from './components/shared/UI';

// ✅ Add these if your router references them (adjust paths if your files differ)
import DailyPracticeScreen from './components/screens/DailyPractice.jsx';
import PlanningHubScreen from './components/screens/PlanningHub.jsx';
import BusinessReadingsScreen from './components/screens/BusinessReadings.jsx';

// Alias Labs to legacy name (used in router)
const CoachingLabScreen = Labs;

// --- CONTEXT AND API CONFIG ---
const AppServiceContext = createContext(null);
export const useAppServices = () => useContext(AppServiceContext);

// Global App ID (Used for Firestore pathing)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- DEBUG MODE FLAG ---
// TRUE = mock user + mock Firebase config for faster local dev
const DEBUG_MODE = true;
// -------------------------
// --- END CONTEXT AND API CONFIG ---

/** Data Provider (wraps hooks and exposes services via context) */
const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
  const { db } = firebaseServices;

  // 1) Data Hooks
  const pdp = usePDPData(db, userId, isAuthReady);
  const commitment = useCommitmentData(db, userId, isAuthReady);
  const planning = usePlanningData(db, userId, isAuthReady);

  // 2) Aggregate Loading/Error
  const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading;
  const error = pdp.error || commitment.error || planning.error;

  // 3) Memoized services for app
  const appServices = useMemo(() => ({
    // nav + user
    navigate,
    user,
    // firebase
    ...firebaseServices,
    userId,
    isAuthReady,
    // writers
    updatePdpData: pdp.updatePdpData,
    saveNewPlan: pdp.saveNewPlan,
    updateCommitmentData: commitment.updateCommitmentData,
    updatePlanningData: planning.updatePlanningData,
    // state blobs
    pdpData: pdp.pdpData,
    commitmentData: commitment.commitmentData,
    planningData: planning.planningData,
    // meta
    isLoading,
    error,
    appId,
    IconMap,
    // Gemini helpers
    callSecureGeminiAPI,
    hasGeminiKey,
    GEMINI_MODEL,
    API_KEY,
  }), [
    navigate, user, firebaseServices, userId, isAuthReady, isLoading, error, pdp, commitment, planning
  ]);

  if (!isAuthReady) return null;

  return (
    <AppServiceContext.Provider value={appServices}>
      {children}
    </AppServiceContext.Provider>
  );
};

/** Main App (auth + screen routing) */
const App = ({ initialState }) => {
  // user/auth/ui state
  const [user, setUser] = useState(
    DEBUG_MODE ? { name: 'Debugger', userId: 'mock-debugger-123', email: 'debug@leaderreps.com' } : null
  );
  const [currentScreen, setCurrentScreen] = useState(initialState?.screen || 'dashboard');
  const [firebaseServices, setFirebaseServices] = useState({ db: null, auth: null });
  const [userId, setUserId] = useState(DEBUG_MODE ? 'mock-debugger-123' : null);
  const [isAuthReady, setIsAuthReady] = useState(DEBUG_MODE);
  const [navParams, setNavParams] = useState(initialState?.params || {});
  const [authRequired, setAuthRequired] = useState(!DEBUG_MODE);

  const navigate = useCallback((screen, params = {}) => {
    setNavParams(params);
    setCurrentScreen(screen);
  }, []);

  // Firebase init + auth
  useEffect(() => {
    let app, firestore, authentication;

    if (DEBUG_MODE) {
      try {
        // Lightweight mock config
        const firebaseConfig = { apiKey: 'mock', authDomain: 'mock', projectId: 'mock' };
        app = initializeApp(firebaseConfig);
        firestore = getFirestore(app);
        authentication = getAuth(app);
        setFirebaseServices({ db: firestore, auth: authentication });
        return;
      } catch (e) {
        if (e.name !== 'FirebaseError' || !e.message.includes('already been initialized')) {
          console.warn('Firebase already initialized in DEBUG mode:', e);
        }
        const existingApp = getApp();
        firestore = getFirestore(existingApp);
        authentication = getAuth(existingApp);
        setFirebaseServices({ db: firestore, auth: authentication });
        return;
      }
    }

    try {
      // ✅ Robustly read config:
      // 1) If main.jsx injected an OBJECT at window.__firebase_config, use it.
      // 2) Else if a global string __firebase_config exists, sanitize → JSON.parse.
      // 3) Else use empty {} (Firebase will throw; we catch below).
      let firebaseConfig = {};
      if (typeof window !== 'undefined' && window.__firebase_config) {
        firebaseConfig = window.__firebase_config; // already parsed object
      } else if (typeof __firebase_config !== 'undefined') {
        let configString = String(__firebase_config).trim();
        if (configString.startsWith("'") && configString.endsWith("'")) {
          configString = configString.slice(1, -1);
        }
        firebaseConfig = JSON.parse(configString.replace(/'/g, '"'));
      }

      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      authentication = getAuth(app);

      setLogLevel('debug');
      setFirebaseServices({ db: firestore, auth: authentication });

      const unsubscribe = onAuthStateChanged(authentication, (currentUser) => {
        if (currentUser) {
          const currentUid = currentUser.uid;
          setUserId(currentUid);
          setUser({ name: currentUser.email || 'Canvas User', userId: currentUid });
          setAuthRequired(false);
        } else {
          setUser(null);
          setUserId(null);
          setAuthRequired(true);
        }
        setIsAuthReady(true);
      });

      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        signInWithCustomToken(authentication, __initial_auth_token)
          .catch(err => console.error('Canvas Token Auth failed; waiting for user login:', err));
      }

      return () => unsubscribe();
    } catch (e) {
      if (e.name !== 'FirebaseError' || !e.message.includes('already been initialized')) {
        console.error('Firebase setup failed:', e);
      }
      setIsAuthReady(true);
    }
  }, [DEBUG_MODE]);

  // --- Auth-gate (shown only when NOT in DEBUG_MODE and user not signed in) ---
  if (authRequired || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Authentication Required (DEBUG_MODE is OFF)</p>
      </div>
    );
  }

  // --- Init spinner while auth wires up ---
  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
          <p className="text-[#47A88D] font-medium">Initializing Application...</p>
        </div>
      </div>
    );
  }

  // --- App ---
  return (
    <DataProvider
      firebaseServices={firebaseServices}
      userId={userId}
      isAuthReady={isAuthReady}
      navigate={navigate}
      user={user}
    >
      <AppContent
        currentScreen={currentScreen}
        setCurrentScreen={navigate}
        user={user}
        navParams={navParams}
      />
    </DataProvider>
  );
};

const AppContent = ({ currentScreen, setCurrentScreen, user, navParams }) => {
  return (
    <div className="min-h-screen flex bg-gray-100 font-sans antialiased">
      <NavSidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} user={user} />
      <main className="flex-1 overflow-y-auto p-0">
        <ScreenRouter currentScreen={currentScreen} navParams={navParams} />
      </main>
    </div>
  );
};

const ScreenRouter = ({ currentScreen, navParams }) => {
  switch (currentScreen) {
    case 'prof-dev-plan':
      return <ProfDevPlanScreen />;
    case 'daily-practice':
      return <DailyPracticeScreen initialGoal={navParams.initialGoal} initialTier={navParams.initialTier} />;
    case 'coaching-lab':
      return <CoachingLabScreen />;
    case 'planning-hub':
      return <PlanningHubScreen />;
    case 'business-readings':
      return <BusinessReadingsScreen />;
    case 'quick-start-accelerator':
      return <QuickStartScreen />;
    case 'app-settings':
      return <AppSettingsScreen />;
    case 'dashboard':
    default:
      return <DashboardScreen />;
  }
};

// TEMP TEST — put this at the very bottom instead of your full export
export default function App() {
  return <div style={{ padding: 32, fontSize: 18 }}>✅ React is rendering</div>;
}
