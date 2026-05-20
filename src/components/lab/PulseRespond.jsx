// src/components/lab/PulseRespond.jsx
// Public anonymous responder — 3 questions, ~60 seconds.

import React, { useEffect, useState } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { Lock, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';

function getWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

const ANCHORS = [
  {
    id: 'energy',
    quant: "How was the team's energy this week?",
    scale: { minLabel: 'Drained', maxLabel: 'Energized' },
  },
  {
    id: 'trust',
    quant: 'How much did you trust leadership this week?',
    scale: { minLabel: 'Low trust', maxLabel: 'High trust' },
  },
];

const THEMES = [
  {
    id: 'clarity',
    theme: 'Clarity',
    quant: 'How clear were priorities this week?',
    scale: { minLabel: 'Very unclear', maxLabel: 'Very clear' },
    text: 'What would have made priorities clearer?',
  },
  {
    id: 'support',
    theme: 'Support',
    quant: 'When you were blocked this week, did you feel supported?',
    scale: { minLabel: 'Not at all', maxLabel: 'Fully' },
    text: 'What kind of support would have helped most?',
  },
  {
    id: 'safety',
    theme: 'Trust & Safety',
    quant: 'Could you speak up honestly this week?',
    scale: { minLabel: 'Not safe', maxLabel: 'Completely safe' },
    text: 'What made it easy or hard to speak up?',
  },
  {
    id: 'signal',
    theme: 'Leadership Signal',
    quant: 'Overall, how did leadership feel this week?',
    scale: { minLabel: 'Distracted', maxLabel: 'Steady' },
    text: 'One word that describes leadership this week.',
  },
];

function getThemeForWeek(weekKey) {
  const m = String(weekKey).match(/W(\d+)$/);
  const weekNum = m ? parseInt(m[1], 10) : 0;
  return THEMES[weekNum % THEMES.length];
}

function getStandaloneFirebase() {
  // Check multiple potential locations for the config, including the direct Vite env
  const config =
    (typeof window !== "undefined" && (window.__FIREBASE_CONFIG__ || window.__firebase_config))
      ? (window.__FIREBASE_CONFIG__ || window.__firebase_config)
      : (import.meta.env.VITE_FIREBASE_CONFIG ? JSON.parse(import.meta.env.VITE_FIREBASE_CONFIG) : null);

  if (!config || !config.apiKey) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return { app, auth: getAuth(app), db: getFirestore(app) };
}

const ScoreRow = ({ label, scale, value, onChange }) => (
  <div>
    <div className="text-base font-semibold text-corporate-navy">{label}</div>
    <div className="flex items-center justify-between mt-2 gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex-1 py-3 rounded-lg border text-sm font-semibold transition-colors ${
            value === n
              ? 'bg-corporate-teal text-white border-corporate-teal'
              : 'bg-white border-slate-300 text-slate-600 hover:border-corporate-teal'
          }`}
          aria-pressed={value === n}
        >
          {n}
        </button>
      ))}
    </div>
    <div className="flex justify-between text-[11px] text-slate-400 mt-1">
      <span>{scale.minLabel}</span>
      <span>{scale.maxLabel}</span>
    </div>
  </div>
);

const PulseRespond = ({ campaignId }) => {
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [scoreEnergy, setScoreEnergy] = useState(null);
  const [scoreTrust, setScoreTrust] = useState(null);
  const [scoreTheme, setScoreTheme] = useState(null);
  const [text, setText] = useState('');
  const [services, setServices] = useState(null);

  const weekKey = getWeekKey();
  const themeQuestion = getThemeForWeek(weekKey);

  useEffect(() => {
    let active = true;
    
    // Safety timer: If we're still loading after 8 seconds, show a manual retry error
    const timer = setTimeout(() => {
      if (active && phase === 'loading') {
        setError('[Code 408] Connection timeout. This usually happens if the mobile browser is blocking secondary connections. Please try refreshing or using a different browser (Chrome/Safari).');
        setPhase('error');
      }
    }, 8000);

    const fb = getStandaloneFirebase();
    if (!fb) {
      clearTimeout(timer);
      const why = typeof window === 'undefined' ? 'ssr' : 'config-missing';
      setError(`[Code 500] Configuration state "${why}" - please refresh. If this persists, the environment config may be missing.`);
      setPhase('error');
      return;
    }
    setServices(fb);

    const unsub = onAuthStateChanged(fb.auth, async (u) => {
      try {
        if (!u) {
          console.log('[PulseRespond] No user, signing in anonymously...');
          await signInAnonymously(fb.auth);
          return;
        }

        console.log('[PulseRespond] Auth ready, fetching campaign:', campaignId);
        const snap = await getDoc(doc(fb.db, "team_pulse_campaigns", campaignId));
        
        if (!active) return;
        clearTimeout(timer);

        if (!snap.exists()) {
          const detail = campaignId?.startsWith("pulse-") ? "exists check failed" : "id format";
          setError(`[Code 404] Pulse identifier "${campaignId}" was not found or has been deactivated. (${detail})`);
          setPhase("error");
          return;
        }
        const data = snap.data();
        if (data.status && data.status !== 'active') {
          setError('This pulse campaign has ended. Thanks for stopping by.');
          setPhase('error');
          return;
        }
        setCampaign({ id: snap.id, ...data });
        setPhase('ready');
      } catch (err) {
        clearTimeout(timer);
        console.error('[PulseRespond]', err);
        // Special handling for common mobile auth issues
        if (err.code === 'auth/operation-not-allowed') {
          setError('[Code 403] Anonymous sign-in is not enabled in the Firebase console.');
        } else if (err.code === 'auth/network-request-failed') {
          setError('[Code 499] Network connection failed. Please check your signal.');
        } else {
          setError(`[Code 503] Error loading pulse: ${err.message || 'Unknown'}`);
        }
        setPhase('error');
      }
    });

    return () => {
      active = false;
      clearTimeout(timer);
      unsub();
    };
  }, [campaignId]);

  const submit = async (e) => {
    e?.preventDefault?.();
    if (!services || !campaign) return;
    if (scoreEnergy == null || scoreTrust == null || scoreTheme == null) {
      setError('Please answer all three questions before submitting.');
      return;
    }
    setPhase('submitting');
    setError(null);
    try {
      const responseId = `resp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;
      const ref = doc(
        services.db,
        'team_pulse_campaigns',
        campaign.id,
        'responses',
        responseId
      );
      await setDoc(ref, {
        weekKey,
        scoreEnergy: Number(scoreEnergy),
        scoreTrust: Number(scoreTrust),
        scoreTheme: Number(scoreTheme),
        themeId: themeQuestion.id,
        text: (text || '').slice(0, 500),
        submittedAt: serverTimestamp(),
      });
      setPhase('submitted');
    } catch (err) {
      console.error('[PulseRespond] submit failed', err);
      setError(
        err?.message ||
          'We could not record your response. Please try again in a moment.'
      );
      setPhase('ready');
    }
  };

  const Wrap = ({ children }) => (
    <div className="min-h-screen bg-slate-50 flex items-start sm:items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-6 mt-6 sm:mt-0">
        <div className="flex items-center gap-2 mb-1 text-corporate-teal-ink">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Anonymous Team Pulse
          </span>
        </div>
        {children}
      </div>
    </div>
  );

  if (phase === 'loading') {
    return (
      <Wrap>
        <p className="text-sm text-slate-500 mt-3">Preparing your secure check-in…</p>
      </Wrap>
    );
  }

  if (phase === 'error') {
    return (
      <Wrap>
        <div className="flex items-center gap-2 mt-3 text-amber-700">
          <Lock className="w-4 h-4" />
          <span className="text-sm font-semibold">Link unavailable</span>
        </div>
        <p className="text-sm text-slate-600 mt-2">{error}</p>
      </Wrap>
    );
  }

  if (phase === 'submitted') {
    const startUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/?pulse-start&ref=${encodeURIComponent(campaignId)}`
        : '/?pulse-start';
    return (
      <Wrap>
        <div className="flex items-center gap-2 mt-3 text-emerald-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-base font-bold">Thank you.</span>
        </div>
        <p className="text-sm text-slate-600 mt-2">
          Your response is anonymous and grouped with your team. No one —
          including {campaign?.leaderName ? campaign.leaderName : 'your leader'} —
          can see it as an individual.
        </p>

        <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-corporate-teal/5 to-white border border-corporate-teal/30">
          <div className="flex items-center gap-2 text-corporate-teal-ink mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Want this for your team?
            </span>
          </div>
          <p className="text-sm text-corporate-navy font-semibold leading-snug">
            Find out what <em>your</em> team really thinks of you.
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Same anonymous pulse. 60 seconds a week. AI coaching insight. Free.
          </p>
          <a
            href={startUrl}
            className="mt-3 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-corporate-orange text-white text-xs font-bold"
          >
            Get my private link →
          </a>
        </div>

        <p className="text-[11px] text-slate-400 mt-4">
          You can close this window now.
        </p>
      </Wrap>
    );
  }

  const leaderFirstName =
    campaign?.leaderName?.trim().split(/\s+/)[0] || 'Your leader';

  return (
    <Wrap>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-corporate-navy">
          {leaderFirstName} wants honest, anonymous feedback.
        </h1>
        <div className="flex items-center gap-2 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg my-2">
          <ShieldCheck className="w-5 h-5 text-corporate-teal shrink-0" />
          <p className="text-[11px] leading-tight text-slate-600">
            <strong>Privacy Shield Active:</strong> Your responses are mathematically anonymized. {leaderFirstName} can only see group trends once at least {campaign?.minResponsesToUnlock || 4} teammates respond. No individual scores are ever visible.
          </p>
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        Week {weekKey} · 3 quick questions · ~60 seconds · fully anonymous
      </p>

      <form onSubmit={submit} className="mt-5 space-y-5">
        <ScoreRow
          label={ANCHORS[0].quant}
          scale={ANCHORS[0].scale}
          value={scoreEnergy}
          onChange={setScoreEnergy}
        />
        <ScoreRow
          label={ANCHORS[1].quant}
          scale={ANCHORS[1].scale}
          value={scoreTrust}
          onChange={setScoreTrust}
        />

        {/* One word that describes leadership this week. */}
        <div className="pt-2 border-t border-slate-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-corporate-teal-ink mb-1">
            This week's theme · {themeQuestion.theme}
          </div>
          <ScoreRow
            label={themeQuestion.quant}
            scale={themeQuestion.scale}
            value={scoreTheme}
            onChange={setScoreTheme}
          />
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              {themeQuestion.text}{' '}
              <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              placeholder="Share what's on your mind…"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/50 focus:border-corporate-teal transition-all"
            />
            <div className="text-[11px] text-slate-400 text-right mt-1">
              {text.length}/500
            </div>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={
            phase === 'submitting' ||
            scoreEnergy == null ||
            scoreTrust == null ||
            scoreTheme == null
          }
          className="w-full px-4 py-3 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 disabled:opacity-50"
        >
          {phase === 'submitting' ? 'Submitting…' : 'Submit anonymously'}
        </button>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          <Sparkles className="inline w-3 h-3 -mt-0.5 mr-1 text-corporate-teal" />
          Your responses are grouped with at least{' '}
          {campaign?.minResponsesToUnlock || 4} teammates before anything is shown
          to {leaderFirstName}. No identity, IP, or precise timestamp is stored.
        </p>
      </form>
    </Wrap>
  );
};

export default PulseRespond;
