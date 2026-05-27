// src/components/lab/ManagerMultiplierDemo.jsx
//
// LeaderReps Lab — Manager Multiplier (Combo A MVP demo)
//
// Demo-only: admin-gated, fully client-side, no Firestore writes.
// Purpose: visualize the manager-invites-direct-reports referral loop
// and the funnel + reward mechanics — so we can demo to stakeholders.

import React, { useMemo, useState } from 'react';
import {
  UserPlus,
  Mail,
  Plus,
  X,
  Send,
  Gift,
  TrendingUp,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';

const SEED_INVITES = [
  { email: 'alex.kim@acme.co', name: 'Alex Kim', status: 'converted', sentDaysAgo: 18 },
  { email: 'priya.s@acme.co', name: 'Priya Sundaram', status: 'accepted', sentDaysAgo: 11 },
  { email: 'jordan.lee@acme.co', name: 'Jordan Lee', status: 'accepted', sentDaysAgo: 9 },
  { email: 'mara.r@acme.co', name: 'Mara Rodriguez', status: 'opened', sentDaysAgo: 4 },
  { email: 'theo.b@acme.co', name: 'Theo Brennan', status: 'sent', sentDaysAgo: 2 },
];

const STATUS_STYLES = {
  sent: { label: 'Sent', cls: 'bg-slate-100 text-slate-700 border-slate-200', icon: Send },
  opened: { label: 'Opened', cls: 'bg-amber-100 text-amber-700 border-amber-200', icon: Mail },
  accepted: { label: 'Accepted (trial)', cls: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
  converted: { label: 'Converted (paid)', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: TrendingUp },
};

const INVITE_CAP = 8;

const StatusPill = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.sent;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${s.cls}`}
    >
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
};

const Metric = ({ label, value, sub, accent = 'text-corporate-teal' }) => (
  <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
    <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
      {label}
    </div>
    <div className={`text-3xl font-extrabold ${accent}`}>{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
  </div>
);

const ManagerMultiplierDemo = () => {
  const { isAdmin, navigate } = useAppServices();
  const [invites, setInvites] = useState(SEED_INVITES);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [justSent, setJustSent] = useState(null);

  const sentCount = invites.length;
  const acceptedCount = invites.filter((i) =>
    ['accepted', 'converted'].includes(i.status)
  ).length;
  const convertedCount = invites.filter((i) => i.status === 'converted').length;
  const acceptanceRate = sentCount
    ? Math.round((acceptedCount / sentCount) * 100)
    : 0;
  const conversionRate = sentCount
    ? Math.round((convertedCount / sentCount) * 100)
    : 0;

  // Reward unlock thresholds (mock; real version would call processReferralAcceptance CF)
  const earnedCoachingMinutes = acceptedCount * 30;
  const earnedCoachingSessions = Math.floor(acceptedCount / 1); // 1 per accepted
  const teamDashboardUnlocked = acceptedCount >= 3;

  const handleSend = (e) => {
    e.preventDefault();
    if (!newEmail || sentCount >= INVITE_CAP) return;
    const next = {
      email: newEmail,
      name: newName || newEmail.split('@')[0],
      status: 'sent',
      sentDaysAgo: 0,
    };
    setInvites([next, ...invites]);
    setJustSent(newEmail);
    setNewEmail('');
    setNewName('');
    setTimeout(() => setJustSent(null), 2500);
  };

  const removeInvite = (email) => {
    setInvites(invites.filter((i) => i.email !== email));
  };

  // Generate the invite landing URL (mock)
  const inviteLink = useMemo(
    () => `https://leaderreps.com/r/manager-demo-token-abc123`,
    []
  );

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          The Lab is admin-only.
        </p>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-hub' },
    { label: 'LeaderReps Lab', path: 'leaderreps-lab' },
    { label: 'Manager Multiplier', path: null },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav items={breadcrumbs} navigate={navigate} />
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('leaderreps-lab')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Back to Lab"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="p-2.5 bg-corporate-teal/10 rounded-xl">
            <UserPlus className="w-6 h-6 text-corporate-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
              Manager Multiplier
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Combo A MVP — Dropbox-style "invite your direct reports → both
              sides unlock value." Demo of the funnel + reward loop.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Funnel metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Metric
            label="Invites sent"
            value={`${sentCount}/${INVITE_CAP}`}
            sub="Cap prevents spam"
          />
          <Metric
            label="Acceptance"
            value={`${acceptanceRate}%`}
            sub={`${acceptedCount} accepted`}
            accent="text-blue-600"
          />
          <Metric
            label="Trial → Paid"
            value={`${conversionRate}%`}
            sub={`${convertedCount} converted`}
            accent="text-emerald-600"
          />
          <Metric
            label="Team Plan"
            value={teamDashboardUnlocked ? 'Unlocked' : 'Locked'}
            sub="Unlocks at 3 accepted"
            accent={teamDashboardUnlocked ? 'text-emerald-600' : 'text-slate-400'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Invite form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card p-6">
            <div className="flex items-center gap-2 mb-1">
              <Plus className="w-4 h-4 text-corporate-teal" />
              <h2 className="text-base font-bold text-corporate-navy dark:text-white">
                Invite a direct report
              </h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              They get a 14-day full-access trial + 25% off the first program.
              You get +30 min of Rep AI Coach time and a coaching session credit.
            </p>

            <form
              onSubmit={handleSend}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (optional)"
                className="px-3 py-2 rounded-lg border border-slate-200 focus:border-corporate-teal focus:outline-none text-sm"
              />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="report@yourcompany.com"
                className="px-3 py-2 rounded-lg border border-slate-200 focus:border-corporate-teal focus:outline-none text-sm"
              />
              <button
                type="submit"
                disabled={sentCount >= INVITE_CAP}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send invite
              </button>
            </form>

            {justSent && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <Sparkles className="w-3 h-3" />
                Invite "sent" to {justSent} (demo)
              </div>
            )}

            <div className="mt-6">
              <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                Invite log
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {invites.map((inv) => (
                  <div
                    key={inv.email}
                    className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-corporate-navy/10 text-corporate-navy flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {inv.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-corporate-navy dark:text-white truncate">
                          {inv.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {inv.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        {inv.sentDaysAgo === 0
                          ? 'just now'
                          : `${inv.sentDaysAgo}d ago`}
                      </span>
                      <StatusPill status={inv.status} />
                      <button
                        onClick={() => removeInvite(inv.email)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400"
                        aria-label="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {invites.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-slate-400">
                    No invites yet — send your first above.
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-slate-500">
                Public invite landing (mock):{' '}
                <code className="text-slate-700">{inviteLink}</code>
              </div>
            </div>
          </div>

          {/* Rewards + team dashboard preview */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-corporate-teal/10 to-corporate-navy/5 rounded-2xl border border-corporate-teal/30 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="w-5 h-5 text-corporate-teal" />
                <h3 className="text-base font-bold text-corporate-navy">
                  Your rewards unlocked
                </h3>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Rep AI Coach minutes</span>
                  <span className="font-bold text-corporate-navy">
                    +{earnedCoachingMinutes} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Human coaching sessions</span>
                  <span className="font-bold text-corporate-navy">
                    +{earnedCoachingSessions}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Team dashboard</span>
                  <span className={`font-bold ${teamDashboardUnlocked ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {teamDashboardUnlocked ? 'Unlocked ✓' : `Locked (${acceptedCount}/3)`}
                  </span>
                </div>
              </div>
            </div>

            <div className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 ${teamDashboardUnlocked ? 'border-emerald-200' : 'border-slate-200 opacity-60'}`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-corporate-navy">
                  Team Pulse (preview)
                </h3>
              </div>
              {teamDashboardUnlocked ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Active this week</span>
                    <span className="font-bold">{Math.round(acceptedCount * 0.8)}/{acceptedCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Avg streak</span>
                    <span className="font-bold">9 days</span>
                  </div>
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500 mb-1">Win themes</div>
                    <div className="space-y-1">
                      <div className="text-xs">
                        <span className="font-semibold">Hard Conversations</span> — 12
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold">Coaching for Performance</span> — 8
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold">Delegation</span> — 5
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 pt-2 border-t border-slate-100">
                    Anonymized aggregates only. Individual reflections are never
                    shown.
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Unlocks once 3 direct reports have accepted. Privacy-respecting
                  aggregates only — no individual content.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-300">
          <div className="font-semibold text-corporate-navy dark:text-white mb-2">
            What this MVP validates
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>Will paying leaders actually invite their direct reports if asked?</li>
            <li>What's the realistic invite → accept → convert funnel shape?</li>
            <li>Does the Team Pulse preview create pull for a Team Plan upsell?</li>
          </ul>
          <div className="text-xs text-slate-400 mt-3">
            Demo only — no Firestore writes, no real emails sent. Promotion path:
            wire <code>lab_referrals</code> collection + <code>processReferralAcceptance</code> Cloud
            Function + transactional email service.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerMultiplierDemo;
