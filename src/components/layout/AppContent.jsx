// src/components/layout/AppContent.jsx

import React, { Suspense, useCallback } from 'react';
import { signOut } from 'firebase/auth';
import { Menu, LogOut, Loader } from 'lucide-react';
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
  const closeMobileMenu = useCallback(() => setIsMobileOpen(false), [
    setIsMobileOpen,
  ]);
  const { navigate } = useAppServices();

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
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-corporate-navy"
            title="Open Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-corporate-navy">
            LeaderReps
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <PWAInstall />
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 bg-corporate-orange text-white"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      <NavSidebar
        currentScreen={currentScreen}
        setCurrentScreen={setCurrentScreen}
        user={user}
        closeMobileMenu={closeMobileMenu}
        isAuthRequired={isAuthRequired}
        isNavExpanded={true}
        setIsNavExpanded={setIsNavExpanded}
        isHamburgerMode={true}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

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
              navigate={navigate}
            />
          </Suspense>
        </div>

        <footer className="w-full text-center mt-auto border-t bg-corporate-light-gray border-corporate-subtle-teal p-4">
          <p className="corporate-text-muted">
            © {currentYear} LeaderReps. All rights reserved.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-1 text-xs text-text-muted">
            <a
              href="https://leaderreps.com/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-200 text-text-muted"
            >
              Privacy Policy
            </a>
            <span>|</span>
            <a
              href="https://leaderreps.com/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-200 text-text-muted"
            >
              Terms of Service
            </a>
            <span>|</span>
            <a
              href="https://leaderreps.com/cookie-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-200 text-text-muted"
            >
              Cookie Policy
            </a>
            <span>|</span>
            <a
              href="https://leaderreps.com/refund-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline transition-colors duration-200 text-text-muted"
            >
              Refund Policy
            </a>
            <span>|</span>
            <a
              href="https://leaderreps.com/contact"
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
