import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme, useAuth, useProgress } from '../App';
import { getThemeClasses } from '../theme';

// Admin emails (fallback - also check profile.isAdmin)
const ADMIN_EMAILS = ['rob@sagecg.com', 'rob@leaderreps.com'];

export default function BottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { progress } = useProgress();
  
  const theme = getThemeClasses(isDark);
  // Check both email list AND profile.isAdmin flag
  const isAdmin = (user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) || progress?.profile?.isAdmin === true;

  const isActive = (path) => location.pathname === path;
  
  const NavItem = ({ path, icon, label, adminOnly = false, isAdminButton = false }) => {
    if (adminOnly && !isAdmin) return null;
    
    const active = isActive(path);
    // Admin button is always red, others use teal when active
    const colorClass = isAdminButton 
      ? 'text-red-500' 
      : active ? 'text-teal-600 dark:text-teal-400' : theme.textSecondary;
    
    return (
      <button
        type="button"
        onClick={() => navigate(path)}
        className={`flex flex-col items-center gap-1 ${colorClass}`}
      >
        {icon}
        <span className={`text-xs ${active ? 'font-medium' : ''}`}>{label}</span>
      </button>
    );
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 safe-area-bottom ${theme.bg} border-t ${theme.border}`}>
      <div className="md:max-w-[430px] md:mx-auto">
        <nav className="flex items-center justify-around py-3">
          <NavItem 
            path="/" 
            label="Home"
            icon={
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            }
          />
          
          <NavItem 
            path="/community" 
            label="Community"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          
          <NavItem 
            path="/progress" 
            label="Progress"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />

          <NavItem 
            path="/admin" 
            label="Admin"
            adminOnly={true}
            isAdminButton={true}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          
          <NavItem 
            path="/profile" 
            label="Profile"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
        </nav>
      </div>
    </div>
  );
}
