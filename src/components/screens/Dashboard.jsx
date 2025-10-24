// src/components/screens/Dashboard.jsx 
import React, { useMemo, useState, useEffect, useCallback } from 'react';
// CRITICAL FIX: Use the actual service hook from the expected path
import { useAppServices } from '../../services/useAppServices.jsx'; 

// --- MOCK IMPORTS for self-contained file (Ensuring local definition) ---
const LEADERSHIP_TIERS = {
    'T1': { id: 'T1', name: 'Self-Awareness', icon: 'Target', color: 'bg-blue-100 text-blue-700', hex: '#2563EB' },
    'T2': { id: 'T2', name: 'Operational Excellence', icon: 'Mic', color: 'bg-cyan-100 text-cyan-700', hex: '#06B6D4' },
    'T3': { id: 'T3', name: 'Strategic Execution', icon: 'Briefcase', color: 'bg-green-100 text-green-700', hex: '#10B981' },
    'T4': { id: 'T4', name: 'People Development', icon: 'Users', color: 'bg-yellow-100 text-yellow-700', hex: '#F5A800' },
    'T5': { id: 'T5', name: 'Visionary Leadership', icon: 'TrendingUp', color: 'bg-red-100 text-red-700', hex: '#E04E1B' },
};

const MOCK_PDP_DATA = {
    currentMonth: 4,
    assessment: { selfRatings: { T1: 8, T2: 3, T3: 6, T4: 7, T5: 5 } }, 
    plan: [{month:'Current', theme: 'Mastering Strategy', requiredContent: []}]
};
const MOCK_COMMITMENT_DATA = { 
    active_commitments: [
        { id: 1, status: 'Pending', linkedTier: 'T2' }, 
        { id: 2, status: 'Committed', linkedTier: 'T5' },
        { id: 3, status: 'Pending', linkedTier: 'T2' },
        { id: 4, status: 'Committed', linkedTier: 'T3' },
    ],
    // Mock history to calculate a streak (3 days, since last one is 4/5)
    history: [
        { date: '2025-10-14', score: '3/3', reflection: 'Perfect day!' },
        { date: '2025-10-15', score: '3/3', reflection: 'Perfect day!' },
        { date: '2025-10-16', score: '3/3', reflection: 'Perfect day!' },
        { date: '2025-10-17', score: '4/5', reflection: 'Missed one.' }, 
    ],
    resilience_log: { '2025-10-19': { energy: 4, focus: 7 } }
};

const MOCK_PLANNING_DATA = {
    okrs: [
        { id: 1, objective: 'Improve Execution Quality', daysHeld: 45 },
        { id: 2, objective: 'Expand Market Share', daysHeld: 15 },
    ],
    last_premortem_decision: new Date('2025-10-10').toISOString(),
};

// --- NEW MOCK DATA FOR REFINEMENT (Rep Tracker Integration) ---
const MOCK_ACTIVITY_DATA = {
    daily_target_rep: "Give one reinforcing feedback statement to a direct report.",
    daily_challenge_rep: "Send one thank-you Slack message right now.", // For 2-Minute Challenge
    total_reps_completed: 452,
    total_coaching_labs: 18,
    today_coaching_labs: 2,
    identity_statement: "I am the kind of leader who coaches in the moment and owns accountability.",
};

// Local Nudges (Used for instant, non-API refresh)
const LOCAL_NUDGES = [
    'Focus today on deep listening; practice paraphrasing your colleague\'s needs before offering solutions.',
    'Before starting a task, ask: "Will this activity move us closer to our one-year vision?" If not, delegate it.',
    'Schedule 30 minutes of "maker time" today—no meetings, no email. Protect it fiercely.',
    'Use the SBI framework for your next piece of critical feedback (Situation, Behavior, Impact).',
    'Review your personal calendar: Is the ratio of strategic to operational work 3:1 or better?',
];

// Streak calculation utility (Pulled from DailyPractice.jsx logic)
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

// --- END MOCK IMPORTS ---


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

/* ---------------------------------------
   UI Components (Standardized)
----------------------------------------*/
// Standard Button (kept for legacy/non-3D use)
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

// 3D-inspired Button
const ThreeDButton = ({ children, onClick, color = COLORS.TEAL, accentColor = COLORS.NAVY, className = '', ...rest }) => {
  const defaultColor = color;
  const defaultAccent = accentColor; 
  
  // FIX: Simplified style to rely on CSS :active / :hover in a real environment
  const buttonStyle = {
    background: defaultColor, 
    // Simplified shadow/z-depth for the static state
    boxShadow: `0 4px 0px 0px ${defaultAccent}, 0 6px 12px rgba(0,0,0,0.2)`,
    transition: 'all 0.1s ease-out',
    transform: 'translateY(0px)',
  };

  return (
    <button
      {...rest}
      onClick={onClick} // CRITICAL: This is now the ONLY trigger for navigation
      type="button"
      className={`${className} flex items-center justify-center p-3 rounded-xl font-extrabold text-white cursor-pointer transition-all duration-100`}
      style={buttonStyle}
      // Removed: onMouseEnter, onMouseLeave, onMouseDown, onMouseUp
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

const StatCard = ({ icon: Icon, label, value, onClick, trend = 0, colorHex, size = 'full' }) => {
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
  if (label.includes("Today's Target Rep")) { accent = 'RED'; } // Highlight new feature

  
  // Set width based on size prop
  let widthClass = 'w-full';
  if (size === 'half') widthClass = 'md:w-1/2';
  if (size === 'third') widthClass = 'md:w-1/3';

  return (
    <Card 
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


const ProgressRings = ({ dailyPercent, monthlyPercent, careerPercent, tierHex, commitsDue }) => {
  const dailyColor = commitsDue > 0 ? COLORS.ORANGE : COLORS.TEAL;
  const viewBoxSize = 36;
  const radius = 15.9155;
  // Simplified calculation for Leadership Health Score
  const healthScore = Math.round(
    (dailyPercent * 0.4) + 
    (monthlyPercent * 0.3) + 
    (careerPercent * 0.3)
  );

  return (
    <Card 
      title="Leadership Health Score" 
      icon={Activity} 
      accent="NAVY" 
      className="shadow-2xl bg-[#002E47]/10 border-4 border-[#002E47]/20"
    >
      <div className="flex items-center space-x-4">
        {/* Gauge for Health Score */}
        <div className="relative w-28 h-28 flex-shrink-0">
          <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full transform -rotate-90">
            <circle className="text-gray-300" strokeWidth="3" stroke="currentColor" fill="transparent" r={radius} cx="18" cy="18" />
            <circle
              className="transition-all duration-1000"
              strokeWidth="3"
              stroke={healthScore < 70 ? COLORS.ORANGE : COLORS.TEAL}
              fill="transparent"
              r={radius}
              cx="18"
              cy="18"
              style={{
                strokeDasharray: `${radius * 2 * Math.PI}`,
                strokeDashoffset: radius * 2 * Math.PI * (1 - healthScore / 100),
              }}
            />
          </svg>
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
            <span className={`text-3xl font-extrabold`} style={{color: healthScore < 70 ? COLORS.ORANGE : COLORS.TEAL}}>{healthScore}%</span>
          </div>
        </div>
        
        {/* Ring Descriptions */}
        <div className="flex-1 space-y-2">
          <p className='text-sm font-bold text-[#002E47]'>Composite Index Breakdown:</p>
          <div className='text-xs text-gray-700 font-medium space-y-1'>
            <div className='flex items-center'><span className={`w-2 h-2 rounded-full mr-2`} style={{backgroundColor: dailyColor}}/> **Daily Discipline:** {dailyPercent}%</div>
            <div className='flex items-center'><span className={`w-2 h-2 rounded-full mr-2`} style={{backgroundColor: tierHex}}/> **Monthly Learning:** {monthlyPercent}%</div>
            <div className='flex items-center'><span className={`w-2 h-2 rounded-full mr-2`} style={{backgroundColor: COLORS.NAVY}}/> **Career Roadmap:** {careerPercent}%</div>
          </div>
        </div>
      </div>
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
    navigate, // CRITICAL: This is the navigate function from App.jsx
    user,
    pdpData: svcPdpData,
    planningData: svcPlanningData,
    commitmentData: svcCommitmentData,
    hasPendingDailyPractice,
    callSecureGeminiAPI,
    hasGeminiKey,
    // CRITICAL FIX: Ensure we retrieve LEADERSHIP_TIERS from the context
    LEADERSHIP_TIERS: svcLEADERSHIP_TIERS,
  } = useAppServices();

  const pdpData = svcPdpData || MOCK_PDP_DATA;
  const commitmentData = svcCommitmentData || MOCK_COMMITMENT_DATA;
  const planningData = svcPlanningData || MOCK_PLANNING_DATA; 
  // CRITICAL FIX: Use the data from services if available, otherwise fallback to local mock
  const TIER_MAP = svcLEADERSHIP_TIERS || LEADERSHIP_TIERS; 

  const displayedUserName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return 'Leader';
  }, [user?.name, user?.email]);
  
  // UPDATED GREETING: Focuses on "The Arena" and "Fitness Approach"
  const greeting = useMemo(() => (user?.firstLogin ? 'Welcome to The Arena,' : 'Welcome to The Arena,'), [user?.firstLogin]);

  // CRITICAL FIX 1: Create a stable navigation wrapper using the context navigate
  const safeNavigate = useCallback((screen, params) => {
    if (typeof navigate !== 'function') {
      console.error('CRITICAL ERROR: navigate() is not available from useAppServices.');
      return;
    }
    console.log('[Dashboard] NAVIGATION EXECUTED ->', screen, params || {});
    navigate(screen, params);
  }, [navigate]);
  
  const goalsCount = useMemo(() => pdpData?.currentMonth || 0, [pdpData]);
  const okrs = useMemo(() => planningData?.okrs || MOCK_PLANNING_DATA.okrs, [planningData]);
  const commitsTotal = useMemo(() => commitmentData?.active_commitments?.length || 0, [commitmentData]);
  const commitsCompleted = useMemo(() => commitmentData?.active_commitments?.filter(c => c.status === 'Committed').length || 0, [commitmentData]);
  const commitsDue = commitsTotal - commitsCompleted; 
  
  // --- RE-ADDED MISSING CALCULATION ---
  const longestHeldOKR = useMemo(() => {
    const longest = okrs.reduce((max, okr) => (okr.daysHeld > max.daysHeld ? okr : max), { daysHeld: 0, objective: 'N/A' });
    return { days: longest.daysHeld, objective: longest.objective };
  }, [okrs]);
  // --- END RE-ADDED CALCULATION ---
  
  // --- NEW METRIC CALCULATIONS ---
  const dailyTargetRep = useMemo(() => MOCK_ACTIVITY_DATA.daily_target_rep, []);
  const dailyChallengeRep = useMemo(() => MOCK_ACTIVITY_DATA.daily_challenge_rep, []);
  const identityStatement = useMemo(() => MOCK_ACTIVITY_DATA.identity_statement, []);
  const totalRepsCompleted = useMemo(() => MOCK_ACTIVITY_DATA.total_reps_completed, []);
  const todayRepsCompleted = useMemo(() => commitsCompleted, [commitsCompleted]); 
  const totalCoachingLabs = useMemo(() => MOCK_ACTIVITY_DATA.total_coaching_labs, []);
  const todayCoachingLabs = useMemo(() => MOCK_ACTIVITY_DATA.today_coaching_labs, []);


  const perfectStreak = useMemo(() => calculateStreak(commitmentData?.history || []), [commitmentData?.history]);
  const dailyPercent = commitsTotal > 0 ? Math.round((commitsCompleted / commitsTotal) * 100) : 0;
  // Simplified mock calculation for monthly percent (re-used for Health Score)
  const monthlyPercent = goalsCount > 0 ? Math.round(((goalsCount - 1) % 4) * 25 + (commitsCompleted / commitsTotal || 0) * 25) : 0; 
  const careerPercent = Math.round((goalsCount / 24) * 100);

  const weakestTier = useMemo(() => {
    const ratings = pdpData?.assessment?.selfRatings;
    if (!ratings) return null;
    const sortedTiers = Object.entries(ratings).sort(([, a], [, b]) => a - b);
    const weakestId = sortedTiers[0]?.[0]; // Ensure safe access
    if (!weakestId) return null;
    const meta = TIER_MAP[weakestId];
    return {
      id: weakestId,
      name: meta?.name || 'Unknown',
      rating: ratings[weakestId],
      color: meta?.color || 'bg-red-100 text-red-700',
      hex: meta?.hex || COLORS.ORANGE,
      icon: AlertTriangle,
    };
  }, [pdpData, TIER_MAP]);
  
  const tierMasteryProjection = useMemo(() => {
    const dailySuccessRate = 68; 
    return Math.round(180 - dailySuccessRate * 1.5);
  }, []);

  const [tipLoading, setTipLoading] = useState(false);
  const [tipContent, setTipContent] = useState(LOCAL_NUDGES[0]); 
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
    if (!hasGeminiKey() || tipContent !== LOCAL_NUDGES[0]) return;
    
    setTipLoading(true);
    try {
      const weakestSkill = weakestTier?.name || 'General Leadership';
      const prompt = `Give a concise, actionable leadership practice for the day (3 sentences max). Focus the tip explicitly on improving the skill: ${weakestSkill}. Tone: encouraging, strategic, direct.`;
      const payload = { contents: [{ parts: [{ text: prompt }] }] };
      const resp = await callSecureGeminiAPI(payload);
      const text = extractGeminiText(resp) || LOCAL_NUDGES[0];
      TIP_CACHE.lastAITip = text; 
      setTipContent(text);
      setTipHtml(await mdToHtml(text));
    } catch (e) {
      console.error('AI tip fetch error:', e);
      const fallbackText = LOCAL_NUDGES[0];
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
    const availableNudges = TIP_CACHE.lastAITip ? [TIP_CACHE.lastAITip, ...LOCAL_NUDGES] : LOCAL_NUDGES;
    let attempts = 0;
    do {
      const newIndex = Math.floor(Math.random() * availableNudges.length);
      nextTip = availableNudges[newIndex];
      attempts++;
    } while (nextTip === tipContent && attempts < 5); 
    setTipContent(nextTip);
    setTipHtml(await mdToHtml(nextTip));
  }, [tipContent, tipLoading]);

  // CRITICAL FIX 2: Call getInitialAITip when AI dependencies are ready (hasGeminiKey)
  useEffect(() => { 
    if (hasGeminiKey() && weakestTier) { // Wait for core data to load
        getInitialAITip(); 
    }
  }, [getInitialAITip, hasGeminiKey, weakestTier]);


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
      {/* Reduced outer gap from space-y-8 to space-y-4 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6"> 
        
        {/* DAILY REP FOCUS CARD (lg:col-span-2) - Increased span to make it the primary focus */}
        <div className="lg:col-span-2 space-y-3"> 
            <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3">
                <Flag size={24} className='text-[#E04E1B]'/> Today's Mission: The Single Rep
            </h2>
            {/* CARD: Combines Mission (1), Emotional Relevance (2), and Frictionless Start (3) */}
            <Card title={dailyTargetRep} icon={Flag} accent='RED' className="border-4 border-[#E04E1B]/50 shadow-2xl h-full">
                <p className='text-sm font-semibold text-gray-700 mb-3'>
                    **Goal:** You always know the single skill you’re training today. **Rep Status:** {todayRepsCompleted} / {commitsTotal} completed.
                </p>
                <div className='p-3 rounded-lg border border-gray-200 bg-white shadow-inner mb-4'>
                    <p className='text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1'>
                        <User className='w-3 h-3 text-gray-500'/> Your Identity Anchor (Why It Matters):
                    </p>
                    <p className='text-sm italic text-gray-800 font-medium'>
                        "{identityStatement.substring(0, 70) + '...'}"
                    </p>
                </div>
                
                <div className='flex space-x-4 mt-auto pt-4 border-t border-gray-100'>
                    <Button 
                        onClick={() => safeNavigate('daily-practice')} 
                        color={COLORS.TEAL}
                        className="flex-1 px-4 py-3 text-lg font-extrabold"
                    >
                        <ClockIcon className='w-5 h-5 mr-2'/> Go to Rep Scorecard
                    </Button>
                    {/* Frictionless Start/2-Minute Challenge Button */}
                    <Button 
                        onClick={() => safeNavigate('daily-practice', { initialGoal: 'Frictionless Start Goal' })} 
                        color={COLORS.BLUE}
                        className="w-1/3 px-3 py-2 text-sm bg-[#2563EB] hover:bg-[#1E40AF]"
                    >
                        <Zap className='w-4 h-4 mr-2'/> 2-Min Start
                    </Button>
                </div>
            </Card>
        </div>

        {/* HEALTH SCORE AND NUDGE COLUMN (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-3"> 
             <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3">
                <Activity size={24} className='text-[#47A88D]'/> Health & Focus
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Health Score Ring */}
                <ProgressRings
                    dailyPercent={dailyPercent}
                    monthlyPercent={monthlyPercent}
                    careerPercent={careerPercent}
                    tierHex={weakestTier?.hex || COLORS.TEAL}
                    commitsDue={commitsDue}
                />
                
                {/* Strategic Nudge (Fits neatly beside the ring) */}
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
                    {/* Metric: Current Streak */}
                    <StatCard
                        icon={Star}
                        label="Current Perfect Score Streak"
                        value={`${perfectStreak} Days`}
                        onClick={() => safeNavigate('daily-practice')}
                        trend={perfectStreak >= 3 ? 5 : 0} 
                        colorHex={COLORS.GREEN}
                    />
                     {/* Metric: Weakest Tier Focus (Roadmap context) - Moved here for alignment */}
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
                    {/* Metric: Social Accountability Nudge */}
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
                     {/* Metric: Placeholder for a Community Gamification Metric */}
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