import { useState, useEffect } from 'react';
import { BookOpen, Loader2, FlaskConical, Eye, Quote, CloudSun, TrendingUp, Target } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.js';
import { useAuth } from '../../hooks/useAuth.js';
import { getConversations } from '../../services/conversationService.js';
import {
  getLeadershipProfile,
  getReflections,
  getChallenges,
  getReveals,
  getKeyEvidence,
} from '../../services/profileService.js';
import { WEEKLY_THEMES } from '../../config/navigation.js';

export default function StoryScreen() {
  const { user, userProfile } = useAuth();
  const currentWeek = userProfile?.currentWeek || 1;
  const isAscent = userProfile?.phase === 'ascent';

  const [conversations, setConversations] = useState([]);
  const [profile, setProfile] = useState(null);
  const [reflections, setReflections] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [reveals, setReveals] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [weatherReports, setWeatherReports] = useState([]);
  const [narrativeData, setNarrativeData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const promises = [
          getConversations(user.uid, 50),
          getLeadershipProfile(user.uid),
          getReflections(user.uid),
          getChallenges(user.uid),
          getReveals(user.uid),
          getKeyEvidence(user.uid),
        ];

        const [convos, lp, refl, chall, rev, ev] = await Promise.all(promises);
        if (cancelled) return;
        setConversations(convos);
        setProfile(lp);
        setReflections(refl);
        setChallenges(chall);
        setReveals(rev);
        setEvidence(ev);

        // Load growth narrative
        try {
          const fnNarrative = httpsCallable(functions, 'labMyNarrative');
          const narrativeResult = await fnNarrative();
          if (!cancelled) setNarrativeData(narrativeResult.data);
        } catch {
          // Narrative is supplemental
        }

        // Load weather reports if in ascent phase
        if (isAscent) {
          try {
            const fn = httpsCallable(functions, 'labMyWeatherReports');
            const result = await fn();
            if (!cancelled) setWeatherReports(result.data.reports || []);
          } catch {
            // Weather reports are supplemental — don't block the screen
          }
        }
      } catch {
        // Will show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const handleGenerateNarrative = async () => {
    setIsGenerating(true);
    try {
      const fn = httpsCallable(functions, 'labGenerateNarrative');
      const result = await fn();
      setNarrativeData({
        hasNarrative: true,
        canGenerate: true,
        narrative: result.data,
      });
    } catch {
      // Silently fail
    } finally {
      setIsGenerating(false);
    }
  };

  // Group data by week
  const weeklyMap = {};
  conversations.forEach((c) => {
    const w = c.weekNumber || 1;
    if (!weeklyMap[w]) weeklyMap[w] = { conversations: [], reflection: null, challenge: null, reveals: [], evidence: [] };
    weeklyMap[w].conversations.push(c);
  });
  reflections.forEach((r) => {
    const w = r.weekNumber;
    if (!weeklyMap[w]) weeklyMap[w] = { conversations: [], reflection: null, challenge: null, reveals: [], evidence: [] };
    weeklyMap[w].reflection = r;
  });
  challenges.forEach((ch) => {
    const w = ch.weekNumber;
    if (!weeklyMap[w]) weeklyMap[w] = { conversations: [], reflection: null, challenge: null, reveals: [], evidence: [] };
    weeklyMap[w].challenge = ch;
  });
  reveals.forEach((r) => {
    const w = r.weekNumber;
    if (!weeklyMap[w]) weeklyMap[w] = { conversations: [], reflection: null, challenge: null, reveals: [], evidence: [] };
    weeklyMap[w].reveals.push(r);
  });
  evidence.forEach((ev) => {
    const w = ev.weekNumber;
    if (!weeklyMap[w]) weeklyMap[w] = { conversations: [], reflection: null, challenge: null, reveals: [], evidence: [] };
    weeklyMap[w].evidence.push(ev);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-lab-teal" size={24} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold text-lab-navy mb-2">Your Story</h1>
      <p className="text-sm text-stone-500 mb-6">
        Your leadership growth narrative — written from your real journey.
      </p>

      {/* Growth Narrative */}
      <div className="glass-card p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-lab-teal" size={20} />
          <h2 className="font-semibold text-lab-navy">Growth Narrative</h2>
          {narrativeData?.canGenerate && (
            <button
              onClick={handleGenerateNarrative}
              disabled={isGenerating}
              className="ml-auto text-xs font-medium text-lab-teal hover:underline disabled:opacity-50"
            >
              {isGenerating ? 'Writing...' : narrativeData?.hasNarrative ? 'Regenerate' : 'Generate'}
            </button>
          )}
        </div>

        {isGenerating ? (
          <div className="text-center py-8">
            <Loader2 className="animate-spin text-lab-teal mx-auto mb-3" size={24} />
            <p className="text-sm text-stone-400">
              Writing your story from {currentWeek} weeks of conversations, experiments, and reveals...
            </p>
          </div>
        ) : narrativeData?.hasNarrative && narrativeData.narrative ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-lab-navy italic">
              {narrativeData.narrative.title}
            </h3>
            <div className="prose prose-sm prose-stone max-w-none">
              {narrativeData.narrative.narrative.split('\n\n').map((paragraph, i) => (
                <p key={i} className="text-sm text-stone-600 leading-relaxed mb-3">
                  {paragraph}
                </p>
              ))}
            </div>
            {narrativeData.narrative.keyTheme && (
              <div className="bg-lab-teal/5 rounded-lg p-3 mt-3">
                <p className="text-xs font-semibold text-lab-teal uppercase tracking-wider mb-1">
                  Central Theme
                </p>
                <p className="text-sm text-stone-600 italic">
                  {narrativeData.narrative.keyTheme}
                </p>
              </div>
            )}
            {narrativeData.narrative.unresolved && (
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  What Remains
                </p>
                <p className="text-sm text-stone-600">
                  {narrativeData.narrative.unresolved}
                </p>
              </div>
            )}
          </div>
        ) : profile ? (
          /* Fallback to basic profile summary if no AI narrative yet */
          <div className="space-y-3">
            {profile.presentedSelf && (
              <div>
                <p className="text-xs font-semibold text-lab-teal uppercase mb-1">
                  Who You Say You Are
                </p>
                <p className="text-sm text-stone-600 leading-relaxed italic">
                  {profile.presentedSelf}
                </p>
              </div>
            )}
            {profile.observedSelf && (
              <div>
                <p className="text-xs font-semibold text-lab-coral uppercase mb-1">
                  What We've Observed
                </p>
                <p className="text-sm text-stone-600 leading-relaxed">
                  {profile.observedSelf}
                </p>
              </div>
            )}
            {profile.corePatterns?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase mb-1">
                  Core Patterns
                </p>
                <ul className="space-y-1">
                  {profile.corePatterns.map((p, i) => (
                    <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-lab-teal mt-1.5 flex-shrink-0" />
                      {typeof p === 'string' ? p : p.text || p.pattern}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {currentWeek >= 2 && (
              <button
                onClick={handleGenerateNarrative}
                disabled={isGenerating}
                className="w-full mt-3 py-3 bg-lab-navy text-white rounded-xl font-semibold text-sm hover:bg-lab-navy/90 transition-colors disabled:opacity-50"
              >
                Generate Your Growth Narrative
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-stone-400">
            <p className="text-sm leading-relaxed max-w-xs mx-auto">
              Your growth narrative will begin forming after your first few conversations.
              Every exchange, every experiment, every moment of honesty contributes to this story.
            </p>
            <p className="text-xs text-stone-400 mt-4">
              It becomes undeniable by Graduation.
            </p>
          </div>
        )}
      </div>

      {/* Journey Timeline */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-lab-navy mb-4">Journey Timeline</h3>
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((week) => {
            const theme = WEEKLY_THEMES[week - 1];
            const weekData = weeklyMap[week];
            const isActive = week <= currentWeek;
            const hasData = weekData && (
              weekData.conversations.length > 0 ||
              weekData.reflection ||
              weekData.challenge ||
              weekData.reveals.length > 0
            );

            return (
              <div key={week} className="flex items-start gap-3">
                {/* Week indicator */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      hasData
                        ? 'bg-lab-teal/10'
                        : isActive
                          ? 'bg-stone-100'
                          : 'bg-stone-50'
                    }`}
                  >
                    <span
                      className={`text-xs font-semibold ${
                        hasData
                          ? 'text-lab-teal'
                          : isActive
                            ? 'text-stone-500'
                            : 'text-stone-300'
                      }`}
                    >
                      {week}
                    </span>
                  </div>
                  {week < 5 && (
                    <div className={`w-0.5 flex-1 min-h-[16px] mt-1 ${hasData ? 'bg-lab-teal/20' : 'bg-stone-100'}`} />
                  )}
                </div>

                {/* Week content */}
                <div className="flex-1 pb-2">
                  <p
                    className={`text-sm font-medium ${
                      hasData ? 'text-lab-navy' : 'text-stone-300'
                    }`}
                  >
                    Week {week}: {theme?.shortTitle || ''}
                  </p>

                  {!hasData && !isActive && (
                    <p className="text-xs text-stone-300 mt-1">Ahead</p>
                  )}

                  {!hasData && isActive && (
                    <p className="text-xs text-stone-400 mt-1">No activity yet</p>
                  )}

                  {hasData && (
                    <div className="mt-2 space-y-2">
                      {/* Weekly reflection summary */}
                      {weekData.reflection?.summary && (
                        <p className="text-sm text-stone-600 leading-relaxed">
                          {weekData.reflection.summary}
                        </p>
                      )}

                      {/* Experiment */}
                      {weekData.challenge && (
                        <div className="flex items-start gap-2 bg-lab-amber/5 rounded-lg p-2">
                          <FlaskConical size={12} className="text-lab-amber mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-stone-600">
                              <span className="font-medium">Experiment:</span>{' '}
                              {weekData.challenge.personalizedExperiment || weekData.challenge.experiment}
                            </p>
                            {weekData.challenge.status && (
                              <span className={`text-xs mt-0.5 inline-block px-1.5 py-0.5 rounded ${
                                weekData.challenge.status === 'completed' ? 'bg-green-100 text-green-700' :
                                weekData.challenge.status === 'in-progress' ? 'bg-lab-teal/10 text-lab-teal' :
                                'bg-stone-100 text-stone-500'
                              }`}>
                                {weekData.challenge.status}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Reveals */}
                      {weekData.reveals
                        .filter((r) => r.status !== 'pending')
                        .map((r) => (
                          <div key={r.id} className="flex items-start gap-2 bg-stone-50 rounded-lg p-2">
                            <Eye size={12} className="text-lab-teal mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-stone-600">{r.content}</p>
                              {r.userResponse && (
                                <p className="text-xs text-stone-400 mt-1 italic">
                                  You said: "{r.userResponse}"
                                </p>
                              )}
                            </div>
                          </div>
                        ))}

                      {/* Key evidence quotes */}
                      {weekData.evidence.slice(0, 2).map((ev, i) => (
                        <div key={ev.id || i} className="flex items-start gap-2">
                          <Quote size={10} className="text-stone-300 mt-1 flex-shrink-0" />
                          <p className="text-xs text-stone-500 italic">
                            {ev.quote || ev.observation}
                          </p>
                        </div>
                      ))}

                      {/* Conversation count */}
                      {weekData.conversations.length > 0 && !weekData.reflection?.summary && (
                        <div className="mt-1 space-y-1">
                          {weekData.conversations.slice(0, 3).map((c) => (
                            <p key={c.id} className="text-xs text-stone-500">
                              {getModeLabel(c.mode)} — {getConversationBrief(c)}
                            </p>
                          ))}
                          {weekData.conversations.length > 3 && (
                            <p className="text-xs text-stone-400">
                              +{weekData.conversations.length - 3} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weather Reports — Ascent Phase */}
      {weatherReports.length > 0 && (
        <div className="glass-card p-6 mt-4">
          <div className="flex items-center gap-2 mb-4">
            <CloudSun className="text-lab-teal" size={20} />
            <h3 className="font-semibold text-lab-navy">Leadership Weather Reports</h3>
          </div>
          <div className="space-y-4">
            {weatherReports.map((report) => (
              <div key={report.id} className="border border-stone-100 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lab-navy text-sm">
                    {report.weatherEmoji} {report.month}
                  </h4>
                </div>

                {/* Climate */}
                <p className="text-sm text-stone-600 leading-relaxed">{report.climate}</p>

                {/* Forecast */}
                {report.forecast && (
                  <div className="bg-blue-50/50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                      Forecast
                    </p>
                    <p className="text-sm text-stone-600">{report.forecast}</p>
                  </div>
                )}

                {/* Growth Signals */}
                {report.growthSignals?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1 mb-1.5">
                      <TrendingUp size={12} className="text-green-500" />
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">
                        Growth Signals
                      </p>
                    </div>
                    <ul className="space-y-1">
                      {report.growthSignals.map((signal, i) => (
                        <li key={i} className="text-xs text-stone-600 flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-green-400 mt-1.5 flex-shrink-0" />
                          {signal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Active Tensions */}
                {report.activeTensions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
                      Active Tensions
                    </p>
                    <ul className="space-y-1">
                      {report.activeTensions.map((tension, i) => (
                        <li key={i} className="text-xs text-stone-500 flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-stone-300 mt-1.5 flex-shrink-0" />
                          {tension}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommended Focus */}
                {report.recommendedFocus && (
                  <div className="flex items-start gap-2 bg-lab-teal/5 rounded-lg p-3">
                    <Target size={14} className="text-lab-teal mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-lab-teal uppercase tracking-wider mb-0.5">
                        This Month's Focus
                      </p>
                      <p className="text-sm text-stone-600">{report.recommendedFocus}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getModeLabel(mode) {
  const labels = {
    coach: 'Coach',
    practice: 'Practice',
    mirror: 'Mirror',
    debrief: 'Debrief',
    onboarding: 'Onboarding',
  };
  return labels[mode] || 'Session';
}

function getConversationBrief(conversation) {
  if (conversation.summary) return conversation.summary;
  const msgs = conversation.messages || [];
  const lastUser = [...msgs].reverse().find((m) => m.role === 'user');
  if (lastUser) {
    const t = lastUser.content;
    return t.length > 80 ? t.slice(0, 80) + '…' : t;
  }
  return 'Conversation';
}
