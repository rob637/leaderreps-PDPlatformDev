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
    
    // Sort history by date descending
    const sortedHistory = [...validHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let yesterday = new Date();
    // Start checking from yesterday backwards (to see if today's score is done)
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
          if (committed === total && total > 0) {
            streak++;
          } else {
            break; // Found an incomplete day, streak ends
          }
        }
      } else {
        break; // No log for this day, break streak
      }
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

    const buttonStyle = {
        background: defaultColor, 
        boxShadow: `0 4px 0px 0px ${defaultAccent}, 0 6px 12px rgba(0,0,0,0.2)`,
        transition: 'all 0.1s ease-out',
        transform: 'translateY(0px)',
    };
    
    const getBoxShadow = (offset) => `0 ${offset}px 0px 0px ${defaultAccent}, 0 ${offset + 2}px ${offset * 2}px rgba(0,0,0,0.2)`;

    return (
        <button
            {...rest}
            onClick={onClick}
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
    const trendIcon = trend > 0 ? TrendingUp : TrendingDown;
    const trendColor = trend > 0 ? COLORS.TEAL : trend < 0 ? COLORS.ORANGE : COLORS.MUTED;
    const isPrimary = label === "Daily Commitments Due"; 
    
    // Determine card accent based on importance/context
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
                            <span className='block leading-none'><trendIcon size={14} /></span>
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
    // Determine the color for the Daily Ring (Red if pending, Green if perfect)
    const dailyColor = commitsDue > 0 ? COLORS.ORANGE : COLORS.TEAL;
    
    // Scale factor for the viewBox to center rings (36 36 is 100% circle circumference)
    const viewBoxSize = 36;
    const radius = 15.9155;
    
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
  if (Array(parts)) {
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
    // NOTE: Merging mock data to simulate complex service output
    const pdpData = svcPdpData || MOCK_PDP_DATA;
    const commitmentData = svcCommitmentData || MOCK_COMMITMENT_DATA;
    const planningData = svcPlanningData || MOCK_PLANNING_DATA; 
    
    const TIER_MAP = svcLEADERSHIP_TIERS || LEADERSHIP_TIERS;

    // FIX 1: Robust User Name determination
    const displayedUserName = useMemo(() => {
        if (user?.name) {
            return user.name;
        }
        if (user?.email) {
            // Capitalize the part of the email before the @
            const emailName = user.email.split('@')[0];
            return emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }
        return 'Leader';
    }, [user?.name, user?.email]);
    
    // NEW FIX: Determine the Greeting based on the mock 'firstLogin' property
    const greeting = useMemo(() => {
        // Mocking: If user?.firstLogin is false/null, treat as a new user.
        if (user?.firstLogin) { 
            return 'Welcome back,';
        }
        return 'Welcome,';
    }, [user?.firstLogin]);


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
    const okrs = useMemo(() => planningData?.okrs || MOCK_PLANNING_DATA.okrs, [planningData]);
    const commitsTotal = useMemo(() => commitmentData?.active_commitments?.length || 0, [commitmentData]);
    const commitsCompleted = useMemo(() => commitmentData?.active_commitments?.filter(c => c.status === 'Committed').length || 0, [commitmentData]);
    const commitsDue = commitsTotal - commitsCompleted;
    
    // NEW KPI CALCULATIONS
    const perfectStreak = useMemo(() => calculateStreak(commitmentData?.history || []), [commitmentData?.history]);
    const longestHeldOKR = useMemo(() => {
        const longest = okrs.reduce((max, okr) => (okr.daysHeld > max.daysHeld ? okr : max), { daysHeld: 0, objective: 'N/A' });
        return { days: longest.daysHeld, objective: longest.objective };
    }, [okrs]);
    const lastPreMortemDate = useMemo(() => {
        const dateString = planningData?.last_premortem_decision || '2025-01-01'; // Default if none run
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }, [planningData?.last_premortem_decision]);
    
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
    
    // MOCK: Tier Mastery Projection (from ExecutiveReflection.jsx logic)
    const tierMasteryProjection = useMemo(() => {
        const dailySuccessRate = 68; // Mocked rate from ExecReflection logic
        return Math.round(180 - dailySuccessRate * 1.5); // Example calculation
    }, []);

    // --- Daily Tip (Gemini) ---
    const [tipLoading, setTipLoading] = useState(false);
    // NEW: tipContent holds the *plain text* of the current tip (either AI or local)
    const [tipContent, setTipContent] = useState('Tap "Next Nudge" for your first strategic focus point.'); 
    const [tipHtml, setTipHtml] = useState('');

    // CRITICAL FIX: Initial AI fetch on load
    const getInitialAITip = useCallback(async () => {
        if (!hasGeminiKey()) return;
        
        setTipLoading(true);
        try {
            const weakestSkill = weakestTier?.name || 'General Leadership';
            const prompt = `Give a concise, actionable leadership practice for the day (3 sentences max). Focus the tip explicitly on improving the skill: ${weakestSkill}. Tone: encouraging, strategic, direct.`;

            const payload = { contents: [{ parts: [{ text: prompt }] }] };
            const resp = await callSecureGeminiAPI(payload);
            const text = extractGeminiText(resp) || LOCAL_NUDGES[0]; // Fallback to local if API is blank
            
            // Store the initial AI tip and display it
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
    }, [weakestTier, callSecureGeminiAPI, hasGeminiKey]);

    // CRITICAL FIX: Instant and Randomized Next Nudge
    const nextNudge = useCallback(async () => {
        let nextTip = '';
        if (tipLoading) return;

        // Start with AI's tip if available, otherwise use local nudges
        const availableNudges = TIP_CACHE.lastAITip ? [TIP_CACHE.lastAITip, ...LOCAL_NUDGES] : LOCAL_NUDGES;
        
        // Ensure the new tip is different from the current one (if possible)
        let attempts = 0;
        do {
            const newIndex = Math.floor(Math.random() * availableNudges.length);
            nextTip = availableNudges[newIndex];
            attempts++;
        } while (nextTip === tipContent && attempts < 5); 

        setTipContent(nextTip);
        setTipHtml(await mdToHtml(nextTip));

    }, [tipContent, tipLoading]);

    // Initial load effects
    useEffect(() => {
        getInitialAITip();
    }, [getInitialAITip]);


    return (
        <div className={`p-6 space-y-8 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
        {/* Header with enhanced Personalization */}
        <div className={`border-b border-gray-200 pb-5 bg-[${COLORS.OFF_WHITE}] p-6 -mx-6 -mt-6 mb-8 rounded-b-xl shadow-md`}>
            <h1 className={`text-4xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3`}>
            <Home size={32} style={{ color: COLORS.TEAL }} /> Executive Dashboard
            </h1>
            <p className="text-gray-600 text-base mt-2">
            {greeting} <span className={`font-semibold text-[${COLORS.NAVY}]`}>{displayedUserName}</span>. Your primary focus is **{weakestTier?.name || 'Getting Started'}**.
            </p>
        </div>
        
        {/* --- DEDICATED PDP ROADMAP HIGHLIGHT (FIX 1: HEADER SIZE & BORDER) --- */}
        <Card onClick={() => safeNavigate('prof-dev-plan')} className="w-full shadow-2xl hover:shadow-3xl border-4 border-[#7C3AED]">
            <h2 className="text-3xl font-extrabold text-[#002E47] mb-6 border-b-2 pb-4 border-gray-300 flex items-center gap-3">
                <Map size={28} className='text-[#7C3AED]'/> My Executive Roadmap
            </h2>
            <p className="text-sm text-gray-700 mb-4">
                Your **Personalized Development Plan (PDP)** is designed to close your skill gaps. Track your progress below and hit your monthly learning targets.
            </p>
            <div className="grid grid-cols-3 gap-4">
                <div className='p-3 rounded-xl bg-[#002E47]/5 border border-gray-200'>
                    <p className='text-xs font-medium text-gray-600'>Current Month</p>
                    <p className='text-xl font-extrabold text-[#002E47] mt-1'>{goalsCount} / 24</p>
                </div>
                <div className='p-3 rounded-xl bg-[#002E47]/5 border border-gray-200'>
                    <p className='text-xs font-medium text-gray-600'>Weakest Tier Focus</p>
                    <p className='text-xl font-extrabold text-[#E04E1B] mt-1'>{weakestTier?.name || 'N/A'}</p>
                </div>
                 <div className='p-3 rounded-xl bg-[#002E47]/5 border border-gray-200'>
                    <p className='text-xs font-medium text-gray-600'>Tier Mastery Projection</p>
                    <p className='text-xl font-extrabold text-[#47A88D] mt-1'>{tierMasteryProjection} Days</p>
                </div>
            </div>
             <Button onClick={() => safeNavigate('prof-dev-plan')} variant='primary' className='mt-4 w-full'>
                <Briefcase className='w-5 h-5 mr-2'/> Go to Development Plan Tracker
            </Button>
        </Card>
        {/* --- END PDP ROADMAP HIGHLIGHT --- */}


        {/* --- MAIN GRID CONTAINER --- */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Column 1 & 2: ACTION HUBS (Primary User Focus) */}
            <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">

                 {/* 1. LEADER TOOLS & HUBS (REPLACES OLD ACTION HUB) */}
                 <div className='rounded-3xl border-4 border-[#002E47] bg-[#F7FCFF] p-8 shadow-2xl relative'>
                    <h2 className="text-3xl font-extrabold text-[#002E47] mb-6 border-b-2 pb-4 border-gray-300 flex items-center gap-3">
                        <Zap size={28} className='text-[#E04E1B]'/> Leader Tools & Hubs (Core Action)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* Development Plan Button */}
                        <div className='flex flex-col space-y-2'>
                            <ThreeDButton
                                onClick={() => safeNavigate('prof-dev-plan')}
                                color={COLORS.NAVY}
                                accentColor={COLORS.TEAL}
                                className="h-16 flex-row px-3 py-2"
                            >
                                <Briefcase className='w-5 h-5 mr-2'/> 
                                <span className='text-md font-extrabold'>Development Plan</span>
                            </ThreeDButton>
                            <p className='text-xs font-light text-gray-600'>This is a **24-Month Roadmap** designed to close your skill gaps. It uses AI-generated, hyper-personalized content to accelerate executive growth.</p> 
                        </div>

                        {/* Daily Practice Button */}
                         <div className='flex flex-col space-y-2'>
                            <ThreeDButton
                                onClick={() => safeNavigate('daily-practice')} 
                                color={COLORS.NAVY}
                                accentColor={COLORS.TEAL}
                                className="h-16 flex-row px-3 py-2"
                            >
                                <ClockIcon className='w-5 h-5 mr-2'/> 
                                <span className='text-md font-extrabold'>Daily Practice</span>
                            </ThreeDButton>
                            <p className='text-xs font-light text-gray-600'>This **Daily Scorecard** tracks your commitment to non-negotiable leadership micro-habits. Hitting your score is the key to sustained executive growth.</p>
                        </div>

                        {/* Coaching Lab Button */}
                         <div className='flex flex-col space-y-2'>
                            <ThreeDButton
                                onClick={() => safeNavigate('coaching-lab')} 
                                color={COLORS.NAVY}
                                accentColor={COLORS.TEAL}
                                className="h-16 flex-row px-3 py-2" 
                            >
                                <Mic className='w-5 h-5 mr-2'/> 
                                <span className='text-md font-extrabold'>Coaching Lab</span>
                            </ThreeDButton>
                            <p className='text-xs font-light text-gray-600'>**Practice key leadership interactions**, such as crucial conversations, using guided AI tools and receive real-time critique to sharpen your skills.</p>
                        </div>

                        {/* Planning Hub Button */}
                         <div className='flex flex-col space-y-2'>
                            <ThreeDButton
                                onClick={() => safeNavigate('planning-hub')} 
                                color={COLORS.NAVY}
                                accentColor={COLORS.TEAL}
                                className="h-16 flex-row px-3 py-2" 
                            >
                                <TrendingUp className='w-5 h-5 mr-2'/> 
                                <span className='text-md font-extrabold'>Planning Hub</span>
                            </ThreeDButton>
                            <p className='text-xs font-light text-gray-600'>This hub helps you transform abstract ideas into **actionable, accountable goals**. You can build a clear Vision, draft measurable OKRs, and vet high-stakes decisions with AI audit tools.</p>
                        </div>
                        
                    </div>
                </div>

                 {/* 2. RESOURCES & COMMUNITY (NEW SECTION) */}
                 <div className='rounded-3xl border-4 border-[#47A88D] bg-[#F7FCFF] p-8 shadow-2xl relative'>
                    <h2 className="text-3xl font-extrabold text-[#002E47] mb-6 border-b-2 pb-4 border-gray-300 flex items-center gap-3">
                        <Users size={28} className='text-[#47A88D]'/> Resources & Community (Engagement)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        
                        {/* Applied Leadership Button */}
                        <div className='flex flex-col space-y-2'>
                            <ThreeDButton
                                onClick={() => safeNavigate('applied-leadership')} 
                                color={COLORS.TEAL}
                                accentColor={COLORS.NAVY}
                                className="h-16 flex-row px-3 py-2 lg:col-span-1" 
                            >
                                <Lightbulb className='w-5 h-5 mr-2'/> 
                                <span className='text-md font-extrabold'>Applied Leadership</span>
                            </ThreeDButton>
                            <p className='text-xs font-light text-gray-600'>Access micro-habits and **AI coaching tailored to your specific industry**, identity, or high-stakes operational context for high-leverage guidance.</p>
                        </div>

                        {/* Business Readings Button */}
                        <div className='flex flex-col space-y-2'>
                            <ThreeDButton
                                onClick={() => safeNavigate('business-readings')} 
                                color={COLORS.TEAL}
                                accentColor={COLORS.NAVY}
                                className="h-16 flex-row px-3 py-2 lg:col-span-1" 
                            >
                                <BookOpen className='w-5 h-5 mr-2'/> 
                                <span className='text-md font-extrabold'>Business Readings</span>
                            </ThreeDButton>
                            <p className='text-xs font-light text-gray-600'>A curated library of business book flyers with key frameworks, executive summaries, and **AI-driven commitment plans** to simplify learning.</p>
                        </div>

                        {/* Community & Peer Support Button */}
                        <div className='flex flex-col space-y-2 lg:col-span-2'>
                            <ThreeDButton
                                onClick={() => safeNavigate('community')} 
                                color={COLORS.TEAL}
                                accentColor={COLORS.NAVY}
                                className="h-16 flex-row px-3 py-2" 
                            >
                                <CommunityIcon className='w-5 h-5 mr-2'/> 
                                <span className='text-md font-extrabold'>Community & Peer Support</span>
                            </ThreeDButton>
                            <p className='text-xs font-light text-gray-600'>**Connect with executive peers** for advice, discuss difficult scenarios, and access the Mentorship Network for one-on-one guidance.</p>
                        </div>
                        
                    </div>
                </div>


                {/* 3. TOP STATS CARDS (Below Action Hubs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* NEW KPI 1: Perfect Score Streak */}
                    <StatCard
                        icon={Star}
                        label="Current Perfect Score Streak"
                        value={`${perfectStreak} Days`}
                        onClick={() => safeNavigate('daily-practice')}
                        trend={perfectStreak >= 3 ? 5 : 0} 
                        colorHex={COLORS.GREEN}
                    />

                    {/* NEW KPI 2: Weakest PDP Tier */}
                    <StatCard
                        icon={AlertTriangle}
                        label="Weakest PDP Tier Score"
                        value={`${weakestTier?.name || 'T-X'} (${weakestTier?.rating}/10)`}
                        onClick={() => safeNavigate('prof-dev-plan')}
                        trend={-12} 
                        colorHex={COLORS.ORANGE}
                    />
                    
                    {/* NEW KPI 3: Longest Held OKR */}
                    <StatCard
                        icon={Archive}
                        label="Longest-Held OKR"
                        value={`${longestHeldOKR.days} Days (${longestHeldOKR.objective})`}
                        onClick={() => safeNavigate('planning-hub')}
                        trend={5} 
                        colorHex={COLORS.NAVY}
                    />
                    
                    {/* NEW KPI 4: Last Pre-Mortem Audit Date */}
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
                        <LayoutDashboard size={24} className='text-[#002E47]'/> Key Progress Indicators
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className={`flex items-center space-x-4 p-4 rounded-xl bg-[${COLORS.OFF_WHITE}] shadow-sm border border-gray-100 transition-all duration-300 animate-in fade-in-0 hover:shadow-lg hover:ring-2 ring-opacity-20 ring-[${COLORS.TEAL}]`}>
                            <div className={`p-3 rounded-xl bg-opacity-10 flex-shrink-0`} style={{ background: COLORS.TEAL + '1A'}}>
                                <CheckCircle size={20} style={{ color: COLORS.TEAL }} />
                            </div>
                            <div className='truncate'>
                                <p className="text-sm text-gray-500 font-medium truncate">Commits Completed (Total)</p>
                                <p className={`text-xl font-extrabold mt-0.5`} style={{ color: COLORS.TEAL }}>{commitsCompleted} of {commitsTotal}</p>
                            </div>
                        </div>
                        <div className={`flex items-center space-x-4 p-4 rounded-xl bg-[${COLORS.OFF_WHITE}] shadow-sm border border-gray-100 transition-all duration-300 animate-in fade-in-0 hover:shadow-lg hover:ring-2 ring-opacity-20 ring-[${COLORS.ORANGE}]`}>
                            <div className={`p-3 rounded-xl bg-opacity-10 flex-shrink-0`} style={{ background: COLORS.ORANGE + '1A'}}>
                                <Target size={20} style={{ color: COLORS.ORANGE }} />
                            </div>
                            <div className='truncate'>
                                <p className="text-sm text-gray-500 font-medium truncate">Leadership Tier Focus</p>
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
                                <p className="text-sm text-gray-500 font-medium truncate">PDP Months Remaining</p>
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
                
                <div className='absolute inset-0 rounded-2xl' style={{ background: `${weakestTier?.hex || COLORS.TEAL}1A`, opacity: 0.1 }}></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h2 className={`text-xl font-bold flex items-center gap-2`} style={{color: weakestTier?.hex || COLORS.NAVY}}>
                    <Target size={20} className={`text-white p-1 rounded-full`} style={{backgroundColor: weakestTier?.hex || COLORS.TEAL}}/> 
                    {weakestTier?.name || 'T-X'} Strategy Focus
                    </h2>
                    <button
                    className="rounded-full border border-gray-200 px-3 py-1 text-sm hover:bg-gray-100 flex items-center gap-1 transition-colors"
                    onClick={nextNudge} // CRITICAL FIX: Calls fast, local randomizer
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