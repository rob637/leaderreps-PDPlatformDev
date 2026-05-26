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

const STARTER_SECTIONS = [
  { type: 'intro', title: 'Welcome', body: 'A look inside how thousands of leaders developed their craft this year.' },
  { type: 'key-findings', title: 'Top 5 Findings', body: '1.\n2.\n3.\n4.\n5.' },
  { type: 'stat-highlight', title: 'The Number That Surprised Us', body: '', statValue: '', statLabel: '' },
  { type: 'chart', title: 'Most-Practiced Skills', body: 'Top 10 reps completed across the platform.', chartType: 'bar', chartDataRef: 'topSkills' },
  { type: 'quote', title: 'In Their Words', body: '“The 1:1 framework changed how I run my team.” — VP Engineering, SaaS company' },
  { type: 'recommendations', title: 'What Leaders Should Do Next', body: '' },
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

  const initWithStarter = () => saveReport({ sections: STARTER_SECTIONS });

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
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Report title</label>
              <input
                value={report.title || ''}
                onChange={(e) => setReport({ ...report, title: e.target.value })}
                onBlur={() => saveReport({ title: report.title })}
                placeholder={`${year} State of Leadership`}
                className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-base font-bold text-slate-900 dark:text-white"
              />
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
