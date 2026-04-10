import { useState, useEffect, useRef } from 'react';
import { MessageCircle, ChevronRight, FlaskConical, Loader2, AlertCircle, Sparkles, ArrowUp, Bell } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import collections from '../../config/collections.js';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { SCREENS, WEEKLY_THEMES } from '../../config/navigation.js';
import {
  subscribeToConversations,
  getLastMessagePreview,
  formatConversationTime,
  getModeLabel,
} from '../../services/conversationService.js';
import { getChallenges } from '../../services/profileService.js';

export default function FeedScreen() {
  const { navigate } = useNavigation();
  const { user, userProfile } = useAuth();
  const userId = userProfile?._docId || user?.uid;
  const isOnboarded = userProfile?.onboardingComplete === true;
  const currentWeek = isOnboarded ? (userProfile?.currentWeek || 1) : 0;
  const theme = currentWeek > 0 ? (WEEKLY_THEMES[currentWeek - 1] || WEEKLY_THEMES[0]) : null;

  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState(null);
  const [experiment, setExperiment] = useState(null);
  const [quickInput, setQuickInput] = useState('');
  const quickInputRef = useRef(null);

  // Subscribe to conversation list
  useEffect(() => {
    if (!userId) return;
    setConversationsLoading(true);
    setConversationsError(null);
    const unsubscribe = subscribeToConversations(
      userId,
      (data) => {
        setConversations(data);
        setConversationsLoading(false);
      },
      10,
    );
    // Set a timeout to clear loading state even if no data arrives
    const timer = setTimeout(() => setConversationsLoading(false), 5000);
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, [userId]);

  // Load current week's personalized experiment
  useEffect(() => {
    if (!userId || !isOnboarded) return;
    let cancelled = false;
    (async () => {
      try {
        const challenges = await getChallenges(userId);
        const current = challenges.find((c) => c.weekNumber === currentWeek);
        if (!cancelled && current) setExperiment(current);
      } catch {
        // Fall back to defaults
      }
    })();
    return () => { cancelled = true; };
  }, [userId, currentWeek, isOnboarded]);

  // Find the onboarding conversation if it exists
  const onboardingConvo = conversations.find((c) => c.mode === 'onboarding');

  // ---------- ONBOARDING VIEW ----------
  if (!isOnboarded) {
    return (
      <div className="min-h-screen pb-20 px-4 pt-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-lab-teal/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-lab-teal" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-lab-navy mb-2">
            Welcome to Leadership Lab
          </h1>
          <p className="text-stone-500 leading-relaxed max-w-sm mx-auto">
            I&apos;m your AI coach. Before we dive in, I&apos;d like to understand how you lead. 
            Let&apos;s have a quick conversation — it&apos;ll shape your entire program.
          </p>
        </div>

        <button
          onClick={() => {
            if (onboardingConvo) {
              navigate(SCREENS.CONVERSATION, {
                conversationId: onboardingConvo.id,
                mode: 'onboarding',
              });
            } else {
              navigate(SCREENS.CONVERSATION, { mode: 'onboarding' });
            }
          }}
          className="w-full glass-card p-5 mb-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow active:scale-[0.99]"
        >
          <div className="w-12 h-12 rounded-2xl bg-lab-teal/10 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="text-lab-teal" size={24} />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-lab-navy">
              {onboardingConvo ? 'Continue Onboarding' : 'Start Your Intro'}
            </h3>
            <p className="text-sm text-stone-500 mt-0.5">
              Tell me about your role, your team, and what you&apos;re working on
            </p>
          </div>
          <ChevronRight className="text-stone-400" size={20} />
        </button>

        <div className="text-center mt-8">
          <p className="text-xs text-stone-400">
            This takes about 5 minutes. Your answers stay private.
          </p>
        </div>
      </div>
    );
  }

  const isAscent = userProfile?.phase === 'ascent' || currentWeek > 6;
  const [showEngagement, setShowEngagement] = useState(false);
  const engagementLevel = userProfile?.engagementLevel || 2;
  const engLabels = { 1: 'Light', 2: 'Medium', 3: 'Heavy' };
  const engDescs = { 1: '2-3 texts/wk', 2: '~5 texts/wk', 3: '~10 texts/wk' };

  async function updateEngagement(level) {
    if (!userId) return;
    try {
      await updateDoc(doc(db, collections.users, userId), { engagementLevel: level });
      setShowEngagement(false);
    } catch (err) {
      console.error('Failed to update engagement level:', err);
    }
  }

  // ---------- NORMAL FEED VIEW ----------
  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        {isAscent ? (
          <>
            <p className="text-sm text-stone-500 font-medium">
              Ascent &middot; Week {currentWeek}
            </p>
            <h1 className="text-2xl font-bold text-lab-navy mt-1">
              Your Ongoing Journey
            </h1>
          </>
        ) : (
          <>
            <p className="text-sm text-stone-500 font-medium">
              Week {currentWeek} of 6
            </p>
            <h1 className="text-2xl font-bold text-lab-navy mt-1">
              {theme?.title || 'Leadership Lab'}
            </h1>
          </>
        )}
        {/* Text Frequency Toggle */}
        <div className="mt-2 relative">
          <button
            onClick={() => setShowEngagement(!showEngagement)}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-lab-teal transition-colors"
          >
            <Bell size={12} />
            Texts: {engLabels[engagementLevel]} ({engDescs[engagementLevel]})
          </button>
          {showEngagement && (
            <div className="absolute top-7 left-0 z-10 bg-white rounded-xl shadow-elevated border border-stone-100 p-2 flex gap-1.5">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => updateEngagement(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    engagementLevel === lvl
                      ? 'bg-lab-teal text-white'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {engLabels[lvl]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Talk to Coach CTA */}
      <div className="glass-card p-4 mb-4">
        <p className="text-sm text-stone-600 mb-3">
          What&apos;s on your mind? I&apos;m here to help you think through whatever you&apos;re facing as a leader.
        </p>
        <div className="flex items-end gap-2">
          <textarea
            ref={quickInputRef}
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (quickInput.trim()) {
                  navigate(SCREENS.CONVERSATION, { mode: 'coach', firstMessage: quickInput.trim() });
                }
              }
            }}
            placeholder="Type a message to your coach..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:border-lab-teal focus:ring-1 focus:ring-lab-teal/20 placeholder-stone-400 bg-stone-50"
            style={{ maxHeight: '80px' }}
          />
          <button
            onClick={() => {
              if (quickInput.trim()) {
                navigate(SCREENS.CONVERSATION, { mode: 'coach', firstMessage: quickInput.trim() });
              }
            }}
            disabled={!quickInput.trim()}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-lab-teal text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-lab-teal-dark transition-colors"
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>

      {/* Current Experiment Card — Foundation only */}
      {!isAscent && (
        <button
          onClick={() => navigate(SCREENS.LAB)}
          className="w-full text-left glass-card p-5 mb-4 hover:shadow-card-hover transition-shadow"
        >
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical className="text-lab-amber" size={18} />
            <h3 className="font-semibold text-lab-navy text-sm">This Week&apos;s Experiment</h3>
            <ChevronRight className="text-stone-400 ml-auto" size={16} />
          </div>
          <p className="text-stone-700 leading-relaxed">
            {experiment?.personalizedExperiment || getExperimentPreview(currentWeek)}
          </p>
          {experiment?.whyThisMatters && (
            <p className="text-xs text-stone-500 mt-2 italic">
              {experiment.whyThisMatters}
            </p>
          )}
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              experiment?.status === 'completed'
                ? 'bg-lab-teal/10 text-lab-teal'
                : 'bg-lab-amber/10 text-lab-amber'
            }`}>
              {experiment?.status === 'completed' ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </button>
      )}

      {/* Recent Conversations — from Firestore */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
          Recent Conversations
        </h3>
        {conversationsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 rounded-xl flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-stone-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-stone-200 rounded w-24 mb-2" />
                  <div className="h-3 bg-stone-100 rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : conversationsError ? (
          <div className="text-center py-6 text-red-400">
            <AlertCircle className="mx-auto mb-2" size={24} />
            <p className="text-sm">{conversationsError}</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-stone-400">
            <MessageCircle className="mx-auto mb-2 text-stone-300" size={24} />
            <p className="text-sm">No conversations yet. Start one above.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((convo) => {
              const preview = getLastMessagePreview(convo);
              return (
                <ConversationPreview
                  key={convo.id}
                  title={getModeLabel(convo.mode)}
                  preview={preview ? preview.text : 'Start the conversation...'}
                  time={formatConversationTime(convo)}
                  onClick={() =>
                    navigate(SCREENS.CONVERSATION, {
                      conversationId: convo.id,
                      mode: convo.mode,
                    })
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Next Session */}
      {userProfile?.nextSessionDate && (
        <div className="glass-card p-4 mt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-lab-navy/5 flex items-center justify-center">
            <span className="text-lg">📅</span>
          </div>
          <div>
            <p className="text-sm font-medium text-lab-navy">Next Live Session</p>
            <p className="text-xs text-stone-500">{userProfile.nextSessionDate}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConversationPreview({ title, preview, time, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 rounded-xl hover:bg-stone-100 transition-colors flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-lab-teal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <MessageCircle className="text-lab-teal" size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-lab-navy">{title}</p>
          <span className="text-xs text-stone-400">{time}</span>
        </div>
        <p className="text-sm text-stone-500 truncate mt-0.5">{preview}</p>
      </div>
    </button>
  );
}

function getExperimentPreview(week) {
  const experiments = {
    1: 'Write down what each person in your next meeting does better than anyone. Name ONE out loud, in front of the group. Watch the room.',
    2: 'The 2-Minute Silence: Ask your most important 1:1 question. After they answer, say nothing for two minutes. The real answer comes second.',
    3: 'The person you\'ve been avoiding giving feedback to — write it in one sentence and deliver it today. Not tomorrow.',
    4: 'The Columbo Method: When someone pushes back, say "You might be right — help me see what I\'m missing." Then actually listen.',
    5: 'What would the leader you\'re becoming do differently than 5 weeks ago? Walk into your biggest meeting and do exactly that.',
  };
  return experiments[week] || experiments[1];
}
