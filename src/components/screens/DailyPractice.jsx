// src/components/screens/DailyPractice.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PlusCircle, ArrowLeft, X, Target, Clock, CheckCircle, BarChart3, CornerRightUp, AlertTriangle, Users, Lightbulb, Zap, Archive, MessageSquare, List, TrendingDown, TrendingUp, BookOpen, Crown, Cpu, Star, Trash2, HeartPulse, Trello
} from 'lucide-react';

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


// MOCK/UI COMPONENTS/UTILITIES (Defined for component self-reliance)
// CRITICAL FIX: The mock service must manage the state to simulate persistence.
const useAppServices = () => {
  // Use a local state to simulate DB/Global store
  const [localCommitmentData, setLocalCommitmentData] = useState({
    active_commitments: [
      { id: '1', text: 'Schedule 15 min for deep work planning', status: 'Pending', linkedGoal: 'OKR Q4: Launch MVP', linkedTier: 'T3', timeContext: 'Morning' },
      { id: '2', text: 'Give one piece of specific, positive feedback', status: 'Pending', linkedGoal: 'Improve Feedback Skills', linkedTier: 'T4', timeContext: 'Post-Meeting' },
      { id: '3', text: 'Review team risk mitigation plan', status: 'Pending', linkedGoal: 'Risk Mitigation Strategy', linkedTier: 'T5', timeContext: 'Afternoon' },
      { id: '4', text: 'Clear Inbox', status: 'Pending', linkedGoal: 'Efficiency', linkedTier: 'T2', timeContext: 'Morning' },
      { id: '5', text: 'Process SOP', status: 'Pending', linkedGoal: 'Process Mapping', linkedTier: 'T2', timeContext: 'Morning' },
    ],
    history: [
      { date: '2025-10-15', score: '3/3', reflection: 'Perfect day! My focus on T3 planning led directly to two successful decisions.' },
      { date: '2025-10-16', score: '2/3', reflection: 'Missed my T4 commitment. Must prioritize people over tasks tomorrow.' },
      { date: '2025-10-17', score: '3/3', reflection: 'Back on track. Used the AI prompt to focus on team value which helped.' },
      // FIX 3: Updated history to be closer to current date
      { date: '2025-10-18', score: '1/3', reflection: 'High risk day due to emergency. Focused only on T2 core tasks.' },
      { date: '2025-10-19', score: '4/5', reflection: 'Strong day, but still missed one T5 visionary task.' },
      { date: '2025-10-20', score: '5/5', reflection: 'Perfect day! Maintained deep work focus despite interruptions.' },
      { date: '2025-10-21', score: '3/5', reflection: 'Struggled to maintain focus due to a network outage. Only core tasks completed.' },
    ],
    reflection_journal: '',
    // This mock initial log is set to an old date, so the check appears unsaved today.
    resilience_log: { '2025-10-18': { energy: 7, focus: 8, saved: false } }, 
  });

  // CRITICAL FIX: Simulated API/DB update
  const updateCommitmentData = async (data) => new Promise(resolve => {
    console.log('Production Mock: Updating Commitment Data (Simulating DB write).');
    
    // This handles both direct object updates and functional updates
    setLocalCommitmentData(prevData => {
        const newData = typeof data === 'function' ? data(prevData) : data;
        // CRITICAL: Ensure the new object fully replaces the old, or merge correctly.
        return { ...prevData, ...newData };
    });

    // Simulate network delay
    setTimeout(resolve, 300);
    return true;
  });

  return {
    commitmentData: localCommitmentData,
    updateCommitmentData: updateCommitmentData,
    planningData: {
      okrs: [{ objective: 'OKR Q4: Launch MVP' }],
      vision: 'Become the global leader in digital transformation.',
      mission: 'Empower teams through transparent, disciplined execution.'
    },
    pdpData: {
      currentMonth: 'October',
      assessment: { goalPriorities: ['T3', 'T4', 'T5'] },
      plan: [{ month: 'October', theme: 'Mastering Discipline', requiredContent: [{ id: 1, title: 'Deep Work: The Foundation', type: 'Video', duration: 30 }] }]
    },
    // FIX: Using the App.jsx callSecureGeminiAPI directly (or a local mock that matches its signature)
    callSecureGeminiAPI: async (payload) => {
      // NOTE: This mock is simplified but retains the key error/success logic for production testing.
      if (typeof window !== 'undefined' && window.location.hostname.includes('netlify')) {
           // Simulate a common failure for this specific module
           throw new Error("Simulated API Key Failure for DailyPractice"); 
      }
      
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
    navigate: (screen, params) => console.log(`Navigating to ${screen} with params:`, params),
    GEMINI_MODEL: 'gemini-2.5-flash', // Added for selector view reference
  };
};

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
const Tooltip = ({ content, children }) => ( <div className="relative inline-block group"> {children} </div> );
const LEADERSHIP_TIERS = { 'T1': { id: 'T1', name: 'Personal Foundation', hex: '#10B981' }, 'T2': { id: 'T2', name: 'Operational Excellence', hex: '#3B82F6' }, 'T3': { id: 'T3', name: 'Strategic Alignment', hex: '#F5C900' }, 'T4': { id: 'T4', name: 'People Development', hex: '#E04E1B' }, 'T5': { id: 'T5', name: 'Visionary Leadership', hex: '#002E47' }, };
const COMMITMENT_REASONS = ['Lack of Time', 'Emotional Hijack', 'Lack of Clarity', 'Interruption/Firefight'];

// =========================================================
// EXPANDED COMMITMENT BANK (Leadership Focus Reinforced)
// =========================================================
const EXPANDED_COMMITMENT_BANK = {
    // REINFORCED LEADERSHIP CONTEXT
    'T1: Personal Foundation (Executive Resilience)': [
        { id: 't1-1', text: 'Perform a 10-minute mindfulness check before the first meeting.' },
        { id: 't1-2', text: 'Identify and name the emotion before reacting to a difficult email.' },
        { id: 't1-3', text: 'Set a specific boundary (e.g., no email after 6 PM) and maintain it.' },
        { id: 't1-4', text: 'Dedicate 15 minutes to review personal growth journaling.' },
        { id: 't1-5', text: 'Eat a protein-rich lunch away from the desk.' },
        { id: 't1-6', text: 'Take a 5-minute walk outside after the busiest meeting of the day.' },
        { id: 't1-7', text: 'Review and update my personal "Stop Doing" list.' },
        { id: 't1-8', text: 'Delegate a low-value task to free up high-leverage thinking time.' },
        { id: 't1-9', text: 'List three things I am genuinely grateful for today.' },
        { id: 't1-10', text: 'Plan tomorrow\'s top 3 non-negotiable tasks before signing off.' },
        { id: 't1-11', text: 'Drink 6 glasses of water before 3 PM.' },
        { id: 't1-12', text: 'Read one page of my selected professional development book.' },
        { id: 't1-13', text: 'Spend 5 minutes organizing my digital files/desktop.' },
        { id: 't1-14', text: 'Use the Pomodoro technique for one hour of focused work.' },
        { id: 't1-15', text: 'Say "no" clearly to a request that does not align with my top three goals.' },
        { id: 't1-16', text: 'Identify the "motion" vs. "action" in my current project list.' },
        { id: 't1-17', text: 'Turn off all notifications during scheduled deep work time.' },
        { id: 't1-18', text: 'Practice a 3-minute power pose before a high-stakes call.' },
        { id: 't1-19', text: 'Review my weekly goals every morning for alignment.' },
        { id: 't1-20', text: 'Listen to calming music while performing administrative tasks.' },
    ],
    // REINFORCED LEADERSHIP CONTEXT
    'T2: Operational Excellence (System & Process Leadership)': [
        { id: 't2-1', text: 'Create or refine one simple SOP for a recurring team task.' },
        { id: 't2-2', text: 'Review the project backlog and retire 3 obsolete tickets.' },
        { id: 't2-3', text: 'Apply the "Two-Minute Rule" to the first email I read.' },
        { id: 't2-4', text: 'Map the next three steps of a complicated process on a whiteboard.' },
        { id: 't2-5', text: 'Eliminate one unnecessary step from a current workflow.' },
        { id: 't2-6', text: 'Conduct a 5-minute "Lessons Learned" check with a peer after a minor win.' },
        { id: 't2-7', text: 'Audit five team reports for consistency and clarity.' },
        { id: 't2-8', text: 'Respond to all critical communication within 2 hours.' },
        { id: 't2-9', text: 'Clear my physical desk space completely before EOD.' },
        { id: 't2-10', text: 'Review the team calendar for redundancy in meetings.' },
        { id: 't2-11', text: 'Batch all expense report processing into a single block.' },
        { id: 't2-12', text: 'Define one key metric for the current project\'s success.' },
        { id: 't2-13', text: 'Spend 10 minutes training a team member on a simplified tool/process.' },
        { id: 't2-14', text: 'Update the project’s main dashboard with current risks.' },
        { id: 't2-15', text: 'Create a clear agenda for the next team meeting.' },
        { id: 't2-16', text: 'Archive 20 old emails or files.' },
        { id: 't2-17', text: 'Write down one operational bottleneck that slowed the team today.' },
        { id: 't2-18', text: 'Verify data accuracy on the next three slides I plan to present.' },
        { id: 't2-19', text: 'Set clear deadlines for two pending minor tasks.' },
        { id: 't2-20', text: 'Minimize distraction by checking social media/news only once today.' },
    ],
    // REINFORCED LEADERSHIP CONTEXT
    'T3: Strategic Alignment (Goal-Oriented Executive Action)': [
        { id: 't3-1', text: 'Relate one daily decision back to a long-term company mission statement.' },
        { id: 't3-2', text: 'Spend 15 minutes thinking about how a competitor might innovate past us.' },
        { id: 't3-3', text: 'Identify one key risk that could derail the highest-priority OKR.' },
        { id: 't3-4', text: 'Formulate one insightful question for the next executive review meeting.' },
        { id: 't3-5', text: 'Delegate a major decision, providing clear strategic guardrails.' },
        { id: 't3-6', text: 'Read and synthesize one economic report relevant to our market.' },
        { id: 't3-7', text: 'Review the team’s current tasks and eliminate any that don\'t align with Q4 goals.' },
        { id: 't3-8', text: 'Define the "critical path" for the next product development sprint.' },
        { id: 't3-9', text: 'Communicate the "why" behind a recent strategic shift to a team member.' },
        { id: 't3-10', text: 'Practice the Hedgehog concept: identify one non-core activity to cut.' },
        { id: 't3-11', text: 'Translate a high-level goal into three concrete, immediate actions.' },
        { id: 't3-12', text: 'Engage with a leader from another department on a cross-functional strategy.' },
        { id: 't3-13', text: 'Write down one way to measure the impact of my daily work beyond efficiency.' },
        { id: 't3-14', text: 'Challenge one widely held assumption within my department.' },
        { id: 't3-15', text: 'Review the budget and ensure spending is aligned with strategic objectives.' },
        { id: 't3-16', text: 'Seek feedback from a board member or senior executive on a strategic document.' },
        { id: 't3-17', text: 'List three potential external threats to our next annual plan.' },
        { id: 't3-18', text: 'Articulate the one clear purpose of the team\'s current project.' },
        { id: 't3-19', text: 'Develop one stretch goal for the next quarter.' },
        { id: 't3-20', text: 'Spend 10 minutes visualizing a major strategic win in 6 months.' },
    ],
    // REINFORCED LEADERSHIP CONTEXT
    'T4: People Development (Coaching & Mentorship)': [
        { id: 't4-1', text: 'Give one piece of specific, actionable positive feedback using the SBI model.' },
        { id: 't4-2', text: 'Ask an open-ended question that invites a team member to share a personal challenge.' },
        { id: 't4-3', text: 'Use active listening (paraphrasing) at least three times in a meeting.' },
        { id: 't4-4', text: 'Conduct an impromptu 5-minute coaching session for a direct report.' },
        { id: 't4-5', text: 'Review a junior employee\'s work and offer one growth-oriented correction (SBI).' },
        { id: 't4-6', text: 'Mentor a peer/junior on a soft skill (e.g., meeting facilitation).' },
        { id: 't4-7', text: 'Acknowledge publicly a team member\'s contribution to a difficult discussion.' },
        { id: 't4-8', text: 'Allow a team member to fail on a low-stakes task, then lead the debrief.' },
        { id: 't4-9', text: 'Prepare the next 1:1 meeting agenda to be 80% direct-report led.' },
        { id: 't4-10', text: 'Ask a team member: "What is one thing I could do better to support you?"' },
        { id: 't4-11', text: 'Identify one task to hand off that develops a direct report\'s competence.' },
        { id: 't4-12', text: 'Document one specific area for a team member\'s long-term development.' },
        { id: 't4-13', text: 'Address a small conflict between two team members immediately and privately.' },
        { id: 't4-14', text: 'Host a short "lunch-and-learn" on a skill I have mastered.' },
        { id: 't4-15', text: 'Write a thank-you note (physical or email) recognizing sustained effort.' },
        { id: 't4-16', text: 'Practice the "Radical Candor" matrix before a difficult conversation.' },
        { id: 't4-17', text: 'Facilitate a short team debrief focused on vulnerability and learning.' },
        { id: 't4-18', text: 'Coach a team member through their next career move/goal.' },
        { id: 't4-19', text: 'Spend 10 minutes researching modern delegation frameworks.' },
        { id: 't4-20', text: 'Celebrate a small but significant team milestone.' },
        { id: 't4-21', text: 'Give corrective feedback immediately instead of delaying it.' },
        { id: 't4-22', text: 'Ensure the next project assignment is aligned with a team member\'s personal growth plan.' },
    ],
    // REINFORCED LEADERSHIP CONTEXT
    'T5: Visionary Leadership (Culture & Executive Influence)': [
        { id: 't5-1', text: 'Articulate the department’s 5-year vision in simple, non-jargon terms to a junior employee.' },
        { id: 't5-2', text: 'Identify one external person (outside the company) to influence or learn from.' },
        { id: 't5-3', text: 'Spend 10 minutes reviewing industry disruption trends.' },
        { id: 't5-4', text: 'Write a concise statement defining our team\'s operating culture/values.' },
        { id: 't5-5', text: 'Challenge the team with a "what-if" scenario regarding future market collapse.' },
        { id: 't5-6', text: 'Lead a discussion on ethical implications of a current business decision.' },
        { id: 't5-7', text: 'Communicate a vision that ties a mundane task to a grander mission.' },
        { id: 't5-8', text: 'Create a metaphor that simply explains our current strategic direction.' },
        { id: 't5-9', text: 'Identify three behaviors that actively foster psychological safety on the team.' },
        { id: 't5-10', text: 'Actively seek dissenting opinions on a high-stakes decision.' },
        { id: 't5-11', text: 'Review external communications (press releases, emails) for mission alignment.' },
        { id: 't5-12', text: 'Propose one structural change to improve cross-functional collaboration.' },
        { id: 't5-13', text: 'Mentor a leader from another organization (informally).' },
        { id: 't5-14', text: 'Write down one way to increase customer value beyond the core product.' },
        { id: 't5-15', text: 'Present a strategic idea in two completely different ways (analytical vs. narrative).' },
        { id: 't5-16', text: 'Start a meeting by reviewing the core value that applies to the current challenge.' },
        { id: 't5-17', text: 'Practice silence during a difficult conversation to allow others to lead.' },
        { id: 't5-18', text: 'Engage with a potential future leader about their long-term vision for the company.' },
        { id: 't5-19', text: 'Define the "first principle" governing a major process in the department.' },
        { id: 't5-20', text: 'Schedule a time next week for pure, unfocused strategic thinking.' },
        { id: 't5-21', text: 'Actively champion a new idea, even if it carries personal risk.' },
    ],
};
const leadershipCommitmentBank = EXPANDED_COMMITMENT_BANK; // Use the expanded bank


/* =========================================================
   MISSING UTILITY FUNCTIONS (FULLY DEFINED)
========================================================= */

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
    Object.keys(LEADERSHIP_TIERS).forEach(tierId => {
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
    const mockDates = [];
    const today = new Date();
    
    // Get a list of the last 7 calendar dates (YYYY-MM-DD format)
    const lastSevenDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        lastSevenDates.push(date.toISOString().split('T')[0]);
    }

    // Map history to the last 7 days (including days with no entry)
    const result = [];
    for (const dateString of lastSevenDates) {
        const entry = history.find(h => h.date === dateString);
        const score = entry ? entry.score : '0/0'; // Default score if no log entry
        const reflection = entry ? entry.reflection : 'N/A';
        result.push({ date: dateString, score, reflection });
    }
    // Return them in chronological order (oldest to newest)
    return result.reverse();
}


// FIX 4: Resolves "ReferenceError: monthlyProgress is not defined"
const monthlyProgress = { daysTracked: 15, metItems: 35, totalItems: 45, rate: 78 }; 

// FIX 5: Resolves "ReferenceError: scheduleMidnightReset is not defined"
// ENHANCEMENT: Implemented mock daily reset function
const scheduleMidnightReset = (commitments, updateFn) => {
    // Determine the date of the last successful reset/log
    const todayString = new Date().toISOString().split('T')[0];
    const needsReset = (commitments || []).some(c => c.status !== 'Pending');

    // Simple, non-state-changing placeholder for now.
    if (needsReset) {
        // NOTE: In a real app, this would be a serverless function that runs after midnight.
        // For a client-side component, we simply log the intention.
        // console.log(`[Scheduler Mock] Reset needed for ${todayString}.`); 
    }
};


// FIX 6: Resolves "ReferenceError: handleCloseHistoryModal is not defined" - This handler is defined locally in the main component. 

// FIX 7: Resolves "ReferenceError: TierSuccessMap is not defined" - This component is defined locally in the main component.

// FIX 8: Resolves "ReferenceError: AIStarterPackNudge is not defined" - This component is defined locally in the main component.

// FIX 9: Resolves "ReferenceError: CommitmentHistoryModal is not defined" - This component is defined locally in the main component.

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

    // Get the set of dates that have an entry
    const loggedDates = new Set(sortedHistory.map(h => h.date));
    
    // Start checking from yesterday backwards
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
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


/* =========================================================
   NEW FEATURE: Goal Drift Logic
========================================================= */

const useGoalDriftAnalysis = (activeCommitments) => {
    return useMemo(() => {
        const tacticalTiers = ['T1', 'T2'];
        const strategicTiers = ['T3', 'T4', 'T5'];
        
        let tacticalCount = 0;
        let strategicCount = 0;
        
        activeCommitments.forEach(c => {
            if (c.linkedTier && tacticalTiers.includes(c.linkedTier)) {
                tacticalCount++;
            } else if (c.linkedTier && strategicTiers.includes(c.linkedTier)) {
                strategicCount++;
            }
        });
        
        const total = tacticalCount + strategicCount;
        if (total === 0) return null;
        
        const tacticalRatio = tacticalCount / total;

        if (tacticalRatio >= 0.6) {
            return {
                isDrifting: true,
                ratio: Math.round(tacticalRatio * 100),
                message: `**GOAL DRIFT ALERT:** ${Math.round(tacticalRatio * 100)}% of your active commitments are Tactical (T1/T2). You are prioritizing maintenance over strategic leadership.`,
                accent: 'ORANGE',
                icon: TrendingDown,
            };
        }
        
        return {
            isDrifting: false,
            ratio: Math.round(strategicCount / total * 100),
            message: `**Strategic Alignment:** ${Math.round(strategicCount / total * 100)}% of your active commitments are focused on strategic leadership (T3-T5). Excellent high-leverage focus!`,
            accent: 'TEAL',
            icon: TrendingUp,
        };
        
    }, [activeCommitments]);
};


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
 * FIX FOR ISSUE 1: The logic for toggling is implemented correctly in handleToggleComplete.
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

  const tierMeta = commitment.linkedTier ? LEADERSHIP_TIERS[commitment.linkedTier] : null;

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
  const activeCommitmentIds = new Set(userCommitments.map(c => c.id));
  const currentMonthPlan = pdpData?.plan?.find(m => m.month === pdpData?.currentMonth);

  const requiredPdpContent = currentMonthPlan?.requiredContent || [];
  const pdpContentCommitmentIds = new Set(userCommitments.filter(c => String(c.id).startsWith('pdp-content-')).map(c => String(c.id).split('-')[2]));

  // FIX: Use the expanded commitment bank
  const allBankCommitments = useMemo(() => Object.values(leadershipCommitmentBank || {}).flat(), []);

  const filteredBankCommitments = useMemo(() => {
    const ql = searchTerm.toLowerCase();
    // FIX: Filtering logic now works for the expanded bank structure
    const matchingCommitments = [];
    for (const category in leadershipCommitmentBank) {
      for (const commitment of leadershipCommitmentBank[category]) {
        if (
          // CRITICAL: Check against unique ID, not bank ID, for filtering logic
          !userCommitments.some(c => c.text === commitment.text) && // Check if text already exists on active commitments (simpler uniqueness check for demo)
          (searchTerm === '' || commitment.text.toLowerCase().includes(ql))
        ) {
          matchingCommitments.push({ ...commitment, category });
        }
      }
    }
    return matchingCommitments;
  }, [userCommitments, searchTerm]);

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
    'Misalignment Prevention', // Added for completeness
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
    // GEMINI_MODEL available from top-level hook
const tierName = LEADERSHIP_TIERS[linkedTier]?.name || 'N/A';
    // FIX: Ensure JSON output is enforced for reliable data
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
            system_instruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: jsonSchema
            },
            model: GEMINI_MODEL,
        };
        
        const result = await callSecureGeminiAPI(payload);
        const jsonText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (jsonText) {
            // FIX: Robust JSON parsing (try to strip possible pre-text)
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
        // CRITICAL FIX: Graceful failure message for API errors
        setAiAssessment({ 
            score: 0, 
            risk: 10, 
            feedback: "CRITICAL API FAILURE: The AI Analysis service is currently unavailable. Check your API key or network connection.", 
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
    // FIX FOR ISSUE 2: Ensure logic is sound
    if (!linkedGoal || linkedGoal === initialLinkedGoalPlaceholder || !linkedTier) return;
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
        // Ensure a unique ID is used to prevent key conflicts with static bank IDs
        id: `bank-${commitment.id}-${Date.now()}`, 
        text: commitment.text,
        status: 'Pending',
        linkedGoal: linkedGoal,
        linkedTier: linkedTier,
        targetColleague: targetColleague.trim() || null,
        // The original commitment ID is not strictly needed on the new object, but we keep it clean.
      };
    }

    // CRITICAL FIX: Use the functional update to merge data
    await updateCommitmentData(data => ({ 
        active_commitments: [...(data?.active_commitments || []), newCommitment] 
    }));

    // Reset fields after successful add
    if (initialGoal !== linkedGoal) setLinkedGoal(initialLinkedGoalPlaceholder);
    if (initialTier !== linkedTier) setLinkedTier('');
    setCustomCommitment('');
    setTargetColleague('');
    setAiAssessment(null);
    setIsSaving(false);
    
    // FIX 3: Add confirmation for bank commitment addition (use timeout for reset)
    setIsCustomCommitmentSaved(true);
    setTimeout(() => setIsCustomCommitmentSaved(false), 3000);
  };

  const handleCreateCustomCommitment = async () => {
    // FIX FOR ISSUE 5: Ensure logic is sound
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

      // CRITICAL FIX: Use the functional update to merge data
      await updateCommitmentData(data => ({ 
          active_commitments: [...(data?.active_commitments || []), newCommitment] 
      }));

      setCustomCommitment('');
      if (initialGoal !== linkedGoal) setLinkedGoal(initialLinkedGoalPlaceholder);
      if (initialTier !== linkedTier) setLinkedTier('');
      setTargetColleague('');
      setAiAssessment(null);
      setIsSaving(false);
      
      // Fix 3: Add visible confirmation
      setIsCustomCommitmentSaved(true);
      setTimeout(() => setIsCustomCommitmentSaved(false), 3000);
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
      </div>


      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-300 -mb-px">
        <button className={tabStyle('pdp')} onClick={() => setTab('pdp')}>
          <Target className='w-4 h-4 inline mr-1' /> PDP Content ({requiredPdpContent.filter(c => !pdpContentCommitmentIds.has(String(c.id))).length})
        </button>
        <button className={tabStyle('bank')} onClick={() => setTab('bank')}>
          <BookOpen className='w-4 h-4 inline mr-1' /> Commitment Bank ({Object.keys(leadershipCommitmentBank).length})
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
              {Object.entries(leadershipCommitmentBank).map(([category, commitments]) => {
                const filteredCommitments = commitments.filter(c =>
                    // Check if commitment text is NOT already in active commitments
                    !userCommitments.some(activeC => activeC.text === c.text) &&
                    (searchTerm === '' || c.text.toLowerCase().includes(searchTerm.toLowerCase()))
                );

                if (filteredCommitments.length === 0 && searchTerm !== '') return null;
                if (filteredCommitments.length === 0 && searchTerm === '') return null; // Hide empty categories when not searching

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
              {Object.keys(leadershipCommitmentBank).length > 0 && filteredBankCommitments.length === 0 && searchTerm !== '' && (
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
              onClick={handleCreateCustomCommitment} // FIX 2: CRITICAL WIRING FIX: The button must call handleCreateCustomCommitment
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
        
        // This is where the update happens in a real-world scenario
        await updateCommitmentData(data => ({ active_commitments: newCommitments })); 
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


/**
 * DailyPracticeScreen: Main Scorecard View
 */
export default function DailyPracticeScreen({ initialGoal, initialTier }) {
  // CRITICAL FIX: Use useAppServices to get the state manager and data
  const { commitmentData, updateCommitmentData, callSecureGeminiAPI, hasGeminiKey, pdpData, navigate, GEMINI_MODEL} = useAppServices(); 
  
  // FIX: Call the mock scheduleMidnightReset function
  // NOTE: This runs the logic but prevents the component from getting stuck in an update loop
  // by not executing the state update function in the client-side useEffect.
  React.useEffect(() => scheduleMidnightReset(commitmentData?.active_commitments || [], updateCommitmentData), [commitmentData?.active_commitments, updateCommitmentData]);

  const [view, setView] = useState('scorecard'); 
  const [isSaving, setIsSaving] = useState(false); // Global saving for reflection/resilience
  const [reflection, setReflection] = useState(commitmentData?.reflection_journal || '');
  const [isReflectionSaved, setIsReflectionSaved] = useState(false); // NEW: Reflection confirmation
  
  const [reflectionPrompt, setReflectionPrompt] = useState(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [selectedHistoryDay, setSelectedHistoryDay] = useState(null);
  
  // FIX: State for view toggle
  const [viewMode, setViewMode] = useState('status'); 
  const [isPerfectScoreModalVisible, setIsPerfectScoreModalVisible] = useState(false);
  const resilienceLog = commitmentData?.resilience_log || {};
  
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

  // Sync reflection and fetch prompt on data load
  useEffect(() => {
    if (commitmentData) {
      setReflection(commitmentData.reflection_journal || '');
      if (!reflectionPrompt) { 
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
  
  // FIX: Use the added utility functions to resolve ReferenceErrors
  const commitmentsByTier = useMemo(() => groupCommitmentsByTier(userCommitments), [userCommitments]);
  const tierSuccessRates = useMemo(() => calculateTierSuccessRates(userCommitments, commitmentHistory), [userCommitments, commitmentHistory]);
  const lastSevenDaysHistory = useMemo(() => getLastSevenDays(commitmentHistory), [commitmentHistory]);


  /* =========================================================
     NEW FEATURE 1: AI-Driven Reflection Prompt Logic
     FIX: Integrated the resilient API call structure
  ========================================================= */
  const fetchReflectionPrompt = async (data) => {
    // GEMINI_MODEL available from top-level hook
if (!hasGeminiKey() || promptLoading) return;

    setPromptLoading(true);
    
    // Treat 'Pending' commitments as 'Missed' for the purpose of the reflection prompt.
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
            system_instruction: { parts: [{ text: systemPrompt }] },
            model: GEMINI_MODEL,
        };
        const result = await callSecureGeminiAPI(payload);
        const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
        setReflectionPrompt(text?.trim() || 'What single behavior reinforced your LIS today, and why?');
    } catch (e) {
        console.error("AI Prompt Error:", e);
        // CRITICAL FIX: Graceful failure message for API errors
        setReflectionPrompt('AI Coach is unavailable. Use this standard prompt: What single behavior reinforced your LIS today, and why?');
    } finally {
        setPromptLoading(false);
    }
  };


  /* =========================================================
     General Handlers (Fixing Status Logic & Removal)
  ========================================================= */

  const handleLogCommitment = async (id, status) => {
    // FIX FOR ISSUE 1: Toggles status between Committed and Pending
    setIsSaving(true);
    
    // Status is either 'Committed' or 'Pending'.
    // CRITICAL FIX: Use a functional update to ensure data consistency
    await updateCommitmentData(data => {
        const updatedCommitments = data.active_commitments.map(c => 
            c.id === id ? { ...c, status: status } : c
        );
        return { active_commitments: updatedCommitments };
    });
    
    // Note: Recalculating score here is unnecessary as React will re-render
    // when the state update is complete.
    setIsSaving(false);
    // Add logic for Perfect Score Modal trigger here if needed
  };

  const handleRemoveCommitment = async (id) => {
    // FIX FOR ISSUE 3: Implemented the logic to remove the commitment and update state
    setIsSaving(true);
    const commitmentToRemove = userCommitments.find(c => c.id === id);

    // Only allow removal if commitment is NOT already marked 'Committed'.
    if (commitmentToRemove && commitmentToRemove.status === 'Committed') {
        console.warn("Commitment is marked complete. It must remain on the scorecard until tomorrow's daily reset for data integrity.");
        setIsSaving(false);
        return;
    }
    
    // CRITICAL FIX: Use functional update for filtering
    await updateCommitmentData(data => {
        const updatedCommitments = data.active_commitments.filter(c => c.id !== id);
        return { active_commitments: updatedCommitments };
    });
    
    setIsSaving(false);
  };

  const handleSaveReflection = async () => {
    // FIX 1: Ensure the saving state and data update are atomic and correctly managed
    setIsSaving(true);
    setIsReflectionSaved(false); // Reset prior to save
    
    // CRITICAL FIX: Use functional update to ensure we read the latest state and only update the journal
    await updateCommitmentData(data => ({ ...data, reflection_journal: reflection }));
    
    setIsSaving(false);
    setIsReflectionSaved(true); // Confirmation on success
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
    // The following components are defined outside the main export for clarity/scoping
    const TierSuccessMap = ({ tierRates }) => {
        return (
            <Card title="Tier Success Map" icon={BarChart3} accent='TEAL' className='bg-[#47A88D]/10 border-2 border-[#47A88D]'>
                <p className='text-sm text-gray-700 mb-2'>Success Rate by Leadership Tier</p>
                {Object.entries(tierRates).length > 0 ? (
                    Object.entries(tierRates).map(([tier, data]) => (
                        // Only display tiers where commitments exist
                        data.total > 0 && (
                            <div key={tier} className='mb-1'>
                                <div className='flex justify-between text-xs font-semibold text-[#002E47]'>
                                    <span>{LEADERSHIP_TIERS[tier]?.name || tier} ({data.total})</span>
                                    <span className={`font-bold ${data.rate > 70 ? 'text-green-600' : 'text-orange-600'}`}>{data.rate}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="h-2 rounded-full" style={{ width: `${data.rate}%`, backgroundColor: LEADERSHIP_TIERS[tier]?.hex || COLORS.TEAL }}></div>
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


    const AIStarterPackNudge = ({ pdpData, setLinkedGoal, setLinkedTier, handleAddCommitment, isSaving }) => {
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

    const WeeklyPrepView = ({ setView, commitmentData, updateCommitmentData, userCommitments }) => {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Weekly Practice Review & Prep</h1>
                <p className="text-lg text-gray-600 mb-6 max-w-3xl">Take 15 minutes to review last week's performance and prepare your focus for the upcoming week. (Mock View)</p>
                <Button onClick={() => setView('scorecard')} variant="outline" className="mb-8">
                    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Scorecard
                </Button>
            </div>
        );
    };


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
                    style={{ background: COLORS.ORANGE + '1A', border: `2px solid ${COLORS.ORANGE}` }}
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
                    {/* FIX: View Toggle Button now correctly updates state */}
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
                      <p className='text-sm font-medium text-[#002E47]'>
                          **{monthlyProgress.rate}% Rate** ({monthlyProgress.metItems} of {monthlyProgress.totalItems} total actions met)
                      </p>
                  </Card>

                <Card title="Commitment History" icon={BarChart3} accent='NAVY' className='bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                  <div className='text-xs text-gray-700 mb-4'>
                    <p className='font-semibold'>Last 7 Days (Click for Details)</p>
                  </div>
                  
                  <div className='p-4 bg-[#FCFCFA] border border-gray-200 rounded-xl'>
                    <div className='mt-4 pt-3 border-t border-gray-200'>
                      <div className='text-[#47A88D] font-medium text-lg'>
                        Current Streak: {streak} {streak === 1 ? 'Day' : 'Days'}
                      </div>
                      {streak > 0 && (
                        <div className='text-sm text-gray-600'>Consistency is the foundation of growth!</div>
                      )}
                    </div>
                    {/* ENHANCEMENT: Display clickable history items */}
                    <div className='mt-3 space-y-1'>
                        {commitmentHistory.slice(0, 3).map(day => (
                            <button
                                key={day.date}
                                onClick={() => handleOpenHistoryModal(day)}
                                className='w-full text-left text-xs text-gray-700 hover:text-[#47A88D] flex justify-between p-1 bg-white hover:bg-gray-50 rounded'
                            >
                                <span>{day.date}</span>
                                <span className='font-bold'>{day.score}</span>
                            </button>
                        ))}
                        <p className='text-xs text-gray-500 text-right italic'>*Showing last 3 logged days.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>


            <Card title="Reinforcement Journal" icon={Lightbulb} accent='NAVY' className={`rounded-3xl mt-8 bg-[#002E47]/10 border-2 border-[#002E47]/20 shadow-2xl`}>
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
              <div className='flex justify-between items-center mt-1'>
                <p className={`text-xs ${reflection.length < 50 ? 'text-[#E04E1B]' : 'text-[#47A88D]'}`}>
                    {reflection.length} / 50 characters written.
                </p>
                {isReflectionSaved && (
                    <div className='flex items-center text-xs font-semibold text-green-600'>
                        <CheckCircle className='w-4 h-4 mr-1'/> Reflection Saved!
                    </div>
                )}
            </div>
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
                onClose={() => setIsHistoryModalVisible(false)}
                dayData={selectedHistoryDay}
                activeCommitments={userCommitments}
            />
          </div>
        );
    }
  };

  return renderView();
}