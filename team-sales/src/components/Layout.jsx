import React, { useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useUIStore } from '../stores/uiStore';
import CommandPalette from './CommandPalette';
import {
  Users,
  LogOut,
  Menu,
  Search,
  ChevronRight,
  Command,
  Sparkles,
  Settings,
  Bell,
  Mail,
  Activity,
  BarChart3
} from 'lucide-react';

const navItems = [
  { path: '/prospects', icon: Users, label: 'Prospects', exact: true },
  { path: '/apollo', icon: Sparkles, label: 'Apollo Search' },
  { path: '/outreach', icon: Mail, label: 'Outreach' },
  { path: '/activities', icon: Activity, label: 'Activities' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/tasks', icon: Bell, label: 'Tasks' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const Layout = () => {
  const { user, signOut } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, openCommandPalette } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Global keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCommandPalette]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  // Get current page title
  const currentPage = navItems.find(item => 
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-16' : 'w-56'
        } bg-brand-navy text-white transition-all duration-200 flex flex-col fixed h-full z-20`}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-brand-teal rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm">Sales Hub</span>
            </div>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 hover:bg-white/10 rounded-lg transition"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm ${
                  isActive
                    ? 'bg-brand-teal text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User & Sign Out */}
        <div className="p-3 border-t border-white/10">
          {!sidebarCollapsed && (
            <div className="px-2 py-1.5 mb-2">
              <p className="text-xs text-white/60 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition text-sm"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarCollapsed ? 'ml-16' : 'ml-56'} transition-all duration-200`}>
        {/* Top Bar */}
        <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {currentPage?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Command Palette Trigger */}
            <button
              onClick={openCommandPalette}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 transition"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-600 rounded text-xs text-slate-500 dark:text-slate-300 border dark:border-slate-500">
                <Command className="w-3 h-3" />K
              </kbd>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
};

export default Layout;
