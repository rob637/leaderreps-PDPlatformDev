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
  Calendar
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import SystemDiagnostics from './SystemDiagnostics';
import FeatureManager from './FeatureManager';
import ContentAdminHome from './ContentAdminHome'; // Existing component
import SystemWidgets from './SystemWidgets';
import DevPlanManager from './DevPlanManager';
import { useAppServices } from '../../services/useAppServices';
import { doc, getDoc } from 'firebase/firestore';

// Define version locally if not available globally
// eslint-disable-next-line no-undef
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

import MigrationTool from './MigrationTool';

const AdminPortal = () => {
  const { user, db } = useAppServices();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'devplan', label: 'Dev Plan', icon: Calendar },
    { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
    { id: 'content', label: 'Content Mgmt', icon: Database },
    { id: 'migration', label: 'Migration', icon: Database },
    { id: 'features', label: 'Widget Lab', icon: FlaskConical },
    { id: 'system', label: 'System', icon: Settings },
    // { id: 'users', label: 'User Mgmt', icon: Users }, // Future
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'devplan':
        return <DevPlanManager />;
      case 'diagnostics':
        return <SystemDiagnostics />;
      case 'content':
        return <ContentAdminHome />;
      case 'migration':
        return <MigrationTool />;
      case 'features':
        return <FeatureManager />;
      case 'system':
        return <SystemWidgets />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Admin Header - Clean light style matching app */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-corporate-teal/10 rounded-xl">
              <ShieldAlert className="w-8 h-8 text-corporate-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-corporate-navy">
                Admin Command Center
              </h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Logged in as: <span className="font-medium text-corporate-navy">{user.email}</span>
              </p>
            </div>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Environment</span>
            <div className="font-bold text-corporate-navy">Production (v{APP_VERSION})</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-2 border-b-2 transition-colors font-medium text-sm
                    ${isActive 
                      ? 'border-corporate-teal text-corporate-navy' 
                      : 'border-transparent text-gray-500 hover:text-corporate-navy hover:border-gray-300'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-corporate-teal' : ''}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full relative">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
