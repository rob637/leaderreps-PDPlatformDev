// src/components/admin/NudgeDashboard.jsx
//
// Admin view of all Constructive Nudge traffic.
// Reads nudges_messages (admin-only Firestore rules).
//
// Sender identity (uid + email) IS visible here for moderation / abuse
// triage and should NEVER be surfaced anywhere recipients can see.

import React, { useEffect, useMemo, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Loader2,
  TrendingUp,
  Mail,
  Hash,
  MessageSquareWarning,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';

const DECISION_STYLES = {
  accept: {
    icon: ShieldCheck,
    label: 'Accepted',
    badge:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  rewrite: {
    icon: ShieldAlert,
    label: 'Rewritten',
    badge:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  reject: {
    icon: ShieldX,
    label: 'Rejected',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
};

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

export default function NudgeDashboard() {
  const { db, isAdmin } = useAppServices();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionFilter, setDecisionFilter] = useState('all');

  useEffect(() => {
    if (!db || !isAdmin) {
      setLoading(false);
      return undefined;
    }
    try {
      const q = query(
        collection(db, 'nudges_messages'),
        orderBy('createdAt', 'desc'),
        limit(200)
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        () => setLoading(false)
      );
      return () => unsub();
    } catch {
      setLoading(false);
      return undefined;
    }
  }, [db, isAdmin]);

  const stats = useMemo(() => {
    const total = messages.length;
    const accepted = messages.filter(
      (m) => m.moderation?.decision === 'accept'
    ).length;
    const rewritten = messages.filter(
      (m) => m.moderation?.decision === 'rewrite'
    ).length;
    const rejected = messages.filter(
      (m) => m.moderation?.decision === 'reject'
    ).length;
    const delivered = messages.filter((m) => m.emailDelivered).length;
    const uniqueSenders = new Set(
      messages.map((m) => m.senderUid).filter(Boolean)
    ).size;
    const uniqueRecipients = new Set(
      messages.map((m) => m.recipientEmail).filter(Boolean)
    ).size;
    return {
      total,
      accepted,
      rewritten,
      rejected,
      delivered,
      uniqueSenders,
      uniqueRecipients,
    };
  }, [messages]);

  const topIssues = useMemo(() => {
    const counts = new Map();
    messages.forEach((m) => {
      (m.selectedIssueLabels || []).forEach((label) => {
        counts.set(label, (counts.get(label) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [messages]);

  const topConcerns = useMemo(() => {
    const counts = new Map();
    messages.forEach((m) => {
      (m.moderation?.concerns || []).forEach((c) => {
        counts.set(c, (counts.get(c) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [messages]);

  const filtered = useMemo(
    () =>
      decisionFilter === 'all'
        ? messages
        : messages.filter(
            (m) => (m.moderation?.decision || '') === decisionFilter
          ),
    [messages, decisionFilter]
  );

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-rose-300 dark:border-rose-700 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-700 dark:text-rose-300">
        Admin-only.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading nudges…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={MessageSquareWarning}
          label="Total nudges"
          value={stats.total}
          sublabel={`${stats.uniqueSenders} senders · ${stats.uniqueRecipients} recipients`}
          tone="navy"
        />
        <StatCard
          icon={Mail}
          label="Delivered"
          value={stats.delivered}
          sublabel={`${stats.total ? Math.round((stats.delivered / stats.total) * 100) : 0}% delivery rate`}
          tone="teal"
        />
        <StatCard
          icon={ShieldAlert}
          label="Rewritten by AI"
          value={stats.rewritten}
          sublabel={`${stats.total ? Math.round((stats.rewritten / stats.total) * 100) : 0}% of sends`}
          tone="orange"
        />
        <StatCard
          icon={ShieldX}
          label="Blocked"
          value={stats.rejected}
          sublabel={`${stats.total ? Math.round((stats.rejected / stats.total) * 100) : 0}% rejection rate`}
          tone="rose"
        />
      </div>

      {/* Issues + concerns side-by-side */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-card">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
            <TrendingUp className="w-4 h-4" />
            Top issues flagged
          </h3>
          {topIssues.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No nudges yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {topIssues.map(([label, n]) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-slate-700 dark:text-slate-200">
                    {label}
                  </span>
                  <span className="text-xs font-bold text-corporate-teal">
                    {n}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-card">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
            <AlertTriangle className="w-4 h-4" />
            Top moderation concerns
          </h3>
          {topConcerns.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No flagged concerns yet.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {topConcerns.map(([label, n]) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-slate-700 dark:text-slate-200 font-mono text-xs">
                    {label}
                  </span>
                  <span className="text-xs font-bold text-rose-500">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Feed */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
            <Hash className="w-4 h-4" />
            Recent nudges
          </h3>
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            {['all', 'accept', 'rewrite', 'reject'].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDecisionFilter(d)}
                className={
                  decisionFilter === d
                    ? 'px-2.5 py-1 rounded-lg text-xs font-semibold bg-corporate-navy text-white'
                    : 'px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No nudges match this filter.
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-700">
            {filtered.slice(0, 50).map((m) => {
              const decision = m.moderation?.decision || 'unknown';
              const ds = DECISION_STYLES[decision];
              return (
                <li key={m.id} className="p-4 space-y-2">
                  <div className="flex items-start gap-2 flex-wrap">
                    {ds && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${ds.badge}`}
                      >
                        <ds.icon className="w-3 h-3" />
                        {ds.label}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {fmtRelative(m.createdAt)}
                    </span>
                    {m.emailDelivered ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        delivered
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {m.status || 'queued'}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto truncate max-w-[200px]">
                      {m.senderEmail || m.senderUid?.slice(0, 8) || '—'} →{' '}
                      {m.recipientEmail}
                    </span>
                  </div>

                  {m.selectedIssueLabels?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.selectedIssueLabels.map((label) => (
                        <span
                          key={label}
                          className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {m.message}
                  </p>

                  {m.moderation?.concerns?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.moderation.concerns.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-[10px] font-mono text-rose-600 dark:text-rose-300"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
