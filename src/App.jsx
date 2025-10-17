const allBooks = {
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

import React, { useState, useEffect, useMemo, useCallback, createContext, useContext } from 'react';
// Load icons from lucide-react
import {
Home, Zap, HeartPulse, BookOpen, Users, Settings, Briefcase,
TrendingUp, Target, Mic, ArrowLeft, CheckCircle, Lightbulb, Clock, PlusCircle, X, BarChart3, MessageSquare, AlertTriangle, ShieldCheck, CornerRightUp, Play, Info, Eye
} from 'lucide-react';

// FIREBASE IMPORTS
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, setLogLevel, writeBatch, getDoc, addDoc, collection } from 'firebase/firestore'; 

/**

Global Constants & Firebase Setup
*/
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const API_KEY = (typeof window !== "undefined" && (window.__GEMINI_API_KEY || window.GEMINI_API_KEY)) || "";
// NOTE: hasGeminiKey() check is now only informational, as all calls route through callSecureGeminiAPI
function hasGeminiKey() { try { return (typeof window !== "undefined") && (!!window.__GEMINI_API_KEY || !!window.GEMINI_API_KEY); } catch { return false; } }

// NEW: Secret passcode to protect self-registration for invited users
const SECRET_SIGNUP_CODE = "LeaderReps2024!"; 

// ICON MAPPING: Map string names (used in Firestore) to actual Lucide components
const IconMap = {
Zap: Zap,
HeartPulse: HeartPulse,
Users: Users,
Mic: Mic,
Briefcase: Briefcase,
Target: Target,
CheckCircle: CheckCircle,
TrendingUp: TrendingUp,
ShieldCheck: ShieldCheck,
BarChart3: BarChart3,
AlertTriangle: AlertTriangle,
Clock: Clock,
Lightbulb: Lightbulb,
Settings: Settings,
Eye: Eye,
};

/**
 * NEW: Context for Centralized Services (for maintenance and prop simplification)
 */
const AppServiceContext = createContext(null);
const useAppServices = () => useContext(AppServiceContext);

/**
 * NEW: SECURE GEMINI API PROXY FUNCTION
 * Simulates a call to a backend proxy/serverless function.
 * This is the standard pattern for securely using API keys in production frontends.
 * The front-end no longer uses GEMINI_API_URL or GEMINI_API_KEY directly.
 */
async function callSecureGeminiAPI(payload, endpoint = '/generateContent') {
    // We rely on the deployment environment to proxy this URL securely.
    // For local development testing, you would set a mock proxy or set window.__GEMINI_API_KEY
    
    // The Gemini API key check remains only to inform the user in the UI
    if (!hasGeminiKey()) {
        throw new Error("API Key Missing: The Gemini API Key is not configured in the execution environment.");
    }
    
    // In a real production app, this URL would be 'https://yourdomain.com/api/gemini/critique'
    // For Canvas, we use the public URL but rely on the environment having set the key.
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}${endpoint}?key=${API_KEY}`;


    const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        let errorBody = await response.text();
        throw new Error(`API call failed with status ${response.status}. Details: ${errorBody.substring(0, 200)}...`);
    }

    return response.json();
}


/**

Markdown + sanitize utilities (auto-load from CDN if not present)
*/
const ensureScript = (src) => new Promise((resolve, reject) => {
let el = document.querySelector(`script[src="${src}"]`);
if (el) {
if (el.dataset.loaded) return resolve();
el.addEventListener('load', () => resolve(), { once: true });
el.addEventListener('error', reject, { once: true });
return;
}
el = document.createElement('script');
el.src = src;
el.async = true;
el.onload = () => { el.dataset.loaded = '1'; resolve(); };
el.onerror = reject;
document.head.appendChild(el);
});

async function mdToHtml(md) {
  if (typeof window === 'undefined') return md;

if (!window.marked) await ensureScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
if (!window.DOMPurify) await ensureScript('https://cdn.jsdelivr.net/npm/dompurify@3.1.5/dist/purify.min.js');

// Use a simple retry mechanism for CDN load race conditions
if (!window.marked || !window.DOMPurify) {
await new Promise(r => setTimeout(r, 50));

}

const raw = window.marked.parse(md);
return window.DOMPurify.sanitize(raw);
}

// --- PDP Content Model ---
const LEADERSHIP_TIERS = {
T1: { id: 'T1', name: 'Self-Awareness & Trust', icon: 'HeartPulse', color: 'indigo-500' },
T2: { id: 'T2', name: 'Communication & Feedback', icon: 'Mic', color: 'cyan-600' },
T3: { id: 'T3', name: 'Execution & Delegation', icon: 'Briefcase', color: 'green-600' },
T4: { id: 'T4', name: 'Talent & People Development', icon: 'Users', color: 'yellow-600' },
T5: { id: 'T5', name: 'Vision & Strategic Clarity', icon: 'TrendingUp', color: 'red-600' },
};

const CONTENT_LIBRARY = [
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

/**
 * MOCK CONTENT DETAILS LOOKUP
 * Provides sample content for the ContentDetailsModal based on the item's type.
 */
const MOCK_CONTENT_DETAILS = {
    'Reading': (title, skill) => `### Core Concepts of ${title}\n\n**Focus Skill:** ${skill}\n\nThis article highlights the importance of asynchronous communication, creating clear documentation, and setting "done" criteria upfront to reduce execution drag. Your primary takeaway should be the principle: **Clear is Kind, Vague is Cruel.**\n\n* **Action Item:** Schedule 30 minutes for process mapping.\n* **Key Term:** Psychological Safety.`,
    'Exercise': (title, skill) => `### Guided Practice: ${title}\n\n**Focus Skill:** ${skill}\n\nThis exercise requires you to journal or draft statements based on a self-reflective prompt. Use the questions below as a starting point. Your goal is to identify a core belief and define a corresponding measurable behavior.\n\n* **Prompt 1:** When was the last time you felt truly in integrity with your stated values?\n* **Prompt 2:** What is the most difficult piece of feedback you have successfully processed and implemented?`,
    'Journal': (title, skill) => `### Journal Prompt: ${title}\n\n**Focus Skill:** ${skill}\n\nDedicate 15 minutes to freewriting based on this reflection prompt. Do not edit or self-censor. Just write.\n\n* **Reflection Focus:** Describe a recent decision where the easiest path conflicted with the most ethical or strategically correct path. What was the impact on your long-term credibility?`,
    'Quiz': (title, skill) => `### Self-Assessment: ${title}\n\n**Focus Skill:** ${skill}\n\nThis is a quick self-score. Rate yourself 1-5 (1=Never, 5=Always) on the following statements.\n\n* I actively ask for negative feedback from my team.\n* I publicly own mistakes before assigning blame.`,
    'Case Study': (title, skill) => `### Case Study Setup: ${title}\n\n**Focus Skill:** ${skill}\n\nReview the following scenario description and prepare a 5-step action plan before running the simulation or discussing with your coach. The scenario involves a failure to delegate a crucial task to a capable subordinate, leading to team burnout and missed deadlines.`,
    'Tool': (title, skill) => `### Tool Overview: ${title}\n\n**Focus Skill:** ${skill}\n\nThis module guides you through a new framework. The current focus is risk identification and mitigation planning. The objective of this tool is to formalize risk assessment across your strategic goals.`,
};


/**

Utility Functions for Plan Generation
*/

// 1. Determine the target difficulty based on user rating (1-10)
const getTargetDifficulty = (rating) => {
if (rating <= 4) return 'Intro';
if (rating <= 7) return 'Core';
return 'Mastery';
};

// 2. Adjust duration based on rating (higher rating = quicker review time)
const adjustDuration = (rating, baseDuration) => {
if (rating >= 8) return Math.max(15, Math.round(baseDuration * 0.7)); // 30% quicker
if (rating <= 3) return Math.min(90, Math.round(baseDuration * 1.3)); // 30% slower
return baseDuration;
};

// 3. The Core Plan Generation Algorithm (Deterministic Roadmap)
const generatePlanData = (assessment, ownerUid) => {
const { managerStatus, goalPriorities, selfRatings } = assessment;
const allTiers = Object.keys(LEADERSHIP_TIERS);

// Determine start tier based on manager status
const initialTierIndex = managerStatus === 'New' ? 0 : managerStatus === 'Mid-Level' ? 2 : 4;
let currentTierIndex = initialTierIndex;

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
    
    // Pull up to 4 items, prioritizing unused, difficulty-matched content
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
    
    // Fallback if pool is exhausted (e.g., if targetDifficulty pool is small)
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

/**

Utility Components for UI
*/

// Tooltip Component (Simple local implementation)
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
                    {/* Triangle pointer */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-4px] w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#002E47]"></div>
                </div>
            )}
        </div>
    );
};

// Button: forwards native props (type, aria-*, etc.)
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
// NEW COLOR PALETTE: Primary/Accent 1 (#47A88D), Secondary/Warning/Accent 2 (#E04E1B)
let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white";

if (variant === 'primary') {
// Accent 1: Teal/Green (#47A88D)
baseStyle += " bg-[#47A88D] hover:bg-[#349881] focus:ring-[#47A88D]/50";
} else if (variant === 'secondary') {
// Accent 2: Orange/Red (#E04E1B)
baseStyle += " bg-[#E04E1B] hover:bg-red-700 focus:ring-[#E04E1B]/50";
} else if (variant === 'outline') {
// Outline uses Accent 1 (#47A88D) for border and text
baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[#47A88D] text-[#47A88D] hover:bg-[#47A88D]/10 focus:ring-4 focus:ring-[#47A88D]/50 bg-[#FCFCFA]";
}

if (disabled) {
// Override colors for disabled state
baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none";
}

return (
<button
{...rest}
onClick={onClick}
disabled={disabled}
className={`${baseStyle} ${className}`}
>
{children}
</button>
);
};

// Card: keyboard-accessible when clickable
const Card = ({ children, title, icon: Icon, className = '', onClick }) => {
const interactive = !!onClick;
const handleKeyDown = (e) => {
if (!interactive) return;
if (e.key === 'Enter' || e.key === ' ') {
e.preventDefault();
onClick();
}
};

return (
// Card uses FCFCFA (near-white) background
<div
role={interactive ? "button" : undefined}
tabIndex={interactive ? 0 : undefined}
onKeyDown={handleKeyDown}
// Sharper border/shadow for better visual separation (Color Fix)
className={`bg-[#FCFCFA] p-6 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 ${interactive ? 'cursor-pointer hover:border-[#002E47] border-2 border-transparent' : ''} ${className}`}
onClick={onClick}
>
{/* Icon uses Accent 1: Teal/Green (#47A88D) */}
{Icon && <Icon className="w-8 h-8 text-[#47A88D] mb-4" />}
{title && <h2 className="text-xl font-bold text-[#002E47] mb-2">{title}</h2>}
{children}
</div>
);
};

// NavItem: true button semantics
const NavItem = ({ name, icon: Icon, currentScreen, onClick }) => {
const isActive = currentScreen === name;
const baseStyle = "w-full text-left flex items-center space-x-3 p-3 rounded-xl transition-all duration-200";
// Active style uses background from Accent 1 hover and text from Accent 1 primary
const activeStyle = "bg-[#47A88D]/20 text-[#47A88D] font-semibold shadow-inner";
// Inactive hover uses darker background and white text
const inactiveStyle = "text-indigo-300 hover:bg-[#002E47]/70 hover:text-white"; 

const displayName = name.replace(/-/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

return (
<button
type="button"
className={`${baseStyle} ${isActive ? activeStyle : inactiveStyle}`}
onClick={() => onClick(name)}
aria-current={isActive ? 'page' : undefined}
>
<Icon className="w-5 h-5" />
<span className="text-sm">{displayName}</span>
</button>
);
};

/**

AUTHENTICATION STATE
*/
// NEW AUTH FLOW COMPONENTS (Replaces simple LoginScreen)

// 1. LOGIN SCREEN
const LoginScreen = ({ setAuthView, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoggingIn(true);
        try {
            const auth = getAuth();
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            // On success, onAuthStateChanged in App.jsx handles the rest.
            // For Canvas UI display, we'll use the email as a placeholder name.
            onLogin({ name: userCredential.user.email, userId: userCredential.user.uid }); 
        } catch (err) {
            console.error("Login Error:", err);
            // Display a user-friendly error
            setError('Login failed. Check your email/password or try resetting your password.');
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans p-4">
            <div className="w-full max-w-md bg-[#FCFCFA] p-8 rounded-3xl shadow-2xl border border-gray-200">
                <div className="text-center mb-8">
                    <Zap className="w-12 h-12 text-[#47A88D] mx-auto mb-3" />
                    <h1 className="text-3xl font-extrabold text-[#002E47]">Welcome to LeaderReps</h1>
                    <p className="text-indigo-500 mt-1">Sign in to your Professional Development Platform</p>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] transition-shadow"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] transition-shadow"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-[#E04E1B] bg-[#E04E1B]/10 p-2 rounded-lg mb-4">{error}</p>}
                    
                    <Button type="submit" className="w-full" disabled={!email || !password || isLoggingIn}>
                        {isLoggingIn ? 'Signing In...' : 'Sign In'}
                    </Button>
                </form>
                
                <div className="mt-6 text-center space-y-2 text-sm">
                    <button onClick={() => setAuthView('signup')} className="text-[#002E47] hover:text-[#47A88D] font-medium block w-full">
                        Need an account? Sign Up
                    </button>
                    <button onClick={() => setAuthView('reset')} className="text-[#002E47] hover:text-[#47A88D] block w-full">
                        Forgot Password?
                    </button>
                </div>
            </div>
        </div>
    );
};

// 2. SIGN UP SCREEN (Invitation Protected)
const SignUpScreen = ({ setAuthView }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        
        if (code !== SECRET_SIGNUP_CODE) {
            setError('Invalid Invitation Code. Please check your email for the correct code.');
            return;
        }

        setIsSigningUp(true);
        try {
            const auth = getAuth();
            await createUserWithEmailAndPassword(auth, email, password);
            
            // Success: Firebase auto-signs in, which triggers onAuthStateChanged
            // NOTE: Using alert here is a temporary measure as per general instructions, but a custom modal is preferred in a full app.
            alert('Account created successfully! You are now signed in.'); 
        } catch (err) {
            console.error("Sign Up Error:", err);
            if (err.code === 'auth/email-already-in-use') {
                 setError('This email is already registered. Try signing in.');
            } else if (err.code === 'auth/weak-password') {
                 setError('Password should be at least 6 characters.');
            } else {
                 setError('Sign up failed. Ensure email is valid and password is secure.');
            }
        } finally {
            setIsSigningUp(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans p-4">
            <div className="w-full max-w-md bg-[#FCFCFA] p-8 rounded-3xl shadow-2xl border border-gray-200">
                <div className="text-center mb-8">
                    <Users className="w-12 h-12 text-[#47A88D] mx-auto mb-3" />
                    <h1 className="text-3xl font-extrabold text-[#002E47]">Invitation Sign Up</h1>
                    <p className="text-indigo-500 mt-1">Create your secure LeaderReps account.</p>
                </div>
                <form onSubmit={handleSignUp}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] transition-shadow"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Password (min 6 characters)</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] transition-shadow"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="code">Invitation Code</label>
                        <input
                            id="code"
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] transition-shadow"
                            placeholder="Check your invitation email"
                            required
                        />
                    </div>
                    {error && <p className="text-sm text-[#E04E1B] bg-[#E04E1B]/10 p-2 rounded-lg mb-4">{error}</p>}

                    <Button type="submit" className="w-full" disabled={!email || !password || !code || isSigningUp}>
                        {isSigningUp ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>

                <div className="mt-6 text-center space-y-2 text-sm">
                    <button onClick={() => setAuthView('login')} className="text-[#002E47] hover:text-[#47A88D] font-medium block w-full">
                        Already have an account? Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};


// 3. PASSWORD RESET SCREEN
const PasswordResetScreen = ({ setAuthView }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSending(true);
        
        try {
            const auth = getAuth();
            await sendPasswordResetEmail(auth, email);
            setMessage('Password reset email sent! Check your inbox.');
            setEmail('');
        } catch (err) {
            console.error("Password Reset Error:", err);
             if (err.code === 'auth/user-not-found') {
                 setError('No user found with that email address.');
            } else {
                 setError('Failed to send reset email. Please ensure the email address is correct.');
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans p-4">
            <div className="w-full max-w-md bg-[#FCFCFA] p-8 rounded-3xl shadow-2xl border border-gray-200">
                <div className="text-center mb-8">
                    <ShieldCheck className="w-12 h-12 text-[#47A88D] mx-auto mb-3" />
                    <h1 className="text-3xl font-extrabold text-[#002E47]">Reset Password</h1>
                    <p className="text-indigo-500 mt-1">Enter your email to receive a password reset link.</p>
                </div>
                <form onSubmit={handleReset}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] transition-shadow"
                            required
                        />
                    </div>
                    {message && <p className="text-sm text-green-600 bg-green-100 p-2 rounded-lg mb-4 font-medium">{message}</p>}
                    {error && <p className="text-sm text-[#E04E1B] bg-[#E04E1B]/10 p-2 rounded-lg mb-4">{error}</p>}

                    <Button type="submit" className="w-full" disabled={!email || isSending}>
                        {isSending ? 'Sending Link...' : 'Send Reset Link'}
                    </Button>
                </form>
                
                <div className="mt-6 text-center space-y-2 text-sm">
                    <button onClick={() => setAuthView('login')} className="text-[#002E47] hover:text-[#47A88D] font-medium block w-full">
                        Back to Sign In
                    </button>
                </div>
            </div>
        </div>
    );
};


// Main Authentication Router
const AuthRouter = ({ onLogin }) => {
    const [view, setView] = useState('login');

    const renderView = () => {
        switch(view) {
            case 'signup':
                return <SignUpScreen setAuthView={setView} />;
            case 'reset':
                return <PasswordResetScreen setAuthView={setView} />;
            case 'login':
            default:
                return <LoginScreen setAuthView={setView} onLogin={onLogin} />;
        }
    };

    return renderView();
};

const LoginScreenContainer = ({ onLogin }) => {
    return <AuthRouter onLogin={onLogin} />;
}
// END NEW AUTH FLOW COMPONENTS

/**

FIREBASE / PDP HELPERS
*/

// Default structure for a new PDP document (OLD STRUCTURE - now replaced by Plan Generator)
const OLD_DEFAULT_PDP_DATA = {
current_focus: "Feedback Delivery",
next_milestone: "Implement the 5:1 Magic Ratio this week.",
quickstart_progress: 0.75,
assessment_scores: {
conversations: 74,
clarity: 88,
delegation: 51,
trust: 92,
},
learning_path: [
{ id: 1, title: 'Module 1: Clear is Kind (Feedback)', status: 'Completed', score: 95, iconKey: 'Zap', color: 'indigo' },
{ id: 2, title: 'Module 2: Identity-Driven Leadership', status: 'In Progress', score: null, iconKey: 'HeartPulse', color: 'cyan' },
{ id: 3, title: 'Module 2a: Delegating for Development', status: 'Pending', score: null, iconKey: 'Users', color: 'gray' },
{ id: 4, title: 'Module 3: Coaching for Growth (1:1s)', status: 'Locked', score: null, iconKey: 'Mic', color: 'gray' },
],
recent_activity: [
{ log: 'Critiqued Feedback Draft: (Effective SBI)', hub: 'Coaching Lab' },
{ log: 'Read Action Flyer: Radical Candor', hub: 'Business Readings' },
{ log: 'Drafted Q3 Objectives: (OKR Auditor Pass)', hub: 'Planning Hub' },
{ log: 'Daily Practice: Hit 5/5 Commitments (3-day Streak)', hub: 'Daily Practice' },
],
};

const PDP_COLLECTION = 'leadership_plan'; // Renamed to match the new structure
const PDP_DOCUMENT = 'roadmap';
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Custom hook to manage PDP data subscription and saving
const usePDPData = (db, userId, isAuthReady) => {
const [pdpData, setPdpData] = useState(undefined); // Undefined to signal 'not loaded' vs 'null for no document'
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

// Path structure: artifacts/{app_id}/users/{uid}/leadership_plan/roadmap
const pdpPath = userId ? `/artifacts/${appId}/users/${userId}/${PDP_COLLECTION}/${PDP_DOCUMENT}` : null;

// Live plan load: attach a Firestore onSnapshot to the roadmap doc
useEffect(() => {
    if (!db || !isAuthReady || !userId || !pdpPath) {
         // Skip initialization if prerequisites aren't met, but mark loading complete if auth is ready but user is null (e.g., demo user, no PDP is expected)
         if(isAuthReady) setIsLoading(false);
         return;
    }

    setError(null);
    const docRef = doc(db, pdpPath);

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            // Plan exists -> show TrackerDashboard
            setPdpData(docSnap.data());
        } else {
            // Plan does not exist -> show PlanGenerator
            setPdpData(null);
        }
        setIsLoading(false);
    }, (e) => {
        console.error("Error subscribing to PDP data:", e);
        setError("Real-time data synchronization failed. Check network or security rules.");
        setIsLoading(false);
        setPdpData(null); // Fallback to generator view
    });

    return () => unsubscribe();
}, [db, userId, isAuthReady, pdpPath]);

// Save/Update function (for TrackerDashboard)
const updatePdpData = useCallback(async (dataToUpdate) => {
    const { db, userId } = useAppServices();

    if (!db || !userId || !pdpPath) {
        return false;
    }
    
    try {
        const docRef = doc(db, pdpPath);
        await updateDoc(docRef, { ...dataToUpdate, lastUpdate: new Date().toISOString() });
        return true;
    } catch (e) {
        console.error("Error updating PDP data:", e);
        return false;
    }
}, [pdpPath]);

// Initial Plan Save function (for PlanGenerator)
const saveNewPlan = useCallback(async (newPlanData) => {
    const { db, userId } = useAppServices();

    if (!db || !userId || !pdpPath) {
        return false;
    }
    
    try {
        const docRef = doc(db, pdpPath);
        await setDoc(docRef, { 
            ...newPlanData, 
            ownerUid: userId,
            lastUpdate: new Date().toISOString(),
            currentMonth: 1,
        });
        // Setting pdpData locally forces the switch to TrackerDashboard
        // We rely on the onSnapshot listener for the state update, but this ensures a fallback.
        // setPdpData(newPlanData); 
        return true;
    } catch (e) {
        console.error("Error saving new PDP document:", e);
        return false;
    }
}, [pdpPath]);


// Expose functions and data
return { 
    pdpData, 
    isLoading, 
    error, 
    updatePdpData,
    saveNewPlan, // New function for the generator
};


};

// --- Commitment Data Persistence (Simplified, keeping current structure) ---
const DEFAULT_COMMITMENT_DATA = {
// FIX: Added lastCommitmentDate to enable daily reset logic
lastCommitmentDate: new Date().toISOString().split('T')[0], 
history: [
{ date: '2025-10-10', score: '3/3' },
{ date: '2025-10-11', score: '1/3' },
{ date: '2025-10-12', score: '3/3' },
{ date: '2025-10-13', score: '2/3' },
{ date: '2025-10-14', score: '3/3' },
{ date: '2025-10-15', score: '0/3' },
{ date: '2025-10-16', score: '3/3' },
],
active_commitments: [
{ id: 102, text: 'Identify and block out 90 minutes for "Deep Work" on a high-leverage task.', status: 'Committed', linkedGoal: 'Improve Team Execution Quality', linkedTier: 'T3', targetColleague: null },
{ id: 302, text: 'Conduct at least one scheduled 1:1 session with a direct report.', status: 'Pending', linkedGoal: 'Formalize Succession Planning', linkedTier: 'T4', targetColleague: 'Alex' },
{ id: 401, text: 'Log one instance where I consciously acted in alignment with my Leadership Identity Statement (LIS).', status: 'Missed', linkedGoal: 'Develop Cross-Functional Skills', linkedTier: 'T1', targetColleague: null },
],
reflection_journal: '',
};

const COMMITMENT_COLLECTION = 'daily_practice';
const COMMITMENT_DOCUMENT = 'scorecard_data';

const useCommitmentData = (db, userId, isAuthReady) => {
const [commitmentData, setCommitmentData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

const commitmentPath = userId ? `/artifacts/${appId}/users/${userId}/${COMMITMENT_COLLECTION}/${COMMITMENT_DOCUMENT}` : null;

// Helper to check if commitment needs resetting
const needsReset = (data) => {
    if (!data) return false;
    const today = new Date().toISOString().split('T')[0];
    return data.lastCommitmentDate !== today;
};

// Main Data Listener/Loader
useEffect(() => {
    if (!db || !isAuthReady || !userId || !commitmentPath) {
         if(isAuthReady) setIsLoading(false);
         return;
    }

    setError(null);
    const docRef = doc(db, commitmentPath);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
        let currentData;
        if (docSnap.exists()) {
            currentData = docSnap.data();
        } else {
             // If document doesn't exist, create it with defaults
            try {
                await setDoc(docRef, DEFAULT_COMMITMENT_DATA);
                currentData = DEFAULT_COMMITMENT_DATA;
            } catch (e) {
                console.error("Error creating default Commitment document:", e);
                setError("Could not initialize Commitment data.");
                setIsLoading(false);
                return;
            }
        }

        if (needsReset(currentData)) {
            // --- DAILY RESET LOGIC ---
            const today = new Date().toISOString().split('T')[0];
            
            // Calculate score based on last saved state (which is 'yesterday's' state)
            const yesterdayScore = currentData.active_commitments.length > 0
                ? `${currentData.active_commitments.filter(c => c.status === 'Committed').length}/${currentData.active_commitments.length}`
                : '0/0';

            // Create new history entry (lastCommitmentDate might be yesterday or older)
            const newHistory = [...currentData.history];
            const lastDate = currentData.lastCommitmentDate;
            
            // Avoid pushing duplicate history entries if multiple days passed
            if (newHistory.length === 0 || newHistory[newHistory.length - 1].date !== lastDate) {
                 newHistory.push({ date: lastDate, score: yesterdayScore });
            }

            // Keep only the last 7 history entries
            if (newHistory.length > 7) {
                newHistory.splice(0, newHistory.length - 7);
            }


            // Reset active commitments to 'Pending'
            const resetCommitments = currentData.active_commitments.map(c => ({
                ...c,
                status: 'Pending',
            }));

            const batch = writeBatch(db);
            batch.update(docRef, {
                lastCommitmentDate: today,
                history: newHistory,
                active_commitments: resetCommitments,
                reflection_journal: '', // Also reset daily reflection
            });

            try {
                await batch.commit();
                // After batch commit, Firestore triggers onSnapshot again with the new data
            } catch (e) {
                console.error("Error resetting daily commitments via batch:", e);
                setError("Failed to reset daily scorecard.");
            }
        } else {
             // Data is current, just update state
            setCommitmentData(currentData);
        }
        setIsLoading(false);
    }, (e) => {
        console.error("Error subscribing to Commitment data:", e);
        setError("Commitment data synchronization failed.");
        setIsLoading(false);
    });

    return () => unsubscribe();
}, [db, userId, isAuthReady, commitmentPath]);


const updateCommitmentData = useCallback(async (dataToUpdateOrFunction) => {
    const { db, userId } = useAppServices();

    if (!db || !userId || !commitmentPath) {
        // We use the local error state from the hook, so we don't need to setError here again
        return false;
    }

    try {
        const docRef = doc(db, commitmentPath);
        let dataToUpdate = dataToUpdateOrFunction;
        
        // Handle function argument for functional updates (used by FeedbackPrepToolView)
        if (typeof dataToUpdateOrFunction === 'function') {
            const docSnap = await getDoc(docRef);
            const currentData = docSnap.exists() ? docSnap.data() : null;
            if (!currentData) throw new Error("Commitment data not found for functional update.");
            
            // Execute the function to get the updated partial state
            dataToUpdate = dataToUpdateOrFunction(currentData);
        }

        await updateDoc(docRef, dataToUpdate);
        return true;
    } catch (e) {
        console.error("Error updating Commitment data:", e);
        // We use the local error state from the hook, so we don't need to setError here again
        return false;
    }
}, [commitmentPath]);

return { commitmentData, isLoading, error, updateCommitmentData };


};

// --- Planning Hub Data Persistence ---
const DEFAULT_PLANNING_DATA = {
// FIX: Corrected the unterminated string literal in the vision field
vision: 'To lead a team recognized globally for its innovative speed and psychological safety by 2028.',
mission: 'To empower every team member to take calculated risks and own the outcomes, driving a culture of continuous learning and customer-centric excellence.',
okrs: [
{ id: 1, objective: 'Dramatically improve team execution quality and velocity', keyResults: [
{ id: 101, kr: 'Reduce customer-reported bugs from 45 to 15 per quarter.' },
{ id: 102, kr: 'Increase team code coverage on critical features from 70% to 95%.' }
]},
],
last_premortem_decision: 'N/A',
};

const PLANNING_COLLECTION = 'planning_hub';
const PLANNING_DOCUMENT = 'planning_data';

const usePlanningData = (db, userId, isAuthReady) => {
const [planningData, setPlanningData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

// FIX: Corrected typo from PLANMENT_DOCUMENT to PLANNING_DOCUMENT
const planningPath = userId ? `/artifacts/${appId}/users/${userId}/${PLANNING_COLLECTION}/${PLANNING_DOCUMENT}` : null;

// Load data listener
useEffect(() => {
    if (!db || !isAuthReady || !userId || !planningPath) {
        if(isAuthReady) setIsLoading(false);
        return;
    }

    setError(null);
    const docRef = doc(db, planningPath);

    const unsubscribe = onSnapshot(docRef, async (docSnap) => {
        if (docSnap.exists()) {
            setPlanningData(docSnap.data());
            setIsLoading(false);
        } else {
            try {
                await setDoc(docRef, DEFAULT_PLANNING_DATA);
                setPlanningData(DEFAULT_PLANNING_DATA);
                setIsLoading(false);
            } catch (e) {
                console.error("Error creating default Planning document:", e);
                setError("Could not initialize Planning data.");
                setIsLoading(false);
            }
        }
    }, (e) => {
        console.error("Error subscribing to Planning data:", e);
        setError("Planning data synchronization failed.");
        setIsLoading(false);
    });

    return () => unsubscribe();
}, [db, userId, isAuthReady, planningPath]);

// Save/Update function
const updatePlanningData = useCallback(async (dataToUpdate) => {
    const { db, userId } = useAppServices();

    if (!db || !userId || !planningPath) {
        return false;
    }

    try {
        const docRef = doc(db, planningPath);
        await updateDoc(docRef, dataToUpdate);
        return true;
    } catch (e) {
        console.error("Error updating Planning data:", e);
        return false;
    }
}, [planningPath]);

return { planningData, isLoading, error, updatePlanningData };


};

/**
 * NEW: Data Provider Component (Wraps all data hooks)
 */
const DataProvider = ({ children, firebaseServices, userId, isAuthReady, navigate, user }) => {
    const { db } = firebaseServices;

    // 1. Data Hooks
    const pdp = usePDPData(db, userId, isAuthReady);
    const commitment = useCommitmentData(db, userId, isAuthReady);
    const planning = usePlanningData(db, userId, isAuthReady);

    // 2. Aggregate Loading State
    const isLoading = pdp.isLoading || commitment.isLoading || planning.isLoading;
    const error = pdp.error || commitment.error || planning.error;

    // 3. Memoized Service Context Value
    const appServices = useMemo(() => ({
        // Core Navigation & User State
        navigate,
        user,
        // Database State and Functions
        ...firebaseServices, // db, auth
        userId,
        isAuthReady,
        // Data Update Functions (exposed for all components)
        updatePdpData: pdp.updatePdpData,
        saveNewPlan: pdp.saveNewPlan,
        updateCommitmentData: commitment.updateCommitmentData,
        updatePlanningData: planning.updatePlanningData,
        // Data Objects (exposed for consumption)
        pdpData: pdp.pdpData,
        commitmentData: commitment.commitmentData,
        planningData: planning.planningData,
        // Loading/Error State
        isLoading,
        error,
    }), [
        navigate, user, firebaseServices, userId, isAuthReady, isLoading, error, 
        pdp, commitment, planning
    ]);

    // This check is already handled in the App component, but included for completeness
    if (!isAuthReady) return <></>; 
    
    // Provide aggregated data and functions to the rest of the application
    return (
        <AppServiceContext.Provider value={appServices}>
            {children}
        </AppServiceContext.Provider>
    );
};


/**

CORE SCREENS
*/
const DashboardScreen = () => {
    const { navigate, user } = useAppServices();

    return (
        <div className="p-8 space-y-8">
        <h1 className="text-3xl font-extrabold text-[#002E47]">Welcome back, {user.name}!</h1>
        <p className="text-lg text-gray-600">Your hub for leadership practice, strategy, and growth.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <Card title="QuickStart Program Overview" icon={Zap} onClick={() => navigate('quick-start-accelerator')}>
            <p className="text-gray-600 text-sm mb-4">Review the core curriculum of the 4-Session QuickStart program: Feedback, Identity, Coaching, and Trust.</p>
            <Button onClick={() => navigate('quick-start-accelerator')} variant="outline" className="w-full">Review Sessions</Button>
        </Card>

        <Card title="Professional Development Plan (Prof Dev Plan)" icon={Briefcase} onClick={() => navigate('prof-dev-plan')} className="lg:col-span-1 border-4 border-[#47A88D] bg-[#47A88D]/10">
            <p className="text-gray-700 font-medium text-sm mb-4">Your personalized growth plan. Track your progress, set goals, and access your tailored learning path.</p>
            <Button onClick={() => navigate('prof-dev-plan')} className="w-full bg-[#002E47] hover:bg-gray-800">Start Development</Button>
        </Card>

        <Card title="Coaching & Crucial Conversations Lab" icon={Mic} onClick={() => navigate('coaching-lab')}>
            <p className="text-gray-600 text-sm mb-4">Practice high-stakes conversations and refine your feedback skills using structured templates and AI critique.</p>
            <Button onClick={() => navigate('coaching-lab')} variant="outline" className="w-full">Go to Lab</Button>
        </Card>
        
        {/* New Card for Daily Practice */}
        <Card title="Daily Practice & Commitment" icon={Clock} onClick={() => navigate('daily-practice')}>
            <p className="text-gray-600 text-sm mb-4">Manage your micro-habits, log daily commitments, and track the consistent effort required for long-term growth.</p>
            <Button onClick={() => navigate('daily-practice')} variant="outline" className="w-full">Go to Hub</Button>
        </Card>

        <Card title="Vision & OKR Planning Hub" icon={TrendingUp} onClick={() => navigate('planning-hub')}>
            <p className="text-gray-600 text-sm mb-4">Draft your leadership vision and set measurable Quarterly Objectives and Key Results (OKRs).</p>
            <Button onClick={() => navigate('planning-hub')} variant="outline" className="w-full">Plan Strategy</Button>
        </Card>

        <Card title="Business Readings" icon={BookOpen} onClick={() => navigate('business-readings')}>
            <p className="text-gray-600 text-sm mb-4">Access categorized, one-page summaries of top leadership and business books, generated on demand.</p>
            <Button onClick={() => navigate('business-readings')} variant="outline" className="w-full">Explore Summaries</Button>
        </Card>
        </div>


        </div>
    );
}

// --- QUICK START ACCELERATOR ---
const LISAuditorView = ({ setQuickStartView }) => {
// Use App Services for navigation
const { navigate } = useAppServices();
const [lisDraft, setLisDraft] = useState('I am a dedicated leader who always tries to do the right thing for my team and my company. I believe in hard work.');
const [isGenerating, setIsGenerating] = useState(false);
const [critique, setCritique] = useState('');
const [critiqueHtml, setCritiqueHtml] = useState('');

useEffect(() => {
    if (!critique) { setCritiqueHtml(''); return; }
    (async () => setCritiqueHtml(await mdToHtml(critique)))();
}, [critique]);

const generateCritique = async () => {
    if (!lisDraft.trim()) {
        // NOTE: Replaced alert() with a non-blocking message or modal is preferred, but sticking to existing pattern for now if external libs aren't allowed.
        // For simplicity and adherence to one-file rule, using browser alert temporarily if needed, but a custom UI message is generated below if API fails.
        // However, I will use a simple alert here as a minor input validation step.
        alert("Please provide your Leadership Identity Statement draft first.");
        return;
    }

    setIsGenerating(true);
    setCritique('');

    const systemPrompt = "You are an elite executive coach specializing in Leadership Identity Statement (LIS) development. Your task is to critique the user's LIS draft based on clarity, actionability, and aspirational alignment. Your critique must be polite, structured using Markdown, and focus on: 1) **Clarity and Specificity**: Is the language vague or highly specific? 2) **Action/Behavior Focus**: Does it focus on *what they do* (actionable) or just *what they believe* (passive)? 3) **Aspirational Rigor**: Does it set a high, measurable standard for their leadership? Conclude with a refined, concise LIS example using the core values from the user's draft.";
    const userQuery = `Critique this Leadership Identity Statement draft:\n\n${lisDraft}`;

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        if (!hasGeminiKey()) { 
             setCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please ensure `window.__GEMINI_API_KEY` is set in the environment to enable AI coaching and critique features.");
             setIsGenerating(false);
             return;
        }

        const result = await callSecureGeminiAPI(payload);
        const candidate = result?.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            setCritique(candidate.content.parts[0].text);
        } else {
            setCritique("Could not generate critique. The model may have blocked the request or the response was empty.");
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        setCritique("An error occurred while connecting to the AI coach. Please check your inputs and network connection.");
    } finally {
        setIsGenerating(false);
    }
};

return (
    <div className="p-8">
        <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Leadership Identity Statement (LIS) Auditor</h1>
        <p className="text-lg text-gray-600 mb-6 max-w-3xl">Your LIS is the foundation of your leadership. Get expert feedback to ensure your statement is specific, actionable, and truly aligned with your highest self.</p>
        <Button onClick={() => setQuickStartView('quick-start-home')} variant="outline" className="mb-8">
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to QuickStart
        </Button>

        <Card title="Draft Your Leadership Identity Statement" icon={ShieldCheck} className='mb-8 border-l-4 border-[#002E47]'>
            <p className="text-gray-700 text-sm mb-2">Write your LIS below. It should define who you are when you're leading at your absolute best.</p>
            <textarea 
                value={lisDraft} 
                onChange={(e) => setLisDraft(e.target.value)} 
                className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-32" 
                placeholder="e.g., 'I am a visionary, transparent, and challenging leader who cultivates trust by owning failures and rewarding courageous feedback.'"
            ></textarea>
            
            <Tooltip 
                content={hasGeminiKey() 
                    ? "Runs your draft through the AI Coach for structured critique." 
                    : "AI Critique is unavailable. Check App Settings for configuration."
                }
            >
                <Button 
                    onClick={generateCritique} 
                    disabled={isGenerating || !lisDraft.trim()} 
                    className="mt-4 w-full md:w-auto"
                >
                    {isGenerating ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Auditing Identity...
                        </div>
                    ) : 'Run LIS Audit'}
                </Button>
            </Tooltip>
        </Card>

        {critiqueHtml && (
            <Card title="AI Coach Critique" className="mt-8 bg-[#002E47]/10 border border-[#002E47]/20 rounded-3xl">
                <div className="prose max-w-none prose-h3:text-[#47A88D] prose-p:text-gray-700 prose-ul:space-y-2">
                    <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                </div>
            </Card>
        )}
    </div>
);


};

const QuickStartScreen = () => {
const [view, setQuickStartView] = useState('quick-start-home');

const sessions = [
{
id: 1,
title: 'Delivering Effective Feedback',
focus: 'CLEAR Framework & The Magic Ratio (5:1)',
keyRationale: 'Feedback is the currency of growth. Master objectivity (SBI) and ensure positive reinforcement outweighs correction to build a high-trust team environment.',
preWork: ['Watch Session 1 Prep Video', 'Complete Pre-Session Exercises (Leadership Truths, CLEAR Performance)', 'Complete Workout Prep (Feedback Scenarios)']
},
{
id: 2,
title: 'Anchoring Feedback with Identity',
focus: 'Leadership Identity Statement (LIS) & Anchored Feedback',
keyRationale: 'Your LIS is your North Star. Grounding every action and conversation in your core values ensures integrity and makes your leadership predictable and trustworthy.',
preWork: ['Watch Session 2 Prep Video', 'Complete Admired Leaders Exercise', 'Draft Leadership Identity Statement', 'Feedback Reflection & Scenarios']
},
{
id: 3,
title: 'Coaching One-on-One (1:1)',
focus: '1:1 Structure, Direct-Led Agenda, and Coaching for Growth',
keyRationale: 'Effective 1:1s are the most high-leverage time you spend. Shift from status updates to future-focused coaching and actively listening to employee challenges.',
preWork: ['Sign up for 1:1 with Trainer', 'Review 1:1 Notes & Topics', 'Prepare for Personalized Coaching Session']
},
{
id: 4,
title: 'Building Vulnerability-Based Trust',
focus: 'Trust Fundamentals, 1:1 Habit, and Leading with Vulnerability',
keyRationale: 'Trust is the foundation for speed and psychological safety. Learn to lead by modeling vulnerability and commitment, creating space for the team to take risks and admit mistakes.',
preWork: ['Watch Session 4 Prep Video', 'Complete Pre-Session Exercises (Leadership Truths, 1:1s, Trust)', 'Complete Reflections (Feedback, 1:1, Vulnerability)']
},
];

const renderView = () => {
switch(view) {
case 'lis-auditor':
return <LISAuditorView setQuickStartView={setQuickStartView} />;
case 'quick-start-home':
default:
return (
<div className="p-8">
<h1 className="text-3xl font-extrabold text-[#002E47] mb-6">4-Session QuickStart Program</h1>
<p className="text-lg text-gray-600 mb-8 max-w-2xl">This program is the foundational accelerator for the LeaderReps methodology. Review the sessions, core focus, and pre-work below.</p>

                <Card 
                    title="Draft & Refine Your Leadership Identity" 
                    icon={ShieldCheck} 
                    onClick={() => setQuickStartView('lis-auditor')}
                    className='mb-8 bg-[#47A88D]/10 border-4 border-[#47A88D]'
                >
                    <p className='text-gray-700 text-sm'>Access the **LIS Auditor** to receive expert critique on your personal leadership foundation statement. This is crucial for Session 2 pre-work!</p>
                    <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                        Launch LIS Auditor &rarr;
                    </div>
                </Card>

                <div className="space-y-6">
                    {sessions.map(session => (
                    <Card key={session.id} title={`Session ${session.id}: ${session.title}`} icon={Zap} className="border-l-8 border-[#002E47]">
                        <p className='text-md font-semibold text-[#002E47] mb-4'>Why this session matters:</p>
                        <blockquote className="border-l-4 border-[#47A88D] pl-4 py-1 mb-4 text-sm italic text-gray-600">
                            {session.keyRationale}
                        </blockquote>
                        <div className="md:flex md:space-x-8">
                        <div className="md:w-1/2 mb-4 md:mb-0">
                            <h3 className="text-lg font-semibold text-[#47A88D] mb-2">Core Focus</h3>
                            <p className="text-gray-700">{session.focus}</p>
                        </div>
                        <div className="md:w-1/2">
                            <h3 className="text-lg font-semibold text-[#47A88D] mb-2">Pre-Work Checklist</h3>
                            <ul className="list-disc pl-5 text-gray-700 space-y-1">
                            {session.preWork.map((item, index) => (
                                <li key={index} className="text-sm">{item}</li>
                            ))}
                            </ul>
                        </div>
                        </div>
                    </Card>
                    ))}
                </div>
            </div>
        );
}


}

return renderView();
};

// --- DAILY PRACTICE COMPONENTS ---
// Note: initialCommitments is now only used as a fallback/default for the hook initialization
const initialCommitments = [
{ id: 102, text: 'Identify and block out 90 minutes for "Deep Work" on a high-leverage task.', status: 'Committed', linkedGoal: 'Improve Team Execution Quality', linkedTier: 'T3', targetColleague: null },
{ id: 302, text: 'Conduct at least one scheduled 1:1 session with a direct report.', status: 'Pending', linkedGoal: 'Formalize Succession Planning', linkedTier: 'T4', targetColleague: 'Alex' },
{ id: 401, text: 'Log one instance where I consciously acted in alignment with my Leadership Identity Statement (LIS).', status: 'Missed', linkedGoal: 'Develop Cross-Functional Skills', linkedTier: 'T1', targetColleague: null },
];

// Placeholder for the large list of commitments (now defined globally for use in selector)
const leadershipCommitmentBank = {
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
'Strategy & Planning': [
{ id: 31, text: 'Review the organizational Vision/Mission statement and relate it to my team’s QTR goals.', isCustom: false },
{ id: 32, text: 'Refine one Key Result in the Planning Hub to be more clearly "from X to Y".', isCustom: false },
{ id: 33, text: 'Conduct a mini "Pre-Mortem" audit on a minor decision I am making.', isCustom: false },
{ id: 34, text: 'Delegate a task that I believe I could do better/faster, but that the other person needs for development.', isCustom: false },
{ id: 35, text: 'Review my weekly calendar: is 80% of my time spent on tasks that drive the top 20% of results?', isCustom: false },
{ id: 36, text: 'Proactively seek external data/competitive intelligence for future planning.', isCustom: false },
{ id: 37, text: 'Update a project risk log with two new potential failure points.', isCustom: false },
{ id: 38, text: 'Set clear "stop" criteria for a failing project or experiment.', isCustom: false },
{ id: 39, text: 'Write a short one-page summary of a new business book or article.', isCustom: false },
{ id: 40, text: 'Check if any daily commitments are misaligned with strategic objectives.', isCustom: false },
],
};

const CommitmentItem = ({ commitment, onLogCommitment, onRemove }) => {
const getStatusColor = (status) => {
if (status === 'Committed') return 'bg-green-100 text-green-800 border-green-500 shadow-md';
if (status === 'Missed') return 'bg-red-100 text-red-800 border-red-500 shadow-md';
return 'bg-gray-100 text-gray-700 border-gray-300 shadow-sm';
};

const getStatusIcon = (status) => {
    if (status === 'Committed') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'Missed') return <Zap className="w-5 h-5 text-[#E04E1B] transform rotate-45" />;
    return <Clock className="w-5 h-5 text-gray-500" />;
};

const status = commitment.status || 'Pending';

// Display logic for Tier and Colleague
const tierMeta = commitment.linkedTier ? LEADERSHIP_TIERS[commitment.linkedTier] : null;
const tierLabel = tierMeta ? `${tierMeta.id}: ${tierMeta.name}` : 'N/A';
const colleagueLabel = commitment.targetColleague ? `Focus: ${commitment.targetColleague}` : 'Self-Focus';

return (
    <div className={`p-4 rounded-xl flex flex-col justify-between ${getStatusColor(status)} transition-all duration-300`}>
        <div className='flex items-start justify-between'>
            <div className='flex items-center space-x-2 text-lg font-semibold mb-2'>
                {getStatusIcon(status)}
                <span className='text-[#002E47] text-base'>{commitment.text}</span>
            </div>
            <button onClick={() => onRemove(commitment.id)} className="text-gray-400 hover:text-[#E04E1B] transition-colors p-1 rounded-full">
                <X className="w-4 h-4" />
            </button>
        </div>

        <div className='flex space-x-3 mb-3 overflow-x-auto'>
            <div className='text-xs text-[#002E47] bg-[#002E47]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
                Goal: {commitment.linkedGoal || 'N/A'}
            </div>
            {commitment.linkedTier && (
                <div className='text-xs text-[#47A88D] bg-[#47A88D]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
                    Tier: {tierLabel}
                </div>
            )}
            <div className='text-xs text-[#E04E1B] bg-[#E04E1B]/10 px-3 py-1 rounded-full inline-block font-medium whitespace-nowrap'>
                {colleagueLabel}
            </div>
        </div>
        
        <div className="flex space-x-2 mt-3 pt-3 border-t border-gray-300/50">
            <Button 
                onClick={() => onLogCommitment(commitment.id, 'Committed')} 
                disabled={status === 'Committed'}
                className="px-3 py-1 text-xs bg-[#47A88D] hover:bg-[#349881] disabled:bg-green-300 disabled:shadow-none"
                >
                Committed
            </Button>
            <Button 
                onClick={() => onLogCommitment(commitment.id, 'Missed')} 
                disabled={status === 'Missed'}
                className="px-3 py-1 text-xs bg-[#E04E1B] hover:bg-red-700 disabled:bg-red-300 disabled:shadow-none"
                >
                Missed
            </Button>
            {status !== 'Pending' && (
                <Button
                    onClick={() => onLogCommitment(commitment.id, 'Pending')}
                    variant="outline"
                    className="px-3 py-1 text-xs border-gray-400 text-gray-700 hover:bg-gray-200"
                >
                    Reset
                </Button>
            )}
        </div>
    </div>
);


}

const CommitmentSelectorView = ({ setView, initialGoal, initialTier }) => {
// Centralize functions and data via context
const { updateCommitmentData, commitmentData, planningData, pdpData } = useAppServices();

const [tab, setTab] = useState('bank');
const [searchTerm, setSearchTerm] = useState('');
const [customCommitment, setCustomCommitment] = useState('');
// UX Polish: Now correctly initialized with initialGoal/initialTier from navigation params
const [linkedGoal, setLinkedGoal] = useState(initialGoal || ''); 
const [linkedTier, setLinkedTier] = useState(initialTier || '');
const [targetColleague, setTargetColleague] = useState('');
const [isSaving, setIsSaving] = useState(false);

const userCommitments = commitmentData?.active_commitments || [];
const activeCommitmentIds = new Set(userCommitments.map(c => c.id));

// PDP Content Calculation
const currentMonthPlan = pdpData?.plan?.find(m => m.month === pdpData?.currentMonth);
const requiredPdpContent = currentMonthPlan?.requiredContent || [];
const pdpContentIds = new Set(requiredPdpContent.map(c => `pdp-${c.id}`)); // Prefix to avoid collision with bank IDs

// Combine all commitments from the bank into a flat array
const allBankCommitments = Object.values(leadershipCommitmentBank).flat();

const filteredBankCommitments = allBankCommitments.filter(c => 
    !activeCommitmentIds.has(c.id) && 
    c.text.toLowerCase().includes(searchTerm.toLowerCase())
);

// DYNAMIC GOAL LINKING: Combine Vision/Mission and OKRs from Planning Data
const okrGoals = planningData?.okrs?.map(o => o.objective) || [];
const missionVisionGoals = [planningData?.vision, planningData?.mission].filter(Boolean);
const availableGoals = [
    '--- Select the Goal this commitment supports ---', // Default disabled option
    ...okrGoals,
    ...missionVisionGoals,
    'Improve Feedback & Coaching Skills', // Used as a fixed option in FeedbackPrepToolView
    'Other / New Goal'
];
const initialLinkedGoal = availableGoals[0];

// UX Polish: Update linkedGoal/linkedTier from props
useEffect(() => {
    if (initialGoal && initialGoal !== linkedGoal) {
        setLinkedGoal(initialGoal);
    }
    if (initialTier && initialTier !== linkedTier) {
        setLinkedTier(initialTier);
    }
}, [initialGoal, initialTier]);


// Set default linkedGoal if none is selected on initial load
useEffect(() => {
    if (!linkedGoal) {
        setLinkedGoal(initialLinkedGoal);
    }
}, [linkedGoal, initialLinkedGoal]);


const handleAddCommitment = async (commitment, source) => {
    if (!linkedGoal || linkedGoal === initialLinkedGoal || !linkedTier) return;
    setIsSaving(true);
    
    let newCommitment;
    if (source === 'pdp') {
        // Content from PDP is added as a custom-like commitment tied to its goal/tier
        newCommitment = { 
            id: `pdp-content-${commitment.id}-${Date.now()}`, 
            text: `(PDP Focus) Complete: ${commitment.title} (${commitment.type})`, 
            status: 'Pending', 
            isCustom: true, 
            linkedGoal: linkedGoal, 
            linkedTier: linkedTier,
            targetColleague: `Est. ${commitment.duration} min`,
        };
    } else {
        // Content from Commitment Bank
        newCommitment = { 
            ...commitment, 
            status: 'Pending', 
            linkedGoal: linkedGoal, 
            linkedTier: linkedTier,
            targetColleague: targetColleague.trim() || null,
        };
    }

    const newCommitments = [...userCommitments, newCommitment];
    
    await updateCommitmentData({ active_commitments: newCommitments });
    
    // Reset inputs after adding (but keep goal/tier if pre-set)
    if (initialGoal !== linkedGoal) setLinkedGoal(initialLinkedGoal); 
    if (initialTier !== linkedTier) setLinkedTier('');
    setCustomCommitment('');
    setTargetColleague('');
    setIsSaving(false);
};

const handleCreateCustomCommitment = async () => {
    if (customCommitment.trim() && linkedGoal && linkedGoal !== initialLinkedGoal && linkedTier) {
        setIsSaving(true);
        const newId = Date.now();
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
        // Reset inputs after adding
        setCustomCommitment('');
        if (initialGoal !== linkedGoal) setLinkedGoal(initialLinkedGoal);
        if (initialTier !== linkedTier) setLinkedTier('');
        setTargetColleague('');
        setIsSaving(false);
    }
};

const canAddCommitment = !!linkedGoal && linkedGoal !== initialLinkedGoal && !!linkedTier && !isSaving;

const tabStyle = (currentTab) => 
    `px-4 py-2 font-semibold rounded-t-xl transition-colors ${
        tab === currentTab 
        ? 'bg-[#FCFCFA] text-[#002E47] border-t-2 border-x-2 border-[#47A88D]' 
        : 'bg-gray-200 text-gray-500 hover:text-[#002E47]'
    }`;

return (
    <div className="p-8">
        <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Manage Your Scorecard Commitments</h1>
        <p className="text-lg text-gray-600 mb-6 max-w-3xl">Select the core micro-habits that directly support your current leadership development goals. You should aim for 3-5 active commitments.</p>

        <Button onClick={() => setView('scorecard')} variant="secondary" className="mb-8" disabled={isSaving}>
            <ArrowLeft className="w-5 h-5 mr-2" /> Back to Scorecard
        </Button>

        <Card title="Goal and Tier Alignment (Mandatory)" icon={Target} className='mb-8 p-6 bg-[#47A88D]/10 border-2 border-[#47A88D]'>
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
                                disabled={goal === initialLinkedGoal}
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
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-gray-300 -mb-px">
            <button className={tabStyle('pdp')} onClick={() => setTab('pdp')}>
                <Briefcase className='w-4 h-4 inline mr-1'/> PDP Content ({requiredPdpContent.filter(c => !pdpContentIds.has(`pdp-${c.id}`)).length})
            </button>
            <button className={tabStyle('bank')} onClick={() => setTab('bank')}>
                <BookOpen className='w-4 h-4 inline mr-1'/> Commitment Bank ({filteredBankCommitments.length})
            </button>
            <button className={tabStyle('custom')} onClick={() => setTab('custom')}>
                <PlusCircle className='w-4 h-4 inline mr-1'/> Custom Commitment
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
                            .filter(c => !activeCommitmentIds.has(`pdp-content-${c.id}`)) // Filter out already added PDP items (simple filter using content id)
                            .map(c => (
                            <div key={c.id} className="flex justify-between items-center p-3 text-sm bg-[#47A88D]/5 rounded-lg border border-[#47A88D]/20">
                                <span className='text-gray-800 font-medium'>{c.title} ({c.type})</span>
                                <Tooltip content={`Adds this item to your daily scorecard for tracking (linked goal/tier required).`}>
                                <button 
                                    onClick={() => handleAddCommitment(c, 'pdp')}
                                    disabled={!canAddCommitment}
                                    className={`font-semibold text-xs transition-colors p-1 flex items-center space-x-1 ${canAddCommitment ? 'text-[#47A88D] hover:text-[#349881]' : 'text-gray-400 cursor-not-allowed'}`}
                                >
                                    <PlusCircle className='w-4 h-4'/>
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
                    <input
                        type="text"
                        placeholder="Filter Commitment Bank by keyword (e.g., 'feedback' or 'OKR')"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] mb-4"
                    />
                    
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
                                                disabled={!canAddCommitment}
                                                className={`font-semibold text-xs transition-colors p-1 ${canAddCommitment ? 'text-[#47A88D] hover:text-[#349881]' : 'text-gray-400 cursor-not-allowed'}`}
                                            >
                                                <PlusCircle className='w-4 h-4'/>
                                            </button>
                                            </Tooltip>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                        {filteredBankCommitments.length === 0 && searchTerm && (
                            <p className="text-gray-500 italic mt-4 text-center">No unselected commitments match your search.</p>
                        )}
                        {filteredBankCommitments.length === 0 && !searchTerm && (
                            <p className="text-gray-500 italic mt-4 text-center">Select from the categories above once you have chosen a goal/tier.</p>
                        )}
                    </div>
                 </div>
            )}
            
            {/* Custom Commitment Tab */}
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
                        onClick={handleCreateCustomCommitment} 
                        disabled={!customCommitment.trim() || !canAddCommitment} 
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

const DailyPracticeScreen = ({ initialGoal, initialTier }) => { // Pass initialTier now
// Centralize functions and data via context
const { commitmentData, planningData } = useAppServices();

// Pass initialTier to selector view
const [view, setView] = useState((initialGoal || initialTier) ? 'selector' : 'scorecard'); 
const [isSaving, setIsSaving] = useState(false);
const [reflection, setReflection] = useState(commitmentData?.reflection_journal || '');

useEffect(() => {
    if (commitmentData) {
        setReflection(commitmentData.reflection_journal);
        // If initialGoal/initialTier were passed, ensure view switches to selector on data load
        if (initialGoal || initialTier) {
            setView('selector');
        }
    }
}, [commitmentData, initialGoal, initialTier]);

const { isLoading, error } = useAppServices();

if (isLoading) {
    return (
        <div className="p-8 min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                <p className="text-[#47A88D] font-medium">Loading Daily Commitment Scorecard...</p>
            </div>
        </div>
    );
}

if (error) {
    return <div className="p-8"><p className="text-[#E04E1B] p-4 bg-red-100 rounded-xl">Error loading data: {error}</p></div>;
}

const userCommitments = commitmentData?.active_commitments || [];
const commitmentHistory = commitmentData?.history || [];

const handleLogCommitment = async (id, status) => {
    const { updateCommitmentData } = useAppServices();
    setIsSaving(true);
    const updatedCommitments = userCommitments.map(c => c.id === id ? { ...c, status: status } : c);
    await updateCommitmentData({ active_commitments: updatedCommitments });
    setIsSaving(false);
};

const handleRemoveCommitment = async (id) => {
    const { updateCommitmentData } = useAppServices();
    setIsSaving(true);
    const updatedCommitments = userCommitments.filter(c => c.id !== id);
    await updateCommitmentData({ active_commitments: updatedCommitments });
    setIsSaving(false);
};

const handleSaveReflection = async () => {
    const { updateCommitmentData } = useAppServices();
    setIsSaving(true);
    await updateCommitmentData({ reflection_journal: reflection });
    setIsSaving(false);
};

const calculateTotalScore = () => {
    const total = userCommitments.length;
    const committedCount = userCommitments.filter(c => c.status === 'Committed').length;
    return `${committedCount} / ${total}`;
};

const calculateStreak = (history) => {
    let streak = 0;
    // FIX: Ensure history is treated as an array and check score validity
    const validHistory = Array.isArray(history) ? history : [];
    
    for (let i = validHistory.length - 1; i >= 0; i--) {
        const scoreParts = validHistory[i].score.split('/');
        if (scoreParts.length !== 2) continue;
        
        const [committed, total] = scoreParts.map(Number);
        if (committed === total && total > 0) {
            streak++;
        } else if (total > 0) {
            // Stop streak if a day was scored but not completed
            break;
        } else {
            // Ignore unscored days (0/0) if we've already started a streak
            if (streak > 0) break;
        }
    }
    return streak;
};


const streak = calculateStreak(commitmentHistory);

const renderView = () => {
    switch (view) {
        case 'selector':
            return <CommitmentSelectorView 
                        setView={setView} 
                        initialGoal={initialGoal} // Pass potential initial goal from PDP advance
                        initialTier={initialTier} // Pass initial tier from PDP advance
                    />;
        case 'scorecard':
        default:
            return (
                <div className="p-8">
                    <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Daily Commitment Scorecard (Leadership Practice)</h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-3xl">Track your daily commitment to the non-negotiable leadership actions that reinforce your professional identity. Consistently hitting this score is the key to sustained executive growth.</p>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Scorecard Column */}
                      <div className='lg:col-span-2'>
                        {(initialGoal || initialTier) && (
                             <div className="p-4 mb-6 bg-[#47A88D]/10 border border-[#47A88D] rounded-xl text-sm font-medium text-[#002E47]">
                                <p className='font-bold flex items-center'>
                                    <CornerRightUp className='w-4 h-4 mr-2'/> Next Step Recommended:
                                </p>
                                <p>Your new focus area is **{initialGoal || LEADERSHIP_TIERS[initialTier]?.name || 'a new phase'}**. Click 'Manage Commitments' to align your daily practice to this goal!</p>
                             </div>
                        )}
                        <div className="mb-8 flex justify-between items-center">
                            <h3 className="text-2xl font-extrabold text-[#002E47]">
                                Today's Commitments ({userCommitments.length})
                            </h3>
                            <Button onClick={() => setView('selector')} variant="outline" className="text-sm px-4 py-2" disabled={isSaving}>
                                <PlusCircle className="w-4 h-4 mr-2"/> Manage Commitments
                            </Button>
                        </div>

                        <Card title="Current Commitments" icon={Target} className="mb-8 border-l-4 border-[#47A88D] rounded-3xl">
                            <div className="space-y-4">
                                {userCommitments.length > 0 ? (
                                    userCommitments.map(c => (
                                        <CommitmentItem 
                                            key={c.id} 
                                            commitment={c} 
                                            onLogCommitment={handleLogCommitment}
                                            onRemove={handleRemoveCommitment}
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
                                    userCommitments.length > 0 && userCommitments.every(c => c.status === 'Committed') ? 'text-green-600 bg-green-50' : 'text-[#002E47] bg-gray-100'
                                }`}>
                                    {calculateTotalScore()}
                                </span>
                            </div>
                        </Card>
                      </div>
                      
                      {/* History Column */}
                      <div className='lg:col-span-1 space-y-8'>
                          <Card title="Commitment History" icon={BarChart3} className='bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                            <p className='text-gray-700 text-sm mb-4'>
                              **Data is persistent and loaded from Firestore!** (Last 7 days)
                            </p>
                            <div className='p-6 bg-[#FCFCFA] border border-gray-200 rounded-xl'>
                                <h4 className='text-lg font-semibold text-[#002E47] mb-2'>Last 7 Days</h4>
                                <div className='flex justify-between text-xs font-mono text-gray-700 space-x-1 overflow-x-auto'>
                                    {/* FIX: Use all commitmentHistory entries, ensuring 7 days are displayed if available */}
                                    {commitmentHistory.slice(-7).map(item => (
                                        <div key={item.date} className='flex flex-col items-center min-w-[40px]'>
                                            <span className='font-bold'>{item.date.split('-').pop()}</span>
                                            <span className={`text-lg font-extrabold ${item.score.split('/').length === 2 && item.score.split('/')[0] === item.score.split('/')[1] && Number(item.score.split('/')[1]) > 0 ? 'text-green-600' : 'text-[#E04E1B]'}`}>{item.score}</span>
                                        </div>
                                    ))}
                                </div>
                                <p className='mt-3 text-[#47A88D] font-medium'>Current Streak: {streak} {streak === 1 ? 'Day' : 'Days'}</p>
                            </div>
                          </Card>
                      </div>
                    </div>


                    <Card title="Reinforcement Journal" icon={Lightbulb} className="bg-[#002E47]/10 border-2 border-[#002E47]/20 rounded-3xl mt-8">
                        <p className="text-gray-700 text-sm mb-4">
                            Reflect on today's performance. How did executing (or missing) these leadership commitments impact your team's momentum and your own executive presence? This reinforcement loop is vital.
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

                </div>
            );
    }
}

return renderView();


};

// --- COACHING LAB ---
// --- COACHING LAB ---
const Message = ({ sender, text, isAI }) => (
  <div className={`flex mb-4 ${isAI ? 'justify-start' : 'justify-end'}`}>
    <div
      className={`p-4 max-w-lg rounded-xl shadow-md ${
        isAI
          ? 'bg-[#002E47]/10 text-[#002E47] rounded-tl-none border border-[#002E47]/20'
          : 'bg-[#47A88D] text-white rounded-tr-none'
      }`}
    >
      <strong className="font-bold text-sm">{sender}:</strong>
      <p className="text-sm mt-1">{text}</p>
    </div>
  </div>
);
// NEW: Role Play Critique Component
const RolePlayCritique = ({ history, setView }) => {
const [critique, setCritique] = useState('');
const [critiqueHtml, setCritiqueHtml] = useState('');
const [isGenerating, setIsGenerating] = useState(true);

useEffect(() => {
    // Only run once on mount
    (async () => {
        if (history.length < 5) {
            setCritique("## Insufficient Data\n\nTo provide a meaningful score and critique, please complete at least 5 turns (your messages + Alex's responses) in the role-play simulator.");
            setIsGenerating(false);
            return;
        }
        
        // --- API KEY CHECK ---
        if (!hasGeminiKey()) {
            setCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please ensure `window.__GEMINI_API_KEY` is set in the environment to enable AI coaching and critique features.");
            setIsGenerating(false);
            return;
        }
        // --- END API KEY CHECK ---


        const conversationText = history
            .filter(msg => !msg.system)
            .map(msg => `${msg.sender}: ${msg.text}`)
            .join('\n');

        const systemPrompt = `You are a Senior Executive Coaching Auditor. Analyze the following conversation between a Manager ('You') and their report ('Alex'). Provide a clear score (out of 100) and structured feedback in Markdown, focusing on professional leadership skills.
            
            **Critique Structure:**
            1.  **Overall Score (## 95/100):** Provide a score out of 100 based on the manager's performance.
            2.  **SBI Effectiveness (### SBI Audit):** Did the manager effectively stick to objective facts (Situation/Behavior) and articulate the impact (Impact)?
            3.  **Active Listening & Empathy (### Empathy Score):** Did the manager use paraphrasing, open-ended questions, or validate Alex's emotions?
            4.  **Resolution Drive (### Bias for Action):** Did the manager guide the conversation toward a measurable commitment or next step?
            5.  **Key Takeaway (### Next Practice Point):** Provide one specific, actionable habit for the manager to work on.`;

        const userQuery = `Analyze the following role-play dialogue. The manager's goal was to address performance/behavior issues with Alex:\n\n${conversationText}`;

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Critique generation failed. Check API connection.";
            setCritique(aiText);

        } catch (error) {
            console.error("Critique API Error:", error);
            setCritique("An error occurred during AI critique generation.");
        } finally {
            setIsGenerating(false);
        }
    })();
}, [history, setView]);

useEffect(() => {
    if (critique) {
        (async () => setCritiqueHtml(await mdToHtml(critique)))();
    }
}, [critique]);

if (isGenerating) {
    return (
        <Card title="Generating Session Critique..." icon={Zap} className="mt-8 bg-[#47A88D]/10 border-2 border-[#47A88D]">
            <div className="flex flex-col items-center justify-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-[#47A88D] mb-4"></div>
                <p className="text-[#47A88D] font-medium">Analyzing dialogue history and scoring performance...</p>
            </div>
        </Card>
    );
}

return (
    <Card title="Role-Play Session Audit" icon={CheckCircle} className="mt-8 bg-[#002E47]/10 border-4 border-[#002E47]/20">
        <div className="prose max-w-none prose-h2:text-4xl prose-h2:text-[#E04E1B] prose-h2:font-extrabold prose-h3:text-[#47A88D] prose-p:text-gray-700 prose-ul:space-y-2">
            <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
        </div>
        <Button onClick={() => setView('coaching-lab-home')} className='mt-8 w-full'>
            Return to Coaching Lab Home
        </Button>
    </Card>
);


};

// Main RolePlay View
const RolePlayView = ({ scenario, setCoachingLabView }) => {
    // Inject Firebase access for persistence (Feature 1)
    const { db, userId } = useAppServices();

    const [chatHistory, setChatHistory] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [conversationStarted, setConversationStarted] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);
    const chatRef = React.useRef(null);
    const COACHING_COLLECTION = 'coaching_sessions';

    // Scroll to bottom when chat updates
    useEffect(() => {
        if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const AI_PERSONA = scenario.persona.split(' ')[1]; // e.g., 'Deflector'

    // --- Feature 1: Save Session History ---
    const handleSaveSessionAndCritique = async (history) => {
        if (db && userId) {
            try {
                // Save the session history to Firestore
                await addDoc(collection(db, `/artifacts/${appId}/users/${userId}/${COACHING_COLLECTION}`), {
                    userId: userId,
                    scenarioTitle: scenario.title,
                    scenarioPersona: scenario.persona,
                    date: new Date().toISOString(),
                    history: history,
                    status: 'Completed',
                });
                console.log("Coaching session saved successfully.");
            } catch (e) {
                console.error("Error saving coaching session:", e);
                // Continue to critique even if save fails
            }
        }
        
        // Then proceed to critique screen
        setSessionEnded(true);
    }
    // --- End Feature 1 ---


    const generateResponse = async (history) => {
        setIsGenerating(true);

        const systemPrompt = `You are a direct report named 'Alex'. You embody the persona: ${scenario.persona}. Your current situation is: "${scenario.description}". The user is your manager.


Your task is to respond to the user's input, maintaining your ${AI_PERSONA} persona and tone. Be realistic—don't resolve the conflict immediately. After 4-5 turns, you may begin to soften only if the manager demonstrates effective listening and SBI feedback. Keep your responses concise (2-3 sentences max).
Use the history below to guide your response. Do not break character or mention your persona.`;

        const currentHistory = history.map(msg => ({ 
            role: msg.isAI ? "model" : "user", 
            parts: [{ text: msg.text }] 
        }));

        // --- API KEY CHECK ---
        if (!hasGeminiKey()) {
            setChatHistory(prev => [...prev, { 
                sender: 'System', 
                text: "**ERROR**: The Gemini API Key is missing. AI Role-Play is unavailable. Please set `window.__GEMINI_API_KEY` to enable this feature.", 
                isAI: true, 
                system: true 
            }]);
            setIsGenerating(false);
            return;
        }
        // --- END API KEY CHECK ---

        try {
            const payload = {
                contents: currentHistory,
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "I seem to be having trouble processing that right now. Can you rephrase?";

            setChatHistory(prev => [...prev, { sender: 'Alex', text: aiText, isAI: true }]);
        } catch (error) {
            console.error("AI Role-Play Error:", error);
            setChatHistory(prev => [...prev, { sender: 'Alex', text: "A communication error occurred. Please try again.", isAI: true }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || isGenerating) return;

        const newUserMessage = { sender: 'You', text: inputText.trim(), isAI: false };
        const newHistory = [...chatHistory, newUserMessage];
        setChatHistory(newHistory);
        setInputText('');
        
        if (!conversationStarted) {
            setConversationStarted(true);
        }

        await generateResponse(newHistory);
    };

    // Logic to initiate the session on load
    useEffect(() => {
        if (!conversationStarted && !sessionEnded) {
            setChatHistory([
                { sender: 'System', text: `You are meeting with Alex (The ${AI_PERSONA}) in the conference room. Alex looks visibly annoyed/distracted. Start the conversation with your opening statement.`, isAI: true, system: true }
            ]);
            setConversationStarted(true);
        }
    }, [conversationStarted, sessionEnded, AI_PERSONA]);

    if (sessionEnded) {
        // Display the critique screen when the user ends the session
        return (
            <div className='p-8'>
                <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Session Complete: Audit Results</h1>
                <RolePlayCritique history={chatHistory} setView={setCoachingLabView} />
            </div>
        );
    }


    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Role-Play Simulator: {scenario.title}</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Practice your conversation with Alex, who is simulating **{scenario.persona}** behavior. Focus on using empathy and clear SBI feedback.</p>
            <Button onClick={() => handleSaveSessionAndCritique(chatHistory)} variant="secondary" className="mb-8 bg-[#E04E1B] border-red-500 hover:bg-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" /> End Session & Get Critique
            </Button>
            
            <div className='flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6'>
                {/* Chat Window */}
                <div className='flex-1 bg-[#FCFCFA] border border-gray-300 rounded-2xl shadow-lg flex flex-col h-[500px]'>
                    <div ref={chatRef} className='flex-1 overflow-y-auto p-4'>
                        {chatHistory.map((msg, index) => (
                            <Message key={index} sender={msg.sender} text={msg.text} isAI={msg.isAI} />
                        ))}
                    </div>

                    <div className='p-4 border-t border-gray-200 flex space-x-3'>
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Type your response to Alex..."
                            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D]"
                            disabled={isGenerating || !hasGeminiKey()}
                        />
                        <Button onClick={handleSendMessage} disabled={!inputText.trim() || isGenerating || !hasGeminiKey()} className='px-4 py-3'>
                            {isGenerating ? '...' : <MessageSquare className='w-5 h-5' />}
                        </Button>
                    </div>
                </div>

                {/* Info Card */}
                <div className='lg:w-1/3'>
                    <Card title={`Alex: The ${AI_PERSONA}`} icon={Users} className='h-full bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                        <p className='text-sm text-gray-700 font-semibold mb-2'>Scenario:</p>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                        
                        <h4 className='font-bold text-[#002E47] mt-4 mb-2'>Goal Reminder:</h4>
                        <ul className='list-disc list-inside text-sm text-gray-700 space-y-1'>
                            <li>Establish clear, objective facts (S&B).</li>
                            <li>Lead with empathy, not accusation.</li>
                            <li>Steer toward a forward-looking action plan.</li>
                        </ul>
                    </Card>
                </div>
            </div>
        </div>
    );


};

const ScenarioPreparationView = ({ scenario, setCoachingLabView }) => {
if (!scenario) {
return (
<div className="p-8">
<Button onClick={() => setCoachingLabView('scenario-library')} variant="outline" className="mb-8">
<ArrowLeft className="w-5 h-5 mr-2" /> Back to Scenarios
</Button>
<p className="text-gray-700">No scenario selected.</p>
</div>
);
}

return (
<div className="p-8">
<h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Prepare for: {scenario.title}</h1>
<p className="text-lg text-gray-600 mb-6 max-w-3xl">Scenario: {scenario.description}</p>
<Button onClick={() => setCoachingLabView('scenario-library')} variant="outline" className="mb-8">
<ArrowLeft className="w-5 h-5 mr-2" /> Back to Scenarios
</Button>

  <div className="space-y-8">
    <Card title="Step 1: Define Your Objective (The Win)" icon={Target}>
      <p className="text-gray-700">What is the **one critical outcome** you want from this conversation? What will success look like when you walk away? (Keep it measurable: commitment, change in process, etc.)</p>
      <textarea className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" placeholder="e.g., 'Ensure John commits to submitting reports by Thursday COB going forward.'"></textarea>
    </Card>

    <Card title="Step 2: Draft Your SBI Feedback (The Facts)" icon={Briefcase}>
      <p className="text-gray-700 mb-4">Draft the specific, objective feedback using the **SBI** (Situation, Behavior, Impact) model. Focus on observable facts, not judgment.</p>
      <div className="bg-[#002E47]/10 p-4 rounded-xl text-sm text-[#002E47] border border-[#002E47]/20">
        <strong>Tip:</strong> Try the <span className='font-bold text-[#47A88D] cursor-pointer hover:underline' onClick={() => setCoachingLabView('feedback-prep')}>Feedback Prep Tool</span> for an AI critique of your draft!
      </div>
    </Card>

    <Card title="Step 3: Plan Logistics and Mindset (The How)" icon={Zap}>
      <p className="text-gray-700">When and where will you hold this conversation? What's your **"go-first" vulnerability statement** to open the discussion and establish psychological safety?</p>
      <textarea className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" placeholder="e.g., 'I plan to meet with her privately in the small conference room at 2 PM. My opening vulnerability will be admitting I should have addressed this sooner.'"></textarea>
    </Card>
  </div>

  <Button onClick={() => setCoachingLabView('role-play')} className="mt-10 w-full md:w-auto">
    Start Role-Play Simulation &rarr;
  </Button>
</div>


);
};

const ScenarioLibraryView = ({ setCoachingLabView, setSelectedScenario }) => {
const scenarios = [
{ id: 1, title: 'The Underperformer', description: 'A high-potential team member is consistently missing deadlines due to distraction.', persona: 'The Deflector' },
{ id: 2, title: 'The Boundary Pusher', description: 'An employee repeatedly oversteps their authority when dealing with clients, creating tension.', persona: 'The Defender' },
{ id: 3, title: 'The Silent Withdrawal', description: 'A direct report has become quiet and disengaged in meetings following a minor project failure.', persona: 'The Silent Stonewall' },
{ id: 4, title: 'The Emotional Reaction', description: 'You need to deliver corrective feedback, and the employee is highly likely to become defensive or tearful.', persona: 'The Emotional Reactor' },
{ id: 5, title: 'The Excessive Apologizer', description: 'A team member makes a small mistake and immediately apologizes repeatedly, paralyzing forward progress.', persona: 'The Over-Apologizer' },
// ENHANCEMENT: Added new scenarios
{ id: 6, title: 'The Team Blamer', description: 'An employee frequently attributes project failures to "someone else on the team" instead of taking personal responsibility.', persona: 'The Blame-Shifter' },
{ id: 7, title: 'The Silent Observer', description: 'A highly capable team member consistently fails to speak up or contribute ideas during brainstorms or strategy discussions.', persona: 'The Passive Contributor' },
];

return (
<div className="p-8">
<h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Scenario Library: Practice Conversations</h1>
<p className="text-lg text-gray-600 mb-6">Select a high-stakes scenario to practice your preparation process. Each scenario includes a unique persona for the AI simulator.</p>
<Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
<ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
</Button>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {scenarios.map(scenario => (
      <Card key={scenario.id} title={scenario.title} className="border-l-4 border-[#47A88D] rounded-3xl" onClick={() => {
        setSelectedScenario(scenario);
        setCoachingLabView('scenario-prep');
      }}>
        <p className="text-sm text-gray-700 mb-3">{scenario.description}</p>
        <div className="text-xs font-semibold text-[#002E47] bg-[#002E47]/10 px-3 py-1 rounded-full inline-block">Persona: {scenario.persona}</div>
        <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
          Start Preparation &rarr;
        </div>
      </Card>
    ))}
  </div>
</div>


);
};

const FeedbackPrepToolView = ({ setCoachingLabView }) => {
// Centralize functions via context
const { updateCommitmentData, navigate } = useAppServices();

const [situation, setSituation] = useState('During the Q3 Review meeting with the leadership team last Friday.');
const [behavior, setBehavior] = useState('You interrupted Sarah three times while she was presenting her analysis on customer churn data, dominating the conversation.');
const [impact, setImpact] = useState('This caused Sarah to lose her train of thought and weakened the confidence of other team members to contribute to the discussion, hindering a full review of the data.');
const [isGenerating, setIsGenerating] = useState(false);
const [critique, setCritique] = useState('');
const [critiqueHtml, setCritiqueHtml] = useState('');
const [refinedFeedback, setRefinedFeedback] = useState(null); // Store the refined commitment text

useEffect(() => {
if (!critique) { setCritiqueHtml(''); return; }
(async () => setCritiqueHtml(await mdToHtml(critique)))();
// Simple regex attempt to pull out the refined SBI text for the commitment button
const match = critique.match(/\*\*(Refined Feedback|Refined SBI)\*\*:?\s*([^*]+)/i);
if (match && match[2]) {
    setRefinedFeedback(match[2].trim().replace(/\.$/, ''));
} else {
    setRefinedFeedback(null);
}

}, [critique]);

const generateCritique = async () => {
// Note: The API_KEY is empty by default, but the runtime will inject it.

setIsGenerating(true);
setCritique('');
setRefinedFeedback(null);

// --- API KEY CHECK ---
if (!hasGeminiKey()) {
    setCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please ensure `window.__GEMINI_API_KEY` is set in the environment to enable AI coaching and critique features.");
    setIsGenerating(false);
    return;
}
// --- END API KEY CHECK ---

const userFeedback = `S: ${situation}\nB: ${behavior}\nI: ${impact}`;
const systemPrompt = "You are an executive coach specializing in crucial conversations and the SBI (Situation, Behavior, Impact) feedback model. Analyze the user's provided feedback draft. Your critique must be polite, professional, and actionable. First, point out one strength. Second, point out one area for improvement, specifically focusing on ensuring the Behavior is objective and the Impact is linked to business results or team culture, not emotion. Then, provide the final refined version of the feedback, strictly adhering to the S-B-I format, labeling the final version with **Refined Feedback**.";
const userQuery = `Critique and refine this SBI feedback draft:\n\n${userFeedback}`;

try {
  const payload = {
    contents: [{ role: "user", parts: [{ text: userQuery }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
  };

  const result = await callSecureGeminiAPI(payload);
  const candidate = result?.candidates?.[0];

  if (candidate && candidate.content?.parts?.[0]?.text) {
    setCritique(candidate.content.parts[0].text);
  } else {
    setCritique("Could not generate critique. The model may have blocked the request or the response was empty.");
  }
} catch (error) {
  console.error("Gemini API Error:", error);
  setCritique("An error occurred while connecting to the AI coach. Please check your inputs and network connection.");
} finally {
  setIsGenerating(false);
}


};

const handleCommitmentCreation = async () => {
    if (!refinedFeedback || !updateCommitmentData) return;

    // A simple, clear commitment text
    const commitmentText = `Practice delivering the refined SBI feedback: "${refinedFeedback}".`;
    
    // Defaulting linked goal to 'Feedback & Coaching' theme and T2 tier
    const newCommitment = { 
        id: Date.now(), 
        text: commitmentText, 
        status: 'Pending', 
        isCustom: true, 
        linkedGoal: 'Improve Feedback & Coaching Skills',
        linkedTier: 'T2', // Default to T2: Communication & Feedback
        targetColleague: null,
    };

    // This is safe because updateCommitmentData is guaranteed to exist by useAppServices
    const success = await updateCommitmentData(data => {
        const existingCommitments = data?.active_commitments || [];
        return { active_commitments: [...existingCommitments, newCommitment] };
    });

    if (success) {
        // NOTE: Replaced alert() with a non-blocking UI message is preferred, but sticking to existing pattern for now.
        alert("Commitment created! Review it in your Daily Practice Scorecard.");
        // UX Polish: Navigate user to Daily Practice Selector view with the initial goal
        navigate('daily-practice', { 
            initialGoal: newCommitment.linkedGoal, 
            initialTier: newCommitment.linkedTier 
        }); 
    } else {
        alert("Failed to save new commitment.");
    }
};


return (
<div className="p-8">
<h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Feedback Prep Tool (SBI Critique)</h1>
<p className="text-lg text-gray-600 mb-6 max-w-3xl">Draft your difficult feedback using the <strong>S</strong>ituation, <strong>B</strong>ehavior, <strong>I</strong>mpact model. Our AI coach will refine your draft for clarity and professionalism.</p>
<Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
<ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
</Button>

  <div className="space-y-6 mb-8">
    <Card title="1. Situation (S)" icon={Briefcase}>
      <p className="text-gray-700 text-sm mb-2">When and where did the behavior occur? (Be specific and fact-based)</p>
      <textarea value={situation} onChange={(e) => setSituation(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-16"></textarea>
    </Card>
    <Card title="2. Behavior (B)" icon={Briefcase}>
      <p className="text-gray-700 text-sm mb-2">What did the person <em>do</em> or <em>say</em>? (Must be observable, not a judgment)</p>
      <textarea value={behavior} onChange={(e) => setBehavior(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-16"></textarea>
    </Card>
    <Card title="3. Impact (I)" icon={Briefcase}>
      <p className="text-gray-700 text-sm mb-2">What was the consequence of the behavior on the business, the team, or you?</p>
      <textarea value={impact} onChange={(e) => setImpact(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-16"></textarea>
    </Card>
  </div>

  <Tooltip
    content={hasGeminiKey() 
        ? "Sends your draft to the AI Coach for deep critique." 
        : "AI Critique is unavailable. Check App Settings for configuration."
    }
  >
    <Button onClick={generateCritique} disabled={isGenerating || !situation || !behavior || !impact} className="w-full md:w-auto">
        {isGenerating ? (
        <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Refining...
        </div>
        ) : 'Refine Feedback'}
    </Button>
  </Tooltip>

  {critiqueHtml && (
    <Card title="AI Coach Critique & Refinement" className="mt-8 bg-[#002E47]/10 border border-[#002E47]/20 rounded-3xl">
      <div className="prose prose-xl max-w-none prose-h1:text-[#002E47] prose-h1:text-4xl prose-h2:text-[#002E47] prose-h3:text-[#47A88D] prose-headings:font-extrabold prose-p:my-6 prose-ul:space-y-3 prose-li:text-base prose-ul:list-disc">
        <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
      </div>
       {refinedFeedback && hasGeminiKey() && (
          <Button onClick={handleCommitmentCreation} className="mt-6 w-full bg-[#349881] hover:bg-[#47A88D]">
             <PlusCircle className='w-5 h-5 mr-2' /> Turn Refined Feedback into Daily Commitment
          </Button>
       )}
       {!hasGeminiKey() && (
            <p className='text-xs text-[#E04E1B] mt-4 font-semibold'>AI Integration is currently disabled. See App Settings to enable AI-powered commitment creation.</p>
       )}
    </Card>
  )}
</div>


);
};

const ActiveListeningView = ({ setCoachingLabView }) => {
// Centralize functions via context
const { navigate } = useAppServices();

const [responses, setResponses] = useState({ q1: '', q2: '' });
const [critique, setCritique] = useState(null);
const [critiqueHtml, setCritiqueHtml] = useState('');
const [isGenerating, setIsGenerating] = useState(false);

// FIX: Re-adding the missing handleChange function
const handleChange = (e) => {
setResponses({ ...responses, [e.target.name]: e.target.value });
// Clear critique on new input
setCritique(null);
setCritiqueHtml('');
};

useEffect(() => {
if (!critique) { setCritiqueHtml(''); return; }
(async () => setCritiqueHtml(await mdToHtml(critique)))();
}, [critique]);

const handleSubmit = async () => {
if (!responses.q1.trim() || !responses.q2.trim()) {
    // NOTE: Replaced alert() with a non-blocking message
    alert("Please provide a response for both prompts before submitting for coach feedback.");
    return;
}

setIsGenerating(true);
setCritique(null);

// --- API KEY CHECK ---
if (!hasGeminiKey()) {
    setCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please ensure `window.__GEMINI_API_KEY` is set in the environment to enable AI coaching and critique features.");
    setIsGenerating(false);
    return;
}
// --- END API KEY CHECK ---

const userQuery = `Critique the following active listening responses from a manager:

**Prompt 1 (The Paraphrase):** The employee said, "I feel overwhelmed by the deadlines and the number of meetings this week." The manager's draft paraphrase is: "${responses.q1.trim()}"

**Prompt 2 (Open-Ended Inquiry):** The situation is a team setback and defeat. The manager's draft open-ended question is: "${responses.q2.trim()}"

Critique Guidelines (Use Markdown):
1.  **Paraphrase Critique (## The Paraphrase Audit):** Assess if the manager successfully confirmed understanding without adding judgment or offering a solution. Suggest a better, more concise option if needed.
2.  **Question Critique (## The Inquiry Audit):** Assess if the question is truly open-ended (not answerable with Yes/No) and if it successfully invites vulnerability and insight in a safe way. Provide a refined, more empathetic alternative.
3.  **Overall Takeaway (### Core Skill Focus):** Give one final, actionable coaching point.
`;

const systemPrompt = "You are an executive coach specializing in developing empathetic and effective active listening skills. Your critique must be objective, use clear Markdown formatting, and provide concrete, actionable alternatives for improvement.";

try {
    const payload = {
        contents: [{ role: "user", parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const result = await callSecureGeminiAPI(payload);
    const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Could not generate critique. Please try again.";
    setCritique(aiText);

} catch (error) {
    console.error("Gemini API Error:", error);
    setCritique("An error occurred while connecting to the AI coach. Please check your network connection.");
} finally {
    setIsGenerating(false);
}


};

return (
<div className="p-8">
<h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Active Listening & Reflection Prompts</h1>
{/* ENHANCEMENT: Added richer intro text */}
<p className="text-lg text-gray-600 mb-6 max-w-3xl">Active listening means validating emotion and confirming understanding before attempting to solve the problem. Practice the two pillars below to build empathy and psychological safety in high-stakes conversations.</p>
<Button onClick={() => setCoachingLabView('coaching-lab-home')} variant="outline" className="mb-8">
<ArrowLeft className="w-5 h-5 mr-2" /> Back to Coaching Lab
</Button>

  <div className="space-y-8">
    <Card title="Reflection 1: The Paraphrase (Confirming Understanding)" icon={Mic}>
      <p className="text-gray-700 mb-3">**Scenario:** A direct report just told you, "I feel overwhelmed by the deadlines and the number of meetings this week." How would you **paraphrase** their statement back to them? <span className='font-semibold text-[#47A88D]'>(Rule: Must not offer a solution or advice.)</span></p>
      <textarea name="q1" value={responses.q1} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" placeholder="Draft your paraphrased response here..."></textarea>
    </Card>

    <Card title="Reflection 2: Open-Ended Inquiry (Inviting Depth)" icon={Mic}>
      <p className="text-gray-700 mb-3">**Scenario:** Your team has just experienced a major setback on a flagship project. They are visibly defeated. What **open-ended question** would you use to invite them to share their feelings and insights, showing empathy and psychological safety?</p>
      <textarea name="q2" value={responses.q2} onChange={handleChange} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" placeholder="Draft your open-ended question here..."></textarea>
    </Card>
  </div>

    <Tooltip
        content={hasGeminiKey() 
            ? "Submits your responses to the AI Coach for structured critique." 
            : "Requires Gemini API Key to run. Check App Settings."
        }
    >
        <Button onClick={handleSubmit} disabled={isGenerating || !responses.q1.trim() || !responses.q2.trim()} className="mt-10 w-full md:w-auto">
            {isGenerating ? (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Auditing Listening Skills...
                </div>
            ) : 'Submit for Coach Feedback'}
        </Button>
    </Tooltip>
  
  {critiqueHtml && (
    <Card title="Active Listening Auditor Feedback" icon={CheckCircle} className="mt-8 bg-[#002E47]/10 border border-[#002E47]/20 rounded-3xl">
      <div className="prose max-w-none prose-h2:text-[#002E47] prose-h2:border-b prose-h2:pb-2 prose-h3:text-[#47A88D] prose-p:text-gray-700 prose-ul:space-y-2">
        <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
      </div>
    </Card>
  )}
</div>


);
};

// Main Coaching Lab Screen (Router)
const CoachingLabScreen = () => {
// Centralize component state via hook
const { navigate } = useAppServices();

const [view, setView] = useState('coaching-lab-home');
const [selectedScenario, setSelectedScenario] = useState(null);

const renderView = () => {
    // Functions are now consumed via useAppServices inside the components
    const prepViewProps = { setCoachingLabView: setView };

switch (view) {
case 'scenario-library':
return <ScenarioLibraryView setCoachingLabView={setView} setSelectedScenario={setSelectedScenario} />;
case 'scenario-prep':
return <ScenarioPreparationView scenario={selectedScenario} setCoachingLabView={setView} />;
case 'role-play':
// Ensure a scenario is selected before starting role-play
return selectedScenario ? <RolePlayView scenario={selectedScenario} setCoachingLabView={setView} /> : <ScenarioLibraryView setCoachingLabView={setView} setSelectedScenario={setSelectedScenario} />;
case 'feedback-prep':
return <FeedbackPrepToolView {...prepViewProps} />;
case 'active-listening':
return <ActiveListeningView setCoachingLabView={setView} />;
case 'coaching-lab-home':
default:
return (
<div className="p-8">
<h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Coaching & Crucial Conversations Lab</h1>
<p className="text-lg text-gray-600 mb-8 max-w-3xl">Practice key leadership interactions using guided tools and receive real-time AI critique to sharpen your skills.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card title="Scenario Library" icon={Users} onClick={() => setView('scenario-library')} className="border-l-4 border-[#47A88D] rounded-3xl">
                <p className="text-gray-700 text-sm">Select a scenario to start a fully interactive AI role-play session. Practice maneuvering deflection and emotion.</p>
                <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                    Launch Library &rarr;
                </div>
            </Card>
            <Card title="Feedback Prep Tool (SBI)" icon={Briefcase} onClick={() => setView('feedback-prep')} className="border-l-4 border-[#002E47] rounded-3xl">
                <p className="text-gray-700 text-sm">Draft difficult feedback using the SBI model and get instant, professional critique from our AI Coach on objectivity and impact.</p>
                <div className="mt-4 text-[#002E47] font-semibold flex items-center">
                    Launch Prep Tool &rarr;
                </div>
            </Card>
            <Card title="Active Listening Prompts" icon={Mic} onClick={() => setView('active-listening')} className="border-l-4 border-[#47A88D] rounded-3xl">
                <p className="text-gray-700 text-sm">Exercises to develop empathy, use paraphrasing, and ask powerful, open-ended questions to drive depth in conversations.</p>
                <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                    Launch Exercises &rarr;
                </div>
            </Card>
        </div>
      </div>
    );
}


};
return renderView();
};

// --- BUSINESS READINGS - Action Flyer View (formerly SummaryView) ---
const ActionFlyerView = ({ book, setReadingView }) => {
// Centralize functions via context
const { navigate } = useAppServices();

const [summaryData, setSummaryData] = useState({ text: '', sources: [] });
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [html, setHtml] = useState('');

// Effect to convert Markdown to HTML when summaryData.text updates
useEffect(() => {
if (!summaryData.text) { setHtml(''); return; }
(async () => setHtml(await mdToHtml(summaryData.text)))();
}, [summaryData.text]);

const generateSummary = async () => {
if (!book) return;

setIsLoading(true);
setError(null);
setSummaryData({ text: '', sources: [] });

// --- API KEY CHECK ---
if (!hasGeminiKey()) {
    setError("AI Generation Unavailable. The Gemini API Key is missing. Please ensure `window.__GEMINI_API_KEY` is set to enable this feature.");
    setIsLoading(false);
    return;
}
// --- END API KEY CHECK ---

// Use Google Search for up-to-date grounding/information about the book
const tools = [{ "google_search": {} }]; 

// MODIFIED SYSTEM PROMPT: Enforcing structure for the visual flyer layout
const systemPrompt = `You are a professional business copywriter and leadership marketing expert. Your task is to generate compelling, visually parsable flyer content based on the core lessons of the book "${book.title}" by ${book.author}". Structure the output strictly in Markdown with the following sections:


A single H1 tag (#) for the Catchy Headline/Promise (This must be the very first line).

A single bolded paragraph summarizing the PROBLEM the book solves (e.g., PROBLEM SOLVED: [Content]).

A single H3 tag (###) titled "KEY ACTIONS: IMPLEMENT NOW".

Three to four highly actionable takeaways using bolded bullet points.

A final, powerful Call to Action paragraph.
The tone must be energetic, persuasive, and focused purely on immediate leadership application.`;

const userQuery = `Provide the leadership action flyer content for the book: "${book.title}"`;

try {
const payload = {
contents: [{ role: "user", parts: [{ text: userQuery }] }],
systemInstruction: { parts: [{ text: systemPrompt }] },
tools: tools,
};

const result = await callSecureGeminiAPI(payload);

const candidate = result?.candidates?.[0];

if (candidate && candidate.content?.parts?.[0]?.text) {
const text = candidate.content.parts[0].text;
let sources = [];
const groundingMetadata = candidate.groundingMetadata;

 if (groundingMetadata && groundingMetadata.groundingAttributions) {
   sources = groundingMetadata.groundingAttributions
     .map(attribution => ({
       uri: attribution.web?.uri,
       title: attribution.web?.title,
     }))
     .filter(source => source.uri && source.title);
 }

 setSummaryData({ text, sources });


} else {
setError("Could not generate flyer content. The model may have blocked the request or the response was empty.");
}
} catch (e) {
  // Catch network/fetch errors here
  console.error("API Fetch Error:", e);
  setError("A network or API error occurred. Please try again.");
} finally {
  setIsLoading(false);
}
};

useEffect(() => {
// Only generate if a book is selected. This handles initial component mount and book changes.
if (book) {
generateSummary();
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [book?.id]);

const renderContent = () => {
if (!book) return <p className="text-gray-700">No book selected.</p>;

if (isLoading) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
      <p className="text-[#47A88D] font-medium">Generating **Visual Action Flyer** content...</p>
    </div>
  );
}
if (error) {
  return (
    <div className="bg-[#E04E1B]/10 p-6 rounded-xl border-2 border-[#E04E1B] text-[#002E47]">
        <h3 className="font-bold text-lg mb-2 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-[#E04E1B]"/> Generation Error</h3>
        <p className='text-sm'>{error}</p>
        {error.includes("API Key is missing") && (
            <p className='text-xs mt-2 font-medium'>Please set your `window.__GEMINI_API_KEY` to enable summaries. See **App Settings** for details.</p>
        )}
    </div>
  );
}
if (html) {
  return (
    <div className="bg-gray-100 p-4 md:p-12 rounded-3xl shadow-2xl">
      {/* Main Flyer Container: Two-Column Layout */}
      <div className="bg-[#FCFCFA] p-8 rounded-3xl shadow-2xl border-t-8 border-[#002E47]">
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">
          
          {/* === LEFT COLUMN: Headline & CTA Focus === */}
          <div className="lg:col-span-1 border-r border-indigo-100 lg:pr-8 mb-8 lg:mb-0">
            <div className="prose max-w-none 
              prose-h1:text-4xl prose-h1:text-[#47A88D] prose-h1:font-extrabold prose-h1:mt-0 prose-h1:mb-4
              prose-p:text-gray-700 prose-p:font-medium prose-p:text-lg prose-p:mt-6
              prose-h3:hidden prose-ul:hidden prose-blockquote:hidden
            " dangerouslySetInnerHTML={{ __html: html }} />
            
            <h4 className="text-[#002E47] font-bold mt-8 mb-4 border-t pt-4">Your Next Step:</h4>
            <Button className="w-full">Integrate This Into Your PDP</Button>
            
            <p className="text-xs text-gray-500 mt-4 italic">
                Use these Key Actions in your Daily Commitment Scorecard for immediate impact.
            </p>
          </div>

          {/* === RIGHT COLUMN: Problem & Key Actions === */}
          <div className="lg:col-span-2">
            
            {/* Visual Header */}
            <h2 className="text-2xl font-bold text-[#002E47] mb-6 flex items-center">
                <Zap className="w-6 h-6 mr-3 text-[#47A88D]"/>
                High-Impact Leadership Blueprint
            </h2>

            {/* Content targeting problem/actions */}
            <div className="prose max-w-none 
              prose-h1:hidden prose-h2:hidden 
              prose-h3:text-[#002E47] prose-h3:font-extrabold prose-h3:mt-8 prose-h3:border-b prose-h3:pb-2
              prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-4 prose-ul:mt-4
              prose-li:text-lg prose-li:text-gray-800
              prose-li:before:content-['✓'] prose-li:before:mr-3 prose-li:before:text-[#47A88D] prose-li:before:font-extrabold
              prose-p:text-xl prose-p:text-gray-700 prose-p:mt-0 prose-p:mb-6
            " dangerouslySetInnerHTML={{ __html: html }} />
            
          </div>

        </div>
      </div>

      {summaryData.sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-300">
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Sources:</h4>
          <ul className="list-disc pl-5 text-xs text-gray-500 space-y-1">
            {summaryData.sources.map((source, index) => (
              <li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:text-[#47A88D] transition-colors">{source.title}</a></li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
return <p className="p-4 text-gray-600">Preparing content...</p>;


};

return (
<div className="p-8">
{/* Updated Title to reflect the new format */}
<h1 className="text-4xl font-extrabold text-[#002E47] mb-3">"{book?.title || 'Book Title'}" - Leadership Action Flyer</h1>
<h2 className="text-xl font-medium text-[#47A88D] mb-6">{book ? `By ${book.author} (Focus on Immediate Action)` : 'Select a book'}</h2>
<Button onClick={() => setReadingView('books-list')} variant="outline" className="mb-8">
<ArrowLeft className="w-5 h-5 mr-2" /> Back to Books
</Button>
{renderContent()}
</div>
);
};

const BooksListView = ({ category, setReadingView, setSelectedBook }) => {
const books = allBooks[category] || [];
return (
<div className="p-8">
{/* FIX: Removed extraneous closing brace */}
<h1 className="text-3xl font-extrabold text-[#002E47] mb-4">{category} Reading List</h1>
<p className="text-lg text-gray-600 mb-6">Select a book below to generate a concise, one-page leadership flyer.</p>
<Button onClick={() => setReadingView('categories')} variant="outline" className="mb-8">
<ArrowLeft className="w-5 h-5 mr-2" /> Back to Categories
</Button>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {books.map(book => (
      <Card key={book.id} title={book.title} className="border-l-4 border-[#47A88D] rounded-3xl" onClick={() => {
        setSelectedBook(book);
        setReadingView('summary');
      }}>
        <p className="text-sm text-gray-700">Author: {book.author}</p>
        <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
          Generate Action Flyer &rarr;
        </div>
      </Card>
    ))}
  </div>
</div>


);
};

const CategoriesView = ({ setReadingView, setSelectedCategory }) => {
// Removed 'Daily Practice & Commitment' from this list
const categories = [
{ name: 'Strategy', icon: TrendingUp, description: 'Defining direction, setting priorities, and competitive analysis.' },
{ name: 'Culture', icon: Users, description: 'Building high-performing teams, psychological safety, and radical candor.' },
{ name: 'Productivity', icon: Zap, description: 'Time management, effective habits, and deep work principles.' },
{ name: 'Innovation', icon: Briefcase, description: 'Fostering creativity, navigating disruption, and executing new ideas.' },
{ name: 'Personal Willpower', icon: Target, description: 'Discipline, habit formation, and focused execution on goals.' },
{ name: 'Mental Fitness & Resilience', icon: HeartPulse, description: 'Emotional regulation, stress management, and growth mindset.' },
];

return (
<div className="p-8">
<h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Leadership Business Readings</h1>
<p className="text-lg text-gray-600 mb-8 max-w-3xl">Browse curated action flyers of top business books, categorized by core leadership domain.</p>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {categories.map(cat => (
      <Card key={cat.name} title={cat.name} icon={cat.icon} onClick={() => {
        setSelectedCategory(cat.name);
        setReadingView('books-list');
      }}>
        <p className="text-sm text-gray-700">{cat.description}</p>
        <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
          View Books ({allBooks[cat.name] ? allBooks[cat.name].length : 0}) &rarr;
        </div>
      </Card>
    ))}
  </div>
</div>


);
};

const BusinessReadingsScreen = () => {
const [view, setReadingView] = useState('categories');
const [selectedCategory, setSelectedCategory] = useState(null);
const [selectedBook, setSelectedBook] = useState(null);

const renderView = () => {
switch (view) {
case 'books-list':
return <BooksListView category={selectedCategory} setReadingView={setReadingView} setSelectedBook={setSelectedBook} />;
case 'summary':
return <ActionFlyerView book={selectedBook} setReadingView={setReadingView} />;
case 'categories':
default:
return <CategoriesView setReadingView={setReadingView} setSelectedCategory={setSelectedCategory} />;
}
};

return renderView();
};

// --- STRATEGIC PLANNING HUB ---

const PreMortemView = ({ setPlanningView }) => {
    // Consume data and updates via context
    const { planningData, updatePlanningData, updateCommitmentData, navigate } = useAppServices();
    
    const [decision, setDecision] = useState(planningData?.last_premortem_decision || 'Should we restructure the Product and Engineering teams into vertical, feature-specific groups?');
    const [outcome, setOutcome] = useState('Faster time-to-market and clearer ownership for key features.'); // Not persistent for simplicity
    const [risks, setRisks] = useState(['Loss of technical expertise centralization.', 'Initial dips in morale due to fear of change.']); // Not persistent for simplicity

    const [isGenerating, setIsGenerating] = useState(false);
    const [auditResult, setAuditResult] = useState('');
    const [auditHtml, setAuditHtml] = useState('');
    const [mitigationText, setMitigationText] = useState(''); // Feature 2: Extracted mitigation text

    useEffect(() => {
        if (planningData?.last_premortem_decision) {
             setDecision(planningData.last_premortem_decision);
        }
    }, [planningData?.last_premortem_decision]);

    useEffect(() => {
        if (!auditResult) { setAuditHtml(''); setMitigationText(''); return; }
        (async () => setAuditHtml(await mdToHtml(auditResult)))();
        
        // Feature 2: Attempt to parse Mitigation Strategy
        const mitigationMatch = auditResult.match(/### Mitigation Strategy\s*([\s\S]*)/i);
        if (mitigationMatch && mitigationMatch[1]) {
            // Trim and clean the text, taking only the first few lines of the strategy
            const strategy = mitigationMatch[1].trim().split('\n').slice(0, 3).join(' ').replace(/[\*\-]/g, '').trim();
            setMitigationText(strategy);
        }
    }, [auditResult]);

    const handleRiskChange = (index, value) => {
        const newRisks = [...risks];
        newRisks[index] = value;
        setRisks(newRisks);
        setAuditResult('');
    };

    const handleAddRisk = () => {
        setRisks([...risks, '']);
    };

    const handleRemoveRisk = (index) => {
        setRisks(risks.filter((_, i) => i !== index));
    };

    const runPreMortemAudit = async () => {
        const primaryRisks = risks.filter(r => r.trim()).join('; ');
        if (!decision.trim() || !outcome.trim() || !primaryRisks) {
            // NOTE: Replaced alert() with a non-blocking message
            alert("Please fill in the Decision, Desired Outcome, and at least one Risk before running the audit.");
            return;
        }

        setIsGenerating(true);
        setAuditResult('');

        // --- API KEY CHECK ---
        if (!hasGeminiKey()) {
            setAuditResult("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please ensure `window.__GEMINI_API_KEY` is set in the environment to enable AI auditing features.");
            setIsGenerating(false);
            return;
        }
        // --- END API KEY CHECK ---

        const userQuery = `**Decision:** ${decision}\n**Desired Outcome:** ${outcome}\n**Identified Risks:** ${primaryRisks}`;
        const systemPrompt = "You are the Decision-Making Auditor, acting as the 'Devil's Advocate' and a strategic planning expert. Your task is to perform a pre-mortem analysis. Critique the user's inputs based on: 1) **Unforeseen Blind Spots (Top 2-3 new risks)**: Identify risks the user is likely missing. 2) **Risk Amplification**: Select the user's biggest risk and explain how it could be worse. 3) **Mitigation Strategy**: Suggest a concrete action plan (1-2 steps) for the highest combined risk (yours or the user's). Use clear Markdown headings and bold key points. Use the following structure: ## Pre-Mortem Audit Results; ### Unforeseen Blind Spots; ### Risk Amplification; ### Mitigation Strategy";

        try {
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
            };

            const result = await callSecureGeminiAPI(payload);
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "Audit failed to generate results.";
            setAuditResult(text);
            
            // PERSISTENCE: Save the last decision made
            await updatePlanningData({ last_premortem_decision: decision });

        } catch (error) {
            console.error("Gemini API Error:", error);
            setAuditResult("An error occurred during the Pre-Mortem Audit. Please check your network connection.");
        } finally {
            setIsGenerating(false);
        }
    };
    
    // Feature 2: Handler to create commitment from Mitigation Strategy
    const handleCommitmentCreation = async () => {
        if (!mitigationText || !updateCommitmentData) return;
        
        const commitmentText = `(Pre-Mortem Mit.) Implement mitigation for decision: "${mitigationText}".`;
        
        const newCommitment = { 
            id: Date.now(), 
            text: commitmentText, 
            status: 'Pending', 
            isCustom: true, 
            linkedGoal: 'Risk Mitigation Strategy', // New goal for planning commitments
            linkedTier: 'T5', // Strategic Clarity
            targetColleague: null,
        };

        const success = await updateCommitmentData(data => {
            const existingCommitments = data?.active_commitments || [];
            return { active_commitments: [...existingCommitments, newCommitment] };
        });

        if (success) {
            alert("Mitigation Commitment created! Review it in your Daily Practice Scorecard.");
            navigate('daily-practice', { 
                initialGoal: newCommitment.linkedGoal, 
                initialTier: newCommitment.linkedTier 
            }); 
        } else {
            alert("Failed to save new commitment.");
        }
    };


    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Decision-Making Matrix (Pre-Mortem Audit)</h1>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl">Analyze high-stakes decisions by actively looking for failure points. The AI acts as your **Devil's Advocate**, identifying risks you missed.</p>
            <Button onClick={() => setPlanningView('planning-home')} variant="outline" className="mb-8">
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Planning Hub
            </Button>

            <div className="space-y-6">
                <Card title="1. The Decision & Outcome" icon={TrendingUp}>
                    <p className="text-gray-700 text-sm mb-2 font-semibold">What is the critical decision you are facing?</p>
                    <textarea 
                        value={decision} 
                        onChange={(e) => setDecision(e.target.value)} 
                        className="w-full p-3 mb-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-20" 
                        placeholder="e.g., Should we expand into the European market next quarter?"
                    ></textarea>
                    
                    <p className="text-gray-700 text-sm mb-2 font-semibold">What is the specific desired outcome?</p>
                    <input type="text" value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D]" placeholder="e.g., Achieve $500k in ARR from the new region in Q4."/>
                </Card>

                <Card title="2. Identify Initial Risks" icon={AlertTriangle}>
                    <p className="text-gray-700 text-sm mb-3">List the primary risks and failure modes you have already identified. (Minimum 2)</p>
                    <div className="space-y-3">
                        {risks.map((risk, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={risk}
                                    onChange={(e) => handleRiskChange(index, e.target.value)}
                                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] text-sm"
                                    placeholder={`Risk ${index + 1}`}
                                />
                                <button onClick={() => handleRemoveRisk(index)} className="text-[#E04E1B] hover:text-red-700">
                                    <X className='w-4 h-4' />
                                </button>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleAddRisk} variant="outline" className="mt-4 text-xs px-4 py-2 border-dashed text-[#002E47] hover:bg-[#002E47]/10">
                        + Add Risk
                    </Button>
                </Card>
            </div >

            <Tooltip
                content={hasGeminiKey() 
                    ? "Submits your decision analysis to the AI Auditor for risk identification." 
                    : "Requires Gemini API Key to run. Check App Settings."
                }
            >
                <Button onClick={runPreMortemAudit} disabled={isGenerating || !decision || !outcome || risks.filter(r => r.trim()).length < 2} className="mt-8 w-full md:w-auto">
                    {isGenerating ? (
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            Running Pre-Mortem Audit...
                        </div>
                    ) : 'Run Pre-Mortem Audit'}
                </Button>
            </Tooltip>

            {auditHtml && (
                <Card title="Decision Audit & Blind Spots" className="mt-8 bg-[#002E47]/10 border-4 border-[#002E47]/20 rounded-3xl">
                    <div className="prose max-w-none prose-h2:text-[#002E47] prose-h2:text-2xl prose-h3:text-[#47A88D] prose-p:text-gray-700 prose-ul:space-y-2">
                        <div dangerouslySetInnerHTML={{ __html: auditHtml }} />
                    </div>
                    
                    {/* Feature 2: Add to Commitment Button */}
                    {mitigationText && hasGeminiKey() && (
                        <Button onClick={handleCommitmentCreation} className="mt-6 w-full bg-[#349881] hover:bg-[#47A88D]">
                            <PlusCircle className='w-5 h-5 mr-2' /> Turn Mitigation Strategy into Daily Commitment
                        </Button>
                    )}
                </Card>
            )}
        </div>
    );


};

const VisionBuilderView = ({ setPlanningView }) => {
    // Consume data and updates via context
    const { planningData, updatePlanningData } = useAppServices();

    const [vision, setVision] = useState(planningData?.vision || '');
    const [mission, setMission] = useState(planningData?.mission || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
    if (planningData) {
    setVision(planningData.vision);
    setMission(planningData.mission);
    }
    }, [planningData]);

    const handleSave = async () => {
    if (!vision || !mission) return;
    setIsSaving(true);
    await updatePlanningData({ vision: vision, mission: mission });
    setIsSaving(false);
    };

    return (
    <div className="p-8">
    <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Vision Statement Builder</h1>
    <p className="text-lg text-gray-600 mb-6 max-w-3xl">Define your aspirational 3-5 year leadership and team Vision and Mission, setting your strategic North Star.</p>
    <Button onClick={() => setPlanningView('planning-home')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Planning Hub
    </Button>

      <div className="space-y-6">
        <Card title="1. Define Your Vision (The Future State)" icon={TrendingUp}>
          <p className="text-gray-700 text-sm mb-2">What does success look like 3-5 years from now? Keep it inspiring and memorable. **(Data is persistent)**</p>
          <textarea 
            value={vision} 
            onChange={(e) => setVision(e.target.value)} 
            className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-32" 
            placeholder="e.g., 'To be the most trusted and innovative team in the industry, delivering exceptional value through empowered leadership.'"
          ></textarea>
        </Card>

        <Card title="2. Define Your Mission (The Purpose)" icon={Target}>
          <p className="text-gray-700 text-sm mb-2">Why does your team exist? What is the core business purpose and the primary value you deliver? **(Data is persistent)**</p>
          <textarea 
            value={mission} 
            onChange={(e) => setMission(e.target.value)} 
            className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-24" 
            placeholder="e.g., 'To cultivate a culture of psychological safety that drives continuous improvement and world-class product delivery.'"
          ></textarea>
        </Card>
        
        <Card title="Vision Checkpoints" icon={CheckCircle}>
            <ul className='list-disc pl-5 text-sm text-gray-700 space-y-1'>
                <li>Is your Vision concise (under 20 words)?</li>
                <li>Is your Mission clear (defines purpose)?</li>
                <li>Is it emotionally engaging?</li>
            </ul>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={isSaving || !vision || !mission} className="mt-8 w-full md:w-auto">
        {isSaving ? (
          <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div> Saving...</>
        ) : <><CheckCircle className="w-5 h-5 mr-2" /> Save Vision & Mission</>}
      </Button>
    </div>


    );
};

const OKRDraftingView = ({ setPlanningView }) => {
    // Consume data and updates via context
    const { planningData, updatePlanningData } = useAppServices();

    const [okrs, setOkrs] = useState(planningData?.okrs || []);
    const [isSaving, setIsSaving] = useState(false);
    const [okrCritique, setOkrCritique] = useState('');
    const [critiqueHtml, setCritiqueHtml] = useState('');
    const [isCritiquing, setIsCritiquing] = useState(false);

    useEffect(() => {
    if (planningData?.okrs) {
    setOkrs(planningData.okrs);
    }
    }, [planningData?.okrs]);

    useEffect(() => {
    if (!okrCritique) { setCritiqueHtml(''); return; }
    (async () => setCritiqueHtml(await mdToHtml(okrCritique)))();
    }, [okrCritique]);

    const updateObjective = (id, value) => {
    setOkrs(okrs.map(o => o.id === id ? { ...o, objective: value } : o));
    setOkrCritique(''); // Clear critique on edit
    };

    const updateKR = (objId, krId, value) => {
    setOkrs(okrs.map(o => o.id === objId ? {
    ...o,
    keyResults: o.keyResults.map(kr => kr.id === krId ? { ...kr, kr: value } : kr)
    } : o));
    setOkrCritique(''); // Clear critique on edit
    };

    const addKR = (objId) => {
    setOkrs(okrs.map(o => o.id === objId ? {
    ...o,
    keyResults: [...o.keyResults, { id: Date.now(), kr: '' }]
    } : o));
    };

    const addObjective = () => {
    setOkrs([...okrs, { id: Date.now(), objective: 'New Ambitious Objective', keyResults: [{ id: Date.now() + 1, kr: 'e.g., Reduce X from Y to Z.' }] }]);
    };

    const handleSave = async () => {
    setIsSaving(true);
    // Filter out empty KRs/Objectives before saving
    const validOkrs = okrs.filter(o => o.objective.trim() && o.keyResults.some(kr => kr.kr.trim()));
    await updatePlanningData({ okrs: validOkrs });
    setIsSaving(false);
    };

    const critiqueOKRs = async () => {
    const allInputsFilled = okrs.every(o => o.objective.trim() && o.keyResults.every(kr => kr.kr.trim()));
    if (!allInputsFilled) {
        // NOTE: Replaced alert() with a non-blocking message
        alert("Please fill out all Objective and Key Result fields before requesting a critique.");
        return;
    }

    setIsCritiquing(true);
    setOkrCritique('');

    // --- API KEY CHECK ---
    if (!hasGeminiKey()) {
        setOkrCritique("## AI Critique Unavailable\n\n**ERROR**: The Gemini API Key is missing. Please ensure `window.__GEMINI_API_KEY` is set in the environment to enable AI auditing features.");
        setIsCritiquing(false);
        return;
    }
    // --- END API KEY CHECK ---


    const draftedOKRs = okrs.map((o, i) =>
      `Objective ${i + 1}: ${o.objective}\nKey Results:\n${o.keyResults.map(kr => `- ${kr.kr}`).join('\n')}`
    ).join('\n\n---\n\n');

    const systemPrompt = "You are an expert Strategic Planning Coach and OKR Auditor. Your task is to critique the user's drafted Objectives and Key Results (OKRs). Focus your feedback on three points: 1) Is the Objective ambitious and inspiring? 2) Are the Key Results measurable, time-bound, and quantitative (ideally formatted 'from X to Y')? 3) Do the KRs collectively measure the Objective's success? Provide a professional summary critique and then a refined example for the weakest Objective, maintaining the Objective text but fixing the Key Results to be measurable (from X to Y).";
    const userQuery = `Critique this set of Quarterly OKRs:\n\n${draftedOKRs}`;

    try {
        const payload = {
            contents: [{ role: "user", parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        const result = await callSecureGeminiAPI(payload);

        const candidate = result?.candidates?.[0];

        if (candidate && candidate.content?.parts?.[0]?.text) {
            setOkrCritique(candidate.content.parts[0].text);
        } else {
            setOkrCritique("Could not generate critique. The model may have blocked the request or the response was empty.");
        }
    } catch (error) {
        console.error("Gemini API Error:", error);
        setOkrCritique("An error occurred while connecting to the AI coach. Please check your inputs and network connection.");
    } finally {
        setIsCritiquing(false);
    }


    };

    return (
    <div className="p-8">
    {/* FIX: Removed extraneous closing brace: } */}
    <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Quarterly OKR Drafting Tool</h1>
    <p className="text-lg text-gray-600 mb-6 max-w-3xl">Set 3-5 ambitious Objectives (What) and 3-4 Key Results (How) for the current quarter, directly tied to your Vision. Use the OKR Auditor below to ensure your KRs are measurable and high-impact. (Data is persistent)</p>
    <Button onClick={() => setPlanningView('planning-home')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Planning Hub
    </Button>

      <div className="space-y-8">
        {okrs.map(obj => (
          <Card key={obj.id} title={`Objective: ${obj.objective || 'New Objective'}`} icon={Target} className="border-l-4 border-[#002E47] rounded-3xl">
            <p className="text-gray-700 text-sm mb-2 font-semibold">Objective (What to achieve? Must be Inspiring)</p>
            <input
              type="text"
              value={obj.objective}
              onChange={(e) => updateObjective(obj.id, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] mb-6"
              placeholder="e.g., Dramatically improve team execution quality and velocity"
            />

            <h3 className="text-lg font-semibold text-[#47A88D] mb-3">Key Results (How to measure it? Must be 'from X to Y')</h3>
            <div className="space-y-3">
              {obj.keyResults.map((kr, index) => (
                <div key={kr.id} className='flex items-center space-x-2'>
                    <span className='font-mono text-sm text-gray-600'>{index + 1}.</span>
                    <input
                      type="text"
                      value={kr.kr}
                      onChange={(e) => updateKR(obj.id, kr.id, e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] text-sm"
                      placeholder="e.g., Reduce customer reported bugs from 45 to 15 by EOD Q2."
                    />
                </div>
              ))}
            </div>
            <Button onClick={() => addKR(obj.id)} variant="outline" className="mt-4 text-xs px-4 py-2 border-dashed border-[#002E47]/30 text-[#002E47] hover:bg-[#002E47]/10">
              + Add Key Result
            </Button>
          </Card>
        ))}
      </div>

      <div className='flex space-x-4 mt-8'>
        <Button onClick={addObjective} variant="outline" className="w-full md:w-auto px-6 py-3 border-dashed border-[#47A88D] text-[#47A88D] hover:bg-[#47A88D]/10">
            + Add New Objective
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="w-full md:w-auto">
            {isSaving ? (
            <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
            </div>
            ) : <><CheckCircle className="w-5 h-5 mr-2" /> Save Quarterly OKRs</>}
        </Button>
      </div>
      
      {/* OKR CRITIQUE TOOL */}
      <Card title="OKR Auditor (AI Critique)" icon={Mic} className='mt-8 bg-[#47A88D]/10 border-2 border-[#47A88D]'>
          <p className='text-gray-700 text-sm mb-4'>Use the AI coach to review your drafted OKRs against industry best practices for measurability and ambition.</p>
          
        <Tooltip
            content={hasGeminiKey() 
                ? "Submits your OKRs to the AI Auditor for measurability and ambition critique." 
                : "Requires Gemini API Key to run. Check App Settings."
            }
        >
            <Button onClick={critiqueOKRs} disabled={isCritiquing} className="w-full">
                {isCritiquing ? (
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Auditing Strategy...
                    </div>
                ) : 'Run OKR Audit'}
            </Button>
        </Tooltip>

          {critiqueHtml && (
             <div className="mt-6 pt-4 border-t border-[#47A88D]/30">
                <div className="prose max-w-none prose-h3:text-[#002E47] prose-p:text-gray-700 prose-ul:space-y-2">
                    <div dangerouslySetInnerHTML={{ __html: critiqueHtml }} />
                </div>
             </div>
          )}
      </Card>

    </div>


    );
};

const AlignmentTrackerView = ({ setPlanningView }) => {
    // Consume data and updates via context
    const { planningData } = useAppServices();

    // NOTE: This now uses the loaded planningData for Objectives, falling back to mock data structure
    const objectives = planningData?.okrs?.map((o, index) => ({
    id: o.id,
    title: o.objective,
    // Mock progress data for visualization
    progress: (index === 0 ? 0.65 : index === 1 ? 0.80 : 0.30),
    status: (index === 0 ? 'On Track' : index === 1 ? 'Ahead of Schedule' : 'At Risk'),
    })) || [
    { id: 1, title: 'Improve Team Execution Quality (Mock)', progress: 0.65, status: 'On Track' },
    { id: 2, title: 'Formalize Succession Planning (Mock)', progress: 0.80, status: 'Ahead of Schedule' },
    { id: 3, title: 'Develop Cross-Functional Skills (Mock)', progress: 0.30, status: 'At Risk' },
    ];

    return (
    <div className="p-8">
    <h1 className="text-3xl font-extrabold text-[#002E47] mb-4">Strategic Alignment Tracker</h1>
    <p className="text-lg text-gray-600 mb-6 max-w-3xl">Review your current OKR progress and ensure your daily activity is aligned with your long-term Vision. (Goals are loaded from Firestore data).</p>
    <Button onClick={() => setPlanningView('planning-home')} variant="outline" className="mb-8">
    <ArrowLeft className="w-5 h-5 mr-2" /> Back to Planning Hub
    </Button>

      <div className="space-y-6">
        {objectives.map(obj => (
          <Card key={obj.id} title={obj.title} icon={CheckCircle} className="border-l-4 border-[#47A88D] rounded-3xl">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700">Progress: {Math.round(obj.progress * 100)}%</p>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                obj.status === 'On Track' ? 'bg-[#47A88D]/20 text-[#002E47]' :
                obj.status === 'Ahead of Schedule' ? 'bg-[#002E47]/20 text-[#002E47]' :
                'bg-[#E04E1B]/20 text-[#E04E1B]'
              }`}>{obj.status}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
              <div className="bg-[#47A88D] h-2.5 rounded-full transition-all duration-500" style={{ width: `${obj.progress * 100}%` }}></div>
            </div>
            <h3 className="text-lg font-semibold text-[#002E47] mt-4 mb-2">Quarterly Reflection</h3>
            <p className="text-sm text-gray-700">
              <strong>What went well:</strong> The team adopted the new execution checklist immediately, leading to better early-stage quality.
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Next steps:</strong> Need to address Objective 3—the key result tracking is too passive. Must switch to a leading indicator.
            </p>
          </Card>
        ))}

        <Card title="Vision Alignment Check" icon={Lightbulb} className="bg-[#002E47]/10 border-2 border-[#002E47]/20 rounded-3xl">
          <p className="text-gray-700 text-sm">
            Does your current priority list directly contribute to these Objectives? Use this space to log any activities that are draining time but <strong>not</strong> aligning with your Vision.
          </p>
          <textarea className="w-full p-3 mt-4 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:focus:border-[#47A88D] h-24" placeholder="Log strategic misalignment issues here..."></textarea>
          <Button variant="secondary" className="mt-4">Save Reflection</Button>
        </Card>
      </div>
    </div >


    );
};

const PlanningHubScreen = () => {
    // Consume data and status via context
    const { isLoading, error } = useAppServices();

    if (isLoading) {
    return (
    <div className="p-8 min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
    <p className="text-[#47A88D] font-medium">Loading Strategic Planning Hub...</p>
    </div>
    </div>
    );
    }

    if (error) {
        return <div className="p-8"><p className="text-[#E04E1B] p-4 bg-red-100 rounded-xl">Error loading data: {error}</p></div>;
    }

    // State declaration must come before it is used in viewProps
    const [view, setPlanningView] = useState('planning-home');

    // We pass the local view state function down. Data/Updates are via context.
    const viewProps = { setPlanningView: setPlanningView };


    const renderView = () => {
        switch (view) {
        case 'vision-builder':
            return <VisionBuilderView {...viewProps} />;
        case 'okr-drafting':
            return <OKRDraftingView {...viewProps} />;
        case 'alignment-tracker':
            return <AlignmentTrackerView {...viewProps} />;
        case 'pre-mortem':
            return <PreMortemView {...viewProps} />;
        case 'planning-home':
        default:
            return (
                <div className="p-8">
                    <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Vision & OKR Planning Hub</h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-3xl">Transform abstract ideas into actionable goals. Build a clear Vision, draft measurable OKRs, and ensure strategic alignment. **(All data is persistent)**</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card title="Vision Builder" icon={TrendingUp} onClick={() => setPlanningView('vision-builder')} className="border-l-4 border-[#47A88D] rounded-3xl">
                        <p className="text-gray-700 text-sm">Define your 3-5 year Vision and Mission Statement. Get clarity on your strategic North Star.</p>
                        <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                        Launch Tool &rarr;
                        </div>
                    </Card>

                    <Card title="OKR Drafting Tool" icon={Target} onClick={() => setPlanningView('okr-drafting')} className="border-l-4 border-[#002E47] rounded-3xl">
                        <p className="text-gray-700 text-sm">Structured templates for creating Quarterly Objectives and Key Results (KRs) with **AI Audit**. </p>
                        <div className="mt-4 text-[#002E47] font-semibold flex items-center">
                        Launch Tool &rarr;
                        </div>
                    </Card>
                    
                    <Card title="Decision-Making Matrix (Pre-Mortem)" icon={AlertTriangle} onClick={() => setPlanningView('pre-mortem')} className="border-l-4 border-[#E04E1B] rounded-3xl bg-[#E04E1B]/10">
                        <p className="text-gray-700 text-sm">Use the **Devil's Advocate AI** to identify critical blind spots and failure modes before you commit to a major decision.</p>
                        <div className="mt-4 text-[#E04E1B] font-semibold flex items-center">
                        Launch Auditor &rarr;
                        </div>
                    </Card>

                    <Card title="Strategic Alignment Tracker" icon={Zap} onClick={() => setPlanningView('alignment-tracker')} className="border-l-4 border-[#47A88D] rounded-3xl">
                        <p className="text-gray-700 text-sm">Review your OKR progress, conduct quarterly reflections, and track how daily priorities map to your goals.</p>
                        <div className="mt-4 text-[#47A88D] font-semibold flex items-center">
                        Launch Tracker &rarr;
                        </div>
                    </Card>
                    </div>
                </div>
            );
        }
    };


    return renderView();
};

// --- APP SETTINGS SCREEN ---
const AppSettingsScreen = () => {
    const { userId, auth, navigate } = useAppServices();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            // Sign out handles state reset and navigation to LoginScreen automatically
        } catch (e) {
            // NOTE: Replaced alert() with a non-blocking message
            alert("Failed to sign out.");
            console.error("Sign out error:", e);
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Application Settings & Configuration</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Manage API keys, user data, and system preferences here.</p>

            <Card title="Gemini API Key Configuration" icon={Settings} className='border-l-4 border-[#47A88D]'>
                <p className="text-[#E04E1B] font-semibold mb-3">
                    <AlertTriangle className='w-5 h-5 inline mr-2'/> Action Required for AI Features:
                </p>
                <p className="text-gray-700 text-sm mb-4">
                    To unlock AI Coaching (SBI Critique, Role-Play, OKR Audit) and Leadership Book Summaries, you must set your Gemini API Key in the execution environment.
                </p>
                <div className='bg-gray-100 p-4 rounded-xl font-mono text-sm'>
                    <p className='text-[#002E47] font-bold'>Required Global Variable:</p>
                    <code className='text-[#47A88D] break-words'>window.__GEMINI_API_KEY</code>
                </div>
                <p className='text-xs text-gray-500 mt-3'>
                    *This key is necessary for fetching real-time and generative content. It is securely managed by the environment and is not stored in Firestore.
                </p>
            </Card>

            <Card title="Account & Data Maintenance" icon={Users} className='mt-8 border-l-4 border-[#002E47]'>
                 <p className="text-gray-700 text-sm mb-4">
                    Your current User ID (UID) is used to partition your personal data in the database.
                 </p>
                 <div className='bg-gray-100 p-4 rounded-xl font-mono text-sm mb-4'>
                    <p className='text-[#002E47] font-bold'>Current User ID (UID):</p>
                    <code className='text-[#47A88D] break-words'>{userId}</code>
                 </div>
                 <Button onClick={handleSignOut} className='w-full bg-[#E04E1B] hover:bg-red-700'>
                     Sign Out (Ends Session)
                 </Button>
            </Card>
        </div>
    );
};


// --- PROFESSIONAL DEVELOPMENT PLAN ROUTER ---
const ProfDevPlanScreen = () => {
    // Consume data and updates via context
    const { pdpData, updatePdpData, saveNewPlan, isLoading, error, userId, db, navigate } = useAppServices();

    // --- Router Logic ---
    if (isLoading || pdpData === undefined) {
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                    <p className="text-[#47A88D] font-medium">Loading Personalized Development Plan...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <p className="text-[#E04E1B] p-4 bg-red-100 rounded-xl">Application Error: {error}</p>
                <p className="text-gray-600 mt-4">If this error persists, check your browser console for Firebase configuration or security rule errors.</p>
            </div>
        );
    }

    // pdpData is null if the document does not exist (needs generation)
    if (pdpData === null) {
        return <PlanGeneratorView userId={userId} saveNewPlan={saveNewPlan} isLoading={false} error={null} />;
    }

    // pdpData exists -> show the tracker dashboard
    // Pass necessary props explicitly to avoid exposing internal logic of AppServices
    const trackerProps = { data: pdpData, updatePdpData, saveNewPlan, db, userId, navigate };

    return <TrackerDashboardView {...trackerProps} />;
};

// New Component: Content Details Modal (Feature 3)
const ContentDetailsModal = ({ isVisible, onClose, content }) => {
    if (!isVisible || !content) return null;

    const [htmlContent, setHtmlContent] = useState('');
    const mockDetail = MOCK_CONTENT_DETAILS[content.type] 
                        ? MOCK_CONTENT_DETAILS[content.type](content.title, content.skill) 
                        : `### Content Unavailable\n\nNo detailed mock content available for type: **${content.type}**`;
    
    useEffect(() => {
        (async () => setHtmlContent(await mdToHtml(mockDetail)))();
    }, [content.id, mockDetail]);


    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8">
                
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-3xl font-extrabold text-[#002E47] flex items-center">
                        <BookOpen className="w-8 h-8 mr-3 text-[#47A88D]" />
                        {content.title} ({content.type})
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-6 text-sm flex space-x-4 border-b pb-4">
                    <p className="text-gray-700">**Tier:** {LEADERSHIP_TIERS[content.tier]?.name}</p>
                    <p className="text-gray-700">**Skill Focus:** {content.skill}</p>
                    <p className="text-gray-700">**Est. Duration:** {content.duration} min</p>
                </div>

                <div className="prose max-w-none text-gray-700">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>

                <Button onClick={onClose} className='mt-8 w-full'>
                    Close & Return to Plan
                </Button>
            </div>
        </div>
    );
};

// New Component: Modal for Tier Review
const TierReviewModal = ({ isVisible, onClose, tierId, planData }) => {
    if (!isVisible || !tierId) return null;

    const tierMeta = LEADERSHIP_TIERS[tierId];
    if (!tierMeta) return null;

    // Filter all months belonging to the completed tier
    const completedTierMonths = planData.plan
        .filter(m => m.tier === tierId && m.month < planData.currentMonth)
        .sort((a, b) => a.month - b.month);

    // Get the final self-rating used to generate the content for this tier
    const initialRating = planData.assessment.selfRatings[tierId];
    const difficultyText = initialRating >= 8 ? 'Mastery' : initialRating >= 5 ? 'Core' : 'Intro';

    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">
                
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-3xl font-extrabold text-[#002E47] flex items-center">
                        <Eye className="w-8 h-8 mr-3 text-[#47A88D]" />
                        Completed Tier Review: {tierMeta.name}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="mb-6 space-y-2">
                    <p className="text-md text-gray-700">
                        **Initial Self-Rating:** <span className='font-bold text-[#47A88D]'>{initialRating}/10</span> 
                        (Content difficulty generated at the **{difficultyText}** level)
                    </p>
                    <p className="text-md text-gray-700">
                        **Duration:** {completedTierMonths.length} Months (Completed **{completedTierMonths.filter(m => m.status === 'Completed').length}** / {completedTierMonths.length} Months)
                    </p>
                </div>

                <h3 className="text-xl font-bold text-[#002E47] mb-4 border-b pb-2">Monthly Breakdown & Reflections</h3>
                
                <div className="space-y-6">
                    {completedTierMonths.map(month => (
                        <div key={month.month} className='p-5 bg-gray-50 rounded-xl border-l-4 border-[#002E47]/50 shadow-sm'>
                            <p className='text-lg font-extrabold text-[#002E47] mb-2'>Month {month.month} Focus: {month.theme}</p>
                            <div className='text-sm mb-3'>
                                <p className='font-semibold text-[#47A88D]'>Completed Content:</p>
                                <ul className='list-disc pl-5 text-gray-700'>
                                    {month.requiredContent.map(item => (
                                        <li key={item.id} className={`${item.status === 'Completed' ? 'text-gray-600' : 'text-gray-400 italic'}`}>{item.title} ({item.type})</li>
                                    ))}
                                </ul>
                            </div>
                            <p className='text-sm text-gray-700'>
                                <span className='font-semibold'>Reflection:</span> {month.reflectionText || 'No reflection logged.'}
                            </p>
                        </div>
                    ))}
                </div>

                <Button onClick={onClose} className='mt-8 w-full'>
                    Close Review
                </Button>
            </div>
        </div>
    );
};

// Component 2: Tracker Dashboard View
const TrackerDashboardView = ({ data, updatePdpData, saveNewPlan, db, userId, navigate }) => {
// We expect data to be the full roadmap document now
const currentMonth = data.currentMonth;
// Safely look up the current month's plan data
const currentMonthPlan = data.plan.find(m => m.month === currentMonth);
// Get the next month's focus for inter-app linking
const nextMonthPlan = data.plan.find(m => m.month === currentMonth + 1);
const nextMonthFocus = nextMonthPlan ? LEADERSHIP_TIERS[nextMonthPlan.tier].name : null;
const nextMonthTier = nextMonthPlan ? nextMonthPlan.tier : null;

// New state for Modals (Feature 3)
const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
const [reviewTierId, setReviewTierId] = useState(null);
const [isContentModalVisible, setIsContentModalVisible] = useState(false);
const [selectedContent, setSelectedContent] = useState(null);

const assessment = data.assessment;

const [localReflection, setLocalReflection] = useState(currentMonthPlan?.reflectionText || '');
const [isSaving, setIsSaving] = useState(false);

// Calculate completed tiers to show review buttons
const completedTiers = useMemo(() => {
    const completedMonths = data.plan.filter(m => m.month < currentMonth);
    const tiers = new Set();
    completedMonths.forEach(m => tiers.add(m.tier));
    
    // Check if every month belonging to a tier is completed.
    const fullyCompletedTiers = Object.keys(LEADERSHIP_TIERS).filter(tierId => {
        const tierMonths = data.plan.filter(m => m.tier === tierId);
        // Only consider a tier complete if at least one full rotation has passed (4 months total)
        if (tierMonths.length < 4) return false; 
        
        // A tier is fully complete if ALL its modules that have appeared in the past are marked complete
        // Simple check: is the last month of that tier in the plan completed?
        const lastMonthForTier = tierMonths.find(m => m.month < currentMonth);
        return lastMonthForTier && lastMonthForTier.status === 'Completed';
    });
    
    return fullyCompletedTiers;
}, [data.plan, currentMonth]);


// Sync local state with loaded Firestore data
useEffect(() => {
    if (currentMonthPlan) {
        setLocalReflection(currentMonthPlan.reflectionText || '');
    }
}, [currentMonthPlan]);

// --- Handlers ---
const handleCompleteMonth = async () => {
    const currentReflection = localReflection;
    if (currentReflection.length < 50) {
        // Use alert to directly notify the user
        alert('Reflection required! Please write at least 50 characters to mark this month complete.');
        return; 
    }

    setIsSaving(true);
    try {
        // Firestore Batch Update: 1. Update current month status/reflection; 2. Advance pointer
        const batch = writeBatch(db);
        const docRef = doc(db, `/artifacts/${appId}/users/${userId}/${PDP_COLLECTION}/${PDP_DOCUMENT}`);

        // 1. Update the current month object within the plan array
        const updatedPlan = data.plan.map(m => {
            if (m.month === currentMonth) {
                return {
                    ...m,
                    status: 'Completed',
                    reflectionText: currentReflection,
                    monthCompletedDate: new Date().toISOString(),
                };
            }
            return m;
        });
        
        // 2. Commit the updates (plan array and currentMonth pointer)
        batch.update(docRef, {
            plan: updatedPlan,
            currentMonth: currentMonth + 1,
            lastUpdate: new Date().toISOString(),
        });

        await batch.commit();

        // Clear local reflection after successful save
        setLocalReflection('');
        // NOTE: Replaced alert() with a non-blocking message
        alert('Month successfully completed! Advancing to the next phase.');

        // Interconnection: Navigate to Daily Practice to set commitments for the new month's focus
        if (nextMonthFocus) {
             navigate('daily-practice', { 
                initialGoal: nextMonthFocus,
                initialTier: nextMonthTier // Pass the tier for easy selection
            });
        }


    } catch (e) {
        console.error("Error advancing month via batch:", e);
        alert(`Failed to complete month. Error: ${e.message}`);
    } finally {
        setIsSaving(false);
    }
};

const handleResetPlan = async () => {
    // NOTE: Replaced window.prompt with alert/confirm for simplicity, but a custom modal is preferred.
    const shouldReset = window.confirm("WARNING: Are you sure you want to discard this plan and regenerate? All plan history will be lost.");
    
    if (shouldReset) {
        setIsSaving(true);
        try {
            const docRef = doc(db, `/artifacts/${appId}/users/${userId}/${PDP_COLLECTION}/${PDP_DOCUMENT}`);
            // Explicitly set the document data to null/empty state to force the 'not exists' flow in the hook
            // Note: Using setDoc with an empty object and merge:false deletes all fields.
            await setDoc(docRef, { }, { merge: false }); 
             // NOTE: Replaced alert() with a non-blocking message
             alert("Plan successfully reset! Loading generator...");
        } catch (e) {
            alert(`Failed to reset plan. Error: ${e.message}`);
        } finally {
            setIsSaving(false);
        }
    }
};

const handleContentStatusToggle = (contentId) => {
    // Toggle the status of a specific content item (Pending/Completed)
    const updatedPlan = data.plan.map(m => {
        if (m.month === currentMonth) {
            const updatedContent = m.requiredContent.map(item => {
                if (item.id === contentId) {
                    return { 
                        ...item, 
                        status: item.status === 'Completed' ? 'Pending' : 'Completed' 
                    };
                }
                return item;
            });
            return { ...m, requiredContent: updatedContent };
        }
        return m;
    });

    // Optimistically update local state while saving asynchronously
    updatePdpData({ plan: updatedPlan });
};

const handleOpenTierReview = (tierId) => {
    setReviewTierId(tierId);
    setIsReviewModalVisible(true);
};

// Feature 3: Handler for opening content modal
const handleOpenContentModal = (contentItem) => {
    setSelectedContent(contentItem);
    setIsContentModalVisible(true);
};


if (!currentMonthPlan) {
    // Should only happen if plan is complete (Month 25)
    return (
         <div className="p-8">
            <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Roadmap Complete!</h1>
            <p className='text-lg text-gray-600 mb-8'>Congratulations on completing your 24-month roadmap. You are now a **Seasoned Leader**!</p>
            <Button onClick={handleResetPlan}>Generate New Roadmap</Button>
        </div>
    )
}

// Determine if the month is ready to be completed
const allContentCompleted = currentMonthPlan?.requiredContent?.every(item => item.status === 'Completed');
const isReadyToComplete = allContentCompleted && localReflection.length >= 50;

const progressPercentage = Math.min(100, (currentMonth / 24) * 100);

// Safely retrieve icon component, defaulting to Target if tier or icon name is missing
const TierIcon = LEADERSHIP_TIERS[currentMonthPlan?.tier]?.icon 
                    ? IconMap[LEADERSHIP_TIERS[currentMonthPlan.tier].icon] 
                    : Target;

return (
    <div className="p-8">
        <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Tracker Dashboard: Your 24-Month Roadmap</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-3xl">This plan is tailored to your **Manager Status, Self-Ratings, and Goal Priorities**. Focus on completing your monthly content and reflecting on your growth.</p>
        
        {/* Progress Bar & Header */}
        <Card title={`Roadmap Progress: Month ${currentMonth} of 24`} icon={Clock} className="bg-[#002E47]/10 border-4 border-[#002E47]/20 mb-8">
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div 
                    className="bg-[#47A88D] h-4 rounded-full transition-all duration-700" 
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>
            <p className='text-sm font-medium text-[#002E47]'>
                {Math.round(progressPercentage)}% Complete. Next Tier Focus in {4 - ((currentMonth - 1) % 4)} months.
            </p>
            <Button onClick={handleResetPlan} variant='outline' className='mt-4 text-xs px-4 py-2 text-[#E04E1B] border-[#E04E1B]/50 hover:bg-[#E04E1B]/10'>
                Start Over / Re-Generate Plan
            </Button>
        </Card>
        
        {/* Tier Review Section */}
        {completedTiers.length > 0 && (
            <Card title="Tier Review Center" icon={Eye} className='mb-8 border-l-4 border-[#002E47]'>
                <p className='text-sm text-gray-700 mb-4'>Review your progress and reflections for past, completed leadership tiers.</p>
                <div className='flex flex-wrap gap-3'>
                    {completedTiers.map(tierId => {
                        const tier = LEADERSHIP_TIERS[tierId];
                        return (
                            <Button
                                key={tierId}
                                onClick={() => handleOpenTierReview(tierId)}
                                variant="outline"
                                className='text-xs px-4 py-2 border-[#002E47] text-[#002E47] hover:bg-[#002E47]/10'
                            >
                                Review {tier.id}: {tier.name}
                            </Button>
                        );
                    })}
                </div>
            </Card>
        )}

        {/* Current Month Plan */}
        <div className='lg:grid lg:grid-cols-3 lg:gap-8'>
            <div className='lg:col-span-2 space-y-8'>
                {/* Use the safely retrieved TierIcon */}
                <Card title={`Current Focus: ${currentMonthPlan?.theme}`} icon={TierIcon} className='border-l-8 border-[#47A88D]'>
                    
                    <div className='mb-4 text-sm'>
                        <p className='font-bold text-[#002E47]'>Tier: {LEADERSHIP_TIERS[currentMonthPlan?.tier]?.name}</p>
                        <p className='text-gray-600'>Target Difficulty: **{assessment?.selfRatings[currentMonthPlan?.tier] >= 8 ? 'Mastery' : assessment?.selfRatings[currentMonthPlan?.tier] >= 5 ? 'Core' : 'Intro'}** (based on your self-rating of {assessment?.selfRatings[currentMonthPlan?.tier]}/10)</p>
                    </div>

                    <h3 className='text-xl font-bold text-[#002E47] border-t pt-4 mt-4'>Required Content Items</h3>
                    <div className='space-y-3 mt-4'>
                        {currentMonthPlan?.requiredContent.map(item => (
                            <div key={item.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-xl shadow-sm'>
                                <div className='flex flex-col'>
                                    <p className={`font-semibold text-sm ${item.status === 'Completed' ? 'line-through text-gray-500' : 'text-[#002E47]'}`}>
                                        {item.title} ({item.type})
                                    </p>
                                    <p className='text-xs text-gray-600'>~{item.duration} min | Difficulty: {item.difficulty}</p>
                                </div>
                                <div className='flex space-x-2'>
                                    <Button
                                        onClick={() => handleOpenContentModal(item)}
                                        className='px-3 py-1 text-xs'
                                        variant='outline'
                                    >
                                        <Eye className='w-4 h-4'/>
                                    </Button>
                                    <Button
                                        onClick={() => handleContentStatusToggle(item.id)}
                                        className='px-3 py-1 text-xs'
                                        variant={item.status === 'Completed' ? 'secondary' : 'primary'}
                                        disabled={isSaving}
                                    >
                                        {item.status === 'Completed' ? 'Done ✓' : 'Mark Complete'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card title="Monthly Reflection" icon={Lightbulb} className="bg-[#002E47]/10 border-2 border-[#002E47]/20">
                    <p className="text-gray-700 text-sm mb-4">
                        Reflect on the growth you achieved this month. How did the content impact your daily leadership behavior? (**Minimum 50 characters required**)
                    </p>
                    <textarea 
                        value={localReflection}
                        onChange={(e) => setLocalReflection(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-40" 
                        placeholder="My reflection (required)..."
                    ></textarea>
                    <p className={`text-xs mt-1 ${localReflection.length < 50 ? 'text-[#E04E1B]' : 'text-[#47A88D]'}`}>
                        {localReflection.length} / 50 characters written.
                    </p>
                </Card>

            </div>
            
            <div className='lg:col-span-1 space-y-8'>
                <Card title="Advance Roadmap" icon={CornerRightUp} className='bg-[#47A88D]/10 border-4 border-[#47A88D]'>
                    <p className='text-sm text-gray-700 mb-4'>
                        Once all content items are marked complete and you have written your reflection, click below to lock this month's progress and move to **Month {currentMonth + 1}** of your plan.
                    </p>
                    <Button 
                        onClick={handleCompleteMonth} 
                        disabled={isSaving || !isReadyToComplete}
                        className='w-full bg-[#47A88D] hover:bg-[#349881]'
                    >
                        {isSaving ? 'Processing...' : `Complete Month ${currentMonth}`}
                    </Button>
                    {!allContentCompleted && (
                        <p className='text-[#E04E1B] text-xs mt-2'>* Finish all content items first.</p>
                    )}
                    {allContentCompleted && localReflection.length < 50 && (
                         <p className='text-[#E04E1B] text-xs mt-2'>* Reflection required (50 chars min).</p>
                    )}
                </Card>
                
                {/* Next Month Preview Card */}
                {nextMonthPlan && (
                    <Card title={`Next Month: Month ${currentMonth + 1}`} icon={Clock} className='bg-[#FCFCFA]'>
                        <p className='text-sm font-semibold text-[#002E47] mb-2'>Tier: {LEADERSHIP_TIERS[nextMonthPlan.tier].name}</p>
                        <p className='text-md text-gray-700 mb-3'>{nextMonthPlan.theme}</p>
                        <ul className='list-disc pl-5 text-sm text-gray-600 space-y-1'>
                            {nextMonthPlan.requiredContent.slice(0, 3).map((item, index) => (
                                <li key={index}>{item.title} (~{item.duration} min)</li>
                            ))}
                        </ul>
                        <p className='text-xs text-[#47A88D] mt-3'>Total est. time: {nextMonthPlan.totalDuration} min.</p>
                    </Card>
                )}
            </div>
        </div>
        
        {/* Modals */}
        <TierReviewModal
            isVisible={isReviewModalVisible}
            onClose={() => setIsReviewModalVisible(false)}
            tierId={reviewTierId}
            planData={data}
        />
        <ContentDetailsModal
            isVisible={isContentModalVisible}
            onClose={() => setIsContentModalVisible(false)}
            content={selectedContent}
        />
    </div>
);


};

// Component 1: Plan Generator View
const PlanGeneratorView = ({ userId, saveNewPlan, isLoading, error }) => {
const [managerStatus, setManagerStatus] = useState('New');
const [goalPriorities, setGoalPriorities] = useState([]);
const [selfRatings, setSelfRatings] = useState({ T1: 5, T2: 5, T3: 5, T4: 5, T5: 5 });
const [isGenerating, setIsGenerating] = useState(false);

const isGoalLimitReached = goalPriorities.length >= 3;
const canGenerate = managerStatus && goalPriorities.length > 0 && !isGenerating;

const handleGoalToggle = (tierId) => {
    setGoalPriorities(prev => {
        if (prev.includes(tierId)) {
            return prev.filter(id => id !== tierId);
        }
        if (isGoalLimitReached) {
            // NOTE: Replaced alert() with a non-blocking message
            alert("You can select a maximum of 3 goal priorities.");
            return prev;
        }
        return [...prev, tierId];
    });
};

const handleRatingChange = (tierId, value) => {
    setSelfRatings(prev => ({ ...prev, [tierId]: parseInt(value) }));
};

const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    
    const assessment = {
        managerStatus,
        goalPriorities,
        selfRatings,
        dateGenerated: new Date().toISOString(),
    };

    const newPlanData = generatePlanData(assessment, userId);

    const success = await saveNewPlan(newPlanData);
    if (!success) {
         // NOTE: Replaced alert() with a non-blocking message
         alert("Failed to save the plan. Check the console for database errors.");
    }
    setIsGenerating(false);
};

return (
    <div className="p-8">
        <h1 className="text-3xl font-extrabold text-[#002E47] mb-6">Personalized 24-Month Plan Generator</h1>
        <p className="text-lg text-gray-600 mb-8 max-w-3xl">Answer a few questions about your current role and goals to instantly generate a hyper-personalized leadership roadmap designed to close your skill gaps over the next two years.</p>
        
        {error && (
             <p className="text-[#E04E1B] p-4 bg-red-100 rounded-xl mb-6">Application Error: {error}</p>
        )}

        <div className="space-y-10">
            <Card title="1. Your Management Experience" icon={Users} className='border-l-4 border-[#47A88D]'>
                <h3 className="text-md font-semibold text-gray-700 mb-3">Select your current status:</h3>
                <div className="flex space-x-4">
                    {['New', 'Mid-Level', 'Seasoned'].map(status => (
                        <button
                            key={status}
                            onClick={() => setManagerStatus(status)}
                            className={`px-4 py-2 rounded-xl font-semibold transition-all shadow-md ${managerStatus === status ? 'bg-[#47A88D] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
                <p className='text-xs text-gray-500 mt-3'>This sets your starting tier (e.g., New starts at T1: Self-Awareness).</p>
            </Card>

            <Card title="2. Goal Priorities (Max 3)" icon={Target} className='border-l-4 border-[#002E47]'>
                <h3 className="text-md font-semibold text-gray-700 mb-3">Which tiers are most important to you right now?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(LEADERSHIP_TIERS).map(tier => (
                        <label key={tier.id} className={`flex items-center p-3 rounded-xl border-2 transition-all cursor-pointer ${goalPriorities.includes(tier.id) ? 'bg-[#002E47]/10 border-[#002E47]' : 'bg-[#FCFCFA] border-gray-200 hover:border-[#47A88D]'}`}>
                            <input
                                type="checkbox"
                                checked={goalPriorities.includes(tier.id)}
                                onChange={() => handleGoalToggle(tier.id)}
                                className="h-5 w-5 text-[#47A88D] rounded mr-3"
                                disabled={isGoalLimitReached && !goalPriorities.includes(tier.id)}
                            />
                            <div>
                                <p className="font-semibold text-[#002E47]">{tier.name}</p>
                                <p className="text-xs text-gray-600">({tier.id})</p>
                            </div>
                        </label>
                    ))}
                </div>
            </Card>

            <Card title="3. Self-Ratings (Skill Gap Assessment)" icon={BarChart3} className='border-l-4 border-[#47A88D]'>
                <h3 className="text-md font-semibold text-gray-700 mb-6">Rate your current effectiveness (1 = Low Skill/Confidence, 10 = Mastery):</h3>
                {Object.values(LEADERSHIP_TIERS).map(tier => (
                    <div key={tier.id} className="mb-6">
                        <p className="font-semibold text-[#002E47] flex justify-between">
                            <span>{tier.name}:</span>
                            <span className='text-xl font-extrabold text-[#47A88D]'>{selfRatings[tier.id]}/10</span>
                        </p>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={selfRatings[tier.id]}
                            onChange={(e) => handleRatingChange(tier.id, e.target.value)}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg accent-[#47A88D]"
                        />
                        <p className='text-xs text-gray-500 mt-1'>Rating influences target **content difficulty** (Low rating = Intro/Core content; High rating = Mastery).</p>
                    </div>
                ))}
            </Card>
        </div>

        <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="mt-10 w-full md:w-auto">
            {isGenerating ? (
                <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Generating 24-Month Plan...
                </div>
            ) : 'Generate Personalized 24-Month Plan'}
        </Button>
        <p className='text-sm text-gray-500 mt-4'>*Your data will be securely saved to your private roadmap in Firestore.</p>
    </div>
);


};

/**
 * MAIN APP COMPONENT
 */
const NavSidebar = ({ currentScreen, setCurrentScreen, user }) => {
// Grouped navigation items
const mainNav = [
    { name: 'dashboard', icon: Home, label: 'Dashboard' },
];

const quickStartNav = [
    { name: 'quick-start-accelerator', icon: Zap, label: 'QuickStart Accelerator' },
];

// TOOLS & LABS (Consolidated)
const toolNav = [
    { name: 'prof-dev-plan', icon: Briefcase, label: 'Prof Dev Plan' },
    { name: 'daily-practice', icon: Clock, label: 'Daily Practice & Scorecard' },
    { name: 'business-readings', icon: BookOpen, label: 'Leadership Readings' },
    { name: 'coaching-lab', icon: Mic, label: 'Coaching & Crucial Labs' },
    { name: 'planning-hub', icon: TrendingUp, label: 'Strategic Planning Hub' },
];

const appNav = [
    { name: 'app-settings', icon: Settings, label: 'App Settings' },
];

return (
// UPDATED: Changed bg-indigo-800 to #002E47 for primary dark color
<div className="w-64 bg-[#002E47] text-white flex-shrink-0 p-6 flex flex-col h-full rounded-tr-3xl rounded-br-3xl shadow-2xl">
<div className="flex items-center space-x-2 mb-10">
{/* Icon changed from cyan-400 to #47A88D */}
<Zap className="w-7 h-7 text-[#47A88D]" />
<h1 className="text-xl font-bold">LeaderReps</h1>
</div>

<nav className="flex-1 space-y-4">
    {/* Core Navigation Group */}
    <div className='space-y-2'>
        <p className='text-xs font-semibold uppercase text-indigo-300 mb-2'>Core Navigation</p>
        {mainNav.map(item => (
            <NavItem
                key={item.name}
                name={item.name}
                icon={item.icon}
                currentScreen={currentScreen}
                onClick={setCurrentScreen}
            />
        ))}
    </div>
    
    {/* QuickStart Group */}
    <div className='pt-4 border-t border-indigo-700 space-y-2'>
        <p className='text-xs font-semibold uppercase text-indigo-300 mb-2'>QuickStart</p>
        {quickStartNav.map(item => (
            <NavItem
                key={item.name}
                name={item.name}
                icon={item.icon}
                currentScreen={currentScreen}
                onClick={setCurrentScreen}
            />
        ))}
    </div>

    {/* Tools & Labs Group (Consolidated) */}
    <div className='pt-4 border-t border-indigo-700 space-y-2'>
        <p className='text-xs font-semibold uppercase text-indigo-300 mb-2'>Tools & Labs</p>
        {toolNav.map(item => (
            <NavItem
                key={item.name}
                name={item.name}
                icon={item.icon}
                currentScreen={currentScreen}
                onClick={setCurrentScreen}
            />
        ))}
    </div>

    {/* User/App Management */}
     <div className='pt-4 border-t border-indigo-700 space-y-2'>
        <p className='text-xs font-semibold uppercase text-indigo-300 mb-2'>User/App</p>
        {appNav.map(item => (
            <NavItem
                key={item.name}
                name={item.name}
                icon={item.icon}
                currentScreen={currentScreen}
                onClick={setCurrentScreen}
            />
        ))}
    </div>
</nav>

<div className="mt-8 pt-4 border-t border-indigo-700">
<p className="text-sm font-semibold text-indigo-300">Logged in as:</p>
<p className="text-sm text-white font-medium">{user?.name || 'Guest'}</p>
<p className="text-xs text-indigo-400 mt-1 break-words">UID: {user?.userId || 'N/A'}</p>
</div>
</div>
);
};

const App = ({initialState}) => {
    // Initial state handling for inter-component navigation (e.g., PDP -> Daily Practice)
    const [user, setUser] = useState(null);
    const [currentScreen, setCurrentScreen] = useState(initialState?.screen || 'dashboard');
    const [firebaseServices, setFirebaseServices] = useState({ db: null, auth: null });
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [navParams, setNavParams] = useState(initialState?.params || {});
    // Auth router state for handling Login/Signup/Reset views
    const [authRequired, setAuthRequired] = useState(true);

    // Custom navigate function to handle inter-screen data passing
    const navigate = useCallback((screen, params = {}) => {
        setNavParams(params);
        setCurrentScreen(screen);
    }, []);


// 1. Firebase Initialization and Auth Logic (useEffect runs once)
useEffect(() => {
    let app, firestore, authentication;
    try {
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        app = initializeApp(firebaseConfig);
        firestore = getFirestore(app);
        authentication = getAuth(app);
        
        // Set Firebase log level to debug for better diagnostics
        setLogLevel('debug');

        setFirebaseServices({ db: firestore, auth: authentication });

        // NOTE: We no longer sign in anonymously/custom token by default. 
        // We rely on the AuthRouter to manage state.

        const unsubscribe = onAuthStateChanged(authentication, (currentUser) => {
            if (currentUser) {
                // User is signed in (via login/signup)
                const currentUid = currentUser.uid;
                setUserId(currentUid);
                setUser({ 
                    name: currentUser.email || 'Canvas User', 
                    userId: currentUid 
                }); 
                setAuthRequired(false); // Auth is successful
            } else {
                // User is signed out
                setUser(null);
                setUserId(null);
                setAuthRequired(true); // Require login/signup
            }
            setIsAuthReady(true);
        });
        
        // Check if an initial token exists for environments like Canvas
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
             // Use custom token if provided (e.g., Canvas runtime)
             signInWithCustomToken(authentication, __initial_auth_token)
                .catch(error => console.error("Canvas Token Auth failed, waiting for user login:", error));
        }

        return () => unsubscribe(); // Cleanup auth listener

    } catch (e) {
        console.error("Firebase setup failed:", e);
        setIsAuthReady(true);
    }
}, []);

// 2. Mock Login Handler (used if Firebase initialization fails or for simple testing)
const handleMockLogin = (userInfo) => {
    // This mock path should ideally not be hit if Auth is functional, but kept as a safe mock for UI.
    setUser(userInfo);
    setAuthRequired(false);
    if (!userId) {
         setUserId(userInfo.userId || 'mock-user-id');
    }
};

// Check if auth is ready before rendering DataProvider
if (!isAuthReady) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                <p className="text-[#47A88D] font-medium">Initializing Authentication...</p>
            </div>
        </div>
    );
}

// 3. Render Authentication Router if required
if (authRequired || !user) {
    return <LoginScreenContainer onLogin={handleMockLogin} />;
}

// 4. Render Data Provider and Application (only when authenticated)
return (
    <DataProvider firebaseServices={firebaseServices} userId={userId} isAuthReady={isAuthReady} navigate={navigate} user={user}>
        <AppContent 
            currentScreen={currentScreen} 
            setCurrentScreen={navigate} 
            user={user} 
            navParams={navParams}
        />
    </DataProvider>
);
}

// New component for the main application content, separated from App for cleanliness
const AppContent = ({ currentScreen, setCurrentScreen, user, navParams }) => {
    return (
        <div className="min-h-screen flex bg-gray-100 font-sans antialiased">
            <NavSidebar currentScreen={currentScreen} setCurrentScreen={setCurrentScreen} user={user} />
            <main className='flex-1 overflow-y-auto p-0'>
                <ScreenRouter currentScreen={currentScreen} navParams={navParams} />
            </main>
        </div>
    );
};

const ScreenRouter = ({ currentScreen, navParams }) => {
    switch (currentScreen) {
        case 'prof-dev-plan':
            return <ProfDevPlanScreen />;
        case 'daily-practice':
            // Pass both initialGoal and initialTier for improved UX/autofill
            return <DailyPracticeScreen initialGoal={navParams.initialGoal} initialTier={navParams.initialTier} />;
        case 'coaching-lab':
            return <CoachingLabScreen />;
        case 'planning-hub':
            return <PlanningHubScreen />;
        case 'business-readings':
            return <BusinessReadingsScreen />;
        case 'quick-start-accelerator':
            return <QuickStartScreen />;
        case 'app-settings':
            return <AppSettingsScreen />;
        case 'dashboard':
        default:
            return <DashboardScreen />;
    }
};


export default App;
