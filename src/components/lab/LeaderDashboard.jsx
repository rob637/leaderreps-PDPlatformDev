// src/components/lab/LeaderDashboard.jsx
//
// Token-gated leader view. Reached via ?leader={token}.
// Calls getLeaderPulseSnapshot Cloud Function which validates the token
// server-side and returns a sanitized snapshot (no individual responses).

import React, { useEffect, useState, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Copy,
  Mail,
  Send,
  RefreshCw,
  Users,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

function getStandaloneFirebase() {
  const config =
    typeof window !== 'undefined' && window.__FIREBASE_CONFIG__
      ? window.__FIREBASE_CONFIG__
      : null;
  if (!config) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return {
    app,
    auth: getAuth(app),
    functions: getFunctions(app, 'us-central1'),
  };
}

const LeaderDashboard = ({ token }) => {
  const [services, setServices] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [snapshot, setSnapshot] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [emailField, setEmailField] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [contactsField, setContactsField] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [copyOK, setCopyOK] = useState(false);

  // Init Firebase + anon auth
  useEffect(() => {
    const fb = getStandaloneFirebase();
    if (!fb) {
      setError('Configuration unavailable.');
      return;
    }
    setServices(fb);
    const unsub = onAuthStateChanged(fb.auth, async (u) => {
      if (!u) {
        try {
          await signInAnonymously(fb.auth);
        } catch (e) {
          setError('Session error. Please refresh.');
        }
        return;
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const refresh = useCallback(async () => {
    if (!services || !authReady) return;
    try {
      const callable = httpsCallable(services.functions, 'getLeaderPulseSnapshot');
      const res = await callable({ token });
      setSnapshot(res?.data || null);
    } catch (err) {
      console.error('[LeaderDashboard] snapshot failed', err);
      setError(err?.message || 'Could not load your pulse.');
    }
  }, [services, authReady, token]);

  useEffect(() => { refresh(); }, [refresh]);

  const responseUrl =
    typeof window !== 'undefined' && snapshot?.campaignId
      ? `${window.location.origin}/?pulse=${encodeURIComponent(snapshot.campaignId)}`
      : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(responseUrl);
      setCopyOK(true);
      setTimeout(() => setCopyOK(false), 2000);
    } catch {
      // Clipboard API unavailable — user can long-press to copy.
    }
  };

  const saveEmail = async (e) => {
    e?.preventDefault?.();
    if (!emailField || !emailField.includes('@')) return;
    setBusy(true);
    try {
      const callable = httpsCallable(services.functions, 'attachLeadEmail');
      await callable({ token, email: emailField.trim().toLowerCase() });
      setEmailSaved(true);
      await refresh();
    } catch (err) {
      setError(err?.message || 'Could not save email.');
    } finally {
      setBusy(false);
    }
  };

  const addContacts = async (e) => {
    e?.preventDefault?.();
    if (!contactsField.trim()) return;
    const tokens = contactsField.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
    const emails = tokens.filter((t) => t.includes('@')).map((t) => t.toLowerCase());
    const phones = tokens.filter((t) => !t.includes('@') && /\d/.test(t));
    setBusy(true);
    try {
      const callable = httpsCallable(services.functions, 'addPulseTeamContacts');
      await callable({ token, emails, phones, sendInvites: true });
      setContactsField('');
      setShowInviteForm(false);
      await refresh();
    } catch (err) {
      setError(err?.message || 'Could not add contacts.');
    } finally {
      setBusy(false);
    }
  };

  if (error && !snapshot) {
    return (
      <Wrap>
        <p className="text-sm text-amber-700 mt-3">{error}</p>
        <p className="text-xs text-slate-500 mt-2">
          Your private link may have expired or been mistyped. Start a new pulse:
        </p>
        <a href="/?pulse-start"
          className="inline-block mt-3 px-3 py-2 rounded-lg bg-corporate-teal text-white text-xs font-semibold">
          Start a new pulse
        </a>
      </Wrap>
    );
  }

  if (!snapshot) {
    return (
      <Wrap>
        <p className="text-sm text-slate-500 mt-3">Loading your pulse…</p>
      </Wrap>
    );
  }

  const {
    firstName,
    campaignName,
    weekKey,
    question,
    responseCount,
    threshold,
    unlocked,
    insight,
    hasEmail,
    inviteCount,
    trend,
    weekIndex,
    weeksRemaining,
    status,
  } = snapshot;

  const needed = Math.max(0, threshold - responseCount);
  const isCompleted = status === 'completed';

  const renew = async () => {
    setBusy(true);
    try {
      const callable = httpsCallable(services.functions, 'renewPulseCampaign');
      await callable({ token });
      await refresh();
    } catch (err) {
      setError(err?.message || 'Could not renew.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Wrap wide>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-corporate-navy">
            Hi {firstName || 'there'} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{campaignName} · Week {weekKey}</p>
        </div>
        <button
          onClick={refresh}
          className="px-2 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Insight card */}
      <div className="mt-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-corporate-teal" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-corporate-teal">
            This week's coaching insight
          </span>
        </div>
        {unlocked && insight ? (
          <div>
            <p className="text-base font-semibold text-corporate-navy">
              {insight.insight}
            </p>
            {insight.behaviorShift && (
              <div className="mt-3 p-3 rounded-lg bg-corporate-teal/5 border border-corporate-teal/20">
                <div className="text-[10px] font-bold uppercase tracking-wider text-corporate-teal mb-1">
                  Behavior shift
                </div>
                <div className="text-sm text-corporate-navy">{insight.behaviorShift}</div>
              </div>
            )}
            {insight.nextAction && (
              <div className="mt-2 p-3 rounded-lg bg-corporate-orange/5 border border-corporate-orange/20">
                <div className="text-[10px] font-bold uppercase tracking-wider text-corporate-orange mb-1">
                  Try this next
                </div>
                <div className="text-sm text-corporate-navy">{insight.nextAction}</div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-slate-600">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {responseCount} of {threshold} responses received
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {needed > 0
                ? `${needed} more anonymous response${needed === 1 ? '' : 's'} needed before your insight unlocks. This protects your team's anonymity.`
                : 'Generating your insight now — refresh in a moment.'}
            </p>
            <div className="mt-3 h-1.5 bg-slate-200 rounded overflow-hidden">
              <div
                className="h-full bg-corporate-teal transition-all"
                style={{ width: `${Math.min(100, (responseCount / threshold) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {question && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              This week's theme · {question.theme}
            </div>
            <div className="text-sm text-slate-700">"{question.quant}"</div>
          </div>
        )}
      </div>

      {/* Trend cards */}
      {trend && (trend.energy?.length > 0 || trend.trust?.length > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <TrendCard label="Energy" series={trend.energy || []} threshold={threshold} />
          <TrendCard label="Trust" series={trend.trust || []} threshold={threshold} />
        </div>
      )}

      {/* Program progress */}
      {weekIndex != null && (
        <div className="mt-4 px-4 py-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Program
            </div>
            <div className="text-sm text-corporate-navy font-semibold">
              {isCompleted
                ? '4-week run complete'
                : `Week ${weekIndex} of 4 · ${weeksRemaining} remaining`}
            </div>
          </div>
          {isCompleted && (
            <button
              onClick={renew}
              disabled={busy}
              className="px-3 py-2 rounded-lg bg-corporate-orange text-white text-xs font-bold disabled:opacity-50"
            >
              {busy ? 'Starting…' : 'Run another 4 weeks'}
            </button>
          )}
        </div>
      )}

      {/* Share / invite block */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Your team's anonymous link
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {inviteCount > 0
                ? `${inviteCount} invite${inviteCount === 1 ? '' : 's'} sent · ${responseCount} response${responseCount === 1 ? '' : 's'}`
                : 'Share this link with your team'}
            </div>
          </div>
          <button
            onClick={copyLink}
            className="px-3 py-2 rounded-lg bg-corporate-navy text-white text-xs font-semibold flex items-center gap-1.5"
          >
            {copyOK ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copyOK ? 'Copied' : 'Copy link'}
          </button>
        </div>
        <div className="mt-2 px-2 py-1.5 rounded bg-slate-50 text-[11px] text-slate-600 font-mono break-all">
          {responseUrl}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <a
            href={`mailto:?subject=${encodeURIComponent('Quick anonymous check-in')}&body=${encodeURIComponent(`I'd really value your honest, anonymous answer to one question this week:\n\n${responseUrl}\n\nIt's anonymous — your name and email are never linked to your response.`)}`}
            className="px-2 py-2 rounded-lg border border-slate-200 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
          >
            <Mail className="w-3.5 h-3.5" /> Email
          </a>
          <a
            href={`sms:?&body=${encodeURIComponent(`Quick anonymous team check-in: ${responseUrl}`)}`}
            className="px-2 py-2 rounded-lg border border-slate-200 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1"
          >
            <Send className="w-3.5 h-3.5" /> SMS
          </a>
          <button
            onClick={() => setShowInviteForm((v) => !v)}
            className="px-2 py-2 rounded-lg bg-corporate-teal text-white text-xs font-semibold flex items-center justify-center gap-1"
          >
            <Users className="w-3.5 h-3.5" /> Add team
          </button>
        </div>

        {showInviteForm && (
          <form onSubmit={addContacts} className="mt-3 space-y-2">
            <textarea
              rows={3}
              value={contactsField}
              onChange={(e) => setContactsField(e.target.value)}
              placeholder="emails or mobile numbers, separated by commas or new lines"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full px-3 py-2 rounded-lg bg-corporate-orange text-white text-xs font-semibold disabled:opacity-50"
            >
              {busy ? 'Sending…' : 'Send anonymous link'}
            </button>
            <p className="text-[10px] text-slate-400">
              We'll deliver the question once. We never market to your team.
            </p>
          </form>
        )}
      </div>

      {/* Email capture */}
      {!hasEmail && !emailSaved && (
        <div className="mt-4 rounded-2xl border border-corporate-orange/30 bg-corporate-orange/5 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-4 h-4 text-corporate-orange" />
            <span className="text-sm font-bold text-corporate-navy">
              Want this emailed to you when it unlocks?
            </span>
          </div>
          <p className="text-xs text-slate-600 mb-3">
            We'll only email you about your own pulse. Save your private link and
            get notified the moment your insight is ready.
          </p>
          <form onSubmit={saveEmail} className="flex gap-2">
            <input
              type="email"
              value={emailField}
              onChange={(e) => setEmailField(e.target.value)}
              placeholder="you@work.com"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
            <button
              type="submit"
              disabled={busy || !emailField.includes('@')}
              className="px-3 py-2 rounded-lg bg-corporate-orange text-white text-xs font-semibold disabled:opacity-50"
            >
              Save
            </button>
          </form>
        </div>
      )}

      {(hasEmail || emailSaved) && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-emerald-50 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          We'll email you when your insight unlocks.
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-[11px] text-slate-400">
          Bookmark this page — it's your private dashboard.
        </p>
      </div>
    </Wrap>
  );
};

const Wrap = ({ children, wide = false }) => (
  <div className="min-h-screen bg-slate-50 flex items-start justify-center p-4">
    <div className={`w-full ${wide ? 'max-w-xl' : 'max-w-md'} bg-white rounded-2xl shadow-card p-6 mt-6`}>
      <div className="flex items-center gap-2 mb-1 text-corporate-teal">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">
          LeaderReps · Your Pulse
        </span>
      </div>
      {children}
    </div>
  </div>
);

const TrendCard = ({ label, series }) => {
  const points = series.filter((p) => p.avg != null);
  const latest = points.length ? points[points.length - 1].avg : null;
  const prior = points.length > 1 ? points[points.length - 2].avg : null;
  const delta = latest != null && prior != null ? latest - prior : null;
  const max = 5;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-extrabold text-corporate-navy">
          {latest != null ? latest.toFixed(1) : '—'}
        </span>
        <span className="text-[10px] text-slate-400">/ 5</span>
        {delta != null && (
          <span
            className={`ml-1 text-[10px] font-semibold ${
              delta >= 0.05 ? 'text-emerald-600' : delta <= -0.05 ? 'text-red-600' : 'text-slate-400'
            }`}
          >
            {delta > 0 ? '▲' : delta < 0 ? '▼' : '–'} {Math.abs(delta).toFixed(1)}
          </span>
        )}
      </div>
      <div className="flex items-end gap-0.5 mt-2 h-8">
        {series.length === 0 && (
          <div className="text-[10px] text-slate-400">No data yet</div>
        )}
        {series.map((p, i) => {
          const h = p.avg != null ? Math.max(8, (p.avg / max) * 100) : 4;
          return (
            <div
              key={p.weekKey || i}
              title={p.weekKey + (p.avg != null ? ` · ${p.avg.toFixed(2)}` : '')}
              className={`flex-1 rounded-t ${p.avg != null ? 'bg-corporate-teal' : 'bg-slate-200'}`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
    </div>
  );
};

export default LeaderDashboard;
