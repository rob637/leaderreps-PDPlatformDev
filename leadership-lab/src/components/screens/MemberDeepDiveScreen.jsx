import { useState, useEffect } from 'react';
import {
  ArrowLeft, Send, Sliders, Loader2, User, Eye, Zap,
  FlaskConical, Quote, MessageCircle, X, Check, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { getMemberDeepDive, sendText, getConversation } from '../../services/facilitatorService.js';

export default function MemberDeepDiveScreen() {
  const { goBack, screenParams } = useNavigation();
  const { userProfile } = useAuth();
  const memberId = screenParams?.memberId;
  const cohortId = userProfile?.cohortId;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textMessage, setTextMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [expandedConvo, setExpandedConvo] = useState(null);
  const [convoMessages, setConvoMessages] = useState([]);
  const [loadingConvo, setLoadingConvo] = useState(false);

  useEffect(() => {
    if (!memberId || !cohortId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const result = await getMemberDeepDive(cohortId, memberId);
        if (!cancelled) setData(result);
      } catch {
        // Will show empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [memberId, cohortId]);

  async function handleSendText() {
    if (!textMessage.trim() || sending) return;
    setSending(true);
    try {
      await sendText(cohortId, memberId, textMessage.trim());
      setSent(true);
      setTextMessage('');
      setTimeout(() => {
        setShowTextModal(false);
        setSent(false);
      }, 1500);
    } catch {
      // Could show error toast
    } finally {
      setSending(false);
    }
  }

  async function toggleConversation(convoId) {
    if (expandedConvo === convoId) {
      setExpandedConvo(null);
      setConvoMessages([]);
      return;
    }
    setExpandedConvo(convoId);
    setLoadingConvo(true);
    try {
      const result = await getConversation(cohortId, memberId, convoId);
      setConvoMessages(result.messages || []);
    } catch {
      setConvoMessages([{ role: 'system', content: 'Failed to load conversation.' }]);
    } finally {
      setLoadingConvo(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-lab-teal" size={24} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-6">
        <button onClick={goBack} className="text-stone-500 hover:text-lab-navy mb-4">
          <ArrowLeft size={20} />
        </button>
        <div className="glass-card p-8 text-center">
          <User className="mx-auto mb-3 text-stone-300" size={32} />
          <p className="text-sm text-stone-500">Member not found.</p>
        </div>
      </div>
    );
  }

  const { member, leadershipProfile: profile, reflections, challenges, reveals, keyEvidence, recentConversations } = data;

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={goBack} className="text-stone-500 hover:text-lab-navy">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-lab-navy">{member.firstName}</h1>
          <p className="text-sm text-stone-500">
            {(member.currentWeek || 1) > 6
              ? `Ascent \u00b7 Week ${member.currentWeek}`
              : `Week ${member.currentWeek || 1} of 6`}
            {member.onboardingComplete ? '' : ' \u00b7 Not onboarded'}
          </p>
        </div>
      </div>

      {/* Dual Profile */}
      {profile ? (
        <div className="glass-card p-5 mb-4">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Dual Profile
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-lab-teal mb-2">PRESENTED SELF</p>
              <p className="text-sm text-stone-600 italic leading-relaxed">
                {profile.presentedSelf || 'Not yet established.'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-lab-coral mb-2">OBSERVED SELF</p>
              <p className="text-sm text-stone-600 leading-relaxed">
                {profile.observedSelf || 'Not yet observed.'}
              </p>
            </div>
          </div>

          {/* Tensions */}
          {profile.tensions?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-500 mb-2">TENSIONS</p>
              <div className="space-y-2">
                {profile.tensions.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-lab-teal font-medium">{t.left}</span>
                    <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-lab-coral rounded-full"
                        style={{ width: `${t.position || 50}%` }}
                      />
                    </div>
                    <span className="text-lab-coral font-medium">{t.right}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coaching Approach */}
          {profile.coachingApproach && (
            <div className="mt-4 pt-4 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-500 mb-1">COACHING APPROACH</p>
              <p className="text-sm text-stone-700 leading-relaxed">
                {profile.coachingApproach}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card p-5 mb-4 text-center">
          <p className="text-sm text-stone-400">
            Leadership Profile not yet established. This member may not have completed onboarding.
          </p>
        </div>
      )}

      {/* Growth Edges */}
      {profile?.growthEdges?.length > 0 && (
        <div className="glass-card p-5 mb-4">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Growth Edges
          </h3>
          <div className="space-y-2">
            {profile.growthEdges.map((edge, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-lab-coral mt-1.5 flex-shrink-0" />
                <p className="text-sm text-stone-600">
                  {typeof edge === 'string' ? edge : edge.text || edge.edge}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reveals */}
      {reveals?.length > 0 && (
        <div className="glass-card p-5 mb-4">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye size={14} className="text-lab-teal" />
            Reveals
          </h3>
          <div className="space-y-3">
            {reveals.map((reveal, i) => (
              <div key={reveal.id || i} className="bg-stone-50 p-3 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-lab-teal uppercase">
                    {reveal.type?.replace('-', ' ')}
                  </span>
                  <span className="text-xs text-stone-400">Week {reveal.weekNumber}</span>
                  <RevealStatusBadge status={reveal.status} />
                </div>
                <p className="text-sm text-stone-700 leading-relaxed">{reveal.content}</p>
                {reveal.userResponse && (
                  <p className="text-sm text-stone-500 mt-2 italic border-l-2 border-lab-teal pl-2">
                    "{reveal.userResponse}"
                  </p>
                )}
                {reveal.rationale && (
                  <p className="text-xs text-stone-400 mt-1">
                    Rationale: {reveal.rationale}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenges / Experiments */}
      {challenges?.length > 0 && (
        <div className="glass-card p-5 mb-4">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FlaskConical size={14} className="text-lab-amber" />
            Experiments
          </h3>
          <div className="space-y-3">
            {challenges.map((ch, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-lab-amber/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-lab-amber">{ch.weekNumber}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-lab-navy">{ch.theme}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      ch.status === 'completed' ? 'bg-green-100 text-green-700' :
                      ch.status === 'in-progress' ? 'bg-lab-teal/10 text-lab-teal' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {ch.status}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600">{ch.experiment}</p>
                  {ch.aiObservation && (
                    <p className="text-xs text-stone-400 mt-1 italic">{ch.aiObservation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Evidence */}
      {keyEvidence?.length > 0 && (
        <div className="glass-card p-5 mb-4">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Quote size={14} className="text-stone-400" />
            Key Evidence
          </h3>
          <div className="space-y-3">
            {keyEvidence.map((ev, i) => (
              <div key={i} className="bg-lab-amber/5 p-3 rounded-xl">
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

      {/* Weekly Reflections */}
      {reflections?.length > 0 && (
        <div className="glass-card p-5 mb-4">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
            Weekly Journey
          </h3>
          <div className="space-y-4">
            {reflections.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-lab-teal/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-lab-teal">{r.weekNumber}</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-sm text-stone-600 leading-relaxed">{r.summary}</p>
                  <p className="text-xs text-stone-400 mt-1">
                    {r.conversationCount} conversation{r.conversationCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Conversations */}
      {recentConversations?.length > 0 && (
        <div className="glass-card p-5 mb-4">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MessageCircle size={14} className="text-stone-400" />
            Recent Conversations
          </h3>
          <div className="space-y-2">
            {recentConversations.slice(0, 10).map((c) => (
              <div key={c.id}>
                <button
                  onClick={() => toggleConversation(c.id)}
                  className="w-full flex items-start gap-2 py-2 border-b border-stone-50 last:border-0 text-left hover:bg-stone-50 rounded-lg px-1 transition-colors"
                >
                  <span className="text-xs text-stone-400 uppercase mt-0.5 min-w-[50px]">
                    {getModeLabel(c.mode)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-stone-600 truncate">{c.lastMessage || 'No messages'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-stone-400">
                        {c.channel === 'sms' ? '📱' : '💻'} {c.messageCount} msgs
                      </span>
                      {c.interactionType && (
                        <span className="text-xs text-stone-300">{c.interactionType}</span>
                      )}
                    </div>
                  </div>
                  {expandedConvo === c.id
                    ? <ChevronUp size={16} className="text-stone-400 mt-1" />
                    : <ChevronDown size={16} className="text-stone-400 mt-1" />}
                </button>
                {expandedConvo === c.id && (
                  <div className="bg-stone-50 rounded-xl p-3 mt-1 mb-2 max-h-96 overflow-y-auto">
                    {loadingConvo ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="animate-spin text-lab-teal" size={18} />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {convoMessages.map((m, i) => (
                          <div
                            key={i}
                            className={`text-sm leading-relaxed ${
                              m.role === 'user'
                                ? 'text-lab-navy font-medium'
                                : m.role === 'system'
                                  ? 'text-red-500 italic'
                                  : 'text-stone-600'
                            }`}
                          >
                            <span className="text-xs text-stone-400 uppercase mr-1">
                              {m.role === 'user' ? member.firstName : 'Coach'}:
                            </span>
                            {m.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowTextModal(true)}
          className="flex-1 py-3 bg-lab-teal text-white font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-lab-teal-dark transition-colors"
        >
          <Send size={16} />
          Send Personal Text
        </button>
        <button className="py-3 px-4 bg-stone-100 text-stone-600 font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors">
          <Sliders size={16} />
          Adjust AI
        </button>
      </div>

      {/* Send Text Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lab-navy">
                Text {member.firstName}
              </h3>
              <button
                onClick={() => { setShowTextModal(false); setSent(false); }}
                className="text-stone-400 hover:text-stone-600"
              >
                <X size={20} />
              </button>
            </div>
            {sent ? (
              <div className="text-center py-6">
                <Check className="mx-auto text-lab-teal mb-2" size={32} />
                <p className="text-sm text-stone-600">Message sent!</p>
              </div>
            ) : (
              <>
                <textarea
                  value={textMessage}
                  onChange={(e) => setTextMessage(e.target.value)}
                  placeholder="Write a personal message..."
                  maxLength={500}
                  rows={4}
                  className="w-full border border-stone-200 rounded-xl p-3 text-sm text-stone-700 resize-none focus:outline-none focus:ring-2 focus:ring-lab-teal/30"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-stone-400">
                    {textMessage.length}/500
                  </span>
                  <button
                    onClick={handleSendText}
                    disabled={!textMessage.trim() || sending}
                    className="px-4 py-2 bg-lab-teal text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Send size={14} />
                    )}
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RevealStatusBadge({ status }) {
  const styles = {
    pending: 'bg-lab-amber/10 text-lab-amber',
    delivered: 'bg-lab-teal/10 text-lab-teal',
    acknowledged: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded-full ${styles[status] || 'bg-stone-100 text-stone-500'}`}>
      {status}
    </span>
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
  return labels[mode] || mode || 'Session';
}
