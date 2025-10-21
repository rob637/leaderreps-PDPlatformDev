// src/components/screens/DevPlan.jsx

import { Home, Settings, Zap, Clock, Briefcase, Mic, Trello, BookOpen, BarChart3, TrendingUp, TrendingDown, CheckCircle, Star, Target, Users, HeartPulse, CornerRightUp, X, ArrowLeft, Activity, Link, Lightbulb, AlertTriangle, Eye, PlusCircle, Cpu, MessageSquare, Check } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// NOTE: In a production environment, this file must use the 'useAppServices' 
// from your actual services directory, which handles Firebase/API connections.
// The code below simulates the structure and flow expected by the router.

// --- SERVICE LAYER TEMPLATE (REPLACE MOCK CODE WITH PRODUCTION CALLS) ---
const useAppServices = (localPdpData, setLocalPdpData) => {
    // 1. PRODUCTION INJECTION POINT: Replace the useState logic here.
    
    const updatePdpData = async (updater) => {
        // 2. PRODUCTION INJECTION POINT: Replace this entire block with your
        // actual database WRITE logic (e.g., Firebase `setDoc`).
        
        console.log("PRODUCTION MOCK: Running Database WRITE for updatePdpData...");
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
        
        setLocalPdpData(prevData => {
            const newData = typeof updater === 'function' ? updater(prevData) : updater;
            return newData;
        });
        return true;
    };
    
    const saveNewPlan = async (plan) => {
        // 3. PRODUCTION INJECTION POINT: Replace this with your initial plan save logic.
        console.log("PRODUCTION MOCK: Running Database WRITE for initial plan save...");
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate delay
        
        await updatePdpData(() => plan);
        return true;
    };

    return {
        // NOTE: pdpData is managed by the router and passed in as `localPdpData`
        pdpData: localPdpData, 
        updatePdpData: updatePdpData,
        saveNewPlan: saveNewPlan,
        // AI Services are assumed to be correctly configured in App.jsx
        callSecureGeminiAPI: async (payload) => { /* ... PRODUCTION AI LOGIC ... */ return { candidates: [{ content: { parts: [{ text: "## Monthly Executive Briefing\n\n**Focus Area:** Strategic Clarity (T5)\n\n**Coaching Nudge:** Prioritize clear decision-making processes." }] } }] }; },
        hasGeminiKey: () => true,
        navigate: (screen, params) => console.log(`Navigating to ${screen} with params:`, params),
        userId: 'mock-user-123',
        isLoading: false, 
        error: null,
        commitmentData: { active_commitments: [] },
        planningData: { okrs: [{ objective: 'OKR Q4: Launch MVP' }] },
    };
};
// --- END SERVICE LAYER TEMPLATE ---


/* =========================================================
   HIGH-CONTRAST PALETTE (Centralized for Consistency)
========================================================= */
const COLORS = {
  NAVY: '#002E47',      
  TEAL: '#47A88D',      
  SUBTLE_TEAL: '#349881', 
  ORANGE: '#E04E1B',    
  GREEN: '#10B981',
  AMBER: '#F5A500', // Adjusted amber shade for contrast
  RED: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF', 
  SUBTLE: '#E5E7EB',
  TEXT: '#002E47',
  MUTED: '#4B5355',
  BLUE: '#2563EB',
  BG: '#F9FAFB', // Matches BusinessReadings
  PURPLE: '#7C3AED', // Matches BusinessReadings
};

// Mock UI components (Standardized)
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
  let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-xl focus:outline-none focus:ring-4 text-white flex items-center justify-center";
  if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[${COLORS.SUBTLE_TEAL}] focus:ring-[${COLORS.TEAL}]/50`; }
  else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
  else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}] flex items-center justify-center`; }
  else if (variant === 'nav-back') { baseStyle = `px-4 py-2 rounded-lg font-medium transition-all shadow-sm border-2 border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center`; }
  if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center"; }
  return (
    <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>
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
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative p-6 rounded-2xl border-2 shadow-2xl transition-all duration-300 text-left ${className}`}
      style={{ background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)', borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
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

// Mock external utilities (to satisfy imports)
const mdToHtml = async (md) => {
    let html = md;
    html = html.replace(/## (.*$)/gim, '<h2 class="text-2xl font-extrabold text-[#E04E1B] mb-3">$1</h2>');
    html = html.replace(/### (.*$)/gim, '<h3 class="text-xl font-bold text-[#47A88D] mt-4 mb-2">$1</h3>');
    html = html.replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>');
    html = html.replace(/\n\n/g, '</p><p class="text-sm text-gray-700 mt-2">');
    html = html.replace(/\* (.*)/gim, '<li class="text-sm text-gray-700">$1</li>');
    html = html.replace(/<li>/g, '<ul><li>').replace(/<\/li>(?!<ul>)/g, '</li></ul>');
    return `<p class="text-sm text-gray-700">${html}</p>`;
};
const IconMap = {
    Zap: Zap, Users: Users, Briefcase: Briefcase, Target: Target, BarChart3: BarChart3, Clock: Clock, Eye: Eye, BookOpen: BookOpen, Lightbulb: Lightbulb, X: X, ArrowLeft: ArrowLeft, CornerRightUp: CornerRightUp, AlertTriangle: AlertTriangle, CheckCircle: CheckCircle, PlusCircle: PlusCircle, HeartPulse: HeartPulse, TrendingUp: TrendingUp, TrendingDown: TrendingDown, Activity: Activity, Link: Link, Cpu: Cpu, Star: Star, Mic: Mic, Trello: Trello, Settings: Settings, Home: Home, MessageSquare: MessageSquare, Check: Check
};


const PDP_COLLECTION = 'leadership_plan';
const PDP_DOCUMENT = 'roadmap';
const appId = 'default-app-id'; // Mock value for app id

// --- PDP Content Model ---
const LEADERSHIP_TIERS = {
    T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
    T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' },
    T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' },
    T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-600' },
    T5: { id: 'T5', name: 'Strategy & Vision', icon: 'TrendingUp', color: 'cyan-600' },
};

// Content Library (EXPANDED TO PROVIDE 24 MONTHS OF UNIQUE CONTENT)
const CONTENT_LIBRARY = [
    // T1: Lead Self & Mindsets (6 unique items per difficulty: Intro, Core, Mastery)
    { id: 101, tier: 'T1', skill: 'Shift to Coach', type: 'Exercise', title: 'Player-to-Coach Delegation Framework', duration: 45, difficulty: 'Core' },
    { id: 102, tier: 'T1', skill: 'Motive', type: 'Reading', title: 'Leadership Motive - Servant Leadership Primer', duration: 30, difficulty: 'Intro' },
    { id: 103, tier: 'T1', skill: 'Identity', type: 'Tool', title: 'Defining Your Leadership Identity (LIS)', duration: 60, difficulty: 'Mastery' },
    { id: 104, tier: 'T1', skill: 'Ownership', type: 'Case Study', title: 'Ownership and Accountability Audit', duration: 50, difficulty: 'Core' },
    { id: 105, tier: 'T1', skill: 'Boss', type: 'Reading', title: 'Relationship with Boss: Managing Upward', duration: 30, difficulty: 'Intro' },
    { id: 106, tier: 'T1', skill: 'V-B Trust', type: 'Reading', title: 'Leading the Way: Go 1st with V-B Trust', duration: 40, difficulty: 'Intro' },
    { id: 107, tier: 'T1', skill: 'Shift to Coach', type: 'Role-Play', title: 'Sim: Delegating a High-Stakes Task', duration: 55, difficulty: 'Mastery' },
    { id: 108, tier: 'T1', skill: 'Motive', type: 'Exercise', title: 'Journal: Motive vs. Reward', duration: 30, difficulty: 'Core' },
    { id: 109, tier: 'T1', skill: 'Identity', type: 'Case Study', title: 'Case: Identity Conflict & Team Morale', duration: 60, difficulty: 'Mastery' },
    { id: 110, tier: 'T1', skill: 'Ownership', type: 'Tool', title: 'Accountability Scorecard Setup', duration: 45, difficulty: 'Core' },
    { id: 111, tier: 'T1', skill: 'Boss', type: 'Role-Play', title: 'Sim: Delivering Bad News to Your Boss', duration: 50, difficulty: 'Mastery' },
    { id: 112, tier: 'T1', skill: 'V-B Trust', type: 'Exercise', title: 'Vulnerability Loop Practice', duration: 35, difficulty: 'Core' },
    { id: 113, tier: 'T1', skill: 'Shift to Coach', type: 'Case Study', title: 'Case: Over-Involvement Failure', duration: 50, difficulty: 'Intro' },
    { id: 114, tier: 'T1', skill: 'Identity', type: 'Reading', title: 'Article: The Pitfalls of the "Hero" Identity', duration: 25, difficulty: 'Intro' },
    { id: 115, tier: 'T1', skill: 'Ownership', type: 'Role-Play', title: 'Sim: Refusing Excuses', duration: 45, difficulty: 'Mastery' },
    { id: '116', tier: 'T1', skill: 'Motive', type: 'Case Study', title: 'Case: Purpose vs. Profit Alignment', duration: 60, difficulty: 'Mastery' },
    { id: 117, tier: 'T1', skill: 'V-B Trust', type: 'Tool', title: 'Tool: Trust Building Checklist', duration: 30, difficulty: 'Intro' },
    { id: 118, tier: 'T1', skill: 'Boss', type: 'Exercise', title: 'Journal: Boss Expectation Alignment', duration: 40, difficulty: 'Core' },
    
    // T2: Lead Work & Execution (6 unique items per difficulty)
    { id: 201, tier: 'T2', skill: 'Goals', type: 'Exercise', title: 'Goals & OKR Prioritization Workshop', duration: 60, difficulty: 'Mastery' },
    { id: 202, tier: 'T2', skill: 'Expectations', type: 'Reading', title: 'Setting Clear Expectations Protocol', duration: 25, difficulty: 'Intro' },
    { id: 203, tier: 'T2', skill: 'Metrics', type: 'Tool', title: 'Leading & Lagging Metrics Dashboard Setup', duration: 40, difficulty: 'Core' },
    { id: 204, tier: 'T2', skill: 'Delegation', type: 'Exercise', title: 'Effective Delegation using Delegation Matrix', duration: 45, difficulty: 'Core' },
    { id: 205, tier: 'T2', skill: 'Meetings', type: 'Tool', title: 'Effective Meetings: Decision-Focused Agenda', duration: 30, difficulty: 'Intro' },
    { id: 206, tier: 'T2', skill: 'Decisions', type: 'Case Study', title: 'Decision-Making / Problem Solving Framework', duration: 55, difficulty: 'Mastery' },
    { id: 207, tier: 'T2', skill: 'Goals', type: 'Reading', title: 'Article: From Activity to Outcome', duration: 20, difficulty: 'Intro' },
    { id: 208, tier: 'T2', skill: 'Expectations', type: 'Exercise', title: 'Tool: Stakeholder Expectation Mapping', duration: 40, difficulty: 'Core' },
    { id: 209, tier: 'T2', skill: 'Metrics', type: 'Case Study', title: 'Case: Metrics Misalignment Disaster', duration: 60, difficulty: 'Mastery' },
    { id: 210, tier: 'T2', skill: 'Delegation', type: 'Role-Play', title: 'Sim: Delegating a Creative Task', duration: 50, difficulty: 'Core' },
    { id: 211, tier: 'T2', skill: 'Meetings', type: 'Case Study', title: 'Case: Post-Mortem on a Bad Meeting', duration: 45, difficulty: 'Mastery' },
    { id: 212, tier: 'T2', skill: 'Decisions', type: 'Reading', title: 'Article: When to Use the DICE Model', duration: 30, difficulty: 'Intro' },
    { id: 213, tier: 'T2', skill: 'Goals', type: 'Role-Play', title: 'Sim: Challenging a Vague Goal', duration: 55, difficulty: 'Mastery' },
    { id: 214, tier: 'T2', skill: 'Expectations', type: 'Case Study', title: 'Case: The Unspoken Expectation Failure', duration: 45, difficulty: 'Intro' },
    { id: 215, tier: 'T2', skill: 'Delegation', type: 'Tool', title: 'Delegation Audit & Follow-up Checklist', duration: 35, difficulty: 'Core' },
    { id: 216, tier: 'T2', skill: 'Meetings', type: 'Exercise', title: 'Exercise: Defining Meeting Success', duration: 30, difficulty: 'Intro' },
    
    // T3: Lead People & Coaching (5 unique items per difficulty)
    { id: 301, tier: 'T3', skill: '1:1s', type: 'Tool', title: 'Effective 1:1s: Coaching-First Structure', duration: 30, difficulty: 'Core' },
    { id: 302, tier: 'T3', skill: 'Coaching', type: 'Role-Play', title: 'Practice: GROW Model Coaching Session', duration: 45, difficulty: 'Core' },
    { id: 303, tier: 'T3', skill: 'Recognition', type: 'Reading', title: 'Recognition and Motivation Principles', duration: 25, difficulty: 'Intro' },
    { id: 304, tier: 'T3', skill: 'Feedback', type: 'Exercise', title: 'Delivering Effective Feedback (Radical Candor)', duration: 40, difficulty: 'Core' },
    { id: 305, tier: 'T3', skill: 'Motivation', type: 'Case Study', title: 'Intrinsic Motivation and Team Engagement', duration: 50, difficulty: 'Mastery' },
    { id: 306, tier: 'T3', skill: '1:1s', type: 'Case Study', title: 'Case: 1:1s as Performance Intervention', duration: 55, difficulty: 'Mastery' },
    { id: 307, tier: 'T3', skill: 'Coaching', type: 'Reading', title: 'Article: The Non-Directive Coaching Stance', duration: 20, difficulty: 'Intro' },
    { id: 308, tier: 'T3', skill: 'Recognition', type: 'Exercise', title: 'Tool: Customizing Recognition', duration: 35, difficulty: 'Core' },
    { id: 309, tier: 'T3', skill: 'Feedback', type: 'Role-Play', title: 'Sim: Receiving and Processing Tough Feedback', duration: 45, difficulty: 'Mastery' },
    { id: 310, tier: 'T3', skill: 'Motivation', type: 'Tool', title: 'Motivation Diagnostic Checklist', duration: 30, difficulty: 'Intro' },
    { id: 311, tier: 'T3', skill: '1:1s', type: 'Reading', title: 'Article: Frequency vs. Quality in 1:1s', duration: 25, difficulty: 'Intro' },
    { id: 312, tier: 'T3', skill: 'Coaching', type: 'Case Study', title: 'Case: When Coaching Fails to Motivate', duration: 60, difficulty: 'Mastery' },
    
    // T4: Conflict & Team Health (5 unique items per difficulty)
    { id: 401, tier: 'T4', skill: 'Conflict', type: 'Exercise', title: 'Conflict Management Style Quiz & Strategy', duration: 30, difficulty: 'Core' },
    { id: 402, tier: 'T4', skill: 'Commitment', type: 'Tool', title: 'Team Health: Consensual Commitment Framework', duration: 40, difficulty: 'Core' },
    { id: 403, tier: 'T4', skill: 'Accountability', type: 'Exercise', title: 'Team Health: Peer Accountability Implementation', duration: 55, difficulty: 'Mastery' },
    { id: 404, tier: 'T4', skill: 'Crucial', type: 'Role-Play', title: 'Crucial Conversations / Conflict Mgmt Practice', duration: 60, difficulty: 'Mastery' },
    { id: 405, tier: 'T4', skill: 'Trust', type: 'Case Study', title: 'Team Health: Repairing V-B Trust', duration: 45, difficulty: 'Intro' },
    { id: 406, tier: 'T4', skill: 'Conflict', type: 'Reading', title: 'Article: The Value of Productive Conflict', duration: 20, difficulty: 'Intro' },
    { id: 407, tier: 'T4', skill: 'Commitment', type: 'Case Study', title: 'Case: Ambiguity and Failure to Commit', duration: 50, difficulty: 'Mastery' },
    { id: 408, tier: 'T4', skill: 'Accountability', type: 'Reading', title: 'Article: The Link Between Ownership and Trust', duration: 25, difficulty: 'Intro' },
    { id: 409, tier: 'T4', skill: 'Crucial', type: 'Exercise', title: 'Tool: Conflict Resolution Scripting', duration: 35, difficulty: 'Core' },
    { id: 410, tier: 'T4', skill: 'Trust', type: 'Tool', title: 'Trust Builder Team Exercise', duration: 40, difficulty: 'Core' },
    { id: 411, tier: 'T4', skill: 'Conflict', type: 'Case Study', title: 'Case: Mediating Personality Clashes', duration: 55, difficulty: 'Mastery' },
    { id: 412, tier: 'T4', skill: 'Commitment', type: 'Reading', title: 'Article: The Two Types of Buy-In', duration: 20, difficulty: 'Intro' },

    // T5: Strategy & Vision (3 unique items per difficulty)
    { id: 501, tier: 'T5', skill: 'Vision', type: 'Exercise', title: 'Vision Statement Workshop', duration: 45, difficulty: 'Core' },
    { id: 502, tier: 'T5', skill: 'Strategic', type: 'Tool', title: 'Pre-Mortem Risk Audit', duration: 30, difficulty: 'Mastery' },
    { id: 503, tier: 'T5', skill: 'Planning', type: 'Reading', title: 'Long-Range Strategic Planning Principles', duration: 40, difficulty: 'Intro' },
    { id: 504, tier: 'T5', skill: 'Vision', type: 'Case Study', title: 'Case: Communicating Vision in Crisis', duration: 50, difficulty: 'Mastery' },
    { id: 505, tier: 'T5', skill: 'Strategic', type: 'Reading', title: 'Article: Cascading Goals Downstream', duration: 25, difficulty: 'Intro' },
    { id: 506, tier: 'T5', skill: 'Planning', type: 'Exercise', title: 'Tool: Defining Strategic Pillars', duration: 35, difficulty: 'Core' },
    { id: 507, tier: 'T5', skill: 'Vision', type: 'Tool', title: 'Vision Alignment Diagnostic', duration: 30, difficulty: 'Core' },
    { id: 508, tier: 'T5', skill: 'Strategic', type: 'Exercise', title: 'Exercise: Scenario Planning', duration: 60, difficulty: 'Mastery' },
    { id: 509, tier: 'T5', skill: 'Planning', type: 'Case Study', title: 'Case: Resource Allocation Failure', duration: 45, difficulty: 'Intro' },
];


const MOCK_CONTENT_DETAILS = {
    // ----------------------------------------------------
    // TYPE: READING (Focus: Foundational Theory & Motive)
    // ----------------------------------------------------
    'Reading': (title, skill) => {
        let takeaway = "Understanding your motive transforms supervision into leadership.";
        let focus = "philosophical context";
        if (skill === 'Motive') focus = "the shift from ego-driven to purpose-driven leadership.";
        if (skill === 'Boss') focus = "the power dynamics in the manager-subordinate relationship.";
        
        return `
            ## Reading: ${title} (Time Commitment: ~30-40 min)
            
            ### Primary Focus: ${skill} Theory
            
            **Learning Goal:** Understand the foundational **${skill}** theory and its impact on team trust.
            
            This module provides the philosophical and psychological context for your leadership actions. ${title} is critical for establishing a sustainable leadership model, emphasizing ${focus}.
            
            * **Weekly Focus:** Analyze how this theory applies to your next scheduled team interaction.
            * **Actionable Deliverable:** A draft of your personal 'Why Lead' statement or a documented 'Managing Upward' matrix.
            * **Primary Takeaway:** Clear is Kind, Vague is Cruel.
        `;
    },

    // ----------------------------------------------------
    // TYPE: EXERCISE (Focus: Journaling, Drafting, Habit Building)
    // ----------------------------------------------------
    'Exercise': (title, skill) => {
        let outcome = "Create a single, measurable behavior change and define its trigger.";
        let deliverable = "A pre-scripted Coaching Question to replace your most common 'fix-it' instinct.";
        
        if (skill === 'Goals') {
            deliverable = "A finalized set of 3 quarterly OKRs, each linked to a specific key result and prioritization tier.";
        } else if (skill === 'Conflict') {
            deliverable = "A completed Conflict Management Style assessment and strategy guide.";
        }
        
        return `
            ## Guided Practice: ${title} (Time Commitment: ~30-45 min)
            
            ### Action Focus: ${skill}
            
            This is a structured, private drafting activity designed to solidify abstract concepts into personal behaviors. The output is a personalized artifact ready for implementation.
            
            * **Weekly Focus:** Convert one reactive habit into a proactive coaching behavior.
            * **Actionable Deliverable:** ${deliverable}
            * **Required Time:** 45 minutes of uninterrupted focus.
        `;
    },

    // ----------------------------------------------------
    // TYPE: ROLE-PLAY (Focus: High-Stakes Behavioral Practice)
    // ----------------------------------------------------
    'Role-Play': (title, skill) => {
        let method = "SBI (Situation-Behavior-Impact) feedback model";
        if (skill === 'Crucial') method = "State My Path framework (Identify Facts, Tell Story, Ask)";
        
        return `
            ## Practice Simulation: ${title} (Time Commitment: ~45-60 min)
            
            ### Behavioral Focus: ${skill}
            
            This is a high-impact preparation module for the Coaching Lab, simulating a difficult or complex leadership interaction. The goal is to successfully navigate high-stakes moments.
            
            * **Weekly Focus:** Practice the initial 5 minutes of the difficult conversation until fluent.
            * **Method:** Utilize the **${method}** in your response to the simulated employee/peer.
            * **Actionable Deliverable:** A post-simulation debrief note logged in your PDP journal detailing three things you would change in a live scenario.
        `;
    },

    // ----------------------------------------------------
    // TYPE: CASE STUDY (Focus: Executive Analysis & Strategy)
    // ----------------------------------------------------
    'Case Study': (title, skill) => {
        let goal = "test your strategic resilience and problem-solving under pressure.";
        if (skill === 'Trust') goal = "diagnose the root cause of systemic low-trust within a peer group and draft a vulnerability-based repair plan.";
        if (skill === 'Decisions') goal = "evaluate decision-making under uncertainty, applying the problem-solving framework.";

        return `
            ## Executive Analysis: ${title} (Time Commitment: ~45-60 min)
            
            ### Application Focus: ${skill}
            
            Review the provided scenario outlining a complex organizational breakdown (e.g., a cross-functional failure or accountability crisis). This module is designed to ${goal}.
            
            * **Weekly Focus:** Analyze the scenario, identify the failure point, and select two key frameworks from this month's content to solve the issue.
            * **Task:** Prepare a 5-step action plan and a one-page defense for your solution.
            * **Actionable Deliverable:** A final 5-step implementation plan saved, ready to present to your mentor/coach.
        `;
    },
    
    // ----------------------------------------------------
    // TYPE: TOOL (Focus: Systematizing Process)
    // ----------------------------------------------------
    'Tool': (title, skill) => {
        let deliverable = "A formalized system documented and integrated into your weekly workflow.";
        let integration = "formally integrate a new system";
        if (skill === 'Identity') integration = "establish a formalized Leadership Identity Statement (LIS)";
        if (skill === 'Metrics') integration = "set up a dashboard to track leading indicators";
        
        return `
            ## Tool Implementation: ${title} (Time Commitment: ~30-40 min)
            
            ### Implementation Goal: Systematize ${skill}
            
            This module delivers a framework (e.g., RACI Matrix, LIS, Pre-Mortum Audit) for immediate use in your role. The objective is to **${integration}** into your weekly workflow, reducing reliance on manual effort and intuition.
            
            * **Weekly Focus:** Customize the template for your current team/project and define clear ownership.
            * **Actionable Deliverable:** The completed **${skill}** tool/framework used once in a real meeting or delegation process this week for full completion credit.
            * **System:** Downloadable checklist/template included (e.g., Delegation Matrix).
        `;
    },
};

// Mock data for the "Generic Manager" Plan Comparison
const GENERIC_PLAN = {
    avgIntroContent: 8, 
    avgMasteryContent: 3, 
    totalDuration: 1200, 
};

const getTargetDifficulty = (rating) => rating >= 8 ? 'Mastery' : rating >= 5 ? 'Core' : 'Intro';
const adjustDuration = (rating, duration) => {
    if (rating >= 8) return Math.round(duration * 0.9);
    if (rating <= 4) return Math.round(duration * 1.1);
    return duration;
};

// UPDATED: generatePlanData simplified to remove peer/team inputs
const generatePlanData = (assessment, ownerUid) => {
    const { managerStatus, goalPriorities, selfRatings, menteeFeedback } = assessment;
    const allTiers = Object.keys(LEADERSHIP_TIERS);

    const plan = [];
    const usedContentIds = new Set();
    const lowRatedTiers = Object.entries(selfRatings).filter(([, rating]) => rating <= 4).map(([id]) => id);

    let tierRotationQueue = [];

    // Prioritization logic: Low Rating > Goal Priority > General Rotation
    lowRatedTiers.forEach(tier => {
        if (!tierRotationQueue.includes(tier)) tierRotationQueue.push(tier);
    });
    goalPriorities.forEach(tier => {
        if (!tierRotationQueue.includes(tier)) tierRotationQueue.push(tier);
    });
    allTiers.forEach(tier => {
        if (!tierRotationQueue.includes(tier)) tierRotationQueue.push(tier);
    });

    // Special injection for New Managers
    if (managerStatus === 'New' && tierRotationQueue[0] !== 'T1') {
         tierRotationQueue.unshift('T1');
    }
    
    // Special injection for Mentee Feedback Gap (still kept T4 for conflict)
    if (menteeFeedback?.T4?.score < 70 && !tierRotationQueue.includes('T4')) {
         tierRotationQueue.splice(1, 0, 'T4');
    }

    // --- Core 24-Month Loop ---
    for (let month = 1; month <= 24; month++) {
        let currentTier = tierRotationQueue[(month - 1) % tierRotationQueue.length];
        const tierMeta = LEADERSHIP_TIERS[currentTier];
        const theme = `Deep Dive: ${tierMeta.name}`;

        const rating = selfRatings[currentTier];
        const targetDifficulty = getTargetDifficulty(rating);

        const requiredContent = [];
        const contentPool = CONTENT_LIBRARY.filter(item =>
            item.tier === currentTier && item.difficulty === targetDifficulty && !usedContentIds.has(item.id)
        );

        // Pull up to 4 items
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
        
        // Ensure every month has at least one item, if the initial filter was empty
        if (requiredContent.length === 0) {
             const backupItem = CONTENT_LIBRARY.find(item => item.tier === currentTier && !usedContentIds.has(item.id));
             if (backupItem) {
                 requiredContent.push({
                    ...backupItem,
                    duration: adjustDuration(rating, backupItem.duration),
                    status: 'Pending',
                });
                usedContentIds.add(backupItem.id);
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

// --- Modals (omitted for brevity - content remains the same) ---
const SharePlanModal = ({ isVisible, onClose, currentMonthPlan, data }) => { 
    if (!isVisible || !currentMonthPlan) return null;
    const tierName = LEADERSHIP_TIERS[currentMonthPlan.tier].name;
    const shareLink = `https://leaderreps.com/pdp/view/${data.ownerUid}/${data.currentMonth}`;
    const shareText = `[PDP Monthly Focus]\n\nHello Manager, here is my focus for Month ${currentMonthPlan.month}:\n\n- **Current Tier Priority:** ${tierName}\n- **Theme:** ${currentMonthPlan.theme}\n- **Required Content:** ${currentMonthPlan.requiredContent.map(c => c.title).join(', ')}.\n\nMy primary skill gap is in ${data.assessment.selfRatings[currentMonthPlan.tier]}/10). My goal this month is to close this gap by completing all content.\n\nView my full progress: ${shareLink}\n\nManager Acknowledgment: [ ] I have reviewed and aligned with this plan.`; 
    const copyToClipboard = () => {
        const el = document.createElement('textarea');
        el.value = shareText;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        console.log('Share content copied to clipboard!');
    };
    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center">
                        <Link className="w-6 h-6 mr-3 text-[#47A88D]" />
                        Share Monthly Focus
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-gray-700 text-sm mb-4">
                    Send your manager or accountability partner your current focus and goals to maintain alignment and external accountability. **Includes Manager Acknowledgment Mock.**
                </p>
                <h3 className='text-md font-bold text-[#002E47] mb-2'>Shareable Summary (Copied Text)</h3>
                <textarea
                    readOnly
                    value={shareText}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm h-40"
                ></textarea>
                <Button onClick={copyToClipboard} className='mt-4 w-full bg-[#002E47] hover:bg-gray-700'>
                    Copy to Clipboard
                </Button>
                <p className='text-xs text-gray-500 mt-4'>
                    *Note: The actual URL link above is mocked in this demonstration.
                </p>
                <Button onClick={onClose} variant='outline' className='mt-4 w-full'>
                    Close
                </Button>
            </div>
        </div>
    );
};

const ContentDetailsModal = ({ isVisible, onClose, content }) => { 
    if (!isVisible || !content) return null;
    const [htmlContent, setHtmlContent] = useState('');
    const [rating, setRating] = useState(0); 
    const [isLogging, setIsLogging] = useState(false);

    const mockDetail = MOCK_CONTENT_DETAILS[content.type]
        ? MOCK_CONTENT_DETAILS[content.type](content.title, content.skill)
        : `### Content Unavailable\n\nNo detailed mock content available for type: **${content.type}**`;

    useEffect(() => {
        (async () => setHtmlContent(await mdToHtml(mockDetail)))();
        setRating(0); 
    }, [content.id, mockDetail]);

    const handleLogLearning = async () => {
        if (rating === 0) { console.log('Please provide a 5-star rating before logging.'); return; }
        setIsLogging(true);
        console.log(`Mock: Logging learning for ${content.title} with rating ${rating}/5.`);
        await new Promise(r => setTimeout(r, 800));
        console.log(`Learning logged! Your ${rating}/5 rating will influence future plan revisions.`);
        setIsLogging(false);
        onClose();
    };

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
                    <p className="text-gray-700 font-semibold">Tier: <span className='text-[#002E47]'>{LEADERSHIP_TIERS[content.tier]?.name}</span></p>
                    <p className="text-gray-700 font-semibold">Skill Focus: <span className='text-[#002E47]'>{content.skill}</span></p>
                    <p className="text-gray-700 font-semibold">Est. Duration: <span className='text-[#002E47]'>{content.duration} min</span></p>
                </div>
                <div className="prose max-w-none text-gray-700">
                    <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                </div>
                <div className='mt-8 pt-6 border-t border-gray-200'>
                    <h3 className='text-lg font-bold text-[#002E47] mb-3 flex items-center'>
                        <Star className="w-5 h-5 mr-2 text-[#E04E1B]" />
                        Review & Log Learning
                    </h3>
                    <p className='text-sm text-gray-700 mb-4'>
                        Rate the content's quality and helpfulness. This feedback loop helps the AI personalize future modules.
                    </p>
                    <div className='flex items-center space-x-4 mb-4'>
                        <div className='flex space-x-1'>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-6 h-6 cursor-pointer transition-colors ${
                                        star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                                    }`}
                                    onClick={() => setRating(star)}
                                />
                            ))}
                        </div>
                        <span className='text-md font-semibold text-[#002E47]'>{rating > 0 ? `${rating}/5 Stars` : 'Rate Content'}</span>
                    </div>
                    <Button onClick={handleLogLearning} disabled={isLogging || rating === 0} className='w-full'>
                        {isLogging ? 'Logging...' : 'Log Learning & Submit Rating'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const TierReviewModal = ({ isVisible, onClose, tierId, planData }) => {
    if (!isVisible || !tierId) return null;
    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8">
                <h2 className='text-2xl font-extrabold text-[#002E47]'>Tier Review Mockup</h2>
                <p className='text-gray-600 mt-2'>This modal reviews progress for {LEADERSHIP_TIERS[tierId].name}.</p>
                <Button onClick={onClose} className='mt-8'>Close</Button>
            </div>
        </div>
    );
};


// --- Component 3: Roadmap Timeline View ---
const RoadmapTimeline = ({ data, currentMonth, navigateToMonth }) => {
    return (
        <Card title="24-Month Roadmap Timeline" icon={Trello} accent="PURPLE" className='lg:sticky lg:top-4 bg-white shadow-2xl border-l-4 border-[#7C3AED]'>
            <p className='text-sm text-gray-600 mb-4'>Review your full two-year journey. Click a month to review its content and reflection.</p>
            <div className='max-h-96 overflow-y-auto space-y-2 pr-2'>
                {data.plan.map(monthData => {
                    const isCurrent = monthData.month === currentMonth;
                    const isFuture = monthData.month > currentMonth; 
                    const isCompleted = monthData.status === 'Completed';

                    return (
                        <div key={monthData.month}
                             className={`p-3 rounded-lg border flex justify-between items-center transition-all cursor-pointer shadow-sm
                                         ${isCurrent ? 'bg-[#7C3AED]/20 border-[#7C3AED] font-extrabold' : isCompleted ? 'bg-[#47A88D]/10 border-[#47A88D]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                                         ${isFuture ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-100'}`
                             }
                             onClick={() => {
                                 if (!isFuture) navigateToMonth(monthData.month); // FIX: Ensure navigation only happens to past/current months
                             }}
                        >
                            <span className={`text-sm ${isCurrent ? 'text-[#7C3AED]' : 'text-[#002E47]'}`}>
                                **Month {monthData.month}**: {monthData.theme}
                            </span>
                            <span className="flex items-center space-x-1 text-xs">
                                <Check size={16} className={isCompleted ? 'text-green-600' : 'text-gray-400'} />
                                <span className={isCompleted ? 'text-green-600' : 'text-gray-400'}>
                                    {isCurrent ? 'CURRENT' : isCompleted ? 'COMPLETED' : isFuture ? 'FUTURE' : 'PENDING'}
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};


// --- Component 2: Tracker Dashboard View ---
const TrackerDashboardView = ({ data, updatePdpData, saveNewPlan, db, userId, navigate }) => {
    const [viewMonth, setViewMonth] = useState(data.currentMonth); 
    const currentMonth = data.currentMonth;
    
    const monthPlan = data.plan.find(m => m.month === viewMonth);
    const isCurrentView = viewMonth === currentMonth; 
    const isPastOrCurrent = viewMonth <= currentMonth; 
    
    const assessment = data.assessment;

    const [localReflection, setLocalReflection] = useState(monthPlan?.reflectionText || '');
    const [isSaving, setIsSaving] = useState(false);
    const [briefing, setBriefing] = useState(null); 
    const [briefingLoading, setBriefingLoading] = useState(false);

    const { callSecureGeminiAPI, hasGeminiKey } = useAppServices(data);

    const fetchMonthlyBriefing = useCallback(async (plan, assessment) => {
        if (briefingLoading || !hasGeminiKey() || !isCurrentView) return;

        setBriefingLoading(true);
        const currentTier = LEADERSHIP_TIERS[plan.tier];
        const rating = assessment.selfRatings[plan.tier];

        const systemPrompt = `You are a concise Executive Coach. Analyze the user's current PDP phase. Given their focus tier (${currentTier.name}) and their initial self-rating (${rating}/10), provide: 1) A 1-sentence **Executive Summary** of the goal. 2) A 1-sentence **Coaching Nudge** on how to prioritize the month's learning based on their skill gap. Use bold markdown for key phrases.`;

        const userQuery = `Generate a monthly briefing for the user's current focus: ${plan.theme}. Required content includes: ${plan.requiredContent.map(c => c.title).join(', ')}.`;

        try {
            // Mock API call returns fixed mock data from useAppServices
            const result = await callSecureGeminiAPI({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [{ role: "user", parts: [{ text: userQuery }] }] });
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            setBriefing(text);

        } catch (e) {
            console.error("AI Briefing Error:", e);
            setBriefing("AI coach unavailable. Focus on completing your required content first.");
        } finally {
            setBriefingLoading(false);
        }
    }, [briefingLoading, hasGeminiKey, callSecureGeminiAPI, isCurrentView]);


    useEffect(() => {
        if (monthPlan && assessment) {
            setLocalReflection(monthPlan.reflectionText || '');
            
            if (!isCurrentView && monthPlan.briefingText) {
                 setBriefing(monthPlan.briefingText);
            } else if (isCurrentView) {
                 fetchMonthlyBriefing(monthPlan, assessment); 
            } else {
                 setBriefing(`## Month ${viewMonth} Historical Briefing\n\n**Focus:** ${monthPlan.theme}\n\n*The full coaching brief was not saved for this historical month.*`);
            }
        }
    }, [monthPlan, assessment, fetchMonthlyBriefing, viewMonth, isCurrentView]);


    // --- Handlers (Advance, Reset, Toggle, Save) ---
    const handleCompleteMonth = async () => {
        setIsSaving(true);
        await updatePdpData(oldData => {
            const briefingToSave = briefing ? briefing.replace('## Monthly Executive Briefing', '## Saved Executive Briefing') : '';
            const updatedPlan = oldData.plan.map(m => 
                m.month === oldData.currentMonth ? { 
                    ...m, 
                    status: 'Completed', 
                    reflectionText: localReflection, 
                    monthCompletedDate: new Date().toISOString(),
                    briefingText: briefingToSave, 
                } : m
            );
            return { ...oldData, plan: updatedPlan, currentMonth: oldData.currentMonth + 1 };
        });
        setIsSaving(false);
    };

    const handleResetPlan = async () => {
        await updatePdpData(() => null); 
    };

    const handleContentStatusToggle = (contentId) => {
        if (!isCurrentView) return; 
        updatePdpData(oldData => {
            const updatedContent = monthPlan.requiredContent.map(item =>
                item.id === contentId ? { ...item, status: item.status === 'Completed' ? 'Pending' : 'Completed' } : item
            );
            const updatedPlan = oldData.plan.map(m =>
                m.month === currentMonth ? { ...m, requiredContent: updatedContent } : m
            );
            return { ...oldData, plan: updatedPlan };
        });
    };

    const handleOpenContentModal = (contentItem) => { /* ... */ };

    const handleSaveReflection = () => {
        if (!isCurrentView || localReflection === monthPlan?.reflectionText) return;

        setIsSaving(true);
        updatePdpData(oldData => {
            const updatedPlan = oldData.plan.map(m =>
                m.month === currentMonth ? { ...m, reflectionText: localReflection } : m
            );
            return { ...oldData, plan: updatedPlan };
        }).then(() => {
            setIsSaving(false);
        });
    };
    
    // --- Data Calculation (Ensuring safety for current/future/past logic) ---
    const currentTierId = monthPlan?.tier;
    const lowRatingFlag = currentTierId && assessment?.selfRatings?.[currentTierId] <= 4;
    const allContentCompleted = monthPlan?.requiredContent?.every(item => item.status === 'Completed');
    const isReadyToComplete = allContentCompleted && localReflection.length >= 50;
    const requiredContent = monthPlan?.requiredContent || [];
    // ... (Other calculations remain the same) ...
    const progressPercentage = 50; // Mock calculation
    const TierIcon = IconMap[LEADERSHIP_TIERS[currentTierId]?.icon || 'Target']; // Safe icon lookup
    const tierProgress = { overallPercentage: 50, completedContent: 2, totalContent: 4 }; // Mock data

    if (!monthPlan) {
        return (
            <div className="p-6 md:p-10 min-h-screen flex items-center justify-center">
                <p className="text-xl text-[#E04E1B] font-bold">Error: Plan data not found for Month {viewMonth}.</p>
            </div>
        );
    }
    

    return (
        <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.PURPLE+'30'}}>
                <Briefcase className='w-10 h-10' style={{color: COLORS.PURPLE}}/>
                <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>PDP Tracker Dashboard</h1>
            </div>

            {/* Progress Bar & Header */}
            <Card title={`Roadmap Progress: Month ${currentMonth} of 24`} icon={Clock} accent='NAVY' className="bg-[#002E47]/10 border-4 border-[#002E47]/20 mb-8">
                <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div
                        className="bg-[#47A88D] h-4 rounded-full transition-all duration-700"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
                <p className='text-sm font-medium text-[#002E47]'>
                    {Math.round(progressPercentage)}% Complete. Next Tier Focus in {4 - ((currentMonth - 1) % 4)} months.
                </p>
                <div className='flex space-x-4 mt-4'>
                    <Button onClick={handleResetPlan} variant='outline' className='text-xs px-4 py-2 text-[#E04E1B] border-[#E04E1B]/50 hover:bg-[#E04E1B]/10'>
                        Start Over / Re-Generate Plan
                    </Button>
                    <Button onClick={() => console.log('Share')} variant='outline' className='text-xs px-4 py-2 border-[#002E47] text-[#002E47] hover:bg-[#002E47]/10'>
                        <Link className="w-4 h-4 mr-1" /> Share Monthly Focus
                    </Button>
                </div>
            </Card>

            {/* Current Month Plan */}
            <div className='lg:grid lg:grid-cols-4 lg:gap-8'>
                
                <div className='lg:col-span-1 space-y-8 order-1'>
                    <RoadmapTimeline data={data} currentMonth={currentMonth} navigateToMonth={setViewMonth} />
                    
                    <Card title={`Tier Mastery Status (${currentTierId})`} icon={Star} accent='NAVY' className='bg-[#FCFCFA] border-l-4 border-[#002E47] text-center'>
                         <div className="relative w-32 h-32 mx-auto mb-4">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <path className="text-gray-300" fill="none" stroke="currentColor" strokeWidth="3.8" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                                <path className="text-[#47A88D]" fill="none" stroke="currentColor" strokeWidth="3.8" strokeDasharray={`${tierProgress.overallPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                            </svg>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                <span className="text-3xl font-extrabold text-[#002E47]">{tierProgress.overallPercentage}%</span>
                            </div>
                        </div>
                        <p className='text-md font-semibold text-[#002E47] mb-1'>{tierProgress.completedContent} / {tierProgress.totalContent} Content Items Completed</p>
                        <p className='text-xs text-gray-600'>For Tier: **{LEADERSHIP_TIERS[currentTierId]?.name}**</p>
                    </Card>

                </div>


                <div className='lg:col-span-3 space-y-8 order-2'>
                    
                    {/* VIEWING WARNINGS */}
                    {!isPastOrCurrent && (
                        <div className='p-4 rounded-xl bg-yellow-100 border-2 border-yellow-400 shadow-md text-yellow-800 font-semibold flex items-center gap-3'>
                            <AlertTriangle className='w-5 h-5'/> 
                            Viewing **Future Month {viewMonth}**. You must complete Month **{currentMonth}** before accessing this content. Content is read-only.
                        </div>
                    )}
                    {!isCurrentView && isPastOrCurrent && (
                        <div className='p-4 rounded-xl bg-gray-100 border-2 border-gray-400 shadow-md text-gray-800 font-semibold flex items-center gap-3'>
                            <Clock className='w-5 h-5'/> 
                            Viewing **Historical Month {viewMonth}**. Content and Reflection are read-only.
                        </div>
                    )}


                    <Card title={`Focus: ${monthPlan?.theme} (Month ${viewMonth})`} icon={TierIcon} accent='TEAL' className='border-l-8 border-[#47A88D]'>

                        {/* AI Monthly Briefing */}
                        <div className='mb-4 p-4 rounded-xl bg-[#002E47]/10 border border-[#002E47]/20'>
                            <h3 className='font-bold text-[#002E47] mb-1 flex items-center'><Activity className="w-4 h-4 mr-2 text-[#47A88D]" /> Monthly Executive Briefing</h3>
                            {briefingLoading ? (
                                <p className='text-sm text-gray-600 flex items-center'><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2 rounded-full"></div> Drafting advice...</p>
                            ) : (
                                <div className="prose max-w-none text-gray-700">
                                    <div dangerouslySetInnerHTML={{ __html: briefing }} />
                                </div>
                            )}
                        </div>
                        
                        {/* Status / Difficulty */}
                        <div className='mb-4 text-sm border-t pt-4'>
                            <p className='font-bold text-[#002E47]'>Tier: {LEADERSHIP_TIERS[currentTierId]?.name}</p>
                            <p className='text-gray-600'>Target Difficulty: **{assessment?.selfRatings?.[currentTierId] >= 8 ? 'Mastery' : assessment?.selfRatings?.[currentTierId] >= 5 ? 'Core' : 'Intro'}** (Self-Rating: {assessment?.selfRatings?.[currentTierId]}/10)</p>
                            {lowRatingFlag && (
                                <p className='font-semibold mt-1 flex items-center text-[#E04E1B]'>
                                    <AlertTriangle className='w-4 h-4 mr-1' /> HIGH RISK TIER: Prioritize Content Completion.
                                </p>
                            )}
                        </div>

                        <h3 className='text-xl font-bold text-[#002E47] border-t pt-4 mt-4'>Required Content Items (Lessons)</h3>
                        <div className='space-y-3 mt-4'>
                            {requiredContent.map(item => {
                                const isCompleted = item.status === 'Completed';
                                const [isToggling, setIsToggling] = useState(false);

                                const handleToggle = () => {
                                    if (!isCurrentView) return; 
                                    setIsToggling(true);
                                    handleContentStatusToggle(item.id);
                                    setTimeout(() => setIsToggling(false), 500); 
                                };

                                const actionButtonText = isPastOrCurrent ? ((item.type === 'Role-Play' || item.type === 'Exercise' || item.type === 'Tool') ? 'Go to Practice' : 'View Content') : 'View Content'; 

                                return (
                                    <div key={item.id} className='flex items-center justify-between p-3 bg-gray-50 rounded-xl shadow-sm'>
                                        <div className='flex flex-col'>
                                            <p className={`font-semibold text-sm ${isCompleted && isPastOrCurrent ? 'line-through text-gray-500' : 'text-[#002E47]'}`}>
                                                {item.title} ({item.type})
                                                {lowRatingFlag && <span className='ml-2 text-xs text-[#E04E1B] font-extrabold'>(CRITICAL)</span>}
                                            </p>
                                            <p className='text-xs text-gray-600'>~{item.duration} min | Difficulty: {item.difficulty}</p>
                                        </div>
                                        <div className='flex space-x-2'>
                                            <Button
                                                onClick={() => {
                                                    if (!isPastOrCurrent) { /* Only show modal for future */ } 
                                                    if (item.type === 'Role-Play' || item.type === 'Exercise' || item.type === 'Tool') {
                                                        navigate('daily-practice', { contentId: item.id, tier: item.tier });
                                                    } else {
                                                        console.log('Opening content modal');
                                                    }
                                                }}
                                                className='px-3 py-1 text-xs'
                                                variant='primary'
                                                disabled={!isPastOrCurrent}
                                            >
                                                {actionButtonText}
                                            </Button>

                                            <Button
                                                onClick={handleToggle}
                                                className={`px-3 py-1 text-xs transition-colors duration-300 ${isToggling ? 'opacity-50' : ''}`}
                                                variant={isCompleted ? 'secondary' : 'primary'}
                                                disabled={isSaving || isToggling || !isCurrentView}
                                            >
                                                {isToggling ? 'Updating...' : isCompleted ? 'Done ✓' : 'Mark Complete'}
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>

                    <Card title="Monthly Reflection" icon={Lightbulb} accent="NAVY" className='bg-[#002E47]/10 border-2 border-[#002E47]/20'>
                        <p className="text-gray-700 text-sm mb-4">
                            Reflect on the growth you achieved this month. How did the content impact your daily leadership behavior? (**Minimum 50 characters required**)
                        </p>
                        <textarea
                            value={localReflection} 
                            onChange={(e) => setLocalReflection(e.target.value)}
                            onBlur={handleSaveReflection} 
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-[#47A88D] focus:border-[#47A88D] h-40"
                            placeholder="My reflection (required)..."
                            readOnly={!isCurrentView}
                        ></textarea>
                        {isCurrentView && (
                            <div className='flex justify-between items-center mt-1'>
                                <p className={`text-xs ${localReflection.length < 50 ? 'text-[#E04E1B]' : 'text-[#47A88D]'}`}>
                                    {localReflection.length} / 50 characters written.
                                </p>
                                <span className={`text-xs font-semibold ${isSaving ? 'text-gray-500' : 'text-[#47A88D]'}`}>
                                    {isSaving ? 'Saving...' : 'Reflection ready'}
                                </span>
                            </div>
                        )}
                        {!isCurrentView && <p className='text-xs text-gray-500 mt-2'>Reflection is read-only for this month.</p>}
                    </Card>

                    {isCurrentView && (
                        <Card title="Recalibrate Skill Assessment" icon={Activity} accent='ORANGE' className='bg-[#E04E1B]/10 border-4 border-[#E04E1B]'>
                            <p className='text-sm text-gray-700 mb-4'>
                                Feel like you've mastered this tier? Re-run your initial **Self-Ratings** to check your progress and generate an **accelerated, revised roadmap** to match your new skill level.
                            </p>
                            <Button
                                onClick={() => handleResetPlan()} 
                                variant="secondary"
                                className='w-full bg-[#E04E1B] hover:bg-red-700'
                            >
                                <Target className='w-4 h-4 mr-2' /> Re-Run Assessment
                            </Button>
                        </Card>
                    )}
                    
                    {isCurrentView && (
                        <Card title="Advance Roadmap" icon={CornerRightUp} accent='TEAL' className='bg-[#47A88D]/10 border-4 border-[#47A88D]'>
                            <p className='text-sm text-gray-700 mb-4'>
                                Once all content and your reflection are complete, lock in your progress and move to **Month {currentMonth + 1}** of your plan.
                            </p>
                            <Button
                                onClick={handleCompleteMonth}
                                disabled={isSaving || !isReadyToComplete}
                                className='w-full bg-[#47A88D] hover:bg-[#349881]'
                            >
                                {isSaving ? 'Processing...' : `Complete Month ${currentMonth} and Advance`}
                            </Button>
                            {!allContentCompleted && (
                                <p className='text-[#E04E1B] text-xs mt-2'>* Finish all content items first.</p>
                            )}
                            {allContentCompleted && localReflection.length < 50 && (
                                <p className='text-[#E04E1B] text-xs mt-2'>* Reflection required (50 chars min).</p>
                            )}
                        </Card>
                    )}
                </div>
            </div>
            {/* --- Modals (omitted for brevity) --- */}
        </div>
    );
};


// --- Component 1: Plan Generator View ---
const PlanGeneratorView = ({ userId, saveNewPlan, isLoading, error, navigate, setGeneratedPlanData }) => {
    const [managerStatus, setManagerStatus] = useState(null); 
    const [goalPriorities, setGoalPriorities] = useState([]); 
    const [selfRatings, setSelfRatings] = useState({ T1: 5, T2: 5, T3: 5, T4: 5, T5: 5 }); 
    const [isGenerating, setIsGenerating] = useState(false);
    
    const isGoalLimitReached = goalPriorities.length >= 3;
    const isSelfRatingComplete = Object.keys(selfRatings).length === Object.keys(LEADERSHIP_TIERS).length;
    const canGenerate = managerStatus && goalPriorities.length > 0 && isSelfRatingComplete && !isGenerating;

    const handleGoalToggle = (tierId) => {
        setGoalPriorities(prev => {
            if (prev.includes(tierId)) {
                return prev.filter(id => id !== tierId);
            }
            if (isGoalLimitReached) {
                console.log("You can select a maximum of 3 goal priorities.");
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

        const assessment = { managerStatus, goalPriorities, selfRatings, menteeFeedback: { T4: { score: 65, comment: "Needs better follow-up after delegating tasks." } }, dateGenerated: new Date().toISOString() };
        await new Promise(r => setTimeout(r, 1500)); 

        const newPlanData = generatePlanData(assessment, userId);

        const generatedPlan = { userPlan: newPlanData, genericPlan: GENERIC_PLAN };

        const success = await saveNewPlan(newPlanData);
        
        setIsGenerating(false);

        if (success) {
            setGeneratedPlanData(generatedPlan);
        }
    };

    return (
        <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.PURPLE+'30'}}>
                <Briefcase className='w-10 h-10' style={{color: COLORS.PURPLE}}/>
                <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Personalized 24-Month Plan Generator</h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Answer a few questions about your current role and goals to instantly generate a hyper-personalized leadership roadmap designed to close your skill gaps over the next two years.</p>

            <div className="space-y-10">
                <Card title="1. Your Management Experience" icon={Users} accent='TEAL'>
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
                    {managerStatus === null && <p className='text-[#E04E1B] text-xs mt-2'>* Please select your management status.</p>}
                </Card>

                <Card title="2. Goal Priorities (Max 3)" icon={Target} accent='NAVY'>
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
                                    style={{ accentColor: COLORS.TEAL }}
                                />
                                <div>
                                    <p className="font-semibold text-[#002E47]">{tier.name}</p>
                                    <p className="text-xs text-gray-600">({tier.id})</p>
                                </div>
                            </label>
                        ))}
                    </div>
                    {goalPriorities.length === 0 && <p className='text-[#E04E1B] text-xs mt-2'>* Please select at least one goal priority.</p>}
                </Card>

                <Card title="3. Skill Gap Assessment (Self-Rating)" icon={BarChart3} accent='TEAL'>
                    <h3 className="text-md font-semibold text-gray-700 mb-6">Rate your current effectiveness (1 = Low, 10 = Mastery):</h3>
                    
                    <div className='grid grid-cols-1 gap-y-2 mb-4 text-xs font-bold text-gray-600'>
                        <div>Your Self-Rating</div>
                    </div>

                    {Object.values(LEADERSHIP_TIERS).map(tier => {
                        const selfRating = selfRatings[tier.id] || 5; // Default to 5 if not set
                        
                        const selfScoreColor = selfRating >= 8 ? COLORS.GREEN : selfRating <= 4 ? COLORS.RED : COLORS.AMBER;
                        
                        return (
                            <div key={tier.id} className="mb-6 border p-3 rounded-lg bg-gray-50">
                                <p className="font-semibold text-[#002E47] mb-2 flex items-center justify-between">
                                    <span>{tier.name}:</span>
                                </p>
                                <div className='grid grid-cols-1'>
                                    <div>
                                        <p className="font-semibold text-[#002E47] flex justify-between">
                                            <span className='text-sm text-gray-600'>Self-Rating:</span>
                                            <span className='text-xl font-extrabold' style={{ color: selfScoreColor }}>{selfRating}/10</span>
                                        </p>
                                        <input
                                            type="range"
                                            min="1" max="10"
                                            value={selfRating}
                                            onChange={(e) => handleRatingChange(tier.id, e.target.value)}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                                            style={{ accentColor: selfScoreColor }}
                                        />
                                    </div>
                                </div>
                                <p className='text-xs text-gray-500 mt-2'>*Low scores (4 or less) will prioritize **Intro** content to build foundational skills quickly.</p>
                            </div>
                        );
                    })}
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

// --- Plan Review Screen ---
const PlanReviewScreen = ({ generatedPlan, navigate, clearReviewData }) => {
    if (!generatedPlan) return null;

    const userPlan = generatedPlan.userPlan;
    const genericPlan = generatedPlan.genericPlan;

    const userTotalDuration = userPlan.plan.reduce((sum, m) => sum + m.totalDuration, 0);
    const userIntroContent = userPlan.plan.flatMap(m => m.requiredContent).filter(c => c.difficulty === 'Intro').length;
    const userMasteryContent = userPlan.plan.flatMap(m => m.requiredContent).filter(c => c.difficulty === 'Mastery').length;

    const durationDifference = genericPlan.totalDuration - userTotalDuration;
    const introDifference = genericPlan.avgIntroContent - userIntroContent;
    const masteryDifference = userMasteryContent - genericPlan.avgMasteryContent;

    const StatItem = ({ label, value, diff, unit = '', isPositiveBetter = true }) => {
        const isGood = isPositiveBetter ? diff > 0 : diff < 0;
        const diffColor = diff === 0 ? COLORS.MUTED : isGood ? COLORS.GREEN : COLORS.RED;
        const diffSign = diff > 0 ? '+' : '';
        return (
            <div className='flex justify-between items-center py-2 border-b border-gray-200'>
                <span className='font-semibold'>{label}:</span>
                <div className='text-right'>
                    <span className={`font-bold text-lg mr-2`} style={{color: COLORS.NAVY}}>{value} {unit}</span>
                    <span className={`text-xs font-semibold`} style={{ color: diffColor }}>({diffSign}{diff} {unit})</span>
                </div>
            </div>
        );
    };
    
    const handleFinalize = async () => {
        console.log("Plan review complete. Finalizing plan and redirecting to Dashboard...");
        clearReviewData(); 
        navigate('prof-dev-plan'); 
    };
    
    const handleStartOver = () => {
        clearReviewData(); 
    };

    return (
        <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
            <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.GREEN+'30'}}>
                <CheckCircle className='w-10 h-10' style={{color: COLORS.GREEN}}/>
                <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Plan Successfully Generated!</h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl">Review your personalized plan highlights below. Your full 24-month roadmap has been created and is ready to view in the Tracker Dashboard.</p>

            <Card title="Plan Comparison: Personalized vs. Generic" icon={Activity} accent='TEAL' className='mt-8 border-l-4 border-[#47A88D] bg-[#47A88D]/10'>
                <p className='text-lg font-extrabold text-[#002E47] mb-4'>Your Plan is Highly Optimized!</p>
                <div className='space-y-1 text-sm text-gray-700'>
                    <StatItem 
                        label="Total Estimated Time" 
                        value={userTotalDuration} 
                        unit="min" 
                        diff={durationDifference} 
                        isPositiveBetter={false} 
                    />
                    <StatItem 
                        label="Mastery Content (High Skill)" 
                        value={userMasteryContent} 
                        unit="items" 
                        diff={masteryDifference} 
                        isPositiveBetter={true} 
                    />
                    <StatItem 
                        label="Introductory Content (Low Skill)" 
                        value={userIntroContent} 
                        unit="items" 
                        diff={introDifference} 
                        isPositiveBetter={false}
                    />
                </div>
                <p className='text-xs text-gray-600 mt-4 italic'>
                    *The AI tailored your content difficulty and sequence based on your specific Tiers and self-rated skill gaps.
                </p>
                
                <div className='flex justify-between space-x-4 mt-6'>
                    <Button onClick={handleStartOver} variant='outline' className='text-xs px-4 py-2 text-[#E04E1B] border-[#E04E1B]/50 hover:bg-[#E04E1B]/10'>
                        <X className='w-4 h-4 mr-1'/> Start Over / Re-Generate
                    </Button>
                    <Button onClick={handleFinalize} variant='primary'>
                        <CornerRightUp className='w-4 h-4 mr-1'/> Go to Tracker Dashboard
                    </Button>
                </div>
            </Card>
        </div>
    );
};


// --- Main Router (Enhanced with internal state) ---
export const ProfDevPlanScreen = () => {
    const [localPdpData, setLocalPdpData] = useState(null); 
    const [generatedPlanData, setGeneratedPlanData] = useState(null); 
    
    const services = useAppServices(localPdpData, setLocalPdpData);
    const { pdpData, isLoading, error, userId, navigate, updatePdpData, saveNewPlan } = services;

    const clearReviewData = useCallback(() => {
        setGeneratedPlanData(null);
    }, []);

    // Determine current view state (The Core Routing Logic)
    let currentView = 'loading';
    if (isLoading || pdpData === undefined) {
        currentView = 'loading';
    } else if (error) {
        currentView = 'error';
    } else if (generatedPlanData) {
        currentView = 'review';
    } else if (pdpData === null) { 
        currentView = 'generator';
    } else { // pdpData is an object (plan exists)
        currentView = 'tracker';
    }

    if (currentView === 'loading') { 
        return (
            <div className="p-8 min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#47A88D] mb-3"></div>
                    <p className="text-[#47A88D] font-medium">Loading Personalized Development Plan...</p>
                </div>
            </div>
        );
    }
    if (currentView === 'error') { return React.createElement('div', null, 'Error...'); }
    if (currentView === 'review') { return <PlanReviewScreen generatedPlan={generatedPlanData} navigate={navigate} clearReviewData={clearReviewData} />; }
    if (currentView === 'generator') { return <PlanGeneratorView userId={userId} saveNewPlan={saveNewPlan} isLoading={false} error={null} navigate={navigate} setGeneratedPlanData={setGeneratedPlanData} />; }

    // currentView === 'tracker'
    const trackerProps = { data: pdpData, updatePdpData, saveNewPlan, userId, navigate };
    return <TrackerDashboardView {...trackerProps} />;
};

export default ProfDevPlanScreen;