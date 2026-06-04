// src/components/screens/ConversationSimulator.jsx
// Admin-only voice role-play. Mints an ephemeral Gemini Live token via
// Cloud Function (mintSimulatorToken) and streams a Live session in-browser.
// No second sign-in — uses the existing app auth.

import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Activity,
  AlertTriangle,
  Loader2,
  Play,
  ShieldAlert,
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../lib/firebase.js';
import { useAppServices } from '../../services/useAppServices';
import { SCENARIOS, DEFAULT_SCENARIO_ID } from '../../lib/conversationSimulator/scenarios.js';
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
  const [transcript, setTranscript] = useState([]);
  const [metrics, setMetrics] = useState({
    sessionStartMs: null,
    firstAudioMs: null,
    userTurnEndMs: null,
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

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);

  useEffect(() => () => cleanup(), []);

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

    let ephemeralToken = null;
    try {
      const mint = httpsCallable(functions, 'mintSimulatorToken');
      const res = await mint();
      ephemeralToken = res?.data?.token;
      if (!ephemeralToken) throw new Error('No token returned from mintSimulatorToken');
    } catch (err) {
      const code = err?.code || '';
      const msg = err?.message || String(err);
      setErrorMsg(
        code === 'functions/permission-denied'
          ? 'Your account is not on the admin list. Ask an admin to add your email to metadata/config.adminemails.'
          : `Could not mint token: ${msg}`,
      );
      setState(STATE.ERROR);
      return;
    }

    setTranscript([]);
    setMetrics({
      sessionStartMs: performance.now(),
      firstAudioMs: null,
      userTurnEndMs: null,
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
        ephemeralToken,
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
        },
        onOpen: () => {
          setState(STATE.LIVE);
          stopTimerRef.current = setTimeout(() => stop(), MAX_DURATION_MS);
        },
        onClose: () => {
          setState((s) => (s === STATE.LIVE ? STATE.ENDED : s));
        },
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(String(err?.message || err));
      setState(STATE.ERROR);
      cleanup();
    }
  }

  function stop() {
    setState(STATE.ENDED);
    cleanup();
  }

  function cleanup() {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
    try { sessionRef.current?.close(); } catch (_) {}
    try { audioRef.current?.close(); } catch (_) {}
    sessionRef.current = null;
    audioRef.current = null;
    waitingForFirstByteRef.current = false;
    userTurnEndRef.current = null;
  }

  const avgRoundTrip = metrics.roundTripSamples.length
    ? metrics.roundTripSamples.reduce((a, b) => a + b, 0) / metrics.roundTripSamples.length
    : null;

  return (
    <div className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
        <BreadcrumbNav items={getBreadcrumbs('conversation-simulator', { navigate })} />
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
          <ScenarioCard
            scenario={scenario}
            disabled={state === STATE.LIVE || state === STATE.CONNECTING}
            allScenarios={SCENARIOS}
            onChange={setScenarioId}
          />

          <ControlBar
            state={state}
            onStart={start}
            onStop={stop}
            onReset={() => { setState(STATE.IDLE); setTranscript([]); }}
          />

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>{errorMsg}</div>
            </div>
          )}

          <TranscriptPanel transcript={transcript} state={state} />
        </section>

        <aside className="space-y-4">
          <MetricsPanel metrics={metrics} avgRoundTrip={avgRoundTrip} state={state} />
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

function TranscriptPanel({ transcript, state }) {
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
                {t.role === 'leader' ? 'You' : 'Jamie'}
              </div>
              {t.text}
            </div>
          </div>
        ))}
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

  // 16kHz mono PCM16 = 32,000 bytes/sec; 24kHz = 48,000 bytes/sec.
  // Gemini 2.0 Flash Live ≈ audio in $0.0001/sec, audio out $0.0004/sec.
  const inSec = metrics.audioBytesIn / 32000;
  const outSec = metrics.audioBytesOut / 48000;
  const costEst = inSec * 0.0001 + outSec * 0.0004;

  const samples = metrics.roundTripSamples.length;
  const min = samples ? Math.min(...metrics.roundTripSamples) : null;
  const max = samples ? Math.max(...metrics.roundTripSamples) : null;

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
          warn={costEst / Math.max(durationMs / 60000, 0.01) > 0.5}
        />
      </dl>
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-[11px] text-slate-500 leading-relaxed">
        <strong>Kill criteria:</strong> avg round-trip &gt; 1200&nbsp;ms, or &gt; $0.50/min sustained.
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
