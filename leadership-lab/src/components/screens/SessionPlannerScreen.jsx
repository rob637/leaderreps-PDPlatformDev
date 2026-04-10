import { useState, useEffect } from 'react';
import {
  Calendar, Users, MessageCircle, Lightbulb, Loader2,
  Sparkles, Clock, UserCheck, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { WEEKLY_THEMES } from '../../config/navigation.js';
import {
  getWarRoomData,
  generateSessionPlan,
} from '../../services/facilitatorService.js';

export default function SessionPlannerScreen() {
  const { userProfile } = useAuth();
  const cohortId = userProfile?.cohortId;

  const [warRoomData, setWarRoomData] = useState(null);
  const [aiPlan, setAiPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(60);

  useEffect(() => {
    if (!cohortId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await getWarRoomData(cohortId);
        if (!cancelled) setWarRoomData(data);
      } catch {
        // Will show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [cohortId]);

  async function handleGenerate() {
    if (generating || !cohortId) return;
    setGenerating(true);
    try {
      const result = await generateSessionPlan(cohortId, sessionDuration);
      setAiPlan(result);
    } catch {
      // Could show error
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-lab-teal" size={24} />
      </div>
    );
  }

  const members = warRoomData?.members || [];
  const cohort = warRoomData?.cohort;
  const summary = warRoomData?.summary;
  const weekNumber = cohort?.weekNumber || userProfile?.currentWeek || 1;
  const isAscent = weekNumber > 5;
  const theme = isAscent ? null : (WEEKLY_THEMES[Math.min(weekNumber - 1, 4)] || WEEKLY_THEMES[0]);

  const total = members.length;
  const activeMembers = members.filter((m) => m.engagement === 'active');
  const quietMembers = members.filter((m) => m.engagement === 'quiet');
  const atRiskMembers = members.filter((m) => m.engagement === 'at-risk');

  const watchList = buildWatchList(members);
  const plan = aiPlan?.plan;

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-lab-navy">Session Planner</h1>
          <p className="text-sm text-stone-500 mt-1">
            {isAscent ? `Ascent · Week ${weekNumber}` : `Week ${weekNumber}: ${theme.title}`}
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-stone-400">
          <Calendar size={14} />
          <span>Week {weekNumber}</span>
        </div>
      </div>

      {/* Cohort State */}
      <div className="glass-card p-5 mb-4">
        <h3 className="font-semibold text-lab-navy mb-2 flex items-center gap-2">
          <Users size={16} className="text-lab-teal" />
          State of the Cohort
        </h3>
        {total === 0 ? (
          <p className="text-sm text-stone-400">No cohort members loaded.</p>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2 mb-3">
              <StatBlock label="Active" value={summary?.active || activeMembers.length} total={total} />
              <StatBlock label="Quiet" value={summary?.quiet || quietMembers.length} alert />
              <StatBlock label="At Risk" value={summary?.atRisk || atRiskMembers.length} />
              <StatBlock
                label="Onboarded"
                value={summary?.onboarded || members.filter((m) => m.onboardingComplete).length}
                total={total}
                highlight
              />
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">
              <span className="font-medium">
                Energy: {getEnergyLevel(activeMembers.length, total)}
              </span>
              {' — '}
              {activeMembers.length} of {total} members are actively engaged.
              {quietMembers.length > 0 &&
                ` ${quietMembers.length} ${quietMembers.length === 1 ? 'member has' : 'members have'} gone quiet.`}
              {atRiskMembers.length > 0 &&
                ` ${atRiskMembers.length} at risk.`}
            </p>
          </>
        )}
      </div>

      {/* People to Watch */}
      {watchList.length > 0 && (
        <div className="glass-card p-5 mb-4">
          <h3 className="font-semibold text-lab-navy mb-3">People to Watch</h3>
          <div className="space-y-3">
            {watchList.map((item, i) => (
              <WatchItem
                key={i}
                name={item.name}
                engagement={item.engagement}
                note={item.note}
              />
            ))}
          </div>
        </div>
      )}

      {/* AI Session Plan Generator */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lab-navy flex items-center gap-2">
            <Sparkles size={16} className="text-lab-amber" />
            AI Session Plan
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={sessionDuration}
              onChange={(e) => setSessionDuration(Number(e.target.value))}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 text-stone-600"
            >
              <option value={30}>30 min</option>
              <option value={45}>45 min</option>
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
            </select>
            <button
              onClick={handleGenerate}
              disabled={generating || total === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-lab-teal text-white text-xs font-semibold rounded-lg disabled:opacity-50 hover:bg-lab-teal-dark transition-colors"
            >
              {generating ? (
                <Loader2 className="animate-spin" size={12} />
              ) : plan ? (
                <RefreshCw size={12} />
              ) : (
                <Sparkles size={12} />
              )}
              {generating ? 'Generating...' : plan ? 'Regenerate' : 'Generate Plan'}
            </button>
          </div>
        </div>

        {!plan && !generating && (
          <p className="text-sm text-stone-400 text-center py-4">
            Generate an AI-powered session plan based on your cohort's real data —
            tensions, experiments, engagement patterns, and growth edges.
          </p>
        )}

        {generating && (
          <div className="text-center py-8">
            <Loader2 className="animate-spin text-lab-teal mx-auto mb-2" size={24} />
            <p className="text-sm text-stone-500">
              Analyzing cohort data and designing your session...
            </p>
          </div>
        )}
      </div>

      {/* AI-Generated Session Structure */}
      {plan && !generating && (
        <>
          <div className="glass-card p-5 mb-4">
            <h3 className="font-semibold text-lab-navy mb-1 flex items-center gap-2">
              <Lightbulb size={16} className="text-lab-amber" />
              {plan.sessionTitle || 'Session Structure'}
            </h3>
            {aiPlan.weekTheme && (
              <p className="text-xs text-stone-400 mb-4">
                Week {aiPlan.weekNumber}: {aiPlan.weekTheme}
              </p>
            )}

            {/* Opening Prompt */}
            {plan.openingPrompt && (
              <div className="bg-lab-teal/5 p-3 rounded-xl mb-4">
                <p className="text-xs font-semibold text-lab-teal mb-1">OPENING PROMPT</p>
                <p className="text-sm text-stone-700 leading-relaxed italic">
                  "{plan.openingPrompt}"
                </p>
              </div>
            )}

            {/* Segments */}
            {plan.segments?.map((seg, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-lab-teal bg-lab-teal/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock size={10} />
                    {seg.duration} min
                  </span>
                  <h4 className="text-sm font-semibold text-lab-navy">{seg.title}</h4>
                  {seg.type && (
                    <span className="text-xs text-stone-400 capitalize">{seg.type}</span>
                  )}
                </div>
                <p className="text-sm text-stone-600 leading-relaxed ml-[52px]">
                  {seg.description}
                </p>
                {seg.facilitatorNotes && (
                  <p className="text-xs text-lab-amber ml-[52px] mt-1 italic">
                    Note: {seg.facilitatorNotes}
                  </p>
                )}
              </div>
            ))}

            {/* Closing Prompt */}
            {plan.closingPrompt && (
              <div className="bg-stone-50 p-3 rounded-xl mt-4">
                <p className="text-xs font-semibold text-stone-500 mb-1">CLOSING PROMPT</p>
                <p className="text-sm text-stone-700 leading-relaxed italic">
                  "{plan.closingPrompt}"
                </p>
              </div>
            )}
          </div>

          {/* Individual Check-Ins */}
          {plan.individualCheckIns?.length > 0 && (
            <div className="glass-card p-5 mb-4">
              <h3 className="font-semibold text-lab-navy mb-3 flex items-center gap-2">
                <UserCheck size={16} className="text-lab-teal" />
                Individual Check-Ins
              </h3>
              <div className="space-y-3">
                {plan.individualCheckIns.map((ci, i) => (
                  <div key={i} className="bg-stone-50 p-3 rounded-xl">
                    <p className="text-sm font-medium text-lab-navy mb-1">{ci.name}</p>
                    <p className="text-sm text-stone-600">{ci.prompt}</p>
                    {ci.watchFor && (
                      <p className="text-xs text-lab-coral mt-1 italic">
                        Watch for: {ci.watchFor}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Facilitator Prep */}
          {plan.facilitatorPrep && (
            <div className="glass-card p-5 mb-4">
              <h3 className="font-semibold text-lab-navy mb-2 flex items-center gap-2">
                <MessageCircle size={16} className="text-stone-500" />
                Facilitator Prep
              </h3>
              <p className="text-sm text-stone-600 leading-relaxed pl-4 border-l-2 border-lab-teal">
                {plan.facilitatorPrep}
              </p>
            </div>
          )}
        </>
      )}

      {/* Fallback: Manual Notes */}
      {!plan && (
        <div className="glass-card p-5">
          <h3 className="font-semibold text-lab-navy mb-3 flex items-center gap-2">
            <MessageCircle size={16} className="text-stone-500" />
            Facilitator Notes
          </h3>
          <ul className="space-y-3">
            {quietMembers.length > 0 && (
              <li className="text-sm text-stone-600 leading-relaxed pl-4 border-l-2 border-lab-coral">
                <span className="font-medium">Quiet members:</span>{' '}
                {quietMembers.map((m) => m.firstName).join(', ')}.
                Create space without calling on them directly.
              </li>
            )}
            {atRiskMembers.length > 0 && (
              <li className="text-sm text-stone-600 leading-relaxed pl-4 border-l-2 border-status-stuck">
                <span className="font-medium">At risk:</span>{' '}
                {atRiskMembers.map((m) => m.firstName).join(', ')}.
                Consider a private check-in before or after.
              </li>
            )}
            <li className="text-sm text-stone-600 leading-relaxed pl-4 border-l-2 border-lab-teal">
              {isAscent
                ? 'Ascent sessions focus on real leadership challenges. The debrief is the most important part — resist the urge to teach.'
                : `Week ${weekNumber} is about ${theme.title.toLowerCase()}. The debrief is the most important part — resist the urge to teach.`}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, total, alert, highlight }) {
  return (
    <div className="text-center">
      <p
        className={`text-lg font-bold ${
          alert ? 'text-lab-coral' : highlight ? 'text-status-breakthrough' : 'text-lab-navy'
        }`}
      >
        {value}
        {total != null && <span className="text-stone-300 text-sm">/{total}</span>}
      </p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}

function WatchItem({ name, engagement, note }) {
  const engagementColors = {
    active: 'text-status-on-track',
    quiet: 'text-status-quiet',
    'at-risk': 'text-status-stuck',
  };

  return (
    <div className="flex items-start gap-2">
      <span className={`text-lg leading-none ${engagementColors[engagement] || 'text-stone-300'}`}>●</span>
      <div>
        <p className="text-sm font-medium text-lab-navy">{name}</p>
        <p className="text-sm text-stone-600">{note}</p>
      </div>
    </div>
  );
}

function buildWatchList(members) {
  const list = [];
  members.forEach((m) => {
    if (m.engagement === 'quiet') {
      list.push({
        name: m.firstName,
        engagement: 'quiet',
        note: `Has been quiet ${m.daysSinceActivity > 1 ? `for ${m.daysSinceActivity} days` : 'recently'}. Create space without pressure.`,
      });
    } else if (m.engagement === 'at-risk') {
      list.push({
        name: m.firstName,
        engagement: 'at-risk',
        note: `At risk — ${m.daysSinceActivity} days since last activity. May need direct outreach.`,
      });
    }
  });
  return list;
}

function getEnergyLevel(active, total) {
  if (total === 0) return 'UNKNOWN';
  const ratio = active / total;
  if (ratio >= 0.8) return 'HIGH';
  if (ratio >= 0.5) return 'MODERATE';
  return 'LOW';
}
