// src/components/screens/ConversationSimulator.jsx
// Admin-only voice role-play. Mints an ephemeral Gemini Live token via
// Cloud Function (mintSimulatorToken) and streams a Live session in-browser.
//
// Cost containment:
//   - Hard 6-minute timer per session
//   - Auto-stop if sustained spend > $0.50/min for 60s
//   - Admin kill switch (writes `killed: true`; we self-terminate on snapshot)
//   - Per-admin daily $20 cap enforced server-side in mintSimulatorToken
//   - Every session (mint, open, close) is logged to
//     users/{uid}/simulator-sessions/{sessionId} for the cost dashboard.

import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Activity,
  AlertTriangle,
  Loader2,
  Play,
  ShieldAlert,
  Smartphone,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import {
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, functions } from '../../lib/firebase.js';
import { useAppServices } from '../../services/useAppServices';
import {
  SCENARIOS,
  DEFAULT_SCENARIO_ID,
  getScenarioById,
} from '../../lib/conversationSimulator/scenarios.js';
import { createAudioPipeline } from '../../lib/conversationSimulator/audio.js';
import { connectLiveSession } from '../../lib/conversationSimulator/geminiLive.js';
import { BreadcrumbNav } from '../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../config/breadcrumbConfig.js';

const STATE = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  LIVE: 'live',
  ENDED: 'ended',
  ERROR: 'error',
};

const MAX_DURATION_MS = 6 * 60 * 1000;
const COST_RATE_LIMIT_USD_PER_MIN = 0.5;
const COST_BREACH_GRACE_MS = 60 * 1000;

// Audio cost coefficients (matches MetricsPanel below).
// 16kHz mono PCM16 = 32_000 bytes/s; 24kHz = 48_000 bytes/s.
// Gemini 2.0 Flash Live ≈ $0.0001/s in, $0.0004/s out.
function estimateCostUsd(audioBytesIn, audioBytesOut) {
  const inSec = audioBytesIn / 32000;
  const outSec = audioBytesOut / 48000;
  return inSec * 0.0001 + outSec * 0.0004;
}

function isMobileUA() {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent || '',
  );
}

export default function ConversationSimulator() {
  const { user, isAdmin, navigate } = useAppServices();

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <div className="flex items-center gap-2 font-semibold mb-1">
            <ShieldAlert className="w-4 h-4" />
            Admin only
          </div>
          <p>
            The Conversation Simulator is currently in internal preview. Ask an
            admin to add your email to <code>metadata/config.adminemails</code>.
          </p>
        </div>
      </div>
    );
  }

  return <SimulatorBody user={user} navigate={navigate} />;
}

function SimulatorBody({ user, navigate }) {
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO_ID);
  const [state, setState] = useState(STATE.IDLE);
  const [errorMsg, setErrorMsg] = useState(null);
  const [warningMsg, setWarningMsg] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [dailyUsage, setDailyUsage] = useState(null); // { spentTodayUsd, dailyCapUsd }
  const [showRubric, setShowRubric] = useState(false);
  const [rubricSaved, setRubricSaved] = useState(false);
  const [mobileWarning] = useState(isMobileUA());

  const [metrics, setMetrics] = useState({
    sessionStartMs: null,
    firstAudioMs: null,
    lastFirstByteLatencyMs: null,
    roundTripSamples: [],
    audioBytesIn: 0,
    audioBytesOut: 0,
  });

  const sessionRef = useRef(null);
  const audioRef = useRef(null);
  const stopTimerRef = useRef(null);
  const userTurnEndRef = useRef(null);
  const waitingForFirstByteRef = useRef(false);
  const sessionDocIdRef = useRef(null);
  const killUnsubRef = useRef(null);
  const costBreachStartRef = useRef(null);
  const finalizeOnceRef = useRef(false);
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;

  const scenario = getScenarioById(scenarioId);

  useEffect(() => () => cleanup(true), []); // eslint-disable-line react-hooks/exhaustive-deps

  function pushTranscript(role, text, final) {
    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.role === role && !last.final) {
        const updated = [...prev];
        updated[updated.length - 1] = { role, text: last.text + text, final };
        return updated;
      }
      return [...prev, { role, text, final }];
    });
  }

  async function start() {
    setErrorMsg(null);
    setWarningMsg(null);
    setShowRubric(false);
    setRubricSaved(false);
    finalizeOnceRef.current = false;
    costBreachStartRef.current = null;

    let mintResp;
    try {
      const mint = httpsCallable(functions, 'mintSimulatorToken');
      const res = await mint({ scenarioId });
      mintResp = res?.data || {};
      if (!mintResp.token) throw new Error('No token returned from mintSimulatorToken');
    } catch (err) {
      const code = err?.code || '';
      const msg = err?.message || String(err);
      let display;
      if (code === 'functions/permission-denied') {
        display = 'Your account is not on the admin list. Ask an admin to add your email to metadata/config.adminemails.';
      } else if (code === 'functions/resource-exhausted') {
        display = msg; // already user-friendly (daily cap text)
      } else {
        display = `Could not mint token: ${msg}`;
      }
      setErrorMsg(display);
      setState(STATE.ERROR);
      return;
    }

    sessionDocIdRef.current = mintResp.sessionId || null;
    setDailyUsage({
      spentTodayUsd: Number(mintResp.spentTodayUsd) || 0,
      dailyCapUsd: Number(mintResp.dailyCapUsd) || 20,
    });

    // Listen for admin kill switch.
    if (sessionDocIdRef.current && user?.uid) {
      try {
        killUnsubRef.current = onSnapshot(
          doc(db, 'users', user.uid, 'simulator-sessions', sessionDocIdRef.current),
          (snap) => {
            if (snap.exists() && snap.data()?.killed === true) {
              setWarningMsg('Session terminated by an admin.');
              stop('killed-by-admin');
            }
          },
          (err) => console.warn('[simulator] kill listener error', err),
        );
      } catch (err) {
        console.warn('[simulator] could not attach kill listener', err);
      }
    }

    setTranscript([]);
    setMetrics({
      sessionStartMs: performance.now(),
      firstAudioMs: null,
      lastFirstByteLatencyMs: null,
      roundTripSamples: [],
      audioBytesIn: 0,
      audioBytesOut: 0,
    });
    setState(STATE.CONNECTING);

    try {
      audioRef.current = await createAudioPipeline({
        onInputChunk: (chunk) => {
          setMetrics((m) => ({ ...m, audioBytesIn: m.audioBytesIn + chunk.byteLength }));
          sessionRef.current?.sendAudioChunk(chunk);
        },
      });

      sessionRef.current = await connectLiveSession({
        ephemeralToken: mintResp.token,
        systemInstruction: scenario.personaPrompt,
        onAudioChunk: (buf) => {
          if (waitingForFirstByteRef.current && userTurnEndRef.current) {
            const latency = performance.now() - userTurnEndRef.current;
            waitingForFirstByteRef.current = false;
            setMetrics((m) => ({
              ...m,
              lastFirstByteLatencyMs: latency,
              roundTripSamples: [...m.roundTripSamples, latency],
              firstAudioMs: m.firstAudioMs ?? performance.now(),
            }));
          }
          setMetrics((m) => ({ ...m, audioBytesOut: m.audioBytesOut + buf.byteLength }));
          audioRef.current?.playChunk(buf);
        },
        onInputTranscript: (text, final) => {
          pushTranscript('leader', text, final);
          if (final) {
            userTurnEndRef.current = performance.now();
            waitingForFirstByteRef.current = true;
          }
        },
        onOutputTranscript: (text, final) => {
          pushTranscript('persona', text, final);
        },
        onInterrupted: () => audioRef.current?.flushPlayback(),
        onTurnComplete: () => {},
        onError: (err) => {
          console.error('[live] error', err);
          setErrorMsg(String(err?.message || err));
          setState(STATE.ERROR);
          finalizeSessionDoc('error');
        },
        onOpen: () => {
          setState(STATE.LIVE);
          stopTimerRef.current = setTimeout(() => stop('max-duration'), MAX_DURATION_MS);
          writeSessionOpen();
        },
        onClose: () => {
          setState((s) => (s === STATE.LIVE ? STATE.ENDED : s));
          finalizeSessionDoc('closed');
        },
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err?.message || err));
      setState(STATE.ERROR);
      finalizeSessionDoc('error');
      cleanup();
    }
  }

  function stop(reason) {
    if (state === STATE.LIVE) setState(STATE.ENDED);
    cleanup();
    finalizeSessionDoc(reason || 'user-stop');
  }

  function cleanup(skipFinalize) {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    if (killUnsubRef.current) {
      try { killUnsubRef.current(); } catch (_) { /* ignore */ }
      killUnsubRef.current = null;
    }
    try { sessionRef.current?.close(); } catch (_) { /* ignore */ }
    try { audioRef.current?.close(); } catch (_) { /* ignore */ }
    sessionRef.current = null;
    audioRef.current = null;
    waitingForFirstByteRef.current = false;
    userTurnEndRef.current = null;
    costBreachStartRef.current = null;
    if (skipFinalize) finalizeOnceRef.current = true;
  }

  async function writeSessionOpen() {
    const sessionId = sessionDocIdRef.current;
    if (!sessionId || !user?.uid) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'simulator-sessions', sessionId),
        {
          status: 'live',
          openedAtMs: Date.now(),
          openedAt: serverTimestamp(),
          scenarioId,
        },
        { merge: true },
      );
    } catch (err) {
      console.warn('[simulator] could not write open status', err);
    }
  }

  async function finalizeSessionDoc(reason) {
    if (finalizeOnceRef.current) return;
    finalizeOnceRef.current = true;
    const sessionId = sessionDocIdRef.current;
    if (!sessionId || !user?.uid) return;

    const m = metricsRef.current;
    const durationMs = m.sessionStartMs ? performance.now() - m.sessionStartMs : 0;
    const costEst = estimateCostUsd(m.audioBytesIn, m.audioBytesOut);

    // Persist a trimmed transcript only (avoid 1MB doc limit).
    const trimmed = (transcriptRef.current || []).map((t) => ({
      role: t.role,
      text: String(t.text || '').slice(0, 2000),
      final: !!t.final,
    }));

    try {
      await setDoc(
        doc(db, 'users', user.uid, 'simulator-sessions', sessionId),
        {
          status: 'ended',
          endReason: reason || 'user-stop',
          endedAtMs: Date.now(),
          endedAt: serverTimestamp(),
          durationMs: Math.round(durationMs),
          audioInBytes: m.audioBytesIn || 0,
          audioOutBytes: m.audioBytesOut || 0,
          costEst: Number(costEst.toFixed(6)),
          avgRoundTripMs: m.roundTripSamples.length
            ? Math.round(m.roundTripSamples.reduce((a, b) => a + b, 0) / m.roundTripSamples.length)
            : null,
          turnCount: trimmed.length,
          transcript: trimmed,
        },
        { merge: true },
      );
    } catch (err) {
      console.warn('[simulator] could not finalize session doc', err);
    }

    if (state !== STATE.ERROR) setShowRubric(true);
  }

  // Auto-stop watchdog: once cost/min exceeds the threshold, give a 60s
  // grace window; if we never recover, terminate the session.
  useEffect(() => {
    if (state !== STATE.LIVE) return undefined;
    const interval = setInterval(() => {
      const m = metricsRef.current;
      if (!m.sessionStartMs) return;
      const durMs = performance.now() - m.sessionStartMs;
      if (durMs < 15_000) return; // ignore the first 15s of warm-up
      const cost = estimateCostUsd(m.audioBytesIn, m.audioBytesOut);
      const costPerMin = cost / (durMs / 60_000);
      if (costPerMin > COST_RATE_LIMIT_USD_PER_MIN) {
        if (costBreachStartRef.current == null) {
          costBreachStartRef.current = performance.now();
          setWarningMsg(
            `Cost rate $${costPerMin.toFixed(2)}/min exceeds $${COST_RATE_LIMIT_USD_PER_MIN.toFixed(2)}/min. Auto-stopping in ${Math.round(COST_BREACH_GRACE_MS / 1000)}s if sustained.`,
          );
        } else if (performance.now() - costBreachStartRef.current > COST_BREACH_GRACE_MS) {
          setWarningMsg('Auto-stopped: cost rate exceeded $0.50/min for 60 seconds.');
          stop('cost-breach');
        }
      } else if (costBreachStartRef.current != null) {
        costBreachStartRef.current = null;
        setWarningMsg(null);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submitRubric(scores, notes) {
    const sessionId = sessionDocIdRef.current;
    if (!sessionId || !user?.uid) return;
    try {
      await setDoc(
        doc(db, 'users', user.uid, 'simulator-sessions', sessionId),
        {
          rubric: {
            scenarioId,
            scores, // { ruleId: 1..5 }
            notes: String(notes || '').slice(0, 2000),
            submittedAt: serverTimestamp(),
          },
        },
        { merge: true },
      );
      setRubricSaved(true);
    } catch (err) {
      console.warn('[simulator] could not save rubric', err);
      setErrorMsg(`Could not save rubric: ${err?.message || err}`);
    }
  }

  const avgRoundTrip = metrics.roundTripSamples.length
    ? metrics.roundTripSamples.reduce((a, b) => a + b, 0) / metrics.roundTripSamples.length
    : null;

  return (
    <div className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <BreadcrumbNav items={getBreadcrumbs('conversation-simulator')} navigate={navigate} />
      </div>

      <header className="bg-corporate-navy text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-corporate-teal">
              LeaderReps Lab · Conversation Simulator
            </div>
            <h1 className="text-2xl font-bold mt-1">Voice role-play (MVP)</h1>
          </div>
          <StatusBadge state={state} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-4">
          {mobileWarning && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex gap-2">
              <Smartphone className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                Mobile is not officially supported yet. Latency and microphone
                handling vary by device — use a laptop with a real mic for the
                best experience.
              </div>
            </div>
          )}

          <ScenarioCard
            scenario={scenario}
            disabled={state === STATE.LIVE || state === STATE.CONNECTING}
            allScenarios={SCENARIOS}
            onChange={setScenarioId}
          />

          <ControlBar
            state={state}
            onStart={start}
            onStop={() => stop('user-stop')}
            onReset={() => {
              setState(STATE.IDLE);
              setTranscript([]);
              setShowRubric(false);
              setRubricSaved(false);
              setWarningMsg(null);
              sessionDocIdRef.current = null;
            }}
          />

          {dailyUsage && (
            <DailyUsageBar dailyUsage={dailyUsage} />
          )}

          {warningMsg && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 flex gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>{warningMsg}</div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>{errorMsg}</div>
            </div>
          )}

          <TranscriptPanel
            transcript={transcript}
            state={state}
            personaName={scenario.personaName || 'Persona'}
          />

          {showRubric && (
            <RubricPanel
              scenario={scenario}
              saved={rubricSaved}
              onSubmit={submitRubric}
            />
          )}
        </section>

        <aside className="space-y-4">
          <MetricsPanel
            metrics={metrics}
            avgRoundTrip={avgRoundTrip}
            state={state}
          />
          <SpikeNotice user={user} />
        </aside>
      </main>
    </div>
  );
}

function StatusBadge({ state }) {
  const map = {
    [STATE.IDLE]: { label: 'Idle', cls: 'bg-slate-500' },
    [STATE.CONNECTING]: { label: 'Connecting…', cls: 'bg-amber-500' },
    [STATE.LIVE]: { label: 'Live', cls: 'bg-corporate-teal animate-pulse' },
    [STATE.ENDED]: { label: 'Ended', cls: 'bg-slate-600' },
    [STATE.ERROR]: { label: 'Error', cls: 'bg-red-600' },
  };
  const s = map[state] || map[STATE.IDLE];
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white px-3 py-1.5 rounded-full ${s.cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white" />
      {s.label}
    </span>
  );
}

function ScenarioCard({ scenario, disabled, allScenarios, onChange }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Scenario</div>
          <h2 className="text-lg font-bold mt-0.5">{scenario.title}</h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-corporate-orange bg-orange-50 px-2 py-1 rounded-md">
          {scenario.difficulty}
        </span>
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{scenario.framingText}</p>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
          You're being scored on
        </div>
        <div className="flex flex-wrap gap-2">
          {scenario.coachingFocus.map((f) => (
            <span key={f} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md">
              {f}
            </span>
          ))}
        </div>
      </div>
      {allScenarios.length > 1 && (
        <select
          disabled={disabled}
          value={scenario.id}
          onChange={(e) => onChange(e.target.value)}
          className="mt-4 w-full text-sm rounded-md border-slate-300 disabled:bg-slate-50"
        >
          {allScenarios.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      )}
    </div>
  );
}

function ControlBar({ state, onStart, onStop, onReset }) {
  if (state === STATE.IDLE || state === STATE.ERROR) {
    return (
      <button
        onClick={onStart}
        className="w-full inline-flex items-center justify-center gap-2 bg-corporate-teal hover:bg-emerald-600 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
      >
        <Play className="w-5 h-5" />
        Start conversation
      </button>
    );
  }
  if (state === STATE.CONNECTING) {
    return (
      <button disabled className="w-full inline-flex items-center justify-center gap-2 bg-slate-300 text-slate-600 font-semibold rounded-xl px-6 py-4">
        <Loader2 className="w-5 h-5 animate-spin" />
        Connecting…
      </button>
    );
  }
  if (state === STATE.LIVE) {
    return (
      <button
        onClick={onStop}
        className="w-full inline-flex items-center justify-center gap-2 bg-corporate-orange hover:bg-orange-700 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
      >
        <Square className="w-5 h-5" />
        End conversation
      </button>
    );
  }
  return (
    <button
      onClick={onReset}
      className="w-full inline-flex items-center justify-center gap-2 bg-corporate-navy hover:bg-slate-800 text-white font-semibold rounded-xl px-6 py-4 transition-colors"
    >
      <Mic className="w-5 h-5" />
      Run another
    </button>
  );
}

function DailyUsageBar({ dailyUsage }) {
  const pct = Math.min(100, (dailyUsage.spentTodayUsd / dailyUsage.dailyCapUsd) * 100);
  const warn = pct > 75;
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 p-3 text-xs">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-slate-500 font-semibold uppercase tracking-wider">
          Your spend today
        </span>
        <span className={`font-mono font-semibold ${warn ? 'text-corporate-orange' : 'text-slate-700 dark:text-slate-200'}`}>
          ${dailyUsage.spentTodayUsd.toFixed(2)} / ${dailyUsage.dailyCapUsd.toFixed(2)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={warn ? 'h-full bg-corporate-orange' : 'h-full bg-corporate-teal'}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function TranscriptPanel({ transcript, state, personaName }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-6 min-h-[320px]">
      <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-3">
        Live transcript
      </div>
      {transcript.length === 0 && (
        <div className="text-sm text-slate-400 italic">
          {state === STATE.LIVE
            ? 'Listening… speak to begin.'
            : 'Transcript will appear here once the conversation starts.'}
        </div>
      )}
      <div className="space-y-3">
        {transcript.map((t, i) => (
          <div key={i} className={t.role === 'leader' ? 'flex justify-end' : 'flex justify-start'}>
            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              t.role === 'leader'
                ? 'bg-corporate-navy text-white rounded-br-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-sm'
            }`}>
              <div className="text-[10px] uppercase tracking-wider opacity-60 mb-0.5">
                {t.role === 'leader' ? 'You' : personaName}
              </div>
              {t.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RubricPanel({ scenario, saved, onSubmit }) {
  const rubric = scenario.rubric || [];
  const [scores, setScores] = useState(() =>
    Object.fromEntries(rubric.map((r) => [r.id, 0])),
  );
  const [notes, setNotes] = useState('');
  const allRated = rubric.every((r) => scores[r.id] > 0);

  if (saved) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-900 flex gap-3">
        <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-bold mb-0.5">Rubric saved.</div>
          You can run another scenario, or open the cost dashboard from the Lab.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Star className="w-4 h-4 text-corporate-orange" />
        <h3 className="font-bold">How did that go?</h3>
      </div>
      <p className="text-xs text-slate-500 mb-5">
        Rate yourself 1 (didn't really happen) to 5 (nailed it). This is logged
        to the session so we can track which scenarios actually move the needle.
      </p>
      <div className="space-y-4">
        {rubric.map((r) => (
          <div key={r.id}>
            <div className="text-sm text-slate-800 dark:text-slate-200 mb-2">
              {r.label}
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setScores((s) => ({ ...s, [r.id]: n }))}
                  className={`w-9 h-9 rounded-md text-sm font-semibold border transition-colors ${
                    scores[r.id] === n
                      ? 'bg-corporate-teal border-corporate-teal text-white'
                      : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-corporate-teal'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1.5">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="What worked. What you'd do differently next rep."
            className="w-full text-sm rounded-md border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
          />
        </div>
        <button
          type="button"
          disabled={!allRated}
          onClick={() => onSubmit(scores, notes)}
          className="w-full inline-flex items-center justify-center gap-2 bg-corporate-navy hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-3 transition-colors"
        >
          Save rubric
        </button>
      </div>
    </div>
  );
}

function MetricsPanel({ metrics, avgRoundTrip, state }) {
  const durationMs = metrics.sessionStartMs
    ? (state === STATE.ENDED || state === STATE.ERROR
        ? (metrics.firstAudioMs ?? performance.now()) - metrics.sessionStartMs
        : performance.now() - metrics.sessionStartMs)
    : 0;

  const inSec = metrics.audioBytesIn / 32000;
  const outSec = metrics.audioBytesOut / 48000;
  const costEst = estimateCostUsd(metrics.audioBytesIn, metrics.audioBytesOut);

  const samples = metrics.roundTripSamples.length;
  const min = samples ? Math.min(...metrics.roundTripSamples) : null;
  const max = samples ? Math.max(...metrics.roundTripSamples) : null;
  const costPerMin = durationMs > 0 ? costEst / (durationMs / 60_000) : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-card border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-corporate-teal" />
        <h3 className="font-bold">Live metrics</h3>
      </div>
      <dl className="space-y-3 text-sm">
        <Metric label="Session duration" value={formatDuration(durationMs)} />
        <Metric
          label="Last turn TTFB"
          value={metrics.lastFirstByteLatencyMs ? `${Math.round(metrics.lastFirstByteLatencyMs)} ms` : '—'}
          warn={metrics.lastFirstByteLatencyMs > 1200}
        />
        <Metric
          label="Avg round-trip"
          value={avgRoundTrip ? `${Math.round(avgRoundTrip)} ms (n=${samples})` : '—'}
          warn={avgRoundTrip > 1200}
        />
        <Metric
          label="Min / Max"
          value={samples ? `${Math.round(min)} / ${Math.round(max)} ms` : '—'}
        />
        <Metric label="Audio in" value={`${Math.round(inSec)}s`} />
        <Metric label="Audio out" value={`${Math.round(outSec)}s`} />
        <Metric
          label="Est. cost"
          value={`$${costEst.toFixed(4)}`}
          warn={costPerMin > COST_RATE_LIMIT_USD_PER_MIN}
        />
        <Metric
          label="$ / min"
          value={costPerMin > 0 ? `$${costPerMin.toFixed(3)}` : '—'}
          warn={costPerMin > COST_RATE_LIMIT_USD_PER_MIN}
        />
      </dl>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 leading-relaxed">
        <strong>Auto-stop:</strong> 6&nbsp;min hard cap. Or &gt; $0.50/min
        sustained for 60s. Admins can kill any session from the cost dashboard.
      </div>
    </div>
  );
}

function Metric({ label, value, warn }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`font-mono font-semibold ${warn ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
        {value}
      </dd>
    </div>
  );
}

function SpikeNotice({ user }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
      <div className="font-bold uppercase tracking-wider mb-1">Internal preview</div>
      Admin-only. Each session mints a short-lived (10&nbsp;min) ephemeral
      Gemini Live token via Cloud Function — no long-lived key in the browser.
      Daily spend cap and audit log live in Firestore.
      {user?.email && <div className="mt-1 opacity-70">Signed in as {user.email}</div>}
    </div>
  );
}

function formatDuration(ms) {
  if (!ms || ms < 0) return '0s';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}
