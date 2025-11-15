// src/components/layout/MobileBottomNav.jsx
import React from 'react';
import { Home, Target, Users, BookOpen } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';

const COLORS = {
  NAVY: '#002E47',
  TEAL: '#47A88D',
  ORANGE: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  MUTED: '#6B7280'
};

const MobileBottomNav = ({ currentScreen }) => {
  const { navigate } = useAppServices();
  
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      screen: 'dashboard'
    },
    {
      id: 'dev-plan',
      label: 'Dev Plan',
      icon: Target,
      screen: 'development-plan'
    },
    {
      id: 'coaching',
      label: 'Coaching',
      icon: Users,
      screen: 'coaching-lab'
    },
    {
      id: 'library',
      label: 'Library',
      icon: BookOpen,
      screen: 'library'
    }
  ];

  const handleNavClick = (item) => {
    if (navigate && typeof navigate === 'function') {
      navigate(item.screen);
    }
  };

  // Only show on mobile devices
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg md:hidden" 
         style={{ 
           borderColor: COLORS.TEAL + '30',
           boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
         }}>
      <div className="flex justify-around items-center py-1 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.screen;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all duration-300 min-w-0 flex-1 mx-1 ${
                isActive 
                  ? 'shadow-lg transform scale-105' 
                  : 'hover:bg-gray-50 active:scale-95'
              }`}
              style={{
                backgroundColor: isActive ? COLORS.TEAL : 'transparent'
              }}
            >
              <Icon 
                className={`w-6 h-6 mb-1 transition-all duration-200 ${
                  isActive ? 'animate-pulse' : ''
                }`}
                style={{ 
                  color: isActive ? '#fff' : COLORS.MUTED 
                }}
              />
              <span 
                className={`text-xs font-semibold truncate transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-gray-600'
                }`}
                style={{
                  fontSize: '10px',
                  lineHeight: '12px'
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div 
                  className="absolute -top-1 w-8 h-1 rounded-full"
                  style={{ backgroundColor: COLORS.ORANGE }}
                />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Safe area padding for devices with home indicator */}
      <div className="pb-safe-area-inset-bottom" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }} />
    </div>
  );
};

export default MobileBottomNav;