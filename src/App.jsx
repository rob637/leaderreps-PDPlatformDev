// src/App.jsx
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';

// App services (loads user docs + global metadata)
import {
  AppServiceContext,
  usePDPData,
  useCommitmentData,
  usePlanningData,
  useGlobalMetadata,
  updateGlobalMetadata,
  useAppServices,
  // NEW: Import the applied leadership data hook // <-- REMOVED
} from './services/useAppServices.jsx';

import { initializeApp, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';

import {
  getFirestore,
  setLogLevel,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  writeBatch,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp,
  addDoc,
  collection,
  getDocs,
} from 'firebase/firestore';

/* -----------------------------------------------------------------------------
   DEV CONSOLE HELPERS (Unchanged)
----------------------------------------------------------------------------- */
try {
  // Make modular Firestore APIs available in the console
  window.getAuth = getAuth;
  window.getFirestore = getFirestore;
  window.doc = doc;
  window.getDoc = getDoc;
  window.setDoc = setDoc;
  window.updateDoc = updateDoc;
  window.onSnapshot = onSnapshot;
  window.collection = collection;
  window.getDocs = getDocs;
  window.addDoc = addDoc;
  window.writeBatch = writeBatch;
  window.arrayUnion = arrayUnion;
  window.arrayRemove = arrayRemove;
  window.increment = increment;
  window.serverTimestamp = serverTimestamp;

  // Await auth resolution after reloads
  window.fbReady = async function fbReady() {
    const auth = getAuth();
    if (auth.currentUser) return true;
    await new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, () => {
        unsub();
        resolve(true);
      });
    });
    return true;
  };

  // Path explainer: doc vs collection
  window.fb = window.fb || {};
  window.fb.pathExplain = function pathExplain(path) {
    const parts = (path || '').split('/').filter(Boolean);
    const isCollection = parts.length % 2 === 1; // 1,3,5… segments
    const kind = isCollection ? 'collection' : 'document';
    const tip = isCollection
      ? 'Looks like a collection path. You can list documents here.'
      : 'Looks like a document path. Remove the last segment to list the parent collection.';
    return { parts, segments: parts.length, kind, tip };
  };

  // Ensure the required user docs exist; seed if missing
  window.fb.ensureUserDocs = async function ensureUserDocs() {
    await window.fbReady();
    const auth = getAuth();
    const db = getFirestore();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No signed-in user');

    const paths = [
      [
        'leadership_plan',
        uid,
        'profile',
        'roadmap',
        { plan_goals: [], last_updated: new Date().toISOString() },
      ],
      [
        'user_commitments',
        uid,
        'profile',
        'active',
        { active_commitments: [], reflection_journal: '' },
      ],
      ['user_planning', uid, 'profile', 'drafts', { drafts: [] }],
    ];

    for (const [coll, u, prof, docId, seed] of paths) {
      const ref = doc(db, coll, u, prof, docId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, seed, { merge: true });
        await updateDoc(ref, { __touched: serverTimestamp() }).catch(() => {});
      }
    }
  };

  // Log the 3 user docs
  window.fb.checkUserDocs = async function checkUserDocs() {
    await window.fbReady();
    const auth = getAuth();
    const db = getFirestore();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No signed-in user');

    const refs = {
      roadmap: doc(db, 'leadership_plan', uid, 'profile', 'roadmap'),
      active: doc(db, 'user_commitments', uid, 'profile', 'active'),
      drafts: doc(db, 'user_planning', uid, 'profile', 'drafts'),
    };

    const [r, a, d] = await Promise.all([getDoc(refs.roadmap), getDoc(refs.active), getDoc(refs.drafts)]);
    const out = {
      roadmap: r.data() || null,
      active: a.data() || null,
      drafts: d.data() || null,
    };
    console.log('[TEST READS]', out);
    return out;
  };

  // Attach live listeners to the 3 docs
  window.fb.liveTest = async function liveTest() {
    await window.fbReady();
    const auth = getAuth();
    const db = getFirestore();
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('No signed-in user');
    const unsubs = [
      onSnapshot(doc(db, 'leadership_plan', uid, 'profile', 'roadmap'), (s) =>
        console.log('[LIVE] roadmap', s.exists(), s.data())
      ),
      onSnapshot(doc(db, 'user_commitments', uid, 'profile', 'active'), (s) =>
        console.log('[LIVE] active', s.exists(), s.data())
      ),
      onSnapshot(doc(db, 'user_planning', uid, 'profile', 'drafts'), (s) =>
        console.log('[LIVE] drafts', s.exists(), s.data())
      ),
    ];
    console.log('[LIVE] listeners attached; call each function to unsubscribe:', unsubs);
    return unsubs;
  };
} catch (e) {
  console.warn('Console helpers init failed:', e);
}

/* -----------------------------------------------------------------------------
   GEMINI CONFIG (Unchanged)
----------------------------------------------------------------------------- */
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_VERSION = 'v1beta';
const USE_SERVERLESS = typeof window !== 'undefined' && window.__GEMINI_MODE === 'direct' ? false : true;
const API_KEY =
  typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : USE_SERVERLESS ? 'SERVERLESS' : '';
const DEBUG_MODE = false;

const callSecureGeminiAPI = async (payload, maxRetries = 3, delay = 1000) => {
  const norm = (p = {}) => {
    const out = { ...p };
    if (out.systemInstruction && !out.system_instruction) {
      out.system_instruction = out.systemInstruction;
      delete out.systemInstruction;
    }
    if (Array.isArray(out.tools)) delete out.tools;
    out.model = out.model || GEMINI_MODEL;
    return out;
  };
  const body = JSON.stringify(norm(payload));

  let apiUrl = '';
  if (USE_SERVERLESS) {
    apiUrl = '/.netlify/functions/gemini';
  } else {
    const directKey = typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : '';
    if (!directKey) throw new Error('Gemini API Key is missing for direct mode. Set __GEMINI_API_KEY or use serverless.');
    apiUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${directKey}`;
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (response.ok) return response.json();
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt)));
          continue;
        }
      }
      const errorBody = await response.text();
      throw new Error(`API Request Failed: HTTP ${response.status} - ${errorBody}`);
    } catch (error) {
      if (attempt === maxRetries - 1) throw new Error(`Network Error after ${maxRetries} attempts: ${error.message}`);
      await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt)));
    }
  }
  throw new Error('Maximum retries exceeded.');
};

const hasGeminiKey = () => (USE_SERVERLESS ? true : !!(typeof __GEMINI_API_KEY !== 'undefined' && __GEMINI_API_KEY));

/* -----------------------------------------------------------------------------
   ICONS & CONSTANTS (Unchanged)
----------------------------------------------------------------------------- */
const IconMap = {};
const SECRET_SIGNUP_CODE = 'mock-code-123';
const LEADERSHIP_TIERS_FALLBACK = {
  T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
  T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' },
  T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' },
  T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-600' },
  T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};

// tiny notepad compat
if (typeof window !== 'undefined' && typeof window.notepad === 'undefined') {
  window.notepad = { setTitle: () => {}, addContent: () => {}, getContent: () => {} };
}
const notepad =
  typeof globalThis !== 'undefined'
    ? globalThis.notepad
    : typeof window !== 'undefined'
    ? window.notepad
    : undefined;

import {
  Home,
  Zap,
  ShieldCheck,
  TrendingUp,
  Mic,
  BookOpen,
  Settings,
  User,
  LogOut,
  CornerRightUp,
  Clock,
  Briefcase,
  Target,
  Users,
  BarChart3,
  Globe,
  Code,
  Bell,
  Lock,
  Download,
  Trash2,
  Mail,
  Link,
  Menu,
  Trello,
  Film,
  Dumbbell,
  Cpu,
  // --- NEW: ICONS FOR COLLAPSIBLE MENU ---
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

/* -----------------------------------------------------------------------------
   LAZY ROUTES (Unchanged)
----------------------------------------------------------------------------- */
const ScreenMap = {
  dashboard: lazy(() => import('./components/screens/Dashboard.jsx')),
  'development-plan': lazy(() => import('./components/screens/DevelopmentPlan.jsx')), 
  'coaching-lab': lazy(() => import('./components/screens/Labs.jsx')),
  'daily-practice': lazy(() => import('./components/screens/DailyPractice.jsx')),
  'planning-hub': lazy(() => import('./components/screens/PlanningHub.jsx')),
  'business-readings': lazy(() => import('./components/screens/BusinessReadings.jsx')),
  'quick-start-accelerator': lazy(() => import('./components/screens/QuickStartAccelerator.jsx')),
  reflection: lazy(() => import('./components/screens/ExecutiveReflection.jsx')),
  community: lazy(() => import('./components/screens/CommunityScreen.jsx')),
  'applied-leadership': lazy(() => import('./components/screens/AppliedLeadership.jsx')),
  'leadership-videos': lazy(() => import('./components/screens/LeadershipVideos.jsx')),
  'data-maintenance': lazy(() => import('./components/screens/AdminDataMaintenance.jsx')),
  'debug-data': lazy(() => import('./components/screens/DebugDataViewer.jsx')),
};

/* -----------------------------------------------------------------------------
   SETTINGS CARD + SCREEN (Unchanged)
----------------------------------------------------------------------------- */
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', ORANGE: '#E04E1B' };

const SettingsCard = ({ title, icon: Icon, children }) => (
  <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-lg space-y-4">
    <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2" style={{ color: COLORS.NAVY }}>
      <Icon size={22} style={{ color: COLORS.TEAL }} />
      {title}
    </h3>
    {children}
  </div>
);

const AppSettingsScreen = ({ navigate }) => {
  const { user, API_KEY, auth } = useAppServices();

  const handleResetPassword = async () => {
    if (!user?.email) {
      alert('Cannot reset password: User email is unknown.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert(`Password reset email sent to ${user.email}.`);
    } catch (error) {
      alert(`Failed to send reset email: ${error.message}`);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-extrabold text-[#002E47]">App Settings</h1>
      <p className="mt-2 text-gray-600">Manage your profile, security, integrations, and data.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SettingsCard title="User Account" icon={User}>
          <p className="text-sm text-gray-700">
            <strong>Full Name:</strong> <span className="font-semibold">{user?.name || 'N/A'}</span>
          </p>
          <p className="text-sm text-gray-700">
            <strong>Email:</strong> <span className="font-semibold">{user?.email || 'N/A'}</span>
          </p>
          <button onClick={handleResetPassword} className="text-sm font-semibold text-[#E04E1B] hover:text-red-700 mt-2">
            Change Password (Send Reset Link)
          </button>
        </SettingsCard>

        <SettingsCard title="Security" icon={Lock}>
          <p className="text-sm text-gray-700">
            <strong>2FA Status:</strong> <span className="font-semibold text-red-500">Disabled</span>
          </p>
          <p className="text-sm text-gray-700">
            <strong>Last Sign In:</strong> <span className="font-semibold">{new Date().toLocaleString()}</span>
          </p>
          <button className="text-sm font-semibold text-[#002E47] hover:text-[#47A88D] mt-2">Sign Out From All Devices</button>
        </SettingsCard>

        <SettingsCard title="AI Integration" icon={Code}>
          <label className="block text-sm font-medium text-gray-700">Gemini API Key</label>
          <input
            type="password"
            value={API_KEY ? '••••••••••••••••' : ''}
            readOnly
            placeholder="Configure in Netlify/Vite environment"
            className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            Status: <span className={`font-semibold ${API_KEY ? 'text-green-600' : 'text-red-500'}`}>{API_KEY ? 'Active' : 'Missing'}</span>
          </p>
        </SettingsCard>

        <SettingsCard title="Global Data Maintenance (Admin)" icon={Cpu}>
          <p className="text-sm text-gray-700">
            Admin-only tools for editing app-wide JSON and raw Firestore reads.
          </p>
          <button onClick={() => navigate('data-maintenance')} className="text-sm font-semibold text-[#E04E1B] hover:text-red-700 mt-2 flex items-center">
            <Settings size={14} className="inline-block mr-1" /> Launch JSON Editor
          </button>
          <button onClick={() => navigate('debug-data')} className="text-sm font-semibold text-blue-600 hover:text-blue-800 mt-2 flex items-center">
            <Code size={14} className="inline-block mr-1" /> Launch RAW Debug Viewer
          </button>
        </SettingsCard>
      </div>
    </div>
  );
};

/* -----------------------------------------------------------------------------
   DATA PROVIDER (Unchanged)
----------------------------------------------------------------------------- */
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
  const { db } = firebaseServices;

  // EXISTING HOOKS
  const pdp = usePDPData(db, userId, isAuthReady);
  const commitment = useCommitmentData(db, userId, isAuthReady);
  const planning = usePlanningData(db, userId, isAuthReady);
  const global = useGlobalMetadata(db, isAuthReady);
  
  try {
    if (global && typeof global.metadata === 'object') {
      console.log('[GLOBAL SNAPSHOT]', {
        keys: Object.keys(global.metadata || {}),
        size: JSON.stringify(global.metadata || {}).length,
      });
    }
  } catch {}

  const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading || global.isLoading;
  const error = pdp.error || commitment.error || planning.error || global.error;

  const hasPendingDailyPractice = useMemo(() => {
    const active = commitment.commitmentData?.active_commitments || [];
    const isPending = active.some((c) => c.status === 'Pending');
    const reflectionMissing = !commitment.commitmentData?.reflection_journal?.trim();
    return active.length > 0 && (isPending || reflectionMissing);
  }, [commitment.commitmentData]);

  const appServices = useMemo(
    () => ({
      navigate,
      user,
      ...firebaseServices,
      userId,
      isAuthReady,
      db,
      updatePdpData: pdp.updatePdpData,
      saveNewPlan: pdp.saveNewPlan,
      updateCommitmentData: commitment.updateCommitmentData,
      updatePlanningData: planning.updatePlanningData,
      updateGlobalMetadata: (data, opts) =>
        updateGlobalMetadata(db, data, {
          merge: true,
          source: (opts && opts.source) || 'Provider',
          userId: user?.uid,
          ...(opts || {}),
        }),
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
      LEADERSHIP_TIERS: global.metadata.LEADERSHIP_TIERS || LEADERSHIP_TIERS_FALLBACK,
      ...global.metadata, // <-- This spread now correctly includes LEADERSHIP_DOMAINS and RESOURCE_LIBRARY
      hasPendingDailyPractice,
    }),
    [navigate, user, firebaseServices, userId, isAuthReady, isLoading, error, pdp, commitment, planning, global, hasPendingDailyPractice, db]
  );

  if (!isAuthReady) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div>
          <p className="text-[#002E47] font-semibold">Loading User Data & Global Config...</p>
        </div>
      </div>
    );
  }

  return <AppServiceContext.Provider value={appServices}>{children}</AppServiceContext.Provider>;
};

/* -----------------------------------------------------------------------------
   NAV + ROUTER (*** UPDATED ***)
----------------------------------------------------------------------------- */
function ConfigError({ message }) { /* ... */ return (
    <div className="p-6 max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl text-red-700">
      <h3 className="font-bold text-lg mb-1">Configuration Error</h3>
      <p className="text-sm">{message || 'An unknown error occurred.'}</p>
    </div>
  );
}

function AuthPanel({ auth, onSuccess }) { /* ... */ 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset'
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = mode === 'login';
  const isReset = mode === 'reset';

  const handleAction = async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setStatusMessage('Password reset email sent. Check your inbox.');
      } else if (mode === 'signup') {
        if (secretCode !== SECRET_SIGNUP_CODE) {
          throw new Error('Invalid secret sign-up code.');
        }
        await createUserWithEmailAndPassword(auth, email, password);
        // Note: In a real app, you'd update the user's profile with 'name' here
        onSuccess();
      }
    } catch (e) {
      console.error('Auth action failed:', e);
      setStatusMessage(e.message);
    }
    setIsLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className={`p-8 bg-white rounded-xl shadow-2xl text-center w-full max-w-sm border-t-4 border-[${COLORS.TEAL}]`}>
        <h2 className={`text-2xl font-extrabold text-[${COLORS.NAVY}] mb-4`}>
          {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          {isReset ? 'Enter your email to receive a password reset link.' : 'Log in to access your leadership platform.'}
        </p>

        <div className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAction();
            }}
          >
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]`}
                disabled={isLoading}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]`}
              disabled={isLoading}
              autoComplete="email"
            />

            {!isReset && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]`}
                disabled={isLoading}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            )}

            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Secret Sign-up Code"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]`}
                disabled={isLoading}
              />
            )}

            <button type="submit" disabled={isLoading} className="w-full p-3 bg-[#47A88D] text-white rounded-lg hover:bg-[#349881] focus:ring-2 focus:ring-[#47A88D]">
              {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
            </button>
          </form>

          {statusMessage && (
            <p className={`text-sm text-center font-medium mt-3 ${statusMessage.includes('sent') ? `text-[${COLORS.TEAL}]` : 'text-[#E04E1B]'}`}>
              {statusMessage}
            </p>
          )}
        </div>

        <div className="mt-6 border-t pt-4 border-gray-200 space-y-2">
          {mode !== 'signup' && (
            <button onClick={() => { setMode('signup'); setStatusMessage(''); }} className={`text-sm text-[${COLORS.TEAL}] hover:text-[${COLORS.NAVY}] font-semibold block w-full`}>
              Need an account? Sign up
            </button>
          )}
          {mode !== 'login' && (
            <button onClick={() => { setMode('login'); setStatusMessage(''); }} className={`text-sm text-gray-500 hover:text-[${COLORS.NAVY}] block w-full`}>
              Back to Sign In
            </button>
          )}
          {mode === 'login' && (
            <button onClick={() => { setMode('reset'); setStatusMessage(''); }} className={`text-sm text-gray-500 hover:text-[${COLORS.ORANGE}] block w-full`}>
              Forgot Password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- **** NAVSIDEBAR: UPDATED FOR COLLAPSIBLE STATE **** ---
const NavSidebar = ({ currentScreen, setCurrentScreen, user, closeMobileMenu, isAuthRequired, isNavExpanded, setIsNavExpanded }) => {
  const { auth } = useAppServices();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const NAVY = COLORS.NAVY;
  const TEAL = COLORS.TEAL;
  const ORANGE = COLORS.ORANGE;

  const coreNav = [
    { screen: 'dashboard', label: 'The Arena Dashboard', icon: Home },
    { screen: 'quick-start-accelerator', label: 'QuickStart: Bootcamp', icon: Zap, badge: 'New' },
  ];

  const contentPillarNav = [
    { screen: 'development-plan', label: 'My Development Plan', icon: Briefcase }, 
    { screen: 'planning-hub', label: 'Strategic Content Tools', icon: Trello },
    { screen: 'business-readings', label: 'Content: Read & Reps', icon: BookOpen },
    { screen: 'leadership-videos', label: 'Content: Leader Talks', icon: Film, badge: 'New' },
    { screen: 'applied-leadership', label: 'Applied Leadership Library', icon: ShieldCheck },
  ];

  const coachingPillarNav = [
    { screen: 'daily-practice', label: 'Daily Practice Scorecard', icon: Clock },
    { screen: 'coaching-lab', label: 'AI Coaching Lab', icon: Mic },
    { screen: 'reflection', label: 'Executive ROI Report', icon: BarChart3 },
  ];

  const communityPillarNav = [{ screen: 'community', label: 'Peer & Leader Circles', icon: Users, badge: 'New' }];

  const systemNav = [{ screen: 'app-settings', label: 'App Settings', icon: Settings }];

  const menuSections = [
    { title: 'THE ARENA CORE', items: coreNav },
    { title: 'CONTENT: LEARN & PREP', items: contentPillarNav },
    { title: 'COACHING: PRACTICE & FEEDBACK', items: coachingPillarNav },
    { title: 'COMMUNITY: ACCOUNTABILITY', items: communityPillarNav },
    { title: 'SYSTEM', items: systemNav },
  ];

  const handleSignOut = async () => {
    try {
      if (auth) {
        await signOut(auth);
        console.log('Sign Out successful.');
      }
      closeMobileMenu();
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  const handleNavigate = useCallback(
    (screen) => {
      setCurrentScreen(screen);
      closeMobileMenu();
    },
    [setCurrentScreen, closeMobileMenu]
  );

  const renderNavItems = (items) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive = currentScreen === item.screen;
      return (
        <button
          key={item.screen}
          onClick={() => handleNavigate(item.screen)}
          title={isNavExpanded ? '' : item.label} // Tooltip for collapsed state
          className={`flex items-center w-full px-4 py-2.5 rounded-xl font-semibold relative transition-all duration-200 ${
            isActive
              ? `bg-white text-[${NAVY}] shadow-lg ${isNavExpanded ? 'transform translate-x-1' : ''} ring-2 ring-[${TEAL}]` // Active state
              : `text-white hover:bg-[${TEAL}]/20 hover:text-white hover:shadow-md ${isNavExpanded ? 'hover:scale-[1.02]' : ''} bg-[${NAVY}]/5 border border-[${TEAL}]/10 ` // Inactive state
          } ${isNavExpanded ? '' : 'justify-center'}`} // Center icon when collapsed
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${isNavExpanded ? 'mr-3' : ''} ${isActive ? `text-[${TEAL}]` : 'text-gray-200'}`} />
          {isNavExpanded && (
            <span className="flex-1 text-left animate-in fade-in duration-200">{item.label}</span>
          )}
          {isNavExpanded && item.badge && (
            <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-[${ORANGE}] text-white animate-in fade-in duration-200`}>{item.badge}</span>
          )}
        </button>
      );
    });

  if (isAuthRequired) return null;

  return (
    // --- UPDATED: Width, transition, and padding ---
    <div className={`hidden md:flex flex-col ${isNavExpanded ? 'w-64 p-4' : 'w-20 p-3'} bg-[${NAVY}] text-white shadow-2xl transition-all duration-300 ease-in-out`}>
      <div className={`flex items-center justify-center h-16 border-b border-[${TEAL}]/50 mb-6 flex-shrink-0`}>
        {/* --- UPDATED: Show icon only or icon + text --- */}
        <CornerRightUp className={`w-7 h-7 text-[${TEAL}] ${isNavExpanded ? 'mr-2' : ''} transition-all`} />
        {isNavExpanded && (
          <h1 className="text-2xl font-extrabold animate-in fade-in duration-200">
            LeaderReps
          </h1>
        )}
      </div>

      {/* --- UPDATED: flex-col to position toggle button at bottom --- */}
      <nav className="flex-1 space-y-3 flex flex-col">
        {/* Wrapper for nav items */}
        <div className="flex-1 space-y-3">
          {menuSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {/* --- UPDATED: Show title only if expanded --- */}
              {isNavExpanded && (
                <p className={`text-xs font-extrabold uppercase tracking-widest text-white px-2 py-1 rounded bg-[${TEAL}]/10 animate-in fade-in duration-200`}>
                  {section.title}
                </p>
              )}
              <div className="space-y-1">{renderNavItems(section.items)}</div>
            </div>
          ))}
        </div>

        {/* --- NEW: Toggle Button --- */}
        <div className="py-2 mt-4">
          <button
            onClick={() => setIsNavExpanded(!isNavExpanded)}
            title={isNavExpanded ? 'Collapse Menu' : 'Expand Menu'}
            className={`flex items-center w-full px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 text-white hover:bg-[${TEAL}]/20 ${isNavExpanded ? '' : 'justify-center'}`}
          >
            {isNavExpanded ? <ChevronLeft className="w-5 h-5 mr-3" /> : <ChevronRight className="w-5 h-5" />}
            {isNavExpanded && <span className="flex-1 text-left animate-in fade-in duration-200">Collapse</span>}
          </button>
        </div>
      </nav>

      <div className={`pt-4 border-t border-[${TEAL}]/50 mt-4 relative flex-shrink-0`}>
        {/* --- UPDATED: Profile button --- */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          title={isNavExpanded ? '' : (user?.name || 'Guest User')} // Tooltip
          className={`flex items-center w-full p-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[${TEAL}]/20 focus:outline-none focus:ring-2 focus:ring-[${TEAL}] bg-white/5 ${isNavExpanded ? '' : 'justify-center'}`}
        >
          <User className={`w-5 h-5 flex-shrink-0 ${isNavExpanded ? 'mr-3' : ''} text-indigo-300`} />
          {isNavExpanded && (
            <span className="truncate animate-in fade-in duration-200">{user?.name || `Guest User`}</span>
          )}
        </button>

        {/* --- UPDATED: Profile popup position --- */}
        {isProfileOpen && (
          <div
            className={`absolute bottom-full ${isNavExpanded ? 'left-0' : 'left-full ml-2'} mb-3 w-64 p-4 rounded-xl shadow-2xl bg-[${NAVY}] border border-[${TEAL}]/50 z-10 animate-in fade-in ${isNavExpanded ? 'slide-in-from-bottom-2' : 'slide-in-from-left-2'}`}
          >
            <p className="text-xs font-medium uppercase text-indigo-300 mb-1">Account Info</p>
            <p className="text-sm font-semibold truncate mb-2 text-white" title={user?.email}>
              {user?.email || 'N/A'}
            </p>
            <p className="text-xs text-gray-400 break-words mb-4">UID: {user?.userId || 'N/A'}</p>
            <button onClick={handleSignOut} className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-[${ORANGE}] text-white hover:bg-red-700`}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ScreenRouter = ({ currentScreen, navParams, navigate }) => { /* ... */ 
  const Component = ScreenMap[currentScreen] || ScreenMap.dashboard;

  if (currentScreen === 'daily-practice')
    return <Component key={currentScreen} initialGoal={navParams.initialGoal} initialTier={navParams.initialTier} />;
  if (currentScreen === 'app-settings') return <AppSettingsScreen key={currentScreen} navigate={navigate} />;
if (currentScreen === 'data-maintenance') return <Component key={currentScreen} navigate={navigate} />;
  if (currentScreen === 'debug-data') return <Component key={currentScreen} navigate={navigate} />;
  return <Component key={currentScreen} />;
};

// --- **** APPCONTENT: UPDATED **** ---
const AppContent = ({ currentScreen, setCurrentScreen, user, navParams, isMobileOpen, setIsMobileOpen, isAuthRequired, isNavExpanded, setIsNavExpanded }) => {
  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), [setIsMobileOpen]);
  const { navigate } = useAppServices();

  return (
    // --- UPDATED: `relative` and `min-h-screen` added for robustness ---
    <div className="relative min-h-screen flex bg-gray-100 font-sans antialiased">
      <NavSidebar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        user={user}
        isMobileOpen={isMobileOpen}
        closeMobileMenu={closeMobileMenu}
        isAuthRequired={isAuthRequired}
        // --- UPDATED: Pass state to sidebar ---
        isNavExpanded={isNavExpanded}
        setIsNavExpanded={setIsNavExpanded}
      />

      {/* --- UPDATED: Main content area --- */}
      <main className="flex-1">
        <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-40">
          <h1 className="text-xl font-bold text-[#002E47]">LeaderReps</h1>
          <button onClick={() => setIsMobileOpen(true)} className="p-2 text-[#002E47] hover:text-[#47A88D]">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div>
                <p className="text-[#002E47] font-semibold">Loading App Content...</p>
              </div>
            </div>
          }
        >
          <ScreenRouter currentScreen={currentScreen} navParams={navParams} navigate={navigate} />
        {/* --- THIS IS THE FIX --- */}
        </Suspense>
      </main>
    </div>
  );
};

/* -----------------------------------------------------------------------------
   ROOT APP (*** UPDATED ***)
----------------------------------------------------------------------------- */
const App = ({ initialState }) => {
  const [user, setUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState(initialState?.screen || 'dashboard');
  const [firebaseServices, setFirebaseServices] = useState({ db: null, auth: null });
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [navParams, setNavParams] = useState(initialState?.params || {});
  const [authRequired, setAuthRequired] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // --- NEW: State for collapsible nav ---
  const [isNavExpanded, setIsNavExpanded] = useState(false); // Default to collapsed

  const [initStage, setInitStage] = useState('init');
  const [initError, setInitError] = useState('');

  const navigate = useCallback((screen, params = {}) => {
    setNavParams(typeof params === 'object' && params !== null ? params : {});
    setCurrentScreen(screen);
  }, []);

  // Expose Gemini caller + navigate for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') window.__callSecureGeminiAPI = callSecureGeminiAPI;
    return () => { if (typeof window !== 'undefined') delete window.__callSecureGeminiAPI; };
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') window.__appNavigate = navigate;
    return () => { if (typeof window !== 'undefined') delete window.__appNavigate; };
  }, [navigate]);

  // Firebase init/auth (Unchanged)
  useEffect(() => {
    let app, firestore, authentication;
    let unsubscribeAuth = null;
    let timerId = null;

    const finalizeInit = (success = true, errorMsg = '') => {
      if (timerId) clearTimeout(timerId);
      if (success) setInitStage('ok');
      else {
        console.error('Auth Finalization Error:', errorMsg);
        setInitError(errorMsg || 'Authentication service failed to initialize.');
        setInitStage('error');
      }
      setIsAuthReady(true);
    };

    try {
      let firebaseConfig = {};
      if (typeof window !== 'undefined' && window.__firebase_config) {
        const cfg = window.__firebase_config;
        firebaseConfig = typeof cfg === 'string' ? JSON.parse(cfg) : cfg;
      } else {
        finalizeInit(false, 'Firebase configuration is missing from the environment.');
        return;
      }

      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      authentication = getAuth(app);
      setLogLevel('debug');
      setFirebaseServices({ db: firestore, auth: authentication });

      // Render login quickly even if auth callback is a little slow
      timerId = setTimeout(() => {
        if (!user) finalizeInit(true);
      }, 500);

      unsubscribeAuth = onAuthStateChanged(authentication, (currentUser) => {
        if (timerId) clearTimeout(timerId);

        if (currentUser && currentUser.email) {
          const uid = currentUser.uid;
          const email = currentUser.email;
          const name = currentUser.displayName || email.split('@')[0];
          setUserId(uid);
          setUser({ name, email, userId: uid });
          setAuthRequired(false);
        } else {
          setUser(null);
          setUserId(null);
          setAuthRequired(true);
        }
        finalizeInit(true);
      });

      return () => {
        if (unsubscribeAuth) unsubscribeAuth();
        if (timerId) clearTimeout(timerId);
      };
    } catch (e) {
      console.error('Firebase setup failed:', e);
      finalizeInit(false, e?.message || 'Firebase SDK threw an error.');
    }
  }, []); // mount once

  // --- Loading/Auth Screens (Unchanged) ---
  if (initStage === 'init') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div>
          <p className="text-[#002E47] font-semibold">Initializing Authentication…</p>
        </div>
      </div>
    );
  }
  if (initStage === 'error') return <ConfigError message={initError} />;

  if (!user && isAuthReady) {
    return (
      <AuthPanel
        auth={firebaseServices.auth}
        onSuccess={() => {
          setAuthRequired(false);
          setTimeout(() => navigate('dashboard'), 0);
        }}
      />
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
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div>
              <p className="text-[#002E47] font-semibold">Loading App Content...</p>
            </div>
          </div>
        }
      >
        {/* --- UPDATED: Pass nav state to AppContent --- */}
        <AppContent
          currentScreen={currentScreen}
          setCurrentScreen={navigate}
          user={user}
          navParams={navParams}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isAuthRequired={authRequired}
          isNavExpanded={isNavExpanded}
          setIsNavExpanded={setIsNavExpanded}
        />
      </Suspense>
    </DataProvider>
  );
};

export default function Root(props) {
  const forceSanity = typeof window !== 'undefined' && /[?&]sanity=1/.test(window.location.search);
  if (false || forceSanity) {
    return (
      <div style={{ padding: 32, fontSize: 18, lineHeight: 1.4 }}>
        <div>✅ <strong>React mounted (Sanity Check)</strong></div>
      </div>
    );
  }
  return <App {...props} />;
}