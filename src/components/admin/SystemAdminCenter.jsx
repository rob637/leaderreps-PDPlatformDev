// src/components/admin/SystemAdminCenter.jsx
// System Administration Center — diagnostics, tests, widgets, docs

import React, { useState, useEffect } from 'react';
import {
  Wrench, ArrowLeft, LayoutDashboard, Activity, FlaskConical, Settings,
  TestTube2, Eye, BookOpen, ShieldAlert,
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import SystemDiagnostics from './SystemDiagnostics';
import FeatureManager from './FeatureManager';
import SystemWidgets from './SystemWidgets';
import TestCenter from './TestCenter';
import UxAuditPanel from './UxAuditPanel';
import DocumentationCenter from './DocumentationCenter';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'diagnostics', label: 'Diagnostics', icon: Activity },
  { id: 'features', label: 'Widget Lab', icon: FlaskConical },
  { id: 'system', label: 'System', icon: Settings },
  { id: 'tests', label: 'Test Center', icon: TestTube2 },
  { id: 'ux-audit', label: 'UX Audit Lab', icon: Eye },
  { id: 'docs', label: 'Documentation', icon: BookOpen },
];

const SystemAdminCenter = () => {
  const { user, isAdmin, navigate } = useAppServices();
  const { navParams } = useNavigation();
  const [activeTab, setActiveTab] = useState(navParams?.tab || 'dashboard');

  useEffect(() => {
    if (navParams?.tab) setActiveTab(navParams.tab);
  }, [navParams]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">Access Denied</h1>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'diagnostics': return <SystemDiagnostics />;
      case 'features': return <FeatureManager />;
      case 'system': return <SystemWidgets />;
      case 'tests': return <TestCenter />;
      case 'ux-audit': return <UxAuditPanel />;
      case 'docs': return <DocumentationCenter />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('admin-hub')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Back to Admin Hub"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="p-2 bg-corporate-navy/10 rounded-lg">
            <Wrench className="w-5 h-5 text-corporate-navy" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-corporate-navy dark:text-white">
              System Administration
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto flex-shrink-0">
          <div className="p-3 space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-corporate-navy/10 text-corporate-navy dark:text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-corporate-navy dark:text-white' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SystemAdminCenter;
