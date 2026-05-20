// src/components/admin/crm/components/prospects/ProspectAIInsights.jsx
//
// Collapsible card showing AI-derived signals for a prospect:
//   - Lead score (0-100) + tier
//   - Activity summary
//   - Suggested next action
// All three are produced via the geminiProxy.

import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Calendar,
} from 'lucide-react';
import {
  scoreProspect,
  summarizeActivities,
  nextBestAction,
} from '../../services/aiService';

const TIER_STYLES = {
  hot: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  warm: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  cold: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const ACTION_LABELS = {
  send_email: 'Send Email',
  send_linkedin: 'Send LinkedIn DM',
  call: 'Call',
  book_meeting: 'Book a Meeting',
  wait: 'Wait & Monitor',
  enrich: 'Enrich Contact Data',
  hand_off: 'Hand Off to AE',
};

export default function ProspectAIInsights({ prospect, activities = [], deal = null }) {
  const [score, setScore] = useState(null);
  const [summary, setSummary] = useState(null);
  const [nba, setNba] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, sum, n] = await Promise.all([
        scoreProspect({ prospect, activities, deal }),
        summarizeActivities({ prospect, activities }),
        nextBestAction({ prospect, activities, deal }),
      ]);
      setScore(s);
      setSummary(sum);
      setNba(n);
    } catch (err) {
      console.error('AI insights error:', err);
      setError(err.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const hasResults = score || summary || nba;

  return (
    <div className="border border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-semibold text-purple-900 dark:text-purple-200">
            AI Insights
          </span>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : hasResults ? (
            <RefreshCw className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {loading ? 'Analyzing...' : hasResults ? 'Refresh' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-700 dark:text-red-300">{error}</div>
      )}

      {!hasResults && !loading && !error && (
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Click <span className="font-medium">Generate</span> to score this prospect, summarize their activity, and get a next-best-action recommendation.
        </p>
      )}

      {/* Score */}
      {score && (
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full bg-white dark:bg-slate-800 border-2 border-purple-300 dark:border-purple-700">
            <span className="text-lg font-bold text-purple-900 dark:text-purple-200 leading-none">
              {score.score}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
              / 100
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-medium rounded uppercase ${TIER_STYLES[score.tier] || TIER_STYLES.cold}`}
            >
              {score.tier}
            </span>
            <div className="space-y-0.5">
              {score.factors.map((f, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs">
                  {f.weight === '+' ? (
                    <TrendingUp className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <span className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">{f.label}:</span> {f.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="space-y-1">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Relationship summary
          </div>
          {summary.headline && (
            <p className="text-xs text-slate-700 dark:text-slate-300">
              {summary.headline}
            </p>
          )}
          {summary.bullets?.length > 0 && (
            <ul className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
              {summary.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          )}
          {summary.openQuestions?.length > 0 && (
            <div className="mt-1.5">
              <div className="text-[11px] font-medium uppercase text-slate-500 dark:text-slate-400">
                Questions to ask
              </div>
              <ul className="space-y-0.5 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
                {summary.openQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Next best action */}
      {nba && (
        <div className="flex items-start gap-2 p-2 rounded bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800">
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {nba.title || ACTION_LABELS[nba.action] || nba.action}
              </span>
              <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {(nba.when || '').replace(/_/g, ' ')}
              </span>
            </div>
            {nba.why && (
              <p className="text-xs text-slate-600 dark:text-slate-400">{nba.why}</p>
            )}
            {nba.draft && (
              <p className="text-xs italic text-slate-700 dark:text-slate-300 mt-1 px-2 py-1 bg-slate-50 dark:bg-slate-900 rounded">
                "{nba.draft}"
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
