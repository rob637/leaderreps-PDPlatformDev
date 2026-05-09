// src/components/screens/IdentityStatement.jsx
//
// Leadership Identity Statement (LIS) — lesson-aligned builder.
//
// Built from the in-program lesson "Leadership Identity & Intentions".
// Three exercises, in order:
//
//   1) Leadership Qualities
//        - Name leaders you admire and the qualities that draw you to them.
//        - Then pick 3–5 qualities you commit to embodying.
//
//   2) Leadership Identity Statement
//        - You write it. One sentence. "I am the type of leader who..."
//        - Your selected qualities are shown as reference. No AI generation.
//
//   3) Leadership Intentions
//        - Pairs of (Scenario, Intention) you decide BEFORE the moment arrives.
//
// Persisted to:
//   developmentPlanData.dailyPracticeData.leadershipIdentity = {
//     admiredLeaders: [{ id, name, qualities: [string] }],
//     qualities: [string],            // user's 3–5
//     statement: string,              // "I am the type of leader who..."
//     intentions: [{ id, scenario, intention }],
//     anchor: { word, statement },    // mirrored for backward compatibility
//     versions: [...], updatedAt, createdAt
//   }
//
// Backward compatibility:
//   - We mirror `statement` into `anchor.statement` so the existing
//     GroundingRepWidget and Locker card keep working.
//   - We also write the legacy `identityAnchor` string field.

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Save, Pencil, Plus, X, Check,
  Compass, Users, Quote, Target, ShieldCheck, Loader2,
  ChevronDown, ChevronUp, Lightbulb, RefreshCw,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { PageLayout } from '../ui/PageLayout';
import VoiceTextarea from '../conditioning/VoiceTextarea';

// ---------------------------------------------------------------------------
// Quality bank — straight from the workbook. Scan, don't read top to bottom.
// ---------------------------------------------------------------------------
const QUALITY_BANK = [
  'Accountable', 'Adaptable', 'Authentic', 'Bold', 'Brave', 'Calm', 'Caring',
  'Clear', 'Collaborative', 'Composed', 'Confident', 'Consistent',
  'Constructive', 'Courageous', 'Creative', 'Curious', 'Decisive', 'Dedicated',
  'Dependable', 'Determined', 'Disciplined', 'Driven', 'Dynamic', 'Empathetic',
  'Empowering', 'Encouraging', 'Energetic', 'Engaged', 'Ethical', 'Fair',
  'Flexible', 'Focused', 'Forgiving', 'Forward-thinking', 'Generous', 'Genuine',
  'Grateful', 'Grounded', 'Growth-oriented', 'Hardworking', 'Helpful', 'Honest',
  'Humble', 'Inclusive', 'Influential', 'Innovative', 'Insightful', 'Inspiring',
  'Intentional', 'Intuitive', 'Joyful', 'Just', 'Kind', 'Knowledgeable',
  'Level-headed', 'Listener', 'Loyal', 'Mentally-tough', 'Motivating',
  'Objective', 'Open-minded', 'Optimistic', 'Organized', 'Outgoing',
  'Passionate', 'Patient', 'Perceptive', 'Persistent', 'Persuasive', 'Positive',
  'Practical', 'Proactive', 'Purposeful', 'Rational', 'Realistic', 'Reflective',
  'Reliable', 'Resilient', 'Respectful', 'Responsible', 'Results-focused',
  'Risk-aware', 'Self-aware', 'Self-controlled', 'Selfless', 'Servant-hearted',
  'Strategic', 'Supportive', 'Tactful', 'Team-oriented', 'Tenacious',
  'Thoughtful', 'Transparent', 'Trust-building', 'Trustworthy', 'Unbiased',
  'Understanding', 'Visionary', 'Vulnerable', 'Wise',
];

const MIN_QUALITIES = 3;
const MAX_QUALITIES = 5;
const MAX_INTENTIONS = 5;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------
const safeStr = (v) => (typeof v === 'string' ? v : '');
const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);

const normalizeData = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return {
      admiredLeaders: [],
      qualities: [],
      statement: '',
      intentions: [],
      versions: [],
      updatedAt: null,
      createdAt: null,
    };
  }
  // Pull statement from new field, falling back to mirrored anchor.statement
  const statement = safeStr(raw.statement || raw?.anchor?.statement || '').trim();
  const qualities = Array.isArray(raw.qualities)
    ? raw.qualities.map(safeStr).map((q) => q.trim()).filter(Boolean).slice(0, MAX_QUALITIES)
    : [];
  const admiredLeaders = Array.isArray(raw.admiredLeaders)
    ? raw.admiredLeaders.map((l) => ({
        id: l?.id || newId(),
        name: safeStr(l?.name).trim(),
        qualities: Array.isArray(l?.qualities)
          ? l.qualities.map(safeStr).map((q) => q.trim()).filter(Boolean)
          : [],
      })).filter((l) => l.name || l.qualities.length > 0)
    : [];
  const intentions = Array.isArray(raw.intentions)
    ? raw.intentions.map((i) => ({
        id: i?.id || newId(),
        scenario: safeStr(i?.scenario).trim(),
        intention: safeStr(i?.intention).trim(),
      })).slice(0, MAX_INTENTIONS)
    : [];
  return {
    admiredLeaders,
    qualities,
    statement,
    intentions,
    versions: Array.isArray(raw.versions) ? raw.versions : [],
    updatedAt: raw.updatedAt || null,
    createdAt: raw.createdAt || null,
  };
};

const isComplete = (d) =>
  !!(d && d.statement && d.qualities?.length >= MIN_QUALITIES);

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const StepHeader = ({ stepNumber, totalSteps, label, title, helper }) => (
  <div>
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xs font-bold uppercase tracking-wider text-corporate-teal">
        Exercise {stepNumber} of {totalSteps}
      </span>
      <span className="text-xs text-slate-400">·</span>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
    </div>
    <h2 className="text-2xl md:text-3xl font-semibold text-corporate-navy dark:text-white leading-tight">
      {title}
    </h2>
    {helper && (
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{helper}</p>
    )}
  </div>
);

const ProgressBar = ({ step, total }) => (
  <div className="flex items-center gap-1.5 mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-1 flex-1 rounded-full transition-all ${
          i <= step ? 'bg-corporate-teal' : 'bg-slate-200 dark:bg-slate-700'
        }`}
      />
    ))}
  </div>
);

const NavRow = ({ onBack, onNext, nextLabel, nextDisabled, backLabel = 'Back' }) => (
  <div className="flex justify-between items-center pt-2">
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
    >
      <ArrowLeft className="w-4 h-4" /> {backLabel}
    </button>
    <button
      type="button"
      onClick={onNext}
      disabled={nextDisabled}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-corporate-teal text-white font-semibold hover:bg-corporate-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {nextLabel}
      <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);

// ---------------------------------------------------------------------------
// EXERCISE 1 — Leadership Qualities
// ---------------------------------------------------------------------------
const QualityChip = ({ label, selected, onClick, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled && !selected}
    className={`px-3 py-1.5 rounded-full text-sm border transition ${
      selected
        ? 'bg-corporate-teal text-white border-corporate-teal'
        : disabled
        ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-corporate-teal hover:text-corporate-teal-ink'
    }`}
  >
    {selected && <Check className="inline w-3.5 h-3.5 -mt-0.5 mr-1" />}
    {label}
  </button>
);

const AdmiredLeaderRow = ({ leader, onChange, onRemove, qualityBank, onAddFromBank }) => {
  const [bankOpen, setBankOpen] = useState(false);
  const updateQuality = (idx, val) => {
    const next = [...leader.qualities];
    next[idx] = val;
    onChange({ ...leader, qualities: next });
  };
  const removeQuality = (idx) => {
    const next = leader.qualities.filter((_, i) => i !== idx);
    onChange({ ...leader, qualities: next });
  };
  const addQuality = (val = '') => {
    onChange({ ...leader, qualities: [...leader.qualities, val] });
  };
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={leader.name}
          onChange={(e) => onChange({ ...leader, name: e.target.value.slice(0, 80) })}
          placeholder="Leader's name (e.g. my old manager Sara)"
          className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm font-semibold"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-slate-400 hover:text-rose-600"
          aria-label="Remove leader"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Qualities that draw you to them
        </div>
        <ul className="space-y-1.5">
          {leader.qualities.map((q, i) => (
            <li key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={q}
                onChange={(e) => updateQuality(i, e.target.value.slice(0, 40))}
                placeholder="e.g. honest"
                className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
              />
              <button
                type="button"
                onClick={() => removeQuality(i)}
                className="p-1 text-slate-400 hover:text-rose-600"
                aria-label="Remove quality"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 mt-2">
          <button
            type="button"
            onClick={() => addQuality('')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-corporate-teal-ink hover:text-corporate-teal"
          >
            <Plus className="w-3.5 h-3.5" /> Add quality
          </button>
          <button
            type="button"
            onClick={() => setBankOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            {bankOpen ? 'Hide examples' : 'See examples'}
          </button>
        </div>
        {bankOpen && (
          <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-56 overflow-y-auto">
            <p className="text-[10px] text-slate-500 italic mb-2">
              Tap any to add it to {leader.name || 'this leader'}.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {qualityBank.map((q) => {
                const already = leader.qualities.some(
                  (existing) => existing.toLowerCase().trim() === q.toLowerCase()
                );
                return (
                  <button
                    key={q}
                    type="button"
                    disabled={already}
                    onClick={() => onAddFromBank(leader.id, q)}
                    className={`text-xs px-2 py-1 rounded-full border ${
                      already
                        ? 'bg-corporate-teal/10 border-corporate-teal/30 text-corporate-teal-ink cursor-default'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-corporate-teal hover:text-corporate-teal-ink'
                    }`}
                  >
                    {already && <Check className="inline w-3 h-3 -mt-0.5 mr-0.5" />}
                    {q}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Exercise1Qualities = ({
  admiredLeaders, setAdmiredLeaders,
  qualities, setQualities,
  onBack, onNext,
}) => {
  const addLeader = () => {
    setAdmiredLeaders([
      ...admiredLeaders,
      { id: newId(), name: '', qualities: [''] },
    ]);
  };
  const updateLeader = (id, next) => {
    setAdmiredLeaders(admiredLeaders.map((l) => (l.id === id ? next : l)));
  };
  const removeLeader = (id) => {
    setAdmiredLeaders(admiredLeaders.filter((l) => l.id !== id));
  };
  const addBankQualityToLeader = (leaderId, q) => {
    setAdmiredLeaders(
      admiredLeaders.map((l) => {
        if (l.id !== leaderId) return l;
        const has = l.qualities.some(
          (existing) => existing.toLowerCase().trim() === q.toLowerCase()
        );
        if (has) return l;
        // Replace first empty slot, otherwise append
        const emptyIdx = l.qualities.findIndex((existing) => !existing.trim());
        const next = [...l.qualities];
        if (emptyIdx >= 0) next[emptyIdx] = q;
        else next.push(q);
        return { ...l, qualities: next };
      })
    );
  };

  // Aggregate suggested qualities — what showed up across admired leaders.
  const suggested = useMemo(() => {
    const counts = new Map();
    admiredLeaders.forEach((l) => {
      l.qualities.forEach((qRaw) => {
        const q = qRaw.trim();
        if (!q) return;
        // Normalize to title case-ish for display, dedupe by lowercase
        const key = q.toLowerCase();
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    // Capitalize first letter for display
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key]) => key.charAt(0).toUpperCase() + key.slice(1));
  }, [admiredLeaders]);

  const toggleQuality = (q) => {
    const has = qualities.some((x) => x.toLowerCase() === q.toLowerCase());
    if (has) {
      setQualities(qualities.filter((x) => x.toLowerCase() !== q.toLowerCase()));
    } else if (qualities.length < MAX_QUALITIES) {
      setQualities([...qualities, q]);
    }
  };

  const [bankOpen, setBankOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const addCustomQuality = () => {
    const v = customInput.trim();
    if (!v) return;
    if (qualities.length >= MAX_QUALITIES) return;
    if (qualities.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setQualities([...qualities, v]);
    setCustomInput('');
  };

  const canAdvance = qualities.length >= MIN_QUALITIES;

  return (
    <div className="space-y-6">
      <StepHeader
        stepNumber={1}
        totalSteps={3}
        label="Leadership Qualities"
        title="Who do you admire — and what makes them stand out?"
        helper="Before you define who you want to be, notice who you already admire and why. The positive qualities you see in others are usually the ones you want most in yourself."
      />

      {/* Admired leaders list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-corporate-navy dark:text-corporate-teal" />
          <h3 className="text-sm font-bold text-corporate-navy dark:text-white uppercase tracking-wider">
            Admired Leaders
          </h3>
          <span className="text-xs text-slate-400 ml-auto">
            Real or fictional. Living or not.
          </span>
        </div>

        {admiredLeaders.length === 0 && (
          <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
            <p className="text-sm text-slate-500 mb-3">
              Add at least one leader who has influenced you.
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {admiredLeaders.map((l) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <AdmiredLeaderRow
                leader={l}
                onChange={(next) => updateLeader(l.id, next)}
                onRemove={() => removeLeader(l.id)}
                qualityBank={QUALITY_BANK}
                onAddFromBank={addBankQualityToLeader}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={addLeader}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-corporate-teal hover:text-corporate-teal-ink"
        >
          <Plus className="w-4 h-4" /> Add a leader
        </button>
      </div>

      {/* My qualities selection */}
      <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-corporate-navy dark:text-corporate-teal" />
          <h3 className="text-sm font-bold text-corporate-navy dark:text-white uppercase tracking-wider">
            My Leadership Qualities
          </h3>
          <span className="text-xs text-slate-400 ml-auto">
            Pick {MIN_QUALITIES}–{MAX_QUALITIES} ({qualities.length}/{MAX_QUALITIES})
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          From what you noticed above, choose {MIN_QUALITIES}–{MAX_QUALITIES} qualities you want to consistently embody as a leader.
        </p>

        {/* Selected qualities row */}
        {qualities.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-corporate-teal/5 border border-corporate-teal/20">
            {qualities.map((q) => (
              <QualityChip
                key={q}
                label={q}
                selected
                onClick={() => toggleQuality(q)}
              />
            ))}
          </div>
        )}

        {/* Suggested from admired leaders */}
        {suggested.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              From the leaders you admire
            </div>
            <div className="flex flex-wrap gap-2">
              {suggested.map((q) => {
                const selected = qualities.some(
                  (x) => x.toLowerCase() === q.toLowerCase()
                );
                return (
                  <QualityChip
                    key={q}
                    label={q}
                    selected={selected}
                    onClick={() => toggleQuality(q)}
                    disabled={qualities.length >= MAX_QUALITIES}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Custom add */}
        <div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.slice(0, 40))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomQuality();
                }
              }}
              placeholder="Add your own quality"
              className="flex-1 p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
            />
            <button
              type="button"
              onClick={addCustomQuality}
              disabled={!customInput.trim() || qualities.length >= MAX_QUALITIES}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-corporate-teal disabled:opacity-40"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        {/* Quality bank */}
        <button
          type="button"
          onClick={() => setBankOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <span className="inline-flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            {bankOpen ? 'Hide quality list' : 'Browse the full quality list'}
          </span>
          {bankOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {bankOpen && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 max-h-72 overflow-y-auto">
            <p className="text-[10px] text-slate-500 italic mb-2">
              Scan, don't read top to bottom. Tap what resonates.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUALITY_BANK.map((q) => {
                const selected = qualities.some(
                  (x) => x.toLowerCase() === q.toLowerCase()
                );
                return (
                  <QualityChip
                    key={q}
                    label={q}
                    selected={selected}
                    onClick={() => toggleQuality(q)}
                    disabled={qualities.length >= MAX_QUALITIES}
                  />
                );
              })}
            </div>
          </div>
        )}

        {!canAdvance && (
          <p className="text-xs text-slate-500 italic">
            Pick at least {MIN_QUALITIES} qualities to continue.
          </p>
        )}
      </div>

      <NavRow
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!canAdvance}
        nextLabel="Continue to Statement"
        backLabel="Cancel"
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// EXERCISE 2 — Leadership Identity Statement
// ---------------------------------------------------------------------------
const Exercise2Statement = ({
  qualities, statement, setStatement,
  onBack, onNext,
}) => {
  const canAdvance = statement.trim().length >= 10;
  return (
    <div className="space-y-5">
      <StepHeader
        stepNumber={2}
        totalSteps={3}
        label="Leadership Identity Statement"
        title="What kind of leader are you committed to being?"
        helper="Don't write what you think you should say. Write what is true for you. Be specific. This will evolve as you grow — it doesn't need to be perfect."
      />

      {qualities.length > 0 && (
        <div className="p-3 rounded-xl bg-corporate-teal/5 border border-corporate-teal/20">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-corporate-teal-ink mb-1.5">
            Your qualities — use them as your starting point
          </div>
          <div className="flex flex-wrap gap-1.5">
            {qualities.map((q) => (
              <span
                key={q}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-corporate-teal/30 text-xs font-semibold text-corporate-teal-ink"
              >
                {q}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          I am the type of leader who…
        </label>
        <VoiceTextarea
          value={statement}
          onChange={(v) => setStatement(String(v || '').slice(0, 500))}
          rows={6}
          placeholder="I am the type of leader who…"
          maxLength={500}
        />
        <div className="mt-1 text-right text-[10px] text-slate-400">
          {statement.length}/500
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-2">
          <Quote className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-600 dark:text-slate-400 italic">
            Your identity is your foundation. It is your target and North Star.
            Identity drives behavior. It allows you to respond rather than react.
          </p>
        </div>
      </div>

      <NavRow
        onBack={onBack}
        onNext={onNext}
        nextDisabled={!canAdvance}
        nextLabel="Continue to Intentions"
      />
    </div>
  );
};

// ---------------------------------------------------------------------------
// EXERCISE 3 — Leadership Intentions
// ---------------------------------------------------------------------------
const IntentionRow = ({ item, onChange, onRemove, index }) => (
  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-corporate-teal/15 text-corporate-teal text-xs font-bold">
        {index + 1}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Scenario &amp; Intention
      </span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-auto p-1 text-slate-400 hover:text-rose-600"
        aria-label="Remove"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        Scenario
      </div>
      <input
        type="text"
        value={item.scenario}
        onChange={(e) => onChange({ ...item, scenario: e.target.value.slice(0, 200) })}
        placeholder="If I'm unsure what to say or do next…"
        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
      />
    </div>
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
        Intention
      </div>
      <input
        type="text"
        value={item.intention}
        onChange={(e) => onChange({ ...item, intention: e.target.value.slice(0, 200) })}
        placeholder="I will lead with curiosity and ask a question."
        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
      />
    </div>
  </div>
);

const Exercise3Intentions = ({
  intentions, setIntentions,
  onBack, onSave, saving, saveError,
}) => {
  const update = (id, next) => {
    setIntentions(intentions.map((i) => (i.id === id ? next : i)));
  };
  const remove = (id) => {
    setIntentions(intentions.filter((i) => i.id !== id));
  };
  const add = () => {
    if (intentions.length >= MAX_INTENTIONS) return;
    setIntentions([...intentions, { id: newId(), scenario: '', intention: '' }]);
  };

  const filledCount = intentions.filter(
    (i) => i.scenario.trim() && i.intention.trim()
  ).length;
  const canSave = filledCount >= 1;

  return (
    <div className="space-y-5">
      <StepHeader
        stepNumber={3}
        totalSteps={3}
        label="Leadership Intentions"
        title="How will you show up in the moments that test you?"
        helper="Identify specific scenarios where reaction comes easier than response — then decide in advance how you intend to show up. Pick the ones that come to mind first; they're usually the right ones."
      />

      {/* Example */}
      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-900 dark:text-amber-200">
            <div className="font-semibold mb-1">Example</div>
            <div><span className="font-semibold">Scenario:</span> If I'm unsure what to say or do next.</div>
            <div><span className="font-semibold">Intention:</span> I will lead with curiosity and ask a question.</div>
          </div>
        </div>
      </div>

      {intentions.length === 0 && (
        <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-500 mb-3">
            Add at least one scenario and intention.
          </p>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-corporate-teal text-white text-sm font-semibold hover:bg-corporate-teal/90"
          >
            <Plus className="w-4 h-4" /> Add my first intention
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {intentions.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            <IntentionRow
              item={item}
              index={idx}
              onChange={(next) => update(item.id, next)}
              onRemove={() => remove(item.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {intentions.length > 0 && intentions.length < MAX_INTENTIONS && (
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-corporate-teal hover:text-corporate-teal-ink"
        >
          <Plus className="w-4 h-4" /> Add another intention
        </button>
      )}

      {saveError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {saveError}
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!canSave || saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-corporate-teal text-white font-semibold hover:bg-corporate-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save my Leadership Identity'}
        </button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// VIEW MODE — show the saved artifact
// ---------------------------------------------------------------------------
const ViewMode = ({ data, onEdit, onStartOver }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-corporate-teal" />
        Saved · only you and your trainer can see this
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={onStartOver}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Start over
        </button>
      </div>
    </div>

    {/* Statement — the centerpiece */}
    <div className="rounded-2xl border-2 border-corporate-teal/30 bg-gradient-to-br from-corporate-teal/5 to-white dark:from-corporate-teal/10 dark:to-slate-900 p-6">
      <Quote className="w-6 h-6 text-corporate-teal/40 mb-2" />
      <p className="text-xl sm:text-2xl font-serif italic text-corporate-navy dark:text-white leading-relaxed">
        {data.statement}
      </p>
    </div>

    {/* Qualities */}
    {data.qualities.length > 0 && (
      <div className="p-4 rounded-2xl border-2 border-corporate-navy/15 bg-white dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-4 h-4 text-corporate-navy dark:text-corporate-teal" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-corporate-navy dark:text-corporate-teal-ink">
            My Leadership Qualities
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.qualities.map((q) => (
            <span
              key={q}
              className="px-3 py-1.5 rounded-full bg-corporate-teal text-white text-sm font-semibold"
            >
              {q}
            </span>
          ))}
        </div>
      </div>
    )}

    {/* Intentions */}
    {data.intentions.length > 0 && (
      <div className="p-4 rounded-2xl border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-white to-amber-50/30 dark:from-slate-800 dark:to-amber-900/10">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-amber-700 dark:text-amber-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            My Leadership Intentions
          </span>
        </div>
        <ul className="space-y-3">
          {data.intentions.map((it) => (
            <li
              key={it.id}
              className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              <div className="text-xs text-slate-500 mb-1">
                <span className="font-semibold">Scenario:</span> {it.scenario}
              </div>
              <div className="text-sm text-slate-800 dark:text-slate-200">
                <span className="font-semibold">Intention:</span> {it.intention}
              </div>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// INTRO — shown to brand-new leaders before starting
// ---------------------------------------------------------------------------
const Intro = ({ onStart, hasExisting }) => (
  <div className="space-y-5">
    <div>
      <h2 className="text-2xl md:text-3xl font-semibold text-corporate-navy dark:text-white leading-tight">
        {hasExisting ? 'Refine your Leadership Identity' : 'Build your Leadership Identity'}
      </h2>
      <p className="mt-2 text-base text-slate-600 dark:text-slate-300">
        Having a leadership identity is the difference between reacting and responding.
        Reaction is automatic. Response is intentional.
      </p>
      <p className="mt-2 text-sm text-slate-500">
        You're not building from scratch — you already have one. These three exercises help you surface it, name it, and make it something you use every day.
      </p>
    </div>

    <ol className="space-y-3">
      {[
        {
          n: 1,
          icon: Users,
          title: 'Leadership Qualities',
          desc: 'Identify leaders you admire and the qualities that draw you to them. Then pick the qualities you commit to embodying.',
        },
        {
          n: 2,
          icon: Quote,
          title: 'Leadership Identity Statement',
          desc: 'Use your qualities to draft a statement: "I am the type of leader who…"',
        },
        {
          n: 3,
          icon: Target,
          title: 'Leadership Intentions',
          desc: 'Connect your identity to specific scenarios where leadership gets hard for you. This is where identity becomes behavior.',
        },
      ].map(({ n, icon: Icon, title, desc }) => (
        <li
          key={n}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-start gap-3"
        >
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-corporate-teal/15 text-corporate-teal-ink font-bold text-sm flex-shrink-0">
            {n}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Icon className="w-4 h-4 text-corporate-navy dark:text-corporate-teal" />
              <h3 className="text-sm font-bold text-corporate-navy dark:text-white">{title}</h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{desc}</p>
          </div>
        </li>
      ))}
    </ol>

    <div className="flex justify-end pt-2">
      <button
        type="button"
        onClick={onStart}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-corporate-teal text-white font-semibold hover:bg-corporate-teal/90"
      >
        {hasExisting ? 'Start refining' : 'Start Exercise 1'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
const IdentityStatement = () => {
  const {
    dailyPracticeData,
    updateDailyPracticeData,
    navigate,
  } = useAppServices();

  const existing = useMemo(
    () => normalizeData(dailyPracticeData?.leadershipIdentity),
    [dailyPracticeData?.leadershipIdentity]
  );
  const legacyAnchor = safeStr(dailyPracticeData?.identityAnchor).trim();

  // Modes:
  //   'view'   — saved artifact display
  //   'intro'  — overview before starting (new users)
  //   'ex1' / 'ex2' / 'ex3' — the three exercises
  const initialMode = isComplete(existing) ? 'view' : 'intro';
  const [mode, setMode] = useState(initialMode);

  // Editable state — seeded from existing
  const [admiredLeaders, setAdmiredLeaders] = useState(existing.admiredLeaders);
  const [qualities, setQualities] = useState(existing.qualities);
  const [statement, setStatement] = useState(
    existing.statement || legacyAnchor || ''
  );
  const [intentions, setIntentions] = useState(existing.intentions);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Resync when Firestore data arrives later
  useEffect(() => {
    if (isComplete(existing) && (mode === 'intro')) {
      setAdmiredLeaders(existing.admiredLeaders);
      setQualities(existing.qualities);
      setStatement(existing.statement);
      setIntentions(existing.intentions);
      setMode('view');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing.statement]);

  const startEdit = () => {
    setAdmiredLeaders(existing.admiredLeaders.length ? existing.admiredLeaders : []);
    setQualities(existing.qualities);
    setStatement(existing.statement);
    setIntentions(existing.intentions);
    setMode('ex1');
  };

  const startOver = () => {
    setAdmiredLeaders([]);
    setQualities([]);
    setStatement('');
    setIntentions([]);
    setMode('intro');
  };

  const save = async () => {
    if (!updateDailyPracticeData) {
      setSaveError('Not connected. Refresh and try again.');
      return;
    }
    if (!statement.trim()) {
      setSaveError('Write your Leadership Identity Statement before saving.');
      return;
    }
    if (qualities.length < MIN_QUALITIES) {
      setSaveError(`Pick at least ${MIN_QUALITIES} qualities before saving.`);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const now = new Date().toISOString();
      const versions = Array.isArray(existing?.versions) ? existing.versions : [];
      const cleanStatement = statement.trim();

      // Push previous statement onto history if it changed
      let nextVersions = versions;
      if (existing?.statement && existing.statement !== cleanStatement) {
        nextVersions = [
          {
            savedAt: existing.updatedAt || now,
            statement: existing.statement,
            qualities: existing.qualities || [],
            source: 'self',
          },
          ...versions,
        ].slice(0, 10);
      }

      const cleanIntentions = intentions
        .map((i) => ({
          id: i.id || newId(),
          scenario: safeStr(i.scenario).trim(),
          intention: safeStr(i.intention).trim(),
        }))
        .filter((i) => i.scenario && i.intention);

      const cleanLeaders = admiredLeaders
        .map((l) => ({
          id: l.id || newId(),
          name: safeStr(l.name).trim(),
          qualities: (l.qualities || [])
            .map(safeStr)
            .map((q) => q.trim())
            .filter(Boolean),
        }))
        .filter((l) => l.name || l.qualities.length > 0);

      const payload = {
        leadershipIdentity: {
          admiredLeaders: cleanLeaders,
          qualities: qualities.slice(0, MAX_QUALITIES),
          statement: cleanStatement,
          intentions: cleanIntentions,
          // Mirror to legacy `anchor.statement` so the GroundingRepWidget and
          // Locker card keep displaying without a migration.
          anchor: { word: '', statement: cleanStatement },
          versions: nextVersions,
          updatedAt: now,
          createdAt: existing?.createdAt || now,
        },
        // Backward-compat: legacy single-string field used by widgets.
        identityAnchor: cleanStatement,
      };

      const ok = await updateDailyPracticeData(payload);
      if (!ok) throw new Error('Save failed');
      setMode('view');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[LIS] save failed', e);
      setSaveError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Map mode → step index for progress bar
  const stepIndex = mode === 'ex1' ? 0 : mode === 'ex2' ? 1 : mode === 'ex3' ? 2 : -1;

  return (
    <PageLayout
      title="Leadership Identity"
      icon={Compass}
      subtitle="Three exercises. Who you admire, who you are, and how you'll show up."
      navigate={navigate}
      backTo="locker"
      backLabel="Back to Locker"
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Locker', path: 'locker' },
        { label: 'Leadership Identity', path: null },
      ]}
      maxWidth="max-w-3xl"
    >
      {mode === 'view' && isComplete(existing) && (
        <ViewMode
          data={existing}
          onEdit={startEdit}
          onStartOver={startOver}
        />
      )}

      {mode === 'intro' && (
        <Intro
          hasExisting={isComplete(existing)}
          onStart={() => setMode('ex1')}
        />
      )}

      {stepIndex >= 0 && (
        <>
          <ProgressBar step={stepIndex} total={3} />
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {mode === 'ex1' && (
                <Exercise1Qualities
                  admiredLeaders={admiredLeaders}
                  setAdmiredLeaders={setAdmiredLeaders}
                  qualities={qualities}
                  setQualities={setQualities}
                  onBack={() =>
                    isComplete(existing) ? setMode('view') : setMode('intro')
                  }
                  onNext={() => setMode('ex2')}
                />
              )}
              {mode === 'ex2' && (
                <Exercise2Statement
                  qualities={qualities}
                  statement={statement}
                  setStatement={setStatement}
                  onBack={() => setMode('ex1')}
                  onNext={() => setMode('ex3')}
                />
              )}
              {mode === 'ex3' && (
                <Exercise3Intentions
                  intentions={intentions}
                  setIntentions={setIntentions}
                  onBack={() => setMode('ex2')}
                  onSave={save}
                  saving={saving}
                  saveError={saveError}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </PageLayout>
  );
};

export default IdentityStatement;
