// --- ICON IMPORTS FOR ICON MAP ---
import { Zap, HeartPulse, Users, Mic, Briefcase, Target, CheckCircle, TrendingUp, ShieldCheck, BarChart3, AlertTriangle, Clock as ClockIcon, Lightbulb, CornerRightUp, Eye, BookOpen, Home, ArrowLeft, PlusCircle, X, MessageSquare, Info } from 'lucide-react';

// --- APPLICATION CONSTANTS ---
export const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
export const API_KEY = (typeof window !== "undefined" && (window.__GEMINI_API_KEY || window.GEMINI_API_KEY)) || "";
export const SECRET_SIGNUP_CODE = "LeaderReps2024!"; 

// --- ICON MAPPING ---
export const IconMap = {
  Zap,
  HeartPulse,
  Users,
  Mic,
  Briefcase,
  Target,
  CheckCircle,
  TrendingUp,
  ShieldCheck,
  BarChart3,
  AlertTriangle,
  Clock: ClockIcon, // ✅ key "Clock" -> aliased component
  Lightbulb,
  CornerRightUp,
  Eye,
  BookOpen,
  Home,
  ArrowLeft,
  PlusCircle,
  X,
  MessageSquare,
  Info,
};

// --- PDP TIER METADATA ---
export const LEADERSHIP_TIERS = {
    T1: { id: 'T1', name: 'Self-Awareness & Trust', icon: 'HeartPulse', color: 'indigo-500' },
    T2: { id: 'T2', name: 'Communication & Feedback', icon: 'Mic', color: 'cyan-600' },
    T3: { id: 'T3', name: 'Execution & Delegation', icon: 'Briefcase', color: 'green-600' },
    T4: { id: 'T4', name: 'Talent & People Development', icon: 'Users', color: 'yellow-600' },
    T5: { id: 'T5', name: 'Vision & Strategic Clarity', icon: 'TrendingUp', color: 'red-600' },
};

// --- CONTENT LIBRARY ---
export const CONTENT_LIBRARY = [
    // T1: Self-Awareness & Trust
    { id: 101, tier: 'T1', skill: 'Trust', type: 'Reading', title: 'Article: Vulnerability-Based Trust', duration: 30, difficulty: 'Intro' },
    { id: 102, tier: 'T1', skill: 'Identity', type: 'Exercise', title: 'Drafting Your LIS', duration: 45, difficulty: 'Core' },
    { id: 103, tier: 'T1', skill: 'Reflection', type: 'Journal', title: 'Daily Check: Acted in Integrity?', duration: 15, difficulty: 'Intro' },
    { id: 104, tier: 'T1', skill: 'Awareness', type: 'Quiz', title: 'Self-Assessment: Blind Spots', duration: 20, difficulty: 'Intro' },
    { id: 105, tier: 'T1', skill: 'Reflection', type: 'Reading', title: 'Book Summary: The Power of Habit', duration: 25, difficulty: 'Core' },
    { id: 106, tier: 'T1', skill: 'Trust', type: 'Case Study', title: 'Trust Collapse Scenario Analysis', duration: 60, difficulty: 'Mastery' },
    { id: 107, tier: 'T1', skill: 'Identity', type: 'Reading', title: 'Article: The LIS Anchor Point', duration: 20, difficulty: 'Intro' },
    { id: 108, tier: 'T1', skill: 'Awareness', type: 'Exercise', title: 'Values Conflict Role-Play Prep', duration: 30, difficulty: 'Core' },
    // T2: Communication & Feedback
    { id: 201, tier: 'T2', skill: 'Feedback', type: 'Exercise', title: 'SBI Feedback Practice (Lab)', duration: 30, difficulty: 'Core' },
    { id: 202, tier: 'T2', skill: 'Listening', type: 'Reading', title: 'Article: Paraphrasing for Empathy', duration: 15, difficulty: 'Intro' },
    { id: 203, tier: 'T2', skill: 'Crucial', type: 'Role-Play', title: 'Practice: Deflecting the Blame-Shifter', duration: 40, difficulty: 'Core' },
    { id: 204, tier: 'T2', skill: 'Crucial', type: 'Reading', title: 'Book Summary: Crucial Conversations', duration: 25, difficulty: 'Intro' },
    { id: 205, tier: 'T2', skill: 'Feedback', type: 'Exercise', title: 'Mastering the 5:1 Magic Ratio', duration: 35, difficulty: 'Mastery' },
    { id: 206, tier: 'T2', skill: 'Listening', type: 'Quiz', title: 'Listening Blocks Assessment', duration: 15, difficulty: 'Intro' },
    { id: 207, tier: 'T2', skill: 'Crucial', type: 'Case Study', title: 'Firing for Cultural Fit Scenario', duration: 60, difficulty: 'Mastery' },
    { id: 208, tier: 'T2', skill: 'Feedback', type: 'Reading', title: 'Article: The CLEAR Model', duration: 20, difficulty: 'Core' },
    // T3: Execution & Delegation
    { id: 301, tier: 'T3', skill: 'Execution', type: 'Reading', title: 'Book Summary: Deep Work', duration: 25, difficulty: 'Intro' },
    { id: 302, tier: 'T3', skill: 'Execution', type: 'Exercise', title: 'Time Blocking for High Leverage', duration: 30, difficulty: 'Core' },
    { id: 303, tier: 'T3', skill: 'Delegation', type: 'Exercise', title: 'RACI Matrix Practice', duration: 45, difficulty: 'Core' },
    { id: 304, tier: 'T3', skill: 'Delegation', type: 'Reading', title: 'Article: Delegation Levels', duration: 15, difficulty: 'Intro' },
    { id: 305, tier: 'T3', skill: 'Process', type: 'Case Study', title: 'Process Bottleneck Audit', duration: 50, difficulty: 'Mastery' },
    { id: 306, tier: 'T3', skill: 'Execution', type: 'Quiz', title: 'Distraction Hotspots Assessment', duration: 15, difficulty: 'Intro' },
    { id: 307, tier: 'T3', skill: 'Delegation', type: 'Exercise', title: 'Delegation Risk Assessment', duration: 30, difficulty: 'Core' },
    { id: 308, tier: 'T3', skill: 'Process', type: 'Reading', title: 'Article: PDCA Cycles', duration: 20, difficulty: 'Mastery' },
    // T4: Talent & People Development
    { id: 401, tier: 'T4', skill: 'Coaching', type: 'Exercise', title: 'Grow Model Practice', duration: 35, difficulty: 'Core' },
    { id: 402, tier: 'T4', skill: 'Development', type: 'Reading', title: 'Book Summary: Dare to Lead', duration: 25, difficulty: 'Intro' },
    { id: 403, tier: 'T4', skill: 'Talent', type: 'Exercise', title: 'Succession Planning Draft', duration: 60, difficulty: 'Mastery' },
    { id: 404, tier: 'T4', skill: 'Coaching', type: 'Role-Play', title: 'Practice: Coaching a High Performer', duration: 40, difficulty: 'Core' },
    { id: 405, tier: 'T4', skill: 'Development', type: 'Reading', title: 'Article: Career Laddering', duration: 20, difficulty: 'Intro' },
    { id: 406, tier: 'T4', skill: 'Talent', type: 'Quiz', title: 'Hiring Bias Assessment', duration: 15, difficulty: 'Intro' },
    { id: 407, tier: 'T4', skill: 'Coaching', type: 'Case Study', title: 'High Turnover Intervention', duration: 50, difficulty: 'Mastery' },
    { id: 408, tier: 'T4', skill: 'Development', type: 'Exercise', title: 'Motivational Driver Mapping', duration: 30, difficulty: 'Core' },
    // T5: Vision & Strategic Clarity
    { id: 501, tier: 'T5', skill: 'Vision', type: 'Exercise', title: 'Vision Statement Workshop', duration: 45, difficulty: 'Core' },
    { id: 502, tier: 'T5', skill: 'OKR', type: 'Reading', title: 'Book Summary: Measure What Matters', duration: 25, difficulty: 'Intro' },
    { id: 503, tier: 'T5', skill: 'Strategic', type: 'Tool', title: 'Pre-Mortem Risk Audit', duration: 30, difficulty: 'Mastery' },
    { id: 504, tier: 'T5', skill: 'OKR', type: 'Exercise', title: 'OKR Refinement (AI Critique)', duration: 40, difficulty: 'Core' },
    { id: 505, tier: 'T5', skill: 'Strategic', type: 'Reading', title: 'Article: Competitive Moats', duration: 20, difficulty: 'Intro' },
    { id: 506, tier: 'T5', skill: 'Vision', type: 'Quiz', title: 'Vision Alignment Check', duration: 15, difficulty: 'Intro' },
    { id: 507, tier: 'T5', skill: 'Strategic', type: 'Case Study', title: 'Market Disruption Response Plan', duration: 60, difficulty: 'Mastery' },
    { id: 508, tier: 'T5', skill: 'OKR', type: 'Exercise', title: 'KR "From X to Y" Practice', duration: 30, difficulty: 'Core' },
];

// --- BOOK DATA ---
export const allBooks = {
    Strategy: [
        { id: 1, title: 'Measure What Matters', author: 'John Doerr' },
        { id: 7, title: 'Good to Great', author: 'Jim Collins' },
        { id: 8, title: 'Playing to Win', author: 'A.G. Lafley & Roger L. Martin' },
        { id: 9, title: 'Blue Ocean Strategy', author: 'W. Chan Kim & Renée Mauborgne' },
        { id: 10, title: 'The Innovator\'s Dilemma', author: 'Clayton M. Christensen' },
    ],
    Culture: [
        { id: 2, title: 'Dare to Lead', author: 'Brené Brown' },
        { id: 11, title: 'The Culture Code', author: 'Daniel Coyle' },
        { id: 12, title: 'Radical Candor', author: 'Kim Scott' },
        { id: 13, title: 'Turn the Ship Around!', author: 'L. David Marquet' },
        { id: 14, title: 'Legacy', author: 'James Kerr' },
    ],
    Productivity: [
        { id: 3, title: 'Deep Work', author: 'Cal Newport' },
        { id: 15, title: 'Getting Things Done (GTD)', author: 'David Allen' },
        { id: 16, title: 'The 7 Habits of Highly Effective People', author: 'Stephen Covey' },
        { id: 17, title: 'Eat That Frog!', author: 'Brian Tracy' },
        { id: 18, title: 'The One Thing', author: 'Gary Keller & Jay Papasan' },
    ],
    Innovation: [
        { id: 4, title: 'The Lean Startup', author: 'Eric Ries' },
        { id: 19, title: 'Creativity, Inc.', author: 'Ed Catmull' },
        { id: 20, title: 'Rework', author: 'Jason Fried & D.H. Hansson' },
        { id: 21, title: 'Zero to One', author: 'Peter Thiel' },
        { id: 22, title: 'Loonshots', author: 'Safi Bahcall' },
    ],
    'Personal Willpower': [
        { id: 5, title: 'Atomic Habits', author: 'James Clear' },
        { id: 23, title: 'Grit', author: 'Angela Duckworth' },
        { id: 24, title: 'The Power of Habit', author: 'Charles Duhigg' },
        { id: 25, title: 'Flow', author: 'Mihaly Csikszentmihalyi' },
        { id: 26, title: 'Start With Why', author: 'Simon Sinek' },
    ],
    'Mental Fitness & Resilience': [
        { id: 6, title: 'Mindset', author: 'Carol Dweck' },
        { id: 27, title: 'Meditations', author: 'Marcus Aurelius' },
        { id: 28, title: 'The Subtle Art of Not Giving a F*ck', author: 'Mark Manson' },
        { id: 29, title: 'Option B', author: 'Sheryl Sandberg & Adam Grant' },
        { id: 30, title: 'Daring Greatly', author: 'Brené Brown' },
    ],
};

// --- MOCK CONTENT DETAILS (For Modals) ---
export const MOCK_CONTENT_DETAILS = {
    'Reading': (title, skill) => `### Core Concepts of ${title}\n\n**Focus Skill:** ${skill}\n\nThis article highlights the importance of asynchronous communication, creating clear documentation, and setting "done" criteria upfront to reduce execution drag. Your primary takeaway should be the principle: **Clear is Kind, Vague is Cruel.**\n\n* **Action Item:** Schedule 30 minutes for process mapping.\n* **Key Term:** Psychological Safety.`,
    'Exercise': (title, skill) => `### Guided Practice: ${title}\n\n**Focus Skill:** ${skill}\n\nThis exercise requires you to journal or draft statements based on a self-reflective prompt. Use the questions below as a starting point. Your goal is to identify a core belief and define a corresponding measurable behavior.\n\n* **Prompt 1:** When was the last time you felt truly in integrity with your stated values?\n* **Prompt 2:** What is the most difficult piece of feedback you have successfully processed and implemented?`,
    'Journal': (title, skill) => `### Journal Prompt: ${title}\n\n**Focus Skill:** ${skill}\n\nDedicate 15 minutes to freewriting based on this reflection prompt. Do not edit or self-censor. Just write.\n\n* **Reflection Focus:** Describe a recent decision where the easiest path conflicted with the most ethical or strategically correct path. What was the impact on your long-term credibility?`,
    'Quiz': (title, skill) => `### Self-Assessment: ${title}\n\n**Focus Skill:** ${skill}\n\nThis is a quick self-score. Rate yourself 1-5 (1=Never, 5=Always) on the following statements.\n\n* I actively ask for negative feedback from my team.\n* I publicly own mistakes before assigning blame.`,
    'Case Study': (title, skill) => `### Case Study Setup: ${title}\n\n**Focus Skill:** ${skill}\n\nReview the following scenario description and prepare a 5-step action plan before running the simulation or discussing with your coach. The scenario involves a failure to delegate a crucial task to a capable subordinate, leading to team burnout and missed deadlines.`,
    'Tool': (title, skill) => `### Tool Overview: ${title}\n\n**Focus Skill:** ${skill}\n\nThis module guides you through a new framework. The current focus is risk identification and mitigation planning. The objective of this tool is to formalize risk assessment across your strategic goals.`,
};

// --- FIRESTORE COLLECTION PATHS ---
export const PDP_COLLECTION = 'leadership_plan'; 
export const PDP_DOCUMENT = 'roadmap';
export const COMMITMENT_COLLECTION = 'daily_practice';
export const COMMITMENT_DOCUMENT = 'scorecard_data';
export const PLANNING_COLLECTION = 'planning_hub';
export const PLANNING_DOCUMENT = 'planning_data';
export const COACHING_COLLECTION = 'coaching_sessions';

// --- PLAN GENERATION UTILITIES ---
export const getTargetDifficulty = (rating) => {
    if (rating <= 4) return 'Intro';
    if (rating <= 7) return 'Core';
    return 'Mastery';
};

export const adjustDuration = (rating, baseDuration) => {
    if (rating >= 8) return Math.max(15, Math.round(baseDuration * 0.7)); // 30% quicker
    if (rating <= 3) return Math.min(90, Math.round(baseDuration * 1.3)); // 30% slower
    return baseDuration;
};

export const generatePlanData = (assessment, ownerUid) => {
    const { managerStatus, goalPriorities, selfRatings } = assessment;
    const allTiers = Object.keys(LEADERSHIP_TIERS);

    // Determine start tier based on manager status
    const initialTierIndex = managerStatus === 'New' ? 0 : managerStatus === 'Mid-Level' ? 2 : 4;

    const plan = [];
    const usedContentIds = new Set();

    const targetTiers = []; // Tiers to focus on (Goals + initial status)
    if (managerStatus === 'New') targetTiers.push('T1', 'T2');
    else if (managerStatus === 'Mid-Level') targetTiers.push('T2', 'T3', 'T4');
    else targetTiers.push('T4', 'T5');
    goalPriorities.forEach(tier => targetTiers.push(tier));

    // Rotation logic: Prioritize target tiers, then rotate.
    let tierRotationQueue = targetTiers.filter((v, i, a) => a.indexOf(v) === i); // Unique goals first

    // Ensure all tiers are eventually hit
    allTiers.forEach(tier => {
        if (!tierRotationQueue.includes(tier)) {
            tierRotationQueue.push(tier);
        }
    });

    // Main 24-Month Loop
    for (let month = 1; month <= 24; month++) {
        // --- 1. Determine Current Tier & Theme ---
        let currentTier = tierRotationQueue[(Math.floor((month - 1) / 4)) % tierRotationQueue.length];

        // Override: If a goal tier has a very low rating (< 3), force focus on it for one month.
        if (month > 1 && goalPriorities.length > 0) {
            const lowRatingGoal = goalPriorities.find(g => selfRatings[g] <= 3);
            if (lowRatingGoal && month % 6 === 0) { // Force every 6th month if low rating exists
                currentTier = lowRatingGoal;
            }
        }

        const tierMeta = LEADERSHIP_TIERS[currentTier];
        const theme = `Focus on ${tierMeta.name}`;
        
        const rating = selfRatings[currentTier];
        const targetDifficulty = getTargetDifficulty(rating);

        // --- 2. Pull Content Items ---
        const requiredContent = [];
        const contentPool = CONTENT_LIBRARY.filter(item => 
            item.tier === currentTier && item.difficulty === targetDifficulty && !usedContentIds.has(item.id)
        );
        
        let count = 0;
        for (const item of contentPool) {
            if (count < 4) {
                requiredContent.push({
                    ...item,
                    duration: adjustDuration(rating, item.duration), // Adjusted duration
                    status: 'Pending',
                });
                usedContentIds.add(item.id);
                count++;
            }
        }
        
        // Fallback if pool is exhausted
        if (requiredContent.length < 4) {
            const fallbackPool = CONTENT_LIBRARY.filter(item => 
                item.tier === currentTier && !usedContentIds.has(item.id)
            );
            for (const item of fallbackPool) {
                 if (count < 4) {
                    requiredContent.push({
                        ...item,
                        duration: adjustDuration(rating, item.duration),
                        status: 'Pending',
                    });
                    usedContentIds.add(item.id);
                    count++;
                }
            }
        }
        
        plan.push({
            month,
            tier: currentTier,
            theme,
            requiredContent,
            status: 'Pending',
            reflectionText: '',
            monthCompletedDate: null,
            totalDuration: requiredContent.reduce((sum, item) => sum + item.duration, 0),
        });
    }

    return {
        ownerUid,
        assessment,
        plan,
        currentMonth: 1,
        latestScenario: null,
        lastUpdate: new Date().toISOString(),
    };
};
