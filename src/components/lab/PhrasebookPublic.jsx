// src/components/lab/PhrasebookPublic.jsx
//
// LeaderReps Lab — Leadership Phrasebook (public, anonymous, SEO-friendly)
// Reached via ?phrasebook (optionally ?phrasebook=feedback for a category filter).
//
// Layout:
//   - Hero: "What to say when… you have to say something hard."
//   - Category pills (filter)
//   - Cards: situation → script (big quote) → why-it-works → copy / try this skill
//   - Email capture CTA at bottom

import React, { useEffect, useMemo, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  Quote,
  Copy,
  Check,
  ArrowRight,
  Search,
  Loader,
  MessageSquare,
} from 'lucide-react';

function getStandaloneFirestore() {
  const config =
    typeof window !== 'undefined' && window.__FIREBASE_CONFIG__
      ? window.__FIREBASE_CONFIG__
      : null;
  if (!config) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return getFirestore(app);
}

const CATEGORIES = [
  'All',
  'Feedback',
  'Difficult Conversations',
  'Saying No',
  'Delegation',
  'Recognition',
  'Conflict',
];

const TONE_COLORS = {
  Direct: 'bg-corporate-orange/10 text-corporate-orange border-corporate-orange/30',
  Empathetic: 'bg-corporate-teal/10 text-corporate-teal border-corporate-teal/30',
  Assertive: 'bg-corporate-navy/10 text-corporate-navy border-corporate-navy/30',
};

function PhraseCard({ phrase }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phrase.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-card hover:shadow-card-hover transition-shadow"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
            {phrase.category}
          </span>
          {phrase.tone && (
            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${TONE_COLORS[phrase.tone] || ''}`}>
              {phrase.tone}
            </span>
          )}
        </div>
      </div>

      <h3 className="text-base md:text-lg font-extrabold text-corporate-navy dark:text-white leading-snug">
        {phrase.situation}
      </h3>

      {phrase.context && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {phrase.context}
        </p>
      )}

      <blockquote className="mt-4 relative pl-6 border-l-4 border-corporate-teal text-corporate-navy dark:text-white text-lg md:text-xl font-semibold leading-snug">
        <Quote className="absolute -left-1 -top-1 w-4 h-4 text-corporate-teal/40" />
        "{phrase.script}"
      </blockquote>

      {phrase.whyItWorks && (
        <div className="mt-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-corporate-teal">
            Why it works
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
            {phrase.whyItWorks}
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-corporate-navy dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-corporate-teal" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy script'}
        </button>
        <a
          href="https://leaderreps.com"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-corporate-teal rounded-lg hover:bg-corporate-teal/90"
        >
          Practice this skill <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </motion.article>
  );
}

// Seed phrases used if Firestore is empty — keeps the page useful day one.
const FALLBACK = [
  {
    id: 'f1',
    category: 'Feedback',
    tone: 'Direct',
    situation: 'When you need to give critical feedback and you\'re tempted to soften it',
    context: 'Use early in a 1:1, before reviewing tasks.',
    script: 'I want to share something that\'s been getting in the way. When you do X, the impact is Y. I need it to look like Z going forward.',
    whyItWorks: 'Names the behavior, the impact, and the ask — no compliment sandwich required.',
  },
  {
    id: 'f2',
    category: 'Saying No',
    tone: 'Empathetic',
    situation: 'When a peer asks you to take on work that isn\'t yours',
    script: 'I hear how much this matters. I can\'t take it on right now without dropping something else. Want to look at the trade-off together?',
    whyItWorks: 'Acknowledges them, names the constraint, offers a path — not a wall.',
  },
  {
    id: 'f3',
    category: 'Difficult Conversations',
    tone: 'Assertive',
    situation: 'When someone has missed the same deadline twice',
    script: 'This is the second time we\'ve missed this. I\'m not interested in blame — I want to understand what gets in the way, and then we agree on what changes. Walk me through it.',
    whyItWorks: 'Calls the pattern, removes the threat, opens the door to ownership.',
  },
  {
    id: 'f4',
    category: 'Recognition',
    tone: 'Direct',
    situation: 'When someone did great work and you want it to land',
    script: 'I want to be specific about this. What you did in X — the way you Y — that\'s exactly the standard I want on this team. Thank you.',
    whyItWorks: 'Specific > vague. Names the standard. Lands deeper than "great job."',
  },
  {
    id: 'f5',
    category: 'Delegation',
    tone: 'Direct',
    situation: 'When handing off something you\'ve always owned',
    script: 'I\'m giving you this fully. The outcome we need is X. How you get there is your call. I\'ll be here if you want me — but I won\'t be checking.',
    whyItWorks: 'Names outcome, transfers authority, sets the support model up-front.',
  },
  {
    id: 'f6',
    category: 'Conflict',
    tone: 'Empathetic',
    situation: 'When two teammates are clearly in tension',
    script: 'I notice there\'s some friction here. I\'m not asking you to agree — I\'m asking what each of you needs to do your best work, and what you\'d need from the other to make that possible.',
    whyItWorks: 'Names what\'s real without judging it. Refocuses on needs, not positions.',
  },
];

export default function PhrasebookPublic() {
  const db = useMemo(() => getStandaloneFirestore(), []);
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('phrasebook');
    if (!raw || raw === '1' || raw === 'true' || raw === '') return 'All';
    return CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase()) || 'All';
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let docs = [];
        if (db) {
          try {
            const snap = await getDocs(
              query(collection(db, 'phrasebook'), where('status', '==', 'published'))
            );
            docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } catch {
            // public read may not be allowed
          }
        }
        if (!docs.length) docs = FALLBACK;
        if (!cancelled) {
          setPhrases(docs);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setPhrases(FALLBACK);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [db]);

  const visible = useMemo(() => {
    let v = phrases;
    if (filter !== 'All') v = v.filter((p) => p.category === filter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      v = v.filter((p) =>
        (p.situation || '').toLowerCase().includes(q) ||
        (p.script || '').toLowerCase().includes(q) ||
        (p.context || '').toLowerCase().includes(q)
      );
    }
    return v;
  }, [phrases, filter, search]);

  return (
    <div className="min-h-screen bg-[#FFFAF8] dark:bg-slate-950">
      {/* Hero */}
      <header className="bg-corporate-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-10 md:py-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-corporate-teal mb-3">
            <MessageSquare className="w-4 h-4" />
            The Leadership Phrasebook
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            What to say when…<br />
            <span className="text-corporate-teal">you have to say something hard.</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl">
            Ready-to-use scripts for the conversations leaders dread most.
            Copy them. Adapt them. Use them. Then come back when the next one shows up.
          </p>
        </div>
      </header>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search situations or scripts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto md:overflow-visible -mx-1 px-1 pb-1 md:pb-0">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-full transition-colors ${
                  filter === c
                    ? 'bg-corporate-teal text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Phrase grid */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader className="w-5 h-5 animate-spin mr-3" />
            Loading the phrasebook…
          </div>
        )}

        {!loading && visible.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            No phrases match that search. Try clearing it.
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {visible.map((p) => <PhraseCard key={p.id} phrase={p} />)}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 md:mt-16 bg-corporate-navy text-white rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold">
            Words are practice. So is leadership.
          </h2>
          <p className="mt-3 text-white/80 max-w-xl mx-auto">
            LeaderReps runs short daily reps so the right words show up
            when the hard moment does. Start free — under 10 minutes a day.
          </p>
          <a
            href="https://leaderreps.com"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-bold text-corporate-navy bg-white rounded-lg hover:bg-slate-100"
          >
            Try LeaderReps free <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          Made by <a href="https://leaderreps.com" className="font-bold text-corporate-teal hover:underline">LeaderReps</a> — daily reps for everyday leaders.
        </div>
      </main>
    </div>
  );
}
