import { useState, useEffect } from 'react';
import { FlaskConical, Play, BookOpen, Lightbulb, RotateCw, PenTool, BookOpenCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../config/firebase.js';
import { useNavigation } from '../../providers/NavigationProvider.jsx';
import { SCREENS } from '../../config/navigation.js';

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

export default function LabScreen() {
  const { navigate } = useNavigation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPrescriptions() {
      try {
        const fn = httpsCallable(functions, 'labMyPrescriptions');
        const result = await fn();
        if (!cancelled) {
          setPrescriptions(result.data.prescriptions || []);
          setCurrentWeek(result.data.currentWeek);
          // Auto-expand current week
          const current = (result.data.prescriptions || []).find(
            (p) => p.weekNumber === result.data.currentWeek
          );
          if (current) setExpandedId(current.id);
        }
      } catch (err) {
        console.error('Failed to load prescriptions:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadPrescriptions();
    return () => { cancelled = true; };
  }, []);

  const currentRx = prescriptions.find((p) => p.weekNumber === currentWeek);
  const pastRx = prescriptions.filter((p) => p.weekNumber !== currentWeek);

  return (
    <div className="min-h-screen pb-20 px-4 pt-6">
      <h1 className="text-2xl font-bold text-lab-navy mb-6">The Lab</h1>

      {/* Situation Simulator */}
      <button
        onClick={() => navigate(SCREENS.CONVERSATION, { mode: 'practice' })}
        className="w-full glass-card p-5 mb-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow text-left"
      >
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <Play className="text-indigo-500" size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-lab-navy">Situation Simulator</h3>
          <p className="text-sm text-stone-500 mt-0.5">
            Rehearse an upcoming conversation or decision
          </p>
        </div>
      </button>

      {/* Deep Coaching */}
      <button
        onClick={() => navigate(SCREENS.CONVERSATION, { mode: 'coach' })}
        className="w-full glass-card p-5 mb-4 flex items-center gap-4 hover:shadow-card-hover transition-shadow text-left"
      >
        <div className="w-12 h-12 rounded-2xl bg-lab-teal/10 flex items-center justify-center flex-shrink-0">
          <FlaskConical className="text-lab-teal" size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-lab-navy">Deep Coaching Session</h3>
          <p className="text-sm text-stone-500 mt-0.5">
            Go deeper than a text exchange allows
          </p>
        </div>
      </button>

      {/* Prescribed for You */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="text-stone-500" size={18} />
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
            Prescribed for You
          </h3>
        </div>

        {loading ? (
          <div className="text-center py-8 glass-card text-stone-400">
            <p className="text-sm">Loading your prescriptions...</p>
          </div>
        ) : !currentRx && pastRx.length === 0 ? (
          <div className="text-center py-8 glass-card text-stone-400">
            <p className="text-sm">
              Content will appear here when your coach identifies something relevant to your growth edge.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Current week's prescription — prominent */}
            {currentRx && (
              <PrescriptionCard
                rx={currentRx}
                isCurrent
                expanded={expandedId === currentRx.id}
                onToggle={() => setExpandedId(expandedId === currentRx.id ? null : currentRx.id)}
              />
            )}

            {/* Past prescriptions — collapsed list */}
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
