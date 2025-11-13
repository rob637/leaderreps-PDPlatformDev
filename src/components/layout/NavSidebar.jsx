// src/components/layout/NavSidebar.jsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  Briefcase,
  BookOpen,
  ShieldCheck,
  Trello,
  Film,
  Mic,
  BarChart3,
  Users,
  DollarSign,
  Settings,
  X,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { membershipService } from '../../services/membershipService.js';

const NavSidebar = ({
  currentScreen,
  setCurrentScreen,
  closeMobileMenu,
  isAuthRequired,
  isNavExpanded,
  isHamburgerMode = false,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { featureFlags, isAdmin, membershipData } = useAppServices();

  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    return localStorage.getItem('arena-developer-mode') === 'true';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setIsDeveloperMode(localStorage.getItem('arena-developer-mode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const coreNav = [{ screen: 'dashboard', label: 'The Arena', icon: Home }];

  const contentPillarNav = [
    {
      screen: 'development-plan',
      label: 'Development Plan',
      icon: Briefcase,
      flag: 'enableDevPlan',
      requiredTier: 'basic',
    },
    {
      screen: 'business-readings',
      label: 'Professional Reading Hub',
      icon: BookOpen,
      flag: 'enableReadings',
      requiredTier: 'professional',
      devModeOnly: true,
    },
    {
      screen: 'applied-leadership',
      label: 'Course Library',
      icon: ShieldCheck,
      flag: 'enableCourses',
      requiredTier: 'professional',
      devModeOnly: true,
    },
    {
      screen: 'planning-hub',
      label: 'Strategic Content Tools',
      icon: Trello,
      flag: 'enablePlanningHub',
      requiredTier: 'elite',
      devModeOnly: true,
    },
    {
      screen: 'leadership-videos',
      label: 'Content Leader Talks',
      icon: Film,
      flag: 'enableVideos',
      requiredTier: 'elite',
      devModeOnly: true,
    },
  ];

  const coachingPillarNav = [
    {
      screen: 'labs',
      label: 'AI Coaching Lab',
      icon: Mic,
      flag: 'enableLabs',
      requiredTier: 'elite',
      devModeOnly: true,
    },
    {
      screen: 'executive-reflection',
      label: 'Executive ROI Report',
      icon: BarChart3,
      flag: 'enableRoiReport',
      requiredTier: 'elite',
      devModeOnly: true,
    },
  ];

  const communityPillarNav = [
    {
      screen: 'community',
      label: 'Leadership Community',
      icon: Users,
      flag: 'enableCommunity',
      requiredTier: 'professional',
      devModeOnly: true,
    },
  ];

  const systemNav = [
    {
      screen: 'membership-module',
      label: 'Membership & Billing',
      icon: DollarSign,
      flag: 'enableMembershipModule',
      requiredTier: 'basic',
    },
    {
      screen: 'app-settings',
      label: 'App Settings',
      icon: Settings,
      requiredTier: 'basic',
      devModeOnly: true,
    },
  ];

  const menuSections = [
    { title: 'CORE', items: coreNav },
    { title: 'CONTENT PILLAR', items: contentPillarNav },
    { title: 'COACHING PILLAR', items: coachingPillarNav },
    { title: 'COMMUNITY PILLAR', items: communityPillarNav },
    { title: 'SYSTEM', items: systemNav },
  ];

  const handleNavigate = useCallback(
    (screen) => {
      setCurrentScreen(screen);
      closeMobileMenu();
    },
    [setCurrentScreen, closeMobileMenu]
  );

  const renderNavItems = (items) =>
    items
      .filter((item) => {
        if (isAdmin || isDeveloperMode) {
          return true;
        }
        if (item.devModeOnly) {
          return false;
        }
        if (item.flag && featureFlags && featureFlags[item.flag] !== true) {
          return false;
        }
        if (
          item.requiredTier &&
          !membershipService.hasAccess(
            membershipData?.currentTier,
            item.requiredTier
          )
        ) {
          return false;
        }
        return true;
      })
      .map((item) => {
        const Icon = item.icon;
        const isActive = currentScreen === item.screen;
        const label = item.label;

        return (
          <button
            key={item.screen}
            onClick={() => handleNavigate(item.screen)}
            title={!isNavExpanded ? label : ''}
            className={`nav-item-corporate relative group flex items-center w-full transition-all duration-200 focus:outline-none rounded-lg px-3 py-2 text-sm font-semibold ${
              isActive ? 'active bg-corporate-teal text-white shadow-md' : 'text-corporate-light-gray'
            }`}
          >
            <Icon
              className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                isNavExpanded ? 'mr-3' : ''
              } ${isActive ? 'text-white' : 'text-corporate-subtle-teal'}`}
            />
            {isNavExpanded && (
              <span
                className={`flex-1 text-left whitespace-nowrap overflow-hidden overflow-ellipsis transition-opacity duration-300 ${
                  isNavExpanded ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {label}
              </span>
            )}
            {!isNavExpanded && (
              <span
                className={`absolute left-full ml-3 w-auto px-4 py-2.5 text-base font-bold whitespace-nowrap rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-150 z-50 bg-corporate-navy text-corporate-teal border-2 border-corporate-teal`}
                style={{boxShadow: `0 8px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(71, 168, 141, 0.25)`}}
              >
                {label}
              </span>
            )}
          </button>
        );
      });

  if (isAuthRequired) return null;

  const handleNavClick = (screen) => {
    setCurrentScreen(screen);
    if (isHamburgerMode && setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  if (isHamburgerMode) {
    return (
      <>
        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
        <div
          className={`fixed top-0 left-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
            isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          } bg-corporate-navy w-[280px] shadow-2xl`}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200/20">
            <h2
              className="text-lg font-bold text-corporate-teal"
            >
              Navigation
            </h2>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="p-2 hover:bg-gray-100/10 rounded-lg transition-colors text-corporate-light-gray"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {menuSections.map((section) => (
              <div key={section.title} className="mb-6">
                <h3
                  className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-corporate-teal"
                >
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items
                    .filter((item) => {
                      if (isAdmin || isDeveloperMode) {
                        return true;
                      }
                      if (item.devModeOnly) {
                        return false;
                      }
                      if (item.flag && featureFlags && featureFlags[item.flag] !== true) {
                        return false;
                      }
                      if (
                        item.requiredTier &&
                        !membershipService.hasAccess(
                          membershipData?.currentTier,
                          item.requiredTier
                        )
                      ) {
                        return false;
                      }
                      return true;
                    })
                    .map((item, index) => {
                      const Icon = item.icon;
                      const isActive = currentScreen === item.screen;
                      return (
                        <button
                          key={item.screen || index}
                          onClick={() => handleNavClick(item.screen)}
                          className={`w-full flex items-center px-3 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                            isActive ? 'bg-teal-600/20 text-corporate-teal' : 'hover:bg-gray-100/10 text-corporate-light-gray'
                          }`}
                        >
                          <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return null;
};

export default NavSidebar;
