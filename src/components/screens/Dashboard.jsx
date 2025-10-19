// src/components/screens/Dashboard.jsx 
import React, { useMemo, useState, useEffect, useCallback } from 'react';

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

// Mocking useAppServices hook logic for isolated file readability
const useAppServices = () => ({
    navigate: (screen, params) => console.log(`Navigating to ${screen} with:`, params),
    user: { email: 'executive@leaderreps.com', userId: 'usr-1234' },
    pdpData: MOCK_PDP_DATA,
    planningData: { okrs: [{ id: 1 }, { id: 2 }] },
    commitmentData: MOCK_COMMITMENT_DATA,
    hasPendingDailyPractice: MOCK_COMMITMENT_DATA.active_commitments.some(c => c.status === 'Pending'),
    callSecureGeminiAPI: async (payload) => ({
        candidates: [{ content: { parts: [{ text: 'Focus today on deep listening; practice paraphrasing your colleague\'s needs before offering solutions.' }] } }]
    }),
    hasGeminiKey: () => true,
    GEMINI_MODEL: 'gemini-2.5-flash',
    LEADERSHIP_TIERS: LEADERSHIP_TIERS,
});

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
        LEADERSHIP_TIERS,
    } = useAppServices();

    const safeNavigate = useCallback((screen, params) => {
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

        const sortedTiers = Object.entries(ratings)
        .sort(([, a], [, b]) => a - b);

        const weakestId = sortedTiers[0]?.[0];

        if (!weakestId) return null;

        const meta = LEADERSHIP_TIERS[weakestId];
        return {
        id: weakestId,
        name: meta?.name || 'Unknown',
        rating: ratings[weakestId],
        color: meta?.color || 'bg-red-100 text-red-700',
        icon: AlertTriangle,
        };
    }, [pdpData, LEADERSHIP_TIERS]);

    // --- Daily Time-Saving Brief Analysis ---
    const dailyBrief = useMemo(() => {
        const resilience = commitmentData?.resilience_log || {};
        const todayLog = resilience[Object.keys(resilience).pop()]; // Get last log entry
        const lowEnergy = (todayLog?.energy || 10) < 5;
        
        const tacticalCount = commitmentData?.active_commitments?.filter(c => c.linkedTier && ['T1', 'T2'].includes(c.linkedTier)).length || 0;
        const totalCount = commitmentData?.active_commitments?.length || 1;
        const drift = tacticalCount / totalCount;
        
        const currentTheme = pdpData?.plan?.find(p => p.month === pdpData.currentMonth)?.theme || 'Mastering Foundation';
        
        let status = 'GREEN';
        let message = `You are **strategically aligned**. Today's focus is on reinforcing ${currentTheme}.`;
        
        if (drift >= 0.7) {
            status = 'ORANGE';
            message = `**GOAL DRIFT WARNING!** You have too many tactical tasks. Prioritize T5 Vision goals immediately.`;
        }
        if (lowEnergy && status !== 'ORANGE') {
            status = 'AMBER';
            message = `**RESILIENCE ALERT!** Low energy detected. Focus on T1 self-care and protect deep work time.`;
        }
        
        // Mock Content Preview: One-sentence takeaway from the weakest tier content
        const contentPreview = `Tip: Practice the **2-Minute Rule** from Atomic Habits for immediate impact on your weakest area.`;

        return { status, message, contentPreview };

    }, [commitmentData, pdpData]);


    // --- Daily Tip (Gemini) ---
    const [tipLoading, setTipLoading] = useState(false);
    const [tipHtml, setTipHtml] = useState('');

    const getDailyTip = useCallback(async () => {
        if (!hasGeminiKey()) {
        setTipHtml(await mdToHtml('>⚠️ **AI Coach Unavailable.** Set API Key in App Settings.'));
        return;
        }
        setTipLoading(true);
        try {
        const prompt = `Give a concise, actionable leadership practice for the day (3 sentences max).
        If the user's weakest skill is ${weakestTier?.name || 'General Leadership'}, focus the tip on that area.
        Tone: encouraging, strategic, direct.`;

        const payload = { contents: [{ parts: [{ text: prompt }] }] };
        const resp = await callSecureGeminiAPI(payload);
        const text = extractGeminiText(resp) || 'No strategic guidance available right now.';
        setTipHtml(await mdToHtml(text));
        } catch (e) {
        setTipHtml(await mdToHtml(`**Error:** Failed to fetch tip. (Check console for details)`));
        } finally {
        setTipLoading(false);
        }
    }, [weakestTier, callSecureGeminiAPI, hasGeminiKey]);

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

        {/* --- 1. EXECUTIVE TIME-SAVING BRIEF --- */}
        <Card 
            title="Personalized Daily Briefing: At-a-Glance Status" 
            icon={Target} 
            accent={dailyBrief.status === 'ORANGE' ? 'ORANGE' : dailyBrief.status === 'AMBER' ? 'AMBER' : 'TEAL'}
            className="shadow-2xl border-4 border-dashed"
        >
            <p className={`text-lg font-extrabold mb-3 ${dailyBrief.status === 'ORANGE' ? 'text-[#E04E1B]' : 'text-[#002E47]'}`}>
                {dailyBrief.message}
            </p>
            <div className='p-3 rounded-lg bg-gray-50 border border-gray-200'>
                 <p className='text-xs font-semibold text-[#47A88D] mb-1 flex items-center'><BookOpen className='w-3 h-3 mr-1'/> Today's Contextual Learning:</p>
                 <p className='text-sm text-gray-700 italic'>{dailyBrief.contentPreview}</p>
            </div>
        </Card>


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

        {/* Main grid: 1/3 (Focus) | 2/3 (Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">

            {/* Left Column (Focus & Nudge) */}
            <div className="space-y-8 lg:col-span-1">

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
                        onClick={() => safeNavigate('prof-dev-plan')}
                        className='text-[#47A88D] font-bold text-sm mt-4 block underline hover:text-[#002E47]'
                    >
                        Review Deep Dive Content &rarr;
                    </button>
                </div>
                )}

                {/* Daily Tip (Gemini) - Enhanced for Nudge Feel */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/95 relative group">
                {/* Subtle background glow on hover */}
                <div className='absolute inset-0 rounded-2xl bg-[#47A88D] opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none'></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-[#002E47]">
                    <Target size={20} className='text-[#47A88D]' /> Strategic Nudge
                    </h2>
                    <button
                    className="rounded-full border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100 flex items-center gap-1 transition-colors"
                    onClick={getDailyTip}
                    disabled={tipLoading}
                    type="button"
                    >
                    {tipLoading ? <Loader size={16} className='animate-spin text-gray-500' /> : <ClockIcon size={16} className='text-gray-500' />}
                    Refresh
                    </button>
                </div>
                
                {/* FIX: Styled container for the AI prose to look more intentional */}
                <div className={`p-4 rounded-xl bg-gray-50 border border-gray-100 mt-3 shadow-inner`}>
                    <div className="prose prose-sm max-w-none relative z-10">
                        {tipHtml
                        ? <div dangerouslySetInnerHTML={{ __html: tipHtml }} />
                        : <p className="text-gray-600 text-sm">Tap Refresh to get short, powerful guidance from your AI Coach.</p>}
                    </div>
                </div>
                </div>
            </div>


            {/* Right Column (Executive Action Hub) */}
            <div className="lg:col-span-2 space-y-8">

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

                {/* EXECUTIVE ACTION HUB (Consolidated) */}
                <div className='rounded-2xl border border-gray-200 bg-[#F7FCFF] p-6 shadow-2xl'>
                    <h2 className="text-2xl font-bold text-[#002E47] mb-5 border-b pb-3 border-gray-200">Executive Action Hub</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* CORE ACTIONS */}
                        <Button
                            icon={Zap}
                            title="QuickStart Accelerator"
                            onClick={() => safeNavigate('quick-start-accelerator')}
                            variant='primary'
                            className='bg-[#47A88D] hover:bg-[#349881]'
                        >
                            <Zap className='w-5 h-5 mr-1'/> Accelerator
                        </Button>
                        <Button
                            icon={Briefcase}
                            title="Development Plan"
                            onClick={() => safeNavigate('prof-dev-plan')}
                            variant='primary'
                            className='bg-[#47A88D] hover:bg-[#349881]'
                        >
                            <Briefcase className='w-5 h-5 mr-1'/> Dev Plan
                        </Button>
                        <Button
                            icon={ClockIcon}
                            title="Daily Scorecard"
                            onClick={() => safeNavigate('daily-practice')}
                            variant='primary'
                            className='bg-[#47A88D] hover:bg-[#349881]'
                        >
                            <ClockIcon className='w-5 h-5 mr-1'/> Daily Scorecard
                        </Button>
                        <Button
                            icon={Mic}
                            title="Coaching Lab"
                            onClick={() => safeNavigate('coaching-lab')}
                            variant='primary'
                            className='bg-[#47A88D] hover:bg-[#349881]'
                        >
                            <Mic className='w-5 h-5 mr-1'/> Coaching Lab
                        </Button>
                        {/* RESOURCE HUBS */}
                        <Button
                            icon={Star}
                            title="Executive Reflection"
                            onClick={() => safeNavigate('reflection')}
                            variant='primary'
                            className='bg-[#47A88D] hover:bg-[#349881]'
                        >
                            <Star className='w-5 h-5 mr-1'/> Reflection
                        </Button>
                        <Button
                            icon={TrendingUp}
                            title="Planning Hub"
                            onClick={() => safeNavigate('planning-hub')}
                            variant='primary'
                            className='bg-[#47A88D] hover:bg-[#349881]'
                        >
                            <TrendingUp className='w-5 h-5 mr-1'/> Planning Hub
                        </Button>
                        <Button
                            icon={BookOpen}
                            title="Business Readings"
                            onClick={() => safeNavigate('business-readings')}
                            variant='primary'
                            className='bg-[#47A88D] hover:bg-[#349881]'
                        >
                            <BookOpen className='w-5 h-5 mr-1'/> Readings
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </div> // FIX: This closing div was missing or misplaced, causing the EOF error.
    );
};

export default DashboardScreen;