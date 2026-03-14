// src/components/admin/FacilitatorCenter.jsx
// Facilitator Operations Center — cohort oversight, attendance, sign-offs, feedback

import React, { useState, useEffect } from 'react';
import {
  Users, ArrowLeft, Dumbbell, BookOpen, CheckCircle, Award, FileText,
  ShieldAlert, ClipboardList, Calendar,
} from 'lucide-react';
import ConditioningDashboard from './ConditioningDashboard';
import SessionAttendanceQueue from './SessionAttendanceQueue';
import MilestoneSignOffQueue from './MilestoneSignOffQueue';
import CoachingCertificationQueue from './CoachingCertificationQueue';
import LeaderProfileReports from './LeaderProfileReports';
import LeaderActivityReport from './LeaderActivityReport';
import TrainerSessionsPanel from './TrainerSessionsPanel';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';

const TABS = [
  { id: 'activity-report', label: 'Leader Activity', icon: ClipboardList },
  { id: 'leader-profiles', label: 'Leader Profiles', icon: FileText },
  { id: 'trainer-sessions', label: 'My Sessions', icon: Calendar },
  { id: 'conditioning', label: 'Conditioning', icon: Dumbbell },
  { id: 'session-attendance', label: 'Session Attendance', icon: BookOpen },
  { id: 'sign-off-queue', label: 'Sign-Off Queue', icon: CheckCircle },
  { id: 'coaching-cert', label: 'Certification Queue', icon: Award },
];

const FacilitatorCenter = () => {
  const { user, isAdmin, navigate } = useAppServices();
  const { navParams } = useNavigation();
  const [activeTab, setActiveTab] = useState(navParams?.tab || 'activity-report');

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
      case 'session-attendance': return <SessionAttendanceQueue />;
      case 'sign-off-queue': return <MilestoneSignOffQueue />;
      case 'coaching-cert': return <CoachingCertificationQueue />;
      case 'leader-profiles': return <LeaderProfileReports />;
      case 'activity-report': return <LeaderActivityReport />;
      case 'trainer-sessions': return <TrainerSessionsPanel />;
      default: return <LeaderActivityReport />;
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
                      ? 'bg-corporate-orange/10 text-corporate-orange'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-corporate-orange' : 'text-slate-400'}`} />
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

export default FacilitatorCenter;
