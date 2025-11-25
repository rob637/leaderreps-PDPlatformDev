// src/components/layout/AppContent.jsx 

import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import { LogOut, Loader, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import ScreenRouter from '../../routing/ScreenRouter.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import ArenaSidebar from './ArenaSidebar.jsx';
import WidgetRenderer from '../admin/WidgetRenderer.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';
import { NavigationProvider } from '../../providers/NavigationProvider.jsx';

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
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const { navigate, isAdmin, membershipData, logout, globalMetadata } = useAppServices();

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
