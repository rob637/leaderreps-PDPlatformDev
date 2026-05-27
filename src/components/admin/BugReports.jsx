// src/components/admin/BugReports.jsx
// Admin Bug Reports inbox — list, filter, view detail, copy-for-Copilot,
// update status. Read/update access is enforced by Firestore rules
// (admins have full access to the `bug_reports` collection).

import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  Bug,
  Copy,
  Check,
  Image as ImageIcon,
  ExternalLink,
  Loader,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices.jsx';

const STATUSES = ['new', 'reviewed', 'resolved', 'wontfix'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const SEVERITY_STYLES = {
  low: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

const STATUS_STYLES = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  reviewed: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  wontfix: 'bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200',
};

const formatTimestamp = (ts) => {
  if (!ts) return '—';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  } catch {
    return '—';
  }
};

const formatTimestampUTC = (ts) => {
  if (!ts) return '—';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  } catch {
    return '—';
  }
};

const firstLine = (text = '') => {
  const line = String(text).split('\n')[0].trim();
  return line.length > 100 ? line.slice(0, 97) + '…' : line || '(no description)';
};

const buildCopilotMarkdown = (report) => {
  if (!report) return '';
  const sys = report.systemInfo || {};
  const title = firstLine(report.description);
  return [
    `## Bug Report — ${title}`,
    '',
    `**Report ID:** ${report.id}  |  **Status:** ${report.status || 'new'}  |  **Severity:** ${report.severity || 'low'}  |  **Category:** ${report.category || 'user_report'}`,
    `**Reporter:** ${report.userDisplayName || '(unknown)'} (${report.userEmail || 'no email'})`,
    `**Submitted:** ${formatTimestampUTC(report.createdAt)}`,
    `**Screen:** ${sys.screen || '(unknown)'}  |  **Cohort:** ${sys.cohortId || '(unknown)'}`,
    `**URL:** ${sys.url || '(unknown)'}`,
    `**Viewport:** ${sys.viewport || '?'}  |  **Platform:** ${sys.platform || '?'}  |  **Language:** ${sys.language || '?'}`,
    `**User Agent:** ${sys.userAgent || '(unknown)'}`,
    `**Screenshot:** ${report.screenshotUrl || '(none)'}`,
    '',
    '### Description',
    report.description || '(none provided)',
    '',
    '### Steps to reproduce',
    report.steps || '(none provided)',
    '',
  ].join('\n');
};

const BugReports = () => {
  const { db } = useAppServices();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [copyState, setCopyState] = useState('idle'); // idle | copied | error
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!db) return undefined;
    setLoading(true);
    const q = query(collection(db, 'bug_reports'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReports(list);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load bug reports:', err);
        setError(err.message || 'Failed to load bug reports');
        setLoading(false);
      },
    );
    return () => unsub();
  }, [db]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (statusFilter !== 'all' && (r.status || 'new') !== statusFilter) return false;
      if (severityFilter !== 'all' && (r.severity || 'low') !== severityFilter) return false;
      return true;
    });
  }, [reports, statusFilter, severityFilter]);

  const selected = useMemo(
    () => reports.find((r) => r.id === selectedId) || null,
    [reports, selectedId],
  );

  const counts = useMemo(() => {
    const c = { all: reports.length };
    STATUSES.forEach((s) => {
      c[s] = reports.filter((r) => (r.status || 'new') === s).length;
    });
    return c;
  }, [reports]);

  const handleCopy = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(buildCopilotMarkdown(selected));
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!selected || !db) return;
    setSavingStatus(true);
    try {
      await updateDoc(doc(db, 'bug_reports', selected.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status: ' + (err.message || err));
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-corporate-navy/10 rounded-lg">
          <Bug className="w-5 h-5 text-corporate-navy" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-corporate-navy dark:text-white">
            Bug Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            In-app reports from the &ldquo;Log a Bug&rdquo; button. Select one to view
            details and copy a Copilot-ready summary.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Status:
        </span>
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-corporate-navy text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {s === 'all' ? 'All' : s} ({counts[s] || 0})
          </button>
        ))}
        <span className="ml-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          Severity:
        </span>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
        >
          <option value="all">All</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader className="w-5 h-5 animate-spin mr-2" /> Loading reports…
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-4 rounded bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {filtered.length} report{filtered.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
              {filtered.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  No reports match the current filters.
                </div>
              ) : (
                filtered.map((r) => {
                  const status = r.status || 'new';
                  const severity = r.severity || 'low';
                  const isSelected = r.id === selectedId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left px-3 py-2.5 transition-colors ${
                        isSelected
                          ? 'bg-corporate-navy/5 dark:bg-corporate-navy/20'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${SEVERITY_STYLES[severity]}`}
                        >
                          {severity}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[status]}`}
                        >
                          {status}
                        </span>
                        {r.screenshotUrl ? (
                          <ImageIcon className="w-3 h-3 text-slate-400" title="Has screenshot" />
                        ) : null}
                        <span className="ml-auto text-[10px] text-slate-400">
                          {formatTimestamp(r.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-800 dark:text-slate-100 line-clamp-2">
                        {firstLine(r.description)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {r.userEmail || '(no email)'} · {r.systemInfo?.screen || 'unknown screen'}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Detail */}
          <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {!selected ? (
              <div className="p-8 text-center text-sm text-slate-500">
                Select a report to view details.
              </div>
            ) : (
              <div className="flex flex-col max-h-[70vh]">
                {/* Detail header */}
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 dark:text-white break-words">
                      {firstLine(selected.description)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      {selected.id}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-corporate-navy text-white hover:bg-corporate-navy/90 transition-colors"
                      title="Copy a Copilot-ready markdown summary to the clipboard"
                    >
                      {copyState === 'copied' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied
                        </>
                      ) : copyState === 'error' ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" /> Failed
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy for Copilot
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Status row */}
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 flex-wrap">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Status:
                  </label>
                  <select
                    value={selected.status || 'new'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={savingStatus}
                    className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {savingStatus ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
                  ) : null}
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${SEVERITY_STYLES[selected.severity || 'low']}`}>
                    {selected.severity || 'low'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {selected.category || 'user_report'}
                  </span>
                </div>

                {/* Detail body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Reporter & timing */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Reporter</div>
                      <div className="text-slate-800 dark:text-slate-100">
                        {selected.userDisplayName || '(unknown)'}
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {selected.userEmail || 'no email'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Submitted</div>
                      <div className="text-slate-800 dark:text-slate-100">
                        {formatTimestamp(selected.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Screen</div>
                      <div className="text-slate-800 dark:text-slate-100 font-mono">
                        {selected.systemInfo?.screen || '(unknown)'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Cohort</div>
                      <div className="text-slate-800 dark:text-slate-100 font-mono">
                        {selected.systemInfo?.cohortId || '(unknown)'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Viewport / Platform</div>
                      <div className="text-slate-800 dark:text-slate-100 font-mono">
                        {selected.systemInfo?.viewport || '?'} · {selected.systemInfo?.platform || '?'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 dark:text-slate-400">Language</div>
                      <div className="text-slate-800 dark:text-slate-100 font-mono">
                        {selected.systemInfo?.language || '?'}
                      </div>
                    </div>
                    {selected.systemInfo?.url ? (
                      <div className="col-span-2">
                        <div className="text-slate-500 dark:text-slate-400">URL</div>
                        <a
                          href={selected.systemInfo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-corporate-teal hover:underline break-all inline-flex items-center gap-1"
                        >
                          {selected.systemInfo.url}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    ) : null}
                    {selected.systemInfo?.userAgent ? (
                      <div className="col-span-2">
                        <div className="text-slate-500 dark:text-slate-400">User Agent</div>
                        <div className="text-slate-800 dark:text-slate-100 font-mono text-[11px] break-all">
                          {selected.systemInfo.userAgent}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Description */}
                  <div>
                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Description
                    </div>
                    <div className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                      {selected.description || '(none provided)'}
                    </div>
                  </div>

                  {/* Steps */}
                  {selected.steps ? (
                    <div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                        Steps to reproduce
                      </div>
                      <div className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap p-3 bg-slate-50 dark:bg-slate-700/50 rounded">
                        {selected.steps}
                      </div>
                    </div>
                  ) : null}

                  {/* Screenshot */}
                  {selected.screenshotUrl ? (
                    <div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1 flex items-center justify-between">
                        <span>Screenshot</span>
                        <a
                          href={selected.screenshotUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-corporate-teal hover:underline text-[11px] inline-flex items-center gap-1"
                        >
                          Open full size
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <a
                        href={selected.screenshotUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-slate-100 dark:bg-slate-700 rounded overflow-hidden border border-slate-200 dark:border-slate-600"
                      >
                        <img
                          src={selected.screenshotUrl}
                          alt="Bug report screenshot"
                          className="w-full h-auto max-h-96 object-contain bg-white dark:bg-slate-900"
                        />
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BugReports;
