// src/components/admin/EventsManager.jsx
//
// Unified "Events" admin — replaces the separate Community + Coaching admin
// tools, mirroring the user-facing consolidation of Community + Coaching into
// a single "Events" experience.
//
// Renders the underlying session managers directly (no nested wrappers, no
// AI Scenarios / Data Tools / Forum Posts subtabs — those are not events).
// The two data sources stay separate (`coaching_sessions` vs
// `community_sessions`), surfaced as two simple subtabs.
//
// Deep-link support: the `tab` nav param can be 'coaching' or 'community' to
// open straight into that subtab. Defaults to 'coaching' (Live Sessions),
// matching the order leaders see on the user-facing Events screen.

import React, { useState, useEffect } from 'react';
import { Calendar, Users, BrainCircuit } from 'lucide-react';
import SessionManager from './SessionManager';
import CommunitySessionManager from './CommunitySessionManager';
import { useNavigation } from '../../providers/NavigationProvider';

const SUBTABS = [
  { id: 'coaching', label: 'Live Sessions', icon: BrainCircuit, component: SessionManager },
  { id: 'community', label: 'Community Sessions', icon: Users, component: CommunitySessionManager },
];

const EventsManager = () => {
  const { navParams } = useNavigation() || {};

  // Allow ?tab=coaching|community deep links (and the legacy 'community'/
  // 'coaching' top-level tabs that AppConfigCenter / AdminPortal still
  // accept as aliases that route into this manager).
  const initial = SUBTABS.find((t) => t.id === navParams?.subtab)
    ? navParams.subtab
    : SUBTABS.find((t) => t.id === navParams?.tab)
    ? navParams.tab
    : 'coaching';

  const [activeSubtab, setActiveSubtab] = useState(initial);

  useEffect(() => {
    const next = navParams?.subtab || navParams?.tab;
    if (next && SUBTABS.some((t) => t.id === next)) {
      setActiveSubtab(next);
    }
  }, [navParams?.subtab, navParams?.tab]);

  const Active = SUBTABS.find((t) => t.id === activeSubtab)?.component || SessionManager;

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 pt-5 pb-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-corporate-teal/10 rounded-lg">
            <Calendar className="w-5 h-5 text-corporate-teal" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-corporate-navy dark:text-white">
              Events Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage all live sessions and community events in one place
            </p>
          </div>
        </div>

        {/* Subtab nav */}
        <div className="flex gap-1 -mb-px">
          {SUBTABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubtab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubtab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
                  isActive
                    ? 'border-corporate-teal text-corporate-teal-ink'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active manager */}
      <div>
        <Active embedded />
      </div>
    </div>
  );
};

export default EventsManager;
