// src/components/admin/KudosDashboard.jsx
//
// Admin view of the consumer Kudos sub-app traffic.
// Reads kudos_messages + kudos_chains (admin-only Firestore rules).
//
// Anonymity model: senderEmail/IP/fingerprint ARE visible here for moderation
// and abuse review, but should NEVER be surfaced to recipients in the public app.

import React, { useEffect, useMemo, useState } from 'react';
import {
  Heart, ShieldCheck, ShieldAlert, ShieldX, Link2, ExternalLink, Eye,
  RefreshCw, Loader2, Search, Download, TrendingUp, Mail, Hash,
} from 'lucide-react';
import {
  collection, query, orderBy, limit, onSnapshot,
} from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';

const DECISION_STYLES = {
  accept: {
    icon: ShieldCheck,
    label: 'Accepted',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  rewrite: {
    icon: ShieldAlert,
    label: 'Rewritten',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  reject: {
    icon: ShieldX,
    label: 'Rejected',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
};

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
    rose: 'bg-rose-500 text-white',
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

export default function KudosDashboard() {
  const { db, isAdmin } = useAppServices();
  const [messages, setMessages] = useState([]);
  const [chains, setChains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);

  // Live subscribe to kudos_messages (last 200)
  useEffect(() => {
    if (!db || !isAdmin) return undefined;
    const q = query(
      collection(db, 'kudos_messages'),
      orderBy('createdAt', 'desc'),
      limit(200),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
        setLoading(false);
      },
      (err) => {
        console.error('[KudosDashboard] messages subscribe failed', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [db, isAdmin]);

  // Live subscribe to kudos_chains (last 100, by activity)
  // NOTE: sendKudos writes `lastAt` (not `lastActivityAt`) and `depth`
  // (not `length`). Keep field names in sync with functions/index.js.
  useEffect(() => {
    if (!db || !isAdmin) return undefined;
    const q = query(
      collection(db, 'kudos_chains'),
      orderBy('lastAt', 'desc'),
      limit(100),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setChains(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('[KudosDashboard] chains subscribe failed', err),
    );
    return unsub;
  }, [db, isAdmin]);

  const stats = useMemo(() => {
    const total = messages.length;
    const accepted = messages.filter((m) => m?.moderation?.decision === 'accept').length;
    const rewritten = messages.filter((m) => m?.moderation?.decision === 'rewrite').length;
    const rejected = messages.filter((m) => m?.moderation?.decision === 'reject').length;
    const opened = messages.filter((m) => (m.openCount || 0) > 0).length;
    const forwards = messages.filter((m) => m.parentKudosId).length;
    const longestChain = chains.reduce((max, c) => Math.max(max, c.depth || 0), 0);
    const openRate = total ? Math.round((opened / total) * 100) : 0;
    const rejectRate = total ? Math.round((rejected / total) * 100) : 0;
    return { total, accepted, rewritten, rejected, opened, forwards, longestChain, openRate, rejectRate };
  }, [messages, chains]);

  const filtered = useMemo(() => {
    let list = messages;
    if (decisionFilter !== 'all') {
      list = list.filter((m) => m?.moderation?.decision === decisionFilter);
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      list = list.filter((m) =>
        (m.recipientName || '').toLowerCase().includes(s)
        || (m.recipientEmail || '').toLowerCase().includes(s)
        || (m.senderEmail || '').toLowerCase().includes(s)
        || (m.message || '').toLowerCase().includes(s)
        || (m.originalMessage || '').toLowerCase().includes(s),
      );
    }
    return list;
  }, [messages, search, decisionFilter]);

  const selected = useMemo(
    () => messages.find((m) => m.id === selectedId) || null,
    [messages, selectedId],
  );

  const exportCSV = () => {
    const headers = [
      'id', 'createdAt', 'decision', 'recipientName', 'recipientEmail',
      'message', 'originalMessage', 'senderEmail', 'senderIp',
      'chainId', 'chainPosition', 'parentKudosId', 'forwardCount', 'openCount',
    ];
    const rows = filtered.map((m) => headers.map((h) => {
      let v = m[h];
      if (h === 'createdAt') v = fmtDate(m.createdAt);
      if (h === 'decision') v = m?.moderation?.decision || '';
      if (v == null) v = '';
      v = String(v).replace(/"/g, '""');
      return `"${v}"`;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kudos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-slate-500">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-corporate-teal" />
            Kudos — Consumer App Dashboard
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Live feed of public kudos sent via{' '}
            <a
              href="https://leaderreps-kudos.web.app"
              target="_blank"
              rel="noreferrer"
              className="text-corporate-teal hover:underline inline-flex items-center gap-1"
            >
              leaderreps-kudos.web.app <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            disabled={!filtered.length}
            className="px-3 py-2 rounded-lg bg-corporate-navy text-white text-sm font-semibold hover:bg-corporate-navy/90 disabled:opacity-40 inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Heart} label="Total Kudos" value={stats.total} tone="navy" />
        <StatCard icon={Link2} label="Forwards" value={stats.forwards} sublabel={`Longest chain: ${stats.longestChain}`} tone="teal" />
        <StatCard icon={Eye} label="Open Rate" value={`${stats.openRate}%`} sublabel={`${stats.opened} opened`} tone="orange" />
        <StatCard icon={ShieldX} label="Reject Rate" value={`${stats.rejectRate}%`} sublabel={`${stats.rejected} blocked`} tone="rose" />
      </div>

      {/* Moderation breakdown */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Moderation breakdown
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
            {stats.accepted} accepted
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-semibold">
            {stats.rewritten} rewritten
          </span>
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-sm font-semibold">
            {stats.rejected} rejected
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipient, sender, or message..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <select
          value={decisionFilter}
          onChange={(e) => setDecisionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
        >
          <option value="all">All decisions</option>
          <option value="accept">Accepted</option>
          <option value="rewrite">Rewritten</option>
          <option value="reject">Rejected</option>
        </select>
        <div className="text-xs text-slate-500">
          Showing {filtered.length} of {messages.length}
        </div>
      </div>

      {/* Table + detail split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Message list */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…
            </div>
          ) : !filtered.length ? (
            <div className="p-8 text-center text-slate-500">
              No kudos {search || decisionFilter !== 'all' ? 'match your filters' : 'sent yet'}.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[600px] overflow-y-auto">
              {filtered.map((m) => {
                const decision = m?.moderation?.decision || 'accept';
                const style = DECISION_STYLES[decision] || DECISION_STYLES.accept;
                const Icon = style.icon;
                const isSelected = m.id === selectedId;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${
                      isSelected ? 'bg-corporate-teal/5 border-l-4 border-corporate-teal' : 'border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="font-semibold text-sm text-corporate-navy dark:text-white truncate">
                        → {m.recipientName || '(no name)'}
                        <span className="text-xs text-slate-400 font-normal ml-2">
                          {m.recipientEmail}
                        </span>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${style.badge}`}>
                        <Icon className="w-3 h-3" /> {style.label}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                      {m.message || m.originalMessage || '(no message)'}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span>{fmtRelative(m.createdAt)}</span>
                      {m.chainPosition > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Hash className="w-3 h-3" /> Chain #{m.chainPosition + 1}
                        </span>
                      )}
                      {(m.openCount || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <Eye className="w-3 h-3" /> {m.openCount}
                        </span>
                      )}
                      {(m.forwardCount || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-corporate-teal">
                          <Link2 className="w-3 h-3" /> {m.forwardCount} forwards
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          {!selected ? (
            <div className="text-center text-sm text-slate-400 py-12">
              Select a kudos to see the full details.
            </div>
          ) : (
            <KudosDetail kudos={selected} />
          )}
        </div>
      </div>
    </div>
  );
}

function KudosDetail({ kudos }) {
  const decision = kudos?.moderation?.decision || 'accept';
  const style = DECISION_STYLES[decision] || DECISION_STYLES.accept;
  const Icon = style.icon;
  const wasRewritten = kudos.originalMessage && kudos.message !== kudos.originalMessage;
  const viewUrl = `https://leaderreps-kudos.web.app/k/${kudos.id}`;

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full font-semibold inline-flex items-center gap-1 text-xs ${style.badge}`}>
          <Icon className="w-3 h-3" /> {style.label}
        </span>
        <span className="text-xs text-slate-400">{fmtDate(kudos.createdAt)}</span>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Recipient</div>
        <div className="font-semibold text-corporate-navy dark:text-white">{kudos.recipientName}</div>
        <div className="text-xs text-slate-500">{kudos.recipientEmail}</div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Message {wasRewritten && '(rewritten by AI)'}</div>
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
          {kudos.message}
        </div>
      </div>

      {wasRewritten && (
        <details className="text-xs">
          <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
            Show original
          </summary>
          <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
            {kudos.originalMessage}
          </div>
        </details>
      )}

      {decision === 'reject' && kudos.moderation?.concerns?.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1">Concerns</div>
          <div className="flex flex-wrap gap-1">
            {kudos.moderation.concerns.map((c, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs">{c}</span>
            ))}
          </div>
          {kudos.moderation.reason && (
            <div className="text-xs text-slate-500 mt-2">{kudos.moderation.reason}</div>
          )}
        </div>
      )}

      <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Sender (private — do NOT share)
        </div>
        <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300 font-mono">
          <div>📧 {kudos.senderEmail || '—'}</div>
          {kudos.senderIp && <div>🌐 {kudos.senderIp}</div>}
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="text-slate-500">Chain position</div>
          <div className="font-semibold">#{(kudos.chainPosition || 0) + 1}</div>
        </div>
        <div>
          <div className="text-slate-500">Forwards from this</div>
          <div className="font-semibold">{kudos.forwardCount || 0}</div>
        </div>
        <div>
          <div className="text-slate-500">Opens</div>
          <div className="font-semibold">{kudos.openCount || 0}</div>
        </div>
        <div>
          <div className="text-slate-500">Chain ID</div>
          <div className="font-mono text-[10px] truncate">{kudos.chainId || '—'}</div>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 pt-3 flex flex-wrap gap-2">
        <a
          href={viewUrl}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-lg bg-corporate-teal text-white text-xs font-semibold inline-flex items-center gap-1 hover:bg-corporate-teal/90"
        >
          <ExternalLink className="w-3 h-3" /> Open recipient view
        </a>
        <a
          href={`mailto:${kudos.recipientEmail}`}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold inline-flex items-center gap-1 hover:bg-slate-50"
        >
          <Mail className="w-3 h-3" /> Email recipient
        </a>
      </div>
    </div>
  );
}
