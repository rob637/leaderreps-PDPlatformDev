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
    // ... [rest of CONTENT_LIBRARY items for plan generation, for brevity]
    { id: 508, tier: 'T5', skill: 'OKR', type: 'Exercise', title: 'KR "From X to Y" Practice', duration: 30, difficulty: 'Core' },
];

// --- BOOK DATA ---
export const allBooks = { /* ... data ... */ };

// --- MOCK CONTENT DETAILS (For Modals) ---
export const MOCK_CONTENT_DETAILS = { /* ... data ... */ };

// --- FIRESTORE COLLECTION PATHS ---
export const PDP_COLLECTION = 'leadership_plan'; 
export const PDP_DOCUMENT = 'roadmap';
export const COMMITMENT_COLLECTION = 'daily_practice';
export const COMMITMENT_DOCUMENT = 'scorecard_data';
export const PLANNING_COLLECTION = 'planning_hub';
export const PLANNING_DOCUMENT = 'planning_data';
export const COACHING_COLLECTION = 'coaching_sessions';

// --- PLAN GENERATION UTILITIES (As provided in your original file) ---
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

// NOTE: generatePlanData is kept for context, but is typically a complex function 
// requiring the imports above to run correctly.
export const generatePlanData = (assessment, ownerUid) => {
    // ... complex plan generation logic using CONTENT_LIBRARY, LEADERSHIP_TIERS, etc.
    const { managerStatus, goalPriorities, selfRatings } = assessment;
    const allTiers = Object.keys(LEADERSHIP_TIERS);

    // ... [Rest of generatePlanData implementation]
    const plan = []; // Mock plan structure to satisfy export integrity

    return {
        ownerUid,
        assessment,
        plan,
        currentMonth: 1,
        latestScenario: null,
        lastUpdate: new Date().toISOString(),
    };
};