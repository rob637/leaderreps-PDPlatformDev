// src/components/lab/LeaderStart.jsx
//
// LeaderReps Lab — Public, frictionless lead-magnet landing.
// Reached via ?pulse-start. Single-field signup → instant value.
//
// Flow:
//   1. Leader enters first name + (optional) team contacts.
//   2. We call createPulseLead Cloud Function (anonymous-auth).
//   3. Function creates campaign + leaderToken + sends invites.
//   4. We redirect leader to ?leader={token}.
//
// IMPORTANT: respondents are NOT marketed to. Their contact info is used only
// to deliver the weekly anonymous question. They become potential leaders
// themselves only via opt-in CTA on the response screen.

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  Sparkles,
  ShieldCheck,
  Users,
  Loader,
  CheckCircle2,
  ArrowRight,
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

const LeaderStart = ({ referredBy = null }) => {
  const [services, setServices] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [phase, setPhase] = useState('form'); // form | submitting | done | error
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    firstName: '',
    teamContacts: '', // textarea: comma/newline separated emails or phones
    sendForMe: true,
  });

  useEffect(() => {
    const fb = getStandaloneFirebase();
    if (!fb) {
      setError('Configuration unavailable. Please try again later.');
      setPhase('error');
      return;
    }
    setServices(fb);
    const unsub = onAuthStateChanged(fb.auth, async (u) => {
      if (!u) {
        try {
          await signInAnonymously(fb.auth);
        } catch (e) {
          console.error('[LeaderStart] anon auth failed', e);
          setError('We couldn\'t start your session. Please refresh and try again.');
          setPhase('error');
        }
        return;
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const parseContacts = (raw) => {
    if (!raw) return { emails: [], phones: [] };
    const tokens = String(raw)
      .split(/[\s,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const emails = [];
    const phones = [];
    for (const t of tokens) {
      if (t.includes('@')) emails.push(t.toLowerCase());
      else if (/\d/.test(t)) phones.push(t);
    }
    return { emails, phones };
  };

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!services || !authReady) return;
    if (!form.firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }
    setPhase('submitting');
    setError(null);
    try {
      const { emails, phones } = parseContacts(form.teamContacts);
      const callable = httpsCallable(services.functions, 'createPulseLead');
      const result = await callable({
        firstName: form.firstName.trim().slice(0, 80),
        emails: form.sendForMe ? emails : [],
        phones: form.sendForMe ? phones : [],
        sendInvites: form.sendForMe && (emails.length + phones.length) > 0,
        referredBy: referredBy || null,
      });
      const token = result?.data?.leaderToken;
      if (!token) throw new Error('No token returned');
      // Redirect to dashboard
      const url = new URL(window.location.href);
      url.search = `?leader=${encodeURIComponent(token)}`;
      window.location.replace(url.toString());
    } catch (err) {
      console.error('[LeaderStart] create failed', err);
      setError(err?.message || 'Something went wrong. Please try again.');
      setPhase('form');
    }
  };

  if (phase === 'error') {
    return (
      <Wrap>
        <p className="text-sm text-amber-700 mt-3">{error}</p>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-corporate-navy mt-2 leading-tight">
        Find out what your team really thinks of you.
      </h1>
      <p className="text-sm text-slate-600 mt-2">
        One anonymous question. 90 seconds. Your team answers honestly because
        they know it's safe. You get an AI coaching insight when enough people
        respond. Free.
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2 text-[11px]">
        <Bullet icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Anonymous" />
        <Bullet icon={<Sparkles className="w-3.5 h-3.5" />} label="AI-coached" />
        <Bullet icon={<Users className="w-3.5 h-3.5" />} label="Free" />
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Your first name
          </label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="e.g. Sam"
            maxLength={80}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-corporate-teal"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Your team (optional — emails or mobile numbers)
          </label>
          <textarea
            rows={3}
            value={form.teamContacts}
            onChange={(e) => setForm({ ...form, teamContacts: e.target.value })}
            placeholder={'sam@team.com, alex@team.com\n555-555-1212'}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-corporate-teal"
          />
          <div className="flex items-center gap-2 mt-1.5">
            <input
              id="sendForMe"
              type="checkbox"
              checked={form.sendForMe}
              onChange={(e) => setForm({ ...form, sendForMe: e.target.checked })}
              className="rounded border-slate-300"
            />
            <label htmlFor="sendForMe" className="text-[11px] text-slate-600">
              Send the anonymous link for me (recommended)
            </label>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
            We use these contacts only to deliver the question. We never email
            or text them about anything else.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={phase === 'submitting' || !authReady}
          className="w-full px-4 py-3 rounded-lg bg-corporate-orange text-white text-sm font-bold hover:bg-corporate-orange/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {phase === 'submitting' ? (
            <>
              <Loader className="w-4 h-4 animate-spin" /> Setting it up…
            </>
          ) : (
            <>
              Start my anonymous pulse <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-500 text-center">
          No credit card. No account. Just a private link only you can see.
        </p>
      </form>
    </Wrap>
  );
};

const Bullet = ({ icon, label }) => (
  <div className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-full bg-corporate-teal/10 text-corporate-teal-ink font-semibold">
    {icon}
    <span>{label}</span>
  </div>
);

const Wrap = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-start sm:items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-6 mt-6 sm:mt-0">
      <div className="flex items-center gap-2 mb-1 text-corporate-teal-ink">
        <ShieldCheck className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-wider">
          LeaderReps · Anonymous Team Pulse
        </span>
      </div>
      {children}
    </div>
  </div>
);

export default LeaderStart;
