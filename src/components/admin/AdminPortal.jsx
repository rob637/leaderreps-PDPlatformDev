import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Database, 
  FlaskConical, 
  Users, 
  ShieldAlert,
  FileText
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import SystemDiagnostics from './SystemDiagnostics';
import FeatureManager from './FeatureManager';
import ContentAdminHome from './ContentAdminHome'; // Existing component
import { useAppServices } from '../../services/useAppServices';

// Define version locally if not available globally
// eslint-disable-next-line no-undef
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

const AdminPortal = () => {
  const { user } = useAppServices();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Security Check (Double check in UI, though Sidebar hides it too)
  const ADMIN_EMAILS = ['rob@sagecg.com', 'ryan@leaderreps.com', 'admin@leaderreps.com'];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

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
    { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
    { id: 'content', label: 'Content Mgmt', icon: Database },
    { id: 'features', label: 'Feature Lab', icon: FlaskConical },
    // { id: 'users', label: 'User Mgmt', icon: Users }, // Future
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'diagnostics':
        return <SystemDiagnostics />;
      case 'content':
        return <ContentAdminHome />;
      case 'features':
        return <FeatureManager />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-full bg-gray-50 flex flex-col">
      {/* Admin Header */}
      <div className="bg-corporate-navy text-white px-8 py-6 shadow-md">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold font-serif flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-corporate-orange" />
              Admin Command Center
            </h1>
            <p className="text-corporate-teal text-sm mt-1 font-mono">
              Logged in as: {user.email}
            </p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Environment</span>
            <div className="font-bold text-white">Production (v{APP_VERSION})</div>
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
      <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 min-h-[600px] p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
