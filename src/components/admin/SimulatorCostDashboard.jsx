// src/components/admin/SimulatorCostDashboard.jsx
// Admin-only spend dashboard for the Conversation Simulator.
//
// Reads via collectionGroup('simulator-sessions') (rule:
// `/{path=**}/simulator-sessions/{sessionId}` allows admins to list).
// Provides:
//   - 7-day spend total + per-day chart
//   - Per-admin breakdown for the period
//   - Active sessions list with a kill button (sets `killed: true`,
//     which the running client sees via onSnapshot and self-terminates)

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Loader2,
  ShieldAlert,
  Square,
  RefreshCcw,
} from 'lucide-react';
import {
  collectionGroup,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase.js';
import { useAppServices } from '../../services/useAppServices';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function SimulatorCostDashboard() {
  const { isAdmin, navigate } = useAppServices();

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <ShieldAlert className="w-4 h-4" />
            Admin only
          </div>
          <p>Cost dashboard is admin-only.</p>
        </div>
      </div>
    );
  }
  return <DashboardBody navigate={navigate} />;
}

function DashboardBody({ navigate }) {
  const [sessions, setSessions] = useState(null); // null = loading
  const [activeSessions, setActiveSessions] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [killingId, setKillingId] = useState(null);

  useEffect(() => {
    loadHistory();
    // Live listener for active sessions (status == 'live' OR 'minted' but
    // recent). We just listen for the last 50 by createdAtMs DESC.
    const q = query(
      collectionGroup(db, 'simulator-sessions'),
      orderBy('createdAtMs', 'desc'),
      limit(50),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const active = [];
        const cutoffMs = Date.now() - 12 * 60 * 1000; // 12 min window
        snap.forEach((d) => {
          const data = d.data();
          if (
            (data.status === 'live' || data.status === 'minted') &&
            !data.endedAtMs &&
            (data.createdAtMs || 0) > cutoffMs
          ) {
            active.push({ id: d.id, ref: d.ref, ...data });
          }
        });
        setActiveSessions(active);
      },
      (err) => {
        console.warn('[cost dashboard] active listener error', err);
        setErrorMsg(`Could not subscribe to active sessions: ${err?.message || err}`);
      },
    );
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadHistory() {
    setErrorMsg(null);
    setSessions(null);
    try {
      const cutoff = Date.now() - SEVEN_DAYS_MS;
      const q = query(
        collectionGroup(db, 'simulator-sessions'),
        where('createdAtMs', '>=', cutoff),
        orderBy('createdAtMs', 'desc'),
        limit(500),
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      setSessions(list);
    } catch (err) {
      console.error('[cost dashboard] load failed', err);
      setErrorMsg(`Could not load sessions: ${err?.message || err}`);
      setSessions([]);
    }
  }

  async function killSession(s) {
    setKillingId(s.id);
    try {
      await updateDoc(s.ref || doc(db, s.ref?.path), {
        killed: true,
        killedAtMs: Date.now(),
      });
    } catch (err) {
      console.warn('[cost dashboard] kill failed', err);
      setErrorMsg(`Kill failed: ${err?.message || err}`);
    } finally {
      setKillingId(null);
    }
  }

  const stats = useMemo(() => computeStats(sessions || []), [sessions]);

  return (
    <div className="min-h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <BreadcrumbNav items={getBreadcrumbs('simulator-cost-dashboard')} navigate={navigate} />
      </div>

      <header className="bg-corporate-navy text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-corporate-teal">
              LeaderReps Lab · Cost Dashboard
            </div>
            <h1 className="text-2xl font-bold mt-1">Conversation Simulator — spend & kill switch</h1>
          </div>
          <button
            onClick={loadHistory}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>{errorMsg}</div>
          </div>
        )}

        <SummaryCards stats={stats} loading={sessions === null} />
        <ActiveSessionsPanel
          sessions={activeSessions}
          killingId={killingId}
          onKill={killSession}
        />
        <DailySpendChart stats={stats} />
        <PerAdminTable stats={stats} />
        <RecentSessionsTable sessions={sessions || []} loading={sessions === null} />
      </main>
    </div>
  );
}

function computeStats(sessions) {
  const days = []; // [{ dateKey, label, spend, sessionCount }]
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
    days.push({
      dateKey: dateKey(d),
      label: d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
      spend: 0,
      sessionCount: 0,
    });
  }
  const dayIndex = Object.fromEntries(days.map((d, i) => [d.dateKey, i]));

  const perAdmin = new Map(); // email -> { sessionCount, spend, lastAtMs }
  let totalSpend = 0;
  let totalSessions = 0;
  let totalAudioInSec = 0;
  let totalAudioOutSec = 0;

  sessions.forEach((s) => {
    const created = s.createdAtMs || 0;
    const cost = Number(s.costEst) || 0;
    totalSessions += 1;
    totalSpend += cost;
    totalAudioInSec += (Number(s.audioInBytes) || 0) / 32000;
    totalAudioOutSec += (Number(s.audioOutBytes) || 0) / 48000;

    const dk = dateKey(new Date(created));
    if (dayIndex[dk] != null) {
      days[dayIndex[dk]].spend += cost;
      days[dayIndex[dk]].sessionCount += 1;
    }

    const email = (s.callerEmail || 'unknown').toLowerCase();
    if (!perAdmin.has(email)) {
      perAdmin.set(email, { email, sessionCount: 0, spend: 0, lastAtMs: 0 });
    }
    const row = perAdmin.get(email);
    row.sessionCount += 1;
    row.spend += cost;
    if (created > row.lastAtMs) row.lastAtMs = created;
  });

  return {
    days,
    totalSpend,
    totalSessions,
    totalAudioInSec,
    totalAudioOutSec,
    perAdmin: [...perAdmin.values()].sort((a, b) => b.spend - a.spend),
    maxDailySpend: Math.max(0.01, ...days.map((d) => d.spend)),
  };
}

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function SummaryCards({ stats, loading }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        icon={DollarSign}
        label="7-day spend"
        value={loading ? '—' : `$${stats.totalSpend.toFixed(2)}`}
      />
      <SummaryCard
        icon={Activity}
        label="7-day sessions"
        value={loading ? '—' : String(stats.totalSessions)}
      />
      <SummaryCard
        label="Audio in (7d)"
        value={loading ? '—' : `${Math.round(stats.totalAudioInSec)}s`}
      />
      <SummaryCard
        label="Audio out (7d)"
        value={loading ? '—' : `${Math.round(stats.totalAudioOutSec)}s`}
      />
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-5">
      <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-2">
        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
        {label}
      </div>
      <div className="text-2xl font-mono font-bold mt-2 text-slate-900 dark:text-slate-100">
        {value}
      </div>
    </div>
  );
}

function ActiveSessionsPanel({ sessions, killingId, onKill }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold">Active sessions</h3>
        <span className="text-xs text-slate-500">
          {sessions.length === 0 ? 'None right now.' : `${sessions.length} live`}
        </span>
      </div>
      {sessions.length === 0 ? (
        <div className="text-sm text-slate-400 italic">
          No active sessions. (Sessions auto-expire 12 min after mint.)
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50"
            >
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm font-semibold text-slate-900">
                  {s.callerEmail || 'unknown'}
                </div>
                <div className="text-xs text-slate-600">
                  {s.scenarioId || '—'} · started{' '}
                  {s.openedAtMs
                    ? `${Math.round((Date.now() - s.openedAtMs) / 1000)}s ago`
                    : 'not opened yet'}
                </div>
              </div>
              <button
                onClick={() => onKill(s)}
                disabled={killingId === s.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-corporate-orange text-white text-xs font-semibold disabled:opacity-50"
              >
                {killingId === s.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                Kill
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailySpendChart({ stats }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-5">
      <h3 className="font-bold mb-4">Daily spend (last 7 days)</h3>
      <div className="flex items-end gap-3 h-40">
        {stats.days.map((d) => {
          const pct = (d.spend / stats.maxDailySpend) * 100;
          return (
            <div key={d.dateKey} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-xs font-mono text-slate-700 dark:text-slate-200">
                ${d.spend.toFixed(2)}
              </div>
              <div className="flex-1 w-full flex items-end">
                <div
                  className="w-full rounded-t-md bg-corporate-teal"
                  style={{ height: `${Math.max(2, pct)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 text-center">{d.label}</div>
              <div className="text-[10px] text-slate-400">
                {d.sessionCount} sess
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerAdminTable({ stats }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-5">
      <h3 className="font-bold mb-3">Per-admin spend (7 days)</h3>
      {stats.perAdmin.length === 0 ? (
        <div className="text-sm text-slate-400 italic">No sessions yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">Admin</th>
                <th className="py-2 pr-3 text-right">Sessions</th>
                <th className="py-2 pr-3 text-right">Spend</th>
                <th className="py-2 pr-3 text-right">Last session</th>
              </tr>
            </thead>
            <tbody>
              {stats.perAdmin.map((row) => (
                <tr key={row.email} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-3 font-mono">{row.email}</td>
                  <td className="py-2 pr-3 text-right font-mono">{row.sessionCount}</td>
                  <td className="py-2 pr-3 text-right font-mono">${row.spend.toFixed(2)}</td>
                  <td className="py-2 pr-3 text-right text-xs text-slate-500">
                    {row.lastAtMs ? new Date(row.lastAtMs).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RecentSessionsTable({ sessions, loading }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-5">
      <h3 className="font-bold mb-3">Recent sessions</h3>
      {loading ? (
        <div className="text-sm text-slate-400 italic flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-sm text-slate-400 italic">No sessions in the last 7 days.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-3">When</th>
                <th className="py-2 pr-3">Admin</th>
                <th className="py-2 pr-3">Scenario</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3 text-right">Duration</th>
                <th className="py-2 pr-3 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {sessions.slice(0, 100).map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 pr-3 text-xs text-slate-500">
                    {s.createdAtMs ? new Date(s.createdAtMs).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{s.callerEmail || '—'}</td>
                  <td className="py-2 pr-3 text-xs">{s.scenarioId || '—'}</td>
                  <td className="py-2 pr-3 text-xs">
                    <StatusPill status={s.status} endReason={s.endReason} killed={s.killed} />
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-xs">
                    {s.durationMs ? `${Math.round(s.durationMs / 1000)}s` : '—'}
                  </td>
                  <td className="py-2 pr-3 text-right font-mono text-xs">
                    {typeof s.costEst === 'number' ? `$${s.costEst.toFixed(4)}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, endReason, killed }) {
  const map = {
    minted: { label: 'minted', cls: 'bg-slate-100 text-slate-700' },
    live: { label: 'live', cls: 'bg-corporate-teal/20 text-corporate-teal' },
    ended: { label: endReason || 'ended', cls: 'bg-slate-100 text-slate-700' },
    error: { label: 'error', cls: 'bg-red-100 text-red-700' },
  };
  const s = map[status] || { label: status || '—', cls: 'bg-slate-100 text-slate-500' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${s.cls}`}>
      {killed ? 'killed' : s.label}
    </span>
  );
}
