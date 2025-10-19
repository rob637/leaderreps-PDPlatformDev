
/* eslint-disable no-console */
import React, { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { useAppServices } from '../../App.jsx';
import {
  BookOpen, Target, CheckCircle, Clock, AlertTriangle,
  MessageSquare, Filter, TrendingUp, Star, Search as SearchIcon
} from 'lucide-react';

/* =========================================================
   HIGH-CONTRAST PALETTE
========================================================= */
const COLORS = {
  BG: '#FFFFFF',
  SURFACE: '#FFFFFF',
  BORDER: '#1F2937',
  SUBTLE: '#E5E7EB',
  TEXT: '#0F172A',
  MUTED: '#4B5563',
  NAVY: '#0B3B5B',
  TEAL: '#219E8B',
  BLUE: '#2563EB',
  ORANGE: '#E04E1B',
  GREEN: '#10B981',
  AMBER: '#F59E0B',
  RED: '#EF4444',
};

const COMPLEXITY_MAP = {
  Low:    { label: 'Novice',       hex: COLORS.GREEN, icon: CheckCircle },
  Medium: { label: 'Intermediate', hex: COLORS.AMBER, icon: AlertTriangle },
  High:   { label: 'Expert',       hex: COLORS.RED,   icon: Target },
};

/* =========================================================
   SAFETY: Ensure ExecSwitch exists (prevents "not defined" at runtime)
========================================================= */
const ExecSwitch = (function defineExecSwitch(){
  const Component = function ExecSwitch({ checked, onChange }) {
    const toggle = () => onChange(!checked);
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    };
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={toggle}
          onKeyDown={onKey}
          className="relative inline-flex items-center"
          style={{ width: 46, height: 26 }}
        >
          <span
            style={{
              position: 'absolute',
              inset: 0,
              background: checked ? COLORS.ORANGE : '#9CA3AF',
              borderRadius: 9999,
              transition: 'background .15s ease'
            }}
          />
          <span
            style={{
              position: 'relative',
              left: checked ? 22 : 2,
              width: 22,
              height: 22,
              background: '#FFFFFF',
              borderRadius: '9999px',
              boxShadow: '0 1px 2px rgba(0,0,0,.2)',
              transition: 'left .15s ease'
            }}
          />
        </button>
        <span style={{ color: COLORS.NAVY, fontWeight: 600 }}>Executive Brief</span>
      </div>
    );
  };
  return Component;
})();

/* =========================================================
   MOCK BOOKS (fallback if context has none)
========================================================= */
const MOCK_ALL_BOOKS = {
  'Strategy & Execution': [
    { id: 's_e_1', title: 'The E-Myth Revisited', author: 'Michael E. Gerber', theme: 'Why most small businesses fail and how to build a scalable system.', complexity: 'Medium', duration: 180, focus: 'Delegation, Process Mapping, Systemization' },
    { id: 's_e_2', title: 'Good to Great', author: 'Jim Collins', theme: 'How some companies make the leap to enduring greatness.', complexity: 'High', duration: 240, focus: 'Level 5 Leadership, Hedgehog Concept, Discipline' },
    { id: 's_e_3', title: 'Measure What Matters', author: 'John Doerr', theme: 'Achieving ambitious goals using OKRs.', complexity: 'Medium', duration: 200, focus: 'Goal Setting, Quarterly Planning, Accountability' },
    { id: 's_e_4', title: 'Getting Things Done', author: 'David Allen', theme: 'Stress-free productivity with GTD.', complexity: 'Low', duration: 150, focus: 'Task Management, Workflow Design, Capture' },
    { id: 's_e_5', title: 'Playing to Win', author: 'A.G. Lafley & Roger L. Martin', theme: 'A practical guide to strategy as choice.', complexity: 'High', duration: 220, focus: 'Strategy Choices, Capabilities, Management Systems' },
    { id: 's_e_6', title: 'Blue Ocean Strategy', author: 'W. Chan Kim & Renée Mauborgne', theme: 'Create uncontested market space.', complexity: 'High', duration: 230, focus: 'Value Innovation, Noncustomers, Strategy Canvas' },
  ],
  'People & Culture': [
    { id: 'p_c_1', title: 'Dare to Lead', author: 'Brené Brown', theme: 'Courageous leadership by embracing vulnerability and trust.', complexity: 'Medium', duration: 210, focus: 'Psychological Safety, Feedback, Vulnerability' },
    { id: 'p_c_2', title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', theme: 'Common pitfalls that prevent teams from working.', complexity: 'Low', duration: 150, focus: 'Team Building, Conflict Management, Trust' },
    { id: 'p_c_3', title: 'Radical Candor', author: 'Kim Scott', theme: 'Challenging directly while caring personally.', complexity: 'Medium', duration: 190, focus: 'Feedback Delivery, Coaching, Guidance' },
    { id: 'p_c_4', title: 'Leaders Eat Last', author: 'Simon Sinek', theme: 'Building trust and safety in teams.', complexity: 'Low', duration: 200, focus: 'Trust, Empathy, Team Cohesion' },
    { id: 'p_c_5', title: 'No Rules Rules', author: 'Reed Hastings & Erin Meyer', theme: 'Netflix and the culture of reinvention.', complexity: 'High', duration: 240, focus: 'Candor, Talent Density, Freedom & Responsibility' },
  ],
  'Self-Awareness & Growth': [
    { id: 's_a_1', title: 'Atomic Habits', author: 'James Clear', theme: 'Build good habits by tiny improvements.', complexity: 'Low', duration: 180, focus: 'Habit Formation, Self-Discipline, Identity' },
    { id: 's_a_2', title: 'Mindset', author: 'Carol Dweck', theme: 'Fixed vs Growth Mindsets.', complexity: 'Medium', duration: 190, focus: 'Growth Mindset, Resilience, Learning' },
    { id: 's_a_3', title: 'Essentialism', author: 'Greg McKeown', theme: 'Pursue the essential, eliminate the rest.', complexity: 'Low', duration: 160, focus: 'Prioritization, Saying No, Focus' },
    { id: 's_a_4', title: 'Deep Work', author: 'Cal Newport', theme: 'Rules for focused success in a distracted world.', complexity: 'Medium', duration: 200, focus: 'Focus, Attention, Productivity' },
    { id: 's_a_5', title: 'The First 90 Days', author: 'Michael D. Watkins', theme: 'Strategies for leaders in transition.', complexity: 'Medium', duration: 210, focus: 'Onboarding, Alignment, Early Wins' },
  ],
  'Innovation & Change': [
    { id: 'i_c_1', title: 'The Lean Startup', author: 'Eric Ries', theme: 'Build-measure-learn with continuous innovation.', complexity: 'High', duration: 250, focus: 'MVP, Build-Measure-Learn, Iteration' },
    { id: 'i_c_2', title: 'Start With Why', author: 'Simon Sinek', theme: 'The Golden Circle and purpose-driven leadership.', complexity: 'Medium', duration: 180, focus: 'Golden Circle, Purpose-Driven, Inspiration' },
    { id: 'i_c_3', title: "The Innovator's Dilemma", author: 'Clayton Christensen', theme: 'Why great firms fail when technologies change.', complexity: 'High', duration: 240, focus: 'Disruption, Value Networks, Technology S-Curves' },
    { id: 'i_c_4', title: 'Switch', author: 'Chip & Dan Heath', theme: 'How to change things when change is hard.', complexity: 'Low', duration: 180, focus: 'Rider-Elephant-Path, Behavior Change, Influence' },
  ],
  'Sales & Influence': [
    { id: 's_i_1', title: 'Influence', author: 'Robert Cialdini', theme: 'The psychology of persuasion.', complexity: 'Medium', duration: 210, focus: 'Reciprocity, Social Proof, Scarcity' },
    { id: 's_i_2', title: 'Never Split the Difference', author: 'Chris Voss', theme: 'Negotiation lessons from the FBI.', complexity: 'Medium', duration: 210, focus: 'Mirroring, Labeling, Tactical Empathy' },
    { id: 's_i_3', title: 'SPIN Selling', author: 'Neil Rackham', theme: 'Consultative selling framework.', complexity: 'Medium', duration: 200, focus: 'Situation, Problem, Implication, Need-Payoff' },
    { id: 's_i_4', title: 'The Challenger Sale', author: 'Matthew Dixon & Brent Adamson', theme: 'Teach, Tailor, and Take Control.', complexity: 'High', duration: 220, focus: 'Reframing, Commercial Insight, Control' },
    { id: 's_i_5', title: 'To Sell Is Human', author: 'Daniel H. Pink', theme: 'Everyone is in sales now.', complexity: 'Low', duration: 180, focus: 'Attunement, Buoyancy, Clarity' },
  ],
  'Product & Design': [
    { id: 'p_d_1', title: 'Inspired', author: 'Marty Cagan', theme: 'How to create tech products customers love.', complexity: 'High', duration: 240, focus: 'Discovery, Empowered Teams, Product Strategy' },
    { id: 'p_d_2', title: 'Lean UX', author: 'Jeff Gothelf', theme: 'Collaborative design for agile teams.', complexity: 'Medium', duration: 200, focus: 'Hypotheses, Experiments, Collaboration' },
    { id: 'p_d_3', title: 'Hooked', author: 'Nir Eyal', theme: 'How to build habit-forming products.', complexity: 'Medium', duration: 190, focus: 'Triggers, Actions, Variable Rewards' },
    { id: 'p_d_4', title: 'Sprint', author: 'Jake Knapp', theme: 'Solve big problems and test new ideas in five days.', complexity: 'Low', duration: 170, focus: 'Prototyping, Testing, Speed' },
    { id: 'p_d_5', title: "Don't Make Me Think", author: 'Steve Krug', theme: 'Common-sense approach to web usability.', complexity: 'Low', duration: 150, focus: 'Usability, Navigation, Clarity' },
  ],
  'Finance & Decision-Making': [
    { id: 'f_d_1', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', theme: 'Two systems of thought and their biases.', complexity: 'High', duration: 260, focus: 'Heuristics, Biases, Decision Hygiene' },
    { id: 'f_d_2', title: 'The Psychology of Money', author: 'Morgan Housel', theme: 'Timeless lessons on wealth, greed, and happiness.', complexity: 'Low', duration: 180, focus: 'Behavioral Finance, Risk, Compounding' },
    { id: 'f_d_3', title: 'Financial Intelligence', author: 'Karen Berman & Joe Knight', theme: "A manager's guide to knowing what the numbers really mean.", complexity: 'Medium', duration: 210, focus: 'Income Statement, Cash Flow, Ratios' },
    { id: 'f_d_4', title: 'Superforecasting', author: 'Philip Tetlock & Dan Gardner', theme: 'The art and science of prediction.', complexity: 'High', duration: 220, focus: 'Calibration, Fermi Estimates, Aggregation' },
  ],
  'Communication & Writing': [
    { id: 'c_w_1', title: 'Made to Stick', author: 'Chip & Dan Heath', theme: 'Why some ideas survive and others die.', complexity: 'Low', duration: 180, focus: 'Simplicity, Unexpectedness, Stories' },
    { id: 'c_w_2', title: 'On Writing Well', author: 'William Zinsser', theme: 'Fundamentals of clear non-fiction writing.', complexity: 'Low', duration: 180, focus: 'Clarity, Brevity, Voice' },
    { id: 'c_w_3', title: 'Storytelling with Data', author: 'Cole Nussbaumer Knaflic', theme: 'Effective data communication.', complexity: 'Medium', duration: 200, focus: 'Charts, Context, Narrative' },
    { id: 'c_w_4', title: 'Confessions of a Public Speaker', author: 'Scott Berkun', theme: 'Real-world lessons for presentations.', complexity: 'Low', duration: 170, focus: 'Delivery, Anxiety, Audience' },
  ],
};

/* =========================================================
   LIGHTWEIGHT HTML SANITIZER (allow basic tags/attrs only)
========================================================= */
function sanitizeHTML(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';
  let clean = dirty.replace(/<\/?(script|style)[^>]*>/gi, '');
  clean = clean.replace(/\son\w+="[^"]*"/gi, '');
  clean = clean.replace(/\son\w+='[^']*'/gi, '');
  clean = clean.replace(/(href|src)\s*=\s*"(javascript:[^"]*)"/gi, '$1="#"');
  clean = clean.replace(/(href|src)\s*=\s*'(javascript:[^']*)'/gi, '$1="#"');
  return clean;
}

/* =========================================================
   AI COACH (LOCAL TIPS FALLBACK)
========================================================= */
const mockAIResponse = (bookTitle, focusAreas, query) => {
  const q = (query || '').toLowerCase();
  if (bookTitle.includes('E-Myth')) {
    if (q.includes('delegate') || q.includes('system') || q.includes('hand off')) {
      return `Design a **5-step checklist** and delegate the checklist—not the task. Move from people-dependency to **system-dependency**.`;
    }
    if (q.includes('growth') || q.includes('scaling')) {
      return `Map three core processes (sales, ops, finance). Scale the processes first; then plug people into them.`;
    }
    return `Separate roles: Entrepreneur (vision), Manager (process), Technician (execution). Build the system that does the work.`;
  }
  if (bookTitle.includes('Good to Great')) {
    if (q.includes('hedgehog') || q.includes('core')) {
      return `Hedgehog = **Passion ∩ Best in the World ∩ Economic Engine**. If it misses one, stop doing it.`;
    }
    if (q.includes('leader') || q.includes('culture') || q.includes('management')) {
      return `Start with **Level 5 Leadership** and **First Who, Then What**. Fix the people system before the plan.`;
    }
    return `Apply disciplined people, thought, and action. Get the “who” right, then push the flywheel.`;
  }
  if (bookTitle.includes('Radical Candor')) {
    if (q.includes('feedback') || q.includes('difficult')) {
      return `Aim for **Caring Personally + Challenging Directly**. Be specific, timely, and discuss behavior, not identity.`;
    }
    if (q.includes('criticism') || q.includes('praise')) {
      return `Ask for criticism first, then model candor in the way you give it.`;
    }
    return `Reinforce the relationship, then deliver the direct challenge.`;
  }
  if (bookTitle.includes('Atomic Habits')) {
    if (q.includes('start') || q.includes('new habit') || q.includes('consistency')) {
      return `Use the **2-Minute Rule**; stack on an existing habit; add an immediate reward.`;
    }
    if (q.includes('break') || q.includes('stop')) {
      return `Invert the Four Laws: make it **Invisible, Unattractive, Difficult, Unsatisfying**—add friction and remove cues.`;
    }
    return `Shift identity: “What would a disciplined person do right now?”`;
  }
  return `Define the outcome, then apply **${(focusAreas && focusAreas[0]) || 'core'}** principles to design the smallest repeatable action.`;
};

/* =========================================================
   POSTER FLYER (fallback HTML; condensed when exec brief ON)
========================================================= */
function generatePosterFlyerHTML(book, tier, isExecutiveBrief) {
  const focus = (book.focus || '').split(',').map(s => s.trim()).filter(Boolean);
  if (isExecutiveBrief) {
    return `
      <div style="display:flex;flex-direction:column;gap:12px">
        <header style="border-bottom:3px solid ${COLORS.ORANGE};padding-bottom:10px">
          <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:.13em;color:${COLORS.TEAL};font-weight:800;text-transform:uppercase">${tier} Competency</p>
          <h2 style="margin:0;color:${COLORS.NAVY};font-weight:900;font-size:30px;line-height:1.05;letter-spacing:-.02em;text-shadow:0 1px 0 #fff">${book.title}</h2>
          <p style="margin:6px 0 0 0;color:${COLORS.ORANGE};font-weight:800">by ${book.author}</p>
        </header>
        <p style="margin:0;color:${COLORS.TEXT}">${book.theme || 'Practical ideas you can apply this week.'}</p>
        <ul style="margin:0 0 0 18px;color:${COLORS.TEXT}">
          <li><strong>Focus:</strong> ${focus[0] || 'Apply one core behavior daily'}</li>
          <li><strong>Next action:</strong> schedule a 20‑minute practice block today</li>
        </ul>
      </div>
    `;
  }
  const skills = focus.map(f => `<li style="margin:6px 0">${f}</li>`).join('');
  const posterBg = `linear-gradient(180deg, #ffffff 0%, #FAFAFB 100%)`;
  const posterTexture = `repeating-linear-gradient(0deg, rgba(0,0,0,.018) 0, rgba(0,0,0,.018) 2px, transparent 2px, transparent 5px)`;
  return `
    <div style="display:flex;flex-direction:column;gap:18px;
                background:${posterBg};background-image:${posterBg}, ${posterTexture};
                border:1px solid ${COLORS.SUBTLE}; border-radius:16px; padding:18px;
                box-shadow:0 10px 30px rgba(0,0,0,.05)">

      <header style="padding-bottom:12px; position:relative">
        <p style="margin:0 0 6px 0;font-size:12px;letter-spacing:.14em;color:${COLORS.TEAL};font-weight:900;text-transform:uppercase">${tier} Competency</p>
        <h2 style="margin:0;color:${COLORS.NAVY};font-weight:900;font-size:34px;line-height:1.04;letter-spacing:-.02em;text-shadow:0 1px 0 #fff">
          ${book.title}
        </h2>
        <p style="margin:6px 0 0 0;color:${COLORS.ORANGE};font-weight:800">by ${book.author}</p>
        <div style="height:6px;width:120px;background:${COLORS.ORANGE};border-radius:6px; margin-top:10px"></div>
      </header>

      <section style="display:grid;grid-template-columns:1fr 1fr;gap:18px;align-items:start;
                      background-image: linear-gradient(to bottom, ${COLORS.SUBTLE} 0, ${COLORS.SUBTLE} 100%);
                      background-size: 1px calc(100% - 24px);
                      background-position: calc(50%) 12px;
                      background-repeat: no-repeat;">

        <div style="padding:14px;border:1px solid ${COLORS.SUBTLE};border-radius:12px;background:#FFFFFF">
          <h3 style="margin:0 0 10px 0;color:${COLORS.NAVY};font-weight:900;letter-spacing:.01em">Summary</h3>
          <p style="margin:0;color:${COLORS.TEXT};line-height:1.65">
            ${book.theme || 'A concise, practical set of ideas you can apply immediately.'}
          </p>
        </div>

        <div style="padding:14px;border:1px solid ${COLORS.SUBTLE};border-radius:12px;background:#FFFFFF">
          <h3 style="margin:0 0 10px 0;color:${COLORS.NAVY};font-weight:900;letter-spacing:.01em">Book Metrics</h3>
          <div style="display:flex;gap:14px;flex-wrap:wrap;color:${COLORS.TEXT}">
            <div><strong>Est. Minutes:</strong> ${book.duration}</div>
            <div><strong>Complexity:</strong> <span style="color:${COMPLEXITY_MAP[book.complexity]?.hex || COLORS.AMBER};font-weight:900">${COMPLEXITY_MAP[book.complexity]?.label || 'Intermediate'}</span></div>
          </div>
        </div>

        <div style="padding:14px;border:1px solid ${COLORS.SUBTLE};border-radius:12px;background:#FFFFFF">
          <h3 style="margin:0 0 10px 0;color:${COLORS.NAVY};font-weight:900;letter-spacing:.01em">Core Skills</h3>
          <ul style="margin:0 0 0 18px;color:${COLORS.TEXT}">${skills || '<li>Define one concrete outcome you can repeat</li>'}</ul>
        </div>

        <div style="padding:14px;border:1px solid ${COLORS.SUBTLE};border-radius:12px;background:#FFFFFF">
          <h3 style="margin:0 0 10px 0;color:${COLORS.NAVY};font-weight:900;letter-spacing:.01em">Suggested Action Plan</h3>
          <ul style="margin:0 0 0 18px;color:${COLORS.TEXT}">
            <li><strong>Pace:</strong> nine 20‑minute sessions</li>
            <li><strong>Reflect:</strong> one note per chapter; share with a peer</li>
          </ul>
        </div>
      </section>
    </div>
  `;
}

/* =========================================================
   AI FLYER GENERATOR
========================================================= */
async function buildAIFlyerHTML({ book, tier, executive, callSecureGeminiAPI }) {
  if (!callSecureGeminiAPI) return generatePosterFlyerHTML(book, tier, executive);
  const baseInstruction = executive
    ? `Write an EXECUTIVE BRIEF for the book below in 120–180 words max, bullet-first…`
    : `Create a one-page BOOK FLYER (Key Ideas, Frameworks, Quotes, Manager's 30/60/90, Metrics, Pitfalls)…`;

  const systemPrompt = `You are the LeaderReps AI Researcher. Provide accurate, practical guidance.`;
  const userPrompt =
    `${baseInstruction}\n\nBook: ${book.title} by ${book.author}\nFocus: ${(book.focus || '')}\nComplexity: ${book.complexity}\nMinutes: ${book.duration}\nTier: ${tier}`;

  try {
    let out = await callSecureGeminiAPI({ systemPrompt, userPrompt });
    if (!out) out = await callSecureGeminiAPI(`${systemPrompt}\n\n${userPrompt}`);
    let html = '';
    if (typeof out === 'string') html = out;
    else if (out?.text) html = out.text;
    else if (out?.response) html = out.response;
    else if (Array.isArray(out?.candidates) && out.candidates[0]?.text) html = out.candidates[0].text;
    else html = JSON.stringify(out);
    html = sanitizeHTML(html);
    if (!/[<][a-zA-Z]/.test(html)) html = `<div><p>${html.replace(/\n/g, '<br/>')}</p></div>`;
    return html;
  } catch (e) {
    console.error('AI flyer error (fallback to poster):', e);
    return generatePosterFlyerHTML(book, tier, executive);
  }
}

/* =========================================================
   MAIN COMPONENT
========================================================= */
export default function BusinessReadingsScreen() {
  const services = (typeof useAppServices === 'function' ? useAppServices() : {}) || {};
  const {
    allBooks: contextBooks = {},
    updateCommitmentData = () => true,
    navigate = () => {},
    callSecureGeminiAPI,
    hasGeminiKey,
  } = services;

  const [showDbg, setShowDbg] = useState(() => {
    try { return typeof window !== 'undefined' && /[?&]dbg=1\b/.test(window.location.search); }
    catch { return false; }
  });
  const [debugStamp] = useState(() => new Date().toLocaleString());

  const [selectedBook, setSelectedBook] = useState(null);
  const [htmlFlyer, setHtmlFlyer] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [savedBooks, setSavedBooks] = useState({});
  const [isExecutiveBrief, setIsExecutiveBrief] = useState(false);
  const [filters, setFilters] = useState({ complexity: 'All', maxDuration: 300, search: '' });
  const [hoveredId, setHoveredId] = useState(null);

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const aiInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const [focusedField, setFocusedField] = useState(null);
  const lastSelSearch = useRef({ start: null, end: null });
  const lastSelCoach = useRef({ start: null, end: null });

  useEffect(() => {
    try {
      if (globalThis.notepad?.addContent) {
        globalThis.notepad.setTitle('LeaderReps Notepad');
        globalThis.notepad.addContent('📚 BusinessReadings mounted.');
      }
    } catch {}
  }, []);

  const allBooks = Object.keys(contextBooks).length ? contextBooks : MOCK_ALL_BOOKS;

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBook) { setHtmlFlyer(''); return; }
      const tierKey = selectedTier || Object.keys(allBooks).find(k => (allBooks[k] || []).some(b => b.id === selectedBook.id)) || 'Strategy & Execution';
      setHtmlFlyer(`<div style="padding:12px;border:1px dashed ${COLORS.SUBTLE};border-radius:12px;color:${COLORS.MUTED}">Generating ${isExecutiveBrief ? 'executive brief' : 'book flyer'}…</div>`);
      let html;
      if (hasGeminiKey?.() && typeof callSecureGeminiAPI === 'function') {
        html = await buildAIFlyerHTML({ book: selectedBook, tier: tierKey, executive: isExecutiveBrief, callSecureGeminiAPI });
      } else {
        html = generatePosterFlyerHTML(selectedBook, tierKey, isExecutiveBrief);
      }
      if (!cancelled) setHtmlFlyer(html);
    })();
    return () => { cancelled = true; };
  }, [selectedBook, selectedTier, isExecutiveBrief, allBooks]);

  useEffect(() => {
    if (selectedBook) {
      setIsExecutiveBrief(false);
      setAiQuery('');
      setAiResponse('');
    }
  }, [selectedBook]);

  const rememberCaret = (ref, store) => {
    try {
      if (!ref.current) return;
      store.start = ref.current.selectionStart;
      store.end = ref.current.selectionEnd;
    } catch {}
  };

  useLayoutEffect(() => {
    if (focusedField === 'search' && searchInputRef.current) {
      const el = searchInputRef.current;
      if (document.activeElement !== el) el.focus();
      if (lastSelSearch.current.start != null) {
        try { el.setSelectionRange(lastSelSearch.current.start, lastSelSearch.current.end); } catch {}
      }
    }
  }, [filters.search, focusedField]);

  useLayoutEffect(() => {
    if (focusedField === 'coach' && aiInputRef.current) {
      const el = aiInputRef.current;
      if (document.activeElement !== el) el.focus();
      if (lastSelCoach.current.start != null) {
        try { el.setSelectionRange(lastSelCoach.current.start, lastSelCoach.current.end); } catch {}
      }
    }
  }, [aiQuery, focusedField]);

  const handleAiSubmit = useCallback(async (e) => {
    e.preventDefault();
    const q = aiQuery.trim();
    if (!selectedBook || !q) return;
    setAiResponse('Thinking…');
    const focusAreas = (selectedBook.focus || '').split(',').map(s => s.trim()).filter(Boolean);
    try {
      if (hasGeminiKey?.() && typeof callSecureGeminiAPI === 'function') {
        const systemPrompt =
          `You are the LeaderReps AI Coach.\n` +
          `- Book: ${selectedBook.title} by ${selectedBook.author}\n` +
          `- Focus areas: ${focusAreas.join(', ') || '—'}\n` +
          `Respond in 3–5 sentences plus 1–2 concrete next actions.`;
        const userPrompt = q;
        let out = await callSecureGeminiAPI({ systemPrompt, userPrompt });
        if (!out) out = await callSecureGeminiAPI(`${systemPrompt}\n\nUser: ${userPrompt}`);
        let text = '';
        if (typeof out === 'string') text = out;
        else if (out?.text) text = out.text;
        else if (out?.response) text = out.response;
        else if (Array.isArray(out?.candidates) && out.candidates[0]?.content) text = out.candidates[0].content;
        else if (Array.isArray(out?.candidates) && out.candidates[0]?.text) text = out.candidates[0].text;
        else text = JSON.stringify(out);
        setAiResponse(text || 'No response.');
      } else {
        const tip = mockAIResponse(selectedBook.title, focusAreas, q);
        setAiResponse(tip);
      }
    } catch (err) {
      console.error('AI error:', err);
      const tip = mockAIResponse(selectedBook.title, focusAreas, q);
      setAiResponse(`(AI error; using local tips)\n\n${tip}`);
    }
  }, [aiQuery, selectedBook, callSecureGeminiAPI, hasGeminiKey]);

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
    const ok = updateCommitmentData(newCommitment);
    if (ok) navigate('daily-practice');
    else console.error('Failed to add commitment.');
  };

  const handleSaveForLater = (bookId) => {
    setSavedBooks(prev => ({ ...prev, [bookId]: !prev[bookId] }));
  };

  const BookList = () => (
    <div className="space-y-10">
      <h2 className="text-3xl font-extrabold flex items-center gap-3 border-b-4 pb-2"
          style={{ color: COLORS.NAVY, borderColor: COLORS.ORANGE }}>
        <BookOpen className="w-7 h-7" style={{ color: COLORS.TEAL }}/> LeaderReps Curated Reading Library
      </h2>

      <div className="p-5 rounded-xl shadow-xl border" style={{ background: COLORS.SURFACE, borderColor: COLORS.SUBTLE }}>
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.NAVY }}>
          <Filter className="w-5 h-5" style={{ color: COLORS.ORANGE }}/> Personalize Your Search
        </h3>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: COLORS.MUTED }}>
            <SearchIcon className="w-4 h-4" style={{ color: COLORS.TEAL }}/> Search by Title, Author, or Focus
          </label>
          <input
            type="text"
            ref={searchInputRef}
            value={filters.search}
            onFocus={() => setFocusedField('search')}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => { rememberCaret(searchInputRef, lastSelSearch.current); setFilters(prev => ({ ...prev, search: e.target.value })); }}
            onInput={(e) => { rememberCaret(searchInputRef, lastSelSearch.current); setFilters(prev => ({ ...prev, search: e.target.value })); }}
            placeholder="Start typing to find a book..."
            className="w-full p-3 border rounded-lg shadow-sm focus:outline-none"
            style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>Complexity Level</label>
            <select
              value={filters.complexity}
              onChange={(e) => setFilters({ ...filters, complexity: e.target.value })}
              className="w-full p-2 border rounded-lg shadow-sm focus:outline-none"
              style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
            >
              <option value="All">All Levels</option>
              {Object.keys(COMPLEXITY_MAP).map(k => (
                <option key={k} value={k}>{COMPLEXITY_MAP[k].label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>
              Max Est. Learning Minutes ({filters.maxDuration} minutes)
            </label>
            <input
              type="range"
              min="150"
              max="300"
              step="10"
              value={filters.maxDuration}
              onChange={(e) => setFilters({ ...filters, maxDuration: parseInt(e.target.value, 10) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1" style={{ color: COLORS.MUTED }}>
              <span>150 min (Quick Reads)</span>
              <span>300 min (Deep Dive)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(filteredBooks).map(([tier, books]) => (
          <div key={tier}
               className="rounded-2xl shadow-xl overflow-hidden border-2"
               style={{ background: COLORS.SURFACE, borderColor: COLORS.SUBTLE }}>
            <div className="p-6" style={{ background: COLORS.NAVY }}>
              <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: COLORS.SURFACE }}>
                {tier}
              </h3>
              <p className="text-base mt-1" style={{ color: '#E5E7EB' }}>
                Foundational books for this competency. ({books.length} available)
              </p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(books || []).map((book) => {
                const c = COMPLEXITY_MAP[book.complexity] || COMPLEXITY_MAP.Medium;
                const isSaved = !!savedBooks[book.id];
                const isSelected = selectedBook?.id === book.id;
                const isHovered = hoveredId === book.id;

                return (
                  <div key={book.id} className="relative">
                    <button
                      onMouseEnter={() => setHoveredId(book.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      onClick={() => { setSelectedBook(book); setSelectedTier(tier); }}
                      className="p-5 text-left w-full h-full block rounded-2xl border-2 transition-all"
                      style={{
                        background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)',
                        borderColor: isSelected ? COLORS.TEAL : (isHovered ? COLORS.NAVY : COLORS.SUBTLE),
                        boxShadow: (isSelected || isHovered) ? '0 12px 30px rgba(0,0,0,.12)' : '0 2px 8px rgba(0,0,0,.06)',
                        color: COLORS.TEXT,
                        position: 'relative'
                      }}
                    >
                      <span style={{
                        position:'absolute',top:0,left:0,right:0,height:6,
                        background: isSelected ? COLORS.TEAL : COLORS.ORANGE,
                        borderTopLeftRadius:14,borderTopRightRadius:14
                      }} />

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

                      <div className="flex flex-col text-sm gap-2" style={{ color: COLORS.TEXT }}>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4" style={{ color: COLORS.ORANGE, marginRight: 8 }}/>
                          <span className="font-semibold">Learning Mins:</span>
                          <span className="ml-auto font-bold">{book.duration} min</span>
                        </div>
                        <div className="flex items-center">
                          <c.icon className="w-4 h-4" style={{ color: c.hex, marginRight: 8 }}/>
                          <span className="font-semibold">Complexity:</span>
                          <span className="ml-auto font-bold" style={{ color: c.hex }}>{c.label}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid #F3F4F6' }}>
                        <p className="text-xs font-semibold" style={{ color: COLORS.TEAL }}>Key Focus</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(book.focus || '').split(',').slice(0, 3).map((f, i) => (
                            <span key={i}
                                  className="px-2 py-0.5 text-xs font-medium rounded-full"
                                  style={{ background: '#F3F4F6', color: '#4B5563' }}>
                              {f.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleSaveForLater(book.id); }}
                      aria-label={isSaved ? 'Remove from Saved' : 'Save for Later'}
                      className="absolute top-2 right-2 p-2 rounded-full"
                      style={{
                        background: isSaved ? COLORS.AMBER : '#FFFFFFCC',
                        color: isSaved ? '#FFFFFF' : '#9CA3AF',
                        boxShadow: '0 1px 2px rgba(0,0,0,.2)'
                      }}
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

  const BookFlyer = () => {
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
            onClick={() => setSelectedBook(null)}
            className="font-semibold px-3 py-2 rounded border"
            style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}
          >
            ← Back to Library
          </button>
        </div>

        <div className="rounded-2xl shadow-2xl p-8 border" style={{ background: COLORS.SURFACE, borderColor: COLORS.SUBTLE }}>
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 p-3 rounded border" style={{ background: '#F9FAFB', borderColor: COLORS.SUBTLE }}>
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

          <div className="max-w-none space-y-4" style={{ color: COLORS.TEXT }} dangerouslySetInnerHTML={{ __html: htmlFlyer }} />

          <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${COLORS.SUBTLE}` }}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3" style={{ color: COLORS.NAVY }}>
              <MessageSquare className="text-2xl w-6 h-6" style={{ color: COLORS.BLUE }}/> AI Coach: Instant Application
            </h3>

            {aiResponse && (
              <div className="p-4 mb-4 rounded" style={{ background: '#EFF6FF', border: '1px solid #93C5FD', color: COLORS.TEXT }}>
                <p className="text-sm font-semibold" style={{ color: '#1D4ED8' }}>AI Coach:</p>
                <p className="text-base" style={{ whiteSpace: 'pre-wrap' }}>{aiResponse}</p>
              </div>
            )}

            <form onSubmit={handleAiSubmit} className="flex gap-2">
              <input
                type="text"
                ref={aiInputRef}
                value={aiQuery}
                onFocus={() => setFocusedField('coach')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => { rememberCaret(aiInputRef, lastSelCoach.current); setAiQuery(e.target.value); }}
                onInput={(e) => { rememberCaret(aiInputRef, lastSelCoach.current); setAiQuery(e.target.value); }}
                placeholder={`Ask how to apply ${selectedBook.title} at work (e.g., "How do I delegate?")`}
                className="flex-grow p-3 border rounded"
                style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
                required
              />
              <button
                type="submit"
                className="px-4 rounded font-semibold flex items-center gap-1"
                style={{
                  background: aiQuery.trim() ? COLORS.BLUE : '#D1D5DB',
                  color: aiQuery.trim() ? '#FFFFFF' : '#6B7280',
                  cursor: aiQuery.trim() ? 'pointer' : 'not-allowed'
                }}
                disabled={!aiQuery.trim()}
              >
                <MessageSquare className="w-5 h-5" /> Ask
              </button>
            </form>
          </div>

          <div className="mt-10 pt-6 flex justify-end gap-4" style={{ borderTop: `1px solid ${COLORS.SUBTLE}` }}>
            <button
              onClick={() => handleSaveForLater(selectedBook.id)}
              className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl border-2"
              style={{
                background: COLORS.SURFACE,
                borderColor: savedBooks[selectedBook.id] ? COLORS.AMBER : COLORS.SUBTLE,
                color: savedBooks[selectedBook.id] ? '#B45309' : COLORS.MUTED
              }}
            >
              <Star className="w-5 h-5" fill={savedBooks[selectedBook.id] ? 'currentColor' : 'none'}/>
              {savedBooks[selectedBook.id] ? 'Saved to Library' : 'Save for Later'}
            </button>
            <button
              onClick={() => handleCommitment(selectedBook)}
              className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl"
              style={{
                background: COLORS.ORANGE, color: '#FFF',
                boxShadow: `0 8px 24px ${COLORS.ORANGE}45`
              }}
            >
              <TrendingUp className="w-5 h-5" /> Add to Daily Practice Commitment
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 min-h-screen" style={{ background: COLORS.BG, color: COLORS.TEXT }}>
      {showDbg && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            background: '#111827',
            color: '#FFFFFF',
            border: `2px solid ${COLORS.AMBER}`,
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12
          }}
        >
          <strong>Debug:</strong> BusinessReadings.jsx (v6.1 switch fix) mounted at {debugStamp}.
          <button
            onClick={() => setShowDbg(false)}
            style={{ float: 'right', background: 'transparent', color: '#FFFFFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
            aria-label="Dismiss debug banner"
          >
            ×
          </button>
        </div>
      )}

      <h1 className="text-4xl font-extrabold mb-10" style={{ color: COLORS.NAVY }}>Professional Reading Hub</h1>
      {!selectedBook && <BookList />}
      {selectedBook && <BookFlyer />}
    </div>
  );
}
