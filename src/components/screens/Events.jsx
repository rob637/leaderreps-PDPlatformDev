// src/components/screens/Events.jsx
//
// Ascent Revamp — Events screen (replaces Community + Coaching split).
// PLACEHOLDER for WS-2. Real implementation will:
//   - Read-aggregate `coaching_sessions` + `community_sessions` into a
//     unified `Event` shape via `eventsService.js`.
//   - Show list/calendar toggle.
//   - Single registration flow (no per-type branching).
//   - Type tag: one-on-one | clinic | open-gym | practice.
//
// Until then, this placeholder confirms routing + nav wiring works.

import React from 'react';
import { Calendar, Construction } from 'lucide-react';

const Events = () => {
  return (
    <div className="max-w-[860px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Calendar className="w-8 h-8 text-corporate-teal" />
          <h1
            className="text-3xl font-bold text-corporate-navy dark:text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Events
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          One-on-ones, coaching clinics, open gym, and practice sessions — all
          in one place.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <Construction className="w-12 h-12 mx-auto text-corporate-orange mb-4" />
        <h2 className="text-xl font-semibold text-corporate-navy dark:text-white mb-2">
          Coming for May 11
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Events will unify the current Community and Coaching screens into a
          single registration flow.
        </p>
      </div>
    </div>
  );
};

export default Events;
