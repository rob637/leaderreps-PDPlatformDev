// src/components/screens/Dashboard.jsx (Corrected: Complete with Integrations & All Components)
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
// --- Firestore Imports ---
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, where } from 'firebase/firestore';

// --- Icons ---
import {
  Home, Zap, AlertTriangle, Target, Briefcase, Loader, Lightbulb, Sparkles, CheckCircle, Clock, Save, CornerDownRight, Flag, User, Activity, BarChart3, Check, X,
  MessageSquare, Archive, Flame, Anchor, Heart, Users, Award, Calendar, Share2, Edit3, Slack, Trophy, ToggleLeft, ToggleRight, Bot
} from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Restored Definitions)
========================================================= */
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#002E47', MUTED: '#4B5355', PURPLE: '#7C3AED' };

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center gap-2";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center gap-2`; }
  else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-2`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center gap-2"; }
  return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => {
  const interactive = !!onClick; const Tag = interactive ? 'button' : 'div';
  const accentColor = COLORS[accent] || COLORS.NAVY;
  const handleKeyDown = (e) => { if (!interactive) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } };
  return (
    <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-2xl hover:shadow-xl transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }} onClick={onClick}>
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
      {Icon && (<div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}><Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} /></div>)}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </Tag>
  );
};

/* =========================================================
   Mode Switch Component
========================================================= */
const ModeSwitch = ({ isArenaMode, onToggle, isLoading }) => (
  <button
    onClick={onToggle}
    disabled={isLoading}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
      isArenaMode
        ? `bg-[${COLORS.PURPLE}]/10 border-[${COLORS.PURPLE}]/30 text-[${COLORS.PURPLE}]`
        : `bg-gray-100 border-gray-300 text-gray-600`
    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
    title={isArenaMode ? "Switch to Solo Mode" : "Switch to Arena Mode"}
  >
    {isLoading ? <Loader className="w-4 h-4 animate-spin"/> : (isArenaMode ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />)}
    {isArenaMode ? 'Arena' : 'Solo'}
    {isArenaMode ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
  </button>
);

/* =========================================================
   Micro-Celebration Component
========================================================= */
const CelebrationOverlay = ({ show }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"> {/* Increased z-index */}
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
   Streak Tracker Component
========================================================= */
const StreakTracker = ({ streakCount = 0, coins = 0 }) => {
  const color = streakCount > 0 ? COLORS.ORANGE : COLORS.MUTED;
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white shadow-inner border border-gray-200">
      {/* Streak */}
      <div className="flex items-center gap-1.5">
        <Flame className="w-5 h-5" style={{ color }} />
        <span className="font-bold text-lg" style={{ color: COLORS.NAVY }}>{streakCount}</span>
        <span className="text-sm text-gray-600">Day Streak</span>
      </div>
      {/* Coins */}
      {coins > 0 && (
        <div className="flex items-center gap-1 border-l pl-3">
           <Trophy className="w-4 h-4 text-amber-500"/>
           <span className="font-semibold text-sm text-amber-600">{coins} Coins</span>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   Why It Matters Component
========================================================= */
const WhyItMattersCard = ({ statement, onPersonalize }) => (
  <Card title="💖 Why It Matters" icon={Heart} accent="ORANGE">
    <p className="text-md italic text-gray-700 mb-4">"{statement || 'Connect your actions to a deeper purpose...'}"</p>
    <Button onClick={onPersonalize} variant="outline" className="text-sm !py-2 !px-4 w-full"> <Edit3 className="w-4 h-4 mr-2" /> Personalize Your "Why" </Button>
  </Card>
);

/* =========================================================
   Habit Anchor Component
========================================================= */
const HabitAnchorCard = ({ anchor, onEdit, isDefault }) => (
  <Card title="⚓ Habit Anchor" icon={Anchor} accent="BLUE">
    {isDefault ? ( <p className="text-md font-medium text-gray-500 italic mb-4"> Set a daily cue to build consistency! </p> )
     : ( <> <p className="text-sm font-semibold text-gray-500 uppercase">Your Cue:</p> <p className="text-md font-medium text-gray-800 mb-4">{anchor}</p> </> )}
    <Button onClick={onEdit} variant="outline" className="text-sm !py-2 !px-4 w-full"> <Edit3 className="w-4 h-4 mr-2" /> {isDefault ? 'Set Anchor' : 'Edit Anchor'} </Button>
  </Card>
);

/* =========================================================
   Social Accountability Pod Component
========================================================= */
const SocialPodFeed = ({ feed, onShare, isArenaMode }) => {
  const { navigate } = useAppServices();
  const [newPost, setNewPost] = useState('');
  const handleSubmit = () => { if (newPost.trim()) { onShare(newPost.trim()); setNewPost(''); } };

  return (
    <Card title="📣 Accountability Pod" icon={Users} accent="PURPLE">
      {!isArenaMode && ( <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center"> <p className="text-sm text-indigo-700 font-medium">You are in Solo Mode. Switch to Arena Mode to see and share with your pod.</p> </div> )}
      {isArenaMode && (
        <>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-4">
            {feed.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">Pod feed is quiet...</p>}
            {feed.map((post) => (
              <div key={post.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-800">{post.text}</p>
                <span className="text-xs text-gray-500">{post.author} - {post.time}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7C3AED]" rows="2" placeholder="Share your rep or a win..." />
            <Button onClick={handleSubmit} variant="primary" className="w-full text-sm !py-2" style={{ background: COLORS.PURPLE, focusRing: COLORS.PURPLE }}> <Share2 className="w-4 h-4 mr-2" /> Share to Pod </Button>
          </div>
        </>
      )}
       <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500"> Log reps via <Slack className="inline w-3 h-3 mx-0.5" /> Slack? <button onClick={() => navigate('settings-integrations')} className="font-semibold text-blue-600 hover:underline">Connect Slack</button> </p>
       </div>
    </Card>
  );
};

/* =========================================================
   Embedded Daily Reps Component
========================================================= */
const EmbeddedDailyReps = ({ commitments, onToggleCommit, isLoading, onCommitMicroRep, microRepText }) => {
  const { navigate } = useAppServices();
  const hasPendingReps = commitments.some(c => c.status === 'Pending');

  return (
    <div className="space-y-3">
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
      {isLoading && <div className="p-4 text-center text-gray-500">Loading reps...</div>}
      {!isLoading && (!commitments || commitments.length === 0) && (
        <div className="p-6 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-600 font-semibold mb-3">No reps defined for today.</p>
          <Button
            onClick={() => navigate('development-plan')}
            variant="outline"
            className="text-sm !px-4 !py-2" // Restored correct classes
          >
            Set Up Plan
          </Button>
        </div>
      )}
      {!isLoading && commitments.length > 0 && commitments.map((commit) => (
        <div key={commit.id} className={`p-4 rounded-xl flex items-center justify-between transition-all border ${ commit.status === 'Committed' ? 'bg-green-50 border-green-200 shadow-inner' : 'bg-white hover:bg-gray-50'}`}>
          <div className="flex-1 mr-4">
            <p className={`font-medium ${commit.status === 'Committed' ? 'text-green-800 line-through' : 'text-[#002E47]'}`}> {commit.text} </p>
            {commit.linkedGoal && ( <span className="text-xs text-gray-500 italic block mt-1"> Linked to: {commit.linkedGoal} </span> )}
          </div>
          <button onClick={() => onToggleCommit(commit.id)} className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${ commit.status === 'Committed' ? `bg-[${COLORS.GREEN}] border-[${COLORS.GREEN}] text-white hover:bg-green-700 focus:ring-[${COLORS.GREEN}]` : `bg-white border-gray-300 text-gray-400 hover:border-[${COLORS.TEAL}] hover:text-[${COLORS.TEAL}] focus:ring-[${COLORS.TEAL}]`}`} aria-label={commit.status === 'Committed' ? 'Undo' : 'Complete'}>
            {commit.status === 'Committed' ? <Check size={20} /> : <Zap size={18} />}
          </button>
        </div>
      ))}
    </div>
  );
};

/* =========================================================
   Reflection Log Modal Component
========================================================= */
const ReflectionLogModal = ({ isOpen, onClose, history, isLoading }) => {
  if (!isOpen) return null;
  const formatDate = (dateString) => { try { return new Date(dateString + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); } catch (e) { return dateString; } };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3"> <Archive className="text-[#47A88D]" /> Full Reflection Log </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors" aria-label="Close modal"> <X className="w-6 h-6" /> </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {isLoading && <div className="flex justify-center items-center py-12"> <Loader className="animate-spin text-[#47A88D] h-8 w-8" /> </div>}
          {!isLoading && history.length === 0 && <div className="text-center py-12"> <p className="text-gray-600 font-semibold">No reflections saved yet.</p> <p className="text-gray-500 text-sm">Complete the form to start.</p> </div>}
          {!isLoading && history.length > 0 && history.map((entry) => (
            <div key={entry.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 shadow-sm">
              <p className="text-sm font-bold text-[#002E47] mb-2 border-b pb-1"> {formatDate(entry.date)} </p>
              <div className="space-y-3">
                {entry.did && <p className="text-sm text-gray-700"><strong>Did:</strong> {entry.did}</p>}
                {entry.noticed && <p className="text-sm text-gray-700"><strong>Noticed:</strong> {entry.noticed}</p>}
                {entry.tryDiff && <p className="text-sm text-gray-700"><strong>Try:</strong> {entry.tryDiff}</p>}
                {entry.identity && <p className="text-sm text-gray-800 italic font-medium"><strong>Identity:</strong> "I'm the kind of leader who {entry.identity}"</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl text-right"> <Button onClick={onClose} variant="outline" className="text-sm !py-2 !px-4"> Close </Button> </div>
      </div>
    </div>
  );
};

/* =========================================================
   Embedded Reflection Form Component
========================================================= */
const EmbeddedReflectionForm = ({ db, userId, onOpenLog, onSaveSuccess }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedConfirmation, setIsSavedConfirmation] = useState(false);
  const [did, setDid] = useState('');
  const [noticed, setNoticed] = useState('');
  const [tryDiff, setTryDiff] = useState('');
  const [identity, setIdentity] = useState('');

  const handleSaveReflection = async () => {
    if (!did.trim() && !noticed.trim() && !tryDiff.trim() && !identity.trim()) { alert("Please fill in at least one reflection field."); return; }
    if (!db || !userId) { alert("Error: Database connection not available."); return; }
    setIsSaving(true); setIsSavedConfirmation(false);
    const reflectionEntry = { did: did.trim(), noticed: noticed.trim(), tryDiff: tryDiff.trim(), identity: identity.trim(), timestamp: serverTimestamp(), date: new Date().toISOString().split('T')[0] };
    try {
      const historyCollectionRef = collection(db, `user_commitments/${userId}/reflection_history`);
      await addDoc(historyCollectionRef, reflectionEntry);
      setIsSavedConfirmation(true); setDid(''); setNoticed(''); setTryDiff(''); setIdentity('');
      if (onSaveSuccess) { onSaveSuccess(reflectionEntry); }
      setTimeout(() => setIsSavedConfirmation(false), 3000);
    } catch (e) { console.error("Failed to save reflection to history:", e); alert("Failed to save reflection log."); }
    finally { setIsSaving(false); }
  };
  const canSave = did.trim() || noticed.trim() || tryDiff.trim() || identity.trim();

  return (
    <Card title="⚡ Daily Reflection Rep" icon={MessageSquare} accent='NAVY' className="sticky top-4">
        <p className="text-sm text-gray-600 -mt-2 mb-4"> Capture key insights from your reps. </p>
        <div className="space-y-4">
          <div> <label className="block text-sm font-semibold text-[#002E47] mb-1"> <span className="text-[#47A88D]">1.</span> What did I <strong className='text-[#47A88D]'>do</strong>? </label> <textarea value={did} onChange={(e) => setDid(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" rows="2" placeholder="e.g., Gave clear feedback..." /> </div>
          <div> <label className="block text-sm font-semibold text-[#002E47] mb-1"> <span className="text-[#47A88D]">2.</span> What did I <strong className='text-[#47A88D]'>notice</strong>? </label> <textarea value={noticed} onChange={(e) => setNoticed(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" rows="2" placeholder="e.g., I over-explained..." /> </div>
          <div> <label className="block text-sm font-semibold text-[#002E47] mb-1"> <span className="text-[#47A88D]">3.</span> What will I <strong className='text-[#47A88D]'>try</strong> differently? </label> <textarea value={tryDiff} onChange={(e) => setTryDiff(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" rows="2" placeholder="e.g., Let silence work..." /> </div>
          <div> <label className="block text-sm font-semibold text-[#002E47] mb-1"> <User className="inline-block w-4 h-4 mr-1 text-[#47A88D]" /> "I'm the kind of leader who..." </label> <input type="text" value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" placeholder="e.g., trusts my team." /> </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-4">
          {/* --- Attributes Restored --- */}
          <Button onClick={handleSaveReflection} disabled={isSaving || !canSave} variant="primary" className="flex-1 !py-2 text-base">
            {isSaving ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />} {isSaving ? 'Saving...' : 'Save to Log'}
          </Button>
          {isSavedConfirmation && ( <span className='text-xs font-bold text-green-600 flex items-center'><CheckCircle className='w-4 h-4 mr-1'/> Saved</span> )}
        </div>
        <div className="mt-4 flex justify-center">
          <Button onClick={onOpenLog} variant="outline" className="text-sm !py-2 !px-4"> <Archive className="w-4 h-4 mr-2" /> View Full Log </Button>
        </div>
    </Card>
  );
};

/* =========================================================
   AI Coach Nudge Component
========================================================= */
const AICoachNudge = ({ lastReflectionEntry, callSecureGeminiAPI, hasGeminiKey }) => {
  const [nudge, setNudge] = useState('');
  const [isLoadingNudge, setIsLoadingNudge] = useState(false);
  const [errorNudge, setErrorNudge] = useState('');

  useEffect(() => {
    if (lastReflectionEntry && callSecureGeminiAPI && hasGeminiKey && hasGeminiKey()) {
      const generateNudge = async () => {
        setIsLoadingNudge(true); setErrorNudge(''); setNudge('');
        try {
          const prompt = `Based on this user's daily reflection:\n- Did: ${lastReflectionEntry.did || 'N/A'}\n- Noticed: ${lastReflectionEntry.noticed || 'N/A'}\n- Will Try: ${lastReflectionEntry.tryDiff || 'N/A'}\n- Identity: ${lastReflectionEntry.identity || 'N/A'}\n\nAsk one brief, insightful follow-up question (under 20 words) to deepen their reflection. Frame it as a coach ("Rin Mode"). Example: "Interesting. What signal showed you that impact?"`;
          console.log("AI Coach: Sending prompt:", prompt);
          const response = await callSecureGeminiAPI({ contents: [{ parts: [{ text: prompt }] }], generation_config: { temperature: 0.7, max_output_tokens: 50 } });
          console.log("AI Coach: Received response:", response);
          const generatedText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) { setNudge(generatedText.trim().replace(/^"|"$/g, '')); }
          else { throw new Error("API response missing text."); }
        } catch (error) { console.error("AI Nudge API call failed:", error); setErrorNudge("Failed to get AI nudge."); }
        finally { setIsLoadingNudge(false); }
      };
      const timer = setTimeout(generateNudge, 500);
      return () => clearTimeout(timer);
    } else { setNudge(''); setIsLoadingNudge(false); setErrorNudge(''); if (lastReflectionEntry && hasGeminiKey && !hasGeminiKey()) { console.warn("AI Coach: Gemini API key/config missing."); } }
  }, [lastReflectionEntry, callSecureGeminiAPI, hasGeminiKey]);

  if (!isLoadingNudge && !nudge && !errorNudge) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-200 shadow-sm animate-in fade-in duration-500">
       <div className="flex items-start gap-2">
         <Bot className={`w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5 ${isLoadingNudge ? 'animate-pulse' : ''}`}/>
         {isLoadingNudge && <p className="text-sm font-medium text-purple-600 italic">Thinking...</p>}
         {errorNudge && <p className="text-sm font-semibold text-red-600">{errorNudge}</p>}
         {nudge && !isLoadingNudge && <p className="text-sm font-medium text-purple-800 italic"> {nudge} </p>}
       </div>
    </div>
  );
};

/* =========================================================
   MOCK SOCIAL FEED DATA (Placeholder)
========================================================= */
const mockSocialFeedData = [
  { id: 's1', author: 'Coach Rin', text: 'Welcome to the pod! Share your first rep when you\'re ready.', time: '1h ago' },
  { id: 's2', author: 'Alex T.', text: 'Just completed my "Listen without interrupting" rep. Harder than it sounds!', time: '30m ago' },
];

/* =========================================================
   Dashboard Screen (Main Export)
========================================================= */
const DEFAULT_HABIT_ANCHOR = "Set a daily cue!";

const DashboardScreen = () => {
  const {
    navigate, user, pdpData, commitmentData, planningData, LEADERSHIP_TIERS,
    updateCommitmentData, isLoading: isAppLoading, db, userId,
    callSecureGeminiAPI, hasGeminiKey, COMMITMENT_BANK
  } = useAppServices();

  // --- State ---
  const [isSavingRep, setIsSavingRep] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [reflectionHistory, setReflectionHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [podPosts, setPodPosts] = useState(mockSocialFeedData);
  const isArenaMode = useMemo(() => commitmentData?.arena_mode ?? true, [commitmentData]);
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [lastReflectionEntry, setLastReflectionEntry] = useState(null);

  // --- Effects & Derived Data ---
  useEffect(() => { if (isLogModalOpen && db && userId) { const fetch = async () => { setIsHistoryLoading(true); try { const q = query(collection(db,`user_commitments/${userId}/reflection_history`), orderBy("timestamp","desc")); const snap = await getDocs(q); setReflectionHistory(snap.docs.map(d=>({id:d.id,...d.data()}))); } catch(e){console.error(e);} setIsHistoryLoading(false);}; fetch(); } }, [isLogModalOpen, db, userId]);
  const displayedUserName = useMemo(() => user?.name || user?.email?.split('@')[0] || 'Leader', [user]);
  const greeting = useMemo(() => 'Welcome to The Arena,', []);
  const activeCommitments = useMemo(() => commitmentData?.active_commitments || [], [commitmentData]);
  const commitsCompleted = useMemo(() => activeCommitments.filter(c => c.status === 'Committed').length, [activeCommitments]);
  const commitsTotal = activeCommitments.length;
  const streakCount = useMemo(() => commitmentData?.streak_count || 0, [commitmentData]);
  const streakCoins = useMemo(() => commitmentData?.streak_coins || 0, [commitmentData]);
  const habitAnchor = useMemo(() => commitmentData?.habit_anchor || DEFAULT_HABIT_ANCHOR, [commitmentData]);
  const isDefaultAnchor = habitAnchor === DEFAULT_HABIT_ANCHOR;
  const whyStatement = useMemo(() => planningData?.focus_goals?.[0]?.why || "", [planningData]);
  const identityStatement = useMemo(() => {
     const lastIdentity = lastReflectionEntry?.identity || '';
     if (lastIdentity) return `I'm the kind of leader who ${lastIdentity}`;
     const journalIdentityLine = commitmentData?.reflection_journal?.split('\n').find(l => l.startsWith('Identity:'));
     const journalIdentity = journalIdentityLine?.substring(9).trim();
     return journalIdentity ? `I'm the kind of leader who ${journalIdentity}` : "Define your leader identity...";
  }, [commitmentData, lastReflectionEntry]);
  const dailyTargetRep = useMemo(() => {
     const defaultRep = { text: "Define your focus rep.", definition: "Go to your Development Plan.", microRep: "Review your goals." };
     const bank = COMMITMENT_BANK?.items || [];
     const pdpRepText = activeCommitments.find(c => c.source === 'DevelopmentPlan')?.text;
     if (pdpRepText) { const bankEntry = bank.find(r => r.text === pdpRepText); return { text: pdpRepText, definition: bankEntry?.definition || "Execute this planned action.", microRep: bankEntry?.microRep || "Take the first small step." }; }
     const catalogRepText = activeCommitments.find(c => c.source === 'Catalog')?.text;
     if (catalogRepText) { const bankEntry = bank.find(r => r.text === catalogRepText); return { text: catalogRepText, definition: bankEntry?.definition || "Practice this skill.", microRep: bankEntry?.microRep || "Do a quick practice." }; }
     const userRepText = activeCommitments.find(c => c.source === 'UserAdded')?.text;
     if (userRepText) { return { text: userRepText, definition: "Complete your custom task.", microRep: "Start your task." }; }
     return defaultRep;
   }, [activeCommitments, COMMITMENT_BANK]);
  const weakestTier = useMemo(() => {
     const scores = pdpData?.assessment?.scores; if (!scores || !LEADERSHIP_TIERS) return { name: 'Getting Started', hex: COLORS.AMBER };
     const sorted = Object.values(scores).sort((a, b) => a.score - b.score); const weakest = sorted[0]; if (!weakest) return { name: 'Getting Started', hex: COLORS.AMBER };
     const tierKey = Object.keys(LEADERSHIP_TIERS).find(key => LEADERSHIP_TIERS[key].name.includes(weakest.name.split(' ')[0])) || 'T1';
     const meta = LEADERSHIP_TIERS[tierKey]; return { name: weakest.name, hex: meta?.hex || COLORS.ORANGE };
   }, [pdpData, LEADERSHIP_TIERS]);

  // --- Handlers ---
  const triggerCelebration = () => { setShowCelebration(true); setTimeout(() => setShowCelebration(false), 1500); };
  const handleToggleCommitment = useCallback(async (commitId) => {
      if (isSavingRep) return; setIsSavingRep(true);
      const currentCommits = commitmentData?.active_commitments || [];
      const targetCommit = currentCommits.find(c => c.id === commitId);
      if (!targetCommit) { setIsSavingRep(false); return; }
      const newStatus = targetCommit.status === 'Committed' ? 'Pending' : 'Committed';
      const updatedCommitments = currentCommits.map(c => c.id === commitId ? { ...c, status: newStatus } : c);
      const updates = { active_commitments: updatedCommitments };
      try {
        if (newStatus === 'Committed') {
          const currentStreak = streakCount || 0; const newStreak = currentStreak + 1; updates.streak_count = newStreak;
          if (newStreak > 0 && newStreak % 7 === 0) { const currentCoins = streakCoins || 0; updates.streak_coins = currentCoins + 2; }
        }
        await updateCommitmentData(updates);
        if (newStatus === 'Committed') { triggerCelebration(); }
      } catch (error) { console.error("Failed to update rep status:", error); }
      finally { setIsSavingRep(false); }
    }, [commitmentData, updateCommitmentData, isSavingRep, streakCount, streakCoins]);
  const handleCommitMicroRep = () => { console.log("Committing micro-rep!"); triggerCelebration(); };
  const handleShareToPod = (postText) => { console.log("Sharing to pod:", postText); setPodPosts([{ id:`s${podPosts.length+1}`, author: displayedUserName, text: postText, time:"Just now" }, ...podPosts]); };
  const handleReflectionSaved = (savedEntry) => { setLastReflectionEntry(savedEntry); setTimeout(() => setLastReflectionEntry(null), 500); };
  const handleModeToggle = async () => {
      if (isSavingMode) return; setIsSavingMode(true); const newMode = !isArenaMode;
      try { await updateCommitmentData({ arena_mode: newMode }); }
      catch (error) { console.error("Failed to update mode:", error); alert("Could not switch mode."); }
      finally { setIsSavingMode(false); }
    };

  // --- Main Render ---
  if (isAppLoading && !commitmentData && !pdpData) { return <div className="min-h-screen flex items-center justify-center"> <Loader className="animate-spin text-[#47A88D] h-12 w-12" /> Loading...</div>; }

  return (
    <div className={`p-6 space-y-6 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
      <CelebrationOverlay show={showCelebration} />
      <ReflectionLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} history={reflectionHistory} isLoading={isHistoryLoading} />

      {/* 1. Header */}
      <div className={`bg-[${COLORS.OFF_WHITE}] p-6 -mx-6 -mt-6 mb-4 rounded-b-xl shadow-md border-b-4 border-[${COLORS.TEAL}]`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className={`text-3xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3`}> <Home size={28} style={{ color: COLORS.TEAL }} /> The Arena </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <StreakTracker streakCount={streakCount} coins={streakCoins} />
            <Button onClick={() => navigate('weekly-recap')} variant="outline" className="text-sm !py-2 !px-4"> <Calendar className="w-4 h-4 mr-2" /> Weekly Recap </Button>
            <ModeSwitch isArenaMode={isArenaMode} onToggle={handleModeToggle} isLoading={isSavingMode} />
          </div>
        </div>
        <p className="text-gray-600 text-base mt-4"> {greeting} <span className={`font-semibold text-[${COLORS.NAVY}]`}>{displayedUserName}</span>. Your focus: <strong style={{ color: weakestTier?.hex || COLORS.NAVY }}>{weakestTier?.name || 'Getting Started'}</strong>. </p>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
           <Card title="🎯 Today's Strategic Focus" icon={Target} accent='NAVY'>
              <div className='grid md:grid-cols-2 gap-6'>
                 <div> <p className='text-sm font-semibold ...'><Flag /> Target Rep:</p> <p className='text-lg font-bold ...'>{dailyTargetRep.text}</p> </div>
                 <div> <p className='text-sm font-semibold ...'><CheckCircle /> What Good Looks Like:</p> <p className='text-sm italic ...'>{dailyTargetRep.definition}</p> </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200"> <p className='text-sm font-semibold ...'><User /> Identity Anchor:</p> <p className='text-md italic ...'>"{identityStatement}"</p> </div>
           </Card>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <WhyItMattersCard statement={whyStatement} onPersonalize={() => navigate('development-plan')} />
             <HabitAnchorCard anchor={habitAnchor} onEdit={() => navigate('settings-anchors')} isDefault={isDefaultAnchor} />
           </div>
           <Card title={`⏳ Today's Reps (${commitsCompleted}/${commitsTotal})`} icon={Clock} accent='TEAL'>
             <EmbeddedDailyReps commitments={activeCommitments} onToggleCommit={handleToggleCommitment} isLoading={isSavingRep || (isAppLoading && !commitmentData)} microRepText={dailyTargetRep.microRep} onCommitMicroRep={handleCommitMicroRep} />
           </Card>
           <SocialPodFeed feed={podPosts} onShare={handleShareToPod} isArenaMode={isArenaMode} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">
             <EmbeddedReflectionForm db={db} userId={userId} onOpenLog={() => setIsLogModalOpen(true)} onSaveSuccess={handleReflectionSaved} />
             <AICoachNudge lastReflectionEntry={lastReflectionEntry} callSecureGeminiAPI={callSecureGeminiAPI} hasGeminiKey={hasGeminiKey} />
        </div>
      </div>

       {/* Footer */}
       <div className="text-center text-xs text-gray-500 pt-6 border-t mt-6"> Remember: Consistency compounds. Log your reps daily and complete your reflection. </div>
    </div>
  );
};

export default DashboardScreen;