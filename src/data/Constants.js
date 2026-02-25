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
  Clock: ClockIcon,
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

// --- DAILY PRACTICE COMMITMENT BANK (Required for DailyPractice.jsx) ---
export const leadershipCommitmentBank = {
    'Focus & Productivity': [
        { id: 1, text: 'Identify and block out 90 minutes for "Deep Work" on a high-leverage task.', isCustom: false },
        { id: 2, text: 'Close email/chat apps entirely for the first two hours of the workday.', isCustom: false },
        { id: 3, text: 'Review and confirm alignment with my top 3 OKRs before starting my day.', isCustom: false },
        { id: 4, text: 'Decline one non-essential meeting to protect focused work time.', isCustom: false },
        { id: 5, text: 'Process emails only during two dedicated 30-minute windows.', isCustom: false },
        { id: 6, text: 'List the one non-negotiable win for tomorrow before leaving the office.', isCustom: false },
        { id: 7, text: 'Do not check external news or social media before 10 AM.', isCustom: false },
        { id: 8, text: 'Time-box all low-leverage administrative tasks to 60 minutes max.', isCustom: false },
        { id: 9, text: 'Finish the day with a 15-minute desk clean and digital file purge.', isCustom: false },
        { id: 10, text: 'Write a concise end-of-day summary for my team/manager (optional).', isCustom: false },
    ],
    'Feedback & Coaching': [
        { id: 11, text: 'Deliver one piece of specific, objective (SBI) constructive feedback.', isCustom: false },
        { id: 12, text: 'Deliver one piece of specific, genuine positive reinforcement (5:1 Ratio).', isCustom: false },
        { id: 13, text: 'Conduct one scheduled 1:1 session with a direct report, focusing on their agenda.', isCustom: false },
        { id: 14, text: 'Use a powerful, open-ended question (e.g., "What is the biggest roadblock?") in a team meeting.', isCustom: false },
        { id: 15, text: 'Paraphrase and validate a colleague’s emotion during a difficult discussion.', isCustom: false },
        { id: 16, text: 'Actively listen for 5 minutes without interrupting anyone.', isCustom: false },
        { id: 17, text: 'Ask "How can I support you?" instead of "Why did this happen?" during a performance conversation.', isCustom: false },
        { id: 18, text: 'Mentor one junior colleague for 15 minutes on a specific skill.', isCustom: false },
        { id: 19, text: 'Document one specific coaching action for each direct report.', isCustom: false },
        { id: 20, text: 'Provide feedback to my own manager.', isCustom: false },
    ],
    'Trust & Identity': [
        { id: 21, text: 'Log one instance where I consciously acted in alignment with my Leadership Identity Statement (LIS).', isCustom: false },
        { id: 22, text: 'Lead by modeling vulnerability: admit one specific error or uncertainty to the team.', isCustom: false },
        { id: 23, text: 'Hold myself and one direct report accountable for a clear, measurable commitment.', isCustom: false },
        { id: 24, text: 'Say "no" to a request that conflicts with my top strategic priority.', isCustom: false },
        { id: 25, text: 'Practice silence during a debate to allow psychological safety for others.', isCustom: false },
        { id: 26, text: 'Express gratitude publicly to a team member for courage or effort, not just results.', isCustom: false },
        { id: 27, text: 'Engage in a difficult conversation I have been avoiding (Crucial Conversation).', isCustom: false },
        { id: 28, text: 'Write down one core leadership value and define a concrete behavior that supports it.', isCustom: false },
        { id: 29, text: 'Apologize sincerely and specifically for a mistake I made.', isCustom: false },
        { id: 30, text: 'Ensure my body language and tone match my message (congruence).', isCustom: false },
    ],
    'Process & Delegation': [
        { id: 31, text: 'Delegate a task that I believe I could do better/faster, but that the other person needs for development.', isCustom: false },
        { id: 32, text: 'Update a project risk log with two new potential failure points.', isCustom: false },
        { id: 33, text: 'Conduct a quick RACI review for a pending cross-functional decision.', isCustom: false },
        { id: 34, text: 'Document one team process that currently relies too heavily on me.', isCustom: false },
        { id: 35, text: 'Provide specific, forward-looking context when assigning a task (The "Why").', isCustom: false },
        { id: 36, text: 'Avoid "reverse delegation" by allowing a team member to solve their own problem (5-minute rule).', isCustom: false },
        { id: 37, text: 'Set clear criteria for a successful outcome before initiating any new project phase.', isCustom: false },
        { id: 38, text: 'Review a project retrospective to identify one process improvement for the next sprint.', isCustom: false },
    ],
    'Strategy & Planning': [
        { id: 41, text: 'Review the organizational Vision/Mission statement and relate it to my team’s QTR goals.', isCustom: false },
        { id: 42, text: 'Refine one Key Result in the Planning Hub to be more clearly "from X to Y".', isCustom: false },
        { id: 43, text: 'Conduct a mini "Pre-Mortem" audit on a minor decision I am making.', isCustom: false },
        { id: 44, text: 'Review my weekly calendar: is 80% of my time spent on tasks that drive the top 20% of results?', isCustom: false },
        { id: 45, text: 'Proactively seek external data/competitive intelligence for future planning.', isCustom: false },
        { id: 46, text: 'Update a project risk log with two new potential failure points.', isCustom: false },
        { id: 47, text: 'Set clear "stop" criteria for a failing project or experiment.', isCustom: false },
        { id: 48, text: 'Write a short one-page summary of a new business book or article.', isCustom: false },
        { id: 49, text: 'Check if any daily commitments are misaligned with strategic objectives.', isCustom: false },
    ],
    'Personal Development': [
        { id: 51, text: 'Dedicate 15 minutes to journaling about a recent failure without self-judgment.', isCustom: false },
        { id: 52, text: 'Practice 5 minutes of focused breathing or meditation before a high-stakes meeting.', isCustom: false },
        { id: 53, text: 'Block off time to read a chapter from a business book (linked in Business Readings).', isCustom: false },
        { id: 54, text: 'Schedule a 30-minute learning session on a skill I am weak in.', isCustom: false },
        { id: 55, text: 'Reach out to a peer mentor for advice on a current leadership challenge.', isCustom: false },
        { id: 56, text: 'End the workday by listing three things I am genuinely grateful for.', isCustom: false },
        { id: 57, text: 'Identify and label the dominant emotion I feel during a difficult interaction.', isCustom: false },
        { id: 58, text: 'Take a 10-minute walk outside to clear my mind during a stressful period.', isCustom: false },
        { id: 59, text: 'Write down one actionable step toward closing a skill gap identified in my PDP.', isCustom: false },
    ],
};

// --- CONTENT LIBRARY ---
export const CONTENT_LIBRARY = [
    // T1: Self-Awareness & Trust (Items kept here for generatePlanData consistency)
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

// --- COACHING HUB COLLECTIONS ---
export const COACHING_COLLECTION = 'coaching_sessions'; // Legacy - individual sessions
export const COACHING_SESSION_TYPES_COLLECTION = 'coaching_session_types'; // Session templates (Open Gym, Leader Circle, etc.)
export const COACHING_SESSIONS_COLLECTION = 'coaching_sessions'; // Scheduled session instances
export const COACHING_REGISTRATIONS_COLLECTION = 'coaching_registrations'; // User registrations

// Coaching Session Types (keys are enum-style, values are Firestore strings)
export const SESSION_TYPES = {
    OPEN_GYM: 'open_gym',           // Weekly drop-in feedback sessions
    LEADER_CIRCLE: 'leader_circle', // Peer discussion groups
    WORKSHOP: 'workshop',           // Structured learning sessions
    LIVE_WORKOUT: 'live_workout',   // Quick skill practice
    ONE_ON_ONE: 'one_on_one'        // Personal coaching
};

// Default max attendees per session type
export const SESSION_TYPE_DEFAULT_MAX_ATTENDEES = {
    [SESSION_TYPES.OPEN_GYM]: 20,
    [SESSION_TYPES.LEADER_CIRCLE]: 12,
    [SESSION_TYPES.WORKSHOP]: 25,
    [SESSION_TYPES.LIVE_WORKOUT]: 30,
    [SESSION_TYPES.ONE_ON_ONE]: 1
};

// Helper to get default max attendees for a session type
export const getDefaultMaxAttendees = (sessionType) => {
    return SESSION_TYPE_DEFAULT_MAX_ATTENDEES[sessionType] || 20;
};

// Coaching Session Status
export const SESSION_STATUS = {
    SCHEDULED: 'scheduled',
    LIVE: 'live',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

// Registration Status
// Flow: registered → attended → certified (for milestone progression)
export const REGISTRATION_STATUS = {
    REGISTERED: 'registered',       // User booked the session
    ATTENDED: 'attended',           // User attended (or marked attended)
    CERTIFIED: 'certified',         // Facilitator certified/approved progression
    NO_SHOW: 'no_show',
    CANCELLED: 'cancelled'
};

// --- COMMUNITY HUB COLLECTIONS ---
export const COMMUNITY_SESSIONS_COLLECTION = 'community_sessions'; // Scheduled community session instances
export const COMMUNITY_SESSION_TYPES_COLLECTION = 'community_session_types'; // Session templates
export const COMMUNITY_REGISTRATIONS_COLLECTION = 'community_registrations'; // User registrations

// Community Session Types
export const COMMUNITY_SESSION_TYPES = {
    LEADER_CIRCLE: 'leader_circle',       // Peer discussion/accountability groups
    COMMUNITY_EVENT: 'community_event',   // Live networking events
    ACCOUNTABILITY_POD: 'accountability_pod', // Small group check-ins
    MASTERMIND: 'mastermind',             // Expert-led group sessions
    NETWORKING: 'networking'              // Casual networking sessions
};

// Community Session Recurrence
export const COMMUNITY_RECURRENCE = {
    NONE: 'none',           // One-time session
    WEEKLY: 'weekly',       // Every week on same day
    BIWEEKLY: 'biweekly',   // Every 2 weeks
    MONTHLY: 'monthly'      // Once a month
};

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

    const plan = [];
    const usedContentIds = new Set();

    const targetTiers = []; 
    if (managerStatus === 'New') targetTiers.push('T1', 'T2');
    else if (managerStatus === 'Mid-Level') targetTiers.push('T2', 'T3', 'T4');
    else targetTiers.push('T4', 'T5');
    goalPriorities.forEach(tier => targetTiers.push(tier));

    let tierRotationQueue = targetTiers.filter((v, i, a) => a.indexOf(v) === i); 

    allTiers.forEach(tier => {
        if (!tierRotationQueue.includes(tier)) {
            tierRotationQueue.push(tier);
        }
    });

    for (let month = 1; month <= 24; month++) {
        let currentTier = tierRotationQueue[(Math.floor((month - 1) / 4)) % tierRotationQueue.length];

        if (month > 1 && goalPriorities.length > 0) {
            const lowRatingGoal = goalPriorities.find(g => selfRatings[g] <= 3);
            if (lowRatingGoal && month % 6 === 0) {
                currentTier = lowRatingGoal;
            }
        }

        const tierMeta = LEADERSHIP_TIERS[currentTier];
        const theme = `Focus on ${tierMeta.name}`;
        
        const rating = selfRatings[currentTier];
        const targetDifficulty = getTargetDifficulty(rating);

        const requiredContent = [];
        const contentPool = CONTENT_LIBRARY.filter(item => 
            item.tier === currentTier && item.difficulty === targetDifficulty && !usedContentIds.has(item.id)
        );
        
        let count = 0;
        for (const item of contentPool) {
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
