// src/components/rep/RepFloatingButton.jsx
// Floating button to access Rep Coach - visible on both mobile and desktop
// Admin-only with password protection

import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';

const RepFloatingButton = () => {
  const { navigate, isAdmin, currentScreen } = useAppServices();
  const [showRepPassword, setShowRepPassword] = useState(false);
  const [repPassword, setRepPassword] = useState('');
  const [repPasswordError, setRepPasswordError] = useState(false);

  // Only show for admins, and hide when already on Rep screen
  if (!isAdmin || currentScreen === 'rep') {
    return null;
  }

  const handlePasswordSubmit = () => {
    if (repPassword === '7778') {
      setShowRepPassword(false);
      setRepPassword('');
      setRepPasswordError(false);
      navigate('rep');
    } else {
      setRepPasswordError(true);
    }
  };

  return (
    <>
      {/* Floating Rep Button - Bottom right, above mobile nav on small screens */}
      <button
        onClick={() => setShowRepPassword(true)}
        className="
          fixed z-40 
          bottom-24 md:bottom-8 
          right-4 md:right-8
          flex items-center gap-2 
          px-4 py-3 
          rounded-full 
          shadow-lg hover:shadow-xl
          transition-all duration-200 
          active:scale-95 hover:scale-105
          bg-red-500 text-white hover:bg-red-600
        "
        aria-label="Open Rep Coach"
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-sm font-semibold">Rep Coach</span>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">NEW</span>
      </button>

      {/* Rep Password Modal */}
      {showRepPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy text-lg">Rep Coach</h3>
                  <p className="text-sm text-slate-500">Enter access code</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowRepPassword(false);
                  setRepPassword('');
                  setRepPasswordError(false);
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
              value={repPassword}
              onChange={(e) => {
                setRepPassword(e.target.value);
                setRepPasswordError(false);
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
                ${repPasswordError 
                  ? 'border-red-500 bg-red-50 focus:border-red-500' 
                  : 'border-slate-200 focus:border-red-500'
                }
              `}
              autoFocus
            />
            
            {repPasswordError && (
              <p className="text-red-500 text-sm text-center mb-4 font-medium">
                Incorrect code. Try again.
              </p>
            )}
            
            <button
              onClick={handlePasswordSubmit}
              className="w-full py-3.5 bg-red-500 text-white rounded-xl font-semibold
                         hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25"
            >
              Access Rep Coach
            </button>
            
            <p className="text-xs text-slate-400 text-center mt-4">
              AI-powered leadership coaching • Admin preview
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default RepFloatingButton;
