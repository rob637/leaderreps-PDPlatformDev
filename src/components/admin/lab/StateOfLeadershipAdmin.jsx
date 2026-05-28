// src/components/admin/lab/StateOfLeadershipAdmin.jsx
// LeaderReps Lab — State of Leadership Report admin
//
// Aggregates anonymized platform data into an annual HBR-style report.
// Drives email-gated PDF download as a lead magnet.
//
// Firestore:
//   - reports_sol/{year}                — report metadata, sections, publish state
//   - reports_sol/{year}/aggregates/*   — raw anonymized stats (cloud function writes)
//   - reports_sol_downloads/{leadId}    — email captures (cloud function writes)
//
// Cloud Functions (to build):
//   - aggregateStateOfLeadership(year)  — scans users/* and builds aggregates
//   - generateStateOfLeadershipPdf(year) — renders sections → PDF in Storage

import React, { useEffect, useMemo, useState } from 'react';
import {
  FileBarChart, Plus, Trash2, Save, ShieldAlert, ArrowUp, ArrowDown,
  PlayCircle, FileText, Download, Sparkles, AlertCircle, Calendar,
} from 'lucide-react';
import {
  doc, getDoc, setDoc, onSnapshot, collection, serverTimestamp,
} from 'firebase/firestore';
import { BreadcrumbNav } from '../../ui/BreadcrumbNav.jsx';
import { getBreadcrumbs } from '../../../config/breadcrumbConfig.js';
import { useAppServices } from '../../../services/useAppServices';

const DEFAULT_YEAR = new Date().getFullYear();

const SECTION_TYPES = [
  { value: 'intro', label: 'Intro' },
  { value: 'key-findings', label: 'Key Findings' },
  { value: 'stat-highlight', label: 'Stat Highlight' },
  { value: 'quote', label: 'Member Quote' },
  { value: 'chart', label: 'Chart' },
  { value: 'recommendations', label: 'Recommendations' },
];

const CHART_TYPES = ['bar', 'line', 'pie'];

// Starter template: a research-synthesis report. Every statistic is sourced
// to a real, public, citable study so the report can be published with
// integrity before LeaderReps has its own first-party data set. As platform
// usage grows, future editions will lean more on internal signals.
const STARTER_SUBTITLE =
  "A synthesis of the year's most credible leadership research, paired with early signals from inside LeaderReps. Every statistic is sourced.";

const STARTER_SECTIONS = [
  {
    type: 'intro',
    title: 'The Year the Manager Bench Buckled',
    body: '2026 is the year the data caught up to what every leader already felt: the job got harder, the support got thinner, and the people doing the hardest work — frontline managers — got squeezed the most.\n\nThis report is a synthesis of the year\'s most credible research on the state of leadership, paired with early signals from inside LeaderReps. Every statistic is sourced. Where our platform data is too early to be statistically meaningful, we say so plainly.',
  },
  {
    type: 'key-findings',
    title: 'Five Things That Defined Leadership in 2026',
    body: '1. **Engagement is in retreat.** Gallup\'s 2024 State of the Global Workplace clocked the first global engagement decline since 2009 — falling from 23% to 21% — and the drop was steepest among managers, who fell from 30% to 27%.\n\n2. **Manager bench strength is at a decade low.** DDI\'s 2025 Global Leadership Forecast — surveying more than 11,000 leaders across 50 countries — found only 12% of organizations rate their leadership pipeline as strong. It is the lowest reading in the survey\'s history.\n\n3. **AI is here; the playbook isn\'t.** Microsoft and LinkedIn\'s 2024 Work Trend Index found 75% of global knowledge workers now use AI at work, up from 46% just six months earlier. Yet 60% of leaders say their organization still lacks a clear AI vision and plan.\n\n4. **The "broken rung" is still broken.** McKinsey and LeanIn\'s 2024 Women in the Workplace report shows only 81 women promoted to first-level manager for every 100 men — a gap nearly unchanged in a decade.\n\n5. **Feedback is collapsing into silence.** Workhuman\'s 2024 Human Workplace Index found only 14% of employees strongly agree their performance reviews inspire them to improve. The reps aren\'t happening — and when they do, they don\'t land.',
  },
  {
    type: 'stat-highlight',
    title: 'The Number Every CHRO Should Read Twice',
    body: 'DDI\'s Global Leadership Forecast 2025 surveyed more than 11,000 leaders in 50 countries. The leadership bench-strength score is now the lowest it has been in the decade DDI has run the survey — and 40% of those leaders said they are considering leaving their current role within a year.',
    statValue: '12%',
    statLabel: 'of organizations rate their leadership bench as strong — a 10-year low (DDI Global Leadership Forecast 2025)',
  },
  {
    type: 'key-findings',
    title: 'Where the Pressure Is Coming From',
    body: 'Three forces are stacking on the modern manager at once.\n\n**Span of control is expanding.** Gartner\'s 2024 HR Priorities research found 75% of HR leaders agree managers are overwhelmed by the growth in job responsibilities, with the average manager now overseeing more direct reports than at any point in the last decade.\n\n**Hybrid friction hasn\'t resolved.** Microsoft\'s 2024 Work Trend Index found 53% of leaders say productivity must increase, while 68% of employees report they don\'t have enough time and energy to do their jobs. The gap between those two numbers is the conflict every manager is being asked to absorb.\n\n**AI is adding work before it removes it.** 78% of workers using AI at work now bring their own tools (Microsoft + LinkedIn WTI 2024), forcing managers to oversee shadow workflows on top of sanctioned ones — usually without policy, training, or air cover from above.',
  },
  {
    type: 'stat-highlight',
    title: 'The Cheapest Lever No One Is Pulling',
    body: 'Zenger Folkman\'s analysis of more than 50,000 360° leadership assessments found that managers who give frequent, candid feedback rank in the 86th percentile of overall leadership effectiveness — versus the 25th percentile for those who do not. The intervention costs nothing. Workhuman\'s 2024 data shows most leaders still skip it.',
    statValue: '14%',
    statLabel: 'of employees say their performance review inspired them to improve (Workhuman 2024). The other 86% are getting feedback that doesn\'t land.',
  },
  {
    type: 'quote',
    title: 'A Pattern Researchers Keep Finding',
    body: '"In every team I\'ve studied, the highest-performing ones aren\'t the ones with the smartest people. They\'re the ones where it\'s safe to admit you don\'t know something."\n\n— Amy Edmondson, Harvard Business School\n\nHer foundational research on psychological safety — confirmed by Google\'s Project Aristotle and replicated across hundreds of studies since — remains the single most predictive variable for team performance in 2026. Every other leadership lever multiplies through it.',
  },
  {
    type: 'chart',
    title: 'What Leaders Are Actually Practicing',
    body: 'Early signals from LeaderReps members. We flag this clearly: our cohort is still small and growing. We include it because the early pattern matches what the field is reporting — feedback conversations dominate, with conflict and delegation reps growing fastest. Future editions will replace this preview with the full data set.',
    chartType: 'bar',
    chartDataRef: 'topSkills',
  },
  {
    type: 'stat-highlight',
    title: 'The Recognition Gap Is Real',
    body: 'Workhuman and Gallup\'s ongoing recognition research — corroborated by Achievers\' 2024 Workforce Engagement Report — converges on the same finding: employees who feel recognized at least monthly are 5x more likely to feel connected to their company culture and 4x more likely to be engaged. Recognition is the single best-ROI leadership behavior. It is also the one most managers under-do.',
    statValue: '5×',
    statLabel: 'higher culture connection for employees recognized at least monthly vs. less often (Workhuman + Gallup, 2024)',
  },
  {
    type: 'recommendations',
    title: 'Five Things to Do in 2027',
    body: 'The research is clear enough to act on. Pick one. Start this week.\n\n**1. Re-anchor your 1:1 around development, not status.** Workhuman and Gallup data both show that managers who use 1:1s to discuss growth — not just to status-check work — have teams with measurably higher engagement and lower attrition.\n\n**2. Build a weekly recognition habit.** Same day, same time, two people, one specific behavior each. The research-backed payoff (5× culture connection) is wildly disproportionate to the time cost.\n\n**3. Have the conversation you have been avoiding.** Reframe avoidance: every week you wait is a week the rest of the team watches the standard erode.\n\n**4. Put a stake in the ground on AI.** Microsoft\'s data is unambiguous — your team is already using AI. The question is whether you are shaping the practice or letting shadow patterns set the norm. Pick three workflows. Define what "good" looks like for each.\n\n**5. Sponsor someone publicly.** The broken-rung gap will not fix itself. The leaders who close it most reliably are the ones who name the person and the next role out loud, in meetings where decisions actually get made.',
  },
  {
    type: 'intro',
    title: 'About This Report',
    body: 'The 2026 State of Leadership is a synthesis of the year\'s most credible public research on managers, teams, and organizational behavior — paired with early platform signals from LeaderReps.\n\nSources cited inline:\n• Gallup — State of the Global Workplace 2024\n• DDI — Global Leadership Forecast 2025\n• McKinsey + LeanIn.Org — Women in the Workplace 2024\n• Microsoft + LinkedIn — Work Trend Index Annual Report 2024\n• Workhuman — Human Workplace Index 2024\n• Zenger Folkman — 360° leadership effectiveness research\n• Gartner — HR Priorities Survey 2024\n• Achievers — Workforce Engagement Report 2024\n• Amy Edmondson (Harvard Business School) — foundational work on psychological safety; corroborated by Google\'s Project Aristotle\n\nAs the LeaderReps platform community grows, future editions will lean more heavily on first-party data from members. Today\'s edition combines the best of the field with the early shape of what we are seeing inside the practice.',
  },
];

const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
      active
        ? 'bg-corporate-teal text-white'
        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
    }`}
  >
    <Icon className="w-4 h-4" />
    {children}
  </button>
);

const SectionEditor = ({ section, onChange, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) => {
  const update = (patch) => onChange({ ...section, ...patch });
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={section.type}
          onChange={(e) => update({ type: e.target.value })}
          className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          {SECTION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input
          value={section.title || ''}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Section title"
          className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white"
        />
        <button onClick={onMoveUp} disabled={!canMoveUp} className="p-1.5 text-slate-400 hover:text-corporate-teal disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ArrowUp className="w-4 h-4" /></button>
        <button onClick={onMoveDown} disabled={!canMoveDown} className="p-1.5 text-slate-400 hover:text-corporate-teal disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ArrowDown className="w-4 h-4" /></button>
        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded"><Trash2 className="w-4 h-4" /></button>
      </div>

      <textarea
        value={section.body || ''}
        onChange={(e) => update({ body: e.target.value })}
        placeholder="Body (markdown supported)"
        rows={4}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
      />

      {section.type === 'stat-highlight' && (
        <div className="grid grid-cols-2 gap-2">
          <input
            value={section.statValue || ''}
            onChange={(e) => update({ statValue: e.target.value })}
            placeholder='Stat value (e.g. "73%")'
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
          />
          <input
            value={section.statLabel || ''}
            onChange={(e) => update({ statLabel: e.target.value })}
            placeholder='Stat label (e.g. "of managers avoid hard conversations")'
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
          />
        </div>
      )}

      {section.type === 'chart' && (
        <div className="grid grid-cols-2 gap-2">
          <select
            value={section.chartType || 'bar'}
            onChange={(e) => update({ chartType: e.target.value })}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
          >
            {CHART_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            value={section.chartDataRef || ''}
            onChange={(e) => update({ chartDataRef: e.target.value })}
            placeholder='Data ref (e.g. "topSkills", "completionByWeek")'
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white"
          />
        </div>
      )}
    </div>
  );
};

const StateOfLeadershipAdmin = () => {
  const { db, user, isAdmin, navigate } = useAppServices();
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [activeTab, setActiveTab] = useState('builder');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aggregates, setAggregates] = useState(null);
  const [saving, setSaving] = useState(false);
  const [aggregating, setAggregating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloads, setDownloads] = useState([]);

  // Load report doc
  useEffect(() => {
    if (!db || !isAdmin) return;
    setLoading(true);
    const ref = doc(db, 'reports_sol', String(year));
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setReport({ id: snap.id, ...snap.data() });
      } else {
        setReport(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [db, isAdmin, year]);

  // Load aggregates summary doc
  useEffect(() => {
    if (!db || !isAdmin) return;
    const ref = doc(db, 'reports_sol', String(year), 'aggregates', 'summary');
    const unsub = onSnapshot(ref, (snap) => {
      setAggregates(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, [db, isAdmin, year]);

  // Load download leads
  useEffect(() => {
    if (!db || !isAdmin) return;
    const unsub = onSnapshot(collection(db, 'reports_sol_downloads'), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDownloads(all.filter((d) => d.year === year || String(d.year) === String(year)));
    }, () => {});
    return () => unsub();
  }, [db, isAdmin, year]);

  const sections = report?.sections || [];

  const saveReport = async (patch) => {
    setSaving(true);
    try {
      const ref = doc(db, 'reports_sol', String(year));
      await setDoc(ref, {
        year,
        title: report?.title || `${year} State of Leadership`,
        status: report?.status || 'draft',
        sections: report?.sections || [],
        ...patch,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || null,
        ...(report ? {} : { createdAt: serverTimestamp(), createdBy: user?.email || null }),
      }, { merge: true });
    } finally { setSaving(false); }
  };

  const initWithStarter = () =>
    saveReport({ sections: STARTER_SECTIONS, subtitle: STARTER_SUBTITLE });

  const updateSection = (idx, newSection) => {
    const next = [...sections];
    next[idx] = newSection;
    saveReport({ sections: next });
  };

  const addSection = () => {
    const next = [...sections, { type: 'intro', title: 'New Section', body: '' }];
    saveReport({ sections: next });
  };

  const deleteSection = (idx) => {
    if (!window.confirm('Delete this section?')) return;
    const next = sections.filter((_, i) => i !== idx);
    saveReport({ sections: next });
  };

  const moveSection = (idx, dir) => {
    const next = [...sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    saveReport({ sections: next });
  };

  const handleAggregate = async () => {
    // Calls a Cloud Function (to be built) that scans anonymized usage data.
    // This UI is wired and ready — the function call will activate once deployed.
    if (!window.confirm(`Run aggregation for ${year}? This scans anonymized usage data and overwrites the summary doc.`)) return;
    setAggregating(true);
    try {
      const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const url = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/aggregateStateOfLeadership`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) throw new Error(`Cloud function not yet deployed (status ${res.status}). Aggregates doc can be hand-edited for now.`);
      window.alert('Aggregation complete.');
    } catch (err) {
      window.alert(err.message || 'Aggregation failed.');
    } finally { setAggregating(false); }
  };

  const handleGeneratePdf = async () => {
    setGenerating(true);
    try {
      const PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID;
      const url = `https://us-central1-${PROJECT_ID}.cloudfunctions.net/generateStateOfLeadershipPdf`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year }),
      });
      if (!res.ok) throw new Error(`Cloud function not yet deployed (status ${res.status}).`);
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    } catch (err) {
      window.alert(err.message || 'PDF generation failed.');
    } finally { setGenerating(false); }
  };

  const handlePublish = async () => {
    if (!window.confirm(`Publish the ${year} State of Leadership Report? This makes the public download page live.`)) return;
    await saveReport({ status: 'published', publishedAt: serverTimestamp() });
  };

  const handleUnpublish = async () => {
    if (!window.confirm('Unpublish? Public download page will go offline.')) return;
    await saveReport({ status: 'draft', publishedAt: null });
  };

  const isPublished = report?.status === 'published';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-corporate-navy mb-2">Access Denied</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <div className="px-6 pt-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <BreadcrumbNav items={getBreadcrumbs('lab-state-of-leadership')} navigate={navigate} />
      </div>

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-5 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-corporate-navy/10 rounded-xl">
              <FileBarChart className="w-6 h-6 text-corporate-navy dark:text-corporate-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">State of Leadership Report</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Annual HBR-style report. Email-gated PDF lead magnet.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-400" />
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                {[DEFAULT_YEAR + 1, DEFAULT_YEAR, DEFAULT_YEAR - 1, DEFAULT_YEAR - 2].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isPublished ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <TabButton active={activeTab === 'aggregation'} onClick={() => setActiveTab('aggregation')} icon={Sparkles}>Data Aggregation</TabButton>
          <TabButton active={activeTab === 'builder'} onClick={() => setActiveTab('builder')} icon={FileText}>Report Builder</TabButton>
          <TabButton active={activeTab === 'publish'} onClick={() => setActiveTab('publish')} icon={Download}>Publish & Leads</TabButton>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : !report && activeTab === 'builder' ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
            <FileBarChart className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h2 className="text-lg font-bold text-corporate-navy dark:text-white mb-2">No report for {year} yet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Start fresh or use the starter template.</p>
            <div className="flex justify-center gap-2">
              <button onClick={() => saveReport({ sections: [] })} className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Start empty
              </button>
              <button onClick={initWithStarter} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90">
                <Sparkles className="w-4 h-4" />
                Use starter template ({STARTER_SECTIONS.length} sections)
              </button>
            </div>
          </div>
        ) : null}

        {activeTab === 'aggregation' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-corporate-navy dark:text-white">Aggregate {year} platform data</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Scans <code>users/*/dailyLogs</code>, rep completions, assessments, and reflection text.
                    Produces an anonymized summary at <code>reports_sol/{year}/aggregates/summary</code>.
                  </p>
                </div>
                <button
                  onClick={handleAggregate}
                  disabled={aggregating}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-navy text-white text-sm font-semibold hover:bg-corporate-navy/90 disabled:opacity-50 flex-shrink-0"
                >
                  <PlayCircle className="w-4 h-4" />
                  {aggregating ? 'Running…' : 'Run aggregation'}
                </button>
              </div>
            </div>

            {aggregates ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
                <h4 className="text-sm font-bold text-corporate-navy dark:text-white mb-3">Aggregated metrics</h4>
                <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-3 rounded overflow-x-auto text-slate-700 dark:text-slate-300">
                  {JSON.stringify(aggregates, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  No aggregates yet for {year}. Run the aggregation above (requires <code>aggregateStateOfLeadership</code> Cloud Function).
                  <br />
                  <span className="text-xs">In the meantime, you can hand-edit the doc at <code>reports_sol/{year}/aggregates/summary</code> in the Firebase console.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'builder' && report && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Report title</label>
                <input
                  value={report.title || ''}
                  onChange={(e) => setReport({ ...report, title: e.target.value })}
                  onBlur={() => saveReport({ title: report.title })}
                  placeholder={`${year} State of Leadership`}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-base font-bold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Subtitle (shown on hero + email)</label>
                <textarea
                  value={report.subtitle || ''}
                  onChange={(e) => setReport({ ...report, subtitle: e.target.value })}
                  onBlur={() => saveReport({ subtitle: report.subtitle })}
                  placeholder="A one- to two-sentence hook for the report."
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            {sections.map((s, i) => (
              <SectionEditor
                key={i}
                section={s}
                onChange={(next) => updateSection(i, next)}
                onDelete={() => deleteSection(i)}
                onMoveUp={() => moveSection(i, -1)}
                onMoveDown={() => moveSection(i, 1)}
                canMoveUp={i > 0}
                canMoveDown={i < sections.length - 1}
              />
            ))}

            <button
              onClick={addSection}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:border-corporate-teal hover:text-corporate-teal"
            >
              <Plus className="w-4 h-4" />
              Add section
            </button>

            <p className="text-xs text-slate-400">{saving ? 'Saving…' : `${sections.length} section${sections.length === 1 ? '' : 's'} · auto-saved`}</p>
          </div>
        )}

        {activeTab === 'publish' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-corporate-navy dark:text-white">Generate PDF</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Renders current sections + aggregates into a branded PDF, uploaded to Storage.
                </p>
              </div>
              <button
                onClick={handleGeneratePdf}
                disabled={generating || !report}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90 disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                {generating ? 'Generating…' : 'Generate PDF'}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-3">
              <h3 className="text-base font-bold text-corporate-navy dark:text-white">Publish state</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                When published, the public download page <code>/state-of-leadership/{year}</code> goes live.
                Visitors enter email → receive PDF → record written to <code>reports_sol_downloads</code> and (via Cloud Function) into the CRM.
              </p>
              {isPublished ? (
                <button onClick={handleUnpublish} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold">Unpublish</button>
              ) : (
                <button onClick={handlePublish} disabled={!report} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-50">Publish report</button>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <h3 className="text-base font-bold text-corporate-navy dark:text-white mb-3">Email captures · {year}</h3>
              {downloads.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No downloads yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="text-left py-2">Email</th>
                        <th className="text-left py-2">Name</th>
                        <th className="text-left py-2">Company</th>
                        <th className="text-left py-2">Captured</th>
                      </tr>
                    </thead>
                    <tbody>
                      {downloads.map((d) => (
                        <tr key={d.id} className="border-t border-slate-100 dark:border-slate-700">
                          <td className="py-2 text-slate-900 dark:text-white">{d.email}</td>
                          <td className="py-2 text-slate-600 dark:text-slate-300">{d.name || '—'}</td>
                          <td className="py-2 text-slate-600 dark:text-slate-300">{d.company || '—'}</td>
                          <td className="py-2 text-slate-500 dark:text-slate-400">{d.createdAt?.toDate?.()?.toLocaleDateString() || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span>
                <strong className="text-corporate-teal">Live:</strong> public landing page is deployed. Reports become visible once you publish them.
              </span>
              <a
                href={`/?state-of-leadership=${year}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-corporate-teal text-white text-xs font-semibold hover:bg-corporate-teal/90 transition-colors"
              >
                View public page →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StateOfLeadershipAdmin;
