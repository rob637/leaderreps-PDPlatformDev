// src/components/layout/MobileBottomNav.jsx
import React from 'react';
import { Home, BookOpen, MessageSquare, Users, Archive } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';

const MobileBottomNav = ({ currentScreen }) => {
  const { navigate } = useAppServices();
  
  // 5 buttons: Dashboard, Content, Communication, Coaching, Locker
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      screen: 'dashboard'
    },
    {
      id: 'library',
      label: 'Content',
      icon: BookOpen,
      screen: 'library'
    },
    {
      id: 'community',
      label: 'Community',
      icon: MessageSquare,
      screen: 'community'
    },
    {
      id: 'coaching',
      label: 'Coaching',
      icon: Users,
      screen: 'coaching-lab'
    },
    {
      id: 'locker',
      label: 'Locker',
      icon: Archive,
      screen: 'locker'
    }
  ];

  const handleNavClick = (item) => {
    if (navigate && typeof navigate === 'function') {
      navigate(item.screen);
    }
  };

  // Only show on mobile devices
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-corporate-light-gray border-t border-slate-200 md:hidden pb-safe">
      <div className="flex justify-between items-center px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.screen;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="flex flex-col items-center justify-center flex-1 gap-1 min-w-0"
            >
              <div className={`
                px-3 py-1 rounded-full transition-all duration-200
                ${isActive ? 'bg-corporate-teal' : 'bg-transparent'}
              `}>
                <Icon 
                  className={`w-6 h-6 transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-slate-500'
                  }`}
                />
              </div>
              <span 
                className={`text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? 'text-corporate-navy font-bold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
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