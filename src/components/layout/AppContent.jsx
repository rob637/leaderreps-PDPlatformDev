// src/components/layout/AppContent.jsx 

import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { Menu, LogOut, Loader, Settings, Anchor, ChevronDown, ChevronUp } from 'lucide-react';
import PWAInstall from '../ui/PWAInstall.jsx';
import ScreenRouter from '../../routing/ScreenRouter.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';

// LEADERREPS.COM OFFICIAL CORPORATE COLORS - VERIFIED 11/14/25
const COLORS = {
  // === PRIMARY BRAND COLORS (from leaderreps.com) ===
  NAVY: '#002E47',        // Primary text, headers, navigation
  ORANGE: '#E04E1B',      // Call-to-action buttons, highlights, alerts  
  TEAL: '#47A88D',        // Secondary buttons, success states, accents
  LIGHT_GRAY: '#FCFCFA',  // Page backgrounds, subtle surfaces
  
  // === SEMANTIC MAPPINGS (using ONLY corporate colors) ===
  PRIMARY: '#47A88D',     // Map to TEAL
  SECONDARY: '#E04E1B',   // Map to ORANGE
  SUCCESS: '#47A88D',     // Map to TEAL
  WARNING: '#E04E1B',     // Map to ORANGE
  DANGER: '#E04E1B',      // Map to ORANGE
  INFO: '#47A88D',        // Map to TEAL
  
  // === TEXT & BACKGROUNDS (corporate colors only) ===
  TEXT: '#002E47',        // NAVY for all text
  MUTED: '#47A88D',       // TEAL for muted text
  BG: '#FCFCFA',          // LIGHT_GRAY for backgrounds
  SUBTLE: '#47A88D'       // TEAL for subtle elements
};

// Small inconspicuous Leadership Anchors dropdown component
const LeadershipAnchorsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { identityStatement, habitAnchor, whyStatement } = useAppServices();
  
  // Don't show if no anchors are set
  const hasAnchors = identityStatement || habitAnchor || whyStatement;
  if (!hasAnchors) return null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Your Leadership Anchors"
      >
        <Anchor className="w-4 h-4" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 p-3">
            <h3 className="text-sm font-semibold mb-2" style={{ color: COLORS.NAVY }}>Your Leadership Anchors</h3>
            <div className="space-y-2 text-xs">
              {identityStatement && (
                <div>
                  <p className="font-medium" style={{ color: COLORS.TEAL }}>Identity:</p>
                  <p className="text-gray-600">{identityStatement}</p>
                </div>
              )}
              {habitAnchor && (
                <div>
                  <p className="font-medium" style={{ color: COLORS.BLUE }}>Habit:</p>
                  <p className="text-gray-600">{habitAnchor}</p>
                </div>
              )}
              {whyStatement && (
                <div>
                  <p className="font-medium" style={{ color: COLORS.ORANGE }}>Why:</p>
                  <p className="text-gray-600">{whyStatement}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const AppContent = ({
  currentScreen,
  user,
  navParams,
  isMobileOpen,
  setIsMobileOpen,
  isAuthRequired,
  auth,
}) => {
  // Developer Mode State
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    return localStorage.getItem('arena-developer-mode') === 'true';
  });

  // Tier Simulation State (for development/testing)
  const [simulatedTier, setSimulatedTier] = useState(() => {
    return localStorage.getItem('arena-simulated-tier') || 'basic';
  });
  
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.relative')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Listen for developer mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsDeveloperMode(localStorage.getItem('arena-developer-mode') === 'true');
      setSimulatedTier(localStorage.getItem('arena-simulated-tier') || 'basic');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const toggleDeveloperMode = () => {
    const newMode = !isDeveloperMode;
    setIsDeveloperMode(newMode);
    localStorage.setItem('arena-developer-mode', newMode.toString());
    // Close dropdown when mode changes so user sees the updated menu
    setDropdownOpen(false);
  };

  const handleTierChange = (tier) => {
    setSimulatedTier(tier);
    localStorage.setItem('arena-simulated-tier', tier);
    // Trigger a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'arena-simulated-tier',
      newValue: tier
    }));
    // Close dropdown when tier changes so user sees the updated menu
    setDropdownOpen(false);
  };

  const tierColors = {
    basic: 'bg-gray-500',
    professional: 'bg-blue-500', 
    elite: 'bg-purple-500'
  };

  const tierLabels = {
    basic: 'Basic',
    professional: 'Pro',
    elite: 'Elite'
  };

  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), [
    setIsMobileOpen,
  ]);
  const { navigate, isAdmin, membershipData } = useAppServices();

  // Navigation items for dropdown menu
  const currentTier = isDeveloperMode ? 'elite' : simulatedTier;
  
  // Helper function to check tier access
  const hasAccess = (requiredTier) => {
    if (isAdmin || isDeveloperMode) return true;
    if (!requiredTier) return true;
    
    const tierLevels = { basic: 1, professional: 2, elite: 3 };
    const userLevel = tierLevels[simulatedTier || membershipData?.currentTier || 'basic'];
    const requiredLevel = tierLevels[requiredTier];
    return userLevel >= requiredLevel;
  };

  // Flat navigation menu items (NO subcategories/headers)
  // Basic: Arena, Dev Plan, Membership
  // Pro & Elite: Arena, Dev Plan, Coaching, Community, Library, Membership  
  // Dev: Everything including Developer Tools
  const navigationItems = [
    { screen: 'dashboard', label: 'The Arena', requiredTier: 'basic' },
    { screen: 'development-plan', label: 'Development Plan', requiredTier: 'basic' },
    { screen: 'coaching-lab', label: 'Coaching Lab', requiredTier: 'professional' },
    { screen: 'community', label: 'Community', requiredTier: 'professional' },
    { screen: 'library', label: 'Library', requiredTier: 'professional' },
    { screen: 'membership-module', label: 'Membership', requiredTier: 'basic' },
    // Developer Tools (only visible in dev mode)
    ...(isDeveloperMode ? [
      { screen: 'planning-hub', label: 'Strategic Content Tools', requiredTier: 'basic', devModeOnly: true },
      { screen: 'executive-reflection', label: 'Executive ROI Report', requiredTier: 'basic', devModeOnly: true },
      { screen: 'app-settings', label: 'App Settings', requiredTier: 'basic', devModeOnly: true }
    ] : [])
  ];

  const handleSignOut = async () => {
    try {
      if (auth) await signOut(auth);
      closeMobileMenu();
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="relative min-h-screen flex flex-col font-sans antialiased bg-corporate-light-gray">
      <header className="nav-corporate sticky top-0 flex justify-between items-center z-50 px-6 py-4">
        <div className="flex items-center gap-6">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 text-corporate-navy"
              title="Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[80vh] overflow-y-auto">
                <div className="py-3">
                  {navigationItems
                    .filter(item => {
                      // Developer Tools only show in dev mode
                      if (item.devModeOnly && !isDeveloperMode && !isAdmin) return false;
                      // Check tier access
                      if (!hasAccess(item.requiredTier)) return false;
                      return true;
                    })
                    .map((item) => (
                      <button
                        key={item.screen}
                        onClick={() => {
                          if (navigate) {
                            navigate(item.screen);
                          }
                          setDropdownOpen(false);
                        }}
                        className={`nav-item-corporate w-full text-left mx-2 ${
                          currentScreen === item.screen ? 'active' : ''
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <img 
              src="/images/leaderreps-logo.svg" 
              alt="LeaderReps" 
              className="h-8 sm:h-10 w-auto"
            />
            <LeadershipAnchorsDropdown />
            {isDeveloperMode && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                DEV
              </span>
            )}
            {!isDeveloperMode && (
              <span 
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: tierColors[simulatedTier] }}
              >
                TEST: {tierLabels[simulatedTier]}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tier Selector (only in user mode) */}
          {!isDeveloperMode && (
            <div className="relative">
              <select
                value={simulatedTier}
                onChange={(e) => handleTierChange(e.target.value)}
                className={`px-2 py-1.5 rounded-md text-xs font-normal transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 text-white border-none cursor-pointer ${tierColors[simulatedTier]}`}
                title="Simulate Membership Tier (Dev Only)"
              >
                <option value="basic">Basic Tier</option>
                <option value="professional">Pro Tier</option>
                <option value="elite">Elite Tier</option>
              </select>
            </div>
          )}
          
          <button
            onClick={toggleDeveloperMode}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-normal transition-colors hover:bg-gray-100 focus:outline-none ${
              isDeveloperMode 
                ? 'bg-orange-500 text-white' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            title={isDeveloperMode ? "Switch to User Mode" : "Switch to Developer Mode"}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDeveloperMode ? 'DEV' : 'USER'}</span>
          </button>
          <PWAInstall />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-normal transition-colors hover:bg-gray-100 text-gray-600 hover:text-gray-800"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Navigation moved to header dropdown */}

      <main className="flex-1 flex flex-col pb-20 md:pb-0">
        <div className="flex-1 overflow-y-auto">
          <div className="content-wrapper-corporate">
            <Suspense
              fallback={
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center gradient-corporate-hero">
                  <div className="card-corporate-elevated flex flex-col items-center p-12">
                    <div className="loading-corporate mb-6"></div>
                    <p className="corporate-text-body text-corporate-navy">
                      Loading Content...
                    </p>
                  </div>
                </div>
              }
            >
            <ScreenRouter
              currentScreen={currentScreen}
              navParams={navParams}
              navigate={navigate}
              isDeveloperMode={isDeveloperMode}
              simulatedTier={simulatedTier}
            />
          </Suspense>
          </div>
        </div>

        <footer className="w-full text-center mt-auto border-t bg-corporate-light-gray border-corporate-subtle-teal p-4">
          <p className="corporate-text-muted">
            © {currentYear} LeaderReps. All rights reserved.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1 text-xs text-text-muted">
            <a
              href="https://leaderreps.com/privacy-policy#data-collection"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-200 text-text-muted"
            >
              Privacy Policy
            </a>
            <span>|</span>
            <a
              href="https://leaderreps.com/terms-of-service#user-obligations"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-200 text-text-muted"
            >
              Terms of Service
            </a>
            <span>|</span>
            <a
              href="https://leaderreps.com/cookie-policy#cookie-types"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-200 text-text-muted"
            >
              Cookie Policy
            </a>
            <span>|</span>
            <a
              href="https://leaderreps.com/refund-policy#eligibility"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-200 text-text-muted"
            >
              Refund Policy
            </a>
            <span>|</span>
            <a
              href="https://leaderreps.com/contact#support-form"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-200 text-text-muted"
            >
              Contact Us
            </a>
          </div>
        </footer>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav 
          currentScreen={currentScreen} 
        />
      </main>
    </div>
  );
};

export default AppContent;
