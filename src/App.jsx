import './globals/notepad.js';
import React, {
  useState, useEffect, useMemo, useCallback, createContext, useContext, lazy, Suspense
} from 'react';

import { initializeApp, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// --- MOCK/EXTERNAL IMPORTS (Adjust these paths in a final build environment) --- 
// Assuming these are external helper files/hooks that your application uses
import {
  SECRET_SIGNUP_CODE, IconMap, PDP_COLLECTION, PDP_DOCUMENT
} from './data/Constants';
import { usePDPData, useCommitmentData, usePlanningData } from './firebase/Hooks';
import { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY } from './utils/ApiHelpers.js';

// Icons for navigation
import { Home, Zap, TrendingUp, Mic, BookOpen, Settings, X, Menu, LogOut, CornerRightUp, Clock, Briefcase, Trello, BarChart3, User, Bell } from 'lucide-react';
const notepad = (typeof globalThis !== 'undefined' ? globalThis.notepad : (typeof window !== 'undefined' ? window.notepad : undefined));

/* =========================================================
   STEP 1: LAZY LOAD SCREEN COMPONENTS (Fixes TDZ/ReferenceError)
========================================================= */
const DashboardScreen = lazy(() => import('./components/screens/Dashboard.jsx'));
const ProfDevPlanScreen = lazy(() => import('./components/screens/DevPlan'));
const CoachingLabScreen = lazy(() => import('./components/screens/Labs'));
const DailyPracticeScreen = lazy(() => import('./components/screens/DailyPractice.jsx'));
const PlanningHubScreen = lazy(() => import('./components/screens/PlanningHub.jsx'));
const BusinessReadingsScreen = lazy(() => import('./components/screens/BusinessReadings.jsx'));
const QuickStartScreen = lazy(() => import('./components/screens/QuickStartAccelerator.jsx')); 


/* =========================================================
   STEP 2: MOCK/PLACEHOLDER COMPONENTS (Required for Router)
========================================================= */

// NOTE: These components must be defined or imported for the router to work.
// Since you didn't provide AppSettings or ExecutiveReflection, they remain placeholders.

const AppSettingsScreen = () => (
    <div className="p-8">
        <h1 className="text-3xl font-extrabold text-[#002E47]">App Settings</h1>
        <p className="mt-2 text-gray-600">
            Placeholder for user and API settings configuration.
        </p>
    </div>
);

const ExecutiveReflection = () => (
    <div className="p-8">
        <h1 className="text-3xl font-extrabold text-[#002E47]">Executive Reflection</h1>
        <p className="mt-2 text-gray-600">
            Placeholder for aggregated practice data, goal trends, and leadership growth patterns.
        </p>
    </div>
);


/* =========================================================
   STEP 3: CONTEXT + DATA PROVIDER
========================================================= */

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
  hasGeminiKey: () => false, // Default to false if API is not configured
  GEMINI_MODEL,
  API_KEY,
  LEADERSHIP_TIERS: {},
  hasPendingDailyPractice: false,
};
export const useAppServices = () => useContext(AppServiceContext) ?? DEFAULT_SERVICES;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const DEBUG_MODE = false; // Set to true to bypass auth

const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
  const { db } = firebaseServices;

  // FIX: These are mock hooks and need to be provided by the user's environment, 
  // but we must call them here to provide the data to context.
  const pdp = usePDPData(db, userId, isAuthReady);
  const commitment = useCommitmentData(db, userId, isAuthReady);
  const planning = usePlanningData(db, userId, isAuthReady);

  const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading;
  const error = pdp.error || commitment.error || planning.error;

  // Calculate notification status for Daily Practice
  const hasPendingDailyPractice = useMemo(() => {
    const active = commitment.commitmentData?.active_commitments || [];
    const isPending = active.some(c => c.status === 'Pending');
    const reflectionMissing = !commitment.commitmentData?.reflection_journal?.trim();
    return active.length > 0 && (isPending || reflectionMissing);
  }, [commitment.commitmentData]);


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
    IconMap: IconMap || {}, // Ensure IconMap is available
    callSecureGeminiAPI,
    hasGeminiKey,
    GEMINI_MODEL,
    API_KEY,
    LEADERSHIP_TIERS: {}, // Mock Tiers data if not available
    hasPendingDailyPractice, 
  }), [
    navigate, user, firebaseServices, userId, isAuthReady, isLoading, error, pdp, commitment, planning, hasPendingDailyPractice
  ]);

  if (!isAuthReady) return null;

  return (
    <AppServiceContext.Provider value={appServices}>
      {children}
    </AppServiceContext.Provider>
  );
};


/* =========================================================
   STEP 4: LAYOUT & NAVIGATION
========================================================= */

function LoginPanel({ auth, onSuccess, allowAnonymous = false }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [invite, setInvite] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  
  const [isAnon, setIsAnon] = useState(auth?.currentUser?.isAnonymous ?? false);

  useEffect(() => {
      if (auth) {
          const unsubscribe = onAuthStateChanged(auth, (user) => {
              setIsAnon(user?.isAnonymous ?? false);
          });
          return () => unsubscribe();
      }
  }, [auth]);

  const finalize = () => {
    try { window.history.replaceState(null, '', '/'); } catch {}
    onSuccess?.();
  };

  const handleSignIn = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await signInWithEmailAndPassword(auth, email.trim(), pass); finalize(); }
    catch (ex) { setErr(ex.message || 'Sign in failed.'); }
    finally { setBusy(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault(); setErr('');
    if (SECRET_SIGNUP_CODE && invite.trim() !== String(SECRET_SIGNUP_CODE)) {
      setErr('Invalid invite code.'); return;
    }
    setBusy(true);
    try {
      const user = auth.currentUser;
      const isAnonymousUser = user && user.isAnonymous;
      
      if (isAnonymousUser) {
        const cred = EmailAuthProvider.credential(email.trim(), pass);
        await linkWithCredential(user, cred);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), pass);
      }
      finalize();
    } catch (ex) { 
      setErr(ex.message || 'Sign up failed.'); 
    }
    finally { setBusy(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await sendPasswordResetEmail(auth, email.trim()); setMode('signin'); setErr('Reset email sent.'); }
    catch (ex) { setErr(ex.message || 'Reset failed.'); }
    finally { setBusy(false); }
  };

  const handleAnonymous = async () => {
    setErr(''); setBusy(true);
    try { await signInAnonymously(auth); finalize(); }
    catch (ex) { setErr(ex.message || 'Guest sign-in failed.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <h1 className="text-2xl font-bold text-[#002E47]">
          {isAnon && mode === 'signup' ? 'Upgrade Your Account' : (mode === 'signin' && 'Sign In')}
          {mode === 'signup' && !isAnon && 'Create Your Account'}
          {mode === 'reset'  && 'Reset Password'}
        </h1>
        
        {isAnon && mode === 'signup' && (
             <div className="text-sm rounded-md bg-[#47A88D]/10 text-[#002E47] border border-[#47A88D]/30 p-3 font-medium">
                 You are currently signed in as a guest. Creating an account will save your progress permanently.
             </div>
        )}

        {err && (
          <div className="text-sm rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 p-3">{err}</div>
        )}

        <form onSubmit={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#47A88D] focus:border-[#47A88D]"
                   value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#47A88D] focus:border-[#47A88D]"
                     value={pass} onChange={(e) => setPass(e.target.value)} required
                     autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </div>
          )}

          {mode === 'signup' && SECRET_SIGNUP_CODE && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Invite Code</label>
              <input type="text" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#47A88D] focus:border-[#47A88D]"
                     value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="Enter invite code" required />
            </div>
          )}

          <button type="submit" disabled={busy}
                  className="w-full rounded-lg bg-[#47A88D] text-white py-3 font-semibold hover:bg-[#3C937A] transition-colors disabled:opacity-60 shadow-lg">
            {busy ? 'Processing...' : (
                isAnon && mode === 'signup' ? 'Save Account & Progress' :
                mode === 'signin' ? 'Sign In' :
                mode === 'signup' ? 'Create Account' :
                'Send Reset Link'
            )}
          </button>
        </form>

        <div className="text-xs text-gray-600 flex justify-between">
          {mode !== 'reset'
            ? <button className="underline hover:text-[#002E47]" onClick={() => setMode('reset')}>Forgot password?</button>
            : <button className="underline hover:text-[#002E47]" onClick={() => setMode('signin')}>Back to sign in</button>}
          {mode === 'signin'
            ? <button className="underline hover:text-[#002E47]" onClick={() => setMode('signup')}>Need an account?</button>
            : mode === 'signup'
              ? <button className="underline hover:text-[#002E47]" onClick={() => setMode('signin')}>Have an account?</button>
              : null}
        </div>

        {allowAnonymous && (
          <button onClick={handleAnonymous} disabled={busy || isAnon}
                  className="w-full mt-4 rounded-lg border border-gray-300 py-3 font-medium hover:bg-gray-50 transition-colors disabled:opacity-60">
            Continue as Guest
          </button>
        )}
      </div>
    </div>
  );
}

function ConfigError({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow p-6 space-y-3 border border-red-200">
        <h1 className="text-lg font-semibold text-red-700">Firebase configuration error</h1>
        <p className="text-sm text-red-700">{message || 'Missing or invalid VITE_FIREBASE_CONFIG.'}</p>
      </div>
    </div>
  );
}

const NavSidebar = ({ currentScreen, setCurrentScreen, user, isMobileOpen, closeMobileMenu }) => {
    const { auth, hasPendingDailyPractice } = useAppServices();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const coreNav = [
        { screen: 'dashboard', label: 'Dashboard', icon: Home },
        { screen: 'quick-start-accelerator', label: 'QuickStart Accelerator', icon: Zap, badge: 'New' }, 
        { screen: 'reflection', label: 'Executive Reflection', icon: BarChart3 }, 
        { screen: 'daily-practice', label: 'Daily Practice', icon: Clock, notify: hasPendingDailyPractice }, 
    ];
    
    const toolsHubsNav = [
        { screen: 'prof-dev-plan', label: 'Development Plan', icon: Briefcase },
        { screen: 'coaching-lab', label: 'Coaching Lab', icon: Mic },
        { screen: 'planning-hub', label: 'Planning Hub (OKRs)', icon: Trello }, 
        { screen: 'business-readings', label: 'Business Readings', icon: BookOpen },
    ];
    
    const systemNav = [
        { screen: 'app-settings', label: 'App Settings', icon: Settings }, 
    ];

    const menuSections = [
        { title: 'CORE NAVIGATION', items: coreNav },
        { title: 'TOOLS & HUBS', items: toolsHubsNav },
        { title: 'SYSTEM', items: systemNav },
    ];

    const handleSignOut = async () => {
        try {
            if (auth) await signOut(auth);
            closeMobileMenu();
        } catch (e) {
            console.error('Sign out failed:', e);
        }
    };

    const handleNavigate = (screen) => {
        setCurrentScreen(screen);
        closeMobileMenu();
    };
    
    const renderNavItems = (items) => (
  items.map((item) => {
    const Icon = item.icon;
    const isActive = currentScreen === item.screen;
    const isNotifying = !!item.notify;
    const accent = '#E04E1B';
    return (
      <button
        key={item.screen}
        onClick={() => handleNavigate(item.screen)}
        className={`relative flex items-center w-full px-4 py-3 rounded-xl font-semibold transition-colors duration-200
          ${isActive ? 'bg-white text-[#002E47] shadow-lg' : 'bg-transparent text-white/90 hover:bg-[#47A88D]/20 hover:text-white'}`}
        aria-current={isActive ? 'page' : undefined}
        type="button"
      >
        {isActive && (
          <span
            aria-hidden="true"
            className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-full"
            style={{ background: accent }}
          />
        )}
        <Icon className="w-5 h-5 mr-3" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full"
                style={{ background: accent, color: '#FFFFFF' }}>
            {item.badge}
          </span>
        )}
        {isNotifying && (
          <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white/80"
                style={{ background: accent }}
                aria-label="Has pending items" />
        )}
      </button>
    );
  })
);


    if (isMobileOpen) {
        return (
            <div className="fixed inset-0 z-50 bg-[#002E47] text-white p-6 md:hidden">
                <div className="flex justify-between items-center border-b border-[#47A88D]/50 pb-4 mb-6">
                    <h2 className="text-xl font-bold flex items-center">
                        <CornerRightUp className="w-6 h-6 mr-2 text-[#47A88D]" /> LeaderReps
                    </h2>
                    <button onClick={closeMobileMenu} className="p-2 text-white hover:text-[#E04E1B] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <nav className="space-y-4 overflow-y-auto h-[75vh]">
                    {menuSections.map(section => (
                        <div key={section.title} className='space-y-2'>
                            <p className='text-xs font-semibold uppercase text-indigo-300 mb-1'>{section.title}</p>
                            {renderNavItems(section.items)}
                        </div>
                    ))}
                </nav>

                <div className="absolute bottom-6 left-6 right-6 pt-4 border-t border-[#47A88D]/50">
                    <p className='text-sm text-gray-400 mb-2'>Signed in as: {user?.email || user?.userId}</p>
                    <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-3 rounded-xl font-medium transition-colors bg-[#E04E1B] text-white hover:bg-red-700"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Sign Out
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="hidden md:flex flex-col w-64 min-h-screen bg-[#002E47] text-white p-4 shadow-2xl sticky top-0">
            <div className="flex items-center justify-center h-16 border-b border-[#47A88D]/50 mb-6">
                <h1 className="text-2xl font-extrabold flex items-center">
                    <CornerRightUp className="w-7 h-7 mr-2 text-[#47A88D]" /> LeaderReps
                </h1>
            </div>

            <nav className="flex-1 space-y-4 overflow-y-auto">
                {menuSections.map(section => (
                    <div key={section.title} className='space-y-3'>
                        <p className='text-xs font-semibold uppercase tracking-wider text-indigo-300 pl-4 mb-1'>{section.title}</p>
                        <div className="space-y-1">
                            {renderNavItems(section.items)}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="pt-4 border-t border-[#47A88D]/50 mt-4 relative">
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    className="flex items-center w-full p-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[#47A88D]/20 focus:outline-none focus:ring-2 focus:ring-[#47A88D]"
                >
                    <User className="w-5 h-5 mr-3 text-indigo-300" />
                    <span className='truncate'>{user?.email || 'User Profile'}</span>
                </button>
                
                {isProfileOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-full p-4 rounded-xl shadow-2xl bg-[#002E47] border border-[#47A88D]/50 z-10 animate-in fade-in slide-in-from-bottom-2">
                        <p className='text-xs font-medium uppercase text-indigo-300 mb-1'>Account Info</p>
                        <p className='text-sm font-semibold truncate mb-2 text-white' title={user?.email}>{user?.email}</p>
                        <p className='text-xs text-gray-400 break-words mb-4'>UID: {user?.userId}</p>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-[#E04E1B] text-white hover:bg-red-700"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ScreenRouter = ({ currentScreen, navParams }) => {
  // All screens are now lazily loaded and handled by Suspense in AppContent
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
    case 'reflection': 
      return <ExecutiveReflection />;
    case 'dashboard':
    default:
      return <DashboardScreen />;
  }
};


/* =========================================================
   STEP 5: MAIN APP EXPORT
========================================================= */

const AppContent = ({ currentScreen, setCurrentScreen, user, navParams, isMobileOpen, setIsMobileOpen }) => {
    return (
        <div className="min-h-screen flex bg-gray-100 font-sans antialiased">
            <NavSidebar
                currentScreen={currentScreen}
                setCurrentScreen={setCurrentScreen}
                user={user}
                isMobileOpen={isMobileOpen}
                closeMobileMenu={() => setIsMobileOpen(false)}
            />
            <main className="flex-1 overflow-y-auto">
                <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-40">
                    <h1 className="text-xl font-bold text-[#002E47]">LeaderReps</h1>
                    <button onClick={() => setIsMobileOpen(true)} className="p-2 text-[#002E47] hover:text-[#47A88D]">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
                {/* Router wrapped in Suspense (provided by the parent component, App) */}
                <ScreenRouter currentScreen={currentScreen} navParams={navParams} />
            </main>
        </div>
    );
};

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
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [initStage, setInitStage] = useState('init');
  const [initError, setInitError] = useState('');

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
        setIsAuthReady(true);
        setInitStage('ok');
        return;
      } catch {
        try {
          const existing = getApp();
          firestore = getFirestore(existing);
          authentication = getAuth(existing);
          setFirebaseServices({ db: firestore, auth: authentication });
        } catch {}
        setIsAuthReady(true);
        setInitStage('ok');
        return;
      }
    }

    try {
      let firebaseConfig = {};
      if (typeof window !== 'undefined' && window.__firebase_config) {
        const cfg = window.__firebase_config;
        firebaseConfig = (typeof cfg === 'string') ? JSON.parse(cfg) : cfg;
      } else if (typeof __firebase_config !== 'undefined') {
        let s = String(__firebase_config).trim();
        if (s.startsWith("'") && s.endsWith("'")) s = s.slice(1, -1);
        firebaseConfig = JSON.parse(s.replace(/'/g, '"'));
      } else {
        setInitError('window.__firebase_config is missing. Ensure VITE_FIREBASE_CONFIG is set and parsed in main.jsx.');
        setIsAuthReady(true);
        setInitStage('error');
        return;
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
          setUser({ name: currentUser.email || 'Canvas User', email: currentUser.email || '', userId: uid });
          setAuthRequired(false);
        } else {
          setUser(null);
          setUserId(null);
          setAuthRequired(true);
        }
        setIsAuthReady(true);
        setInitStage('ok');
      });

      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        signInWithCustomToken(authentication, __initial_auth_token)
          .catch(err => console.error('Custom token auth failed; waiting for user login:', err));
      }

      return () => unsubscribe();
    } catch (e) {
      console.error('Firebase setup failed:', e);
      setInitError(e?.message || 'Firebase initialization failed.');
      setIsAuthReady(true);
      setInitStage('error');
    }
  }, []);

  if (!DEBUG_MODE) {
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
    if (initStage === 'error') {
      return (
        <>
          <ConfigError message={initError} />
        </>
      );
    }
    if (!user) {
      return (
        <>
          <LoginPanel
            auth={firebaseServices.auth}
            onSuccess={() => {
              setAuthRequired(false);
              setTimeout(() => navigate('dashboard'), 0);
            }}
            allowAnonymous={false}
          />
        </>
      );
    }
  }

  return (
    <>
      <DataProvider
        firebaseServices={firebaseServices}
        userId={userId}
        isAuthReady={isAuthReady}
        navigate={navigate}
        user={user}
      >
        {/* FIX: Suspense boundary ensures lazy-loaded components wait for data context */}
        <Suspense fallback={
             <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div>
                    <p className="text-[#002E47] font-semibold">Loading App Content...</p>
                </div>
             </div>
        }>
            <AppContent
              currentScreen={currentScreen}
              setCurrentScreen={navigate}
              user={user}
              navParams={navParams}
              isMobileOpen={isMobileOpen}
              setIsMobileOpen={setIsMobileOpen}
            />
        </Suspense>
      </DataProvider>
    </>
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