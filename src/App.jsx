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

import {
  initializeApp, 
  getApp        
} from 'firebase/app'; 

import { 
  getAuth, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
} from 'firebase/auth';

import { getFirestore, setLogLevel } from 'firebase/firestore'; 

// =========================================================
// --- PRODUCTION GEMINI CONFIGURATION ---
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';
// NOTE: API_KEY must be defined in your environment (e.g., Netlify/Vite)
const API_KEY = (typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : ''); 

const DEBUG_MODE = false;

/**
 * Executes an authenticated request to the Gemini API with backoff.
 */
const callSecureGeminiAPI = async (payload, maxRetries = 3, delay = 1000) => {
    if (!API_KEY) {
        // CRITICAL: Throw a clear error if the key is missing in production
        throw new Error("Gemini API Key is missing. Check your environment configuration (API_KEY is empty).");
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

            // Retry on Rate Limit (429) or Server Errors (5xx)
            if (response.status === 429 || response.status >= 500) {
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
                    continue; 
                }
            }

            // Throw non-retryable errors (e.g., 400 Bad Request)
            const errorBody = await response.text();
            throw new Error(`API Request Failed: HTTP ${response.status} - ${errorBody}`);

        } catch (error) {
            if (attempt === maxRetries - 1) {
                 throw new Error(`Network Error after ${maxRetries} attempts: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
        }
    }
    throw new Error('Maximum retries exceeded.');
};

const hasGeminiKey = () => (!!API_KEY);

// Bridge: expose the real Gemini caller so services can forward to it
useEffect(() => {
  if (typeof window !== 'undefined') {
    window.__callSecureGeminiAPI = callSecureGeminiAPI;
  }
  return () => {
    if (typeof window !== 'undefined') delete window.__callSecureGeminiAPI;
  };
}, [callSecureGeminiAPI]);


// --- END PRODUCTION GEMINI CONFIGURATION ---

// --- EXISTING MOCK/PLACEHOLDER DEFINITIONS (Keep these) ---
// NOTE: These hooks must return data and have isLoading=false immediately to prevent the PlanningHub/other spinners.
const usePDPData = (db, userId, isAuthReady) => ({pdpData: {assessment:{selfRatings:{T3: 6}}}, isLoading: false, error: null, updatePdpData: async () => true, saveNewPlan: async () => true});
const useCommitmentData = (db, userId, isAuthReady) => ({commitmentData: {active_commitments: []}, isLoading: false, error: null, updateCommitmentData: async () => true});
const usePlanningData = (db, userId, isAuthReady) => ({planningData: {okrs: []}, isLoading: false, error: null, updatePlanningData: async () => true});
const IconMap = {}; 
const SECRET_SIGNUP_CODE = 'mock-code-123';
const PDP_COLLECTION = 'leadership_plan';
const PDP_DOCUMENT = 'roadmap';
const LEADERSHIP_TIERS = {};
// Global notepad mock for compatibility
if (typeof window !== 'undefined' && typeof window.notepad === 'undefined') {
    window.notepad = { setTitle: () => {}, addContent: () => {}, getContent: () => {} };
}
const notepad = (typeof globalThis !== 'undefined' ? globalThis.notepad : (typeof window !== 'undefined' ? window.notepad : undefined));


// Icons used in the new NavSidebar
import { 
  Home, Zap, ShieldCheck, TrendingUp, Mic, BookOpen, Settings, User, LogOut, CornerRightUp, Clock, Briefcase, Target, Users, BarChart3, Globe, Code, Bell, Lock, Download, Trash2, Mail, Link, Menu,
  Trello 
} from 'lucide-react';

// --- GLOBAL COLOR PALETTE ---
const COLORS = {
  NAVY: '#002E47', TEAL: '#47A88D', SUBTLE_TEAL: '#349881', ORANGE: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', 
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
const CommunityScreen = lazy(() => import('./components/screens/CommunityScreen.jsx'));
const AppliedLeadershipScreen = lazy(() => import('./components/screens/AppliedLeadership.jsx')); 


/* =========================================================
   STEP 2: MOCK/PLACEHOLDER COMPONENTS
========================================================= */

// SettingsCard and AppSettingsScreen definitions... (omitted for brevity)
const SettingsCard = ({ title, icon: Icon, children }) => (
    <div className={`p-6 rounded-xl border border-gray-200 bg-white shadow-lg space-y-4`}>
        <h3 className={`text-xl font-bold flex items-center gap-2 border-b pb-2`} style={{ color: COLORS.NAVY }}>
            <Icon size={22} style={{ color: COLORS.TEAL }} />
            {title}
        </h3>
        {children}
    </div>
);
const AppSettingsScreen = () => {
    const { user, API_KEY, auth } = useAppServices();
    const handleResetPassword = async () => {
        if (!user?.email) { alert('Cannot reset password: User email is unknown.'); return; }
        try { await sendPasswordResetEmail(auth, user.email); alert(`Password reset email sent to ${user.email}. Check your inbox!`);
        } catch (error) { alert(`Failed to send reset email: ${error.message}`); }
    };
    
    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <h1 className="text-4xl font-extrabold text-[#002E47]">App Settings</h1>
            <p className="mt-2 text-gray-600">
                Manage your profile, security, integrations, and data.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SettingsCard title="User Account" icon={User}>
                    <p className='text-sm text-gray-700'>**Full Name:** <span className='font-semibold'>{user?.name || 'N/A'}</span></p>
                    <p className='text-sm text-gray-700'>**Email:** <span className='font-semibold'>{user?.email || 'N/A'}</span></p>
                    <button onClick={handleResetPassword} className={`text-sm font-semibold text-[${COLORS.ORANGE}] hover:text-red-700 mt-2`}>
                        Change Password (Send Reset Link)
                    </button>
                    <div className='pt-2'><p className='text-xs text-gray-500'>Time Zone: <span className='font-medium'>America/New_York (UTC-4)</span></p></div>
                </SettingsCard>
                <SettingsCard title="Security" icon={Lock}>
                    <p className='text-sm text-gray-700'>**2FA Status:** <span className='font-semibold text-red-500'>Disabled</span></p>
                    <p className='text-sm text-gray-700'>**Last Sign In:** <span className='font-semibold'>{new Date().toLocaleString()}</span></p>
                    <button className={`text-sm font-semibold text-[${COLORS.NAVY}] hover:text-[${COLORS.TEAL}] mt-2`}>
                        Sign Out From All Devices
                    </button>
                    <div className='pt-2'><p className='text-xs text-gray-500'>*Your session ends automatically when the tab is closed.</p></div>
                </SettingsCard>
                <SettingsCard title="AI Integration" icon={Code}>
                    <label className='block text-sm font-medium text-gray-700'>Gemini API Key</label>
                    <input type="password" value={API_KEY ? '••••••••••••••••' : ''} readOnly placeholder="Configure in Netlify/Vite environment" className='w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50'/>
                    <p className='text-xs text-gray-500 mt-1'>
                        Status: <span className={`font-semibold ${API_KEY ? 'text-green-600' : 'text-red-500'}`}>{API_KEY ? 'Active' : 'Missing'}</span>
                    </p>
                    <button className={`text-sm font-semibold text-[${COLORS.NAVY}] hover:text-[${COLORS.TEAL}] mt-2`}><Link size={14} className='inline-block mr-1'/> Connect External Calendar</button>
                </SettingsCard>
                <SettingsCard title="Data Management" icon={Download}>
                    <button className={`text-sm font-semibold text-[${COLORS.NAVY}] hover:text-[${COLORS.TEAL}]`}>
                        <Download size={14} className='inline-block mr-1'/> Export All Personal Data (JSON)
                    </button>
                    <div className='pt-2'><p className='text-xs text-gray-500'><Mail size={14} className='inline-block mr-1'/> <a href="#" className='underline'>Review Privacy Policy</a></p></div>
                    <button className={`text-sm font-semibold text-red-600 hover:text-red-900 pt-4 flex items-center gap-1`}>
                        <Trash2 size={16}/> Permanently Delete Account
                    </button>
                </SettingsCard>
            </div>
        </div>
    );
};


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


const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
  const { db } = firebaseServices;

  const pdp = usePDPData(db, userId, isAuthReady);
  const commitment = useCommitmentData(db, userId, isAuthReady);
  const planning = usePlanningData(db, userId, isAuthReady);

  // CRITICAL: isLoading is derived from all data sources
  const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading;
  const error = pdp.error || commitment.error || planning.error;

  const hasPendingDailyPractice = useMemo(() => {
    const active = commitment.commitmentData?.active_commitments || [];
    const isPending = active.some(c => c.status === 'Pending');
    const reflectionMissing = !commitment.commitmentData?.reflection_journal?.trim();
    return active.length > 0 && (isPending || reflectionMissing);
  }, [commitment.commitmentData]);


  const appServices = useMemo(() => ({
    navigate, user, ...firebaseServices, userId, isAuthReady,
    updatePdpData: pdp.updatePdpData, saveNewPlan: pdp.saveNewPlan,
    updateCommitmentData: commitment.updateCommitmentData, updatePlanningData: planning.updatePlanningData,
    pdpData: pdp.pdpData, commitmentData: commitment.commitmentData, planningData: planning.planningData,
    isLoading, error, appId, IconMap: IconMap, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY,
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

function AuthPanel({ auth, onSuccess }) {
    const [mode, setMode] = useState('login'); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); 
    const [secretCode, setSecretCode] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const NAVY = COLORS.NAVY;
    const TEAL = COLORS.TEAL;
    const ORANGE = COLORS.ORANGE;
    const SECRET_SIGNUP_CODE = 'mock-code-123'; 

    const handleAction = async () => {
        if (!auth || isLoading) return;
        setIsLoading(true);
        setStatusMessage('');

        try {
            if (mode === 'login') {
                await signInWithEmailAndPassword(auth, email, password);
                console.log('Sign-in successful. Waiting for state update.');
            } else if (mode === 'signup') {
                if (secretCode !== SECRET_SIGNUP_CODE) { throw new Error('Invalid secret sign-up code.'); }
                if (!name.trim()) { throw new Error('Please enter your name.'); }
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await userCredential.user.updateProfile({ displayName: name.trim() });
                console.log('Sign-up successful. Waiting for state update.');
            } else if (mode === 'reset') {
                await sendPasswordResetEmail(auth, email);
                setStatusMessage('Password reset email sent. Check your inbox.');
                setMode('login'); 
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
                {isSignUp && (<input type="text" placeholder="Your Full Name" value={name} onChange={(e) => setName(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`} disabled={isLoading}/>)}
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`} disabled={isLoading}/>
                {!isReset && (<input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`} disabled={isLoading}/>)}
                {isSignUp && (<input type="text" placeholder="Secret Sign-up Code" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`} disabled={isLoading}/>)}
                
                <button
                    onClick={handleAction}
                    disabled={isLoading || !email || (!isReset && !password) || (isSignUp && (!secretCode || !name))}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-colors 
                        ${isLoading || !email || (!isReset && !password) || (isSignUp && (!secretCode || !name))
                            ? 'bg-gray-400 cursor-not-allowed' : `bg-[${TEAL}] hover:bg-[${NAVY}]` }
                    `}
                >
                    {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : isSignUp ? 'Sign Up' : 'Send Reset Email')}
                </button>
                
                {statusMessage && (<p className={`text-sm text-center font-medium mt-3 ${statusMessage.includes('sent') ? `text-[${TEAL}]` : `text-[${ORANGE}]`}`}>{statusMessage}</p>)}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="p-8 bg-white rounded-xl shadow-2xl text-center w-full max-w-sm border-t-4 border-[${TEAL}]">
                <h2 className="text-2xl font-extrabold text-[${NAVY}] mb-4">{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}</h2>
                <p className='text-sm text-gray-600 mb-6'>{mode === 'reset' ? 'Enter your email to receive a password reset link.' : 'Log in to access your leadership development platform.'}</p>
                {renderForm()}
                <div className='mt-6 border-t pt-4 border-gray-200 space-y-2'>
                    {mode !== 'signup' && (<button onClick={() => { setMode('signup'); setStatusMessage(''); }} className={`text-sm text-[${TEAL}] hover:text-[${NAVY}] font-semibold block w-full`}>Need an account? Sign up</button>)}
                    {mode !== 'login' && (<button onClick={() => { setMode('login'); setStatusMessage(''); }} className="text-sm text-gray-500 hover:text-[${NAVY}] block w-full">Back to Sign In</button>)}
                    {mode === 'login' && (<button onClick={() => { setMode('reset'); setStatusMessage(''); }} className={`text-sm text-gray-500 hover:text-[${ORANGE}] block w-full`}>Forgot Password?</button>)}
                </div>
            </div>
        </div>
    );
}


const NavSidebar = ({ currentScreen, setCurrentScreen, user, closeMobileMenu, isAuthRequired }) => {
    const { auth } = useAppServices();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const NAVY = COLORS.NAVY;
    const TEAL = COLORS.TEAL;
    const ORANGE = COLORS.ORANGE;

    const coreNav = [{ screen: 'dashboard', label: 'Dashboard', icon: Home }, { screen: 'quick-start-accelerator', label: 'QuickStart Accelerator', icon: Zap, badge: 'New' }, { screen: 'reflection', label: 'Executive Reflection', icon: BarChart3 }];
    const toolsHubsNav = [{ screen: 'prof-dev-plan', label: 'Development Plan', icon: Briefcase }, { screen: 'daily-practice', label: 'Daily Practice', icon: Clock}, { screen: 'coaching-lab', label: 'Coaching Lab', icon: Mic }, { screen: 'planning-hub', label: 'Planning Hub (OKRs)', icon: Trello }];
    const resourcesCommunityNav = [{ screen: 'applied-leadership', label: 'Applied Leadership', icon: ShieldCheck }, { screen: 'business-readings', label: 'Business Readings', icon: BookOpen }, { screen: 'community', label: 'Community & Peer Support', icon: Users, badge: 'New' }];
    const systemNav = [{ screen: 'app-settings', label: 'App Settings', icon: Settings }];

    const menuSections = [{ title: 'CORE NAVIGATION', items: coreNav }, { title: 'TOOLS & HUBS', items: toolsHubsNav }, { title: 'RESOURCES & COMMUNITY', items: resourcesCommunityNav }, { title: 'SYSTEM', items: systemNav }];

    const handleSignOut = async () => {
        try { if (auth) await signOut(auth); console.log('Sign Out triggered.'); closeMobileMenu();
        } catch (e) { console.error('Sign out failed:', e); }
    };

    const handleNavigate = (screen) => { setCurrentScreen(screen); closeMobileMenu(); };
    
    const renderNavItems = (items) => (
        items.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.screen;
            
            return (
                <button key={item.screen} onClick={() => handleNavigate(item.screen)}
                    className={`flex items-center w-full px-4 py-2.5 rounded-xl font-semibold relative transition-all duration-200 
                        ${isActive
                            ? `bg-white text-[${NAVY}] shadow-lg transform translate-x-1 ring-2 ring-[${TEAL}]` 
                            : `text-white hover:bg-[${TEAL}]/20 hover:text-white hover:shadow-md hover:scale-[1.02] bg-[${NAVY}]/5 border border-[${TEAL}]/10 `}
                    `}
                >
                    <Icon className={`w-5 h-5 mr-3 ${isActive ? `text-[${TEAL}]` : 'text-gray-200'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (<span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-[${ORANGE}] text-white`}>{item.badge}</span>)}
                </button>
            );
        })
    );

    if (isAuthRequired) { return null; }
    
    return (
        <div className={`hidden md:flex flex-col w-64 bg-[${NAVY}] text-white p-4 shadow-2xl`}> 
            <div className={`flex items-center justify-center h-16 border-b border-[${TEAL}]/50 mb-6 flex-shrink-0`}>
                <h1 className="text-2xl font-extrabold flex items-center"><CornerRightUp className={`w-7 h-7 mr-2 text-[${TEAL}]`} /> LeaderReps</h1>
            </div>

            <nav className="flex-1 space-y-3">
                {menuSections.map(section => (
                    <div key={section.title} className='space-y-1'>
                        <p className={`text-xs font-extrabold uppercase tracking-widest text-white px-2 py-1 rounded bg-[${TEAL}]/10`}>{section.title}</p>
                        <div className="space-y-1">{renderNavItems(section.items)}</div>
                    </div>
                ))}
            </nav>

            <div className={`pt-4 border-t border-[${TEAL}]/50 mt-4 relative flex-shrink-0`}>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} 
                    className={`flex items-center w-full p-2 rounded-xl text-sm font-semibold transition-colors hover:bg-[${TEAL}]/20 focus:outline-none focus:ring-2 focus:ring-[${TEAL}] bg-white/5`}>
                    <User className="w-5 h-5 mr-3 text-indigo-300" />
                    <span className='truncate'>{user?.name || `Guest User`}</span>
                </button>
                
                {isProfileOpen && (
                    <div className={`absolute bottom-full left-0 mb-3 w-full p-4 rounded-xl shadow-2xl bg-[${NAVY}] border border-[${TEAL}]/50 z-10 animate-in fade-in slide-in-from-bottom-2`}>
                        <p className='text-xs font-medium uppercase text-indigo-300 mb-1'>Account Info</p>
                        <p className='text-sm font-semibold truncate mb-2 text-white' title={user?.email}>{user?.email || 'N/A'}</p>
                        <p className='text-xs text-gray-400 break-words mb-4'>UID: {user?.userId || 'N/A'}</p>
                        <button onClick={handleSignOut} className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-[${ORANGE}] text-white hover:bg-red-700`}>
                            <LogOut className="w-4 h-4 mr-2" /> Sign Out
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const ScreenRouter = ({ currentScreen, navParams }) => {
  const uniqueKey = currentScreen;
  
  switch (currentScreen) {
    case 'prof-dev-plan': return <ProfDevPlanScreen key={uniqueKey} />;
    case 'daily-practice': return <DailyPracticeScreen key={uniqueKey} initialGoal={navParams.initialGoal} initialTier={navParams.initialTier} />;
    case 'coaching-lab': return <CoachingLabScreen key={uniqueKey} />;
    case 'planning-hub': return <PlanningHubScreen key={uniqueKey} />;
    case 'business-readings': return <BusinessReadingsScreen key={uniqueKey} />;
    case 'quick-start-accelerator': return <QuickStartScreen key={uniqueKey} />;
    case 'app-settings': return <AppSettingsScreen key={uniqueKey} />;
    case 'reflection': return <ExecutiveReflection key={uniqueKey} />;
    case 'community': return <CommunityScreen key={uniqueKey} />;
    case 'applied-leadership': return <AppliedLeadershipScreen key={uniqueKey} />;
    case 'dashboard': default: return <DashboardScreen key={uniqueKey} />;
  }
};

const AppContent = ({ currentScreen, setCurrentScreen, user, navParams, isMobileOpen, setIsMobileOpen, isAuthRequired }) => {
    
    // FIX (Issue 1): Define the correct handler for closing the menu
    const closeMobileMenu = useCallback(() => { setIsMobileOpen(false); }, [setIsMobileOpen]);
    
    return (
        <div className="flex bg-gray-100 font-sans antialiased">
            <NavSidebar
                currentScreen={currentScreen}
                setCurrentScreen={setCurrentScreen}
                user={user}
                isMobileOpen={isMobileOpen}
                closeMobileMenu={closeMobileMenu} 
                isAuthRequired={isAuthRequired}
            />
            
            <main className="flex-1">
                <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-40">
                    <h1 className="text-xl font-bold text-[#002E47]">LeaderReps</h1>
                    <button onClick={() => setIsMobileOpen(true)} className="p-2 text-[#002E47] hover:text-[#47A88D]"><Menu className="w-6 h-6" /></button>
                </div>
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

const App = ({ initialState }) => {
  const [user, setUser] = useState(DEBUG_MODE ? { name: 'Debugger', userId: 'mock-debugger-123', email: 'debug@leaderreps.com' } : null);
  const [currentScreen, setCurrentScreen] = useState(initialState?.screen || 'dashboard');
  const [firebaseServices, setFirebaseServices] = useState({ db: null, auth: null });
  const [userId, setUserId] = useState(DEBUG_MODE ? 'mock-debugger-123' : null);
  const [isAuthReady, setIsAuthReady] = useState(DEBUG_MODE);
  const [navParams, setNavParams] = useState(initialState?.params || {});
  const [authRequired, setAuthRequired] = useState(!DEBUG_MODE); 
  const [isMobileOpen, setIsMobileOpen] = useState(false); 

  const [initStage, setInitStage] = useState('init');
  const [initError, setInitError] = useState('');

  const navigate = useCallback((screen, params = {}) => { setNavParams(params); setCurrentScreen(screen); }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') { window.__appNavigate = navigate; }
    return () => { if (typeof window !== 'undefined') delete window.__appNavigate; };
  }, [navigate]);


  useEffect(() => {
    let app, firestore, authentication;

    if (DEBUG_MODE) {
      try { const firebaseConfig = { apiKey: 'mock', authDomain: 'mock', projectId: 'mock' }; app = initializeApp(firebaseConfig); firestore = getFirestore(app); authentication = getAuth(app); setFirebaseServices({ db: firestore, auth: authentication }); setIsAuthReady(true); setInitStage('ok'); return; } 
      catch { try { const existing = getApp(); firestore = getFirestore(existing); authentication = getAuth(existing); setFirebaseServices({ db: firestore, auth: authentication }); } catch {} setIsAuthReady(true); setInitStage('ok'); return; }
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
      } else { setInitError('window.__firebase_config is missing.'); setIsAuthReady(true); setInitStage('error'); return; }
      
      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      authentication = getAuth(app); 

      setLogLevel('debug');
      setFirebaseServices({ db: firestore, auth: authentication });
      
      const unsubscribe = onAuthStateChanged(authentication, (currentUser) => {
        if (currentUser && currentUser.email) { 
          const uid = currentUser.uid;
          const email = currentUser.email;
          const name = currentUser.displayName || email.split('@')[0]; 
          setUserId(uid);
          setUser({ name: name, email: email, userId: uid }); 
          setAuthRequired(false);
          setInitStage('ok'); 
        } else {
          setUser(null); setUserId(null); setAuthRequired(true); setInitStage('ok'); 
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error('Firebase setup failed:', e);
      setInitError(e?.message || 'Firebase initialization failed.');
      setIsAuthReady(true);
      setInitStage('error');
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = async () => {
        const authInstance = firebaseServices.auth;
        if (authInstance) {
            await signOut(authInstance); 
            console.log('User signed out due to window close.');
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => { window.removeEventListener('beforeunload', handleBeforeUnload); };
  }, [firebaseServices.auth]); 

  if (!DEBUG_MODE) {
    if (initStage === 'init') { return (<div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div><p className="text-[#002E47] font-semibold">Initializing Authentication…</p></div></div>); }
    if (initStage === 'error') { return (<React.Fragment><ConfigError message={initError} /></React.Fragment>); }
    if (!user && isAuthReady) {
      return (<React.Fragment><AuthPanel auth={firebaseServices.auth} onSuccess={() => { setAuthRequired(false); setTimeout(() => navigate('dashboard'), 0); }}/></React.Fragment>);
    }
  }

  return (
    <React.Fragment>
      <DataProvider
        firebaseServices={firebaseServices} userId={userId} isAuthReady={isAuthReady} navigate={navigate} user={user}>
        <Suspense fallback={
             <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div><p className="text-[#002E47] font-semibold">Loading App Content...</p></div></div>
        }>
            <AppContent
              currentScreen={currentScreen} setCurrentScreen={navigate} user={user} navParams={navParams} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} isAuthRequired={authRequired} 
            />
        </Suspense>
      </DataProvider>
    </React.Fragment>
  );
};

export default function Root(props) {
  const forceSanity = typeof window !== 'undefined' && /[?&]sanity=1/.test(window.location.search);
  if (false || forceSanity) {
    return (<div style={{ padding: 32, fontSize: 18, lineHeight: 1.4 }}><div>✅ <strong>React mounted (Sanity Check)</strong></div></div>);
  }
  return <App {...props} />;
}