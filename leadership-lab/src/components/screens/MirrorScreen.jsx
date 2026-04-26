import { useState, useEffect } from 'react';
import { Scan, Activity, Zap, RefreshCw, Eye, Quote, Users, AlertTriangle, Share2, BookOpen, Loader2, FlaskConical } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.js';
import { useAuth } from '../../hooks/useAuth.js';
import {
  subscribeToProfile,
  getTensions,
  getDualProfile,
  getReveals,
  getKeyEvidence,
  getChallenges,
  getReflections,
} from '../../services/profileService.js';
import { getConversations } from '../../services/conversationService.js';
import { updateProfile } from '../../services/aiService.js';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { SCREENS, WEEKLY_THEMES, TRACKS } from '../../config/navigation.js';

const BAR_COLORS = ['teal', 'amber', 'coral', 'teal', 'amber', 'coral'];

export default function MirrorScreen() {
  const { user, userProfile } = useAuth();
  const userId = userProfile?._docId || user?.uid;
  const currentWeek = userProfile?.currentWeek || 1;
  const { navigate } = useNavigation();
  const [profile, setProfile] = useState(null);
  const [reveals, setReveals] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [threeSixty, setThreeSixty] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating360, setIsCreating360] = useState(false);
  const [narrativeData, setNarrativeData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [reflections, setReflections] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [showJourney, setShowJourney] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToProfile(userId, setProfile);

    // Fetch reveals and evidence (non-realtime)
    getReveals(userId).then(setReveals).catch(() => {});
    getKeyEvidence(userId).then(setEvidence).catch(() => {});
    getConversations(userId, 50).then(setConversations).catch(() => {});
    getReflections(userId).then(setReflections).catch(() => {});
    getChallenges(userId).then(setChallenges).catch(() => {});

    // Fetch 360 summary
    const fn360 = httpsCallable(functions, 'labMy360Summary');
    fn360().then((result) => setThreeSixty(result.data)).catch(() => {});

    // Fetch growth narrative
    const fnNar = httpsCallable(functions, 'labMyNarrative');
    fnNar().then((result) => setNarrativeData(result.data)).catch(() => {});

    return () => unsubscribe();
  }, [userId]);

  const tensions = getTensions(profile);
  const dual = getDualProfile(profile);
  const hasProfile = !!(dual.presented || dual.observed || tensions.length > 0);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await updateProfile();
    } catch {
      // Silently fail — profile will update on next conversation analysis
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateNarrative = async () => {
    if (isGenerating) return;
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

  // Group activity by week for the Journey Timeline
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

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-lab-navy">The Mirror</h1>
        {hasProfile && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Re-analyze from recent conversations"
            className="p-2 text-stone-400 hover:text-lab-teal transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {!hasProfile ? (
        /* Empty state — no profile yet */
        <div className="glass-card p-8 text-center">
          <Activity className="mx-auto mb-3 text-stone-300" size={32} />
          <h2 className="font-semibold text-lab-navy mb-2">Your Mirror is Building</h2>
          <p className="text-sm text-stone-500 leading-relaxed mb-4">
            As you have conversations with your coach, patterns will emerge
            here — your tensions, your blind spots, the gap between who you
            think you are and who you actually are.
          </p>
          <button
            onClick={() => navigate(SCREENS.CONVERSATION, { mode: 'coach' })}
            className="text-sm text-lab-teal font-medium hover:underline"
          >
            Start a conversation to begin
          </button>
        </div>
      ) : (
        <>
          {/* Growth Narrative — top-of-mind storytelling */}
          {(narrativeData?.hasNarrative || (currentWeek >= 2 && narrativeData?.canGenerate)) && (
            <div className="glass-card p-6 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="text-lab-teal" size={20} />
                <h2 className="font-semibold text-lab-navy">Your Growth Narrative</h2>
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
                <div className="text-center py-6">
                  <Loader2 className="animate-spin text-lab-teal mx-auto mb-2" size={20} />
                  <p className="text-sm text-stone-400">
                    Writing your story from {currentWeek} weeks of conversations...
                  </p>
                </div>
              ) : narrativeData?.hasNarrative && narrativeData.narrative ? (
                <div className="space-y-3">
                  {narrativeData.narrative.title && (
                    <h3 className="text-base font-semibold text-lab-navy italic">
                      {narrativeData.narrative.title}
                    </h3>
                  )}
                  <div className="prose prose-sm prose-stone max-w-none">
                    {(narrativeData.narrative.narrative || '').split('\n\n').map((p, i) => (
                      <p key={i} className="text-sm text-stone-600 leading-relaxed mb-3">{p}</p>
                    ))}
                  </div>
                  {narrativeData.narrative.keyTheme && (
                    <div className="bg-lab-teal/5 rounded-lg p-3">
                      <p className="text-xs font-semibold text-lab-teal uppercase tracking-wider mb-1">
                        Central Theme
                      </p>
                      <p className="text-sm text-stone-600 italic">{narrativeData.narrative.keyTheme}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-stone-500 leading-relaxed">
                  Your story is ready to be written. Generate a narrative from your conversations to date.
                </p>
              )}
            </div>
          )}

          {/* Dual Profile */}
          {(dual.presented || dual.observed) && (
            <div className="glass-card p-6 mb-4">
              <h2 className="font-semibold text-lab-navy mb-4">Dual Profile</h2>
              <div className="grid grid-cols-1 gap-4">
                {dual.presented && (
                  <div>
                    <p className="text-xs font-semibold text-lab-teal mb-1 uppercase tracking-wider">
                      Presented Self
                    </p>
                    <p className="text-sm text-stone-600 leading-relaxed italic">
                      {dual.presented}
                    </p>
                  </div>
                )}
                {dual.observed && (
                  <div>
                    <p className="text-xs font-semibold text-lab-coral mb-1 uppercase tracking-wider">
                      Observed Self
                    </p>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {dual.observed}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tension Map */}
          <div className="glass-card p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-lab-teal" size={20} />
              <h2 className="font-semibold text-lab-navy">Your Tension Map</h2>
            </div>
            {tensions.length > 0 ? (
              <div className="space-y-4">
                {tensions.map((t, i) => (
                  <TensionBar
                    key={`${t.left}-${t.right}`}
                    left={t.left}
                    right={t.right}
                    position={t.position}
                    evidence={t.evidence}
                    color={BAR_COLORS[i % BAR_COLORS.length]}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 text-center py-4">
                Tensions will emerge as your coach learns more about you.
              </p>
            )}
          </div>

          {/* Key Insights */}
          {profile?.keyInsights?.length > 0 && (
            <div className="glass-card p-6 mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="text-lab-amber" size={20} />
                <h2 className="font-semibold text-lab-navy">Key Insights</h2>
              </div>
              <div className="space-y-3">
                {profile.keyInsights.map((item, i) => (
                  <div key={i} className="bg-lab-amber/5 rounded-xl p-3">
                    <p className="text-sm text-stone-700 font-medium">{item.insight}</p>
                    {item.evidence && (
                      <p className="text-xs text-stone-500 mt-1 italic">{item.evidence}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Growth Edges */}
          {profile?.growthEdges?.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Scan className="text-lab-teal" size={20} />
                <h2 className="font-semibold text-lab-navy">Growth Edges</h2>
              </div>
              <ul className="space-y-2">
                {profile.growthEdges.map((edge, i) => (
                  <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                    <span className="text-lab-teal mt-1 text-xs">●</span>
                    {edge}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reveals — Strategic Insights Delivered via SMS */}
          {reveals.length > 0 && (
            <div className="glass-card p-6 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="text-lab-teal" size={20} />
                <h2 className="font-semibold text-lab-navy">Reveals</h2>
              </div>
              <p className="text-xs text-stone-400 mb-3">
                Patterns your coach has surfaced — things you might not see on your own.
              </p>
              <div className="space-y-3">
                {reveals
                  .filter((r) => r.status !== 'pending')
                  .map((r) => (
                    <div key={r.id} className="bg-stone-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-lab-teal uppercase">
                          {r.type?.replace('-', ' ') || 'Reveal'}
                        </span>
                        <span className="text-xs text-stone-400">Week {r.weekNumber}</span>
                      </div>
                      <p className="text-sm text-stone-700 leading-relaxed">
                        {r.content}
                      </p>
                      {r.userResponse && (
                        <div className="mt-2 pt-2 border-t border-stone-100">
                          <p className="text-xs text-stone-400 mb-1">Your response:</p>
                          <p className="text-sm text-stone-600 italic">"{r.userResponse}"</p>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Key Evidence — What the AI Has Noticed */}
          {evidence.length > 0 && (
            <div className="glass-card p-6 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Quote className="text-stone-400" size={20} />
                <h2 className="font-semibold text-lab-navy">What We've Noticed</h2>
              </div>
              <p className="text-xs text-stone-400 mb-3">
                Significant moments from your conversations — evidence your coach is tracking.
              </p>
              <div className="space-y-3">
                {evidence.map((ev) => (
                  <div key={ev.id} className="bg-lab-amber/5 rounded-xl p-3">
                    {ev.quote && (
                      <p className="text-sm text-stone-700 italic mb-1">"{ev.quote}"</p>
                    )}
                    <p className="text-sm text-stone-600">{ev.observation}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-stone-400">Week {ev.weekNumber}</span>
                      {ev.category && (
                        <span className="text-xs text-lab-teal">{ev.category}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 360 Feedback */}
          <ThreeSixtySection
            data={threeSixty}
            isCreating={isCreating360}
            onRequest={async () => {
              setIsCreating360(true);
              try {
                const fn = httpsCallable(functions, 'labCreate360');
                const result = await fn({});
                setThreeSixty((prev) => ({
                  ...prev,
                  hasSurvey: true,
                  surveyStatus: result.data.status === 'existing' ? 'open' : 'open',
                  surveyUrl: result.data.surveyUrl,
                  responseCount: result.data.responseCount,
                }));
              } catch {
                // Silently fail
              } finally {
                setIsCreating360(false);
              }
            }}
          />

          {/* Journey Timeline — collapsible */}
          <div className="glass-card p-6 mt-4">
            <button
              onClick={() => setShowJourney((v) => !v)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="font-semibold text-lab-navy">Journey Timeline</h2>
              <span className="text-xs font-medium text-lab-teal">
                {showJourney ? 'Hide' : 'Show all 16 weeks'}
              </span>
            </button>
            {showJourney && (
              <div className="mt-4 space-y-2">
                {WEEKLY_THEMES.map((theme, idx) => {
                  const week = theme.week;
                  const prev = idx > 0 ? WEEKLY_THEMES[idx - 1] : null;
                  const showTrackHeader = !prev || prev.track !== theme.track;
                  const trackMeta = TRACKS[theme.track];
                  const weekData = weeklyMap[week];
                  const isActive = week <= currentWeek;
                  const isLast = idx === WEEKLY_THEMES.length - 1;
                  const hasData = weekData && (
                    weekData.conversations.length > 0 ||
                    weekData.reflection ||
                    weekData.challenge ||
                    weekData.reveals.length > 0
                  );

                  return (
                    <div key={week}>
                      {showTrackHeader && (
                        <div className="mt-4 mb-2 first:mt-0">
                          <p className="text-xs font-semibold text-lab-teal uppercase tracking-wider">
                            {trackMeta?.label || theme.track}
                            {trackMeta?.sublabel ? ` · ${trackMeta.sublabel}` : ''}
                          </p>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center ${
                              hasData ? 'bg-lab-teal/10' : isActive ? 'bg-stone-100' : 'bg-stone-50'
                            }`}
                          >
                            <span
                              className={`text-xs font-semibold ${
                                hasData ? 'text-lab-teal' : isActive ? 'text-stone-500' : 'text-stone-300'
                              }`}
                            >
                              {week}
                            </span>
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 flex-1 min-h-[16px] mt-1 ${hasData ? 'bg-lab-teal/20' : 'bg-stone-100'}`} />
                          )}
                        </div>
                        <div className="flex-1 pb-2">
                          <p className={`text-sm font-medium ${hasData ? 'text-lab-navy' : 'text-stone-300'}`}>
                            Week {week}: {theme?.shortTitle || ''}
                          </p>
                          {!hasData && !isActive && (
                            <p className="text-xs text-stone-300 mt-1">Ahead</p>
                          )}
                          {!hasData && isActive && (
                            <p className="text-xs text-stone-400 mt-1">No activity yet</p>
                          )}
                          {hasData && (
                            <div className="mt-1.5 space-y-1.5">
                              {weekData.reflection?.summary && (
                                <p className="text-xs text-stone-600 leading-relaxed">
                                  {weekData.reflection.summary}
                                </p>
                              )}
                              {weekData.challenge && (
                                <div className="flex items-start gap-1.5 text-xs text-stone-500">
                                  <FlaskConical size={11} className="text-lab-amber mt-0.5 flex-shrink-0" />
                                  <span>{weekData.challenge.personalizedExperiment || weekData.challenge.experiment}</span>
                                </div>
                              )}
                              {weekData.reveals.filter((r) => r.status !== 'pending').slice(0, 1).map((r) => (
                                <div key={r.id} className="flex items-start gap-1.5 text-xs text-stone-500">
                                  <Eye size={11} className="text-lab-teal mt-0.5 flex-shrink-0" />
                                  <span>{r.content}</span>
                                </div>
                              ))}
                              {weekData.conversations.length > 0 && !weekData.reflection?.summary && (
                                <p className="text-xs text-stone-400">
                                  {weekData.conversations.length} conversation{weekData.conversations.length === 1 ? '' : 's'}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TensionBar({ left, right, position, evidence, color }) {
  const colorMap = {
    teal: 'bg-lab-teal',
    amber: 'bg-lab-amber',
    coral: 'bg-lab-coral',
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-stone-600">{left}</span>
        <span className="text-xs font-medium text-stone-600">{right}</span>
      </div>
      <div className="relative h-2 bg-stone-100 rounded-full">
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${colorMap[color]} shadow-sm border-2 border-white`}
          style={{ left: `${position}%` }}
        />
      </div>
      {evidence && (
        <p className="text-xs text-stone-400 mt-1 italic">{evidence}</p>
      )}
    </div>
  );
}

function ThreeSixtySection({ data, isCreating, onRequest }) {
  // No survey yet — show invite button
  if (!data || !data.hasSurvey) {
    return (
      <div className="glass-card p-6 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="text-stone-400" size={20} />
          <h2 className="font-semibold text-lab-navy">360 Feedback</h2>
        </div>
        <p className="text-sm text-stone-500 mb-4 leading-relaxed">
          See yourself through others' eyes. Invite 3-5 people who know your leadership
          to share anonymous, honest feedback.
        </p>
        <button
          onClick={onRequest}
          disabled={isCreating}
          className="w-full py-3 bg-lab-navy text-white rounded-xl font-semibold text-sm hover:bg-lab-navy/90 transition-colors disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Request 360 Feedback'}
        </button>
      </div>
    );
  }

  // Survey is open but no results yet
  if (data.surveyStatus === 'open' && !data.summary) {
    return (
      <div className="glass-card p-6 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="text-lab-teal" size={20} />
          <h2 className="font-semibold text-lab-navy">360 Feedback</h2>
        </div>
        <p className="text-sm text-stone-500 mb-2">
          Your survey is live. {data.responseCount || 0} response{data.responseCount !== 1 ? 's' : ''} so far.
          {(data.responseCount || 0) < 3 && ' Need at least 3 for synthesis.'}
        </p>
        {data.surveyUrl && (
          <div className="mt-3">
            <p className="text-xs font-semibold text-stone-500 uppercase mb-1">Share this link:</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={data.surveyUrl}
                className="flex-1 text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-stone-600"
              />
              <button
                onClick={() => navigator.clipboard?.writeText(data.surveyUrl)}
                className="p-2 bg-lab-teal/10 text-lab-teal rounded-lg hover:bg-lab-teal/20 transition-colors"
                title="Copy link"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Results are ready
  if (data.summary) {
    const s = data.summary;
    return (
      <div className="glass-card p-6 mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-lab-teal" size={20} />
          <h2 className="font-semibold text-lab-navy">360 Feedback</h2>
          <span className="text-xs bg-lab-teal/10 text-lab-teal px-2 py-0.5 rounded-full font-medium ml-auto">
            {s.respondentCount} respondents
          </span>
        </div>

        {/* External Observed Self */}
        {s.externalObservedSelf && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
              How Others See You
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">
              {s.externalObservedSelf}
            </p>
          </div>
        )}

        {/* Gap Summary */}
        {s.gapSummary && (
          <div className="bg-lab-coral/5 rounded-lg p-3 mb-4">
            <p className="text-xs font-semibold text-lab-coral uppercase tracking-wider mb-1">
              The Gap
            </p>
            <p className="text-sm text-stone-600 leading-relaxed">{s.gapSummary}</p>
          </div>
        )}

        {/* Strengths Confirmed */}
        {s.strengthsConfirmed?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5">
              Strengths Confirmed
            </p>
            <ul className="space-y-1">
              {s.strengthsConfirmed.map((str, i) => (
                <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                  {str}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Change Requested */}
        {s.changeRequested?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1.5">
              Change Requested
            </p>
            <ul className="space-y-1">
              {s.changeRequested.map((ch, i) => (
                <li key={i} className="text-sm text-stone-600 flex items-start gap-2">
                  <span className="w-1 h-1 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                  {ch}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Blind Spot */}
        {s.blindSpot && (
          <div className="bg-stone-50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} className="text-amber-500" />
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Blind Spot
              </p>
            </div>
            <p className="text-sm text-stone-700 font-medium">{s.blindSpot}</p>
          </div>
        )}

        {/* Shadow Side */}
        {s.shadowSide && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Shadow Side
            </p>
            <p className="text-sm text-stone-600 italic">{s.shadowSide}</p>
          </div>
        )}
      </div>
    );
  }

  return null;
}
