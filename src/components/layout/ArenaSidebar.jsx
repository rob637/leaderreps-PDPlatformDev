import React from 'react';
import { 
  LayoutDashboard, 
  Target, 
  BookOpen, 
  Users, 
  MessageSquare, 
  User, 
  Archive,
  LogOut,
  Menu,
  ChevronLeft,
  ShieldCheck
} from 'lucide-react';

const ArenaSidebar = ({ isOpen, toggle, currentScreen, navigate, onSignOut, user, membershipData }) => {
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard 1', icon: LayoutDashboard },
    { id: 'dashboard-main', label: 'Dashboard 2', icon: LayoutDashboard },
    { id: 'arena-dashboard', label: 'Dashboard 3', icon: LayoutDashboard },
    { id: 'development-plan', label: 'Dev Plan', icon: Target },
    { id: 'library', label: 'Content', icon: BookOpen },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'coaching-lab', label: 'Coaching', icon: MessageSquare },
    { id: 'locker', label: 'Your Locker', icon: Archive },
    { id: 'features-lab', label: 'Features Lab', icon: Beaker },
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
        fixed md:relative z-40 h-full bg-corporate-navy text-white transition-all duration-300 ease-in-out flex flex-col
        ${isOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'}
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
                The Arena
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 mx-auto">
             <img src="/icons/icon-192x192.png" alt="Logo" className="w-8 h-8 rounded bg-white" />
          </div>
        )}
        
        {/* Mobile Close Button */}
        <button 
          onClick={toggle}
          className="md:hidden p-1 hover:bg-white/10 rounded"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
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
                    // Close sidebar on mobile when item is selected
                    if (window.innerWidth < 768) {
                      toggle();
                    }
                  }}
                  className={`
                    w-full flex items-center gap-4 px-4 py-3 transition-colors relative bg-transparent border-none
                    ${isActive ? 'bg-corporate-teal text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'}
                  `}
                  title={!isOpen ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 min-w-[1.25rem] ${isActive ? 'text-white' : ''}`} />
                  <span className={`whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                    {item.label}
                  </span>
                  
                  {/* Active Indicator for collapsed state */}
                  {!isOpen && isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-corporate-teal" />
                  )}
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
                  w-full flex items-center gap-4 px-4 py-3 transition-colors relative bg-transparent border-none
                  ${currentScreen === 'admin-portal' ? 'bg-corporate-orange text-white' : 'text-corporate-orange hover:bg-white/5'}
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
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-4 px-0 py-2 text-gray-400 hover:text-white transition-colors"
          title={!isOpen ? "Sign Out" : ''}
        >
          <LogOut className="w-5 h-5 min-w-[1.25rem]" />
          <span className={`whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
};

export default ArenaSidebar;
