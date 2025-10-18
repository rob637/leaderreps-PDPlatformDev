// src/components/screens/Dashboard.jsx
import React, { useMemo, useState } from 'react';
import { signOut } from 'firebase/auth';

// App context + helpers
import { useAppServices } from '../../App.jsx';
import { mdToHtml, callSecureGeminiAPI, hasGeminiKey, GEMINI_MODEL } from '../../utils/ApiHelpers.js';

// Icons
import {
  Clock as ClockIcon,   // ← alias avoids undefined global
  TrendingUp,
  CheckCircle2,
  BookOpen,
  ShieldCheck,
  Mic,
  Users,
  Zap,
  Settings,
  AlertTriangle,
  Home,
  CornerRightUp,
} from 'lucide-react';

/* ---------------------------------------
   Small UI helpers
----------------------------------------*/
const StatCard = ({ icon: Icon, label, value, onClick }) => (
  <button
    className="flex items-center gap-3 p-4 rounded-2xl bg-white hover:bg-emerald-50 transition border border-gray-100 shadow-sm text-left w-full"
    onClick={onClick}
    type="button"
  >
    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
      <Icon size={20} />
    </div>
    <div className="flex-1">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-xl font-semibold text-gray-900">{value}</div>
    </div>
    <CornerRightUp className="text-gray-400" size={18} />
  </button>
);

const Tile = ({ icon: Icon, title, desc, onClick }) => (
  <button
    className="rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 transition p-4 text-left shadow-sm"
    onClick={onClick}
    type="button"
  >
    <div className="flex items-center gap-2">
      <div className="p-2 rounded-lg bg-gray-100">
        <Icon size={18} />
      </div>
      <h3 className="font-semibold">{title}</h3>
    </div>
    <p className="text-sm text-gray-600 mt-2">{desc}</p>
  </button>
);

/* ---------------------------------------
   Gemini helper: extract text robustly
----------------------------------------*/
function extractGeminiText(resp) {
  if (!resp) return '';
  if (typeof resp === 'string') return resp;
  if (resp.text) return String(resp.text);
  const c = resp.candidates?.[0];
  const parts = c?.content?.parts;
  if (Array.isArray(parts)) {
    return parts.map(p => p?.text).filter(Boolean).join('\n\n');
  }
  return '';
}

/* ---------------------------------------
   Dashboard (default export)
----------------------------------------*/
const DashboardScreen = () => {
  const {
    navigate,
    user,
    pdpData,
    planningData,
    commitmentData,
  } = useAppServices();

  // Defensive counts
  const goalsCount = useMemo(() => {
    const g = pdpData?.goals;
    if (Array.isArray(g)) return g.length;
    if (pdpData && typeof pdpData === 'object') return Object.keys(pdpData).length;
    return 0;
  }, [pdpData]);

  const plansCount = useMemo(() => {
    const p = planningData?.plans || planningData?.items;
    if (Array.isArray(p)) return p.length;
    if (planningData && typeof planningData === 'object') return Object.keys(planningData).length;
    return 0;
  }, [planningData]);

  const commitsCount = useMemo(() => {
    const c = commitmentData?.commitments || commitmentData?.items;
    if (Array.isArray(c)) return c.length;
    if (commitmentData && typeof commitmentData === 'object') return Object.keys(commitmentData).length;
    return 0;
  }, [commitmentData]);

  // Gemini tip
  const [tipLoading, setTipLoading] = useState(false);
  const [tipHtml, setTipHtml] = useState('');

  const getDailyTip = async () => {
    if (!hasGeminiKey()) {
      setTipHtml(mdToHtml('> ⚠️ Gemini key/proxy not configured.\n\nSet `VITE_GEMINI_PROXY_URL` (preferred) or `VITE_GEMINI_API_KEY`.'));
      return;
    }
    setTipLoading(true);
    try {
      const prompt = `Give a concise, actionable leadership practice for the day (2 sentences max).
Audience: frontline managers.
Tone: encouraging, specific.`;
      const resp = await callSecureGeminiAPI({ prompt, model: GEMINI_MODEL });
      const text = extractGeminiText(resp) || 'No suggestion available right now.';
      setTipHtml(mdToHtml(text));
    } catch (e) {
      setTipHtml(mdToHtml(`**Error:** ${e?.message || 'Failed to fetch tip.'}`));
    } finally {
      setTipLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Home size={20} /> Welcome{user?.email ? `, ${user.email}` : ''} 👋
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Your hub for plans, practice, and progress.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <ClockIcon size={16} /> {new Date().toLocaleString()}
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={TrendingUp} label="Plans" value={plansCount} onClick={() => navigate('planning-hub')} />
        <StatCard icon={CheckCircle2} label="Commitments" value={commitsCount} onClick={() => navigate('daily-practice')} />
        <StatCard icon={BookOpen} label="Goals / PDP" value={goalsCount} onClick={() => navigate('prof-dev-plan')} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: quick actions / navigation */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Tile
              icon={ShieldCheck}
              title="Professional Dev Plan"
              desc="Define goals, milestones, and success criteria."
              onClick={() => navigate('prof-dev-plan')}
            />
            <Tile
              icon={Mic}
              title="Daily Practice"
              desc="Capture reps, reflect, and track momentum."
              onClick={() => navigate('daily-practice')}
            />
            <Tile
              icon={Zap}
              title="Coaching Lab"
              desc="Experiment with prompts and coaching patterns."
              onClick={() => navigate('coaching-lab')}
            />
            <Tile
              icon={Users}
              title="Planning Hub"
              desc="Prioritize work and align with your team."
              onClick={() => navigate('planning-hub')}
            />
            <Tile
              icon={BookOpen}
              title="Business Readings"
              desc="Curated articles to sharpen decisions."
              onClick={() => navigate('business-readings')}
            />
            <Tile
              icon={Settings}
              title="App Settings"
              desc="Manage account and app options."
              onClick={() => navigate('app-settings')}
            />
          </div>
        </div>

        {/* Middle: Gemini tip */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle size={18} /> Daily Coaching Tip
              </h2>
              <button
                className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                onClick={getDailyTip}
                disabled={tipLoading}
                type="button"
              >
                {tipLoading ? 'Fetching…' : 'Generate'}
              </button>
            </div>
            <div className="mt-3 prose prose-sm max-w-none">
              {tipHtml
                ? <div dangerouslySetInnerHTML={{ __html: tipHtml }} />
                : <p className="text-gray-600 text-sm">Click “Generate” to get a short, actionable tip.</p>}
            </div>
          </div>
        </div>

        {/* Right: recent activity */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp size={18} /> Recent Activity
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li>• PDP items: <span className="font-medium">{goalsCount}</span></li>
              <li>• Plans: <span className="font-medium">{plansCount}</span></li>
              <li>• Commitments: <span className="font-medium">{commitsCount}</span></li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              This is a simple overview. Hook in your real timeline when ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------
   Quick Start (named export)
----------------------------------------*/
export const QuickStartScreen = () => {
  const { navigate } = useAppServices();
  const md = `
# Quick Start

- **Create your PDP**: capture goals and milestones.
- **Do Daily Practice**: quick reps + reflection.
- **Explore Coaching Lab**: try prompt patterns.
- **Plan your week**: align tasks in Planning Hub.
  `;
  return (
    <div className="p-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: mdToHtml(md) }} />
        <div className="mt-4 flex gap-2">
          <button className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm" onClick={() => navigate('prof-dev-plan')}>Start PDP</button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => navigate('daily-practice')}>Do a Rep</button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => navigate('coaching-lab')}>Open Lab</button>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------
   App Settings (named export)
----------------------------------------*/
export const AppSettingsScreen = () => {
  const { user, auth, GEMINI_MODEL: model } = useAppServices();

  const doSignOut = async () => {
    try { if (auth) await signOut(auth); }
    catch (e) { console.error('Sign out failed:', e); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Settings size={18} /> Account
        </h2>
        <div className="mt-3 text-sm text-gray-700">
          <div><span className="text-gray-500">Email:</span> {user?.email || '—'}</div>
          <div><span className="text-gray-500">User ID:</span> {user?.userId || '—'}</div>
        </div>
        <div className="mt-4">
          <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={doSignOut} type="button">
            Sign out
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ShieldCheck size={18} /> App
        </h2>
        <ul className="mt-3 text-sm text-gray-700 space-y-1">
          <li>Icons loaded: lucide-react</li>
          <li>Gemini configured: {hasGeminiKey() ? 'Yes' : 'No'}</li>
          <li>Model: <code>{model || GEMINI_MODEL}</code></li>
        </ul>
      </div>
    </div>
  );
};

export default DashboardScreen;
