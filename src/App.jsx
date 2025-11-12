// src/App.jsx (Final version with robust Feature Flag handling and syntax fix)

import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';

// --- Core Services & Context ---
// Updated to use createAppServices factory pattern
import {
  AppServiceContext,
  createAppServices,    // Factory function that creates all services
  updateGlobalMetadata, // Global metadata writer
  ensureUserDocs,       // For seeding user documents
  useAppServices,       // Hook to consume context
} from './services/useAppServices.jsx';

// --- Membership System ---
import { membershipService } from './services/membershipService.js';
import { MembershipGate } from './components/ui/MembershipGate.jsx';

// --- Corporate Brand Colors ---
import { CORPORATE_COLORS } from './styles/corporate-colors.js';

// --- Firebase Imports (Authentication & Firestore) ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile, // Import updateProfile to set displayName
  // 🚨 NEW: Import setPersistence and browserSessionPersistence
  setPersistence,
  browserSessionPersistence,
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
  Home, Zap, ShieldCheck, TrendingUp, Mic, BookOpen, Settings, User, LogOut, // Settings is imported here
  CornerRightUp, Clock, Briefcase, Target, Users, BarChart3, Globe, Code,
  Bell, Lock, Download, Trash2, Mail, Link, Menu, Trello, Film, Dumbbell, Cpu,
  ChevronLeft, ChevronRight, X, Loader, AlertTriangle, ChevronsLeft, ChevronsRight, // Added Loader, AlertTriangle, Chevrons
  Shield, DollarSign // Icon for Admin Functions and Membership
} from 'lucide-react';

// --- PWA Install Component ---
import PWAInstall from './components/ui/PWAInstall.jsx';

/* =========================================================
   GLOBAL CONFIG & CONSTANTS (Aligned with useAppServices)
========================================================= */
// --- Admin Emails Configuration ---
// Define admin users who have access to advanced features
// 🚨 FIX: Removed hardcoded ADMIN_EMAILS constant. It is now loaded from Firestore metadata/config.
// const ADMIN_EMAILS = [ 'admin@leaderreps.com', 'rob@sagecg.com', /* ... */ ];

// --- LEADERREPS CORPORATE COLORS - STRICT BRAND COMPLIANCE ---
const COLORS = {
  // CORPORATE BRAND COLORS (must match leaderreps.com)
  NAVY: '#002E47',           // Corporate navy - primary brand color
  ORANGE: '#E04E1B',         // Corporate orange - accent/CTA color  
  TEAL: '#47A88D',           // Corporate teal - secondary brand color
  SUBTLE_TEAL: '#349881',    // Corporate subtle teal - hover states
  LIGHT_GRAY: '#FCFCFA',     // Corporate light gray - page background
  
  // SEMANTIC COLORS (corporate aligned)
  TEXT: '#002E47',           // Use navy for primary text
  MUTED: '#349881',          // Use subtle teal for muted text
  SUBTLE: '#47A88D',         // Use teal for borders
  BG: '#FCFCFA',             // Corporate page background
  OFF_WHITE: '#FFFFFF',      // Corporate card background
  SUCCESS: '#47A88D',        // Use teal for success states
  WARNING: '#E04E1B',        // Use orange for warnings  
  ERROR: '#E04E1B',          // NO RED! Use corporate orange for errors
  INFO: '#002E47',           // Use navy for info
  
  // LEGACY COMPATIBILITY (CORPORATE COLORS ONLY!)
  GREEN: '#47A88D',          // Map to corporate teal
  BLUE: '#002E47',           // Map to corporate navy
  RED: '#E04E1B',            // Map to corporate orange
  AMBER: '#E04E1B',          // NO AMBER! Use corporate orange
  PURPLE: '#47A88D'          // NO PURPLE! Use corporate teal
};

// --- Authentication ---
const SECRET_SIGNUP_CODE = 'mock-code-123'; // Keep for mock signup flow

// --- Helper function to extract first name ---
const getFirstName = (fullName) => {
  if (!fullName) return null; // Return null instead of 'Leader' to allow fallback logic
  // Split by space and take the first part
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || null;
};

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
  'quick-start-accelerator': lazy(() => import('./components/screens/QuickStartAccelerator.jsx')), // cite: QuickStartAccelerator.jsx - *Still loadable via direct nav if needed*
  'executive-reflection': lazy(() => import('./components/screens/ExecutiveReflection.jsx')), // ROI Report // cite: ExecutiveReflection.jsx
  'community': lazy(() => import('./components/screens/CommunityScreen.jsx')), // cite: CommunityScreen.jsx
  'applied-leadership': lazy(() => import('./components/screens/AppliedLeadership.jsx')), // Course Hub // cite: AppliedLeadership.jsx
  'leadership-videos': lazy(() => import('./components/screens/LeadershipVideos.jsx')), // cite: LeadershipVideos.jsx
  'app-settings': lazy(() => import('./components/screens/AppSettings.jsx')), // Renamed component file assumed
  'membership-upgrade': lazy(() => import('./components/screens/MembershipUpgrade.jsx')), // Arena v1.0 Scope: Membership upgrade page
  'admin-functions': lazy(() => import('./components/screens/AdminFunctions.jsx')), // NEW Admin screen
  'data-maintenance': lazy(() => import('./components/screens/AdminDataMaintenance.jsx')), // cite: AdminDataMaintenance.jsx
  'debug-data': lazy(() => import('./components/screens/DebugDataViewer.jsx')), // Assumed exists
  'membership-module': lazy(() => import('./components/screens/MembershipModule.jsx')), // ADDED: New Membership Module
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
      // 🚨 PERSISTENCE FIX: Set persistence before attempting sign in/up
      await setPersistence(auth, browserSessionPersistence);

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
        
        // Create the user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update the user's profile with their display name
        await updateProfile(userCredential.user, {
          displayName: name
        });
        
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
const NavSidebar = ({ currentScreen, setCurrentScreen, user, closeMobileMenu, isAuthRequired, isNavExpanded, setIsNavExpanded, isHamburgerMode = false, isMobileOpen, setIsMobileOpen }) => {
  // --- Consume services for auth actions and feature flags ---
  // FIX: Access isAdmin from context
  const { auth, featureFlags, isAdmin, membershipData } = useAppServices(); // cite: useAppServices.jsx
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // --- Developer Mode Detection (Arena v1.0 Enhancement) ---
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    return localStorage.getItem('arena-developer-mode') === 'true';
  });
  
  // Listen for developer mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsDeveloperMode(localStorage.getItem('arena-developer-mode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- Navigation Structure (UPDATED) ---
  const coreNav = [
    { screen: 'dashboard', label: 'The Arena', icon: Home }, // Renamed Dashboard
  ];

  const contentPillarNav = [
    { screen: 'development-plan', label: 'Development Plan', icon: Briefcase, flag: 'enableDevPlan', requiredTier: 'basic' }, // ARENA V1.0 APPROVED
    // ===== DEVELOPER MODE ONLY: Future features not in V1.0 scope =====
    { screen: 'business-readings', label: 'Professional Reading Hub', icon: BookOpen, flag: 'enableReadings', requiredTier: 'professional', devModeOnly: true }, // FUTURE SCOPE
    { screen: 'applied-leadership', label: 'Course Library', icon: ShieldCheck, flag: 'enableCourses', requiredTier: 'professional', devModeOnly: true }, // FUTURE SCOPE
    { screen: 'planning-hub', label: 'Strategic Content Tools', icon: Trello, flag: 'enablePlanningHub', requiredTier: 'elite', devModeOnly: true }, // FUTURE SCOPE
    { screen: 'leadership-videos', label: 'Content Leader Talks', icon: Film, flag: 'enableVideos', requiredTier: 'elite', devModeOnly: true }, // FUTURE SCOPE
  ];

  const coachingPillarNav = [
    // NOTE: Daily Reflection Rep now lives on Dashboard only (per boss feedback)
    // ===== DEVELOPER MODE: Always include coaching features, filtered by devModeOnly =====
    { screen: 'labs', label: 'AI Coaching Lab', icon: Mic, flag: 'enableLabs', requiredTier: 'elite', devModeOnly: true }, // FUTURE SCOPE - VISIBLE IN DEV MODE
    { screen: 'executive-reflection', label: 'Executive ROI Report', icon: BarChart3, flag: 'enableRoiReport', requiredTier: 'elite', devModeOnly: true }, // FUTURE SCOPE - VISIBLE IN DEV MODE
  ];

  const communityPillarNav = [
    // ===== DEVELOPER MODE: Always include community features, filtered by devModeOnly =====
    { screen: 'community', label: 'Leadership Community', icon: Users, flag: 'enableCommunity', requiredTier: 'professional', devModeOnly: true }, // cite: CommunityScreen.jsx - VISIBLE IN DEV MODE
  ];

  // --- System/Admin Navigation (Conditional) ---
  const systemNav = [
    { screen: 'membership-module', label: 'Membership & Billing', icon: DollarSign, flag: 'enableMembershipModule', requiredTier: 'basic' }, // ARENA V1.0 APPROVED
    { screen: 'app-settings', label: 'App Settings', icon: Settings, requiredTier: 'basic', devModeOnly: true }, // DEVELOPER MODE ONLY
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
    console.log('handleSignOut called, auth:', auth);
    try {
      if (auth) await signOut(auth);
      console.log('Sign Out successful.');
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

  // --- Renders individual navigation items, checking feature flags and membership tiers ---
  const renderNavItems = (items) => items
    .filter(item => {
      // 1. ADMIN/DEVELOPER MODE: Show everything, bypass all checks
      if (isAdmin || isDeveloperMode) {
        return true;
      }
      
      // --- USER MODE (isDeveloperMode is FALSE) ---

      // 2. EXCLUDE: Filter out items explicitly marked for Dev Mode
      if (item.devModeOnly) {
        return false; 
      }

      // 3. FEATURE FLAG CHECK: Filter out items where the flag is off
      if (item.flag && featureFlags && featureFlags[item.flag] !== true) {
        return false;
      }

      // 4. TIER CHECK: Filter out items where the tier is too low
      if (item.requiredTier && 
          !membershipService.hasAccess(membershipData?.currentTier, item.requiredTier)) {
        return false;
      }

      // Item passed all User Mode checks
      return true;
    })
    .map((item) => {
      const Icon = item.icon;
      const isActive = currentScreen === item.screen;
      const label = item.label;

      return (
        <button
          key={item.screen}
          onClick={() => handleNavigate(item.screen)}
          title={!isNavExpanded ? label : ''} // Show title only when collapsed
          className={`nav-item-corporate relative group flex items-center w-full transition-all duration-200 focus:outline-none ${isActive ? 'active' : ''}`}
          style={{
              // --- Corporate Navigation Styling ---
              background: isActive ? COLORS.TEAL : 'transparent',
              color: isActive ? COLORS.OFF_WHITE : COLORS.LIGHT_GRAY,
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              fontSize: '0.875rem',
              fontWeight: 'var(--font-weight-semibold)',
              boxShadow: isActive ? 'var(--shadow-md)' : 'none',
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
            <span className={`absolute left-full ml-3 w-auto px-4 py-2.5 text-base font-bold whitespace-nowrap rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50`}
                  style={{ 
                    background: COLORS.NAVY,
                    color: COLORS.TEAL,
                    border: `2px solid ${COLORS.TEAL}`,
                    boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px ${COLORS.TEAL}40`
                  }}>
              {label}
            </span>
          )}
        </button>
      );
    });

  // Render nothing if authentication is still required (AuthPanel is shown)
  if (isAuthRequired) return null;

  // Handle navigation item click in hamburger mode
  const handleNavClick = (screen) => {
    setCurrentScreen(screen);
    if (isHamburgerMode && setIsMobileOpen) {
      setIsMobileOpen(false); // Close hamburger menu after navigation
    }
  };

  if (isHamburgerMode) {
    // Render as overlay for hamburger menu
    return (
      <>
        {/* Overlay Background */}
        {isMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        
        {/* Sliding Menu */}
        <div className={`fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
             style={{ 
               width: '280px',
               background: COLORS.NAVY,
               boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)'
             }}>
          
          {/* Header with Close Button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200/20">
            <h2 className="text-lg font-bold" style={{ color: COLORS.TEAL }}>
              Navigation
            </h2>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 hover:bg-gray-100/10 rounded-lg transition-colors"
              style={{ color: COLORS.LIGHT_GRAY }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-2">
            {menuSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: COLORS.TEAL }}>
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {renderNavItems(section.items).map((item, index) => {
                    const Icon = item.icon;
                    const isActive = currentScreen === item.screen;
                    
                    return (
                      <button
                        key={item.screen || index}
                        onClick={() => handleNavClick(item.screen)}
                        className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                          isActive ? 'bg-teal-600/20' : 'hover:bg-gray-100/10'
                        }`}
                        style={{
                          color: isActive ? COLORS.TEAL : COLORS.LIGHT_GRAY
                        }}
                      >
                        <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Desktop version - now hidden since we're using hamburger for all
  return null;
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

  // Define membership requirements for each screen (V1 SCOPE ONLY)
  const screenTierRequirements = {
    'development-plan': 'basic',
    'business-readings': 'professional',
    'applied-leadership': 'professional',
    // ===== BOSS V1 SCOPE: FUTURE FEATURES REMOVED =====
    // 'planning-hub': 'elite', // FUTURE SCOPE
    // 'leadership-videos': 'elite', // FUTURE SCOPE  
    // 'coaching-lab': 'elite', // FUTURE SCOPE
    // 'executive-reflection': 'elite', // FUTURE SCOPE
    // 'community': 'professional', // FUTURE SCOPE
  };

  const requiredTier = screenTierRequirements[currentScreen];
  const componentElement = <Component key={currentScreen} {...(navParams || {})} navigate={navigate} />;

  // Wrap with MembershipGate if tier is required
  if (requiredTier) {
    return (
      <MembershipGate requiredTier={requiredTier} featureName={currentScreen}>
        {componentElement}
      </MembershipGate>
    );
  }

  // Render the selected component without gate
  return componentElement;
};


/**
 * Main Application Content Wrapper
 * Includes the sidebar, main content area, mobile header, and Suspense fallback.
 * Also includes the new Legal Footer.
 */
const AppContent = ({ currentScreen, setCurrentScreen, user, navParams, isMobileOpen, setIsMobileOpen, isAuthRequired, isNavExpanded, setIsNavExpanded, auth }) => {
  console.log('AppContent rendering with auth:', auth);
  // Memoized callback to close mobile menu
  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), [setIsMobileOpen]);
  // Get navigate function from context for ScreenRouter
  const { navigate } = useAppServices();

  // --- Current Year for Footer ---
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative min-h-screen flex flex-col font-sans antialiased" style={{ background: COLORS.BG }}>
      {/* --- New Header with Hamburger Menu --- */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-sm shadow-md flex justify-between items-center z-50" 
             style={{ 
               padding: 'var(--spacing-md) var(--spacing-lg)', 
               borderBottom: `1px solid ${COLORS.SUBTLE}`,
               boxShadow: 'var(--shadow-md)'
             }}>
        
        {/* Left: Hamburger Menu + Logo */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileOpen(true)} 
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            style={{ color: COLORS.NAVY }}
            title="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold" style={{ color: COLORS.NAVY }}>
            LeaderReps
          </h1>
        </div>

        {/* Right: PWA Install + Logout */}
        <div className="flex items-center gap-3">
          <PWAInstall />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{
              backgroundColor: COLORS.ORANGE,
              color: 'white',
              border: 'none'
            }}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* --- Hamburger Menu Sidebar (Overlay Mode) --- */}
      <NavSidebar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        user={user}
        closeMobileMenu={closeMobileMenu}
        isAuthRequired={isAuthRequired}
        isNavExpanded={true} // Show full menu in overlay
        setIsNavExpanded={setIsNavExpanded}
        isHamburgerMode={true} // New prop to indicate hamburger mode
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* --- Main Content Area --- */}
      <main className="flex-1 flex flex-col">

        {/* Screen Content Area with Padding */}
        <div className="flex-1 overflow-y-auto"> {/* Allow content to scroll */}
            <Suspense
            fallback={
                // Corporate Loading Spinner
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center gradient-corporate-hero">
                <div className="card-corporate-elevated flex flex-col items-center" style={{ padding: 'var(--spacing-3xl)' }}>
                    <div className="loading-corporate mb-6"></div>
                    <p className="corporate-text-body" style={{ color: COLORS.NAVY }}>Loading Content...</p>
                </div>
                </div>
            }
            >
            <ScreenRouter currentScreen={currentScreen} navParams={navParams} navigate={navigate} />
            </Suspense>
        </div>

         {/* --- Corporate Footer --- */}
        <footer className="w-full text-center mt-auto border-t" 
                style={{ 
                  background: COLORS.LIGHT_GRAY, 
                  borderColor: COLORS.SUBTLE,
                  padding: 'var(--spacing-lg)'
                }}>
             <p className="corporate-text-muted">
                © {currentYear} LeaderReps. All rights reserved.
             </p>
             <div className="mt-2 flex flex-wrap justify-center gap-1 text-xs" style={{ color: COLORS.MUTED }}>
                 <a href="https://leaderreps.com/privacy-policy" target="_blank" rel="noopener noreferrer" 
                    className="hover:underline transition-colors duration-200" 
                    style={{ color: COLORS.MUTED }}>
                    Privacy Policy
                 </a>
                 <span>|</span>
                 <a href="https://leaderreps.com/terms-of-service" target="_blank" rel="noopener noreferrer" 
                    className="hover:underline transition-colors duration-200"
                    style={{ color: COLORS.MUTED }}>
                    Terms of Service
                 </a>
                 <span>|</span>
                 <a href="https://leaderreps.com/cookie-policy" target="_blank" rel="noopener noreferrer" 
                    className="hover:underline transition-colors duration-200"
                    style={{ color: COLORS.MUTED }}>
                    Cookie Policy
                 </a>
                 <span>|</span>
                 <a href="https://leaderreps.com/refund-policy" target="_blank" rel="noopener noreferrer" 
                    className="hover:underline transition-colors duration-200"
                    style={{ color: COLORS.MUTED }}>
                    Refund Policy
                 </a>
                 <span>|</span>
                 <a href="https://leaderreps.com/contact" target="_blank" rel="noopener noreferrer" 
                    className="hover:underline transition-colors duration-200"
                    style={{ color: COLORS.MUTED }}>
                    Contact Us
                 </a>
             </div>
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
 * Creates and provides all app services using createAppServices factory.
 * Maintains backwards compatibility with existing code that expects hook-style data.
 */
const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
  const { db, auth } = firebaseServices;
  
  // --- State to hold the created services ---
  const [services, setServices] = useState(null);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  
  // --- State to hold the actual data from services ---
  const [serviceData, setServiceData] = useState({
    developmentPlanData: null,
    dailyPracticeData: null,
    strategicContentData: null,
    membershipData: null, // ADDED: Membership data state
    globalMetadata: null
  });

  // --- Create services when userId and db are available ---
  useEffect(() => {
    console.log('[DataProvider] Effect triggered:', {
      userId: userId || 'none',
      isAuthReady,
      hasDb: !!db
    });

    // Don't create services if no user or Firebase isn't ready
    if (!userId || !db || !isAuthReady) {
      console.log('[DataProvider] Conditions not met, clearing services');
      setServices(null);
      setIsLoadingServices(false);
      return;
    }

    // Create all services using the factory function
    console.log('[DataProvider] Creating services for user:', userId);
    setIsLoadingServices(true);
    
    try {
      const createdServices = createAppServices(db, userId);
      console.log('[DataProvider] Services created successfully');
      
      // Set up onChange callback to update state when Firestore data arrives
      createdServices.setOnChange((data) => {
        console.log('[DataProvider] Data changed from Firestore:', {
          hasGlobalMetadata: data.globalMetadata !== null,
          hasDailyPractice: data.dailyPracticeData !== null,
          hasDevPlan: data.developmentPlanData !== null,
          hasMembership: data.membershipData !== null // ADDED: Membership check
        });
        
        // SENTINEL DETECTOR: Find any FieldValue sentinels that would cause React Error #31
        const detectSentinels = (obj, path = '') => {
          const found = [];
          
          if (!obj || typeof obj !== 'object') return found;
          
          // Check if this object is a FieldValue sentinel (has _methodName)
          if ('_methodName' in obj) {
            found.push({
              path: path || 'root',
              method: obj._methodName || 'unknown',
              value: obj
            });
            return found;
          }
          
          // Recursively check arrays
          if (Array.isArray(obj)) {
            obj.forEach((item, index) => {
              found.push(...detectSentinels(item, `${path}[${index}]`));
            });
            return found;
          }
          
          // Recursively check object properties
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              const newPath = path ? `${path}.${key}` : key;
              found.push(...detectSentinels(obj[key], newPath));
            }
          }
          
          return found;
        };
        
        // Run the detector on all data
        const sentinels = detectSentinels(data);
        if (sentinels.length > 0) {
          console.error('🚨 [DataProvider][SentinelDetector] Found FieldValue sentinel(s) in UI state:');
          console.error(sentinels);
          console.error('These will cause React Error #31 if rendered. Fix: strip sentinels before merging into state.');
        }
        
        setServiceData(data);
        
        // Once we have any data, we can set loading to false
        if (data.globalMetadata !== null || data.dailyPracticeData !== null || data.developmentPlanData !== null || data.membershipData !== null) {
          setIsLoadingServices(false);
        }
      });
      
      setServices(createdServices);
      
      // Get initial data (might still be null if listeners haven't fired yet)
      setServiceData({
        developmentPlanData: createdServices.developmentPlanData,
        dailyPracticeData: createdServices.dailyPracticeData,
        strategicContentData: createdServices.strategicContentData,
        membershipData: createdServices.membershipData, // ADDED: Membership data init
        globalMetadata: createdServices.globalMetadata
      });
      
    } catch (error) {
      console.error('[DataProvider] Error creating services:', error);
      setServices(null);
      setIsLoadingServices(false);
    }
    
    // Cleanup function
    return () => {
      if (services) {
        services.cleanup();
      }
    };
  }, [userId, db, isAuthReady]);
  
  // --- Create backwards-compatible hook objects from services ---
  const devPlanHook = useMemo(() => services ? {
    developmentPlanData: serviceData.developmentPlanData,
    updateDevelopmentPlanData: services.updateDevelopmentPlanData,
    isLoading: false,
    error: null
  } : { developmentPlanData: null, updateDevelopmentPlanData: null, isLoading: isLoadingServices, error: null }, [services, serviceData.developmentPlanData, isLoadingServices]);
  
  const dailyPracticeHook = useMemo(() => services ? {
    dailyPracticeData: serviceData.dailyPracticeData,
    updateDailyPracticeData: services.updateDailyPracticeData,
    isLoading: false,
    error: null
  } : { dailyPracticeData: null, updateDailyPracticeData: null, isLoading: isLoadingServices, error: null }, [services, serviceData.dailyPracticeData, isLoadingServices]);
  
  const strategicContentHook = useMemo(() => services ? {
    strategicContentData: serviceData.strategicContentData,
    updateStrategicContentData: services.updateStrategicContentData,
    isLoading: false,
    error: null
  } : { strategicContentData: null, updateStrategicContentData: null, isLoading: isLoadingServices, error: null }, [services, serviceData.strategicContentData, isLoadingServices]);
  
  const membershipHook = useMemo(() => services ? { // ADDED: Membership hook
    membershipData: serviceData.membershipData,
    updateMembershipData: services.updateMembershipData,
    isLoading: false,
    error: null
  } : { membershipData: null, updateMembershipData: null, isLoading: isLoadingServices, error: null }, [services, serviceData.membershipData, isLoadingServices]);

  const globalHook = useMemo(() => services ? {
    metadata: serviceData.globalMetadata,
    isLoading: false,
    error: null
  } : { metadata: null, isLoading: isLoadingServices, error: null }, [services, serviceData.globalMetadata, isLoadingServices]);

  // --- Combined Loading & Error States ---
  const isUserHookLoading = devPlanHook.isLoading || dailyPracticeHook.isLoading || strategicContentHook.isLoading || membershipHook.isLoading; // ADDED: Membership loading
  const isLoading = isUserHookLoading || globalHook.isLoading; // combined app loading
  const error = devPlanHook.error || dailyPracticeHook.error || strategicContentHook.error || membershipHook.error || globalHook.error;

  // --- Resolve metadata and API key ---
  const resolvedMetadata = useMemo(() => resolveGlobalMetadata(globalHook.metadata), [globalHook.metadata]);

  // --- Derive `isAdmin` status ---
  const isAdmin = useMemo(() => {
      // CRITICAL FIX: Hardcode primary admin(s) for immediate access and recovery
      const PRIMARY_ADMIN_EMAILS = ['rob@sagecg.com', 'admin@leaderreps.com']; // <-- ADDED HARDCODED ADMINS

      // 🚨 FIX: Load adminEmails from resolvedMetadata
      const adminEmails = resolvedMetadata.adminemails || []; 
      const userEmail = user?.email?.toLowerCase(); // Cache user email

      // Check against hardcoded list OR the list from metadata
      const isPrimaryAdmin = !!userEmail && PRIMARY_ADMIN_EMAILS.includes(userEmail); // <-- ADDED HARDCODED CHECK

      // Ensure the array is present and includes the user's email
      return isPrimaryAdmin || (!!userEmail && Array.isArray(adminEmails) && adminEmails.includes(userEmail));
  }, [user, resolvedMetadata]); // Now depends on user and dynamically loaded metadata

  // --- Derive `hasPendingDailyPractice` (using updated data structure) ---
  const hasPendingDailyPractice = useMemo(() => {
    const dailyData = dailyPracticeHook.dailyPracticeData;
    const todayStr = new Date().toISOString().split('T')[0];
    const hasPendingTargetRep = dailyData?.dailyTargetRepStatus === 'Pending' && dailyData?.dailyTargetRepDate === todayStr && !!dailyData?.dailyTargetRepId;
    const hasPendingAdditionalReps = (dailyData?.activeCommitments || []).some(
        c => c.status === 'Pending'
    );
    return hasPendingTargetRep || hasPendingAdditionalReps;
  }, [dailyPracticeHook.dailyPracticeData]);


  const apiKey = useMemo(() => {
      return resolvedMetadata.API_KEY || (typeof __GEMINI_API_KEY !== 'undefined' ? __GEMINI_API_KEY : '');
  }, [resolvedMetadata.API_KEY]);

  const hasGeminiKey = useCallback(() => !!apiKey, [apiKey]);

  const callSecureGeminiAPI = useCallback(async (payload) => {
      if (!hasGeminiKey()) {
          console.error("Gemini API Key check failed in callSecureGeminiAPI. Ensure it's loaded correctly.");
          throw new Error("Gemini API Key is missing or not configured.");
      }

      const YOUR_BACKEND_ENDPOINT_URL = 'YOUR_SECURE_CLOUD_FUNCTION_URL_HERE'; 
      
      if (YOUR_BACKEND_ENDPOINT_URL === 'YOUR_SECURE_CLOUD_FUNCTION_URL_HERE') {
           console.error("CRITICAL SETUP ERROR: The backend endpoint URL for callSecureGeminiAPI has not been set in App.jsx.");
           throw new Error("AI Rep Coach backend is not configured. Please contact the administrator.");
      }

      // Use logger instead of console.log for production safety
      if (import.meta.env.DEV) {
        console.log("[callSecureGeminiAPI] Calling backend endpoint:", YOUR_BACKEND_ENDPOINT_URL);
      }

      try {
          const requestOptions = {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
          };

          const response = await fetch(YOUR_BACKEND_ENDPOINT_URL, requestOptions);

          if (!response.ok) {
              let errorBody = 'Could not retrieve error details.';
              try {
                  errorBody = await response.text();
              } catch (_) { /* Ignore parsing error */ }
              console.error(`[callSecureGeminiAPI] Backend call failed with status ${response.status}:`, errorBody);
              throw new Error(`The AI Rep Coach backend returned an error (Status ${response.status}).`);
          }

          const data = await response.json(); 
          console.log("[callSecureGeminiAPI] Received successful response from backend.");
          
          return data; 

      } catch (error) {
          console.error("[callSecureGeminiAPI] Error during fetch to backend:", error);
          throw new Error(`Failed to communicate with the AI Rep Coach: ${error.message}`);
      }
  }, [hasGeminiKey, apiKey]);

  // --- Memoize the context value ---
  const appServicesValue = useMemo(() => {
    const geminiModel = resolvedMetadata.GEMINI_MODEL || 'gemini-1.5-flash';
    const noOpUpdate = async () => false;
    
    // 💡 FIX: Ensure feature flag values are explicitly converted to a safe boolean 
    // to handle cases where they might be stored as the string "true" or the number 1 
    // in Firestore instead of the boolean 'true'.
    const convertedFeatureFlags = Object.fromEntries(
          Object.entries(resolvedMetadata.featureFlags || {}).map(([key, value]) => [
              key, 
              value === true || value === 'true' || value === 1 // Convert to a safe boolean
          ])
      );

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
      isAdmin,
      ADMIN_PASSWORD: resolvedMetadata.ADMIN_PASSWORD || import.meta.env.VITE_ADMIN_PASSWORD || 'change-me-now',

      // User-Specific Data (using updated names)
      developmentPlanData: devPlanHook.developmentPlanData,
      dailyPracticeData: dailyPracticeHook.dailyPracticeData,
      strategicContentData: strategicContentHook.strategicContentData,
      membershipData: membershipHook.membershipData, // ADDED: Membership data
      
      // Global Metadata / Value Sets (extracted from resolvedMetadata)
      metadata: resolvedMetadata,
      featureFlags: convertedFeatureFlags, // Use the converted flags
      LEADERSHIP_TIERS: resolvedMetadata.LEADERSHIP_TIERS || {},
      REP_LIBRARY: resolvedMetadata.REP_LIBRARY || { items: [] },
      EXERCISE_LIBRARY: resolvedMetadata.EXERCISE_LIBRARY || { items: [] },
      WORKOUT_LIBRARY: resolvedMetadata.WORKOUT_LIBRARY || { items: [] },
      COURSE_LIBRARY: resolvedMetadata.COURSE_LIBRARY || { items: [] },
      SKILL_CATALOG: resolvedMetadata.SKILL_CATALOG || { items: [] },
      IDENTITY_ANCHOR_CATALOG: resolvedMetadata.IDENTITY_ANCHOR_CATALOG || { items: [] },
      HABIT_ANCHOR_CATALOG: resolvedMetadata.HABIT_ANCHOR_CATALOG || { items: [] },
      WHY_CATALOG: resolvedMetadata.WHY_CATALOG || { items: [] },
      READING_CATALOG: resolvedMetadata.READING_CATALOG || { items: [] },
      VIDEO_CATALOG: resolvedMetadata.VIDEO_CATALOG || { items: [] },
      SCENARIO_CATALOG: resolvedMetadata.SCENARIO_CATALOG || { items: [] },
      MEMBERSHIP_PLANS: resolvedMetadata.MEMBERSHIP_PLANS || { items: [] }, // ADDED: Membership plans
      RESOURCE_LIBRARY: resolvedMetadata.RESOURCE_LIBRARY || {},
      IconMap: resolvedMetadata.IconMap || {},
      APP_ID: resolvedMetadata.APP_ID || appId,

      // AI/API Services
      callSecureGeminiAPI,
      hasGeminiKey,
      GEMINI_MODEL: geminiModel,
      API_KEY: apiKey,

      // Derived State
      hasPendingDailyPractice,

      // Data Writers
      updateDevelopmentPlanData: devPlanHook.updateDevelopmentPlanData ?? noOpUpdate,
      updateDailyPracticeData: dailyPracticeHook.updateDailyPracticeData ?? noOpUpdate,
      updateStrategicContentData: strategicContentHook.updateStrategicContentData ?? noOpUpdate,
      updateMembershipData: membershipHook.updateMembershipData ?? noOpUpdate, // ADDED: Update membership data
      updateGlobalMetadata: (data, opts) => updateGlobalMetadata(db, data, { ...opts, userId }),
    };
  }, [
      navigate, user, userId, db, auth, isAuthReady, isLoading, error, isAdmin,
      devPlanHook, dailyPracticeHook, strategicContentHook, membershipHook, globalHook,
      hasPendingDailyPractice,
      callSecureGeminiAPI, hasGeminiKey, apiKey, resolvedMetadata
  ]);

  // --- Loading State ---
  if (!isAuthReady) {
      console.log("[DataProvider] Waiting for auth to be ready.");
      return null;
  }
  
  const isUserDataLoading = !!userId && isUserHookLoading;

  if (isUserDataLoading || globalHook.isLoading) {
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
             const firstName = getFirstName(currentUser.displayName);
             const name = firstName || email?.split('@')[0] || 'Leader';
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
          const firstName = getFirstName(currentUser.displayName);
          const name = firstName || email.split('@')[0] || 'Leader';
          console.log(`[App Init] User Authenticated: ${name} (${uid})`);

          // --- CRITICAL: Ensure user docs exist *after* confirming login ---
          await ensureUserDocs(firestore, uid); // Wait for check/creation

          // Set user state
          setUserId(uid);
          setUser({ name, email, userId: uid });
          setAuthRequired(false);

        } else {
          // 🚨 CRITICAL FIX: Clear ALL user state and force authentication requirement
          console.log("[App Init] User Logged Out.");
          setUser(null);
          setUserId(null); // Clear UID to break data hook paths
          setAuthRequired(true);
          setCurrentScreen('dashboard'); // Optionally reset navigation to dashboard/login screen
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
if (isAuthReady && !user) {
  return (
    <AuthPanel
      auth={firebaseServices.auth}
      onSuccess={() => {
        // Let onAuthStateChanged set user + flip auth; no UI flip here.
        console.log("[AuthPanel Success] Auth completed – waiting for onAuthStateChanged.");
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
    >
      {/* Suspense for lazy loaded screens */}
      <Suspense
        fallback={// Fallback shown *after* DataProvider initial load
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
          setIsMobileOpen={setIsMobileOpen} // 🛠️ CORRECTED: This was the source of the ReferenceError
          isAuthRequired={authRequired} // Pass auth status down
          isNavExpanded={isNavExpanded}
          setIsNavExpanded={setIsNavExpanded}
          auth={firebaseServices.auth} // Pass auth for handleSignOut
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
  // 🐛 FIX: Added missing forward slash to close the regex literal
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