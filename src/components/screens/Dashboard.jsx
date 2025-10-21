// src/components/screens/Dashboard.jsx 
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';

// --- MOCK IMPORTS for self-contained file ---
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
    resilience_log: { '2025-10-19': { energy: 4, focus: 7 } }
};

const NUDGE_CONTENT = [
    'Focus today on deep listening; practice paraphrasing your colleague\'s needs before offering solutions.',
    'Before starting a task, ask: "Will this activity move us closer to our one-year vision?" If not, delegate it.',
    'Schedule 30 minutes of "maker time" today—no meetings, no email. Protect it fiercely.',
];
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
};

/* ---------------------------------------
   UI Components (Standardized)
----------------------------------------*/
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-red-700 focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
      {children}
    </button>
  );
};

// NEW COMPONENT: 3D-inspired Button
const ThreeDButton = ({ children, onClick, color = COLORS.TEAL, accentColor = COLORS.NAVY, className = '', ...rest }) => {
    const defaultColor = color;
    const defaultAccent = accentColor; // For the 'bottom' shadow effect

    const buttonStyle = {
        background: defaultColor, // Use solid color for base
        boxShadow: `0 4px 0px 0px ${defaultAccent}, 0 6px 12px rgba(0,0,0,0.2)`,
        transition: 'all 0.1s ease-out',
        transform: 'translateY(0px)',
    };
    
    // FIX: Define dynamic styles as functions or use state for real 3D effect
    const getBoxShadow = (offset) => `0 ${offset}px 0px 0px ${defaultAccent}, 0 ${offset + 2}px ${offset * 2}px rgba(0,0,0,0.2)`;

    return (
        <button
            {...rest}
            onClick={onClick}
            // PATCH 1: Add explicit type="button"
            type="button" 
            className={`
                relative px-6 py-3 rounded-xl font-bold text-white text-lg
                flex items-center justify-center whitespace-nowrap
                focus:outline-none focus:ring-4 focus:ring-opacity-50 focus:ring-[${defaultColor}]/70
                ${className}
            `}
            style={buttonStyle}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = getBoxShadow(6);
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0px)';
                e.currentTarget.style.boxShadow = getBoxShadow(4);
            }}
            onMouseDown={e => {
                e.currentTarget.style.transform = 'translateY(2px)';
                e.currentTarget.style.boxShadow = getBoxShadow(2);
            }}
            onMouseUp={e => {
                // Return to hover state after mouse up
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = getBoxShadow(6);
            }}
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
      // PATCH 2: Pass type="button" when interactive
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

const StatCard = ({ icon: Icon, label, value, onClick, colorHex = COLORS.TEAL, trend = 0 }) => {
    const trendIcon = trend > 0 ? TrendingUp : TrendingDown;
    const trendColor = trend > 0 ? COLORS.TEAL : trend < 0 ? COLORS.ORANGE : COLORS.MUTED;
    const isPrimary = label === "Daily Commitments Due"; 
    
    return (
        <Card 
            icon={Icon} 
            // FIX: Conditional value for Dev Plan start state
            title={label === "Development Plan Progress" && value === '0 / 24 Months' ? 'Start Now' : value}
            onClick={onClick} 
            className={`w-full ${isPrimary ? 'shadow-2xl' : ''}`}
            accent={isPrimary ? (trend > 0 ? 'TEAL' : 'ORANGE') : 'NAVY'}
        >
            <div className="flex justify-between items-center -mt-1">
                <div className="flex-1">
                    <div className="text-sm font-medium text-gray-500">{label}</div>
                </div>
                <div className={`text-sm font-semibold flex items-center gap-1`} style={{ color: trendColor }}>
                    {trend !== 0 && (
                        <span className={`p-1 rounded-full`} style={{ background: trend > 0 ? COLORS.TEAL + '1A' : COLORS.ORANGE + '1A' }}>
                            <span className='block leading-none'><trendIcon size={14} /></span>
                        </span>
                    )}
                    {trend !== 0 ? <span className='font-bold'>{Math.abs(trend)}%</span> : 'Status Quo'}
                </div>
            </div>
            <CornerRightUp className="absolute top-8 right-8 text-gray-400" size={20} />
        </Card>
    );
};


const ProgressKMI = ({ title, value, icon: Icon, colorHex = COLORS.TEAL }) => (
    <div className={`flex items-center space-x-4 p-4 rounded-xl bg-[${COLORS.OFF_WHITE}] shadow-sm border border-gray-100 transition-all duration-300 animate-in fade-in-0 hover:shadow-lg hover:ring-2 ring-opacity-20 ring-[${COLORS.TEAL}]`}>
        <div className={`p-3 rounded-xl bg-opacity-10 flex-shrink-0`} style={{ background: colorHex + '1A'}}>
            <Icon size={20} style={{ color: colorHex }} />
        </div>
        <div className='truncate'>
            <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
            <p className={`text-xl font-extrabold mt-0.5`} style={{ color: colorHex }}>{value}</p>
        </div>
    </div>
);

// NEW COMPONENT: Stacked Progress Rings for visual impact
const ProgressRings = ({ dailyPercent, monthlyPercent, careerPercent, tierHex, commitsDue }) => {
    // Determine the color for the Daily Ring (Red if pending, Green if perfect)
    const dailyColor = commitsDue > 0 ? COLORS.ORANGE : COLORS.TEAL;
    
    // Scale factor for the viewBox to center rings (36 36 is 100% circle circumference)
    const viewBoxSize = 36;
    const radius = 15.9155;
    
    // Convert percentages to strokeDashoffset
    const dailyOffset = radius * 2 * Math.PI * (1 - dailyPercent / 100);
    const monthlyOffset = radius * 2 * Math.PI * (1 - monthlyPercent / 100);
    const careerOffset = radius * 2 * Math.PI * (1 - careerPercent / 100);

    // Composite Health Score (Example Calculation)
    const healthScore = Math.round(
        (monthlyPercent * 0.4) + 
        (careerPercent * 0.3) + 
        ((100 - commitsDue * 5) * 0.3) // Weight commits due against 100
    );

    return (
        <Card 
            title="Leadership Health Score" 
            icon={Activity} 
            accent={COLORS.NAVY} 
            className="lg:col-span-1 shadow-2xl bg-[#002E47]/10 border-4 border-[#002E47]/20"
        >
            <div className="flex items-center space-x-4">
                {/* Gauge for Health Score */}
                <div className="relative w-28 h-28 flex-shrink-0">
                    <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="w-full h-full transform -rotate-90">
                        {/* Background for Health Score Arc */}
                        <circle className="text-gray-300" strokeWidth="3" stroke="currentColor" fill="transparent" r={radius} cx="18" cy="18" />
                        {/* Health Score Arc (Orange if < 70%, Teal otherwise) */}
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
  if (ArrayOf(parts)) {
    return parts.map(p => p?.text).filter(Boolean).join('\n\n');
  }
  return '';
}

// Global variable to cache the tip content and the last fetch time
const TIP_CACHE = {
    content: null,
    timestamp: 0,
    TTL: 4 * 60 * 60 * 1000, // FIX: Changed TTL to 4 hours
};
const mdToHtml = async (md) => {
    // Simple markdown-to-HTML parser for mock content display
    let html = md;
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>'); // Bold
    html = html.replace(/\> (.*)/gim, '<blockquote class="text-sm border-l-4 border-gray-400 pl-3 italic text-gray-700">$1</blockquote>'); // Blockquote
    // Ensure all remaining text is wrapped in <p> tags
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
    // FIX: Using actual useAppServices hook
    const {
        navigate,
        user,
        pdpData: svcPdpData,
        planningData: svcPlanningData,
        commitmentData: svcCommitmentData,
        hasPendingDailyPractice,
        callSecureGeminiAPI,
        hasGeminiKey,
        LEADERSHIP_TIERS: svcLEADERSHIP_TIERS,
    } = useAppServices();

    // Use mock data as fallback if service data is not yet loaded (isLoading is false but data is null)
    const pdpData = svcPdpData || MOCK_PDP_DATA;
    const planningData = svcPlanningData; // Planning data often loads last, no robust mock needed here
    const commitmentData = svcCommitmentData || MOCK_COMMITMENT_DATA;
    
    const TIER_MAP = svcLEADERSHIP_TIERS || LEADERSHIP_TIERS;

    // PATCH 3: Added tiny guard and log around navigate
    const safeNavigate = useCallback((screen, params) => {
        if (typeof navigate !== 'function') {
            console.error('navigate() is not available from useAppServices');
            return;
        }
        console.log('[Dashboard] navigate ->', screen, params || {});
        navigate(screen, params);
    }, [navigate]);
    
    // --- Data Calculations ---
    const goalsCount = useMemo(() => pdpData?.currentMonth || 0, [pdpData]);
    const plansCount = useMemo(() => planningData?.okrs?.length || 0, [planningData]);
    const commitsTotal = useMemo(() => commitmentData?.active_commitments?.length || 0, [commitmentData]);
    const commitsCompleted = useMemo(() => commitmentData?.active_commitments?.filter(c => c.status === 'Committed').length || 0, [commitmentData]);
    const commitsDue = commitsTotal - commitsCompleted;
    
    // Derived Progress Percentages for Rings
    const dailyPercent = commitsTotal > 0 ? Math.round((commitsCompleted / commitsTotal) * 100) : 0;
    const monthlyPercent = goalsCount > 0 ? Math.round(((goalsCount - 1) % 4) * 25 + (commitsCompleted / commitsTotal || 0) * 25) : 0; // Mock: 25% progress per month in a tier cycle
    const careerPercent = Math.round((goalsCount / 24) * 100);

    // --- AI Skill Gap Highlight ---
    const weakestTier = useMemo(() => {
        const ratings = pdpData?.assessment?.selfRatings;
        if (!ratings) return null;

        // Find the lowest score
        const sortedTiers = Object.entries(ratings)
        .sort(([, a], [, b]) => a - b);

        const weakestEntry = sortedTiers[0];
        const weakestId = weakestEntry?.[0];

        if (!weakestId) return null;

        const meta = TIER_MAP[weakestId];
        return {
        id: weakestId,
        name: meta?.name || 'Unknown',
        rating: ratings[weakestId],
        color: meta?.color || 'bg-red-100 text-red-700',
        hex: meta?.hex || COLORS.ORANGE, // Added hex for visual use
        icon: AlertTriangle,
        };
    }, [pdpData, TIER_MAP]);

    // --- Daily Tip (Gemini) ---
    const [tipLoading, setTipLoading] = useState(false);
    const [tipHtml, setTipHtml] = useState('');

    const getDailyTip = useCallback(async (force = false) => {
        // FIX: Implement the 4-hour cache logic
        const now = Date.now();
        if (!force && TIP_CACHE.content && (now - TIP_CACHE.timestamp < TIP_CACHE.TTL)) {
            setTipHtml(TIP_CACHE.content);
            return;
        }

        if (!hasGeminiKey()) {
            setTipHtml(await mdToHtml('>⚠️ **AI Coach Unavailable.** Set API Key in App Settings.'));
            return;
        }
        
        setTipLoading(true);
        try {
            // FIX: Use the actual weakest tier in the prompt
            const weakestSkill = weakestTier?.name || 'General Leadership';
            const prompt = `Give a concise, actionable leadership practice for the day (3 sentences max).
            Focus the tip explicitly on improving the skill: ${weakestSkill}.
            Tone: encouraging, strategic, direct.`;

            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            const resp = await callSecureGeminiAPI(payload);
            const text = extractGeminiText(resp) || 'No strategic guidance available right now.';
            const html = await mdToHtml(text);
            
            // Update cache and state
            TIP_CACHE.content = html;
            TIP_CACHE.timestamp = now;
            setTipHtml(html);
        } catch (e) {
            console.error('AI tip fetch error:', e);
            setTipHtml(await mdToHtml(`**Error:** Failed to fetch tip. (Check console for details)`));
        } finally {
            setTipLoading(false);
        }
    }
    , [weakestTier, callSecureGeminiAPI, hasGeminiKey]);

    const nextNudge = useCallback(() => {
        // Force manual refresh of the tip (bypassing the 4-hour TTL temporarily)
        getDailyTip(true); 
    }, [getDailyTip]);

    // Automatic 4-hour rotation
    useEffect(() => {
        // Initial fetch on mount
        getDailyTip();

        const intervalId = setInterval(() => {
            getDailyTip(true); // Force refresh every 4 hours
        }, 4 * 60 * 60 * 1000);

        return () => clearInterval(intervalId);
    }, [getDailyTip]);


    return (
        <div className={`p-6 space-y-8 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
        {/* Header with enhanced Personalization */}
        <div className={`border-b border-gray-200 pb-5 bg-[${COLORS.OFF_WHITE}] p-6 -mx-6 -mt-6 mb-8 rounded-b-xl shadow-md`}>
            <h1 className={`text-4xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3`}>
            <Home size={32} style={{ color: COLORS.TEAL }} /> Executive Dashboard
            </h1>
            <p className="text-gray-600 text-base mt-2">
            Welcome back, <span className={`font-semibold text-[${COLORS.NAVY}]`}>{user?.email ? user.email.split('@')[0] : 'Leader'}</span>. Your primary focus is **{weakestTier?.name || 'Getting Started'}**.
            </p>
        </div>

        {/* --- MAIN GRID CONTAINER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Column 1 & 2: ACTION HUB & KMI PROGRESS (Primary User Focus) */}
            <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">

                 {/* 1. EXECUTIVE ACTION HUB (MOVED TO TOP) */}
                 <div className='rounded-3xl border-4 border-[#002E47] bg-[#F7FCFF] p-8 shadow-2xl relative'>
                    <h2 className="text-3xl font-extrabold text-[#002E47] mb-6 border-b-2 pb-4 border-gray-300 flex items-center gap-3">
                        <Zap size={28} className='text-[#E04E1B]'/> Executive Action Hub
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* CORE ACTIONS (DO) - Now 3D and Functional */}
                        <ThreeDButton
                            onClick={() => safeNavigate('quick-start-accelerator')}
                            color={COLORS.TEAL}
                            accentColor={COLORS.NAVY}
                        >
                            <Zap className='w-5 h-5 mr-2'/> Accelerator
                        </ThreeDButton>
                        <ThreeDButton
                            onClick={() => safeNavigate('prof-dev-plan')}
                            color={COLORS.TEAL}
                            accentColor={COLORS.NAVY}
                        >
                            <Briefcase className='w-5 h-5 mr-2'/> Dev Plan
                        </ThreeDButton>
                        <ThreeDButton
                            onClick={() => safeNavigate('daily-practice')}
                            color={COLORS.TEAL}
                            accentColor={COLORS.NAVY}
                        >
                            <ClockIcon className='w-5 h-5 mr-2'/> Daily Scorecard
                        </ThreeDButton>
                        <ThreeDButton
                            onClick={() => safeNavigate('coaching-lab')}
                            color={COLORS.TEAL}
                            accentColor={COLORS.NAVY}
                        >
                            <Mic className='w-5 h-5 mr-2'/> Coaching Lab
                        </ThreeDButton>
                        {/* ANALYZE / PLAN ACTIONS (Secondary Functions) - Now 3D and Functional */}
                        <ThreeDButton
                            onClick={() => safeNavigate('reflection')}
                            color={COLORS.TEAL}
                            accentColor={COLORS.NAVY}
                        >
                            <Star className='w-5 h-5 mr-2'/> Reflection
                        </ThreeDButton>
                        <ThreeDButton
                            onClick={() => safeNavigate('planning-hub')}
                            color={COLORS.TEAL}
                            accentColor={COLORS.NAVY}
                        >
                            <TrendingUp className='w-5 h-5 mr-2'/> Planning Hub
                        </ThreeDButton>
                        <ThreeDButton
                            onClick={() => safeNavigate('business-readings')}
                            color={COLORS.TEAL}
                            accentColor={COLORS.NAVY}
                        >
                            <BookOpen className='w-5 h-5 mr-2'/> Readings
                        </ThreeDButton>
                         <ThreeDButton
                            onClick={() => safeNavigate('executive-reflection')} 
                            color={COLORS.TEAL}
                            accentColor={COLORS.NAVY}
                        >
                            <LayoutDashboard className='w-5 h-5 mr-2'/> Analytics
                        </ThreeDButton>
                    </div>
                </div>

                {/* 2. TOP STATS CARDS (Below Action Hub) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        icon={Briefcase}
                        label="Development Plan Progress"
                        value={goalsCount > 0 ? `${pdpData?.currentMonth || 1} / 24 Months` : 'Start Now'}
                        onClick={() => safeNavigate('prof-dev-plan')}
                        colorClass='bg-[#002E47]/10 text-[#002E47]'
                        trend={12} 
                    />
                    <StatCard
                        icon={CalendarClock}
                        label="Daily Commitments Due"
                        value={commitsDue}
                        onClick={() => safeNavigate('daily-practice')}
                        colorClass={hasPendingDailyPractice ? 'bg-[#E04E1B]/20 text-[#E04E1B] animate-pulse' : 'bg-[#47A88D]/20 text-[#47A88D]'}
                        trend={-4} 
                    />
                    <StatCard
                        icon={Trello}
                        label="Objectives (OKRs) Drafted"
                        value={plansCount}
                        onClick={() => safeNavigate('planning-hub')}
                        colorClass='bg-indigo-100 text-indigo-700'
                        trend={25} 
                    />
                </div>
                
                {/* 3. PROGRESS SNAPSHOT (KMI Focus) */}
                <div className='rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-xl'>
                    <h2 className="text-2xl font-bold text-[#002E47] mb-5 flex items-center gap-2">
                        <LayoutDashboard size={24} className='text-[#002E47]'/> Key Progress Indicators
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProgressKMI
                            title="Commits Completed (Total)"
                            value={commitsCompleted}
                            icon={CheckCircle}
                            colorHex={COLORS.TEAL}
                        />
                        <ProgressKMI
                            title="Leadership Tier Focus"
                            value={weakestTier?.name || 'N/A'}
                            icon={Target}
                            colorHex={COLORS.ORANGE}
                        />
                        <ProgressKMI
                            title="Total Active OKRs"
                            value={plansCount}
                            icon={Trello}
                            colorHex={COLORS.BLUE}
                        />
                        <ProgressKMI
                            title="PDP Months Remaining"
                            value={24 - goalsCount}
                            icon={Briefcase}
                            colorHex={COLORS.NAVY}
                        />
                    </div>
                </div>

            </div>


            {/* Column 3: HEALTH SCORE & NUDGE (lg:col-span-1, order 1) */}
            <div className="space-y-8 lg:col-span-1 order-1">

                {/* 4. HEALTH SCORE RING */}
                <ProgressRings
                    dailyPercent={dailyPercent}
                    monthlyPercent={monthlyPercent}
                    careerPercent={careerPercent}
                    tierHex={weakestTier?.hex || COLORS.TEAL}
                    commitsDue={commitsDue}
                />

                {/* 5. Daily Tip (Strategic Nudge) - Enhanced with Tier Icon */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/95 relative group">
                
                <div className='absolute inset-0 rounded-2xl' style={{ background: `${weakestTier?.hex || COLORS.TEAL}1A`, opacity: 0.1 }}></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h2 className={`text-xl font-bold flex items-center gap-2`} style={{color: weakestTier?.hex || COLORS.NAVY}}>
                    <Target size={20} className={`text-white p-1 rounded-full`} style={{backgroundColor: weakestTier?.hex || COLORS.TEAL}}/> 
                    {weakestTier?.name || 'T-X'} Strategy Focus
                    </h2>
                    <button
                    className="rounded-full border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100 flex items-center gap-1 transition-colors"
                    onClick={nextNudge} // FIX: Changed logic to call nextNudge
                    disabled={tipLoading}
                    type="button"
                    >
                    {tipLoading ? <Loader size={16} className='animate-spin text-gray-500' /> : <ClockIcon size={16} className='text-gray-500' />}
                    Next Nudge
                    </button>
                </div>
                
                {/* Styled container for the AI prose to look more intentional */}
                <div className={`p-4 rounded-xl bg-gray-50 border border-gray-100 mt-3 shadow-inner`}>
                    <div className="prose prose-sm max-w-none relative z-10">
                        {tipHtml
                        ? <div dangerouslySetInnerHTML={{ __html: tipHtml }} />
                        : <p className="text-gray-600 text-sm">Tap Next Nudge to get a fresh, powerful nudge from your AI Coach.</p>}
                    </div>
                </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default DashboardScreen;
