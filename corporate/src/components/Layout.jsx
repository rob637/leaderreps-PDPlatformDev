import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CommandBar from './CommandBar';
import NotificationCenter from './NotificationCenter';
import GlobalSearch from './GlobalSearch';
import {
  LayoutDashboard,
  Users,
  Building2,
  Presentation,
  Calendar,
  Share2,
  FlaskConical,
  LogOut,
  Menu,
  X,
  Mail,
  Target,
  Megaphone,
  Calendar as CalendarIcon,
  BarChart3,
  BrainCircuit,
  Settings,
  ChevronDown,
  ChevronRight,
  FileText,
  ShieldCheck,
  Command,
  DollarSign,
  Folder,
  MessageSquare,
  Zap,
  ExternalLink,
  Shield,
  Search,
  UsersRound
} from 'lucide-react';

const navGroups = [
  {
    title: 'Command',
    items: [
      { path: '/', icon: LayoutDashboard, label: 'Executive Dashboard' },
      { path: '/sales/admin', icon: ShieldCheck, label: 'Sales Admin', badge: 'Manager' },
      { path: '/ops/team', icon: UsersRound, label: 'Team Management', badge: 'New' },
    ]
  },
  {
    title: 'Sales Enablement',
    items: [
      { path: '/sales/prospects', icon: Users, label: 'Prospects', badge: 'SalesNav' },
      { path: '/sales/outreach', icon: Target, label: 'Outreach', badge: 'LinkedIn' },
      { path: '/sales/demos', icon: Presentation, label: 'Demo Center' },
      { path: '/sales/proposals', icon: FileText, label: 'Proposals & ROI' },
      { path: '/sales/documents', icon: Folder, label: 'Document Library', badge: 'New' },
      { path: '/sales/activities', icon: MessageSquare, label: 'Meeting Notes', badge: 'New' },
      { path: '/sales/portal', icon: ExternalLink, label: 'Client Portal', badge: 'New' },
      { path: '/sales/vendors', icon: Building2, label: 'Partners/Vendors' },
    ]
  },
  {
    title: 'Marketing & Brand',
    items: [
      { path: '/marketing/email-health', icon: Mail, label: 'Email Control' },
      { path: '/marketing/amplify', icon: Megaphone, label: 'Content Amplify' },
      { path: '/marketing/templates', icon: Mail, label: 'Email Templates', badge: 'New' },
      { path: '/marketing/competitors', icon: Shield, label: 'Competitive Intel', badge: 'New' },
    ]
  },
  {
    title: 'Operations',
    items: [
      { path: '/ops/scheduler', icon: CalendarIcon, label: 'Scheduler', badge: 'Calendly' },
      { path: '/ops/workflows', icon: Zap, label: 'Automations', badge: 'New' },
    ]
  },
  {
    title: 'Product & Innovation',
    items: [
      { path: '/product/lab', icon: FlaskConical, label: 'Feature Lab' },
      { path: '/coaching/goals', icon: Target, label: 'Goal Frameworks' },
      { path: '/coaching/ai', icon: BrainCircuit, label: 'AI Coach Logic' },
    ]
  },
  {
    title: 'Intelligence',
    items: [
      { path: '/analytics/leaders', icon: BarChart3, label: 'Leader Analytics' },
      { path: '/analytics/revenue', icon: DollarSign, label: 'Revenue & Forecast', badge: 'New' },
    ]
  }
];

const Layout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  
  // State for collapsible groups - default all open
  const [openGroups, setOpenGroups] = useState({});

  const toggleGroup = (title) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // Initialize all groups to open on mount
  useEffect(() => {
    const initial = {};
    navGroups.forEach(g => initial[g.title] = true);
    setOpenGroups(initial);
  }, []);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-corporate-navy text-white transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-lg">LeaderReps</h1>
              <p className="text-xs text-white/60">Corporate Command</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
          {navGroups.map((group, groupIdx) => (
            <div key={groupIdx}>
              {sidebarOpen ? (
                 <div 
                    className="flex items-center justify-between px-2 mb-2 text-xs font-bold text-white/40 uppercase tracking-wider cursor-pointer hover:text-white/60"
                    onClick={() => toggleGroup(group.title)}
                 >
                    <span>{group.title}</span>
                    {openGroups[group.title] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                 </div>
              ) : (
                <div className="h-px bg-white/10 mx-2 my-2"></div>
              )}
              
              {/* Items */}
              {(!sidebarOpen || openGroups[group.title]) && (
                  <div className="space-y-1">
                    {group.items.map((item) => (
                        <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === '/'}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                            isActive
                                ? 'bg-corporate-teal text-white shadow-lg shadow-teal-900/20'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`
                        }
                        title={!sidebarOpen ? item.label : ''}
                        >
                        <item.icon size={20} className="min-w-[20px]" />
                        {sidebarOpen && (
                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                            <span className="truncate">{item.label}</span>
                            {item.badge && (
                                <span className="ml-auto text-[9px] bg-corporate-gold/20 text-corporate-gold px-1.5 py-0.5 rounded leading-none">
                                {item.badge}
                                </span>
                            )}
                            </div>
                        )}
                        </NavLink>
                    ))}
                  </div>
              )}
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          {/* Keyboard Shortcut Hint */}
          <button
            onClick={() => setSearchOpen(true)}
            className="w-full mb-3 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white/60 flex items-center justify-between transition"
            title="Global Search"
          >
            <span className="flex items-center gap-2">
              <Search size={12} />
              {sidebarOpen ? 'Search Everything' : ''}
            </span>
            {sidebarOpen && (
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px]">⌘K</kbd>
            )}
          </button>
          
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationCenter />
            
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-8 h-8 rounded-full"
              />
            )}

            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.displayName}</p>
                <p className="text-xs text-white/60 truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-white/10 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      
      {/* Global Command Bar */}
      <CommandBar />
      
      {/* Global Search Modal */}
      <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

export default Layout;
