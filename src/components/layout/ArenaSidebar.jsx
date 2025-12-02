import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Target, 
  BookOpen, 
  Users, 
  MessageSquare, 
  User, 
  Archive,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Beaker,
  Anchor
} from 'lucide-react';
import PWAInstall from '../ui/PWAInstall.jsx';
import { useAppServices } from '../../services/useAppServices.jsx';

const ArenaSidebar = ({ isOpen, toggle, currentScreen, navigate, onSignOut, user, membershipData }) => {
  const { identityStatement, habitAnchor, whyStatement } = useAppServices();
  const [showAnchors, setShowAnchors] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'development-plan', label: 'Dev Plan', icon: Target },
    { id: 'library', label: 'Content', icon: BookOpen },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'coaching-lab', label: 'Coaching', icon: MessageSquare },
    { id: 'locker', label: 'Your Locker', icon: Archive },
  ];

  // Determine display name (First Name Only)
  const getFirstName = () => {
    if (membershipData?.firstName) return membershipData.firstName;
    if (user?.displayName) return user.displayName.split(' ')[0];
    return 'Leader';
  };
  
  const firstName = getFirstName();

  // Admin Check
  const ADMIN_EMAILS = ['rob@sagecg.com', 'ryan@leaderreps.com', 'admin@leaderreps.com'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  return (
    <div 
      className={`
        relative z-40 h-full bg-corporate-navy text-white transition-all duration-300 ease-in-out flex-col hidden md:flex
        ${isOpen ? 'w-64' : 'w-16'}
      `}
    >
      {/* Header / Toggle */}
      <div className="h-20 flex items-center justify-between px-4 border-b border-white/10">
        {isOpen ? (
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <img src="/icons/icon-192x192.png" alt="Logo" className="w-10 h-10 rounded bg-white" />
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-wide leading-tight">LeaderReps</span>
              <span className="text-xs text-corporate-teal font-medium uppercase tracking-wider truncate max-w-[140px]">
                Dashboard
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 mx-auto">
             <img src="/icons/icon-192x192.png" alt="Logo" className="w-8 h-8 rounded bg-white" />
          </div>
        )}
      </div>

      {/* Sidebar Toggle */}
      <div className="flex justify-center py-2 border-b border-white/10">
        <button 
          onClick={toggle}
          className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
        >
          {isOpen ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            if (item.type === 'section') {
               return (
                 <li key={`section-${index}`} className="mt-6 mb-2 px-4">
                   <span className={`text-xs font-bold text-slate-500 uppercase tracking-wider ${isOpen ? 'block' : 'hidden'}`}>
                     {item.label}
                   </span>
                   {!isOpen && <div className="h-px bg-white/10 mx-1 my-2"></div>}
                 </li>
               );
            }

            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    navigate(item.id);
                    if (isOpen) toggle();
                  }}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3 transition-all duration-200 relative border-none rounded-2xl
                    ${isActive 
                      ? 'bg-corporate-teal text-white shadow-md font-bold' 
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }
                  `}
                  title={!isOpen ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 min-w-[1.25rem] ${isActive ? 'text-white' : ''}`} />
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}

          {/* Admin Link - Only visible to admins */}
          {isAdmin && (
            <li className="mt-8 pt-4 border-t border-white/10">
              <button
                onClick={() => navigate('admin-portal')}
                className={`
                  w-full flex items-center gap-4 px-4 py-3 transition-all duration-200 relative border-none rounded-2xl
                  ${currentScreen === 'admin-portal' 
                    ? 'bg-red-600 text-white shadow-md font-bold' 
                    : 'text-red-400 hover:bg-white/5 hover:text-red-300'
                  }
                `}
                title={!isOpen ? 'Admin Portal' : ''}
              >
                <ShieldCheck className="w-5 h-5 min-w-[1.25rem]" />
                <span className={`whitespace-nowrap font-bold transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                  Admin Portal
                </span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Footer / Sign Out */}
      <div className="p-4 border-t border-white/10 space-y-2">
        
        {/* PWA Install Button */}
        <div className="w-full mb-2">
           <PWAInstall collapsed={!isOpen} />
        </div>

        {/* Leadership Anchors */}
        {(identityStatement || habitAnchor || whyStatement) && (
            <div className="relative">
                <button
                    onClick={() => setShowAnchors(!showAnchors)}
                    className={`w-full flex items-center gap-4 px-0 py-2 text-gray-400 hover:text-white transition-colors ${!isOpen ? 'justify-center' : ''}`}
                    title={!isOpen ? "Leadership Anchors" : ''}
                >
                    <Anchor className="w-5 h-5 min-w-[1.25rem]" />
                    <span className={`whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                        Anchors
                    </span>
                </button>
                
                {/* Anchors Popup */}
                {showAnchors && (
                    <>
                        <div className="fixed inset-0 z-50" onClick={() => setShowAnchors(false)} />
                        <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg shadow-xl p-4 text-slate-800 z-50 border border-slate-200">
                             <h3 className="font-bold mb-3 text-corporate-navy border-b pb-2">Your Leadership Anchors</h3>
                             <div className="space-y-3 text-xs">
                                {identityStatement && (
                                    <div>
                                    <p className="font-bold text-corporate-teal uppercase tracking-wider text-[10px]">Identity</p>
                                    <p className="text-gray-700 mt-1">{identityStatement}</p>
                                    </div>
                                )}
                                {habitAnchor && (
                                    <div>
                                    <p className="font-bold text-blue-600 uppercase tracking-wider text-[10px]">Habit</p>
                                    <p className="text-gray-700 mt-1">{habitAnchor}</p>
                                    </div>
                                )}
                                {whyStatement && (
                                    <div>
                                    <p className="font-bold text-orange-600 uppercase tracking-wider text-[10px]">Why</p>
                                    <p className="text-gray-700 mt-1">{whyStatement}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        )}

        <button
          onClick={onSignOut}
          className={`w-full flex items-center gap-4 px-0 py-2 text-gray-400 hover:text-white transition-colors ${!isOpen ? 'justify-center' : ''}`}
          title={!isOpen ? "Sign Out" : ''}
        >
          <LogOut className="w-5 h-5 min-w-[1.25rem]" />
          <span className={`whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            Sign Out
          </span>
        </button>
        {isOpen && (
          <div className="mt-4 text-center">
            <span className="text-[10px] text-gray-500 font-mono">v{__APP_VERSION__}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArenaSidebar;
