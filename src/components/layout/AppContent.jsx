// src/components/layout/AppContent.jsx 

import React, { Suspense, useCallback, useState, useEffect } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import { LogOut, Loader, Settings, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import ScreenRouter from '../../routing/ScreenRouter.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import ArenaSidebar from './ArenaSidebar.jsx';
import WidgetRenderer from '../admin/WidgetRenderer.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';
import { NavigationProvider } from '../../providers/NavigationProvider.jsx';
import TimeTravelBanner from '../admin/TimeTravelBanner.jsx';

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

  const isFullWidthScreen = currentScreen.startsWith('admin-') || 
                           ['data-maintenance', 'debug-data'].includes(currentScreen);

  return (
    <NavigationProvider
      navigate={navigate}
      canGoBack={canGoBack}
      goBack={goBack}
      currentScreen={currentScreen}
      navParams={navParams}
    >
      {/* Time Travel Banner - visible to admins when active */}
      <TimeTravelBanner isAdmin={isAdmin} />
      
      <div className="relative min-h-screen flex justify-center font-sans antialiased bg-corporate-navy overflow-hidden">
        
        {/* Centered App Container */}
        <div className={`flex w-full ${isFullWidthScreen ? 'max-w-full' : 'max-w-[1000px]'} h-screen relative`}>
          
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
          <div className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300 bg-corporate-light-gray md:rounded-3xl md:shadow-2xl md:my-2 md:mr-2">
            
            <main className="flex-1 flex flex-col overflow-hidden relative md:rounded-3xl">
              {/* Global Back Button Header - REMOVED to save whitespace */}
              {/* {canGoBack && (
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center shadow-sm z-10 shrink-0">
                  <button 
                    onClick={goBack}
                    className="flex items-center text-corporate-navy hover:text-corporate-teal transition-colors font-medium"
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                  </button>
                </div>
              )} */}

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
                />
              </Suspense>
            </div>

            <footer className="w-full text-center mt-auto border-t bg-corporate-light-gray border-corporate-subtle-teal p-4">
              <p className="corporate-text-muted">
                © {currentYear} LeaderReps. All rights reserved.
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-1 text-xs text-text-muted">
                <button
                  onClick={() => navigate('privacy-policy')}
                  className="hover:underline transition-colors duration-200 text-text-muted bg-transparent border-none cursor-pointer p-0"
                >
                  Privacy Policy
                </button>
                <span>|</span>
                <button
                  onClick={() => navigate('terms-of-service')}
                  className="hover:underline transition-colors duration-200 text-text-muted bg-transparent border-none cursor-pointer p-0"
                >
                  Terms of Service
                </button>
                <span>|</span>
                <button
                  onClick={() => navigate('cookie-policy')}
                  className="hover:underline transition-colors duration-200 text-text-muted bg-transparent border-none cursor-pointer p-0"
                >
                  Cookie Policy
                </button>
                <span>|</span>
                <button
                  onClick={() => navigate('contact-us')}
                  className="hover:underline transition-colors duration-200 text-text-muted bg-transparent border-none cursor-pointer p-0"
                >
                  Contact Us
                </button>
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
      </div>
    </NavigationProvider>
  );
};

export default AppContent;
