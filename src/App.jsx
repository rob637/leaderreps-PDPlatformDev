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
  EmailAuthProvider,
  linkWithCredential,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

import {
  allBooks, SECRET_SIGNUP_CODE, IconMap, LEADERSHIP_TIERS, PDP_COLLECTION, PDP_DOCUMENT
} from './data/Constants';
import { usePDPData, useCommitmentData, usePlanningData } from './firebase/Hooks';

// ESM-safe on Netlify/Linux
import { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY } from './utils/ApiHelpers.js';

// Screens
import DashboardScreen, { QuickStartScreen, AppSettingsScreen } from './components/screens/Dashboard';
import ProfDevPlanScreen from './components/screens/DevPlan';
import Labs from './components/screens/Labs';
import DailyPracticeScreen from './components/screens/DailyPractice.jsx';
import PlanningHubScreen from './components/screens/PlanningHub.jsx';
import BusinessReadingsScreen from './components/screens/BusinessReadings.jsx';

// Icons used in the new NavSidebar
import { Home, Zap, ShieldCheck, TrendingUp, Mic, BookOpen, Settings, X, Menu, LogOut, CornerRightUp, Clock, Briefcase, Target, Users, BarChart3, HeartPulse } from 'lucide-react';

const CoachingLabScreen = Labs;

/* =========================================================
   STEP 1: SANITY SWITCH
========================================================= */
const SANITY_MODE = false;

/* =========================================================
   CONTEXT + SAFE DEFAULTS
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
  hasGeminiKey: () => false,
  GEMINI_MODEL,
  API_KEY,
};
export const useAppServices = () => useContext(AppServiceContext) ?? DEFAULT_SERVICES;

// Optional App ID for Firestore pathing
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Set to false for real login; true bypasses auth (dev only)
const DEBUG_MODE = false;

/* =========================================================
   DATA PROVIDER
========================================================= */
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

/* =========================================================
   LOGIN PANEL (Email/Password + optional Guest)
========================================================= */
function LoginPanel({ auth, onSuccess, allowAnonymous = false }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [invite, setInvite] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

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
      // FIX: Only attempt to link if the current user is anonymous.
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
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-6 space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">
          {mode === 'signin' && 'Sign in'}
          {mode === 'signup' && 'Create your account'}
          {mode === 'reset'  && 'Reset password'}
        </h1>

        {err && (
          <div className="text-sm rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 p-3">{err}</div>
        )}

        <form onSubmit={mode === 'signin' ? handleSignIn : mode === 'signup' ? handleSignUp : handleReset} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-700">Email</label>
            <input type="email" className="mt-1 w-full border rounded-md px-3 py-2"
                   value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>

          {mode !== 'reset' && (
            <div>
              <label className="block text-sm text-gray-700">Password</label>
              <input type="password" className="mt-1 w-full border rounded-md px-3 py-2"
                     value={pass} onChange={(e) => setPass(e.target.value)} required
                     autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            </div>
          )}

          {mode === 'signup' && SECRET_SIGNUP_CODE && (
            <div>
              <label className="block text-sm text-gray-700">Invite code</label>
              <input type="text" className="mt-1 w-full border rounded-md px-3 py-2"
                     value={invite} onChange={(e) => setInvite(e.target.value)} placeholder="Enter invite code" required />
            </div>
          )}

          <button type="submit" disabled={busy}
                  className="w-full rounded-md bg-emerald-600 text-white py-2 font-medium hover:bg-emerald-700 disabled:opacity-60">
            {busy ? 'Please wait…' : (mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link')}
          </button>
        </form>

        <div className="text-xs text-gray-600 flex justify-between">
          {mode !== 'reset'
            ? <button className="underline" onClick={() => setMode('reset')}>Forgot password?</button>
            : <button className="underline" onClick={() => setMode('signin')}>Back to sign in</button>}
          {mode === 'signin'
            ? <button className="underline" onClick={() => setMode('signup')}>Need an account?</button>
            : mode === 'signup'
              ? <button className="underline" onClick={() => setMode('signin')}>Have an account?</button>
              : null}
        </div>

        {allowAnonymous && (
          <button onClick={handleAnonymous} disabled={busy}
                  className="w-full mt-2 rounded-md border border-gray-300 py-2 font-medium hover:bg-gray-50 disabled:opacity-60">
            Continue as guest
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   DEBUG OVERLAY (?debug=1)
========================================================= */
function DebugOverlay({ stage, authRequired, isAuthReady, user, userId, initError }) {
  const show = typeof window !== 'undefined' && /[?&]debug=1/.test(window.location.search);
  if (!show) return null;
  return (
    <div className="fixed bottom-2 right-2 bg-black/80 text-white text-xs rounded-lg p-2 space-y-1 z-50">
      <div><span className="font-semibold">stage:</span> {stage}</div>
      <div><span className="font-semibold">authRequired:</span> {String(authRequired)}</div>
      <div><span className="font-semibold">isAuthReady:</span> {String(isAuthReady)}</div>
      <div><span className="font-semibold">userId:</span> {userId || '—'}</div>
      <div><span className="font-semibold">email:</span> {user?.email || '—'}</div>
      {initError && <div className="text-red-300 max-w-xs break-words">initError: {initError}</div>}
    </div>
  );
}

/* =========================================================
   CONFIG ERROR SCREEN
========================================================= */
function ConfigError({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow p-6 space-y-3 border border-red-200">
        <h1 className="text-lg font-semibold text-red-700">Firebase configuration error</h1>
        <p className="text-sm text-red-700">{message || 'Missing or invalid VITE_FIREBASE_CONFIG.'}</p>
        <ol className="text-sm list-decimal pl-5 space-y-1">
          <li>Netlify → <em>Site settings → Build &amp; deploy → Environment</em> → set <code>VITE_FIREBASE_CONFIG</code> (single-line JSON).</li>
          <li>In <code>src/main.jsx</code>, inject before importing App:
            <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto">{`const raw = import.meta.env.VITE_FIREBASE_CONFIG;
if (raw) { window.__firebase_config = JSON.parse(raw); }`}</pre>
          </li>
          <li>Firebase Console → Auth → Settings → add your Netlify domain to **Authorized domains**.</li>
        </ol>
      </div>
    </div>
  );
}

/* =========================================================
   NAV ITEM (Sub-component for NavSidebar)
========================================================= */
// NavItem: true button semantics
const NavItem = ({ name, icon: Icon, currentScreen, onClick }) => {
    const isActive = currentScreen === name;
    const baseStyle = "w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-all duration-200";
    
    // FIX: Updated inactive style for high visibility and contrast
    // Active style uses background from Accent 1 hover and text from Navy (#002E47)
    const activeStyle = "bg-[#47A88D] text-[#002E47] font-semibold shadow-md";
    // Inactive style uses a light indigo color for visibility and hover for dark background
    const inactiveStyle = "text-indigo-200 hover:bg-[#47A88D]/20 hover:text-white"; 

    const displayName = name.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return (
        <button
            type="button"
            className={`${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
            onClick={() => onClick(name)}
            aria-current={isActive ? 'page' : undefined}
        >
            <Icon className="w-5 h-5" />
            <span className="text-sm">{item.label || displayName}</span>
        </button>
    );
};


/* =========================================================
   NAV SIDEBAR (NEW IMPLEMENTATION)
========================================================= */
const NavSidebar = ({ currentScreen, setCurrentScreen, user, isMobileOpen, closeMobileMenu }) => {
    const { auth } = useAppServices();

    // 1. CORE
    const coreNav = [
        { screen: 'dashboard', label: 'Dashboard', icon: Home },
    ];
    
    // 2. TOOLS & HUBS (Consolidated)
    const toolsHubsNav = [
        { screen: 'prof-dev-plan', label: 'Development Plan', icon: ShieldCheck },
        { screen: 'daily-practice', label: 'Daily Practice', icon: Mic },
        { screen: 'planning-hub', label: 'Planning Hub (OKRs)', icon: TrendingUp },
        { screen: 'business-readings', label: 'Business Readings', icon: BookOpen },
        { screen: 'coaching-lab', label: 'Coaching Lab', icon: Zap },
    ];
    
    // 3. SYSTEM
    const systemNav = [
        { screen: 'quick-start-accelerator', label: 'QuickStart Accelerator', icon: Target },
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
            return (
                <button
                    key={item.screen}
                    onClick={() => handleNavigate(item.screen)}
                    className={`flex items-center w-full px-4 py-3 rounded-xl font-medium transition-colors ${
                        // FIX: Ensure active text uses the dark color for high contrast
                        isActive
                            ? 'bg-[#47A88D] text-[#002E47] shadow-md'
                            // FIX: Ensure inactive text uses a visible light color (indigo-200)
                            : 'text-indigo-200 hover:bg-[#47A88D]/20 hover:text-white'
                    }`}
                >
                    <Icon className="w-5 h-5 mr-3" />
                    <span>{item.label}</span>
                </button>
            );
        })
    );

    // --- Mobile Overlay and Menu (Full Screen on small screens) ---
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
                
                <nav className="space-y-4">
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

    // --- Desktop Sidebar ---
    return (
        <div className="hidden md:flex flex-col w-64 min-h-screen bg-[#002E47] text-white p-4 shadow-2xl sticky top-0">
            <div className="flex items-center justify-center h-16 border-b border-[#47A88D]/50 mb-6">
                <h1 className="text-2xl font-extrabold flex items-center">
                    <CornerRightUp className="w-7 h-7 mr-2 text-[#47A88D]" /> LeaderReps
                </h1>
            </div>

            <nav className="flex-1 space-y-4">
                {menuSections.map(section => (
                    <div key={section.title} className='space-y-2'>
                        <p className='text-xs font-semibold uppercase text-indigo-300 mb-1'>{section.title}</p>
                        {renderNavItems(section.items)}
                    </div>
                ))}
            </nav>

            <div className="pt-4 border-t border-[#47A88D]/50 mt-4">
                <p className='text-xs text-gray-400 mb-2 truncate' title={user?.email || user?.userId}>
                    {user?.email || user?.userId}
                </p>
                 <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 rounded-xl text-sm font-medium transition-colors bg-[#E04E1B] text-white hover:bg-red-700"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </button>
            </div>
        </div>
    );
};


/* =========================================================
   MAIN APP (REAL)
========================================================= */
const App = ({ initialState }) => {
  console.log('Boot', {
    hasConfig: typeof window !== 'undefined' && !!window.__firebase_config,
    configKeys: typeof window !== 'undefined' && window.__firebase_config ? Object.keys(window.__firebase_config) : [],
    DEBUG_MODE,
  });

  const [user, setUser] = useState(
    DEBUG_MODE ? { name: 'Debugger', userId: 'mock-debugger-123', email: 'debug@leaderreps.com' } : null
  );
  const [currentScreen, setCurrentScreen] = useState(initialState?.screen || 'dashboard');
  const [firebaseServices, setFirebaseServices] = useState({ db: null, auth: null });
  const [userId, setUserId] = useState(DEBUG_MODE ? 'mock-debugger-123' : null);
  const [isAuthReady, setIsAuthReady] = useState(DEBUG_MODE);
  const [navParams, setNavParams] = useState(initialState?.params || {});
  const [authRequired, setAuthRequired] = useState(!DEBUG_MODE);

  const [initStage, setInitStage] = useState('init'); // 'init' | 'ok' | 'error'
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
  firebaseConfig = (typeof cfg === 'string') ? JSON.parse(cfg) : cfg; // <-- handles both
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

  // Auth Gate (only when not in DEBUG)
  if (!DEBUG_MODE) {
    if (initStage === 'init') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-3"></div>
            <p className="text-emerald-700 font-medium">Initializing Authentication…</p>
          </div>
        </div>
      );
    }
    if (initStage === 'error') {
      return (
        <>
          <ConfigError message={initError} />
          <DebugOverlay stage={initStage} authRequired={authRequired} isAuthReady={isAuthReady} user={user} userId={userId} initError={initError} />
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
          <DebugOverlay stage={initStage} authRequired={authRequired} isAuthReady={isAuthReady} user={user} userId={userId} />
        </>
      );
    }
  }

  // App (DEBUG or signed-in)
  return (
    <>
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
      <DebugOverlay stage={initStage} authRequired={authRequired} isAuthReady={isAuthReady} user={user} userId={userId} />
    </>
  );
};

/* =========================================================
   LAYOUT + ROUTER
========================================================= */
const AppContent = ({ currentScreen, setCurrentScreen, user, navParams }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false); // State for mobile menu

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
                {/* Mobile Header/Menu Button */}
                <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-40">
                    <h1 className="text-xl font-bold text-[#002E47]">LeaderReps</h1>
                    <button onClick={() => setIsMobileOpen(true)} className="p-2 text-[#002E47] hover:text-[#47A88D]">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
                {/* Screen Content */}
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

/* =========================================================
   DEFAULT EXPORT WRAPPER (SANITY vs FULL APP)
========================================================= */
export default function Root(props) {
  const forceSanity = typeof window !== 'undefined' && /[?&]sanity=1/.test(window.location.search);
  if (SANITY_MODE || forceSanity) {
    return (
      <div style={{ padding: 32, fontSize: 18, lineHeight: 1.4 }}>
        <div>✅ <strong>React mounted</strong></div>
        <div style={{ marginTop: 8, fontSize: 14, color: '#555' }}>
          Turn off the test screen by setting <code>SANITY_MODE = false</code> in <code>src/App.jsx</code>,<br />
          or remove <code>?sanity=1</code> from the URL.
        </div>
      </div>
    );
  }
  return <App {...props} />;
}
