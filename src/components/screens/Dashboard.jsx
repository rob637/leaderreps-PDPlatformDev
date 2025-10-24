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
  Film, // NEW ICON
  Dumbbell
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
  // and removed manual JS event handlers that could be swallowing or delaying the click event.
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

const StatCard = ({ icon: Icon, label, value, onClick, trend = 0, colorHex }) => {
  const TrendIcon = trend > 0 ? TrendingUp : TrendingDown;
  const trendColor = trend > 0 ? COLORS.TEAL : trend < 0 ? COLORS.ORANGE : COLORS.MUTED;
  const isPrimary = label === "Daily Commitments Due"; 
  let accent = 'NAVY';
  if (label === "Daily Commitments Due") { accent = 'TEAL'; }
  if (label === "Weakest PDP Tier Score") { accent = 'ORANGE'; }
  if (label === "Current Perfect Score Streak") { accent = 'GREEN'; }
  if (label === "Last Pre-Mortem Audit Date") { accent = 'PURPLE'; }

  return (
    <Card 
      icon={Icon} 
      title={label === "Development Plan Progress" && value === '0 / 24 Months' ? 'Start Now' : value}
      onClick={onClick} 
      className={`w-full ${isPrimary ? 'shadow-2xl' : ''}`}
      accent={accent}
    >
      <div className="flex justify-between items-center -mt-1">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500">{label}</div>
        </div>
        <div className={`text-sm font-semibold flex items-center gap-1`} style={{ color: trendColor }}>
          {trend !== 0 && (
            <span className={`p-1 rounded-full`} style={{ background: trend > 0 ? COLORS.TEAL + '1A' : COLORS.ORANGE + '1A' }}>
              <span className='block leading-none'><TrendIcon size={14} /></span>
            </span>
          )}
          {trend !== 0 ? <span className='font-bold'>{Math.abs(trend)}%</span> : ''}
        </div>
      </div>
      <CornerRightUp className="absolute top-8 right-8 text-gray-400" size={20} />
    </Card>
  );
};


const ProgressRings = ({ dailyPercent, monthlyPercent, careerPercent, tierHex, commitsDue }) => {
  const dailyColor = commitsDue > 0 ? COLORS.ORANGE : COLORS.TEAL;
  const viewBoxSize = 36;
  const radius = 15.9155;
  const healthScore = Math.round(
    (monthlyPercent * 0.4) + 
    (careerPercent * 0.3) + 
    ((100 - commitsDue * 5) * 0.3)
  );

  return (
    <Card 
      title="Leadership Health Score" 
      icon={Activity} 
      accent="NAVY" 
      className="lg:col-span-1 shadow-2xl bg-[#002E47]/10 border-4 border-[#002E47]/20"
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
          <p className='text-sm font-bold text-[#002E47]'>Composite Index</p>
          <div className='text-xs text-gray-700 font-medium space-y-1'>
            <div className='flex items-center'><span className={`w-2 h-2 rounded-full mr-2`} style={{backgroundColor: dailyColor}}/> **Daily Discipline:** {dailyPercent}%</div>
            <div className='flex items-center'><span className={`w-2 h-2 rounded-full mr-2`} style={{backgroundColor: tierHex}}/> **Monthly Learning:** {monthlyPercent}%</div>
            <div className='flex items-center'><span className={`w-2 h-2 rounded-full mr-2`} style={{backgroundColor: COLORS.NAVY}}/> **Career Roadmap:** {careerPercent}%</div>
          </div>
        </div>
      </div>
      
      <p className='text-xs text-gray-500 mt-3'>*Composite score of discipline, learning, and roadmap completion.</p>
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
  
  const perfectStreak = useMemo(() => calculateStreak(commitmentData?.history || []), [commitmentData?.history]);
  const longestHeldOKR = useMemo(() => {
    const longest = okrs.reduce((max, okr) => (okr.daysHeld > max.daysHeld ? okr : max), { daysHeld: 0, objective: 'N/A' });
    return { days: longest.daysHeld, objective: longest.objective };
  }, [okrs]);
  const lastPreMortemDate = useMemo(() => {
    const dateString = planningData?.last_premortem_decision || '2025-01-01';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [planningData?.last_premortem_decision]);
  
  const dailyPercent = commitsTotal > 0 ? Math.round((commitsCompleted / commitsTotal) * 100) : 0;
  // Simplified mock calculation for monthly percent
  const monthlyPercent = goalsCount > 0 ? Math.round(((goalsCount - 1) % 4) * 25 + (commitsCompleted / commitsTotal || 0) * 25) : 0; 
  const careerPercent = Math.round((goalsCount / 24) * 100);

  const weakestTier = useMemo(() => {
    const ratings = pdpData?.assessment?.selfRatings;
    if (!ratings) return null;
    const sortedTiers = Object.entries(ratings).sort(([, a], [, b]) => a - b);
    const weakestEntry = sortedTiers[0];
    const weakestId = weakestEntry?.[0];
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
}, []);


  const getInitialAITip = useCallback(async () => {
    // Only run if the AI key is ready and tip hasn't been set yet
    if (!hasGeminiKey() || tipContent !== 'Tap "Next Nudge" for your first strategic focus point.') return;
    
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
  }, [weakestTier?.name, callSecureGeminiAPI, hasGeminiKey, tipContent]); // Added tipContent to re-run if state changes.

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

  return (
    <div className={`p-6 space-y-8 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
      {/* Header with enhanced Personalization */}
      <div className={`border-b border-gray-200 pb-5 bg-[${COLORS.OFF_WHITE}] p-6 -mx-6 -mt-6 mb-8 rounded-b-xl shadow-md`}>
        <h1 className={`text-4xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3`}>
          <Home size={32} style={{ color: COLORS.TEAL }} /> The Arena Dashboard
        </h1>
        <p className="text-gray-600 text-base mt-2">
          {greeting} <span className={`font-semibold text-[${COLORS.NAVY}]`}>{displayedUserName}</span>. Your current practice is **{weakestTier?.name || 'Getting Started'}**—focus on consistency over intensity.
        </p>
      </div>
      
      {/* --- DEDICATED PDP ROADMAP HIGHLIGHT (FIX 1: HEADER SIZE & BORDER) --- */}
      <div className="rounded-3xl border-4 border-[#002E47] bg-[#F7FCFF] p-8 shadow-2xl relative">
        <h2 className="text-3xl font-extrabold text-[#002E47] mb-6 border-b-2 pb-4 border-gray-300 flex items-center gap-3">
          <Dumbbell size={28} className="text-[#7C3AED]" /> Your 24-Month Training Roadmap
        </h2>

        <p className="text-sm text-gray-700 mb-4">
          Your **Development Roadmap** applies the principle of **Progressive Overload** to close your skill gaps. Track your progress below and hit your monthly learning targets to achieve mastery.
        </p>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-[#002E47]/5 border border-gray-200">
            <p className="text-xs font-medium text-gray-600">Training Month</p>
            <p className="text-xl font-extrabold text-[#002E47] mt-1">{goalsCount} / 24</p>
          </div>
          <div className="p-3 rounded-xl bg-[#002E47]/5 border border-gray-200">
            <p className="text-xs font-medium text-gray-600">Weakest Tier Focus</p>
            <p className="text-xl font-extrabold text-[#E04E1B] mt-1">{weakestTier?.name || 'N/A'}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#002E47]/5 border border-gray-200">
            <p className="text-xs font-medium text-gray-600">Mastery Projection</p>
            <p className="text-xl font-extrabold text-[#47A88D] mt-1">{tierMasteryProjection} Days</p>
          </div>
        </div>

        <Button onClick={() => safeNavigate('prof-dev-plan')} variant="primary" className="mt-4 w-full">
          <Briefcase className="w-5 h-5 mr-2" /> Go to Development Roadmap
        </Button>
      </div>
      {/* --- END PDP ROADMAP HIGHLIGHT --- */}

      {/* --- MAIN GRID CONTAINER --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Column 1 & 2: ACTION HUBS (Primary User Focus) */}
        <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
          {/* 1. PILLAR 2: COACHING (PRACTICE & FEEDBACK) */}
          <div className='rounded-3xl border-4 border-[#002E47] bg-[#F7FCFF] p-8 shadow-2xl relative'>
            <h2 className="text-3xl font-extrabold text-[#002E47] mb-6 border-b-2 pb-4 border-gray-300 flex items-center gap-3">
              <Mic size={28} className='text-[#E04E1B]'/> PILLAR 2: Coaching (Practice & Feedback)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Daily Practice Button (NAVY ACCENT / TEAL COLOR SWAPPED) */}
              <div className='flex flex-col space-y-2'>
                <ThreeDButton
                  onClick={() => safeNavigate('daily-practice')} 
                  color={COLORS.TEAL} // <--- COLOR SWAP
                  accentColor={COLORS.NAVY} // <--- ACCENT SWAP
                  className="h-16 flex-row px-3 py-2 text-white"
                >
                  <ClockIcon className='w-5 h-5 mr-2'/> 
                  <span className='text-md font-extrabold'>Daily Practice Scorecard</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>This **Daily Scorecard** tracks your commitment to non-negotiable leadership micro-habits—your daily reps. Consistency over intensity.</p>
              </div>

              {/* Coaching Lab Button (NAVY ACCENT / TEAL COLOR SWAPPED) */}
              <div className='flex flex-col space-y-2'>
                <ThreeDButton
                  onClick={() => safeNavigate('coaching-lab')} 
                  color={COLORS.TEAL} // <--- COLOR SWAP
                  accentColor={COLORS.NAVY} // <--- ACCENT SWAP
                  className="h-16 flex-row px-3 py-2 text-white" 
                >
                  <Mic className='w-5 h-5 mr-2'/> 
                  <span className='text-md font-extrabold'>AI Coaching & Practice Lab</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>**Development through practice.** Use AI role-play tools to simulate crucial conversations and receive real-time, objective critique.</p>
              </div>

              {/* Development Plan Button (NAVY ACCENT / TEAL COLOR SWAPPED) - MOVED TO CONTENT PILLAR */}
              <div className='flex flex-col space-y-2'>
                <ThreeDButton
                  onClick={() => safeNavigate('reflection')}
                  color={COLORS.TEAL} // <--- COLOR SWAP
                  accentColor={COLORS.NAVY} // <--- ACCENT SWAP
                  className="h-16 flex-row px-3 py-2 text-white" 
                >
                  <BarChart3 className='w-5 h-5 mr-2'/> 
                  <span className='text-md font-extrabold'>Executive ROI Report</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>**Practice over theory.** Get a data-driven report on how your training translates to competency, risk reduction, and well-being alignment.</p>
              </div>
              
              {/* QuickStart: Bootcamp (NAVY ACCENT / TEAL COLOR SWAPPED) - MOVED HERE AS AN ENTRY POINT */}
              <div className='flex flex-col space-y-2'>
                <ThreeDButton
                  onClick={() => safeNavigate('quick-start-accelerator')} 
                  color={COLORS.TEAL} // <--- COLOR SWAP
                  accentColor={COLORS.NAVY} // <--- ACCENT SWAP
                  className="h-16 flex-row px-3 py-2 text-white" 
                >
                  <Zap className='w-5 h-5 mr-2'/> 
                  <span className='text-md font-extrabold'>QuickStart: Bootcamp</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>The **Bootcamp entry point** to quickly internalize the foundational "moves" (skills) needed for effective executive action.</p>
              </div>
              
            </div>
          </div>

          {/* 2. PILLAR 1: CONTENT (LEARN & PREP) & PILLAR 3: COMMUNITY */}
          <div className='rounded-3xl border-4 border-[#47A88D] bg-[#F7FCFF] p-8 shadow-2xl relative'>
            <h2 className="text-3xl font-extrabold text-[#002E47] mb-6 border-b-2 pb-4 border-gray-300 flex items-center gap-3">
              <BookOpen size={28} className='text-[#47A88D]'/> PILLAR 1: Content & PILLAR 3: Community
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Strategic Content Tool (NAVY COLOR / TEAL ACCENT) */}
              <div className='flex flex-col space-y-2'>
                <ThreeDButton
                  onClick={() => safeNavigate('planning-hub')} 
                  color={COLORS.NAVY} // <--- COLOR SWAP
                  accentColor={COLORS.TEAL} // <--- ACCENT SWAP
                  className="h-16 flex-row px-3 py-2 text-white" 
                >
                  <Trello className='w-5 h-5 mr-2'/> 
                  <span className='text-md font-extrabold'>Strategic Content Tools</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>Convert abstract vision into **actionable OKRs** and vet high-stakes decisions using the Pre-Mortem Audit tool.</p>
              </div>

              {/* Content Library: Read & Reps (NAVY COLOR / TEAL ACCENT) */}
              <div className='flex flex-col space-y-2'>
                <ThreeDButton
                  onClick={() => safeNavigate('business-readings')} 
                  color={COLORS.NAVY} // <--- COLOR SWAP
                  accentColor={COLORS.TEAL} // <--- ACCENT SWAP
                  className="h-16 flex-row px-3 py-2 text-white" 
                >
                  <BookOpen className='w-5 h-5 mr-2'/> 
                  <span className='text-md font-extrabold'>Content: Read & Reps</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>Access key frameworks, executive summaries, and **AI-driven commitment plans** to simplify behavioral science learning.</p>
              </div>

              {/* Content Library: Leader Talks (NAVY COLOR / TEAL ACCENT) */}
              <div className='flex flex-col space-y-2'> 
                <ThreeDButton
                  onClick={() => safeNavigate('leadership-videos')} 
                  color={COLORS.NAVY} // <--- COLOR SWAP
                  accentColor={COLORS.TEAL} // <--- ACCENT SWAP
                  className="h-16 flex-row px-3 py-2 text-white" 
                >
                  <Film className='w-5 h-5 mr-2'/> 
                  <span className='text-md font-extrabold'>Content: Leader Talks</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>A curated library of **inspirational and actionable video lessons** from top CEOs, coaches, and thought leaders.</p>
              </div>

              {/* Community & Peer Support Button (NAVY COLOR / TEAL ACCENT) */}
              <div className='flex flex-col space-y-2'> 
                <ThreeDButton
                  onClick={() => safeNavigate('community')} 
                  color={COLORS.NAVY} // <--- COLOR SWAP
                  accentColor={COLORS.TEAL} // <--- ACCENT SWAP
                  className="h-16 flex-row px-3 py-2 text-white" 
                >
                  <Users className='w-5 h-5 mr-2'/> 
                  <span className='text-md font-extrabold'>Community: Leader Circles</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>**Accountability and long-term growth** via peer connection, facilitated Leader Circles, and idea sharing.</p>
              </div>
              
            </div>
          </div>


          {/* 3. TOP STATS CARDS (Below Action Hubs) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Star}
              label="Current Perfect Score Streak"
              value={`${perfectStreak} Days`}
              onClick={() => safeNavigate('daily-practice')}
              trend={perfectStreak >= 3 ? 5 : 0} 
              colorHex={COLORS.GREEN}
            />
            <StatCard
              icon={AlertTriangle}
              label="Weakest Roadmap Tier Score"
              value={`${weakestTier?.name || 'T-X'} (${weakestTier?.rating}/10)`}
              onClick={() => safeNavigate('prof-dev-plan')}
              trend={-12} 
              colorHex={COLORS.ORANGE}
            />
            <StatCard
              icon={Archive}
              label="Longest-Held OKR"
              value={`${longestHeldOKR.days} Days (${longestHeldOKR.objective})`}
              onClick={() => safeNavigate('planning-hub')}
              trend={5} 
              colorHex={COLORS.NAVY}
            />
            <StatCard
              icon={ShieldCheck}
              label="Last Pre-Mortem Audit Date"
              value={lastPreMortemDate}
              onClick={() => safeNavigate('planning-hub')}
              trend={20} 
              colorHex={COLORS.PURPLE}
            />
          </div>
          
          {/* 4. PROGRESS SNAPSHOT (KMI Focus) */}
          <div className='rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-xl'>
            <h2 className="text-2xl font-bold text-[#002E47] mb-5 flex items-center gap-2">
              <LayoutDashboard size={24} className='text-[#002E47]'/> Key Progress Indicators (The Reps Tracker)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`flex items-center space-x-4 p-4 rounded-xl bg-[${COLORS.OFF_WHITE}] shadow-sm border border-gray-100 transition-all duration-300 animate-in fade-in-0 hover:shadow-lg hover:ring-2 ring-opacity-20 ring-[${COLORS.TEAL}]`}>
                <div className={`p-3 rounded-xl bg-opacity-10 flex-shrink-0`} style={{ background: COLORS.TEAL + '1A'}}>
                  <CheckCircle size={20} style={{ color: COLORS.TEAL }} />
                </div>
                <div className='truncate'>
                  <p className="text-sm text-gray-500 font-medium truncate">Daily Reps Completed</p>
                  <p className={`text-xl font-extrabold mt-0.5`} style={{ color: COLORS.TEAL }}>{commitsCompleted} of {commitsTotal}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-4 p-4 rounded-xl bg-[${COLORS.OFF_WHITE}] shadow-sm border border-gray-100 transition-all duration-300 animate-in fade-in-0 hover:shadow-lg hover:ring-2 ring-opacity-20 ring-[${COLORS.ORANGE}]`}>
                <div className={`p-3 rounded-xl bg-opacity-10 flex-shrink-0`} style={{ background: COLORS.ORANGE + '1A'}}>
                  <Target size={20} style={{ color: COLORS.ORANGE }} />
                </div>
                <div className='truncate'>
                  <p className="text-sm text-gray-500 font-medium truncate">Roadmap Tier Focus</p>
                  <p className={`text-xl font-extrabold mt-0.5`} style={{ color: COLORS.ORANGE }}>{weakestTier?.name || 'N/A'}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-4 p-4 rounded-xl bg-[${COLORS.OFF_WHITE}] shadow-sm border border-gray-100 transition-all duration-300 animate-in fade-in-0 hover:shadow-lg hover:ring-2 ring-opacity-20 ring-[${COLORS.BLUE}]`}>
                <div className={`p-3 rounded-xl bg-opacity-10 flex-shrink-0`} style={{ background: COLORS.BLUE + '1A'}}>
                  <Trello size={20} style={{ color: COLORS.BLUE }} />
                </div>
                <div className='truncate'>
                  <p className="text-sm text-gray-500 font-medium truncate">Total Active OKRs</p>
                  <p className={`text-xl font-extrabold mt-0.5`} style={{ color: COLORS.BLUE }}>{okrs.length}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-4 p-4 rounded-xl bg-[${COLORS.OFF_WHITE}] shadow-sm border border-gray-100 transition-all duration-300 animate-in fade-in-0 hover:shadow-lg hover:ring-2 ring-opacity-20 ring-[${COLORS.NAVY}]`}>
                <div className={`p-3 rounded-xl bg-opacity-10 flex-shrink-0`} style={{ background: COLORS.NAVY + '1A'}}>
                  <Briefcase size={20} style={{ color: COLORS.NAVY }} />
                </div>
                <div className='truncate'>
                  <p className="text-sm text-gray-500 font-medium truncate">Roadmap Months Remaining</p>
                  <p className={`text-xl font-extrabold mt-0.5`} style={{ color: COLORS.NAVY }}>{24 - goalsCount}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Column 3: HEALTH SCORE & NUDGE (lg:col-span-1, order 1) */}
        <div className="space-y-8 lg:col-span-1 order-1">

          {/* 5. HEALTH SCORE RING */}
          <ProgressRings
            dailyPercent={dailyPercent}
            monthlyPercent={monthlyPercent}
            careerPercent={careerPercent}
            tierHex={weakestTier?.hex || COLORS.TEAL}
            commitsDue={commitsDue}
          />

          {/* 6. Daily Tip (Strategic Nudge) - Enhanced with Tier Icon */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/95 relative group">
            <div className='absolute inset-0 rounded-2xl' style={{ background: `${weakestTier?.hex || COLORS.TEAL}1A`, opacity: 0.1 }} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className={`text-xl font-bold flex items-center gap-2`} style={{color: weakestTier?.hex || COLORS.NAVY}}>
                <Target size={20} className={`text-white p-1 rounded-full`} style={{backgroundColor: weakestTier?.hex || COLORS.TEAL}}/> 
                {weakestTier?.name || 'T-X'} Strategic Rep
              </h2>
              <button
                className="rounded-full border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100 flex items-center gap-1 transition-colors"
                onClick={nextNudge}
                disabled={tipLoading}
                type="button"
              >
                {tipLoading ? <Loader size={16} className='animate-spin text-gray-500' /> : <ClockIcon size={16} className='text-gray-500' />}
                Next Rep
              </button>
            </div>
            <div className={`p-4 rounded-xl bg-gray-50 border border-gray-100 mt-3 shadow-inner`}>
              <div className="prose prose-sm max-w-none relative z-10">
                {tipHtml
                  ? <div dangerouslySetInnerHTML={{ __html: tipHtml }} />
                  : <p className="text-gray-600 text-sm">Tap Next Rep to get a fresh, powerful focus point from your AI Coach.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;