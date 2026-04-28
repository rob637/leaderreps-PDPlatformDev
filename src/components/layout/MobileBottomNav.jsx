// src/components/layout/MobileBottomNav.jsx
import React from 'react';
import { LayoutDashboard, BookOpen, Megaphone, Zap, Calendar, MessageCircleQuestion } from 'lucide-react';
import { LockerIcon } from '../icons';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useDailyPlan } from '../../hooks/useDailyPlan';
import { useRevampFlag } from '../../hooks/useRevampFlag';

const MobileBottomNav = ({ currentScreen }) => {
  const { navigate } = useAppServices();
  const { currentPhase } = useDailyPlan();
  const revampEnabled = useRevampFlag();

  // Conditioning and Coaching are only available during Foundation phase (not during Prep)
  // Available once user enters Level 1, regardless of prep completion status
  const isFoundationPhase = currentPhase?.id === 'start' || currentPhase?.id === 'post-start';

  // Revamp nav: 5 items in bottom bar (Locker accessed via header avatar)
  // Order: Dashboard, Events, Content, Conditioning, Ask a Coach
  const revampNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, screen: 'dashboard' },
    { id: 'events', label: 'Events', icon: Calendar, screen: 'events' },
    { id: 'library', label: 'Content', icon: BookOpen, screen: 'library' },
    { id: 'conditioning-light', label: 'Conditioning', icon: Zap, screen: 'conditioning-light', requiresFoundation: true },
    { id: 'ask-coach', label: 'Ask a Coach', icon: MessageCircleQuestion, screen: 'ask-coach', requiresFoundation: true },
  ];

  // Legacy nav: 5 core mobile buttons - some are phase-gated
  const legacyNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      screen: 'dashboard'
    },
    {
      id: 'conditioning',
      label: 'Conditioning',
      icon: Zap,
      screen: 'conditioning',
      requiresFoundation: true  // Only show in Foundation phase
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
      screen: 'coaching-hub',
      requiresFoundation: true  // Only show in Foundation phase
    },
    {
      id: 'locker',
      label: 'Locker',
      icon: LockerIcon,
      screen: 'locker'
    }
  ];

  const navItems = revampEnabled ? revampNavItems : legacyNavItems;

  const handleNavClick = (item) => {
    if (!navigate || typeof navigate !== 'function') return;
    navigate(item.screen);
    // Scroll to top on navigation
    window.scrollTo(0, 0);
  };

  // Filter items based on phase access and current screen
  let visibleItems = navItems.filter((item) => {
    // Filter out Foundation-only items during Prep phase
    if (item.requiresFoundation && !isFoundationPhase) {
      return false;
    }
    // Revamp nav: keep all 5 items (highlight active in render); legacy nav: hide active
    if (revampEnabled) return true;
    return item.screen !== currentScreen;
  });

  // Legacy nav cap: ensure we only show 4 items max. Revamp nav always shows all 5.
  if (!revampEnabled && visibleItems.length > 4) {
    visibleItems = visibleItems.slice(0, 4);
  }

  // Only show on mobile devices
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-100 dark:border-slate-700 md:hidden"
      style={{ fontFamily: 'var(--font-body)' }}
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex justify-around items-center px-2 py-2">
        {visibleItems.map((item) => {
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
                ${isActive ? '' : 'active:bg-slate-50 dark:active:bg-slate-800'}
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
                    ? 'text-corporate-navy dark:text-white font-semibold' 
                    : 'text-slate-400 dark:text-slate-500 font-medium'
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
