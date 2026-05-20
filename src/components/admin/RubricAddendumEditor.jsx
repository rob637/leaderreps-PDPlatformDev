// src/components/admin/RubricAddendumEditor.jsx
//
// Slice 4 — Admin-only editor for the free-form scorer addendum per rrType.
// Stored at `metadata/conditioning/rrAddendums/{rrType}`. The addendum is
// appended to the scorer's user prompt at evaluation time (see
// `functions/index.js` evaluateRep + `functions/conditioning/scorer.js`).
//
// This lets the admin team tighten the rubric for an rrType without a
// code deploy. Empty/missing addendum = no behavior change.

import React, { useEffect, useState } from 'react';
import {
  BookOpen, Save, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { getRrAddendum, setRrAddendum } from '../../services/calibrationService';

const RR_TYPES = [
  { code: 'DRF', label: 'Direct Recognition Feedback' },
  { code: 'RED', label: 'Recognition · Expectation · Direct ask' },
  { code: 'FUW', label: 'Follow-up & Witness' },
  { code: 'SCE', label: 'Standard · Cause · Expectation' },
];

const MAX_LEN = 4000;

const formatWhen = (ts) => {
  if (!ts) return '';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  } catch { return ''; }
};

const RubricAddendumEditor = () => {
  const { db, user } = useAppServices();
  const [active, setActive] = useState('DRF');
  const [text, setText] = useState('');
  const [meta, setMeta] = useState({ updatedAt: null, updatedBy: null, version: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSavedAt(null);
    (async () => {
      try {
        const a = await getRrAddendum(db, active);
        if (cancelled) return;
        setText(a.text || '');
        setMeta({ updatedAt: a.updatedAt, updatedBy: a.updatedBy, version: a.version || 0 });
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [db, active]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSavedAt(null);
    try {
      const res = await setRrAddendum(db, active, {
        text,
        trainerId: user?.uid,
        trainerEmail: user?.email,
      });
      setMeta((m) => ({
        ...m,
        version: res.version,
        updatedAt: new Date(),
        updatedBy: user?.email || user?.uid || null,
      }));
      setSavedAt(Date.now());
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const remaining = MAX_LEN - text.length;

  return (
    <section className="space-y-3">
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-corporate-teal flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-corporate-navy dark:text-white">
            Scorer rubric addendum
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Free-form guidance appended to the AI scorer's prompt for the
            selected rep type. Use this to tighten edge cases the rubric
            anchors don't already cover. Saved instantly; takes effect on
            the next rep evaluation. Leave blank for default behavior.
          </p>
        </div>
      </div>

      {/* RR type tabs */}
      <div className="flex flex-wrap gap-1.5">
        {RR_TYPES.map((rt) => (
          <button
            key={rt.code}
            type="button"
            onClick={() => setActive(rt.code)}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              active === rt.code
                ? 'bg-corporate-navy text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            title={rt.label}
          >
            {rt.code}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
              rows={8}
              placeholder={`Optional addendum for ${active}. e.g. "If the leader names a specific behavior AND states an impact, score Behavior at 3 even if the request is implied."`}
              className="w-full text-sm font-mono px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-corporate-teal"
            />
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                {meta.version > 0 && (
                  <>
                    <span>v{meta.version}</span>
                    {meta.updatedAt && <span>· updated {formatWhen(meta.updatedAt)}</span>}
                    {meta.updatedBy && <span>· by {meta.updatedBy}</span>}
                  </>
                )}
              </div>
              <span className={remaining < 200 ? 'text-corporate-orange' : ''}>
                {remaining} chars left
              </span>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-corporate-teal text-white text-xs font-semibold hover:bg-corporate-teal/90 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save {active} addendum
              </button>
              {savedAt && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                </span>
              )}
              {error && (
                <span className="inline-flex items-center gap-1 text-xs text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5" /> {error}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default RubricAddendumEditor;
