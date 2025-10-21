/* eslint-disable no-console  */
// src/components/screens/BusinessReadings.jsx

import React, { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import {
  BookOpen, Target, CheckCircle, Clock, AlertTriangle,
  MessageSquare, Filter, TrendingUp, Star, Search as SearchIcon, Cpu, Zap, Info, Check, Loader
} from 'lucide-react';

/* =========================================================
   HIGH-CONTRAST PALETTE (From uiKit)
========================================================= */
const COLORS = {
  NAVY: '#002E47', TEAL: '#47A88D', SUBTLE_TEAL: '#349881', ORANGE: '#E04E1B', GREEN: '#10B981', AMBER: '#F59E0B', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', OFF_WHITE: '#FFFFFF', MUTED: '#4B5563', SUBTLE: '#E5E7EB', TEXT: '#374151', BLUE: '#2563EB', BG: '#F9FAFB', PURPLE: '#7C3AED',
};

const COMPLEXITY_MAP = {
  Low:    { label: 'Novice',       hex: COLORS.GREEN, icon: CheckCircle },
  Medium: { label: 'Intermediate', hex: COLORS.AMBER, icon: AlertTriangle },
  High:   { label: 'Expert',       hex: COLORS.RED,   icon: Target },
};

/* =========================================================
   UI COMPONENTS (Mocks omitted for brevity)
========================================================= */
const ExecSwitch = ({ checked, onChange }) => { /* ... */ return (
    <div className="flex items-center gap-2">
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className="relative inline-flex items-center" style={{ width: 46, height: 26 }} >
        <span style={{ position: 'absolute', inset: 0, background: checked ? COLORS.ORANGE : '#9CA3AF', borderRadius: 9999, transition: 'background .15s ease'}} />
        <span style={{ position: 'relative', left: checked ? 22 : 2, width: 22, height: 22, background: '#FFFFFF', borderRadius: '9999px', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .15s ease' }} />
      </button>
      <span style={{ color: COLORS.NAVY, fontWeight: 600 }}>Executive Brief</span>
    </div>
  );
};
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white";
    if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`; }
    else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
    if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none"; }
    return (<button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>);
};

/* =========================================================
   MOCK BOOKS (Using these only for data population)
========================================================= */
const MOCK_ALL_BOOKS = {
  'Strategy & Execution': [
    { id: 's_e_1', title: 'The E-Myth Revisited', author: 'Michael E. Gerber', theme: 'Why most small businesses fail and how to build a scalable system.', complexity: 'Medium', duration: 180, focus: 'Delegation, Process Mapping, Systemization, Standard Operating Procedures, Entrepreneurial Vision, Managerial Structure' },
    { id: 's_e_2', title: 'Good to Great', author: 'Jim Collins', theme: 'The factors that allow companies to make the leap from good results to sustained great ones.', complexity: 'High', duration: 240, focus: 'Level 5 Leadership, Hedgehog Concept, Culture of Discipline, Technology Accelerators, Flywheel Effect, Stockdale Paradox' },
    { id: 's_e_3', title: 'Measure What Matters', author: 'John Doerr', theme: 'Achieving ambitious goals using OKRs.', complexity: 'Medium', duration: 200, focus: 'Goal Setting, Quarterly Planning, Accountability, Transparency, Stretch Goals, Feedback Cycles' },
    { id: 's_e_4', title: 'The 7 Habits', author: 'Stephen Covey', theme: 'Principles for personal and professional effectiveness.', complexity: 'Low', duration: 220, focus: 'Proactivity, Prioritization, Synergy, Sharpen the Saw, Win/Win, Habit Stacking, Time Management Matrix' },
    { id: 's_e_5', title: 'Getting Things Done (GTD)', author: 'David Allen', theme: 'A stress-free system for organizing tasks and projects.', complexity: 'Medium', duration: 210, focus: 'Workflow Management, Capture, Organize, Engage, Next Actions, Two-Minute Rule, Weekly Review' },
    { id: 's_e_6', title: 'Deep Work', author: 'Cal Newport', theme: 'The value of focused, distraction-free concentration on cognitively demanding tasks.', complexity: 'Medium', duration: 190, focus: 'Focus, Productivity, Attention Management, Monastic Approach, High-Value Tasks, Metrics of Depth, Batch Processing' },
    { id: 's_e_7', title: 'The Goal', author: 'Eliyahu Goldratt', theme: 'The process of ongoing improvement using the Theory of Constraints.', complexity: 'High', duration: 260, focus: 'Theory of Constraints, Bottlenecks, Throughput, Drum-Buffer-Rope, Process Improvement, Optimization' },
  ],
  'People & Culture': [
    { id: 'p_c_1', title: 'Dare to Lead', author: 'Brené Brown', theme: 'Courageous leadership by embracing vulnerability and trust.', complexity: 'Medium', duration: 210, focus: 'Psychological Safety, Feedback, Vulnerability, Rumbling with Vulnerability, Armored Leadership, Empathy' },
    { id: 'p_c_2', title: 'Turn the Ship Around!', author: 'L. David Marquet', theme: 'Creating a leader-leader organization over a leader-follower one.', complexity: 'Medium', duration: 190, focus: 'Intent-Based Leadership, Decentralization, Ownership, Competence, Clarity, Control' },
    { id: 'p_c_3', title: 'Radical Candor', author: 'Kim Scott', theme: 'Challenging directly while caring personally.', complexity: 'Medium', duration: 190, focus: 'Feedback Delivery, Coaching, Guidance, Caring Personally, Challenging Directly, Get Stuff Done Wheel' },
    { id: 'p_c_4', title: 'The Culture Code', author: 'Daniel Coyle', theme: 'Building highly successful groups through belonging, safety, and shared purpose.', complexity: 'Low', duration: 230, focus: 'Group Cohesion, Vulnerability Loops, Shared Identity, Safety, Vulnerability, Purpose' },
    { id: 'p_c_5', title: 'Start with Why', author: 'Simon Sinek', theme: 'Great leaders inspire action by communicating from the inside out (The Golden Circle).', complexity: 'Low', duration: 180, focus: 'Purpose, Vision, The Golden Circle, Mass Influence, Trust, Why/How/What' },
    { id: 'p_c_6', title: 'Team of Teams', author: 'General Stanley McChrystal', theme: 'How a decentralized command structure can beat highly effective, organized threats.', complexity: 'High', duration: 250, focus: 'Shared Consciousness, Empowered Execution, Adaptability, Decentralization, Liaison Officers, Trust' },
  ],
  'Self-Awareness & Growth': [
    { id: 's_a_1', title: 'Atomic Habits', author: 'James Clear', theme: 'Build good habits by tiny improvements.', complexity: 'Low', duration: 180, focus: 'Habit Formation, Self-Discipline, Identity, Four Laws, Habit Stacking, Two-Minute Rule, Environment Design' },
    { id: 's_a_2', title: 'Mindset', author: 'Carol Dweck', theme: 'The difference between growth and fixed mindsets in success.', complexity: 'Medium', duration: 190, focus: 'Growth Mindset, Fixed Mindset, Effort vs. Talent, Praise for Effort, Neuroscience of Change' },
    { id: 's_a_3', title: 'Drive', author: 'Daniel H. Pink', theme: 'The new operating system for business based on intrinsic motivation (Autonomy, Mastery, Purpose).', complexity: 'Medium', duration: 170, focus: 'Intrinsic Motivation, Autonomy, Mastery, Purpose, Type I vs Type X Behavior, Flow State, Goldilocks Tasks' },
    { id: 's_a_4', title: 'Emotional Intelligence 2.0', author: 'Travis Bradberry', theme: 'Practical strategies for increasing self-awareness and self-management.', complexity: 'Low', duration: 160, focus: 'Self-Awareness, Self-Management, Social Awareness, Relationship Management, EQ Assessment, Delaying Gratification' },
    { id: 's_a_5', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', theme: 'Dual-process model of the brain (System 1 and System 2) and cognitive biases.', complexity: 'High', duration: 280, focus: 'Cognitive Biases, System 1/System 2, Decision Making, Anchoring Effect, Loss Aversion, Prospect Theory' },
  ],
  'Innovation & Change': [ 
    { id: 'i_c_1', title: 'The Lean Startup', author: 'Eric Ries', theme: 'Build-measure-learn with continuous innovation.', complexity: 'High', duration: 250, focus: 'MVP, Build-Measure-Learn, Iteration, Pivot or Persevere, Validated Learning, Innovation Accounting' },
    { id: 'i_c_2', title: 'Innovator\'s Dilemma', author: 'Clayton Christensen', theme: 'Why great companies fail by being too good at what they do.', complexity: 'High', duration: 270, focus: 'Disruptive Innovation, Sustaining Technology, Value Networks, Resource Dependence, Small Markets' },
    { id: 'i_c_3', title: 'Crossing the Chasm', author: 'Geoffrey A. Moore', theme: 'Marketing high-tech products to mainstream customers.', complexity: 'Medium', duration: 230, focus: 'Technology Adoption Lifecycle, Chasm Strategy, Bowling Pin, Early Adopters, Mainstream Market' },
    { id: 'i_c_4', title: 'Zero to One', author: 'Peter Thiel', theme: 'The secret to building a better future is to create new things, not copy existing ones.', complexity: 'Medium', duration: 200, focus: 'Monopolies, Vertical Progress, Last Mover Advantage, Secret, Peter Thiel\'s Seven Questions' },
  ],
};

/* =========================================================
   LOCAL FALLBACK UTILITIES (ONLY FOR STRUCTURE/CONTEXT)
========================================================= */
function getActionSteps(book) { 
  const t = (book.title || '').toLowerCase();
  if (t.includes('e-myth')) { return ['Map one repeatable process (5–7 steps) and write a 1-page SOP.', 'Delegate the checklist, not the task.', 'Analyze your time allocation: Technician, Manager, or Entrepreneur Role?', 'Design a comprehensive organizational chart based on function, not personality.', 'Schedule a weekly "Manager Hat" block for system review.'];}
  if (t.includes('radical candor')) { return ['Ask your team: “What’s one thing I could do better?” then act on one item within a week.', 'Draft corrective feedback using the SBI framework (Situation, Behavior, Impact).', 'Use a 5:1 positive-to-negative feedback ratio in your next 1:1s.', 'Create a team norm that makes challenging the boss an expected, not punished, behavior.', 'Commit to giving one immediate, in-the-moment praise and one immediate, in-the-moment correction this week.'];}
  if (t.includes('atomic habits')) { return ['Pick one keystone habit; write it as Habit Stack: “After [current], I will [new], then [small reward]”.', 'Use the 2-Minute Rule to start any new habit.', 'Audit your environment to make good habits obvious and bad habits invisible.', 'Conduct a Habit Scorecard for your daily routine.', 'Start a "motion vs. action" journal to focus on outcome-producing activities.'];}
  if (t.includes('good to great')) { return ['Identify one "Hedgehog" area where your company can be the best.', 'Implement a "Stop Doing" list to enforce a Culture of Discipline.', 'Find a "Level 5" leader on your team and mentor them.', 'Start every executive meeting with a review of a current "Brutal Fact" (Stockdale Paradox).', 'Ensure the right people are on the bus before deciding where to drive it.'];}
  if (t.includes('getting things done')) { return ['Establish an "In-Basket" system for capturing all open loops.', 'Complete the "Mind Sweep" process and list every open commitment.', 'Set up context-specific "Next Actions" lists (e.g., @computer, @calls).', 'Perform a comprehensive Weekly Review.', 'Apply the Natural Planning Model to a large, complex project you are currently managing.'];}
  return ['Define the outcome, then design the smallest repeatable action.'];
}

function getFrameworks(book) { 
  const t = (book.title || '').toLowerCase();
  if (t.includes('e-myth')) { return [{ name: 'E-Myth Roles', desc: 'Entrepreneur (vision), Manager (systems), Technician (doing).' }, { name: 'Systemization', desc: 'Build the business as if it were a franchise prototype.' }];}
  if (t.includes('radical candor')) { return [{ name: 'Candor Quadrants', desc: 'Caring Personally × Challenging Directly; aim for Radical Candor.' }, { name: 'Gives-and-Gets', desc: 'Focus on what you give (feedback) and get (results).' }];}
  if (t.includes('atomic habits')) { return [{ name: 'Four Laws', desc: 'Make it Obvious, Attractive, Easy, Satisfying.' }, { name: 'Habit Stacking', desc: 'Pair a new habit with an old one (e.g., After X, I will Y).' }];}
  if (t.includes('good to great')) { return [{ name: 'Hedgehog Concept', desc: 'Intersection of passion, best-in-world, and economic engine.' }, { name: 'Level 5 Leadership', desc: 'Ambitious for the company, not for themselves.' }];}
  if (t.includes('getting things done')) { return [{ name: 'The 5 Steps', desc: 'Capture, Clarify, Organize, Reflect, Engage.' }, { name: 'The Two-Minute Rule', desc: 'If an action takes less than two minutes, do it immediately.' }];}
  return [{ name: 'Core Principles', desc: 'Prioritize outcomes, feedback loops, and small, testable steps.' }];
}


// --- ERROR DISPLAY FUNCTIONS (Used when AI fails) ---

// FIX 1: This is the robust, styled content returned when the API fails
const API_ERROR_HTML = (executive, book) => {
    const errorTitle = executive ? "EXECUTIVE BRIEFING UNAVAILABLE" : "FULL FLYER UNAVAILABLE";
    const baseContent = executive 
        ? `<p style="color:${COLORS.RED}; font-size: 18px; margin-top: 15px; line-height: 1.6;">**CRITICAL API ERROR**: The live connection to the content generation service failed (e.g., **Timeout 504** or **Missing API Key**). The feature is currently disabled.</p>
           <h3 style="color:${COLORS.NAVY}; font-weight:800; font-size: 20px; margin-top:20px;">Static Summary (for Reference)</h3>
           <p style="color:#374151; font-size: 16px; margin-top: 5px;">This briefing would have covered: ${book.theme}. Focus areas: ${book.focus.split(',').slice(0, 3).join(', ')}.</p>
           <h3 style="color:${COLORS.NAVY}; font-weight:800; font-size: 20px; margin-top:20px;">Manual Action Item</h3>
           <ul style="list-style:disc;margin-left:20px;color:#374151;font-size:16px;">
              <li>Read the book's Chapter 3 summary before your next meeting.</li>
           </ul>`
        : `<p style="color:${COLORS.RED}; font-size: 18px; margin-top: 15px; line-height: 1.6;">**CRITICAL API ERROR**: The content generator failed to respond. This is usually due to a **server timeout** or an invalid configuration.</p>
           <h3 style="color:${COLORS.NAVY}; font-weight:800; font-size: 20px; margin-top:20px;">Root Cause Check</h3>
           <ul style="list-style:disc;margin-left:20px;color:#374151;font-size:16px;">
              <li>Verify the **Gemini API Key** in App Settings is correctly loaded.</li>
              <li>Check the developer console for network (504) or authentication (400) errors.</li>
              <li>The system will attempt to auto-recover on the next page load.</li>
           </ul>
           <h3 style="color:${COLORS.NAVY}; font-weight:800; font-size: 20px; margin-top:20px;">Static Takeaways</h3>
           <p style="color:#374151; font-size: 16px; margin-top: 5px;">Key frameworks include: ${getFrameworks(book).map(f => f.name).join(', ')}.</p>
        `;
        
    return `<div style="padding: 16px;"><h2 style="color:${COLORS.NAVY}; font-weight:900; font-size: 24px; border-bottom: 3px solid ${COLORS.RED}; padding-bottom: 8px;">${errorTitle}</h2>${baseContent}</div>`;
};

/* =========================================================
   AI FLYER BUILDER & QUESTION SCORING (PRODUCTION FOCUS)
========================================================= */
async function buildAIFlyerHTML({ book, tier, executive, callSecureGeminiAPI }) {
  
  const baseInstruction = executive
    ? `Write a robust EXECUTIVE BRIEF (150-200 words, split into 2 paragraphs). The brief must address the book's core insight, its relevance to the leader's specific tier, and two clear takeaway actions presented in a brief, bulleted list. Output clean, styled HTML using only h2, h3, p, ul, li, strong, em, and inline CSS for presentation. The two paragraphs should be separate <p> tags, followed by an H3 and a <ul> with 2 <li> items.`
    : `Create a comprehensive BOOK FLYER (300-350 words total). The content must include four specific sections: **1. Core Insight & Overview**, **2. Deep Dive (3 Critical Takeaways as a list)**, **3. Key Frameworks (with short descriptions)**, and **4. Immediate 4-Week Action Plan (4 bullet points)**. Ensure high detail and professional tone. Output ONLY clean, styled HTML using h2, h3, p, ul, li, strong, em, and inline CSS for presentation. DO NOT include any plain text outside the HTML tags.`;

  const systemPrompt =
    `You are the LeaderReps Researcher and Content Generator. Your goal is to produce a detailed, premium, high-value content piece based on the provided book and the user's Leadership Tier. You MUST adhere to all structural and word count requirements. Frameworks and actions must clearly reference the book’s named models and concepts. Use Google Search grounding to ensure accuracy.`;

  const userPrompt =
    `${baseInstruction}\n\nBook: ${book.title} by ${book.author}\n` +
    `Focus areas: ${(book.focus || '')}\nComplexity: ${book.complexity}\nTier: ${tier}`;

  try {
    // 1. ATTEMPT LIVE API CALL with Google Search grounding
    const out = await callSecureGeminiAPI({ 
      systemInstruction: { parts: [{ text: systemPrompt }] }, 
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      tools: [{ "google_search": {} }], // Ensure grounding is active
    });
    
    let html = out?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // 2. PROCESS SUCCESSFUL RESPONSE
    if (html && !html.toLowerCase().includes('error')) {
        // Apply inline styles to the AI-generated HTML for consistent branding
        html = html.replace(/<h2/g, `<h2 style="color:${COLORS.ORANGE};font-size:24px;border-bottom:2px solid ${COLORS.SUBTLE};padding-bottom:5px;margin-top:15px;"`);
        html = html.replace(/<h3/g, `<h3 style="color:${COLORS.NAVY};font-size:20px;margin-top:10px;"`);
        html = html.replace(/<p/g, `<p style="color:#374151;font-size:16px;"`);
        html = html.replace(/<ul/g, `<ul style="list-style:disc;margin-left:20px;color:#374151;"`);
        html = html.replace(/<ol/g, `<ol style="list-style:decimal;margin-left:20px;color:#374151;"`);
        return html;
    }
    
    // 3. FALLBACK ON FAILURE (Response was empty, mock, or error)
    console.error("AI Flyer Generation failed. Returning structured error message.");
    return API_ERROR_HTML(executive, book); // Use the guaranteed error content
  } catch (e) {
    // 4. FALLBACK ON EXCEPTION (API call failed - network/key issue)
    console.error('AI flyer generation failed due to API exception.', e);
    return API_ERROR_HTML(executive, book); // Use the guaranteed error content
  }
}

// ... (rest of the file remains the same, including getQuestionScore and handleAiSubmit)
const getQuestionScore = (query, bookTitle) => {
    const q = query.toLowerCase().trim();
    if (q.length < 15) return { score: 0, tip: 'Question is too short. Be specific about your challenge.' };
    
    let score = 0;
    let feedback = 'Question could be more specific.';
    const applicationKeywords = ['how do i', 'apply', 'implement', 'what is the first step', 'next step', 'my team', 'colleague', 'delegate', 'situation'];
    const hasApplication = applicationKeywords.some(keyword => q.includes(keyword));
    const hasContext = q.length > 50;
    
    if (hasApplication && hasContext) {
        score = 3;
        feedback = `Excellent query! Ready to apply ${bookTitle}.`;
    } else if (hasApplication || hasContext) {
        score = 2;
        feedback = hasApplication ? 'Good start. Add more context about your current situation.' : 'The context is great, now phrase it as an actionable "how-to" question.';
    } else {
        score = 1;
        feedback = 'Try to phrase your question in a way that relates this book to a specific work challenge.';
    }

    return { score, tip: feedback };
};

async function handleAiSubmit(e, services, selectedBook, aiQuery, setIsSubmitting, setAiResponse) {
  e.preventDefault();
  if (e.target.disabled) return;

  const q = (aiQuery || '').trim();
  if (!selectedBook || !q) return;

  setIsSubmitting(true);
  setAiResponse('The AI Coach is analyzing the book\'s core principles and formulating an actionable response...');

  const hasKeyOk =
    typeof services?.hasGeminiKey === 'function' ? services.hasGeminiKey() : true;
  const canCall =
    typeof services?.callSecureGeminiAPI === 'function';

  if (!canCall || !hasKeyOk) {
    setAiResponse('**AI OFFLINE/KEY MISSING**:\n\nContact IT. The necessary API endpoint is not configured to provide real-time coaching.');
    setIsSubmitting(false);
    return;
  }

  try {
    const actionableContext = `
      Book: ${selectedBook.title} by ${selectedBook.author}. Focus: ${selectedBook.focus}.
      Key Frameworks: ${getFrameworks(selectedBook).map(f => f.name).join(', ')}.
      Key Actions: ${getActionSteps(selectedBook).join(' | ')}.
      User's Current Question: ${q}
    `;

    const systemPrompt =
      `You are the LeaderReps AI Coach. Your sole purpose is to answer the user's question by referencing the provided book's principles ONLY. Do not use outside knowledge. Your response must be direct, actionable, and reference the book's frameworks.
      ${actionableContext}
      Guidelines: Answer directly with 3–5 sentences. Include one concrete next action that applies the book's principle to the user's situation. Do not use markdown other than **bold** for emphasis. Ensure the response flows naturally like coaching advice.`;

    const out = await services.callSecureGeminiAPI({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: `Regarding "${selectedBook.title}": ${q}` }] }],
      tools: [{ google_search: {} }],
    });

    const text = out?.candidates?.[0]?.content?.parts?.[0]?.text
      || 'No response was received from the AI. Please try rephrasing your question.';

    setAiResponse(text);
  } catch (err) {
    console.error('AI coach production call failed.', err);
    setAiResponse('**PRODUCTION CALL FAILED**: The API request resulted in an error. Please check the network or system logs.');
  } finally {
    setIsSubmitting(false);
  }
}

// ... (Rest of the BookListStable and BookFlyerStable components, which are mostly UI)

// Fix 1: Search Input (Isolated and Memoized)
const SearchInput = React.memo(({ value, onChange }) => {
    return (
        <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: COLORS.MUTED }}>
                <SearchIcon className="w-4 h-4" style={{ color: COLORS.TEAL }}/> Search by Title, Author, or Focus
            </label>
            <input 
                type="text" 
                value={value} 
                onChange={onChange} 
                placeholder="Start typing to find a book..." 
                className="w-full p-3 border rounded-lg shadow-sm focus:outline-none"
            />
        </div>
    );
});
SearchInput.displayName = 'SearchInput';


// Fix 2: AI Coach Input (Isolated and Memoized)
const AICoachInput = React.memo(({ aiQuery, handleAiQueryChange, submitHandler, isSubmitting, questionFeedback, selectedBookTitle }) => {
    
    // Determine AI Coach message colors and icons based on props
    const coachBgColor = questionFeedback.score === 3 ? '#D1FAE5' : (questionFeedback.score === 2 ? '#FEF3C7' : '#FEE2E2');
    const coachBorderColor = questionFeedback.score === 3 ? '#34D399' : (questionFeedback.score === 2 ? '#FBBF24' : '#F87171');
    const coachTextColor = questionFeedback.score === 3 ? '#065F46' : (questionFeedback.score === 2 ? '#B45309' : '#991B1B');
    const CoachIcon = questionFeedback.score === 3 ? Zap : (questionFeedback.score === 2 ? AlertTriangle : Info);
    
    return (
        <form onSubmit={submitHandler} className="flex flex-col gap-2">
            {/* Live Feedback Bar */}
            {aiQuery.trim().length > 0 && (
                <div className="p-2 rounded-lg text-sm flex items-center gap-2 transition-all duration-300 shadow-inner" 
                        style={{ background: coachBgColor, border: `1px solid ${coachBorderColor}`, color: coachTextColor }}>
                    <CoachIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold">Query Quality Score {questionFeedback.score}/3:</span> 
                    <span className="flex-1">{questionFeedback.tip}</span>
                </div>
            )}
            
            <div className="flex gap-2">
                <input
                    type="text"
                    value={aiQuery}
                    onChange={handleAiQueryChange}
                    // --- FIX 2: CONTEXTUALIZE PLACEHOLDER ---
                    placeholder={`Ask Coach how to apply principles from "${selectedBookTitle}"...`}
                    className="flex-grow p-3 border rounded-xl"
                    style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
                    required
                />
                <button
                    type="submit"
                    className="px-4 rounded-xl font-semibold flex items-center gap-1 shadow-lg"
                    style={{
                        background: isSubmitting ? '#9CA3AF' : COLORS.PURPLE,
                        color: '#FFFFFF',
                        cursor: (aiQuery.trim() && !isSubmitting) ? 'pointer' : 'not-allowed',
                        opacity: isSubmitting ? 0.9 : 1
                    }}
                    disabled={!aiQuery.trim() || isSubmitting}
                    aria-busy={isSubmitting ? 'true' : 'false'}
                >
                    <MessageSquare className="w-5 h-5" /> {isSubmitting ? 'Working…' : 'Ask Coach'}
                </button>
            </div>
        </form>
    );
});
AICoachInput.displayName = 'AICoachInput';


function BookListStable({
  COLORS,
  COMPLEXITY_MAP,
  filters,
  filteredBooks,
  savedBooks,
  selectedBook,
  onSelectBook,
  onToggleSave,
  handleSearchChange,
  handleFilterChange,
}) {
  return (
    <div className="space-y-10">
      <h2 className="text-3xl font-extrabold flex items-center gap-3 border-b-4 pb-2"
          style={{ color: COLORS.NAVY, borderColor: COLORS.ORANGE }}>
        <BookOpen className="w-7 h-7" style={{ color: COLORS.TEAL }}/> LeaderReps Curated Reading Library
      </h2>

      <div className="p-5 rounded-xl shadow-xl border" style={{ background: COLORS.OFF_WHITE, borderColor: COLORS.SUBTLE }}>
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.NAVY }}>
          <Filter className="w-5 h-5" style={{ color: COLORS.ORANGE }}/> Personalize Your Search
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SearchInput value={filters.search} onChange={handleSearchChange} />
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>Complexity Level</label>
            <select
              value={filters.complexity}
              onChange={(e) => handleFilterChange('complexity', e.target.value)}
              className="w-full p-2 border rounded-lg shadow-sm focus:outline-none"
            >
              <option value="All">All Levels</option>
              {Object.keys(COMPLEXITY_MAP).map(k => (<option key={k} value={k}>{COMPLEXITY_MAP[k].label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>Max Est. Minutes ({filters.maxDuration} min)</label>
            <input
              type="range" min="150" max="300" step="10"
              value={filters.maxDuration}
              onChange={(e) => handleFilterChange('maxDuration', parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: COLORS.MUTED }}><span>150 min</span><span>300 min</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(filteredBooks).map(([tier, books]) => (
          <div key={tier}
               className="rounded-2xl shadow-xl overflow-hidden border-2"
               style={{ background: COLORS.OFF_WHITE, borderColor: COLORS.SUBTLE }}>
            <div className="p-6" style={{ background: COLORS.NAVY }}>
              <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: COLORS.OFF_WHITE }}>{tier}</h3>
              <p className="text-base mt-1" style={{ color: '#E5E7EB' }}>Foundational books for this competency. ({books.length} available)</p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(books || []).map((book) => {
                const c = COMPLEXITY_MAP[book.complexity] || COMPLEXITY_MAP.Medium;
                const ComplexityIcon = c.icon;
                const isSaved = !!savedBooks[book.id];
                const isSelected = selectedBook?.id === book.id;

                return (
                  <div key={book.id} className="relative">
                    <button
                      onClick={() => { onSelectBook(book, tier); }}
                      className="p-5 text-left w-full h-full block rounded-2xl border-2 transition-all"
                      style={{
                        background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)',
                        borderColor: isSelected ? COLORS.TEAL : COLORS.SUBTLE,
                        boxShadow: isSelected ? '0 12px 30px rgba(0,0,0,.12)' : '0 2px 8px rgba(0,0,0,.06)',
                        color: COLORS.TEXT,
                        position: 'relative'
                      }}
                    >
                      <span style={{ position:'absolute',top:0,left:0,right:0,height:6,
                        background: isSelected ? COLORS.TEAL : COLORS.ORANGE,
                        borderTopLeftRadius:14,borderTopRightRadius:14 }} />

                      <div className="flex gap-3 items-start">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center border" style={{ borderColor: COLORS.SUBTLE, background: '#F3F4F6' }}>
                          <BookOpen className="w-5 h-5" style={{ color: COLORS.TEAL }} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-lg" style={{ color: COLORS.NAVY }}>{book.title}</p>
                          <p className="text-sm italic" style={{ color: COLORS.MUTED }}>by {book.author}</p>
                        </div>
                      </div>

                      <div className="my-3" style={{ height: 1, background: COLORS.SUBTLE }} />

                      <div className="flex items-center text-sm gap-2" style={{ color: COLORS.TEXT }}>
                        <Clock className="w-4 h-4" style={{ color: COLORS.ORANGE, marginRight: 8 }}/> 
                        <span className="font-semibold">Learning Mins:</span>
                        <span className="ml-auto font-bold">{book.duration} min</span>
                      </div>
                      <div className="flex items-center text-sm gap-2" style={{ color: COLORS.TEXT }}>
                        <ComplexityIcon className="w-4 h-4" style={{ color: c.hex, marginRight: 8 }}/> 
                        <span className="font-semibold">Complexity:</span>
                        <span className="ml-auto font-bold" style={{ color: c.hex }}>{c.label}</span>
                      </div>

                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
                        <p className="text-xs font-semibold" style={{ color: COLORS.TEAL }}>Key Focus</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(book.focus || '').split(',').slice(0, 3).map((f, i) => (
                            <span key={i}
                                  className="px-2 py-0.5 text-xs font-medium rounded-full"
                                  style={{ background: '#F3F4F6', color: '#4B5563' }}>{f.trim()}</span>
                          ))}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleSave(book.id); }}
                      aria-label={isSaved ? 'Remove from Saved' : 'Save for Later'}
                      className="absolute top-2 right-2 p-2 rounded-full"
                      style={{ background: isSaved ? COLORS.AMBER : '#FFFFFFCC', color: isSaved ? '#FFFFFF' : '#9CA3AF', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }}
                    >
                      <Star className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                );
              })}
            </div>

            {books.length === 0 && (
              <div className="p-6 text-center" style={{ color: COLORS.MUTED }}>
                No books match the current filters in this category.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookFlyerStable({
  COLORS,
  selectedBook,
  htmlFlyer,
  isExecutiveBrief,
  setIsExecutiveBrief,
  questionFeedback,
  aiResponse,
  aiQuery,
  handleAiQueryChange,
  submitHandler,
  savedBooks,
  onToggleSave,
  onCommit,
  isCommitted,
  isSubmitting,
}) {
  const progressMinutes = 45;
  const total = selectedBook.duration;
  const pct = Math.min(100, Math.round((progressMinutes / total) * 100));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center pb-4" style={{ borderBottom: `1px solid ${COLORS.SUBTLE}` }}>
        <h2 className="text-3xl font-bold flex items-center gap-3" style={{ color: COLORS.NAVY }}>
          Focus Flyer: {selectedBook.title}
        </h2>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('lr-close-flyer'))}
          className="font-semibold px-3 py-2 rounded-xl border-2"
          style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}
        >
          ← Back to Library
        </button>
      </div>

      <div className="rounded-2xl shadow-2xl p-8 border" style={{ background: COLORS.OFF_WHITE, borderColor: COLORS.SUBTLE }}>
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: COLORS.LIGHT_GRAY, borderColor: COLORS.SUBTLE }}>
            <TrendingUp className="w-5 h-5" style={{ color: COLORS.TEAL }}/>
            <div>
              <p className="text-xs font-medium" style={{ color: COLORS.MUTED }}>YOUR COMMITMENT STATUS</p>
              <div className="flex items-center gap-2">
                <div className="w-40 h-2 rounded-full" style={{ background: COLORS.SUBTLE }}>
                  <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: COLORS.TEAL }} />
                </div>
                <span className="text-sm font-bold" style={{ color: COLORS.NAVY }}>{pct}% Complete</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExecSwitch checked={isExecutiveBrief} onChange={setIsExecutiveBrief} />
          </div>
        </div>

        {/* FIX: Check if HTML Flyer is loading and apply desired effect */}
        {htmlFlyer.includes('Flyer being generated') || htmlFlyer.includes('CRITICAL API ERROR') ? (
            <div className="p-4 rounded-xl border border-gray-300 shadow-inner text-center" style={{ background: '#F0F5FF' }}>
                <div className="flex items-center justify-center gap-2" style={{ color: COLORS.PURPLE, animation: 'pulse 1.5s infinite' }}>
                    {htmlFlyer.includes('CRITICAL API ERROR') ? <AlertTriangle className='w-5 h-5'/> : <Loader className='w-5 h-5 animate-spin'/>}
                    <span className="font-semibold whitespace-nowrap">{htmlFlyer.includes('CRITICAL API ERROR') ? 'API Error (See Below)' : 'Flyer being generated...'}</span>
                </div>
                <style jsx>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    div[style*="animation: pulse"] { animation: pulse 1.5s infinite; }
                `}</style>
                 <div className="max-w-none space-y-4 pt-4" style={{ color: COLORS.TEXT }} dangerouslySetInnerHTML={{ __html: htmlFlyer }} />
            </div>
        ) : (
            <div className="max-w-none space-y-4" style={{ color: COLORS.TEXT }} dangerouslySetInnerHTML={{ __html: htmlFlyer }} />
        )}
        {/* END FIX */}

        <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${COLORS.SUBTLE}` }}>
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-3" style={{ color: COLORS.NAVY }}>
            <MessageSquare className="text-2xl w-6 h-6" style={{ color: COLORS.PURPLE }}/> AI Coach: Instant Application
          </h3>

          {aiResponse && (
            <div className="p-4 mb-4 rounded-xl shadow-lg border-l-4" style={{ background: '#F0F5FF', borderLeftColor: COLORS.PURPLE, color: COLORS.TEXT }}>
              <p className="text-sm font-semibold flex items-center gap-2" style={{ color: COLORS.NAVY }}>
                <Cpu className="w-4 h-4"/> AI Coach Response:
              </p>
              <p className="text-base mt-1" style={{ whiteSpace: 'pre-wrap' }}>{aiResponse}</p>
            </div>
          )}

          <AICoachInput
            aiQuery={aiQuery}
            handleAiQueryChange={handleAiQueryChange}
            submitHandler={submitHandler}
            isSubmitting={isSubmitting}
            questionFeedback={questionFeedback}
            selectedBookTitle={selectedBook.title}
          />
        </div>

        <div className="mt-10 pt-6 flex justify-end gap-4" style={{ borderTop: `1px solid ${COLORS.SUBTLE}` }}>
          <button
            onClick={() => onToggleSave(selectedBook.id)}
            className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl border-2"
            style={{ background: COLORS.OFF_WHITE, borderColor: savedBooks[selectedBook.id] ? COLORS.AMBER : COLORS.SUBTLE, color: savedBooks[selectedBook.id] ? '#B45309' : COLORS.MUTED }}
          >
            <Star className="w-5 h-5" fill={savedBooks[selectedBook.id] ? 'currentColor' : 'none'}/>
            {savedBooks[selectedBook.id] ? 'Saved to Library' : 'Save for Later'}
          </button>
          <button
            onClick={onCommit}
            className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl"
            style={{ background: isCommitted ? COLORS.GREEN : COLORS.ORANGE, color: '#FFF', boxShadow: `0 8px 24px ${isCommitted ? COLORS.GREEN : COLORS.ORANGE}45` }}
            disabled={isCommitted}
          >
            {isCommitted ? (<><Check className="w-5 h-5" /> Committed!</>) : (<><TrendingUp className="w-5 h-5" /> Add to Daily Practice Commitment</>)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BusinessReadingsScreen() {
  const services = useAppServices(); 
  const {
    updateCommitmentData = () => true,
    navigate = () => {},
    callSecureGeminiAPI,
    hasGeminiKey,
  } = services;

  const [selectedBook, setSelectedBook] = useState(null);
  const [htmlFlyer, setHtmlFlyer] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [savedBooks, setSavedBooks] = useState({});
  const [isExecutiveBrief, setIsExecutiveBrief] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);

  const [filters, setFilters] = useState({ complexity: 'All', maxDuration: 300, search: '' });
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allBooks = MOCK_ALL_BOOKS; 

  /* New: Question Feedback Hook */
  const questionFeedback = useMemo(() => {
    if (!selectedBook) return { score: 0, tip: '' };
    return getQuestionScore(aiQuery, selectedBook.title);
  }, [aiQuery, selectedBook]);


  // --- FIX 1: MEMOIZE HANDLERS TO PREVENT CURSOR BOUNCE ---
  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSearchChange = useCallback((e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  }, []);

  const handleAiQueryChange = useCallback((e) => {
    setAiQuery(e.target.value);
  }, []);
  // --- END FIX 1 ---


  /* ---------- Filtering (Memoized for performance) ---------- */
  const filteredBooks = useMemo(() => {
    const flat = Object.entries(allBooks).flatMap(([tier, books]) =>
      (books || []).map(b => ({ ...b, tier }))
    );
    const s = (filters.search || '').toLowerCase();

    return flat
      .filter(b => {
        const cOK = filters.complexity === 'All' || b.complexity === filters.complexity;
        const dOK = b.duration <= filters.maxDuration;
        const sOK = !s || b.title.toLowerCase().includes(s) || b.author.toLowerCase().includes(s) || (b.focus || '').toLowerCase().includes(s);
        return cOK && dOK && sOK;
      })
      .reduce((acc, b) => {
        (acc[b.tier] ||= []).push(b);
        return acc;
      }, {});
  }, [allBooks, filters]);

  /* ---------- Flyer generation (AI now drives content) ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBook) { setHtmlFlyer(''); return; }
      
      const tierKey = selectedTier || Object.keys(allBooks).find(k => (allBooks[k] || []).some(b => b.id === selectedBook.id)) || 'Strategy & Execution';

      // V2 FIX: SIMPLIFY LOADING MESSAGE (No spinning)
      setHtmlFlyer(`<div style="padding:12px;border:1px dashed ${COLORS.SUBTLE};border-radius:12px;color:${COLORS.MUTED};text-align:center;">
                      <div class="flex items-center justify-center gap-2" style="color: ${COLORS.PURPLE}">
                          <Cpu class="w-5 h-5"/> 
                          Flyer being generated...
                      </div>
                    </div>`);
      // END V2 FIX

      // Call the production-focused function with secure error handling
      const html = await buildAIFlyerHTML({ 
        book: selectedBook, 
        tier: tierKey, 
        executive: isExecutiveBrief, 
        callSecureGeminiAPI 
      });
      
      if (!cancelled) setHtmlFlyer(html);
    })();
    return () => { cancelled = true; };
  }, [selectedBook, selectedTier, isExecutiveBrief, allBooks, callSecureGeminiAPI]);

  /* ---------- Reset contextual state when changing book ---------- */
  useEffect(() => {
    if (selectedBook) {
      setIsExecutiveBrief(false);
      setAiQuery('');
      setAiResponse('');
      setIsSubmitting(false);
      setIsCommitted(false); // Reset commitment status
    }
  }, [selectedBook]);

  useEffect(() => {
    const handler = () => setSelectedBook(null);
    window.addEventListener('lr-close-flyer', handler);
    return () => window.removeEventListener('lr-close-flyer', handler);
  }, []);



  /* ---------- Actions ---------- */
  const handleCommitment = (book) => {
    const newCommitment = {
      id: book.id,
      title: `Read: ${book.title} (${book.author})`,
      category: 'Reading',
      tier: selectedTier,
      notes: `Flyer theme: ${book.theme}. Est. ${book.duration} min.`,
      status: 'Active',
      progressMinutes: 0,
      totalDuration: book.duration,
      createdAt: new Date().toISOString(),
    };
    // The real updateCommitmentData must handle adding the new commitment to the active_commitments array
    const ok = updateCommitmentData(data => ({
        active_commitments: [...(data?.active_commitments || []), newCommitment]
    }));
    if (ok) {
        setIsCommitted(true);
        setTimeout(() => navigate('daily-practice'), 1500); // Navigate after brief confirmation
    } else console.error('Failed to add commitment.');
  };

  const handleSaveForLater = (bookId) => {
    setSavedBooks(prev => ({ ...prev, [bookId]: !prev[bookId] }));
  };
  
  // Wrapped AI Submit handler for component context
  const submitHandler = useCallback((e) => {
      handleAiSubmit(e, services, selectedBook, aiQuery, setIsSubmitting, setAiResponse);
  }, [aiQuery, selectedBook, services, setIsSubmitting, setAiResponse]);
  

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
      <div className='flex items-center gap-4 border-b-2 pb-2 mb-8' style={{borderColor: COLORS.PURPLE+'30'}}>
          <BookOpen className='w-10 h-10' style={{color: COLORS.PURPLE}}/>
          <h1 className="text-4xl font-extrabold" style={{ color: COLORS.NAVY }}>Professional Reading Hub</h1>
      </div>
      
      {!selectedBook && <BookListStable 
          COLORS={COLORS} 
          COMPLEXITY_MAP={COMPLEXITY_MAP} 
          filters={filters} 
          filteredBooks={filteredBooks} 
          savedBooks={savedBooks} 
          selectedBook={selectedBook} 
          onSelectBook={(book, tier) => { setSelectedBook(book); setSelectedTier(tier); }} 
          onToggleSave={handleSaveForLater} 
          handleSearchChange={handleSearchChange} 
          handleFilterChange={handleFilterChange} 
      />}
      {selectedBook && <BookFlyerStable 
          COLORS={COLORS} 
          selectedBook={selectedBook} 
          htmlFlyer={htmlFlyer} 
          isExecutiveBrief={isExecutiveBrief} 
          setIsExecutiveBrief={setIsExecutiveBrief} 
          questionFeedback={questionFeedback} 
          aiResponse={aiResponse} 
          aiQuery={aiQuery} 
          handleAiQueryChange={handleAiQueryChange} 
          submitHandler={submitHandler} 
          savedBooks={savedBooks} 
          onToggleSave={handleSaveForLater} 
          onCommit={() => handleCommitment(selectedBook)} 
          isCommitted={isCommitted} 
          isSubmitting={isSubmitting} 
      />}
    </div>
  );
}