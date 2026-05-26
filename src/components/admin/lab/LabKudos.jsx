// src/components/admin/lab/LabKudos.jsx
// Lab housing for the Kudos lead-magnet experiment. Provides sub-tabs for the
// composer and the analytics dashboard. Lives in the Lab because Kudos is
// still pre-Live.

import React, { useState } from 'react';
import { Heart, BarChart3, ShieldAlert } from 'lucide-react';
import KudosLeadMagnet from '../KudosLeadMagnet';
import KudosDashboard from '../KudosDashboard';
import { BreadcrumbNav } from '../../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../../config/breadcrumbConfig.js';
import { useAppServices } from '../../../services/useAppServices';

const TABS = [
  { id: 'composer', label: 'Composer', icon: Heart },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
];

const LabKudos = () => {
  const { isAdmin, navigate } = useAppServices();
  const [activeTab, setActiveTab] = useState('composer');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav
          items={getBreadcrumbs('lab-kudos')}
          navigate={navigate}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 rounded-xl">
            <Heart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
              Kudos <span className="text-sm font-semibold text-blue-600 ml-1">Beta</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              AI-moderated warm-touch lead magnet. Composer + analytics.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6">
        <div className="flex gap-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'composer' ? <KudosLeadMagnet /> : <KudosDashboard />}
      </div>
    </div>
  );
};

export default LabKudos;
