// src/components/screens/Dashboard.jsx (NEW SIMPLIFIED VERSION)
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';

// Icons (Ensure all used icons are imported)
import {
  Home, Zap, AlertTriangle, Target, Briefcase, Loader, Lightbulb, Sparkles, CheckCircle, Clock, Save, CornerDownRight, Flag, User, Activity, BarChart3, Check, X
} from 'lucide-react';

/* =========================================================
   PALETTE & UI COMPONENTS (Using existing definitions)
========================================================= */
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#002E47', MUTED: '#4B5355', PURPLE: '#7C3AED' };

// Button, ThreeDButton, Card components (using definitions from your previous Dashboard.jsx)
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return ( <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button> );
};
const ThreeDButton = ({ children, onClick, color = COLORS.TEAL, accentColor = COLORS.NAVY, className = '', ...rest }) => { /* ... same as before ... */
  const buttonStyle = { background: color, boxShadow: `0 4px 0px 0px ${accentColor}, 0 6px 12px rgba(0,0,0,0.2)`, transition: 'all 0.1s ease-out', transform: 'translateY(0px)' };
  return ( <button {...rest} onClick={onClick} type="button" className={`${className} flex items-center justify-center p-3 rounded-xl font-extrabold text-white cursor-pointer transition-all duration-100`} style={buttonStyle}>{children}</button> );
};
const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => { /* ... same as before ... */
  const interactive = !!onClick; const Tag = interactive ? 'button' : 'div'; const accentColor = COLORS[accent] || COLORS.NAVY; const handleKeyDown = (e) => { if (!interactive) return; if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } };
  return ( <Tag {...(interactive ? { type: 'button' } : {})} role={interactive ? 'button' : undefined} tabIndex={interactive ? 0 : undefined} onKeyDown={handleKeyDown} className={`relative p-6 rounded-2xl border-2 shadow-2xl hover:shadow-xl transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }} onClick={onClick}> <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} /> {Icon && ( <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} /> </div> )} {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>} {children} </Tag> );
};

/* =========================================================
   AI NUDGE LOGIC (Using existing logic)
========================================================= */
// (extractGeminiText, mdToHtmlFunc, TIP_CACHE, SIMPLE_FALLBACK_TIP remain the same)
function extractGeminiText(resp) { /* ... same as before ... */ if (!resp) return ''; if (typeof resp === 'string') return String(resp); if (resp.text) return String(resp.text); const c = resp.candidates?.[0]; const parts = c?.content?.parts; if (Array.isArray(parts)) { return parts.map(p => p?.text).filter(Boolean).join('\n\n'); } return ''; }
const mdToHtmlFunc = async (md = '') => { /* ... same as before ... */ let html = md; html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>'); html = html.replace(/\> (.*)/gim, '<blockquote class="text-sm border-l-4 border-gray-400 pl-3 italic text-gray-700">$1</blockquote>'); html = html.split('\n').map(line => line.trim()).filter(line => line.length > 0).map(line => { if (!line.startsWith('<')) return `<p class="text-sm text-gray-700">${line}</p>`; return line; }).join(''); return html; };
const TIP_CACHE = { content: null, timestamp: 0, TTL: 4 * 60 * 60 * 1000, lastAITip: null };
const SIMPLE_FALLBACK_TIP = 'Focus today on deep listening; practice paraphrasing your colleague\'s needs before offering solutions.';

/* =========================================================
   NEW: Embedded Daily Reps Component
========================================================= */
const EmbeddedDailyReps = ({ commitments, onToggleCommit, isLoading }) => {
  const { navigate } = useAppServices();

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">Loading reps...</div>;
  }

  if (!commitments || commitments.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50">
        <p className="text-gray-600 font-semibold mb-3">No reps defined for today.</p>
        <Button onClick={() => navigate('development-plan')} variant="outline" className="text-sm px-4 py-2">
          Set Up Your Development Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {commitments.map((commit) => (
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
       {/* Button to go to the full Daily Practice screen (for reflection) */}
       <Button
          onClick={() => navigate('daily-practice')}
          variant="primary"
          className="w-full mt-4 !py-2 text-base"
        >
          <CornerDownRight className="w-4 h-4 mr-2" /> Complete Today's Reflection Rep
        </Button>
    </div>
  );
};


/* =========================================================
   Dashboard Screen (Main Export - Simplified)
========================================================= */
const DashboardScreen = () => {
  const {
    navigate, user, pdpData, commitmentData, planningData, callSecureGeminiAPI, hasGeminiKey,
    LEADERSHIP_TIERS, TARGET_REP_CATALOG, updateCommitmentData, isLoading: isAppLoading // Use main loading flag
  } = useAppServices();

  const [isSavingRep, setIsSavingRep] = useState(false); // Local loading state for rep updates

  // --- Derived Data Calculations ---
  const displayedUserName = useMemo(() => user?.name || user?.email?.split('@')[0] || 'Leader', [user]);
  const greeting = useMemo(() => 'Welcome to The Arena,', []); // Simplified greeting
  const activeCommitments = useMemo(() => commitmentData?.active_commitments || [], [commitmentData]);
  const commitsCompleted = useMemo(() => activeCommitments.filter(c => c.status === 'Committed').length, [activeCommitments]);
  const commitsTotal = activeCommitments.length;

  const identityStatement = useMemo(() => commitmentData?.reflection_journal?.split('\n').find(l => l.startsWith('Identity:'))?.substring(9).trim() || 'I am a principled leader.', [commitmentData]);

  const dailyTargetRep = useMemo(() => {
    // Prioritize linked reps from PDP first, then catalog, then fallback
    const pdpRep = activeCommitments.find(c => c.source === 'DevelopmentPlan');
    if (pdpRep) return pdpRep.text.replace('[90-Day Focus]', '').trim();
    const catalog = TARGET_REP_CATALOG || [];
    return catalog[0]?.text || 'Define your top priority rep.';
  }, [activeCommitments, TARGET_REP_CATALOG]);

  const weakestTier = useMemo(() => {
    // Using the same logic as before to find weakest tier from pdpData.assessment.scores
    const scores = pdpData?.assessment?.scores;
    if (!scores || !LEADERSHIP_TIERS) return { id: 'T3', name: 'Getting Started', hex: COLORS.AMBER };
    const sortedDimensions = Object.values(scores).sort((a, b) => a.score - b.score);
    const weakest = sortedDimensions[0];
    if (!weakest) return { id: 'T3', name: 'Getting Started', hex: COLORS.AMBER };
    const tierKey = Object.keys(LEADERSHIP_TIERS).find(key => LEADERSHIP_TIERS[key].name.includes(weakest.name.split(' ')[0])) || 'T1';
    const meta = LEADERSHIP_TIERS[tierKey];
    return { id: weakest.name, name: weakest.name, hex: meta?.hex || COLORS.ORANGE };
  }, [pdpData, LEADERSHIP_TIERS, COLORS.AMBER, COLORS.ORANGE]);

  // --- AI Nudge Logic (Unchanged from previous version) ---
  const [tipLoading, setTipLoading] = useState(false);
  const [tipContent, setTipContent] = useState(SIMPLE_FALLBACK_TIP);
  const [tipHtml, setTipHtml] = useState('');

  useEffect(() => { (async () => { if (!tipHtml && tipContent) setTipHtml(await mdToHtmlFunc(tipContent)); })(); }, [tipContent, tipHtml]);

  const getInitialAITip = useCallback(async () => { /* ... same AI fetch logic as before ... */
     if (!hasGeminiKey() || tipContent !== SIMPLE_FALLBACK_TIP) return; setTipLoading(true); try { const weakestSkill = weakestTier?.name || 'General Leadership'; const prompt = `Give a concise, actionable leadership practice for the day (3 sentences max). Focus the tip explicitly on improving the skill: ${weakestSkill}. Tone: encouraging, strategic, direct.`; const payload = { contents: [{ parts: [{ text: prompt }] }] }; const resp = await callSecureGeminiAPI(payload); const text = extractGeminiText(resp) || SIMPLE_FALLBACK_TIP; TIP_CACHE.lastAITip = text; setTipContent(text); setTipHtml(await mdToHtmlFunc(text)); } catch (e) { console.error('AI tip fetch error:', e); const fallbackText = SIMPLE_FALLBACK_TIP; TIP_CACHE.lastAITip = fallbackText; setTipContent(fallbackText); setTipHtml(await mdToHtmlFunc(`**Error**: AI connection failed. Using local tip. ${fallbackText}`)); } finally { setTipLoading(false); }
  }, [weakestTier?.name, callSecureGeminiAPI, hasGeminiKey, tipContent]);

  const nextNudge = useCallback(async () => { /* ... same nextNudge logic as before ... */
     let nextTip = ''; if (tipLoading) return; const availableNudges = [TIP_CACHE.lastAITip || SIMPLE_FALLBACK_TIP]; let attempts = 0; do { const newIndex = Math.floor(Math.random() * availableNudges.length); nextTip = availableNudges[newIndex]; attempts++; } while (nextTip === tipContent && attempts < 5); if (nextTip === tipContent && !hasGeminiKey()) { nextTip = SIMPLE_FALLBACK_TIP; } else if (nextTip === tipContent && hasGeminiKey()) { getInitialAITip(); return; } setTipContent(nextTip); setTipHtml(await mdToHtmlFunc(nextTip));
  }, [tipContent, tipLoading, hasGeminiKey, getInitialAITip]);

  useEffect(() => { if (hasGeminiKey() && weakestTier) { getInitialAITip(); } }, [weakestTier?.name, hasGeminiKey, getInitialAITip]);


  // --- NEW: Handle Toggling Rep Commitment ---
  const handleToggleCommitment = useCallback(async (commitId) => {
    if (isSavingRep) return; // Prevent double clicks
    setIsSavingRep(true);
    const currentCommits = commitmentData?.active_commitments || [];
    const targetCommit = currentCommits.find(c => c.id === commitId);
    if (!targetCommit) return;

    const newStatus = targetCommit.status === 'Committed' ? 'Pending' : 'Committed';
    const updatedCommitments = currentCommits.map(c =>
      c.id === commitId ? { ...c, status: newStatus } : c
    );

    try {
      // Use the updateCommitmentData function from useAppServices
      await updateCommitmentData({ active_commitments: updatedCommitments });
      console.log(`Rep ${commitId} status updated to ${newStatus}`);
    } catch (error) {
      console.error("Failed to update rep status:", error);
      // Optionally show an error to the user
    } finally {
      setIsSavingRep(false);
    }
  }, [commitmentData, updateCommitmentData, isSavingRep]);

  // --- Main Render ---
  if (isAppLoading && !commitmentData) { // Show loading only if core data isn't ready
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <Loader className="animate-spin text-[#47A88D] h-12 w-12" />
          </div>
      );
  }

  return (
    <div className={`p-6 space-y-6 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
      {/* 1. Header */}
      <div className={`bg-[${COLORS.OFF_WHITE}] p-6 -mx-6 -mt-6 mb-4 rounded-b-xl shadow-md border-b-4 border-[${COLORS.TEAL}]`}>
        <h1 className={`text-3xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3`}>
          <Home size={28} style={{ color: COLORS.TEAL }} /> The Arena Dashboard
        </h1>
        <p className="text-gray-600 text-base mt-2">
          {greeting} <span className={`font-semibold text-[${COLORS.NAVY}]`}>{displayedUserName}</span>. Your focus: <strong style={{ color: weakestTier?.hex || COLORS.NAVY }}>{weakestTier?.name || 'Getting Started'}</strong>.
        </p>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Today's Reps & Actions */}
        <div className="lg:col-span-2 space-y-6">
           <Card title="🎯 Today's Strategic Focus" icon={Target} accent='NAVY'>
              <div className='grid md:grid-cols-2 gap-4'>
                  <div>
                      <p className='text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1'><Flag className='w-4 h-4 text-red-500'/> Target Rep:</p>
                      <p className='text-md font-bold text-[#E04E1B]'>{dailyTargetRep}</p>
                  </div>
                  <div>
                       <p className='text-sm font-semibold text-gray-700 mb-1 uppercase tracking-wide flex items-center gap-1'><User className='w-4 h-4 text-gray-500'/> Identity Anchor:</p>
                       <p className='text-md italic text-[#002E47]'>"{identityStatement}"</p>
                  </div>
              </div>
          </Card>

          <Card title={`⏳ Today's Reps (${commitsCompleted}/${commitsTotal})`} icon={Clock} accent='TEAL'>
             <EmbeddedDailyReps
                commitments={activeCommitments}
                onToggleCommit={handleToggleCommitment}
                isLoading={isSavingRep || (isAppLoading && !commitmentData)} // Show loading if app is loading OR saving rep
             />
          </Card>

          {/* Quick Links / Launchpad */}
           <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                 {/* Link to Development Plan */}
                <ThreeDButton
                    onClick={() => navigate('development-plan')}
                    color={COLORS.ORANGE}
                    accentColor={COLORS.NAVY}
                    className="h-20 flex-col px-3 py-2 text-white"
                >
                    <Briefcase className='w-5 h-5 mb-1'/>
                    <span className='text-base font-extrabold'>My Development Plan</span>
                </ThreeDButton>

                {/* Link to AI Coaching Lab */}
                 <ThreeDButton
                    onClick={() => navigate('coaching-lab')}
                    color={COLORS.PURPLE}
                    accentColor={COLORS.NAVY}
                    className="h-20 flex-col px-3 py-2 text-white"
                >
                    <Sparkles className='w-5 h-5 mb-1'/>
                    <span className='text-base font-extrabold'>AI Coaching Lab</span>
                </ThreeDButton>
            </div>
        </div>

        {/* Right Column: AI Nudge */}
        <div className="lg:col-span-1 space-y-6">
             <Card title="💡 Strategic Nudge" icon={Lightbulb} accent='AMBER' className="sticky top-4">
                <div className="prose prose-sm max-w-none mb-4">
                    {tipHtml
                        ? <div dangerouslySetInnerHTML={{ __html: tipHtml }} />
                        : <p className="text-gray-600">Loading AI insight...</p>}
                </div>
                <Button
                    onClick={nextNudge}
                    disabled={tipLoading}
                    variant='outline'
                    className='w-full !py-2 text-sm'
                >
                    {tipLoading ? <Loader size={16} className='animate-spin' /> : <Sparkles size={16} />}
                    Next Coaching Nudge
                </Button>
            </Card>
        </div>
      </div>

       {/* Footer/Reminder - Optional */}
       <div className="text-center text-xs text-gray-500 pt-6 border-t mt-6">
           Remember: Consistency compounds. Log your reps daily and complete your reflection.
       </div>

    </div>
  );
};

export default DashboardScreen;