// src/components/admin/lab/LabIdentityBuilder.jsx
//
// Lab admin dashboard for the public Leadership Identity Statement Builder.
// Reads identity_leads (admin-only Firestore rules). Displays:
//   - Lead count stats (total / 7d / 30d)
//   - Recent leads table with email, statement, voice variant
//   - CSV export
//
// No composer — leads come in organically from the public ?identity-start page.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Compass,
  ShieldAlert,
  Mail,
  TrendingUp,
  Hash,
  Loader2,
  Download,
  Search,
  RefreshCw,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { BreadcrumbNav } from '../../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../../config/breadcrumbConfig.js';
import { useAppServices } from '../../../services/useAppServices';

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

function fmtRelative(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

function StatCard({ icon: Icon, label, value, sublabel, tone = 'navy' }) {
  const tones = {
    navy: 'bg-corporate-navy text-white',
    teal: 'bg-corporate-teal text-white',
    orange: 'bg-corporate-orange text-white',
  };
  return (
    <div className={`rounded-xl p-4 shadow-card ${tones[tone]}`}>
      <div className="flex items-center gap-2 opacity-90 text-xs uppercase tracking-wider font-semibold">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="text-3xl font-extrabold mt-2">{value}</div>
      {sublabel && <div className="text-xs opacity-80 mt-1">{sublabel}</div>}
    </div>
  );
}

const VOICE_BADGE = {
  bold: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  grounded:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  aspirational:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
};

function csvEscape(value) {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function exportCsv(leads) {
  const header = ['createdAt', 'email', 'voice', 'statement', 'word', 'best', 'known', 'gap'];
  const rows = leads.map((l) => {
    const d = l.createdAt?.toDate ? l.createdAt.toDate() : null;
    return [
      d ? d.toISOString() : '',
      l.email || '',
      l.chosenKey || '',
      l.statement || '',
      l.answers?.word || '',
      l.answers?.best || '',
      l.answers?.known || '',
      l.answers?.gap || '',
    ].map(csvEscape).join(',');
  });
  const csv = [header.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `identity-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function LabIdentityBuilder() {
  const { db, isAdmin, navigate } = useAppServices();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!db || !isAdmin) return undefined;
    const q = query(
      collection(db, 'identity_leads'),
      orderBy('createdAt', 'desc'),
      limit(500),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setLeads(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('[LabIdentityBuilder] subscribe failed', err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [db, isAdmin]);

  const stats = useMemo(() => {
    const now = Date.now();
    const day = 86400000;
    let last7 = 0;
    let last30 = 0;
    leads.forEach((l) => {
      const d = l.createdAt?.toDate ? l.createdAt.toDate().getTime() : 0;
      if (!d) return;
      if (now - d <= 7 * day) last7 += 1;
      if (now - d <= 30 * day) last30 += 1;
    });
    return { total: leads.length, last7, last30 };
  }, [leads]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter((l) =>
      `${l.email || ''} ${l.statement || ''} ${l.chosenKey || ''}`
        .toLowerCase()
        .includes(s),
    );
  }, [leads, search]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">
          Access Denied
        </h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav
          items={getBreadcrumbs('lab-identity-builder')}
          navigate={navigate}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-corporate-teal/10 rounded-xl">
              <Compass className="w-6 h-6 text-corporate-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
                Identity Statement Builder
                <span className="text-sm font-semibold text-blue-600 ml-2">MVP</span>
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Lead-magnet analytics. Public flow:{' '}
                <code className="text-slate-600">/?identity-start</code>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/?identity-start"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-corporate-teal text-corporate-teal-ink text-sm font-semibold hover:bg-corporate-teal/5"
            >
              Preview public landing
            </a>
            <button
              onClick={() => exportCsv(filtered)}
              disabled={!filtered.length}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Hash}
            label="Total leads"
            value={loading ? '—' : stats.total}
            sublabel="All time"
            tone="navy"
          />
          <StatCard
            icon={TrendingUp}
            label="Last 7 days"
            value={loading ? '—' : stats.last7}
            sublabel="Rolling weekly"
            tone="teal"
          />
          <StatCard
            icon={Mail}
            label="Last 30 days"
            value={loading ? '—' : stats.last30}
            sublabel="Rolling monthly"
            tone="orange"
          />
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card p-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search email, statement, voice…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm focus:outline-none text-slate-700 dark:text-slate-200"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Leads table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-sm font-bold text-corporate-navy dark:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-corporate-teal" />
              Recent leads
              <span className="text-xs font-medium text-slate-500">
                ({filtered.length} of {leads.length})
              </span>
            </h2>
            {loading && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            )}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              {leads.length === 0
                ? 'No leads captured yet. Share the public link to start collecting.'
                : 'No leads match your search.'}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-900/40 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">When</th>
                    <th className="text-left px-4 py-2 font-semibold">Email</th>
                    <th className="text-left px-4 py-2 font-semibold">Voice</th>
                    <th className="text-left px-4 py-2 font-semibold">Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filtered.map((l) => {
                    const isExpanded = expandedId === l.id;
                    const voice = (l.chosenKey || '').toLowerCase();
                    const voiceClass =
                      VOICE_BADGE[voice] ||
                      'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
                    return (
                      <React.Fragment key={l.id}>
                        <tr
                          onClick={() =>
                            setExpandedId(isExpanded ? null : l.id)
                          }
                          className="hover:bg-slate-50 dark:hover:bg-slate-900/30 cursor-pointer"
                        >
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            <div className="font-medium text-slate-700 dark:text-slate-200">
                              {fmtRelative(l.createdAt)}
                            </div>
                            <div className="text-xs">{fmtDate(l.createdAt)}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                            {l.email || '—'}
                          </td>
                          <td className="px-4 py-3">
                            {l.chosenKey ? (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${voiceClass}`}
                              >
                                {l.chosenKey}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200 max-w-md">
                            <div className="italic line-clamp-2">
                              “{l.statement || ''}”
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50 dark:bg-slate-900/40">
                            <td colSpan={4} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                    One word
                                  </div>
                                  <div className="text-slate-700 dark:text-slate-200">
                                    {l.answers?.word || '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                    Best moment
                                  </div>
                                  <div className="text-slate-700 dark:text-slate-200">
                                    {l.answers?.best || '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                    Known for
                                  </div>
                                  <div className="text-slate-700 dark:text-slate-200">
                                    {l.answers?.known || '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
                                    Gap
                                  </div>
                                  <div className="text-slate-700 dark:text-slate-200">
                                    {l.answers?.gap || '—'}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
}
