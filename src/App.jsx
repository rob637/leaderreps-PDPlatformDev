// src/App.jsx
import React, {
  useState, useEffect, useMemo, useCallback, createContext, useContext
} from 'react';

import { initializeApp, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

import {
  allBooks, SECRET_SIGNUP_CODE, IconMap, LEADERSHIP_TIERS, PDP_COLLECTION, PDP_DOCUMENT
} from './data/Constants';
import { usePDPData, useCommitmentData, usePlanningData } from './firebase/Hooks';

import { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY } from './utils/ApiHelpers.js';

// Screens
import DashboardScreen, { QuickStartScreen, AppSettingsScreen } from './components/screens/Dashboard';
import ProfDevPlanScreen from './components/screens/DevPlan';
import Labs from './components/screens/Labs';
import NavSidebar from './components/shared/UI';
import DailyPracticeScreen from './components/screens/DailyPractice.jsx';
import PlanningHubScreen from './components/screens/PlanningHub.jsx';
import BusinessReadingsScreen from './components/screens/BusinessReadings.jsx';

const CoachingLabScreen = Labs;

/* =========================
   CONTEXT + SAFE DEFAULTS
   ========================= */
const AppServiceContext = createContext(null);

const DEFAULT_SERVICES = {
  navigate: () => {},
  user: null,
  db: null,
  auth: null,
  userId: null,
  isAuthReady: false,
  updatePdpData: () => {},
  saveNewPlan: () => {},
  updateCommitmentData: () => {},
  updatePlanningData: () => {},
  pdpData: null,
  commitmentData: null,
  planningData: null,
  isLoading: false,
  error: null,
  appId: 'default-app-id',
  IconMap: {},
  callSecureGeminiAPI: async () => { throw new Error('Gemini not configured.'); },
  hasGeminiKey: () => false,
  GEMINI_MODEL,
  API_KEY,
};

export const useAppServices = () => {
  const ctx = useContext(AppServiceContext);
  return ctx ?? DEFAULT_SERVICES;
};

// App ID for Firestore pathing (optional)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// 👉 Flip to false when you want real auth gating
const DEBUG_MODE = false;

/* =========================
   Data Provider
   ========================= */
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

/* =========================
   Minimal Email/Password Login
   ========================= */
function LoginPanel({ auth, onSuccess }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [invite, setInvite] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      onSuccess?.();
    } catch (ex) {
      setErr(ex.message || 'Sign in failed.');
    } finally { setBusy(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErr('');
    if (SECRET_SIGNUP_CODE && invite.trim() !== String(SECRET_SIGNUP_CODE)) {
      setErr('Invalid invite code.');
      return;
    }
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), pass);
      onSuccess?.();
    } catch (ex) {
      setErr(ex.message || 'Sign up failed.');
    } finally { setBusy(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMode('signin');
      setErr('Reset email sent. Check your inbox.');
    } catch (ex) {
      setErr(ex.message || 'Reset failed.');
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {mode === 'signin' && 'Sign in'}
          {mode === 'signup' && 'Create your account'}
          {mode === 'reset'  && 'Reset password'}
        </h1>

        {err && (
          <div className="text-sm rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 p-3">
            {err}
          </div>
        )}

        <form onSubmit={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleReset} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input
              type="email"
              className="mt-1 w-full border rounded-md px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm text-gray-700">Password</label>
              <input
                type="password"
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>
          )}

          {mode === 'signup' && SECRET_SIGNUP_CODE && (
            <div>
              <label className="block text-sm text-gray-700">Invite code</label>
              <input
                type="text"
                className="mt-1 w-full border rounded-md px-3 py-2"
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                placeholder="Enter invite code"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-emerald-600 text-white py-2 font-medium hover:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? 'Please wait…' :
              (mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link')}
          </button>
        </form>

        <div className="text-xs text-gray-600 flex justify-between">
          {mode !== 'reset' ? (
            <button className="underline" onClick={() => setMode('reset')}>Forgot password?</button>
          ) : (
            <button className="underline" onClick={() => setMode('signin')}>Back to sign in</button>
          )}
          {mode === 'signin' ? (
            <button className="underline" onClick={() => setMode('signup')}>Need an account?</button>
          ) : mode === 'signup' ? (
            <button className="underline" onClick={() => setMode('signin')}>Have an account?</button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Main App
   ========================= */
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
      // Prefer parsed object from main.jsx
      let firebaseConfig = {};
      if (typeof window !== 'undefined' && window.__firebase_config) {
        firebaseConfig = window.__firebase_config;
      } else if (typeof __firebase_config !== 'undefined') {
        let s = String(__firebase_config).trim();
        if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
        firebaseConfig = JSON.parse(s.replace(/'/g, '"'));
      } else {
        console.warn('No Firebase config found; set VITE_FIREBASE_CONFIG and inject in main.jsx');
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
  }, []);

  // ---------- Auth Gate ----------
  if (!DEBUG_MODE) {
    if (!firebaseServices.auth || !isAuthReady) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-3"></div>
            <p className="text-emerald-700 font-medium">Initializing Authentication…</p>
          </div>
        </div>
      );
    }

    if (authRequired || !user) {
      return <LoginPanel auth={firebaseServices.auth} onSuccess={() => {/* onAuthStateChanged will take over */}} />;
    }
  }

  // ---------- App ----------
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

/* =========================
   Layout + Router
   ========================= */
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
