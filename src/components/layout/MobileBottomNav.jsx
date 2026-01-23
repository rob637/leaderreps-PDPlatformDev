// src/components/layout/MobileBottomNav.jsx
import React, { useState } from 'react';
import { LayoutDashboard, BookOpen, Megaphone, Lock, Sparkles, X } from 'lucide-react';
import { CommunityIcon } from '../icons';
import { useAppServices } from '../../services/useAppServices.jsx';

const MobileBottomNav = ({ currentScreen }) => {
  const { navigate, isAdmin } = useAppServices();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  
  // 5 buttons: Dashboard, Community, Content, Coaching, Locker (or AI for admins)
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
    // Last slot: Locker for regular users, AI Coach for admins
    isAdmin ? {
      id: 'ai-coach',
      label: 'AI Coach',
      icon: Sparkles,
      screen: 'ai-coach',
      isAI: true
    } : {
      id: 'locker',
      label: 'Locker',
      icon: Lock,
      screen: 'locker'
    }
  ];

  const handlePasswordSubmit = () => {
    if (password === '7778') {
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError(false);
      navigate('rep');
    } else {
      setPasswordError(true);
    }
  };

  const handleNavClick = (item) => {
    if (!navigate || typeof navigate !== 'function') return;
    
    // AI Coach requires password
    if (item.isAI) {
      setShowPasswordModal(true);
      return;
    }
    
    navigate(item.screen);
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

  // Only show on mobile devices
  return (
    <>
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-100 md:hidden"
        style={{ fontFamily: 'var(--font-body)' }}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex justify-around items-center px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.screen || (item.isAI && currentScreen === 'rep');
            const isAI = item.isAI;
            
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
                      ? isAI 
                        ? 'bg-gradient-to-r from-corporate-teal to-purple-600 shadow-md shadow-corporate-teal/25'
                        : 'bg-corporate-teal shadow-md shadow-corporate-teal/25' 
                      : 'bg-transparent'
                    }
                  `}
                  aria-hidden="true"
                >
                  <Icon 
                    className={`w-5 h-5 transition-colors duration-200 ${
                      isActive ? 'text-white' : isAI ? 'text-purple-500' : 'text-slate-400'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                </div>
                <span 
                  className={`text-[10px] transition-all duration-200 ${
                    isActive 
                      ? 'text-corporate-navy font-semibold' 
                      : isAI ? 'text-purple-500 font-medium' : 'text-slate-400 font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Safe area padding for devices with home indicator AND browser UI */}
        <div style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }} aria-hidden="true" />
      </nav>

      {/* Password Modal for AI Coach */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm md:hidden">
          <div className="bg-white rounded-2xl p-6 mx-4 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-corporate-teal to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-corporate-navy text-lg">AI Coach</h3>
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
                  : 'border-slate-200 focus:border-corporate-teal'
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
              className="w-full py-3.5 bg-gradient-to-r from-corporate-teal to-purple-600 text-white rounded-xl font-semibold
                         hover:opacity-90 transition-opacity shadow-lg"
            >
              Access AI Coach
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileBottomNav;