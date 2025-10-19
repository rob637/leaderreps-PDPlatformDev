import './globals/notepad.js';
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
  sendSignInLinkToEmail,
  updateProfile // <-- IMPORTED FOR NAME UPDATE
} from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

import {
  allBooks, SECRET_SIGNUP_CODE, IconMap, LEADERSHIP_TIERS, PDP_COLLECTION, PDP_DOCUMENT
} from './data/Constants';
import { usePDPData, useCommitmentData, usePlanningData } from './firebase/Hooks';

// ESM-safe on Netlify/Linux
import { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY } from './utils/ApiHelpers.js';

/* =========================================================
   MOCK GLOBAL UTILITIES (To satisfy external component dependencies)
========================================================= */
if (typeof window !== 'undefined' && typeof window.notepad === 'undefined') {
    if (typeof window !== 'undefined' && !window.notepad) window.notepad = { 
        // Mock the essential functions needed to avoid crashes
        setTitle: (title) => console.log('Mock Notepad: Set Title', title),
        addContent: (content) => console.log('Mock Notepad: Add Content', content),
        getContent: () => console.log('Mock Notepad: Get Content'),
    };
}

// Screens
import DashboardScreen from './components/screens/Dashboard.jsx'; 
import ProfDevPlanScreen from './components/screens/DevPlan';
import Labs from './components/screens/Labs';
import DailyPracticeScreen from './components/screens/DailyPractice.jsx';
import PlanningHubScreen from './components/screens/PlanningHub.jsx';
import BusinessReadingsScreen from './components/screens/BusinessReadings.jsx';
import QuickStartAcceleratorScreen from './components/screens/QuickStartAccelerator.jsx'; // <-- NEW IMPORT

// Icons used in the new NavSidebar
import { Home, Zap, ShieldCheck, TrendingUp, Mic, BookOpen, Settings, X, Menu, LogOut, CornerRightUp, Clock, Briefcase, Target, Users, BarChart3, HeartPulse, User, Bell, Trello, CalendarClock } from 'lucide-react';
const notepad = (typeof globalThis !== 'undefined' ? globalThis.notepad : (typeof window !== 'undefined' ? window.notepad : undefined));

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

  // NEW: Calculate notification status for Daily Practice
  const hasPendingDailyPractice = useMemo(() => {
    const active = commitment.commitmentData?.active_commitments || [];
    const isPending = active.some(c => c.status === 'Pending');
    const reflectionMissing = !commitment.commitmentData?.reflection_journal?.trim();
    // Show notification if any commitment is pending OR reflection is missing
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
    IconMap,
    callSecureGeminiAPI,
    hasSecureGeminiAPI: hasGeminiKey,
    GEMINI_MODEL,
    API_KEY,
    // NEW: Expose Notification status
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
   AUTHENTICATION SCREENS (NEW MODULAR ROUTER)
========================================================= */

// Special admin user email for the always-working login mock
const ADMIN_EMAIL = "admin@leaderreps.com"; 

// 1. LOGIN SCREEN
function LoginScreen({ auth, setAuthView, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    const trimmedEmail = email.trim();
    
    // 5. Special Admin Login Mock
    if (trimmedEmail === ADMIN_EMAIL && password === "adminpass") {
         setBusy(false);
         // Mock successful admin sign-in state
         onSuccess({ email: ADMIN_EMAIL, userId: "admin-uid-1234", name: "Admin Leader" }); 
         return;
    }

    try {
        await signInWithEmailAndPassword(auth, trimmedEmail, password); 
        // Success handled by onAuthStateChanged
    }
    catch (ex) { 
        setErr(ex.message || 'Sign in failed. Check your email/password.'); 
    }
    finally { setBusy(false); }
  };
  
  // 6. Passwordless / Email Link Login
  const handleEmailLink = async () => {
    setErr(''); setBusy(true);
    const actionCodeSettings = {
        url: window.location.origin, // Use the current origin for redirect
        handleCodeInApp: true,
    };
    
    try {
        await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
        localStorage.setItem('emailForSignIn', email.trim());
        setErr('Success! Check your email inbox for the sign-in link.');
    } catch (ex) {
        setErr('Failed to send link. Please check your email address.');
    } finally {
        setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
      <h1 className="text-2xl font-bold text-[#002E47]">Sign In</h1>
      {err && <div className="text-sm rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 p-3">{err}</div>}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#47A88D] focus:border-[#47A88D]"
                 value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-[#47A88D] focus:border-[#47A88D]"
                 value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>

        <button type="submit" disabled={busy}
                className="w-full rounded-lg bg-[#47A88D] text-white py-3 font-semibold hover:bg-[#3C937A] transition-colors disabled:opacity-60 shadow-lg">
          {busy ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="text-xs text-gray-600 flex justify-between pt-2 border-t border-gray-100">
        <button className="underline hover:text-[#002E47]" onClick={() => setAuthView('reset')}>Lost password?</button>
        <button className="underline hover:text-[#002E47]" onClick={() => setAuthView('signup')}>Need an account?</button>
      </div>

      <div className="text-center pt-2">
         <button className="text-xs text-gray-500 hover:text-[#E04E1B] font-medium" onClick={handleEmailLink} disabled={!email || busy}>
            Or: Get Passwordless Link to Email
         </button>
      </div>
    </div>
  );
}

// 2. SIGN UP SCREEN (Invitation & Name Capture)
function SignUpScreen({ auth, setAuthView }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setErr('');
        
        if (SECRET_SIGNUP_CODE && code !== String(SECRET_SIGNUP_CODE)) {
            setErr('Invalid Invitation Code.'); return;
        }

        setBusy(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            
            // 3. CAPTURE NAME AND UPDATE FIREBASE PROFILE
            if (userCredential.user) {
                await updateProfile(userCredential.user, {
                    displayName: name.trim(),
                });
                
                // Manually trigger success to hasten the UI transition with the name
                onSuccess({ email: email.trim(), userId: userCredential.user.uid, name: name.trim() });
            }
            
        } catch (ex) { 
            setErr(ex.message || 'Sign up failed.'); 
        }
        finally { setBusy(false); }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            <h1 className="text-2xl font-bold text-[#002E47]">Create Account</h1>
            {err && <div className="text-sm rounded-md bg-yellow-50 text-yellow-800 border border-yellow-200 p-3">{err}</div>}

            <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                           value={name} onChange={(e) => setName(e.target.value)} required placeholder="Used for 'Welcome back, [Name]'" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                           value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Password (min 6 characters)</label>
                    <input type="password" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                           value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Invitation Code</label>
                    <input type="text" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                           value={code} onChange={(e) => setCode(e.target.value)} required placeholder="Check your invitation email" />
                </div>

                <button type="submit" disabled={busy}
                        className="w-full rounded-lg bg-[#E04E1B] text-white py-3 font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 shadow-lg">
                    {busy ? 'Creating Account...' : 'Create Account'}
                </button>
            </form>

            <div className="text-center pt-2">
                <button className="underline hover:text-[#002E47] text-sm" onClick={() => setAuthView('login')}>Back to sign in</button>
            </div>
        </div>
    );
}

// 3. PASSWORD RESET SCREEN
function PasswordResetScreen({ auth, setAuthView }) {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSending(true);
        
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent! Check your inbox.');
        } catch (err) {
            setError('Failed to send reset email. Ensure the address is correct.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 space-y-6">
            <h1 className="text-2xl font-bold text-[#002E47]">Reset Password</h1>
            <p className="text-sm text-gray-600">Enter your email to receive a password reset link.</p>
            
            <form onSubmit={handleReset} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                           value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>

                {message && <p className="text-sm text-green-600 bg-green-100 p-2 rounded-lg">{message}</p>}
                {error && <p className="text-sm text-[#E04E1B] bg-[#E04E1B]/10 p-2 rounded-lg">{error}</p>}

                <button type="submit" disabled={!email || isSending}
                        className="w-full rounded-lg bg-[#2563EB] text-white py-3 font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 shadow-lg">
                    {isSending ? 'Sending Link...' : 'Send Reset Link'}
                </button>
            </form>
            
            <div className="text-center pt-2">
                <button className="underline hover:text-[#002E47] text-sm" onClick={() => setAuthView('login')}>Back to Sign In</button>
            </div>
        </div>
    );
}

// Main Authentication Router Container
const LoginScreenContainer = ({ auth, onSuccess }) => {
    const [view, setView] = useState('login');

    const renderView = () => {
        switch(view) {
            case 'signup':
                return <SignUpScreen auth={auth} setAuthView={setView} onSuccess={onSuccess} />;
            case 'reset':
                return <PasswordResetScreen auth={auth} setAuthView={setView} />;
            case 'login':
            default:
                return <LoginScreen auth={auth} setAuthView={setView} onSuccess={onSuccess} />;
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            {renderView()}
        </div>
    );
};
// END NEW AUTH FLOW COMPONENTS

/* =========================================================
   DEBUG OVERLAY, CONFIG ERROR, AND SIDEBAR (MOCK)
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

const NavSidebar = ({ currentScreen, setCurrentScreen, user, isMobileOpen, closeMobileMenu }) => {
    const { auth, hasPendingDailyPractice } = useAppServices();
    const [isProfileOpen, setIsProfileOpen] = useState(false); // NEW: Profile Flyout state

    // 1. CORE NAVIGATION (Prioritizing high-frequency tools)
    const coreNav = [
        { screen: 'dashboard', label: 'Dashboard', icon: Home },
        { screen: 'quick-start-accelerator', label: 'QuickStart Accelerator', icon: Zap, badge: 'New' },
        { screen: 'daily-practice', label: 'Daily Practice', icon: Clock, notify: hasPendingDailyPractice }, 
    ];
    
    // 2. TOOLS & HUBS (Consolidated)
    const toolsHubsNav = [
        { screen: 'prof-dev-plan', label: 'Development Plan', icon: Briefcase },
        { screen: 'coaching-lab', label: 'Coaching Lab', icon: Mic },
        { screen: 'planning-hub', label: 'Planning Hub (OKRs)', icon: Trello }, 
        { screen: 'business-readings', label: 'Business Readings', icon: BookOpen },
    ];
    
    // 3. SYSTEM
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
            const isNotifying = item.notify;
            
            return (
                <button
                    key={item.screen}
                    onClick={() => handleNavigate(item.screen)}
                    className={`flex items-center w-full px-4 py-3 rounded-xl font-semibold relative transition-colors duration-200 ${
                        isActive
                            ? 'bg-[#47A88D] text-[#002E47] shadow-lg'
                            : 'text-indigo-200 hover:bg-[#47A88D]/20 hover:text-white'
                    }`}
                >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="flex-1 text-left">{item.label}</span>
                    
                    {item.badge && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-[#E04E1B] text-white">
                            {item.badge}
                        </span>
                    )}

                    {isNotifying && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 bg-[#E04E1B] rounded-full ring-2 ring-white" />
                    )}
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
                    <div key={section.title} className='space-y-3'>
                        <p className='text-xs font-semibold uppercase tracking-wider text-indigo-300 pl-4 mb-1'>{section.title}</p>
                        <div className="space-y-1">
                            {renderNavItems(section.items)}
                        </div>
                    </div>
                ))}
            </nav>

            {/* NEW: Profile Flyout/Footer - Improved style */}
            <div className="pt-4 border-t border-[#47A88D]/50 mt-4 relative">
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    className="flex items-center w-full p-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[#47A88D]/20 focus:outline-none focus:ring-2 focus:ring-[#47A88D]"
                >
                    <User className="w-5 h-5 mr-3 text-indigo-300" />
                    <span className='truncate'>{user?.email || 'User Profile'}</span>
                </button>
                
                {/* Profile Flyout (Mocked) */}
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

/* =========================================================
   MOCK COMPONENTS FOR DASHBOARD.JSX EXPORTS
========================================================= */

const AppSettingsScreen = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold text-[#002E47]">App Settings</h1>
        <p className="mt-2 text-gray-600">
            This screen is a placeholder. User and API settings configuration goes here.
        </p>
    </div>
);

/* =========================================================
   LAYOUT + ROUTER
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
      return <QuickStartAcceleratorScreen />;
    case 'app-settings':
      return <AppSettingsScreen />;
    case 'dashboard':
    default:
      return <DashboardScreen />;
  }
};

/* =========================================================
   AUTHENTICATION WRAPPER
========================================================= */
function AppWrapper(props) {
  const firebaseConfig = typeof window !== 'undefined' ? window.__firebase_config : null;
  const hasConfig = !!firebaseConfig;

  if (!hasConfig) {
      return <ConfigError message="VITE_FIREBASE_CONFIG environment variable is not defined or is invalid." />;
  }

  // --- Firebase Initialization ---
  const firebaseApp = useMemo(() => initializeApp(firebaseConfig), [firebaseConfig]);
  const auth = useMemo(() => getAuth(firebaseApp), [firebaseApp]);
  const db = useMemo(() => {
    // Set Firestore log level during development
    if (DEBUG_MODE) setLogLevel('debug');
    return getFirestore(firebaseApp);
  }, [firebaseApp]);

  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [navParams, setNavParams] = useState({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  // --- Auth State Listener ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      // NOTE: User object now stores the name for "Welcome back, [Name]"
      const userName = (authUser?.displayName || authUser?.email?.split('@')[0] || 'User');

      setUser(authUser ? { 
          email: authUser.email, 
          userId: authUser.uid, 
          isAnonymous: authUser.isAnonymous,
          name: userName, // Use the name capture or email prefix
        } : null);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, [auth]);

  // --- Router/Navigation Function ---
  const navigate = useCallback((screen, params = {}) => {
    setCurrentScreen(screen);
    setNavParams(params);
  }, []);

  const firebaseServices = useMemo(() => ({ auth, db }), [auth, db]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
      </div>
    );
  }

  // --- Check Auth Status ---
  if (!user && !DEBUG_MODE) {
    return (
      <LoginScreenContainer 
        auth={auth} 
        // Mock the user update when the Admin mock or Email/Pass succeeds
        onSuccess={(mockUser) => {
             if(mockUser) setUser(mockUser);
        }}
      />
    );
  }
  
  // Default user object for anonymous/signed-in state
  const userProps = user || { email: 'guest@leaderreps.com', userId: 'anonymous-user', isAnonymous: true, name: 'Guest' };

  return (
    <DataProvider 
      firebaseServices={firebaseServices} 
      userId={userProps.userId} 
      isAuthReady={isAuthReady} 
      navigate={navigate} 
      user={userProps}
    >
      <AppContent 
        currentScreen={currentScreen} 
        setCurrentScreen={navigate} 
        user={userProps}
        navParams={navParams}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />
      <DebugOverlay stage="App Rendered" authRequired={!DEBUG_MODE} isAuthReady={isAuthReady} user={user} userId={userProps.userId} initError={null} />
    </DataProvider>
  );
}

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
  return <AppWrapper {...props} />;
}
