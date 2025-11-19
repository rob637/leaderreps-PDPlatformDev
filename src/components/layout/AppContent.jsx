// src/components/layout/AppContent.jsx 

import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import { Menu, LogOut, Loader, Settings, Anchor, ChevronDown, ChevronUp } from 'lucide-react';
import PWAInstall from '../ui/PWAInstall.jsx';
import ScreenRouter from '../../routing/ScreenRouter.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import ArenaSidebar from './ArenaSidebar.jsx';
import ScrollingQuotes from '../ui/ScrollingQuotes.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';
import { NavigationProvider } from '../../providers/NavigationProvider.jsx';

// LEADERREPS.COM OFFICIAL CORPORATE COLORS - VERIFIED 11/14/25
const COLORS = {
  // ...existing code...
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
  goBack,
  canGoBack,
}) => {
  // Developer Mode State
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    return localStorage.getItem('arena-developer-mode') === 'true';
  });

  // Tier Simulation State (for development/testing)
  const [simulatedTier, setSimulatedTier] = useState('premium');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Listen for developer mode changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsDeveloperMode(localStorage.getItem('arena-developer-mode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Temporary fix: Update Rob's profile name if missing
  useEffect(() => {
    if (user && !user.displayName && (user.email === 'rob@sagecg.com' || user.email === 'rob@leaderreps.com')) {
      console.log("Updating profile for Rob...");
      updateProfile(user, { displayName: 'Rob Pfleghardt' })
        .then(() => {
          console.log("Profile updated successfully");
          // Force a reload to reflect changes if needed, or just let React handle it
          window.location.reload();
        })
        .catch(err => console.error("Error updating profile:", err));
    }
  }, [user]);

  const toggleDeveloperMode = () => {
    const newMode = !isDeveloperMode;
    setIsDeveloperMode(newMode);
    localStorage.setItem('arena-developer-mode', newMode.toString());
  };

  const handleTierChange = (tier) => {
    console.log('🎚️ [AppContent] Tier changed:', { oldTier: simulatedTier, newTier: tier, isDeveloperMode });
    setSimulatedTier(tier);
    localStorage.setItem('arena-simulated-tier', tier);
    // Trigger a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'arena-simulated-tier',
      newValue: tier
    }));
  };

  const tierColors = {
    free: 'bg-gray-500',
    premium: 'bg-orange-500'
  };

  const tierLabels = {
    free: 'Free',
    premium: 'Premium'
  };

  const { navigate, isAdmin, membershipData, logout } = useAppServices();

  const handleSignOut = async () => {
    try {
      if (logout) {
        await logout();
      } else if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <NavigationProvider
      navigate={navigate}
      canGoBack={canGoBack}
      goBack={goBack}
      currentScreen={currentScreen}
      navParams={navParams}
    >
      <div className="relative min-h-screen flex font-sans antialiased bg-corporate-light-gray overflow-hidden">
        
        {/* New Sidebar */}
        <ArenaSidebar 
          isOpen={isSidebarOpen} 
          toggle={() => setIsSidebarOpen(!isSidebarOpen)}
          currentScreen={currentScreen}
          navigate={navigate}
          onSignOut={handleSignOut}
          user={user}
          membershipData={membershipData}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300">
          
          <ScrollingQuotes />

          <header className="nav-corporate sticky top-0 flex justify-between items-center z-30 px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 text-corporate-navy"
                title="Toggle Menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              {/* The Arena Title (Next to Hamburger) */}
              <h1 className="text-2xl font-bold text-corporate-navy font-serif hidden md:block">
                The Arena
              </h1>
              
              {/* Mobile Logo (only show if sidebar is closed or on mobile) */}
              <img 
                src="/images/lr_logo_teal__1_.png" 
                alt="LeaderReps" 
                className="h-8 w-auto object-contain md:hidden"
              />
              
              <LeadershipAnchorsDropdown />
            </div>

            <div className="flex items-center gap-3">
              
              <PWAInstall />
              <span className="text-[10px] text-gray-300 font-mono">v{__APP_VERSION__}</span>
            </div>
          </header>

          <main className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto">
                <Suspense
                  fallback={
                    <div className="min-h-full flex items-center justify-center gradient-corporate-hero">
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
            
            {/* Mobile Bottom Navigation - Only show on small screens */}
            <div className="md:hidden">
              <MobileBottomNav 
                currentScreen={currentScreen} 
              />
            </div>
          </main>
        </div>
      </div>
    </NavigationProvider>
  );
};

export default AppContent;
