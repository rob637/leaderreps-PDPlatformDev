// src/components/screens/Dashboard.jsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { signOut } from 'firebase/auth';

// --- MOCK IMPORTS for self-contained file ---
// The actual file paths cannot be resolved in this environment.
// We mock the necessary context and utility functions locally.

const LEADERSHIP_TIERS = {
    'T1': { id: 'T1', name: 'Self-Awareness', icon: 'Target', color: 'bg-blue-100 text-blue-700' },
    'T2': { id: 'T2', name: 'Communication', icon: 'Mic', color: 'bg-cyan-100 text-cyan-700' },
    'T3': { id: 'T3', name: 'Execution', icon: 'Briefcase', color: 'bg-green-100 text-green-700' },
    'T4': { id: 'T4', name: 'People Dev', icon: 'Users', color: 'bg-yellow-100 text-yellow-700' },
    'T5': { id: 'T5', name: 'Vision', icon: 'TrendingUp', color: 'bg-red-100 text-red-700' },
};

const MOCK_PDP_DATA = {
    currentMonth: 4,
    // Mocked data showing T2 (Communication) as the weakest link (3/10)
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
    // Simple markdown simulation for sandbox environment
    let html = md.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    // FIX: Refine blockquote style for a cleaner look
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
  TrendingDown, // Added for negative trend indicator
} from 'lucide-react';

/* ---------------------------------------
   Small UI helpers
----------------------------------------*/
// Refined Stat Card for high impact - Now includes a Trend Mock
const StatCard = ({ icon: Icon, label, value, onClick, colorClass = 'bg-emerald-100 text-emerald-700', trend = 0 }) => {
    const trendIcon = trend > 0 ? TrendingUp : TrendingDown;
    const trendColor = trend > 0 ? 'text-[#47A88D]' : trend < 0 ? 'text-[#E04E1B]' : 'text-gray-500';
    
    return (
        <button
            className="flex items-center gap-4 p-5 rounded-2xl bg-white hover:bg-gray-50 transition border border-gray-200 shadow-lg text-left w-full transform hover:scale-[1.01] duration-150 relative overflow-hidden"
            onClick={onClick}
            type="button"
        >
            {/* Subtle gradient flash on hover */}
            <div className='absolute inset-0 bg-white/5 opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none'></div>

            <div className={`p-3 rounded-xl ${colorClass} flex-shrink-0`}>
                <Icon size={24} />
            </div>
            <div className="flex-1">
                <div className="text-sm font-medium text-gray-500">{label}</div>
                <div className="text-2xl font-bold text-[#002E47] mt-0.5">{value}</div>
                {/* NEW: Simple Trend Indicator */}
                <div className={`text-xs font-semibold mt-1 flex items-center gap-1 ${trendColor}`}>
                    {trend !== 0 ? <span className='opacity-80'><span className='font-bold'>{Math.abs(trend)}%</span> vs. Last QTR</span> : 'Status Quo'}
                    {trend !== 0 ? <div className={`p-1 rounded-full ${trend > 0 ? 'bg-[#47A88D]/10' : 'bg-[#E04E1B]/10'}`}><span className='block leading-none'><trendIcon size={14} /></span></div> : null}
                </div>
            </div>
            <CornerRightUp className="text-gray-400 flex-shrink-0" size={20} />
        </button>
    );
};

// Action Tile - Minimalist and polished
const Tile = ({ icon: Icon, title, desc, onClick, primary = false }) => (
  <button
    className={`w-full text-left p-4 rounded-xl border-b-2 border-l-2 shadow-sm transition-all duration-200 ${
        primary 
        ? 'bg-[#47A88D] text-white border-[#3C937A] hover:bg-[#3C937A]'
        : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-lg'
    }`}
    onClick={onClick}
    type="button"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${primary ? 'bg-white/20' : 'bg-[#47A88D]/10'}`}>
        <Icon size={20} className={primary ? 'text-white' : 'text-[#47A88D]'} />
      </div>
      <h3 className={`font-extrabold text-lg ${primary ? 'text-white' : 'text-[#002E47]'}`}>{title}</h3>
    </div>
    <p className={`text-sm mt-1 ml-11 ${primary ? 'text-white/80' : 'text-gray-600'}`}>{desc}</p>
  </button>
);

// Progress Summary KMI Card
const ProgressKMI = ({ title, value, icon: Icon, colorClass = 'text-[#47A88D]' }) => (
    <div className="flex items-center space-x-4 p-4 rounded-xl bg-white shadow-sm border border-gray-100 transition-all duration-300 animate-in fade-in-0 hover:shadow-lg hover:ring-2 ring-opacity-20 ring-[#47A88D]">
        <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 flex-shrink-0`}>
            <Icon size={20} className={colorClass} />
        </div>
        <div className='truncate'>
            <p className="text-sm text-gray-500 font-medium truncate">{title}</p>
            <p className={`text-xl font-extrabold ${colorClass} mt-0.5`}>{value}</p>
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

  // --- Data Calculations ---
  const goalsCount = useMemo(() => pdpData?.currentMonth || 0, [pdpData]);
  const plansCount = useMemo(() => planningData?.okrs?.length || 0, [planningData]);
  const commitsCount = useMemo(() => commitmentData?.active_commitments?.length || 0, [commitmentData]);
  const completedCommitsCount = useMemo(() => 17, []); // Mocked

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
    // Base background color adjusted
    <div className="p-6 space-y-8 bg-gray-100 min-h-screen">
      {/* Header with improved styling */}
      <div className="border-b border-gray-200 pb-5 bg-white p-6 -mx-6 -mt-6 mb-8 rounded-b-xl shadow-md">
        <h1 className="text-4xl font-extrabold text-[#002E47] flex items-center gap-3">
          <Home size={32} className="text-[#47A88D]" /> Executive Dashboard
        </h1>
        <p className="text-gray-600 text-base mt-2">
          Welcome back, <span className="font-semibold text-[#002E47]">{user?.email ? user.email.split('@')[0] : 'Leader'}</span>. Your strategic overview for today.
        </p>
      </div>

      {/* Top Stats - With Trend Mocking */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
            icon={Briefcase}
            label="Development Plan Progress"
            value={goalsCount > 0 ? `${pdpData?.currentMonth || 1} / 24 Months` : 'Start Now'}
            onClick={() => navigate('prof-dev-plan')}
            colorClass='bg-[#002E47]/10 text-[#002E47]'
            trend={12} // Mock: 12% increase
        />
        <StatCard
            icon={CalendarClock}
            label="Daily Commitments Due"
            value={commitsCount}
            onClick={() => navigate('daily-practice')}
            colorClass={hasPendingDailyPractice ? 'bg-[#E04E1B]/20 text-[#E04E1B] animate-pulse' : 'bg-[#47A88D]/20 text-[#47A88D]'}
            trend={-4} // Mock: 4% decrease
        />
        <StatCard
            icon={Trello}
            label="Objectives (OKRs) Drafted"
            value={plansCount}
            onClick={() => navigate('planning-hub')}
            colorClass='bg-indigo-100 text-indigo-700'
            trend={25} // Mock: 25% increase
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
                    onClick={() => navigate('prof-dev-plan')}
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
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 mt-3">
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

            {/* EXECUTIVE ACTION HUB (Consolidated) */}
            <div className='rounded-2xl border border-gray-200 bg-[#F7FCFF] p-6 shadow-2xl'>
                <h2 className="text-2xl font-bold text-[#002E47] mb-5 border-b pb-3 border-gray-200">Executive Action Hub</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CORE ACTIONS */}
                    <Tile
                        icon={Zap}
                        title="QuickStart Accelerator"
                        desc="Start your journey. Use AI to draft your first Development Plan goals in minutes."
                        onClick={() => navigate('quick-start-accelerator')}
                        primary={true}
                    />
                    <Tile
                        icon={Briefcase}
                        title="Development Plan"
                        desc="Manage your long-term goals, milestones, and define success criteria."
                        onClick={() => navigate('prof-dev-plan')}
                    />
                    <Tile
                        icon={ClockIcon}
                        title="Daily Scorecard"
                        desc="Capture practice reps, reflect on your day, and track momentum towards commitments."
                        onClick={() => navigate('daily-practice')}
                    />
                    <Tile
                        icon={Mic}
                        title="Coaching Lab"
                        desc="Practice crucial conversations and leadership scenarios using AI simulation."
                        onClick={() => navigate('coaching-lab')}
                    />
                    {/* RESOURCE HUBS */}
                    <Tile
                        icon={Star}
                        title="Executive Reflection"
                        desc="Analyze your aggregated practice data, goal trends, and leadership growth patterns."
                        onClick={() => navigate('reflection')}
                    />
                    <Tile
                        icon={TrendingUp}
                        title="Planning Hub (OKRs)"
                        desc="Draft Objectives and Key Results, set vision, and run pre-mortem risk audits."
                        onClick={() => navigate('planning-hub')}
                    />
                    <Tile
                        icon={BookOpen}
                        title="Business Readings"
                        desc="Curated articles, book summaries, and insights for sharp, informed decisions."
                        onClick={() => navigate('business-readings')}
                    />
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
      </div>
    </div>
  );
};

export default DashboardScreen;
