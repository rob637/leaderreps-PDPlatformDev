// src/App.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  createContext,
  useContext,
  Suspense,
  lazy,
} from 'react';

// =========================================================
// !!! CRITICAL FIX: Split Firebase imports into correct modules !!!
// =========================================================

// 1. CORE APP IMPORTS
import {
  initializeApp, // <- MOVED HERE from 'firebase/auth'
  getApp        // <- MOVED HERE from 'firebase/auth'
} from 'firebase/app'; 


// 2. AUTHENTICATION IMPORTS
import { 
  getAuth, 
  onAuthStateChanged, 
  // REMOVED: signInWithCustomToken, // NO LONGER USED
  // signInAnonymously, // REMOVED: No longer using anonymous flow
  signOut,
  // ADDED: For Email/Password and account management
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  // GoogleAuthProvider, // Keep this if you use it in other components
} from 'firebase/auth';

// 3. FIRESTORE IMPORTS (This was already correct)
import { getFirestore, setLogLevel } from 'firebase/firestore'; 

// =========================================================

// =========================================================
// --- EXISTING MOCK/PLACEHOLDER DEFINITIONS (Keep these) ---
// NOTE: These are local mocks/placeholders needed for the component definitions
const IconMap = {}; 
const SECRET_SIGNUP_CODE = 'mock-code-123';
const PDP_COLLECTION = 'leadership_plan';
const PDP_DOCUMENT = 'roadmap';
const LEADERSHIP_TIERS = {};
const usePDPData = (db, userId, isAuthReady) => ({pdpData: {assessment:{selfRatings:{T3: 6}}}, isLoading: false, error: null, updatePdpData: async () => true, saveNewPlan: async () => true});
const useCommitmentData = (db, userId, isAuthReady) => ({commitmentData: {active_commitments: []}, isLoading: false, error: null, updateCommitmentData: async () => true});
const usePlanningData = (db, userId, isAuthReady) => ({planningData: {okrs: []}, isLoading: false, error: null, updatePlanningData: async () => true});

// --- PRODUCTION GEMINI CONFIGURATION (Keep this) ---
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = (typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : ''); 

/**
 * Executes an authenticated request to the Gemini API.
 * This function is critical for all AI-powered features (Flyer, Coach).
 * Implements exponential backoff for network resilience.
 */
const callSecureGeminiAPI = async (payload, maxRetries = 3, delay = 1000) => {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing or invalid. Check environment configuration.");
    }
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                return response.json();
            }

            // Handle API specific errors (like 429 Rate Limit or 5xx)
            if (response.status === 429 || response.status >= 500) {
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
                    continue; // Retry
                }
            }

            // Throw non-retryable errors
            const errorBody = await response.text();
            throw new Error(`API Request Failed: HTTP ${response.status} - ${errorBody}`);

        } catch (error) {
            if (attempt === maxRetries - 1) {
                 throw new Error(`Network Error after ${maxRetries} attempts: ${error.message}`);
            }
            // Non-HTTP errors (network issues) are retried with backoff
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
    }
};

/**
 * Validates if the Gemini API Key is loaded.
 */
const hasGeminiKey = () => (!!API_KEY);

// --- END PRODUCTION GEMINI CONFIGURATION ---


// Icons used in the new NavSidebar
import { Home, Zap, ShieldCheck, TrendingUp, Mic, BookOpen, Settings, X, Menu, LogOut, CornerRightUp, Clock, Briefcase, Target, Users, BarChart3, HeartPulse, User, Bell, Trello, CalendarClock, Globe } from 'lucide-react';

// FIX: Setting up a global mock for notepad since components rely on it
if (typeof window !== 'undefined' && typeof window.notepad === 'undefined') {
    window.notepad = { 
        setTitle: (title) => console.log('Mock Notepad: Set Title', title),
        addContent: (content) => console.log('Mock Notepad: Add Content', content),
        getContent: () => console.log('Mock Notepad: Get Content'),
    };
}
const notepad = (typeof globalThis !== 'undefined' ? globalThis.notepad : (typeof window !== 'undefined' ? window.notepad : undefined));


// --- GLOBAL COLOR PALETTE (World-Class Aesthetic) ---
const COLORS = {
  NAVY: '#002E47',      
  TEAL: '#47A88D',      
  SUBTLE_TEAL: '#349881', 
  ORANGE: '#E04E1B',    
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF', 
};


/* =========================================================
   STEP 1: LAZY LOAD SCREEN COMPONENTS
========================================================= */
const DashboardScreen = lazy(() => import('./components/screens/Dashboard.jsx')); 
const ProfDevPlanScreen = lazy(() => import('./components/screens/DevPlan'));
const CoachingLabScreen = lazy(() => import('./components/screens/Labs'));
const DailyPracticeScreen = lazy(() => import('./components/screens/DailyPractice.jsx'));
const PlanningHubScreen = lazy(() => import('./components/screens/PlanningHub.jsx'));
const BusinessReadingsScreen = lazy(() => import('./components/screens/BusinessReadings.jsx'));
const QuickStartScreen = lazy(() => import('./components/screens/QuickStartAccelerator.jsx')); 
const ExecutiveReflection = lazy(() => import('./components/screens/ExecutiveReflection.jsx'));
// NEW MODULE: Community
const CommunityScreen = lazy(() => import('./components/screens/CommunityScreen.jsx'));
// NEW MODULE: Applied Leadership - Added this lazy load
const AppliedLeadershipScreen = lazy(() => import('./components/screens/AppliedLeadership.jsx')); 


/* =========================================================
   STEP 2: MOCK/PLACEHOLDER COMPONENTS
========================================================= */

const AppSettingsScreen = () => (
    <div className="p-8">
        <h1 className="text-3xl font-extrabold text-[#002E47]">App Settings</h1>
        <p className="mt-2 text-gray-600">
            Placeholder for user and API settings configuration.
        </p>
    </div>
);


/* =========================================================
   STEP 3: CONTEXT + DATA PROVIDER
========================================================= */

const AppServiceContext = createContext(null);
const DEFAULT_SERVICES = {
  navigate: () => {}, user: null, db: null, auth: null, userId: null, isAuthReady: false,
  updatePdpData: () => {}, saveNewPlan: () => {}, updateCommitmentData: () => {}, updatePlanningData: () => {},
  pdpData: null, commitmentData: null, planningData: null, isLoading: false, error: null,
  appId: 'default-app-id', IconMap: {}, callSecureGeminiAPI: async () => { throw new Error('Gemini not configured.'); },
  hasGeminiKey: () => false, GEMINI_MODEL, API_KEY,
};
export const useAppServices = () => useContext(AppServiceContext) ?? DEFAULT_SERVICES;

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
// NOTE: DEBUG_MODE is set to FALSE to ensure we use the real Firebase imports/logic
const DEBUG_MODE = false;

const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
  const { db } = firebaseServices;

  const pdp = usePDPData(db, userId, isAuthReady);
  const commitment = useCommitmentData(db, userId, isAuthReady);
  const planning = usePlanningData(db, userId, isAuthReady);

  const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading;
  const error = pdp.error || commitment.error || planning.error;

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
    IconMap: IconMap,
    callSecureGeminiAPI, 
    hasGeminiKey,       
    GEMINI_MODEL,
    API_KEY,
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

function ConfigError({ message }) { /* ... */ return null; }

// REPLACED: AnonymousLoginPanel is now the comprehensive AuthPanel
function AuthPanel({ auth, onSuccess, setInitStage, navigate }) {
    const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Constants from App.jsx
    const NAVY = COLORS.NAVY;
    const TEAL = COLORS.TEAL;
    const ORANGE = COLORS.ORANGE;
    const SECRET_SIGNUP_CODE = 'mock-code-123'; // Copied from top of file

    const handleAction = async () => {
        if (!auth || isLoading) return;
        setIsLoading(true);
        setStatusMessage('');

        try {
            if (mode === 'login') {
                // CRITICAL: Call Email/Password Sign-in
                await signInWithEmailAndPassword(auth, email, password);
                // Success is handled by the onAuthStateChanged listener in App.jsx
                console.log('Sign-in successful. Waiting for state update.');
            } else if (mode === 'signup') {
                if (secretCode !== SECRET_SIGNUP_CODE) {
                    throw new Error('Invalid secret sign-up code.');
                }
                // CRITICAL: Call Create User
                await createUserWithEmailAndPassword(auth, email, password);
                // Success is handled by the onAuthStateChanged listener
                console.log('Sign-up successful. Waiting for state update.');
            } else if (mode === 'reset') {
                // CRITICAL: Call Password Reset
                await sendPasswordResetEmail(auth, email);
                setStatusMessage('Password reset email sent. Check your inbox.');
                setMode('login'); // Go back to login after sending
            }
        } catch (error) {
            console.error(`${mode} failed:`, error);
            const msg = error.message.replace(/Firebase:/g, '').replace('Error (auth/', '').replace(').', '').trim();
            setStatusMessage(msg || `An error occurred during ${mode}.`);
        } finally {
            setIsLoading(false);
        }
    };

    const renderForm = () => {
        const isLogin = mode === 'login';
        const isSignUp = mode === 'signup';
        const isReset = mode === 'reset';

        return (
            <div className='space-y-4'>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`}
                    disabled={isLoading}
                />
                
                {!isReset && (
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`}
                        disabled={isLoading}
                    />
                )}

                {isSignUp && (
                    <input
                        type="text"
                        placeholder="Secret Sign-up Code"
                        value={secretCode}
                        onChange={(e) => setSecretCode(e.target.value)}
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`}
                        disabled={isLoading}
                    />
                )}
                
                <button
                    onClick={handleAction}
                    disabled={isLoading || !email || (!isReset && !password) || (isSignUp && !secretCode)}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-colors 
                        ${isLoading || !email || (!isReset && !password) || (isSignUp && !secretCode)
                            ? 'bg-gray-400 cursor-not-allowed'
                            : `bg-[${TEAL}] hover:bg-[${NAVY}]`
                        }
                    `}
                >
                    {isLoading ? 'Processing...' : (
                        isLogin ? 'Sign In' : isSignUp ? 'Sign Up' : 'Send Reset Email'
                    )}
                </button>
                
                {statusMessage && (
                    <p className={`text-sm text-center font-medium mt-3 ${statusMessage.includes('sent') ? `text-[${TEAL}]` : `text-[${ORANGE}]`}`}>
                        {statusMessage}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-8 bg-white rounded-xl shadow-2xl text-center w-full max-w-sm border-t-4 border-[${TEAL}]">
                <h2 className="text-2xl font-extrabold text-[${NAVY}] mb-4">
                    {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
                </h2>
                <p className='text-sm text-gray-600 mb-6'>
                    {mode === 'reset' ? 'Enter your email to receive a password reset link.' : 'Log in to access your leadership development platform.'}
                </p>
                
                {renderForm()}
                
                <div className='mt-6 border-t pt-4 border-gray-200 space-y-2'>
                    {mode !== 'signup' && (
                        <button 
                            onClick={() => { setMode('signup'); setStatusMessage(''); }} 
                            className={`text-sm text-[${TEAL}] hover:text-[${NAVY}] font-semibold block w-full`}
                        >
                            Need an account? Sign up
                        </button>
                    )}
                    {mode !== 'login' && (
                        <button 
                            onClick={() => { setMode('login'); setStatusMessage(''); }} 
                            className="text-sm text-gray-500 hover:text-[${NAVY}] block w-full"
                        >
                            Back to Sign In
                        </button>
                    )}
                    {mode === 'login' && (
                        <button 
                            onClick={() => { setMode('reset'); setStatusMessage(''); }} 
                            className={`text-sm text-gray-500 hover:text-[${ORANGE}] block w-full`}
                        >
                            Forgot Password?
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}


const NavSidebar = ({ currentScreen, setCurrentScreen, user, isMobileOpen, closeMobileMenu, isAuthRequired }) => {
    const { auth, hasPendingDailyPractice } = useAppServices();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const NAVY = COLORS.NAVY;
    const TEAL = COLORS.TEAL;
    const ORANGE = COLORS.ORANGE;

    // FINAL NAVIGATION STRUCTURE
    const coreNav = [
        { screen: 'dashboard', label: 'Dashboard', icon: Home },
        { screen: 'quick-start-accelerator', label: 'QuickStart Accelerator', icon: Zap, badge: 'New' }, 
        { screen: 'reflection', label: 'Executive Reflection', icon: BarChart3 }, 
    ];
    
    // TOOLS & HUBS - Focus on active management tools
    const toolsHubsNav = [
        { screen: 'prof-dev-plan', label: 'Development Plan', icon: Briefcase },
        { screen: 'daily-practice', label: 'Daily Practice', icon: Clock, notify: hasPendingDailyPractice },
        { screen: 'coaching-lab', label: 'Coaching Lab', icon: Mic },
        { screen: 'planning-hub', label: 'Planning Hub (OKRs)', icon: Trello }, 
    ];
    
    // NEW SECTION: RESOURCES & COMMUNITY - For learning, application, and peer support
    const resourcesCommunityNav = [
        { screen: 'applied-leadership', label: 'Applied Leadership', icon: ShieldCheck }, 
        { screen: 'business-readings', label: 'Business Readings', icon: BookOpen },
        { screen: 'community', label: 'Community & Peer Support', icon: Users, badge: 'New' }, 
    ];
    
    // SYSTEM
    const systemNav = [
        { screen: 'app-settings', label: 'App Settings', icon: Settings }, 
    ];

    const menuSections = [
        { title: 'CORE NAVIGATION', items: coreNav },
        { title: 'TOOLS & HUBS', items: toolsHubsNav },
        { title: 'RESOURCES & COMMUNITY', items: resourcesCommunityNav }, 
        { title: 'SYSTEM', items: systemNav }, 
    ];

    const handleSignOut = async () => {
        try {
            if (auth) await signOut(auth); // Call the imported signOut
            console.log('Sign Out triggered.');
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
            
            return (
                <button
                    key={item.screen}
                    onClick={() => handleNavigate(item.screen)}
                    // FIX: Surgical styling for clear delineation and 3D effect
                    className={`flex items-center w-full px-4 py-2.5 rounded-xl font-semibold relative transition-all duration-200 
                        ${isActive
                            // Active State: White background, lifted effect, strong Teal icon
                            ? `bg-white text-[${NAVY}] shadow-lg transform translate-x-1 ring-2 ring-[${TEAL}]` 
                            // Inactive State: Subtle Navy background, White text/Icon, 3D lift on hover
                            : `text-white hover:bg-[${TEAL}]/20 hover:text-white hover:shadow-md hover:scale-[1.02] bg-[${NAVY}]/5 border border-[${TEAL}]/10 `}
                    `}
                >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? `text-[${TEAL}]` : 'text-gray-200'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    
                    {item.badge && (
                        <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-[${ORANGE}] text-white`}>
                            {item.badge}
                        </span>
                    )}

                    {isNotifying && (
                        <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-2.5 w-2.5 bg-[${ORANGE}] rounded-full ring-2 ring-white`} />
                    )}
                </button>
            );
        })
    );

    // --- Desktop Sidebar ---
    // FIX 2: Hide the sidebar if authentication is required (i.e., user is not logged in)
    if (isAuthRequired) {
        return null;
    }
    
    return (
        // FIX: Removed md:fixed and overflow properties to allow single document scroll
        <div className={`hidden md:flex flex-col w-64 bg-[${NAVY}] text-white p-4 shadow-2xl`}> 
            <div className={`flex items-center justify-center h-16 border-b border-[${TEAL}]/50 mb-6 flex-shrink-0`}>
                <h1 className="text-2xl font-extrabold flex items-center">
                    <CornerRightUp className={`w-7 h-7 mr-2 text-[${TEAL}]`} /> LeaderReps
                </h1>
            </div>

            <nav className="flex-1 space-y-3"> {/* Removed overflow-y-auto */}
                {menuSections.map(section => (
                    <div key={section.title} className='space-y-1'> {/* Reduced spacing */}
                        {/* FIX: Improved delineation with background on title */}
                        <p className={`text-xs font-extrabold uppercase tracking-widest text-white px-2 py-1 rounded bg-[${TEAL}]/10`}>
                            {section.title}
                        </p>
                        <div className="space-y-1"> {/* Reduced vertical separation slightly */}
                            {renderNavItems(section.items)}
                        </div>
                    </div>
                ))}
            </nav>

            <div className={`pt-4 border-t border-[${TEAL}]/50 mt-4 relative flex-shrink-0`}>
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    // FIX 1: Explicitly set a dark subtle background when inactive
                    className={`flex items-center w-full p-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[${TEAL}]/20 focus:outline-none focus:ring-2 focus:ring-[${TEAL}] bg-white/5`}
                >
                    {/* The user icon and display logic updated for Anonymous */}
                    <User className="w-5 h-5 mr-3 text-indigo-300" />
                    <span className='truncate'>{user?.email || `Guest User`}</span>
                </button>
                
                {isProfileOpen && (
                    <div className={`absolute bottom-full left-0 mb-3 w-full p-4 rounded-xl shadow-2xl bg-[${NAVY}] border border-[${TEAL}]/50 z-10 animate-in fade-in slide-in-from-bottom-2`}>
                        <p className='text-xs font-medium uppercase text-indigo-300 mb-1'>Account Info</p>
                        <p className='text-sm font-semibold truncate mb-2 text-white' title={user?.email}>{user?.email || 'N/A'}</p>
                        <p className='text-xs text-gray-400 break-words mb-4'>UID: {user?.userId || 'N/A'}</p>
                        <button
                            onClick={handleSignOut}
                            className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-[${ORANGE}] text-white hover:bg-red-700`}
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
  // FIX: Use currentScreen as a key to force React to unmount and remount 
  // the component instance when the screen changes. This is necessary for 
  // reliable rendering of lazy-loaded components within a switch statement.
  const uniqueKey = currentScreen;
  
  switch (currentScreen) {
    case 'prof-dev-plan':
      return <ProfDevPlanScreen key={uniqueKey} />;
    case 'daily-practice':
      return <DailyPracticeScreen key={uniqueKey} initialGoal={navParams.initialGoal} initialTier={navParams.initialTier} />;
    case 'coaching-lab':
      return <CoachingLabScreen key={uniqueKey} />;
    case 'planning-hub':
      return <PlanningHubScreen key={uniqueKey} />;
    case 'business-readings':
      return <BusinessReadingsScreen key={uniqueKey} />;
    case 'quick-start-accelerator':
      return <QuickStartScreen key={uniqueKey} />;
    case 'app-settings':
      return <AppSettingsScreen key={uniqueKey} />;
    case 'reflection': 
      return <ExecutiveReflection key={uniqueKey} />;
    case 'community': 
      return <CommunityScreen key={uniqueKey} />;
    case 'applied-leadership': // NEW ROUTE: Applied Leadership
      return <AppliedLeadershipScreen key={uniqueKey} />;
    case 'dashboard':
    default:
      return <DashboardScreen key={uniqueKey} />;
  }
};

const AppContent = ({ currentScreen, setCurrentScreen, user, navParams, isMobileOpen, setIsMobileOpen, isAuthRequired }) => {
    return (
        // FIX: Removed min-h-screen and overflow properties from outer div.
        <div className="flex bg-gray-100 font-sans antialiased">
            {/* NavSidebar is now a standard flex item */}
            <NavSidebar
                currentScreen={currentScreen}
                setCurrentScreen={setCurrentScreen}
                user={user}
                isMobileOpen={isMobileOpen}
                closeMobileMenu={() => setIsMobileMenu(false)}
                isAuthRequired={isAuthRequired}
            />
            
            {/* Main content area starts after the sidebar */}
            <main className="flex-1">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-40">
                    <h1 className="text-xl font-bold text-[#002E47]">LeaderReps</h1>
                    <button onClick={() => setIsMobileOpen(true)} className="p-2 text-[#002E47] hover:text-[#47A88D]">
                        <Menu className="w-6 h-6" />
                    </button>
                </div>
                {/* Router wrapped in Suspense (provided by the parent component, App) */}
                <Suspense fallback={
                     <div className="min-h-screen flex items-center justify-center bg-gray-100">
                        <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div>
                            <p className="text-[#002E47] font-semibold">Loading App Content...</p>
                        </div>
                     </div>
                }>
                    <ScreenRouter currentScreen={currentScreen} navParams={navParams} />
                </Suspense>
            </main>
        </div>
    );
};

// =========================================================
// !!! CRITICAL FIX: The mock firebase functions from the original file 
// have been REMOVED here, as we are now using the real imported functions 
// at the top of the file when DEBUG_MODE is false.
// =========================================================

const App = ({ initialState }) => {
  const [user, setUser] = useState(
    DEBUG_MODE ? { name: 'Debugger', userId: 'mock-debugger-123', email: 'debug@leaderreps.com' } : null
  );
  const [currentScreen, setCurrentScreen] = useState(initialState?.screen || 'dashboard');
  const [firebaseServices, setFirebaseServices] = useState({ db: null, auth: null });
  const [userId, setUserId] = useState(DEBUG_MODE ? 'mock-debugger-123' : null);
  const [isAuthReady, setIsAuthReady] = useState(DEBUG_MODE);
  const [navParams, setNavParams] = useState(initialState?.params || {});
  // Initial set to TRUE to show loading/auth panel for a moment
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
      // DEBUG LOGIC REMAINS THE SAME
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
          // This line now uses the REAL getApp() imported above
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
        setInitError('window.__firebase_config is missing. Ensure Firebase config is available.');
        setIsAuthReady(true);
        setInitStage('error');
        return;
      }
      
      // These lines now call the REAL imported functions
      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      authentication = getAuth(app); 

      setLogLevel('debug');
      setFirebaseServices({ db: firestore, auth: authentication });
      
      // These lines now call the REAL imported functions
      const unsubscribe = onAuthStateChanged(authentication, (currentUser) => {
        if (currentUser) {
          const uid = currentUser.uid;
          // Set user email, defaulting to a placeholder if none exists (e.g., from a migrated anonymous user)
          const email = currentUser.email || `guest-${uid.substring(0, 8)}@leaderreps.com`;
          setUserId(uid);
          setUser({ name: email, email: email, userId: uid });
          setAuthRequired(false);
          setInitStage('ok'); // Move to 'ok' as soon as a user is found
        } else {
          setUser(null);
          setUserId(null);
          setAuthRequired(true); // Will trigger the AuthPanel;
          setInitStage('ok');     // Allow UI to leave the spinner and show auth panel
        }
        setIsAuthReady(true);
      });

      // Removed: Custom token sign-in logic is removed, we only rely on email/password flow now.

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
        <React.Fragment>
          <ConfigError message={initError} />
        </React.Fragment>
      );
    }
    // CRITICAL: If isAuthReady but no user, trigger the secure AuthPanel
    if (!user && isAuthReady) {
      return (
        <React.Fragment>
          <AuthPanel
            auth={firebaseServices.auth}
            // onSuccess is a necessary fallback/guarantee but auth listener should handle the actual user
            onSuccess={() => {
                setAuthRequired(false);
                setTimeout(() => navigate('dashboard'), 0);
            }}
          />
        </React.Fragment>
      );
    }
  }

  return (
    <React.Fragment>
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
              isAuthRequired={authRequired} // Pass auth status
            />
        </Suspense>
      </DataProvider>
    </React.Fragment>
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