// src/components/admin/FacilitatorCenter.jsx
// Facilitator Operations Center — cohort oversight, attendance, sign-offs, feedback

import React, { useState, useEffect } from 'react';
import {
  Users, Zap, FileText,
  ShieldAlert, ClipboardList, Calendar,
  Megaphone, BarChart3, Sparkles, ClipboardCheck,
} from 'lucide-react';
import ConditioningDashboard from './ConditioningDashboard';
import LeaderProfileReports from './LeaderProfileReports';
import LeaderActivityReport from './LeaderActivityReport';
import BaselineReports from './BaselineReports';
import IdentityStatementReports from './IdentityStatementReports';
import TrainerSessionsPanel from './TrainerSessionsPanel';
import AskTrainerInbox from './AskTrainerInbox';
const RepCalibrationPanel = React.lazy(() => import('./RepCalibrationPanel'));
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';

// Sidebar is grouped by section. `section: null` items are top-level.
const TABS = [
  { id: 'trainer-sessions', label: 'My Sessions', icon: Calendar, section: null },
  { id: 'ask-trainer-inbox', label: 'Ask a Trainer', icon: Megaphone, section: null },
  { id: 'conditioning', label: 'Conditioning', icon: Zap, section: null },
  { id: 'rep-calibration', label: 'Rep Calibration', icon: ClipboardCheck, section: null },
  // Reports section
  { id: 'activity-report', label: 'Leader Activity', icon: ClipboardList, section: 'Reports' },
  { id: 'leader-profiles', label: 'Leader Profiles', icon: FileText, section: 'Reports' },
  { id: 'baseline-reports', label: 'Skills Baseline', icon: BarChart3, section: 'Reports' },
  { id: 'identity-reports', label: 'Identity Statements', icon: Sparkles, section: 'Reports' },
];

const FacilitatorCenter = () => {
  const { user, isAdmin, navigate } = useAppServices();
  const { navParams } = useNavigation();
  const [activeTab, setActiveTab] = useState(navParams?.tab || 'trainer-sessions');

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
      case 'conditioning': return <ConditioningDashboard />;
      case 'leader-profiles': return <LeaderProfileReports />;
      case 'activity-report': return <LeaderActivityReport />;
      case 'baseline-reports': return <BaselineReports />;
      case 'identity-reports': return <IdentityStatementReports />;
      case 'trainer-sessions': return <TrainerSessionsPanel />;
      case 'ask-trainer-inbox': return <AskTrainerInbox />;
      case 'rep-calibration': return (
        <React.Suspense fallback={<div className="text-sm text-slate-500">Loading…</div>}>
          <RepCalibrationPanel />
        </React.Suspense>
      );
      default: return <TrainerSessionsPanel />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav
          items={getBreadcrumbs('facilitator-center')}
          navigate={navigate}
        />
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-corporate-orange/10 rounded-lg">
            <Users className="w-5 h-5 text-corporate-orange" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-corporate-navy dark:text-white">
              Trainer Operations
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-y-auto flex-shrink-0">
          <div className="p-3 space-y-1">
            {(() => {
              const elements = [];
              let prevSection = undefined;
              TABS.forEach((tab) => {
                if (tab.section && tab.section !== prevSection) {
                  elements.push(
                    <div
                      key={`section-${tab.section}`}
                      className="pt-3 pb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500"
                    >
                      {tab.section}
                    </div>
                  );
                }
                prevSection = tab.section;

                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                elements.push(
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive
                        ? 'bg-corporate-orange/10 text-corporate-orange'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-corporate-orange' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                );
              });
              return elements;
            })()}
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

export default FacilitatorCenter;
