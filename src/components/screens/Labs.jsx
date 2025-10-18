/* eslint-disable no-console */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppServices } from '../../App.jsx'; // Correct import
import { Tooltip } from '../shared/UI'; // <-- FIX: Import Tooltip from the local shared UI components
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
  // Removed Tooltip from lucide-react, as it is not exported by that library
} from 'lucide-react';

/**
 * Labs Screen — Full Feature Sandbox for Plan Generation
 */
export default function Labs() {
    // FIX: Safely destructure context data, defaulting complex objects to {}
    const { 
        db, 
        auth, 
        pdpData, 
        commitmentData, 
        LEADERSHIP_TIERS = {}, // Added safe default
        allBooks = {}, // Added safe default
        appId
    } = useAppServices();

    // ----------------------------------
    // Consolidate Data from Context
    // ----------------------------------
    const bankItems = useMemo(() => {
        // Mock / Fallback Data (as in original file, but simplified for clarity)
        const fallbackIfEmpty = [
          { id: 'sa_1', title: 'Strengths inventory', tier: 'Self-Awareness & Management', effort: 2, description: 'List top 5 strengths; align with role goals.' },
          { id: 'pc_1', title: '1:1 coaching cadence', tier: 'People & Coaching', effort: 3, description: 'Set biweekly 1:1s with direct reports and a shared agenda doc.' },
          { id: 'ea_1', title: 'Delegation map', tier: 'Execution & Accountability', effort: 3, description: 'Define tasks to delegate using RACI.' },
        ];
        
        let raw = fallbackIfEmpty; 
        if (pdpData?.plan?.length) {
            raw = pdpData.plan.flatMap(m => m.requiredContent.map(c => ({
                id: c.id,
                title: c.title,
                tier: c.tier, // This is the tier ID (T1, T2, etc.)
                effort: 1, // Default effort since content doesn't have it
                description: `Content item for ${c.type}. Difficulty: ${c.difficulty}.`,
            })));
        }

        const tierTitleByKey = new Map();
        // FIX: Ensure LEADERSHIP_TIERS is treated as an object for Object.values
        Object.values(LEADERSHIP_TIERS || {}).forEach(t => {
            tierTitleByKey.set(t.id, t.name);
            tierTitleByKey.set(t.name, t.name);
        });

        return (raw || fallbackIfEmpty).map((x, i) => ({
          id: x.id ?? `act_${i}`,
          title: x.title ?? x.name ?? 'Untitled activity',
          tier: tierTitleByKey.get(x.tier) || x.tier || 'General',
          effort: clamp1to5(x.effort), // 1–5
          description: x.description ?? '',
        }));

    }, [pdpData, LEADERSHIP_TIERS]);
    
    const totalBooks = useMemo(
        // FIX: Ensure allBooks is an object before calling Object.values()
        () => Object.values(allBooks || {}).reduce((n, arr) => n + (arr?.length || 0), 0),
        [allBooks]
    );
    
    // FIX: Ensure commitmentData is checked before accessing .items
    const COMMITMENT_COLLECTION_COUNT = commitmentData?.active_commitments?.length || 0;


    // ----------------------------------
    // Controls & Filters (no change from original)
    // ----------------------------------
    const [proficiency, setProficiency] = useState('medium'); // 'low' | 'medium' | 'high'
    const [tierFilter, setTierFilter] = useState('all'); // 'all' or tier title/key
    const [q, setQ] = useState('');

    const density = useMemo(() => {
        switch (proficiency) {
          case 'low': return 5;
          case 'high': return 2;
          default: return 3;
        }
    }, [proficiency]);

    // ----------------------------------
    // Months & initial plan (no change from original)
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
        // Only run if bankItems is populated (i.e., data is loaded)
        if (bankItems.length > 3 || !q) { // Use a heuristic to check if data is loaded beyond fallback
            setPlan(generatePlan(bankItems, months, density, proficiency));
            setCompleted(new Set());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bankItems.length, density, proficiency]);


    // ----------------------------------
    // Derived: filtered + search (no change from original)
    // ----------------------------------
    const filtered = useMemo(() => {
        const ql = q.trim().toLowerCase();
        const byMonth = plan.map(({ activities }) => {
          const filt = activities.filter(a => {
            if (tierFilter !== 'all' && a.tier !== tierFilter) return false;
            if (!ql) return true;
            return (
              a.title.toLowerCase().includes(ql) ||
              a.description.toLowerCase().includes(ql)
            );
          });
          return { activities: filt };
        });
        return byMonth;
    }, [plan, tierFilter, q]);

    // Monthly effort totals (no change from original)
    const effortByMonth = useMemo(() => plan.map(m => m.activities.reduce((s, a) => s + (a.effort || 0), 0)), [plan]);

    // ----------------------------------
    // Persistence: localStorage & Firestore Update
    // ----------------------------------
    // Load from localStorage on mount (no change from original)
    useEffect(() => {
        try {
          const raw = localStorage.getItem('labs_plan_latest');
          if (raw) {
            const data = JSON.parse(raw);
            if (data && data.months && Array.isArray(data.months)) {
              setPlan(data.months.map(m => ({ month: m.month, activities: m.activities })));
              setCompleted(new Set(data.completed || []));
              if (data.proficiency) setProficiency(data.proficiency);
              if (data.planId) planIdRef.current = data.planId;
            }
          }
        } catch {}
    }, []);

    // Auto-save to localStorage (no change from original)
    useEffect(() => {
        try {
          const data = {
            planId: getPlanId(planIdRef),
            proficiency,
            months: plan.map(m => ({ month: m.month, activities: m.activities })),
            completed: [...completed],
            generatedAt: new Date().toISOString(),
          };
          localStorage.setItem('labs_plan_latest', JSON.stringify(data));
        } catch {}
    }, [plan, completed, proficiency]);

    // Firestore Save (Updated to use Firestore from context)
    const savePlan = async () => {
        if (!db || !auth) {
          // NOTE: Changed alert to console.log as primary, user will be logged out if auth fails
          console.error('Plan saved locally (no Firebase/Auth available).');
          alert('Plan saved locally only. Sign in to enable cloud saves.');
          return;
        }
        
        try {
          const uid = auth?.currentUser?.uid || 'anonymous';
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore'); // Dynamic import for functions
          
          const ref = doc(db, `/artifacts/${appId}/users/${uid}/plans/labs_sandbox_plan`); 
          
          await setDoc(ref, {
            proficiency,
            months: plan.map(m => ({ month: m.month, activities: m.activities })),
            completed: [...completed],
            updatedAt: serverTimestamp(),
            meta: {
              // FIX: Safely access Object.values
              tiers: Object.values(LEADERSHIP_TIERS || {}).map(t => t.name ?? t.id),
              booksCount: totalBooks,
              commitmentsCount: COMMITMENT_COLLECTION_COUNT
            }
          }, { merge: true });
          alert('Plan saved to Firestore successfully.');
        } catch (e) {
          console.error('Could not save to Firestore:', e);
          alert('Could not save to Firestore. Check console for details.');
        }
    };

    // Firestore Load (Updated to use Firestore from context)
    useEffect(() => {
      // Load once auth is ready and DB is available
      if (!db || !auth || auth.currentUser === null) return; 
      
      (async () => {
        try {
          const { doc, getDoc } = await import('firebase/firestore');
          const uid = auth.currentUser.uid;
          const ref = doc(db, `/artifacts/${appId}/users/${uid}/plans/labs_sandbox_plan`);
          const snap = await getDoc(ref);
          
          if (snap.exists()) {
            const data = snap.data();
            if (data?.months) {
                setPlan(data.months.map(m => ({ month: m.month, activities: m.activities })));
            }
            if (data?.completed) setCompleted(new Set(data.completed));
            if (data?.proficiency) setProficiency(data.proficiency);
            console.log('Labs plan loaded from Firestore.');
          }
        } catch (e) {
          console.warn('Firestore load skipped (Labs):', e);
        }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, auth, appId]);

    // ----------------------------------
    // Actions (No functional change, just calling helpers)
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
        if (!window.confirm('Are you sure you want to discard the current plan and generate a new one?')) return;
        setPlan(generatePlan(bankItems, months, density, proficiency));
        setCompleted(new Set());
        planIdRef.current = makeId();
    };

    const exportJson = () => {
        const data = {
          planId: getPlanId(planIdRef),
          proficiency,
          months: plan.map(m => ({ month: m.month, activities: m.activities })),
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
            if (data?.months) setPlan(data.months.map(m => ({ month: m.month, activities: m.activities })));
            if (data?.completed) setCompleted(new Set(data.completed));
            if (data?.proficiency) setProficiency(String(data.proficiency));
            if (data?.planId) planIdRef.current = data.planId;
            alert('Plan successfully imported.');
          } catch (e) {
            alert('Invalid JSON file.');
          }
        };
        reader.readAsText(file);
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
            <h1 className="text-2xl font-bold">Coaching Lab & Sandbox</h1>

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
                    // FIX: Safely access Object.values
                    ...Object.values(LEADERSHIP_TIERS || {}).map(t => t.name ?? t.id),
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
            {/* FIX: Safely access Object.keys */}
            <Kpi icon={TrendingUp} label="Tiers" value={Object.keys(LEADERSHIP_TIERS || {}).length || new Set(bankItems.map(b => b.tier)).size} hint="Leadership framework levels" />
            <Kpi icon={CheckCircle} label="Items in Bank" value={bankItems.length} hint="Activities available to generate plans" />
            <Kpi icon={BookOpen} label="Total Books" value={totalBooks} hint="Reading bank" />
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
            <h2 className="text-lg font-semibold flex items-center gap-2"><Target className="w-5 h-5" /> 6-Month Action Plan (Editable)</h2>
            <div className="grid lg:grid-cols-3 gap-4">
              {plan.map((monthData, monthIdx) => {
                const activities = filtered[monthIdx]?.activities || [];
                return (
                    <div key={monthData.month} className="border rounded-xl p-4 bg-white shadow-sm">
                      <div className="flex items-center justify-between mb-2 border-b pb-2">
                        <div className="font-semibold text-lg text-gray-800">{monthData.month}</div>
                        <div className="text-sm text-gray-600">Effort: {effortByMonth[monthIdx] || 0}</div>
                      </div>
                      {activities.length ? (
                        <ul className="space-y-3 pt-2">
                          {activities.map((a, i) => (
                            <li key={a.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2">
                                      <input type="checkbox" checked={completed.has(a.id)} onChange={() => toggleComplete(a.id)} className="mt-1 h-4 w-4 text-emerald-600 rounded" />
                                      <div>
                                        <div className={`font-medium leading-tight ${completed.has(a.id) ? 'line-through text-gray-500' : 'text-gray-900'}`}>{a.title}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Tooltip content="Move up"><IconButton title="Move up" onClick={() => moveActivityIndex(monthIdx, a.id, 'up')} disabled={i === 0}><ArrowUp className="w-4 h-4" /></IconButton></Tooltip>
                                      <Tooltip content="Move down"><IconButton title="Move down" onClick={() => moveActivityIndex(monthIdx, a.id, 'down')} disabled={i === activities.length - 1}><ArrowDown className="w-4 h-4" /></IconButton></Tooltip>
                                    </div>
                                </div>
                                
                                <div className='flex justify-between items-center text-xs pt-1'>
                                    <span className="text-gray-600 font-medium">Tier: {a.tier} • Effort: {a.effort}/5</span>
                                    <div className='flex gap-1'>
                                      <Tooltip content="Move Left"><IconButton title="Move left" onClick={() => moveActivityMonth(monthIdx, a.id, 'left')} disabled={monthIdx === 0}><ArrowLeft className="w-4 h-4" /></IconButton></Tooltip>
                                      <Tooltip content="Move Right"><IconButton title="Move right" onClick={() => moveActivityMonth(monthIdx, a.id, 'right')} disabled={monthIdx === months.length - 1}><ArrowRight className="w-4 h-4" /></IconButton></Tooltip>
                                      <Tooltip content="Duplicate"><IconButton title="Duplicate" onClick={() => duplicateActivity(monthIdx, a.id)}><Copy className="w-4 h-4" /></IconButton></Tooltip>
                                      <Tooltip content="Delete"><IconButton title="Delete" onClick={() => deleteActivity(monthIdx, a.id)}><Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" /></IconButton></Tooltip>
                                    </div>
                                </div>
                                {a.description && (
                                    <p className="text-xs text-gray-700 mt-2">{a.description}</p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">No activities match filters.</p>
                      )}
                    </div>
                );
              })}
            </div>
          </section>

          {/* Books by Tier */}
          {Object.keys(allBooks || {}).length > 0 && ( // FIX: Safely check keys
            <section className="space-y-2">
              <h2 className="text-lg font-semibold flex items-center gap-2"><BookOpen className="w-5 h-5" /> Suggested Reading (From App Context)</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(allBooks).map(([key, books]) => (
                  <div key={key} className="border rounded-xl p-4 bg-white shadow-sm">
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
// Helpers & tiny components (kept from original)
// ---------------------------------
function Kpi({ icon: Icon, label, value, hint }) {
  return (
    <div className="border rounded-xl p-4 flex items-center gap-3 bg-white shadow-sm">
      <Icon className="w-6 h-6 text-indigo-500" />
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
      className={`p-1 border rounded-md hover:bg-gray-100 transition ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-50/50'}`}
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
 */
function generatePlan(bankItems, months, density, proficiency) {
  const byEffortAsc = [...bankItems].sort((a, b) => (a.effort - b.effort) || String(a.title).localeCompare(String(b.title)));
  const byEffortDesc = [...byEffortAsc].reverse();
  const pool = proficiency === 'medium' ? interleaveSorted(byEffortAsc, byEffortDesc) : proficiency === 'low' ? byEffortAsc : byEffortDesc;

  const perMonth = Math.max(1, density);
  const result = months.map((label, i) => {
    const start = (i * perMonth) % pool.length; // Loop back if pool is smaller
    const slice = [];
    for(let j=0; j < perMonth; j++) {
        slice.push(pool[(start + j) % pool.length]);
    }
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
  const seen = new Set();
  return res.filter(x => {
    const key = `${x.id}::${x.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
