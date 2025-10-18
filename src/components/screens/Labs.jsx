/* eslint-disable no-console */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  Target,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Save,
  RefreshCcw,
  Download,
  Upload,
  Filter,
  Search,
  PlusCircle,
  Copy,
  Trash2,
} from 'lucide-react';

/**
 * Labs Screen — Full Feature Restore
 *
 * Props (all optional; safe fallbacks provided):
 * - LEADERSHIP_TIERS: Array<{ id:number|string, title:string, description?:string }>
 * - allBooks: { [tierIdOrName: string]: Array<{ id:string|number, title:string, author?:string }> }
 * - leadershipCommitmentBank: Array|Object  // activities/tasks bank
 * - DEFAULT_PLANNING_DATA: Object           // any defaults you keep for plans
 * - COMMITMENT_COLLECTION: Array            // commitments already selected
 */
export default function Labs(props) {
  const {
    LEADERSHIP_TIERS = [],
    allBooks = {},
    leadershipCommitmentBank = [],
    DEFAULT_PLANNING_DATA = {},
    COMMITMENT_COLLECTION = [],
  } = props;

  // ----------------------------------
  // Firebase (optional, auto-detected)
  // ----------------------------------
  const [fb, setFb] = useState({ db: null, auth: null, fs: null });
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Adjust path if you placed firebase.js elsewhere
        const mod = await import('../../lib/firebase.js'); // { db, auth }
        const fs = await import('firebase/firestore'); // serverTimestamp, doc, setDoc, getDoc, etc.
        if (mounted) setFb({ db: mod.db, auth: mod.auth, fs });
      } catch {
        if (mounted) setFb({ db: null, auth: null, fs: null }); // run without persistence
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ----------------------------------
  // Controls & Filters
  // ----------------------------------
  const [proficiency, setProficiency] = useState('medium'); // 'low' | 'medium' | 'high'
  const [tierFilter, setTierFilter] = useState('all'); // 'all' or tier title/key
  const [q, setQ] = useState('');

  const density = useMemo(() => {
    switch (proficiency) {
      case 'low': return 5;      // more help
      case 'high': return 2;     // lighter plan
      default: return 3;         // medium
    }
  }, [proficiency]);

  // ----------------------------------
  // Normalize activities bank
  // ----------------------------------
  const bankItems = useMemo(() => {
    const raw = Array.isArray(leadershipCommitmentBank)
      ? leadershipCommitmentBank
      : Object.values(leadershipCommitmentBank || {}).flat();

    const fallbackIfEmpty = [
      { id: 'sa_1', title: 'Strengths inventory', tier: 'Self-Awareness & Management', effort: 2, description: 'List top 5 strengths; align with role goals.' },
      { id: 'pc_1', title: '1:1 coaching cadence', tier: 'People & Coaching', effort: 3, description: 'Set biweekly 1:1s with direct reports and a shared agenda doc.' },
      { id: 'ea_1', title: 'Delegation map', tier: 'Execution & Accountability', effort: 3, description: 'Define tasks to delegate using RACI.' },
      { id: 'sa_2', title: 'Energy audit', tier: 'Self-Awareness & Management', effort: 1, description: 'Track energy peaks; schedule deep work accordingly.' },
      { id: 'pc_2', title: 'Feedback framework', tier: 'People & Coaching', effort: 2, description: 'Practice SBI model in next 3 feedback conversations.' },
      { id: 'ea_2', title: 'OKR refresh', tier: 'Execution & Accountability', effort: 4, description: 'Draft quarterly OKRs with measurable KRs.' },
    ];

    const arr = (raw && raw.length ? raw : fallbackIfEmpty).map((x, i) => ({
      id: x.id ?? `act_${i}`,
      title: x.title ?? x.name ?? 'Untitled activity',
      tier: x.tier ?? x.category ?? 'General',
      effort: clamp1to5(x.effort), // 1–5
      description: x.description ?? '',
    }));

    // Optional tier remap if tiers are provided as IDs
    const tierTitleByKey = new Map();
    LEADERSHIP_TIERS.forEach(t => {
      const key = t.id ?? t.title;
      tierTitleByKey.set(key, t.title ?? String(t.id));
    });
    return arr.map(a => ({
      ...a,
      tier: tierTitleByKey.get(a.tier) || a.tier,
    }));
  }, [leadershipCommitmentBank, LEADERSHIP_TIERS]);

  // ----------------------------------
  // Months & initial plan
  // ----------------------------------
  const months = useMemo(() => {
    const d = new Date();
    const list = [];
    for (let i = 0; i < 6; i += 1) {
      const m = new Date(d.getFullYear(), d.getMonth() + i, 1);
      list.push(m.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
    }
    return list;
  }, []);

  const [plan, setPlan] = useState(() => generatePlan(bankItems, months, density, proficiency));
  const [completed, setCompleted] = useState(() => new Set());
  const planIdRef = useRef(() => makeId());

  // Rebuild when key inputs change
  useEffect(() => {
    setPlan(generatePlan(bankItems, months, density, proficiency));
    setCompleted(new Set());
  }, [bankItems, months, density, proficiency]);

  // ----------------------------------
  // Derived: filtered + search
  // ----------------------------------
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const byMonth = plan.map(({ month, activities }) => {
      const filt = activities.filter(a => {
        if (tierFilter !== 'all' && a.tier !== tierFilter) return false;
        if (!ql) return true;
        return (
          a.title.toLowerCase().includes(ql) ||
          a.description.toLowerCase().includes(ql)
        );
      });
      return { month, activities: filt };
    });
    return byMonth;
  }, [plan, tierFilter, q]);

  const totalBooks = useMemo(
    () => Object.values(allBooks || {}).reduce((n, arr) => n + (arr?.length || 0), 0),
    [allBooks]
  );

  // Monthly effort totals
  const effortByMonth = useMemo(() => plan.map(m => m.activities.reduce((s, a) => s + (a.effort || 0), 0)), [plan]);

  // ----------------------------------
  // Persistence: localStorage (always), Firestore (optional)
  // ----------------------------------
  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('labs_plan_latest');
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data.months && Array.isArray(data.months)) {
          setPlan(data.months);
          setCompleted(new Set(data.completed || []));
          if (data.proficiency) setProficiency(data.proficiency);
          if (data.planId) planIdRef.current = data.planId;
        }
      }
    } catch {}
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      const data = {
        planId: getPlanId(planIdRef),
        proficiency,
        months: plan,
        completed: [...completed],
        generatedAt: new Date().toISOString(),
      };
      localStorage.setItem('labs_plan_latest', JSON.stringify(data));
    } catch {}
  }, [plan, completed, proficiency]);

  // Attempt to load from Firestore once available (if user signed in)
  useEffect(() => {
    (async () => {
      if (!fb.db || !fb.fs) return;
      try {
        const { doc, getDoc } = fb.fs;
        const uid = fb.auth?.currentUser?.uid || 'anonymous';
        const ref = doc(fb.db, 'userPlans', uid, 'plans', getPlanId(planIdRef));
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          if (data?.months) setPlan(data.months);
          if (data?.completed) setCompleted(new Set(data.completed));
          if (data?.proficiency) setProficiency(data.proficiency);
        }
      } catch (e) {
        console.warn('Firestore load skipped:', e);
      }
    })();
    // one-time effect when fb ready
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fb.db]);

  // ----------------------------------
  // Actions
  // ----------------------------------
  const toggleComplete = (id) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const moveActivityMonth = (fromMonthIdx, actId, dir) => {
    setPlan(prev => {
      const next = clone(prev);
      const src = next[fromMonthIdx];
      const idx = src.activities.findIndex(a => a.id === actId);
      if (idx < 0) return prev;
      const [item] = src.activities.splice(idx, 1);
      const toIdx = clamp(fromMonthIdx + (dir === 'left' ? -1 : 1), 0, next.length - 1);
      next[toIdx].activities.push(item);
      return next;
    });
  };

  const moveActivityIndex = (monthIdx, actId, dir) => {
    setPlan(prev => {
      const next = clone(prev);
      const list = next[monthIdx].activities;
      const idx = list.findIndex(a => a.id === actId);
      if (idx < 0) return prev;
      const swapWith = dir === 'up' ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= list.length) return prev;
      [list[idx], list[swapWith]] = [list[swapWith], list[idx]];
      return next;
    });
  };

  const duplicateActivity = (monthIdx, actId) => {
    setPlan(prev => {
      const next = clone(prev);
      const list = next[monthIdx].activities;
      const idx = list.findIndex(a => a.id === actId);
      if (idx < 0) return prev;
      const copy = { ...list[idx], id: makeId() };
      list.splice(idx + 1, 0, copy);
      return next;
    });
  };

  const deleteActivity = (monthIdx, actId) => {
    setPlan(prev => {
      const next = clone(prev);
      const list = next[monthIdx].activities;
      const idx = list.findIndex(a => a.id === actId);
      if (idx < 0) return prev;
      list.splice(idx, 1);
      return next;
    });
    setCompleted(prev => {
      const next = new Set(prev);
      next.delete(actId);
      return next;
    });
  };

  const resetPlan = () => {
    setPlan(generatePlan(bankItems, months, density, proficiency));
    setCompleted(new Set());
    planIdRef.current = makeId();
  };

  const exportJson = () => {
    const data = {
      planId: getPlanId(planIdRef),
      proficiency,
      months: plan,
      completed: [...completed],
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `labs_plan_${getPlanId(planIdRef)}.json`;
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  };

  const importRef = useRef(null);
  const importJson = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (data?.months) setPlan(data.months);
        if (data?.completed) setCompleted(new Set(data.completed));
        if (data?.proficiency) setProficiency(String(data.proficiency));
        if (data?.planId) planIdRef.current = data.planId;
      } catch (e) {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const savePlan = async () => {
    if (!fb.db || !fb.fs) {
      alert('Plan saved locally (no Firebase configured). Add src/lib/firebase.js and .env to enable cloud saves.');
      return;
    }
    try {
      const { serverTimestamp, doc, setDoc } = fb.fs;
      const uid = fb.auth?.currentUser?.uid || 'anonymous';
      const ref = doc(fb.db, 'userPlans', uid, 'plans', getPlanId(planIdRef));
      await setDoc(ref, {
        proficiency,
        months: plan,
        completed: [...completed],
        updatedAt: serverTimestamp(),
        meta: {
          tiers: LEADERSHIP_TIERS.map(t => t.title ?? t.id),
          booksCount: totalBooks,
          commitmentsCount: (COMMITMENT_COLLECTION?.length || 0)
        }
      }, { merge: true });
      alert('Plan saved to Firestore.');
    } catch (e) {
      console.error(e);
      alert('Could not save to Firestore. Check Firebase env/config and security rules.');
    }
  };

  // Add custom activity
  const [newAct, setNewAct] = useState({ title: '', tier: 'General', effort: 2, description: '', monthIdx: 0 });
  const addCustomActivity = () => {
    const title = newAct.title.trim();
    if (!title) return alert('Please enter a title.');
    const act = {
      id: makeId(),
      title,
      tier: newAct.tier || 'General',
      effort: clamp1to5(Number(newAct.effort)),
      description: newAct.description?.trim() || '',
    };
    setPlan(prev => {
      const next = clone(prev);
      const idx = clamp(Number(newAct.monthIdx) || 0, 0, next.length - 1);
      next[idx].activities.push(act);
      return next;
    });
    setNewAct({ title: '', tier: 'General', effort: 2, description: '', monthIdx: newAct.monthIdx });
  };

  // ----------------------------------
  // UI
  // ----------------------------------
  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <h1 className="text-2xl font-bold">Labs</h1>

        <div className="flex flex-wrap items-center gap-3">
          {/* Proficiency */}
          <div className="flex items-center gap-2">
            <label htmlFor="prof" className="text-sm">Proficiency</label>
            <select
              id="prof"
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="low">Low (more guidance)</option>
              <option value="medium">Medium</option>
              <option value="high">High (lighter plan)</option>
            </select>
          </div>

          {/* Tier filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="border rounded-md px-2 py-1 text-sm"
              title="Filter by tier"
            >
              <option value="all">All tiers</option>
              {Array.from(new Set([
                ...LEADERSHIP_TIERS.map(t => t.title ?? t.id),
                ...bankItems.map(b => b.tier),
              ])).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <label className="relative">
            <Search className="w-4 h-4 absolute left-2 top-2.5 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search activities…"
              className="border rounded-md pl-8 pr-2 py-1 text-sm"
            />
          </label>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={savePlan} className="inline-flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm hover:bg-gray-50" type="button">
              <Save className="w-4 h-4" /> Save
            </button>
            <button onClick={exportJson} className="inline-flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm hover:bg-gray-50" type="button">
              <Download className="w-4 h-4" /> Export
            </button>
            <button onClick={() => importRef.current?.click()} className="inline-flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm hover:bg-gray-50" type="button">
              <Upload className="w-4 h-4" /> Import
            </button>
            <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} />
            <button onClick={resetPlan} className="inline-flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm hover:bg-gray-50" type="button">
              <RefreshCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Kpi icon={TrendingUp} label="Tiers" value={LEADERSHIP_TIERS.length || new Set(bankItems.map(b => b.tier)).size} hint="Leadership framework levels" />
        <Kpi icon={CheckCircle} label="Commitments" value={COMMITMENT_COLLECTION.length || bankItems.length} hint="Available or selected" />
        <Kpi icon={BookOpen} label="Books" value={totalBooks} hint="Reading bank" />
        <Kpi icon={Target} label="Total Effort" value={effortByMonth.reduce((s, n) => s + n, 0)} hint="Sum of effort across plan" />
      </section>

      {/* Add custom activity */}
      <section className="border rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><PlusCircle className="w-5 h-5" /> Add Custom Activity</h2>
        <div className="grid md:grid-cols-5 gap-2">
          <input value={newAct.title} onChange={(e) => setNewAct(a => ({ ...a, title: e.target.value }))} placeholder="Title" className="border rounded-md px-2 py-1 text-sm md:col-span-2" />
          <input value={newAct.tier} onChange={(e) => setNewAct(a => ({ ...a, tier: e.target.value }))} placeholder="Tier (e.g., People & Coaching)" className="border rounded-md px-2 py-1 text-sm" />
          <input type="number" min={1} max={5} value={newAct.effort} onChange={(e) => setNewAct(a => ({ ...a, effort: e.target.value }))} placeholder="Effort 1–5" className="border rounded-md px-2 py-1 text-sm w-24" />
          <select value={newAct.monthIdx} onChange={(e) => setNewAct(a => ({ ...a, monthIdx: e.target.value }))} className="border rounded-md px-2 py-1 text-sm">
            {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
        </div>
        <textarea value={newAct.description} onChange={(e) => setNewAct(a => ({ ...a, description: e.target.value }))} placeholder="Description (optional)" className="border rounded-md px-2 py-2 text-sm w-full min-h-[72px]" />
        <div>
          <button onClick={addCustomActivity} className="inline-flex items-center gap-2 border rounded-md px-3 py-1.5 text-sm hover:bg-gray-50" type="button">
            <PlusCircle className="w-4 h-4" /> Add Activity
          </button>
        </div>
      </section>

      {/* Monthly Plan */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Target className="w-5 h-5" /> 6-Month Action Plan</h2>
        <div className="grid lg:grid-cols-3 gap-4">
          {filtered.map(({ month, activities }, monthIdx) => (
            <div key={month} className="border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{month}</div>
                <div className="text-xs text-gray-600">Effort: {effortByMonth[monthIdx] || 0}</div>
              </div>
              {activities.length ? (
                <ul className="space-y-2">
                  {activities.map((a, i) => (
                    <li key={a.id} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2">
                          <input type="checkbox" checked={completed.has(a.id)} onChange={() => toggleComplete(a.id)} className="mt-1" />
                          <div>
                            <div className={`font-medium ${completed.has(a.id) ? 'line-through text-gray-500' : ''}`}>{a.title}</div>
                            <div className="text-xs text-gray-600">Tier: {a.tier} • Effort: {a.effort}/5</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconButton title="Move up" onClick={() => moveActivityIndex(monthIdx, a.id, 'up')} disabled={i === 0}>
                            <ArrowUp className="w-4 h-4" />
                          </IconButton>
                          <IconButton title="Move down" onClick={() => moveActivityIndex(monthIdx, a.id, 'down')} disabled={i === activities.length - 1}>
                            <ArrowDown className="w-4 h-4" />
                          </IconButton>
                          <IconButton title="Move left" onClick={() => moveActivityMonth(monthIdx, a.id, 'left')} disabled={monthIdx === 0}>
                            <ArrowLeft className="w-4 h-4" />
                          </IconButton>
                          <IconButton title="Move right" onClick={() => moveActivityMonth(monthIdx, a.id, 'right')} disabled={monthIdx === months.length - 1}>
                            <ArrowRight className="w-4 h-4" />
                          </IconButton>
                          <IconButton title="Duplicate" onClick={() => duplicateActivity(monthIdx, a.id)}>
                            <Copy className="w-4 h-4" />
                          </IconButton>
                          <IconButton title="Delete" onClick={() => deleteActivity(monthIdx, a.id)}>
                            <Trash2 className="w-4 h-4" />
                          </IconButton>
                        </div>
                      </div>
                      {a.description && (
                        <p className="text-sm text-gray-700 mt-2">{a.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">No activities match filters.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Books by Tier */}
      {Object.keys(allBooks).length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="w-5 h-5" /> Suggested Reading</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(allBooks).map(([key, books]) => (
              <div key={key} className="border rounded-xl p-4">
                <div className="font-semibold mb-2">{key}</div>
                <ul className="space-y-1">
                  {(books || []).map((b, i) => (
                    <li key={b.id ?? `${key}_${i}`} className="text-sm">
                      <span className="font-medium">{b.title}</span>
                      {b.author ? <span className="text-gray-600"> — {b.author}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ---------------------------------
// Helpers & tiny components
// ---------------------------------
function Kpi({ icon: Icon, label, value, hint }) {
  return (
    <div className="border rounded-xl p-4 flex items-center gap-3">
      <Icon className="w-6 h-6" />
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-xl font-bold leading-tight">{value}</div>
        {hint && <div className="text-xs text-gray-500">{hint}</div>}
      </div>
    </div>
  );
}

function IconButton({ children, onClick, title, disabled }) {
  return (
    <button
      className={`p-1.5 border rounded-md hover:bg-gray-50 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

function clamp1to5(v) {
  const n = Number.isFinite(v) ? v : 2;
  return Math.max(1, Math.min(5, n));
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function makeId() { return Math.random().toString(36).slice(2, 10); }
function getPlanId(ref) {
  if (typeof ref.current === 'function') ref.current = ref.current();
  return ref.current;
}
function clone(v) {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}

/**
 * generatePlan(bankItems, months, density, proficiency)
 * - Sorts by effort and title for determinism
 * - Picks `density` per month across 6 months
 * - For LOW proficiency: bias to lower-effort items first
 * - For HIGH proficiency: bias to higher-effort items first
 */
function generatePlan(bankItems, months, density, proficiency) {
  const byEffortAsc = [...bankItems].sort((a, b) => (a.effort - b.effort) || String(a.title).localeCompare(String(b.title)));
  const byEffortDesc = [...byEffortAsc].reverse();
  const source = proficiency === 'low' ? byEffortAsc : proficiency === 'high' ? byEffortDesc : bankItems;
  // for medium, blend to keep variety
  const medium = proficiency === 'medium'
    ? interleaveSorted(byEffortAsc, byEffortDesc)
    : source;
  const pool = medium;

  const perMonth = Math.max(1, density);
  const result = months.map((label, i) => {
    const start = i * perMonth;
    const slice = pool.slice(start, start + perMonth);
    return { month: label, activities: slice };
  });
  return result;
}

function interleaveSorted(a, b) {
  const res = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (i < a.length) res.push(a[i]);
    if (i < b.length) res.push(b[i]);
  }
  // remove duplicates by id+title combo
  const seen = new Set();
  return res.filter(x => {
    const key = `${x.id}::${x.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
