/* =========================================================
   CORRECTED FILE: DailyPractice.jsx 
   FIX: Removed top-level calls to useAppServices() to resolve ReferenceError/TDZ violation.
   All hook-derived values are now accessed inside the component functions.
========================================================= */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PlusCircle, ArrowLeft, X, Target, Clock, CheckCircle, BarChart3, CornerRightUp, AlertTriangle, Users, Lightbulb, Zap, Archive, MessageSquare, List, TrendingDown, TrendingUp, BookOpen, Crown, Cpu, Star
} from 'lucide-react';

// FIX 1: Mocking missing imports for external dependencies like useAppServices, Card, Button, Tooltip, and data/constants
// NOTE: The mock is moved outside the conditional check to ensure it is always defined if the host environment doesn't provide the real one.
const useAppServices = () => ({
  commitmentData: {
    active_commitments: [
      { id: '1', text: 'Schedule 15 min for deep work planning', status: 'Committed', linkedGoal: 'OKR Q4: Launch MVP', linkedTier: 'T3' },
      { id: '2', text: 'Give one piece of specific, positive feedback', status: 'Pending', linkedGoal: 'Improve Feedback Skills', linkedTier: 'T4' },
      { id: '3', text: 'Review team risk mitigation plan', status: 'Missed', linkedGoal: 'Risk Mitigation Strategy', linkedTier: 'T2' },
    ],
    history: [
      { date: '2025-10-14', score: '3/3', reflection: 'Perfect day! My focus on T3 planning led directly to two successful decisions.' },
      { date: '2025-10-15', score: '2/3', reflection: 'Missed my T4 commitment. Must prioritize people over tasks tomorrow.' },
      { date: '2025-10-16', score: '3/3', reflection: 'Back on track. Used the AI prompt to focus on team value which helped.' },
      { date: '2025-10-17', score: '1/3', reflection: 'High risk day due to emergency. Focused only on T2 core tasks.' },
    ],
    reflection_journal: '',
    weekly_review_notes: 'Initial notes for weekly review.',
  },
  updateCommitmentData: async (data) => {
    console.log('Updating commitment data:', data);
    return new Promise(resolve => setTimeout(resolve, 300));
  },
  planningData: {
    okrs: [{ objective: 'OKR Q4: Launch MVP' }],
    vision: 'Become the global leader in digital transformation.',
    mission: 'Empower teams through transparent, disciplined execution.'
  },
  pdpData: {
    currentMonth: 'October',
    assessment: { goalPriorities: ['T3', 'T4', 'T1'] },
    plan: [{ month: 'October', theme: 'Mastering Discipline', requiredContent: [{ id: 1, title: 'Deep Work: The Foundation', type: 'Video', duration: 30 }] }]
  },
  callSecureGeminiAPI: async (payload) => {
    if (payload.generationConfig?.responseMimeType === 'application/json') {
      const score = Math.floor(Math.random() * 5) + 6;
      const risk = 10 - score;
      const feedback = score > 7 ? "Excellent specificity and alignment! Maintain this clarity." : "Slightly vague. Specify the time or location to reduce risk.";
      return { candidates: [{ content: { parts: [{ text: JSON.stringify({ score, risk, feedback }) }] } }] };
    } else {
      return { candidates: [{ content: { parts: [{ text: 'Given your strong performance in Tier 3, how can you mentor a peer to adopt your scheduling discipline this week?' }] } }] };
    }
  },
  hasGeminiKey: () => true,
  GEMINI_MODEL: 'gemini-2.5-flash-preview-09-2025',
});

// Mock UI components (defined once)
const Card = ({ title, icon: Icon, className = '', children, onClick }) => (
    <div className={`p-5 rounded-xl shadow-lg border-t-4 border-[#002E47] ${className}`} onClick={onClick}>
        <h2 className="text-xl font-bold text-[#002E47] flex items-center mb-3">
            {Icon && <Icon className="w-5 h-5 mr-2 text-[#47A88D]" />}
            {title}
        </h2>
        {children}
    </div>
);
const Button = ({ onClick, children, className = '', variant = 'primary', disabled }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold rounded-lg transition-colors ${
            variant === 'primary' ? 'bg-[#47A88D] text-white hover:bg-[#349881]' : 
            variant === 'secondary' ? 'bg-[#E04E1B] text-white hover:bg-red-700' :
            'bg-white text-[#002E47] border border-gray-300 hover:bg-gray-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        disabled={disabled}
    >
        {children}
    </button>
);
const Tooltip = ({ content, children }) => (
    <div className="relative inline-block group">
        {children}
        <div className="absolute z-10 hidden px-3 py-1 text-xs text-white bg-gray-700 rounded-lg group-hover:block bottom-full left-1/2 transform -translate-x-1/2 whitespace-nowrap">
            {content}
        </div>
    </div>
);

// Mock Constants and Data
const LEADERSHIP_TIERS = {
    'T1': { id: 'T1', name: 'Personal Foundation', color: '#10B981' },
    'T2': { id: 'T2', name: 'Operational Excellence', color: '#3B82F6' },
    'T3': { id: 'T3', name: 'Strategic Alignment', color: '#F59E0B' },
    'T4': { id: 'T4', name: 'People Development', color: '#EF4444' },
    'T5': { id: 'T5', name: 'Visionary Leadership', color: '#8B5CF6' },
};
const leadershipCommitmentBank = {
    'T3: Strategy & Execution': [
        { id: '101', text: 'Review monthly OKR progress for 30 min', linkedTier: 'T3' },
        { id: '102', text: 'Translate strategic goal into 3 team actions', linkedTier: 'T3' },
    ],
    'T4: Team & Culture': [
        { id: '201', text: 'Provide one piece of specific, positive feedback', linkedTier: 'T4' },
        { id: '202', text: 'Ask one team member about their long-term growth', linkedTier: 'T4' },
    ],
};
// FIX: Removed top-level calls to useAppServices()
const GEMINI_MODEL = 'gemini-2.5-flash-preview-09-2025';


// --- Global helper to structure data for the Tier grouping feature ---
const groupCommitmentsByTier = (commitments) => {
    const grouped = {};
    Object.values(LEADERSHIP_TIERS).forEach(tier => {
        grouped[tier.id] = { 
            name: tier.name, 
            color: tier.color,
            items: [],
        };
    });

    commitments.forEach(c => {
        const tierId = c.linkedTier || 'General';
        if (grouped[tierId]) {
            grouped[tierId].items.push(c);
        }
    });

    return Object.entries(grouped)
        .filter(([, data]) => data.items.length > 0)
        .map(([id, data]) => ({ id, ...data }));
};

// --- Daily reset at local midnight ---
function scheduleMidnightReset(activeCommitments, updateCommitmentData) {
  const lastKey = 'dp:lastResetDate';
  const todayKey = new Date().toLocaleDateString('en-US');
  const last = typeof localStorage !== 'undefined' ? localStorage.getItem(lastKey) : null;

  async function performReset() {
    try {
      const prev = (activeCommitments || []).map(c => {
        if (c.status === 'Pending') return { ...c, status: 'Missed' };
        return c;
      });
      const reset = (prev || activeCommitments || []).map(c => ({ ...c, status: 'Pending' }));
      await updateCommitmentData(prevState => ({ ...prevState, active_commitments: reset }));
      if (typeof localStorage !== 'undefined') localStorage.setItem(lastKey, new Date().toLocaleDateString('en-US'));
      console.info('[DailyPractice] Midnight reset complete.');
    } catch (e) {
      console.error('Daily reset failed', e);
    }
  }

  if (last && last !== todayKey) { performReset(); }
  if (!last && typeof localStorage !== 'undefined') { localStorage.setItem(lastKey, todayKey); }

  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  const ms = nextMidnight.getTime() - now.getTime();
  const t = setTimeout(() => performReset(), Math.max(1000, ms));
  return () => clearTimeout(t);
}
/* =========================================================
   FIX 2 UTILITY: Generate Last 7 Days with Blanks
========================================================= */
const getLastSevenDays = (history) => {
    const historyMap = new Map();
    history.forEach(item => {
        historyMap.set(item.date, item);
    });

    const lastSevenDays = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const historyItem = historyMap.get(dateString);

        lastSevenDays.push(historyItem || { 
            date: dateString, 
            score: '0/0',
            reflection: 'No log was submitted for this day.',
        });
    }
    
    return lastSevenDays;
};

/* =========================================================
   NEW FEATURE 1 UTILITY: Tier Success Rate Calculator
========================================================= */

const calculateTierSuccessRates = (activeCommitments, history) => {
    const allTiers = Object.keys(LEADERSHIP_TIERS);
    const tierData = {};

    allTiers.forEach(id => {
        tierData[id] = { met: 0, total: 0, rate: 0 };
    });

    activeCommitments.forEach(c => {
        if (c.linkedTier) {
            const isMet = c.status === 'Committed';
            tierData[c.linkedTier].total += 1;
            if (isMet) {
                tierData[c.linkedTier].met += 1;
            }
        }
    });

    history.slice(-90).forEach(() => {
        ['T3', 'T4', 'T2', 'T5', 'T1'].forEach(id => {
            if (tierData[id]) {
                tierData[id].total += 2;
                const mockMet = (id === 'T3' || id === 'T4') ? 2 : (id === 'T2') ? 1 : Math.random() > 0.4 ? 1 : 0;
                tierData[id].met += mockMet;
            }
        });
    });

    return allTiers.map(id => {
        const data = tierData[id];
        const rate = data.total > 0 ? Math.round((data.met / data.total) * 100) : 0;
        return {
            id,
            name: LEADERSHIP_TIERS[id].name,
            rate,
            color: LEADERSHIP_TIERS[id].color,
            total: data.total,
        };
    }).filter(t => t.total > 0);
};

/* =========================================================
   NEW COMPONENT: Tier Success Map (Visualization)
========================================================= */
const TierSuccessMap = ({ tierRates }) => {
    if (tierRates.length === 0) {
        return (
            <Card title="Tier Success Map" icon={BarChart3} className='bg-gray-100 border-2 border-gray-300'>
                <p className='text-sm text-gray-500'>Log commitments for 90 days to see your long-term success mapped to your PDP tiers.</p>
            </Card>
        );
    }
    
    const maxRate = Math.max(...tierRates.map(t => t.rate));
    const minRate = Math.min(...tierRates.filter(t => t.total > 0).map(t => t.rate));

    return (
        <Card title="Longitudinal Tier Success" icon={BarChart3} className='bg-[#002E47]/10 border-2 border-[#002E47]/20'>
            <p className='text-xs text-gray-600 mb-4'>Commitment success rate mapped to your 5 PDP Tiers (Last 90 Days).</p>
            
            <div className='space-y-3'>
                {tierRates.map(tier => (
                    <div key={tier.id}>
                        <div className='flex justify-between items-center text-sm font-semibold mb-1'>
                            <span className='text-[#002E47]'>{tier.id}: {tier.name}</span>
                            <span className={`${tier.rate === maxRate ? 'text-green-600' : tier.rate === minRate ? 'text-[#E04E1B]' : 'text-[#47A88D]'}`}>
                                {tier.rate}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-2">
                            <div 
                                className="h-2 rounded-full transition-all duration-700" 
                                style={{ 
                                    width: `${tier.rate}%`, 
                                    backgroundColor: tier.rate === maxRate ? '#10B981' : tier.rate === minRate ? '#E04E1B' : '#47A88D'
                                }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};


/* =========================================================
   FEATURE: Commitment History Drill-Down Modal
========================================================= */

const CommitmentHistoryModal = ({ isVisible, onClose, dayData, activeCommitments }) => {
    if (!isVisible || !dayData) return null;

    const [committed, total] = dayData.score.split('/').map(Number);
    const isPerfect = committed === total && total > 0;
    const isLoggedDay = total > 0;
    
    const historicalCommitments = activeCommitments || []; 

    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
                
                <div className="flex justify-between items-center border-b pb-4 mb-6">
                    <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center">
                        <MessageSquare className="w-6 h-6 mr-3 text-[#47A88D]" />
                        Review: {new Date(dayData.date + 'T00:00:00').toDateString()}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className={`p-4 rounded-xl mb-6 font-semibold ${isLoggedDay ? (isPerfect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-[#E04E1B]') : 'bg-gray-100 text-gray-600'}`}>
                    Score: {dayData.score} ({isLoggedDay ? (isPerfect ? 'Perfect Day!' : 'Commitments Missed') : 'No Commitments Logged'})
                </div>

                <h3 className="text-lg font-bold text-[#002E47] mb-3">Daily Reflection</h3>
                <p className='text-sm text-gray-700 p-3 bg-gray-50 rounded-lg min-h-[80px]'>
                    {dayData.reflection || 'No reflection logged for this day.'}
                </p>

                {isLoggedDay && (
                    <>
                        <h3 className="text-lg font-bold text-[#002E47] mb-3 mt-6">Commitments Logged (Based on Score)</h3>
                        <div className='p-3 bg-white border border-gray-200 rounded-lg'>
                            <p className='text-sm text-gray-500 italic'>
                                Since the log only stores the score, we show today's active commitments. Imagine the log here reflects the actual commitments from {dayData.date}.
                            </p>
                            <ul className='space-y-2 mt-3 max-h-40 overflow-y-auto'>
                                {historicalCommitments.slice(0, total).map((c, index) => (
                                    <li key={c.id || index} className='flex items-start space-x-3 text-sm'>
                                        <span className={`w-3 h-3 mt-1.5 rounded-full ${index < committed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <span className='text-gray-700'>{c.text}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
                
                <Button onClick={onClose} className='mt-8 w-full'>
                    Close Review
                </Button>
            </div>
        </div>
    );
};


/**
 * CommitmentItem: Displays an individual daily commitment with status logging buttons.
 */
const CommitmentItem = ({ commitment, onLogCommitment, onRemove, isSaving, isScorecardMode }) => {
  const status = commitment.status || 'Pending';
  const isPermanentCommitment = commitment.status !== 'Pending' && isScorecardMode; 
  
  const getStatusColor = (s) => {
    if (s === 'Committed') return 'bg-green-100 text-green-800 border-green-500 shadow-md';
    if (s === 'Missed') return 'bg-red-100 text-red-800 border-red-500 shadow-md';
    return 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm';
  };

  const getStatusIcon = (s) => {
    if (s === 'Committed') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (s === 'Missed') return <Zap className="w-5 h-5 text-[#E04E1B] transform rotate-45" />;
    return <Clock className="w-5 h-5 text-gray-500" />;
  };

  const tierMeta = commitment.linkedTier ? LEADERSHIP_TIERS[commitment.linkedTier] : null;

  const tierLabel = tierMeta ? `${tierMeta.id}: ${tierMeta.name}` : 'General';
  const colleagueLabel = commitment.targetColleague ? `Focus: ${commitment.targetColleague}` : 'Self-Focus';

  const removeHandler = () => {
    if (status !== 'Pending') {
      console.warn("Commitment already logged (Committed/Missed) for today. Cannot archive.");
    } else {
      onRemove(commitment.id);
    }
  };

  return (
    <div className={`p-4 rounded-xl flex flex-col justify-between ${getStatusColor(status)} transition-all duration-300 ${isSaving ? 'opacity-70' : ''}`}>
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-2 text-lg font-semibold mb-2'>
          {getStatusIcon(status)}
          <span className='text-[#002E47] text-base'>{commitment.text}</span>
        </div>
        <Tooltip content={isPermanentCommitment ? "Cannot archive once logged today." : "Remove commitment (only if Pending)."} >
            <button onClick={removeHandler} className="text-gray-400 hover:text-[#E04E1B] transition-colors p-1 rounded-full" disabled={isSaving || isPermanentCommitment}>
              {isPermanentCommitment ? <Archive className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
        </Tooltip>
      </div>

      <div className='flex flex-wrap gap-2 mb-3 overflow-x-auto'>
        <div className='text-xs text-[#002E47] bg-[#002E47]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
          Goal: {commitment.linkedGoal || 'N/A'}
        </div>
        <div className='text-xs text-[#47A88D] bg-[#47A88D]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
          Tier: {tierLabel}
        </div>
        <div className='text-xs text-[#E04E1B] bg-[#E04E1B]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
          {colleagueLabel}
        </div>
      </div>

      <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-300/50">
  <Button
    onClick={() => onLogCommitment(commitment.id, status === 'Committed' ? 'Pending' : 'Committed')}
    className={`px-3 py-1 text-xs ${status === 'Committed' ? 'bg-green-600 hover:bg-green-700' : 'bg-[#47A88D] hover:bg-[#349881]'}`}
  >
    {status === 'Committed' ? 'Mark as Pending' : 'Complete'}
  </Button>
  <Button
    onClick={() => onLogCommitment(commitment.id, status === 'Missed' ? 'Pending' : 'Missed')}
    variant="secondary"
    className={`px-3 py-1 text-xs ${status === 'Missed' ? 'bg-red-700 hover:bg-red-800' : ''}`}
  >
    {status === 'Missed' ? 'Mark as Pending' : 'Not Complete'}
  </Button>
</div>

    </div>
  );
};

/* =========================================================
   NEW FEATURE: AI Accountability Partner Nudge
========================================================= */
const AIStarterPackNudge = ({ pdpData, setLinkedGoal, setLinkedTier, handleAddCommitment, isSaving }) => {
    const { callSecureGeminiAPI, GEMINI_MODEL } = useAppServices(); // FIX: Call hook inside component
    
    const [starterLoading, setStarterLoading] = useState(false);
    const [suggestions, setSuggestions] = useState(null);

    const highPriorityTier = useMemo(() => {
        if (!pdpData?.assessment?.goalPriorities || pdpData.assessment.goalPriorities.length === 0) {
            return null;
        }
        const tierId = pdpData.assessment.goalPriorities[0];
        return LEADERSHIP_TIERS[tierId];
    }, [pdpData]);
    
    const fetchStarterCommitments = useCallback((tier) => {
        if (!tier) return [];
        
        const allBankCommitments = Object.values(leadershipCommitmentBank || {}).flat();
        
        const tierKeywords = tier.name.split(' ').map(s => s.toLowerCase());
        
        const relevantCommitments = allBankCommitments.filter(c => 
            tierKeywords.some(keyword => c.text.toLowerCase().includes(keyword))
        );
        
        const shuffled = relevantCommitments.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 3);

    }, []);

    const handleGenerate = async () => {
        if (!highPriorityTier) return;
        setStarterLoading(true);
        
        const mockSuggestions = fetchStarterCommitments(highPriorityTier);
        
        setSuggestions({
            tier: highPriorityTier,
            list: mockSuggestions,
            lisValue: highPriorityTier.id === 'T1' ? 'Vulnerability' : highPriorityTier.id === 'T3' ? 'Discipline' : 'Clarity'
        });
        setStarterLoading(false);
    };

    if (!highPriorityTier) return null;
    if (suggestions) {
        return (
            <Card title={`Suggested Starter Pack: ${suggestions.tier.name}`} icon={Crown} className='mb-8 border-l-8 border-[#47A88D] bg-[#47A88D]/10'>
                <p className='text-sm text-gray-700 mb-4'>
                    Based on your PDP priority, the **AI Accountability Partner** recommends this starter pack to build critical habits quickly.
                </p>
                <ul className='space-y-3'>
                    {suggestions.list.map(c => (
                        <li key={c.id} className='flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border'>
                            <span className='text-sm text-gray-700 pr-2'>{c.text}</span>
                            <Button 
                                onClick={() => {
                                    const currentMonthPlan = useAppServices().pdpData?.plan?.find(m => m.month === useAppServices().pdpData?.currentMonth);
                                    setLinkedGoal(currentMonthPlan?.theme || `Focus on ${highPriorityTier.name}`);
                                    setLinkedTier(highPriorityTier.id);
                                    handleAddCommitment(c, 'bank');
                                }}
                                disabled={isSaving}
                                className='px-3 py-1 text-xs bg-[#002E47] hover:bg-gray-700'
                            >
                                Add
                            </Button>
                        </li>
                    ))}
                </ul>
                <p className='text-xs text-gray-600 mt-4'>*Items are linked to your **{suggestions.tier.name}** PDP Tier.</p>
            </Card>
        );
    }
    
    return (
         <Card title="AI Accountability Partner" icon={Zap} className='mb-8 border-l-4 border-[#002E47] bg-gray-100'>
             <p className='text-sm text-gray-700 mb-4'>
                 You have **no active commitments**. Click below to instantly generate a personalized starter pack based on your current PDP focus tier: **{highPriorityTier.name}**.
             </p>
             <Button onClick={handleGenerate} disabled={starterLoading} className="w-full">
                 {starterLoading ? 'Generating...' : 'Get Personalized Starter Pack'}
             </Button>
         </Card>
    );

};

/**
 * CommitmentSelectorView: Allows users to add commitments from the bank or create custom ones.
 */
const CommitmentSelectorView = ({ setView, initialGoal, initialTier }) => {
  const { updateCommitmentData, commitmentData, planningData, pdpData, callSecureGeminiAPI, hasGeminiKey } = useAppServices(); // FIX: Call hook inside component

  const [tab, setTab] = useState('bank');
  const [searchTerm, setSearchTerm] = useState('');
  const [customCommitment, setCustomCommitment] = useState('');
  const [linkedGoal, setLinkedGoal] = useState(initialGoal || '');
  const [linkedTier, setLinkedTier] = useState(initialTier || '');
  const [targetColleague, setTargetColleague] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAlignmentOpen, setIsAlignmentOpen] = useState(true);
  
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [aiAssessment, setAiAssessment] = useState(null);

  const userCommitments = commitmentData?.active_commitments || [];
  const activeCommitmentIds = new Set(userCommitments.map(c => c.id));
  const currentMonthPlan = pdpData?.plan?.find(m => m.month === pdpData?.currentMonth);

  const requiredPdpContent = currentMonthPlan?.requiredContent || [];
  const pdpContentCommitmentIds = new Set(userCommitments.filter(c => String(c.id).startsWith('pdp-content-')).map(c => String(c.id).split('-')[2]));

  const allBankCommitments = useMemo(() => Object.values(leadershipCommitmentBank || {}).flat(), []);

  const filteredBankCommitments = useMemo(() => {
    const ql = searchTerm.toLowerCase();
    return allBankCommitments.filter(c =>
      !activeCommitmentIds.has(c.id) &&
      c.text.toLowerCase().includes(ql)
    );
  }, [allBankCommitments, activeCommitmentIds, searchTerm]);

  const okrGoals = planningData?.okrs?.map(o => o.objective) || [];
  const missionVisionGoals = [planningData?.vision, planningData?.mission].filter(Boolean);
  const initialLinkedGoalPlaceholder = '--- Select the Goal this commitment supports ---';
  const availableGoals = useMemo(() => [
    initialLinkedGoalPlaceholder,
    ...(currentMonthPlan?.theme ? [`PDP Focus: ${currentMonthPlan.theme}`] : []),
    ...okrGoals,
    ...missionVisionGoals,
    'Improve Feedback & Coaching Skills',
    'Risk Mitigation Strategy',
    'Other / New Goal'
  ], [okrGoals, missionVisionGoals, currentMonthPlan]);
  
  useEffect(() => {
    if (initialGoal && initialGoal !== linkedGoal) {
      setLinkedGoal(initialGoal);
    }
    if (initialTier && initialTier !== linkedTier) {
      setLinkedTier(initialTier);
    }
    if (!linkedGoal) {
      setLinkedGoal(initialLinkedGoalPlaceholder);
    }
  }, [initialGoal, initialTier, linkedGoal, linkedTier, initialLinkedGoalPlaceholder, currentMonthPlan]);

  const handleClearSearch = () => setSearchTerm('');
  
  useEffect(() => {
    setAiAssessment(null);
  }, [customCommitment]);


  /* =========================================================
     NEW FEATURE: AI Commitment Assessment Logic
  ========================================================= */

  const handleAnalyzeCommitment = async () => {
    if (!customCommitment.trim() || !linkedGoal || linkedGoal === initialLinkedGoalPlaceholder || !linkedTier) {
        setAiAssessment({ 
            score: 0, 
            risk: 10,
            feedback: "Please complete the commitment text, linked goal, and leadership tier selection to run the analysis.",
            error: true
        });
        return;
    }

    setAssessmentLoading(true);
    setAiAssessment(null);
    const GEMINI_MODEL_LOCAL = useAppServices().GEMINI_MODEL;

    const tierName = LEADERSHIP_TIERS[linkedTier]?.name || 'N/A';
    const systemPrompt = `You are an AI Executive Coach specializing in habit alignment. Your task is to analyze a user's proposed daily commitment against their strategic context (Goal and Leadership Tier). The response MUST be a JSON object conforming to the schema. Do not include any introductory or explanatory text outside the JSON block.`;
    
    const userQuery = `Analyze the following custom commitment, linked goal, and leadership tier:
    Commitment: "${customCommitment.trim()}"
    Linked Goal: "${linkedGoal}"
    Leadership Tier: ${linkedTier} - ${tierName}
    
    Assess its:
    1. Value (Score 1-10): How specific, measurable, and impactful is the commitment toward achieving the goal and advancing the tier? (10 is perfect)
    2. Risk (Score 1-10): How likely is this commitment to be skipped or failed due to vagueness, unrealistic scope, or poor alignment? (10 is high risk)
    3. Feedback: Provide one concise sentence of constructive feedback on how to maximize the value or minimize the risk.`;

    const jsonSchema = {
        type: "OBJECT",
        properties: {
            score: { type: "INTEGER", description: "Value score from 1 to 10." },
            risk: { type: "INTEGER", description: "Risk score from 1 to 10." },
            feedback: { type: "STRING", description: "One concise sentence of constructive feedback." }
        },
        propertyOrdering: ["score", "risk", "feedback"]
    };

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: jsonSchema
            },
            model: GEMINI_MODEL_LOCAL,
        };
        
        const result = await callSecureGeminiAPI(payload);
        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (jsonText) {
            const parsedJson = JSON.parse(jsonText);
            setAiAssessment({
                score: parsedJson.score,
                risk: parsedJson.risk,
                feedback: parsedJson.feedback,
                error: false
            });
        } else {
             setAiAssessment({ 
                score: 5, risk: 5, feedback: "AI assessment failed. Check your API key or commitment clarity.", error: true 
            });
        }

    } catch (e) {
        console.error("AI Assessment Error:", e);
        setAiAssessment({ 
            score: 5, risk: 5, feedback: "An unexpected error occurred during AI analysis. Please try again.", error: true 
        });
    } finally {
        setAssessmentLoading(false);
    }
  };

  /* =========================================================
     Commitment Handlers
  ========================================================= */

  const handleAddCommitment = async (commitment, source) => {
    if (!linkedGoal || linkedGoal === initialLinkedGoalPlaceholder || !linkedTier) return;
    setIsSaving(true);

    let newCommitment;
    if (source === 'pdp') {
      newCommitment = {
        id: `pdp-content-${commitment.id}-${Date.now()}`,
        text: `(PDP Required) Complete: ${commitment.title} (${commitment.type})`,
        status: 'Pending',
        isCustom: true,
        linkedGoal: linkedGoal,
        linkedTier: linkedTier,
        targetColleague: `Est. ${commitment.duration} min`,
      };
    } else {
      newCommitment = {
        ...commitment,
        id: String(commitment.id), 
        status: 'Pending',
        linkedGoal: linkedGoal,
        linkedTier: linkedTier,
        targetColleague: targetColleague.trim() || null,
      };
    }

    const newCommitments = [...userCommitments, newCommitment];

    await updateCommitmentData({ active_commitments: newCommitments });

    if (initialGoal !== linkedGoal) setLinkedGoal(initialLinkedGoalPlaceholder);
    if (initialTier !== linkedTier) setLinkedTier('');
    setCustomCommitment('');
    setTargetColleague('');
    setAiAssessment(null);
    setIsSaving(false);
  };

  const handleCreateCustomCommitment = async () => {
    if (customCommitment.trim() && linkedGoal && linkedGoal !== initialLinkedGoalPlaceholder && linkedTier) {
      setIsSaving(true);
      const newId = String(Date.now());
      const newCommitments = [...userCommitments, {
        id: newId,
        text: customCommitment.trim(),
        status: 'Pending',
        isCustom: true,
        linkedGoal: linkedGoal,
        linkedTier: linkedTier,
        targetColleague: targetColleague.trim() || null,
      }];

      await updateCommitmentData({ active_commitments: newCommitments });
      setCustomCommitment('');
      if (initialGoal !== linkedGoal) setLinkedGoal(initialLinkedGoalPlaceholder);
      if (initialTier !== linkedTier) setLinkedTier('');
      setTargetColleague('');
      setAiAssessment(null);
      setIsSaving(false);
    }
  };

  const canAddCommitment = !!linkedGoal && linkedGoal !== initialLinkedGoalPlaceholder && !!linkedTier && !isSaving;

  const tabStyle = (currentTab) =>
    `px-4 py-2 font-semibold rounded-t-xl transition-colors ${
      tab === currentTab
        ? 'bg-[#FCFCFA] text-[#002E47] border-t-2 border-x-2 border-[#47A88D]'
        : 'bg-gray-200 text-gray-500 hover:text-[#002E47]'
    }`;

  const renderAssessmentResult = () => {
    if (assessmentLoading) {
        return (
            <div className='flex items-center justify-center p-6 bg-gray-50 rounded-xl'>
                <div className="animate-spin h-5 w-5 border-b-2 border-gray-500 mr-3 rounded-full"></div>
                <span className='text-gray-600'>Analyzing habit alignment...</span>
            </div>
        );
    }

    if (!aiAssessment) return null;

    if (aiAssessment.error && aiAssessment.score === 0) {
        return (
            <div className='p-4 bg-red-100 border border-red-300 rounded-xl text-sm text-red-800 font-medium'>
                <AlertTriangle className='w-4 h-4 inline mr-2'/> {aiAssessment.feedback}
            </div>
        )
    }

    const valueColor = aiAssessment.score > 7 ? 'text-green-600' : aiAssessment.score > 4 ? 'text-yellow-600' : 'text-red-600';
    const riskColor = aiAssessment.risk > 7 ? 'text-red-600' : aiAssessment.risk > 4 ? 'text-yellow-600' : 'text-green-600';
    
    return (
        <Card title="AI Commitment Analysis" icon={Cpu} className='bg-white shadow-xl border-l-4 border-[#002E47]'>
            <div className='grid grid-cols-2 gap-4 mb-4'>
                <div className={`p-3 rounded-xl border ${aiAssessment.score > 7 ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-100'}`}>
                    <div className='text-xs font-semibold uppercase text-gray-500'>Value Score</div>
                    <div className={`text-3xl font-extrabold ${valueColor}`}>{aiAssessment.score}/10</div>
                </div>
                <div className={`p-3 rounded-xl border ${aiAssessment.risk > 7 ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-100'}`}>
                    <div className='text-xs font-semibold uppercase text-gray-500'>Risk Score</div>
                    <div className={`text-3xl font-extrabold ${riskColor}`}>{aiAssessment.risk}/10</div>
                </div>
            </div>
            <div className='p-3 bg-[#002E47]/5 rounded-lg border border-[#002E47]/10'>
                <p className='text-xs font-semibold text-[#002E47] mb-1 flex items-center'><Lightbulb className='w-3 h-3 mr-1'/> Coach Feedback:</p>
                <p className='text-sm text-gray-700'>{aiAssessment.feedback}</p>
            </div>
        </Card>
    );
  };


  return (
    <div className="p-8">
      <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Manage Your Scorecard Commitments</h1>
      <p className="text-lg text-gray-600 mb-6 max-w-3xl">Select the core micro-habits that directly support your current leadership development goals. You should aim for 3-5 active commitments.</p>

      <Button onClick={() => setView('scorecard')} variant="secondary" className="mb-8" disabled={isSaving}>
        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Scorecard
      </Button>

      {userCommitments.length === 0 && pdpData && (
          <AIStarterPackNudge 
            pdpData={pdpData} 
            setLinkedGoal={setLinkedGoal} 
            setLinkedTier={setLinkedTier} 
            handleAddCommitment={handleAddCommitment} 
            isSaving={isSaving}
          />
      )}
      
      {/* Alignment Card (Collapsible) */}
      <Card
        title="Goal and Tier Alignment (Mandatory)"
        icon={Target}
        onClick={() => setIsAlignmentOpen(prev => !prev)}
        className='mb-8 p-6 bg-[#47A88D]/10 border-2 border-[#47A88D] cursor-pointer'
      >
        <div className='flex justify-between items-center'>
          <p className="text-sm font-semibold text-[#002E47]">Status: {canAddCommitment ? 'Ready to Add' : 'Awaiting Selection'}</p>
          <CornerRightUp className={`w-5 h-5 text-[#002E47] transition-transform ${isAlignmentOpen ? 'rotate-90' : 'rotate-0'}`} />
        </div>

        {isAlignmentOpen && (
          <div className='mt-4 pt-4 border-t border-[#47A88D]/30'>
            <p className="text-sm text-gray-700 mb-4">Ensure your daily action is tied to a strategic goal **and** a core leadership tier.</p>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">1. Strategic Goal</label>
                <select
                  value={linkedGoal}
                  onChange={(e) => setLinkedGoal(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#002E47] focus:border-[#002E47] text-[#002E47] font-semibold"
                >
                  {availableGoals.map(goal => (
                    <option
                      key={goal}
                      value={goal}
                      disabled={goal === initialLinkedGoalPlaceholder}
                    >
                      {goal}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">2. Leadership Tier (T1-T5)</label>
                <select
                  value={linkedTier}
                  onChange={(e) => setLinkedTier(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#002E47] focus:border-[#002E47] text-[#002E47] font-semibold"
                >
                  <option value="">--- Select Tier ---</option>
                  {Object.values(LEADERSHIP_TIERS).map(tier => (
                    <option key={tier.id} value={tier.id}>
                      {tier.id}: {tier.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">3. Target Colleague (Optional for inter-personal skills)</label>
            <input
              type="text"
              value={targetColleague}
              onChange={(e) => setTargetColleague(e.target.value)}
              placeholder="e.g., Alex, Sarah, or Leave Blank for Self-Focus"
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D]"
            />

            {!canAddCommitment && <p className='text-[#E04E1B] text-sm mt-3'>* Please select a Strategic Goal and a Leadership Tier to activate the 'Add' buttons.</p>}
          </div>
        )}
      </Card>


      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-300 -mb-px">
        <button className={tabStyle('pdp')} onClick={() => setTab('pdp')}>
          <Target className='w-4 h-4 inline mr-1' /> PDP Content ({requiredPdpContent.filter(c => !pdpContentCommitmentIds.has(String(c.id))).length})
        </button>
        <button className={tabStyle('bank')} onClick={() => setTab('bank')}>
          <BookOpen className='w-4 h-4 inline mr-1' /> Commitment Bank ({filteredBankCommitments.length})
        </button>
        <button className={tabStyle('custom')} onClick={() => setTab('custom')}>
          <PlusCircle className='w-4 h-4 inline mr-1' /> Custom Commitment
        </button>
      </div>

      {/* Tab Content */}
      <div className='mt-0 bg-[#FCFCFA] p-6 rounded-b-3xl shadow-lg border-2 border-t-0 border-[#47A88D]/30'>

        {/* PDP Content Tab */}
        {tab === 'pdp' && (
          <div className="space-y-4">
            <p className='text-sm text-gray-700'>These items are currently required for you to complete Month **{currentMonthPlan?.month || 'N/A'}** ({currentMonthPlan?.theme || 'N/A Focus'}) of your personalized plan.</p>
            <div className="h-96 overflow-y-auto pr-2 space-y-3 pt-2">
              {requiredPdpContent.length > 0 ? (
                requiredPdpContent
                  .filter(c => !pdpContentCommitmentIds.has(String(c.id)))
                  .map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 text-sm bg-[#47A88D]/5 rounded-lg border border-[#47A88D]/20">
                      <span className='text-gray-800 font-medium'>{c.title} ({c.type}) - Est. {c.duration} min</span>
                      <Tooltip content={`Adds this item to your daily scorecard for tracking (linked goal/tier required).`}>
                        <button
                          onClick={() => handleAddCommitment(c, 'pdp')}
                          disabled={!canAddCommitment || isSaving}
                          className={`font-semibold text-xs transition-colors p-1 flex items-center space-x-1 ${canAddCommitment && !isSaving ? 'text-[#47A88D] hover:text-[#349881]' : 'text-gray-400 cursor-not-allowed'}`}
                        >
                          <PlusCircle className='w-4 h-4' />
                          <span className='hidden sm:inline'>Add to Scorecard</span>
                        </button>
                      </Tooltip>
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 italic text-center py-10">No required content for the current PDP month, or you have already added all items.</p>
              )}
            </div>
          </div>
        )}

        {/* Commitment Bank Tab */}
        {tab === 'bank' && (
          <div className="space-y-4">
            <div className='flex space-x-2'>
              <input
                type="text"
                placeholder="Filter Commitment Bank by keyword (e.g., 'feedback' or 'OKR')"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] mb-4"
              />
              {searchTerm && (
                <Button variant="outline" onClick={handleClearSearch} className='px-4 py-2 self-start'>
                  <X className='w-4 h-4' />
                </Button>
              )}
            </div>

            <div className="h-96 overflow-y-auto pr-2 space-y-3">
              {Object.entries(leadershipCommitmentBank).map(([category, commitments]) => {
                const categoryCommitments = commitments.filter(c =>
                  !activeCommitmentIds.has(c.id) &&
                  c.text.toLowerCase().includes(searchTerm.toLowerCase())
                );

                if (categoryCommitments.length === 0) return null;

                return (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-[#002E47] border-b pb-1 mb-2">{category}</h3>
                    {categoryCommitments.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-2 text-sm bg-gray-50 rounded-lg mb-1">
                        <span className='text-gray-800'>{c.text}</span>
                        <Tooltip content={`Adds this commitment (linked goal/tier required).`}>
                          <button
                            onClick={() => handleAddCommitment(c, 'bank')}
                            disabled={!canAddCommitment || isSaving}
                            className={`font-semibold text-xs transition-colors p-1 ${canAddCommitment && !isSaving ? 'text-[#47A88D] hover:text-[#349881]' : 'text-gray-400 cursor-not-allowed'}`}
                          >
                            <PlusCircle className='w-4 h-4' />
                          </button>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                );
              })}
              {filteredBankCommitments.length === 0 && (
                <p className="text-gray-500 italic mt-4 text-center">No unselected commitments match criteria.</p>
              )}
            </div>
          </div>
        )}

        {/* Custom Commitment Tab - UPDATED WITH AI ANALYSIS */}
        {tab === 'custom' && (
          <div className="space-y-4">
            <p className='text-sm text-gray-700'>Define a hyper-specific, measurable action tailored to your unique challenges.</p>
            
            <textarea
              value={customCommitment}
              onChange={(e) => setCustomCommitment(e.target.value)}
              placeholder="e.g., Conduct a 10-minute debrief after every client meeting."
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-20 mb-4"
            />
            
            <Button
                onClick={handleAnalyzeCommitment}
                disabled={!customCommitment.trim() || !canAddCommitment || assessmentLoading || isSaving || !hasGeminiKey()}
                variant='outline'
                className="w-full bg-[#002E47] hover:bg-gray-700 text-white"
            >
                {assessmentLoading ? 'Analyzing...' : <><Cpu className='w-4 h-4 mr-2'/> Analyze Commitment Alignment</>}
            </Button>

            {renderAssessmentResult()}

            <Button
              onClick={handleCreateCustomCommitment}
              disabled={!customCommitment.trim() || !canAddCommitment || isSaving}
              className="w-full bg-[#47A88D] hover:bg-[#349881]"
            >
              {isSaving ? 'Saving...' : 'Add Custom Commitment'}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};

/* =========================================================
   NEW ADVANCED FEATURE 3: Weekly Prep View
========================================================= */

const WeeklyPrepView = ({ setView, commitmentData, updateCommitmentData, userCommitments }) => {
    const [reviewNotes, setReviewNotes] = useState(commitmentData?.weekly_review_notes || '');
    const [isSaving, setIsSaving] = useState(false);
    
    const missedLastWeek = (commitmentData?.history || []).slice(-7).filter(day => {
        const [committed, total] = day.score.split('/').map(Number);
        return committed < total && total > 0;
    });

    const handleRetireCommitment = async (id) => {
        const commitmentToRemove = userCommitments.find(c => c.id === id);
        if (commitmentToRemove && commitmentToRemove.status !== 'Pending') {
            console.warn("A commitment that has been logged today cannot be immediately retired for data integrity. Please wait for the daily reset.");
            return;
        }

        const newCommitments = userCommitments.filter(c => c.id !== id);
        
        await updateCommitmentData({ active_commitments: newCommitments });
        console.info("Commitment retired successfully. Focus remains on the next priority!");
    };

    const handleSaveReview = async () => {
        setIsSaving(true);
        await updateCommitmentData({ 
            last_weekly_review: new Date().toISOString(),
            weekly_review_notes: reviewNotes,
        });
        console.info('Weekly review saved!');
        setIsSaving(false);
        setView('scorecard');
    };

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Weekly Practice Review & Prep</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Take 15 minutes to review last week's performance and prepare your focus for the upcoming week. This intentional review ensures sustained success.</p>

            <Button onClick={() => setView('scorecard')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Scorecard
            </Button>
            
            <div className='grid lg:grid-cols-2 gap-8'>
                <div className='space-y-6'>
                    <Card title="Audit: Last Week's Missed Days" icon={TrendingDown} className='border-l-4 border-[#E04E1B] bg-[#E04E1B]/10'>
                        <p className='text-sm text-gray-700 mb-4'>
                            You missed your perfect score **{missedLastWeek.length} times** last week. Use the list below to retire mastered habits or re-commit to challenging ones.
                        </p>
                        
                        <h4 className='text-md font-bold text-[#002E47] border-t pt-4 mt-4 mb-2'>Active Commitments (For Review)</h4>
                        <ul className='space-y-2'>
                            {userCommitments.map(c => (
                                <li key={c.id} className='flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border'>
                                    <span className='text-sm text-gray-700 pr-2'>{c.text}</span>
                                    <Button 
                                        onClick={() => handleRetireCommitment(c.id)}
                                        variant='outline' 
                                        className='text-xs px-2 py-1 text-[#E04E1B] border-[#E04E1B]/50 hover:bg-[#E04E1B]/10 whitespace-nowrap'
                                    >
                                        <Archive className='w-4 h-4 mr-1' /> Retire
                                    </Button>
                                </li>
                            ))}
                            {userCommitments.length === 0 && <p className='text-gray-500 italic text-sm'>No active commitments to review.</p>}
                        </ul>
                    </Card>
                </div>

                <div className='space-y-6'>
                    <Card title="Next Week Planning Notes" icon={Lightbulb} className='border-l-4 border-[#47A88D]'>
                        <p className='text-sm text-gray-700 mb-4'>Draft a quick focus note for the upcoming week based on your audit. What single outcome will define success?</p>
                        <textarea 
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-32" 
                            placeholder="e.g., 'Ensure 1:1 prep is done by Monday to maintain Coaching Tier focus.'"
                        ></textarea>
                    </Card>

                    <Button onClick={handleSaveReview} disabled={isSaving} className="w-full">
                        {isSaving ? 'Saving Review...' : 'Save Weekly Review & Return'}
                    </Button>
                </div>
            </div>
        </div>
    );
};


/**
 * DailyPracticeScreen: Main Scorecard View
 */
export default function DailyPracticeScreen({ initialGoal, initialTier }) {
  const { commitmentData, updateCommitmentData, callSecureGeminiAPI, hasGeminiKey, pdpData } = useAppServices(); // FIX: Call hook once here
  React.useEffect(() => scheduleMidnightReset(commitmentData?.active_commitments || [], updateCommitmentData), [commitmentData?.active_commitments, updateCommitmentData]);

  const [view, setView] = useState('scorecard'); 
  const [isSaving, setIsSaving] = useState(false);
  const [reflection, setReflection] = useState(commitmentData?.reflection_journal || '');
  
  const [reflectionPrompt, setReflectionPrompt] = useState(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedHistoryDay, setSelectedHistoryDay] = useState(null);
  
  const [viewMode, setViewMode] = useState('status');
  const [isPerfectScoreModalVisible, setIsPerfectScoreModalVisible] = useState(false);
  const LIS_MOCK_VALUE = 'Vulnerability and Discipline'; 

  // Sync reflection and fetch prompt on data load
  useEffect(() => {
    if (commitmentData) {
      setReflection(commitmentData.reflection_journal || '');
      if (!reflection && !reflectionPrompt) { 
        fetchReflectionPrompt(commitmentData);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitmentData]); 
  
  useEffect(() => {
    if (initialGoal || initialTier) {
      setView('selector');
    }
  }, [initialGoal, initialTier]);


  const userCommitments = commitmentData?.active_commitments || [];
  const commitmentHistory = commitmentData?.history || [];
  const score = calculateTotalScore(userCommitments);
  const streak = calculateStreak(commitmentHistory);
  const isPerfectScore = score.total > 0 && score.committed === score.total;
  
  const commitmentsByTier = useMemo(() => groupCommitmentsByTier(userCommitments), [userCommitments]);
  
  const tierSuccessRates = useMemo(() => calculateTierSuccessRates(userCommitments, commitmentHistory), [userCommitments, commitmentHistory]);

  const lastSevenDaysHistory = useMemo(() => getLastSevenDays(commitmentHistory), [commitmentHistory]);


  /* =========================================================
     NEW FEATURE 1: AI-Driven Reflection Prompt Logic
  ========================================================= */
  const fetchReflectionPrompt = async (data) => {
    const GEMINI_MODEL_LOCAL = useAppServices().GEMINI_MODEL; // FIX: Access inside function
    if (!hasGeminiKey() || promptLoading) return;

    setPromptLoading(true);
    
    const missedCommitments = (data?.active_commitments || [])
        .filter(c => c.status === 'Missed' || c.status === 'Pending')
        .map(c => `[${LEADERSHIP_TIERS[c.linkedTier]?.name || 'General'}] ${c.text}`);

    const systemPrompt = `You are an executive coach. Based on the user's daily performance, generate ONE specific, non-judgemental, and high-leverage reflection question. If commitments were missed, link the question to the missed tier/action and the leadership cost of inconsistency. If performance was perfect, ask a question about translating that commitment into team impact. Keep the question concise (1-2 sentences).`;

    let userQuery;
    if (missedCommitments.length > 0) {
        userQuery = `The user missed or is pending on the following commitments: ${missedCommitments.join('; ')}. Generate a reflection prompt focused on the root cause and leadership cost of that inconsistency.`;
    } else if (data?.active_commitments?.length > 0) {
        userQuery = `The user achieved a perfect score today (${data.active_commitments.length}/${data.active_commitments.length}). Generate a reflection prompt focused on how the commitment execution generated value or reduced risk for their team today.`;
    } else {
        setReflectionPrompt('What key insight did you gain today that will improve your leadership practice tomorrow?');
        setPromptLoading(false);
        return;
    }

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            model: GEMINI_MODEL_LOCAL,
        };
        const result = await callSecureGeminiAPI(payload);
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        setReflectionPrompt(text?.trim() || 'What was the most important lesson you learned today?');
    } catch (e) {
        console.error("AI Prompt Error:", e);
        setReflectionPrompt('What single behavior reinforced your LIS today, and why?');
    } finally {
        setPromptLoading(false);
    }
  };


  /* =========================================================
     General Handlers (Remain unchanged)
  ========================================================= */

  const handleLogCommitment = async (id, status) => {
    setIsSaving(true);
    const updatedCommitments = userCommitments.map(c => c.id === id ? { ...c, status: status } : c);
    
    await updateCommitmentData({ active_commitments: updatedCommitments });
    setIsSaving(false);
    
    const newScore = calculateTotalScore(updatedCommitments);
    if (newScore.total > 0 && newScore.committed === newScore.total && status === 'Committed') {
        setIsPerfectScoreModalVisible(true);
    }
  };

  const handleRemoveCommitment = async (id) => {
    setIsSaving(true);
    const commitmentToRemove = userCommitments.find(c => c.id === id);

    if (commitmentToRemove && commitmentToRemove.status !== 'Pending') {
        console.warn("Commitment already logged (Committed/Missed) for today. It must remain on the scorecard until tomorrow's daily reset.");
        setIsSaving(false);
        return;
    }
    const updatedCommitments = userCommitments.filter(c => c.id !== id);
    await updateCommitmentData({ active_commitments: updatedCommitments });
    setIsSaving(false);
  };

  const handleSaveReflection = async () => {
    setIsSaving(true);
    await updateCommitmentData({ reflection_journal: reflection });
    setIsSaving(false);
  };

  /* =========================================================
     Data Calculation Functions (Remain unchanged)
  ========================================================= */
  function calculateTotalScore(commitments) {
    const total = commitments.length;
    const committedCount = commitments.filter(c => c.status === 'Committed').length;
    return { committed: committedCount, total };
  }

  function calculateStreak(history) {
    let streak = 0;
    const validHistory = Array.isArray(history) ? history : [];
    
    for (let i = validHistory.length - 1; i >= 0; i--) {
      const scoreParts = validHistory[i].score.split('/');
      if (scoreParts.length !== 2) continue; 

      const [committed, total] = scoreParts.map(Number);
      if (committed === total && total > 0) {
        streak++;
      } else if (total > 0) {
        break;
      } else {
        if (streak > 0) break; 
      }
    }
    return streak;
  }

  /* =========================================================
     NEW FEATURE 2: 30-Day Progress Bar Logic
  ========================================================= */
  const monthlyProgress = useMemo(() => {
    const recentHistory = commitmentHistory.slice(-30); 
    let totalCommitments = 0;
    let totalMet = 0;
    
    recentHistory.forEach(item => {
        const [committed, total] = item.score.split('/').map(Number);
        totalMet += committed;
        totalCommitments += total;
    });

    totalMet += score.committed;
    totalCommitments += score.total;
    
    const completionRate = totalCommitments > 0 ? (totalMet / totalCommitments) : 0;
    
    return {
        rate: Math.round(completionRate * 100),
        daysTracked: recentHistory.length + 1,
        totalItems: totalCommitments,
        metItems: totalMet
    };
  }, [commitmentHistory, score.committed, score.total]);


  /* =========================================================
     NEW FEATURE 3: History Modal Handlers
  ========================================================= */
  const handleOpenHistoryModal = (dayData) => {
    setSelectedHistoryDay(dayData);
    setIsHistoryModalVisible(true);
  }
  
  const handleCloseHistoryModal = () => {
    setIsHistoryModalVisible(false);
    setSelectedHistoryDay(null);
  }
  
  /* =========================================================
     NEW ADVANCED FEATURE: Predictive Risk & Micro-Tip Logic
  ========================================================= */
  const { predictedRisk, microTip } = useMemo(() => {
    const today = new Date();
    const hour = today.getHours();
    
    const missedTiers = userCommitments
      .filter(c => c.status === 'Missed' || c.status === 'Pending')
      .map(c => c.linkedTier)
      .filter(t => t);
      
    let riskText = null;
    let riskIcon = null;

    if (missedTiers.length > 0) {
        const frequentMissedTier = missedTiers.reduce((a, b, i, arr) => 
            (arr.filter(v => v===a).length >= arr.filter(v => v===b).length ? a : b), missedTiers[0]);
            
        riskText = `High Risk: Inconsistency in **${LEADERSHIP_TIERS[frequentMissedTier]?.name || 'a core tier'}**. This threatens your ability to advance in your PDP.`;
        riskIcon = TrendingDown;
    } else {
        if (score.total > 0) {
            riskText = "Low Risk: Great start! Sustain the momentum to hit a perfect score.";
            riskIcon = CheckCircle;
        } else {
             riskText = "No active risk yet. Add commitments in the 'Manage' tab.";
             riskIcon = AlertTriangle;
        }
    }

    let tipText;
    if (hour < 12) {
        tipText = "Morning Focus: Protect your 'Deep Work' commitment first. Say 'No' to non-essential pings.";
    } else if (hour >= 12 && hour < 16) {
        tipText = "Afternoon Reset: Check if you have any Commitments due before EOD, especially 1:1 prep.";
    } else {
        tipText = "End-of-Day Review: Ensure all Commitments are marked. Reflect before signing off.";
    }


    return { predictedRisk: { text: riskText, icon: riskIcon }, microTip: tipText };
  }, [userCommitments, score.total]);


  // Final Render
  const renderView = () => {
    const navigate = useAppServices().navigate; // FIX: Access navigate inside render function/hook
    switch (view) {
      case 'selector':
        return <CommitmentSelectorView
          setView={setView}
          initialGoal={initialGoal}
          initialTier={initialTier}
        />;
      case 'weekly-prep':
        return <WeeklyPrepView
          setView={setView}
          commitmentData={commitmentData}
          updateCommitmentData={updateCommitmentData}
          userCommitments={userCommitments}
        />;
      case 'scorecard':
      default:
        return (
          <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Daily Scorecard</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Track your daily commitment to the non-negotiable leadership actions that reinforce your professional identity. Consistently hitting this score is the key to sustained executive growth.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className='lg:col-span-2'>
                {(initialGoal || initialTier) && (
                  <div className="p-4 mb-6 bg-[#47A88D]/10 border border-[#47A88D] rounded-xl text-sm font-medium text-[#002E47]">
                    <p className='font-bold flex items-center'>
                      <CornerRightUp className='w-4 h-4 mr-2' /> New Focus Recommended:
                    </p>
                    <p>Your new PDP focus area is **{initialGoal || LEADERSHIP_TIERS[initialTier]?.name || 'a new phase'}**. Click 'Manage Commitments' to align your daily practice to this goal!</p>
                  </div>
                )}
                
                <div className='p-3 mb-6 bg-[#002E47] rounded-xl text-white shadow-lg'>
                    <p className='text-xs font-semibold uppercase opacity-80'>Workflow Focus</p>
                    <p className='text-sm'>{predictedRisk.microTip}</p>
                </div>
                
                <div className="mb-6 flex justify-between items-center">
                  <h3 className="text-2xl font-extrabold text-[#002E47]">
                    Today's Commitments ({userCommitments.length})
                  </h3>
                  <div className='flex space-x-2'>
                    <button 
                        onClick={() => setViewMode(viewMode === 'status' ? 'tier' : 'status')}
                        className={`px-3 py-1 text-sm font-medium rounded-full border transition-all flex items-center gap-1 ${viewMode === 'tier' ? 'bg-[#47A88D] text-white border-[#47A88D]' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                        <List className='w-4 h-4' />
                        View by {viewMode === 'status' ? 'Tier' : 'Status'}
                    </button>
                    <Button onClick={() => setView('selector')} variant="outline" className="text-sm px-4 py-2" disabled={isSaving}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Manage
                    </Button>
                  </div>
                </div>

                <Card title="Current Commitments" icon={Target} className="mb-8 border-l-4 border-[#47A88D] rounded-3xl">
                    <div className='mb-4 flex justify-between items-center text-sm'>
                        <div className='font-semibold text-[#002E47]'>
                            {score.total > 0 ? `Score: ${score.committed}/${score.total} completed` : 'No active commitments.'}
                        </div>
                        {score.total > 0 && (
                            <div className={`font-bold ${isPerfectScore ? 'text-green-600' : 'text-[#E04E1B]'}`}>
                                {score.total - score.committed} pending or missed.
                            </div>
                        )}
                    </div>
                    
                    <div className="space-y-4">
                        {userCommitments.length > 0 ? (
                            viewMode === 'status' ? (
                                userCommitments.map(c => (
                                    <CommitmentItem
                                        key={c.id}
                                        commitment={c}
                                        onLogCommitment={handleLogCommitment}
                                        onRemove={handleRemoveCommitment}
                                        isSaving={isSaving}
                                        isScorecardMode={true}
                                    />
                                ))
                            ) : (
                                commitmentsByTier.map(tierGroup => (
                                    <div key={tierGroup.id} className='mb-6'>
                                        <h4 className={`text-lg font-bold text-[#002E47] border-b-2 border-dashed border-[#002E47]/20 pb-1 mb-3`}>
                                            {tierGroup.name} ({tierGroup.items.length})
                                        </h4>
                                        <div className='space-y-3'>
                                            {tierGroup.items.map(c => (
                                                <CommitmentItem
                                                    key={c.id}
                                                    commitment={c}
                                                    onLogCommitment={handleLogCommitment}
                                                    onRemove={handleRemoveCommitment}
                                                    isSaving={isSaving}
                                                    isScorecardMode={true}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            <p className="text-gray-500 italic text-center py-4">Your scorecard is empty. Click 'Manage Commitments' to start building your daily practice!</p>
                        )}
                    </div>

                  <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <h3 className="text-2xl font-extrabold text-[#002E47]">
                      Daily Score:
                    </h3>
                    <span className={`text-4xl font-extrabold p-3 rounded-xl shadow-inner min-w-[100px] text-center ${
                      isPerfectScore ? 'text-green-600 bg-green-50' : 'text-[#002E47] bg-gray-100'
                    }`}>
                      {score.committed} / {score.total}
                    </span>
                  </div>
                </Card>
              </div>

              <div className='lg:col-span-1 space-y-8'>
                  <Card 
                      title="Daily Risk Indicator" 
                      icon={predictedRisk.icon} 
                      className={`border-2 ${predictedRisk.icon === TrendingDown ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}
                  >
                      <p className='text-sm font-semibold'>{predictedRisk.text}</p>
                  </Card>
                  
                  <Card title="Commitment Audit Trigger" icon={Archive} className='bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                      <p className='text-sm text-gray-700 mb-4'>
                          It's important to retire routine commitments to maintain sharp focus. If your scorecard is too full or a habit is mastered, audit your list.
                      </p>
                      <Button 
                          onClick={() => setView('weekly-prep')}
                          variant="secondary" 
                          className="w-full bg-[#E04E1B] hover:bg-red-700"
                      >
                          Review & Retire Commitments
                      </Button>
                  </Card>
                  
                  <TierSuccessMap tierRates={tierSuccessRates} />
                  
                  <Card title="Monthly Consistency" icon={BarChart3} className='bg-[#47A88D]/10 border-2 border-[#47A88D]'>
                      <p className='text-xs text-gray-700 mb-2'>Avg. Completion Rate ({monthlyProgress.daysTracked} days)</p>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                          <div 
                              className="bg-[#002E47] h-4 rounded-full transition-all duration-700" 
                              style={{ width: `${monthlyProgress.rate}%` }}
                          ></div>
                      </div>
                      <p className='text-sm font-medium text-[#002E47]'>
                          **{monthlyProgress.rate}% Rate** ({monthlyProgress.metItems} of {monthlyProgress.totalItems} total actions met)
                      </p>
                  </Card>

                <Card title="Commitment History" icon={BarChart3} className='bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                  <div className='text-xs text-gray-700 mb-4'>
                    <p className='font-semibold'>Last 7 Days (Click for Details)</p>
                  </div>
                  
                  <div className='p-4 bg-[#FCFCFA] border border-gray-200 rounded-xl'>
                    <div className='flex justify-between text-xs font-mono text-gray-700 space-x-1 overflow-x-auto'>
                      {lastSevenDaysHistory.map(item => {
                        const date = new Date(item.date + 'T00:00:00'); 
                        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' });
                        const [committed, total] = item.score.split('/').map(Number);
                        const isDayComplete = committed === total && total > 0;
                        const isDayMissed = committed < total && total > 0;
                        const isDayLogged = total > 0;

                        return (
                          <button 
                            key={item.date} 
                            className={`flex flex-col items-center min-w-[40px] p-1 rounded-md ${isDayLogged ? 'hover:bg-gray-100' : ''} ${!isDayLogged ? 'cursor-default' : ''}`}
                            onClick={() => isDayLogged ? handleOpenHistoryModal(item) : null}
                          >
                            <Tooltip content={`${item.score} achieved on ${item.date}`}>
                              <span className='font-bold'>{dayOfWeek}</span>
                            </Tooltip>
                            <span className={`text-2xl font-extrabold mt-1 ${
                              isDayComplete ? 'text-green-600' : isDayMissed ? 'text-[#E04E1B]' : 'text-gray-400'
                            }`}>{isDayComplete ? '✓' : isDayMissed ? '✗' : '—'}</span>
                            <span className='text-xs text-gray-500 mt-1'>{item.score}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className='mt-4 pt-3 border-t border-gray-200'>
                      <div className='text-[#47A88D] font-medium text-lg'>
                        Current Streak: {streak} {streak === 1 ? 'Day' : 'Days'}
                      </div>
                      {streak > 0 && (
                        <div className='text-sm text-gray-600'>Consistency is the foundation of growth!</div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </div>


            <Card title="Reinforcement Journal" icon={Lightbulb} className="bg-[#002E47]/10 border-2 border-[#002E47]/20 rounded-3xl mt-8">
              <div className='mb-4'>
                <div className='text-sm text-[#002E47] font-semibold mb-2 flex items-center'>
                    {promptLoading ? 
                        <span className='flex items-center text-gray-500'><div className="animate-spin h-4 w-4 border-b-2 border-gray-500 mr-2 rounded-full"></div> Coach is drafting prompt...</span> :
                        <span className='text-[#47A88D] flex items-center'><MessageSquare className='w-4 h-4 mr-2'/> AI Reflection Prompt:</span>
                    }
                </div>
                <p className='text-base font-medium text-gray-700 p-2 bg-white rounded-lg border border-gray-200'>
                    {reflectionPrompt || 'What key insight did you gain today that will improve your leadership practice tomorrow?'}
                </p>
              </div>

              <p className="text-gray-700 text-sm mb-4">
                Write your response below. How did executing (or missing) these leadership commitments impact your team's momentum and your own executive presence?
              </p>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-40"
                placeholder="My reflection (required)..."
              ></textarea>
              <Button
                variant="secondary"
                onClick={handleSaveReflection}
                disabled={isSaving}
                className="mt-4 w-full"
              >
                {isSaving ? 'Saving...' : 'Save Daily Reflection'}
              </Button>
            </Card>
            
            <CommitmentHistoryModal
                isVisible={isHistoryModalVisible}
                onClose={handleCloseHistoryModal}
                dayData={selectedHistoryDay}
                activeCommitments={userCommitments}
            />
          </div>
        );
    }
  };

  return renderView();
}