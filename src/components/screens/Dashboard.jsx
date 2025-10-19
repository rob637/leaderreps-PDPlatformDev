// src/components/screens/Dashboard.jsx 
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../../App.jsx';

// --- MOCK IMPORTS for self-contained file ---
const LEADERSHIP_TIERS = {
    'T1': { id: 'T1', name: 'Self-Awareness', icon: 'Target', color: 'bg-blue-100 text-blue-700' },
    'T2': { id: 'T2', name: 'Communication', icon: 'Mic', color: 'bg-cyan-100 text-cyan-700' },
    'T3': { id: 'T3', name: 'Execution', icon: 'Briefcase', color: 'bg-green-100 text-green-700' },
    'T4': { id: 'T4', name: 'People Dev', icon: 'Users', color: 'bg-yellow-100 text-yellow-700' },
    'T5': { id: 'T5', name: 'Vision', icon: 'TrendingUp', color: 'bg-red-100 text-red-700' },
};

const MOCK_PDP_DATA = {
    currentMonth: 4,
    // Note: T2 is the weakest score (3) to test the focus logic.
    assessment: { selfRatings: { T1: 8, T2: 3, T3: 6, T4: 7, T5: 5 } }, 
    plan: [{month:'Current', theme: 'Mastering Strategy', requiredContent: []}]
};
const MOCK_COMMITMENT_DATA = { 
    active_commitments: [
        { id: 1, status: 'Pending', linkedTier: 'T2' }, 
        { id: 2, status: 'Committed', linkedTier: 'T5' }
    ],
    resilience_log: { '2025-10-19': { energy: 4, focus: 7 } } // Mock Low Energy
};

// --- START: NUDGE CONTENT FOR ROTATION (Update 2) ---
// This array is now used as a fallback/example, not the primary source.
const NUDGE_CONTENT = [
    'Focus today on deep listening; practice paraphrasing your colleague\'s needs before offering solutions.',
    'Before starting a task, ask: "Will this activity move us closer to our one-year vision?" If not, delegate it.',
    'Schedule 30 minutes of "maker time" today—no meetings, no email. Protect it fiercely.',
    'Identify a high-performer on your team and spend five minutes explicitly praising their recent strategic work.',
    'Review your last three major decisions. Did you rely on data or intuition? Challenge your bias today.',
    'Leadership is about capacity, not control. What task can you delegate today to build team capacity?',
];
// --- END: NUDGE CONTENT ---



async function mdToHtml(md) {
    let html = md.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/>\s*(.*)/gim, '<div class="mt-2 text-base text-gray-800 border-l-4 border-[#47A88D] pl-3 italic">“$1”</div>');
    return Promise.resolve(html);
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
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
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
            title={value} 
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


function extractGeminiText(resp) {
  if (!resp) return '';
  if (typeof resp === 'string') return resp;
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
    TTL: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
};

/* ---------------------------------------
   Dashboard (default export)
----------------------------------------*/
const DashboardScreen = () => {
    const {
        navigate,
        user,
        pdpData,
        planningData,
        commitmentData,
        hasPendingDailyPractice,
        callSecureGeminiAPI,
        hasGeminiKey,
        LEADERSHIP_TIERS: svcLEADERSHIP_TIERS,
    } = useAppServices();

    const TIER_MAP = svcLEADERSHIP_TIERS || LEADERSHIP_TIERS;

    const safeNavigate = useCallback((screen, params) => {
        // FIX: Ensure this calls the app-level navigate function
        navigate(screen, params); 
    }, [navigate]);
    
    // --- Data Calculations ---
    const goalsCount = useMemo(() => pdpData?.currentMonth || 0, [pdpData]);
    const plansCount = useMemo(() => planningData?.okrs?.length || 0, [planningData]);
    const commitsCount = useMemo(() => commitmentData?.active_commitments?.length || 0, [commitmentData]);
    const completedCommitsCount = useMemo(() => 17, []); 

    // --- AI Skill Gap Highlight ---
    const weakestTier = useMemo(() => {
        const ratings = pdpData?.assessment?.selfRatings;
        if (!ratings) return null;

        // Find the lowest score
        const sortedTiers = Object.entries(ratings)
        .sort(([, a], [, b]) => a - b);

        const weakestId = sortedTiers[0]?.[0];

        if (!weakestId) return null;

        const meta = TIER_MAP[weakestId];
        return {
        id: weakestId,
        name: meta?.name || 'Unknown',
        rating: ratings[weakestId],
        color: meta?.color || 'bg-red-100 text-red-700',
        icon: AlertTriangle,
        };
    }, [pdpData, TIER_MAP]);

    // --- Daily Tip (Gemini) - Implemented for rotation (Update 2) ---
    const [tipLoading, setTipLoading] = useState(false);
    const [nudgeIndex, setNudgeIndex] = useState(0);
    const [tipHtml, setTipHtml] = useState('');

    const getDailyTip = useCallback(async (force = false) => {
        // FIX: Implement the 6-hour cache logic
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
        if (typeof hasGeminiKey === 'function' && hasGeminiKey()) {
            getDailyTip(true);
            return;
        }
        setTipLoading(true);
        setTimeout(() => {
            const next = (nudgeIndex + 1) % (NUDGE_CONTENT?.length || 1);
            const text = NUDGE_CONTENT?.[next] || 'Focus on one high-leverage action today.';
            setNudgeIndex(next);
            setTipHtml(`<p>${text}</p>`);
            setTipLoading(false);
        }, 200);
    }, [getDailyTip, hasGeminiKey, nudgeIndex]);

    // Fetch tip on mount
    useEffect(() => {
        getDailyTip();
    }, [getDailyTip]);


    return (
        <div className={`p-6 space-y-8 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
        {/* Header with improved styling */}
        <div className={`border-b border-gray-200 pb-5 bg-[${COLORS.OFF_WHITE}] p-6 -mx-6 -mt-6 mb-8 rounded-b-xl shadow-md`}>
            <h1 className={`text-4xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3`}>
            <Home size={32} style={{ color: COLORS.TEAL }} /> Executive Dashboard
            </h1>
            <p className="text-gray-600 text-base mt-2">
            Welcome back, <span className={`font-semibold text-[${COLORS.NAVY}]`}>{user?.email ? user.email.split('@')[0] : 'Leader'}</span>. Your strategic overview for today.
            </p>
        </div>

        {/* Top Stats - World Class Styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                value={commitsCount}
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

        {/* Main grid: 2/3 (Actions - More Prominent) | 1/3 (Focus) - Adjusted Grid Order (Update 3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">

            {/* Left Column - Executive Action Hub (Now lg:col-span-2 and first in order for prominence) */}
            <div className="lg:col-span-2 space-y-8 order-2 lg:order-1"> {/* Order change for prominence (Update 3) */}

                 {/* EXECUTIVE ACTION HUB (Consolidated) - Increased prominence styling (Update 3) */}
                 <div className='rounded-3xl border-4 border-[#002E47] bg-[#F7FCFF] p-8 shadow-2xl relative'>
                    <h2 className="text-3xl font-extrabold text-[#002E47] mb-6 border-b-2 pb-4 border-gray-300 flex items-center gap-3">
                        <Zap size={28} className='text-[#E04E1B]'/> Executive Action Hub
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* CORE ACTIONS - Buttons now correctly navigate (FIX: onClick added) */}
                        <Button
                            onClick={() => safeNavigate('quick-start-accelerator')}
                            variant='primary'
                            className='p-3 text-lg rounded-xl bg-gradient-to-r from-[#47A88D] to-[#349881] text-white shadow-lg hover:shadow-xl transition-all ring-1 ring-white/20 hover:-translate-y-[1px]'
                        >
                            <Zap className='w-5 h-5 mr-2'/> Accelerator
                        </Button>
                        <Button
                            onClick={() => safeNavigate('prof-dev-plan')}
                            variant='primary'
                            className='p-3 text-lg rounded-xl bg-gradient-to-r from-[#47A88D] to-[#349881] text-white shadow-lg hover:shadow-xl transition-all ring-1 ring-white/20 hover:-translate-y-[1px]'
                        >
                            <Briefcase className='w-5 h-5 mr-2'/> Dev Plan
                        </Button>
                        <Button
                            onClick={() => safeNavigate('daily-practice')}
                            variant='primary'
                            className='p-3 text-lg rounded-xl bg-gradient-to-r from-[#47A88D] to-[#349881] text-white shadow-lg hover:shadow-xl transition-all ring-1 ring-white/20 hover:-translate-y-[1px]'
                        >
                            <ClockIcon className='w-5 h-5 mr-2'/> Daily Scorecard
                        </Button>
                        <Button
                            onClick={() => safeNavigate('coaching-lab')}
                            variant='primary'
                            className='p-3 text-lg rounded-xl bg-gradient-to-r from-[#47A88D] to-[#349881] text-white shadow-lg hover:shadow-xl transition-all ring-1 ring-white/20 hover:-translate-y-[1px]'
                        >
                            <Mic className='w-5 h-5 mr-2'/> Coaching Lab
                        </Button>
                        {/* RESOURCE HUBS - Buttons now correctly navigate (FIX: onClick added) */}
                        <Button
                            onClick={() => safeNavigate('reflection')}
                            variant='primary'
                            className='p-3 text-lg rounded-xl bg-gradient-to-r from-[#47A88D] to-[#349881] text-white shadow-lg hover:shadow-xl transition-all ring-1 ring-white/20 hover:-translate-y-[1px]'
                        >
                            <Star className='w-5 h-5 mr-2'/> Reflection
                        </Button>
                        <Button
                            onClick={() => safeNavigate('planning-hub')}
                            variant='primary'
                            className='p-3 text-lg rounded-xl bg-gradient-to-r from-[#47A88D] to-[#349881] text-white shadow-lg hover:shadow-xl transition-all ring-1 ring-white/20 hover:-translate-y-[1px]'
                        >
                            <TrendingUp className='w-5 h-5 mr-2'/> Planning Hub
                        </Button>
                        <Button
                            onClick={() => safeNavigate('business-readings')}
                            variant='primary'
                            className='p-3 text-lg rounded-xl bg-gradient-to-r from-[#47A88D] to-[#349881] text-white shadow-lg hover:shadow-xl transition-all ring-1 ring-white/20 hover:-translate-y-[1px]'
                        >
                            <BookOpen className='w-5 h-5 mr-2'/> Readings
                        </Button>
                         <Button
                            onClick={() => safeNavigate('app-settings')} // New hypothetical navigation for consistency
                            variant='secondary'
                            className='bg-[#E04E1B] hover:bg-[#C33E12] p-3 text-lg'
                        >
                            <LayoutDashboard className='w-5 h-5 mr-2'/> Settings
                        </Button>
                    </div>
                </div>

                {/* PROGRESS SNAPSHOT (KMI Focus) */}
                <div className='rounded-2xl border border-gray-200 bg-gray-50 p-6 shadow-xl'>
                    <h2 className="text-2xl font-bold text-[#002E47] mb-5 flex items-center gap-2">
                        <LayoutDashboard size={24} className='text-[#002E47]'/> Key Progress Indicators
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProgressKMI
                            title="Commits Completed (Total)"
                            value={completedCommitsCount}
                            icon={CalendarClock}
                            colorClass='text-[#47A88D]'
                        />
                        <ProgressKMI
                            title="Leadership Tier Focus"
                            value={weakestTier?.name || 'N/A'}
                            icon={Target}
                            colorClass='text-red-600'
                        />
                        <ProgressKMI
                            title="Total Active OKRs"
                            value={plansCount}
                            icon={Trello}
                            colorClass='text-indigo-600'
                        />
                        <ProgressKMI
                            title="PDP Months Remaining"
                            value={24 - goalsCount}
                            icon={Briefcase}
                            colorClass='text-[#002E47]'
                        />
                    </div>
                </div>

            </div>


            {/* Right Column (Focus & Nudge) - Now lg:col-span-1 and second in order */}
            <div className="space-y-8 lg:col-span-1 order-1 lg:order-2">

                {/* AI Skill Gap Highlight Card */}
                {weakestTier && (
                <div className={`rounded-2xl border-4 border-dashed p-6 shadow-xl transition-all duration-300 ${weakestTier.rating < 5 ? 'border-[#E04E1B] bg-red-50' : 'border-[#47A88D] bg-white'}`}>
                    <div className='flex items-center justify-between mb-4'>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-[#002E47]">
                        <AlertTriangle size={24} className={weakestTier.rating < 5 ? 'text-[#E04E1B]' : 'text-[#47A88D]'} /> Development Focus
                        </h2>
                        <span className={`px-4 py-1 text-sm font-bold rounded-full ${weakestTier.rating < 5 ? 'bg-[#E04E1B] text-white shadow-md' : 'bg-[#47A88D] text-white shadow-md'}`}>
                            Score: {weakestTier.rating}/10
                        </span>
                    </div>
                    <p className='text-md font-semibold text-gray-800'>
                        Your primary growth area is currently **{weakestTier.name}** ({weakestTier.id}).
                    </p>
                    <p className='text-sm text-gray-600 mt-2'>
                        All personalized content is weighted toward this skill to accelerate impact.
                    </p>
                    <button
                        onClick={() => safeNavigate('prof-dev-plan')} // FIX: Link is now functional
                        className='text-[#47A88D] font-bold text-sm mt-4 block underline hover:text-[#002E47]'
                    >
                        Review Deep Dive Content &rarr;
                    </button>
                </div>
                )}

                {/* Daily Tip (Strategic Nudge) - Updated for rotation (FIX: Use force param) */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/95 relative group">
                {/* Subtle background glow on hover */}
                <div className='absolute inset-0 rounded-2xl bg-[#47A88D] opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none'></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-[#002E47]">
                    <Target size={20} className='text-[#47A88D]' /> Strategic Nudge
                    </h2>
                    <button
                    className="rounded-full border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100 flex items-center gap-1 transition-colors"
                    onClick={nextNudge} // FIX: Force true to bypass 6-hour cache
                    disabled={tipLoading}
                    type="button"
                    >
                    {tipLoading ? <Loader size={16} className='animate-spin text-gray-500' /> : <ClockIcon size={16} className='text-gray-500' />}
                    Rotate
                    </button>
                </div>
                
                {/* Styled container for the AI prose to look more intentional */}
                <div className={`p-4 rounded-xl bg-gray-50 border border-gray-100 mt-3 shadow-inner`}>
                    <div className="prose prose-sm max-w-none relative z-10">
                        {tipHtml
                        ? <div dangerouslySetInnerHTML={{ __html: tipHtml }} />
                        : <p className="text-gray-600 text-sm">Tap Rotate to get a fresh, powerful nudge from your AI Coach.</p>}
                    </div>
                </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default DashboardScreen;