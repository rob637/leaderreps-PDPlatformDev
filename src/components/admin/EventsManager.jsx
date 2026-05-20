// src/components/admin/EventsManager.jsx
//
// Unified "Events" admin — single source of truth for all event types.
//
// May 2026 events consolidation: the separate "Community Sessions" subtab
// was retired. All event types (coaching + leader circles + community events
// + accountability pods + masterminds + networking) now live in
// `coaching_sessions` and are managed through the SessionManager UI.
//
// The legacy `tab=community` and `tab=coaching` deep links are accepted
// silently and route to the same unified view.

import React from 'react';
import { Calendar } from 'lucide-react';
import SessionManager from './SessionManager';

const EventsManager = () => {
  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-corporate-teal/10 rounded-lg">
            <Calendar className="w-5 h-5 text-corporate-teal" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-corporate-navy dark:text-white">
              Events Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage all live coaching, leader circles, and community events in one place
            </p>
          </div>
        </div>
      </div>

      <SessionManager embedded />
    </div>
  );
};

export default EventsManager;

