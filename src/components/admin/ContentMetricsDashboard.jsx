// src/components/admin/ContentMetricsDashboard.jsx
//
// Admin dashboard for the (silent) content metrics system.
//
// Capabilities:
//   - Global config: collection on/off, display on/off, display threshold.
//   - Per-item table: opens, unique opens, surfaces, first/last seen.
//   - Per-item displayPublicly toggle (gates the SocialProofBadge).
//   - Bulk action: enable display for everything above a threshold.
//   - Sort / filter / CSV export.
//
// Access-gated to admins via useAppServices().isAdmin.

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  BarChart3,
  ShieldAlert,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  Download,
  Save,
  Loader,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { createContentMetricsService } from '../../services/contentMetricsService';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';

const formatNumber = (n) => (typeof n === 'number' ? n.toLocaleString() : '—');

const formatDate = (ts) => {
  if (!ts) return '—';
  try {
    const d = typeof ts.toDate === 'function' ? ts.toDate() : new Date(ts);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (_) {
    return '—';
  }
};

const completionRate = (r) => {
  const opens = r.uniqueOpens || 0;
  const completes = r.uniqueCompletions || r.completions || 0;
  if (!opens) return null;
  return Math.round((completes / opens) * 100);
};

const formatRate = (r) => {
  const v = completionRate(r);
  return v == null ? '—' : `${v}%`;
};

const downloadCsv = (rows) => {
  const headers = [
    'contentId',
    'label',
    'contentType',
    'opens',
    'uniqueOpens',
    'completions',
    'completionRatePct',
    'coachAsks',
    'shares',
    'displayPublicly',
    'firstOpenAt',
    'lastOpenAt',
  ];
  const escape = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  rows.forEach((r) => {
    lines.push(
      [
        r.id,
        r.label || '',
        r.contentType || '',
        r.opens || 0,
        r.uniqueOpens || 0,
        r.uniqueCompletions || r.completions || 0,
        completionRate(r) ?? '',
        r.coachAsks || 0,
        r.shares || 0,
        r.displayPublicly ? 'yes' : 'no',
        formatDate(r.firstOpenAt),
        formatDate(r.lastOpenAt),
      ]
        .map(escape)
        .join(',')
    );
  });
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `content-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const StatCard = ({ label, value, accentClass = 'text-corporate-teal' }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
    <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {label}
    </div>
    <div className={`text-2xl font-bold mt-1 ${accentClass}`}>{value}</div>
  </div>
);

const ContentMetricsDashboard = () => {
  const { db, isAdmin, isLoading, navigate } = useAppServices();
  const service = useMemo(() => createContentMetricsService(db), [db]);

  const [config, setConfig] = useState(service.DEFAULT_CONFIG);
  const [configDraft, setConfigDraft] = useState(service.DEFAULT_CONFIG);
  const [configSaving, setConfigSaving] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | shown | hidden
  const [sortKey, setSortKey] = useState('uniqueOpens');
  const [sortDir, setSortDir] = useState('desc');

  const [bulkThreshold, setBulkThreshold] = useState(50);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkMsg, setBulkMsg] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.listAllAggregates();
      setRows(data);
    } catch (err) {
      setError(err && err.message ? err.message : 'Failed to load metrics.');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    if (!isAdmin) return;
    reload();
  }, [isAdmin, reload]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    const unsub = service.subscribeConfig((next) => {
      setConfig(next);
      setConfigDraft(next);
    });
    return () => {
      try { unsub && unsub(); } catch (_) { /* noop */ }
    };
  }, [isAdmin, service]);

  const dirty =
    configDraft.collectionEnabled !== config.collectionEnabled ||
    configDraft.displayEnabled !== config.displayEnabled ||
    configDraft.displayThreshold !== config.displayThreshold;

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    try {
      await service.saveConfig(configDraft);
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Failed to save: ${err && err.message ? err.message : err}`);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleToggleDisplay = async (row) => {
    try {
      await service.setDisplayPublicly(row.id, !row.displayPublicly);
      // Optimistic update — list will reload next refresh anyway.
      setRows((curr) =>
        curr.map((r) =>
          r.id === row.id ? { ...r, displayPublicly: !r.displayPublicly } : r
        )
      );
    } catch (err) {
      // eslint-disable-next-line no-alert
      alert(`Toggle failed: ${err && err.message ? err.message : err}`);
    }
  };

  const handleBulkEnable = async () => {
    setBulkMsg(null);
    setBulkBusy(true);
    try {
      const targets = rows
        .filter((r) => (r.uniqueOpens || 0) >= bulkThreshold && !r.displayPublicly)
        .map((r) => r.id);
      if (targets.length === 0) {
        setBulkMsg({ kind: 'info', text: 'No items match the threshold.' });
        return;
      }
      const count = await service.bulkEnableDisplay(targets);
      setBulkMsg({
        kind: 'ok',
        text: `Enabled display on ${count} item${count === 1 ? '' : 's'}.`,
      });
      reload();
    } catch (err) {
      setBulkMsg({
        kind: 'err',
        text: err && err.message ? err.message : 'Bulk update failed.',
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const visible = useMemo(() => {
    let out = rows;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          (r.label || '').toLowerCase().includes(q) ||
          (r.contentType || '').toLowerCase().includes(q)
      );
    }
    if (filter === 'shown') out = out.filter((r) => r.displayPublicly);
    if (filter === 'hidden') out = out.filter((r) => !r.displayPublicly);
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...out].sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, search, filter, sortKey, sortDir]);

  const totals = useMemo(() => {
    let opens = 0;
    let uniques = 0;
    let completions = 0;
    let coachAsks = 0;
    let shares = 0;
    let shown = 0;
    rows.forEach((r) => {
      opens += r.opens || 0;
      uniques += r.uniqueOpens || 0;
      completions += r.uniqueCompletions || r.completions || 0;
      coachAsks += r.coachAsks || 0;
      shares += r.shares || 0;
      if (r.displayPublicly) shown += 1;
    });
    return { opens, uniques, completions, coachAsks, shares, shown, count: rows.length };
  }, [rows]);

  const setSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  // ----- Render -----

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
        <p className="text-gray-600 dark:text-gray-300">
          You do not have permission to view this area.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav
          items={getBreadcrumbs('admin-content-metrics') || [
            { label: 'Admin', screen: 'admin-hub' },
            { label: 'Content Metrics' },
          ]}
          navigate={navigate}
        />
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-corporate-teal/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-corporate-teal" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-corporate-navy dark:text-white">
                Content Metrics
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Silent collection of opens / views for social proof. Admins are
                excluded from counts.
              </p>
            </div>
          </div>
          <button
            onClick={reload}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Totals */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard label="Tracked items" value={formatNumber(totals.count)} />
          <StatCard
            label="Total opens"
            value={formatNumber(totals.opens)}
            accentClass="text-corporate-navy dark:text-white"
          />
          <StatCard
            label="Unique leaders"
            value={formatNumber(totals.uniques)}
            accentClass="text-corporate-orange"
          />
          <StatCard
            label="Completions"
            value={formatNumber(totals.completions)}
            accentClass="text-emerald-600"
          />
          <StatCard
            label="Coach asks"
            value={formatNumber(totals.coachAsks)}
          />
          <StatCard
            label="Shares"
            value={formatNumber(totals.shares)}
          />
          <StatCard
            label="Showing publicly"
            value={`${totals.shown} / ${totals.count}`}
          />
        </div>

        {/* Global config */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-base font-semibold text-corporate-navy dark:text-white mb-3">
            Global configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <button
                type="button"
                onClick={() =>
                  setConfigDraft((d) => ({
                    ...d,
                    collectionEnabled: !d.collectionEnabled,
                  }))
                }
                className="mt-0.5"
                aria-label="Toggle collection"
              >
                {configDraft.collectionEnabled ? (
                  <ToggleRight className="w-7 h-7 text-corporate-teal" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400" />
                )}
              </button>
              <span>
                <span className="font-medium block">Collection enabled</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Count opens as events arrive. Off = events still record but
                  are flagged excluded.
                </span>
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-200">
              <button
                type="button"
                onClick={() =>
                  setConfigDraft((d) => ({
                    ...d,
                    displayEnabled: !d.displayEnabled,
                  }))
                }
                className="mt-0.5"
                aria-label="Toggle display"
              >
                {configDraft.displayEnabled ? (
                  <ToggleRight className="w-7 h-7 text-corporate-teal" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400" />
                )}
              </button>
              <span>
                <span className="font-medium block">Display enabled</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Master switch for the public badge. Off = nothing shows even
                  if per-item toggles are on.
                </span>
              </span>
            </label>

            <label className="text-sm text-slate-700 dark:text-slate-200">
              <span className="font-medium block mb-1">Display threshold</span>
              <input
                type="number"
                min={0}
                value={configDraft.displayThreshold}
                onChange={(e) =>
                  setConfigDraft((d) => ({
                    ...d,
                    displayThreshold: Number(e.target.value) || 0,
                  }))
                }
                className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                Badge hides below this number of unique opens.
              </span>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled={!dirty || configSaving}
              onClick={handleSaveConfig}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                dirty && !configSaving
                  ? 'bg-corporate-teal text-white hover:bg-corporate-teal/90'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {configSaving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save configuration
            </button>
            {dirty && (
              <span className="text-xs text-amber-600">Unsaved changes</span>
            )}
          </div>
        </div>

        {/* Bulk action */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h2 className="text-base font-semibold text-corporate-navy dark:text-white mb-3">
            Bulk: enable display for popular items
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-slate-700 dark:text-slate-200">
              Show items with at least
              <input
                type="number"
                min={0}
                value={bulkThreshold}
                onChange={(e) => setBulkThreshold(Number(e.target.value) || 0)}
                className="mx-2 w-24 px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              unique opens
            </label>
            <button
              type="button"
              disabled={bulkBusy}
              onClick={handleBulkEnable}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                bulkBusy
                  ? 'bg-slate-200 text-slate-500'
                  : 'bg-corporate-orange text-white hover:bg-corporate-orange/90'
              }`}
            >
              {bulkBusy ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              Enable display
            </button>
            {bulkMsg && (
              <span
                className={`inline-flex items-center gap-1.5 text-sm ${
                  bulkMsg.kind === 'ok'
                    ? 'text-emerald-600'
                    : bulkMsg.kind === 'err'
                    ? 'text-red-600'
                    : 'text-slate-500'
                }`}
              >
                {bulkMsg.kind === 'ok' && <CheckCircle2 className="w-4 h-4" />}
                {bulkMsg.kind === 'err' && <AlertCircle className="w-4 h-4" />}
                {bulkMsg.text}
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by id, label, type…"
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
          >
            <option value="all">All items</option>
            <option value="shown">Showing publicly</option>
            <option value="hidden">Hidden</option>
          </select>
          <button
            type="button"
            onClick={() => downloadCsv(visible)}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {error && (
            <div className="p-4 text-sm text-red-600 border-b border-red-100 bg-red-50 dark:bg-red-900/20">
              {error}
            </div>
          )}
          {loading ? (
            <div className="p-10 flex items-center justify-center text-slate-400">
              <Loader className="w-6 h-6 animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400 text-sm">
              No content metrics yet. As leaders open content pieces, they'll
              show up here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Content</th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setSort('opens')}
                    >
                      Opens
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setSort('uniqueOpens')}
                    >
                      Unique
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setSort('uniqueCompletions')}
                    >
                      Completions
                    </th>
                    <th className="px-4 py-3">Rate</th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setSort('coachAsks')}
                    >
                      Coach asks
                    </th>
                    <th
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => setSort('shares')}
                    >
                      Shares
                    </th>
                    <th className="px-4 py-3">Last opened</th>
                    <th className="px-4 py-3">Display</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {visible.map((r) => {
                    const meetsThreshold =
                      (r.uniqueOpens || 0) >= (config.displayThreshold || 0);
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-corporate-navy dark:text-white">
                            {r.label || r.id}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {r.contentType || 'unknown'} · <code>{r.id}</code>
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatNumber(r.opens)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatNumber(r.uniqueOpens)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatNumber(r.uniqueCompletions || r.completions)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-500 dark:text-slate-400">
                          {formatRate(r)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatNumber(r.coachAsks)}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {formatNumber(r.shares)}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                          {formatDate(r.lastOpenAt)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleDisplay(r)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
                              r.displayPublicly
                                ? 'bg-corporate-teal/10 text-corporate-teal'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300'
                            }`}
                            title={
                              !meetsThreshold && !r.displayPublicly
                                ? `Below threshold (${config.displayThreshold}). Will not render publicly even when toggled on.`
                                : ''
                            }
                          >
                            {r.displayPublicly ? (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                Shown
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3.5 h-3.5" />
                                Hidden
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentMetricsDashboard;
