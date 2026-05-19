/**
 * CRMApp - Full CRM Integration
 * 
 * This wrapper adapts the standalone team-sales CRM to work within
 * the main LeaderReps admin section. It provides:
 * - Tab-based navigation (replacing react-router)
 * - Auth context bridge (uses main app's user)
 * - All CRM pages/components intact
 */

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  Users, Sparkles, Mail, Activity, BarChart3,
  CheckSquare, Settings, Menu, ChevronRight, X,
  Workflow as WorkflowIcon, FileBarChart, Database
} from 'lucide-react';

// CRM Stores
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import { useUIStore } from './stores/uiStore';
import { usePersonaStore } from './stores/personaStore';
import { useProspectsStore } from './stores/prospectsStore';
import { useAccountsStore } from './stores/accountsStore';
import { useDealsStore } from './stores/dealsStore';
import { useTasksStore } from './stores/tasksStore';
import { useNotificationsStore } from './stores/notificationsStore';

// CRM Pages
import ProspectsPage from './pages/ProspectsPage';
import ApolloSearchPage from './pages/ApolloSearchPage';
import OutreachPage from './pages/OutreachPage';
import ActivitiesPage from './pages/ActivitiesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';
import WorkflowsPage from './pages/WorkflowsPage';
import ReportsPage from './pages/ReportsPage';
import DataHubPage from './pages/DataHubPage';

// CRM Components
import CommandPalette from './components/CommandPalette';
import PersonaSwitcher from './components/PersonaSwitcher';
import LinkedHelperPushModal from './components/linkedhelper/LinkedHelperPushModal';
import NotificationBell from './components/NotificationBell';
import { ConfirmProvider } from './components/ConfirmDialog';

// Navigation context for CRM internal navigation
const CRMNavigationContext = createContext(null);

export const useCRMNavigation = () => {
  const ctx = useContext(CRMNavigationContext);
  if (!ctx) throw new Error('useCRMNavigation must be used within CRMApp');
  return ctx;
};

// Navigation items
const NAV_ITEMS = [
  { key: 'prospects', icon: Users, label: 'Prospects' },
  { key: 'apollo', icon: Sparkles, label: 'Apollo Search' },
  { key: 'outreach', icon: Mail, label: 'Outreach' },
  { key: 'activities', icon: Activity, label: 'Activities' },
  { key: 'analytics', icon: BarChart3, label: 'Analytics' },
  { key: 'reports', icon: FileBarChart, label: 'Reports' },
  { key: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { key: 'workflows', icon: WorkflowIcon, label: 'Workflows' },
  { key: 'datahub', icon: Database, label: 'Data Hub' },
  { key: 'settings', icon: Settings, label: 'Settings' },
];

// Page renderer
const CRMPage = ({ activeTab }) => {
  switch (activeTab) {
    case 'prospects': return <ProspectsPage />;
    case 'apollo': return <ApolloSearchPage />;
    case 'outreach': return <OutreachPage />;
    case 'activities': return <ActivitiesPage />;
    case 'analytics': return <AnalyticsPage />;
    case 'reports': return <ReportsPage />;
    case 'tasks': return <TasksPage />;
    case 'workflows': return <WorkflowsPage />;
    case 'datahub': return <DataHubPage />;
    case 'settings': return <SettingsPage />;
    default: return <ProspectsPage />;
  }
};

export default function CRMApp({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('prospects');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  // Auto-collapse on small screens
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  // Initialize CRM auth store with main app's user
  const setUser = useAuthStore(state => state.setUser);
  const initTheme = useThemeStore(state => state.initTheme);
  const { openCommandPalette, commandPaletteOpen } = useUIStore();
  const { getActivePersona, isActingAs, clearPersona } = usePersonaStore();
  const { subscribeToProspects, setCurrentUser } = useProspectsStore();
  const subscribeToAccounts = useAccountsStore((s) => s.subscribeToAccounts);
  const subscribeToDeals = useDealsStore((s) => s.subscribeToDeals);
  const subscribeToTasks = useTasksStore((s) => s.subscribeToTasks);
  const subscribeToNotifications = useNotificationsStore((s) => s.subscribeToNotifications);
  const openTaskCount = useTasksStore((s) => s.tasks.filter((t) => !t.completed).length);
  
  // Clear persona on mount so user starts as themselves
  useEffect(() => {
    clearPersona();
  }, [clearPersona]);
  
  // Set user from main app context
  useEffect(() => {
    if (user) {
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        photoURL: user.photoURL
      });
      setCurrentUser(user.email);
    }
    initTheme();
  }, [user, setUser, setCurrentUser, initTheme]);
  
  // Subscribe to prospects data
  useEffect(() => {
    const unsubscribe = subscribeToProspects();
    return () => unsubscribe();
  }, [subscribeToProspects]);

  // Subscribe to accounts + deals (powers reports, palette, rollups)
  useEffect(() => {
    const unsubA = subscribeToAccounts();
    const unsubD = subscribeToDeals();
    return () => {
      unsubA && unsubA();
      unsubD && unsubD();
    };
  }, [subscribeToAccounts, subscribeToDeals]);

  // Subscribe to tasks + notifications for current user (for sidebar badges)
  useEffect(() => {
    if (!user?.email) return undefined;
    const unsubT = subscribeToTasks(user.email);
    const unsubN = subscribeToNotifications(user.email);
    return () => {
      unsubT && unsubT();
      unsubN && unsubN();
    };
  }, [user?.email, subscribeToTasks, subscribeToNotifications]);
  
  // Keyboard shortcut for command palette
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
  
  const persona = getActivePersona(user?.email);
  const actingAsOther = isActingAs(user?.email);
  const currentPage = NAV_ITEMS.find(item => item.key === activeTab);
  
  // Navigation context value
  const navContextValue = {
    activeTab,
    setActiveTab: (tab) => {
      setActiveTab(tab);
      if (isMobile) setMobileSidebarOpen(false);
    },
    navigate: (path) => {
      // Convert path like '/prospects' to tab key 'prospects'
      const key = path.replace(/^\//, '').split('/')[0] || 'prospects';
      setActiveTab(key);
      if (isMobile) setMobileSidebarOpen(false);
    }
  };

  const badgeFor = (key) => {
    if (key === 'tasks' && openTaskCount > 0) return openTaskCount;
    return null;
  };

  return (
    <CRMNavigationContext.Provider value={navContextValue}>
      <ConfirmProvider>
      <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-900 flex">
        {/* Mobile backdrop */}
        {isMobile && mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`${
            isMobile
              ? `fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-200 ${
                  mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`
              : `${sidebarCollapsed ? 'w-16' : 'w-56'} transition-all duration-200`
          } bg-[#002E47] text-white flex flex-col h-full`}
        >
          {/* Logo */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-white/10">
            {(!sidebarCollapsed || isMobile) && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-[#47A88D] rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-semibold text-sm">CRM</span>
              </div>
            )}
            <button
              onClick={() =>
                isMobile
                  ? setMobileSidebarOpen(false)
                  : setSidebarCollapsed(!sidebarCollapsed)
              }
              className="p-1.5 hover:bg-white/10 rounded-lg transition"
              aria-label={isMobile ? 'Close menu' : 'Toggle sidebar'}
            >
              {isMobile ? (
                <X className="w-4 h-4" />
              ) : sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              const badge = badgeFor(item.key);
              const showLabel = !sidebarCollapsed || isMobile;

              return (
                <button
                  key={item.key}
                  onClick={() => navContextValue.setActiveTab(item.key)}
                  title={!showLabel ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition text-sm relative ${
                    isActive
                      ? 'bg-[#47A88D] text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {showLabel && <span className="flex-1 text-left">{item.label}</span>}
                  {badge != null && (
                    showLabel ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-corporate-orange text-white rounded-full font-semibold">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    ) : (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-corporate-orange rounded-full" />
                    )
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-3 border-t border-white/10">
            {(!sidebarCollapsed || isMobile) && (
              <div className="px-2 py-1.5 mb-2">
                <p className="text-xs text-white/60 truncate">{user?.email}</p>
                {actingAsOther && (
                  <p className="text-xs text-amber-400 mt-1">Acting as: {persona?.name}</p>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <header className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
            <div className="flex items-center gap-3">
              {isMobile && (
                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              )}
              <h1 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentPage?.label || 'Prospects'}
              </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              {/* Notifications */}
              <NotificationBell />

              {/* Persona Switcher (hide on mobile to save space) */}
              <div className="hidden sm:block">
                <PersonaSwitcher />
              </div>

              {/* Command Palette Trigger */}
              <button
                onClick={openCommandPalette}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 transition"
                title="Search (⌘K)"
              >
                <span className="text-xs">⌘K</span>
              </button>

              {/* Close CRM */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                  title="Close CRM"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <CRMPage activeTab={activeTab} />
          </main>
        </div>

        {/* Command Palette */}
        {commandPaletteOpen && <CommandPalette />}
        
        {/* LinkedHelper Push Modal */}
        <LinkedHelperPushModal />
        
        {/* Toast notifications */}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '8px',
            },
            success: {
              iconTheme: {
                primary: '#47A88D',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
      </ConfirmProvider>
    </CRMNavigationContext.Provider>
  );
}
