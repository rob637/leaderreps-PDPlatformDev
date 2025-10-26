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
// ... (Console helpers remain unchanged) ...
try { window.getAuth = getAuth; window.getFirestore = getFirestore; window.doc = doc; window.getDoc = getDoc; window.setDoc = setDoc; window.updateDoc = updateDoc; window.onSnapshot = onSnapshot; window.collection = collection; window.getDocs = getDocs; window.addDoc = addDoc; window.writeBatch = writeBatch; window.arrayUnion = arrayUnion; window.arrayRemove = arrayRemove; window.increment = increment; window.serverTimestamp = serverTimestamp; window.fbReady = async function fbReady() { const auth = getAuth(); if (auth.currentUser) return true; await new Promise((resolve) => { const unsub = onAuthStateChanged(auth, () => { unsub(); resolve(true); }); }); return true; }; window.fb = window.fb || {}; window.fb.pathExplain = function pathExplain(path) { const parts = (path || '').split('/').filter(Boolean); const isCollection = parts.length % 2 === 1; const kind = isCollection ? 'collection' : 'document'; const tip = isCollection ? 'Looks like a collection path. You can list documents here.' : 'Looks like a document path. Remove the last segment to list the parent collection.'; return { parts, segments: parts.length, kind, tip }; }; window.fb.ensureUserDocs = async function ensureUserDocs() { await window.fbReady(); const auth = getAuth(); const db = getFirestore(); const uid = auth.currentUser?.uid; if (!uid) throw new Error('No signed-in user'); const paths = [ ['leadership_plan', uid, 'profile', 'roadmap', { plan_goals: [], last_updated: new Date().toISOString() }], ['user_commitments', uid, 'profile', 'active', { active_commitments: [], reflection_journal: '' }], ['user_planning', uid, 'profile', 'drafts', { drafts: [] }], ]; for (const [coll, u, prof, docId, seed] of paths) { const ref = doc(db, coll, u, prof, docId); const snap = await getDoc(ref); if (!snap.exists()) { await setDoc(ref, seed, { merge: true }); await updateDoc(ref, { __touched: serverTimestamp() }).catch(() => {}); } } }; window.fb.checkUserDocs = async function checkUserDocs() { await window.fbReady(); const auth = getAuth(); const db = getFirestore(); const uid = auth.currentUser?.uid; if (!uid) throw new Error('No signed-in user'); const refs = { roadmap: doc(db, 'leadership_plan', uid, 'profile', 'roadmap'), active: doc(db, 'user_commitments', uid, 'profile', 'active'), drafts: doc(db, 'user_planning', uid, 'profile', 'drafts'), }; const [r, a, d] = await Promise.all([getDoc(refs.roadmap), getDoc(refs.active), getDoc(refs.drafts)]); const out = { roadmap: r.data() || null, active: a.data() || null, drafts: d.data() || null }; console.log('[TEST READS]', out); return out; }; window.fb.liveTest = async function liveTest() { await window.fbReady(); const auth = getAuth(); const db = getFirestore(); const uid = auth.currentUser?.uid; if (!uid) throw new Error('No signed-in user'); const unsubs = [ onSnapshot(doc(db, 'leadership_plan', uid, 'profile', 'roadmap'), (s) => console.log('[LIVE] roadmap', s.exists(), s.data()) ), onSnapshot(doc(db, 'user_commitments', uid, 'profile', 'active'), (s) => console.log('[LIVE] active', s.exists(), s.data()) ), onSnapshot(doc(db, 'user_planning', uid, 'profile', 'drafts'), (s) => console.log('[LIVE] drafts', s.exists(), s.data()) ), ]; console.log('[LIVE] listeners attached; call each function to unsubscribe:', unsubs); return unsubs; }; } catch (e) { console.warn('Console helpers init failed:', e); }

/* -----------------------------------------------------------------------------
   GEMINI CONFIG (Unchanged)
----------------------------------------------------------------------------- */
// ... (Gemini config remains unchanged) ...
const GEMINI_MODEL = 'gemini-2.5-flash'; const GEMINI_API_VERSION = 'v1beta'; const USE_SERVERLESS = typeof window !== 'undefined' && window.__GEMINI_MODE === 'direct' ? false : true; const API_KEY = typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : USE_SERVERLESS ? 'SERVERLESS' : ''; const DEBUG_MODE = false; const callSecureGeminiAPI = async (payload, maxRetries = 3, delay = 1000) => { const norm = (p = {}) => { const out = { ...p }; if (out.systemInstruction && !out.system_instruction) { out.system_instruction = out.systemInstruction; delete out.systemInstruction; } if (Array.isArray(out.tools)) delete out.tools; out.model = out.model || GEMINI_MODEL; return out; }; const body = JSON.stringify(norm(payload)); let apiUrl = ''; if (USE_SERVERLESS) { apiUrl = '/.netlify/functions/gemini'; } else { const directKey = typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : ''; if (!directKey) throw new Error('Gemini API Key is missing for direct mode. Set __GEMINI_API_KEY or use serverless.'); apiUrl = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent?key=${directKey}`; } for (let attempt = 0; attempt < maxRetries; attempt++) { try { const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }); if (response.ok) return response.json(); if (response.status === 429 || response.status >= 500) { if (attempt < maxRetries - 1) { await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt))); continue; } } const errorBody = await response.text(); throw new Error(`API Request Failed: HTTP ${response.status} - ${errorBody}`); } catch (error) { if (attempt === maxRetries - 1) throw new Error(`Network Error after ${maxRetries} attempts: ${error.message}`); await new Promise((r) => setTimeout(r, delay * Math.pow(2, attempt))); } } throw new Error('Maximum retries exceeded.'); }; const hasGeminiKey = () => (USE_SERVERLESS ? true : !!(typeof __GEMINI_API_KEY !== 'undefined' && __GEMINI_API_KEY));


/* -----------------------------------------------------------------------------
   ICONS & CONSTANTS (ChevronLeft/Right Added)
----------------------------------------------------------------------------- */
import {
  Home, Zap, ShieldCheck, TrendingUp, Mic, BookOpen, Settings, User, LogOut, CornerRightUp, Clock, Briefcase, Target, Users, BarChart3, Globe, Code, Bell, Lock, Download, Trash2, Mail, Link, Menu, Trello, Film, Dumbbell, Cpu,
  ChevronLeft, ChevronRight // <-- NEW ICONS for sidebar toggle
} from 'lucide-react';
// ... (IconMap, SECRET_SIGNUP_CODE, LEADERSHIP_TIERS_FALLBACK remain unchanged) ...
const IconMap = {}; const SECRET_SIGNUP_CODE = 'mock-code-123'; const LEADERSHIP_TIERS_FALLBACK = { T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' }, T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' }, T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' }, T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-600' }, T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' }, };
// ... (notepad compat remains unchanged) ...
if (typeof window !== 'undefined' && typeof window.notepad === 'undefined') { window.notepad = { setTitle: () => {}, addContent: () => {}, getContent: () => {} }; } const notepad = typeof globalThis !== 'undefined' ? globalThis.notepad : typeof window !== 'undefined' ? window.notepad : undefined;

/* -----------------------------------------------------------------------------
   LAZY ROUTES (Unchanged)
----------------------------------------------------------------------------- */
// ... (ScreenMap remains unchanged) ...
const ScreenMap = { dashboard: lazy(() => import('./components/screens/Dashboard.jsx')), 'development-plan': lazy(() => import('./components/screens/DevelopmentPlan.jsx')), 'coaching-lab': lazy(() => import('./components/screens/Labs.jsx')), 'daily-practice': lazy(() => import('./components/screens/DailyPractice.jsx')), 'planning-hub': lazy(() => import('./components/screens/PlanningHub.jsx')), 'business-readings': lazy(() => import('./components/screens/BusinessReadings.jsx')), 'quick-start-accelerator': lazy(() => import('./components/screens/QuickStartAccelerator.jsx')), reflection: lazy(() => import('./components/screens/ExecutiveReflection.jsx')), community: lazy(() => import('./components/screens/CommunityScreen.jsx')), 'applied-leadership': lazy(() => import('./components/screens/AppliedLeadership.jsx')), 'leadership-videos': lazy(() => import('./components/screens/LeadershipVideos.jsx')), 'data-maintenance': lazy(() => import('./components/screens/AdminDataMaintenance.jsx')), 'debug-data': lazy(() => import('./components/screens/DebugDataViewer.jsx')), };

/* -----------------------------------------------------------------------------
   SETTINGS CARD + SCREEN (Unchanged)
----------------------------------------------------------------------------- */
// ... (COLORS, SettingsCard, AppSettingsScreen remain unchanged) ...
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', ORANGE: '#E04E1B' }; const SettingsCard = ({ title, icon: Icon, children }) => ( <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-lg space-y-4"> <h3 className="text-xl font-bold flex items-center gap-2 border-b pb-2" style={{ color: COLORS.NAVY }}> <Icon size={22} style={{ color: COLORS.TEAL }} /> {title} </h3> {children} </div> ); const AppSettingsScreen = ({ navigate }) => { const { user, API_KEY, auth } = useAppServices(); const handleResetPassword = async () => { if (!user?.email) { alert('Cannot reset password: User email is unknown.'); return; } try { await sendPasswordResetEmail(auth, user.email); alert(`Password reset email sent to ${user.email}.`); } catch (error) { alert(`Failed to send reset email: ${error.message}`); } }; const handleAdminClick = () => { const pin = window.prompt('Enter Admin PIN:'); if (pin === '7777') { navigate('data-maintenance'); } else if (pin) { alert('Access Denied.'); } }; return ( <div className="p-8 space-y-8 max-w-4xl mx-auto"> <h1 className="text-4xl font-extrabold text-[#002E47]">App Settings</h1> <p className="mt-2 text-gray-600">Manage your profile, security, integrations, and data.</p> <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> <SettingsCard title="User Account" icon={User}> <p className="text-sm text-gray-700"> <strong>Full Name:</strong> <span className="font-semibold">{user?.name || 'N/A'}</span> </p> <p className="text-sm text-gray-700"> <strong>Email:</strong> <span className="font-semibold">{user?.email || 'N/A'}</span> </p> <button onClick={handleResetPassword} className="text-sm font-semibold text-[#E04E1B] hover:text-red-700 mt-2"> Change Password (Send Reset Link) </button> </SettingsCard> <SettingsCard title="Security" icon={Lock}> <p className="text-sm text-gray-700"> <strong>2FA Status:</strong> <span className="font-semibold text-red-500">Disabled</span> </p> <p className="text-sm text-gray-700"> <strong>Last Sign In:</strong> <span className="font-semibold">{new Date().toLocaleString()}</span> </p> <button className="text-sm font-semibold text-[#002E47] hover:text-[#47A88D] mt-2">Sign Out From All Devices</button> </SettingsCard> <SettingsCard title="AI Integration" icon={Code}> <label className="block text-sm font-medium text-gray-700">Gemini API Key</label> <input type="password" value={API_KEY ? '••••••••••••••••' : ''} readOnly placeholder="Configure in Netlify/Vite environment" className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-gray-50" /> <p className="text-xs text-gray-500 mt-1"> Status: <span className={`font-semibold ${API_KEY ? 'text-green-600' : 'text-red-500'}`}>{API_KEY ? 'Active' : 'Missing'}</span> </p> </SettingsCard> <SettingsCard title="Global Data Maintenance (Admin)" icon={Cpu}> <p className="text-sm text-gray-700"> Admin-only tools for editing app-wide JSON and raw Firestore reads. </p> <button onClick={handleAdminClick} className="text-sm font-semibold text-[#E04E1B] hover:text-red-700 mt-2 flex items-center"> <Settings size={14} className="inline-block mr-1" /> Launch Data Manager </button> </SettingsCard> </div> </div> ); };

/* -----------------------------------------------------------------------------
   DATA PROVIDER (Unchanged)
----------------------------------------------------------------------------- */
// ... (DataProvider remains unchanged) ...
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id'; const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => { const { db } = firebaseServices; const pdp = usePDPData(db, userId, isAuthReady); const commitment = useCommitmentData(db, userId, isAuthReady); const planning = usePlanningData(db, userId, isAuthReady); const global = useGlobalMetadata(db, userId, isAuthReady); try { if (global && typeof global.metadata === 'object') { console.log('[GLOBAL SNAPSHOT]', { keys: Object.keys(global.metadata || {}), size: JSON.stringify(global.metadata || {}).length, }); } } catch {} const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading || global.isLoading; const error = pdp.error || commitment.error || planning.error || global.error; const hasPendingDailyPractice = useMemo(() => { const active = commitment.commitmentData?.active_commitments || []; const isPending = active.some((c) => c.status === 'Pending'); const reflectionMissing = !commitment.commitmentData?.reflection_journal?.trim(); return active.length > 0 && (isPending || reflectionMissing); }, [commitment.commitmentData]); const appServices = useMemo( () => ({ navigate, user, ...firebaseServices, userId, isAuthReady, db, updatePdpData: pdp.updatePdpData, saveNewPlan: pdp.saveNewPlan, updateCommitmentData: commitment.updateCommitmentData, updatePlanningData: planning.updatePlanningData, updateGlobalMetadata: (data, opts) => updateGlobalMetadata(db, data, { merge: true, source: (opts && opts.source) || 'Provider', userId: user?.uid, ...(opts || {}), }), pdpData: pdp.pdpData, commitmentData: commitment.commitmentData, planningData: planning.planningData, isLoading, error, appId, IconMap, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL, API_KEY, LEADERSHIP_TIERS: global.metadata.LEADERSHIP_TIERS || LEADERSHIP_TIERS_FALLBACK, ...global.metadata, hasPendingDailyPractice, }), [navigate, user, firebaseServices, userId, isAuthReady, isLoading, error, pdp, commitment, planning, global, hasPendingDailyPractice, db] ); if (!isAuthReady) return null; if (isLoading) { return ( <div className="min-h-screen flex items-center justify-center bg-gray-100"> <div className="flex flex-col items-center"> <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div> <p className="text-[#002E47] font-semibold">Loading User Data & Global Config...</p> </div> </div> ); } return <AppServiceContext.Provider value={appServices}>{children}</AppServiceContext.Provider>; };

/* -----------------------------------------------------------------------------
   NAV + ROUTER (*** UPDATED for Collapsible Sidebar ***)
----------------------------------------------------------------------------- */
function ConfigError({ message }) { /* ... unchanged ... */ return ( <div className="p-6 max-w-xl mx-auto mt-12 bg-red-50 border border-red-200 rounded-xl text-red-700"> <h3 className="font-bold text-lg mb-1">Configuration Error</h3> <p className="text-sm">{message || 'An unknown error occurred.'}</p> </div> ); }
function AuthPanel({ auth, onSuccess }) { /* ... unchanged ... */ const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [name, setName] = useState(''); const [secretCode, setSecretCode] = useState(''); const [mode, setMode] = useState('login'); const [statusMessage, setStatusMessage] = useState(''); const [isLoading, setIsLoading] = useState(false); const isLogin = mode === 'login'; const isReset = mode === 'reset'; const handleAction = async () => { setIsLoading(true); setStatusMessage(''); try { if (mode === 'login') { await signInWithEmailAndPassword(auth, email, password); onSuccess(); } else if (mode === 'reset') { await sendPasswordResetEmail(auth, email); setStatusMessage('Password reset email sent. Check your inbox.'); } else if (mode === 'signup') { if (secretCode !== SECRET_SIGNUP_CODE) { throw new Error('Invalid secret sign-up code.'); } await createUserWithEmailAndPassword(auth, email, password); onSuccess(); } } catch (e) { console.error('Auth action failed:', e); setStatusMessage(e.message); } setIsLoading(false); }; return ( <div className="min-h-screen flex items-center justify-center bg-gray-100"> <div className={`p-8 bg-white rounded-xl shadow-2xl text-center w-full max-w-sm border-t-4 border-[${COLORS.TEAL}]`}> <h2 className={`text-2xl font-extrabold text-[${COLORS.NAVY}] mb-4`}> {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Reset Password'} </h2> <p className="text-sm text-gray-600 mb-6"> {isReset ? 'Enter your email to receive a password reset link.' : 'Log in to access your leadership platform.'} </p> <div className="space-y-4"> <form onSubmit={(e) => { e.preventDefault(); handleAction(); }} > {mode === 'signup' && ( <input type="text" placeholder="Your Full Name" value={name} onChange={(e) => setName(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]`} disabled={isLoading} /> )} <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]`} disabled={isLoading} autoComplete="email" /> {!isReset && ( <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]`} disabled={isLoading} autoComplete={isLogin ? 'current-password' : 'new-password'} /> )} {mode === 'signup' && ( <input type="text" placeholder="Secret Sign-up Code" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]`} disabled={isLoading} /> )} <button type="submit" disabled={isLoading} className="w-full p-3 bg-[#47A88D] text-white rounded-lg hover:bg-[#349881] focus:ring-2 focus:ring-[#47A88D]"> {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'} </button> </form> {statusMessage && ( <p className={`text-sm text-center font-medium mt-3 ${statusMessage.includes('sent') ? `text-[${COLORS.TEAL}]` : 'text-[#E04E1B]'}`}> {statusMessage} </p> )} </div> <div className="mt-6 border-t pt-4 border-gray-200 space-y-2"> {mode !== 'signup' && ( <button onClick={() => { setMode('signup'); setStatusMessage(''); }} className={`text-sm text-[${COLORS.TEAL}] hover:text-[${COLORS.NAVY}] font-semibold block w-full`}> Need an account? Sign up </button> )} {mode !== 'login' && ( <button onClick={() => { setMode('login'); setStatusMessage(''); }} className={`text-sm text-gray-500 hover:text-[${COLORS.NAVY}] block w-full`}> Back to Sign In </button> )} {mode === 'login' && ( <button onClick={() => { setMode('reset'); setStatusMessage(''); }} className={`text-sm text-gray-500 hover:text-[${COLORS.ORANGE}] block w-full`}> Forgot Password? </button> )} </div> </div> </div> ); }

// --- UPDATED NavSidebar ---
const NavSidebar = ({
  currentScreen,
  setCurrentScreen,
  user,
  closeMobileMenu,
  isAuthRequired,
  isCollapsed, // <-- NEW PROP
  toggleCollapse // <-- NEW PROP
}) => {
  const { auth } = useAppServices();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- COLORS ---
  const NAVY = '#002E47'; // Use direct hex for Tailwind JIT
  const TEAL = '#47A88D';
  const ORANGE = '#E04E1B';

  // --- NAV SECTIONS (Unchanged) ---
  const coreNav = [ { screen: 'dashboard', label: 'Dashboard', icon: Home }, { screen: 'quick-start-accelerator', label: 'QuickStart', icon: Zap, badge: 'New' }, ];
  const contentPillarNav = [ { screen: 'development-plan', label: 'Dev Plan', icon: Briefcase }, { screen: 'planning-hub', label: 'Content Tools', icon: Trello }, { screen: 'business-readings', label: 'Readings', icon: BookOpen }, { screen: 'leadership-videos', label: 'Videos', icon: Film, badge: 'New' }, { screen: 'applied-leadership', label: 'Applied Library', icon: ShieldCheck }, ];
  const coachingPillarNav = [ { screen: 'daily-practice', label: 'Daily Practice', icon: Clock }, { screen: 'coaching-lab', label: 'AI Coaching', icon: Mic }, { screen: 'reflection', label: 'ROI Report', icon: BarChart3 }, ];
  const communityPillarNav = [{ screen: 'community', label: 'Community', icon: Users, badge: 'New' }];
  const systemNav = [{ screen: 'app-settings', label: 'Settings', icon: Settings }];
  const menuSections = [ { title: 'CORE', items: coreNav }, { title: 'CONTENT', items: contentPillarNav }, { title: 'COACHING', items: coachingPillarNav }, { title: 'COMMUNITY', items: communityPillarNav }, { title: 'SYSTEM', items: systemNav }, ];

  const handleSignOut = async () => { /* ... unchanged ... */ try { if (auth) { await signOut(auth); console.log('Sign Out successful.'); } closeMobileMenu(); } catch (e) { console.error('Sign out failed:', e); } };
  const handleNavigate = useCallback((screen) => { setCurrentScreen(screen); closeMobileMenu(); }, [setCurrentScreen, closeMobileMenu]);

  // --- UPDATED renderNavItems ---
  const renderNavItems = (items) =>
    items.map((item) => {
      const Icon = item.icon;
      const isActive = currentScreen === item.screen;
      return (
        <button
          key={item.screen}
          onClick={() => handleNavigate(item.screen)}
          title={item.label} // <-- Tooltip for collapsed state
          className={`group flex items-center w-full px-3 py-2.5 rounded-lg font-semibold relative transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[${TEAL}]/50
            ${isActive
              ? `bg-white text-[${NAVY}] shadow-md` // Active style simpler
              : `text-white hover:bg-[${TEAL}]/20 hover:text-white` // Inactive style
            }
            ${isCollapsed ? 'justify-center' : ''}` // Center icon when collapsed
          }
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? `text-[${TEAL}]` : 'text-gray-300 group-hover:text-white'} ${isCollapsed ? '' : 'mr-3'}`} />
          {/* Conditionally render label */}
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left text-sm">{item.label}</span>
              {item.badge && (
                <span className={`ml-2 px-1.5 py-0.5 text-xs font-bold rounded-full bg-[${ORANGE}] text-white`}>{item.badge}</span>
              )}
            </>
          )}
        </button>
      );
    });

  if (isAuthRequired) return null;

  // --- UPDATED Root Div for Width and Transition ---
  return (
    <div className={`hidden md:flex flex-col bg-[${NAVY}] text-white shadow-2xl transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}>

      {/* --- UPDATED Header --- */}
      <div className={`flex items-center justify-center h-16 border-b border-[${TEAL}]/50 mb-4 flex-shrink-0 ${isCollapsed ? 'px-1' : 'px-4'}`}>
         {/* Show only icon when collapsed */}
         {isCollapsed ? (
             <CornerRightUp className={`w-7 h-7 text-[${TEAL}]`} />
         ) : (
            <h1 className="text-xl font-extrabold flex items-center whitespace-nowrap">
               <CornerRightUp className={`w-6 h-6 mr-2 text-[${TEAL}]`} /> LeaderReps
            </h1>
         )}
      </div>

      {/* --- UPDATED Nav Area --- */}
      <nav className={`flex-1 space-y-3 overflow-y-auto px-2`}>
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {/* Hide titles when collapsed */}
            {!isCollapsed && (
              <p className={`px-2 py-1 text-xs font-bold uppercase tracking-wider text-[${TEAL}]/80`}>
                {section.title}
              </p>
            )}
            <div className="space-y-1">{renderNavItems(section.items)}</div>
          </div>
        ))}
      </nav>

      {/* --- UPDATED Footer & Toggle Button --- */}
      <div className={`border-t border-[${TEAL}]/50 mt-4 relative flex-shrink-0 ${isCollapsed ? 'p-1' : 'p-3'}`}>
        {/* Profile Button */}
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          title={user?.name || 'User Profile'}
          className={`flex items-center w-full p-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[${TEAL}]/20 focus:outline-none focus:ring-1 focus:ring-[${TEAL}] ${isCollapsed ? 'justify-center' : ''}`}
        >
          <User className={`w-5 h-5 flex-shrink-0 text-indigo-300 ${isCollapsed ? '' : 'mr-2'}`} />
          {!isCollapsed && <span className="truncate flex-1 text-left">{user?.name || `Guest User`}</span>}
        </button>

        {/* Profile Popup (adjust position based on collapse state if needed) */}
        {isProfileOpen && ( /* ... unchanged profile popup ... */
          <div className={`absolute bottom-full left-0 mb-3 w-full p-4 rounded-xl shadow-2xl bg-[${NAVY}] border border-[${TEAL}]/50 z-10 animate-in fade-in slide-in-from-bottom-2 ${isCollapsed ? 'w-48 left-16' : ''}`}>
             <p className="text-xs font-medium uppercase text-indigo-300 mb-1">Account Info</p> <p className="text-sm font-semibold truncate mb-2 text-white" title={user?.email}>{user?.email || 'N/A'}</p> <p className="text-xs text-gray-400 break-words mb-4">UID: {user?.userId || 'N/A'}</p> <button onClick={handleSignOut} className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-semibold transition-colors bg-[${ORANGE}] text-white hover:bg-red-700`}><LogOut className="w-4 h-4 mr-2" /> Sign Out</button>
           </div>
        )}

        {/* Sidebar Toggle Button */}
         <button
            onClick={toggleCollapse}
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            className={`mt-2 w-full flex items-center p-2 rounded-lg text-sm font-semibold transition-colors text-gray-300 hover:bg-[${TEAL}]/20 hover:text-white focus:outline-none focus:ring-1 focus:ring-[${TEAL}] ${isCollapsed ? 'justify-center' : 'justify-start'}`}
         >
             {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 mr-2" />}
             {!isCollapsed && <span className="text-xs">Collapse</span>}
         </button>
      </div>
    </div>
  );
};

// --- ScreenRouter (Unchanged) ---
const ScreenRouter = ({ currentScreen, navParams, navigate }) => { /* ... unchanged ... */
  const Component = ScreenMap[currentScreen] || ScreenMap.dashboard; if (currentScreen === 'daily-practice') return <Component key={currentScreen} initialGoal={navParams.initialGoal} initialTier={navParams.initialTier} />; if (currentScreen === 'app-settings') return <AppSettingsScreen key={currentScreen} navigate={navigate} />; if (currentScreen === 'data-maintenance') return <Component key={currentScreen} navigate={navigate} />; if (currentScreen === 'debug-data') return <Component key={currentScreen} navigate={navigate} />; return <Component key={currentScreen} />;
};

// --- UPDATED AppContent ---
const AppContent = ({
  currentScreen,
  setCurrentScreen,
  user,
  navParams,
  isMobileOpen,
  setIsMobileOpen,
  isAuthRequired,
  isSidebarCollapsed, // <-- NEW PROP
  toggleSidebar // <-- NEW PROP
}) => {
  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), [setIsMobileOpen]);
  const { navigate } = useAppServices();

  return (
    // --- UPDATED Outer Div ---
    <div className="flex min-h-screen bg-gray-100 font-sans antialiased">
      {/* Pass new props to NavSidebar */}
      <NavSidebar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        user={user}
        isMobileOpen={isMobileOpen}
        closeMobileMenu={closeMobileMenu}
        isAuthRequired={isAuthRequired}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebar}
      />

      {/* --- UPDATED Main Content Area --- */}
      {/* Add dynamic margin based on sidebar state */}
      <main className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {/* Mobile Header (unchanged) */}
        <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-40"> <h1 className="text-xl font-bold text-[#002E47]">LeaderReps</h1> <button onClick={() => setIsMobileOpen(true)} className="p-2 text-[#002E47] hover:text-[#47A88D]"><Menu className="w-6 h-6" /></button> </div>

        {/* Suspense and Router (unchanged) */}
        <Suspense fallback={ <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div><p className="text-[#002E47] font-semibold">Loading App Content...</p></div></div> }>
          <ScreenRouter currentScreen={currentScreen} navParams={navParams} navigate={navigate} />
        </Suspense>
      </main>

      {/* --- Mobile Sidebar (Needs similar collapse logic if desired, or keep as overlay) --- */}
      {/* Basic overlay implementation - could be enhanced */}
       {isMobileOpen && (
            <div className="fixed inset-0 z-50 flex md:hidden">
                {/* Overlay */}
                <div className="fixed inset-0 bg-black/50" onClick={closeMobileMenu}></div>
                {/* Actual Sidebar Content for Mobile */}
                <div className="relative z-10 w-64 bg-[#002E47] h-full shadow-xl">
                     {/* Render a non-collapsible version for mobile simplicity */}
                    <NavSidebar
                        currentScreen={currentScreen}
                        setCurrentScreen={setCurrentScreen}
                        user={user}
                        isMobileOpen={isMobileOpen} // Pass down?
                        closeMobileMenu={closeMobileMenu}
                        isAuthRequired={isAuthRequired}
                        isCollapsed={false} // Force expanded on mobile overlay
                        toggleCollapse={() => {}} // No toggle needed here
                    />
                </div>
            </div>
        )}

    </div>
  );
};

/* -----------------------------------------------------------------------------
   ROOT APP (*** UPDATED with Sidebar State ***)
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

  const [initStage, setInitStage] = useState('init');
  const [initError, setInitError] = useState('');

  // --- NEW: Sidebar Collapse State ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = useCallback(() => setIsSidebarCollapsed(prev => !prev), []);
  // --- END NEW ---

  const navigate = useCallback((screen, params = {}) => {
    setNavParams(typeof params === 'object' && params !== null ? params : {});
    setCurrentScreen(screen);
    // Optionally close mobile menu on navigation
    setIsMobileOpen(false);
    // Optionally expand sidebar on navigation if it was collapsed
    // setIsSidebarCollapsed(false);
  }, []);

  // Expose Gemini caller + navigate for debugging (unchanged)
  useEffect(() => { if (typeof window !== 'undefined') window.__callSecureGeminiAPI = callSecureGeminiAPI; return () => { if (typeof window !== 'undefined') delete window.__callSecureGeminiAPI; }; }, []);
  useEffect(() => { if (typeof window !== 'undefined') window.__appNavigate = navigate; return () => { if (typeof window !== 'undefined') delete window.__appNavigate; }; }, [navigate]);

  // Firebase init/auth (unchanged)
  useEffect(() => { /* ... unchanged firebase init logic ... */ let app, firestore, authentication; let unsubscribeAuth = null; let timerId = null; const finalizeInit = (success = true, errorMsg = '') => { if (timerId) clearTimeout(timerId); if (success) setInitStage('ok'); else { console.error('Auth Finalization Error:', errorMsg); setInitError(errorMsg || 'Authentication service failed to initialize.'); setInitStage('error'); } setIsAuthReady(true); }; try { let firebaseConfig = {}; if (typeof window !== 'undefined' && window.__firebase_config) { const cfg = window.__firebase_config; firebaseConfig = typeof cfg === 'string' ? JSON.parse(cfg) : cfg; } else { finalizeInit(false, 'Firebase configuration is missing from the environment.'); return; } app = initializeApp(firebaseConfig); firestore = getFirestore(app); authentication = getAuth(app); setLogLevel('debug'); setFirebaseServices({ db: firestore, auth: authentication }); timerId = setTimeout(() => { if (!user) finalizeInit(true); }, 500); unsubscribeAuth = onAuthStateChanged(authentication, (currentUser) => { if (timerId) clearTimeout(timerId); if (currentUser && currentUser.email) { const uid = currentUser.uid; const email = currentUser.email; const name = currentUser.displayName || email.split('@')[0]; setUserId(uid); setUser({ name, email, userId: uid }); setAuthRequired(false); } else { setUser(null); setUserId(null); setAuthRequired(true); } finalizeInit(true); }); return () => { if (unsubscribeAuth) unsubscribeAuth(); if (timerId) clearTimeout(timerId); }; } catch (e) { console.error('Firebase setup failed:', e); finalizeInit(false, e?.message || 'Firebase SDK threw an error.'); } }, []);

  // --- Render logic (unchanged structure, passes new props) ---
  if (initStage === 'init') { /* ... unchanged loading ... */ return ( <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div><p className="text-[#002E47] font-semibold">Initializing Authentication…</p></div></div> ); }
  if (initStage === 'error') return <ConfigError message={initError} />;
  if (!user && isAuthReady) { /* ... unchanged auth panel ... */ return ( <AuthPanel auth={firebaseServices.auth} onSuccess={() => { setAuthRequired(false); setTimeout(() => navigate('dashboard'), 0); }} /> ); }

  return (
    <DataProvider
      firebaseServices={firebaseServices}
      userId={userId}
      isAuthReady={isAuthReady}
      navigate={navigate}
      user={user}
    >
      <Suspense fallback={ /* ... unchanged suspense fallback ... */ <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 border-t-[#47A88D] mb-3"></div><p className="text-[#002E47] font-semibold">Loading App Content...</p></div></div> }>
        {/* Pass sidebar state and toggle function down */}
        <AppContent
          currentScreen={currentScreen}
          setCurrentScreen={navigate}
          user={user}
          navParams={navParams}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isAuthRequired={authRequired}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
      </Suspense>
    </DataProvider>
  );
};

// --- Root export (unchanged) ---
export default function Root(props) { /* ... unchanged ... */ const forceSanity = typeof window !== 'undefined' && /[?&]sanity=1/.test(window.location.search); if (false || forceSanity) { return ( <div style={{ padding: 32, fontSize: 18, lineHeight: 1.4 }}> <div>✅ <strong>React mounted (Sanity Check)</strong></div> </div> ); } return <App {...props} />; }