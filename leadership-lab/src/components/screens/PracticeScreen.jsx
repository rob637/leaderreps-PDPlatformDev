import { useState, useEffect } from 'react';
import { FlaskConical, Play, BookOpen, Lightbulb, RotateCw, PenTool, BookOpenCheck, ChevronDown, ChevronUp, Beaker } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.js';
import { useAuth } from '../../hooks/useAuth.js';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { SCREENS, getWeekTheme } from '../../config/navigation.js';
import { getChallenges } from '../../services/profileService.js';

const TYPE_ICONS = {
  concept: Lightbulb,
  reframe: RotateCw,
  'micro-exercise': PenTool,
  reading: BookOpenCheck,
};

const TYPE_LABELS = {
  concept: 'Leadership Concept',
  reframe: 'Perspective Shift',
  'micro-exercise': 'Micro-Exercise',
  reading: 'Recommended Reading',
};

const TYPE_COLORS = {
  concept: 'bg-amber-50 text-amber-600',
  reframe: 'bg-purple-50 text-purple-600',
  'micro-exercise': 'bg-emerald-50 text-emerald-600',
  reading: 'bg-blue-50 text-blue-600',
};

/**
 * PracticeScreen — formerly LabScreen.
 *
 * The leader's "I want to actively work on something" surface.
 * Always shows this week's anchor experiment so the screen never feels empty.
 */
export default function PracticeScreen() {
  const { user, userProfile } = useAuth();
  const userId = userProfile?._docId || user?.uid;
  const { navigate } = useNavigation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(userProfile?.currentWeek || 1);
  const [thisWeekChallenge, setThisWeekChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const fn = httpsCallable(functions, 'labMyPrescriptions');
        const result = await fn();
        if (!cancelled) {
          const rxList = result.data.prescriptions || [];
          setPrescriptions(rxList);
          const week = result.data.currentWeek || userProfile?.currentWeek || 1;
          setCurrentWeek(week);
          const current = rxList.find((p) => p.weekNumber === week);
          if (current) setExpandedId(current.id);
        }

        // Always load this week's challenge so the experiment is visible
        if (userId) {
          const challenges = await getChallenges(userId);
          if (!cancelled) {
            const wk = result?.data?.currentWeek || userProfile?.currentWeek || 1;
            const ch = challenges.find((c) => c.weekNumber === wk);
            if (ch) setThisWeekChallenge(ch);
          }
        }
      } catch (err) {
        console.error('Failed to load practice data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [userId, userProfile?.currentWeek]);

  const currentRx = prescriptions.find((p) => p.weekNumber === currentWeek);
  const pastRx = prescriptions.filter((p) => p.weekNumber !== currentWeek);
  const theme = getWeekTheme(currentWeek);

  const experimentText =
    thisWeekChallenge?.personalizedExperiment ||
    thisWeekChallenge?.experiment ||
    null;

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-lab-navy">Practice</h1>
        <p className="text-sm text-stone-500 mt-1">
          Rehearse, reflect, and apply what you&apos;re learning.
        </p>
      </div>

      {/* This Week's Experiment — always visible, anchors the page */}
      {(experimentText || theme) && (
        <div className="bg-gradient-to-br from-lab-amber/10 to-lab-teal/5 border border-lab-amber/20 rounded-2xl p-5 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Beaker size={16} className="text-lab-amber" />
            <span className="text-[10px] font-bold tracking-widest text-lab-amber uppercase">
              Week {currentWeek} Experiment
            </span>
          </div>
          {theme?.title && (
            <h2 className="font-semibold text-lab-navy mb-1.5">{theme.title}</h2>
          )}
          {experimentText ? (
            <p className="text-sm text-stone-700 leading-relaxed">
              {experimentText}
            </p>
          ) : (
            <p className="text-sm text-stone-500 italic">
              Your personalized experiment will appear here once your coach calibrates this week&apos;s focus.
            </p>
          )}
          {experimentText && (
            <button
              onClick={() => navigate(SCREENS.CONVERSATION, { mode: 'coach' })}
              className="mt-3 text-xs font-semibold text-lab-teal hover:underline"
            >
              Talk to your coach about this →
            </button>
          )}
        </div>
      )}

      {/* Practice Modes */}
      <div className="mb-6">
        <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-2 px-1">
          Choose How To Practice
        </p>
        <button
          onClick={() => navigate(SCREENS.CONVERSATION, { mode: 'practice' })}
          className="w-full glass-card p-5 mb-3 flex items-center gap-4 hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Play className="text-indigo-500" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lab-navy">Situation Simulator</h3>
            <p className="text-sm text-stone-500 mt-0.5">
              Role-play a specific upcoming conversation.
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate(SCREENS.CONVERSATION, { mode: 'coach' })}
          className="w-full glass-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow text-left"
        >
          <div className="w-12 h-12 rounded-2xl bg-lab-teal/10 flex items-center justify-center flex-shrink-0">
            <FlaskConical className="text-lab-teal" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lab-navy">Deep Coaching</h3>
            <p className="text-sm text-stone-500 mt-0.5">
              An open conversation — go deeper than texts allow.
            </p>
          </div>
        </button>
      </div>

      {/* Prescribed for You */}
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-3 px-1">
          <BookOpen className="text-stone-400" size={14} />
          <p className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
            Prescribed For You
          </p>
        </div>

        {loading ? (
          <div className="text-center py-6 text-stone-400 text-sm">
            Loading...
          </div>
        ) : !currentRx && pastRx.length === 0 ? (
          <div className="glass-card p-5 text-stone-400 text-sm text-center leading-relaxed">
            Your coach will prescribe specific concepts and exercises here as patterns emerge in your conversations.
          </div>
        ) : (
          <div className="space-y-3">
            {currentRx && (
              <PrescriptionCard
                rx={currentRx}
                isCurrent
                expanded={expandedId === currentRx.id}
                onToggle={() => setExpandedId(expandedId === currentRx.id ? null : currentRx.id)}
              />
            )}

            {pastRx.length > 0 && (
              <div>
                <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mt-4 mb-2">
                  Previous Weeks
                </p>
                {pastRx.map((rx) => (
                  <PrescriptionCard
                    key={rx.id}
                    rx={rx}
                    isCurrent={false}
                    expanded={expandedId === rx.id}
                    onToggle={() => setExpandedId(expandedId === rx.id ? null : rx.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PrescriptionCard({ rx, isCurrent, expanded, onToggle }) {
  const Icon = TYPE_ICONS[rx.type] || BookOpen;
  const label = TYPE_LABELS[rx.type] || 'Prescription';
  const colorClass = TYPE_COLORS[rx.type] || 'bg-stone-50 text-stone-600';

  return (
    <div
      className={`glass-card overflow-hidden transition-shadow ${isCurrent ? 'ring-2 ring-lab-teal/30' : ''} mb-2`}
    >
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left"
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lab-navy text-sm truncate">{rx.topic}</h4>
            {isCurrent && (
              <span className="text-[10px] font-bold uppercase bg-lab-teal/10 text-lab-teal px-2 py-0.5 rounded-full">
                This Week
              </span>
            )}
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Week {rx.weekNumber} &middot; {label}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="text-stone-400 flex-shrink-0" size={18} />
        ) : (
          <ChevronDown className="text-stone-400 flex-shrink-0" size={18} />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-stone-100 pt-3 space-y-3">
          <p className="text-sm text-stone-700 leading-relaxed">{rx.content}</p>

          {rx.whyYou && (
            <div className="bg-lab-teal/5 rounded-lg p-3">
              <p className="text-xs font-semibold text-lab-teal uppercase tracking-wider mb-1">
                Why this, for you
              </p>
              <p className="text-sm text-stone-600 italic">{rx.whyYou}</p>
            </div>
          )}

          {rx.connectedTension && (
            <p className="text-xs text-stone-400">
              Connected to: <span className="font-medium text-stone-500">{rx.connectedTension}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
