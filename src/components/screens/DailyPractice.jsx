// src/components/screens/DailyPractice.jsx - Commitment Fixes

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PlusCircle, ArrowLeft, X, Target, Clock, CheckCircle, BarChart3, CornerRightUp, AlertTriangle, Users, Lightbulb, Zap, Archive, MessageSquare, List, TrendingDown, TrendingUp, BookOpen, Crown, Cpu, Star, Trash2, HeartPulse, Trello, Activity, Dumbbell, Flag, User
} from 'lucide-react';

/* =========================================================
   MOCK/UI UTILITIES (Fully Self-Contained)
========================================================= */

// CRITICAL FIX: Use the canonical hook path so all views share the same store.
import { useAppServices } from '../../services/useAppServices.jsx';


// --- MOCK UTILITIES (Defined for component self-reliance) ---
const LEADERSHIP_TIERS_META = { 
    'T1': { id: 'T1', name: 'Personal Foundation', hex: '#10B981' }, 
    'T2': { id: 'T2', name: 'Operational Excellence', hex: '#3B82F6' }, 
    'T3': { id: 'T3', name: 'Strategic Alignment', hex: '#F5C900' }, 
    'T4': { id: 'T4', name: 'People Development', hex: '#E04E1B' }, 
    'T5': { id: 'T5', name: 'Visionary Leadership', hex: '#002E47' }, 
};

// --- NEW MOCK DATA (Implementing the new Daily Target Rep and Identity) ---
const MOCK_ACTIVITY_DATA = {
    // These data points now reflect the core focus of the new Rep Tracker
    daily_target_rep: "Give one reinforcing feedback statement to a direct report.",
    identity_statement: "I am the kind of leader who coaches in the moment and owns accountability.",
    total_reps_completed: 452, 
    total_coaching_labs: 18,    
    today_coaching_labs: 2,     
};
// --- END NEW MOCK DATA ---


// FIX 1: Resolves "ReferenceError: groupCommitmentsByTier is not defined"
function groupCommitmentsByTier(commitments) {
    const tiers = { T1: [], T2: [], T3: [], T4: [], T5: [] };
    (commitments || []).forEach(c => {
        if (c.linkedTier && tiers[c.linkedTier]) {
            tiers[c.linkedTier].push(c);
        }
    });
    return tiers;
}

// FIX 2: Resolves "ReferenceError: calculateTierSuccessRates is not defined"
function calculateTierSuccessRates(commitments, history) {
    const rates = {};
    const tierMap = groupCommitmentsByTier(commitments);
    Object.keys(LEADERSHIP_TIERS_META).forEach(tierId => { // Use the local meta map
        const tierCommitments = tierMap[tierId] || [];
        const total = tierCommitments.length;
        if (total > 0) {
            // Calculate success rate based on status today
            const committedCount = tierCommitments.filter(c => c.status === 'Committed').length;
            // Mock overall rate as 78% if active commitments are not all completed
            const mockedOverallRate = 78; 
            rates[tierId] = { 
                // Simple representation for today's view: 
                rate: Math.round((committedCount / total) * 100) || mockedOverallRate, 
                total: total 
            };
        } else {
             rates[tierId] = { rate: 0, total: 0 };
        }
    });
    return rates;
}

// FIX 3: Resolves "ReferenceError: getLastSevenDays is not defined"
function getLastSevenDays(history) {
    const today = new Date();
    const result = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const entry = (history || []).find(h => h.date === dateString);
        const score = entry ? entry.score : '0/0'; 
        const reflection = entry ? entry.reflection : 'N/A';
        result.push({ date: dateString, score, reflection });
    }
    // Return them in chronological order (oldest to newest)
    return result.reverse();
}

function calculateTotalScore(commitments) {
    const total = commitments.length;
    const committedCount = commitments.filter(c => c.status === 'Committed').length;
    return { committed: committedCount, total };
}

function calculateStreak(history) {
    let streak = 0;
    const validHistory = Array.isArray(history) ? history : [];
    
    // Sort history by date descending
    const sortedHistory = [...validHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Start checking from yesterday backwards
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate()); // Start check from today (last entry)
    
    for (let i = 0; i < 7; i++) { // Check up to the last 7 days
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
            // Found an incomplete day, streak ends
            break; 
          }
        }
      } else {
        // No log for this day, break streak
        break;
      }
    }
    return streak;
}

// FIX 4: Implemented mock daily reset function (serverless simulation)
// Reset statuses once per day and log YESTERDAY's score
const resetIfNewDay = (data, updateFn) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const last = data?.last_reset_date;
  if (last === todayStr) return;

  const y = new Date(today);
  y.setDate(today.getDate() - 1);
  const yStr = y.toISOString().split('T')[0];

  const commitments = data?.active_commitments || [];
  const { committed, total } = calculateTotalScore(commitments);

  updateFn(prev => {
    const alreadyLogged = (prev.history || []).some(h => h.date === yStr);
    return {
      ...prev,
      last_reset_date: todayStr,
      history: alreadyLogged
        ? prev.history
        : [
            ...(prev.history || []),
            { date: yStr, score: `${committed}/${total}`, reflection: prev.reflection_journal || '' }
          ],
      active_commitments: commitments.map(c => ({ ...c, status: 'Pending' })),
    };
  });
};
// --- END MOCK UTILITIES ---


/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  NAVY: '#002E47', 
  TEAL: '#47A88D', 
  SUBTLE_TEAL: '#349881', 
  ORANGE: '#E04E1B', 
  GREEN: '#10B981',
  RED: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF',
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
  MUTED: '#4B5355',
  BLUE: '#2563EB',
};

// UI Components (Replicated for file independence)
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[${COLORS.SUBTLE_TEAL}] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'TEAL' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = COLORS[accent] || COLORS.TEAL;
  return (
    <Tag
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={`relative p-6 rounded-2xl border-2 shadow-2xl hover:shadow-xl transition-all duration-300 text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
      {Icon && (<div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}><Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} /></div>)}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </Tag>
  );
};
const Tooltip = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className="absolute z-10 w-64 p-3 -mt-2 -ml-32 text-xs text-white bg-[#002E47] rounded-lg shadow-lg bottom-full left-1/2 transform translate-x-1/2">
                    {content}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#002E47]"></div>
                </div>
            )}
        </div>
    );
};
// const leadershipCommitmentBank = {}; // Placeholder

// =========================================================

/* =========================================================
   ResilienceTracker (Aesthetic Upgrade)
   FIX 1: Added confirmation state and button logic.
========================================================= */
const ResilienceTracker = ({ dailyLog, handleSaveResilience }) => {
    const today = new Date().toISOString().split('T')[0];
    const initialLog = dailyLog[today] || { energy: 5, focus: 5, saved: false }; // Added 'saved' flag
    const [energy, setEnergy] = useState(initialLog.energy);
    const [focus, setFocus] = useState(initialLog.focus);
    const [localIsSaving, setLocalIsSaving] = useState(false);
    const [isSavedConfirmation, setIsSavedConfirmation] = useState(initialLog.saved);

    // Sync state if initialLog changes (e.g., after nightly reset)
    useEffect(() => {
        setEnergy(initialLog.energy);
        setFocus(initialLog.focus);
        setIsSavedConfirmation(initialLog.saved);
    }, [initialLog.energy, initialLog.focus, initialLog.saved]);

    const handleSliderChange = (key, value) => {
        if (key === 'energy') setEnergy(value);
        if (key === 'focus') setFocus(value);
        setIsSavedConfirmation(false); // Allow re-saving if sliders are moved
    };

    const handleSave = async () => {
        setLocalIsSaving(true);
        // CRITICAL FIX: Pass 'saved: true' to the parent to persist the completion status
        await handleSaveResilience({ energy, focus, saved: true }); 
        setIsSavedConfirmation(true); // Set local confirmation flag
        setLocalIsSaving(false);
    };

    const isCheckSaved = initialLog.saved || isSavedConfirmation;

    return (
        <Card title="Daily Resilience Check (T1 Focus)" icon={HeartPulse} accent='ORANGE' className='bg-[#E04E1B]/10 border-4 border-dashed border-[#E04E1B]/20'>
            <p className='text-sm text-gray-700 mb-4'>Rate your capacity for high-leverage work today (1 = Low, 10 = High).</p>

            <div className='mb-4'>
                <p className='font-semibold text-[#002E47] flex justify-between'>
                    <span>Energy Level:</span>
                    <span className={`text-xl font-extrabold text-[${COLORS.ORANGE}]`}>{energy}/10</span>
                </p>
                <input
                    type="range" min="1" max="10" value={energy}
                    onChange={(e) => handleSliderChange('energy', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                    style={{ accentColor: COLORS.ORANGE }}
                    disabled={isCheckSaved}
                />
            </div>
            
            <div className='mb-4'>
                <p className='font-semibold text-[#002E47] flex justify-between'>
                    <span>Focus Level:</span>
                    <span className={`text-xl font-extrabold text-[${COLORS.ORANGE}]`}>{focus}/10</span>
                </p>
                <input
                    type="range" min="1" max="10" value={focus}
                    onChange={(e) => handleSliderChange('focus', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                    style={{ accentColor: COLORS.ORANGE }}
                    disabled={isCheckSaved}
                />
            </div>

            {isCheckSaved ? (
                <div className='w-full p-3 bg-green-100 border border-green-400 rounded-xl flex items-center justify-center font-bold text-green-700'>
                    <CheckCircle className='w-5 h-5 mr-2'/> Check Saved for Today!
                </div>
            ) : (
                <Button onClick={handleSave} disabled={localIsSaving} className={`w-full bg-[${COLORS.ORANGE}] hover:bg-[#C33E12]`}>
                    {localIsSaving ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Saving...
                        </div>
                    ) : 'Save Daily Check (T1 Rep)'}
                </Button>
            )}
        </Card>
    );
};


/**
 * CommitmentItem: Displays an individual daily commitment with status logging buttons.
 */
const CommitmentItem = ({ commitment, onLogCommitment, onRemove, isSaving, isScorecardMode }) => {
  // Statuses: 'Committed' (Done), 'Pending' (Not Done/Missed, but can be marked Done)
  const status = commitment.status || 'Pending';
  
  const isCommitted = status === 'Committed';
  const isLoggingDisabled = isSaving; // Disable during save operation

  
  const getStatusColor = (s) => {
    if (s === 'Committed') return 'bg-green-100 text-green-800 border-green-500 shadow-md';
    // All non-committed statuses (Pending, Missed) display as the base state
    if (s === 'Pending' || s === 'Missed') return 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm';
    return 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm';
  };

  const getStatusIcon = (s) => {
    if (s === 'Committed') return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <Clock className="w-5 h-5 text-gray-500" />;
  };

  const tierMeta = commitment.linkedTier ? LEADERSHIP_TIERS_META[commitment.linkedTier] : null;

  const tierLabel = tierMeta ? `${tierMeta.id}: ${tierMeta.name}` : 'General';
  const colleagueLabel = commitment.targetColleague ? `Focus: ${commitment.targetColleague}` : 'Self-Focus';

  const removeHandler = () => {
    // Only allow removal if the status is Pending
    if (!isCommitted) {
      onRemove(commitment.id);
    } else {
      console.warn("Commitment is marked complete. Cannot remove from today's scorecard.");
    }
  };

  // New Single-Button Toggle Handler
  const handleToggleComplete = () => {
    // FIX FOR ISSUE 1: Toggles status between Committed and Pending
    const newStatus = isCommitted ? 'Pending' : 'Committed';
    // CRITICAL: Call the parent function to trigger state update
    onLogCommitment(commitment.id, newStatus); 
  };


  return (
    <div className={`p-4 rounded-xl flex flex-col justify-between ${getStatusColor(status)} transition-all duration-300 ${isLoggingDisabled ? 'opacity-70' : ''}`}>
      <div className='flex items-start justify-between'>
        <div className='flex items-start space-x-2 text-lg font-semibold mb-2'>
          {getStatusIcon(status)}
          <span className='text-[#002E47] text-base'>{commitment.text}</span>
        </div>
        {/* Only allow removal if Pending */}
        <Tooltip content={isCommitted ? "Marked complete. Remove tomorrow." : "Remove commitment."} >
            <button 
                onClick={removeHandler} 
                className="text-gray-400 hover:text-[#E04E1B] transition-colors p-1 rounded-full" 
                disabled={isLoggingDisabled || isCommitted}
            >
               <X className="w-4 h-4" />
            </button>
        </Tooltip>
      </div>

      <div className='flex flex-wrap gap-2 mb-3 overflow-x-auto'>
        <div className='text-xs text-[#002E47] bg-[#002E47]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
          Goal: {commitment.linkedGoal || 'N/A'}
        </div>
        <div className='text-xs text-[#47A88D] bg-[#47A88D]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
          Tier Rep: {tierLabel}
        </div>
        <div className='text-xs text-[#E04E1B] bg-[#E04E1B]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
          {colleagueLabel}
        </div>
      </div>

      <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-300/50">
          <Button
            onClick={handleToggleComplete}
            disabled={isLoggingDisabled}
            className={`px-3 py-1 text-xs w-full ${isCommitted ? 'bg-green-600 hover:bg-green-700' : 'bg-[#47A88D] hover:bg-[#349881]'}`}
          >
            {/* FIX: Ensure button text correctly reflects next action */}
            {isLoggingDisabled ? 'Saving...' : isCommitted ? 'Rep Completed' : 'Mark Rep Complete'}
          </Button>
      </div>

    </div>
  );
};

// FIX 11: Added the missing component definition for AIStarterPackNudge
const AIStarterPackNudge = ({ pdpData, setLinkedGoal, setLinkedTier, handleAddCommitment, isSaving }) => {
    // Safely access primary goal/tier
    const primaryGoal = pdpData?.plan?.[0]?.theme || 'Improve Discipline';
    const primaryTier = pdpData?.assessment?.goalPriorities?.[0] || 'T3';

    return (
        <Card title="AI Starter Pack Nudge" icon={Cpu} className='mb-6 bg-[#47A88D]/10 border-2 border-[#47A88D]'>
            <p className='text-sm text-gray-700'>
                You have no active commitments (reps). AI suggests starting with your Roadmap's primary focus: **{primaryGoal}** ({primaryTier}). 
                Click 'Manage' and select this Goal/Tier combination to auto-fill the alignment fields.
            </p>
        </Card>
    );
};


/**
 * CommitmentSelectorView: Allows users to add commitments from the bank or create custom ones.
 */
const CommitmentSelectorView = ({ setView, initialGoal, initialTier }) => {
  const { updateCommitmentData, commitmentData, planningData, pdpData, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL} = useAppServices(); // FIX: Call hook inside component

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
  const [isCustomCommitmentSaved, setIsCustomCommitmentSaved] = useState(false); // Fix 3: Custom commit confirmation

  const userCommitments = commitmentData?.active_commitments || [];
  const okrGoals = planningData?.okrs?.map(o => o.objective) || [];
  const missionVisionGoals = [planningData?.vision, planningData?.mission].filter(Boolean);
  const initialLinkedGoalPlaceholder = '--- Select the Goal this commitment supports ---';
  const currentMonthPlan = pdpData?.plan?.find(m => m.month === pdpData?.currentMonth);
  const requiredPdpContent = currentMonthPlan?.requiredContent || [];
  const pdpContentCommitmentIds = new Set(userCommitments.filter(c => String(c.id).startsWith('pdp-content-')).map(c => String(c.id).split('-')[2]));


  // FIX: Use the expanded commitment bank (Local definition needed)
  const EXPANDED_COMMITMENT_BANK = {
      'T1: Personal Foundation (Executive Resilience)': [{ id: 't1-1', text: 'Perform a 10-minute mindfulness check before the first meeting.' }],
      'T2: Operational Excellence (System & Process Leadership)': [{ id: 't2-1', text: 'Create or refine one simple SOP for a recurring team task.' }],
      'T3: Strategic Alignment (Goal-Oriented Executive Action)': [{ id: 't3-1', text: 'Relate one daily decision back to a long-term company mission statement.' }],
      'T4: People Development (Coaching & Mentorship)': [{ id: 't4-1', text: 'Give one piece of specific, actionable positive feedback using the SBI model.' }],
      'T5: Visionary Leadership (Culture & Executive Influence)': [{ id: 't5-1', text: 'Articulate the department’s 5-year vision in simple, non-jargon terms to a junior employee.' }],
  };
  const allBankCommitments = useMemo(() => Object.values(EXPANDED_COMMITMENT_BANK || {}).flat(), []);

  const filteredBankCommitments = useMemo(() => {
    const ql = searchTerm.toLowerCase();
    const matchingCommitments = [];
    for (const category in EXPANDED_COMMITMENT_BANK) {
      for (const commitment of EXPANDED_COMMITMENT_BANK[category]) {
        if (
          !userCommitments.some(c => c.text === commitment.text) && 
          (searchTerm === '' || commitment.text.toLowerCase().includes(ql))
        ) {
 matchingCommitments.push({ ...commitment, category });
        }
      }
    }
    return matchingCommitments;
  }, [userCommitments, searchTerm]);

  
  const availableGoals = useMemo(() => [
  initialLinkedGoalPlaceholder,
  ...(currentMonthPlan?.theme ? [`Roadmap Focus: ${currentMonthPlan.theme}`] : []),
  ...okrGoals,
  ...missionVisionGoals,
  'Improve Feedback & Coaching Skills',
  'Risk Mitigation Strategy',
  'Misalignment Prevention',
  'Other / New Goal'
], [okrGoals, missionVisionGoals, currentMonthPlan]);
  
// DEFAULT SELECTIONS so "Add" never no-ops:
  // - Goal: PDP Focus (if present) → first OKR → fall back to "Other / New Goal"
  // - Tier: first PDP goal priority → fall back to T3
  useEffect(() => {
    if (initialGoal && initialGoal !== linkedGoal) {
      setLinkedGoal(initialGoal);
    }
    if (initialTier && initialTier !== linkedTier) {
      setLinkedTier(initialTier);
    }
    if (!linkedGoal) {
      const fallbackGoal =
        (currentMonthPlan?.theme ? `Roadmap Focus: ${currentMonthPlan.theme}` : null) ??
        (okrGoals && okrGoals.length > 0 ? okrGoals[0] : null) ??
        'Other / New Goal';
      setLinkedGoal(fallbackGoal);
    }
    if (!linkedTier) {
      const fallbackTier = pdpData?.assessment?.goalPriorities?.[0] || 'T3';
      setLinkedTier(fallbackTier);
    }
  }, [
    initialGoal,
    initialTier,
    linkedGoal,
    linkedTier,
    okrGoals,
    currentMonthPlan,
    pdpData
  ]);

  const handleClearSearch = () => setSearchTerm('');
  
  useEffect(() => {
    setAiAssessment(null);
  }, [customCommitment]);


  /* =========================================================
     AI Commitment Assessment Logic
     FIX: Integrated the resilient API call structure
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

    const tierName = LEADERSHIP_TIERS_META[linkedTier]?.name || 'N/A';
    
    // FIX: Ensure JSON output is enforced for reliable data
    const systemPrompt = `You are an AI Executive Coach specializing in habit alignment. Your task is to analyze a user's proposed daily commitment against their strategic context (Goal and Leadership Tier). The response MUST be a JSON object conforming to the schema. Do not include any introductory or explanatory text outside of the JSON block.`;
    
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
            model: GEMINI_MODEL, // Available via hook destructuring
        };
        
        const result = await callSecureGeminiAPI(payload);
        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (jsonText) {
            const cleanJsonText = jsonText.trim().replace(/^[^\{]*/, ''); 
            const parsedJson = JSON.parse(cleanJsonText);

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
            score: 0, 
            risk: 10, 
            feedback: "CRITICAL API FAILURE: The AI Analysis service is currently unavailable. Check your network connection.", 
            error: true 
        });
    } finally {
        setAssessmentLoading(false);
    }
  };

  /* =========================================================
     Commitment Handlers
  ========================================================= */

  const handleAddCommitment = async (commitment, source) => {
    // FIX 1: Add checks to prevent adding if required fields are missing
    if (!linkedGoal || linkedGoal === initialLinkedGoalPlaceholder || !linkedTier) {
        console.warn("Cannot add commitment: Goal and Tier must be selected.");
        return;
    }

    setIsSaving(true);
    setIsCustomCommitmentSaved(false); // Reset confirmation

    let newCommitment;
    if (source === 'pdp') {
      newCommitment = {
        id: `pdp-content-${commitment.id}-${Date.now()}`,
        text: `(Roadmap Rep) Complete: ${commitment.title} (${commitment.type})`,
        status: 'Pending',
        isCustom: true,
        linkedGoal: linkedGoal,
        linkedTier: linkedTier,
        targetColleague: `Est. ${commitment.duration} min`,
      };
    } else {
      newCommitment = {
        id: `bank-${commitment.id}-${Date.now()}`, 
        text: commitment.text,
        status: 'Pending',
        linkedGoal: linkedGoal,
        linkedTier: linkedTier,
        targetColleague: targetColleague.trim() || null,
      };
    }

    // CRITICAL FIX 2: Ensure existing data is preserved using the spread operator
await updateCommitmentData(data => ({ 
  ...data,
  active_commitments: [ ...(data?.active_commitments || []), newCommitment ],
  }));
// Optimistic UI: assume success after await.

        setCustomCommitment('');
        setTargetColleague('');
        setAiAssessment(null);
        setIsSaving(false);
        
        setIsCustomCommitmentSaved(true);
        setTimeout(() => setIsCustomCommitmentSaved(false), 3000);

        // CRITICAL FIX 3: Navigate back to the Scorecard view after adding
        setView('scorecard');
  };

  const handleCreateCustomCommitment = async () => {
    // FIX 4: Add checks to prevent adding if required fields are missing
    if (!customCommitment.trim() || !linkedGoal || linkedGoal === initialLinkedGoalPlaceholder || !linkedTier) {
        console.warn("Cannot create custom commitment: Text, Goal, and Tier must be selected.");
        return;
    }
    
    if (customCommitment.trim() && linkedGoal && linkedGoal !== initialLinkedGoalPlaceholder && linkedTier) {
      setIsSaving(true);
      setIsCustomCommitmentSaved(false); // Reset confirmation
      const newId = String(Date.now());
      const newCommitment = {
        id: `custom-${newId}`,
        text: customCommitment.trim(),
        status: 'Pending',
        isCustom: true,
        linkedGoal: linkedGoal,
        linkedTier: linkedTier,
        targetColleague: targetColleague.trim() || null,
      };

      // CRITICAL FIX 5: Ensure existing data is preserved using the spread operator
// Ensure we properly append to active_commitments (preserving the rest of the doc)
      await updateCommitmentData(prev => ({
        ...prev,
        active_commitments: [
          ...(prev?.active_commitments || []),
          newCommitment
        ],
      }));
// Optimistic UI: assume success after await.

        setCustomCommitment('');
        setTargetColleague('');
        setAiAssessment(null);
        setIsSaving(false);
        
        setIsCustomCommitmentSaved(true);
        setTimeout(() => setIsCustomCommitmentSaved(false), 3000);
        
        // CRITICAL FIX 6: Navigate back to the Scorecard view after adding
        setView('scorecard');
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
    <div className={`p-6 space-y-8 bg-[${COLORS.LIGHT_GRAY}] min-h-screen`}>
      {/* 1. Header with enhanced Personalization */}
      <div className={`border-b border-gray-200 pb-5 bg-[${COLORS.OFF_WHITE}] p-6 -mx-6 -mt-6 mb-8 rounded-b-xl shadow-md`}>
        <h1 className={`text-4xl font-extrabold text-[${COLORS.NAVY}] flex items-center gap-3`}>
          <Home size={32} style={{ color: COLORS.TEAL }} /> The Arena Dashboard
        </h1>
        <p className="text-gray-600 text-base mt-2">
          {greeting} <span className={`font-semibold text-[${COLORS.NAVY}]`}>{displayedUserName}</span>. Your focus is **{weakestTier?.name || 'Getting Started'}**—consistency over intensity.
        </p>
      </div>
      
      {/* --- 2. ACTION & HEALTH HUB (The Launchpad) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* BIG ACTION BUTTONS (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3">
              <Zap size={24} className='text-[#E04E1B]'/> Launchpad: Today's Non-Negotiables
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Daily Practice */}
              <div className='md:col-span-1 flex flex-col space-y-2'>
                <ThreeDButton
                  onClick={() => safeNavigate('daily-practice')} 
                  color={COLORS.TEAL}
                  accentColor={COLORS.NAVY}
                  className="h-20 flex-col px-3 py-2 text-white" 
                >
                  <ClockIcon className='w-6 h-6 mb-1'/> 
                  <span className='text-lg font-extrabold'>Daily Practice Scorecard</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>**Your daily reps:** Log micro-habits to build consistency and track your **{perfectStreak} day streak**.</p>
              </div>

              {/* Development Roadmap */}
              <div className='md:col-span-1 flex flex-col space-y-2'>
                <ThreeDButton
                  onClick={() => safeNavigate('prof-dev-plan')} 
                  color={COLORS.ORANGE}
                  accentColor={COLORS.NAVY}
                  className="h-20 flex-col px-3 py-2 text-white" 
                >
                  <Briefcase className='w-6 h-6 mb-1'/> 
                  <span className='text-lg font-extrabold'>24-Month Roadmap Check</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>**Your strategy:** Review content and complete assessments for your current focus: **{weakestTier?.name || 'T-X'}**.</p>
              </div>

              {/* Coaching Lab */}
              <div className='md:col-span-1 flex flex-col space-y-2'>
                <ThreeDButton
                  onClick={() => safeNavigate('coaching-lab')} 
                  color={COLORS.PURPLE}
                  accentColor={COLORS.NAVY}
                  className="h-20 flex-col px-3 py-2 text-white" 
                >
                  <Mic className='w-6 h-6 mb-1'/> 
                  <span className='text-lg font-extrabold'>AI Coaching Lab</span>
                </ThreeDButton>
                <p className='text-xs font-light text-gray-600'>**Your practice field:** Simulate critical conversations and receive objective, real-time critique.</p>
              </div>
          </div>
        </div>

        {/* HEALTH SCORE RING (lg:col-span-1) */}
        <div className="lg:col-span-1">
          <ProgressRings
            dailyPercent={dailyPercent}
            monthlyPercent={monthlyPercent}
            careerPercent={careerPercent}
            tierHex={weakestTier?.hex || COLORS.TEAL}
            commitsDue={commitsDue}
          />
        </div>
      </div>
      
      {/* --- 3. METRICS SCORECARD & NUDGE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Progress Snapshot (The Scorecard: lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center gap-3 mb-4">
              <BarChart3 size={24} className='text-[#47A88D]'/> Performance Scorecard
          </h2>

          <div className="space-y-6">
            {/* PILLAR: CONTENT */}
            <div className='p-6 rounded-2xl border-4 border-[#47A88D]/20 bg-[#F7FCFF]'>
                <h3 className='text-xl font-extrabold text-[#47A88D] mb-4 flex items-center gap-2'>
                    <BookOpen size={20}/> PILLAR: Content & Discipline
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Metric: Today's Target Rep (New Metric 1: Clarity) */}
                    <StatCard
                        icon={Flag}
                        label="Today's Target Rep"
                        value={dailyTargetRep}
                        onClick={() => safeNavigate('daily-practice')}
                        trend={0} 
                        colorHex={COLORS.RED} // Using RED/ORANGE for high visibility
                    />
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
                    <Dumbbell size={20}/> PILLAR: Community & Identity
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Metric: Identity Shift (New Metric 8) */}
                    <StatCard
                        icon={User}
                        label="I Am... Identity Statement"
                        value={identityStatement.substring(0, 30) + '...'}
                        onClick={() => safeNavigate('profile')}
                        trend={0} 
                        colorHex={COLORS.NAVY}
                    />
                    {/* Metric: Roadmap Months Remaining */}
                    <StatCard
                        icon={Briefcase}
                        label="Roadmap Months Remaining"
                        value={`${24 - goalsCount}`}
                        onClick={() => safeNavigate('prof-dev-plan')}
                        trend={24 - goalsCount > 0 ? -4 : 0} 
                        colorHex={COLORS.NAVY}
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
                    {/* Metric: Longest Held OKR (Context) */}
                    <StatCard
                        icon={Archive}
                        label="Longest-Held OKR (Days)"
                        value={`${longestHeldOKR.days} Days`}
                        onClick={() => safeNavigate('planning-hub')}
                        trend={5} 
                        colorHex={COLORS.BLUE}
                    />
                </div>
            </div>
          </div>
        </div>

        {/* Daily Tip (Strategic Nudge: lg:col-span-1) */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:bg-white/95 relative group">
            <div className='absolute inset-0 rounded-2xl' style={{ background: `${weakestTier?.hex || COLORS.TEAL}1A`, opacity: 0.1 }} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <h2 className={`text-xl font-bold flex items-center gap-2`} style={{color: weakestTier?.hex || COLORS.NAVY}}>
                <Lightbulb size={20} className={`text-white p-1 rounded-full`} style={{backgroundColor: weakestTier?.hex || COLORS.TEAL}}/> 
                Strategic Nudge
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