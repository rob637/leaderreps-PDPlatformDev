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
  Printer,
  Send,
  Edit2,
  Lightbulb,
} from 'lucide-react';

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const RECORD_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/recordBingoPlay`;
const CONTACT_EMAIL = 'team@leaderreps.com';
const BRAND_URL = 'https://leaderreps.com';
const LOGO_URL = '/leaderreps-logo.png';

// Build a UTM-tagged share URL so we can measure where plays come from.
function buildShareUrl(source) {
  const base =
    typeof window !== 'undefined' ? `${window.location.origin}/?bingo` : `${BRAND_URL}/?bingo`;
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: 'bingo',
    utm_campaign: 'bad_boss_bingo',
  });
  return `${base}&${params.toString()}`;
}

// Load an image as a Promise; resolves null on failure so PNG export still works.
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Human-readable label for the current week, e.g. "Week of May 26".
function currentWeekLabel(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun .. 6 Sat
  // Treat Monday as start of week; if Sunday, go back 6 days.
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return `Week of ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}

// Fallback "what a great leader does instead" tips by category. Used when a
// square doesn't have a hand-authored `tip` field in Firestore.
const TIP_BY_CATEGORY = {
  Micromanagement:
    'Replace the check-in with a clear outcome + deadline. Trust the how. Inspect the what.',
  Communication:
    'Say the thing directly. One message, one decision, one owner — then get out of the way.',
  Recognition:
    'Name the behavior, not just the result. Recognition that\'s specific is recognition that sticks.',
  Meetings:
    'No agenda, no meeting. Default to async. Protect your team\'s focus like it\'s your own.',
  Feedback:
    'Feedback in private, praise in public. Tell them the gap, then ask what they need to close it.',
  Trust:
    'Do what you said you would. Then do it again. Trust is built in tiny, boring increments.',
  Workload:
    'Pick what NOT to do. \"Yes\" to one thing is \"no\" to another — name the trade-off out loud.',
  Politics:
    'Cover your team, surface their wins, take the heat. Loyalty flows down before it flows up.',
};
const GENERIC_TIP =
  'Name the behavior. Own your part. Replace it with the leadership move it\'s hiding.';

function tipForSquare(sq) {
  if (!sq) return GENERIC_TIP;
  if (sq.tip && typeof sq.tip === 'string' && sq.tip.trim()) return sq.tip.trim();
  if (sq.category && TIP_BY_CATEGORY[sq.category]) return TIP_BY_CATEGORY[sq.category];
  return GENERIC_TIP;
}

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

  // Personalization — name persists in localStorage; week label auto-computed.
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window === 'undefined') return '';
    try { return localStorage.getItem('bbb_player_name') || ''; } catch { return ''; }
  });
  const [editingName, setEditingName] = useState(false);
  const weekLabel = useMemo(() => currentWeekLabel(), []);
  const savePlayerName = (v) => {
    const next = (v || '').trim().slice(0, 32);
    setPlayerName(next);
    try { localStorage.setItem('bbb_player_name', next); } catch {
      // ignore quota / privacy mode errors — personalization is non-essential
    }
  };
  const cardTitleLine = playerName
    ? `${playerName}'s ${weekLabel.toLowerCase()}`
    : weekLabel;

  // Reps panel toggle ("What a great leader does instead").
  const [showReps, setShowReps] = useState(false);
  // Auto-open reps panel on first BINGO so the punchline lands.
  useEffect(() => {
    if (hasBingo) setShowReps(true);
  }, [hasBingo]);

  // Load squares from Firestore (public read). Fallback to seed list if empty.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let pool = [];
        if (db) {
          try {
            const snap = await getDocs(
              query(collection(db, 'bingo_squares'), where('active', '==', true))
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
    const footerH = 260; // room for brand lockup, contact, QR
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size + footerH;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFAF8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Logo (top-left). Falls back gracefully if image fails to load.
    const logo = await loadImage(LOGO_URL);
    if (logo) {
      const logoH = 64;
      const logoW = (logo.width / logo.height) * logoH;
      ctx.drawImage(logo, 40, 30, logoW, logoH);
    }

    // Header
    ctx.fillStyle = '#002E47';
    ctx.font = 'bold 56px "Nunito Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bad Boss Bingo', size / 2, 70);
    ctx.fillStyle = '#47A88D';
    ctx.font = '24px "Nunito Sans", Arial, sans-serif';
    ctx.fillText('Tally your week. Then go build something better.', size / 2, 110);

    // Personalization line (name + week)
    ctx.fillStyle = '#475569';
    ctx.font = 'italic 20px "Nunito Sans", Arial, sans-serif';
    ctx.fillText(cardTitleLine, size / 2, 138);

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

    // ---- Branded footer block ----
    const footerTop = gridY + gridSize + 30;

    // Headline
    ctx.textAlign = 'center';
    ctx.fillStyle = '#002E47';
    ctx.font = 'bold 30px "Nunito Sans", Arial, sans-serif';
    ctx.fillText(
      hasBingo
        ? '🎉 BINGO! Now go build the boss your team deserves.'
        : 'Become the leader you wish you had.',
      size / 2,
      footerTop + 30
    );

    // QR code (right side) — pulled from public QR service; falls back silently.
    const qrUrl = buildShareUrl('png');
    const qrImg = await loadImage(
      `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(
        qrUrl
      )}`
    );
    const qrSize = 150;
    const qrX = size - qrSize - 50;
    const qrY = footerTop + 60;
    if (qrImg) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
      ctx.strokeStyle = '#002E47';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = '#002E47';
      ctx.font = '14px "Nunito Sans", Arial, sans-serif';
      ctx.fillText('Scan to play', qrX + qrSize / 2, qrY + qrSize + 24);
    }

    // Contact / brand line (left-aligned block, vertically centered with QR)
    ctx.textAlign = 'left';
    const textX = 60;
    let textY = qrY + 24;
    ctx.fillStyle = '#47A88D';
    ctx.font = 'bold 24px "Nunito Sans", Arial, sans-serif';
    ctx.fillText('LeaderReps', textX, textY);
    textY += 32;
    ctx.fillStyle = '#002E47';
    ctx.font = '18px "Nunito Sans", Arial, sans-serif';
    ctx.fillText('Daily reps for everyday leaders.', textX, textY);
    textY += 28;
    ctx.fillStyle = '#475569';
    ctx.font = '16px "Nunito Sans", Arial, sans-serif';
    ctx.fillText('leaderreps.com  ·  team@leaderreps.com', textX, textY);

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

  const shareLinkedIn = () => {
    const url = buildShareUrl('linkedin');
    const u = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(u, '_blank', 'noopener');
  };
  const shareTwitter = () => {
    const url = buildShareUrl('twitter');
    const u = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(u, '_blank', 'noopener');
  };
  const shareEmailToFriend = () => {
    const url = buildShareUrl('email');
    const subject = 'You need to play Bad Boss Bingo';
    const body =
      `Saw this and immediately thought of our last all-hands.\n\n` +
      `Bad Boss Bingo — tally your week, laugh a little, then go lead better:\n${url}\n\n` +
      `(Made by LeaderReps — daily reps for everyday leaders.)`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const printCard = () => {
    if (typeof window !== 'undefined') window.print();
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
    <div className="min-h-screen bg-[#FFFAF8] dark:bg-slate-950 bbb-root">
      {/* Print-specific styles: hide chrome, scale grid to fit one page, add brand lockup. */}
      <style>{`
        @media print {
          @page { size: auto; margin: 0.5in; }
          html, body { background: #fff !important; }
          .bbb-no-print { display: none !important; }
          .bbb-root { background: #fff !important; min-height: auto !important; }
          .bbb-print-only { display: block !important; }
          .bbb-card-grid { box-shadow: none !important; border: 1px solid #002E47 !important; page-break-inside: avoid; }
          .bbb-card-grid button { color: #002E47 !important; background: #fff !important; border: 1px solid #cbd5e1 !important; }
          .bbb-card-grid button[disabled] { background: #47A88D !important; color: #fff !important; }
          .bbb-card-marked { background: #E04E1B !important; color: #fff !important; }
        }
        .bbb-print-only { display: none; }
      `}</style>

      <header className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-10 bbb-no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-extrabold text-corporate-navy dark:text-white">
              Bad Boss Bingo
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tally your week. Laugh a little. Then go lead better.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Hi from Bad Boss Bingo')}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-corporate-teal hover:underline"
            >
              <Mail className="w-4 h-4" />
              Talk to us
            </a>
            <button
              onClick={reshuffle}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-corporate-navy dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
              New card
            </button>
          </div>
        </div>
      </header>

      {/* Print-only brand header */}
      <div className="bbb-print-only max-w-4xl mx-auto px-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-extrabold text-corporate-navy">Bad Boss Bingo</div>
            <div className="text-sm text-slate-600">Tally your week. Then go build something better.</div>
            <div className="text-sm italic text-slate-500 mt-1">{cardTitleLine}</div>
          </div>
          <img src={LOGO_URL} alt="LeaderReps" style={{ height: 40 }} />
        </div>
      </div>

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
            {/* Personalization bar (name + week) */}
            <div className="mb-3 flex items-center justify-center gap-2 text-sm bbb-no-print">
              {editingName ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); setEditingName(false); }}
                  className="flex items-center gap-2"
                >
                  <input
                    autoFocus
                    type="text"
                    value={playerName}
                    onChange={(e) => savePlayerName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    placeholder="Your first name"
                    maxLength={32}
                    className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-corporate-navy dark:text-white text-sm w-44"
                  />
                  <span className="text-slate-500 dark:text-slate-400">· {weekLabel}</span>
                </form>
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-corporate-teal"
                  title="Add your name"
                >
                  <span className="italic">{cardTitleLine}</span>
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div
              ref={cardRef}
              className="bbb-card-grid grid grid-cols-5 gap-1.5 md:gap-2 bg-white dark:bg-slate-900 p-2 md:p-3 rounded-2xl shadow-card border border-slate-200 dark:border-slate-800"
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
                          ? 'bg-corporate-orange text-white shadow-inner bbb-card-marked'
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
            <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400 bbb-no-print">
              {marked.size - 1} marked
              {hasBingo && <span className="ml-2 text-corporate-orange font-bold">· BINGO! 🎉</span>}
            </div>

            {/* Leadership reps reveal — the "so what" pivot */}
            {marked.size > 1 && (
              <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-card overflow-hidden bbb-no-print">
                <button
                  onClick={() => setShowReps((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-corporate-teal mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-corporate-navy dark:text-white">
                        What a great leader does instead
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {marked.size - 1} rep{marked.size - 1 === 1 ? '' : 's'} — one for each square you marked.
                      </div>
                    </div>
                  </div>
                  <span className="text-corporate-teal text-sm font-semibold shrink-0 ml-3">
                    {showReps ? 'Hide' : 'Show'}
                  </span>
                </button>
                {showReps && (
                  <ol className="px-5 pb-5 space-y-3">
                    {Array.from(marked)
                      .filter((idx) => idx !== 12)
                      .map((idx) => {
                        const sq = squares[idx];
                        if (!sq) return null;
                        return (
                          <li key={`tip-${idx}`} className="border-l-2 border-corporate-teal pl-3">
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              “{sq.text}”
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                              <span className="font-semibold text-corporate-teal">Rep:</span>{' '}
                              {tipForSquare(sq)}
                            </div>
                          </li>
                        );
                      })}
                  </ol>
                )}
              </div>
            )}

            {/* Share row */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-2 bbb-no-print">
              <button
                onClick={downloadPng}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-corporate-navy rounded-lg hover:bg-corporate-navy/90"
              >
                <Download className="w-4 h-4" /> Download PNG
              </button>
              <button
                onClick={printCard}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-corporate-navy dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Printer className="w-4 h-4" /> Print
              </button>
              <button
                onClick={shareEmailToFriend}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-corporate-teal rounded-lg hover:opacity-90"
              >
                <Send className="w-4 h-4" /> Email a friend
              </button>
              <button
                onClick={shareLinkedIn}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0A66C2] rounded-lg hover:opacity-90"
              >
                <Linkedin className="w-4 h-4" /> LinkedIn
              </button>
              <button
                onClick={shareTwitter}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-black rounded-lg hover:opacity-90"
              >
                <Twitter className="w-4 h-4" /> Post
              </button>
              <button
                onClick={() => {
                  const url = buildShareUrl('native');
                  if (navigator.share) {
                    navigator.share({ title: 'Bad Boss Bingo', text: shareText, url }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareText + url).catch(() => {});
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-corporate-navy dark:text-white bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Share2 className="w-4 h-4" /> More
              </button>
            </div>

            {/* Email capture */}
            <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-card bbb-no-print">
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
            <div className="mt-10 text-center text-xs text-slate-400 bbb-no-print">
              Made by{' '}
              <a href={BRAND_URL} className="font-bold text-corporate-teal hover:underline">
                LeaderReps
              </a>{' '}
              — daily reps for everyday leaders. ·{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="hover:underline">
                {CONTACT_EMAIL}
              </a>
            </div>

            {/* Print-only footer brand lockup */}
            <div className="bbb-print-only mt-6 pt-4 border-t border-slate-300 text-center text-sm text-slate-600">
              <div className="font-bold text-corporate-navy">LeaderReps — daily reps for everyday leaders.</div>
              <div>leaderreps.com  ·  team@leaderreps.com</div>
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
