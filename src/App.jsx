// src/App.jsx
import React, {
  useState, useEffect, useMemo, useCallback, createContext, useContext
} from 'react';

import { initializeApp, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

import {
  allBooks, SECRET_SIGNUP_CODE, IconMap, LEADERSHIP_TIERS, PDP_COLLECTION, PDP_DOCUMENT
} from './data/Constants';
import { usePDPData, useCommitmentData, usePlanningData } from './firebase/Hooks';

// ESM-safe explicit extension for Netlify/Linux
import { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY } from './utils/ApiHelpers.js';

// Screens
import DashboardScreen, { QuickStartScreen, AppSettingsScreen } from './components/screens/Dashboard';
import ProfDevPlanScreen from './components/screens/DevPlan';
import Labs from './components/screens/Labs';
import NavSidebar from './components/shared/UI';

// These three must exist; if you haven’t built them yet, keep the stub files we added.
import DailyPracticeScreen from './components/screens/DailyPractice.jsx';
import PlanningHubScreen from './components/screens/PlanningHub.jsx';
import BusinessReadingsScreen from './components/screens/BusinessReadings.jsx';

// Legacy alias
const CoachingLabScreen = Labs;

// --- CONTEXT ---
const AppServiceContext = createContext(null);
export const useAppServices = () => useContext(AppServiceContext);

// App ID for pathing (optional)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Toggle this OFF when you want real auth-gating
const DEBUG_MODE = true;

// ---------- Data Provider ----------
const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
  const { db } = firebaseServices;

  const pdp = usePDPData(db, userId, isAuthReady);
  const commitment = useCommitmentData(db, userId, isAuthReady);
  const planning = usePlanningData(db, userId, isAuthReady);

  const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading;
  const error = pdp.error || commitment.error || planning.error;

  const appServices = useMemo(() => ({
    navigate,
    user,
    ...firebaseServices,
    userId,
    isAuthReady,
    updatePdpData: pdp.updatePdpData,
    saveNewPlan: pdp.saveNewPlan,
    updateCommitmentData: commitment.updateCommitmentData,
    updatePlanningData: planning.updatePlanningData,
    pdpData: pdp.pdpData,
    commitmentData: commitment.commitmentData,
    planningData: planning.planningData,
    isLoading,
    error,
    appId,
    IconMap,
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

// ---------- Main App (single definition; default export at end) ----------
const App = ({ initialState }) => {
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

  useEffect(() => {
    let app, firestore, authentication;

    if (DEBUG_MODE) {
      try {
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
        const existing = getApp();
        firestore = getFirestore(existing);
        authentication = getAuth(existing);
        setFirebaseServices({ db: firestore, auth: authentication });
        return;
      }
    }

    try {
      // Prefer parsed object from main.jsx: window.__firebase_config
      let firebaseConfig = {};
      if (typeof window !== 'undefined' && window.__firebase_config) {
        firebaseConfig = window.__firebase_config;
      } else if (typeof __firebase_config !== 'undefined') {
        // Fallback if someone injected a string global
        let s = String(__firebase_config).trim();
        if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
        firebaseConfig = JSON.parse(s.replace(/'/g, '"'));
      }

      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      authentication = getAuth(app);

      setLogLevel('debug');
      setFirebaseServices({ db: firestore, auth: authentication });

      const unsubscribe = onAuthStateChanged(authentication, (currentUser) => {
        if (currentUser) {
          const uid = currentUser.uid;
          setUserId(uid);
          setUser({ name: currentUser.email || 'Canvas User', userId: uid });
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
          .catch(err => console.error('Custom token auth failed; waiting for user login:', err));
      }

      return () => unsubscribe();
    } catch (e) {
      if (e.name !== 'FirebaseError' || !e.message.includes('already been initialized')) {
        console.error('Firebase setup failed:', e);
      }
      setIsAuthReady(true);
    }
  }, [DEBUG_MODE]);

  // Gate when DEBUG_MODE is false
  if (authRequired || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p>Authentication Required (DEBUG_MODE is OFF)</p>
      </div>
    );
  }

  // Init spinner
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

export default App;
