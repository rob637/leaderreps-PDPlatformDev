// src/components/lab/StateOfLeadershipPublic.jsx
//
// LeaderReps Lab — The State of Leadership annual report (public, email-gated)
// Reached via ?state-of-leadership or ?state-of-leadership=2026.
//
// Flow:
//   1. Public read of `reports_sol/{year}` where status == "published"
//   2. Render hero + section preview (intro + key findings + 1-2 charts teaser)
//   3. Email gate form → calls requestStateOfLeadershipReport → returns signed PDF URL
//   4. After submit: show inline preview cards and a download button

import React, { useEffect, useMemo, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import {
  FileText,
  Download,
  Mail,
  Loader,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Quote,
  Check,
} from 'lucide-react';

const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const REQUEST_URL = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/requestStateOfLeadershipReport`;

function getStandaloneFirestore() {
  const config =
    typeof window !== 'undefined' && window.__FIREBASE_CONFIG__
      ? window.__FIREBASE_CONFIG__
      : null;
  if (!config) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return getFirestore(app);
}

const SECTION_ICON = {
  'intro': FileText,
  'key-findings': TrendingUp,
  'stat-highlight': BarChart3,
  'quote': Quote,
  'chart': BarChart3,
  'recommendations': ArrowRight,
};

function SectionPreview({ section }) {
  const Icon = SECTION_ICON[section.type] || FileText;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-card">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-corporate-teal mb-2">
        <Icon className="w-4 h-4" />
        {section.type?.replace('-', ' ') || 'Section'}
      </div>
      <h3 className="text-xl md:text-2xl font-extrabold text-corporate-navy dark:text-white leading-snug">
        {section.title}
      </h3>
      {section.type === 'stat-highlight' && section.statValue && (
        <div className="my-4">
          <div className="text-5xl md:text-6xl font-extrabold text-corporate-orange leading-none">
            {section.statValue}
          </div>
          {section.statLabel && (
            <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {section.statLabel}
            </div>
          )}
        </div>
      )}
      {section.body && (
        <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-line">
          {section.body}
        </p>
      )}
    </div>
  );
}

export default function StateOfLeadershipPublic() {
  const db = useMemo(() => getStandaloneFirestore(), []);

  // Resolve target year from query string
  const targetYear = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('state-of-leadership') || params.get('state_of_leadership');
    const yr = Number(raw);
    if (Number.isFinite(yr) && yr > 2000) return yr;
    return new Date().getFullYear();
  }, []);

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Email-gate state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!db) {
        setError('App config missing.');
        setLoading(false);
        return;
      }
      try {
        const snap = await getDoc(doc(db, 'reports_sol', String(targetYear)));
        if (cancelled) return;
        if (!snap.exists()) {
          setError(`The ${targetYear} report isn't published yet. Check back soon.`);
          setLoading(false);
          return;
        }
        const data = snap.data();
        if (data.status !== 'published') {
          setError(`The ${targetYear} report isn't published yet. Check back soon.`);
          setLoading(false);
          return;
        }
        setReport({ id: snap.id, ...data });
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError('Could not load report. Please reload.');
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [db, targetYear]);

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(REQUEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || null,
          company: company.trim() || null,
          year: targetYear,
          referrer: typeof document !== 'undefined' ? document.referrer : null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.downloadUrl) {
        setFormError(data.error || 'Could not generate your link. Try again.');
        setBusy(false);
        return;
      }
      setDownloadUrl(data.downloadUrl);
    } catch (err) {
      setFormError('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // Sections to preview publicly (intro, first finding, first stat) — gate the rest behind email
  const previewSections = useMemo(() => {
    if (!report || !Array.isArray(report.sections)) return [];
    return report.sections.slice(0, 3);
  }, [report]);

  return (
    <div className="min-h-screen bg-[#FFFAF8] dark:bg-slate-950">
      {/* Hero */}
      <header className="bg-corporate-navy text-white">
        <div className="max-w-5xl mx-auto px-6 py-10 md:py-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-corporate-teal mb-3">
            <FileText className="w-4 h-4" />
            LeaderReps Annual Report
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            {report?.title || `The ${targetYear} State of Leadership`}
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl">
            {report?.subtitle ||
              "A synthesis of the year's most credible leadership research, paired with early signals from inside LeaderReps. Every statistic is sourced."}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader className="w-5 h-5 animate-spin mr-3" />
            Loading the report…
          </div>
        )}

        {error && !loading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
            <FileText className="w-10 h-10 mx-auto text-slate-400 mb-3" />
            <div className="text-lg font-bold text-corporate-navy dark:text-white">{error}</div>
            <a
              href="https://leaderreps.com"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm font-bold text-white bg-corporate-teal rounded-lg hover:bg-corporate-teal/90"
            >
              Explore LeaderReps <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}

        {report && !error && (
          <>
            {/* Preview sections */}
            <div className="space-y-4 md:space-y-5">
              {previewSections.map((s, i) => (
                <SectionPreview key={s.id || i} section={s} />
              ))}
            </div>

            {/* Email gate / download box */}
            <div className="mt-10 bg-white dark:bg-slate-900 border-2 border-corporate-teal rounded-2xl p-6 md:p-10 shadow-card">
              {downloadUrl ? (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-corporate-teal/10 text-corporate-teal mb-4">
                    <Check className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-corporate-navy dark:text-white">
                    Your report is ready.
                  </h2>
                  <p className="mt-2 text-slate-600 dark:text-slate-300">
                    We've also emailed it to you for safekeeping.
                  </p>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-6 px-6 py-3 text-sm font-bold text-white bg-corporate-orange rounded-lg hover:bg-corporate-orange/90"
                  >
                    <Download className="w-4 h-4" />
                    Download the {targetYear} State of Leadership
                  </a>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 mb-5">
                    <Mail className="w-6 h-6 text-corporate-teal shrink-0 mt-1" />
                    <div>
                      <h2 className="text-xl md:text-2xl font-extrabold text-corporate-navy dark:text-white">
                        Get the full report
                      </h2>
                      <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 mt-1">
                        Free, PDF, no spam. We'll email you a download link.
                      </p>
                    </div>
                  </div>
                  <form onSubmit={submit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Your name (optional)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Company (optional)"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        className="px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                      />
                    </div>
                    <input
                      type="email"
                      placeholder="you@work.com *"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                    />
                    {formError && (
                      <div className="text-sm text-red-600">{formError}</div>
                    )}
                    <button
                      type="submit"
                      disabled={busy}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-corporate-teal rounded-lg hover:bg-corporate-teal/90 disabled:opacity-50"
                    >
                      {busy ? (
                        <><Loader className="w-4 h-4 animate-spin" /> Preparing your copy…</>
                      ) : (
                        <><Download className="w-4 h-4" /> Send me the report</>
                      )}
                    </button>
                  </form>
                  <p className="text-[11px] text-slate-400 text-center mt-3">
                    By submitting you agree to receive occasional emails from LeaderReps. Unsubscribe anytime.
                  </p>
                </>
              )}
            </div>

            {/* CTA */}
            <div className="mt-12 text-center">
              <h2 className="text-xl md:text-2xl font-extrabold text-corporate-navy dark:text-white">
                Want to be in next year's report?
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
                Join LeaderReps free and run a few short reps per day. Your practice helps shape what the field of leadership actually looks like — anonymously.
              </p>
              <a
                href="https://leaderreps.com"
                className="inline-flex items-center gap-2 mt-5 px-6 py-3 text-sm font-bold text-white bg-corporate-navy rounded-lg hover:bg-corporate-navy/90"
              >
                Start practicing <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="mt-10 text-center text-xs text-slate-400">
              © {new Date().getFullYear()} <a href="https://leaderreps.com" className="font-bold text-corporate-teal hover:underline">LeaderReps</a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
