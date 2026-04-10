import { useState, useEffect } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { getCohortMembersPublic } from '../../services/cohortService.js';

export default function CohortScreen() {
  const { userProfile } = useAuth();
  const cohortId = userProfile?.cohortId;

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cohortId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await getCohortMembersPublic(cohortId);
        if (!cancelled) setMembers(data);
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

  const activeCount = members.filter((m) => m.isActive).length;

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold text-lab-navy mb-6">Your Cohort</h1>

      {/* Cohort Pulse */}
      <div className="glass-card p-5 mb-4">
        <h3 className="font-semibold text-lab-navy mb-2">This Week's Pulse</h3>
        {members.length > 0 ? (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <p className="text-lg font-bold text-lab-teal">{members.length}</p>
                <p className="text-xs text-stone-500">Members</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-lab-navy">{activeCount}</p>
                <p className="text-xs text-stone-500">Active</p>
              </div>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              {activeCount === members.length
                ? 'Everyone is engaged this week.'
                : `${activeCount} of ${members.length} members are actively participating.`}
            </p>
          </div>
        ) : (
          <p className="text-sm text-stone-600 leading-relaxed">
            Your cohort hasn't started yet. Once Foundation begins, you'll see how the
            group is experiencing each week together.
          </p>
        )}
      </div>

      {/* Member List */}
      {members.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Cohort Members
          </h3>
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="glass-card p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-lab-teal/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-lab-teal">
                      {(m.name || '?')[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-lab-navy">{m.name}</p>
                    <p className="text-xs text-stone-400">
                      Week {m.currentWeek} · {m.isActive ? 'Active' : 'Quiet'}
                    </p>
                  </div>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${m.isActive ? 'bg-status-on-track' : 'bg-status-quiet'}`}
                  role="img"
                  aria-label={m.isActive ? 'Status: Active' : 'Status: Quiet'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shared Reflections (future feature) */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Shared Reflections
        </h3>
        <div className="text-center py-12 text-stone-400">
          <Users className="mx-auto mb-3 text-stone-300" size={32} />
          <p className="text-sm">
            When cohort members share insights, they'll appear here.
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Sharing is always opt-in and curated by each person.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const colorMap = {
    'on-track': 'bg-status-on-track',
    growing: 'bg-status-growing',
    stuck: 'bg-status-stuck',
    quiet: 'bg-status-quiet',
    breakthrough: 'bg-status-breakthrough',
  };
  const labelMap = {
    'on-track': 'On Track',
    growing: 'Growing',
    stuck: 'Stuck',
    quiet: 'Quiet',
    breakthrough: 'Breakthrough',
  };
  const label = labelMap[status] || 'Unknown';
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full ${colorMap[status] || 'bg-stone-300'}`}
      role="img"
      aria-label={`Status: ${label}`}
    />
  );
}
