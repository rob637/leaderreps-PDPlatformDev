import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  BookOpen, 
  Megaphone, 
  User, 
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Beaker,
  Anchor,
  Layers,
  Dumbbell,
  Zap,
  Wrench,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { CommunityIcon } from '../icons';
import PWAInstall from '../ui/PWAInstall.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useDailyPlan } from '../../hooks/useDailyPlan';

const ArenaSidebar = ({ isOpen, toggle, currentScreen, navigate, onSignOut, user }) => {
  const { identityStatement, habitAnchor, whyStatement, globalMetadata, isAdmin, userProfile, developmentPlanData } = useAppServices();
  const { prepRequirementsComplete, cohortData } = useDailyPlan();
  const [showAnchors, setShowAnchors] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  
  // Content is unlocked after prep is complete
  const isPrepComplete = prepRequirementsComplete?.allComplete === true;

  // Developer Mode State
  const [isDeveloperMode, setIsDeveloperMode] = useState(() => {
    return localStorage.getItem('arena-developer-mode') === 'true';
  });

  // Listen for developer mode changes
  React.useEffect(() => {
    const handleStorageChange = () => {
      setIsDeveloperMode(localStorage.getItem('arena-developer-mode') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    // Also listen for custom event if we dispatch one
    window.addEventListener('developer-mode-changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('developer-mode-changed', handleStorageChange);
    };
  }, []);

  // Feature Flags - Content unlocks after prep is complete
  const FEATURE_FLAGS = { 
    // V1 CORE FEATURES (ENABLED)
    enableDevPlan: true,
    enableDailyPractice: true,
    enableMembershipModule: true,
    
    // CONTENT - Unlocks after prep completion
    enableReadings: isPrepComplete,
    enableCourses: isPrepComplete,
    enableVideos: isPrepComplete,
    
    // FUTURE SCOPE FEATURES (DISABLED)
    enableLabs: false,
    enablePlanningHub: false,
    enableCommunity: false,
    enableRoiReport: false,
  };

  const menuItems = [
    // Rep Coach removed from sidebar - access via floating AI Coach button (password protected)
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'conditioning', label: 'Conditioning', icon: Dumbbell, requiresCohort: true },
    { id: 'development-plan', label: 'Dev Plan', icon: Target, flag: 'enableDevPlan' },
    
    { type: 'section', label: 'Resources' },
    { id: 'community', label: 'Community', icon: CommunityIcon, flag: 'enableCommunity', devModeOnly: true },
    { id: 'library', label: 'Content', icon: BookOpen, flag: 'enableReadings' }, // Using enableReadings as proxy for Content
    { id: 'coaching-hub', label: 'Coaching', icon: Megaphone, flag: 'enableLabs', devModeOnly: true },
    
    { type: 'section', label: 'Personal' },
    { id: 'locker', label: 'Your Locker', icon: Lock },
  ];

  // Filter Menu Items
  const filteredMenuItems = menuItems.filter(item => {
    if (item.type === 'section') return true; // Always show sections (we'll clean up empty ones later)

    // 1. ADMIN/DEVELOPER MODE: Show everything, bypass all checks
    if (isAdmin || isDeveloperMode) {
      return true;
    }
    
    // --- USER MODE (isDeveloperMode is FALSE) ---

    // 2. EXCLUDE: Filter out items explicitly marked for Dev Mode
    if (item.devModeOnly) {
      return false; 
    }

    // 3. COHORT CHECK: Filter out items that require a cohort if user doesn't have one
    // Check both developmentPlanData.cohortId and cohortData from useDailyPlan
    const hasCohort = developmentPlanData?.cohortId || cohortData?.id || userProfile?.cohortId;
    if (item.requiresCohort && !hasCohort) {
      return false;
    }

    // 4. FEATURE FLAG CHECK: Filter out items where the flag is off
    if (item.flag && FEATURE_FLAGS[item.flag] !== true) {
      return false;
    }

    // Item passed all User Mode checks
    return true;
  }).filter((item, index, array) => {
    // Clean up empty sections
    if (item.type === 'section') {
      const nextItem = array[index + 1];
      return nextItem && nextItem.type !== 'section';
    }
    return true;
  });

  return (
    <div 
      className={`
        relative z-40 bg-corporate-light-gray text-corporate-navy transition-all duration-300 ease-in-out flex-col hidden md:flex border-slate-200 rounded-2xl overflow-hidden md:my-2 md:ml-2 h-screen md:h-[calc(100vh-16px)]
        ${isOpen ? 'w-64' : 'w-20'}
      `}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Header / Toggle */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-slate-200">
        {isOpen ? (
          <a 
            href="https://leaderreps.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 overflow-hidden whitespace-nowrap hover:opacity-80 transition-opacity cursor-pointer text-corporate-navy no-underline"
            title="Visit LeaderReps.com"
          >
            <img src="/icons/icon-192x192.png" alt="Logo" className="w-10 h-10 rounded-xl bg-white shadow-lg" />
            <div className="flex flex-col">
              <span className="font-semibold text-lg tracking-tight leading-tight text-corporate-navy" style={{ fontFamily: 'var(--font-heading)' }}>LeaderReps</span>
              <span className="text-[11px] text-corporate-teal font-medium uppercase tracking-widest">
                The Arena
              </span>
            </div>
          </a>
        ) : (
          <a 
            href="https://leaderreps.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-10 mx-auto hover:opacity-80 transition-opacity cursor-pointer"
            title="Visit LeaderReps.com"
          >
             <img src="/icons/icon-192x192.png" alt="Logo" className="w-10 h-10 rounded-xl bg-white shadow-lg" />
          </a>
        )}
      </div>

      {/* Sidebar Toggle */}
      <div className="flex justify-center py-3 border-b border-slate-200">
        <button 
          onClick={toggle}
          aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={isOpen}
          className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-slate-200 rounded-xl text-slate-500 hover:text-corporate-navy transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2 focus:ring-offset-white touch-manipulation"
        >
          {isOpen ? <ChevronLeft className="w-5 h-5" aria-hidden="true" /> : <ChevronRight className="w-5 h-5" aria-hidden="true" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-5 px-3 overflow-y-auto overflow-x-hidden" aria-label="Sidebar navigation">
        <ul className="space-y-1" role="list">
          {filteredMenuItems.map((item, index) => {
            if (item.type === 'section') {
               return (
                 <li key={`section-${index}`} className="mt-8 mb-3 px-3">
                   <span className={`text-[10px] font-semibold text-slate-500 uppercase tracking-[0.15em] ${isOpen ? 'block' : 'hidden'}`}>
                     {item.label}
                   </span>
                   {!isOpen && <div className="h-px bg-slate-200 mx-2 my-3"></div>}
                 </li>
               );
            }

            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            const isHighlighted = item.highlight && !isActive;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    navigate(item.id);
                    if (isOpen) toggle();
                  }}
                  aria-label={isOpen ? undefined : item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] transition-all duration-200 relative border-none rounded-xl group
                    focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2 focus:ring-offset-white touch-manipulation
                    ${isActive 
                      ? 'bg-corporate-teal text-white shadow-lg shadow-corporate-teal/30 font-medium' 
                      : isHighlighted
                        ? 'bg-gradient-to-r from-corporate-teal/20 to-corporate-orange/20 text-corporate-navy hover:from-corporate-teal/30 hover:to-corporate-orange/30 border border-corporate-teal/30'
                        : 'bg-corporate-teal/10 text-corporate-navy hover:bg-corporate-teal/20 hover:text-corporate-navy'
                    }
                  `}
                  title={!isOpen ? item.label : ''}
                >
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-white/20' 
                      : isHighlighted 
                        ? 'bg-gradient-to-br from-corporate-teal/30 to-corporate-orange/30'
                        : 'bg-corporate-teal/10 group-hover:bg-corporate-teal/20'
                  }`} aria-hidden="true">
                    <Icon className={`w-[18px] h-[18px] ${
                      isActive 
                        ? 'text-white' 
                        : isHighlighted 
                          ? 'text-corporate-teal'
                          : 'text-corporate-teal group-hover:text-corporate-teal'
                    }`} />
                  </div>
                  <span className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                    {item.label}
                  </span>
                  {isHighlighted && isOpen && (
                    <span className="ml-auto text-[10px] font-bold text-corporate-orange bg-corporate-orange/10 px-2 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                </button>
              </li>
            );
          })}

          {/* Admin Link - Only visible to admins */}
          {isAdmin && (
            <li className="mt-8 pt-4 border-t border-slate-200">
              <button
                onClick={() => navigate('admin-portal')}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 transition-all duration-200 relative border-none rounded-xl group
                  ${currentScreen === 'admin-portal' 
                    ? 'bg-red-500/90 text-white shadow-lg shadow-red-500/20 font-medium' 
                    : 'text-red-500 hover:bg-red-50 hover:text-red-600'
                  }
                `}
                title={!isOpen ? 'Admin Portal' : ''}
              >
                <div className={`p-1.5 rounded-lg transition-colors ${currentScreen === 'admin-portal' ? 'bg-white/10' : 'group-hover:bg-red-100'}`}>
                  <ShieldCheck className="w-[18px] h-[18px]" />
                </div>
                <span className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                  Admin Portal
                </span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        
        {/* PWA Install Button */}
        <div className="w-full mb-1">
           <PWAInstall collapsed={!isOpen} />
        </div>

        {/* Leadership Anchors */}
        {(identityStatement || habitAnchor || whyStatement) && (
            <div className="relative">
                <button
                    onClick={() => setShowAnchors(!showAnchors)}
                    className={`w-full flex items-center gap-3 px-1 py-2 text-slate-500 hover:text-corporate-navy transition-all duration-200 rounded-lg hover:bg-slate-200 ${!isOpen ? 'justify-center' : ''}`}
                    title={!isOpen ? "Leadership Anchors" : ''}
                >
                    <div className="p-1.5 rounded-lg">
                      <Anchor className="w-[18px] h-[18px]" />
                    </div>
                    <span className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                        Anchors
                    </span>
                </button>
                
                {/* Anchors Popup */}
                {showAnchors && (
                    <>
                        <div className="fixed inset-0 z-50" onClick={() => setShowAnchors(false)} />
                        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-2xl shadow-2xl p-5 text-slate-800 z-50 border border-slate-100" style={{ fontFamily: 'var(--font-body)' }}>
                             <h3 className="font-semibold mb-4 text-corporate-navy border-b border-slate-100 pb-3" style={{ fontFamily: 'var(--font-heading)' }}>Your Leadership Anchors</h3>
                             <div className="space-y-4 text-sm">
                                {identityStatement && (
                                    <div>
                                    <p className="font-semibold text-corporate-teal uppercase tracking-wider text-[10px] mb-1">Identity</p>
                                    <p className="text-slate-600 leading-relaxed">{identityStatement}</p>
                                    </div>
                                )}
                                {habitAnchor && (
                                    <div>
                                    <p className="font-semibold text-blue-500 uppercase tracking-wider text-[10px] mb-1">Habit</p>
                                    <p className="text-slate-600 leading-relaxed">{habitAnchor}</p>
                                    </div>
                                )}
                                {whyStatement && (
                                    <div>
                                    <p className="font-semibold text-corporate-orange uppercase tracking-wider text-[10px] mb-1">Why</p>
                                    <p className="text-slate-600 leading-relaxed">{whyStatement}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        )}

        <button
          onClick={() => setShowSignOutConfirm(true)}
          className={`w-full flex items-center gap-3 px-1 py-2 text-slate-500 hover:text-corporate-navy transition-all duration-200 rounded-lg hover:bg-slate-200 ${!isOpen ? 'justify-center' : ''}`}
          title={!isOpen ? "Sign Out" : ''}
        >
          <div className="p-1.5 rounded-lg">
            <LogOut className="w-[18px] h-[18px]" />
          </div>
          <span className={`whitespace-nowrap text-sm transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            Sign Out
          </span>
        </button>
        {isOpen && (
          <div className="mt-4 text-center">
            <span className="text-[10px] text-slate-400 tracking-wider">v{__APP_VERSION__}</span>
          </div>
        )}
      </div>

      {/* Sign Out Confirmation Dialog */}
      {showSignOutConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999]" 
            onClick={() => setShowSignOutConfirm(false)} 
          />
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4">
            <div 
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-100"
              style={{ fontFamily: 'var(--font-body)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-semibold text-lg text-slate-800" style={{ fontFamily: 'var(--font-heading)' }}>
                  Sign Out?
                </h3>
              </div>
              <p className="text-slate-600 text-sm mb-6">
                Are you sure you want to sign out of LeaderReps?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSignOutConfirm(false);
                    onSignOut();
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-corporate-navy hover:bg-corporate-navy/90 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ArenaSidebar;
