// src/components/screens/Dashboard.jsx (FIXED: updateDailyPracticeData ReferenceError)

import React, { useMemo, useState, useEffect, useCallback } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Firestore Imports (for saving reflections, potentially pod posts later) ---
import { collection, addDoc, serverTimestamp, query, getDocs, orderBy, doc, setDoc } from 'firebase/firestore';

// --- Icons ---
import {
  Home, Zap, AlertTriangle, Target, Briefcase, Loader, Lightbulb, Sparkles, CheckCircle, Clock, Save,
  CornerDownRight, Flag, User, Activity, BarChart3, Check, X, MessageSquare, Archive, Flame, Anchor,
  Heart, Users, Award, Calendar, Share2, Edit3, Slack, Trophy, ToggleLeft, ToggleRight, Bot,
  ChevronsRight, ChevronsLeft, // Added for potential future use if needed
} from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5355', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx, User Request

// --- Standardized Button Component ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  // Base styles applicable to all variants
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;

  // Size variations
  if (size === 'sm') baseStyle += ' px-4 py-2 text-sm';
  else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg';
  else baseStyle += ' px-6 py-3 text-base'; // Default 'md'

  // Variant specific styles
  if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
  else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`; // Specific style for back buttons
  else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`; // Subtle button

  // Disabled state override (applies after variant styles)
  if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300'; // Adjusted disabled style

  return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

// --- Standardized Card Component ---
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = COLORS[accent] || COLORS.NAVY; // Default to NAVY if accent is invalid
  const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };

  return (
    <Tag
      {...(interactive ? { type: 'button' } : {})}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      // Consistent styling matching Dashboard/Dev Plan
      className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`}
      style={{
          background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', // White to light gray gradient
          borderColor: COLORS.SUBTLE, // Subtle border
          color: COLORS.NAVY // Default text color
      }}
      onClick={onClick}
    >
      {/* Accent bar at the top */}
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

      {/* Optional Icon and Title Area */}
      {Icon && title && ( // Render icon container only if both are present for standard layout
           <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
                  <Icon className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2>
          </div>
      )}
      {/* Handle title only or icon only if needed, though standard is both or neither */}
      {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}

      {/* Content */}
      <div className={Icon || title ? '' : ''}> {/* Add margin-top if title/icon present? Maybe not needed. */}
         {children}
      </div>
    </Tag>
  );
};


/* =========================================================
   Mode Switch Component (Unchanged Logically, Style Refined)
========================================================= */
const ModeSwitch = ({ isArenaMode, onToggle, isLoading }) => (
  <button
    onClick={onToggle}
    disabled={isLoading}
    // Refined styling for better integration
    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border shadow-sm ${
      isArenaMode
        ? `bg-[${COLORS.PURPLE}]/10 border-[${COLORS.PURPLE}]/30 text-[${COLORS.PURPLE}] hover:bg-[${COLORS.PURPLE}]/20` // Arena Mode style
        : `bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200` // Solo Mode style
    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
    title={isArenaMode ? "Switch to Solo Mode" : "Switch to Arena Mode"}
  >
    {isLoading ? <Loader className="w-4 h-4 animate-spin"/> : (isArenaMode ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />)}
    {isArenaMode ? 'Arena' : 'Solo'}
    {/* Use consistent icons for toggle state */}
    {isArenaMode ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
  </button>
);

/* =========================================================
   Micro-Celebration Component (Unchanged Logically)
========================================================= */
const CelebrationOverlay = ({ show }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
      <div className="absolute bg-green-400 rounded-full p-20 animate-ping opacity-50"></div>
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl border-4 border-green-500 transform scale-100 animate-in zoom-in-75 fade-in duration-300">
         <p className="text-4xl font-extrabold text-gray-800 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-500"/> Nice Rep! <Sparkles className="w-8 h-8 text-yellow-500"/>
         </p>
         <div className="absolute -top-4 -left-4 text-4xl animate-bounce">🎉</div>
         <div className="absolute -bottom-4 -right-4 text-4xl animate-bounce delay-100">🎊</div>
      </div>
    </div>
  );
};


/* =========================================================
   Streak Tracker Component (Unchanged Logically, Style Refined)
========================================================= */
const StreakTracker = ({ streakCount = 0, coins = 0 }) => {
  const flameColor = streakCount > 0 ? COLORS.ORANGE : COLORS.MUTED; // Use ORANGE for active streak
  return (
    <div className="flex items-center gap-4 px-4 py-2 rounded-full bg-white shadow-inner border border-gray-200">
      {/* Streak */}
      <div className="flex items-center gap-1.5" title={`${streakCount} Day Streak`}>
        <Flame className="w-5 h-5" style={{ color: flameColor }} />
        <span className="font-bold text-lg" style={{ color: COLORS.NAVY }}>{streakCount}</span>
        <span className="text-sm text-gray-600 hidden sm:inline">Day Streak</span> {/* Hide label on small screens */}
      </div>
      {/* Coins (Optional Badge System v1) */}
      {coins > 0 && (
        <div className="flex items-center gap-1 border-l pl-3 ml-1" title={`${coins} Streak Coins Earned`}>
           <Trophy className="w-4 h-4 text-amber-500"/>
           <span className="font-semibold text-sm text-amber-600">{coins}</span>
           <span className="text-xs text-gray-500 hidden sm:inline">Coins</span>
        </div>
      )}
    </div>
  );
};

/* =========================================================
   Why It Matters Component (Style Refined)
========================================================= */
const WhyItMattersCard = ({ statement, onPersonalize }) => (
  <Card title="💖 Why It Matters" icon={Heart} accent="ORANGE">
    <p className="text-md italic text-gray-700 mb-4">"{statement || 'Connect your actions to a deeper purpose...'}"</p>
    <Button onClick={onPersonalize} variant="outline" size="sm" className="w-full">
        <Edit3 className="w-4 h-4 mr-2" /> Personalize Your "Why"
    </Button>
  </Card>
);

/* =========================================================
   Habit Anchor Component (Style Refined)
========================================================= */
const HabitAnchorCard = ({ anchor, onEdit, isDefault }) => (
  <Card title="⚓ Habit Anchor" icon={Anchor} accent="BLUE">
    {isDefault ? (
        <p className="text-md font-medium text-gray-500 italic mb-4"> Set a daily cue to build consistency! </p>
    ) : (
        <>
            <p className="text-sm font-semibold text-gray-500 uppercase mb-1">Your Daily Cue:</p>
            <p className="text-md font-medium text-gray-800 mb-4">{anchor}</p>
        </>
    )}
    <Button onClick={onEdit} variant="outline" size="sm" className="w-full">
        <Edit3 className="w-4 h-4 mr-2" /> {isDefault ? 'Set Anchor' : 'Edit Anchor'}
    </Button>
  </Card>
);

/* =========================================================
   Social Accountability Pod Component (Style Refined)
========================================================= */
const SocialPodFeed = ({ feed, onShare, isArenaMode, featureFlags }) => {
  const { navigate } = useAppServices();
  const [newPost, setNewPost] = useState('');
  const [isSharing, setIsSharing] = useState(false); // Added loading state

  // --- Feature Flag Check ---
  if (!featureFlags?.enableCommunity) return null; // Hide if feature is disabled

  // --- Mock Share Handler (Replace with actual API call) ---
  const handleSubmit = async () => {
      if (!newPost.trim() || isSharing) return;
      setIsSharing(true);
      console.log("[SocialPodFeed] Sharing post:", newPost.trim());
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      onShare(newPost.trim()); // Call parent handler to update feed state
      setNewPost('');
      setIsSharing(false);
  };

  return (
    <Card title="📣 Accountability Pod" icon={Users} accent="PURPLE">
      {/* Solo Mode Message */}
      {!isArenaMode && (
          <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
              <p className="text-sm text-indigo-700 font-medium">Switch to Arena Mode to see and share with your pod.</p>
          </div>
      )}

      {/* Arena Mode Content */}
      {isArenaMode && (
        <>
          {/* Feed Display */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-4 border-b pb-3 custom-scrollbar"> {/* Added custom-scrollbar class if defined globally */}
            {feed.length === 0 && <p className="text-sm text-gray-500 italic text-center py-4">Pod feed is quiet...</p>}
            {feed.map((post) => (
              <div key={post.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-800">{post.text}</p>
                <span className="text-xs text-gray-500 mt-1 block">{post.author} - {post.time}</span>
              </div>
            ))}
          </div>

          {/* New Post Input */}
          <div className="space-y-2 mt-4">
            <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.PURPLE}] text-sm" // Smaller text
                rows="2"
                placeholder="Share your rep, a win, or ask for support..."
                disabled={isSharing}
            />
            <Button
                onClick={handleSubmit}
                variant="primary" // Use primary variant
                size="sm" // Smaller button
                className="w-full"
                style={{ background: COLORS.PURPLE, focusRing: `${COLORS.PURPLE}/50` }} // Custom purple
                disabled={!newPost.trim() || isSharing}
            >
                {isSharing ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                {isSharing ? 'Sharing...' : 'Share to Pod'}
            </Button>
          </div>
        </>
      )}

       {/* Slack Integration Link (Optional) */}
       <div className="mt-4 pt-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Log reps via <Slack className="inline w-3 h-3 mx-0.5" /> Slack?{' '}
            <button
                onClick={() => navigate('app-settings', { section: 'integrations' })} // Navigate to specific settings section
                className="font-semibold text-blue-600 hover:underline focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
            >
                Connect Slack
            </button>
          </p>
       </div>
    </Card>
  );
};

/* =========================================================
   Embedded Daily Reps Component (Handles Additional Reps)
   (Style Refined, Logic Unchanged)
========================================================= */
const EmbeddedDailyReps = ({ commitments, onToggleCommit, isLoading }) => {
  // Filter out any potential null/undefined items and ensure status exists
  const validCommitments = useMemo(() => commitments?.filter(c => c && c.id && c.status) || [], [commitments]);

  // Display message if no *additional* reps are present
  const noAdditionalReps = validCommitments.length === 0;

  return (
    <div className="space-y-3">
      {/* Loading State */}
      {isLoading && (
        <div className="p-4 text-center text-gray-500 flex items-center justify-center">
            <Loader className="animate-spin w-4 h-4 mr-2"/>Loading reps...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && noAdditionalReps && (
        <div className="p-4 text-center text-sm text-gray-500 italic border border-dashed rounded-lg">
           Add reps from your Development Plan or other areas to practice them daily.
        </div>
      )}

      {/* List of Reps */}
      {!isLoading && !noAdditionalReps && validCommitments.map((commit) => {
          const isCommitted = commit.status === 'Committed';
          return (
              <div key={commit.id} className={`p-4 rounded-xl flex items-center justify-between transition-all duration-200 border ${
                  isCommitted ? 'bg-green-50 border-green-200 shadow-inner' : 'bg-white hover:bg-gray-50/70 border-gray-200 shadow-sm'
              }`}>
                  {/* Rep Text and Metadata */}
                  <div className="flex-1 mr-4 overflow-hidden"> {/* Added overflow-hidden */}
                      <p className={`font-medium text-sm ${ // Smaller font size
                          isCommitted ? 'text-green-700 line-through decoration-2' : `text-[${COLORS.NAVY}]`
                      }`}>
                          {commit.text}
                      </p>
                      {/* Optional: Display linked goal or tier */}
                      {(commit.linkedGoal || commit.linkedTier) && (
                          <span className="text-xs text-gray-500 italic block mt-1 truncate"> {/* Added truncate */}
                              {commit.linkedGoal || `Tier: ${commit.linkedTier}`}
                          </span>
                      )}
                  </div>
                  {/* Completion Toggle Button */}
                  <button
                      onClick={() => !isLoading && onToggleCommit(commit.id)} // Prevent click while loading
                      disabled={isLoading}
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 flex-shrink-0 ${
                          isCommitted
                              ? `bg-[${COLORS.GREEN}] border-[${COLORS.GREEN}] text-white hover:bg-green-700 focus:ring-[${COLORS.GREEN}]`
                              : `bg-white border-gray-300 text-gray-400 hover:border-[${COLORS.TEAL}] hover:text-[${COLORS.TEAL}] focus:ring-[${COLORS.TEAL}]`
                      }`}
                      aria-label={isCommitted ? 'Mark as Pending' : 'Mark as Complete'}
                  >
                      {/* Smaller Icons */}
                      {isCommitted ? <Check size={16} /> : <Zap size={15} />}
                  </button>
              </div>
          );
      })}
    </div>
  );
};


/* =========================================================
   Reflection Log Modal Component (Unchanged Logically, Style Refined)
========================================================= */
const ReflectionLogModal = ({ isOpen, onClose, history, isLoading }) => {
  if (!isOpen) return null;
  // Safer date formatting
  const formatDate = (dateInput) => {
    try {
      // Handle Firestore Timestamps or ISO strings
      const date = dateInput?.toDate ? dateInput.toDate() : new Date(dateInput);
      if (isNaN(date.getTime())) return 'Invalid Date'; // Check if date is valid
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      console.error("Error formatting date:", dateInput, e);
      return 'Error Date';
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-extrabold text-[#002E47] flex items-center gap-3">
             <Archive className="text-[#47A88D]" /> Full Reflection Log
          </h2>
          <Button onClick={onClose} variant="ghost" size="sm" className="!p-1 text-gray-500 hover:text-red-600" aria-label="Close modal">
            <X className="w-5 h-5" />
          </Button>
        </div>
        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 custom-scrollbar"> {/* Added custom-scrollbar */}
          {isLoading && <div className="flex justify-center items-center py-12"> <Loader className="animate-spin text-[#47A88D] h-8 w-8" /> </div>}
          {!isLoading && history.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-400"/>
                  <p className="font-semibold">No reflections saved yet.</p>
                  <p className="text-sm">Complete the daily form to build your log.</p>
              </div>
          )}
          {!isLoading && history.length > 0 && history.map((entry) => (
            <div key={entry.id} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 shadow-sm transition-colors hover:bg-white">
              {/* Date Header */}
              <p className="text-sm font-bold text-[#002E47] mb-2 border-b border-gray-300 pb-1 flex justify-between items-center">
                 <span>{formatDate(entry.timestamp || entry.date)}</span> {/* Try timestamp first, fallback to date */}
                 <span className="text-xs font-normal text-gray-400">ID: {entry.id.slice(0, 8)}...</span>
              </p>
              {/* Reflection Content */}
              <div className="space-y-2 text-sm text-gray-700">
                {entry.did && <p><strong>Did:</strong> {entry.did}</p>}
                {entry.noticed && <p><strong>Noticed:</strong> {entry.noticed}</p>}
                {entry.tryDiff && <p><strong>Try:</strong> {entry.tryDiff}</p>}
                {entry.identity && <p className="italic font-medium text-gray-800 pt-1 border-t border-gray-200 mt-2"><strong>Identity:</strong> "I'm the kind of leader who {entry.identity}"</p>}
              </div>
            </div>
          ))}
        </div>
        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 text-right">
             <Button onClick={onClose} variant="outline" size="sm"> Close </Button>
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   Identity Anchor Modal Component (Unchanged Logically, Style Refined)
========================================================= */
const IdentityAnchorModal = ({ isOpen, onClose, currentIdentity, onSave, suggestions = [] }) => {
  if (!isOpen) return null;
  const prefix = "I'm the kind of leader who ";
  const defaultPlaceholder = "Define your leader identity...";

  // **FIX: Explicitly define getEditablePart with null/undefined safety**
  const getEditablePart = (fullIdentity) => {
    // Ensure fullIdentity is a string before checking against the prefix
    const safeIdentity = fullIdentity || "";
    if (!safeIdentity || safeIdentity === defaultPlaceholder) return "";
    return safeIdentity.startsWith(prefix) ? safeIdentity.substring(prefix.length) : safeIdentity;
  };

  // **FIX: Ensure useState is initialized with a string**
  const [identityText, setIdentityText] = useState(getEditablePart(currentIdentity) || "");

  const [isSaving, setIsSaving] = useState(false);
  const suggestionItems = Array.isArray(suggestions) ? suggestions : [];

  // **FIX: Ensure validation is safe**
  const handleSaveClick = async () => {
    // Basic validation
    if (!identityText.trim()) { alert("Identity anchor cannot be empty."); return; }

    setIsSaving(true);
    try {
        await onSave(identityText.trim()); // Call parent save handler
    } catch (e) {
        console.error("Identity Anchor save failed:", e);
        alert("Failed to save Identity Anchor.");
    } finally {
        onClose(); // Close modal regardless of outcome
        setIsSaving(false);
    }
  };

  return ( /* ... Modal structure ... */
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden"> {/* Added overflow-hidden */}
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-extrabold text-[#002E47] flex items-center gap-3"> <User className="text-[#47A88D]" /> Set Identity Anchor </h2>
            <Button onClick={onClose} variant="ghost" size="sm" className="!p-1 text-gray-500 hover:text-red-600" aria-label="Close modal"> <X className="w-5 h-5" /> </Button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-4">
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg text-md font-medium text-gray-600">I'm the kind of leader who...</div>
            <textarea value={identityText} onChange={(e) => setIdentityText(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D] text-sm" rows="3" placeholder="...trusts my team." />
            {suggestionItems.length > 0 && ( /* ... Suggestions UI ... */
                <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Or, start with a suggestion:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestionItems.map((suggestion, idx) => (
                        <button key={`${suggestion}-${idx}`} onClick={() => setIdentityText(suggestion)} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"> {suggestion} </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end items-center gap-3">
            <Button onClick={onClose} variant="outline" size="sm"> Cancel </Button>
            <Button onClick={handleSaveClick} variant="primary" size="sm" disabled={isSaving || !identityText.trim()}>
                {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Anchor
            </Button>
        </div>
      </div>
    </div>
  );
};


/* =========================================================
   Habit Anchor Modal Component (Unchanged Logically, Style Refined)
========================================================= */
const HabitAnchorModal = ({ isOpen, onClose, currentAnchor, onSave, suggestions = [], defaultAnchorText }) => {
   if (!isOpen) return null;

   // **FIX: Explicitly define getEditablePart with null/undefined safety**
   const getEditablePart = (fullAnchor) => (fullAnchor === defaultAnchorText || !fullAnchor ? "" : fullAnchor || "");

   // **FIX: Ensure useState is initialized with a string**
   const [anchorText, setAnchorText] = useState(getEditablePart(currentAnchor) || "");

   const [isSaving, setIsSaving] = useState(false);
   const suggestionItems = Array.isArray(suggestions) ? suggestions : [];

   // **FIX: Ensure validation is safe**
   const handleSaveClick = async () => {
        // Basic validation
        if (!anchorText.trim()) { alert("Habit anchor cannot be empty."); return; }

        setIsSaving(true);
        try {
            await onSave(anchorText.trim()); // Call parent save handler
        } catch (e) {
            console.error("Habit Anchor save failed:", e);
            alert("Failed to save Habit Anchor.");
        } finally {
            onClose(); // Close modal regardless of outcome
            setIsSaving(false);
        }
   };

   return ( /* ... Modal structure ... */
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-extrabold text-[#002E47] flex items-center gap-3"> <Anchor className="text-[#2563EB]" /> Set Habit Anchor </h2>
            <Button onClick={onClose} variant="ghost" size="sm" className="!p-1 text-gray-500 hover:text-red-600" aria-label="Close modal"> <X className="w-5 h-5" /> </Button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-4">
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg text-md font-medium text-gray-600">Set your daily cue (e.g., "After my morning coffee"):</div>
            <textarea value={anchorText} onChange={(e) => setAnchorText(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB]" rows="3" placeholder="When will you do your daily reps?" />
            {suggestionItems.length > 0 && ( /* ... Suggestions UI ... */
                <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Or, start with a suggestion:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestionItems.map((suggestion, idx) => (
                        <button key={`${suggestion}-${idx}`} onClick={() => setAnchorText(suggestion)} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"> {suggestion} </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end items-center gap-3">
            <Button onClick={onClose} variant="outline" size="sm"> Cancel </Button>
            <Button onClick={handleSaveClick} variant="primary" size="sm" disabled={isSaving || !anchorText.trim()} style={{ background: COLORS.BLUE, focusRing: `${COLORS.BLUE}/50` }}> {/* Custom Blue */}
                {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save Anchor
            </Button>
        </div>
      </div>
    </div>
   );
};


/* =========================================================
   Why It Matters Modal Component (Style Fix Applied)
========================================================= */
const WhyItMattersModal = ({ isOpen, onClose, currentWhy, onSave, suggestions = [] }) => {
   if (!isOpen) return null;

   // **FIX: Ensure useState is initialized with a string**
   const [whyText, setWhyText] = useState(currentWhy || "");

   const [isSaving, setIsSaving] = useState(false);
   const suggestionItems = Array.isArray(suggestions) ? suggestions : [];

   // **FIX: Ensure validation is safe**
   const handleSaveClick = async () => {
        // Basic validation
        if (!whyText.trim()) { alert("'Why' statement cannot be empty."); return; }

        setIsSaving(true);
        try {
            await onSave(whyText.trim()); // Call parent save handler
        } catch (e) {
            console.error("Why statement save failed:", e);
            alert("Failed to save 'Why' statement.");
        } finally {
            onClose(); // Close modal regardless of outcome
            setIsSaving(false);
        }
   };

   return ( /* ... Modal structure ... */
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" aria-modal="true" role="dialog">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl z-10 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-extrabold text-[#002E47] flex items-center gap-3"> <Heart className="text-[#E04E1B]" /> Personalize Your "Why" </h2>
            <Button onClick={onClose} variant="ghost" size="sm" className="!p-1 text-gray-500 hover:text-red-600" aria-label="Close modal"> <X className="w-5 h-5" /> </Button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-4">
            <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg text-md font-medium text-gray-600">Why does achieving your focus goal matter to you?</div>
            <textarea value={whyText} onChange={(e) => setWhyText(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E04E1B]" rows="4" placeholder="e.g., This will help my team feel more empowered..." />
            {suggestionItems.length > 0 && ( /* ... Suggestions UI ... */
                <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Or, start with a suggestion:</p>
                    <div className="flex flex-wrap gap-2">
                        {suggestionItems.map((suggestion, idx) => (
                        <button key={`${suggestion}-${idx}`} onClick={() => setWhyText(suggestion)} className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full border border-gray-300 hover:bg-gray-200 hover:border-gray-400 transition-colors"> {suggestion} </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
        {/* Footer */}
        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end items-center gap-3">
            <Button onClick={onClose} variant="outline" size="sm"> Cancel </Button>
            {/* --- FIX #3: APPLY INLINE STYLE FOR SECONDARY BUTTON --- */}
            <Button
                onClick={handleSaveClick}
                variant="secondary"
                size="sm"
                disabled={isSaving || !whyText.trim()}
                style={{ background: COLORS.ORANGE, color: COLORS.OFF_WHITE, borderColor: 'transparent' }} // Explicitly set colors
            >
                {isSaving ? <Loader className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save "Why"
            </Button>
        </div>
      </div>
    </div>
   );
};


/* =========================================================
   Embedded Reflection Form Component (UPDATED: AI Nudge Inside)
========================================================= */
const EmbeddedReflectionForm = ({ db, userId, onOpenLog, onSaveSuccess, showCoachPrompt }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedConfirmation, setIsSavedConfirmation] = useState(false);
  const [did, setDid] = useState('');
  const [noticed, setNoticed] = useState('');
  const [tryDiff, setTryDiff] = useState('');
  const [identity, setIdentity] = useState(''); // Reflection input field

  // --- Reflection Save Handler ---
  const handleSaveReflection = async () => {
    // Basic validation
    if (!did.trim() && !noticed.trim() && !tryDiff.trim() && !identity.trim()) {
       alert("Please fill in at least one reflection field."); return;
    }
    if (!db || !userId) {
       alert("Error: Database connection not available."); return;
    }

    setIsSaving(true);
    setIsSavedConfirmation(false); // Reset confirmation

    // Prepare data for the reflection_history subcollection
    const reflectionEntry = {
        did: did.trim(), noticed: noticed.trim(), tryDiff: tryDiff.trim(),
        identity: identity.trim(), // Save the reflection identity input
        timestamp: serverTimestamp(), date: new Date().toISOString().split('T')[0]
    };

    try {
      // Save to the subcollection
      const historyCollectionRef = collection(db, `daily_practice/${userId}/reflection_history`); // Updated path
      const savedDoc = await addDoc(historyCollectionRef, reflectionEntry);

      // --- Success Actions ---
      setIsSavedConfirmation(true);
      // Clear fields
      setDid(''); setNoticed(''); setTryDiff(''); setIdentity('');
      // Notify parent component (to trigger AI Nudge)
      if (onSaveSuccess) {
          // Pass saved data (approximate timestamp locally for immediate use)
          onSaveSuccess({ id: savedDoc.id, ...reflectionEntry, timestamp: new Date() });
      }
      // Hide confirmation message after a delay
      setTimeout(() => setIsSavedConfirmation(false), 3000);
      console.log("[ReflectionForm] Reflection saved to history:", savedDoc.id);

    } catch (e) {
      console.error("[ReflectionForm] Failed to save reflection:", e);
      alert("Failed to save reflection log. Please check console for details.");
    } finally {
      setIsSaving(false); // Reset saving state regardless of outcome
    }
  };
  // Determine if the save button should be enabled
  const canSave = (did.trim() || noticed.trim() || tryDiff.trim() || identity.trim()) && !isSaving;

  return (
    // Use the standard Card component
    <Card title="⚡ Daily Reflection Rep" icon={MessageSquare} accent='NAVY' className="sticky top-6"> {/* Added sticky positioning */}
        <p className="text-sm text-gray-600 -mt-2 mb-5"> Capture key insights from your daily leadership reps. </p>
        {/* Form Fields */}
        <div className="space-y-4">
          {/* Did */}
          <div>
              <label className="block text-sm font-semibold text-[#002E47] mb-1"> <span className="text-[#47A88D]">1.</span> What did I <strong className='text-[#47A88D]'>do</strong>? </label>
              <textarea value={did} onChange={(e) => setDid(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D] text-sm" rows="2" placeholder="e.g., Gave CLEAR feedback to Alex..." />
          </div>
          {/* Noticed */}
          <div>
              <label className="block text-sm font-semibold text-[#002E47] mb-1"> <span className="text-[#47A88D]">2.</span> What did I <strong className='text-[#47A88D]'>notice</strong>? </label>
              <textarea value={noticed} onChange={(e) => setNoticed(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D] text-sm" rows="2" placeholder="e.g., I noticed I interrupted during the brainstorm..." />
          </div>
          {/* Try Differently */}
          <div>
              <label className="block text-sm font-semibold text-[#002E47] mb-1"> <span className="text-[#47A88D]">3.</span> What will I <strong className='text-[#47A88D]'>try</strong> differently? </label>
              <textarea value={tryDiff} onChange={(e) => setTryDiff(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D] text-sm" rows="2" placeholder="e.g., Let silence work after asking a coaching question..." />
          </div>
          {/* Identity Reflection */}
          <div>
              <label className="block text-sm font-semibold text-[#002E47] mb-1"> <User className="inline-block w-4 h-4 mr-1 text-[#47A88D]" /> "I'm the kind of leader who..." </label>
              <input type="text" value={identity} onChange={(e) => setIdentity(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#47A88D] text-sm" placeholder="...trusts my team. (Daily reflection)" title="This reflection field is saved daily. Use 'Set Identity Anchor' for your persistent identity."/>
          </div>
        </div>
        {/* Save Button & Confirmation */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-4">
          <Button onClick={handleSaveReflection} disabled={!canSave} variant="primary" size="md" className="flex-1"> {/* Use md size */}
            {isSaving ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Save className="w-5 h-5 mr-2" />} {isSaving ? 'Saving...' : 'Save to Log'}
          </Button>
          {isSavedConfirmation && (
              <span className='text-sm font-bold text-green-600 flex items-center shrink-0 animate-pulse'>
                  <CheckCircle className='w-4 h-4 mr-1'/> Saved!
              </span>
          )}
        </div>

        {/* --- AI COACH PROMPT / NUDGE AREA (MOVED INSIDE) --- */}
        {/* The AICoachNudge component will render here */}
        <div id="ai-nudge-container" className="mt-4">
            {/* Conditionally show initial prompt text if showCoachPrompt is true */}
            {showCoachPrompt && (
              <div className="p-3 rounded-lg bg-gray-100 border border-gray-200 shadow-sm">
                 <div className="flex items-start gap-2">
                   <Bot className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"/>
                   <p className="text-sm font-medium text-gray-500 italic">Save your reflection above to get feedback from the AI Rep Coach.</p>
                 </div>
              </div>
            )}
            {/* The AICoachNudge component will replace the prompt when active */}
        </div>
        {/* --- END AI COACH AREA --- */}

        {/* View Log Button */}
        <div className="mt-4 flex justify-center">
          <Button onClick={onOpenLog} variant="outline" size="sm">
            <Archive className="w-4 h-4 mr-2" /> View Full Reflection Log
          </Button>
        </div>
    </Card>
  );
};

/* =========================================================
   AI Coach Nudge Component (UPDATED: Renamed, Uses Last Reflection)
========================================================= */
const AICoachNudge = ({ lastReflectionEntry, callSecureGeminiAPI, hasGeminiKey }) => {
  const [nudge, setNudge] = useState('');
  const [isLoadingNudge, setIsLoadingNudge] = useState(false);
  const [errorNudge, setErrorNudge] = useState('');

  // Effect to generate nudge when the *last saved* reflection entry changes
  useEffect(() => {
    // Only proceed if we have a valid recent reflection and API capability
    if (lastReflectionEntry?.id && callSecureGeminiAPI && hasGeminiKey?.()) {
      const generateNudge = async () => {
        console.log("[AICoachNudge] Generating nudge for reflection ID:", lastReflectionEntry.id);
        setIsLoadingNudge(true);
        setErrorNudge('');
        setNudge(''); // Clear previous nudge

        try {
          // Construct prompt using the provided reflection entry data
          // Use defaults for potentially missing fields
          const prompt = `Based on this user's daily reflection:\n- Did: ${lastReflectionEntry.did || 'N/A'}\n- Noticed: ${lastReflectionEntry.noticed || 'N/A'}\n- Will Try: ${lastReflectionEntry.tryDiff || 'N/A'}\n- Identity (Reflection): ${lastReflectionEntry.identity || 'N/A'}\n\nPlease act as the **AI Rep Coach** and ask one brief, insightful follow-up question (under 20 words) to deepen their reflection or connect it to a core leadership principle (e.g., ownership, feedback, vulnerability). Do NOT include any preamble like "Okay..." or closing remarks. Just the question. Example: "Interesting observation. How did that impact the team's psychological safety?"`;

          const payload = {
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              // Use a faster model for simple nudges
              model: 'gemini-1.5-flash', // Explicitly use flash model
              generationConfig: { temperature: 0.7, maxOutputTokens: 50 }, // Keep it concise
              // Safety settings (optional, adjust as needed)
              // safetySettings: [ { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" } ]
          };

          console.log("[AICoachNudge] Sending prompt:", prompt);
          const response = await callSecureGeminiAPI(payload);
          console.log("[AICoachNudge] Received response:", response);

          const generatedText = response?.candidates?.[0]?.content?.parts?.[0]?.text;

          if (generatedText) {
            // Clean up response (remove quotes, asterisks, etc.)
            const cleanedNudge = generatedText.trim().replace(/^["'\*]+|["'\*]+$/g, '');
            setNudge(cleanedNudge);
          } else {
            // Handle cases where the API response structure is unexpected or empty
            throw new Error("API response did not contain expected text or was blocked.");
          }
        } catch (error) {
          console.error("[AICoachNudge] Nudge generation failed:", error);
          setErrorNudge("Couldn't get an AI insight right now. Check logs.");
          setNudge(''); // Ensure nudge is cleared on error
        } finally {
          setIsLoadingNudge(false);
        }
      };

      // Debounce slightly to prevent rapid calls if reflection state updates quickly
      const timer = setTimeout(generateNudge, 300);
      return () => clearTimeout(timer); // Cleanup timer

    } else {
      // Clear nudge if conditions aren't met (e.g., no reflection, no API key)
      setNudge('');
      setIsLoadingNudge(false);
      setErrorNudge('');
      if (!lastReflectionEntry?.id) {
          console.log("[AICoachNudge] No reflection entry provided, nudge cleared.");
      } else if (!hasGeminiKey?.()) {
          console.warn("[AICoachNudge] AI Rep Coach disabled (API key missing).");
          // setErrorNudge("AI Rep Coach disabled (API key missing)."); // Optional user message
      }
    }
  // Depend only on the ID of the last reflection entry to trigger regeneration
  }, [lastReflectionEntry?.id, callSecureGeminiAPI, hasGeminiKey]);

  // --- Render Logic ---
  // Don't render anything if there's no loading activity, nudge, or error
  if (!isLoadingNudge && !nudge && !errorNudge) {
      return null;
  }

  // Render loading, error, or the generated nudge within the #ai-nudge-container
  return (
    // Use a distinct style for the AI Nudge box
    <div className={`p-3 rounded-lg border shadow-sm animate-in fade-in duration-500 ${
        errorNudge ? 'bg-red-50 border-red-200' : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-purple-200'
    }`}>
       <div className="flex items-start gap-2">
         {/* Icon indicating AI */}
         <Bot className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
             isLoadingNudge ? 'text-purple-400 animate-pulse' : errorNudge ? 'text-red-500' : 'text-purple-600'
         }`}/>
         <div className="flex-1">
           {/* Loading State */}
           {isLoadingNudge && <p className="text-sm font-medium italic text-purple-600">AI Rep Coach is thinking...</p>}
           {/* Error State */}
           {errorNudge && <p className="text-sm font-semibold text-red-600">{errorNudge}</p>}
           {/* Nudge Text */}
           {nudge && !isLoadingNudge && <p className="text-sm font-medium italic text-purple-800">{nudge}</p>}
         </div>
       </div>
    </div>
  );
};


/* =========================================================
   MOCK SOCIAL FEED DATA (Placeholder - Consider replacing)
========================================================= */
// This should ideally be fetched or managed via context/props
const mockSocialFeedData = [
  { id: 'p1', author: 'Ryan Y.', text: "Crushed my 'Give CLEAR feedback' rep today. Team member handled it well, and the result was immediate clarity. Win!", time: "4h ago" },
  { id: 'p2', author: 'Christina A.', text: "Having trouble finding a good habit anchor for my morning routine. What cues work for everyone else?", time: "6h ago" },
  { id: 'p3', author: 'Jeff S.', text: "My 'Ask Open Questions' rep is finally starting to feel natural. The silence is getting less awkward!", time: "1d ago" },
];

/* =========================================================
   DASHBOARD SCREEN (Main Export - Refactored)
========================================================= */
// --- Default Constants ---
const DEFAULT_HABIT_ANCHOR = "Set your daily practice cue!";
const DEFAULT_WHY_STATEMENT = "Connect your practice to a deeper purpose...";
const DEFAULT_IDENTITY_ANCHOR_PLACEHOLDER = "Define your leader identity..."; // For display only
const DEFAULT_TARGET_REP = { id: 'default', text: "Set Your Focus Rep", definition: "Select a target rep from your Development Plan or the Rep Library.", microRep: "Review Development Plan", status: 'Pending' };

/**
 * DashboardScreen Component
 * The central hub ("Arena") displaying the user's daily focus, progress,
 * and tools for reflection and accountability.
 */
const DashboardScreen = () => {
  // --- Core Hooks & Services ---
  // 🚨 FINAL FIX: Capture the entire service object to ensure live function reading inside handlers
  const appServices = useAppServices();

  // Destructure variables from the captured service object
  const {
    navigate, user, db, userId, isAuthReady, // Basic app context
    // Renamed User Data Hooks (destructure data objects directly)
    developmentPlanData,
    dailyPracticeData,
    strategicContentData,
    // Global Metadata & Catalogs (using updated names)
    isLoading: isAppLoading, error: appError, featureFlags, REP_LIBRARY,
    IDENTITY_ANCHOR_CATALOG, HABIT_ANCHOR_CATALOG, WHY_CATALOG, LEADERSHIP_TIERS,
    // AI Services
    callSecureGeminiAPI, hasGeminiKey, updateDailyPracticeData // **CRITICAL: Include writer function here**
  } = appServices; // cite: useAppServices.jsx

  // --- Local Component State ---
  const [isSavingRep, setIsSavingRep] = useState(false); // Loading state for saving any rep
  const [showCelebration, setShowCelebration] = useState(false); // For completion animation
  const [showChallengePrompt, setShowChallengePrompt] = useState(false); // For 2-min challenge modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false); // Reflection log modal visibility
  const [reflectionHistory, setReflectionHistory] = useState([]); // Data for reflection log
  const [isHistoryLoading, setIsHistoryLoading] = useState(false); // Loading state for reflection history
  const [podPosts, setPodPosts] = useState(mockSocialFeedData); // Social feed posts (mock for now)
  const [isSavingMode, setIsSavingMode] = useState(false); // Loading state for Arena/Solo mode toggle
  const [lastReflectionEntry, setLastReflectionEntry] = useState(null); // Stores the *most recently saved* reflection for AI Nudge // cite: User Request
  // Modal visibility states
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);
  const [isWhyModalOpen, setIsWhyModalOpen] = useState(false);

  // --- Effects ---
  // Fetch reflection history when the log modal opens
  useEffect(() => {
    if (isLogModalOpen && db && userId) {
       const fetchHistory = async () => {
         console.log("[Dashboard] Fetching reflection history...");
         setIsHistoryLoading(true);
         try {
           // Fetch from the correct subcollection, ordered by timestamp descending
           const historyCollectionRef = collection(db, `daily_practice/${userId}/reflection_history`); // Updated path
           const q = query(historyCollectionRef, orderBy("timestamp", "desc"));
           const snap = await getDocs(q);
           const historyData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
           setReflectionHistory(historyData);
           console.log(`[Dashboard] Fetched ${historyData.length} reflection entries.`);
         } catch(e){
           console.error("[Dashboard] Failed to fetch reflection history:", e);
           setReflectionHistory([]); // Clear on error
           // Optionally show an error message
         } finally {
           setIsHistoryLoading(false);
         }
       };
       fetchHistory();
    }
  }, [isLogModalOpen, db, userId]);

  // Scroll to top on initial mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  // --- Derived Data (Memoized for Performance) ---
  const displayedUserName = useMemo(() => user?.name || user?.email?.split('@')[0] || 'Leader', [user]);
  const greeting = useMemo(() => `Welcome to The Arena,`, []); // Static greeting
const todayStr = new Date().toISOString().split('T')[0]; // Today's date string YYYY-MM-DD

  // --- Daily Practice State ---
  const isArenaMode = useMemo(() => dailyPracticeData?.arenaMode ?? true, [dailyPracticeData]); // cite: useAppServices.jsx
  const streakCount = useMemo(() => dailyPracticeData?.streakCount || 0, [dailyPracticeData]); // cite: useAppServices.jsx
  const streakCoins = useMemo(() => dailyPracticeData?.streakCoins || 0, [dailyPracticeData]); // cite: useAppServices.jsx
  const habitAnchor = useMemo(() => dailyPracticeData?.habitAnchor || DEFAULT_HABIT_ANCHOR, [dailyPracticeData]); // cite: useAppServices.jsx
  const isDefaultAnchor = habitAnchor === DEFAULT_HABIT_ANCHOR;
  const identityAnchorText = useMemo(() => dailyPracticeData?.identityAnchor || '', [dailyPracticeData]); // cite: useAppServices.jsx
  const identityStatement = useMemo(() => identityAnchorText ? `I'm the kind of leader who ${identityAnchorText}` : DEFAULT_IDENTITY_ANCHOR_PLACEHOLDER, [identityAnchorText]);

  // --- Strategic Content State ---
  // whyStatement pulls from strategicContentData (formerly planningData)
  const whyStatement = useMemo(() => {
      // Find the first goal with a 'why' statement
      const firstWhy = strategicContentData?.okrs?.find(okr => okr.why)?.why; // Assuming OKRs might store 'why'
      // Fallback to a top-level field if it exists, then default
      return firstWhy || strategicContentData?.overallWhy || DEFAULT_WHY_STATEMENT; // Added overallWhy as potential field
  }, [strategicContentData]);

  // --- Development Plan State ---
  const weakestTier = useMemo(() => {
      // Logic relies on assessment scores potentially stored in developmentPlanData
      const scores = developmentPlanData?.assessmentHistory?.[developmentPlanData.assessmentHistory.length - 1]?.scores; // Get latest scores
      if (!scores || !LEADERSHIP_TIERS || Object.keys(scores).length === 0) return { name: 'Getting Started', hex: COLORS.AMBER };

      try {
          // Find the dimension with the lowest score
          const sorted = Object.values(scores).sort((a, b) => a.score - b.score);
          const weakest = sorted[0];
          if (!weakest) return { name: 'Getting Started', hex: COLORS.AMBER };

          // Find the corresponding Tier ID and Metadata
          // This requires scores to potentially include tierId or mapping logic
          // Assuming dimension names map roughly to tier names for now (needs refinement)
          const tierKey = Object.keys(LEADERSHIP_TIERS).find(key =>
              LEADERSHIP_TIERS[key].name.toLowerCase().includes(weakest.name.split(' ')[0].toLowerCase())
          ) || 'T1'; // Default to T1 if no match

          const meta = LEADERSHIP_TIERS[tierKey];
          return { name: weakest.name, hex: meta?.color || COLORS.ORANGE, id: tierKey }; // Return ID as well, use 'color' from meta
      } catch (e) {
          console.error("[Dashboard] Error calculating weakest tier:", e, scores);
          return { name: 'Error Calculating', hex: COLORS.RED };
      }
  }, [developmentPlanData, LEADERSHIP_TIERS]);


  // --- ** CRITICAL FIX #1: Daily Target Rep Logic (Corrected Reset Handling) ** ---
  const dailyTargetRep = useMemo(() => {
    // 1. Get Rep Library (unchanged)
    const targetRepCatalog = REP_LIBRARY?.items || []; // Use unified REP_LIBRARY // cite: useAppServices.jsx
    if (targetRepCatalog.length === 0) {
        console.warn("[Dashboard] Rep Library is empty. Using default target rep.");
        return DEFAULT_TARGET_REP;
    }

    // 2. Determine Today's Target Rep ID (unchanged)
    const targetTierId = weakestTier?.id || 'T1';
    let selectedRepData = targetRepCatalog.find(rep => rep.tier_id === targetTierId);
    if (!selectedRepData) {
        selectedRepData = targetRepCatalog[0];
        console.warn(`[Dashboard] No rep found for tier ${targetTierId}, using first rep (${selectedRepData?.id}) as fallback.`);
    }
    if (!selectedRepData) {
        console.error("[Dashboard] Could not select any target rep from the library.");
        return DEFAULT_TARGET_REP;
    }

    // 3. Check User's Saved State - **MODIFIED LOGIC**
    let currentStatus = 'Pending'; // Default to Pending
    const savedRepId = dailyPracticeData?.dailyTargetRepId;
    const savedRepDate = dailyPracticeData?.dailyTargetRepDate;
    const savedRepStatus = dailyPracticeData?.dailyTargetRepStatus;
    const lastResetDate = dailyPracticeData?.lastStatusResetDate; // Get the date statuses were last reset

    // **NEW CHECK:** Only use the saved status if the statuses were ALREADY reset *for today*
    // AND the saved Rep ID matches the one selected for today
    // AND the saved Rep Date matches today.
    if (lastResetDate === todayStr && savedRepId === selectedRepData.id && savedRepDate === todayStr) {
        currentStatus = savedRepStatus || 'Pending'; // Use saved status if all conditions met
        console.log(`[Dashboard] Found VALID target rep state for today (${selectedRepData.id}): ${currentStatus}`);
    } else {
        // Otherwise, force Pending for today
        console.log(`[Dashboard] Forcing 'Pending' status for today (${selectedRepData.id}). Reason: Reset date mismatch (${lastResetDate} vs ${todayStr}) OR Rep ID mismatch (${savedRepId} vs ${selectedRepData.id}) OR Rep Date mismatch (${savedRepDate} vs ${todayStr})`);
        currentStatus = 'Pending';
        
        // Update the saved state to reflect today's selected rep (silent background update)
        // This ensures that if the user refreshes or comes back later today, we remember
        // which rep was assigned for today and its status
        // **FIX**: Access the function from the destructured scope variable `updateDailyPracticeData`
        if (updateDailyPracticeData && (savedRepId !== selectedRepData.id || savedRepDate !== todayStr)) {
            console.log(`[Dashboard] Updating saved rep state to today's selection: ${selectedRepData.id}`);
            updateDailyPracticeData({
                dailyTargetRepId: selectedRepData.id,
                dailyTargetRepDate: todayStr,
                dailyTargetRepStatus: 'Pending'
            }).catch(err => console.error("[Dashboard] Failed to update daily rep selection:", err));
        }
    }

    // 4. Return the Rep Object (unchanged)
    return {
        id: selectedRepData.id,
        text: selectedRepData.text,
        definition: selectedRepData.definition,
        microRep: selectedRepData.microRep,
        status: currentStatus // Status now strictly checked against reset date
    };

  // **FIX**: Include `updateDailyPracticeData` in the dependency array
  }, [REP_LIBRARY, weakestTier, dailyPracticeData, todayStr, updateDailyPracticeData]);


  // --- Additional Daily Reps (filtered from activeCommitments) ---
  const additionalCommitments = useMemo(() => {
    // Get all commitments, filter out the one matching today's target rep ID
    return (dailyPracticeData?.activeCommitments || []).filter(c => c.id !== dailyTargetRep.id);
  }, [dailyPracticeData?.activeCommitments, dailyTargetRep.id]);

  // --- Calculate Completion Stats ---
  const targetRepCompletedToday = dailyTargetRep.status === 'Committed' && dailyPracticeData?.dailyTargetRepDate === todayStr ? 1 : 0;
  // Count *additional* commitments that are currently marked 'Committed'
  // Note: The daily reset ensures this only reflects today's completions
  const additionalCommitsCompletedToday = useMemo(() => additionalCommitments.filter(c => c.status === 'Committed').length, [additionalCommitments]);
  // Total completed = Target (if done today) + Additional (if done today)
  const commitsCompletedToday = targetRepCompletedToday + additionalCommitsCompletedToday;
  // Total reps assigned for today = Target (if not default) + Additional
  const commitsTotalToday = (dailyTargetRep.id !== 'default' ? 1 : 0) + additionalCommitments.length;


  // --- Handlers ---

  // Triggers the celebration animation and optionally the 2-min challenge prompt
  const triggerCelebration = useCallback((showChallenge = false) => {
    console.log("[Dashboard] Triggering celebration. Show challenge:", showChallenge);
    setShowCelebration(true);
    setShowChallengePrompt(false); // Ensure challenge is hidden initially
    setTimeout(() => {
        setShowCelebration(false);
        // Show challenge only if flagged AND the target rep has a micro-rep defined
        if (showChallenge && dailyTargetRep?.microRep && dailyTargetRep.id !== 'default') {
            console.log("[Dashboard] Showing 2-minute challenge prompt for:", dailyTargetRep.microRep);
            setShowChallengePrompt(true);
        }
    }, 1500); // Celebration duration
  }, [dailyTargetRep]); // Dependency: dailyTargetRep for microRep check


  // --- Toggles the status of an *additional* daily rep ---
  const handleToggleAdditionalCommitment = useCallback(async (commitId) => {
      // 🚨 CRITICAL FIX: Get the LIVE function directly from the service object
      // Note: Since updateDailyPracticeData is destructured above, we can use it directly
      const updateFn = updateDailyPracticeData; // Use the destructured variable name

      if (isSavingRep) return; // Prevent double clicks
      console.log("[Dashboard] Toggling additional commitment:", commitId);
      setIsSavingRep(true);

      // CRITICAL FIX: Ensure update function is available before proceeding
      if (!updateFn) {
          console.error("[Dashboard] Failed to update additional rep: Update service function is not available.");
          alert("Error: Update service function is not available.");
          setIsSavingRep(false); return;
      }

      const currentCommits = dailyPracticeData?.activeCommitments || [];
      const targetCommitIndex = currentCommits.findIndex(c => c.id === commitId);

      if (targetCommitIndex === -1) {
          console.warn("[Dashboard] Attempted to toggle non-existent additional commitment:", commitId);
          setIsSavingRep(false); return;
      }

      const targetCommit = currentCommits[targetCommitIndex];
      // Double check it's not the target rep (should be filtered out, but safety first)
      if (targetCommit.id === dailyTargetRep.id) {
          console.warn("[Dashboard] Attempted to toggle target rep via additional rep handler.");
          setIsSavingRep(false); return;
      }

      // Determine the new status
      const newStatus = targetCommit.status === 'Committed' ? 'Pending' : 'Committed';
      console.log(`[Dashboard] Setting status of ${commitId} to ${newStatus}`);

      // Create the updated array of commitments
      const updatedCommitments = [
          ...currentCommits.slice(0, targetCommitIndex),
          { ...targetCommit, status: newStatus }, // Update the specific commitment
          ...currentCommits.slice(targetCommitIndex + 1)
      ];

      // Prepare the update payload for Firestore
      const updates = { activeCommitments: updatedCommitments }; // Only update the commitments array

      try {
        // Use the specific update function for daily practice data
        const success = await updateFn(updates); // cite: useAppServices.jsx
        if (success) {
            console.log("[Dashboard] Additional rep status updated successfully.");
            // OPTIONAL: Trigger a smaller, less intrusive confirmation?
            // if (newStatus === 'Committed') triggerMiniCelebration();
        } else {
             throw new Error("updateDailyPracticeData returned false");
        }
      } catch (error) {
        console.error("[Dashboard] Failed to update additional rep status:", error);
        alert("Error updating rep. Please try again.");
        // Optional: Revert local state if DB update fails? (More complex UI)
      } finally {
        setIsSavingRep(false); // Reset loading state
      }
    }, [updateDailyPracticeData, dailyPracticeData, isSavingRep, dailyTargetRep.id]); // Dependencies


  // --- Marks the *Daily Target Rep* as complete for *today* ---
  const completeTargetRep = useCallback(async () => {
       console.log('🔍 completeTargetRep CALLED');
       // Note: updateDailyPracticeData is destructured from useAppServices()
    
      // Prevent action if already saving, rep is default, or already committed for today
      if (isSavingRep || dailyTargetRep.id === 'default' || (dailyTargetRep.status === 'Committed' && dailyPracticeData?.dailyTargetRepDate === todayStr)) {
           console.log("[Dashboard] completeTargetRep: Action skipped (saving, default, or already complete today).");
           return;
      }
      console.log("[Dashboard] Completing target rep:", dailyTargetRep.id);
      setIsSavingRep(true);

      // CRITICAL FIX: Ensure update function is available before proceeding
      if (!updateDailyPracticeData) {
          console.error("[Dashboard] Failed to update target rep status: Update service function is not available.");
          alert("Error completing target rep. Update service is missing.");
          setIsSavingRep(false); // Reset saving state
          return; // Exit early
      }


      const newStatus = 'Committed';
      // Prepare updates for the target rep fields
      const updates = {
          dailyTargetRepId: dailyTargetRep.id, // Ensure ID matches the current target rep
          dailyTargetRepDate: todayStr,       // Set date to today
          dailyTargetRepStatus: newStatus      // Set status to Committed
      };

      // --- Streak & Coin Logic ---
      let updatedStreak = streakCount;
      let updatedCoins = streakCoins;
      // Check if this completion extends the streak (assuming reset handles non-completion)
      // Basic logic: Increment streak if completing today. More robust logic might check previous day's completion.
      // The daily reset logic in useFirestoreUserData handles the case where the user *didn't* complete yesterday.
      // So, simply incrementing here is generally safe if today's status was 'Pending'.
      if (dailyTargetRep.status === 'Pending') { // Only increment if it wasn't already committed today
           updatedStreak = (streakCount || 0) + 1;
           updates.streakCount = updatedStreak; // Add streak update
           console.log(`[Dashboard] Streak incremented to: ${updatedStreak}`);
           // Award coins every 7 days (Example)
           if (updatedStreak > 0 && updatedStreak % 7 === 0) {
               updatedCoins = (streakCoins || 0) + 2; // Award 2 coins
               updates.streakCoins = updatedCoins; // Add coins update
               console.log(`[Dashboard] Awarded coins. New total: ${updatedCoins}`);
           }
      } else {
           console.log("[Dashboard] Target rep was already 'Committed' today. Streak not incremented.");
      }


     try {
    // Update Firestore using the specific hook function
    console.log('🔍 About to call updateDailyPracticeData with updates:', updates);
    console.log('🔍 db:', db);
    console.log('🔍 userId:', userId);

    const success = await updateDailyPracticeData(updates); // cite: useAppServices.jsx

    console.log('🔍 updateDailyPracticeData returned:', success);

    if (success) {
              console.log("[Dashboard] Target rep marked complete successfully.");
              // Trigger celebration and potential challenge prompt only on successful completion
              triggerCelebration(true); // Show celebration + check for micro-rep challenge
          } else {
               throw new Error("updateDailyPracticeData returned false");
          }
      } catch (error) {
          console.error("[Dashboard] Failed to update target rep status:", error);
          alert("Error completing target rep. Please try again.");
          // Optional: Revert streak/coin updates locally if DB call fails?
      } finally {
          setIsSavingRep(false); // Reset loading state
      }
  }, [isSavingRep, dailyTargetRep, dailyPracticeData, todayStr, streakCount, streakCoins, triggerCelebration, updateDailyPracticeData, db, userId]); // Dependencies


  // Handler for the "Let's Do It!" button in the 2-Minute Challenge modal
  const handleDoMicroRep = () => {
      console.log("[Dashboard] User accepted 2-Minute Challenge for:", dailyTargetRep.microRep);
      // --- Future Enhancement: Log micro-rep completion ---
      // This could involve:
      // - Updating a specific field in dailyPracticeData
      // - Adding an entry to a micro-rep history subcollection
      // - Granting a small reward (e.g., +1 coin)
      // Example: updateDailyPracticeData({ microRepsCompletedToday: firebase.firestore.FieldValue.increment(1) });
      setShowChallengePrompt(false); // Hide the modal
      // Consider a smaller confirmation message instead of full celebration?
      // showToast("Micro-Rep logged!");
  };

  // Handler for sharing posts to the social pod (MOCK)
  const handleShareToPod = useCallback(async (postText) => {
    console.log("[Dashboard] Sharing to pod:", postText);

    if (!db || !userId) {
        console.error("[Dashboard] Cannot share to pod: missing db or userId");
        alert("Error: Unable to share post. Please try again.");
        return;
    }

    try {
        // Create the post document in Firestore
        const postsCollectionRef = collection(db, 'community/posts/feed');
        const newPost = {
            authorId: userId,
            authorName: displayedUserName,
            text: postText,
            createdAt: serverTimestamp(),
        };

        // Save to Firestore
        const docRef = await addDoc(postsCollectionRef, newPost);
        console.log("[Dashboard] Post saved to Firestore with ID:", docRef.id);

        // Update local state for immediate feedback
        setPodPosts(prev => [{
            id: docRef.id,
            author: displayedUserName,
            text: postText,
            time: "Just now"
        }, ...prev]);

    // --- FIX #4: ENHANCED ERROR LOGGING ---
    } catch (error) {
        // **ADD MORE LOGGING:**
        console.error("[Dashboard] Error saving post to pod:", error);
        console.error("Firestore Error Code:", error.code); // Log specific code
        console.error("Firestore Error Message:", error.message); // Log specific message
        alert(`Error: Failed to share post. (${error.code || error.message})`); // Show code in alert
    }
  }, [db, userId, displayedUserName]);

  // Callback passed to EmbeddedReflectionForm, triggered on successful save
  const handleReflectionSaved = useCallback((savedEntry) => {
      console.log("[Dashboard] Reflection saved successfully. Updating lastReflectionEntry:", savedEntry.id);
      // Update state to hold the latest saved entry, which triggers the AICoachNudge
      setLastReflectionEntry(savedEntry); // cite: User Request
  }, []); // No dependencies needed

  // Handler for toggling Arena/Solo mode
  const handleModeToggle = async () => {
      // 🚨 CRITICAL FIX: Get the LIVE function directly from the service object
      // Note: updateDailyPracticeData is destructured above, we can use it directly
      const updateFn = updateDailyPracticeData;

      if (isSavingMode) return;
      setIsSavingMode(true);
      const newMode = !isArenaMode;
      console.log(`[Dashboard] Toggling Arena Mode to: ${newMode}`);

      // CRITICAL FIX: Check for update function
      if (!updateFn) {
          console.error("[Dashboard] Failed to update mode: Update service function is not available.");
          alert("Error: Mode toggle service is missing.");
          setIsSavingMode(false);
          return;
      }

      try {
          // Update the arenaMode field in dailyPracticeData
          const success = await updateFn({ arenaMode: newMode }); // cite: useAppServices.jsx
          if (!success) throw new Error("updateDailyPracticeData returned false");
          console.log("[Dashboard] Arena Mode updated successfully.");
      } catch (error) {
          console.error("[Dashboard] Failed to update mode:", error);
          alert("Could not switch mode. Please try again.");
          // Optional: Revert local UI state if update fails
      } finally {
          setIsSavingMode(false);
      }
    };

  // --- Modal Save Handlers ---
  // Save Identity Anchor (updates dailyPracticeData)
  const handleSaveIdentity = async (newIdentitySuffix) => {
    // 🚨 CRITICAL FIX: Get the LIVE function directly from the service object
    const updateFn = updateDailyPracticeData;

    if (!newIdentitySuffix.trim()) { alert("Identity anchor cannot be empty."); return; }
    // CRITICAL FIX: Check for update function
    if (!updateFn) { console.error("[Dashboard] Identity update failed: Service missing."); alert("Update service is missing."); return; }

    console.log("[Dashboard] Saving Identity Anchor:", newIdentitySuffix);
    try {
      const success = await updateFn({ identityAnchor: newIdentitySuffix.trim() }); // cite: useAppServices.jsx
      if (success) {
          setIsIdentityModalOpen(false); // Close modal on success
          console.log("[Dashboard] Identity Anchor saved.");
      } else { throw new Error("updateDailyPracticeData returned false"); }
    } catch (e) { console.error("[Dashboard] Failed to save identity anchor:", e); alert("Failed to save identity anchor."); }
  };

  // Save Habit Anchor (updates dailyPracticeData)
  const handleSaveHabitAnchor = async (newAnchor) => {
    // 🚨 CRITICAL FIX: Get the LIVE function directly from the service object
    const updateFn = updateDailyPracticeData;

    if (!newAnchor.trim()) { alert("Habit anchor cannot be empty."); return; }
    // CRITICAL FIX: Check for update function
    if (!updateFn) { console.error("[Dashboard] Habit Anchor update failed: Service missing."); alert("Update service is missing."); return; }

    console.log("[Dashboard] Saving Habit Anchor:", newAnchor);
    try {
      const success = await updateFn({ habitAnchor: newAnchor.trim() }); // cite: useAppServices.jsx
      if (success) {
          setIsHabitModalOpen(false); // Close modal on success
          console.log("[Dashboard] Habit Anchor saved.");
      } else { throw new Error("updateDailyPracticeData returned false"); }
    } catch (e) { console.error("[Dashboard] Failed to save habit anchor:", e); alert("Failed to save habit anchor."); }
  };

  // Save Why It Matters (updates strategicContentData)
  const handleSaveWhy = async (newWhy) => {
    // 🚨 CRITICAL FIX: Get the LIVE function directly from the service object
    const updateStrategicContentData = appServices.updateStrategicContentData;

    if (!newWhy.trim()) { alert("'Why' statement cannot be empty."); return; }
    // CRITICAL FIX: Check for update function
    if (!updateStrategicContentData) { console.error("[Dashboard] Why update failed: Service missing."); alert("Update service is missing."); return; }

    console.log("[Dashboard] Saving Why statement:", newWhy);
    // Determine where to save 'Why'. Assume an 'overallWhy' field for simplicity.
    const updates = { overallWhy: newWhy.trim() };
    try {
      // Use the correct update function for strategic content
      const success = await updateStrategicContentData(updates); // cite: useAppServices.jsx
      if (success) {
          setIsWhyModalOpen(false); // Close modal on success
          console.log("[Dashboard] Why statement saved.");
      } else { throw new Error("updateStrategicContentData returned false"); }
    } catch (e) { console.error("[Dashboard] Failed to save 'Why':", e); alert("Failed to save 'Why' statement."); }
  };


  // --- Main Render ---
  // Display loading spinner if essential app data is still loading
  if (isAppLoading || !isAuthReady) {
     return ( // Use consistent loading spinner
         <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
             <div className="flex flex-col items-center">
                 <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} />
                 <p className="font-semibold" style={{ color: COLORS.NAVY }}>Loading Your Arena...</p>
             </div>
         </div>
     );
  }
  // Display error message if app loading failed
  if (appError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: COLORS.BG }}>
            <div className="p-6 max-w-xl mx-auto bg-red-50 border border-red-200 rounded-xl text-red-700 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <h3 className="font-bold text-lg">Application Error</h3>
                </div>
                <p className="text-sm">Failed to load essential application data. Please try refreshing.</p>
                <pre className="text-xs mt-2 overflow-x-auto whitespace-pre-wrap">{appError.message}</pre>
            </div>
        </div>
      );
  }

  // --- Extract Suggestion Catalogs Safely ---
  // Use empty arrays as fallbacks if catalogs are missing
  const identitySuggestions = IDENTITY_ANCHOR_CATALOG?.items || []; // cite: useAppServices.jsx
  const habitSuggestions = HABIT_ANCHOR_CATALOG?.items || []; // cite: useAppServices.jsx
  const whySuggestions = WHY_CATALOG?.items || []; // cite: useAppServices.jsx

  // Determine if the target rep button should be enabled
  const canCompleteTargetRep = dailyTargetRep.id !== 'default' && dailyTargetRep.status !== 'Committed';

  return (
    // Main container with padding and background color
    <div className={`p-4 md:p-6 lg:p-8 space-y-6 min-h-screen`} style={{ background: COLORS.BG }}> {/* Use BG color */}
      {/* Modals and Overlays */}
      <CelebrationOverlay show={showCelebration} />
      <ReflectionLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} history={reflectionHistory} isLoading={isHistoryLoading} />
      <IdentityAnchorModal isOpen={isIdentityModalOpen} onClose={() => setIsIdentityModalOpen(false)} currentIdentity={identityStatement} onSave={handleSaveIdentity} suggestions={identitySuggestions} />
      <HabitAnchorModal isOpen={isHabitModalOpen} onClose={() => setIsHabitModalOpen(false)} currentAnchor={habitAnchor} onSave={handleSaveHabitAnchor} suggestions={habitSuggestions} defaultAnchorText={DEFAULT_HABIT_ANCHOR} />
      <WhyItMattersModal isOpen={isWhyModalOpen} onClose={() => setIsWhyModalOpen(false)} currentWhy={whyStatement === DEFAULT_WHY_STATEMENT ? "" : whyStatement} onSave={handleSaveWhy} suggestions={whySuggestions} />

      {/* 2-Minute Challenge Prompt Modal */}
      {showChallengePrompt && dailyTargetRep.microRep && dailyTargetRep.id !== 'default' && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowChallengePrompt(false)}>
          <div className="relative w-full max-w-md bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl shadow-2xl border-2 border-orange-300 p-6 text-center animate-in zoom-in-95 slide-in-from-bottom-5" onClick={(e) => e.stopPropagation()}>
             <Award className="w-12 h-12 text-orange-500 mx-auto mb-3"/>
             <h3 className="text-xl font-bold text-orange-800 mb-2">Up for a 2-Minute Challenge?</h3>
             <p className="text-md text-orange-700 mb-4">{dailyTargetRep.microRep}</p>
             <div className="flex gap-3 justify-center">
                 <Button onClick={handleDoMicroRep} variant="secondary" size="md"> {/* Use md size */}
                     <Zap className="w-5 h-5 mr-1.5"/> Let's Do It!
                 </Button>
                 <Button onClick={() => setShowChallengePrompt(false)} variant="outline" size="sm" className="!border-orange-300 !text-orange-600"> {/* Use sm size */}
                     Maybe Later
                 </Button>
             </div>
          </div>
        </div>
      )}


      {/* 1. Header Area */}
      {/* Use OFF_WHITE background for header, consistent padding, teal bottom border */}
      <header className={`bg-[${COLORS.OFF_WHITE}] p-4 md:p-6 -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 mb-6 rounded-b-xl shadow-md border-b-4 border-[${COLORS.TEAL}]`}>
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Title */}
          <h1 className={`text-2xl md:text-3xl font-extrabold flex items-center gap-2`} style={{ color: COLORS.NAVY }}>
              <Home size={28} style={{ color: COLORS.TEAL }} /> The Arena
          </h1>
          {/* Header Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end">
            <StreakTracker streakCount={streakCount} coins={streakCoins} />
            {/* Conditional Recap Button based on feature flag */}
            {featureFlags?.enableRecap && ( // Example feature flag usage
                <Button onClick={() => navigate('weekly-recap')} variant="outline" size="sm">
                    <Calendar className="w-4 h-4 mr-1.5" /> Recap
                </Button>
            )}
            <ModeSwitch isArenaMode={isArenaMode} onToggle={handleModeToggle} isLoading={isSavingMode} />
          </div>
        </div>
        {/* Greeting and Focus */}
        <p className="text-gray-600 text-base mt-3">
            {greeting} <span className={`font-semibold`} style={{ color: COLORS.NAVY }}>{displayedUserName}</span>.
            Focus Area: <strong style={{ color: weakestTier?.hex || COLORS.NAVY }}>{weakestTier?.name || 'Getting Started'}</strong>.
        </p>
      </header>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* --- Left Column (Wider) --- */}
        <div className="lg:col-span-3 space-y-6">
           {/* Strategic Focus Card (Target Rep) */}
           <Card title="🎯 Today's Focus Rep" icon={Flag} accent='NAVY'>
              <div className='grid md:grid-cols-5 gap-4 md:gap-6 mb-4'>
                 {/* Rep Text (Larger Area) */}
                 <div className="md:col-span-3">
                    <p className='text-sm font-semibold text-gray-600 mb-1'>Target Rep:</p>
                    <p className={`text-lg font-bold ${
                        dailyTargetRep.status === 'Committed' ? 'text-green-700 line-through decoration-2' : `text-[${COLORS.NAVY}]` // Check status directly
                    }`}>{dailyTargetRep.text}</p>
                 </div>
                 {/* Definition (Smaller Area) */}
                 <div className="md:col-span-2">
                     <p className='text-sm font-semibold text-gray-600 mb-1'>What Good Looks Like:</p>
                     <p className='text-sm italic text-gray-700'>{dailyTargetRep.definition}</p>
                 </div>
              </div>

              {/* Complete Target Rep Button */}
              <div className="mt-5 pt-4 border-t border-gray-200">
                 <Button
                    onClick={completeTargetRep}
                    disabled={dailyTargetRep.id === 'default' || dailyTargetRep.status === 'Committed' || isSavingRep} // Use direct status check
                    variant={dailyTargetRep.status === 'Committed' ? "outline" : "primary"} // Use direct status check
                    size="md" // Use md size
                    className={`w-full ${dailyTargetRep.status === 'Committed' ? '!border-green-300 !text-green-700 !bg-green-50 cursor-default' : ''}`} // Use direct status check
                 >
                   {/* Conditional Icon and Text */}
                   {isSavingRep && dailyTargetRep.status !== 'Committed' ? <Loader className="animate-spin w-5 h-5 mr-2"/> : (dailyTargetRep.status === 'Committed' ? <CheckCircle className="w-5 h-5 mr-2"/> : <Zap className="w-5 h-5 mr-2"/>)}
                   {dailyTargetRep.status === 'Committed' ? 'Focus Rep Complete Today!' : (isSavingRep ? 'Saving...' : 'Complete Focus Rep')}
                 </Button>
              </div>

              {/* Identity Anchor Display & Edit */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className='text-sm font-semibold text-gray-600 mb-1'><User className="inline w-4 h-4 mr-1" /> Identity Anchor:</p>
                <p className='text-md italic text-gray-800 font-medium mb-3'>"{identityStatement}"</p>
                <Button onClick={() => setIsIdentityModalOpen(true)} variant="outline" size="sm" className="w-full">
                  <Edit3 className="w-4 h-4 mr-2" /> {identityAnchorText ? 'Edit' : 'Set'} Identity Anchor
                </Button>
              </div>
           </Card>

           {/* Why & Habit Cards (Side-by-side) */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <WhyItMattersCard statement={whyStatement} onPersonalize={() => setIsWhyModalOpen(true)} />
             <HabitAnchorCard anchor={habitAnchor} onEdit={() => setIsHabitModalOpen(true)} isDefault={isDefaultAnchor} />
           </div>

           {/* Additional Daily Reps Card */}
           <Card title={`⏳ Additional Daily Reps (${additionalCommitsCompletedToday}/${additionalCommitments.length})`} icon={Clock} accent='TEAL'>
             <EmbeddedDailyReps
                commitments={additionalCommitments}
                onToggleCommit={handleToggleAdditionalCommitment}
                isLoading={isSavingRep} // Use general saving flag for loading state
             />
           </Card>

           {/* Social Pod Card (Conditionally Rendered) */}
           <SocialPodFeed
                feed={podPosts}
                onShare={handleShareToPod}
                isArenaMode={isArenaMode}
                featureFlags={featureFlags} // Pass flags down
           />
        </div>

        {/* --- Right Column (Narrower) --- */}
        <div className="lg:col-span-2 space-y-6">
             {/* Embedded Reflection Form */}
             <EmbeddedReflectionForm
                db={db}
                userId={userId}
                onOpenLog={() => setIsLogModalOpen(true)}
                onSaveSuccess={handleReflectionSaved} // Pass callback
                // Show initial prompt only if no reflection has been saved *yet* in this session
                showCoachPrompt={!lastReflectionEntry} // cite: User Request
             />
             {/* AI Coach Nudge (Renders inside the reflection form's container) */}
             <AICoachNudge
                lastReflectionEntry={lastReflectionEntry} // Pass the latest saved entry
                callSecureGeminiAPI={callSecureGeminiAPI}
                hasGeminiKey={hasGeminiKey}
             />
             {/* Placeholder for potential future widgets in this column */}
             {/* <Card title="Upcoming Events" icon={Calendar}>...</Card> */}
        </div>
      </div>

       {/* Footer section is now handled globally in AppContent */}
    </div>
  );
};

export default DashboardScreen;