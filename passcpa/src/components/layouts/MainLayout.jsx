import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  HelpCircle, 
  BarChart3, 
  Bot, 
  Settings,
  Menu,
  X,
  Flame
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStudy } from '../../hooks/useStudy';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/lessons', icon: BookOpen, label: 'Lessons' },
  { to: '/practice', icon: HelpCircle, label: 'Practice' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/tutor', icon: Bot, label: 'AI Tutor' },
];

const MainLayout = () => {
  const { userProfile, signOut } = useAuth();
  const { currentStreak, dailyProgress, dailyGoalMet } = useStudy();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CPA</span>
              </div>
              <span className="font-semibold text-slate-900 hidden sm:block">CPA Review</span>
            </div>

            {/* Daily Progress & Streak (Desktop) */}
            <div className="hidden md:flex items-center gap-6">
              {/* Daily Progress */}
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={clsx(
                      "h-full transition-all duration-500",
                      dailyGoalMet ? "bg-accent-500" : "bg-primary-500"
                    )}
                    style={{ width: `${dailyProgress}%` }}
                  />
                </div>
                <span className="text-sm text-slate-600">{dailyProgress}%</span>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1 text-amber-600">
                <Flame className="w-5 h-5" />
                <span className="font-semibold">{currentStreak}</span>
              </div>

              {/* User Menu */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">
                    {userProfile?.displayName?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <NavLink to="/settings" className="p-2 hover:bg-slate-100 rounded-lg">
                  <Settings className="w-5 h-5 text-slate-500" />
                </NavLink>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-600" />
              ) : (
                <Menu className="w-6 h-6 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <nav className="px-4 py-2 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
                    isActive 
                      ? "bg-primary-50 text-primary-700" 
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
              <hr className="my-2" />
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                <Settings className="w-5 h-5" />
                Settings
              </NavLink>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content with Bottom Navigation (Mobile) or Sidebar (Desktop) */}
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-slate-200 p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary-50 text-primary-700" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Streak Card */}
          <div className="mt-auto pt-4">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-6 h-6 text-amber-600" />
                <span className="text-2xl font-bold text-amber-700">{currentStreak}</span>
              </div>
              <p className="text-sm text-amber-700">
                {currentStreak === 0 
                  ? "Start your streak today!" 
                  : `${currentStreak} day streak! Keep it up!`
                }
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => clsx(
                "flex flex-col items-center justify-center w-full h-full text-xs",
                isActive ? "text-primary-600" : "text-slate-500"
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
