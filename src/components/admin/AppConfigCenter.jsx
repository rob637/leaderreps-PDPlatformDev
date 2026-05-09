// src/components/admin/AppConfigCenter.jsx
// Application Configuration Center — content, users, notifications, system values

import React, { useState, useEffect } from 'react';
import {
  Settings, Users, Calendar, FileText, Database,
  PlaySquare, Zap, List, Bell, Mail, Megaphone,
  ShieldAlert, Wrench, Dumbbell,
} from 'lucide-react';
import UserManagement from './UserManagement';
import ContentManager from './DailyPlanManager';
import ContentAdminHome from './ContentAdminHome';
import MediaLibrary from './MediaLibrary';
import VideoSeriesManager from './VideoSeriesManager';
import DailyRepsLibrary from './DailyRepsLibrary';
import ConditioningConfig from './ConditioningConfig';
import EventsManager from './EventsManager';
import LOVManager from './LOVManager';
import NotificationManager from './NotificationManager';
import AnnouncementsManager from './AnnouncementsManager';
import CommunicationsManager from './CommunicationsManager';
import MaintenanceToggle from './MaintenanceToggle';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';

const TAB_GROUPS = [
  {
    label: 'People',
    tabs: [
      { id: 'users', label: 'Users & Roles', icon: Users },
    ],
  },
  {
    label: 'Content',
    tabs: [
      { id: 'content-manager', label: 'Content Manager', icon: Calendar },
      { id: 'content', label: 'Content Library', icon: FileText },
      { id: 'video-series', label: 'Video Series', icon: PlaySquare },
      { id: 'media', label: 'Media Vault', icon: Database },
    ],
  },
  {
    label: 'Program',
    tabs: [
      { id: 'conditioning-config', label: 'Conditioning Config', icon: Zap },
      { id: 'events', label: 'Events', icon: Calendar },
    ],
  },
  {
    label: 'Communications',
    tabs: [
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'announcements', label: 'Announcements', icon: Megaphone },
      { id: 'communications', label: 'Communications', icon: Mail },
    ],
  },
  {
    label: 'System',
    tabs: [
      { id: 'maintenance', label: 'Maintenance Mode', icon: Wrench },
      { id: 'lov', label: 'System Values', icon: List },
    ],
  },
  {
    label: 'Outdated',
    tabs: [
      { id: 'daily-reps', label: 'Daily Reps', icon: Dumbbell },
    ],
  },
];

const AppConfigCenter = () => {
  const { user, isAdmin, navigate } = useAppServices();
  const { navParams } = useNavigation();
  const [activeTab, setActiveTab] = useState(navParams?.tab || 'users');

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
      case 'users': return <UserManagement />;
      case 'content-manager': return <ContentManager />;
      case 'content': return <ContentAdminHome />;
      case 'media': return <MediaLibrary />;
      case 'video-series': return <VideoSeriesManager />;
      case 'daily-reps': return <DailyRepsLibrary />;
      case 'conditioning-config': return <ConditioningConfig />;
      case 'events': return <EventsManager />;
      // Legacy aliases — preserve any deep links to the old separate tabs
      case 'community': return <EventsManager />;
      case 'coaching': return <EventsManager />;
      case 'lov': return <LOVManager />;
      case 'notifications': return <NotificationManager />;
      case 'announcements': return <AnnouncementsManager />;
      case 'communications': return <CommunicationsManager />;
      case 'maintenance': return <MaintenanceToggle />;
      default: return <UserManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav
          items={getBreadcrumbs('config-center')}
          navigate={navigate}
        />
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-corporate-teal/10 rounded-lg">
            <Settings className="w-5 h-5 text-corporate-teal" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-corporate-navy dark:text-white">
              Application Configuration
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
                            ? 'bg-corporate-teal/10 text-corporate-teal-ink'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
                        `}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-corporate-teal-ink' : 'text-slate-400'}`} />
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

export default AppConfigCenter;
