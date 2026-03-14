// src/components/admin/AdminHub.jsx
// Single entry point that routes to 3 focused operations centers

import React from 'react';
import {
  ShieldAlert,
  Settings,
  Users,
  Wrench,
  ChevronRight,
  Loader,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';

const CENTERS = [
  {
    id: 'config-center',
    title: 'Application Configuration',
    icon: Settings,
    bg: 'bg-corporate-teal/10 hover:bg-corporate-teal/20 border-corporate-teal/30',
    iconBg: 'bg-corporate-teal/20',
    iconColor: 'text-corporate-teal',
  },
  {
    id: 'facilitator-center',
    title: 'Trainer Operations',
    icon: Users,
    bg: 'bg-corporate-orange/10 hover:bg-corporate-orange/20 border-corporate-orange/30',
    iconBg: 'bg-corporate-orange/20',
    iconColor: 'text-corporate-orange',
  },
  {
    id: 'system-center',
    title: 'System Administration',
    icon: Wrench,
    bg: 'bg-corporate-navy/10 hover:bg-corporate-navy/20 border-corporate-navy/30',
    iconBg: 'bg-corporate-navy/20',
    iconColor: 'text-corporate-navy',
  },
];

const AdminHub = () => {
  const { user, isAdmin, isLoading, navigate } = useAppServices();

  if (isLoading) {
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
        <p className="text-gray-600 dark:text-gray-300">You do not have permission to view this area.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-corporate-teal/10 rounded-xl">
            <ShieldAlert className="w-7 h-7 text-corporate-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
              Admin Command Center
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Three Center Buttons */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-4 max-w-2xl">
          {CENTERS.map((center) => {
            const Icon = center.icon;
            return (
              <button
                key={center.id}
                onClick={() => navigate(center.id)}
                className={`
                  flex items-center gap-4 p-6 rounded-2xl border-2 ${center.bg}
                  transition-all duration-200 group
                  hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
                `}
              >
                <div className={`w-12 h-12 ${center.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-6 h-6 ${center.iconColor}`} />
                </div>
                <span className="text-lg font-bold text-corporate-navy dark:text-white">
                  {center.title}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400 ml-auto group-hover:translate-x-1 transition-transform" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminHub;
