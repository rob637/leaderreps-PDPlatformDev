/* eslint-disable no-console  */
import React, { useState, useMemo, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
// FIX: The import is typically named 'useAppServices' in the app context
import { useAppServices } from '../../App.jsx'; 
import {
  BookOpen, Target, CheckCircle, Clock, AlertTriangle,
  MessageSquare, Filter, TrendingUp, Star, Search as SearchIcon, Users, Cpu
} from 'lucide-react';

/* =========================================================
   HIGH-CONTRAST PALETTE (From uiKit)
========================================================= */
const COLORS = {
  NAVY: '#002E47',
  TEAL: '#47A88D',
  SUBTLE_TEAL: '#349881',
  ORANGE: '#E04E1B',
  GREEN: '#10B981',
  AMBER: '#F59E0B',
  RED: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
  OFF_WHITE: '#FFFFFF',
  MUTED: '#4B5563',
  SUBTLE: '#E5E7EB',
};

const COMPLEXITY_MAP = {
  Low:    { label: 'Novice',       hex: COLORS.GREEN, icon: CheckCircle },
  Medium: { label: 'Intermediate', hex: COLORS.AMBER, icon: AlertTriangle },
  High:   { label: 'Expert',       hex: COLORS.RED,   icon: Target },
};

/* =========================================================
   UI COMPONENTS (Mocked from uiKit)
========================================================= */
const ExecSwitch = ({ checked, onChange }) => {
  const toggle = () => onChange(!checked);
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={toggle}
        className="relative inline-flex items-center"
        style={{ width: 46, height: 26 }}
      >
        <span
          style={{
            position: 'absolute', inset: 0, background: checked ? COLORS.ORANGE : '#9CA3AF',
            borderRadius: 9999, transition: 'background .15s ease'
          }}
        />
        <span style={{ position: 'relative', left: checked ? 22 : 2, width: 22, height: 22, background: '#FFFFFF', borderRadius: '9999px', boxShadow: '0 1px 2px rgba(0,0,0,.2)', transition: 'left .15s ease' }} />
      </button>
      <span style={{ color: COLORS.NAVY, fontWeight: 600 }}>Executive Brief</span>
    </div>
  );
};
const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', ...rest }) => {
    let baseStyle = "px-6 py-3 rounded-xl font-semibold transition-all shadow-lg focus:outline-none focus:ring-4 text-white";
    if (variant === 'primary') { baseStyle += ` bg-[${COLORS.TEAL}] hover:bg-[${COLORS.SUBTLE_TEAL}] focus:ring-[${COLORS.TEAL}]/50`; }
    else if (variant === 'secondary') { baseStyle += ` bg-[${COLORS.ORANGE}] hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`; }
    else if (variant === 'outline') { baseStyle = `px-6 py-3 rounded-xl font-semibold transition-all shadow-md border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}]/10 focus:ring-4 focus:ring-[${COLORS.TEAL}]/50 bg-[${COLORS.LIGHT_GRAY}]`; }
    if (disabled) { baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none"; }
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
      style={{ background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)', borderColor: '#E5E7EB', color: COLORS.NAVY }}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
      
      {Icon && (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center border mb-3" style={{ borderColor: '#E5E7EB', background: COLORS.LIGHT_GRAY }}>
          <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      {title && <h2 className="text-xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>{title}</h2>}
      {children}
    </Tag>
  );
};
/* =========================================================
   MOCK BOOKS (fallback if context has none)
========================================================= */
const MOCK_ALL_BOOKS = {
  'Strategy & Execution': [
    { id: 's_e_1', title: 'The E-Myth Revisited', author: 'Michael E. Gerber', theme: 'Why most small businesses fail and how to build a scalable system.', complexity: 'Medium', duration: 180, focus: 'Delegation, Process Mapping, Systemization' },
    { id: 's_e_3', title: 'Measure What Matters', author: 'John Doerr', theme: 'Achieving ambitious goals using OKRs.', complexity: 'Medium', duration: 200, focus: 'Goal Setting, Quarterly Planning, Accountability' },
  ],
  'People & Culture': [
    { id: 'p_c_1', title: 'Dare to Lead', author: 'Brené Brown', theme: 'Courageous leadership by embracing vulnerability and trust.', complexity: 'Medium', duration: 210, focus: 'Psychological Safety, Feedback, Vulnerability' },
    { id: 'p_c_3', title: 'Radical Candor', author: 'Kim Scott', theme: 'Challenging directly while caring personally.', complexity: 'Medium', duration: 190, focus: 'Feedback Delivery, Coaching, Guidance' },
  ],
  'Self-Awareness & Growth': [
    { id: 's_a_1', title: 'Atomic Habits', author: 'James Clear', theme: 'Build good habits by tiny improvements.', complexity: 'Low', duration: 180, focus: 'Habit Formation, Self-Discipline, Identity' },
  ],
  'Innovation & Change': [
    { id: 'i_c_1', title: 'The Lean Startup', author: 'Eric Ries', theme: 'Build-measure-learn with continuous innovation.', complexity: 'High', duration: 250, focus: 'MVP, Build-Measure-Learn, Iteration' },
  ],
};

/* =========================================================
   LOCAL FALLBACK UTILITIES (Used to inject rich context)
========================================================= */
function getActionSteps(book) {
  const t = (book.title || '').toLowerCase();
  if (t.includes('e-myth')) {
    return ['Map one repeatable process (5–7 steps) and write a 1‑page SOP.', 'Delegate the checklist, not the task.', 'Analyze your time allocation: Technician, Manager, or Entrepreneur Role?'];
  } else if (t.includes('radical candor')) {
    return ['Ask your team: “What’s one thing I could do better?” then act on one item within a week.', 'Draft corrective feedback using the SBI framework (Situation, Behavior, Impact).', 'Use a 5:1 positive-to-negative feedback ratio.'];
  } else if (t.includes('atomic habits')) {
    return ['Pick one keystone habit; write it as Habit Stack: “After [current], I will [new], then [small reward]”.', 'Use the 2-Minute Rule to start any new habit.', 'Audit your environment to make good habits obvious and bad habits invisible.'];
  }
  return ['Define the outcome, then design the smallest repeatable action.'];
}

function getFrameworks(book) {
  const t = (book.title || '').toLowerCase();
  if (t.includes('e-myth')) {
    return [{ name: 'E‑Myth Roles', desc: 'Entrepreneur (vision), Manager (systems), Technician (doing).' }, { name: 'Systemization', desc: 'Build the business as if it were a franchise prototype.' }];
  } else if (t.includes('radical candor')) {
    return [{ name: 'Candor Quadrants', desc: 'Caring Personally × Challenging Directly; aim for Radical Candor.' }, { name: 'Gives-and-Gets', desc: 'Focus on what you give (feedback) and get (results).' }];
  } else if (t.includes('atomic habits')) {
    return [{ name: 'Four Laws', desc: 'Make it Obvious, Attractive, Easy, Satisfying.' }, { name: 'Habit Stacking', desc: 'Pair a new habit with an old one (e.g., After X, I will Y).' }];
  }
  return [{ name: 'Core Principles', desc: 'Prioritize outcomes, feedback loops, and small, testable steps.' }];
}

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
   FALLBACK HTML GENERATORS (Simplified)
========================================================= */
function richFlyerFallbackHTML(book, tier) {
  const focus = (book.focus || '').split(',').map(s => s.trim()).filter(Boolean);
  const chips = focus.slice(0, 6).map(f => `<span style="display:inline-block; padding:4px 8px; margin:2px; border-radius:9999px; background:#F3F4F6; color:#374151; font-size:12px">${f}</span>`).join('');

  return `
    <div style="padding: 16px;">
      <header style="padding-bottom: 12px; margin-bottom: 8px; border-bottom: 4px solid ${COLORS.ORANGE}">
        <p style="margin:0 0 4px 0; font-size: 12px; color:${COLORS.TEAL}; font-weight: 900; text-transform: uppercase">${tier} Competency</p>
        <h2 style="margin:0; color:${COLORS.NAVY}; font-weight:900; font-size:32px;">${book.title}</h2>
        <p style="margin:6px 0 0 0; color:${COLORS.ORANGE}; font-weight:800">by ${book.author}</p>
        <div style="margin-top:8px">${chips}</div>
      </header>
      <div style="column-count: 2; column-gap: 18px">
        <section>
          <h3 style="color:${COLORS.NAVY}; font-weight:800">Key Ideas</h3>
          <p style="color:${COLORS.TEXT}">${book.theme}</p>
        </section>
        <section>
          <h3 style="color:${COLORS.NAVY}; font-weight:800">Action Plan (Local Mock)</h3>
          <ul style="margin:0 0 0 18px; color:${COLORS.TEXT}">${getActionSteps(book).map(s => `<li>${s}</li>`).join('')}</ul>
        </section>
      </div>
    </div>
  `;
}
function execBriefFallbackHTML(book, tier) {
    return `<h2>Executive Brief: ${book.title}</h2><p>AI unavailable. Focus: ${book.focus}</p>`;
}

/* =========================================================
   AI FLYER BUILDER - EXPANDED CONTENT PROMPT
========================================================= */
async function buildAIFlyerHTML({ book, tier, executive, callSecureGeminiAPI }) {
  if (!callSecureGeminiAPI) {
    return executive ? execBriefFallbackHTML(book, tier) : richFlyerFallbackHTML(book, tier);
  }
  
  // *** CRITICAL CHANGE: Increased word count and added structure enforcement ***
  const baseInstruction = executive
    ? `Write a crisp EXECUTIVE BRIEF (150-200 words). Include a short "Key Frameworks" list that names the book's models (e.g., Candor Quadrants) and 3 specific, actionable steps. Output clean, styled HTML using only h2, h3, p, ul, li, strong, em, and inline CSS for presentation.`
    : `Create a robust, long-form BOOK FLYER (300-400 words total). Sections must include: **Key Ideas**, **Core Insights for Your Tier**, **Key Frameworks** (with one-line descriptions), and **Action Plan (3 Steps)**. Ensure high detail and professional tone. Output clean, styled HTML using only h2, h3, p, ul, li, strong, em, and inline CSS for presentation.`;

  const systemPrompt =
    `You are the LeaderReps Researcher and Content Generator. Your goal is to produce a detailed, premium marketing flyer. You must adhere to the word count and sectional requirements. Frameworks and actions must clearly reference the book’s named models when they exist.`;

  const userPrompt =
    `${baseInstruction}\n\nBook: ${book.title} by ${book.author}\n` +
    `Focus areas: ${(book.focus || '')}\nComplexity: ${book.complexity}\nTier: ${tier}`;

  try {
    const out = await callSecureGeminiAPI({ systemInstruction: { parts: [{ text: systemPrompt }] }, contents: [{ role: "user", parts: [{ text: userPrompt }] }] });
    
    let html = out?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Apply visual styles to the raw HTML output
    html = html.replace(/<h2/g, `<h2 style="color:${COLORS.ORANGE};font-size:24px;border-bottom:2px solid ${COLORS.SUBTLE};padding-bottom:5px;margin-top:15px;"`);
    html = html.replace(/<h3/g, `<h3 style="color:${COLORS.NAVY};font-size:20px;margin-top:10px;"`);
    html = html.replace(/<p/g, `<p style="color:#374151;font-size:16px;"`);
    html = html.replace(/<ul/g, `<ul style="list-style:disc;margin-left:20px;color:#374151;"`);
    
    if (!html) throw new Error("Empty AI response.");
    
    return html;
  } catch (e) {
    console.error('AI flyer error (using local fallback):', e);
    return executive ? execBriefFallbackHTML(book, tier) : richFlyerFallbackHTML(book, tier);
  }
}

/* =========================================================
   AI COACH - CONTEXTUAL FIX (Primary bug fix)
========================================================= */
const handleAiSubmit = useCallback(async (e, services, selectedBook, aiQuery, setIsSubmitting, setAiResponse) => {
    e.preventDefault();
    if (setIsSubmitting) return; // Prevents double submission

    const q = aiQuery.trim();
    if (!selectedBook || !q) return;

    setIsSubmitting(true);
    setAiResponse('Thinking…');

    // **CRITICAL FIX:** Inject the specific, actionable content from the book into the prompt context
    const actionableContext = `
        **Book's Key Frameworks:** ${getFrameworks(selectedBook).map(f => f.name).join(', ')}.
        **Book's Key Actions:** ${getActionSteps(selectedBook).join(' | ')}.
    `;

    try {
        const systemPrompt =
            `You are the LeaderReps AI Coach. Your sole purpose is to answer the user's question by referencing the provided book's principles ONLY. Do not use outside knowledge. Your response must be direct, actionable, and reference the book's frameworks.
            
            ${actionableContext}
            
            Guidelines: Answer directly with 3–5 sentences. Include one concrete next action that applies the book's principle to the user's situation.`;

        let out = await services.callSecureGeminiAPI({ 
            systemInstruction: { parts: [{ text: systemPrompt }] }, 
            contents: [{ role: "user", parts: [{ text: q }] }] 
        });

        const text = out?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response found. Please rephrase your question or check your API key.';
        setAiResponse(text);

    } catch (err) {
        console.error('AI coach error:', err);
        setAiResponse(`(AI error) Please check your network connection or API Key configuration.`);
    } finally {
        setIsSubmitting(false);
    }
}, []);


/* =========================================================
   MAIN COMPONENT (Aesthetic remains in place)
========================================================= */
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

  const [filters, setFilters] = useState({ complexity: 'All', maxDuration: 300, search: '' });
  const [hoveredId, setHoveredId] = useState(null);

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const aiInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const lastSelSearch = useRef({ start: null, end: null });
  const lastSelCoach = useRef({ start: null, end: null });

  const allBooks = MOCK_ALL_BOOKS; // Using mock for reliable execution

  /* ---------- Filtering ---------- */
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

  /* ---------- Flyer generation (AI then fallback) ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBook) { setHtmlFlyer(''); return; }
      const tierKey = selectedTier || Object.keys(allBooks).find(k => (allBooks[k] || []).some(b => b.id === selectedBook.id)) || 'Strategy & Execution';

      setHtmlFlyer(`<div style="padding:12px;border:1px dashed ${COLORS.SUBTLE};border-radius:12px;color:${COLORS.MUTED}">Generating ${isExecutiveBrief ? 'executive brief' : 'full flyer'}…</div>`);

      const html = await buildAIFlyerHTML({ book: selectedBook, tier: tierKey, executive: isExecutiveBrief, callSecureGeminiAPI });
      
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
    }
  }, [selectedBook]);


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
    const ok = updateCommitmentData(newCommitment);
    if (ok) navigate('daily-practice');
    else console.error('Failed to add commitment.');
  };

  const handleSaveForLater = (bookId) => {
    setSavedBooks(prev => ({ ...prev, [bookId]: !prev[bookId] }));
  };
  
  // Wrapped AI Submit handler for component context
  const submitHandler = useCallback((e) => {
      handleAiSubmit(e, services, selectedBook, aiQuery, setIsSubmitting, setAiResponse);
  }, [aiQuery, selectedBook, services, setIsSubmitting, setAiResponse]);
  

  /* =========================================================
     SUBCOMPONENTS
  ========================================================== */
  const BookList = () => (
    <div className="space-y-10">
      {/* ... (omitted List UI for brevity - it remains functional) */}
      <h2 className="text-3xl font-extrabold flex items-center gap-3 border-b-4 pb-2"
          style={{ color: COLORS.NAVY, borderColor: COLORS.ORANGE }}>
        <BookOpen className="w-7 h-7" style={{ color: COLORS.TEAL }}/> LeaderReps Curated Reading Library
      </h2>
      
      {/* Controls */}
      <div className="p-5 rounded-xl shadow-xl border" style={{ background: COLORS.OFF_WHITE, borderColor: COLORS.SUBTLE }}>
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4" style={{ color: COLORS.NAVY }}>
          <Filter className="w-5 h-5" style={{ color: COLORS.ORANGE }}/> Personalize Your Search
        </h3>
        
        {/* Simplified search and filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
             <label className="block text-sm font-medium mb-1 flex items-center gap-1" style={{ color: COLORS.MUTED }}><SearchIcon className="w-4 h-4" style={{ color: COLORS.TEAL }}/> Search by Title, Author, or Focus</label>
             <input type="text" value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} placeholder="Start typing to find a book..." className="w-full p-3 border rounded-lg shadow-sm focus:outline-none"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>Complexity Level</label>
            <select value={filters.complexity} onChange={(e) => setFilters({ ...filters, complexity: e.target.value })} className="w-full p-2 border rounded-lg shadow-sm focus:outline-none">
              <option value="All">All Levels</option>
              {Object.keys(COMPLEXITY_MAP).map(k => (<option key={k} value={k}>{COMPLEXITY_MAP[k].label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: COLORS.MUTED }}>Max Est. Minutes</label>
            <input type="range" min="150" max="300" step="10" value={filters.maxDuration} onChange={(e) => setFilters({ ...filters, maxDuration: parseInt(e.target.value, 10) })} className="w-full"/>
            <div className="flex justify-between text-xs mt-1" style={{ color: COLORS.MUTED }}><span>150 min</span><span>300 min</span></div>
          </div>
        </div>
      </div>


      {/* Book groups */}
      <div className="space-y-12">
        {Object.entries(filteredBooks).map(([tier, books]) => (
          <div key={tier}
               className="rounded-2xl shadow-xl overflow-hidden border-2"
               style={{ background: COLORS.OFF_WHITE, borderColor: COLORS.SUBTLE }}>
            {/* Header */}
            <div className="p-6" style={{ background: COLORS.NAVY }}>
              <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: COLORS.OFF_WHITE }}>{tier}</h3>
              <p className="text-base mt-1" style={{ color: '#E5E7EB' }}>Foundational books for this competency. ({books.length} available)</p>
            </div>

            {/* Cards */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(books || []).map((book) => {
                const c = COMPLEXITY_MAP[book.complexity] || COMPLEXITY_MAP.Medium;
                const isSaved = !!savedBooks[book.id];
                const isSelected = selectedBook?.id === book.id;

                return (
                  <div key={book.id} className="relative">
                    <button
                      onClick={() => { setSelectedBook(book); setSelectedTier(tier); }}
                      className="p-5 text-left w-full h-full block rounded-2xl border-2 transition-all"
                      style={{
                        background: 'linear-gradient(180deg,#FFFFFF,#F9FAFB)',
                        borderColor: isSelected ? COLORS.TEAL : COLORS.SUBTLE,
                        boxShadow: isSelected ? '0 12px 30px rgba(0,0,0,.12)' : '0 2px 8px rgba(0,0,0,.06)',
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

                    {/* Save */}
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
            className="font-semibold px-3 py-2 rounded-xl border-2"
            style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}
          >
            ← Back to Library
          </button>
        </div>

        <div className="rounded-2xl shadow-2xl p-8 border" style={{ background: COLORS.OFF_WHITE, borderColor: COLORS.SUBTLE }}>
          {/* Progress + Exec Brief */}
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

          {/* Rendered Flyer (HTML) */}
          <div className="max-w-none space-y-4" style={{ color: COLORS.TEXT }} dangerouslySetInnerHTML={{ __html: htmlFlyer }} />

          {/* AI Coach */}
          <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${COLORS.SUBTLE}` }}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3" style={{ color: COLORS.NAVY }}>
              <MessageSquare className="text-2xl w-6 h-6" style={{ color: COLORS.BLUE }}/> AI Coach: Instant Application
            </h3>

            {aiResponse && (
              <div className="p-4 mb-4 rounded-xl" style={{ background: '#EFF6FF', border: '1px solid #93C5FD', color: COLORS.TEXT }}>
                <p className="text-sm font-semibold" style={{ color: '#1D4ED8' }}>AI Coach:</p>
                <p className="text-base" style={{ whiteSpace: 'pre-wrap' }}>{aiResponse}</p>
              </div>
            )}

            <form onSubmit={submitHandler} className="flex gap-2">
              <input
                type="text"
                ref={aiInputRef}
                value={aiQuery}
                onFocus={() => setFocusedField('coach')}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => { setAiQuery(e.target.value); }}
                placeholder={`Ask how to apply ${selectedBook.title} at work (e.g., "How do I delegate?")`}
                className="flex-grow p-3 border rounded-xl"
                style={{ borderColor: COLORS.SUBTLE, color: COLORS.TEXT }}
                required
              />
              <button
                type="submit"
                className="px-4 rounded-xl font-semibold flex items-center gap-1"
                style={{
                  background: isSubmitting ? '#9CA3AF' : (aiQuery.trim() ? COLORS.BLUE : '#D1D5DB'),
                  color: aiQuery.trim() ? '#FFFFFF' : '#6B7280',
                  cursor: (aiQuery.trim() && !isSubmitting) ? 'pointer' : 'not-allowed',
                  opacity: isSubmitting ? 0.8 : 1
                }}
                disabled={!aiQuery.trim() || isSubmitting}
                aria-busy={isSubmitting ? 'true' : 'false'}
              >
                <MessageSquare className="w-5 h-5" /> {isSubmitting ? 'Working…' : 'Ask'}
              </button>
            </form>
          </div>

          {/* Commit actions */}
          <div className="mt-10 pt-6 flex justify-end gap-4" style={{ borderTop: `1px solid ${COLORS.SUBTLE}` }}>
            <button
              onClick={() => handleSaveForLater(selectedBook.id)}
              className="flex items-center gap-2 px-6 py-3 font-semibold rounded-xl border-2"
              style={{
                background: COLORS.OFF_WHITE,
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
      <h1 className="text-4xl font-extrabold mb-10" style={{ color: COLORS.NAVY }}>Professional Reading Hub</h1>
      {!selectedBook && <BookList />}
      {selectedBook && <BookFlyer />}
    </div>
  );
}