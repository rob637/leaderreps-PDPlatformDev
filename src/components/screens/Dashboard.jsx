// src/components/screens/Dashboard.jsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';

// --- ICONS ---
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
  MessageSquare
} from 'lucide-react';


/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  BG: '#FFFFFF',
  SURFACE: '#FFFFFF',
  BORDER: '#1F2937',
  SUBTLE: '#E5E7EB',
  TEXT: '#0F172A',
  MUTED: '#4B5563',
  NAVY: '#0B3B5B', // Deep Navy
  TEAL: '#219E8B', // Leadership Teal
  BLUE: '#2563EB',
  ORANGE: '#E04E1B', // High-Impact Orange
  GREEN: '#10B981',
  AMBER: '#F59E0B',
  RED: '#EF4444',
  LIGHT_GRAY: '#FCFCFA'
};


// --- MOCK IMPORTS for self-contained file ---
// The actual file paths cannot be resolved in this environment.
// We mock the necessary context and utility functions locally.

const LEADERSHIP_TIERS = {
    'T1': { id: 'T1', name: 'Self-Awareness', icon: 'HeartPulse', color: 'bg-blue-100 text-blue-700' },
    'T2': { id: 'T2', name: 'Communication', icon: 'Mic', color: 'bg-cyan-100 text-cyan-700' },
    'T3': { id: 'T3', name: 'Execution', icon: 'Briefcase', color: 'bg-green-100 text-green-700' },
    'T4': { id: 'T4', name: 'People Dev', icon: 'Users', color: 'bg-yellow-100 text-yellow-700' },
    'T5': { id: 'T5', name: 'Vision', icon: 'TrendingUp', color: 'bg-red-100 text-red-700' },
};

const MOCK_PDP_DATA = {
    currentMonth: 4,
    assessment: { selfRatings: { T1: 8, T2: 3, T3: 6, T4: 7, T5: 5 } }
};
const MOCK_COMMITMENT_DATA = { active_commitments: [{ id: 1, status: 'Pending' }] };

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
    html = html.replace(/>\s*(.*)/gim, `<div class="mt-2 text-base text-gray-800 border-l-4 pl-3 italic" style="border-left-color: ${COLORS.TEAL};">“$1”</div>`);
    return Promise.resolve(html);
}
// --- END MOCK IMPORTS ---

/* ---------------------------------------
   UI Components (Standardized)
----------------------------------------*/
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#1C8D7C] focus:ring-[${COLORS.TEAL}]/50`; }
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
      className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300 text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />

      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: '#F3F4F6' }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </Tag>
  );
};

const StatCard = ({ icon: Icon, label, value, onClick, colorHex = COLORS.GREEN, trend = 0 }) => {
    const trendIcon = trend > 0 ? TrendingUp : TrendingDown;
    const trendColor = trend > 0 ? COLORS.TEAL : trend < 0 ? COLORS.ORANGE : COLORS.MUTED;
    const isPrimary = label === "Daily Commitments Due"; // Special style for key metric
    
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
    <div className="flex items-center space-x-4 p-4 rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300 animate-in fade-in-0 hover:shadow-lg hover:ring-2 ring-opacity-20 ring-[#47A88D]">
        <div className={`p-3 rounded-xl bg-opacity-10 flex-shrink-0`} style={{ background: colorHex + '1A'}}>
            <Icon size={20} style={{ color: colorHex }} />
        </div>
        <div className='truncate'>
            <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
            <p className={`text-xl font-extrabold mt-0.5`} style={{ color: colorHex }}>{value}</p>
        </div>
    </div>
);

/* ---------------------------------------
   Gemini helper: extract text robustly
----------------------------------------*/
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
    // FIX: Removed useSafeNavigate function and now get 'navigate' directly from the hook.
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

    // FIX: Implement a simple navigate wrapper that uses the hook's navigate function
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
        <div className="p-8 space-y-8 bg-gray-100 min-h-screen">
        {/* Header with improved styling */}
        <div className="border-b border-gray-200 pb-5" style={{ background: COLORS.LIGHT_GRAY, borderRadius: 12 }}>
            <h1 className="text-4xl font-extrabold text-[#0B3B5B] flex items-center gap-3">
            <Home size={32} style={{ color: COLORS.TEAL }} /> Executive Dashboard
            </h1>
            <p className="text-gray-600 text-base mt-2">
            Welcome back, <span className="font-semibold text-[#0B3B5B]">{user?.email ? user.email.split('@')[0] : 'Leader'}</span>. Your strategic overview for today.
            </p>
        </div>

        {/* Top Stats - With Trend Mocking */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
                icon={Briefcase}
                label="PDP Progress"
                value={goalsCount > 0 ? `${pdpData?.currentMonth || 1} / 24 Months` : 'Start Now'}
                onClick={() => safeNavigate('prof-dev-plan')}
                colorHex={COLORS.NAVY}
                trend={12} // Mock: 12% increase
            />
            <StatCard
                icon={ClockIcon}
                label="Daily Commitments Due"
                value={commitsCount}
                onClick={() => safeNavigate('daily-practice')}
                colorHex={hasPendingDailyPractice ? COLORS.ORANGE : COLORS.TEAL}
                trend={-4} // Mock: 4% decrease
            />
            <StatCard
                icon={Trello}
                label="Active OKRs Drafted"
                value={plansCount}
                onClick={() => safeNavigate('planning-hub')}
                colorHex={COLORS.BLUE}
                trend={25} // Mock: 25% increase
            />
        </div>

        {/* Main grid: 1/3 (Focus) | 2/3 (Actions) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">

            {/* Left Column (Focus & Nudge) */}
            <div className="space-y-8 lg:col-span-1">

                {/* AI Skill Gap Highlight Card */}
                {weakestTier && (
                <Card 
                    title="Development Focus" 
                    icon={AlertTriangle}
                    accent={weakestTier.rating < 5 ? 'ORANGE' : 'TEAL'}
                    className={`rounded-2xl border-4 border-dashed p-6 shadow-xl transition-all duration-300`} 
                    style={{ border: `4px dashed ${weakestTier.rating < 5 ? COLORS.ORANGE : COLORS.TEAL}`, background: weakestTier.rating < 5 ? COLORS.ORANGE + '1A' : COLORS.TEAL + '1A' }}
                >
                    <div className='flex items-center justify-between mb-4 -mt-3'>
                        <span className={`px-4 py-1 text-sm font-bold rounded-full text-white shadow-md`} style={{ background: weakestTier.rating < 5 ? COLORS.ORANGE : COLORS.TEAL }}>
                            Score: {weakestTier.rating}/10
                        </span>
                    </div>
                    <p className='text-md font-semibold text-[#0B3B5B]'>
                        Your primary growth area is currently **{weakestTier.name}** ({weakestTier.id}).
                    </p>
                    <p className='text-sm text-gray-600 mt-2'>
                        All personalized content is weighted toward this skill to accelerate impact.
                    </p>
                    <Button
                        onClick={() => safeNavigate('prof-dev-plan')}
                        variant='outline'
                        className='text-sm mt-4 block'
                    >
                        Review Deep Dive Content &rarr;
                    </Button>
                </Card>
                )}

                {/* Daily Tip (Gemini) - Enhanced for Nudge Feel */}
                <Card title="Strategic Nudge" icon={Target} accent='NAVY' className="transition-all duration-300 hover:shadow-2xl hover:bg-white/95 relative group">
                
                <div className="flex items-center justify-between mb-4 relative z-10 -mt-3">
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
                
                {/* Styled container for the AI prose to look more intentional */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 mt-3">
                    <div className="prose prose-sm max-w-none relative z-10">
                        {tipHtml
                        ? <div dangerouslySetInnerHTML={{ __html: tipHtml }} />
                        : <p className="text-gray-600 text-sm">Tap Refresh to get short, powerful guidance from your AI Coach.</p>}
                    </div>
                </div>
                </Card>
            </div>


            {/* Right Column (Executive Action Hub) */}
            <div className="lg:col-span-2 space-y-8">

                {/* PROGRESS SNAPSHOT (KMI Focus) */}
                <Card title="Key Progress Indicators" icon={LayoutDashboard} accent='TEAL'>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProgressKMI
                            title="Commits Completed (Total)"
                            value={completedCommitsCount}
                            icon={CalendarClock}
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
                </Card>
                
                {/* EXECUTIVE ACTION HUB (Consolidated) */}
                <Card title="Executive Action Hub" icon={MessageSquare} accent='ORANGE' className='shadow-2xl'>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* CORE ACTIONS */}
                        <Button
                            icon={Zap}
                            onClick={() => safeNavigate('quick-start-accelerator')}
                            variant='primary'
                        >
                            <Zap className='w-5 h-5 mr-1'/> Accelerator
                        </Button>
                        <Button
                            icon={Briefcase}
                            onClick={() => safeNavigate('prof-dev-plan')}
                            variant='primary'
                        >
                            <Briefcase className='w-5 h-5 mr-1'/> Dev Plan
                        </Button>
                        <Button
                            icon={ClockIcon}
                            onClick={() => safeNavigate('daily-practice')}
                            variant='primary'
                        >
                            <ClockIcon className='w-5 h-5 mr-1'/> Daily Scorecard
                        </Button>
                        <Button
                            icon={Mic}
                            onClick={() => safeNavigate('coaching-lab')}
                            variant='primary'
                        >
                            <Mic className='w-5 h-5 mr-1'/> Coaching Lab
                        </Button>
                        {/* RESOURCE HUBS */}
                        <Button
                            icon={TrendingUp}
                            onClick={() => safeNavigate('planning-hub')}
                            variant='primary'
                        >
                            <TrendingUp className='w-5 h-5 mr-1'/> Planning Hub
                        </Button>
                        <Button
                            icon={BookOpen}
                            onClick={() => safeNavigate('business-readings')}
                            variant='primary'
                        >
                            <BookOpen className='w-5 h-5 mr-1'/> Readings
                        </Button>
                        <Button
                            icon={Star}
                            onClick={() => safeNavigate('reflection')}
                            variant='primary'
                        >
                            <Star className='w-5 h-5 mr-1'/> Reflection
                        </Button>
                    </div>
                </Card>


            </div>
        </div>
        </div>
    );
};

export default DashboardScreen;