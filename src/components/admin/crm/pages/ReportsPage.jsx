/**
 * ReportsPage — sales analytics: forecast, funnel, leaderboard, exports.
 *
 * Reads from prospects, deals, accounts, and prospect activities stores.
 * All numbers are computed client-side from already-subscribed data
 * (subscriptions are owned by CRMApp). Date filters operate on
 * `closeDate` (forecast) and `createdAt` (funnel/activities).
 */

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  Target,
  Trophy,
  Filter as FilterIcon,
  Download,
  DollarSign,
  Calendar,
  Activity as ActivityIcon,
} from 'lucide-react';

import { useDealsStore } from '../stores/dealsStore';
import { useProspectsStore, PIPELINE_STAGES } from '../stores/prospectsStore';
import { useActivitiesStore } from '../stores/prospectActivitiesStore';
import {
  DEAL_STAGES,
  OPEN_DEAL_STAGES,
  CLOSED_DEAL_STAGES,
} from '../config/dealMeta';
import { TEAM_MEMBERS, getCanonicalEmail, isSameUser } from '../config/team';

const PERIODS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'next_quarter', label: 'Next Quarter' },
  { id: 'this_year', label: 'This Year' },
  { id: 'all', label: 'All Open' },
];

function periodRange(periodId) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  if (periodId === 'this_month') {
    return [new Date(y, m, 1), new Date(y, m + 1, 0, 23, 59, 59)];
  }
  if (periodId === 'this_quarter') {
    const qStart = Math.floor(m / 3) * 3;
    return [new Date(y, qStart, 1), new Date(y, qStart + 3, 0, 23, 59, 59)];
  }
  if (periodId === 'next_quarter') {
    const qStart = Math.floor(m / 3) * 3 + 3;
    return [new Date(y, qStart, 1), new Date(y, qStart + 3, 0, 23, 59, 59)];
  }
  if (periodId === 'this_year') {
    return [new Date(y, 0, 1), new Date(y, 11, 31, 23, 59, 59)];
  }
  return [null, null];
}

function fmt$(v) {
  const n = Number(v) || 0;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function downloadCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const csv = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const StatCard = ({ icon: Icon, label, value, sub, accent = 'bg-corporate-teal' }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {value}
        </p>
        {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
  </div>
);

const ReportsPage = () => {
  const deals = useDealsStore((s) => s.deals);
  const prospects = useProspectsStore((s) => s.prospects);
  const activities = useActivitiesStore((s) => s.activities) || [];

  const [period, setPeriod] = useState('this_quarter');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [start, end] = periodRange(period);

  const ownerFilteredDeals = useMemo(() => {
    if (ownerFilter === 'all') return deals;
    return deals.filter((d) => isSameUser(d.ownerEmail, ownerFilter));
  }, [deals, ownerFilter]);

  // -------- Forecast (open deals with closeDate in period) --------
  const forecast = useMemo(() => {
    const open = ownerFilteredDeals.filter((d) =>
      OPEN_DEAL_STAGES.includes(d.stage)
    );
    const inPeriod = open.filter((d) => {
      if (!start || !end) return true;
      if (!d.closeDate) return false;
      const c = new Date(d.closeDate);
      return c >= start && c <= end;
    });
    const pipeline = inPeriod.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const weighted = inPeriod.reduce(
      (s, d) =>
        s + ((Number(d.amount) || 0) * (Number(d.probability) || 0)) / 100,
      0
    );
    const bestCase = inPeriod
      .filter((d) => (Number(d.probability) || 0) >= 50)
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const commit = inPeriod
      .filter((d) => (Number(d.probability) || 0) >= 80)
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return {
      count: inPeriod.length,
      pipeline,
      weighted,
      bestCase,
      commit,
      deals: inPeriod,
    };
  }, [ownerFilteredDeals, start, end]);

  // -------- Won / Lost in period (by closeDate) --------
  const closed = useMemo(() => {
    const closedDeals = ownerFilteredDeals.filter((d) =>
      CLOSED_DEAL_STAGES.includes(d.stage)
    );
    const inPeriod = closedDeals.filter((d) => {
      if (!start || !end) return true;
      const c = d.closeDate ? new Date(d.closeDate) : null;
      return c && c >= start && c <= end;
    });
    const won = inPeriod.filter((d) => d.stage === 'won');
    const lost = inPeriod.filter((d) => d.stage === 'lost');
    return {
      wonCount: won.length,
      wonValue: won.reduce((s, d) => s + (Number(d.amount) || 0), 0),
      lostCount: lost.length,
      lostValue: lost.reduce((s, d) => s + (Number(d.amount) || 0), 0),
      winRate:
        won.length + lost.length === 0
          ? 0
          : (won.length / (won.length + lost.length)) * 100,
    };
  }, [ownerFilteredDeals, start, end]);

  // -------- Funnel (deal counts by stage) --------
  const funnel = useMemo(() => {
    const orderedStages = DEAL_STAGES;
    const buckets = orderedStages.map((s) => ({
      ...s,
      count: ownerFilteredDeals.filter((d) => d.stage === s.id).length,
      value: ownerFilteredDeals
        .filter((d) => d.stage === s.id)
        .reduce((acc, d) => acc + (Number(d.amount) || 0), 0),
    }));
    const max = Math.max(1, ...buckets.map((b) => b.count));
    return { buckets, max };
  }, [ownerFilteredDeals]);

  // -------- Prospect funnel (counts by pipeline stage) --------
  const prospectFunnel = useMemo(() => {
    const buckets = PIPELINE_STAGES.map((s) => ({
      ...s,
      count: prospects.filter((p) => {
        if (ownerFilter === 'all') return p.stage === s.id;
        const owner = p.owner || p.ownerEmail;
        return p.stage === s.id && isSameUser(owner, ownerFilter);
      }).length,
    }));
    const max = Math.max(1, ...buckets.map((b) => b.count));
    return { buckets, max };
  }, [prospects, ownerFilter]);

  // -------- Leaderboard (per rep) --------
  const leaderboard = useMemo(() => {
    return TEAM_MEMBERS.map((m) => {
      const memberDeals = deals.filter((d) => isSameUser(d.ownerEmail, m.email));
      const open = memberDeals.filter((d) => OPEN_DEAL_STAGES.includes(d.stage));
      const won = memberDeals.filter(
        (d) =>
          d.stage === 'won' &&
          (!start || !end || (d.closeDate && new Date(d.closeDate) >= start && new Date(d.closeDate) <= end))
      );
      const memberProspects = prospects.filter((p) =>
        isSameUser(p.owner || p.ownerEmail, m.email)
      );
      const memberActivities = activities.filter((a) =>
        isSameUser(a.userEmail || a.createdBy, m.email)
      );
      return {
        email: m.email,
        name: m.name,
        color: m.color,
        initials: m.initials,
        prospects: memberProspects.length,
        openDeals: open.length,
        pipeline: open.reduce((s, d) => s + (Number(d.amount) || 0), 0),
        weighted: open.reduce(
          (s, d) =>
            s + ((Number(d.amount) || 0) * (Number(d.probability) || 0)) / 100,
          0
        ),
        wonCount: won.length,
        wonValue: won.reduce((s, d) => s + (Number(d.amount) || 0), 0),
        activities: memberActivities.length,
      };
    }).sort((a, b) => b.pipeline - a.pipeline);
  }, [deals, prospects, activities, start, end]);

  const exportForecast = () => {
    const rows = forecast.deals.map((d) => ({
      name: d.name,
      stage: d.stage,
      amount: d.amount,
      probability: d.probability,
      weighted: ((d.amount || 0) * (d.probability || 0)) / 100,
      closeDate: d.closeDate,
      ownerEmail: d.ownerEmail,
    }));
    downloadCSV(`forecast-${period}-${Date.now()}.csv`, rows);
  };

  const exportLeaderboard = () => {
    downloadCSV(`leaderboard-${period}-${Date.now()}.csv`, leaderboard);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header / filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Sales Reports
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Forecast, funnel, leaderboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
          >
            {PERIODS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
          >
            <option value="all">All Reps</option>
            {TEAM_MEMBERS.map((m) => (
              <option key={m.email} value={m.email}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Forecast cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Pipeline"
          value={fmt$(forecast.pipeline)}
          sub={`${forecast.count} open deals`}
          accent="bg-blue-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Weighted Forecast"
          value={fmt$(forecast.weighted)}
          sub="amount × probability"
          accent="bg-corporate-teal"
        />
        <StatCard
          icon={Target}
          label="Best Case"
          value={fmt$(forecast.bestCase)}
          sub="probability ≥ 50%"
          accent="bg-amber-500"
        />
        <StatCard
          icon={Trophy}
          label="Commit"
          value={fmt$(forecast.commit)}
          sub="probability ≥ 80%"
          accent="bg-emerald-500"
        />
      </div>

      {/* Won / Lost */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Trophy}
          label="Won (in period)"
          value={fmt$(closed.wonValue)}
          sub={`${closed.wonCount} deal${closed.wonCount === 1 ? '' : 's'}`}
          accent="bg-emerald-500"
        />
        <StatCard
          icon={Calendar}
          label="Lost (in period)"
          value={fmt$(closed.lostValue)}
          sub={`${closed.lostCount} deal${closed.lostCount === 1 ? '' : 's'}`}
          accent="bg-red-500"
        />
        <StatCard
          icon={ActivityIcon}
          label="Win Rate"
          value={`${closed.winRate.toFixed(0)}%`}
          sub="closed-won / (won + lost)"
          accent="bg-corporate-navy"
        />
      </div>

      {/* Funnel: Deal stages */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Deal Stage Funnel
            </h3>
            <p className="text-xs text-slate-500">All deals (current snapshot)</p>
          </div>
          <button
            onClick={exportForecast}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export Forecast CSV
          </button>
        </div>
        <div className="space-y-2">
          {funnel.buckets.map((b) => {
            const pct = (b.count / funnel.max) * 100;
            return (
              <div key={b.id} className="flex items-center gap-3">
                <div className="w-28 text-xs text-slate-600 dark:text-slate-300 truncate">
                  {b.label}
                </div>
                <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-corporate-teal/80"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-2 text-xs text-slate-700 dark:text-slate-100">
                    <span className="font-medium">{b.count}</span>
                    <span className="text-slate-500 dark:text-slate-300">
                      {fmt$(b.value)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Funnel: Prospect pipeline */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Prospect Pipeline
        </h3>
        <div className="space-y-2">
          {prospectFunnel.buckets.map((b) => {
            const pct = (b.count / prospectFunnel.max) * 100;
            return (
              <div key={b.id} className="flex items-center gap-3">
                <div className="w-28 text-xs text-slate-600 dark:text-slate-300 truncate">
                  {b.label}
                </div>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-700 rounded overflow-hidden relative">
                  <div
                    className="h-full bg-blue-500/70"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-2 text-xs text-slate-700 dark:text-slate-100">
                    <span className="font-medium">{b.count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Rep Leaderboard
            </h3>
            <p className="text-xs text-slate-500">Sorted by open pipeline value</p>
          </div>
          <button
            onClick={exportLeaderboard}
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="py-2 pr-4">Rep</th>
                <th className="py-2 pr-4 text-right">Prospects</th>
                <th className="py-2 pr-4 text-right">Open Deals</th>
                <th className="py-2 pr-4 text-right">Pipeline</th>
                <th className="py-2 pr-4 text-right">Weighted</th>
                <th className="py-2 pr-4 text-right">Won (period)</th>
                <th className="py-2 pr-4 text-right">Activities</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, i) => (
                <tr
                  key={row.email}
                  className="border-b border-slate-100 dark:border-slate-700/50"
                >
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                      <div
                        className="w-7 h-7 rounded-full text-white text-xs font-semibold flex items-center justify-center"
                        style={{ backgroundColor: row.color }}
                      >
                        {row.initials}
                      </div>
                      <span className="text-slate-900 dark:text-slate-100">
                        {row.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-200">
                    {row.prospects}
                  </td>
                  <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-200">
                    {row.openDeals}
                  </td>
                  <td className="py-2 pr-4 text-right font-medium text-slate-900 dark:text-slate-100">
                    {fmt$(row.pipeline)}
                  </td>
                  <td className="py-2 pr-4 text-right text-corporate-teal">
                    {fmt$(row.weighted)}
                  </td>
                  <td className="py-2 pr-4 text-right text-emerald-600">
                    {fmt$(row.wonValue)}
                    {row.wonCount ? (
                      <span className="text-slate-400 text-xs ml-1">
                        ({row.wonCount})
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2 pr-4 text-right text-slate-700 dark:text-slate-200">
                    {row.activities}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
