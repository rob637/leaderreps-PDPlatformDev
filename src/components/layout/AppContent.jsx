// src/components/layout/AppContent.jsx 

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { signOut, updateProfile } from 'firebase/auth';
import { LogOut, Loader, Settings, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import ScreenRouter from '../../routing/ScreenRouter.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import ArenaSidebar from './ArenaSidebar.jsx';
import WidgetRenderer from '../admin/WidgetRenderer.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';
import { NavigationProvider } from '../../providers/NavigationProvider.jsx';
import TimeTravelBanner from '../admin/TimeTravelBanner.jsx';
import { PageTransition } from '../motion';
import { SyncIndicator } from '../offline';
import SkipLinks from '../accessibility/SkipLinks';

const AppContent = ({
  currentScreen,
  user,
  navParams,
  // eslint-disable-next-line no-unused-vars
  isMobileOpen,
  // eslint-disable-next-line no-unused-vars
  setIsMobileOpen,
  // eslint-disable-next-line no-unused-vars
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
  
  // Ref for main scrollable content area - used for scroll-to-top on navigation
  const mainContentRef = useRef(null);
  
  // Scroll to top when screen changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
  }, [currentScreen]);

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

  /*
  const toggleDeveloperMode = () => {
    const newMode = !isDeveloperMode;
    setIsDeveloperMode(newMode);
    localStorage.setItem('arena-developer-mode', newMode.toString());
  };
  */

  const { navigate, isAdmin, membershipData, logout } = useAppServices();

  const handleSignOut = async () => {
    try {
      // Clear local storage first
      localStorage.removeItem('lastScreen');
      localStorage.removeItem('lastNavParams');
      localStorage.removeItem('arena-developer-mode');
      
      if (logout) {
        await logout();
      } else if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.error('Sign out failed:', e);
      // Force reload as fallback
      window.location.reload();
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
      {/* Skip Links for keyboard accessibility */}
      <SkipLinks 
        links={[
          { id: 'main-content', label: 'Skip to main content' },
          { id: 'main-nav', label: 'Skip to navigation' }
        ]} 
      />
      
      {/* Time Travel Banner - visible to admins when active */}
      <TimeTravelBanner isAdmin={isAdmin} />
      
      <div className="relative min-h-screen flex justify-center font-sans antialiased bg-corporate-navy overflow-hidden">
        
        {/* Centered App Container */}
        <div className={`flex w-full ${isFullWidthScreen ? 'max-w-full' : 'max-w-[1000px]'} h-screen relative`}>
          
          {/* New Sidebar */}
          <nav id="main-nav" aria-label="Main navigation">
            <ArenaSidebar 
              isOpen={isSidebarOpen} 
              toggle={() => setIsSidebarOpen(!isSidebarOpen)}
              currentScreen={currentScreen}
              navigate={navigate}
              onSignOut={handleSignOut}
              user={user}
              membershipData={membershipData}
            />
          </nav>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300 bg-[#FAFBFC] md:rounded-3xl md:shadow-2xl md:my-2 md:mr-2" role="main">
            
            <main className="flex-1 flex flex-col overflow-hidden relative md:rounded-3xl" aria-label="Page content">
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

              <div ref={mainContentRef} className="flex-1 overflow-y-auto pb-20 md:pb-0">
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
                  {/* Page Transition Animation */}
                  <PageTransition pageKey={currentScreen}>
                    <div id="main-content">
                      <ScreenRouter
                        currentScreen={currentScreen}
                        navParams={navParams}
                        navigate={navigate}
                        isDeveloperMode={isDeveloperMode}
                      />
                    </div>
                  </PageTransition>
              </Suspense>
            </div>

            <footer className="w-full text-center mt-auto border-t bg-white/60 backdrop-blur-sm border-slate-100 p-5 pb-24 md:pb-5">
              {/* Sync Status Indicator */}
              <div className="flex justify-center mb-3">
                <SyncIndicator variant="badge" showWhenSynced={false} />
              </div>
              <p className="text-slate-400 text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                © {currentYear} LeaderReps. All rights reserved.
              </p>
              <nav className="mt-3 flex flex-wrap justify-center gap-2 text-xs text-slate-500" aria-label="Footer navigation">
                <button
                  onClick={() => navigate('privacy-policy')}
                  className="hover:text-corporate-teal focus:text-corporate-teal transition-colors duration-200 text-slate-500 bg-transparent border-none cursor-pointer px-2 py-1 min-h-[44px] min-w-[44px] rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2 touch-manipulation"
                  aria-label="View privacy policy"
                >
                  Privacy Policy
                </button>
                <span className="text-slate-300 self-center" aria-hidden="true">·</span>
                <button
                  onClick={() => navigate('terms-of-service')}
                  className="hover:text-corporate-teal focus:text-corporate-teal transition-colors duration-200 text-slate-500 bg-transparent border-none cursor-pointer px-2 py-1 min-h-[44px] min-w-[44px] rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2 touch-manipulation"
                  aria-label="View terms and conditions"
                >
                  Terms & Conditions
                </button>
                <span className="text-slate-300 self-center" aria-hidden="true">·</span>
                <button
                  onClick={() => navigate('contact-us')}
                  className="hover:text-corporate-teal focus:text-corporate-teal transition-colors duration-200 text-slate-500 bg-transparent border-none cursor-pointer px-2 py-1 min-h-[44px] min-w-[44px] rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2 touch-manipulation"
                  aria-label="Contact us"
                >
                  Contact Us
                </button>
                <span className="text-slate-300 self-center" aria-hidden="true">·</span>
                <button
                  onClick={() => navigate('help-center')}
                  className="hover:text-corporate-teal focus:text-corporate-teal transition-colors duration-200 text-slate-500 bg-transparent border-none cursor-pointer px-2 py-1 min-h-[44px] min-w-[44px] rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2 touch-manipulation"
                  aria-label="Visit help center"
                >
                  Help Center
                </button>
              </nav>
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
