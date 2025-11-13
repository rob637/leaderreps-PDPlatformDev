// src/components/layout/AppContent.jsx

import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { Menu, LogOut, Loader, Settings } from 'lucide-react';
import PWAInstall from '../ui/PWAInstall.jsx';
import NavSidebar from './NavSidebar.jsx';
import ScreenRouter from '../../routing/ScreenRouter.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';

const AppContent = ({
  currentScreen,
  setCurrentScreen,
  user,
  navParams,
  isMobileOpen,
  setIsMobileOpen,
  isAuthRequired,
  setIsNavExpanded,
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
  const { navigate, featureFlags, isAdmin, membershipData } = useAppServices();

  // Navigation items for dropdown - matching NavSidebar.jsx structure
  const currentTier = isDeveloperMode ? 'elite' : simulatedTier;
  
  // Helper function to check tier access (matching NavSidebar logic)
  const hasAccess = (requiredTier) => {
    if (isAdmin || isDeveloperMode) return true;
    if (!requiredTier) return true;
    
    const tierLevels = { basic: 1, professional: 2, elite: 3 };
    const userLevel = tierLevels[simulatedTier || membershipData?.currentTier || 'basic'];
    const requiredLevel = tierLevels[requiredTier];
    return userLevel >= requiredLevel;
  };

  // Helper function to check feature flags (matching NavSidebar logic)
  const checkFlag = (flag) => {
    if (!flag) return true;
    return featureFlags?.[flag] === true;
  };

  // Navigation sections matching NavSidebar.jsx
  const navigationSections = [
    {
      title: 'THE ARENA',
      items: [
        { screen: 'dashboard', label: 'The Arena' }
      ]
    },
    {
      title: 'DEVELOPMENT PLAN',
      items: [
        { screen: 'development-plan', label: 'Development Plan', flag: 'enableDevPlan', requiredTier: 'basic' }
      ]
    },
    {
      title: 'COACHING',
      items: [
        { screen: 'labs', label: 'Coaching', flag: 'enableLabs', requiredTier: 'elite' }
      ]
    },
    {
      title: 'COMMUNITY',
      items: [
        { screen: 'community', label: 'Community', flag: 'enableCommunity', requiredTier: 'professional' }
      ]
    },
    {
      title: 'LIBRARY',
      items: [
        { screen: 'applied-leadership', label: 'Courses', flag: 'enableCourses', requiredTier: 'professional' },
        { screen: 'business-readings', label: 'Reading & Reps', flag: 'enableReadings', requiredTier: 'professional' },
        { screen: 'leadership-videos', label: 'Media', flag: 'enableVideos', requiredTier: 'elite' }
      ]
    },
    {
      title: 'MEMBERSHIP',
      items: [
        { screen: 'membership-module', label: 'Membership', flag: 'enableMembershipModule', requiredTier: 'basic' }
      ]
    },
    ...(isDeveloperMode ? [{
      title: 'DEVELOPER TOOLS',
      items: [
        { screen: 'planning-hub', label: 'Strategic Content Tools', flag: 'enablePlanningHub', requiredTier: 'elite', devModeOnly: true },
        { screen: 'executive-reflection', label: 'Executive ROI Report', flag: 'enableRoiReport', requiredTier: 'elite', devModeOnly: true },
        { screen: 'app-settings', label: 'App Settings', requiredTier: 'basic', devModeOnly: true }
      ]
    }] : [])
  ];

  // Flatten sections into items for rendering, filtering by access
  const navigationItems = navigationSections.flatMap(section => 
    section.items
      .filter(item => {
        if (item.devModeOnly && !isDeveloperMode && !isAdmin) return false;
        if (!checkFlag(item.flag)) return false;
        if (!hasAccess(item.requiredTier)) return false;
        return true;
      })
      .map(item => ({ ...item, sectionTitle: section.title }))
  );

  const handleSignOut = async () => {
    try {
      if (auth) await signOut(auth);
      console.log('Sign Out successful.');
      closeMobileMenu();
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="relative min-h-screen flex flex-col font-sans antialiased bg-corporate-light-gray">
      <header className="sticky top-0 bg-white/95 backdrop-blur-sm shadow-md flex justify-between items-center z-50 px-4 py-2 border-b border-corporate-subtle-teal">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-corporate-navy"
              title="Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
                <div className="py-2">
                  {navigationSections.map((section) => {
                    const visibleItems = section.items.filter(item => {
                      if (item.devModeOnly && !isDeveloperMode && !isAdmin) return false;
                      if (!checkFlag(item.flag)) return false;
                      if (!hasAccess(item.requiredTier)) return false;
                      return true;
                    });
                    
                    if (visibleItems.length === 0) return null;
                    
                    return (
                      <div key={section.title} className="mb-1">
                        <div className="px-4 py-1 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          {section.title}
                        </div>
                        {visibleItems.map((item) => (
                          <button
                            key={item.screen}
                            onClick={() => {
                              setCurrentScreen(item.screen);
                              setDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors ${
                              currentScreen === item.screen ? 'bg-corporate-teal text-white' : 'text-gray-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <h1 className="text-xl font-bold text-corporate-navy">
            LeaderReps 
            {isDeveloperMode && <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded ml-2">DEV</span>}
            {!isDeveloperMode && <span className={`text-xs text-white px-2 py-1 rounded ml-2 ${tierColors[simulatedTier]}`}>TEST: {tierLabels[simulatedTier]}</span>}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Tier Selector (only in user mode) */}
          {!isDeveloperMode && (
            <div className="relative">
              <select
                value={simulatedTier}
                onChange={(e) => handleTierChange(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 text-white border-none cursor-pointer ${tierColors[simulatedTier]}`}
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
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 ${
              isDeveloperMode 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={isDeveloperMode ? "Switch to User Mode" : "Switch to Developer Mode"}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{isDeveloperMode ? 'DEV' : 'USER'}</span>
          </button>
          <PWAInstall />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 bg-red-600 hover:bg-red-700 text-white shadow-lg"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Navigation moved to header dropdown */}

      <main className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto">
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
              navigate={setCurrentScreen}
              isDeveloperMode={isDeveloperMode}
              simulatedTier={simulatedTier}
            />
          </Suspense>
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
      </main>
    </div>
  );
};

export default AppContent;
