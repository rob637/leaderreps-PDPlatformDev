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

// NOTE: These are local mocks/placeholders needed for the component definitions
const IconMap = {}; // Mock IconMap
const SECRET_SIGNUP_CODE = 'mock-code-123';
const PDP_COLLECTION = 'leadership_plan';
const PDP_DOCUMENT = 'roadmap';
const LEADERSHIP_TIERS = {};
const usePDPData = (db, userId, isAuthReady) => ({pdpData: {assessment:{selfRatings:{T3: 6}}}, isLoading: false, error: null, updatePdpData: async () => true, saveNewPlan: async () => true});
const useCommitmentData = (db, userId, isAuthReady) => ({commitmentData: {active_commitments: []}, isLoading: false, error: null, updateCommitmentData: async () => true});
const usePlanningData = (db, userId, isAuthReady) => ({planningData: {okrs: []}, isLoading: false, error: null, updatePlanningData: async () => true});
const callSecureGeminiAPI = async () => ({ candidates: [{ content: { parts: [{ text: 'mock response' }] } }] });
const hasGeminiKey = () => true;
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
const API_KEY = 'mock_api_key';


// Icons used in the new NavSidebar
import { Home, Zap, ShieldCheck, TrendingUp, Mic, BookOpen, Settings, X, Menu, LogOut, CornerRightUp, Clock, Briefcase, Target, Users, BarChart3, HeartPulse, User, Bell, Trello, CalendarClock } from 'lucide-react';

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
   FIX: These are the definitive definitions, placed here to avoid re-declaration.
========================================================= */
const DashboardScreen = lazy(() => import('./components/screens/Dashboard.jsx')); 
const ProfDevPlanScreen = lazy(() => import('./components/screens/DevPlan'));
const CoachingLabScreen = lazy(() => import('./components/screens/Labs'));
const DailyPracticeScreen = lazy(() => import('./components/screens/DailyPractice.jsx'));
const PlanningHubScreen = lazy(() => import('./components/screens/PlanningHub.jsx'));
const BusinessReadingsScreen = lazy(() => import('./components/screens/BusinessReadings.jsx'));
const QuickStartScreen = lazy(() => import('./components/screens/QuickStartAccelerator.jsx')); 
const ExecutiveReflection = lazy(() => import('./components/screens/ExecutiveReflection.jsx'));


/* =========================================================
   CONTEXT + SAFE DEFAULTS (Omitted for brevity)
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
    hasGeminiKey: () => false,
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
   LOGIN PANEL & CONFIG ERROR (Omitted for brevity)
========================================================= */
function LoginPanel({ auth, onSuccess, allowAnonymous = false }) { /* ... */ return null; }
function ConfigError({ message }) { /* ... */ return null; }


/* =========================================================
   NAV SIDEBAR (Aesthetic Upgrade & Final Navigation)
========================================================= */
const NavSidebar = ({ currentScreen, setCurrentScreen, user, isMobileOpen, closeMobileMenu }) => {
    const { auth, hasPendingDailyPractice } = useAppServices();
    const [isProfileOpen, setIsProfileOpen] = useState(false); 

    const NAVY = COLORS.NAVY;
    const TEAL = COLORS.TEAL;
    const ORANGE = COLORS.ORANGE;

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
            const isNotifying = item.notify;
            
            return (
                <button
                    key={item.screen}
                    onClick={() => handleNavigate(item.screen)}
                    className={`flex items-center w-full px-4 py-3 rounded-xl font-semibold relative transition-colors duration-200 ${
                        isActive
                            ? `bg-[${TEAL}] text-[${NAVY}] shadow-lg`
                            : `text-indigo-200 hover:bg-[${TEAL}]/20 hover:text-white`
                    }`}
                >
                    <Icon className="w-5 h-5 mr-3" />
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
    return (
        <div className={`hidden md:flex flex-col w-64 min-h-screen bg-[${NAVY}] text-white p-4 shadow-2xl sticky top-0`}>
            <div className={`flex items-center justify-center h-16 border-b border-[${TEAL}]/50 mb-6`}>
                <h1 className="text-2xl font-extrabold flex items-center">
                    <CornerRightUp className={`w-7 h-7 mr-2 text-[${TEAL}]`} /> LeaderReps
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

            <div className={`pt-4 border-t border-[${TEAL}]/50 mt-4 relative`}>
                <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    className={`flex items-center w-full p-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[${TEAL}]/20 focus:outline-none focus:ring-2 focus:ring-[${TEAL}]`}
                >
                    <User className="w-5 h-5 mr-3 text-indigo-300" />
                    <span className='truncate'>{user?.email || 'User Profile'}</span>
                </button>
                
                {isProfileOpen && (
                    <div className={`absolute bottom-full left-0 mb-3 w-full p-4 rounded-xl shadow-2xl bg-[${NAVY}] border border-[${TEAL}]/50 z-10 animate-in fade-in slide-in-from-bottom-2`}>
                        <p className='text-xs font-medium uppercase text-indigo-300 mb-1'>Account Info</p>
                        <p className='text-sm font-semibold truncate mb-2 text-white' title={user?.email}>{user?.email}</p>
                        <p className='text-xs text-gray-400 break-words mb-4'>UID: {user?.userId}</p>
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


/* =========================================================
   PLACEHOLDERS + ROUTER
========================================================= */
const QuickStartScreenPlaceholder = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold text-[#002E47]">QuickStart Accelerator</h1>
        <p className="mt-2 text-gray-600">
            (Placeholder) Add your fast-track PDP setup content here.
        </p>
    </div>
);

const AppSettingsScreen = () => (
    <div className="p-6">
        <h1 className="text-3xl font-bold text-[#002E47]">App Settings</h1>
        <p className="mt-2 text-gray-600">
            (Placeholder) User and API settings configuration goes here.
        </p>
    </div>
);

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
      // FIX: Use the lazily imported QuickStartScreen
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

const AppContent = ({ currentScreen, setCurrentScreen, user, navParams, isMobileOpen, setIsMobileOpen }) => {
    return (
        <div className={`min-h-screen flex bg-[${COLORS.LIGHT_GRAY}] font-sans antialiased`}>
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
                <Suspense fallback={
                     <div className="p-8"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div><p className="text-[#002E47] font-semibold">Loading Screen...</p></div>
                }>
                    <ScreenRouter currentScreen={currentScreen} navParams={navParams} />
                </Suspense>
            </main>
        </div>
    );
};


/* =========================================================
   MAIN APP WRAPPER (Omitted for brevity)
========================================================= */
const App = ({ initialState }) => { /* ... */ return null; }

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