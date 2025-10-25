// src/App.jsx

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  lazy,
} from 'react';
// CRITICAL FIX: The next step is to import useGlobalMetadata and updateGlobalMetadata here in App.jsx
import { AppServiceContext, usePDPData, useCommitmentData, usePlanningData, useGlobalMetadata, updateGlobalMetadata } from './services/useAppServices.jsx';

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
const GEMINI_MODEL = 'gemini-2.5-flash'; 
const GEMINI_API_VERSION = 'v1beta';
// Prefer serverless; allow override via window.__GEMINI_MODE = 'direct'
const USE_SERVERLESS = (typeof window !== 'undefined' && window.__GEMINI_MODE === 'direct') ? false : true;
// NOTE: API_KEY must be defined in your environment (e.g., Netlify/Vite)
const API_KEY = (typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : (USE_SERVERLESS ? 'SERVERLESS' : '')); 

const DEBUG_MODE = false;

/**
 * Executes an authenticated request to the Gemini API with backoff.
 */

const callSecureGeminiAPI = async (payload, maxRetries = 3, delay = 1000) => {
    // Normalize payload for Google API
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

    // Choose endpoint
    let apiUrl = '';
    if (USE_SERVERLESS) {
        // Netlify Functions Endpoint
        apiUrl = '/.netlify/functions/gemini';
    } else {
        // Direct API Endpoint
        const directKey = (typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : '');
        if (!directKey) throw new Error("Gemini API Key is missing for direct mode. Set __GEMINI_API_KEY or use serverless.");
        apiUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${directKey}`;
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body
            });

            if (response.ok) {
                return response.json();
            }

            if (response.status === 429 || response.status >= 500) {
                if (attempt < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
                    continue;
                }
            }

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


const hasGeminiKey = () => (USE_SERVERLESS ? true : !!(typeof __GEMINI_API_KEY !== 'undefined' && __GEMINI_API_KEY));

// --- END PRODUCTION GEMINI CONFIGURATION ---

// --- EXISTING MOCK/PLACEHOLDER DEFINITIONS (Keep these) ---

const IconMap = {}; 
const SECRET_SIGNUP_CODE = 'mock-code-123';
const PDP_COLLECTION = 'leadership_plan';
const PDP_DOCUMENT = 'roadmap';
const LEADERSHIP_TIERS = {
    T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
    T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' },
    T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' },
    T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-600' },
    T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};
// Global notepad mock for compatibility
if (typeof window !== 'undefined' && typeof window.notepad === 'undefined') {
    window.notepad = { setTitle: () => {}, addContent: () => {}, getContent: () => {} };
}
const notepad = (typeof globalThis !== 'undefined' ? globalThis.notepad : (typeof window !== 'undefined' ? window.notepad : undefined));


// Icons used in the new NavSidebar
import { 
  Home, Zap, ShieldCheck, TrendingUp, Mic, BookOpen, Settings, User, LogOut, CornerRightUp, Clock, Briefcase, Target, Users, BarChart3, Globe, Code, Bell, Lock, Download, Trash2, Mail, Link, Menu,
  Trello, Film, Dumbbell, Cpu
} from 'lucide-react';

// --- GLOBAL COLOR PALETTE ---
const COLORS = {
  NAVY: '#002E47', TEAL: '#47A88D', SUBTLE_TEAL: '#349881', ORANGE: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', 
};


/* =========================================================
   STEP 1: LAZY LOAD SCREEN COMPONENTS
   CRITICAL FIX: Define the ScreenMap to resolve the ReferenceError in ScreenRouter
========================================================= */
const ScreenMap = {
    dashboard: lazy(() => import('./components/screens/Dashboard.jsx')),
    'prof-dev-plan': lazy(() => import('./components/screens/DevPlan.jsx')),
    'coaching-lab': lazy(() => import('./components/screens/Labs.jsx')), // CoachingPillarScreen
    'daily-practice': lazy(() => import('./components/screens/DailyPractice.jsx')),
    'planning-hub': lazy(() => import('./components/screens/PlanningHub.jsx')), // ContentToolingScreen
    'business-readings': lazy(() => import('./components/screens/BusinessReadings.jsx')),
    'quick-start-accelerator': lazy(() => import('./components/screens/QuickStartAccelerator.jsx')), // BootcampScreen
    'reflection': lazy(() => import('./components/screens/ExecutiveReflection.jsx')), // ExecutiveReflection
    'community': lazy(() => import('./components/screens/CommunityScreen.jsx')),
    'applied-leadership': lazy(() => import('./components/screens/AppliedLeadership.jsx')),
    'leadership-videos': lazy(() => import('./components/screens/LeadershipVideos.jsx')), // ContentLibraryScreen
    // ADD NEW ADMIN SCREEN
    'data-maintenance': lazy(() => import('./components/screens/AdminDataMaintenance.jsx')), 
    // 'app-settings' is handled directly by AppSettingsScreen defined below.
};

// NOTE: Since AppSettingsScreen uses useAppServices(), we must ensure we import it
// from the useAppServices.jsx file to avoid conflicts.

// SettingsCard and AppSettingsScreen definitions... 
const SettingsCard = ({ title, icon: Icon, children }) => (
    <div className={`p-6 rounded-xl border border-gray-200 bg-white shadow-lg space-y-4`}>
        <h3 className={`text-xl font-bold flex items-center gap-2 border-b pb-2`} style={{ color: COLORS.NAVY }}>
            <Icon size={22} style={{ color: COLORS.TEAL }} />
            {title}
        </h3>
        {children}
    </div>
);
// Re-implemented AppSettingsScreen here to ensure no lazy conflict, 
// using the name that was referenced in the original file (if it was external)
const AppSettingsScreen = ({ navigate }) => {
    // FIX: Must use useAppServices() to get context
    const { user, API_KEY, auth } = useAppServices();
    const handleResetPassword = async () => {
        if (!user?.email) { alert('Cannot reset password: User email is unknown.'); return; }
        try { 
            // FIX: Ensure auth is checked before use
            if (auth) {
                 await sendPasswordResetEmail(auth, user.email); 
                 alert(`Password reset email sent to ${user.email}. Check your inbox!`);
            } else {
                 alert('Authentication service is not available.');
            }
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
                    <p className='text-sm text-gray-700'>**2FA Status:** <span className className='font-semibold text-red-500'>Disabled</span></p>
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
                {/* NEW: Admin Data Maintenance Link */}
                <SettingsCard title="Global Data Maintenance (Admin)" icon={Cpu}>
                    <p className='text-sm text-gray-700'>
                        Access the JSON editor for application-wide data (tiers, catalogs). **Requires Admin Password.**
                    </p>
                    <button 
                        onClick={() => navigate('data-maintenance')} 
                        className={`text-sm font-semibold text-[${COLORS.ORANGE}] hover:text-red-700 mt-2 flex items-center`}
                    >
                        <Settings size={14} className='inline-block mr-1'/> Launch JSON Editor
                    </button>
                </SettingsCard>
            </div>
        </div>
    );
};


/* =========================================================
   STEP 3: CONTEXT + DATA PROVIDER
   CRITICAL FIX: DataProvider now uses useGlobalMetadata
========================================================= */

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';


const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
  const { db } = firebaseServices;

  // 1. Fetch User Data (PDP, Commitment, Planning)
  const pdp = usePDPData(db, userId, isAuthReady);
  const commitment = useCommitmentData(db, userId, isAuthReady);
  const planning = usePlanningData(db, userId, isAuthReady);
  
  // 2. Fetch Global Configuration Data
  const global = useGlobalMetadata(db, isAuthReady); // <-- NEW

  // CRITICAL: isLoading is derived from all data sources
  const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading || global.isLoading; // <-- UPDATED
  const error = pdp.error || commitment.error || planning.error || global.error; // <-- UPDATED

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
    updateGlobalMetadata: (data) => updateGlobalMetadata(db, data), // NEW: Expose global update function
    pdpData: pdp.pdpData, commitmentData: commitment.commitmentData, planningData: planning.planningData,
    isLoading, error, appId, IconMap: IconMap, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY, 
    // CRITICAL: Overwrite placeholder tiers with live metadata
    LEADERSHIP_TIERS: global.metadata.LEADERSHIP_TIERS || LEADERSHIP_TIERS, // <-- UPDATED
    // CRITICAL: Merge all global metadata into the service context
    ...global.metadata, // <-- NEW: Spreads COMMITMENT_BANK, SCENARIO_CATALOG, MOCK_ACTIVITY_DATA, etc.
    hasPendingDailyPractice, 
  }), [
    navigate, user, firebaseServices, userId, isAuthReady, isLoading, error, pdp, commitment, planning, global, hasPendingDailyPractice, db
  ]);

  if (!isAuthReady) return null;

  // Display initial loading spinner if global metadata is still loading (i.e., global.isLoading)
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
        const isReset = mode === 'reset';

        return (
            <div className='space-y-4'>
                <form onSubmit={(e) => { e.preventDefault(); handleAction(); }}>
                    {mode === 'signup' && (<input type="text" placeholder="Your Full Name" value={name} onChange={(e) => setName(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`} disabled={isLoading}/>)}
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`} 
                        disabled={isLoading}
                        autoComplete="email" 
                    />
{!isReset && (
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`} 
                            disabled={isLoading}
                            autoComplete={isLogin ? "current-password" : "new-password"} 
                        />
                    )}                    {mode === 'signup' && (<input type="text" placeholder="Secret Sign-up Code" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${TEAL}] focus:border-[${TEAL}]`} disabled={isLoading}/>)}
                    
                    {/* CRITICAL FIX: Ensure the submit button is inside the form and targets handleAction */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full p-3 bg-[#47A88D] text-white rounded-lg hover:bg-[#349881] focus:ring-2 focus:ring-[#47A88D]"
                    >
                        {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                    </button>
                </form>
                
                {statusMessage && (<p className={`text-sm text-center font-medium mt-3 ${statusMessage.includes('sent') ? `text-[${TEAL}]` : `text-[${ORANGE}]`}`}>{statusMessage}</p>)}
            </div>
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className={`p-8 bg-white rounded-xl shadow-2xl text-center w-full max-w-sm border-t-4 border-[${TEAL}]`}>
                <h2 className={`text-2xl font-extrabold text-[${NAVY}] mb-4`}>{mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'}</h2>
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
    // Relying on props here is cleaner if App.jsx is the source of truth for navigation.
    // NOTE: This auth comes from appServices, which holds the firebase auth instance.
    const { auth } = useAppServices(); 
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const NAVY = COLORS.NAVY;
    const TEAL = COLORS.TEAL;
    const ORANGE = COLORS.ORANGE;

    // --- UPDATED NAVIGATION FOR 3 PILLARS + CORE ---
    const coreNav = [
        { screen: 'dashboard', label: 'The Arena Dashboard', icon: Home }, 
        { screen: 'quick-start-accelerator', label: 'QuickStart: Bootcamp', icon: Zap, badge: 'New' }
    ];
    
    // Pillar 1: Content (The Learn & Prep Pillar)
    const contentPillarNav = [
        { screen: 'prof-dev-plan', label: 'Development Roadmap', icon: Dumbbell }, 
        { screen: 'planning-hub', label: 'Strategic Content Tools', icon: Trello },
        { screen: 'business-readings', label: 'Content: Read & Reps', icon: BookOpen }, 
        { screen: 'leadership-videos', label: 'Content: Leader Talks', icon: Film, badge: 'New' },
        { screen: 'applied-leadership', label: 'Applied Content Library', icon: ShieldCheck }
    ];
    
    // Pillar 2: Coaching (The Practice & Feedback Pillar)
    const coachingPillarNav = [
        { screen: 'daily-practice', label: 'Daily Practice Scorecard', icon: Clock}, 
        { screen: 'coaching-lab', label: 'AI Coaching Lab', icon: Mic }, 
        { screen: 'reflection', label: 'Executive ROI Report', icon: BarChart3 }
    ];
    
    // Pillar 3: Community (The Accountability & Growth Pillar)
    const communityPillarNav = [
        { screen: 'community', label: 'Peer & Leader Circles', icon: Users, badge: 'New' }
    ];
    
    const systemNav = [{ screen: 'app-settings', label: 'App Settings', icon: Settings }];

    const menuSections = [
        { title: 'THE ARENA CORE', items: coreNav }, 
        { title: 'CONTENT: LEARN & PREP', items: contentPillarNav }, 
        { title: 'COACHING: PRACTICE & FEEDBACK', items: coachingPillarNav }, 
        { title: 'COMMUNITY: ACCOUNTABILITY', items: communityPillarNav }, 
        { title: 'SYSTEM', items: systemNav }
    ];
    // --- END UPDATED NAVIGATION ---

    const handleSignOut = async () => {
        try { 
            if (auth) {
                // FIX: Correctly call the imported Firebase signOut function
                await signOut(auth); 
                console.log('Sign Out successful.'); 
            }
            closeMobileMenu();
        } catch (e) { 
            console.error('Sign out failed:', e); 
        }
    };

    // CRITICAL FIX: The handler must call the setCurrentScreen prop, which is the navigate function.
    const handleNavigate = useCallback((screen) => { 
        // setCurrentScreen is actually the 'navigate' function from App.jsx's state.
        setCurrentScreen(screen); // This works because setCurrentScreen prop receives the navigate function
        closeMobileMenu(); 
    }, [setCurrentScreen, closeMobileMenu]);
    
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

const ScreenRouter = ({ currentScreen, navParams, navigate }) => {
    const uniqueKey = currentScreen;
    
    // Fallback to Dashboard if the screen is not found in the map
    const Component = ScreenMap[currentScreen] || ScreenMap.dashboard;

    // Handle specific screen prop requirements
    // Note: AppSettingsScreen is handled via its direct component definition below.
    if (currentScreen === 'prof-dev-plan') {
        return <Component key={uniqueKey} initialScreen={currentScreen} />;
    }
    
    if (currentScreen === 'daily-practice') {
        return <Component 
            key={uniqueKey} 
            initialGoal={navParams.initialGoal} 
            initialTier={navParams.initialTier} 
        />;
    }
    
    // CRITICAL: Handle the AppSettingsScreen and the new Admin Maintenance Screen
    if (currentScreen === 'app-settings') {
        return <AppSettingsScreen key={uniqueKey} navigate={navigate} />; // Pass navigate to allow access to maintenance screen
    }
    if (currentScreen === 'data-maintenance') {
        return <Component key={uniqueKey} navigate={navigate} />; // Pass navigate
    }

    // Default route for lazy-loaded components
    return <Component key={uniqueKey} />;
};

const AppContent = ({ currentScreen, setCurrentScreen, user, navParams, isMobileOpen, setIsMobileOpen, isAuthRequired }) => {
    
    // FIX (Issue 1): Define the correct handler for closing the menu
    const closeMobileMenu = useCallback(() => { setIsMobileOpen(false); }, [setIsMobileOpen]);
    
    const { navigate } = useAppServices(); // Get the navigate function from context
    
    return (
        <div className="flex bg-gray-100 font-sans antialiased">
            <NavSidebar
                currentScreen={currentScreen}
                setCurrentScreen={setCurrentScreen} // Passes the navigate function (which is aliased as setCurrentScreen)
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
                    <ScreenRouter currentScreen={currentScreen} navParams={navParams} navigate={navigate} />
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

  // CRITICAL FIX 5: Use useCallback to ensure navigate is a stable function reference
  const navigate = useCallback((screen, params = {}) => { 
      // Ensure params is an object before setting
      setNavParams(typeof params === 'object' && params !== null ? params : {}); 
      setCurrentScreen(screen); 
  }, []);

  // Bridge: expose the real Gemini caller so services can forward to it (inside component)
  useEffect(() => {
    if (typeof window !== 'undefined') window.__callSecureGeminiAPI = callSecureGeminiAPI;
    return () => { if (typeof window !== 'undefined') delete window.__callSecureGeminiAPI; };
  }, [callSecureGeminiAPI]);


  useEffect(() => {
    if (typeof window !== 'undefined') window.__appNavigate = navigate;
    return () => { if (typeof window !== 'undefined') delete window.__appNavigate; };
  }, [navigate]);


  useEffect(() => {
    let app, firestore, authentication;
    let unsubscribeAuth = null;
    let timerId = null;

    if (DEBUG_MODE) {
        // ... (Debug mode logic remains unchanged)
        try { 
            const firebaseConfig = { apiKey: 'mock', authDomain: 'mock', projectId: 'mock' }; 
            app = initializeApp(firebaseConfig); 
            firestore = getFirestore(app); 
            authentication = getAuth(app); 
            setFirebaseServices({ db: firestore, auth: authentication }); 
        } catch { 
            try { 
                const existing = getApp(); 
                firestore = getFirestore(existing); 
                authentication = getAuth(existing); 
                setFirebaseServices({ db: firestore, auth: authentication }); 
            } catch {} 
        }
        setIsAuthReady(true); 
        setInitStage('ok'); 
        return; 
    }
    
    // --- FASTER INITIALIZATION SEQUENCE (Production Logic) ---
    
    // A flag to ensure we only finalize the ready state once
    let isInitialized = false; 
    const FAST_TIMEOUT = 1500; // Time in ms to wait before assuming no user is logged in

    const finalizeInit = (success = true, errorMsg = '') => {
        if (isInitialized) return;
        isInitialized = true;
        
        if (timerId) clearTimeout(timerId);

        if (success) {
             setInitStage('ok');
        } else {
             console.error("Auth Finalization Error:", errorMsg);
             setInitError(errorMsg || 'Authentication service failed to initialize.');
             setInitStage('error');
        }
        // CRITICAL: Immediately signal that the authentication state process is complete
        setIsAuthReady(true);
    };


    try {
      let firebaseConfig = {};
      
      if (typeof window !== 'undefined' && window.__firebase_config) {
        const cfg = window.__firebase_config;
        firebaseConfig = (typeof cfg === 'string') ? JSON.parse(cfg) : cfg;
      } else { 
        finalizeInit(false, 'Firebase configuration is missing from the environment.');
        return; 
      }
      
      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      authentication = getAuth(app); 

      setLogLevel('debug');
      setFirebaseServices({ db: firestore, auth: authentication });
      
      // Start the FAST_TIMEOUT timer
      // If the listener hasn't fired in 1.5 seconds, finalize the state to ready (unauthenticated)
      timerId = setTimeout(() => {
          if (!user && initStage === 'init') { // Only finalize if no user was found yet
              console.warn("Auth check timed out (1.5s). Rendering login screen proactively.");
              // Set to unauthenticated ready state
              finalizeInit(true); 
          }
      }, FAST_TIMEOUT);
      
      // The listener handles the final state transition when the network returns
      unsubscribeAuth = onAuthStateChanged(authentication, (currentUser) => {
        
        // This network call succeeded, so stop the proactive timer
        if (timerId) clearTimeout(timerId); 

        if (currentUser && currentUser.email) { 
          const uid = currentUser.uid;
          const email = currentUser.email;
          const name = currentUser.displayName || email.split('@')[0]; 
          setUserId(uid);
          setUser({ name: name, email: email, userId: uid }); 
          setAuthRequired(false);
        } else {
          setUser(null); setUserId(null); setAuthRequired(true); 
        }
        
        // Finalize state after the first (and only) call from the listener
        finalizeInit(true);
      });

      // Cleanup function returns the listener unsubscribe and clears the timer
      return () => { 
          if (unsubscribeAuth) unsubscribeAuth(); 
          if (timerId) clearTimeout(timerId);
      };
      
    } catch (e) {
      console.error('Firebase setup failed:', e);
      finalizeInit(false, e?.message || 'Firebase SDK threw an error.');
    }
  }, []); // Empty dependency array ensures this runs only once

  // CRITICAL FIX: Removed the handleBeforeUnload logic that was forcing signout on window close (Issue 12)
  useEffect(() => {
    return () => {}; // Empty cleanup, session persistence is managed by Firebase Auth settings
  }, []); 

  if (!DEBUG_MODE) {
    if (initStage === 'init') { 
        // Display the loading spinner while initStage is 'init' and we are not yet ready
        return (<div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div><p className="text-[#002E47] font-semibold">Initializing Authentication…</p></div></div>); 
    }
    if (initStage === 'error') { return (<React.Fragment><ConfigError message={initError} /></React.Fragment>); }
    
    // Once initStage is 'ok' AND isAuthReady is true, the app is ready to render AuthPanel or AppContent
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
              currentScreen={currentScreen} 
              setCurrentScreen={navigate}
              user={user} 
              navParams={navParams} 
              isMobileOpen={isMobileOpen} 
              setIsMobileOpen={setIsMobileOpen} // FIX: Correctly reference the declared setter
              isAuthRequired={authRequired} 
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
