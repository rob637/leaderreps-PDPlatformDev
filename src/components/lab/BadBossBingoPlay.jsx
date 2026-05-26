// src/components/lab/BadBossBingoPlay.jsx
//
// LeaderReps Lab — Bad Boss Bingo (public, anonymous)
// Reached via ?bingo (no value required). No auth, no app shell.
//
// Flow:
//   1. Generate 5x5 card from active `bingo_squares` (public read)
//   2. Tap to mark squares. Center is FREE.
//   3. Auto-detect bingo (row / column / diagonal)
//   4. Share: download PNG, copy text, LinkedIn / X share
//   5. Optional email capture → recordBingoPlay Cloud Function
//
// Quality bar: tap-friendly, calm typography, instant feedback, no clutter.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Download,
  Share2,
  Mail,
  Check,
  Sparkles,
  Linkedin,
  Twitter,
  Loader,
} from 'lucide-react';

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const RECORD_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/recordBingoPlay`;

function getStandaloneFirestore() {
  const config =
    typeof window !== 'undefined' && window.__FIREBASE_CONFIG__
      ? window.__FIREBASE_CONFIG__
      : null;
  if (!config) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return getFirestore(app);
}

// Sample N from arr without replacement (Fisher-Yates partial)
function sample(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// 5x5 bingo check — pass set of marked indices (0..24, with 12 being FREE/center)
function detectBingo(marked) {
  const lines = [];
  for (let r = 0; r < 5; r++) lines.push([0, 1, 2, 3, 4].map((c) => r * 5 + c));
  for (let c = 0; c < 5; c++) lines.push([0, 1, 2, 3, 4].map((r) => r * 5 + c));
  lines.push([0, 6, 12, 18, 24]);
  lines.push([4, 8, 12, 16, 20]);
  return lines.some((line) => line.every((idx) => marked.has(idx)));
}

const FALLBACK_SQUARES = [
  'Says "per my last email"',
  'Schedules a meeting that could have been an email',
  'Takes credit for your idea',
  'Says "let\'s circle back"',
  'Asks for "quick thoughts" on a 40-page doc',
  'Sends "URGENT" email at 11pm',
  'Says "we\'re like a family here"',
  'Cancels 1:1 again',
  'Says "I\'m not a micromanager but…"',
  '"Just looping you in"',
  'Talks during your presentation',
  'Asks "are you OK?" after assigning more work',
  'Forwards email with "thoughts?"',
  'Says "open door policy" then closes door',
  'Promises promotion "soon"',
  'Says "we need to do more with less"',
  'Reads phone during your meeting',
  'Says "team player" in PIP',
  'Asks for "ETA" 5 minutes after assigning',
  'Says "let\'s take this offline"',
  'Reorganizes team without telling you',
  'Says "I\'ll let you go" but keeps talking',
  '"Sorry for the back-and-forth"',
  'Sends slack at 6am Saturday',
  'Says "alignment" 4+ times in one meeting',
];

export default function BadBossBingoPlay() {
  const db = useMemo(() => getStandaloneFirestore(), []);
  const [squares, setSquares] = useState([]); // 25 squares for the card
  const [marked, setMarked] = useState(() => new Set([12])); // FREE center
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasBingo, setHasBingo] = useState(false);
  const [showBingoBanner, setShowBingoBanner] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const cardRef = useRef(null);

  // Load squares from Firestore (public read). Fallback to seed list if empty.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let pool = [];
        if (db) {
          try {
            const snap = await getDocs(
              query(collection(db, 'bingo_squares'), where('status', '==', 'active'))
            );
            pool = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          } catch (e) {
            // Public read may not be enabled; fall through to fallback.
          }
        }
        if (!pool.length) {
          pool = FALLBACK_SQUARES.map((text, i) => ({
            id: `fallback-${i}`,
            text,
          }));
        }
        if (cancelled) return;
        // Pick 24 (center reserved for FREE)
        const picked = sample(pool, Math.min(24, pool.length));
        // Pad if pool < 24 (shouldn't happen but safe)
        while (picked.length < 24) picked.push({ id: `pad-${picked.length}`, text: '—' });

        const card = [];
        let pi = 0;
        for (let i = 0; i < 25; i++) {
          if (i === 12) card.push({ id: 'FREE', text: 'FREE', free: true });
          else { card.push(picked[pi]); pi++; }
        }
        setSquares(card);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError('Could not load card. Please reload.');
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [db]);

  // Detect bingo whenever marks change
  useEffect(() => {
    const bingo = detectBingo(marked);
    if (bingo && !hasBingo) {
      setHasBingo(true);
      setShowBingoBanner(true);
      // Fire-and-forget log
      fetch(RECORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markedSquareIds: Array.from(marked).map((idx) => squares[idx]?.id || String(idx)),
          markedCount: marked.size,
          bingo: true,
          referrer: typeof document !== 'undefined' ? document.referrer : null,
        }),
      }).catch(() => {});
    } else if (!bingo && hasBingo) {
      setHasBingo(false);
    }
  }, [marked, hasBingo, squares]);

  const toggleSquare = (idx) => {
    if (idx === 12) return; // FREE can't be unmarked
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const reshuffle = () => {
    setHasBingo(false);
    setShowBingoBanner(false);
    setMarked(new Set([12]));
    setLoading(true);
    // Re-run load by remounting via key trick — simplest: shuffle current pool
    const pool = squares.filter((s) => !s.free);
    const picked = sample(pool, 24);
    const card = [];
    let pi = 0;
    for (let i = 0; i < 25; i++) {
      if (i === 12) card.push({ id: 'FREE', text: 'FREE', free: true });
      else { card.push(picked[pi] || { id: `pad-${pi}`, text: '—' }); pi++; }
    }
    setSquares(card);
    setLoading(false);
  };

  // Render PNG of the card via canvas
  const buildPng = async () => {
    const size = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size + 180;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFAF8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = '#002E47';
    ctx.font = 'bold 56px "Nunito Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bad Boss Bingo', size / 2, 70);
    ctx.fillStyle = '#47A88D';
    ctx.font = '24px "Nunito Sans", Arial, sans-serif';
    ctx.fillText('Tally your week. Then go build something better.', size / 2, 110);

    // Grid
    const gridSize = 900;
    const gridX = (size - gridSize) / 2;
    const gridY = 150;
    const cell = gridSize / 5;
    ctx.lineWidth = 3;
    for (let i = 0; i < 25; i++) {
      const r = Math.floor(i / 5);
      const c = i % 5;
      const x = gridX + c * cell;
      const y = gridY + r * cell;
      const isMarked = marked.has(i);
      const isFree = i === 12;
      ctx.fillStyle = isFree ? '#47A88D' : (isMarked ? '#E04E1B' : '#FFFFFF');
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = '#002E47';
      ctx.strokeRect(x, y, cell, cell);

      // Text wrap
      ctx.fillStyle = (isMarked || isFree) ? '#FFFFFF' : '#002E47';
      ctx.font = 'bold 18px "Nunito Sans", Arial, sans-serif';
      const txt = squares[i]?.text || '';
      const maxWidth = cell - 16;
      const words = txt.split(' ');
      const lines = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (ctx.measureText(test).width > maxWidth) {
          if (line) lines.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) lines.push(line);
      const lh = 22;
      const totalH = lines.length * lh;
      let ly = y + (cell - totalH) / 2 + lh / 2;
      lines.slice(0, 7).forEach((ln) => {
        ctx.fillText(ln, x + cell / 2, ly);
        ly += lh;
      });
    }

    // Footer
    ctx.fillStyle = '#002E47';
    ctx.font = 'bold 28px "Nunito Sans", Arial, sans-serif';
    ctx.fillText(
      hasBingo ? '🎉 BINGO! Now go build the boss they actually deserve.' : 'Play along at leaderreps.com',
      size / 2,
      gridY + gridSize + 60
    );
    ctx.fillStyle = '#47A88D';
    ctx.font = '20px "Nunito Sans", Arial, sans-serif';
    ctx.fillText('leaderreps.com', size / 2, gridY + gridSize + 100);

    return await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  };

  const downloadPng = async () => {
    const blob = await buildPng();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bad-boss-bingo.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const shareText = hasBingo
    ? 'I got BINGO on Bad Boss Bingo this week 😅 Tally yours: '
    : 'Bad Boss Bingo. Tally your week, then build something better: ';
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?bingo`
    : 'https://leaderreps.com/?bingo';

  const shareLinkedIn = () => {
    const u = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(u, '_blank', 'noopener');
  };
  const shareTwitter = () => {
    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(u, '_blank', 'noopener');
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setEmailBusy(true);
    try {
      await fetch(RECORD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markedSquareIds: Array.from(marked).map((idx) => squares[idx]?.id || String(idx)),
          markedCount: marked.size,
          bingo: hasBingo,
          email,
          referrer: typeof document !== 'undefined' ? document.referrer : null,
        }),
      });
      setEmailSent(true);
    } catch {
      // swallow — non-blocking
      setEmailSent(true);
    } finally {
      setEmailBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFAF8] dark:bg-slate-950">
      <header className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-corporate-navy dark:text-white">
              Bad Boss Bingo
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tally your week. Laugh a little. Then go lead better.
            </p>
          </div>
          <button
            onClick={reshuffle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-corporate-navy dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4" />
            New card
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader className="w-6 h-6 animate-spin mr-3" />
            Dealing your card…
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div
              ref={cardRef}
              className="grid grid-cols-5 gap-1.5 md:gap-2 bg-white dark:bg-slate-900 p-2 md:p-3 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800"
            >
              {squares.map((sq, idx) => {
                const isMarked = marked.has(idx);
                const isFree = sq.free;
                return (
                  <button
                    key={sq.id + '-' + idx}
                    onClick={() => toggleSquare(idx)}
                    disabled={isFree}
                    className={`aspect-square rounded-md md:rounded-lg p-1 md:p-2 text-[10px] md:text-xs font-semibold transition-all flex items-center justify-center text-center leading-tight relative overflow-hidden
                      ${isFree
                        ? 'bg-corporate-teal text-white cursor-default'
                        : isMarked
                          ? 'bg-corporate-orange text-white shadow-inner'
                          : 'bg-slate-50 dark:bg-slate-800 text-corporate-navy dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95'
                      }`}
                  >
                    {isFree ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <Sparkles className="w-4 h-4 md:w-5 md:h-5" />
                        <span>FREE</span>
                      </div>
                    ) : (
                      <span>{sq.text}</span>
                    )}
                    {isMarked && !isFree && (
                      <Check className="absolute top-0.5 right-0.5 w-3 h-3 opacity-80" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Counter */}
            <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              {marked.size - 1} marked
              {hasBingo && <span className="ml-2 text-corporate-orange font-bold">· BINGO! 🎉</span>}
            </div>

            {/* Share row */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={downloadPng}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-corporate-navy rounded-lg hover:bg-corporate-navy/90"
              >
                <Download className="w-4 h-4" /> PNG
              </button>
              <button
                onClick={shareLinkedIn}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0A66C2] rounded-lg hover:opacity-90"
              >
                <Linkedin className="w-4 h-4" /> Share
              </button>
              <button
                onClick={shareTwitter}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-black rounded-lg hover:opacity-90"
              >
                <Twitter className="w-4 h-4" /> Post
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: 'Bad Boss Bingo', text: shareText, url: shareUrl }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareText + shareUrl).catch(() => {});
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-corporate-navy dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Share2 className="w-4 h-4" /> More
              </button>
            </div>

            {/* Email capture */}
            <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-card">
              {emailSent ? (
                <div className="flex items-center gap-3 text-corporate-teal">
                  <Check className="w-5 h-5" />
                  <div>
                    <div className="font-bold text-corporate-navy dark:text-white">Thanks — keep an eye on your inbox.</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      We'll send a few quick leadership reps you can run this week.
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={submitEmail} className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-corporate-teal mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-corporate-navy dark:text-white">
                        Want to actually become the leader you wish you had?
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Drop your email — we'll send 3 short reps you can run this week. No spam.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@work.com"
                      className="flex-1 px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                      required
                    />
                    <button
                      type="submit"
                      disabled={emailBusy}
                      className="px-4 py-2.5 text-sm font-semibold text-white bg-corporate-teal rounded-lg hover:bg-corporate-teal/90 disabled:opacity-50"
                    >
                      {emailBusy ? 'Sending…' : 'Send me reps'}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="mt-10 text-center text-xs text-slate-400">
              Made by <a href="https://leaderreps.com" className="font-bold text-corporate-teal hover:underline">LeaderReps</a> — daily reps for everyday leaders.
            </div>
          </>
        )}
      </main>

      {/* Bingo banner */}
      <AnimatePresence>
        {showBingoBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-corporate-orange text-white p-4 rounded-xl shadow-2xl z-20"
          >
            <div className="flex items-start gap-3">
              <div className="text-3xl">🎉</div>
              <div className="flex-1">
                <div className="font-extrabold text-lg">BINGO!</div>
                <div className="text-sm opacity-95">
                  Now go build the boss your team actually deserves.
                </div>
              </div>
              <button
                onClick={() => setShowBingoBanner(false)}
                className="text-white/80 hover:text-white text-xl leading-none px-2"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
