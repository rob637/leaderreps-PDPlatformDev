// src/components/rep/RepFloatingButton.jsx
// Floating button to access The Great Gazoo AI Coach
// Password protected - Gazoo hovers above the app as persistent overlay
// Session-based auth: cleared on logout so users must re-authenticate

import React, { useState, useEffect } from 'react';
import { Brain, X, Sparkles } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import GazooOverlay from './GazooOverlay';

// Session storage key for AI Coach authentication
const AI_COACH_AUTH_KEY = 'ai-coach-authenticated';

const RepFloatingButton = () => {
  const { currentScreen } = useAppServices();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showGazoo, setShowGazoo] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  
  // Check if user is already authenticated this session
  const [isSessionAuthenticated, setIsSessionAuthenticated] = useState(() => {
    return sessionStorage.getItem(AI_COACH_AUTH_KEY) === 'true';
  });

  // Listen for logout events to clear authentication
  useEffect(() => {
    const handleLogout = () => {
      sessionStorage.removeItem(AI_COACH_AUTH_KEY);
      setIsSessionAuthenticated(false);
    };
    
    // Listen for storage changes (in case logout happens in another tab)
    const handleStorageChange = (e) => {
      if (e.key === AI_COACH_AUTH_KEY && e.newValue === null) {
        setIsSessionAuthenticated(false);
      }
    };
    
    window.addEventListener('ai-coach-logout', handleLogout);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('ai-coach-logout', handleLogout);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Hide the floating button when Gazoo is showing (Gazoo has its own minimize button)
  if (showGazoo) {
    return <GazooOverlay onClose={() => setShowGazoo(false)} />;
  }

  const handlePasswordSubmit = () => {
    if (password === '7777') {
      // Save authentication to session storage
      sessionStorage.setItem(AI_COACH_AUTH_KEY, 'true');
      setIsSessionAuthenticated(true);
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError(false);
      setShowGazoo(true); // Show Gazoo directly
    } else {
      setPasswordError(true);
    }
  };
  
  const handleButtonClick = () => {
    // If already authenticated this session, show Gazoo directly
    if (isSessionAuthenticated) {
      setShowGazoo(true);
    } else {
      setShowPasswordModal(true);
    }
  };

  return (
    <>
      {/* Floating AI Coach Button - Desktop only (hidden on mobile) */}
      <button
        onClick={handleButtonClick}
        className="
          fixed z-40 
          hidden md:flex
          bottom-8
          right-8
          items-center gap-2 
          px-4 py-3 
          rounded-full 
          shadow-lg hover:shadow-xl
          transition-all duration-200 
          active:scale-95 hover:scale-105
          bg-gradient-to-r from-lime-500 to-emerald-600 text-white
        "
        aria-label="The Great Gazoo"
      >
        <Brain className="w-5 h-5" />
        <span className="text-sm font-semibold">The Great Gazoo</span>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">NEW</span>
      </button>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-lime-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy text-lg">The Great Gazoo</h3>
                  <p className="text-sm text-slate-500">Enter access code</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setPasswordError(false);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePasswordSubmit();
                }
              }}
              placeholder="••••"
              className={`
                w-full px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono
                border-2 rounded-xl mb-4 transition-colors
                focus:outline-none
                ${passwordError 
                  ? 'border-red-500 bg-red-50 focus:border-red-500' 
                  : 'border-slate-200 focus:border-lime-500'
                }
              `}
              autoFocus
            />
            
            {passwordError && (
              <p className="text-red-500 text-sm text-center mb-4 font-medium">
                Incorrect code. Try again.
              </p>
            )}
            
            <button
              onClick={handlePasswordSubmit}
              className="w-full py-3.5 bg-gradient-to-r from-lime-500 to-emerald-600 text-white rounded-xl font-semibold
                         hover:opacity-90 transition-opacity shadow-lg"
            >
              Summon Gazoo
            </button>
            
            <p className="text-xs text-slate-400 text-center mt-4">
              AI-powered leadership coaching • Dum-dums
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default RepFloatingButton;
