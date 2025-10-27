// src/components/screens/Dashboard.jsx (Target Rep Logic + Completion Button + Separate Catalogs)
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
    <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }} onClick={onClick}>
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
      {/* Icon removed per previous request */}
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
      <div className="bg-black/50 backdrop-blur-sm rounded-full p-8 animate-ping absolute opacity-75"> {/* Effect */}
        {/* <div className="text-6xl animate-bounce">🎉</div> */}
      </div>
       <div className="relative bg-white p-6 rounded-xl shadow-2xl border-4 border-green-500 transform scale-100 animate-in zoom-in-50 fade-in duration-300">
         <p className="text-2xl font-bold text-gray-800">Nice Rep! 🎉</p>
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
        <div className="flex items-center gap-1 border-l pl-3 ml-1">
           <Trophy className="w-4 h-4 text-amber-500"/>
           <span className="font-semibold text-sm text-amber-600">{coins} Coins</span>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   Why It Matters Component (UPDATED)
========================================================= */
const WhyItMattersCard = ({ statement, onPersonalize }) => (
  <Card title="💖 Why It Matters" icon={Heart} accent="ORANGE">
    <p className="text-md italic text-gray-700 mb-4">"{statement || 'Connect your actions to a deeper purpose...'}"</p>
    <Button onClick={onPersonalize} variant="outline" className="text-sm !py-2 !px-4 w-full">
        <Edit3 className="w-4 h-4 mr-2" /> Personalize Your "Why"
    </Button>
  </Card>
);

/* =========================================================
   Habit Anchor Component
========================================================= */
const HabitAnchorCard = ({ anchor, onEdit, isDefault }) => (
  <Card title="⚓ Habit Anchor" icon={Anchor} accent="BLUE">
    {isDefault ? ( <p className="text-md font-medium text-gray-500 italic mb-4"> Set a daily cue to build consistency! </p> )
     : ( <> <p className="text-sm font-semibold text-gray-500 uppercase">Your Cue:</p> <p className="text-md font-medium text-gray-800 mb-4">{anchor}</p> </> )}
    <Button onClick={onEdit} variant="outline" className="text-sm !py-2 !px-4 w-full"> <Edit3 className="w-4 h-4 mr-2" /> Set Habit Anchor </Button>
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
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-4 border-b pb-3">
            {feed.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">Pod feed is quiet...</p>}
            {feed.map((post) => (
              <div key={post.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-800">{post.text}</p>
                <span className="text-xs text-gray-500 mt-1 block">{post.author} - {post.time}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 mt-4">
            <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.PURPLE}]" rows="2" placeholder="Share your rep or a win..." />
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
   (Shows *additional* reps beyond the main Target Rep)
========================================================= */
// --- UPDATED: Removed microRepText and related button ---
const EmbeddedDailyReps = ({ commitments, onToggleCommit, isLoading }) => {
  const { navigate } = useAppServices();

  // No need to filter here if parent component already does
  const additionalCommitments = useMemo(() => commitments || [], [commitments]);

  return (
    <div className="space-y-3">
      {/* Removed 2-Min Challenge Button from here */}
      {isLoading && <div className="p-4 text-center text-gray-500 flex items-center justify-center"><Loader className="animate-spin w-4 h-4 mr-2"/>Loading reps...</div>}

      {/* Message if NO additional reps exist */}
      {!isLoading && additionalCommitments.length === 0 && (
        <div className="p-4 text-center text-sm text-gray-500 italic border border-dashed rounded-lg">
           No additional reps added for today. Add more from your Development Plan.
        </div>
      )}

      {/* Render the list of additional commitments */}
      {!isLoading && additionalCommitments.length > 0 && additionalCommitments.map((commit) => (
        <div key={commit.id} className={`p-4 rounded-xl flex items-center justify-between transition-all border ${ commit.status === 'Committed' ? 'bg-green-50 border-green-200 shadow-inner' : 'bg-white hover:bg-gray-50/70 border-gray-200 shadow-sm'}`}>
          <div className="flex-1 mr-4">
            <p className={`font-medium ${commit.status === 'Committed' ? 'text-green-700 line-through decoration-green-400' : 'text-[#002E47]'}`}> {commit.text} </p>
            {commit.linkedGoal && ( <span className="text-xs text-gray-500 italic block mt-1"> Linked to: {commit.linkedGoal} </span> )}
          </div>
          {/* Use the standard toggle commit handler */}
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
   Identity Anchor Modal Component (VERIFIED Safety Check)
========================================================= */
const IdentityAnchorModal = ({ isOpen, onClose, currentIdentity, onSave, suggestions = [] }) => {
  if (!isOpen) return null;

  const prefix = "I'm the kind of leader who ";
  const defaultPlaceholder = "Define your leader identity...";
  const getEditablePart = (fullIdentity) => {
    if (fullIdentity === defaultPlaceholder) return "";
    return fullIdentity?.startsWith(prefix) ? fullIdentity.substring(prefix.length) : (fullIdentity || "");
  };

  const [identityText, setIdentityText] = useState(getEditablePart(currentIdentity));
  const [isSaving, setIsSaving] = useState(false);

  // --- VERIFIED: Ensure suggestions is always an array before mapping ---
  const suggestionItems = Array.isArray(suggestions) ? suggestions : [];

  const handleSaveClick = async () => {
    if (!identityText.trim()) { alert("Please provide an identity statement."); return; }
    setIsSaving(true);
    try {
      await onSave(identityText.trim());
      // Let parent handle close on success
    } catch (e) { console.error("Save identity failed", e); /* Parent shows alert */ }
    finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3"> <User className="text-[#47A88D]" /> Set Identity Anchor </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors" aria-label="Close modal"> <X className="w-6 h-6" /> </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-md font-medium text-gray-600">I'm the kind of leader who...</p>
          </div>
          <textarea
            value={identityText}
            onChange={(e) => setIdentityText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]"
            rows="3"
            placeholder="...trusts my team."
          />
          {/* --- VERIFIED: Check suggestionItems.length --- */}
          {suggestionItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Or, start with a suggestion:</p>
              <div className="flex flex-wrap gap-2">
                {/* --- VERIFIED: Map over suggestionItems --- */}
                {suggestionItems.map((suggestion, idx) => (
                  <button
                    key={`${suggestion}-${idx}`} // Use suggestion text itself + index
                    onClick={() => setIdentityText(suggestion)} // Assuming suggestions are strings
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex justify-end items-center gap-4">
          <Button onClick={onClose} variant="outline" className="text-sm !py-2 !px-4"> Cancel </Button>
          <Button onClick={handleSaveClick} variant="primary" className="text-sm !py-2 !px-4" disabled={isSaving || !identityText.trim()}>
            {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Anchor
          </Button>
        </div>
      </div>
    </div>
  );
};


/* =========================================================
   Habit Anchor Modal Component (VERIFIED Safety Check)
========================================================= */
const HabitAnchorModal = ({ isOpen, onClose, currentAnchor, onSave, suggestions = [], defaultAnchorText }) => {
  if (!isOpen) return null;

  const getEditablePart = (fullAnchor) => (fullAnchor === defaultAnchorText ? "" : fullAnchor || "");
  const [anchorText, setAnchorText] = useState(getEditablePart(currentAnchor));
  const [isSaving, setIsSaving] = useState(false);

  // --- VERIFIED: Ensure suggestions is always an array ---
  const suggestionItems = Array.isArray(suggestions) ? suggestions : [];

  const handleSaveClick = async () => {
     if (!anchorText.trim()) { alert("Please provide a habit anchor."); return; }
     setIsSaving(true);
     try {
       await onSave(anchorText.trim());
       // Let parent handle close
     } catch (e) { console.error("Save habit failed", e); /* Parent shows alert */ }
     finally { setIsSaving(false); }
   };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3"> <Anchor className="text-[#2563EB]" /> Set Habit Anchor </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors" aria-label="Close modal"> <X className="w-6 h-6" /> </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-md font-medium text-gray-600">Set your daily cue (e.g., "After my morning coffee"):</p>
          </div>
          <textarea
            value={anchorText}
            onChange={(e) => setAnchorText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB]"
            rows="3"
            placeholder="When will you do your daily reps?"
          />
          {/* --- VERIFIED: Check suggestionItems.length --- */}
          {suggestionItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Or, start with a suggestion:</p>
              <div className="flex flex-wrap gap-2">
                 {/* --- VERIFIED: Map over suggestionItems --- */}
                {suggestionItems.map((suggestion, idx) => (
                  <button
                    key={`${suggestion}-${idx}`}
                    onClick={() => setAnchorText(suggestion)} // Assuming suggestions are strings
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex justify-end items-center gap-4">
          <Button onClick={onClose} variant="outline" className="text-sm !py-2 !px-4"> Cancel </Button>
          <Button onClick={handleSaveClick} variant="primary" className="text-sm !py-2 !px-4" disabled={isSaving || !anchorText.trim()}>
            {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Anchor
          </Button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   Why It Matters Modal Component (VERIFIED Safety Check)
========================================================= */
const WhyItMattersModal = ({ isOpen, onClose, currentWhy, onSave, suggestions = [] }) => {
  if (!isOpen) return null;

  const [whyText, setWhyText] = useState(currentWhy || "");
  const [isSaving, setIsSaving] = useState(false);

  // --- VERIFIED: Ensure suggestions is always an array ---
  const suggestionItems = Array.isArray(suggestions) ? suggestions : [];

  const handleSaveClick = async () => {
    if (!whyText.trim()) { alert("Please provide your 'Why It Matters' statement."); return; }
    setIsSaving(true);
    try { await onSave(whyText.trim()); /* Parent handles close */ }
    catch (e) { console.error("Save Why failed", e); /* Parent shows alert */ }
    finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3"> <Heart className="text-[#E04E1B]" /> Personalize Your "Why" </h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100 transition-colors" aria-label="Close modal"> <X className="w-6 h-6" /> </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-md font-medium text-gray-600">Why does achieving your focus goal matter?</p>
          </div>
          <textarea
            value={whyText}
            onChange={(e) => setWhyText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E04E1B]"
            rows="4"
            placeholder="e.g., This will help my team feel more empowered..."
          />
           {/* --- VERIFIED: Check suggestionItems.length --- */}
          {suggestionItems.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-2">Or, start with a suggestion:</p>
              <div className="flex flex-wrap gap-2">
                 {/* --- VERIFIED: Map over suggestionItems --- */}
                {suggestionItems.map((suggestion, idx) => (
                  <button
                     key={`${suggestion}-${idx}`}
                    onClick={() => setWhyText(suggestion)} // Assuming suggestions are strings
                    className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl flex justify-end items-center gap-4">
          <Button onClick={onClose} variant="outline" className="text-sm !py-2 !px-4"> Cancel </Button>
          <Button onClick={handleSaveClick} variant="secondary" className="text-sm !py-2 !px-4" disabled={isSaving || !whyText.trim()}>
            {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save "Why"
          </Button>
        </div>
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
  const [identity, setIdentity] = useState(''); // Reflection input

  const handleSaveReflection = async () => {
    // Basic validation
    if (!did.trim() && !noticed.trim() && !tryDiff.trim() && !identity.trim()) {
       alert("Please fill in at least one reflection field.");
       return;
    }
    if (!db || !userId) {
       alert("Error: Database connection not available.");
       return;
    }

    setIsSaving(true);
    setIsSavedConfirmation(false); // Reset confirmation on new save attempt
    const reflectionEntry = {
        did: did.trim(),
        noticed: noticed.trim(),
        tryDiff: tryDiff.trim(),
        identity: identity.trim(), // Save the reflection identity input
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0] // Store date for easier querying
    };

    try {
      const historyCollectionRef = collection(db, `user_commitments/${userId}/reflection_history`);
      const savedDoc = await addDoc(historyCollectionRef, reflectionEntry); // Get saved doc ref
      setIsSavedConfirmation(true);
      // Clear fields on successful save
      setDid('');
      setNoticed('');
      setTryDiff('');
      setIdentity(''); // Clear reflection identity input
      if (onSaveSuccess) {
          // Pass the saved data (or at least the identity part) for potential AI nudge
          onSaveSuccess({ id: savedDoc.id, ...reflectionEntry, timestamp: new Date() }); // Approximate timestamp locally
      }
      setTimeout(() => setIsSavedConfirmation(false), 3000); // Hide confirmation after 3s
    } catch (e) {
      console.error("Failed to save reflection to history:", e);
      alert("Failed to save reflection log. Please check console for details.");
    } finally {
      setIsSaving(false);
    }
  };
  const canSave = did.trim() || noticed.trim() || tryDiff.trim() || identity.trim();

  return (
    <Card title="⚡ Daily Reflection Rep" icon={MessageSquare} accent='NAVY' className="sticky top-4">
        <p className="text-sm text-gray-600 -mt-2 mb-4"> Capture key insights from your reps. </p>
        <div className="space-y-4">
          <div> <label className="block text-sm font-semibold text-[#002E47] mb-1"> <span className="text-[#47A88D]">1.</span> What did I <strong className='text-[#47A88D]'>do</strong>? </label> <textarea value={did} onChange={(e) => setDid(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" rows="2" placeholder="e.g., Gave clear feedback..." /> </div>
          <div> <label className="block text-sm font-semibold text-[#002E47] mb-1"> <span className="text-[#47A88D]">2.</span> What did I <strong className='text-[#47A88D]'>notice</strong>? </label> <textarea value={noticed} onChange={(e) => setNoticed(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" rows="2" placeholder="e.g., I over-explained..." /> </div>
          <div> <label className="block text-sm font-semibold text-[#002E47] mb-1"> <span className="text-[#47A88D]">3.</span> What will I <strong className='text-[#47A88D]'>try</strong> differently? </label> <textarea value={tryDiff} onChange={(e) => setTryDiff(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" rows="2" placeholder="e.g., Let silence work..." /> </div>
          <div> <label className="block text-sm font-semibold text-[#002E47] mb-1"> <User className="inline-block w-4 h-4 mr-1 text-[#47A88D]" /> "I'm the kind of leader who..." (Reflection) </label> <input type="text" value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D]" placeholder="e.g., trusts my team. (Optional)" title="This reflection field is saved daily. Use 'Set Identity Anchor' for your persistent identity."/> </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-4">
          <Button onClick={handleSaveReflection} disabled={isSaving || !canSave} variant="primary" className="flex-1 !py-2 text-base">
            {isSaving ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />} {isSaving ? 'Saving...' : 'Save to Log'}
          </Button>
          {isSavedConfirmation && ( <span className='text-xs font-bold text-green-600 flex items-center shrink-0'><CheckCircle className='w-4 h-4 mr-1'/> Saved</span> )}
        </div>
        <div className="mt-4 flex justify-center">
          <Button onClick={onOpenLog} variant="outline" className="text-sm !py-2 !px-4"> <Archive className="w-4 h-4 mr-2" /> View Full Log </Button>
        </div>
    </Card>
  );
};

/* =========================================================
   AI Coach Nudge Component (UPDATED: Removed static text)
========================================================= */
const AICoachNudge = ({ lastReflectionEntry, callSecureGeminiAPI, hasGeminiKey }) => {
  const [nudge, setNudge] = useState('');
  const [isLoadingNudge, setIsLoadingNudge] = useState(false);
  const [errorNudge, setErrorNudge] = useState('');

  // UseEffect to generate nudge when lastReflectionEntry changes
  useEffect(() => {
    // Only proceed if we have a recent reflection entry and API capability
    if (lastReflectionEntry && lastReflectionEntry.id && callSecureGeminiAPI && hasGeminiKey && hasGeminiKey()) {
      const generateNudge = async () => {
        setIsLoadingNudge(true);
        setErrorNudge('');
        setNudge(''); // Clear previous nudge
        try {
          // Construct prompt using the *last saved* reflection entry data
          const prompt = `Based on this user's daily reflection:\n- Did: ${lastReflectionEntry.did || 'N/A'}\n- Noticed: ${lastReflectionEntry.noticed || 'N/A'}\n- Will Try: ${lastReflectionEntry.tryDiff || 'N/A'}\n- Identity (Reflection): ${lastReflectionEntry.identity || 'N/A'}\n\nPlease act as Coach Rin and ask one brief, insightful follow-up question (under 20 words) to deepen their reflection. Do NOT include any preamble like "Okay, based on that..." or closing remarks. Just the question. Example: "Interesting. What signal showed you that impact?"`; // Updated prompt

          console.log("AI Coach: Sending prompt based on reflection:", lastReflectionEntry.id, prompt);

          const response = await callSecureGeminiAPI({
              contents: [{ parts: [{ text: prompt }] }],
              generation_config: { temperature: 0.7, max_output_tokens: 50 } // Keep it concise
          });

          console.log("AI Coach: Received response:", response);
          const generatedText = response?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (generatedText) {
            // Clean up response (remove quotes, etc.)
            setNudge(generatedText.trim().replace(/^"|"$/g, '').replace(/\*$/, ''));
          } else {
            throw new Error("API response did not contain expected text.");
          }
        } catch (error) {
          console.error("AI Nudge API call failed:", error);
          setErrorNudge("Couldn't get an AI insight right now.");
        } finally {
          setIsLoadingNudge(false);
        }
      };
      // Debounce the call slightly
      const timer = setTimeout(generateNudge, 300);
      return () => clearTimeout(timer); // Cleanup timer on unmount or re-trigger
    } else {
      // Clear nudge if conditions aren't met
      setNudge('');
      setIsLoadingNudge(false);
      setErrorNudge('');
      if (lastReflectionEntry && hasGeminiKey && !hasGeminiKey()) {
        console.warn("AI Coach: Gemini API key/config missing.");
        // setErrorNudge("AI Coach disabled (API key missing)."); // Optional user-facing message
      }
    }
  // Depend on the ID of the last reflection entry to re-trigger nudge
  }, [lastReflectionEntry?.id, callSecureGeminiAPI, hasGeminiKey]);

  // --- UPDATED: Conditionally render only when there's something to show ---
  if (!isLoadingNudge && !nudge && !errorNudge) {
      // If nothing is happening, render a minimal placeholder or nothing
      // For now, let's render a subtle prompt if NO reflection has been saved yet today (or ever)
      // We need a way to know if a reflection was saved today... for now, let's assume if lastReflectionEntry is null/old, show prompt
       if (!lastReflectionEntry) {
          return (
             <div className="mt-4 p-4 rounded-xl bg-gray-100 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-2">
                  <Bot className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-sm font-medium text-gray-500 italic">Save your reflection above to get feedback from Coach Rin.</p>
                </div>
             </div>
          );
       }
       return null; // Don't render anything if there was a previous reflection but no current activity
  }

  // --- Render loading, error, or the generated nudge ---
  return (
    <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border border-purple-200 shadow-sm animate-in fade-in duration-500">
       <div className="flex items-start gap-2">
         <Bot className={`w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5 ${isLoadingNudge ? 'animate-pulse' : ''}`}/>
         <div className="flex-1">
           {isLoadingNudge && <p className="text-sm font-medium text-purple-600 italic">Rin is thinking...</p>}
           {errorNudge && <p className="text-sm font-semibold text-red-600">{errorNudge}</p>}
           {nudge && !isLoadingNudge && <p className="text-sm font-medium text-purple-800 italic">{nudge}</p>} {/* Removed "Coach Rin:" prefix */}
         </div>
       </div>
    </div>
  );
};


/* =========================================================
   MOCK SOCIAL FEED DATA (Placeholder - Consider replacing with real data fetch)
========================================================= */
const mockSocialFeedData = [
  { id: 's1', author: 'Coach Rin', text: 'Welcome to the pod! Share your first rep when you\'re ready.', time: '1h ago' },
  { id: 's2', author: 'Alex T.', text: 'Just completed my "Listen without interrupting" rep. Harder than it sounds!', time: '30m ago' },
  // Add more mock posts if needed
];

/* =========================================================
   Dashboard Screen (Main Export - Target Rep Update)
========================================================= */
const DEFAULT_HABIT_ANCHOR = "Set a daily cue!";
const DEFAULT_WHY_STATEMENT = "Connect your actions to a deeper purpose...";
const DEFAULT_IDENTITY_PLACEHOLDER = "Define your leader identity..."; // For display
const DEFAULT_TARGET_REP = { id: 'default', text: "Set Your Focus", definition: "Go to your Development Plan to select a target rep for the day.", microRep: "Review Development Plan", status: 'Pending' }; // Added status


const DashboardScreen = () => {
  const {
    navigate, user, pdpData, commitmentData, planningData, LEADERSHIP_TIERS,
    updateCommitmentData, updatePlanningData, // Use correct update function for planning data
    isLoading: isAppLoading, db, userId,
    callSecureGeminiAPI, hasGeminiKey, COMMITMENT_BANK, TARGET_REP_CATALOG, // <-- Added TARGET_REP_CATALOG
    // --- Catalogs from services ---
    IDENTITY_ANCHOR_CATALOG, HABIT_ANCHOR_CATALOG, WHY_CATALOG
  } = useAppServices();

  // --- State ---
  const [isSavingRep, setIsSavingRep] = useState(false); // Used for saving BOTH target and additional reps
  const [showCelebration, setShowCelebration] = useState(false);
  const [showChallengePrompt, setShowChallengePrompt] = useState(false); // <-- NEW: State for 2-min challenge prompt
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [reflectionHistory, setReflectionHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [podPosts, setPodPosts] = useState(mockSocialFeedData); // Consider fetching this
  const isArenaMode = useMemo(() => commitmentData?.arena_mode ?? true, [commitmentData]);
  const [isSavingMode, setIsSavingMode] = useState(false);
  const [lastReflectionEntry, setLastReflectionEntry] = useState(null); // Used for AI Nudge
  // --- Modal states ---
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);


  // --- Effects & Derived Data ---
  // Fetch reflection history when modal opens
  useEffect(() => {
    if (isLogModalOpen && db && userId) {
       const fetchHistory = async () => {
         setIsHistoryLoading(true);
         try {
           const q = query(collection(db,`user_commitments/${userId}/reflection_history`), orderBy("timestamp","desc"));
           const snap = await getDocs(q);
           setReflectionHistory(snap.docs.map(d=>({id:d.id,...d.data(), timestamp: d.data().timestamp?.toDate() }))); // Convert timestamp
         } catch(e){
           console.error("Failed to fetch reflection history:", e);
           setReflectionHistory([]); // Clear on error
         } finally {
           setIsHistoryLoading(false);
         }
       };
       fetchHistory();
    }
  }, [isLogModalOpen, db, userId]);

  const displayedUserName = useMemo(() => user?.name || user?.email?.split('@')[0] || 'Leader', [user]);
  const greeting = useMemo(() => 'Welcome to The Arena,', []);

  // Additional commitments (filter out target rep later)
  const activeCommitments = useMemo(() => commitmentData?.active_commitments || [], [commitmentData]);

  const streakCount = useMemo(() => commitmentData?.streak_count || 0, [commitmentData]);
  const streakCoins = useMemo(() => commitmentData?.streak_coins || 0, [commitmentData]);
  const habitAnchor = useMemo(() => commitmentData?.habit_anchor || DEFAULT_HABIT_ANCHOR, [commitmentData]);
  const isDefaultAnchor = habitAnchor === DEFAULT_HABIT_ANCHOR;

  // whyStatement pulls from planningData (which is roadmap doc)
  const whyStatement = useMemo(() => planningData?.focus_goals?.[0]?.why || DEFAULT_WHY_STATEMENT, [planningData]);

  // identityStatement uses dedicated field from commitmentData
  const identityStatement = useMemo(() => {
     return commitmentData?.identity_anchor
       ? `I'm the kind of leader who ${commitmentData.identity_anchor}`
       : DEFAULT_IDENTITY_PLACEHOLDER;
  }, [commitmentData]);

   // --- UPDATED: dailyTargetRep logic ---
   const dailyTargetRep = useMemo(() => {
    const targetCatalog = TARGET_REP_CATALOG?.items || [];
    if (targetCatalog.length === 0) return DEFAULT_TARGET_REP;

    // Get today's date in YYYY-MM-DD format for consistent selection
    const today = new Date().toISOString().split('T')[0];

    // --- Simple Selection Logic: Use Weakest Tier ---
    // Find the tier ID associated with the weakest tier name
    const scores = pdpData?.assessment?.scores;
    let weakestTierId = 'T1'; // Default
    if (scores && LEADERSHIP_TIERS) {
        const sorted = Object.values(scores).sort((a, b) => a.score - b.score);
        const weakest = sorted[0];
        if (weakest) {
           const tierKey = Object.keys(LEADERSHIP_TIERS).find(key => LEADERSHIP_TIERS[key].name.includes(weakest.name.split(' ')[0]));
           weakestTierId = tierKey || 'T1';
        }
    }

    // Find the first rep in the catalog matching the weakest tier
    let selectedRepData = targetCatalog.find(rep => rep.tier_id === weakestTierId);

    // Fallback: If no match for weakest tier, pick the first rep overall
    if (!selectedRepData) {
        selectedRepData = targetCatalog[0];
    }

    if (!selectedRepData) return DEFAULT_TARGET_REP; // Still no rep found

    // Check the user's saved status for *this specific rep ID* for *today*
    // We'll store status in commitmentData like: dailyTargetRepStatus_focus-001_2025-10-27: 'Committed'
    // For simplicity now, let's use the fields added in useAppServices: dailyTargetRepId and dailyTargetRepStatus
    // We need to ensure these fields reset daily (or are interpreted daily) - a server function or client-side logic on load could handle this.
    // Assuming for now: if commitmentData.dailyTargetRepId matches selectedRepData.id, use commitmentData.dailyTargetRepStatus

    let currentStatus = 'Pending';
    if (commitmentData?.dailyTargetRepId === selectedRepData.id) {
        currentStatus = commitmentData.dailyTargetRepStatus || 'Pending';
    } else {
        // If the ID in user data doesn't match today's selected rep, assume today's is pending
        // This implies a need to potentially reset dailyTargetRepId/Status daily.
        // For now, this logic works if the ID mismatch means it's a new day's rep.
        currentStatus = 'Pending';
    }


    return {
        id: selectedRepData.id,
        text: selectedRepData.text,
        definition: selectedRepData.definition,
        microRep: selectedRepData.microRep,
        status: currentStatus // Use the status from user data or default to Pending
    };

   }, [TARGET_REP_CATALOG, pdpData, LEADERSHIP_TIERS, commitmentData]);

    // --- Filter additional commitments ---
    const additionalCommitments = useMemo(() => {
       return activeCommitments.filter(c => c.id !== dailyTargetRep.id);
    }, [activeCommitments, dailyTargetRep.id]);

    // --- Calculate total completed (target + additional) ---
    const targetRepCompleted = dailyTargetRep.status === 'Committed' ? 1 : 0;
    const additionalCommitsCompleted = useMemo(() => additionalCommitments.filter(c => c.status === 'Committed').length, [additionalCommitments]);
    const commitsCompleted = targetRepCompleted + additionalCommitsCompleted;
    const commitsTotal = 1 + additionalCommitments.length; // Always 1 target + additional


  // weakestTier calculation remains the same
  const weakestTier = useMemo(() => {
     const scores = pdpData?.assessment?.scores; if (!scores || !LEADERSHIP_TIERS) return { name: 'Getting Started', hex: COLORS.AMBER };
     const sorted = Object.values(scores).sort((a, b) => a.score - b.score); const weakest = sorted[0]; if (!weakest) return { name: 'Getting Started', hex: COLORS.AMBER };
     const tierKey = Object.keys(LEADERSHIP_TIERS).find(key => LEADERSHIP_TIERS[key].name.includes(weakest.name.split(' ')[0])) || 'T1';
     const meta = LEADERSHIP_TIERS[tierKey]; return { name: weakest.name, hex: meta?.hex || COLORS.ORANGE };
   }, [pdpData, LEADERSHIP_TIERS]);

  // --- Handlers ---
  const triggerCelebration = (showChallenge = false) => {
    setShowCelebration(true);
    setShowChallengePrompt(false); // Hide challenge initially
    setTimeout(() => {
        setShowCelebration(false);
        // Only show challenge if flag is true AND there's microRep text
        if (showChallenge && dailyTargetRep.microRep && dailyTargetRep.id !== 'default') {
            setShowChallengePrompt(true); // Show challenge prompt after celebration
        }
    }, 1500); // Duration of celebration
  };

  // --- UPDATED: handleToggleCommitment now ONLY handles ADDITIONAL reps ---
  const handleToggleAdditionalCommitment = useCallback(async (commitId) => {
      if (isSavingRep) return; setIsSavingRep(true);
      const currentCommits = commitmentData?.active_commitments || [];
      const targetCommitIndex = currentCommits.findIndex(c => c.id === commitId);
      if (targetCommitIndex === -1) {
          console.warn("Attempted to toggle non-existent additional commitment:", commitId);
          setIsSavingRep(false); return;
      }

      const targetCommit = currentCommits[targetCommitIndex];
      // Ensure we are not accidentally toggling the target rep via this function
      if (targetCommit.id === dailyTargetRep.id) {
          console.warn("Attempted to toggle target rep via additional rep handler. Use completeTargetRep instead.");
          setIsSavingRep(false); return;
      }

      const newStatus = targetCommit.status === 'Committed' ? 'Pending' : 'Committed';
      const updatedCommitments = [
          ...currentCommits.slice(0, targetCommitIndex),
          { ...targetCommit, status: newStatus },
          ...currentCommits.slice(targetCommitIndex + 1)
      ];

      // Only update active_commitments, don't touch streak here (streak tied to Target Rep completion)
      const updates = { active_commitments: updatedCommitments };

      try {
        await updateCommitmentData(updates);
        // Maybe a smaller celebration for additional reps? For now, no separate celebration.
      } catch (error) {
        console.error("Failed to update additional rep status:", error);
        alert("Error updating additional rep. Please try again.");
      } finally {
        setIsSavingRep(false);
      }
    }, [commitmentData, updateCommitmentData, isSavingRep, dailyTargetRep.id]);


  // --- NEW: Handler specifically for completing the Target Rep ---
  const completeTargetRep = useCallback(async () => {
      if (isSavingRep || dailyTargetRep.id === 'default' || dailyTargetRep.status === 'Committed') return;
      setIsSavingRep(true);

      const newStatus = 'Committed'; // Only handle completion here
      const updates = {
          dailyTargetRepId: dailyTargetRep.id, // Ensure ID is set
          dailyTargetRepStatus: newStatus
      };
      let updatedStreak = streakCount;
      let updatedCoins = streakCoins;

      try {
          // Update Streak and Coins on Target Rep completion
          updatedStreak = (streakCount || 0) + 1;
          updates.streak_count = updatedStreak;
          if (updatedStreak > 0 && updatedStreak % 7 === 0) { // Award coins every 7 days
            updatedCoins = (streakCoins || 0) + 2;
            updates.streak_coins = updatedCoins;
          }

          await updateCommitmentData(updates);
          triggerCelebration(true); // Trigger celebration AND challenge prompt

      } catch (error) {
          console.error("Failed to update target rep status:", error);
          alert("Error completing target rep. Please try again.");
      } finally {
          setIsSavingRep(false);
      }
  }, [updateCommitmentData, isSavingRep, dailyTargetRep, streakCount, streakCoins]); // Added dependencies


  // Renamed for clarity: This specifically handles the *Micro* Rep action
  const handleDoMicroRep = () => {
      console.log("Committing 2-Minute Challenge / Micro-Rep action!");
      // Optionally add logic here: Mark micro-rep done, maybe grant small reward?
      setShowChallengePrompt(false); // Hide the prompt after action
      // Consider a smaller celebration?
      // triggerCelebration(false); // Maybe don't trigger full celebration again
  };

  const handleShareToPod = (postText) => {
      console.log("Sharing to pod:", postText);
      // Placeholder: Add to local state. Replace with API/DB call.
      setPodPosts(prev => [{ id:`local_${Date.now()}`, author: displayedUserName, text: postText, time:"Just now" }, ...prev]);
  };

  // Called after reflection form saves successfully
  const handleReflectionSaved = (savedEntry) => {
      setLastReflectionEntry(savedEntry); // Update state to trigger AI Nudge
  };

  const handleModeToggle = async () => {
      if (isSavingMode) return; setIsSavingMode(true);
      const newMode = !isArenaMode;
      try { await updateCommitmentData({ arena_mode: newMode }); }
      catch (error) { console.error("Failed to update mode:", error); alert("Could not switch mode."); }
      finally { setIsSavingMode(false); }
    };

  // Save Identity Anchor (updates commitmentData)
  const handleSaveIdentity = async (newIdentity) => {
    if (!newIdentity.trim()) { alert("Identity cannot be empty."); return; }
    try {
      await updateCommitmentData({ identity_anchor: newIdentity.trim() });
      setIsIdentityModalOpen(false); // Close modal on success
    } catch (e) { console.error("Failed to save identity anchor:", e); alert("Failed to save identity."); }
  };

  // Save Habit Anchor (updates commitmentData)
  const handleSaveHabitAnchor = async (newAnchor) => {
    if (!newAnchor.trim()) { alert("Habit anchor cannot be empty."); return; }
    try {
      await updateCommitmentData({ habit_anchor: newAnchor.trim() });
      setIsHabitModalOpen(false); // Close modal on success
    } catch (e) { console.error("Failed to save habit anchor:", e); alert("Failed to save habit anchor."); }
  };

  // Save Why It Matters (updates planningData)
  const handleSaveWhy = async (newWhy) => {
    if (!newWhy.trim()) { alert("'Why' statement cannot be empty."); return; }
    const currentGoals = planningData?.focus_goals || [];
    let updatedGoals;
    if (currentGoals.length > 0) {
      // Update the 'why' of the first goal
      updatedGoals = [{ ...currentGoals[0], why: newWhy.trim() }, ...currentGoals.slice(1)];
    } else {
      // Create a default goal structure if none exist
      updatedGoals = [{ id: `goal_${Date.now()}`, text: 'Define in Development Plan', why: newWhy.trim(), status: 'Active' }];
      console.warn("No focus goal found. Creating default goal to save 'Why'.");
    }
    try {
      await updatePlanningData({ focus_goals: updatedGoals }); // Use the correct update function
      setIsWhyModalOpen(false); // Close modal on success
    } catch (e) { console.error("Failed to save 'Why':", e); alert("Failed to save 'Why'."); }
  };


  // --- Main Render ---
  // Check if *any* essential data is still loading
  if (isAppLoading || !commitmentData || !pdpData || !planningData) {
     return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600"><Loader className="animate-spin w-8 h-8 mr-3 text-teal-600"/> Loading your Arena...</div>;
  }

  // --- VERIFIED: Safely extract suggestion items ---
  const identitySuggestions = IDENTITY_ANCHOR_CATALOG?.items || [];
  const habitSuggestions = HABIT_ANCHOR_CATALOG?.items || [];
  const whySuggestions = WHY_CATALOG?.items || [];

  // Check if the current Target Rep is already completed (uses derived state)
  const isTargetRepDone = dailyTargetRep.status === 'Committed';
  const canCompleteTargetRep = dailyTargetRep.id !== 'default' && !isTargetRepDone;


  return (
    <div className={`p-4 md:p-6 space-y-6 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
      <CelebrationOverlay show={showCelebration} />
      <ReflectionLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} history={reflectionHistory} isLoading={isHistoryLoading} />

      {/* --- Modals --- */}
      <IdentityAnchorModal
        isOpen={isIdentityModalOpen}
        onClose={() => setIsIdentityModalOpen(false)}
        currentIdentity={identityStatement}
        onSave={handleSaveIdentity}
        suggestions={identitySuggestions} // Pass extracted items
      />
      <HabitAnchorModal
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
        currentAnchor={habitAnchor}
        onSave={handleSaveHabitAnchor}
        suggestions={habitSuggestions} // Pass extracted items
        defaultAnchorText={DEFAULT_HABIT_ANCHOR}
      />
      <WhyItMattersModal
        isOpen={isWhyModalOpen}
        onClose={() => setIsWhyModalOpen(false)}
        currentWhy={whyStatement === DEFAULT_WHY_STATEMENT ? "" : whyStatement} // Pass empty if default
        onSave={handleSaveWhy}
        suggestions={whySuggestions} // Pass extracted items
      />


      {/* --- NEW: 2-Minute Challenge Prompt Modal/Overlay --- */}
      {showChallengePrompt && dailyTargetRep.microRep && dailyTargetRep.id !== 'default' && ( // Added ID check
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowChallengePrompt(false)}>
          <div className="relative w-full max-w-md bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl shadow-2xl border-2 border-orange-300 p-6 text-center animate-in zoom-in-95 slide-in-from-bottom-5" onClick={(e) => e.stopPropagation()}>
             <Award className="w-12 h-12 text-orange-500 mx-auto mb-3"/>
             <h3 className="text-xl font-bold text-orange-800 mb-2">Up for a 2-Minute Challenge?</h3>
             <p className="text-md text-orange-700 mb-4">{dailyTargetRep.microRep}</p>
             <div className="flex gap-3 justify-center">
                 <Button onClick={handleDoMicroRep} variant="secondary" className="!py-2 !px-5 text-base">
                     <Zap className="w-5 h-5 mr-1.5"/> Let's Do It!
                 </Button>
                 <Button onClick={() => setShowChallengePrompt(false)} variant="outline" className="!py-2 !px-5 text-sm !border-orange-300 !text-orange-600">
                     Maybe Later
                 </Button>
             </div>
          </div>
        </div>
      )}


      {/* 1. Header */}
      <div className={`bg-[${COLORS.OFF_WHITE}] p-4 md:p-6 -mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-4 rounded-b-xl shadow-md border-b-4 border-[${COLORS.TEAL}]`}>
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className={`text-2xl md:text-3xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-2`}> <Home size={28} style={{ color: COLORS.TEAL }} /> The Arena </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <StreakTracker streakCount={streakCount} coins={streakCoins} />
            <Button onClick={() => navigate('weekly-recap')} variant="outline" className="text-sm !py-2 !px-4"> <Calendar className="w-4 h-4 mr-1.5" /> Recap </Button>
            <ModeSwitch isArenaMode={isArenaMode} onToggle={handleModeToggle} isLoading={isSavingMode} />
          </div>
        </div>
        <p className="text-gray-600 text-base mt-3"> {greeting} <span className={`font-semibold text-[${COLORS.NAVY}]`}>{displayedUserName}</span>. Focus: <strong style={{ color: weakestTier?.hex || COLORS.NAVY }}>{weakestTier?.name || 'Getting Started'}</strong>. </p>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left Column */}
        <div className="lg:col-span-3 space-y-6">
           {/* --- UPDATED: Strategic Focus Card --- */}
           <Card title="🎯 Today's Strategic Focus" icon={Target} accent='NAVY'>
              <div className='grid md:grid-cols-2 gap-4 md:gap-6 mb-4'>
                 <div>
                    <p className='text-sm font-semibold text-gray-600'><Flag className="inline w-4 h-4 mr-1"/> Target Rep:</p>
                    {/* Use dailyTargetRep state */}
                    <p className={`text-lg font-bold ${isTargetRepDone ? 'text-green-700 line-through' : 'text-gray-800'}`}>{dailyTargetRep.text}</p>
                 </div>
                 <div>
                     <p className='text-sm font-semibold text-gray-600'><CheckCircle className="inline w-4 h-4 mr-1"/> What Good Looks Like:</p>
                     <p className='text-sm italic text-gray-700'>{dailyTargetRep.definition}</p>
                 </div>
              </div>

              {/* --- NEW: Complete Target Rep Button --- */}
              <div className="mt-5 pt-4 border-t border-gray-200">
                 <Button
                    onClick={completeTargetRep} // Use new handler
                    disabled={!canCompleteTargetRep || isSavingRep}
                    variant={isTargetRepDone ? "outline" : "primary"}
                    className={`w-full !py-3 text-base ${isTargetRepDone ? '!border-green-300 !text-green-700 !bg-green-50 cursor-default' : ''}`}
                 >
                   {isSavingRep && !isTargetRepDone ? <Loader className="animate-spin w-5 h-5 mr-2"/> : (isTargetRepDone ? <CheckCircle className="w-5 h-5 mr-2"/> : <Zap className="w-5 h-5 mr-2"/>)}
                   {isTargetRepDone ? 'Target Rep Complete!' : 'Complete Target Rep'}
                 </Button>
              </div>

              {/* Identity Anchor Section (Remains the same) */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div>
                  <div className="mb-3">
                    <p className='text-sm font-semibold text-gray-600'><User className="inline w-4 h-4 mr-1" /> Identity Anchor:</p>
                    <p className='text-md italic text-gray-800 font-medium'>"{identityStatement}"</p>
                  </div>
                  <Button onClick={() => setIsIdentityModalOpen(true)} variant="outline" className="text-sm !py-2 !px-4 w-full">
                    <Edit3 className="w-4 h-4 mr-2" /> Set Identity Anchor
                  </Button>
                </div>
              </div>
           </Card>

           {/* Why & Habit Cards */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <WhyItMattersCard statement={whyStatement} onPersonalize={() => setIsWhyModalOpen(true)} />
             <HabitAnchorCard anchor={habitAnchor} onEdit={() => setIsHabitModalOpen(true)} isDefault={isDefaultAnchor} />
           </div>

           {/* --- UPDATED: Daily Reps Card Title & Data --- */}
           <Card title={`⏳ Additional Daily Reps (${additionalCommitsCompleted}/${additionalCommitments.length})`} icon={Clock} accent='TEAL'>
             {/* Pass only additional commitments and the correct handler */}
             <EmbeddedDailyReps
                commitments={additionalCommitments}
                onToggleCommit={handleToggleAdditionalCommitment} // Use specific handler
                isLoading={isSavingRep} // Still uses general saving flag
             />
           </Card>

           {/* Social Pod Card */}
           <SocialPodFeed feed={podPosts} onShare={handleShareToPod} isArenaMode={isArenaMode} />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
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

