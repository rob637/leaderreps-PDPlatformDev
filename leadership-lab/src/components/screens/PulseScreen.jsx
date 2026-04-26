import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, Clock, Sparkles, MessageCircle, ChevronRight, Activity, Users } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import collections from '../../config/collections.js';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { SCREENS } from '../../config/navigation.js';
import { getWarRoomData } from '../../services/facilitatorService.js';

/**
 * PulseScreen — Trainer's home base.
 *
 * Cross-cohort triage feed showing what needs attention RIGHT NOW:
 *   - Members at risk (silent > 3 days)
 *   - Onboarding incomplete after kickoff
 *   - Recent reveals delivered (engagement opportunity)
 *   - Per-cohort summary with quick drill-down
 *
 * Aggregates by calling labWarRoom for each cohort the trainer can see.
 */
export default function PulseScreen() {
  const { navigate } = useNavigation();
  const [loading, setLoading] = useState(true);
  const [cohorts, setCohorts] = useState([]); // [{ cohort, members, alerts, summary }]
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load all cohorts the trainer has access to
      const ref = collection(db, collections.cohorts || 'll-cohorts');
      const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
      const cohortIds = snap.docs.map((d) => d.id);

      // 2. Fetch war-room data for each cohort in parallel
      const results = await Promise.allSettled(
        cohortIds.map((id) => getWarRoomData(id))
      );

      const loaded = results
        .map((r, i) => (r.status === 'fulfilled' ? r.value : null))
        .filter(Boolean);

      setCohorts(loaded);
    } catch (err) {
      setError(err.message || 'Failed to load Pulse');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-lab-teal" size={24} />
      </div>
    );
  }

  // --- Aggregate cross-cohort signals ---
  const allAlerts = [];
  const allMembers = [];
  let totalActive = 0;
  let totalQuiet = 0;
  let totalAtRisk = 0;
  let totalMembers = 0;

  cohorts.forEach((c) => {
    const cohortName = c.cohort?.name || 'Cohort';
    const cohortId = c.cohort?.id;
    (c.alerts || []).forEach((a) =>
      allAlerts.push({ ...a, cohortName, cohortId })
    );
    (c.members || []).forEach((m) =>
      allMembers.push({ ...m, cohortName, cohortId })
    );
    totalActive += c.summary?.active || 0;
    totalQuiet += c.summary?.quiet || 0;
    totalAtRisk += c.summary?.atRisk || 0;
    totalMembers += c.summary?.total || 0;
  });

  // Sort alerts: high severity first
  allAlerts.sort((a, b) => {
    const order = { high: 0, medium: 1, info: 2 };
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
  });

  const atRiskMembers = allMembers.filter((m) => m.engagement === 'at-risk');
  const recentReveals = allMembers.filter((m) => m.revealStatus === 'delivered');

  function goToMember(member) {
    navigate(SCREENS.MEMBER_DEEP_DIVE, {
      memberId: member.id,
      cohortId: member.cohortId,
    });
  }

  return (
    <div className="min-h-screen pb-24 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-lab-navy">Pulse</h1>
        <p className="text-sm text-stone-500 mt-1">
          What needs your attention across all cohorts.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* At-a-glance bar */}
      {totalMembers > 0 && (
        <div className="mb-6 grid grid-cols-4 gap-2">
          <StatTile label="Total" value={totalMembers} tone="navy" icon={Users} />
          <StatTile label="Active" value={totalActive} tone="teal" icon={Activity} />
          <StatTile label="Quiet" value={totalQuiet} tone="amber" icon={Clock} />
          <StatTile label="At Risk" value={totalAtRisk} tone="coral" icon={AlertTriangle} />
        </div>
      )}

      {/* Priority Alerts */}
      {allAlerts.length > 0 && (
        <Section title="Needs Action" count={allAlerts.length}>
          <div className="space-y-2">
            {allAlerts.slice(0, 8).map((a, i) => (
              <AlertRow key={i} alert={a} onClick={() => {
                const member = allMembers.find((m) => m.id === a.memberId);
                if (member) goToMember(member);
              }} />
            ))}
          </div>
        </Section>
      )}

      {/* At-Risk Members */}
      {atRiskMembers.length > 0 && (
        <Section title="Quiet > 3 Days" count={atRiskMembers.length}>
          <div className="space-y-2">
            {atRiskMembers.slice(0, 5).map((m) => (
              <MemberRow key={m.id} member={m} onClick={() => goToMember(m)} />
            ))}
          </div>
        </Section>
      )}

      {/* Recent Reveals — coaching opportunity */}
      {recentReveals.length > 0 && (
        <Section title="Reveals Delivered" count={recentReveals.length} icon={Sparkles}>
          <div className="space-y-2">
            {recentReveals.slice(0, 5).map((m) => (
              <MemberRow key={m.id} member={m} onClick={() => goToMember(m)} 
                accent="A reveal just landed — they may want to talk." />
            ))}
          </div>
        </Section>
      )}

      {/* Cohorts overview */}
      {cohorts.length > 0 && (
        <Section title="Cohorts" count={cohorts.length}>
          <div className="space-y-2">
            {cohorts.map((c) => (
              <button
                key={c.cohort.id}
                onClick={() => navigate(SCREENS.WAR_ROOM, { cohortId: c.cohort.id })}
                className="w-full glass-card p-4 flex items-center gap-3 hover:border-lab-teal/30 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-lab-navy truncate">{c.cohort.name}</div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Week {c.cohort.weekNumber} · {c.summary.total} members · {c.summary.atRisk} at risk
                  </div>
                </div>
                <ChevronRight size={18} className="text-stone-300 flex-shrink-0" />
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* Empty state */}
      {!loading && cohorts.length === 0 && (
        <div className="text-center py-16 px-4">
          <Users size={48} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500 text-sm">
            No cohorts yet. Head to <strong>Manage</strong> to create one.
          </p>
        </div>
      )}

      {!loading && cohorts.length > 0 && allAlerts.length === 0 && atRiskMembers.length === 0 && (
        <div className="glass-card p-6 text-center">
          <Sparkles size={28} className="mx-auto text-lab-teal mb-2" />
          <div className="font-semibold text-lab-navy">All quiet on the front.</div>
          <div className="text-xs text-stone-500 mt-1">
            No urgent signals. Members are engaged and tracking with the curriculum.
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

function Section({ title, count, icon: Icon, children }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2 px-1">
        {Icon && <Icon size={14} className="text-stone-400" />}
        <h2 className="text-xs font-bold tracking-widest text-stone-400 uppercase">
          {title}
        </h2>
        {count != null && (
          <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function StatTile({ label, value, tone, icon: Icon }) {
  const tones = {
    navy: 'bg-lab-navy/5 text-lab-navy',
    teal: 'bg-lab-teal/10 text-lab-teal',
    amber: 'bg-amber-50 text-amber-700',
    coral: 'bg-lab-coral/10 text-lab-coral',
  };
  return (
    <div className={`p-3 rounded-xl ${tones[tone] || tones.navy}`}>
      <div className="flex items-center gap-1 mb-1 opacity-70">
        <Icon size={12} />
        <div className="text-[9px] font-bold uppercase tracking-wider">{label}</div>
      </div>
      <div className="text-2xl font-bold leading-none">{value}</div>
    </div>
  );
}

function AlertRow({ alert, onClick }) {
  const meta = alertMeta(alert);
  return (
    <button
      onClick={onClick}
      className="w-full glass-card p-3 flex items-start gap-3 text-left hover:border-lab-teal/30 transition-colors"
    >
      <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0`}>
        <meta.Icon size={16} className={meta.fg} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-lab-navy truncate">
          {alert.name}
        </div>
        <div className="text-xs text-stone-500 truncate">
          {meta.text} · {alert.cohortName}
        </div>
      </div>
      <ChevronRight size={16} className="text-stone-300 flex-shrink-0 mt-1" />
    </button>
  );
}

function MemberRow({ member, onClick, accent }) {
  const dotColor =
    member.engagement === 'at-risk' ? 'bg-lab-coral'
    : member.engagement === 'quiet' ? 'bg-amber-400'
    : 'bg-lab-teal';
  return (
    <button
      onClick={onClick}
      className="w-full glass-card p-3 flex items-start gap-3 text-left hover:border-lab-teal/30 transition-colors"
    >
      <div className={`w-2 h-2 rounded-full ${dotColor} mt-2 flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-lab-navy truncate">
          {member.firstName}
          <span className="font-normal text-stone-400 ml-2">· {member.cohortName}</span>
        </div>
        <div className="text-xs text-stone-500 truncate">
          {accent
            ? accent
            : member.daysSinceActivity >= 999
              ? 'No activity yet'
              : `Silent ${member.daysSinceActivity}d · ${member.messagesThisWeek} msgs this week`}
        </div>
      </div>
      <MessageCircle size={16} className="text-stone-300 flex-shrink-0 mt-1" />
    </button>
  );
}

function alertMeta(alert) {
  switch (alert.type) {
    case 'onboarding-incomplete':
      return { Icon: Clock, bg: 'bg-amber-50', fg: 'text-amber-600', text: 'Onboarding incomplete' };
    case 'quiet-member':
      return { Icon: AlertTriangle, bg: 'bg-lab-coral/10', fg: 'text-lab-coral', text: `Silent ${alert.days}d` };
    case 'reveal-delivered':
      return { Icon: Sparkles, bg: 'bg-lab-teal/10', fg: 'text-lab-teal', text: 'Reveal delivered' };
    default:
      return { Icon: Activity, bg: 'bg-stone-100', fg: 'text-stone-500', text: alert.type };
  }
}
