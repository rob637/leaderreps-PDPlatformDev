// src/components/admin/SalesMarketingCenter.jsx
// Sales & Marketing Center — full CRM, lead generation, marketing tools

import React, { useState, useEffect } from 'react';
import {
  Megaphone, ArrowLeft, Globe, Users,
  ShieldAlert, ExternalLink, Sparkles
} from 'lucide-react';
import SocialMediaManager from './SocialMediaManager';
import AssessmentLeadsManager from './AssessmentLeadsManager';
import CRMApp from './crm/CRMApp';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';

const TAB_GROUPS = [
  {
    label: 'CRM',
    tabs: [
      { id: 'crm-full', label: 'CRM', icon: Sparkles, fullCRM: true },
    ],
  },
  {
    label: 'Lead Generation',
    tabs: [
      { id: 'assessment-leads', label: 'Lead Magnets', icon: Users },
    ],
  },
  {
    label: 'Social Media',
    tabs: [
      { id: 'social-media', label: 'Social Media Monitor', icon: Globe },
    ],
  },
];

const SalesMarketingCenter = () => {
  const { user, isAdmin, navigate } = useAppServices();
  const { navParams } = useNavigation();
  const [activeTab, setActiveTab] = useState(navParams?.tab || 'crm-full');
  const [showFullCRM, setShowFullCRM] = useState(false);

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
  
  // Show full CRM overlay
  if (showFullCRM) {
    return <CRMApp user={user} onClose={() => setShowFullCRM(false)} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'crm-full':
        return (
          <div className="flex flex-col items-center justify-center h-96 gap-6">
            <div className="p-6 bg-gradient-to-br from-[#002E47] to-[#003d5c] rounded-2xl shadow-xl">
              <Sparkles className="w-16 h-16 text-[#47A88D]" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                CRM
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
                Full-featured CRM with Apollo integration, email automation, 
                LinkedIn outreach, analytics, and more.
              </p>
              <button
                onClick={() => setShowFullCRM(true)}
                className="px-6 py-3 bg-[#47A88D] hover:bg-[#3d9179] text-white font-semibold rounded-xl shadow-lg transition-all flex items-center gap-2 mx-auto"
              >
                <ExternalLink className="w-5 h-5" />
                Launch CRM
              </button>
            </div>
          </div>
        );
      case 'assessment-leads': 
      case 'roi-calculator-leads':
        return <AssessmentLeadsManager />;
      case 'social-media':
        return <SocialMediaManager />;
      default:
        return null;
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
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-corporate-navy dark:text-white">
              Sales & Marketing
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto flex-shrink-0">
          <div className="p-3 space-y-4">
            {TAB_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.label}
                </div>
                <div className="space-y-0.5 mt-1">
                  {group.tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                          ${isActive
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
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

export default SalesMarketingCenter;
