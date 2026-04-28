// src/components/screens/ConditioningLight.jsx
//
// Ascent Revamp — Conditioning Tool (Light) — REPLACES current Conditioning.
// PLACEHOLDER for WS-3. Real implementation will:
//   - Single "Practice a Rep" button on entry.
//   - Step 1: select RR type (DRF, RED, FUW, SCE).
//   - Step 2: one open text box with mic (voice → text).
//   - Step 3: submit → verdict (Pass / Not Yet) + Quick Read (Strong/Adequate/
//     Weak/Missing per condition) + 1 observation + (1 question if not Strong).
//   - NO numeric scores shown.
//   - NO planned-vs-logged distinction.
//   - Backed by `evaluateRep` Cloud Function (universal evaluation engine).
//   - Stores reps to `users/{uid}/reps_light` (NEW collection — old
//     `conditioning_reps` left untouched).
//
// See REVAMP-PLAN.md §6 for the full v1 spec.

import React from 'react';
import { Zap, Construction } from 'lucide-react';

const ConditioningLight = () => {
  return (
    <div className="max-w-[860px] mx-auto p-4 sm:p-6 lg:p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Zap className="w-8 h-8 text-corporate-teal" />
          <h1
            className="text-3xl font-bold text-corporate-navy dark:text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Conditioning
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Practice a rep. One field. Voice or text. Get a verdict.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center">
        <Construction className="w-12 h-12 mx-auto text-corporate-orange mb-4" />
        <h2 className="text-xl font-semibold text-corporate-navy dark:text-white mb-2">
          Coming for May 11
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Simplified rep flow with AI evaluation: pass/fail verdict plus one
          observation and one coaching question if you fall short.
        </p>
      </div>
    </div>
  );
};

export default ConditioningLight;
