// src/components/screens/Dashboard.jsx 
import React, { useMemo, useState, useEffect, useCallback } from 'react';
// CRITICAL FIX: Use the actual service hook from the expected path
import { useAppServices } from '../../services/useAppServices.jsx'; 

// --- MOCK IMPORTS REMOVED: All MOCK_DATA, LEADERSHIP_TIERS, and LOCAL_NUDGES are now deleted and must be loaded from the service context ---


// Icons
import {
  Clock as ClockIcon,
  TrendingUp,
  BookOpen,
  Mic,
  Zap,
  AlertTriangle,
  Home,
  CornerRightUp,
  BarChart3,
  Target,
  Briefcase,
  Star,
  Loader,
  Trello,
  CalendarClock,
  LayoutDashboard,
  TrendingDown,
  MessageSquare,
  User,
  Activity,
  CheckCircle,
  Users,
  Lightbulb, 
  Link as CommunityIcon, 
  Archive, 
  ShieldCheck, 
  Map,
  Film, 
  Dumbbell,
  ChevronsRight,
  Send,
  Flag,
  CornerDownRight,
  Sparkles
} from 'lucide-react';

/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  NAVY: '#002E47', 
  TEAL: '#47A88D', 
  BLUE: '#2563EB',
  ORANGE: '#E04E1B', 
  GREEN: '#10B981',
  AMBER: '#F5A800',
  RED: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF',
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
  MUTED: '#4B5355',
  PURPLE: '#7C3AED',
};

// Streak calculation utility (Now self-contained, as original was a dependency of mock)
function calculateStreak(history) {
    let streak = 0;
    const validHistory = Array.isArray(history) ? history : [];
    const sortedHistory = [...validHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); 
    for (let i = 0; i < 7; i++) { 
      const checkDate = new Date(yesterday);
      checkDate.setDate(yesterday.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      const historyEntry = sortedHistory.find(h => h.date === dateString);
      if (historyEntry) {
        const scoreParts = historyEntry.score.split('/');
        if (scoreParts.length === 2) {
          const [committed, total] = scoreParts.map(Number);
          if (committed === total && total > 0) streak++;
          else break;
        }
      } else break;
    }
    return streak;
}

// --- UI Components (Standardized and Referenced Below) ---

const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
      {children}
    </button>
  );
};

const ThreeDButton = ({ children, onClick, color = COLORS.TEAL, accentColor = COLORS.NAVY, className = '', ...rest }) => {
  const defaultColor = color;
  const defaultAccent = accentColor; 
  
  const buttonStyle = {
    background: defaultColor, 
    boxShadow: `0 4px 0px 0px ${defaultAccent}, 0 6px 12px rgba(0,0,0,0.2)`,
    transition: 'all 0.1s ease-out',
    transform: 'translateY(0px)',
  };

  return (
    <button
      {...rest}
      onClick={onClick}
      type="button"
      className={`${className} flex items-center justify-center p-3 rounded-xl font-extrabold text-white cursor-pointer transition-all duration-100`}
      style={buttonStyle}
    >
      {children}
    </button>
  );
};


const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = COLORS[accent] || COLORS.NAVY;
  const handleKeyDown = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };
  return (
    <Tag
      {...(interactive ? { type: 'button' } : {})}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative p-6 rounded-2xl border-2 shadow-2xl hover:shadow-xl transition-all duration-300 text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </Tag>
  );
};

const StatCard = ({ icon: Icon, label, value, onClick, trend = 0, colorHex, size = 'full', ...rest }) => {
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
  const showTrend = trend !== 0; 
  const trendColor = trend > 0 ? COLORS.TEAL : trend < 0 ? COLORS.ORANGE : COLORS.MUTED;
  
  // Map label to a strong accent color
  let accent = 'NAVY';
  if (label.includes("Streak")) { accent = 'GREEN'; }
  if (label.includes("Total Reps Completed")) { accent = 'TEAL'; }
  if (label.includes("Daily Reps Completed Today")) { accent = 'ORANGE'; }
  if (label.includes("Roadmap Months Remaining")) { accent = 'NAVY'; }
  if (label.includes("Total Coaching Labs")) { accent = 'PURPLE'; }
  if (label.includes("Labs Today")) { accent = 'BLUE'; }
  if (label.includes("Weakest Tier Focus")) { accent = 'AMBER'; }
  if (label.includes("Longest-Held OKR")) { accent = 'BLUE'; }
  if (label.includes("Today's Target Rep")) { accent = 'RED'; } 

  
  // Set width based on size prop
  let widthClass = 'w-full';
  if (size === 'half') widthClass = 'md:w-1/2';
  if (size === 'third') widthClass = 'md:w-1/3';

  return (
    <Card 
      {...rest} 
      icon={Icon} 
      title={value}
      onClick={onClick} 
      className={`${widthClass}`}
      accent={accent}
    >
      <div className="flex justify-between items-center -mt-1">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500">{label}</div>
        </div>
        {showTrend && (
            <div className={`text-sm font-semibold flex items-center gap-1`} style={{ color: trendColor }}>
                <span className={`p-1 rounded-full`} style={{ background: trend > 0 ? COLORS.TEAL + '1A' : COLORS.ORANGE + '1A' }}>
                <span className='block leading-none'><TrendIcon size={14} /></span>
                </span>
                <span className='font-bold'>{Math.abs(trend)}{label.includes("Reps") ? '%' : ''}</span>
            </div>
        )}
      </div>
      <CornerRightUp className="absolute top-8 right-8 text-gray-400" size={20} />
    </Card>
  );
};


function extractGeminiText(resp) {
  if (!resp) return '';
  if (typeof resp === 'string') return String(resp);
  if (resp.text) return String(resp.text);
  const c = resp.candidates?.[0];
  const parts = c?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map(p => p?.text).filter(Boolean).join('\n\n');
  }
  return '';
}

// NOTE: LOCAL_NUDGES HAS BEEN REMOVED. THE AI TIP MUST BE FETCHED OR USE A SIMPLE FALLBACK.
const SIMPLE_FALLBACK_TIP = 'Focus today on deep listening; practice paraphrasing your colleague\'s needs before offering solutions.';

// Global variable to cache the tip content and the last fetch time
const TIP_CACHE = {
  content: null,
  timestamp: 0,
  TTL: 4 * 60 * 60 * 1000, // TTL to 4 hours
  lastAITip: null,
};
const mdToHtml = async (md) => {
  let html = md;
  html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\> (.*)/gim, '<blockquote class="text-sm border-l-4 border-gray-400 pl-3 italic text-gray-700">$1</blockquote>');
  html = html.split('\n').map(line => line.trim()).filter(line => line.length > 0).map(line => {
    if (!line.startsWith('<')) return `<p class="text-sm text-gray-700">${line}</p>`;
    return line;
  }).join('');
  return html;
};

/* ---------------------------------------
   Dashboard (default export)
----------------------------------------*/
const DashboardScreen = () => {
  const {
    navigate, 
    user,
    pdpData: svcPdpData,
    planningData: svcPlanningData,
    commitmentData: svcCommitmentData,
    callSecureGeminiAPI,
    hasGeminiKey,
    LEADERSHIP_TIERS: svcLEADERSHIP_TIERS, // Loaded from service context now
    MOCK_ACTIVITY_DATA, // Loaded from service context now
  } = useAppServices();

  // CRITICAL FIX: Removed local mock data fallback. Data must come from the service.
  const pdpData = svcPdpData; 
  const commitmentData = svcCommitmentData;
  const planningData = svcPlanningData; 
  const TIER_MAP = svcLEADERSHIP_TIERS; 
  // NOTE: If svcPdpData, etc., are null during the first render, components must handle it gracefully.


  const displayedUserName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'Leader';
  }, [user?.name, user?.email]);
  
  const greeting = useMemo(() => (user?.firstLogin ? 'Welcome to The Arena,' : 'Welcome to The Arena,'), [user?.firstLogin]);

  // CRITICAL FIX 1: Create a stable navigation wrapper using the context navigate
  const safeNavigate = useCallback((screen, params) => {
    if (typeof navigate !== 'function') {
      console.error('CRITICAL ERROR: navigate() is not available from useAppServices.');
      return;
    }
    console.log('[Dashboard] NAVIGATION EXECUTED ->', screen, params || {});
    safeNavigate(screen, params); // Use the original navigate, which is now aliased in the hook
  }, [navigate]);
  
  const goalsCount = useMemo(() => pdpData?.currentMonth || 0, [pdpData]);
  const okrs = useMemo(() => planningData?.okrs || [], [planningData]);
  const commitsTotal = useMemo(() => commitmentData?.active_commitments?.length || 0, [commitmentData]);
  const commitsCompleted = useMemo(() => commitmentData?.active_commitments?.filter(c => c.status === 'Committed').length || 0, [commitmentData]);
  const commitsDue = commitsTotal - commitsCompleted; 
  
  // --- METRIC CALCULATIONS ---
  const longestHeldOKR = useMemo(() => {
    const longest = okrs.reduce((max, okr) => (okr.daysHeld > max.daysHeld ? okr : max), { daysHeld: 0, objective: 'N/A' });
    return { days: longest.daysHeld, objective: longest.objective };
  }, [okrs]);
  
  // MOCK_ACTIVITY_DATA is now loaded from service context (MOCK_ACTIVITY_DATA)
  const dailyTargetRep = useMemo(() => MOCK_ACTIVITY_DATA?.daily_target_rep || 'Define your top priority rep.', [MOCK_ACTIVITY_DATA]);
  const dailyChallengeRep = useMemo(() => MOCK_ACTIVITY_DATA?.daily_challenge_rep || 'Grab a quick win.', [MOCK_ACTIVITY_DATA]);
  const identityStatement = useMemo(() => MOCK_ACTIVITY_DATA?.identity_statement || 'I am a principled leader.', [MOCK_ACTIVITY_DATA]);
  const totalRepsCompleted = useMemo(() => MOCK_ACTIVITY_DATA?.total_reps_completed || 0, [MOCK_ACTIVITY_DATA]);
  const todayRepsCompleted = useMemo(() => commitsCompleted, [commitsCompleted]); 
  const totalCoachingLabs = useMemo(() => MOCK_ACTIVITY_DATA?.total_coaching_labs || 0, [MOCK_ACTIVITY_DATA]);
  const todayCoachingLabs = useMemo(() => MOCK_ACTIVITY_DATA?.today_coaching_labs || 0, [MOCK_ACTIVITY_DATA]);


  const perfectStreak = useMemo(() => calculateStreak(commitmentData?.history || []), [commitmentData?.history]);
  const dailyPercent = commitsTotal > 0 ? Math.round((commitsCompleted / commitsTotal) * 100) : 0;
  const monthlyPercent = goalsCount > 0 ? Math.round(((goalsCount - 1) % 4) * 25 + (commitsCompleted / commitsTotal || 0) * 25) : 0; 
  const careerPercent = Math.round((goalsCount / 24) * 100);

  const weakestTier = useMemo(() => {
    const ratings = pdpData?.assessment?.selfRatings;
    if (!ratings || !TIER_MAP) return { id: 'T3', name: 'Getting Started', rating: 5, color: 'bg-gray-100 text-gray-700', hex: COLORS.AMBER, icon: AlertTriangle };
    const sortedTiers = Object.entries(ratings).sort(([, a], [, b]) => a - b);
    const weakestId = sortedTiers[0]?.[0]; 
    if (!weakestId) return { id: 'T3', name: 'Getting Started', rating: 5, color: 'bg-gray-100 text-gray-700', hex: COLORS.AMBER, icon: AlertTriangle };
    const meta = TIER_MAP[weakestId];
    return {
      id: weakestId,
      name: meta?.name || 'Unknown',
      rating: ratings[weakestId],
      color: meta?.color || 'bg-red-100 text-red-700',
      hex: meta?.hex || COLORS.ORANGE,
      icon: AlertTriangle,
    };
  }, [pdpData, TIER_MAP, COLORS.AMBER, COLORS.ORANGE]);
  
  const tierMasteryProjection = useMemo(() => {
    const dailySuccessRate = 68; 
    return Math.round(180 - dailySuccessRate * 1.5);
  }, []);

  const [tipLoading, setTipLoading] = useState(false);
  const [tipContent, setTipContent] = useState(SIMPLE_FALLBACK_TIP); // Uses simple fallback now
  const [tipHtml, setTipHtml] = useState('');
  
useEffect(() => {
  (async () => {
    try {
      if (!tipHtml && tipContent) {
        setTipHtml(await mdToHtml(tipContent));
        TIP_CACHE.lastAITip = tipContent;
      }
    } catch {}
  })();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [tipContent]);


  const getInitialAITip = useCallback(async () => {
    if (!hasGeminiKey() || tipContent !== SIMPLE_FALLBACK_TIP) return;
    
    setTipLoading(true);
    try {
      const weakestSkill = weakestTier?.name || 'General Leadership';
      const prompt = `Give a concise, actionable leadership practice for the day (3 sentences max). Focus the tip explicitly on improving the skill: ${weakestSkill}. Tone: encouraging, strategic, direct.`;
      const payload = { contents: [{ parts: [{ text: prompt }] }] };
      const resp = await callSecureGeminiAPI(payload);
      const text = extractGeminiText(resp) || SIMPLE_FALLBACK_TIP;
      TIP_CACHE.lastAITip = text; 
      setTipContent(text);
      setTipHtml(await mdToHtml(text));
    } catch (e) {
      console.error('AI tip fetch error:', e);
      const fallbackText = SIMPLE_FALLBACK_TIP;
      TIP_CACHE.lastAITip = fallbackText;
      setTipContent(fallbackText);
      setTipHtml(await mdToHtml(`**Error**: AI connection failed. Using local tip. ${fallbackText}`));
    } finally {
      setTipLoading(false);
    }
  }, [weakestTier?.name, callSecureGeminiAPI, hasGeminiKey, tipContent]);

  const nextNudge = useCallback(async () => {
    let nextTip = '';
    if (tipLoading) return;
    
    // NOTE: Since LOCAL_NUDGES was removed, we only rely on the last AI tip as a base
    const availableNudges = [TIP_CACHE.lastAITip || SIMPLE_FALLBACK_TIP]; 
    
    let attempts = 0;
    do {
      const newIndex = Math.floor(Math.random() * availableNudges.length);
      nextTip = availableNudges[newIndex];
      attempts++;
    } while (nextTip === tipContent && attempts < 5); 
    
    // Since there is only one non-AI tip now, we fall back to the initial fetcher to get a new one
    if (nextTip === tipContent && !hasGeminiKey()) {
        nextTip = SIMPLE_FALLBACK_TIP; // Fallback loop fails without more hardcoded options
    } else if (nextTip === tipContent && hasGeminiKey()) {
        getInitialAITip(); // Rerun the AI fetcher for a new tip
        return; 
    }
    
    setTipContent(nextTip);
    setTipHtml(await mdToHtml(nextTip));
  }, [tipContent, tipLoading, hasGeminiKey, getInitialAITip]);

  // CRITICAL FIX 2: Call getInitialAITip when AI dependencies are ready (hasGeminiKey)
  useEffect(() => { 
    if (hasGeminiKey() && weakestTier) { // Wait for core data to load
        getInitialAITip(); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weakestTier?.name, hasGeminiKey]); // Call getInitialAITip when AI dependencies are ready (hasGeminiKey)


  /* =========================================================
     SIMPLIFIED RENDER: FOCUS ON DAILY ACTIONS & SCORECARD
  ========================================================= */

  return (
    <div className={`p-6 space-y-4 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}> 
      {/* 1. Header with enhanced Personalization */}
      <div className={`border-b border-gray-200 pb-5 bg-[${COLORS.OFF_WHITE}] p-6 -mx-6 -mt-6 mb-4 rounded-b-xl shadow-md`}>
        <h1 className={`text-4xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3`}>
          <Home size={32} style={{ color: COLORS.TEAL }} /> The Arena Dashboard
        </h1>
        <p className="text-gray-600 text-base mt-2">
          {greeting} <span className={`font-semibold text-[${COLORS.NAVY}]`}>{displayedUserName}</span>. Your focus is **{weakestTier?.name || 'Getting Started'}**—consistency over intensity.
        </p>
      </div>
      
      {/* --- 2. THE REP TRACKER LAUNCHPAD (HIGH PRIORITY) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"> 
        
        {/* HEALTH SCORE AND NUDGE COLUMN (lg:col-span-1) */}
        <div className="lg:col-span-1 space-y-4 order-1 lg:order-2"> {/* ORDER SWAP: Health & Nudge on right */}
             <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3">
                <Activity size={24} className='text-[#47A88D]'/> Focus Nudge
            </h2>
            
            {/* Strategic Nudge / AI Reflection Coach (Moved up) */}
            <div className="min-h-full">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl relative group min-h-full flex flex-col justify-between" style={{ background: `${weakestTier?.hex || COLORS.TEAL}1A`, opacity: 0.9 }}>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h2 className={`text-xl font-bold flex items-center gap-2`} style={{color: weakestTier?.hex || COLORS.NAVY}}>
                            <Lightbulb size={20} className={`text-white p-1 rounded-full`} style={{backgroundColor: weakestTier?.hex || COLORS.TEAL}}/> 
                            Strategic Nudge
                        </h2>
                    </div>
                    <div className={`p-4 rounded-xl bg-gray-50 border border-gray-100 mt-3 shadow-inner flex-1`}>
                        <div className="prose prose-sm max-w-none relative z-10">
                            {tipHtml
                                ? <div dangerouslySetInnerHTML={{ __html: tipHtml }} />
                                : <p className="text-gray-600 text-sm">Tap Next Rep to get a fresh, powerful focus point from your AI Coach.</p>}
                        </div>
                    </div>
                     <button
                        className="rounded-xl mt-4 px-3 py-2 text-sm font-semibold bg-[#002E47] text-white hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                        onClick={nextNudge}
                        disabled={tipLoading}
                        type="button"
                    >
                        {tipLoading ? <Loader size={16} className='animate-spin text-white' /> : <Sparkles size={16} />}
                        Next Coaching Nudge
                    </button>
                </div>
            </div>
        </div>

        {/* LAUNCHPAD BUTTONS (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-3 order-2 lg:order-1"> {/* ORDER SWAP: Launchpad on left */}
            <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3">
                <Zap size={24} className='text-[#E04E1B]'/> Launchpad: Today's Focus
            </h2>
            
            {/* New Simplified Rep/Identity Info Card - Features 1, 2, 8 */}
            <Card title="Today's Strategic Focus" icon={Target} accent='NAVY' className="border-4 border-[#002E47]/10 bg-white/95">
                <div className='grid md:grid-cols-2 gap-4'>
                    <div>
                        <p className='text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2'>
                            <Flag className='w-4 h-4 text-red-500'/> Target Rep (Clarity of Behavior):
                        </p>
                        <p className='text-md font-bold text-[#E04E1B]'>
                            {dailyTargetRep}
                        </p>
                    </div>
                    <div>
                         <p className='text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2'>
                            <User className='w-4 h-4 text-gray-500'/> Identity Anchor (Emotional Relevance):
                        </p>
                        <p className='text-md italic text-[#002E47]'>
                            "{identityStatement.substring(0, 60) + '...'}"
                        </p>
                    </div>
                </div>
            </Card>
            
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                 {/* PRIMARY ACTION 1: Daily Practice Scorecard */}
                <ThreeDButton
                    onClick={() => safeNavigate('daily-practice')} 
                    color={COLORS.TEAL}
                    accentColor={COLORS.NAVY}
                    className="h-24 flex-col px-3 py-2 text-white" 
                >
                    <ClockIcon className='w-6 h-6 mb-1'/> 
                    <span className='text-lg font-extrabold'>Daily Practice Scorecard</span>
                    <span className='text-xs font-light mt-1'>Reps: {todayRepsCompleted}/{commitsTotal}</span>
                </ThreeDButton>

                {/* PRIMARY ACTION 2: 2-Min Micro-Action Start (Frictionless Rep) - Feature 3 */}
                <ThreeDButton 
                    onClick={() => safeNavigate('daily-practice', { quickLog: true, source: 'dashboard' })} 
                    color={COLORS.BLUE}
                    accentColor={COLORS.NAVY}
                    className="h-24 flex-col px-3 py-2 text-white"
                >
                    <Zap className='w-6 h-6 mb-1'/> 
                    <span className='text-lg font-extrabold'>2-Min Start (Momentum Rep)</span>
                    <span className='text-xs font-light mt-1'>Grab a quick win to build streak</span>
                </ThreeDButton>
                
                 {/* PRIMARY ACTION 3: Development Roadmap */}
                <ThreeDButton
                    onClick={() => safeNavigate('prof-dev-plan')} 
                    color={COLORS.ORANGE}
                    accentColor={COLORS.NAVY}
                    className="h-24 flex-col px-3 py-2 text-white" 
                >
                    <Briefcase className='w-6 h-6 mb-1'/> 
                    <span className='text-lg font-extrabold'>24-Month Roadmap Check</span>
                    <span className='text-xs font-light mt-1'>Current Focus: {weakestTier?.name}</span>
                </ThreeDButton>
            </div>


        </div>
      </div>
      
      {/* --- 3. METRICS SCORECARD (SECONDARY CONTENT) --- */}
      <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3 pt-6 border-t border-gray-200">
          <BarChart3 size={24} className='text-[#47A88D]'/> Performance Scorecard
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Progress Snapshot (The Scorecard: lg:col-span-4) - Span full width now */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="space-y-6">
            {/* PILLAR: CONTENT */}
            <div className='p-6 rounded-2xl border-4 border-[#47A88D]/20 bg-[#F7FCFF]'>
                <h3 className='text-xl font-extrabold text-[#47A88D] mb-4 flex items-center gap-2'>
                    <BookOpen size={20}/> PILLAR: Content & Discipline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Metric: Daily Reps Completed Today */}
                    <StatCard
                        icon={CheckCircle}
                        label="Daily Reps Completed Today"
                        value={`${todayRepsCompleted} / ${commitsTotal}`}
                        onClick={() => safeNavigate('daily-practice')}
                        trend={todayRepsCompleted} 
                        colorHex={COLORS.ORANGE}
                    />
                    {/* Metric: Total Reps Completed (Cumulative) */}
                    <StatCard
                        icon={ChevronsRight}
                        label="Total Reps Completed (All Time)"
                        value={`${totalRepsCompleted}`}
                        onClick={() => safeNavigate('daily-practice')}
                        trend={1}
                        colorHex={COLORS.TEAL}
                    />
                    {/* Metric: Current Streak - Feature 4 */}
                    <StatCard
                        icon={Star}
                        label="Current Perfect Score Streak"
                        value={`${perfectStreak} Days`}
                        onClick={() => safeNavigate('daily-practice')}
                        trend={perfectStreak >= 3 ? 5 : 0} 
                        colorHex={COLORS.GREEN}
                    />
                     {/* Metric: Weakest Tier Focus (Roadmap context) */}
                     <StatCard
                        icon={Target}
                        label="Weakest Tier Focus"
                        value={`${weakestTier?.name || 'N/A'}`}
                        onClick={() => safeNavigate('prof-dev-plan')}
                        trend={0} 
                        colorHex={COLORS.AMBER}
                    />
                </div>
            </div>

            {/* PILLAR: COACHING */}
            <div className='p-6 rounded-2xl border-4 border-[#7C3AED]/20 bg-[#F7FCFF]'>
                <h3 className='text-xl font-extrabold text-[#7C3AED] mb-4 flex items-center gap-2'>
                    <Mic size={20}/> PILLAR: Coaching & Practice
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Metric: Labs Completed Today (Daily Coaching) */}
                    <StatCard
                        icon={Send}
                        label="Labs Completed Today"
                        value={`${todayCoachingLabs}`}
                        onClick={() => safeNavigate('coaching-lab')}
                        trend={todayCoachingLabs} 
                        colorHex={COLORS.BLUE}
                    />
                    {/* Metric: Total Coaching Labs (Cumulative) */}
                    <StatCard
                        icon={Mic}
                        label="Total Coaching Labs Performed"
                        value={`${totalCoachingLabs}`}
                        onClick={() => safeNavigate('coaching-lab')}
                        trend={1} 
                        colorHex={COLORS.PURPLE}
                    />
                    {/* Metric: Daily Reps Completion Rate (Context) */}
                    <StatCard
                        icon={TrendingUp}
                        label="Daily Completion Rate"
                        value={`${dailyPercent}%`}
                        onClick={() => safeNavigate('daily-practice')}
                        trend={dailyPercent > 50 ? 5 : -5} 
                        colorHex={COLORS.ORANGE}
                    />
                     {/* Metric: Placeholder for AI Reflection Coach summary */}
                    <StatCard
                        icon={Lightbulb}
                        label="AI Reflection Summary"
                        value={`Ready`}
                        onClick={() => safeNavigate('coaching-lab')}
                        trend={0} 
                        colorHex={COLORS.NAVY}
                    />
                </div>
            </div>
            
            {/* PILLAR: COMMUNITY */}
            <div className='p-6 rounded-2xl border-4 border-[#002E47]/20 bg-[#F7FCFF]'>
                <h3 className='text-xl font-extrabold text-[#002E47] mb-4 flex items-center gap-2'>
                    <Dumbbell size={20}/> PILLAR: Community & Roadmap
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Metric: Roadmap Months Remaining */}
                    <StatCard
                        icon={Briefcase}
                        label="Roadmap Months Remaining"
                        value={`${24 - goalsCount}`}
                        onClick={() => safeNavigate('prof-dev-plan')}
                        trend={24 - goalsCount > 0 ? -4 : 0} 
                        colorHex={COLORS.NAVY}
                    />
                    {/* Metric: Social Accountability Nudge - Feature 5 */}
                     <StatCard
                        icon={Users}
                        label="Accountability Pod"
                        value={`2 New Shares`}
                        onClick={() => safeNavigate('community')}
                        trend={10} 
                        colorHex={COLORS.TEAL}
                    />
                    {/* Metric: Longest Held OKR (Context) */}
                    <StatCard
                        icon={Archive}
                        label="Longest-Held OKR (Days)"
                        value={`${longestHeldOKR.days} Days`}
                        onClick={() => safeNavigate('planning-hub')}
                        trend={5} 
                        colorHex={COLORS.BLUE}
                    />
                     {/* Metric: Placeholder for a Community Gamification Metric (Streak Coin) */}
                    <StatCard
                        icon={Sparkles}
                        label="Rep Streak Coins Earned"
                        value={`1 Coin`}
                        onClick={() => safeNavigate('profile')}
                        trend={3} 
                        colorHex={COLORS.PURPLE}
                    />
                </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default DashboardScreen;