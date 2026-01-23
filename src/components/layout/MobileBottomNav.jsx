// src/components/layout/MobileBottomNav.jsx
import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Megaphone, Lock, Sparkles, X } from 'lucide-react';
import { CommunityIcon } from '../icons';
import { useAppServices } from '../../services/useAppServices.jsx';
// import { useDayBasedAccessControl } from '../../hooks/useDayBasedAccessControl';

const MobileBottomNav = ({ currentScreen }) => {
  const { navigate, isAdmin } = useAppServices();
  const [showRepPassword, setShowRepPassword] = useState(false);
  const [repPassword, setRepPassword] = useState('');
  const [repPasswordError, setRepPasswordError] = useState(false);
  // const { zoneVisibility } = useDayBasedAccessControl();
  
  // 5 buttons: Dashboard, Community, Content, Coaching, Locker
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      screen: 'dashboard'
    },
    {
      id: 'community',
      label: 'Community',
      icon: CommunityIcon,
      screen: 'community'
    },
    {
      id: 'library',
      label: 'Content',
      icon: BookOpen,
      screen: 'library'
    },
    {
      id: 'coaching',
      label: 'Coaching',
      icon: Megaphone,
      screen: 'coaching-lab'
    },
    {
      id: 'locker',
      label: 'Locker',
      icon: Lock,
      screen: 'locker'
    }
  ];

  const handleNavClick = (item) => {
    if (navigate && typeof navigate === 'function') {
      navigate(item.screen);
      // Scroll to top on navigation
      window.scrollTo(0, 0);
    }
  };

  // Only show on mobile devices
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-100 md:hidden relative"
      style={{ fontFamily: 'var(--font-body)' }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.screen;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              aria-label={`Navigate to ${item.label}`}
              aria-current={isActive ? 'page' : undefined}
              className={`
                flex flex-col items-center justify-center gap-1 py-1.5 px-3
                min-h-[52px] min-w-[52px] rounded-xl touch-manipulation
                transition-all duration-200
                active:scale-95
                focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2
                ${isActive ? '' : 'active:bg-slate-50'}
              `}
            >
              <div 
                className={`
                  px-3 py-1.5 rounded-full transition-all duration-200
                  ${isActive 
                    ? 'bg-corporate-teal shadow-md shadow-corporate-teal/25' 
                    : 'bg-transparent'
                  }
                `}
                aria-hidden="true"
              >
                <Icon 
                  className={`w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span 
                className={`text-[10px] transition-all duration-200 ${
                  isActive 
                    ? 'text-corporate-navy font-semibold' 
                    : 'text-slate-400 font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Rep Coach Button - Admin Only, Red like Admin Center */}
      {isAdmin && (
        <div className="absolute -top-12 right-4">
          <button
            onClick={() => setShowRepPassword(true)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
              transition-all duration-200 active:scale-95
              ${currentScreen === 'rep' 
                ? 'bg-red-500 text-white' 
                : 'bg-red-500/90 text-white hover:bg-red-600'
              }
            `}
            aria-label="Open Rep Coach"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold">Rep</span>
          </button>
        </div>
      )}

      {/* Rep Password Modal */}
      {showRepPassword && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-corporate-navy">Rep Coach</h3>
                  <p className="text-xs text-slate-500">Enter access code</p>
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
                  if (repPassword === '7778') {
                    setShowRepPassword(false);
                    setRepPassword('');
                    navigate('rep');
                  } else {
                    setRepPasswordError(true);
                  }
                }
              }}
              placeholder="••••"
              className={`
                w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono
                border-2 rounded-xl mb-4 transition-colors
                focus:outline-none
                ${repPasswordError 
                  ? 'border-red-500 bg-red-50 focus:border-red-500' 
                  : 'border-slate-200 focus:border-corporate-teal'
                }
              `}
              autoFocus
            />
            
            {repPasswordError && (
              <p className="text-red-500 text-sm text-center mb-4">
                Incorrect code. Try again.
              </p>
            )}
            
            <button
              onClick={() => {
                if (repPassword === '7778') {
                  setShowRepPassword(false);
                  setRepPassword('');
                  navigate('rep');
                } else {
                  setRepPasswordError(true);
                }
              }}
              className="w-full py-3 bg-red-500 text-white rounded-xl font-medium
                         hover:bg-red-600 transition-colors"
            >
              Access Rep Coach
            </button>
          </div>
        </div>
      )}
      
      {/* Safe area padding for devices with home indicator AND browser UI */}
      <div style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }} aria-hidden="true" />
    </nav>
  );
};

export default MobileBottomNav;