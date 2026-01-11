import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Database, 
  FlaskConical, 
  Users, 
  ShieldAlert,
  FileText,
  Loader,
  Settings,
  Calendar,
  BookOpen,
  TestTube2,
  ArrowLeftRight,
  BrainCircuit,
  List,
  Dumbbell,
  Bell
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import SystemDiagnostics from './SystemDiagnostics';
import FeatureManager from './FeatureManager';
import ContentAdminHome from './ContentAdminHome'; // Existing component
import MediaLibrary from './MediaLibrary'; // New component
// import MigrationTool from './MigrationTool'; // New component
import SystemWidgets from './SystemWidgets';
import DocumentationCenter from './DocumentationCenter';
import TestCenter from './TestCenter';
import CommunityManager from './CommunityManager';
import CoachingManager from './CoachingManager';
import LOVManager from './LOVManager';
import DailyRepsLibrary from './DailyRepsLibrary';
import DailyPlanManager from './DailyPlanManager';
import CohortManager from './CohortManager';
import UserManagement from './UserManagement';
import LeaderProfileReports from './LeaderProfileReports';
import NotificationManager from './NotificationManager';
import { BreadcrumbNav } from '../ui/BreadcrumbNav';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';
import { doc, getDoc } from 'firebase/firestore';

// Define version locally if not available globally
// eslint-disable-next-line no-undef
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

const AdminPortal = () => {
  const { user, db } = useAppServices();
  const { navParams } = useNavigation();
  const [activeTab, setActiveTab] = useState(navParams?.tab || 'dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navParams?.tab) {
      setActiveTab(navParams.tab);
    }
  }, [navParams]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Default fallback admins
      const DEFAULT_ADMINS = ['rob@sagecg.com', 'ryan@leaderreps.com', 'admin@leaderreps.com'];
      
      try {
        // Try to fetch from Firestore config
        const configRef = doc(db, 'metadata', 'config');
        const configSnap = await getDoc(configRef);
        
        let allowedEmails = DEFAULT_ADMINS;
        
        if (configSnap.exists() && configSnap.data().adminemails) {
          allowedEmails = configSnap.data().adminemails;
        }
        
        // Check if user is in the allowed list (case-insensitive)
        const userEmail = user.email.toLowerCase();
        const isAllowed = allowedEmails.some(email => email.toLowerCase() === userEmail);
        
        setIsAdmin(isAllowed);
      } catch (error) {
        console.error("Error checking admin status:", error);
        // Fallback to default list on error
        setIsAdmin(DEFAULT_ADMINS.includes(user.email));
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, db]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">Access Denied</h1>
        <p className="text-gray-600">You do not have permission to view this area.</p>
      </div>
    );
  }

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'users', label: 'User Management', icon: Users },
        // { id: 'cohorts', label: 'Cohorts', icon: Users },
        { id: 'daily-plan', label: 'Daily Plan (New)', icon: Calendar },
        { id: 'content', label: 'Content Library', icon: FileText },
        { id: 'media', label: 'Media Vault', icon: Database },
        { id: 'notifications', label: 'Notifications', icon: Bell }
      ]
    },
    {
      title: 'Advanced Management',
      items: [
        { id: 'daily-reps', label: 'Daily Reps', icon: Dumbbell },
        { id: 'community', label: 'Community', icon: Users },
        { id: 'coaching', label: 'Coaching', icon: BrainCircuit },
        { id: 'lov', label: 'System Values', icon: List }
      ]
    },
    {
      title: 'Reports',
      items: [
        { id: 'leader-profiles', label: 'Leader Profiles', icon: FileText }
      ]
    },
    {
      title: 'Engineering',
      items: [
        { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
        { id: 'features', label: 'Widget Lab', icon: FlaskConical },
        { id: 'system', label: 'System', icon: Settings },
        // { id: 'migration', label: 'Migration', icon: ArrowLeftRight },
        { id: 'tests', label: 'Test Center', icon: TestTube2 }
      ]
    },
    {
      title: 'Resources',
      items: [
        { id: 'docs', label: 'Docs', icon: BookOpen }
      ]
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <UserManagement />;
      case 'cohorts':
        return <CohortManager />;
      case 'tests':
        return <TestCenter />;
      case 'daily-plan':
        return <DailyPlanManager />;
      // 'library' tab removed - Programs/Workouts/Skills now managed as LOVs
      case 'media':
        return <MediaLibrary />;
      case 'notifications':
        return <NotificationManager />;
      case 'diagnostics':
        return <SystemDiagnostics />;
      case 'content':
        return <ContentAdminHome />;
      case 'community':
        return <CommunityManager />;
      case 'coaching':
        return <CoachingManager />;
      case 'lov':
        return <LOVManager />;
      case 'daily-reps':
        return <DailyRepsLibrary />;
      case 'features':
        return <FeatureManager />;
      case 'docs':
        return <DocumentationCenter />;
      case 'system':
        return <SystemWidgets />;
      // case 'migration':
      //   return <MigrationTool />;
      case 'leader-profiles':
        return <LeaderProfileReports />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Admin Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-corporate-teal/10 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-corporate-teal" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-corporate-navy">
                Admin Command Center
              </h1>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{user.email}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="font-medium text-corporate-teal">v{APP_VERSION}</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Production</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-6">
            {navGroups.map((group, idx) => (
              <div key={idx}>
                <h3 className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {group.title}
                </h3>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          // Scroll content area to top when switching tabs
                          document.getElementById('admin-content-area')?.scrollTo(0, 0);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${isActive 
                            ? 'bg-corporate-teal/10 text-corporate-teal' 
                            : 'text-slate-600 hover:bg-slate-50 hover:text-corporate-navy'}
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-corporate-teal' : 'text-slate-400'}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6" id="admin-content-area">
          <div className="max-w-6xl mx-auto">
            <BreadcrumbNav 
              items={[
                { label: 'Admin Command Center', path: 'dashboard' },
                { label: navGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || 'Dashboard', path: null }
              ]} 
              navigate={(path) => setActiveTab(path)} 
            />
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[600px] p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
