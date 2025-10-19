
/* eslint-disable no-console */
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useAppServices } from '../../App.jsx';
import {
  BookOpen, Target, CheckCircle, Clock, AlertTriangle,
  MessageSquare, Filter, TrendingUp, Star, Search as SearchIcon
} from 'lucide-react';
import { mdToHtml } from '../../utils/ApiHelpers.js';

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
   MOCK BOOKS (fallback if context has none)
========================================================= */
const MOCK_ALL_BOOKS = {
  'Strategy & Execution': [
    { id: 's_e_1', title: 'The E-Myth Revisited', author: 'Michael E. Gerber', theme: 'Why most small businesses fail and how to build a scalable system.', complexity: 'Medium', duration: 180, focus: 'Delegation, Process Mapping, Systemization', cover: 'https://placehold.co/120x160/002E47/ffffff?text=E+Myth', image_url: 'https://placehold.co/640x360/0B3B5B/ffffff?text=E-Myth+System' },
    { id: 's_e_2', title: 'Good to Great', author: 'Jim Collins', theme: 'How some companies make the leap to enduring greatness.', complexity: 'High', duration: 240, focus: 'Level 5 Leadership, Hedgehog Concept, Discipline', cover: 'https://placehold.co/120x160/47A88D/ffffff?text=Good+to+Great', image_url: 'https://placehold.co/640x360/47A88D/ffffff?text=Hedgehog+Concept' },
    { id: 's_e_3', title: 'Measure What Matters', author: 'John Doerr', theme: 'Achieving ambitious goals using OKRs.', complexity: 'Medium', duration: 200, focus: 'Goal Setting, Quarterly Planning, Accountability', cover: 'https://placehold.co/120x160/E04E1B/ffffff?text=OKRs', image_url: 'https://placehold.co/640x360/E04E1B/ffffff?text=OKR+Framework' },
    { id: 's_e_4', title: 'Getting Things Done', author: 'David Allen', theme: 'Stress-free productivity with GTD.', complexity: 'Low', duration: 150, focus: 'Task Management, Workflow Design, Capture', cover: 'https://placehold.co/120x160/002E47/ffffff?text=GTD', image_url: 'https://placehold.co/640x360/0B3B5B/ffffff?text=Workflow+Flowchart' },
  ],
  'People & Culture': [
    { id: 'p_c_1', title: 'Dare to Lead', author: 'Brené Brown', theme: 'Courageous leadership by embracing vulnerability and trust.', complexity: 'Medium', duration: 210, focus: 'Psychological Safety, Feedback, Vulnerability', cover: 'https://placehold.co/120x160/0B3B5B/ffffff?text=Dare+to+Lead', image_url: 'https://placehold.co/640x360/0B3B5B/ffffff?text=Vulnerability+Trust' },
    { id: 'p_c_2', title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', theme: 'Common pitfalls that prevent teams from working.', complexity: 'Low', duration: 150, focus: 'Team Building, Conflict Management, Trust', cover: 'https://placehold.co/120x160/219E8B/ffffff?text=Five+Dysfunctions', image_url: 'https://placehold.co/640x360/219E8B/ffffff?text=Teamwork+Building' },
    { id: 'p_c_3', title: 'Radical Candor', author: 'Kim Scott', theme: 'Challenging directly while caring personally.', complexity: 'Medium', duration: 190, focus: 'Feedback Delivery, Coaching, Guidance', cover: 'https://placehold.co/120x160/E04E1B/ffffff?text=Radical+Candor', image_url: 'https://placehold.co/640x360/E04E1B/ffffff?text=Candid+Feedback' },
  ],
  'Self-Awareness & Growth': [
    { id: 's_a_1', title: 'Atomic Habits', author: 'James Clear', theme: 'Build good habits by tiny improvements.', complexity: 'Low', duration: 180, focus: 'Habit Formation, Self-Discipline, Identity', cover: 'https://placehold.co/120x160/E04E1B/ffffff?text=Atomic+Habits', image_url: 'https://placehold.co/640x360/E04E1B/ffffff?text=Habit+Loop' },
    { id: 's_a_2', title: 'Mindset', author: 'Carol Dweck', theme: 'Fixed vs Growth Mindsets.', complexity: 'Medium', duration: 190, focus: 'Growth Mindset, Resilience, Learning', cover: 'https://placehold.co/120x160/219E8B/ffffff?text=Mindset', image_url: 'https://placehold.co/640x360/219E8B/ffffff?text=Growth+Vs+Fixed' },
    { id: 's_a_3', title: 'Essentialism', author: 'Greg McKeown', theme: 'Pursue the essential, eliminate the rest.', complexity: 'Low', duration: 160, focus: 'Prioritization, Saying No, Focus', cover: 'https://placehold.co/120x160/E04E1B/ffffff?text=Essentialism', image_url: 'https://placehold.co/640x360/E04E1B/ffffff?text=Focus+Path' },
  ],
  'Innovation & Change': [
    { id: 'i_c_1', title: 'The Lean Startup', author: 'Eric Ries', theme: 'Build-measure-learn with continuous innovation.', complexity: 'High', duration: 250, focus: 'MVP, Build-Measure-Learn, Iteration', cover: 'https://placehold.co/120x160/219E8B/ffffff?text=Lean+Startup', image_url: 'https://placehold.co/640x360/219E8B/ffffff?text=Startup+Iterate' },
    { id: 'i_c_2', title: 'Start With Why', author: 'Simon Sinek', theme: 'The Golden Circle and purpose-driven leadership.', complexity: 'Medium', duration: 180, focus: 'Golden Circle, Purpose-Driven, Inspiration', cover: 'https://placehold.co/640x360/E04E1B/ffffff?text=Golden+Circle', image_url: 'https://placehold.co/640x360/E04E1B/ffffff?text=Golden+Circle' },
  ],
};

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
   FLYER SUMMARY (Markdown -> HTML)
========================================================= */
function generateBookFlyerMarkdown(book, tier, isExecutiveBrief) {
  const focusAreas = (book.focus || '').split(',').map(s => s.trim()).filter(Boolean);
  const bullets = (focusAreas.length ? focusAreas : ['Define one concrete outcome you can repeat'])
    .slice(0, 4)
    .map(f => `- **${f}**`)
    .join('\n');

  const summary = `### Summary
**${book.title}** by *${book.author}* gives you a practical way to act on ${focusAreas[0] || 'a core skill'} this week.
Focus on a small, repeatable behavior.
${book.theme || ''}`;

  const exec = `### Executive Brief — 3 Shifts
1. **Systemize a recurring task:** document one checklist.
2. **Separate roles:** vision vs process vs execution.
3. **Primary action:** ship one simple checklist by Friday.`;

  return `
## ${book.title}
**Tier:** ${tier} • **Est. Minutes:** ${book.duration} • **Complexity:** ${book.complexity}

![${book.title}](${book.image_url})

${summary}

### Core Skills to Master
${bullets}

### Suggested Action Plan
- Pace: nine 20-minute sessions
- Reflect: one note per chapter; share with a peer

${isExecutiveBrief ? exec : ''}
`.trim();
}

/* =========================================================
   ACCESSIBLE EXEC BRIEF SWITCH
========================================================= */
function ExecSwitch({ checked, onChange }) {
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

  // Optional debug banner (?dbg=1 to show)
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

  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const aiInputRef = useRef(null);
  const searchInputRef = useRef(null);

  const allBooks = Object.keys(contextBooks).length ? contextBooks : MOCK_ALL_BOOKS;

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

  /* ---------- Flyer generation ---------- */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedBook) { setHtmlFlyer(''); return; }
      const tierKey = selectedTier || Object.keys(allBooks).find(k => (allBooks[k] || []).some(b => b.id === selectedBook.id)) || 'Strategy';
      const md = generateBookFlyerMarkdown(selectedBook, tierKey, isExecutiveBrief);
      try {
        const out = await mdToHtml(md);
        if (!cancelled) setHtmlFlyer(out);
      } catch (e) {
        const safe = md.replace(/\n/g, '<br/>');
        if (!cancelled) setHtmlFlyer(safe);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedBook, selectedTier, isExecutiveBrief, allBooks]);

  /* ---------- Reset contextual state when changing book ---------- */
  useEffect(() => {
    if (selectedBook) {
      setIsExecutiveBrief(false);
      setAiQuery('');
      setAiResponse('');
    }
  }, [selectedBook]);

  /* ---------- AI Coach (real model if available, mock otherwise) ---------- */
  const handleAiSubmit = useCallback(async (e) => {
    e.preventDefault();
    const q = aiQuery.trim();
    if (!selectedBook || !q) return;

    setAiResponse('Thinking…');

    const focusAreas = (selectedBook.focus || '').split(',').map(s => s.trim()).filter(Boolean);

    try {
      if (hasGeminiKey && typeof hasGeminiKey === 'function' && hasGeminiKey() && typeof callSecureGeminiAPI === 'function') {
        const systemPrompt =
          `You are the LeaderReps AI Coach.\n` +
          `Context:\n` +
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

  /* =========================================================
     SUBCOMPONENTS
  ========================================================== */
  const BookList = () => (
    <div className="space-y-10">
      <h2 className="text-3xl font-extrabold flex items-center gap-3 border-b-4 pb-2"
          style={{ color: COLORS.NAVY, borderColor: COLORS.ORANGE }}>
        <BookOpen className="w-7 h-7" style={{ color: COLORS.TEAL }}/> LeaderReps Curated Reading Library
      </h2>

      {/* Controls */}
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
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
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

      {/* Book groups */}
      <div className="space-y-12">
        {Object.entries(filteredBooks).map(([tier, books]) => (
          <div key={tier}
               className="rounded-2xl shadow-xl overflow-hidden border-2"
               style={{ background: COLORS.SURFACE, borderColor: COLORS.SUBTLE }}>
            {/* Header */}
            <div className="p-6" style={{ background: COLORS.NAVY }}>
              <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: COLORS.SURFACE }}>
                {tier}
              </h3>
              <p className="text-base mt-1" style={{ color: '#E5E7EB' }}>
                Foundational books for this competency. ({books.length} available)
              </p>
            </div>

            {/* Cards */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(books || []).map((book) => {
                const c = COMPLEXITY_MAP[book.complexity] || COMPLEXITY_MAP.Medium;
                const isSaved = !!savedBooks[book.id];

                return (
                  <div key={book.id} className="relative group">
                    <button
                      onClick={() => { setSelectedBook(book); setSelectedTier(tier); }}
                      className="p-4 text-left w-full h-full block rounded-xl border transition-all"
                      style={{
                        background: COLORS.SURFACE,
                        borderColor: selectedBook?.id === book.id ? COLORS.TEAL : COLORS.SUBTLE,
                        boxShadow: selectedBook?.id === book.id ? `0 0 0 4px ${COLORS.TEAL}40` : '0 1px 2px rgba(0,0,0,.08)',
                        color: COLORS.TEXT
                      }}
                    >
                      <div className="flex gap-3">
                        <img src={book.cover} alt={`${book.title} cover`}
                             className="w-16 h-20 rounded border"
                             style={{ borderColor: COLORS.SUBTLE }}
                             loading="lazy" decoding="async"
                             onError={(e) => { e.currentTarget.src = 'https://placehold.co/120x160/CCCCCC/000000?text=Book'; }}/>
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
            className="font-semibold px-3 py-2 rounded border"
            style={{ color: COLORS.NAVY, borderColor: COLORS.SUBTLE }}
          >
            ← Back to Library
          </button>
        </div>

        <div className="rounded-2xl shadow-2xl p-8 border" style={{ background: COLORS.SURFACE, borderColor: COLORS.SUBTLE }}>
          {/* Progress + Exec Brief */}
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

            <ExecSwitch checked={isExecutiveBrief} onChange={setIsExecutiveBrief} />
          </div>

          {/* Rendered Flyer */}
          <div className="prose max-w-none space-y-4" style={{ color: COLORS.TEXT }} dangerouslySetInnerHTML={{ __html: htmlFlyer }} />

          {/* AI Coach */}
          <div className="mt-8 pt-4" style={{ borderTop: `1px solid ${COLORS.SUBTLE}` }}>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-3" style={{ color: COLORS.NAVY }}>
              <MessageSquare className="w-6 h-6" style={{ color: COLORS.BLUE }}/> AI Coach: Instant Application
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
                onChange={(e) => setAiQuery(e.target.value)}
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

          {/* Commit actions */}
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
          <strong>Debug:</strong> BusinessReadings.jsx (REAL AI enabled) mounted at {debugStamp}.
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
