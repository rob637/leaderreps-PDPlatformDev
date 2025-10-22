// src/components/screens/DevPlan.jsx

import { Home, Settings, Zap, Clock, Briefcase, Mic, Trello, BookOpen, BarChart3, TrendingUp, TrendingDown, CheckCircle, Star, Target, Users, HeartPulse, CornerRightUp, X, ArrowLeft, Activity, Link, Lightbulb, AlertTriangle, Eye, PlusCircle, Cpu, MessageSquare, Check, Calendar } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';

// NOTE: In a production environment, this file must use the 'useAppServices' 
// from your actual services directory, which handles Firebase/API connections.
// The code below simulates the structure and flow expected by the router.

// --- SERVICES (production) ---
import { useAppServices } from '../../services/useAppServices.jsx';

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
    Zap: Zap, Users: Users, Briefcase: Briefcase, Target: Target, BarChart3: BarChart3, Clock: Clock, Eye: Eye, BookOpen: BookOpen, Lightbulb: Lightbulb, X: X, ArrowLeft: ArrowLeft, CornerRightUp: CornerRightUp, AlertTriangle: AlertTriangle, CheckCircle: CheckCircle, PlusCircle: PlusCircle, HeartPulse: HeartPulse, TrendingUp: TrendingUp, TrendingDown: TrendingDown, Activity: Activity, Link: Link, Cpu: Cpu, Star: Star, Mic: Mic, Trello: Trello, Settings: Settings, Home: Home, MessageSquare: MessageSquare, Check: Check, Calendar: Calendar
};


const PDP_COLLECTION = 'leadership_plan';
const PDP_DOCUMENT = 'roadmap';
const appId = 'default-app-id'; // Mock value for app id

// --- PDP Content Model ---
const LEADERSHIP_TIERS = {
    T1: { id: 'T1', name: 'Lead Self & Mindsets', icon: 'HeartPulse', color: 'indigo-500' },
    T2: { id: 'T2', name: 'Lead Work & Execution', icon: 'Briefcase', color: 'green-600' },
    T3: { id: 'T3', name: 'Lead People & Coaching', icon: 'Users', color: 'yellow-600' },
    T4: { id: 'T4', name: 'Conflict & Team Health', icon: 'AlertTriangle', color: 'red-640' }, // Adjusted from red-600 to match red-640 mock 
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
        if (skill === 'V-B Trust') focus = "the essential role of vulnerability in rapidly building team trust.";
        if (skill === 'Goals') focus = "the necessity of shifting focus from easy-to-track activities to hard-to-measure outcomes for executive clarity.";
        if (skill === 'Decisions') focus = "when and how to deploy the **DICE** (Depth, Identity, Commitment, Execution) decision-making model for high-stakes projects.";
        if (skill === 'Recognition') focus = "the principles of psychological safety and how specific recognition fuels intrinsic motivation over extrinsic reward.";
        if (skill === 'Coaching') focus = "adopting the non-directive stance: asking powerful questions rather than prescribing solutions to foster ownership.";
        if (skill === 'Conflict') focus = "the strategic necessity of allowing productive conflict to surface for the long-term health and innovation of the team.";
        if (skill === 'Commitment') focus = "the difference between mere **compliance** (which is fragile) and **consensual commitment** (which is resilient) within a peer group.";
        if (skill === 'Accountability') focus = "the inextricable link between the trust (Vulnerability-Based) and accountability (Ownership) that defines high-performing teams.";
        if (skill === 'Strategic') focus = "the methods for aligning all departmental activities to a core strategic mission, focusing on cascading goals downwards.";
        if (skill === 'Planning') focus = "best practices for long-range strategic planning, ensuring resources are aligned with visionary goals 3-5 years out.";
        if (skill === 'Identity') focus = "the psychological traps of the 'Hero' identity and how it hinders team development and succession planning.";

        return `
            ## Reading: ${title} (Time Commitment: ~30-40 min)
            
            ### Primary Focus: ${skill} Theory
            
            **Learning Goal:** Understand the foundational **${skill}** theory and its impact on team trust.
            
            This module provides the philosophical and psychological context for your leadership actions. ${title} is critical for establishing a sustainable leadership model, emphasizing **${focus}**.
            
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
        
        if (skill === 'Shift to Coach') {
            deliverable = "A written **Player-to-Coach** script for your next delegation moment.";
        } else if (skill === 'Motive') {
            deliverable = "A journal entry detailing the core motive and anticipated reward for your next major project.";
        } else if (skill === 'V-B Trust') {
             deliverable = "A list of 3 small, safe professional vulnerabilities to share with your team this week.";
        } else if (skill === 'Boss') {
             deliverable = "A 5-point action plan for improving alignment with your manager’s priorities.";
        } else if (skill === 'Goals') {
            deliverable = "A finalized set of 3 quarterly OKRs, each linked to a specific key result and prioritization tier.";
        } else if (skill === 'Expectations') {
             deliverable = "A completed Stakeholder Expectation Map for your current project, identifying 5 unstated assumptions.";
        } else if (skill === 'Delegation') {
             deliverable = "The **Delegation Matrix** filled out for your highest priority task this week.";
        } else if (skill === 'Meetings') {
             deliverable = "A new 3-point agenda focused purely on achieving one decision in your next team meeting.";
        } else if (skill === 'Recognition') {
             deliverable = "A customized recognition strategy for your most recent high-performer, tailored to their intrinsic motivation.";
        } else if (skill === 'Feedback') {
             deliverable = "A 3-part script for delivering **Radical Candor** feedback to a direct report, balancing challenge and care.";
        } else if (skill === 'Conflict') {
            deliverable = "A completed Conflict Management Style assessment and strategy guide.";
        } else if (skill === 'Crucial') {
             deliverable = "A clear script using the **STATE** framework to address an ongoing team conflict.";
        } else if (skill === 'Planning') {
             deliverable = "The 'Strategic Pillars' defined for your department's next annual cycle.";
        } else if (skill === 'Strategic') {
             deliverable = "A completed **Scenario Planning** analysis for three market disruptions.";
        } else if (skill === 'Accountability') {
            deliverable = "A formalized **Peer Accountability Implementation** plan for a cross-functional team meeting.";
        } else if (skill === 'Ownership') {
            deliverable = "A completed **Accountability Audit** scorecard for a recently missed deadline.";
        }

        return `
            ## Guided Practice: ${title} (Time Commitment: ~30-45 min)
            
            ### Action Focus: ${skill}
            
            This is a structured, private drafting activity designed to solidify abstract concepts into personal behaviors. The output is a personalized artifact ready for implementation.
            
            * **Weekly Focus:** Convert one reactive habit into a proactive coaching behavior.
            * **Actionable Deliverable:** **${deliverable}**
            * **Required Time:** 45 minutes of uninterrupted focus.
        `;
    },

    // ----------------------------------------------------
    // TYPE: ROLE-PLAY (Focus: High-Stakes Behavioral Practice)
    // ----------------------------------------------------
    'Role-Play': (title, skill) => {
        let method = "SBI (Situation-Behavior-Impact) feedback model";
        let context = "a difficult performance conversation";
        if (skill === 'Shift to Coach') context = "delegating a complex, high-stakes task using the Player-to-Coach model.";
        if (skill === 'Boss') context = "a high-stakes conversation with your manager where you must deliver unexpected bad news regarding a project deadline.";
        if (skill === 'Delegation') context = "delegating a creative but non-critical task to an unmotivated team member, focusing on inspiring buy-in.";
        if (skill === 'Goals') context = "challenging a senior peer's vague quarterly objective to ensure cross-functional alignment.";
        if (skill === 'Coaching') context = "a formal coaching session using the **GROW** (Goal, Reality, Options, Will) model to help a direct report overcome a career block.";
        if (skill === 'Feedback') context = "receiving and processing tough, critical feedback from your manager or a peer without becoming defensive.";
        if (skill === 'Crucial') context = "mediating an emotional dispute between two high-performing subordinates.";
        if (skill === 'Ownership') context = "a meeting where you must shut down excuses and reinforce strict ownership over a failed initiative.";

        return `
            ## Practice Simulation: ${title} (Time Commitment: ~45-60 min)
            
            ### Behavioral Focus: ${skill}
            
            This is a high-impact preparation module for the Coaching Lab, simulating **${context}**. The goal is to successfully navigate high-stakes moments.
            
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
        let scenario = "a cross-functional accountability crisis where metrics were misunderstood.";
        
        if (skill === 'Ownership') {
             scenario = "a failed project where every team member blames external factors. Your task is to re-establish a culture of accountability.";
             goal = "diagnose the root cause of systemic low-trust and draft a vulnerability-based repair plan.";
        } else if (skill === 'Identity') {
             scenario = "a star performer who struggles to transition into a management role, leading to high team turnover.";
             goal = "analyze the conflict between the 'doer' identity and the 'leader' identity, drafting a personal intervention plan.";
        } else if (skill === 'Shift to Coach') {
             scenario = "a failure due to your own over-involvement in a delegated task.";
             goal = "pinpoint the moment you shifted from coach to player and what the structural cost was.";
        } else if (skill === 'Metrics') {
            scenario = "a severe misallocation of resources after reporting vanity metrics instead of core leading indicators.";
            goal = "evaluate the metrics failure, drafting a new dashboard based on leading indicators only.";
        } else if (skill === 'Decisions') {
            scenario = "a critical error made by a junior leader using the wrong problem-solving framework under pressure.";
            goal = "evaluate decision-making under uncertainty, applying the problem-solving framework correctly.";
        } else if (skill === 'Meetings') {
            scenario = "a project delay caused by a series of unproductive, aimless team meetings.";
            goal = "perform a post-mortem on the meeting failure and redesign the decision process for the next phase.";
        } else if (skill === 'Motivation') {
             scenario = "a high-performing, high-paid team that exhibits low intrinsic motivation and low engagement scores.";
             goal = "diagnose the root cause of the motivation failure and draft an engagement plan focused on autonomy and purpose.";
        } else if (skill === '1:1s') {
             scenario = "a critical performance intervention that failed because the manager only used the 1:1 format for bad news.";
             goal = "re-engineer the 1:1 system to balance performance review with coaching and development.";
        } else if (skill === 'Coaching') {
             scenario = "a team member whose performance is stable but refuses to engage in future-oriented coaching discussions.";
             goal = "diagnose why coaching fails to motivate and craft a personalized motivational strategy.";
        } else if (skill === 'Commitment') {
             scenario = "a scenario where the team verbally agreed to a plan but failed to execute due to passive resistance and ambiguity.";
             goal = "analyze the failure to commit, identifying where consensus broke down.";
        } else if (skill === 'Conflict') {
             scenario = "an ongoing, corrosive personality clash between two key players that is paralyzing cross-functional work.";
             goal = "mediate the conflict, applying the principles of productive conflict to re-align their goals.";
        } else if (skill === 'Planning') {
             scenario = "a dramatic resource allocation failure stemming from poor long-range planning and a focus on short-term gains.";
             goal = "identify the long-term planning flaws and propose a new capital allocation model.";
        } else if (skill === 'Vision') {
             scenario = "a scenario where a sudden market event requires immediate, decisive communication to re-assure stakeholders of the long-term vision.";
             goal = "craft a powerful, values-driven message to stabilize the team and re-align priorities in crisis.";
        } else if (skill === 'Expectations') {
             scenario = "a project that failed due to unspoken, misaligned expectations between two key departments.";
             goal = "use the stakeholder mapping framework to identify and resolve the unspoken expectation failure.";
        } else if (skill === 'Trust') {
            scenario = "a scenario where a manager must repair team trust after a major ethical lapse by a leadership peer.";
            goal = "develop and execute a public plan to repair vulnerability-based trust with the team.";
        }
        
        return `
            ## Executive Analysis: ${title} (Time Commitment: ~45-60 min)
            
            ### Application Focus: ${skill}
            
            Review the provided scenario outlining **${scenario}**. This module is designed to **${goal}**.
            
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
        let outcome = "reducing reliance on manual effort and intuition.";

        if (skill === 'Identity') {
             integration = "establish a formalized **Leadership Identity Statement (LIS)**";
             outcome = "provide a stable, consistent foundation for your decision-making and delegation.";
        } else if (skill === 'Metrics') {
             integration = "set up a dashboard to track **leading indicators** only";
             outcome = "ensure your team is focused on future-looking actions, not historical results.";
        } else if (skill === 'Meetings') {
             integration = "implement the **Decision-Focused Agenda** template";
             outcome = "ensure every meeting ends with a clear decision or an assigned owner for the next step.";
        } else if (skill === 'Delegation') {
             integration = "use the **Delegation Audit & Follow-up Checklist**";
             outcome = "ensure complete clarity on delegated authority and follow-up cadence, eliminating accidental 'player' behaviors.";
        } else if (skill === 'Motivation') {
             integration = "use the **Motivation Diagnostic Checklist**";
             outcome = "help you quickly pinpoint whether motivation issues stem from competence, clarity, or context.";
        } else if (skill === '1:1s') {
             integration = "implement the **Coaching-First 1:1 Structure**";
             outcome = "shift the burden of the conversation onto the direct report, fostering ownership and development.";
        } else if (skill === 'Commitment') {
             integration = "implement the **Consensual Commitment Framework**";
             outcome = "ensure full buy-in on all major decisions, significantly reducing implementation risk.";
        } else if (skill === 'Trust') {
             integration = "run the **Trust Builder Team Exercise**";
             outcome = "surface hidden resentments and vulnerabilities in a controlled, psychological safe environment.";
        } else if (skill === 'Strategic') {
             integration = "conduct a **Pre-Mortem Risk Audit**";
             outcome = "proactively identify major, unforeseen failure points in your strategy by assuming the project has already failed.";
        } else if (skill === 'Vision') {
             integration = "use the **Vision Alignment Diagnostic**";
             outcome = "audit whether every task in the department directly contributes to the 5-year vision.";
        } else if (skill === 'Ownership') {
            integration = "implement the **Accountability Scorecard**";
            outcome = "quantify and track individual team accountability for key initiatives.";
        } else if (skill === 'Conflict') {
            integration = "use the **Conflict Management Style Quiz**";
            outcome = "determine the conflict styles of team members for better mediation strategies.";
        }
        
        return `
            ## Tool Implementation: ${title} (Time Commitment: ~30-40 min)
            
            ### Implementation Goal: Systematize ${skill}
            
            This module delivers a framework (e.g., RACI Matrix, LIS, Pre-Mortum Audit) for immediate use in your role. The objective is to **${integration}** into your weekly workflow, **${outcome}**.
            
            * **Weekly Focus:** Customize the template for your current team/project and define clear ownership.
            * **Actionable Deliverable:** The completed **${skill}** tool/framework used once in a real meeting or delegation process this week for full completion credit.
            * **System:** Downloadable checklist/template included (e.g., Delegation Matrix).
        `;
    },
    
    // ----------------------------------------------------
    // TYPE: Video (MOCK - Assuming external platform links)
    // ----------------------------------------------------
    'Video': (title, skill) => {
        let callToAction = "This video provides a tactical breakdown of how executive behavior drives team culture.";
        if (skill === 'Shift to Coach') callToAction = "Watch the breakdown of the 'Player' vs. 'Coach' mindset and how to effectively transition your behavior.";
        if (skill === 'Goals') callToAction = "Watch this lesson on the difference between vanity metrics and true executive outcomes.";
        if (skill === 'Decisions') callToAction = "This video breaks down a simple, repeatable framework for complex, high-stakes decision-making.";
        if (skill === 'Conflict') callToAction = "View the key principles for managing productive conflict and when to intervene in team disputes.";
        if (skill === 'Vision') callToAction = "Learn how to use narrative storytelling to communicate and reinforce the long-term vision to large organizations.";
        
        return `
            ## Executive Briefing: ${title} (Time Commitment: ~8-15 min)
            
            ### Delivery Format: Video Lesson
            
            ${callToAction} This content is designed to be concise and immediately actionable. Focus on modeling the observed behavior immediately.
            
            * **Weekly Focus:** Observe a specific behavior demonstrated in the video and attempt to replicate it twice this week.
            * **Actionable Deliverable:** A single note in your PDP journal capturing the one key takeaway phrase or framework.
        `;
    },
    
    // ----------------------------------------------------
    // TYPE: 1:1 Session (MOCK - Simulating human interaction)
    // ----------------------------------------------------
    '1:1 Session': (title, skill) => {
        let focus = "real-time application of a coaching model";
        if (skill === 'Boss') focus = "reviewing your **Managing Upward Matrix** for blind spots and priority alignment with your executive manager.";
        if (skill === 'Planning') focus = "a critical 60-minute review of your **Legacy Definition** and five-year strategic impact.";
        if (skill === 'Conflict') focus = "live, mentored role-playing of a crucial conversation you need to have this week.";
        
        return `
            ## Mentored Session: ${title} (Time Commitment: 30-60 min)
            
            ### Engagement Focus: ${skill} (Live Coaching)
            
            This module schedules a direct, protected interaction with your assigned LeaderReps Executive Coach. The session is dedicated to **${focus}**.
            
            * **Preparation Requirement:** You must bring a specific, real-world case, scenario, or artifact (e.g., a process document or a reflection note) for the discussion.
            * **Actionable Deliverable:** Completion of the live session is required. The coach will provide a formal post-session summary that is automatically logged.
        `;
    },
    
    // ----------------------------------------------------
    // TYPE: Coaching (MOCK - Simulating AI/Chat interaction)
    // ----------------------------------------------------
    'Coaching': (title, skill) => {
        let outcome = "immediate, personalized feedback on a drafted script or planned action.";
        if (skill === 'Feedback') outcome = "practice delivering feedback (Radical Candor model) and receive immediate AI-driven feedback on tone and specificity.";
        if (skill === 'Coaching') outcome = "use the AI to guide you through the GROW model, ensuring your questions are non-directive and outcome-focused.";
        if (skill === 'Motive') outcome = "challenge your 'Why' statement against a scenario where purpose and profit are in direct conflict.";
        
        return `
            ## AI Coaching Lab: ${title} (Time Commitment: ~15-20 min)
            
            ### Interactive Focus: ${skill} (Tactical Feedback)
            
            This is a private, iterative coaching environment. You will be asked to input a scenario or script (e.g., delegation instructions, feedback delivery) to receive **${outcome}**.
            
            * **Tool:** Use the Coaching Lab screen to submit your script.
            * **Actionable Deliverable:** Generate and save a final, approved script for immediate use.
        `;
    },
};


const MOCK_CONTENT_DETAILS_VIDEO = {
    // A video placeholder function, ensuring it aligns with the updated mock details structure
    'Video': MOCK_CONTENT_DETAILS.Video,
    '1:1 Session': MOCK_CONTENT_DETAILS['1:1 Session'],
    'Coaching': MOCK_CONTENT_DETAILS.Coaching,
    'Reading': MOCK_CONTENT_DETAILS.Reading,
    'Exercise': MOCK_CONTENT_DETAILS.Exercise,
    'Role-Play': MOCK_CONTENT_DETAILS['Role-Play'],
    'Case Study': MOCK_CONTENT_DETAILS['Case Study'],
    'Tool': MOCK_CONTENT_DETAILS.Tool,
};


const MOCK_CONTENT_DETAILS_FINAL = { ...MOCK_CONTENT_DETAILS, ...MOCK_CONTENT_DETAILS_VIDEO };


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

// NEW/UPDATED CRITICAL FUNCTION: generatePlanData now applies dynamic duration and density based on assessment.
const generatePlanData = (assessment, ownerUid) => {
    const { managerStatus, goalPriorities, selfRatings, menteeFeedback } = assessment;
    const allTiers = Object.keys(LEADERSHIP_TIERS);

    // --- 1. CALCULATE MONTHLY TIER ASSIGNMENT (Dynamic Duration) ---
    const calculateTierMonths = (ratings) => {
        let monthsMap = {};
        const tiers = Object.keys(ratings);
        // Calculate Inverse Score: High score means low need (1 point), low score means high need (10 points).
        let totalInverseScore = tiers.reduce((sum, t) => sum + (11 - ratings[t]), 0); 
        if (totalInverseScore === 0) totalInverseScore = 55; // Safety check

        let currentMonth = 0;
        // Base allocation: minimum 2 months per tier for review/maintenance
        tiers.forEach(t => monthsMap[t] = 2); 
        let remainingSlots = 24 - (tiers.length * 2); // 24 - 10 = 14 slots left

        // Distribute remaining slots based on proportional inverse score
        for (const tier of tiers) {
            const inverseScore = 11 - ratings[tier];
            // Proportional slots ensures the "weakest" tiers get the bulk of the extra time
            const proportionalSlots = Math.round(remainingSlots * (inverseScore / totalInverseScore));
            monthsMap[tier] += proportionalSlots;
        }
        
        // Final balance adjustment to ensure total is exactly 24 (due to rounding)
        const currentTotal = tiers.reduce((sum, t) => sum + monthsMap[t], 0);
        let difference = 24 - currentTotal;
        
        // Distribute or subtract the difference to the most deserving tiers (lowest rated/highest rated)
        const sortedTiersByRating = tiers.sort((a, b) => ratings[a] - ratings[b]); // Ascending: Weakest first
        
        let i = 0;
        while (difference !== 0) {
            const tier = difference > 0 
                ? sortedTiersByRating[i % tiers.length]   // Add months to the weakest tiers
                : sortedTiersByRating.slice().reverse()[i % tiers.length]; // Subtract from the strongest tiers (highest index)
            
            if (difference > 0) {
                monthsMap[tier]++;
                difference--;
            } else if (monthsMap[tier] > 2) { // Ensure minimum of 2 months is maintained
                monthsMap[tier]--;
                difference++;
            }
            i++;
        }
        
        return monthsMap;
    };
    
    const tierMonths = calculateTierMonths(selfRatings); 

    // --- 2. BUILD PRIORITY ROTATION QUEUE (Order of Tiers) ---
    
    // Sort tiers by lowest rating first (high priority), then apply goal priorities at the front
    const sortedTiersByRating = allTiers.sort((a, b) => selfRatings[a] - selfRatings[b]); 
    
    // 1. Weakest Tiers
    const highPriorityTiers = sortedTiersByRating.filter(t => selfRatings[t] <= 4);
    
    // 2. User Goal Tiers (if not already high priority)
    const goalPriorityTiers = goalPriorities.filter(t => !highPriorityTiers.includes(t));
    
    // 3. Remaining Tiers (Core/Strong)
    const remainingTiers = sortedTiersByRating.filter(t => !highPriorityTiers.includes(t) && !goalPriorities.includes(t));

    // Define the core rotation order
    const rotationOrder = [...highPriorityTiers, ...goalPriorityTiers, ...remainingTiers];
    
    // Fill the 24 slots using the prioritized rotation order and the calculated durations
    const monthlyTierAssignment = [];
    const monthsRemainingInTier = { ...tierMonths };
    
    for (let i = 0; i < 24; i++) {
        // Find the next tier in the prioritized rotation that still has months remaining
        const nextTier = rotationOrder.find(t => monthsRemainingInTier[t] > 0);
        
        if (nextTier) {
            monthlyTierAssignment.push(nextTier);
            monthsRemainingInTier[nextTier]--;
        } else {
            // Fallback (Should be rare due to balancing logic)
            monthlyTierAssignment.push(allTiers[i % allTiers.length]);
        }
    }
    
    // --- 3. CORE 24-MONTH PLAN GENERATION (Dynamic Content Density) ---
    const plan = [];
    const usedContentIds = new Set();
    
    const getDynamicMaxContent = (rating) => {
        if (rating <= 4) return 6;    // Weak: Max 6 items (High Density/Investment)
        if (rating <= 7) return 4;    // Core: Max 4 items (Standard Density)
        return 3;                     // Strong: Max 3 items (Maintenance/Review)
    };
    
    for (let month = 1; month <= 24; month++) {
        const currentTier = monthlyTierAssignment[month - 1];
        const tierMeta = LEADERSHIP_TIERS[currentTier];
        const theme = `Strategic Focus: ${tierMeta.name}`;

        const rating = selfRatings[currentTier] || 5; 
        const targetDifficulty = getTargetDifficulty(rating);
        const maxContent = getDynamicMaxContent(rating); // Dynamic volume
        
        // Filter content based on Tier, Difficulty, and ensure no repetition
        const requiredContent = [];
        const contentPool = CONTENT_LIBRARY.filter(item =>
            item.tier === currentTier && item.difficulty === targetDifficulty && !usedContentIds.has(item.id)
        );

        // Pull dynamic number of items (up to maxContent)
        let count = 0;
        for (const item of contentPool) {
            if (count < maxContent) {
                requiredContent.push({
                    ...item,
                    duration: adjustDuration(rating, item.duration),
                    status: 'Pending',
                });
                usedContentIds.add(item.id);
                count++;
            }
        }
        
        // Fallback: If pool is exhausted for the ideal difficulty, use any remaining content
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
            // CRITICAL FIX: Add a placeholder for briefingText to prevent runtime errors in useEffect logic for future/past months
            briefingText: '', 
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
    
    // FIX 1: Removed unused state and moved it outside of rendering logic
    const [htmlContent, setHtmlContent] = useState('');
    const [rating, setRating] = useState(0); 
    const [isLogging, setIsLogging] = useState(false);
    
    // Find the full content details from the CONTENT_LIBRARY based on the requiredContent item
    const fullContentItem = CONTENT_LIBRARY.find(item => item.id === content.id && item.tier === content.tier);
    
    // CRITICAL FIX: Use the final mock content details object
    const mockDetail = fullContentItem && MOCK_CONTENT_DETAILS_FINAL[fullContentItem.type]
        ? MOCK_CONTENT_DETAILS_FINAL[fullContentItem.type](fullContentItem.title, fullContentItem.skill)
        : `## Content Unavailable\n\nNo detailed content available for **${content.title}** (Type: ${content.type}).`;

    // FIX 2: Use useMemo to prevent re-generation of the mockDetail and pass mockDetail as a dependency to useEffect
    const memoizedMockDetail = useMemo(() => mockDetail, [content.id, content.tier, content.title, content.skill]); 

    // FIX 3 (CRITICAL): Use useEffect to run the async conversion safely, setting the dependency array correctly. This prevents the Error #310 loop.
    useEffect(() => {
        let isCancelled = false;
        setHtmlContent(''); // Clear content while fetching
        setRating(0); // Reset rating

        (async () => {
            // FIX 4: Correctly call mdToHtml with the memoized detail string
            const html = await mdToHtml(memoizedMockDetail);
            if (!isCancelled) {
                setHtmlContent(html);
            }
        })();

        return () => {
            isCancelled = true;
        };
    }, [memoizedMockDetail]); // Depend only on the memoized detail string
    
    const handleLogLearning = async () => {
        if (rating === 0) { console.log('Please provide a 5-star rating before logging.'); return; }
        setIsLogging(true);
        console.log(`Mock: Logging learning for ${content.title} with rating ${rating}/5.`);
        await new Promise(r => setTimeout(r, 800));
        console.log(`Learning logged! Your ${rating}/5 rating will influence future plan revisions.`);
        // NOTE: In a real app, you would dispatch a data update here.
        setIsLogging(false);
        onClose();
    };
    
    // Safety check for tier data
    const tierData = LEADERSHIP_TIERS[content.tier] || { name: 'Unknown Tier' };

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
                    <p className="text-gray-700 font-semibold">Tier: <span className='text-[#002E47]'>{tierData.name}</span></p>
                    <p className="text-gray-700 font-semibold">Skill Focus: <span className='text-[#002E47]'>{content.skill}</span></p>
                    <p className="text-gray-700 font-semibold">Est. Duration: <span className='text-[#002E47]'>{content.duration} min</span></p>
                </div>
                <div className="prose max-w-none text-gray-700">
                    {htmlContent ? (
                        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    ) : (
                        <p className='text-gray-500 flex items-center'>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                            Loading content details...
                        </p>
                    )}
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
const RoadmapTimeline = ({ data, currentMonth, navigateToMonth, viewMonth }) => {
    return (
        <Card title="24-Month Roadmap Timeline" icon={Trello} accent="PURPLE" className='lg:sticky lg:top-4 bg-white shadow-2xl border-l-4 border-[#7C3AED]'>
            <p className='text-sm text-gray-600 mb-4'>Review your full two-year journey. Click a month to review its content and reflection.</p>
            <div className='max-h-96 overflow-y-auto space-y-2 pr-2'>
                {data.plan.map(monthData => {
                    // FIX 1: Use viewMonth to apply the highlight/current style
                    const isCurrentView = monthData.month === viewMonth; 
                    const isFuture = monthData.month > data.currentMonth; // Use data.currentMonth here
                    const isCompleted = monthData.status === 'Completed';
                    // FIX 1: Allow navigation to all months (future included)
                    const isClickable = true; 

                    return (
                        <div key={monthData.month}
                             className={`p-3 rounded-lg border flex justify-between items-center transition-all cursor-pointer shadow-sm
                                         ${isCurrentView ? 'bg-[#7C3AED]/20 border-[#7C3AED] font-extrabold' : isCompleted ? 'bg-[#47A88D]/10 border-[#47A88D]' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}
                                         ${isFuture && !isCurrentView ? 'opacity-80' : ''}` 
                             }
                             onClick={() => {
                                 if (isClickable) navigateToMonth(monthData.month); 
                             }}
                        >
                            <span className={`text-sm ${isCurrentView ? 'text-[#7C3AED]' : 'text-[#002E47]'}`}>
                                **Month {monthData.month}**: {monthData.theme}
                            </span>
                            <span className="flex items-center space-x-1 text-xs">
                                <Check size={16} className={isCompleted ? 'text-green-600' : 'text-gray-400'} />
                                <span className={isCompleted ? 'text-green-600' : 'text-gray-400'}>
                                    {monthData.month === data.currentMonth ? 'CURRENT' : isCompleted ? 'COMPLETED' : isFuture ? 'FUTURE' : 'PENDING'}
                                </span>
                            </span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};


// --- Feature: Request Feedback Modal ---
const RequestFeedbackModal = ({ isVisible, onClose, monthPlan, assessment }) => {
    if (!isVisible || !monthPlan || !assessment || !assessment.selfRatings) return null; // CRITICAL FIX: Add safety checks
    
    const tierId = monthPlan.tier;
    const tierName = LEADERSHIP_TIERS[tierId]?.name;
    const selfRating = assessment.selfRatings[tierId];
    
    // Find the lowest rated tier among the primary goals (T1-T5) to suggest a specific area for feedback
    const skillGapTierId = Object.entries(assessment.selfRatings)
        .reduce((lowest, [tier, rating]) => {
            if (rating < lowest.rating) return { tier, rating };
            return lowest;
        }, { tier: 'T1', rating: 10 }).tier;
    
    const skillGapTierName = LEADERSHIP_TIERS[skillGapTierId]?.name;
    const skillGapRating = assessment.selfRatings[skillGapTierId];

    const feedbackRequestText = `
Hi [Manager/Peer Name],

I'm focused on accelerating my development plan this month (Month ${monthPlan.month}) in the area of **${tierName}** (Tier ${tierId}).

My biggest self-identified skill gap is currently in **${skillGapTierName}** (Self-Rating: ${skillGapRating}/10).

Could you please provide me with one piece of **specific, actionable** feedback related to this area? A good format would be SBI (Situation, Behavior, Impact).

Thank you for your candid input!
    `.trim();

    const copyToClipboard = () => {
        const el = document.createElement('textarea');
        el.value = feedbackRequestText;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        console.log('Feedback request copied to clipboard!');
        onClose();
    };
    
    // FIX: Added Icon for Copy to Clipboard in the RequestFeedbackModal
    const Copy = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;


    return (
        <div className="fixed inset-0 bg-[#002E47]/80 z-50 flex items-center justify-center p-4">
            <div className="bg-[#FCFCFA] rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8">
                <div className="flex justify-between items-start border-b pb-4 mb-6">
                    <h2 className="text-2xl font-extrabold text-[#002E47] flex items-center">
                        <MessageSquare className="w-6 h-6 mr-3 text-[#E04E1B]" />
                        Request Targeted Feedback
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#E04E1B] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <h3 className='text-md font-bold text-[#47A88D] mb-2'>Targeted Request Focus</h3>
                <p className='text-sm text-gray-700 mb-4 border-l-2 pl-3 border-[#47A88D]'>
                    Your current month's focus is on **{tierName}**. The AI suggests requesting feedback on **{skillGapTierName}** to close your biggest self-identified skill gap.
                </p>

                <h3 className='text-md font-bold text-[#002E47] mb-2'>Copy-Paste Feedback Email</h3>
                <textarea
                    readOnly
                    value={feedbackRequestText}
                    className="w-full p-3 border border-gray-300 rounded-xl bg-gray-50 text-sm h-60"
                ></textarea>

                <Button onClick={copyToClipboard} className='mt-4 w-full bg-[#E04E1B] hover:bg-[#C33E12]'>
                    <Copy className='w-5 h-5 mr-2'/> Copy Request to Clipboard
                </Button>
                <Button onClick={onClose} variant='outline' className='mt-4 w-full'>
                    Close
                </Button>
            </div>
        </div>
    );
};
// FIX: Added Icon for Copy to Clipboard in the RequestFeedbackModal (needed because it's used above)
const Copy = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;


// --- Component 2: Tracker Dashboard View ---
const TrackerDashboardView = ({ data, updatePdpData, saveNewPlan, db, userId, navigate }) => {
    // FIX 1: Initialize viewMonth from router/prop if available, otherwise data.currentMonth
    const [viewMonth, setViewMonth] = useState(data.currentMonth); 
    const currentMonth = data.currentMonth;
    
    // CRITICAL FIX 1: Use useMemo to reliably find the month plan based on viewMonth
    const monthPlan = useMemo(() => data.plan.find(m => m.month === viewMonth), [data.plan, viewMonth]);
    
    const isCurrentView = viewMonth === currentMonth; 
    // FIX 1: isPastOrCurrent is used to determine if actions are editable, not clickable in timeline.
    const isPastOrCurrent = viewMonth <= currentMonth; 
    
    const assessment = data.assessment;

    const [localReflection, setLocalReflection] = useState(monthPlan?.reflectionText || '');
    const [isSaving, setIsSaving] = useState(false);
    // CRITICAL FIX 2: Initialize briefing state safely based on monthPlan.briefingText, not to trigger the infinite loop
    const [briefing, setBriefing] = useState(monthPlan?.briefingText || null); 
    const [briefingLoading, setBriefingLoading] = useState(false);
    
    const [isContentModalVisible, setIsContentModalVisible] = useState(false);
    const [selectedContent, setSelectedContent] = useState(null);
    const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false); // NEW STATE FOR FEEDBACK MODAL


    const { callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } = useAppServices(); 

    // CRITICAL FIX 3: Synchronize local reflection state AND briefing state when the viewed month changes.
    useEffect(() => {
        // FIX 5: Use a timeout to ensure state update happens smoothly after viewMonth transition
        const timer = setTimeout(() => {
            setLocalReflection(monthPlan?.reflectionText || '');
            // Update briefing state when month changes to show saved/historical text immediately
            setBriefing(monthPlan?.briefingText || null); 
            // Reset loading flag when switching months
            setBriefingLoading(false);
        }, 50);

        return () => clearTimeout(timer); // Cleanup timer
    }, [monthPlan]);
    
    // CRITICAL FIX 4: Memoized function for fetching briefing is essential
    // Added 'briefing' to dependency array ONLY to allow the check against the result
    const fetchMonthlyBriefing = useCallback(async (plan, assessment) => {
        if (briefingLoading || !hasGeminiKey() || !plan || !assessment || !isCurrentView) return; // Added safety checks
        
        // Prevent re-fetching if a briefing is already saved in the plan data or in local state
        if (plan.briefingText || briefing) {
            setBriefing(plan.briefingText || briefing); // Use the saved text
            return;
        }

        setBriefingLoading(true);
        const currentTier = LEADERSHIP_TIERS[plan.tier];
        // FIX: Safely retrieve rating, defaulting to 5 if not found
        const rating = assessment.selfRatings?.[plan.tier] || 5; 

        const systemPrompt = `You are a concise Executive Coach. Analyze the user's current PDP phase. Given their focus tier (${currentTier.name}) and their initial self-rating (${rating}/10), provide: 1) A 1-sentence **Executive Summary** of the goal. 2) A 1-sentence **Coaching Nudge** on how to prioritize the month's learning based on their skill gap. Use bold markdown for key phrases.`;

        const userQuery = `Generate a monthly briefing for the user's current focus: ${plan.theme}. Required content includes: ${plan.requiredContent.map(c => c.title).join(', ')}.`;

        try {
            // CRITICAL FIX 6: The payload structure for system instruction is correct for the unified callSecureGeminiAPI in App.jsx
            const payload = {
                contents: [{ role: "user", parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
                model: GEMINI_MODEL,
            };
            const result = await callSecureGeminiAPI(payload);
            const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            // Only set briefing if it's different from the current state to avoid re-render loop
            if (text && text !== briefing) {
                setBriefing(text);
            }

        } catch (e) {
            console.error("AI Briefing Error:", e);
            setBriefing("AI coach unavailable. Focus on completing your required content first.");
        } finally {
            setBriefingLoading(false);
        }
    }, [briefingLoading, hasGeminiKey, callSecureGeminiAPI, isCurrentView, briefing, GEMINI_MODEL]);


    // CRITICAL FIX 5: Logic to handle AI briefing based on month view. This prevents React Error #300/310.
    useEffect(() => {
        if (monthPlan && assessment) {
            
            if (isCurrentView && !monthPlan.briefingText && !briefingLoading) {
                 // 1. Current Month: Only try to fetch AI brief if one isn't already saved and we're not loading.
                 fetchMonthlyBriefing(monthPlan, assessment); 
                 
            } else if (monthPlan.briefingText) {
                 // 2. Past Month with Saved Briefing: Use the saved briefing text (handled by the initial useEffect for monthPlan change).
                 // Explicitly do nothing here, letting state sync handle it.
                 if (briefing !== monthPlan.briefingText) {
                     setBriefing(monthPlan.briefingText);
                 }
            } else if (!isCurrentView && !monthPlan.briefingText) {
                 // 3. Historical/Future Month with NO Saved Briefing: Use static fallback text
                 const historicalBriefingText = `## Month ${viewMonth} Historical Briefing\n\n**Focus:** ${monthPlan.theme}\n\n*The full coaching brief was not saved for this historical month.*`;
                 
                 // Safely update state if it's not already the correct historical briefing
                 if (briefing !== historicalBriefingText) {
                     setBriefing(historicalBriefingText);
                 }
            }
        }
    }, [monthPlan, assessment, fetchMonthlyBriefing, viewMonth, isCurrentView, briefing, briefingLoading]);


    // --- Handlers (Advance, Reset, Toggle, Save) ---
    const handleCompleteMonth = async () => {
        setIsSaving(true);
        // CRITICAL FIX 6: Ensure the currently displayed briefing is saved with the completed month data
        const briefingToSave = briefing ? briefing.replace('## Monthly Executive Briefing', '## Saved Executive Briefing') : '';
        
        await updatePdpData(oldData => {
            const updatedPlan = oldData.plan.map(m => 
                m.month === oldData.currentMonth ? { 
                    ...m, 
                    status: 'Completed', 
                    reflectionText: localReflection, 
                    monthCompletedDate: new Date().toISOString(),
                    briefingText: briefingToSave, // Save the finalized briefing text
                } : m
            );
            return { ...oldData, plan: updatedPlan, currentMonth: oldData.currentMonth + 1 };
        });
        setIsSaving(false);
        setViewMonth(currentMonth + 1); // Move to the next month after completing current one
    };

    const handleResetPlan = async () => {
        // This will now clear Session Storage via the hook's useEffect.
        await updatePdpData(() => null); 
        // FIX: Navigate back to the generator screen after reset
        navigate('prof-dev-plan'); 
    };

    const handleContentStatusToggle = (contentId) => {
        if (!isCurrentView) return; 
        updatePdpData(oldData => {
            const updatedContent = monthPlan.requiredContent.map(item =>
                item.id === contentId ? { ...item, status: item.status === 'Completed' ? 'Pending' : 'Completed' } : item
            );
            // CRITICAL FIX 7: Filter out the old month's content, and replace it with the new content array
            const updatedPlan = oldData.plan.map(m =>
                m.month === currentMonth ? { ...m, requiredContent: updatedContent } : m
            );
            return { ...oldData, plan: updatedPlan };
        });
    };

    const handleOpenContentModal = (contentItem) => { 
        setSelectedContent(contentItem);
        setIsContentModalVisible(true);
    };

    // FIX 3: Separated state update (onChange) from persistence (Save button)
    const handleSaveReflection = () => {
        if (!isCurrentView || localReflection === monthPlan?.reflectionText || localReflection.length === 0) return;

        setIsSaving(true);
        updatePdpData(oldData => {
            const updatedPlan = oldData.plan.map(m =>
                m.month === currentMonth ? { ...m, reflectionText: localReflection } : m
            );
            return { ...oldData, plan: updatedPlan };
        }).then(() => {
            setIsSaving(false);
            console.log("Reflection Saved.");
        }).catch((e) => {
             console.error("Reflection Save Failed:", e);
             setIsSaving(false);
        });
    };
    
    // --- Data Calculation (Ensuring safety for current/future/past logic) ---
    // CRITICAL FIX: Base all calculations on the viewed month's plan data (monthPlan)
    const currentTierId = monthPlan?.tier;
    // CRITICAL FIX: Safe access for assessment.selfRatings
    const selfRating = assessment?.selfRatings?.[currentTierId] || 5; // Default to 5 if not found
    const lowRatingFlag = currentTierId && selfRating <= 4;
    const allContentCompleted = monthPlan?.requiredContent?.every(item => item.status === 'Completed');
    const isReadyToComplete = allContentCompleted && localReflection.length >= 50;
    const requiredContent = monthPlan?.requiredContent || [];
    // Mock calculation for progress
    const totalDuration = data.plan.reduce((sum, m) => sum + m.totalDuration, 0);
    const completedDuration = data.plan.filter(m => m.month < currentMonth).reduce((sum, m) => sum + m.totalDuration, 0);
    const progressPercentage = totalDuration > 0 ? Math.round((completedDuration / totalDuration) * 100) : 0;
    // CRITICAL FIX: Safe icon lookup using optional chaining
    const TierIcon = IconMap[LEADERSHIP_TIERS[currentTierId]?.icon || 'Target']; // Safe icon lookup
    const completedItems = requiredContent.filter(item => item.status === 'Completed').length;
    const tierProgress = { overallPercentage: requiredContent.length > 0 ? Math.round((completedItems / requiredContent.length) * 100) : 0, completedContent: completedItems, totalContent: requiredContent.length }; // Mock data

    if (!monthPlan) {
        return (
            <div className="p-6 md:p-10 min-h-screen flex items-center justify-center">
                <p className="text-xl text-[#E04E1B] font-bold">Error: Plan data not found for Month {viewMonth}.</p>
            </div>
        );
    }
    
    // CRITICAL FIX 7: Safely access briefing content (which may be null/undefined/an object)
    // The useEffect ensures 'briefing' is a string or null/loading.
    const safeBriefing = briefingLoading && isCurrentView ? 'Loading AI Briefing...' : (typeof briefing === 'string' ? briefing : (
        `## Month ${viewMonth} Historical Briefing\n\n**Focus:** ${monthPlan.theme}\n\n*The full coaching brief was not saved for this historical month.*`
    ));


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
                    {/* CRITICAL FIX: Attach SharePlanModal logic to button */}
                    <Button onClick={() => console.log('Share')} variant='outline' className='text-xs px-4 py-2 border-[#002E47] text-[#002E47] hover:bg-[#002E47]/10'>
                        <Link className="w-4 h-4 mr-1" /> Share Monthly Focus
                    </Button>
                    <Button onClick={() => setIsFeedbackModalVisible(true)} variant='primary' className='text-xs px-4 py-2'>
                        <MessageSquare className="w-4 h-4 mr-1" /> Request Peer Feedback
                    </Button>
                </div>
            </Card>

            {/* Current Month Plan */}
            <div className='lg:grid lg:grid-cols-4 lg:gap-8'>
                
                <div className='lg:col-span-1 space-y-8 order-1'>
                    <RoadmapTimeline data={data} currentMonth={currentMonth} navigateToMonth={setViewMonth} viewMonth={viewMonth} />
                    
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
                    {viewMonth > currentMonth && ( // Check if viewing a future month
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

                    {/* CRITICAL FIX 3: Early return for future months to prevent rendering complex content components */}
                    {viewMonth > currentMonth ? null : (
                    // START: COMPLEX MONTHLY CONTENT (Only renders for current or past months)
                    <> 
                        <Card title={`Focus: ${monthPlan?.theme} (Month ${viewMonth})`} icon={TierIcon} accent='TEAL' className='border-l-8 border-[#47A88D]'>

                            {/* AI Monthly Briefing */}
                            <div className='mb-4 p-4 rounded-xl bg-[#002E47]/10 border border-[#002E47]/20'>
                                <h3 className='font-bold text-[#002E47] mb-1 flex items-center'><Activity className="w-4 h-4 mr-2 text-[#47A88D]" /> Monthly Executive Briefing</h3>
                                {briefingLoading && isCurrentView ? (
                                    <p className='text-sm text-gray-600 flex items-center'><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2 rounded-full"></div> Drafting advice...</p>
                                ) : (
                                    <div className="prose max-w-none text-gray-700">
                                        {/* FIX 2: Use safeBriefing to prevent error when briefing is not a string */}
                                        <div dangerouslySetInnerHTML={{ __html: safeBriefing }} /> 
                                    </div>
                                )}
                            </div>
                            
                            {/* Status / Difficulty */}
                            <div className='mb-4 text-sm border-t pt-4'>
                                <p className='font-bold text-[#002E47]'>Tier: {LEADERSHIP_TIERS[currentTierId]?.name}</p>
                                <p className='text-gray-600'>Target Difficulty: **{selfRating >= 8 ? 'Mastery' : selfRating >= 5 ? 'Core' : 'Intro'}** (Self-Rating: {selfRating}/10)</p>
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
                                                        // FIX 2: Open content modal for all viewable items
                                                        handleOpenContentModal(item);
                                                    }}
                                                    className='px-3 py-1 text-xs'
                                                    variant='primary'
                                                    // CRITICAL FIX 8: Allow viewing of ALL content in the past, current, and future months
                                                    disabled={false} 
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
                                // FIX 3: Removed onBlur save and rely on explicit Save button
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
                            
                            {isCurrentView && (
                                 <Button
                                    onClick={handleSaveReflection}
                                    disabled={isSaving || localReflection === monthPlan?.reflectionText || localReflection.length === 0}
                                    className='w-full mt-4 bg-[#002E47] hover:bg-gray-700'
                                >
                                    {isSaving ? 'Saving Reflection...' : 'Save Reflection'}
                                </Button>
                            )}
                        </Card>

                        {isCurrentView && (
                            <Card title="Recalibrate Skill Assessment" icon={Activity} accent='ORANGE' className='bg-[#E04E1B]/10 border-4 border-[#E04E1B]'>
                                <p className='text-sm text-gray-700 mb-4'>
                                    Feel like you've mastered this tier? Re-run your initial **Self-Ratings** to check your progress and generate an **accelerated, revised roadmap** to match your new skill level.
                                </p>
                                <Button
                                    onClick={handleResetPlan} 
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
                    </>
                    // END: COMPLEX MONTHLY CONTENT
                    )} 
                </div>
            </div>
            
            <ContentDetailsModal 
                isVisible={isContentModalVisible} 
                onClose={() => setIsContentModalVisible(false)} 
                content={selectedContent}
            />
            
            <RequestFeedbackModal
                isVisible={isFeedbackModalVisible}
                onClose={() => setIsFeedbackModalVisible(false)}
                monthPlan={monthPlan}
                assessment={assessment}
            />

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

    // CRITICAL FIX 9: The Plan Generation logic. It generates the plan, saves it via saveNewPlan, and relies on routing change.
    const handleGenerate = async () => {
        if (!canGenerate) return;
        setIsGenerating(true);

        const assessment = { managerStatus, goalPriorities, selfRatings, menteeFeedback: { T4: { score: 65, comment: "Needs better follow-up after delegating tasks." } }, dateGenerated: new Date().toISOString() };
        await new Promise(r => setTimeout(r, 1500)); 

        const newPlanData = generatePlanData(assessment, userId);

        // Save the new plan directly and rely on routing change.
        const success = await saveNewPlan(newPlanData);
        
        setIsGenerating(false);

        if (success) {
            // Set plan data in local state only for the ephemeral Review screen
            setGeneratedPlanData({ userPlan: newPlanData, genericPlan: GENERIC_PLAN }); 
            // CRITICAL FIX: Navigate to the *review* screen first, which then handles setting up the tracker.
            navigate('prof-dev-plan-review');
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
    
    // CRITICAL FIX 4: Scroll to top after finalizing the plan.
    const handleFinalize = async () => {
        console.log("Plan review complete. Finalizing plan and redirecting to Tracker Dashboard...");
        clearReviewData();
        // CRITICAL FIX 10: Now that the data is saved in PlanGenerator, we navigate back to the base screen. 
        // This causes the ProfDevPlanScreen router to hit currentView = 'tracker' (due to pdpData being non-null).
       navigate('prof-dev-plan'); 
        window.location.reload(); // <--- HARD RELOAD ADDED TO FORCE DATA SYNC
        
        window.scrollTo(0, 0); 
    };
    
    const handleStartOver = () => {
        clearReviewData(); 
        navigate('prof-dev-plan'); // Navigating here forces the main component to re-evaluate to the generator view
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
export const ProfDevPlanScreen = ({ initialScreen }) => {
    // No longer initializing or managing localPdpData/setLocalPdpData here
    const [generatedPlanData, setGeneratedPlanData] = useState(null); 
    
    // Services now handles its own state persistence via SessionStorage
    const services = useAppServices(); 
    // CRITICAL: Destructure all required context values
    const { pdpData, isLoading, error, userId, navigate, updatePdpData, saveNewPlan } = services;

    const clearReviewData = useCallback(() => {
        setGeneratedPlanData(null);
    }, []);

    // Determine current view state (The Core Routing Logic)
    // FIX: Use optional chaining on pdpData to allow for initial null state
    let currentView = 'loading';
    if (isLoading || pdpData === undefined) {
        currentView = 'loading';
    } else if (error) {
        currentView = 'error';
    } else if (pdpData !== null && pdpData.plan && pdpData.plan.length > 0) { 
        // CRITICAL FIX 11 (Persistence): If pdpData exists (loaded from Session Storage OR JUST SAVED), go straight to tracker.
        currentView = 'tracker';
    } else if (generatedPlanData || initialScreen === 'prof-dev-plan-review') {
        // CRITICAL FIX 12: Route to review screen only if data exists locally (after generation, before going to tracker)
        currentView = 'review';
    } else { // pdpData is null, and no plan has been generated yet.
        currentView = 'generator';
    }

    // Handle incoming deep link to the review screen
    useEffect(() => {
        if (initialScreen === 'prof-dev-plan-review' && pdpData && !generatedPlanData) {
            // Mock the required review data from existing pdpData for the review screen
            setGeneratedPlanData({ userPlan: pdpData, genericPlan: GENERIC_PLAN });
        }
    }, [initialScreen, pdpData, generatedPlanData]);


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
    // CRITICAL FIX 13: Added logic to handle the transient 'review' state
    if (currentView === 'error') { return React.createElement('div', null, 'Error...'); }
    if (currentView === 'review') { return <PlanReviewScreen generatedPlan={generatedPlanData} navigate={navigate} clearReviewData={clearReviewData} />; }
    if (currentView === 'generator') { 
        // CRITICAL FIX 14: Pass the setGeneratedPlanData function to the generator so it can handle the post-save local state update.
        return <PlanGeneratorView userId={userId} saveNewPlan={saveNewPlan} isLoading={false} error={null} navigate={navigate} setGeneratedPlanData={setGeneratedPlanData} />; 
    }

    // currentView === 'tracker'
    const trackerProps = { data: pdpData, updatePdpData, saveNewPlan, userId, navigate };
    return <TrackerDashboardView {...trackerProps} />;
};

export default ProfDevPlanScreen;