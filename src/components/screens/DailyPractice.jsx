// src/components/screens/DailyPractice.jsx - Commitment Fixes

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PlusCircle, ArrowLeft, X, Target, Clock, CheckCircle, BarChart3, CornerRightUp, AlertTriangle, Users, Lightbulb, Zap, Archive, MessageSquare, List, TrendingDown, TrendingUp, BookOpen, Crown, Cpu, Star, Trash2, HeartPulse, Trello, Activity
} from 'lucide-react';

/* =========================================================
   MOCK/UI UTILITIES (Fully Self-Contained)
========================================================= */

// CRITICAL FIX: The real hook must be imported from the correct path.
import { useAppServices } from '../../services/useAppServices.jsx'; 


// --- MOCK UTILITIES (Defined for component self-reliance) ---
const LEADERSHIP_TIERS_META = { 
    'T1': { id: 'T1', name: 'Personal Foundation', hex: '#10B981' }, 
    'T2': { id: 'T2', name: 'Operational Excellence', hex: '#3B82F6' }, 
    'T3': { id: 'T3', name: 'Strategic Alignment', hex: '#F5C900' }, 
    'T4': { id: 'T4', name: 'People Development', hex: '#E04E1B' }, 
    'T5': { id: 'T5', name: 'Visionary Leadership', hex: '#002E47' }, 
};

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
        <Card title="Daily Resilience Check" icon={HeartPulse} accent='ORANGE' className='bg-[#E04E1B]/10 border-4 border-dashed border-[#E04E1B]/20'>
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
                    ) : 'Save Daily Check'}
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
          Tier: {tierLabel}
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
            {isLoggingDisabled ? 'Saving...' : isCommitted ? 'Completed' : 'Mark as Complete'}
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
                You have no active commitments. AI suggests starting with your PDP's primary focus: **{primaryGoal}** ({primaryTier}). 
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
  ...(currentMonthPlan?.theme ? [`PDP Focus: ${currentMonthPlan.theme}`] : []),
  ...okrGoals,
  ...missionVisionGoals,
  'Improve Feedback & Coaching Skills',
  'Risk Mitigation Strategy',
  'Misalignment Prevention',
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
        text: `(PDP Required) Complete: ${commitment.title} (${commitment.type})`,
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
await updateCommitmentData(prev => ({
  ...prev,
  active_commitments: [...(prev?.active_commitments || []), newCommitment ],
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
                    <div className={`text-3xl font-extrabold ${valueColor}`}>{aiAssessment.score}/10}</div>
                </div>
                <div className={`p-3 rounded-xl border ${aiAssessment.risk > 7 ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-100'}`}>
                    <div className='text-xs font-semibold uppercase text-gray-500'>Risk Score</div>
                    <div className={`text-3xl font-extrabold ${riskColor}`}>{aiAssessment.risk}/10}</div>
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
      
      {/* Alignment Card (Converted to div/button structure to prevent collapse on select) */}
      <div
        className='relative p-6 rounded-2xl border-2 shadow-2xl mb-8 bg-[#47A88D]/10 border-2 border-[#47A88D]'
      >
        <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: COLORS.NAVY, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
          
        {/* Clickable Header for Collapsible Behavior */}
        <button
            onClick={() => setIsAlignmentOpen(prev => !prev)}
            className='flex justify-between items-center w-full text-left'
        >
            <div className='flex items-center space-x-3'>
                <Target className="w-5 h-5" style={{ color: COLORS.TEAL }} />
                <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>Goal and Tier Alignment (Mandatory)</h2>
            </div>
            <CornerRightUp className={`w-5 h-5 text-[#002E47] transition-transform ${isAlignmentOpen ? 'rotate-90' : 'rotate-0'}`} />
        </button>


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
                  <option value="">--- Select Goal ---</option>
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
                  {Object.values(LEADERSHIP_TIERS_META).map(tier => (
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
      </div>


      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-300 -mb-px">
        <button className={tabStyle('pdp')} onClick={() => setTab('pdp')}>
          <Target className='w-4 h-4 inline mr-1' /> PDP Content ({requiredPdpContent.filter(c => !pdpContentCommitmentIds.has(String(c.id))).length})
        </button>
        <button className={tabStyle('bank')} onClick={() => setTab('bank')}>
          <BookOpen className='w-4 h-4 inline mr-1' /> Commitment Bank ({Object.keys(EXPANDED_COMMITMENT_BANK).length})
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
              {/* FIX FOR ISSUE 4: Added onClick handler to the button to add the commitment */}
              {Object.entries(EXPANDED_COMMITMENT_BANK).map(([category, commitments]) => {
                const filteredCommitments = commitments.filter(c =>
                    // Check if commitment text is NOT already in active commitments
                    !userCommitments.some(activeC => activeC.text === c.text) &&
                    (searchTerm === '' || c.text.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                if (filteredCommitments.length === 0 && searchTerm !== '') return null;
                if (filteredCommitments.length === 0 && searchTerm === '') return null; 

                return (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-[#002E47] border-b pb-1 mb-2">{category}</h3>
                    {filteredCommitments.map(c => (
                      <div key={c.id} className="flex justify-between items-center p-2 text-sm bg-gray-50 rounded-lg mb-1">
                        <span className='text-gray-800'>{c.text}</span>
                        <Tooltip content={`Adds this commitment (linked goal/tier required).`}>
                          {/* FIX 1: CRITICAL WIRING FIX: The button must call handleAddCommitment */}
                          <button
                            onClick={() => handleAddCommitment(c, 'bank')} 
                            disabled={!canAddCommitment || isSaving}
                            className={`font-semibold text-xs transition-colors p-1 flex items-center space-x-1 ${canAddCommitment && !isSaving ? 'text-[#47A88D] hover:text-[#349881]' : 'text-gray-400 cursor-not-allowed'}`}
                          >
                            <PlusCircle className='w-4 h-4' />
                          </button>
                        </Tooltip>
                      </div>
                    ))}
                  </div>
                );
              })}
              {Object.keys(EXPANDED_COMMITMENT_BANK).length > 0 && filteredBankCommitments.length === 0 && searchTerm !== '' && (
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
            
            {isCustomCommitmentSaved && (
                <div className='flex items-center p-3 text-sm font-semibold text-white rounded-lg bg-green-500'>
                    <CheckCircle className='w-4 h-4 mr-2'/> Commitment Added!
                </div>
            )}

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
   NEW ADVANCED FEATURE 3: Weekly Prep View (Mocked)
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
        
        await updateCommitmentData(data => ({ ...data, active_commitments: newCommitments })); 
        console.info("Commitment retired successfully. Focus remains on the next priority!");
    };

    const handleSaveReview = async () => {
        setIsSaving(true);
        await updateCommitmentData(data => ({ 
            ...data,
            last_weekly_review: new Date().toISOString(),
            weekly_review_notes: reviewNotes,
        }));
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
                    <Card title="Audit: Last Week's Missed Days" icon={TrendingDown} accent='ORANGE' className='border-l-4 border-[#E04E1B] bg-[#E04E1B]/10'>
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
                    <Card title="Next Week Planning Notes" icon={Lightbulb} accent='TEAL' className='border-l-4 border-[#47A88D]'>
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


// UI COMPONENTS (Moved to global scope for fix)

// TierSuccessMap Component Definition
const TierSuccessMap = ({ tierRates }) => {
    return (
        <Card title="Tier Success Map" icon={BarChart3} accent='TEAL' className='bg-[#47A88D]/10 border-2 border-[#47A88D]'>
            <p className='text-sm text-gray-700 mb-2'>Success Rate by Leadership Tier</p>
            {Object.entries(tierRates).length > 0 ? (
                Object.entries(tierRates).map(([tier, data]) => (
                    data.total > 0 && (
                        <div key={tier} className='mb-1'>
                            <div className='flex justify-between text-xs font-semibold text-[#002E47]'>
                                <span>{LEADERSHIP_TIERS_META[tier]?.name || tier} ({data.total})</span>
                                <span className={`font-bold ${data.rate > 70 ? 'text-green-600' : 'text-orange-600'}`}>{data.rate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="h-2 rounded-full" style={{ width: `${data.rate}%`, backgroundColor: LEADERSHIP_TIERS_META[tier]?.hex || COLORS.TEAL }}></div>
                            </div>
                        </div>
                    )
                ))
            ) : (
                <p className="text-gray-500 italic text-sm">No trackable tier data yet.</p>
            )}
        </Card>
    );
};

// CommitmentHistoryModal Component Definition
const CommitmentHistoryModal = ({ isVisible, onClose, dayData, activeCommitments }) => {
    if (!isVisible || !dayData) return null;
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-xl font-bold">Scorecard History: {dayData.date}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5"/></button>
                </div>
                
                <p className="text-lg font-extrabold mb-3">Score: {dayData.score}</p>
                <p className="text-sm text-gray-700 font-semibold mb-2">Reflection Log:</p>
                <div className="p-3 bg-gray-50 border rounded-lg h-32 overflow-y-auto text-sm italic text-gray-600">
                    {dayData.reflection || 'No reflection logged for this day.'}
                </div>
                
                <Button onClick={onClose} className="mt-4 w-full">Close Details</Button>
            </div>
        </div>
    );
};

// PerfectScoreModal Component Definition
const PerfectScoreModal = ({ onClose }) => (
  <div
    className="fixed inset-0 bg-[#002E47]/70 z-50 flex items-center justify-center p-4"
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    role="dialog"
    aria-modal="true"
    aria-label="Perfect Score"
  >
    <div className="relative bg-[#FCFCFA] rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
      >
        <X className="w-5 h-5" />
      </button>

      <Crown className="w-12 h-12 text-green-600 mx-auto mb-4" />
      <h3 className="text-2xl font-extrabold text-[#002E47] mb-2">Perfect Score!</h3>
      <p className="text-sm text-gray-700 mb-4">
        You executed all commitments today. Sustain this discipline!
      </p>
      <Button onClick={onClose} className="w-full bg-green-600 hover:bg-green-700">
        Acknowledge
      </Button>
    </div>
  </div>
);


/**
 * DailyPracticeScreen: Main Scorecard View
 */
export default function DailyPracticeScreen({ initialGoal, initialTier }) {
  // CRITICAL FIX: Use useAppServices to get the state manager and data
  const { commitmentData, updateCommitmentData, callSecureGeminiAPI, hasGeminiKey, pdpData, navigate, GEMINI_MODEL} = useAppServices(); 
  
  // ADDITION 1: New state to track if we've handled the initial navigation
  const [hasNavigatedInitial, setHasNavigatedInitial] = useState(false); 

  // FIX: Call the mock scheduleMidnightReset function to simulate nightly log/reset
  // This must be done inside useEffect to be safe.
useEffect(() => {
  if (!commitmentData) return;
  resetIfNewDay(commitmentData, updateCommitmentData);
}, [commitmentData?.last_reset_date, updateCommitmentData]);

  const [view, setView] = useState('scorecard'); 
  const [isSaving, setIsSaving] = useState(false); // Global saving for reflection/resilience
  const [reflection, setReflection] = useState(commitmentData?.reflection_journal || '');
  const [isReflectionSaved, setIsReflectionSaved] = useState(false); // NEW: Reflection confirmation
  
  const [reflectionPrompt, setReflectionPrompt] = useState(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedHistoryDay, setSelectedHistoryDay] = useState(null);
  
  // FIX: State for view toggle
  const [viewMode, setViewMode] = useState('tier'); 
  const [isPerfectScoreModalVisible, setIsPerfectScoreModalVisible] = useState(false);
  const resilienceLog = commitmentData?.resilience_log || {};
  
  // MODIFIED useEffect: Only navigate to selector if initial props exist AND we haven't done it yet.
  useEffect(() => {
    // FIX 9: Prevent initialGoal/initialTier from re-navigating to the selector after a successful add.
    if (!hasNavigatedInitial && (initialGoal || initialTier)) {
      setView('selector');
      setHasNavigatedInitial(true); // Mark as done
    } else if (view === 'selector' && !hasNavigatedInitial && !initialGoal && !initialTier) {
       // If we start on selector without props (e.g., from a deep link), also mark as handled.
       setHasNavigatedInitial(true);
    }
  }, [initialGoal, initialTier, hasNavigatedInitial, view]); 


  // CRITICAL FIX: Resilience save handler now correctly uses updateCommitmentData
  const handleSaveResilience = async (newLogData) => { 
      setIsSaving(true); 
      const today = new Date().toISOString().split('T')[0];
      // FIX 2: Ensure we update the log correctly, including the 'saved' flag.
      await updateCommitmentData(data => ({ 
          ...data, // Spread data here to ensure other fields are preserved (important for API calls)
          resilience_log: { 
              ...data.resilience_log, 
              [today]: { ...newLogData, saved: true } // Explicitly set saved:true
          } 
      })); 
      setIsSaving(false);
      console.log("Resilience Log Saved.");
  };

  const setResilienceLog = () => {}; // Placeholder for the local state in ResilienceTracker

   // Sync reflection + fetch a fresh prompt when data changes
  useEffect(() => {
    setReflection(commitmentData?.reflection_journal || '');
    fetchReflectionPrompt(commitmentData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitmentData]);
  
  // Removed redundant useEffect for initialGoal/initialTier navigation, replaced by the unified useEffect.


  const userCommitments = commitmentData?.active_commitments || [];
  const commitmentHistory = commitmentData?.history || [];
  const score = calculateTotalScore(userCommitments);
  const streak = calculateStreak(commitmentHistory);
  const isPerfectScore = score.total > 0 && score.committed === score.total;

// Open the modal the first time today's score becomes perfect
useEffect(() => {
  if (isPerfectScore) setIsPerfectScoreModalVisible(true);
}, [isPerfectScore]);

// Allow closing with ESC
useEffect(() => {
  if (!isPerfectScoreModalVisible) return;
  const onKey = (e) => { if (e.key === 'Escape') setIsPerfectScoreModalVisible(false); };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}, [isPerfectScoreModalVisible]);

  
  const tierSuccessRates = useMemo(() => calculateTierSuccessRates(userCommitments, commitmentHistory), [userCommitments, commitmentHistory]);
  const lastSevenDaysHistory = useMemo(() => getLastSevenDays(commitmentHistory), [commitmentHistory]);


  /* =========================================================
     AI-Driven Reflection Prompt Logic
     FIX: Integrated the resilient API call structure
  ========================================================= */
  const fetchReflectionPrompt = async (data) => {
    if (!hasGeminiKey() || promptLoading) return;

    setPromptLoading(true);
    
    // Treat 'Pending' commitments as 'Missed' for the purpose of the reflection prompt.
    const missedCommitments = (data?.active_commitments || [])
        .filter(c => c.status === 'Missed' || c.status === 'Pending')
        .map(c => `[${LEADERSHIP_TIERS_META[c.linkedTier]?.name || 'General'}] ${c.text}`);

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
            model: GEMINI_MODEL,
        };
        const result = await callSecureGeminiAPI(payload);
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        setReflectionPrompt(text?.trim() || 'What single behavior reinforced your LIS today, and why?');
    } catch (e) {
        console.error("AI Prompt Error:", e);
        setReflectionPrompt('AI Coach is unavailable. Use this standard prompt: What single behavior reinforced your LIS today, and why?');
    } finally {
        setPromptLoading(false);
    }
  };


  /* =========================================================
     General Handlers (Fixing Status Logic & Removal)
  ========================================================= */

  const handleLogCommitment = async (id, status) => {
    setIsSaving(true);
    
    await updateCommitmentData(data => {
        const updatedCommitments = data.active_commitments.map(c => 
            c.id === id ? { ...c, status: status } : c
        );
        return { ...data, active_commitments: updatedCommitments }; // CRITICAL FIX 7: Spread ...data here
    });
    
    setIsSaving(false);
  };

  const handleRemoveCommitment = async (id) => {
    setIsSaving(true);
    const commitmentToRemove = userCommitments.find(c => c.id === id);

    if (commitmentToRemove && commitmentToRemove.status === 'Committed') {
        console.warn("Commitment is marked complete. It must remain on the scorecard until tomorrow's daily reset for data integrity.");
        setIsSaving(false);
        return;
    }
    
    await updateCommitmentData(data => {
        const updatedCommitments = data.active_commitments.filter(c => c.id !== id);
        return { ...data, active_commitments: updatedCommitments }; // CRITICAL FIX 8: Spread ...data here
    });
    
    setIsSaving(false);
  };

  const handleSaveReflection = async () => {
    setIsSaving(true);
    setIsReflectionSaved(false); 
    
    await updateCommitmentData(data => ({ ...data, reflection_journal: reflection }));
    
    setIsSaving(false);
    setIsReflectionSaved(true); 
    setTimeout(() => setIsReflectionSaved(false), 3000);
    console.log("Daily Reflection Saved.");
  };
  
  const handleOpenHistoryModal = (dayData) => {
      setSelectedHistoryDay(dayData);
      setIsHistoryModalVisible(true);
  };

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
            
        riskText = `High Risk: Inconsistency in **${LEADERSHIP_TIERS_META[frequentMissedTier]?.name || 'a core tier'}**. This threatens your ability to advance in your PDP.`;
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

  // View Mode Sorting Logic
const sortedCommitments = useMemo(() => {
  const active = [...userCommitments];
      if (viewMode === 'status') {
          return active.sort((a, b) => {
              if (a.status === 'Pending' && b.status !== 'Pending') return -1;
              if (a.status !== 'Pending' && b.status === 'Pending') return 1;
              return 0;
          });
      }
      if (viewMode === 'tier') {
          const tierOrder = ['T5', 'T4', 'T3', 'T2', 'T1']; // Sort by highest leverage first
          return active.sort((a, b) => {
              return tierOrder.indexOf(a.linkedTier) - tierOrder.indexOf(b.linkedTier);
          });
      }
      return active;
}, [userCommitments, viewMode]);


  // Final Render
  const renderView = () => {
    
    // Mock progress data for visualization
    const monthlyProgress = { daysTracked: 15, metItems: 35, totalItems: 45, rate: 78 }; 


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
                
                {/* Goal Drift Analysis Mock (The visual card remains the same) */}
                <Card 
                    title="Goal Drift Analysis" 
                    icon={predictedRisk.icon} 
                    accent={predictedRisk.icon === TrendingDown ? 'ORANGE' : 'TEAL'} 
                    className='mb-6 shadow-2xl' 
                    style={{ background: predictedRisk.icon === TrendingDown ? COLORS.ORANGE + '1A' : COLORS.TEAL + '1A', border: `2px solid ${predictedRisk.icon === TrendingDown ? COLORS.ORANGE : COLORS.TEAL}` }}
                >
                    <p className='text-base font-medium text-gray-700'>
                        {predictedRisk.text}
                    </p>
                </Card>
                
                <div className='p-3 mb-6 bg-[#002E47] rounded-xl text-white shadow-lg'>
                    <p className='text-xs font-semibold uppercase opacity-80'>Workflow Focus</p>
                    <p className='text-sm'>{microTip}</p>
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

                <Card title="Current Commitments" icon={Target} accent='TEAL' className="mb-8 border-l-4 border-[#47A88D] rounded-3xl">
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
                        {sortedCommitments.length > 0 ? (
                            // Use sorted commitments for rendering
                            sortedCommitments.map(c => (
                                <CommitmentItem
                                    key={c.id}
                                    commitment={c}
                                    onLogCommitment={handleLogCommitment}
                                    onRemove={handleRemoveCommitment} // Passed down for removal functionality
                                    isSaving={isSaving}
                                    isScorecardMode={true}
                                />
                            ))
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
                  {/* FIX: Use the component with local save state */}
                  <ResilienceTracker dailyLog={resilienceLog} handleSaveResilience={handleSaveResilience}/>
                  
                  <Card 
                      title="Daily Risk Indicator" 
                      icon={predictedRisk.icon} 
                      accent={predictedRisk.icon === TrendingDown ? 'ORANGE' : 'TEAL'}
                      className={`border-2 shadow-2xl`}
                  >
                      <p className='text-sm font-semibold text-[#002E47]'>{predictedRisk.text}</p>
                  </Card>
                  
                  <TierSuccessMap tierRates={tierSuccessRates} />
                  
                  <Card title="Monthly Consistency" icon={BarChart3} accent='TEAL' className='bg-[#47A88D]/10 border-2 border-[#47A88D]'>
                      <p className='text-xs text-gray-700 mb-2'>Avg. Completion Rate ({monthlyProgress.daysTracked} days)</p>
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                          <div 
                              className="bg-[#002E47] h-4 rounded-full transition-all duration-700" 
                              style={{ width: `${monthlyProgress.rate}%` }}
                          ></div>
                      </div>
                      <div className='flex justify-between items-center'>
                          <p className='text-sm font-semibold text-[#002E47]'>Perfect Score Streak:</p>
                          <span className='text-xl font-extrabold text-green-600 flex items-center'>
                              <Crown className='w-5 h-5 mr-1'/> {streak} Days
                          </span>
                      </div>
                      <Button onClick={() => setView('weekly-prep')} variant='outline' className='w-full mt-4 text-xs px-4 py-2 border-[#002E47] text-[#002E47] hover:bg-[#002E47]/10'>
                          <Activity className='w-4 h-4 mr-2'/> Weekly Review & Prep
                      </Button>
                      <Button onClick={() => handleOpenHistoryModal(lastSevenDaysHistory[lastSevenDaysHistory.length -1])} variant='outline' className='w-full mt-2 text-xs px-4 py-2'>
                          <Clock className='w-4 h-4 mr-2'/> View Last Score
                      </Button>
                  </Card>
              </div>
            </div>
            
            {/* Daily Reflection Section */}
            <Card title="Daily Reflection" icon={MessageSquare} accent='NAVY' className='mt-8 max-w-3xl border-l-4 border-[#002E47]'>
                <p className='text-sm text-gray-700 mb-4'>
                    {promptLoading ? (
                        <span className='flex items-center text-[#47A88D]'>
                             <div className="animate-spin h-4 w-4 border-b-2 border-gray-500 mr-2 rounded-full"></div> Drafting prompt...
                        </span>
                    ) : (
                        <span className='font-bold text-[#002E47]'>{reflectionPrompt || 'What key insight did you gain today that will improve your leadership practice tomorrow?'}</span>
                    )}
                </p>
                <textarea 
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#002E47] focus:border-[#002E47] h-32 text-gray-800" 
                    placeholder="My key reflection/insight from today's practice..."
                ></textarea>
                <Button onClick={handleSaveReflection} disabled={isSaving || reflection.length === 0} className='mt-4 bg-[#002E47] hover:bg-gray-700'>
                    {isSaving ? 'Saving...' : 'Save Reflection'}
                </Button>
                 {isReflectionSaved && (
                    <span className='ml-4 text-sm font-bold text-green-600 flex items-center mt-2'>
                        <CheckCircle className='w-4 h-4 mr-1'/> Reflection Logged!
                    </span>
                )}
            </Card>

            <CommitmentHistoryModal 
                isVisible={isHistoryModalVisible}
                onClose={() => setIsHistoryModalVisible(false)}
                dayData={selectedHistoryDay}
                activeCommitments={userCommitments}
            />
            
            {isPerfectScore && score.total > 0 && !isPerfectScoreModalVisible && (
                 <PerfectScoreModal onClose={() => setIsPerfectScoreModalVisible(false)} />
            )}
            
          </div>
        );
    }
  }; // <-- CLOSES the renderView function

  // CRITICAL FIX: The main component MUST return its content to render.
  return renderView();
} // <-- CLOSES the DailyPracticeScreen function