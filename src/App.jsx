// src/App.jsx (Refactored for Consistency, Features, Admin, Daily Resets)

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';

// --- Core Services & Context ---
// Uses the renamed hooks and provides renamed data/functions
import {
  AppServiceContext,
  useDevelopmentPlanData, // Renamed hook
  useDailyPracticeData,   // Renamed hook
  useStrategicContentData, // Renamed hook
  useGlobalMetadata,
  updateGlobalMetadata, // Stays the same, handles nested structure now
  ensureUserDocs,       // For seeding user documents
  useAppServices        // Hook to consume context
} from './services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Firebase Imports (Authentication & Firestore) ---
import { initializeApp } from 'firebase/app';
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
  // --- NOTE: Firestore actions (doc, getDoc, setDoc, etc.) are now primarily handled within useAppServices.jsx ---
  // --- We might still need serverTimestamp directly here or in components ---
  serverTimestamp,
  collection, // Keep for potential direct use (e.g., ensureUserDocs check?)
  query,      // Keep for potential direct use
  orderBy,    // Keep for potential direct use
} from 'firebase/firestore';

// --- UI/UX & Icons ---
// Consolidated icon imports
import {
  Home, Zap, ShieldCheck, TrendingUp, Mic, BookOpen, Settings, User, LogOut,
  CornerRightUp, Clock, Briefcase, Target, Users, BarChart3, Globe, Code,
  Bell, Lock, Download, Trash2, Mail, Link, Menu, Trello, Film, Dumbbell, Cpu,
  ChevronLeft, ChevronRight, X, Loader, AlertTriangle, ChevronsLeft, ChevronsRight, // Added Loader, AlertTriangle, Chevrons
  Shield, // Icon for Admin Functions
} from 'lucide-react';


/* =========================================================
   DEV CONSOLE HELPERS (No structural changes needed)
========================================================= */
// The existing console helpers (window.fbReady, window.fb.pathExplain, etc.) remain useful for debugging.
// Ensure they use the correct Firestore V9 modular functions if used directly.


/* =========================================================
   GLOBAL CONFIG & CONSTANTS (Aligned with useAppServices)
========================================================= */
// --- Primary Color Palette (Ensure consistency) ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', ORANGE: '#E04E1B', GREEN: '#10B981', BLUE: '#2563EB', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: User Request

// --- Authentication ---
const SECRET_SIGNUP_CODE = 'mock-code-123'; // Keep for mock signup flow

// --- Gemini Config (Handled within useAppServices) ---
// const GEMINI_MODEL = ... (Defined in useAppServices)
// const callSecureGeminiAPI = ... (Provided by useAppServices)
// const hasGeminiKey = ... (Provided by useAppServices)

// --- Icon Map (Loaded via useGlobalMetadata in useAppServices) ---
// const IconMap = ...


/* =========================================================
   LAZY LOADED SCREEN COMPONENTS (Updated List & Paths)
========================================================= */
const ScreenMap = {
  'dashboard': lazy(() => import('./components/screens/Dashboard.jsx')), // cite: Dashboard.jsx
  'development-plan': lazy(() => import('./components/screens/DevelopmentPlan.jsx')), // cite: DevelopmentPlan.jsx
  'coaching-lab': lazy(() => import('./components/screens/Labs.jsx')), // cite: Labs.jsx
  'daily-practice': lazy(() => import('./components/screens/DailyPractice.jsx')), // Replaced Reflection screen with this log entry screen // cite: DailyPractice.jsx
  'planning-hub': lazy(() => import('./components/screens/PlanningHub.jsx')), // cite: PlanningHub.jsx
  'business-readings': lazy(() => import('./components/screens/BusinessReadings.jsx')), // cite: BusinessReadings.jsx
  'quick-start-accelerator': lazy(() => import('./components/screens/QuickStartAccelerator.jsx')), // cite: QuickStartAccelerator.jsx
  'executive-reflection': lazy(() => import('./components/screens/ExecutiveReflection.jsx')), // ROI Report // cite: ExecutiveReflection.jsx
  'community': lazy(() => import('./components/screens/CommunityScreen.jsx')), // cite: CommunityScreen.jsx
  'applied-leadership': lazy(() => import('./components/screens/AppliedLeadership.jsx')), // Course Hub // cite: AppliedLeadership.jsx
  'leadership-videos': lazy(() => import('./components/screens/LeadershipVideos.jsx')), // cite: LeadershipVideos.jsx
  'app-settings': lazy(() => import('./components/screens/AppSettings.jsx')), // Renamed component file assumed
  'admin-functions': lazy(() => import('./components/screens/AdminFunctions.jsx')), // NEW Admin screen
  'data-maintenance': lazy(() => import('./components/screens/AdminDataMaintenance.jsx')), // cite: AdminDataMaintenance.jsx
  'debug-data': lazy(() => import('./components/screens/DebugDataViewer.jsx')), // Assumed exists
};


/* =========================================================
   CORE UI COMPONENTS & VIEWS
========================================================= */

/**
 * Configuration Error Component
 * Displays a message when essential configuration (like Firebase) is missing.
 */
function ConfigError({ message }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: COLORS.BG }}>
        <div className="p-6 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                <h3 className="font-bold text-lg">Configuration Error</h3>
            </div>
            <p className="text-sm">{message || 'An unknown initialization error occurred.'}</p>
        </div>
    </div>
  );
}

/**
 * Authentication Panel Component
 * Handles Login, Signup, and Password Reset flows.
 */
function AuthPanel({ auth, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // For signup
  const [secretCode, setSecretCode] = useState(''); // For signup
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'reset'
  const [statusMessage, setStatusMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isReset = mode === 'reset';
  const isSignup = mode === 'signup';

  // Handles the specific Firebase auth action based on the current mode
  const handleAction = async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess(); // Callback on successful login
      } else if (mode === 'reset') {
        if (!email) throw new Error("Email is required for password reset.");
        await sendPasswordResetEmail(auth, email);
        setStatusMessage('Password reset email sent. Check your inbox.');
      } else if (mode === 'signup') {
        if (secretCode !== SECRET_SIGNUP_CODE) throw new Error('Invalid secret sign-up code.');
        if (!name) throw new Error("Name is required for signup.");
        // TODO: In a real app, update the user's profile with 'name' after creation.
        await createUserWithEmailAndPassword(auth, email, password);
        // Note: ensureUserDocs will run after login to create necessary Firestore docs.
        onSuccess(); // Callback on successful signup
      }
    } catch (e) {
      console.error('Auth action failed:', e);
      setStatusMessage(e.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    // Centered layout with consistent styling
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: COLORS.BG }}>
      <div className={`p-8 bg-white rounded-xl shadow-2xl text-center w-full max-w-sm border-t-4 border-[${COLORS.TEAL}]`}>
        {/* Dynamic Title */}
        <h2 className={`text-2xl font-extrabold mb-4`} style={{ color: COLORS.NAVY }}>
          {mode === 'login' ? 'Sign In to The Arena' : isSignup ? 'Create Your Account' : 'Reset Password'}
        </h2>
        {/* Dynamic Subtitle */}
        <p className="text-sm text-gray-600 mb-6">
          {isReset ? 'Enter your email to receive a password reset link.' : isSignup ? 'Enter your details and the provided code.' : 'Access your LeaderReps development platform.'}
        </p>

        {/* Form Inputs */}
        <form
            className="space-y-4"
            onSubmit={(e) => { e.preventDefault(); handleAction(); }}
        >
            {isSignup && (
            <input type="text" placeholder="Your Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]" disabled={isLoading} required />
            )}
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]" disabled={isLoading} autoComplete="email" required />
            {!isReset && (
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]" disabled={isLoading} autoComplete={isSignup ? 'new-password' : 'current-password'} required={!isReset} />
            )}
            {isSignup && (
            <input type="text" placeholder="Secret Sign-up Code" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:border-[${COLORS.TEAL}]" disabled={isLoading} required />
            )}

            {/* Submit Button */}
            <button type="submit" disabled={isLoading} className={`w-full p-3 text-white rounded-lg font-semibold transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`} style={{ background: COLORS.TEAL, focusRing: COLORS.TEAL }}>
            {isLoading ? <Loader className="animate-spin h-5 w-5 mx-auto" /> : (mode === 'login' ? 'Sign In' : isSignup ? 'Create Account' : 'Send Reset Link')}
            </button>
        </form>

        {/* Status Message Area */}
        {statusMessage && (
            <p className={`text-sm text-center font-medium mt-4 ${statusMessage.includes('sent') ? `text-[${COLORS.GREEN}]` : `text-[${COLORS.RED}]`}`}>
            {statusMessage}
            </p>
        )}

        {/* Mode Toggles */}
        <div className="mt-6 border-t pt-4 border-gray-200 space-y-2 text-sm">
            {mode !== 'signup' && (
                <button onClick={() => { setMode('signup'); setStatusMessage(''); }} className={`font-semibold hover:underline block w-full`} style={{ color: COLORS.TEAL }}>
                Need an account? Sign up
                </button>
            )}
            {mode !== 'login' && (
                <button onClick={() => { setMode('login'); setStatusMessage(''); }} className={`text-gray-500 hover:underline block w-full`}>
                Already have an account? Sign In
                </button>
            )}
            {mode === 'login' && (
                <button onClick={() => { setMode('reset'); setStatusMessage(''); }} className={`text-gray-500 hover:underline block w-full`}>
                Forgot Password?
                </button>
            )}
        </div>
      </div>
    </div>
  );
}


/**
 * Navigation Sidebar Component (Refactored Styling & Toggle)
 * Displays primary navigation, user profile, and sign-out option.
 * Adapts layout based on expanded/collapsed state.
 * Conditionally renders items based on feature flags.
 */
const NavSidebar = ({ currentScreen, setCurrentScreen, user, closeMobileMenu, isAuthRequired, isNavExpanded, setIsNavExpanded }) => {
  // --- Consume services for auth actions and feature flags ---
  const { auth, featureFlags, isAdmin } = useAppServices(); // cite: useAppServices.jsx
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // --- Navigation Structure (using boss's terminology & updated screens) ---
  const coreNav = [
    { screen: 'dashboard', label: 'The Arena', icon: Home }, // Renamed Dashboard
    { screen: 'quick-start-accelerator', label: 'QuickStart Program', icon: Zap, flag: 'enableQuickStart' }, // Example flag
  ];

  const contentPillarNav = [
    { screen: 'development-plan', label: 'Development Plan', icon: Briefcase, flag: 'enableDevPlan' },
    { screen: 'planning-hub', label: 'Strategic Content Tools', icon: Trello, flag: 'enablePlanningHub' }, // cite: PlanningHub.jsx
    { screen: 'business-readings', label: 'Reading Library', icon: BookOpen, flag: 'enableReadings' }, // cite: BusinessReadings.jsx
    { screen: 'leadership-videos', label: 'Leader Talks Library', icon: Film, flag: 'enableVideos' }, // cite: LeadershipVideos.jsx
    { screen: 'applied-leadership', label: 'Course Library', icon: ShieldCheck, flag: 'enableCourses' }, // Course Hub // cite: AppliedLeadership.jsx
  ];

  const coachingPillarNav = [
    { screen: 'daily-practice', label: 'Daily Reflection Log', icon: Clock, flag: 'enableDailyPractice' }, // Link to the log entry screen // cite: DailyPractice.jsx
    { screen: 'coaching-lab', label: 'AI Coaching Lab', icon: Mic, flag: 'enableLabs' }, // cite: Labs.jsx
    { screen: 'executive-reflection', label: 'Executive ROI Report', icon: BarChart3, flag: 'enableRoiReport' }, // cite: ExecutiveReflection.jsx
  ];

  const communityPillarNav = [
    { screen: 'community', label: 'Community Hub', icon: Users, flag: 'enableCommunity' }, // cite: CommunityScreen.jsx
  ];

  // --- System/Admin Navigation (Conditional) ---
  const systemNav = [
    { screen: 'app-settings', label: 'App Settings', icon: Settings },
    // Conditionally add Admin Functions link if user is admin
    ...(isAdmin ? [{ screen: 'admin-functions', label: 'Admin Functions', icon: Shield, adminOnly: true }] : []),
  ];

  const menuSections = [
    { title: 'CORE', items: coreNav },
    { title: 'CONTENT PILLAR', items: contentPillarNav },
    { title: 'COACHING PILLAR', items: coachingPillarNav },
    { title: 'COMMUNITY PILLAR', items: communityPillarNav },
    { title: 'SYSTEM', items: systemNav },
  ];

  // --- Event Handlers ---
  const handleSignOut = async () => {
    try {
      if (auth) await signOut(auth);
      console.log('Sign Out successful.');
      setIsProfileOpen(false); // Close profile popup on sign out
      closeMobileMenu(); // Ensure mobile menu closes if open
      // Auth state change will handle redirect/UI update
    } catch (e) {
      console.error('Sign out failed:', e);
      // Optionally show an error message to the user
    }
  };

  const handleNavigate = useCallback((screen) => {
    // Prevent navigation if already on the target screen? (Optional)
    // if (screen === currentScreen) return;
    setCurrentScreen(screen);
    setIsProfileOpen(false); // Close profile popup on navigation
    closeMobileMenu();
  }, [setCurrentScreen, closeMobileMenu]); // Removed currentScreen dependency if allowing re-navigation

  // --- Renders individual navigation items, checking feature flags ---
  const renderNavItems = (items) => items
    // Filter items based on feature flags (default to true if flag is missing)
    .filter(item => !item.flag || (featureFlags && featureFlags[item.flag] !== false))
    // Filter admin items if user is not admin
    .filter(item => !item.adminOnly || isAdmin)
    .map((item) => {
      const Icon = item.icon;
      const isActive = currentScreen === item.screen;
      const label = item.label;

      return (
        <button
          key={item.screen}
          onClick={() => handleNavigate(item.screen)}
          title={!isNavExpanded ? label : ''} // Show title only when collapsed
          className={`relative group flex items-center w-full px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[${COLORS.TEAL}] focus:ring-offset-[${COLORS.NAVY}]`}
          style={{
              // --- Refined Styling ---
              background: isActive ? COLORS.TEAL : 'transparent',
              color: isActive ? COLORS.OFF_WHITE : COLORS.LIGHT_GRAY, // Use lighter gray for inactive text
              boxShadow: isActive ? `0 4px 12px ${COLORS.TEAL}40` : 'none',
              // Add subtle hover effect for inactive items
              ':hover': {
                  background: isActive ? COLORS.TEAL : `${COLORS.TEAL}20`, // Slightly lighter teal background on hover
              }
          }}
        >
          {/* Icon Styling */}
          <Icon
            className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${isNavExpanded ? 'mr-3' : ''}`}
            // Icon color remains consistent or slightly brightens if active
            style={{ color: isActive ? COLORS.OFF_WHITE : COLORS.SUBTLE }}
          />

          {/* Label (only when expanded) */}
          {isNavExpanded && (
            <span className={`flex-1 text-left whitespace-nowrap overflow-hidden overflow-ellipsis transition-opacity duration-300 ${isNavExpanded ? 'opacity-100' : 'opacity-0'}`}>
              {label}
            </span>
          )}

          {/* Badge (only when expanded) */}
          {isNavExpanded && item.badge && (
            <span className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-[${COLORS.ORANGE}] text-white`}>{item.badge}</span>
          )}

          {/* Tooltip for Collapsed State */}
          {!isNavExpanded && (
            <span className={`absolute left-full ml-4 w-auto px-3 py-1.5 bg-[${COLORS.NAVY}] text-white text-xs whitespace-nowrap rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 z-50`}>
              {label}
            </span>
          )}
        </button>
      );
    });

  // Render nothing if authentication is still required (AuthPanel is shown)
  if (isAuthRequired) return null;

  return (
    // --- Sidebar Container ---
    // Added smooth transitions and z-index
    <div className={`hidden md:flex flex-col relative z-30 shadow-2xl transition-all duration-300 ease-in-out`}
         style={{ background: COLORS.NAVY, width: isNavExpanded ? '256px' : '72px' }}> {/* 18rem or 4.5rem */}

      {/* --- Header / Logo Area --- */}
      <div className={`flex items-center justify-center flex-shrink-0 h-16 border-b border-[${COLORS.TEAL}]/30 transition-all duration-300`}
           style={{ paddingLeft: isNavExpanded ? '1rem' : '0', paddingRight: isNavExpanded ? '1rem' : '0' }} // Adjust padding
      >
        <Zap // Using Zap as a placeholder logo icon
            className={`transition-all duration-300`}
            style={{ color: COLORS.TEAL, width: '28px', height: '28px', marginRight: isNavExpanded ? '8px' : '0' }}
        />
        {isNavExpanded && (
          <h1 className="text-xl font-extrabold text-white whitespace-nowrap transition-opacity duration-300">
            LeaderReps
          </h1>
        )}
      </div>

      {/* --- Navigation Sections --- */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4"> {/* Added padding */}
        {menuSections.map((section) => (
          <div key={section.title} className="space-y-1">
            {isNavExpanded && (
              <p className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-opacity duration-300`} style={{ color: `${COLORS.TEAL}90` }}>
                {section.title}
              </p>
            )}
            {/* Render items, applying filters */}
            {renderNavItems(section.items)}
          </div>
        ))}
      </nav>

      {/* --- Profile Section --- */}
      <div className={`flex-shrink-0 p-3 border-t border-[${COLORS.TEAL}]/30 relative`}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          title={!isNavExpanded ? (user?.name || 'User Profile') : ''}
          className={`relative group flex items-center w-full p-2 rounded-lg text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[${COLORS.TEAL}] focus:ring-offset-1 focus:ring-offset-[${COLORS.NAVY}]`}
          style={{ background: `${COLORS.TEAL}15`, ':hover': { background: `${COLORS.TEAL}25` } }} // Subtle background
        >
          {/* User Icon --- THIS IS THE FIX --- */}
          <User
            className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${isNavExpanded ? 'mr-3' : ''}`}
            style={{ color: COLORS.SUBTLE }}
          />
          {/* User Name (only when expanded) */}
          {isNavExpanded && (
            <span className="truncate text-white transition-opacity duration-300">{user?.name || `Guest`}</span>
          )}
          {/* Tooltip for Collapsed State */}
          {!isNavExpanded && (
            <span className={`absolute left-full ml-4 w-auto px-3 py-1.5 bg-[${COLORS.NAVY}] text-white text-xs whitespace-nowrap rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 z-50`}>
              {user?.name || 'User Profile'}
            </span>
          )}
        </button>

        {/* Profile Pop-up Menu */}
        {isProfileOpen && (
          <div
            className={`absolute bottom-full mb-2 w-60 p-4 rounded-lg shadow-2xl z-40 animate-in fade-in slide-in-from-bottom-2 duration-200`}
            style={{ background: COLORS.NAVY, border: `1px solid ${COLORS.TEAL}50`, left: isNavExpanded ? '0.75rem' : 'calc(100% + 0.75rem)' }} // Adjust position based on state
          >
            <p className="text-xs font-medium uppercase text-indigo-300 mb-1">Account</p>
            <p className="text-sm font-semibold truncate mb-2 text-white" title={user?.email}>
              {user?.email || 'N/A'}
            </p>
            {/* <p className="text-xs text-gray-400 break-words mb-4">UID: {user?.userId || 'N/A'}</p> */}
            <button
              onClick={handleSignOut}
              className={`flex items-center w-full px-3 py-2 mt-2 rounded-md text-sm font-semibold transition-colors text-white`}
              style={{ background: COLORS.ORANGE, ':hover': { background: COLORS.RED } }} // Use theme colors
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </button>
          </div>
        )}
      </div>

       {/* --- NEW: Sidebar Toggle Button --- */}
        <button
            onClick={() => setIsNavExpanded(!isNavExpanded)}
            title={isNavExpanded ? 'Collapse Menu' : 'Expand Menu'}
            className={`absolute top-1/2 -translate-y-1/2 -right-3 z-40 // Position centered vertically, slightly outside
                    bg-white text-[${COLORS.NAVY}] // White background, navy icon
                    border-2 border-[${COLORS.NAVY}] // Navy border
                    rounded-full shadow-lg
                    w-7 h-7 // Smaller size
                    flex items-center justify-center transition-all duration-300 ease-in-out
                    hover:scale-110 hover:bg-gray-100
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[${COLORS.NAVY}] focus:ring-[${COLORS.TEAL}]`}
        >
            {isNavExpanded ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
        </button>

    </div>
  );
};


/**
 * Screen Router Component
 * Lazily loads and renders the component corresponding to the currentScreen state.
 * Passes necessary props like navigation parameters.
 */
const ScreenRouter = ({ currentScreen, navParams, navigate }) => {
  // Determine the component to render, defaulting to dashboard
  const Component = ScreenMap[currentScreen] || ScreenMap.dashboard;
  console.log(`[ScreenRouter] Rendering screen: ${currentScreen}`); // Log current screen

  // Handle specific screens that might need extra props or different components
  // Note: AppSettingsScreen is now lazy-loaded via ScreenMap
  // if (currentScreen === 'app-settings') return <AppSettingsScreen key={currentScreen} navigate={navigate} />;

  // Render the selected component within Suspense fallback
  // --- FIX: Pass navigate prop ---
  return <Component key={currentScreen} {...(navParams || {})} navigate={navigate} />; // Spread navParams and pass navigate
};


/**
 * Main Application Content Wrapper
 * Includes the sidebar, main content area, mobile header, and Suspense fallback.
 * Also includes the new Legal Footer.
 */
const AppContent = ({ currentScreen, setCurrentScreen, user, navParams, isMobileOpen, setIsMobileOpen, isAuthRequired, isNavExpanded, setIsNavExpanded }) => {
  // Memoized callback to close mobile menu
  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), [setIsMobileOpen]);
  // Get navigate function from context for ScreenRouter
  const { navigate } = useAppServices();

  // --- Current Year for Footer ---
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative min-h-screen flex font-sans antialiased" style={{ background: COLORS.BG }}> {/* Use consistent BG */}
      {/* --- Desktop Sidebar --- */}
      <NavSidebar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen} // Use navigate provided by App
        user={user}
        closeMobileMenu={closeMobileMenu} // Still needed for profile actions
        isAuthRequired={isAuthRequired}
        isNavExpanded={isNavExpanded}
        setIsNavExpanded={setIsNavExpanded}
      />

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col"> {/* Ensure main area takes remaining space */}
        {/* Mobile Header (Sticky) */}
        <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-40">
          <h1 className="text-xl font-bold" style={{ color: COLORS.NAVY }}>LeaderReps</h1>
          <button onClick={() => setIsMobileOpen(true)} className="p-2" style={{ color: COLORS.NAVY }}>
            <Menu className="w-6 h-6" />
          </button>
          {/* TODO: Add Mobile Menu Overlay component here */}
        </div>

        {/* Screen Content Area with Padding */}
        <div className="flex-1 overflow-y-auto"> {/* Allow content to scroll */}
            <Suspense
            fallback={
                // Centered Loading Spinner
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center"> {/* Adjust height calculation */}
                <div className="flex flex-col items-center">
                    <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} />
                    <p className="font-semibold" style={{ color: COLORS.NAVY }}>Loading Content...</p>
                </div>
                </div>
            }
            >
            <ScreenRouter currentScreen={currentScreen} navParams={navParams} navigate={navigate} />
            </Suspense>
        </div>

         {/* --- NEW: Legal Footer --- */}
        <footer className="w-full text-center p-4 mt-auto border-t" style={{ background: COLORS.LIGHT_GRAY, borderColor: COLORS.SUBTLE }}>
             <p className="text-xs text-gray-500">
                © {currentYear} LeaderReps. All rights reserved.
             </p>
             {/* Optional: Add links like Privacy Policy, Terms of Service */}
             {/* <div className="mt-1 space-x-2">
                 <a href="/privacy" className="text-xs text-gray-400 hover:underline">Privacy Policy</a>
                 <span className="text-gray-400">|</span>
                 <a href="/terms" className="text-xs text-gray-400 hover:underline">Terms of Service</a>
             </div> */}
        </footer>
      </main>
    </div>
  );
};


/* =========================================================
   DATA PROVIDER (Refactored to use updated hooks)
========================================================= */
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- FIX: Define missing helper function ---
const resolveGlobalMetadata = (meta) => {
  // Add safety check
  return (meta && typeof meta === 'object') ? meta : {};
};

/**
 * DataProvider Component
 * Fetches user-specific and global data using custom hooks from useAppServices.
 * Provides the fetched data and update functions via AppServiceContext.
 */
const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
  const { db, auth } = firebaseServices;

  // --- Use the RENAMED user data hooks ---
  const devPlanHook = useDevelopmentPlanData(db, userId, isAuthReady); // cite: useAppServices.jsx
  const dailyPracticeHook = useDailyPracticeData(db, userId, isAuthReady); // cite: useAppServices.jsx
  const strategicContentHook = useStrategicContentData(db, userId, isAuthReady); // cite: useAppServices.jsx
  // Global metadata hook remains the same but fetches more data now
  const globalHook = useGlobalMetadata(db, isAuthReady);

  // --- Combined Loading & Error States ---
  const isLoading = devPlanHook.isLoading || dailyPracticeHook.isLoading || strategicContentHook.isLoading || globalHook.isLoading; // cite: useAppServices.jsx
  const error = devPlanHook.error || dailyPracticeHook.error || strategicContentHook.error || globalHook.error; // cite: useAppServices.jsx

  // --- Derive `isAdmin` status ---
  const isAdmin = useMemo(() => {
      // Ensure user and email exist before checking against ADMIN_EMAILS
      return !!user?.email && (globalHook.metadata.ADMIN_EMAILS || []).includes(user.email.toLowerCase());
  }, [user, globalHook.metadata.ADMIN_EMAILS]); // Add ADMIN_EMAILS dependency

  // --- Derive `hasPendingDailyPractice` (using updated data structure) ---
  const hasPendingDailyPractice = useMemo(() => {
    const dailyData = dailyPracticeHook.dailyPracticeData; // cite: useAppServices.jsx
    // Check if target rep exists and is pending for the correct date
    const todayStr = new Date().toISOString().split('T')[0];
    const hasPendingTargetRep = dailyData?.dailyTargetRepStatus === 'Pending' && dailyData?.dailyTargetRepDate === todayStr && !!dailyData?.dailyTargetRepId; // cite: useAppServices.jsx
    // Check if any additional reps are pending (status resets daily via hook)
    const hasPendingAdditionalReps = (dailyData?.activeCommitments || []).some(
        c => c.status === 'Pending'
    ); // cite: useAppServices.jsx
    return hasPendingTargetRep || hasPendingAdditionalReps;
  }, [dailyPracticeHook.dailyPracticeData]); // cite: useAppServices.jsx

  // --- **FIX START**: Define API key and functions here ---
  const resolvedMetadata = useMemo(() => resolveGlobalMetadata(globalHook.metadata), [globalHook.metadata]); // cite: useAppServices.jsx

  const apiKey = useMemo(() => {
      return resolvedMetadata.API_KEY || (typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : ''); // cite: useAppServices.jsx
  }, [resolvedMetadata.API_KEY]);

  const hasGeminiKey = useCallback(() => !!apiKey, [apiKey]);

  // This function body is a mock, matching the default implementation in useAppServices.jsx
  // A real implementation would securely call a cloud function.
  const callSecureGeminiAPI = useCallback(async (payload) => {
      if (!hasGeminiKey()) {
          console.error("Gemini API Key is missing. Returning mock error.");
          throw new Error("Gemini API Key is missing.");
      }
      // In a real app, this would be a fetch call to a secure cloud function
      console.warn("Using MOCK callSecureGeminiAPI. No real API call made.", payload);
      // Return a mock response structure
      return {
          candidates: [{
              content: {
                  parts: [{ text: "## Mock AI Response\n\nThis is a mock response because the secure API function is not defined globally." }],
                  role: "model"
              }
          }]
      };
  }, [hasGeminiKey, apiKey]); // Depends on apiKey via hasGeminiKey
  // --- **FIX END** ---

  // --- Memoize the context value ---
  // Provides all necessary data and functions to the rest of the application.
  const appServicesValue = useMemo(() => {
    // const resolvedMetadata = resolveGlobalMetadata(globalHook.metadata); // <-- Now defined above
    // console.log("[DataProvider] Resolved Metadata:", resolvedMetadata); // Debug log

    // Safely access potentially missing API details from metadata
    // const apiKey = resolvedMetadata.API_KEY || (typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : ''); // <-- Now defined above
    const geminiModel = resolvedMetadata.GEMINI_MODEL || 'gemini-1.5-flash'; // cite: useAppServices.jsx
    // callSecureGeminiAPI and hasGeminiKey are now defined in this scope

    return {
      // Core App State & Functions
      navigate,
      user,
      userId,
      db,
      auth,
      isAuthReady,
      isLoading,
      error,
      isAdmin, // Provide admin status
      ADMIN_PASSWORD: resolvedMetadata.ADMIN_PASSWORD || '7777', // Provide admin password constant // cite: useAppServices.jsx

      // User-Specific Data (using updated names)
      developmentPlanData: devPlanHook.developmentPlanData, // cite: useAppServices.jsx
      dailyPracticeData: dailyPracticeHook.dailyPracticeData, // cite: useAppServices.jsx
      strategicContentData: strategicContentHook.strategicContentData, // cite: useAppServices.jsx

      // Global Metadata / Value Sets (extracted from resolvedMetadata)
      metadata: resolvedMetadata, // Raw metadata object
      featureFlags: resolvedMetadata.featureFlags || {}, // Provide feature flags // cite: useAppServices.jsx
      LEADERSHIP_TIERS: resolvedMetadata.LEADERSHIP_TIERS || {}, // cite: useAppServices.jsx
      // Include all catalogs provided by useGlobalMetadata
      REP_LIBRARY: resolvedMetadata.REP_LIBRARY || { items: [] }, // cite: useAppServices.jsx
      EXERCISE_LIBRARY: resolvedMetadata.EXERCISE_LIBRARY || { items: [] }, // cite: useAppServices.jsx
      WORKOUT_LIBRARY: resolvedMetadata.WORKOUT_LIBRARY || { items: [] }, // cite: useAppServices.jsx
      COURSE_LIBRARY: resolvedMetadata.COURSE_LIBRARY || { items: [] }, // cite: useAppServices.jsx
      SKILL_CATALOG: resolvedMetadata.SKILL_CATALOG || { items: [] }, // cite: useAppServices.jsx
      IDENTITY_ANCHOR_CATALOG: resolvedMetadata.IDENTITY_ANCHOR_CATALOG || { items: [] }, // cite: useAppServices.jsx
      HABIT_ANCHOR_CATALOG: resolvedMetadata.HABIT_ANCHOR_CATALOG || { items: [] }, // cite: useAppServices.jsx
      WHY_CATALOG: resolvedMetadata.WHY_CATALOG || { items: [] }, // cite: useAppServices.jsx
      READING_CATALOG: resolvedMetadata.READING_CATALOG || { items: [] }, // cite: useAppServices.jsx
      VIDEO_CATALOG: resolvedMetadata.VIDEO_CATALOG || { items: [] }, // cite: useAppServices.jsx
      SCENARIO_CATALOG: resolvedMetadata.SCENARIO_CATALOG || { items: [] }, // cite: useAppServices.jsx
      RESOURCE_LIBRARY: resolvedMetadata.RESOURCE_LIBRARY || {}, // Transformed // cite: useAppServices.jsx
      IconMap: resolvedMetadata.IconMap || {}, // cite: useAppServices.jsx
      APP_ID: resolvedMetadata.APP_ID || appId, // cite: useAppServices.jsx

      // AI/API Services (now defined in DataProvider scope)
      callSecureGeminiAPI, // Pass the newly defined function
      hasGeminiKey,       // Pass the newly defined function
      GEMINI_MODEL: geminiModel,
      API_KEY: apiKey,

      // Derived State
      hasPendingDailyPractice,

      // Data Writers (using updated names)
      updateDevelopmentPlanData: devPlanHook.updateData, // cite: useAppServices.jsx
      updateDailyPracticeData: dailyPracticeHook.updateData, // cite: useAppServices.jsx
      updateStrategicContentData: strategicContentHook.updateData, // cite: useAppServices.jsx
      // Update global metadata (pass db and userId)
      updateGlobalMetadata: (data, opts) => updateGlobalMetadata(db, data, { ...opts, userId }), // cite: useAppServices.jsx
    };
  }, [
      // Dependencies - include all hooks and relevant state
      navigate, user, userId, db, auth, isAuthReady, isLoading, error, isAdmin,
      devPlanHook, dailyPracticeHook, strategicContentHook, globalHook,
      hasPendingDailyPractice, // Include derived state
      // API functions are now defined in DataProvider, add them
      callSecureGeminiAPI, hasGeminiKey, apiKey, resolvedMetadata
  ]);

  // --- Loading State ---
  // Show a spinner while ANY essential data is loading AFTER auth is ready
  if (!isAuthReady) {
      console.log("[DataProvider] Waiting for auth to be ready.");
      // Render nothing or a minimal placeholder until auth is resolved
      return null;
  }
  if (isLoading) {
    console.log("[DataProvider] Core data loading...");
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
        <div className="flex flex-col items-center">
          <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} />
          <p className="font-semibold" style={{ color: COLORS.NAVY }}>Loading Your Arena...</p>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    console.error("[DataProvider] Error loading data:", error);
    // Display a user-friendly error message, perhaps allow retry?
    return <ConfigError message={`Failed to load essential application data: ${error.message}`} />;
  }

  // --- Provide Context Value ---
  console.log("[DataProvider] Rendering with fully loaded context.");
  return <AppServiceContext.Provider value={appServicesValue}>{children}</AppServiceContext.Provider>;
};


/* =========================================================
   ROOT APP COMPONENT (Initialization & Routing Logic)
========================================================= */
const App = ({ initialState }) => {
  // --- Core State ---
  const [user, setUser] = useState(null); // Stores authenticated user object { name, email, userId }
  const [userId, setUserId] = useState(null); // Stores just the UID string
  const [currentScreen, setCurrentScreen] = useState(initialState?.screen || 'dashboard'); // Current view route
  const [navParams, setNavParams] = useState(initialState?.params || {}); // Params for the current view
  const [firebaseServices, setFirebaseServices] = useState({ db: null, auth: null }); // Firebase instances
  const [isAuthReady, setIsAuthReady] = useState(false); // Flag: Has Firebase auth state resolved?
  const [authRequired, setAuthRequired] = useState(true); // Flag: Is user logged out?
  const [isMobileOpen, setIsMobileOpen] = useState(false); // Mobile menu state
  const [isNavExpanded, setIsNavExpanded] = useState(false); // Sidebar expansion state (default collapsed)
  const [initStage, setInitStage] = useState('init'); // Tracks initialization progress ('init', 'ok', 'error')
  const [initError, setInitError] = useState(''); // Stores initialization error message

  // --- Navigation Function ---
  // Centralized function to change the current screen and params
  const navigate = useCallback((screen, params = {}) => {
    console.log(`[Navigate] Changing screen to: ${screen}`, params);
    setNavParams(typeof params === 'object' && params !== null ? params : {});
    setCurrentScreen(screen);
    // Optional: Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // --- Debugging Hooks ---
  // Expose navigate function globally for console debugging
  useEffect(() => {
    if (typeof window !== 'undefined') window.__appNavigate = navigate;
    return () => { if (typeof window !== 'undefined') delete window.__appNavigate; };
  }, [navigate]);
  
  // --- **FIX**: Removed broken useEffect that referenced undefined variables ---

  // --- Firebase Initialization & Auth State Listener ---
  useEffect(() => {
    console.log("[App Init] Starting Firebase setup...");
    let app, firestore, authentication;
    let unsubscribeAuth = null;
    let initTimeoutId = null; // Timeout for initial auth resolution

    // Function to finalize initialization state
    const finalizeInit = (success = true, errorMsg = '') => {
      console.log(`[App Init] Finalizing - Success: ${success}, Error: ${errorMsg}`);
      if (initTimeoutId) clearTimeout(initTimeoutId);
      setInitStage(success ? 'ok' : 'error');
      setInitError(errorMsg);
      setIsAuthReady(true); // Mark auth as resolved (or failed)
    };

    try {
      // --- Get Firebase Config ---
      let firebaseConfig = {};
      if (typeof window !== 'undefined' && window.__firebase_config) {
        const cfg = window.__firebase_config;
        firebaseConfig = typeof cfg === 'string' ? JSON.parse(cfg) : cfg;
        console.log("[App Init] Firebase config loaded from window.");
      } else {
        throw new Error('Firebase configuration (__firebase_config) is missing.');
      }

      // --- Initialize Firebase App, Firestore, Auth ---
      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      authentication = getAuth(app);
      // setLogLevel('debug'); // Enable verbose Firestore logging if needed
      setFirebaseServices({ db: firestore, auth: authentication });
      console.log("[App Init] Firebase App, Firestore, Auth initialized.");

      // --- Set Timeout for Auth Resolution ---
      // If onAuthStateChanged takes too long, show login/app based on initial check
      initTimeoutId = setTimeout(() => {
        console.warn("[App Init] Auth state resolution timed out (500ms). Proceeding with current state.");
        // Check if user object exists from a potential previous session restoration
        const currentUser = authentication.currentUser;
        if (!user && !currentUser) { // Only finalize if still no user after timeout
             finalizeInit(true); // Assume logged out if timeout occurs and no user found
        } else if (!user && currentUser) {
             // If timeout happens but currentUser exists, manually set user state before finalize
             console.log("[App Init Timeout] Found currentUser, setting state.");
             const uid = currentUser.uid;
             const email = currentUser.email;
             const name = currentUser.displayName || email?.split('@')[0] || 'Leader';
             setUserId(uid);
             setUser({ name, email, userId: uid });
             setAuthRequired(false);
             finalizeInit(true);
             // Trigger ensureUserDocs check immediately after manual set
             ensureUserDocs(firestore, uid);
        } else {
             // If user state was already set (somehow), just finalize
             finalizeInit(true);
        }
      }, 500); // 500ms timeout

      // --- Auth State Listener ---
      console.log("[App Init] Setting up onAuthStateChanged listener...");
      unsubscribeAuth = onAuthStateChanged(authentication, async (currentUser) => {
        console.log("[App Init] onAuthStateChanged triggered. User:", currentUser ? currentUser.uid : 'null');
        if (initTimeoutId) clearTimeout(initTimeoutId); // Clear timeout if listener fires

        if (currentUser && currentUser.email) {
          const uid = currentUser.uid;
          const email = currentUser.email;
          // Fetch display name or derive from email
          const name = currentUser.displayName || email.split('@')[0] || 'Leader';
          console.log(`[App Init] User Authenticated: ${name} (${uid})`);

          // --- CRITICAL: Ensure user docs exist *after* confirming login ---
          await ensureUserDocs(firestore, uid); // Wait for check/creation

          // Set user state
          setUserId(uid);
          setUser({ name, email, userId: uid });
          setAuthRequired(false);

        } else {
          console.log("[App Init] User Logged Out.");
          // Clear user state
          setUser(null);
          setUserId(null);
          setAuthRequired(true);
        }
        // Finalize initialization after handling auth state
        finalizeInit(true);
      });

      // --- Cleanup Function ---
      return () => {
        console.log("[App Init] Cleaning up Firebase listener and timeout.");
        if (unsubscribeAuth) unsubscribeAuth();
        if (initTimeoutId) clearTimeout(initTimeoutId);
      };

    } catch (e) {
      console.error('[App Init] Firebase setup failed:', e);
      finalizeInit(false, e?.message || 'Firebase SDK initialization error.');
    }
  }, []); // Run only on initial mount

  // --- Render Loading/Error/Auth States ---
  if (initStage === 'init') {
    return ( // Initializing Firebase state
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
          <div className="flex flex-col items-center">
              <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} />
              <p className="font-semibold" style={{ color: COLORS.NAVY }}>Initializing Arena...</p>
          </div>
      </div>
    );
  }
  if (initStage === 'error') {
    return <ConfigError message={initError} />; // Firebase config/init error
  }

  // If auth is ready but user is not logged in, show AuthPanel
  if (!user && isAuthReady && authRequired) {
    console.log("[App Render] Auth ready, user not logged in. Showing AuthPanel.");
    return (
      <AuthPanel
        auth={firebaseServices.auth}
        onSuccess={() => {
          // AuthPanel handles setting user state via onAuthStateChanged listener.
          // We might not need to do anything here immediately, but can ensure nav to dashboard.
          console.log("[AuthPanel Success] Logged in/Signed up. Navigating to dashboard.");
          setAuthRequired(false); // Explicitly set auth required to false
          navigate('dashboard'); // Navigate after successful auth
        }}
      />
    );
  }

  // --- Render Main Application ---
  // If init is 'ok' and user is potentially logged in (or auth not required), render DataProvider and AppContent
  console.log(`[App Render] Rendering main app. AuthReady: ${isAuthReady}, User: ${user ? user.userId : 'null'}, AuthRequired: ${authRequired}`);
  // We need DataProvider even if user is briefly null during logout transition
  return (
    <DataProvider
      firebaseServices={firebaseServices}
      userId={userId}
      isAuthReady={isAuthReady}
      navigate={navigate}
      user={user}
      // --- **FIX**: Removed broken props that were causing the ReferenceError ---
      // API_KEY might be sourced from metadata now
    >
      {/* Suspense for lazy loaded screens */}
      <Suspense
        fallback={ // Fallback shown *after* DataProvider initial load
            <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
                <div className="flex flex-col items-center">
                    <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} />
                    <p className="font-semibold" style={{ color: COLORS.NAVY }}>Loading Arena Content...</p>
                </div>
            </div>
        }
      >
        <AppContent
          currentScreen={currentScreen}
          setCurrentScreen={navigate} // Pass navigate for sidebar/routing
          user={user}
          navParams={navParams}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          isAuthRequired={authRequired} // Pass auth status down
          isNavExpanded={isNavExpanded}
          setIsNavExpanded={setIsNavExpanded}
        />
      </Suspense>
    </DataProvider>
  );
};


/**
 * Root Component Export
 * Includes a basic sanity check render option.
 */
export default function Root(props) {
  // Simple check for ?sanity=1 in URL for basic React render test
  const forceSanity = typeof window !== 'undefined' && /[?&]sanity=1/.test(window.location.search);
  if (forceSanity) {
    return (
      <div style={{ padding: 32, fontSize: 18, lineHeight: 1.4 }}>
        <h1>✅ React Mounted (Sanity Check)</h1>
        <p>If you see this, React is rendering correctly.</p>
      </div>
    );
  }
  // Render the main App component
  return <App {...props} />;
}