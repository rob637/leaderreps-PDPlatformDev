// src/components/layout/MobileBottomNav.jsx
import React from 'react';
import { LayoutDashboard, BookOpen, Megaphone, Lock } from 'lucide-react';
import { CommunityIcon } from '../icons';
import { useAppServices } from '../../services/useAppServices.jsx';
// import { useDayBasedAccessControl } from '../../hooks/useDayBasedAccessControl';

const MobileBottomNav = ({ currentScreen }) => {
  const { navigate } = useAppServices();
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
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-100 md:hidden"
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
      
      {/* Safe area padding for devices with home indicator AND browser UI */}
      <div style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }} aria-hidden="true" />
    </nav>
  );
};

export default MobileBottomNav;