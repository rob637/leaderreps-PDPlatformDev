// src/components/layout/MobileBottomNav.jsx
import React from 'react';
import { Home, BookOpen, MessageSquare, Users, Archive } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useDayBasedAccessControl } from '../../hooks/useDayBasedAccessControl';

const MobileBottomNav = ({ currentScreen }) => {
  const { navigate } = useAppServices();
  const { zoneVisibility } = useDayBasedAccessControl();
  
  // 5 buttons: Dashboard, Content, Communication, Coaching, Locker
  const navItems = [
    {
      id: 'dashboard',
      label: 'Home',
      icon: Home,
      screen: 'dashboard'
    },
    {
      id: 'library',
      label: 'Content',
      icon: BookOpen,
      screen: 'library',
      visible: zoneVisibility?.isContentZoneOpen
    },
    {
      id: 'community',
      label: 'Community',
      icon: MessageSquare,
      screen: 'community',
      visible: zoneVisibility?.isCommunityZoneOpen
    },
    {
      id: 'coaching',
      label: 'Coaching',
      icon: Users,
      screen: 'coaching-lab',
      visible: zoneVisibility?.isCoachingZoneOpen
    },
    {
      id: 'locker',
      label: 'Locker',
      icon: Archive,
      screen: 'locker',
      visible: zoneVisibility?.isLockerZoneOpen
    }
  ];

  const handleNavClick = (item) => {
    if (navigate && typeof navigate === 'function') {
      navigate(item.screen);
    }
  };

  // Only show on mobile devices
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-100 md:hidden"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="flex justify-around items-center px-2 py-2">
        {navItems.map((item) => {
          if (item.visible === false) return null;
          const Icon = item.icon;
          const isActive = currentScreen === item.screen;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`
                flex flex-col items-center justify-center gap-1 py-1.5 px-3
                min-h-[52px] rounded-xl touch-manipulation
                transition-all duration-200
                active:scale-95
                ${isActive ? '' : 'active:bg-slate-50'}
              `}
            >
              <div className={`
                px-3 py-1.5 rounded-full transition-all duration-200
                ${isActive 
                  ? 'bg-corporate-teal shadow-md shadow-corporate-teal/25' 
                  : 'bg-transparent'
                }
              `}>
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
      
      {/* Safe area padding for devices with home indicator */}
      <div style={{ paddingBottom: 'max(4px, env(safe-area-inset-bottom))' }} />
    </div>
  );
};

export default MobileBottomNav;