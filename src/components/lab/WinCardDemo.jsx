// src/components/lab/WinCardDemo.jsx
//
// LeaderReps Lab — Win Card Generator MVP demo
//
// Demo-only: admin-gated, fully client-side, no Firestore writes.
// Purpose: validate whether a polished, LinkedIn-shareable artifact
// generated from a "win" is something leaders would actually post.
//
// What it does:
//   - Pick a template (Win / Insight / Streak / Skill)
//   - Edit the headline + body text
//   - Live preview rendered with brand colors
//   - Download as PNG (Canvas 2D)
//   - Copy LinkedIn share URL (mock UTM-tagged short link)

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Share2,
  Download,
  Linkedin,
  Copy,
  Check,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';

const NAVY = '#002E47';
const TEAL = '#47A88D';
const ORANGE = '#E04E1B';

const TEMPLATES = [
  {
    id: 'win',
    label: 'Win Card',
    accent: TEAL,
    defaults: {
      eyebrow: 'Day 34 · Leadership Reps',
      headline:
        'Had the hard conversation I’d been avoiding for three weeks.',
      footer: 'Reps logged: 34 · Streak: 12 days',
    },
  },
  {
    id: 'insight',
    label: 'Insight Card',
    accent: NAVY,
    defaults: {
      eyebrow: 'A reflection',
      headline:
        '“The team didn’t need certainty from me. They needed clarity.”',
      footer: '— from today’s PM reflection',
    },
  },
  {
    id: 'streak',
    label: 'Streak Card',
    accent: ORANGE,
    defaults: {
      eyebrow: 'Milestone unlocked',
      headline: '30-day Leadership Rep streak.',
      footer: 'Consistency beats intensity.',
    },
  },
  {
    id: 'skill',
    label: 'Skill Card',
    accent: TEAL,
    defaults: {
      eyebrow: 'Practicing this week',
      headline: 'Coaching for performance — Week 2 of 4.',
      footer: 'Skill mastery in progress.',
    },
  },
];

// --- Canvas rendering ------------------------------------------------------
// Renders the card to a 1080×1080 canvas for download / clipboard.
function renderCardToCanvas(canvas, { template, eyebrow, headline, footer, author }) {
  const ctx = canvas.getContext('2d');
  const W = 1080;
  const H = 1080;
  canvas.width = W;
  canvas.height = H;

  // Background
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, W, H);

  // Accent bar (left)
  ctx.fillStyle = template.accent;
  ctx.fillRect(0, 0, 18, H);

  // Subtle grid texture
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let y = 80; y < H; y += 80) {
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(W - 60, y);
    ctx.stroke();
  }

  // Eyebrow
  ctx.fillStyle = template.accent;
  ctx.font = '600 28px "Nunito Sans", system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText((eyebrow || '').toUpperCase(), 80, 110);

  // Headline (auto-wrap)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 64px "Nunito Sans", system-ui, sans-serif';
  wrapText(ctx, headline || '', 80, 190, W - 160, 78);

  // Footer
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '500 26px "Nunito Sans", system-ui, sans-serif';
  ctx.fillText(footer || '', 80, H - 220);

  // Author / brand
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = '600 24px "Nunito Sans", system-ui, sans-serif';
  ctx.fillText(author || 'A leader on LeaderReps', 80, H - 140);

  // Wordmark
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 28px "Nunito Sans", system-ui, sans-serif';
  ctx.fillText('LeaderReps', 80, H - 90);
  ctx.fillStyle = template.accent;
  ctx.font = '600 22px "Nunito Sans", system-ui, sans-serif';
  ctx.fillText('leaderreps.com', 80, H - 56);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  let line = '';
  let cursorY = y;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = words[i];
      cursorY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cursorY);
}

// --- Live HTML preview (matches canvas roughly) ----------------------------
function CardPreview({ template, eyebrow, headline, footer, author }) {
  return (
    <div
      className="relative aspect-square w-full max-w-[460px] mx-auto rounded-2xl overflow-hidden shadow-elevated"
      style={{ backgroundColor: NAVY, fontFamily: 'Nunito Sans, system-ui, sans-serif' }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-2"
        style={{ backgroundColor: template.accent }}
      />
      <div className="p-8 h-full flex flex-col justify-between text-white">
        <div>
          <div
            className="text-[11px] font-semibold tracking-widest uppercase mb-3"
            style={{ color: template.accent }}
          >
            {eyebrow}
          </div>
          <div className="text-2xl md:text-3xl font-extrabold leading-tight">
            {headline}
          </div>
        </div>
        <div>
          <div className="text-xs text-white/70 mb-1">{footer}</div>
          <div className="text-xs text-white/60 mb-3">{author}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-extrabold">LeaderReps</span>
            <span className="text-[11px]" style={{ color: template.accent }}>
              leaderreps.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main screen -----------------------------------------------------------
const WinCardDemo = () => {
  const { isAdmin, navigate } = useAppServices();
  const [templateId, setTemplateId] = useState('win');
  const template = useMemo(
    () => TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0],
    [templateId]
  );
  const [eyebrow, setEyebrow] = useState(template.defaults.eyebrow);
  const [headline, setHeadline] = useState(template.defaults.headline);
  const [footer, setFooter] = useState(template.defaults.footer);
  const [author, setAuthor] = useState('A leader on LeaderReps');
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  // Reset content when template changes
  useEffect(() => {
    setEyebrow(template.defaults.eyebrow);
    setHeadline(template.defaults.headline);
    setFooter(template.defaults.footer);
  }, [templateId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCardToCanvas(canvas, { template, eyebrow, headline, footer, author });
    const link = document.createElement('a');
    link.download = `leaderreps-${template.id}-card.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const mockShortLink = `https://leaderreps.com/r/demo-${template.id}`;
  const linkedInShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    `${mockShortLink}?utm_source=linkedin&utm_medium=wincard&utm_campaign=lab-demo`
  )}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mockShortLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          The Lab is admin-only.
        </p>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Home', path: 'dashboard' },
    { label: 'Admin', path: 'admin-hub' },
    { label: 'LeaderReps Lab', path: 'leaderreps-lab' },
    { label: 'Win Card Generator', path: null },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav items={breadcrumbs} navigate={navigate} />
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('leaderreps-lab')}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label="Back to Lab"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div className="p-2.5 bg-corporate-teal/10 rounded-xl">
            <Share2 className="w-6 h-6 text-corporate-teal" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
              Win Card Generator
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              MVP — "Strava for leaders." Generates a brand-styled,
              LinkedIn-shareable card from a leader's win.
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    t.id === templateId
                      ? 'bg-corporate-navy text-white border-corporate-navy'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-corporate-teal'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Eyebrow
            </label>
            <input
              value={eyebrow}
              onChange={(e) => setEyebrow(e.target.value)}
              maxLength={60}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-corporate-teal focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Headline
            </label>
            <textarea
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              maxLength={180}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-corporate-teal focus:outline-none text-sm resize-none"
            />
            <div className="text-xs text-slate-400 mt-1">
              {headline.length} / 180
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Footer
            </label>
            <input
              value={footer}
              onChange={(e) => setFooter(e.target.value)}
              maxLength={80}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-corporate-teal focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Author byline
            </label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              maxLength={60}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-corporate-teal focus:outline-none text-sm"
            />
            <div className="text-xs text-slate-400 mt-1">
              Pseudonym mode lets leaders share without exposing identity.
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={handleDownload}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90"
            >
              <Download className="w-4 h-4" />
              Download PNG (1080×1080)
            </button>
            <a
              href={linkedInShare}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-corporate-navy text-corporate-navy text-sm font-semibold hover:bg-corporate-navy hover:text-white transition-colors"
            >
              <Linkedin className="w-4 h-4" />
              Share to LinkedIn (with UTM)
            </a>
            <button
              onClick={handleCopy}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:border-corporate-teal"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Copy short link
                </>
              )}
            </button>
            <p className="text-xs text-slate-400 pt-1">
              Mock short link: <code>{mockShortLink}</code> — In production this
              would attribute trial signups back to the sharing leader.
            </p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-widest text-slate-500 mb-4">
            Live Preview
          </div>
          <CardPreview
            template={template}
            eyebrow={eyebrow}
            headline={headline}
            footer={footer}
            author={author}
          />
          <p className="text-xs text-slate-500 mt-6 text-center max-w-sm">
            The downloaded PNG is a 1080×1080 canvas render that matches this
            preview. Suitable for LinkedIn feed, Slack, and Stories crops.
          </p>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>

      <div className="px-6 pb-10">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 text-sm text-slate-600 dark:text-slate-300">
          <div className="font-semibold text-corporate-navy dark:text-white mb-2">
            What this MVP validates
          </div>
          <ul className="list-disc list-inside space-y-1">
            <li>Do leaders actually want to share leadership growth on LinkedIn?</li>
            <li>Which template performs best (Win / Insight / Streak / Skill)?</li>
            <li>Does the short-link attribution loop produce trial signups?</li>
          </ul>
          <div className="text-xs text-slate-400 mt-3">
            Demo only — no Firestore writes. Promotion path: add server-side
            rendering, real short-link service, and surface a "Share this win"
            CTA on the PM reflection screen.
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinCardDemo;
