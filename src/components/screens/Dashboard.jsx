// src/components/screens/Dashboard.jsx (Updated for "Rep Tracker" Features & Log Modal)
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
// --- NEW: Firestore Imports for Reflection Logging & QUERYING ---
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, where } from 'firebase/firestore';

// --- NEW: More Icons for new features ---
import {
  Home, Zap, AlertTriangle, Target, Briefcase, Loader, Lightbulb, Sparkles, CheckCircle, Clock, Save, CornerDownRight, Flag, User, Activity, BarChart3, Check, X,
  MessageSquare, // Reflection
  Archive, // Reflection Log
  Flame, // Streaks
  Anchor, // Habit Anchor
  Heart, // Why it Matters
  Users, // Social Pod
  Award, // 2-Min Challenge
  Calendar, // Weekly Recap
  Share2 // Share button
} from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Unchanged)
========================================================= */
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#002E47', MUTED: '#4B5355', PURPLE: '#7C3AED' };
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => { /* ... unchanged ... */ let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center"; if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; } else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[${COLORS.ORANGE}]/50`; } else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; } else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; } if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; } return ( <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button> ); };
const ThreeDButton = ({ children, onClick, color = COLORS.TEAL, accentColor = COLORS.NAVY, className = '', ...rest }) => { /* ... unchanged ... */ const buttonStyle = { background: color, boxShadow: `0 4px 0px 0px ${accentColor}, 0 6px 12px rgba(0,0,0,0.2)`, transition: 'all 0.1s ease-out', transform: 'translateY(0px)' }; return ( <button {...rest} onClick={onClick} type="button" className={`${className} flex items-center justify-center p-3 rounded-xl font-extrabold text-white cursor-pointer transition-all duration-100`} style={buttonStyle}>{children}</button> ); };
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => { /* ... unchanged ... */ const interactive = !!onClick; const Tag = interactive ? 'button' : 'div'; const accentColor = COLORS[accent] || COLORS.NAVY; const handleKeyDown = (e) => { if (!interactive) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } }; return ( <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-2xl hover:shadow-xl transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }} onClick={onClick}> <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} /> {Icon && ( <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} /> </div> )} {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>} {children} </Tag> ); };

/* =========================================================
   FEATURE 4: Micro-Celebration Component
========================================================= */
const CelebrationOverlay = ({ show }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-black/50 backdrop-blur-sm rounded-full p-8">
        <div className="text-6xl animate-bounce">🎉</div>
      </div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-2xl border-4 border-green-500">
         <p className="text-2xl font-bold text-gray-800">Nice Rep!</p>
       </div>
    </div>
  );
};

/* =========================================================
   FEATURE 4: Streak Tracker Component
========================================================= */
const StreakTracker = ({ streakCount = 0 }) => {
  const color = streakCount > 0 ? COLORS.ORANGE : COLORS.MUTED;
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-inner border border-gray-200">
      <Flame className="w-5 h-5" style={{ color }} />
      <span className="font-bold text-lg" style={{ color: COLORS.NAVY }}>
        {streakCount}
      </span>
      <span className="text-sm text-gray-600">Day Streak</span>
    </div>
  );
};

/* =========================================================
   FEATURE 2: Why It Matters Component
========================================================= */
const WhyItMattersCard = ({ statement, onPersonalize }) => (
  <Card title="💖 Why It Matters" icon={Heart} accent="ORANGE">
    <p className="text-md italic text-gray-700 mb-4">
      "{statement}"
    </p>
    <Button onClick={onPersonalize} variant="outline" className="text-sm !py-2 !px-4 w-full">
      Personalize Your "Why"
    </Button>
  </Card>
);

/* =========================================================
   FEATURE 6: Habit Anchor Component
========================================================= */
const HabitAnchorCard = ({ anchor, onEdit }) => (
  <Card title="⚓ Habit Anchor" icon={Anchor} accent="BLUE">
    <p className="text-sm font-semibold text-gray-500 uppercase">Your Cue:</p>
    <p className="text-md font-medium text-gray-800 mb-4">
      {anchor}
    </p>
    <Button onClick={onEdit} variant="outline" className="text-sm !py-2 !px-4 w-full">
      Edit Anchor
    </Button>
  </Card>
);

/* =========================================================
   FEATURE 5: Social Accountability Pod Component
========================================================= */
const SocialPodFeed = ({ feed, onShare }) => {
  const [newPost, setNewPost] = useState('');

  const handleSubmit = () => {
    if (newPost.trim()) {
      onShare(newPost.trim());
      setNewPost('');
    }
  };

  return (
    <Card title="📣 Accountability Pod" icon={Users} accent="PURPLE">
      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-4">
        {feed.map((post) => (
          <div key={post.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-gray-800">{post.text}</p>
            <span className="text-xs text-gray-500">{post.author} - {post.time}</span>
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED]"
          rows="2"
          placeholder="Share your rep or a win..."
        />
        <Button onClick={handleSubmit} variant="primary" className="w-full text-sm !py-2" style={{ background: COLORS.PURPLE, focusRing: COLORS.PURPLE }}>
          <Share2 className="w-4 h-4 mr-2" /> Share to Pod
        </Button>
      </div>
    </Card>
  );
};


/* =========================================================
   Embedded Daily Reps Component (MODIFIED)
========================================================= */
const EmbeddedDailyReps = ({ commitments, onToggleCommit, isLoading, onCommitMicroRep, microRepText }) => {
  const { navigate } = useAppServices();

  const hasPendingReps = commitments.some(c => c.status === 'Pending');

  return (
    <div className="space-y-3">
      {/* FEATURE 3: 2-Minute Challenge Button */}
      {hasPendingReps && microRepText && (
         <Button
            onClick={onCommitMicroRep}
            variant="secondary"
            className="w-full !py-3 text-base mb-4 border-2 border-dashed border-red-300"
            style={{ background: '#FFF1ED', color: COLORS.ORANGE, boxShadow: 'none' }}
          >
            <Award className="w-5 h-5 mr-2" />
            <span className="font-semibold">2-Min Challenge:</span>&nbsp;{microRepText}
          </Button>
      )}

      {/* Loading State */}
      {isLoading && <div className="p-4 text-center text-gray-500">Loading reps...</div>}

      {/* No Reps State */}
      {!isLoading && (!commitments || commitments.length === 0) && (
        <div className="p-6 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-600 font-semibold mb-3">No reps defined for today.</p>
          <Button onClick={() => navigate('development-plan')} variant="outline" className="text-sm px-4 py-2">
            Set Up Your Development Plan
          </Button>
        </div>
      )}

      {/* Rep List */}
      {!isLoading && commitments.length > 0 && commitments.map((commit) => (
        <div
          key={commit.id}
          className={`p-4 rounded-xl flex items-center justify-between transition-all border
            ${commit.status === 'Committed' ? 'bg-green-50 border-green-200 shadow-inner' : 'bg-white hover:bg-gray-50'}`}
        >
          <div className="flex-1 mr-4">
            <p className={`font-medium ${commit.status === 'Committed' ? 'text-green-800 line-through' : 'text-[#002E47]'}`}>
              {commit.text}
            </p>
            {commit.linkedGoal && (
              <span className="text-xs text-gray-500 italic block mt-1">
                Linked to: {commit.linkedGoal}
              </span>
            )}
          </div>
          <button
            onClick={() => onToggleCommit(commit.id)}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1
              ${commit.status === 'Committed'
                ? `bg-[${COLORS.GREEN}] border-[${COLORS.GREEN}] text-white hover:bg-green-700 focus:ring-[${COLORS.GREEN}]`
                : `bg-white border-gray-300 text-gray-400 hover:border-[${COLORS.TEAL}] hover:text-[${COLORS.TEAL}] focus:ring-[${COLORS.TEAL}]`
              }`}
            aria-label={commit.status === 'Committed' ? 'Mark as Pending' : 'Mark as Committed'}
          >
            {commit.status === 'Committed' ? <Check size={20} /> : <Zap size={18} />}
          </button>
        </div>
      ))}
    </div>
  );
};


/* =========================================================
   NEW: Reflection Log Modal Component
========================================================= */
const ReflectionLogModal = ({ isOpen, onClose, history, isLoading }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    try {
      return new Date(dateString + 'T12:00:00Z').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3">
            <Archive className="text-[#47A88D]" />
            Full Reflection Log
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loader className="animate-spin text-[#47A88D] h-8 w-8" />
            </div>
          )}
          {!isLoading && history.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600 font-semibold">No reflections saved yet.</p>
              <p className="text-gray-500 text-sm">Complete the form on the dashboard to start your log.</p>
            </div>
          )}
          {!isLoading && history.length > 0 && history.map((entry) => (
            <div key={entry.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 shadow-sm">
              <p className="text-sm font-bold text-[#002E47] mb-2 border-b pb-1">
                {formatDate(entry.date)}
              </p>
              <div className="space-y-3">
                {entry.did && <p className="text-sm text-gray-700"><strong>Did:</strong> {entry.did}</p>}
                {entry.noticed && <p className="text-sm text-gray-700"><strong>Noticed:</strong> {entry.noticed}</p>}
                {entry.tryDiff && <p className="text-sm text-gray-700"><strong>Try:</strong> {entry.tryDiff}</p>}
                {entry.identity && <p className="text-sm text-gray-800 italic font-medium"><strong>Identity:</strong> "I'm the kind of leader who {entry.identity}"</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl text-right">
           <Button onClick={onClose} variant="outline" className="text-sm !py-2 !px-4">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};


/* =========================================================
   Embedded Reflection Form Component (*** UPDATED ***)
========================================================= */
const EmbeddedReflectionForm = ({ db, userId, onOpenLog }) => { // Added onOpenLog prop
  // const { navigate } = useAppServices(); // No longer needed for navigation
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedConfirmation, setIsSavedConfirmation] = useState(false);
  const [did, setDid] = useState('');
  const [noticed, setNoticed] = useState('');
  const [tryDiff, setTryDiff] = useState('');
  const [identity, setIdentity] = useState('');

  const handleSaveReflection = async () => {
    if (!did.trim() && !noticed.trim() && !tryDiff.trim() && !identity.trim()) {
        alert("Please fill in at least one reflection field."); return;
    }
    if (!db || !userId) {
        alert("Error: Database connection not available."); return;
    }
    setIsSaving(true);
    setIsSavedConfirmation(false);
    const reflectionEntry = { did: did.trim(), noticed: noticed.trim(), tryDiff: tryDiff.trim(), identity: identity.trim(), timestamp: serverTimestamp(), date: new Date().toISOString().split('T')[0] };
    try {
      const historyCollectionRef = collection(db, `user_commitments/${userId}/reflection_history`);
      await addDoc(historyCollectionRef, reflectionEntry);
      setIsSavedConfirmation(true);
      setDid(''); setNoticed(''); setTryDiff(''); setIdentity('');
      setTimeout(() => setIsSavedConfirmation(false), 3000);
    } catch (e) {
      console.error("Failed to save reflection to history:", e);
      alert("Failed to save reflection log.");
    } finally {
      setIsSaving(false);
    }
  };
  const canSave = did.trim() || noticed.trim() || tryDiff.trim() || identity.trim();

  return (
    <Card title="⚡ Daily Reflection Rep" icon={MessageSquare} accent='NAVY' className="sticky top-4">
        <p className="text-sm text-gray-600 -mt-2 mb-4">
          Capture key insights from your reps.
        </p>
        <div className="space-y-4">
          {/* 1. What I did */}
          <div>
            <label className="block text-sm font-semibold text-[#002E47] mb-1">
              <span className="text-[#47A88D]">1.</span> What did I <strong className='text-[#47A88D]'>do</strong>?
            </label>
            <textarea value={did} onChange={(e) => setDid(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" rows="2" placeholder="e.g., Gave clear feedback..."/>
          </div>
          {/* 2. What I noticed */}
          <div>
            <label className="block text-sm font-semibold text-[#002E47] mb-1">
              <span className="text-[#47A88D]">2.</span> What did I <strong className='text-[#47A88D]'>notice</strong>?
            </label>
            <textarea value={noticed} onChange={(e) => setNoticed(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" rows="2" placeholder="e.g., I over-explained again..."/>
          </div>
          {/* 3. What I'll try */}
          <div>
            <label className="block text-sm font-semibold text-[#002E47] mb-1">
              <span className="text-[#47A88D]">3.</span> What will I <strong className='text-[#47A88D]'>try</strong> differently?
            </label>
            <textarea value={tryDiff} onChange={(e) => setTryDiff(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" rows="2" placeholder="e.g., Let silence do the work..."/>
          </div>
          {/* 4. Identity Cue */}
          <div>
            <label className="block text-sm font-semibold text-[#002E47] mb-1">
              <User className="inline-block w-4 h-4 mr-1 text-[#47A88D]" /> "I'm the kind of leader who..."
            </label>
            <input type="text" value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" placeholder="e.g., trusts my team."/>
          </div>
        </div>
        {/* Save & View Log Buttons */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-4">
          <Button onClick={handleSaveReflection} disabled={isSaving || !canSave} variant="primary" className="flex-1 !py-2 text-base">
            {isSaving ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {isSaving ? 'Saving...' : 'Save to Log'}
          </Button>
          {isSavedConfirmation && ( <span className='text-xs font-bold text-green-600 flex items-center'><CheckCircle className='w-4 h-4 mr-1'/> Saved</span> )}
        </div>
        <div className="mt-4 flex justify-center">
          {/* --- UPDATED: Button now opens modal --- */}
          <Button onClick={onOpenLog} variant="outline" className="text-sm !py-2 !px-4" >
            <Archive className="w-4 h-4 mr-2" />
            View Full Log
          </Button>
        </div>
    </Card>
  );
};


/* =========================================================
   Dashboard Screen (Main Export - MODIFIED)
========================================================= */

// --- NEW MOCK DATA (This should come from useAppServices) ---
const mockTargetRepCatalog = [
  {
    id: "r1",
    text: "Practice active listening in the team sync (paraphrase before responding).",
    category: "Team Leadership",
    definition: "Focus on understanding, not just replying. State their point back to them (e.g., 'So what I'm hearing is...').",
    microRep: "Paraphrase one person in your next call."
  },
  {
    id: "r2",
    text: "Delegate at least one non-critical task to a team member.",
    category: "Team Leadership",
    definition: "Give full ownership, including the 'why' and the desired outcome. Resist checking in before the deadline.",
    microRep: "Identify one task to delegate."
  }
];

const mockSocialFeedData = [
  { id: 's3', author: 'Alex T.', text: "Logged my delegation rep. Felt weird but good.", time: "1h ago" },
  // --- THIS IS THE FIX ---
  { id: 's2', author: 'Samira K.', text: "My 2-min challenge (send a thank-you) turned into a great chat.", time: "4h ago" },
  { id: 's1', author: 'User', text: "Just joined the Arena. Let's go!", time: "1d ago" },
];

const DashboardScreen = () => {
  const {
    navigate, user, 
    pdpData, 
    commitmentData, 
    planningData, 
    LEADERSHIP_TIERS, 
    updateCommitmentData, 
    isLoading: isAppLoading, 
    db, 
    userId 
  } = useAppServices();

  const [isSavingRep, setIsSavingRep] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [podPosts, setPodPosts] = useState(mockSocialFeedData);

  // --- NEW: State for Reflection Log Modal ---
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [reflectionHistory, setReflectionHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // --- NEW: Effect to fetch reflection history when modal opens ---
  useEffect(() => {
    if (isLogModalOpen && db && userId) {
      const fetchHistory = async () => {
        setIsHistoryLoading(true);
        try {
          const historyCollectionRef = collection(db, `user_commitments/${userId}/reflection_history`);
          // Query to get reflections, ordered by timestamp descending
          const q = query(historyCollectionRef, orderBy("timestamp", "desc"));
          const querySnapshot = await getDocs(q);
          const history = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReflectionHistory(history);
        } catch (error) {
          console.error("Failed to fetch reflection history:", error);
          alert("Could not load reflection history.");
        }
        setIsHistoryLoading(false);
      };
      fetchHistory();
    }
  }, [isLogModalOpen, db, userId]); // Re-run if modal opens

  // --- Derived Data Calculations (Unchanged) ---
  const displayedUserName = useMemo(() => user?.name || user?.email?.split('@')[0] || 'Leader', [user]);
  const greeting = useMemo(() => 'Welcome to The Arena,', []);
  const activeCommitments = useMemo(() => commitmentData?.active_commitments || [], [commitmentData]);
  const commitsCompleted = useMemo(() => activeCommitments.filter(c => c.status === 'Committed').length, [activeCommitments]);
  const commitsTotal = activeCommitments.length;
  const streakCount = useMemo(() => commitmentData?.streak_count || 5, [commitmentData]);
  const habitAnchor = useMemo(() => commitmentData?.habit_anchor || "After my 1:1 with my manager", [commitmentData]);
  const whyStatement = useMemo(() => planningData?.focus_goals?.[0]?.why || "When I empower my team, we all win and I can focus on strategy.", [planningData]);
  const identityStatement = useMemo(() => commitmentData?.reflection_journal?.split('\n').find(l => l.startsWith('Identity:'))?.substring(9).trim() || 'I am a principled leader.', [commitmentData]);

  const dailyTargetRep = useMemo(() => {
    const pdpRep = activeCommitments.find(c => c.source === 'DevelopmentPlan');
    let baseText = pdpRep?.text;
    if (!baseText) {
      const catalogRep = activeCommitments.find(c => c.source === 'Catalog');
      baseText = catalogRep?.text;
    }
    const catalogEntry = mockTargetRepCatalog.find(r => baseText?.includes(r.text)) || mockTargetRepCatalog[0];
    return {
      text: baseText || catalogEntry.text,
      definition: catalogEntry.definition,
      microRep: catalogEntry.microRep
    };
  }, [activeCommitments]);

  const weakestTier = useMemo(() => {
    const scores = pdpData?.assessment?.scores;
    if (!scores || !LEADERSHIP_TIERS) return { id: 'T3', name: 'Getting Started', hex: COLORS.AMBER };
    const sortedDimensions = Object.values(scores).sort((a, b) => a.score - b.score);
    const weakest = sortedDimensions[0];
    if (!weakest) return { id: 'T3', name: 'Getting Started', hex: COLORS.AMBER };
    const tierKey = Object.keys(LEADERSHIP_TIERS).find(key => LEADERSHIP_TIERS[key].name.includes(weakest.name.split(' ')[0])) || 'T1';
    const meta = LEADERSHIP_TIERS[tierKey];
    return { id: weakest.name, name: weakest.name, hex: meta?.hex || COLORS.ORANGE };
  }, [pdpData, LEADERSHIP_TIERS]);


  // --- Helper: Trigger Celebration (Unchanged) ---
  const triggerCelebration = () => {
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
    }, 1500); 
  };

  // --- Handle Toggling Rep Commitment (Unchanged) ---
  const handleToggleCommitment = useCallback(async (commitId) => {
    if (isSavingRep) return;
    setIsSavingRep(true);
    
    const currentCommits = commitmentData?.active_commitments || [];
    const targetCommit = currentCommits.find(c => c.id === commitId);
    if (!targetCommit) return;

    const newStatus = targetCommit.status === 'Committed' ? 'Pending' : 'Committed';
    const updatedCommitments = currentCommits.map(c =>
      c.id === commitId ? { ...c, status: newStatus } : c
    );

    try {
      await updateCommitmentData({ active_commitments: updatedCommitments });
      if (newStatus === 'Committed') {
        triggerCelebration();
      }
    } catch (error) {
      console.error("Failed to update rep status:", error);
    } finally {
      setIsSavingRep(false);
    }
  }, [commitmentData, updateCommitmentData, isSavingRep]);

  // --- Handle Micro-Rep (Unchanged) ---
  const handleCommitMicroRep = () => {
    console.log("Committing micro-rep!");
    triggerCelebration();
  };

  // --- Handle Pod Share (Unchanged) ---
  const handleShareToPod = (postText) => {
    console.log("Sharing to pod:", postText);
    const newPost = {
      id: `s${podPosts.length + 1}`,
      author: displayedUserName,
      text: postText,
      time: "Just now"
    };
    setPodPosts([newPost, ...podPosts]);
  };


  // --- Main Render ---
  if (isAppLoading && !commitmentData) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Loader className="animate-spin text-[#47A88D] h-12 w-12" />
          </div>
      );
  }

  return (
    <div className={`p-6 space-y-6 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
      {/* FEATURE 4: Celebration Overlay */}
      <CelebrationOverlay show={showCelebration} />
      
      {/* NEW: Render Reflection Log Modal */}
      <ReflectionLogModal 
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        history={reflectionHistory}
        isLoading={isHistoryLoading}
      />

      {/* 1. Header (Unchanged) */}
      <div className={`bg-[${COLORS.OFF_WHITE}] p-6 -mx-6 -mt-6 mb-4 rounded-b-xl shadow-md border-b-4 border-[${COLORS.TEAL}]`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className={`text-3xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3`}>
            <Home size={28} style={{ color: COLORS.TEAL }} /> The Arena
          </h1>
          <StreakTracker streakCount={streakCount} />
        </div>
        <p className="text-gray-600 text-base mt-4">
          {greeting} <span className={`font-semibold text-[${COLORS.NAVY}]`}>{displayedUserName}</span>. Your focus: <strong style={{ color: weakestTier?.hex || COLORS.NAVY }}>{weakestTier?.name || 'Getting Started'}</strong>.
        </p>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Today's Reps & Actions (Unchanged) */}
        <div className="lg:col-span-2 space-y-6">
           <Card title="🎯 Today's Strategic Focus" icon={Target} accent='NAVY'>
              <div className='grid md:grid-cols-2 gap-6'>
                  <div>
                      <p className='text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1'><Flag className='w-4 h-4 text-red-500'/> Target Rep:</p>
                      <p className='text-lg font-bold text-[#E04E1B]'>{dailyTargetRep.text}</p>
                  </div>
                  <div>
                       <p className='text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1'><CheckCircle className='w-4 h-4 text-gray-500'/> What Good Looks Like:</p>
                       <p className='text-sm italic text-[#002E47]'>{dailyTargetRep.definition}</p>
                  </div>
              </div>
               <div className="mt-4 pt-4 border-t border-gray-200">
                   <p className='text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1'><User className='w-4 h-4 text-gray-500'/> Identity Anchor:</p>
                   <p className='text-md italic text-[#002E47]'>"{identityStatement}"</p>
               </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <WhyItMattersCard 
              statement={whyStatement}
              onPersonalize={() => navigate('development-plan')}
            />
            <HabitAnchorCard
              anchor={habitAnchor}
              onEdit={() => navigate('settings-anchors')}
            />
          </div>

          <Card title={`⏳ Today's Reps (${commitsCompleted}/${commitsTotal})`} icon={Clock} accent='TEAL'>
             <EmbeddedDailyReps
                commitments={activeCommitments}
                onToggleCommit={handleToggleCommitment}
                isLoading={isSavingRep || (isAppLoading && !commitmentData)}
                microRepText={dailyTargetRep.microRep}
                onCommitMicroRep={handleCommitMicroRep}
             />
          </Card>

          <SocialPodFeed feed={podPosts} onShare={handleShareToPod} />

           <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <ThreeDButton
                    onClick={() => navigate('development-plan')}
                    color={COLORS.ORANGE}
                    accentColor={COLORS.NAVY}
                    className="h-20 flex-col px-3 py-2 text-white"
                >
                    <Briefcase className='w-5 h-5 mb-1'/>
                    <span className='text-base font-extrabold'>My Dev Plan</span>
                </ThreeDButton>
                 <ThreeDButton
                    onClick={() => navigate('coaching-lab')}
                    color={COLORS.PURPLE}
                    accentColor={COLORS.NAVY}
                    className="h-20 flex-col px-3 py-2 text-white"
                >
                    <Sparkles className='w-5 h-5 mb-1'/>
                    <span className='text-base font-extrabold'>AI Coaching Lab</span>
                </ThreeDButton>
                <ThreeDButton
                    onClick={() => navigate('weekly-recap')} 
                    color={COLORS.BLUE}
                    accentColor={COLORS.NAVY}
                    className="h-20 flex-col px-3 py-2 text-white"
                >
                    <Calendar className='w-5 h-5 mb-1'/>
                    <span className='text-base font-extrabold'>Weekly Recap</span>
                </ThreeDButton>
            </div>
        </div>

        {/* Right Column: Reflection Form (*** UPDATED ***) */}
        <div className="lg:col-span-1 space-y-6">
             <EmbeddedReflectionForm 
                db={db} 
                userId={userId} 
                onOpenLog={() => setIsLogModalOpen(true)} // Pass the function to open the modal
             />
        </div>
      </div>

       {/* Footer/Reminder (Unchanged) */}
       <div className="text-center text-xs text-gray-500 pt-6 border-t mt-6">
           Remember: Consistency compounds. Log your reps daily and complete your reflection.
       </div>
    </div>
  );
};

export default DashboardScreen;