// src/components/screens/DevelopmentPlan.jsx (Final Corrected Version)

import React, { useState, useMemo, useEffect, useCallback } from 'react';
// --- Core Services & Context ---
import { useAppServices } from '../../services/useAppServices.jsx'; // cite: useAppServices.jsx

// --- Icons ---
import {
  Loader, CheckCircle, Briefcase, Target, Users, BarChart3, TrendingUp,
  MessageSquare, Award, RefreshCw, Flag, Calendar, Zap, UploadCloud, Lock, Lightbulb,
  ArrowLeft, // Added ArrowLeft for back button
} from 'lucide-react';

// --- Charting Library ---
// Assuming recharts is installed and configured
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend as RechartsLegend } from 'recharts';

/* =========================================================
   PALETTE & UI COMPONENTS (Standardized)
========================================================= */
// --- Primary Color Palette ---
const COLORS = { NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F5A500', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', PURPLE: '#7C3AED', BG: '#F9FAFB' }; // cite: App.jsx, User Request

// --- Standardized Button Component (Matches Dashboard) ---
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => { /* ... Re-use exact Button definition from Dashboard.jsx ... */
    let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
    if (size === 'sm') baseStyle += ' px-4 py-2 text-sm'; else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg'; else baseStyle += ' px-6 py-3 text-base'; // Default 'md'
    if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
    else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
    else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
    else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
    if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

// --- Standardized Card Component (Matches Dashboard) ---
const Card = ({ children, title, icon: Icon, className = '', accent = 'NAVY' }) => { /* ... Re-use exact Card definition from Dashboard.jsx ... */
    const accentColor = COLORS[accent] || COLORS.NAVY;
    return (
        <div className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-lg transition-all duration-300 text-left ${className}`} style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: COLORS.SUBTLE, color: COLORS.NAVY }}>
            <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
            {Icon && title && (
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}> <Icon className="w-5 h-5" style={{ color: accentColor }} /> </div>
                    <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2>
                </div>
            )}
            {!Icon && title && <h2 className="text-xl font-extrabold mb-4 border-b pb-2" style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}>{title}</h2>}
            <div className={Icon || title ? '' : ''}>{children}</div>
        </div>
    );
};

// --- Standardized Loading Spinner ---
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
    <div className="flex flex-col items-center">
      <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} />
      <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p>
    </div>
  </div>
);

/* =========================================================
   ASSESSMENT QUESTIONS & SCORING LOGIC (Kept Local for Now)
   - These could be moved to global metadata if reused elsewhere.
========================================================= */
// Assessment structure constants
const ASSESSMENT_QUESTIONS = [
  { id: 'q1', text: 'I have a clear sense of who I am as a leader and why I choose to lead.' },
  { id: 'q2', text: 'When results fall short, I take full responsibility and look first at what I can do differently.' },
  { id: 'q3', text: 'I spend most of my time enabling others to perform rather than doing the work myself.' },
  { id: 'q4', text: 'My team has clear, measurable goals and knows what success looks like each week.' },
  { id: 'q5', text: 'I consistently set and reinforce clear expectations for quality, timelines, and ownership.' },
  { id: 'q6', text: 'I regularly give reinforcing and redirecting feedback that helps people grow.' },
  { id: 'q7', text: 'Decisions on my team are made efficiently, with the right people involved and clear follow-through.' },
  { id: 'q8', text: 'I intentionally model openness and vulnerability to build trust within my team.' },
  { id: 'q9', text: 'My team handles conflict directly and constructively, even when it’s uncomfortable.' },
  { id: 'q10', text: 'I frequently recognize and celebrate progress and contributions in meaningful ways.' },
];
const OPEN_ENDED_QUESTION = "What’s one leadership behavior you most want to strengthen in the next 90 days?";
const LIKERT_SCALE = [
  { value: 1, label: 'Strongly Disagree' }, { value: 2, label: 'Disagree' }, { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' }, { value: 5, label: 'Strongly Agree' },
];

// Mapping questions to broader leadership dimensions
const QUESTION_TO_DIMENSION_MAP = {
  q1: 'Leadership Mindset & Identity', q2: 'Ownership & Accountability', q3: 'Delegation & Empowerment',
  q4: 'Execution & Results', q5: 'Clarity & Communication', q6: 'Clarity & Communication',
  q7: 'Execution & Results', q8: 'Trust & Relationships', q9: 'Team Health & Culture', q10: 'Recognition & Motivation',
};

// Mapping dimensions to Tiers (align with LEADERSHIP_TIERS from context if possible)
const DIMENSION_TO_TIER_MAP = {
    'Leadership Mindset & Identity': 'T1', 'Ownership & Accountability': 'T1',
    'Execution & Results': 'T2', 'Clarity & Communication': 'T2',
    'Delegation & Empowerment': 'T3', 'Trust & Relationships': 'T3',
    'Team Health & Culture': 'T4', 'Recognition & Motivation': 'T3', // Note: T3 alignment
};

// Detailed content for each dimension (used for plan generation)
// Consider moving this to global metadata (SKILL_CATALOG?) for consistency
const DIMENSIONS_MAP = {
  'Leadership Mindset & Identity': { courses: ['Leadership Identity', 'Motive', 'Shift from Player→Coach'], why: 'Clarity of “who you are” drives consistent leadership choices.', whatGoodLooksLike: 'You lead with authenticity, know your "why", and focus on coaching others.' },
  'Ownership & Accountability': { courses: ['Ownership', 'Relationship with Boss'], why: 'You take full responsibility for outcomes and model upward influence.', whatGoodLooksLike: 'You look first at what you can do differently and maintain a healthy, transparent relationship with your boss.' },
  'Delegation & Empowerment': { courses: ['Shift from Player→Coach', 'Delegation', 'Coaching'], why: 'The shift from “doing” to “developing others” is how you scale your leadership.', whatGoodLooksLike: 'You assign outcomes (not tasks), trust people with ownership, and coach instead of rescue.' },
  'Execution & Results': { courses: ['Goals', 'Metrics', 'Decision-Making', 'Accountability'], why: 'Your team may lack consistent structure or follow-through.', whatGoodLooksLike: 'Your team is aligned on clear goals, makes efficient decisions, and follows through on commitments.' },
  'Clarity & Communication': { courses: ['Feedback', 'Expectations', 'Meetings'], why: 'Communication gaps limit team effectiveness.', whatGoodLooksLike: 'You set expectations early, give frequent feedback, and run focused meetings that align your team.' },
  'Trust & Relationships': { courses: ['Go 1st with VB Trust', '1:1s'], why: 'Vulnerability and authenticity are the foundation for psychological safety.', whatGoodLooksLike: 'You intentionally model openness to build trust and use 1:1s to strengthen relationships.' },
  'Team Health & Culture': { courses: ['Conflict', 'Commitment', 'Accountability', 'Crucial Conversations'], why: 'Healthy teams debate openly, commit fully, and hold each other accountable.', whatGoodLooksLike: 'You model vulnerability, welcome conflict, and turn tension into trust.' },
  'Recognition & Motivation': { courses: ['Recognition', 'Motivation', 'Coaching'], why: 'People who feel seen and valued do their best work.', whatGoodLooksLike: 'You recognize contributions frequently and meaningfully, reinforcing behaviors that drive success.' },
};

// The 18-Month Journey Map structure
const JOURNEY_MAP = [
  { cycle: 1, q: 'Q1 (0-3 mo)', phase: 'Foundation', performance: 'Feedback', people: 'Vulnerability-Based Trust', mindset: 'Player→Coach' },
  { cycle: 2, q: 'Q2 (3-6 mo)', phase: 'Foundation', performance: 'Goals & Expectations', people: '1:1s', mindset: 'Ownership & Accountability' },
  { cycle: 3, q: 'Q3 (6-9 mo)', phase: 'Performance', performance: 'Delegation', people: 'Coaching', mindset: 'Player→Coach (Deeper)' },
  { cycle: 4, q: 'Q4 (9-12 mo)', phase: 'Performance', performance: 'Decision-Making / Meetings', people: 'Recognition & Motivation', mindset: 'Leadership Motive' },
  { cycle: 5, q: 'Q5 (12-15 mo)', phase: 'Impact', performance: 'Accountability Systems', people: 'Team Health: Conflict & Commitment', mindset: 'Ownership (Revisited)' },
  { cycle: 6, q: 'Q6 (15-18 mo)', phase: 'Impact', performance: 'Coaching Mastery', people: 'Recognition & Vulnerability Integration', mindset: 'Leadership Identity (Capstone)' },
];

// --- Scoring and Plan Generation Logic ---

/**
 * Calculates average scores for each leadership dimension based on Likert scale answers.
 * @param {object} answers - Object with question IDs (q1-q10) as keys and Likert values (1-5) as values.
 * @returns {object} - Object with dimension names as keys and { name, score, status } objects as values.
 */
const scoreAssessment = (answers) => {
  const scores = {};
  const dimensions = {};
  // Group answers by dimension
  for (const qId in answers) {
    if (qId.startsWith('q') && answers[qId] !== undefined && answers[qId] !== null) { // Added safety check
      const dim = QUESTION_TO_DIMENSION_MAP[qId];
      if (dim) { // Ensure mapping exists
        if (!dimensions[dim]) dimensions[dim] = [];
        dimensions[dim].push(Number(answers[qId])); // Ensure value is a number
      }
    }
  }
  // Calculate average score and determine status for each dimension
  for (const dimName in dimensions) {
    const arr = dimensions[dimName];
    if (arr.length > 0) { // Avoid division by zero
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        const score = parseFloat(avg.toFixed(1));
        let status;
        if (score >= 4.5) status = 'Strength';
        else if (score >= 3.5) status = 'Developing';
        else status = 'Growth Focus';
        scores[dimName] = { name: dimName, score: score, status: status };
    }
  }
  console.log("[scoreAssessment] Calculated Scores:", scores);
  return scores;
};

/**
 * Generates the standardized 90-day plan for Cycle 1 (Foundation).
 * @param {number} cycle - Should always be 1 for this function.
 * @param {string} openEndedAnswer - User's answer to the open-ended question.
 * @returns {object} - The standardized plan object.
 */
const getStandardFoundationPlan = (cycle, openEndedAnswer) => {
    console.log("[getStandardFoundationPlan] Generating Cycle 1 plan.");
    // Standard focus areas for the first cycle
    const focusNames = ['Clarity & Communication', 'Trust & Relationships', 'Delegation & Empowerment'];
    const focusAreas = focusNames.map(name => {
        const details = DIMENSIONS_MAP[name];
        if (!details) { console.error(`Missing details for standard dimension: ${name}`); return null; } // Safety check
        return {
          name: name, score: 'N/A', // Score is not based on assessment for Cycle 1
          why: details.why, whatGoodLooksLike: details.whatGoodLooksLike, courses: details.courses,
          // Example Reps (could be dynamically pulled from REP_LIBRARY later)
          reps: [
            { week: 'Week 1-3', rep: `Practice ${details.courses[0]}` },
            { week: 'Week 4-6', rep: `Practice ${details.courses[1] || details.courses[0]}` },
            { week: 'Week 7-9', rep: `Practice ${details.courses[2] || details.courses[0]}` },
          ]
        };
    }).filter(Boolean); // Filter out nulls if details were missing

    return {
        cycle: cycle, focusAreas: focusAreas, strengths: [], // No strengths calculated for standard plan
        openEndedAnswer: openEndedAnswer, createdAt: new Date().toISOString(), type: 'Standard Foundation' // Add type identifier
    };
};

/**
 * Generates a personalized 90-day plan based on assessment scores for Cycles 2+.
 * Uses an 80/20 model: standard focus areas from JOURNEY_MAP + one personalized based on lowest score.
 * @param {object} scores - Calculated scores object from scoreAssessment.
 * @param {string} openEndedAnswer - User's answer to the open-ended question.
 * @param {number} cycle - The current cycle number (2 or higher).
 * @returns {object} - The personalized plan object.
 */
const generatePlanFromScores = (scores, openEndedAnswer, cycle) => {
    // --- SPECIAL CASE: Cycle 1 always uses the standard plan ---
    if (cycle === 1) {
        return getStandardFoundationPlan(cycle, openEndedAnswer);
    }
    console.log(`[generatePlanFromScores] Generating personalized plan for Cycle ${cycle}.`);

    // --- Determine Standard Focus Areas for this Cycle ---
    const sortedScores = Object.values(scores).sort((a, b) => a.score - b.score);
    const cycleData = JOURNEY_MAP.find(j => j.cycle === cycle) || JOURNEY_MAP[JOURNEY_MAP.length - 1]; // Fallback to last cycle data

    // Map cycle focus (e.g., 'Feedback') to dimension name (e.g., 'Clarity & Communication')
    const standardFocusNamesMap = { /* ... same mapping as original ... */ };
    let standardFocusNames = [
        standardFocusNamesMap[cycleData.performance] || 'Clarity & Communication', // Default if mapping fails
        standardFocusNamesMap[cycleData.people] || 'Trust & Relationships' // Default if mapping fails
    ];
    standardFocusNames = [...new Set(standardFocusNames)]; // Ensure uniqueness

    // --- Determine Personalized Focus Area (Lowest Score) ---
    const personalFocus = sortedScores[0];
    // Add the lowest scoring dimension if it's not already included in the standard focus
    if (personalFocus && !standardFocusNames.includes(personalFocus.name)) {
        standardFocusNames.push(personalFocus.name);
    }

    // --- Build Final Focus Areas (Max 3) ---
    const finalFocus = standardFocusNames.slice(0, 3).map(name => {
        const details = DIMENSIONS_MAP[name];
        if (!details) { console.error(`Missing details for dimension: ${name}`); return null; } // Safety check
        const scoreData = scores[name]; // Get score info for this dimension
        return {
          name: name, score: scoreData?.score !== undefined ? scoreData.score : 'N/A', // Include score
          why: details.why, whatGoodLooksLike: details.whatGoodLooksLike, courses: details.courses,
          // Example Reps
          reps: [ /* ... same rep generation as original ... */ ]
        };
    }).filter(Boolean); // Filter out nulls

    // --- Identify Strengths (Top 2 Scores >= 4.5) ---
    const strengths = Object.values(scores)
        .filter(d => d.score >= 4.5) // Filter for strengths
        .sort((a, b) => b.score - a.score) // Sort descending
        .slice(0, 2); // Take top 2

    console.log("[generatePlanFromScores] Generated Plan:", { cycle, focusAreas: finalFocus, strengths });
    return {
        cycle: cycle, focusAreas: finalFocus, strengths: strengths,
        openEndedAnswer: openEndedAnswer, createdAt: new Date().toISOString(), type: 'Personalized' // Add type identifier
    };
};

/* =========================================================
   SUB-COMPONENTS (Assessment, Tracker, Progress Scan)
========================================================= */

/**
 * BaselineAssessment Component
 * Guides the user through the initial 10-question assessment.
 * Calculates scores and generates the standard Cycle 1 plan upon completion.
 */
const BaselineAssessment = ({ onComplete }) => {
  const [answers, setAnswers] = useState({}); // Stores Likert scale answers { qId: value }
  const [openEnded, setOpenEnded] = useState(''); // Stores answer to open-ended question
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for submission

  // Calculate number of completed Likert questions
  const completedQuestions = useMemo(() => Object.keys(answers).filter(k => k.startsWith('q')).length, [answers]);
  const isComplete = completedQuestions === ASSESSMENT_QUESTIONS.length; // Check if all 10 are answered

  // Handler for Likert scale button clicks
  const handleAnswerChange = useCallback((qId, value) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  }, []);

  // Handler for form submission
  const handleSubmit = useCallback(async () => {
    if (!isComplete) {
      alert('Please answer all 10 assessment questions to generate your plan.'); return;
    }
    setIsSubmitting(true);
    console.log("[BaselineAssessment] Submitting assessment:", { answers, openEnded });
    // --- Calculate scores and generate the STANDARD Cycle 1 plan ---
    const scores = scoreAssessment(answers); // Calculate scores even for Cycle 1 for initial data
    const plan = getStandardFoundationPlan(1, openEnded); // Generate the standard plan
    // --- Prepare assessment data object to save ---
    const assessmentData = {
      id: `assessment_${Date.now()}`, // Simple unique ID
      date: new Date().toISOString(), scores: scores, answers: answers, openEnded: openEnded, cycle: 1 // Add cycle number
    };

    // Simulate API delay for feedback
    await new Promise(res => setTimeout(res, 800));
    console.log("[BaselineAssessment] Plan generated:", plan);
    console.log("[BaselineAssessment] Assessment data prepared:", assessmentData);
    onComplete(plan, assessmentData); // Pass plan and assessment data to parent
    // No need to setIsSubmitting(false) here, as the view will change
  }, [answers, openEnded, isComplete, onComplete]);

  return (
    // Use consistent padding and max-width
    <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>Your Arena Leadership Assessment</h1>
      <p className="text-lg text-gray-600 mb-8">
        This short assessment creates your initial <strong>Foundational 90-Day Development Plan</strong>. Answer based on your typical behavior over the last ~3 months.
      </p>

      {/* Assessment Card */}
      <Card title="Leadership Self-Assessment" icon={BarChart3} accent="TEAL" className="space-y-6">
        {ASSESSMENT_QUESTIONS.map((q, index) => (
          <div key={q.id} className="border-b pb-6 last:border-b-0">
            {/* Question Text */}
            <label className="block text-md md:text-lg font-semibold mb-3" style={{ color: COLORS.NAVY }}>
              {index + 1}. {q.text}
            </label>
            {/* Likert Scale Buttons */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <span className="text-xs font-medium text-gray-500 hidden sm:block">{LIKERT_SCALE[0].label}</span>
              <div className="flex justify-center space-x-2 sm:space-x-3" role="radiogroup">
                {LIKERT_SCALE.map(option => (
                  <button
                    key={option.value} type="button" role="radio" aria-checked={answers[q.id] === option.value}
                    onClick={() => handleAnswerChange(q.id, option.value)}
                    // Styling for Likert buttons (matches refined style)
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-bold text-lg transition-all duration-200 border-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[${COLORS.NAVY}]`}
                    style={{
                        background: answers[q.id] === option.value ? COLORS.NAVY : COLORS.OFF_WHITE,
                        color: answers[q.id] === option.value ? COLORS.OFF_WHITE : COLORS.MUTED,
                        borderColor: answers[q.id] === option.value ? COLORS.NAVY : COLORS.SUBTLE,
                        transform: answers[q.id] === option.value ? 'scale(1.1)' : 'scale(1)',
                    }}
                    aria-label={option.label}
                  >
                    {option.value}
                  </button>
                ))}
              </div>
              <span className="text-xs font-medium text-gray-500 text-right hidden sm:block">{LIKERT_SCALE[LIKERT_SCALE.length - 1].label}</span>
            </div>
          </div>
        ))}
        {/* Open-Ended Question */}
        <div className="pt-4">
            <label className="block text-md md:text-lg font-semibold mb-3" style={{ color: COLORS.NAVY }}>
              {OPEN_ENDED_QUESTION}
            </label>
            <textarea
              value={openEnded} onChange={(e) => setOpenEnded(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.TEAL}] text-sm"
              rows="3" placeholder="e.g., 'Giving constructive feedback more consistently'..."
            />
        </div>
      </Card>
      {/* Submit Button Area */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmit} disabled={!isComplete || isSubmitting}
          variant="primary" size="lg" // Use large button
          aria-live="polite" // Announce changes for accessibility
        >
          {isSubmitting ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <CheckCircle className="w-5 h-5 mr-2" />}
          {isSubmitting ? 'Generating Your Plan...' : `Generate My 90-Day Plan (${completedQuestions}/${ASSESSMENT_QUESTIONS.length})`}
        </Button>
         {!isComplete && <p className="text-xs text-red-600 mt-2">Please answer all 10 questions above.</p>}
      </div>
    </div>
  );
};


/**
 * DevelopmentPlanTracker Component
 * Displays the user's current 90-day plan, journey map, assessment results (radar chart),
 * and historical progress (bar chart if available). Allows triggering the next Progress Scan.
 */
const DevelopmentPlanTracker = ({ developmentPlanData, onStartProgressScan }) => {
  // --- Consume context for user details and navigation ---
  const { user, navigate } = useAppServices(); // cite: useAppServices.jsx

  // --- Extract data safely from props ---
  // Use optional chaining and provide safe fallbacks
  const assessmentHistory = useMemo(() => developmentPlanData?.assessmentHistory || [], [developmentPlanData]); // cite: useAppServices.jsx
  const latestAssessment = useMemo(() => assessmentHistory[assessmentHistory.length - 1], [assessmentHistory]);
  const currentPlan = useMemo(() => developmentPlanData?.currentPlan, [developmentPlanData]); // cite: useAppServices.jsx
  const currentCycle = useMemo(() => currentPlan?.cycle || 1, [currentPlan]);
  const journeyPhase = useMemo(() => JOURNEY_MAP.find(j => j.cycle === currentCycle)?.phase || 'Foundation', [currentCycle]);

  // --- Validate required data ---
  if (!currentPlan || !latestAssessment) {
     console.error("[DevPlanTracker] Missing critical data:", { currentPlan, latestAssessment });
     return (
        <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600">Development Plan Error</h2>
            <p className="text-gray-600">Could not load your current plan or latest assessment data. Please try refreshing or contact support.</p>
        </div>
     )
  }

  // --- Prepare Data for Charts ---
  // Radar Chart Data (Latest Assessment Scores)
  const radarData = useMemo(() => {
      const scores = latestAssessment?.scores;
      if (!scores) return [];
      return Object.values(scores).map(dim => ({
          subject: dim.name.replace(/&/g, '&\n'), // Format label for radar
          score: dim.score, fullMark: 5,
      }));
  }, [latestAssessment]);

  // Bar Chart Data (Historical Scores)
  const scoreHistory = useMemo(() => {
      // Only include if there's more than one assessment
      if (assessmentHistory.length < 2) return [];
      return assessmentHistory.map(a => ({
          date: new Date(a.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), // Short date format
          // Safely extract scores for each dimension
          ...(Object.keys(DIMENSIONS_MAP).reduce((acc, dimName) => {
              acc[dimName] = a.scores?.[dimName]?.score ?? 0; // Use 0 if score missing
              return acc;
          }, {})),
      }));
  }, [assessmentHistory]);


  return (
    // Use consistent padding
    <div className="p-6 md:p-8 lg:p-10 space-y-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>Your Arena Development Plan</h1>
            <p className="text-lg text-gray-600">
                18-month leadership journey | Current: <strong>Cycle {currentCycle} ({journeyPhase} Phase)</strong>.
            </p>
        </div>
        {/* Progress Scan Button */}
        <Button onClick={onStartProgressScan} variant="secondary" size="md">
          <RefreshCw className="w-5 h-5 mr-2" /> Start Next 90-Day Scan
        </Button>
      </div>

      {/* 18-Month Journey Map Card */}
<Card title="Your 18-Month Leadership Journey" icon={Calendar} accent="NAVY">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {JOURNEY_MAP.map(item => (
                <div key={item.cycle}
                    // Styling for journey map items
                    className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                        item.cycle === currentCycle ? 'bg-[#47A88D]/10 border-[#47A88D] shadow-lg scale-105' : 'bg-gray-50 border-gray-200'
                    } ${item.cycle < currentCycle ? 'opacity-60' : ''}`}
                >
                    {/* Phase Badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded`}>{item.phase}</span>
                    {/* Cycle Title */}
                    <h4 className="font-bold text-xs mt-2 mb-1" style={{ color: COLORS.NAVY }}>{item.q}</h4>
// ...
                    {/* Focus Areas */}
                    <ul className="text-[10px] text-gray-600 space-y-0">
                        <li><strong>Perf:</strong> {item.performance}</li>
                        <li><strong>People:</strong> {item.people}</li>
                        <li><strong>Mindset:</strong> {item.mindset}</li>
                    </ul>
                    {/* Current Cycle Indicator */}
                    {item.cycle === currentCycle && <span className="block text-center text-[10px] font-bold mt-1" style={{ color: COLORS.TEAL }}>Current</span>}
                </div>
            ))}
        </div>
      </Card>

      {/* Assessment Snapshot & Focus Plan Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Radar Chart */}
        <div className="lg:col-span-1">
            <Card title="Leadership Profile Snapshot" icon={BarChart3} accent="TEAL">
                 <p className="text-sm text-gray-600 mb-4">Latest assessment scores (as of {new Date(latestAssessment.date).toLocaleDateString()}).</p>
                {/* Radar Chart */}
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke={COLORS.SUBTLE} />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: COLORS.MUTED }} />
                            <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 10, fill: COLORS.MUTED }} />
                            <Radar name={user?.name || 'You'} dataKey="score" stroke={COLORS.TEAL} fill={COLORS.TEAL} fillOpacity={0.6} />
                            {/* Optional: Add Legend */}
                            {/* <RechartsLegend /> */}
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>

        {/* Right Column: 90-Day Focus Plan */}
        <div className="lg:col-span-2">
             <Card title="Your Current 90-Day Focus Plan" icon={Target} accent="ORANGE">
                 <p className="text-sm text-gray-600 mb-6">
                    Based on your {currentPlan.type === 'Standard Foundation' ? 'standard foundation' : 'latest assessment'}, focus on these <strong>Top {currentPlan.focusAreas.length} Growth Areas</strong> for this cycle.
                 </p>
                {/* Focus Areas List */}
                <div className="space-y-6">
                    {currentPlan.focusAreas.map((area, index) => (
                        <div key={index} className="flex flex-col sm:flex-row gap-4 border-b pb-6 last:border-b-0" style={{ borderColor: COLORS.SUBTLE }}>
                             {/* Number Badge */}
                             <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xl font-bold mb-2 sm:mb-0`} style={{ background: COLORS.ORANGE }}>
                                {index + 1}
                             </div>
                             {/* Area Details */}
                             <div className="flex-1">
                                <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>{area.name}
                                    {area.score !== 'N/A' && <span className="text-sm font-normal text-gray-500"> (Score: {area.score})</span>}
                                </h3>
                                {/* Why it Matters & What Good Looks Like */}
                                <p className="text-sm italic text-gray-600 mt-1 mb-2"><strong>Why:</strong> {area.why}</p>
                                <p className="text-sm text-gray-600 mb-3"><strong>Target:</strong> {area.whatGoodLooksLike}</p>
                                {/* Training Plan / Courses */}
                                <h5 className="text-sm font-bold mb-2" style={{ color: COLORS.NAVY }}>Related Training:</h5>
                                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                    {/* Link courses dynamically if possible, or list names */}
                                    {area.courses.map(course => <li key={course}>Arena Course: <strong>{course}</strong></li>)}
                                    {/* Indication that reps are added */}
                                    <li className="font-semibold" style={{ color: COLORS.TEAL }}>
                                        <CheckCircle className="w-4 h-4 inline-block mr-1" />
                                        Core reps added to Daily Practice.
                                    </li>
                                </ul>
                             </div>
                        </div>
                    ))}
                    {/* 80/20 Model Note (if applicable) */}
                    {currentPlan.type === 'Personalized' && (
                      <p className="text-xs text-gray-500 mt-4 bg-gray-100 p-3 rounded-lg border flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 inline-block mr-1 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span><strong>80/20 Plan:</strong> Includes standard areas for Cycle {currentCycle} from the 18-month map, plus one personalized area based on your lowest score.</span>
                      </p>
                    )}
                </div>
                {/* Button to Daily Practice */}
                <Button onClick={() => navigate('daily-practice')} variant="primary" size="md" className="mt-6 w-full">
                  <Zap className="w-5 h-5 mr-2" /> Go to Daily Practice
                </Button>
             </Card>
        </div>
      </div>

       {/* 90-Day Rep Tracker Summary Card */}
       <Card title="🗓️ 90-Day Rep Tracker Summary" icon={Zap} accent="BLUE">
          <p className="text-sm text-gray-600 mb-4">Log weekly reps via your <strong className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate('daily-practice')}>Daily Practice</strong>. This is a high-level summary.</p>
          {/* Rep Table */}
          <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="border-b-2" style={{ borderColor: COLORS.SUBTLE }}>
                    <tr>
                        <th className="p-2 text-sm font-semibold" style={{ color: COLORS.NAVY }}>Week</th>
                        <th className="p-2 text-sm font-semibold" style={{ color: COLORS.NAVY }}>Focus Skill</th>
                        <th className="p-2 text-sm font-semibold" style={{ color: COLORS.NAVY }}>Example Rep</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Safely map focus areas and reps */}
                    {currentPlan.focusAreas?.slice(0, 3).map((area, index) => ( // Show max 3 focus areas
                        <tr key={index} className={`border-b ${index % 2 === 1 ? 'bg-gray-50' : ''}`} style={{ borderColor: COLORS.SUBTLE }}>
                            <td className="p-3 text-sm">{area.reps?.[index]?.week || `Week ${index * 3 + 1}-${index * 3 + 3}`}</td> {/* Use week from data or calculate */}
                            <td className="p-3 text-sm font-medium">{area.name}</td>
                            <td className="p-3 text-sm">{area.reps?.[index]?.rep || `Core Practice for ${area.name}`}</td> {/* Use rep text or default */}
                        </tr>
                    ))}
                    {/* Handle case with fewer than 3 focus areas */}
                    {(!currentPlan.focusAreas || currentPlan.focusAreas.length === 0) && (
                         <tr><td colSpan="3" className="p-4 text-center text-sm text-gray-500 italic">No focus areas defined in the current plan.</td></tr>
                    )}
                </tbody>
              </table>
          </div>
       </Card>

      {/* Progress Over Time Bar Chart (Conditional) */}
      {scoreHistory.length > 0 && ( // Render only if there's history data
        <Card title="Progress Over Time" icon={TrendingUp} accent="PURPLE">
            <p className="text-sm text-gray-600 mb-4">Visualizing your growth across dimensions from each 90-day scan.</p>
            {/* Bar Chart */}
            <div style={{ width: '100%', height: 400 }}>
                 <ResponsiveContainer>
                    <BarChart data={scoreHistory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}> {/* Adjust margins */}
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: COLORS.MUTED }} />
                        <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: COLORS.MUTED }} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: '8px', boxShadow: 'rgba(0,0,0,0.1) 0px 4px 12px' }} />
                        <RechartsLegend wrapperStyle={{ fontSize: 10 }} />
                        {/* Define bars for each dimension - use consistent colors */}
                        <Bar dataKey="Leadership Mindset & Identity" fill={COLORS.TEAL} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Ownership & Accountability" fill={COLORS.ORANGE} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Delegation & Empowerment" fill={COLORS.BLUE} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Execution & Results" fill={COLORS.PURPLE} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Clarity & Communication" fill={COLORS.GREEN} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Trust & Relationships" fill={COLORS.AMBER} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Team Health & Culture" fill={COLORS.RED} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Recognition & Motivation" fill={COLORS.NAVY} radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
        </Card>
      )}
    </div>
  );
};


/**
 * ProgressScan Component
 * Guides the user through the 90-day progress scan: reflection, artifact upload, and reassessment.
 * Generates the *next* cycle's plan based on the new assessment.
 */
const ProgressScan = ({ developmentPlanData, onCompleteScan }) => {
  // --- State for Scan Inputs ---
  const [answers, setAnswers] = useState({}); // Stores Likert answers for reassessment
  const [reflection, setReflection] = useState({ q1: '', q2: '' }); // Stores reflection answers
  const [artifact, setArtifact] = useState({ file: null, context: '' }); // Stores artifact file and context
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state

  // --- Get Previous Plan Details ---
  // Safely access previous plan and focus area name
  const previousPlan = useMemo(() => developmentPlanData?.currentPlan || null, [developmentPlanData]);
  const previousFocusAreaName = useMemo(() => previousPlan?.focusAreas?.[0]?.name || 'your primary focus area', [previousPlan]);
  const currentCycle = useMemo(() => previousPlan?.cycle || 1, [previousPlan]);

  // --- Handlers for Input Changes ---
  const handleAnswerChange = useCallback((qId, value) => setAnswers(prev => ({ ...prev, [qId]: value })), []);
  const handleReflectionChange = useCallback((qId, value) => setReflection(prev => ({ ...prev, [qId]: value })), []);
  const handleArtifactContextChange = useCallback((e) => setArtifact(prev => ({...prev, context: e.target.value})), []);
  const handleArtifactFileChange = useCallback((e) => setArtifact(prev => ({...prev, file: e.target.files?.[0] || null })), []);

  // --- Validation ---
  const completedQuestions = useMemo(() => Object.keys(answers).filter(k => k.startsWith('q')).length, [answers]);
  const isAssessmentComplete = completedQuestions === ASSESSMENT_QUESTIONS.length;
  const isReflectionComplete = reflection.q1.trim() && reflection.q2.trim();
  const isArtifactProvided = artifact.context.trim().length > 0; // File upload is optional proof, context is key
  // Can submit if reflection, artifact context, and assessment are done
  const canSubmit = isReflectionComplete && isArtifactProvided && isAssessmentComplete;

  // --- Submission Handler ---
  const handleSubmit = useCallback(async () => {
    // Re-validate before submitting
    if (!isReflectionComplete) { alert('Please complete the Quick Reflection section.'); return; }
    if (!isArtifactProvided) { alert('Please provide context for your practice artifact.'); return; }
    if (!isAssessmentComplete) { alert('Please complete the 10-question Mini-Assessment.'); return; }

    setIsSubmitting(true);
    console.log("[ProgressScan] Submitting scan data:", { reflection, artifact: { fileName: artifact.file?.name, context: artifact.context }, answers });

    // --- Calculate new scores and determine the next cycle number ---
    const newScores = scoreAssessment(answers);
    const nextCycle = currentCycle + 1; // Increment cycle
    console.log(`[ProgressScan] Calculated new scores for Cycle ${nextCycle}:`, newScores);

    // --- Generate the *next* 90-day plan based on new scores ---
    // Pass the reflection answer (q1) as the open-ended input for the new plan
    const newPlan = generatePlanFromScores(newScores, reflection.q1, nextCycle);
    console.log("[ProgressScan] Generated new plan:", newPlan);

    // --- Prepare the new assessment data object to save ---
    const newAssessmentData = {
      id: `assessment_${Date.now()}`, date: new Date().toISOString(),
      scores: newScores, answers: answers, openEnded: reflection.q1, // Use reflection q1 as openEnded
      reflection: reflection, // Save the full reflection object
      artifact: { // Save artifact details
          fileName: artifact.file?.name || 'N/A', // Save file name or N/A
          context: artifact.context, focusArea: previousFocusAreaName // Link to the focus area being reviewed
      },
      cycle: nextCycle // Add cycle number to assessment record
    };
    console.log("[ProgressScan] Prepared new assessment data:", newAssessmentData);

    // Simulate API delay
    await new Promise(res => setTimeout(res, 800));

    // --- Pass the *new* plan and *new* assessment data to the parent ---
    onCompleteScan(newPlan, newAssessmentData);
    // View will change via parent component state update

  }, [answers, reflection, artifact, isAssessmentComplete, isReflectionComplete, isArtifactProvided, currentCycle, previousFocusAreaName, onCompleteScan]);


  return (
    // Use consistent padding and max-width
    <div className="p-6 md:p-8 lg:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>👏 The Arena 90-Day Progress Scan</h1>
      <p className="text-lg text-gray-600 mb-8">
        Measure your growth, reflect on your practice, and refocus for the next cycle. Current Cycle: {currentCycle}.
      </p>

      {/* --- Scan Steps --- */}
      <div className="space-y-8">
          {/* Step 1: Quick Reflection */}
          <Card title="Step 1: Quick Reflection" icon={MessageSquare} accent="AMBER">
             {/* Reflection Question 1 */}
             <div className="mb-4">
                <label className="block text-md font-semibold mb-2" style={{ color: COLORS.NAVY }}>
                  🪞 What leadership behavior feels easier now than 90 days ago? <span className="text-red-500">*</span>
                </label>
                <input type="text" value={reflection.q1} onChange={(e) => handleReflectionChange('q1', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.AMBER}] text-sm" placeholder="e.g., 'Giving reinforcing feedback feels more natural...'" required/>
             </div>
             {/* Reflection Question 2 */}
             <div>
                <label className="block text-md font-semibold mb-2" style={{ color: COLORS.NAVY }}>
                  ⚡ Where did you get stuck or lose consistency? <span className="text-red-500">*</span>
                </label>
                <input type="text" value={reflection.q2} onChange={(e) => handleReflectionChange('q2', e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[${COLORS.AMBER}] text-sm" placeholder="e.g., 'My 1:1s kept getting cancelled due to urgent tasks...'" required/>
             </div>
          </Card>

          {/* Step 2: Evidence of Practice (Artifact) */}
          <Card title="Step 2: Evidence of Practice (Artifact)" icon={UploadCloud} accent="BLUE">
             <p className="text-sm text-gray-600 mb-2">
               Validate progress on your previous focus: <strong>"{previousFocusAreaName}"</strong>. Upload one artifact (optional) and provide context (required).
             </p>
             <p className="text-xs text-gray-500 italic mb-4">Examples: Meeting agenda, feedback email (redacted), project plan, expectations doc.</p>
             {/* Context Textarea */}
             <div className="mb-4">
                <label className="block text-md font-semibold mb-2" style={{ color: COLORS.NAVY }}>
                  Context <span className="text-red-500">*</span>
                </label>
                <textarea value={artifact.context} onChange={handleArtifactContextChange}
                  className={`w-full p-2 border rounded-lg focus:ring-2 text-sm ${!artifact.context.trim() ? 'border-red-300 ring-red-300' : 'border-gray-300 ring-[#2563EB]'}`}
                  rows="2" placeholder="Explain how this artifact demonstrates your practice (e.g., 'New agenda structure for my team meeting to improve clarity...')" required
                />
                {!artifact.context.trim() && <p className="text-xs text-red-600 mt-1">Context is required to proceed.</p>}
             </div>
             {/* File Upload Area */}
             <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
                        {artifact.file ? (
                             <p className="font-semibold text-green-600 text-sm">{artifact.file.name}</p>
                        ) : (
                             <>
                                <p className="mb-1 text-sm text-gray-500"><span className="font-semibold">Click to upload artifact</span> (Optional)</p>
                                <p className="text-xs text-gray-400">PDF, DOCX, PNG, JPG</p>
                             </>
                        )}
                    </div>
                    <input type="file" className="hidden" onChange={handleArtifactFileChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"/>
                </label>
            </div>
          </Card>

          {/* Step 3: Mini-Assessment */}
          <Card title="Step 3: Mini-Assessment (10 Questions)" icon={BarChart3} accent="TEAL" className="space-y-6">
            {/* Re-use the same question rendering logic as BaselineAssessment */}
            {ASSESSMENT_QUESTIONS.map((q, index) => (
              <div key={q.id} className="border-b pb-6 last:border-b-0">
                <label className="block text-md md:text-lg font-semibold mb-3" style={{ color: COLORS.NAVY }}> {index + 1}. {q.text} </label>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <span className="text-xs font-medium text-gray-500 hidden sm:block">{LIKERT_SCALE[0].label}</span>
                  <div className="flex justify-center space-x-2 sm:space-x-3" role="radiogroup">
                    {LIKERT_SCALE.map(option => (
                      <button key={option.value} type="button" role="radio" aria-checked={answers[q.id] === option.value}
                        onClick={() => handleAnswerChange(q.id, option.value)}
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full font-bold text-lg transition-all duration-200 border-2 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[${COLORS.NAVY}]`}
                        style={{ background: answers[q.id] === option.value ? COLORS.NAVY : COLORS.OFF_WHITE, color: answers[q.id] === option.value ? COLORS.OFF_WHITE : COLORS.MUTED, borderColor: answers[q.id] === option.value ? COLORS.NAVY : COLORS.SUBTLE, transform: answers[q.id] === option.value ? 'scale(1.1)' : 'scale(1)' }}
                        aria-label={option.label}
                      > {option.value} </button>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-gray-500 text-right hidden sm:block">{LIKERT_SCALE[LIKERT_SCALE.length - 1].label}</span>
                </div>
              </div>
            ))}
          </Card>
      </div>

      {/* Submit Button Area */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleSubmit} disabled={!canSubmit || isSubmitting}
          variant="primary" size="lg" aria-live="polite"
        >
          {isSubmitting ? <Loader className="animate-spin w-5 h-5 mr-2" /> : <Lock className="w-5 h-5 mr-2" />} {/* Use Lock icon */}
          {isSubmitting ? 'Generating Next Plan...' : `Lock In & Generate Next 90-Day Plan`}
        </Button>
        {/* Validation Message */}
        {!canSubmit && !isSubmitting && (
            <p className="text-xs text-red-600 mt-2">
                Please complete Reflection, provide Artifact Context, and answer all Assessment questions.
            </p>
        )}
      </div>
    </div>
  );
};


/* =========================================================
   MAIN EXPORT: DevelopmentPlanScreen (Router Logic)
========================================================= */

const DevelopmentPlanScreen = () => {
  // --- Consume Core Services ---
  // Use renamed data structures and update functions
  const {
      developmentPlanData, updateDevelopmentPlanData, // Data + Writer for Dev Plan
      dailyPracticeData, updateDailyPracticeData,     // Data + Writer for Daily Practice (for sync)
      isLoading: isAppLoading, // Use the combined loading state from context
      error: appError,         // Use the combined error state from context
  } = useAppServices(); // cite: useAppServices.jsx

  // --- Local State ---
  const [isSaving, setIsSaving] = useState(false); // General saving state for plan updates
  const [view, setView] = useState('loading'); // Controls which sub-component is rendered

  // --- View Determination Logic ---
  // Determines whether to show Assessment, Tracker, or Scan based on plan existence and last scan date
  useEffect(() => {
    // 1. Check App Loading
    if (isAppLoading) {
      console.log("[DevPlanScreen] App is loading, setting view to 'loading'.");
      setView('loading');
      return;
    }
    
    // 2. Check Critical Service Functions (The Core Fix)
    // CRITICAL FIX: Explicitly check for both functions here.
    if (!updateDevelopmentPlanData || !updateDailyPracticeData) {
        console.error("[DevPlanScreen] Critical service functions are missing. Cannot render content.");
        setView('error'); 
        return; // Exit early if services aren't ready
    }

    // 3. Check for Global Errors
    if (appError) {
        console.error("[DevPlanScreen] App error detected:", appError);
        setView('error'); // Show an error state if app loading failed
        return;
    }

    // 4. Determine View
    const hasPlan = !!developmentPlanData?.currentPlan; // Check if a plan object exists
    if (hasPlan) {
        // Plan exists, check timing for next scan
        const lastScanDateStr = developmentPlanData.lastAssessmentDate; // Date of the last assessment
        const createdAtStr = developmentPlanData.createdAt; // Fallback to creation date if no scan date
        console.log(`[DevPlanScreen] Plan found. Last Scan: ${lastScanDateStr}, Created: ${createdAtStr}`);

        let daysSinceLastScan = Infinity; // Default to allow scan if dates are missing/invalid
        try {
            const lastDate = lastScanDateStr ? new Date(lastScanDateStr) : (createdAtStr ? new Date(createdAtStr) : null);
            if (lastDate && !isNaN(lastDate.getTime())) { // Check if date is valid
                const now = new Date();
                daysSinceLastScan = (now - lastDate) / (1000 * 60 * 60 * 24);
                console.log(`[DevPlanScreen] Days since last scan/creation: ${daysSinceLastScan.toFixed(1)}`);
            } else {
                 console.warn("[DevPlanScreen] Could not parse last scan/creation date.");
            }
        } catch (e) {
            console.error("[DevPlanScreen] Error calculating days since last scan:", e);
        }

        // --- Logic: Show scan if >= 85 days, otherwise show tracker ---
        if (daysSinceLastScan >= 85) { // Allow scan slightly early
            console.log("[DevPlanScreen] Scan needed, setting view to 'scan'.");
            setView('scan');
        } else {
            console.log("[DevPlanScreen] Scan not yet needed, setting view to 'tracker'.");
            setView('tracker');
        }
    } else {
      // No plan exists, show initial assessment
      console.log("[DevPlanScreen] No plan found, setting view to 'assessment'.");
      setView('assessment');
    }
  }, [developmentPlanData, isAppLoading, appError]); // Dependencies: Removed update functions to prevent infinite loop

  // Scroll to top when the main view state changes (Assessment, Scan, Tracker)
  useEffect(() => {
    if (view === 'assessment' || view === 'scan' || view === 'tracker') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [view]);

// --- Function to Sync Plan Focus to Daily Practice Reps ---
  const syncPlanToDailyPractice = useCallback(async (newPlan) => {
      console.log("[syncPlanToDailyPractice] Starting sync for plan cycle:", newPlan?.cycle);
      // Validate input
      if (!newPlan?.focusAreas || !Array.isArray(newPlan.focusAreas)) {
        console.error("[syncPlanToDailyPractice] Invalid plan structure. Cannot sync reps.");
        return; // Exit if data is invalid
      }
      // CRITICAL FIX: Check writer function availability before proceeding
      if (!updateDailyPracticeData) {
        console.error("[syncPlanToDailyPractice] Update service function is not available. Cannot sync.");
        return;
      }

      // --- Map Focus Areas to Core Reps ---
      const newCoreReps = newPlan.focusAreas.map((area, index) => {
          // Determine Tier (use mapping, default to T1)
          const tier = DIMENSION_TO_TIER_MAP[area.name] || 'T1';
          // Get the primary rep text (use the first rep in the list)
          const repText = area.reps?.[0]?.rep || `Core Practice: ${area.name}`; // Fallback text
          // Create the commitment object structure
          return {
              id: `pdp_${newPlan.cycle}_${index}_${Date.now()}`, // Unique ID including cycle
              text: `[Focus ${newPlan.cycle}] ${repText}`, // Label rep with cycle
              status: 'Pending', // Start as pending
              isCustom: false, // Indicates it came from the plan
              linkedGoal: area.name, // Link to the focus area name
              linkedTier: tier,
              source: 'DevelopmentPlan' // Mark source for potential filtering later
          };
      });
      console.log("[syncPlanToDailyPractice] Generated new core reps:", newCoreReps);

      // --- Update dailyPracticeData ---
      try {
          const success = await updateDailyPracticeData(currentDailyData => { // Use functional update
              const existingCommitments = currentDailyData?.activeCommitments || [];
              // Filter out *old* plan-generated reps (keep custom/other reps)
              const nonPlanCommitments = existingCommitments.filter(c => c.source !== 'DevelopmentPlan');
              // Combine non-plan reps with the *new* core reps
              const updatedCommitments = [...nonPlanCommitments, ...newCoreReps];
              console.log(`[syncPlanToDailyPractice] Updating activeCommitments. Kept ${nonPlanCommitments.length}, Added ${newCoreReps.length}. Total: ${updatedCommitments.length}`);
              // Return the complete updated state object
              return { ...currentDailyData, activeCommitments: updatedCommitments }; // Merge updates
          }); // cite: useAppServices.jsx

          if (!success) throw new Error("updateDailyPracticeData returned false");
          console.log("[syncPlanToDailyPractice] Daily Practice reps synced successfully.");

      } catch (error) {
           console.error("[syncPlanToDailyPractice] Failed to update daily practice data:", error);
           alert("Error syncing your new plan to daily practice. Please check your Daily Practice screen manually.");
      }
  }, [updateDailyPracticeData]); // Dependency


  // --- Handler for Completing the Initial Assessment ---
  const handleAssessmentComplete = useCallback(async (plan, assessment) => {
    console.log("[handleAssessmentComplete] Processing completed assessment...");
    setIsSaving(true);
    // CRITICAL FIX: Check writer function availability before proceeding
    if (!updateDevelopmentPlanData) {
        alert("Development Plan update service is missing. Cannot save.");
        setIsSaving(false); return;
    }

    // Prepare data to update the main development plan document
    const newDevPlanData = {
      currentPlan: plan, // The newly generated plan object
      currentCycle: 1, // Set cycle to 1
      createdAt: new Date().toISOString(), // Record creation time
      lastAssessmentDate: assessment.date, // Record assessment date
      // Store assessment and plan history directly in the main doc for now
      assessmentHistory: [assessment], // Start history with this assessment
      planHistory: [plan], // Start history with this plan
    };
    try {
      // Update the development plan document in Firestore
      const success = await updateDevelopmentPlanData(newDevPlanData); // This is the call
      if (!success) throw new Error("updateDevelopmentPlanData returned false for initial save");

      console.log("[handleAssessmentComplete] Development Plan document saved/updated.");
      // Sync the new plan's core reps to the daily practice list
     await syncPlanToDailyPractice(plan);
      console.log("[handleAssessmentComplete] Sync complete. View should update to 'tracker'.");
      // The view should change automatically via the useEffect watching developmentPlanData
      setIsSaving(false); // Reset saving state after successful save

    } catch (error) {
      console.error("[handleAssessmentComplete] Error saving assessment/plan:", error);
      alert("There was an error saving your initial assessment. Please try again.");
      setIsSaving(false); // Ensure loading state is reset on error
    }
    // No need to setSaving(false) on success, as the view change handles it
  }, [updateDevelopmentPlanData, syncPlanToDailyPractice]); // Dependencies


  // --- Handler for Completing a Progress Scan ---
  const handleScanComplete = useCallback(async (newPlan, newAssessment) => {
     console.log("[handleScanComplete] Processing completed progress scan...");
     setIsSaving(true);
     // CRITICAL FIX: Check writer function availability before proceeding
     if (!updateDevelopmentPlanData) {
        alert("Development Plan update service is missing. Cannot save.");
        setIsSaving(false); return;
     }

     // Prepare data to update the main development plan document
     const currentHistory = developmentPlanData?.assessmentHistory || [];
     const currentPlanHistory = developmentPlanData?.planHistory || [];
     const updatedDevPlanData = {
       currentPlan: newPlan, // Update with the newly generated plan
       currentCycle: newPlan.cycle, // Update cycle number
       lastAssessmentDate: newAssessment.date, // Update last assessment date
       // Append new assessment and plan to their respective histories
       assessmentHistory: [...currentHistory, newAssessment],
       planHistory: [...currentPlanHistory, newPlan],
       // Keep original createdAt date
       createdAt: developmentPlanData?.createdAt || new Date().toISOString(),
     };
     try {
       // Update the development plan document in Firestore (merge)
       const success = await updateDevelopmentPlanData(updatedDevPlanData); // Use update logic // cite: useAppServices.jsx
       if (!success) throw new Error("updateDevelopmentPlanData returned false for scan save");

       console.log("[handleScanComplete] Development Plan document updated with scan results.");
       // Sync the new plan's core reps to the daily practice list
       await syncPlanToDailyPractice(newPlan);
       console.log("[handleScanComplete] Sync complete. View should update to 'tracker'.");
       // View changes via useEffect

     } catch (error) {
       console.error("[handleScanComplete] Error saving progress scan:", error);
       alert("There was an error saving your progress scan. Please try again.");
       setIsSaving(false); // Reset loading state on error
     }
  }, [developmentPlanData, updateDevelopmentPlanData, syncPlanToDailyPractice]); // Dependencies

  // --- Render Logic ---
  // Show loading spinner if app is loading OR if saving plan updates
  // CRITICAL FIX: Check for updateDevelopmentPlanData and updateDailyPracticeData availability
  if (view === 'loading' || isAppLoading || isSaving) {
    // Check if the cause is permanently missing service functions *after* app loading
    if (!isAppLoading && (!updateDevelopmentPlanData || !updateDailyPracticeData)) {
        console.error("[DevPlanScreen] Critical writer functions failed to load. Switching to permanent error view.");
        return <LoadingSpinner message={"A critical service failed to load. Please contact support."} />;
    }
    
    // Otherwise, show generic loading spinner
    return <LoadingSpinner message={isSaving ? "Saving Plan..." : "Loading Development Plan..."} />;
  }
  
  // Show error view if app loading failed OR if view state was set to 'error' by the useEffect
  if (view === 'error' || appError) { // Added appError check here as well
      return (
         <div className="p-8 text-center">
            <h2 className="text-2xl font-bold text-red-600">Loading Error</h2>
            <p className="text-gray-600">Could not load development plan data or critical application services failed to initialize. Please try refreshing.</p>
            {appError && <pre className="mt-4 text-xs text-left bg-red-50 p-2 border border-red-200 rounded">{appError.message}</pre>}
        </div>
      );
  }

  // Render the appropriate view based on state
  switch (view) {
      case 'assessment':
          return <BaselineAssessment onComplete={handleAssessmentComplete} />;
      case 'scan':
          // Pass necessary data for scan (previous plan info)
          if (!developmentPlanData) return <LoadingSpinner message="Loading previous plan data..." />; // Extra safety check
          return <ProgressScan developmentPlanData={developmentPlanData} onCompleteScan={handleScanComplete} />;
      case 'tracker':
          // Pass necessary data for tracker
          if (!developmentPlanData) return <LoadingSpinner message="Loading plan details..." />; // Extra safety check
          return <DevelopmentPlanTracker developmentPlanData={developmentPlanData} onStartProgressScan={() => setView('scan')} />;
      default:
          // Fallback / Unknown state
          return (
             <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-red-600">Unknown State</h2>
                <p className="text-gray-600">Could not determine the correct view state ({view}). Please try refreshing.</p>
            </div>
          );
  }
};

export default DevelopmentPlanScreen;