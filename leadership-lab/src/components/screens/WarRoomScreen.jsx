import { useState, useEffect } from 'react';
import { AlertTriangle, Star, TrendingUp, Users, Loader2, Shield, Eye } from 'lucide-react';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { SCREENS, WEEKLY_THEMES } from '../../config/navigation.js';
import { getWarRoomData } from '../../services/facilitatorService.js';

export default function WarRoomScreen() {
  const { navigate } = useNavigation();
  const { userProfile } = useAuth();
  const cohortId = userProfile?.cohortId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cohortId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await getWarRoomData(cohortId);
        if (!cancelled) setData(result);
      } catch {
        // Will show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [cohortId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-lab-teal" size={24} />
      </div>
    );
  }

  if (!cohortId || !data) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-6">
        <h1 className="text-2xl font-bold text-lab-navy mb-4">War Room</h1>
        <div className="glass-card p-8 text-center">
          <Users className="mx-auto mb-3 text-stone-300" size={32} />
          <p className="text-sm text-stone-500">
            No cohort assigned yet. You will see your cohort here once a program begins.
          </p>
        </div>
      </div>
    );
  }

  const { cohort, members, alerts, summary } = data;
  const weekNumber = cohort.weekNumber || 1;
  const isAscent = weekNumber > 5;
  const theme = isAscent ? null : (WEEKLY_THEMES[Math.min(weekNumber - 1, 4)] || WEEKLY_THEMES[0]);
  const maxMessages = Math.max(1, ...members.map((m) => m.messagesThisWeek));

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-stone-500 font-medium">
            {isAscent ? `Ascent \u00b7 Week ${weekNumber}` : `Week ${weekNumber}: ${theme.title}`}
          </p>
          <h1 className="text-2xl font-bold text-lab-navy mt-1">War Room</h1>
          {cohort.name && (
            <p className="text-xs text-stone-400">{cohort.name}</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-lab-teal">
            {summary.active}/{summary.total}
          </p>
          <p className="text-xs text-stone-400">Active</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6" role="region" aria-label="Alerts">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`glass-card p-4 border-l-4 ${
                alert.severity === 'high'
                  ? 'border-l-lab-coral'
                  : 'border-l-status-breakthrough'
              }`}
            >
              <div className="flex items-start gap-2">
                {alert.severity === 'high' ? (
                  <AlertTriangle className="text-lab-coral flex-shrink-0 mt-0.5" size={16} />
                ) : alert.type === 'reveal-delivered' ? (
                  <Eye className="text-lab-teal flex-shrink-0 mt-0.5" size={16} />
                ) : (
                  <Star className="text-status-breakthrough flex-shrink-0 mt-0.5" size={16} />
                )}
                <div>
                  <p className="text-sm font-medium text-lab-navy">{alert.name}</p>
                  <p className="text-sm text-stone-600 mt-0.5">
                    {formatAlertMessage(alert)}
                  </p>
                  <p className="text-xs text-lab-teal font-medium mt-1">
                    {formatAlertAction(alert)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Grid */}
      {members.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-stone-400">No members in this cohort yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {members.map((member) => (
            <button
              key={member.id}
              onClick={() => navigate(SCREENS.MEMBER_DEEP_DIVE, { memberId: member.id })}
              className="glass-card p-4 text-left hover:shadow-card-hover transition-shadow"
              aria-label={`View details for ${member.firstName}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-lab-navy truncate mr-1">
                  {member.firstName}
                </span>
                <StatusDot engagement={member.engagement} />
              </div>
              <EngagementBar current={member.messagesThisWeek} max={maxMessages} />
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-stone-500 capitalize">
                  {member.engagement === 'at-risk' ? 'At Risk' : member.engagement}
                </p>
                {member.revealStatus !== 'none' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-lab-teal/10 text-lab-teal">
                    {member.revealStatus === 'pending' ? '💡' : '👁'}
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400 mt-1">
                {member.messagesThisWeek} msgs this week
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Cohort Overview */}
      {members.length > 0 && (
        <div className="glass-card p-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="text-lab-teal" size={18} />
            <h3 className="font-semibold text-lab-navy text-sm">Cohort Overview</h3>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-lab-teal">{summary.active}</p>
              <p className="text-xs text-stone-500">Active</p>
            </div>
            <div>
              <p className="text-lg font-bold text-lab-amber">{summary.quiet}</p>
              <p className="text-xs text-stone-500">Quiet</p>
            </div>
            <div>
              <p className="text-lg font-bold text-lab-coral">{summary.atRisk}</p>
              <p className="text-xs text-stone-500">At Risk</p>
            </div>
            <div>
              <p className="text-lg font-bold text-stone-600">
                {summary.onboarded}/{summary.total}
              </p>
              <p className="text-xs text-stone-500">Onboarded</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusDot({ engagement }) {
  const colorMap = {
    active: 'bg-status-on-track',
    quiet: 'bg-status-quiet',
    'at-risk': 'bg-status-stuck',
  };
  const labelMap = {
    active: 'Active',
    quiet: 'Quiet',
    'at-risk': 'At Risk',
  };
  const label = labelMap[engagement] || 'Unknown';
  return (
    <span
      className={`status-dot ${colorMap[engagement] || 'bg-stone-300'}`}
      role="img"
      aria-label={`Status: ${label}`}
    />
  );
}

function EngagementBar({ current, max }) {
  const pct = Math.min((current / max) * 100, 100);
  return (
    <div
      className="h-1.5 bg-stone-100 rounded-full overflow-hidden"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Engagement: ${current} of ${max} messages`}
    >
      <div
        className="h-full bg-lab-teal rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function formatAlertMessage(alert) {
  switch (alert.type) {
    case 'quiet-member':
      return `Hasn't responded in ${alert.days} days.`;
    case 'onboarding-incomplete':
      return 'Has not completed onboarding yet.';
    case 'reveal-delivered':
      return 'A reveal was delivered — watch for their response.';
    default:
      return 'Needs attention.';
  }
}

function formatAlertAction(alert) {
  switch (alert.type) {
    case 'quiet-member':
      return 'Send a personal text.';
    case 'onboarding-incomplete':
      return 'Follow up to ensure they complete onboarding.';
    case 'reveal-delivered':
      return 'Check in on how they received it.';
    default:
      return '';
  }
}
