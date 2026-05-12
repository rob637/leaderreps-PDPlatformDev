// src/components/admin/PhaseContentManager.jsx
//
// Phase Content Manager (May 2026 three-phase model)
// ==================================================
// Streamlined replacement for DailyPlanManager. Edits the two
// daily_plan_v2 documents directly:
//
//   daily_plan_v2/foundation-content
//   daily_plan_v2/ascent-content
//
// One phase per tab. Each phase doc is a flat list of curated items
// grouped by section. Items reference content that lives in the
// underlying collections (content_videos, content_readings,
// unified-content, etc.) — those collections are unchanged and
// continue to be authored in Content Manager / Media Vault.
//
// Sections:
//   Actions          — free-form action items (label + optional notes)
//   Content Items    — links to videos/readings/tools (via ResourceSelector)
//   Coaching Items   — coaching session types (via ResourceSelector)
//   Community Items  — community session types (via ResourceSelector)
//   Tools            — tool references
//   Workouts         — workout references
//   Daily Reps       — daily rep references
//   Skills           — comma-separated skill names
//   Pillars          — comma-separated pillar names
//   Coaching Session Types     — multi-select
//   Community Session Types    — multi-select

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Save, Trash2, Plus, AlertCircle, Loader, RefreshCw, Layers,
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { useThreePhaseContent } from '../../hooks/useThreePhaseContent';
import ResourceSelector from './ResourceSelector';

const PHASE_TABS = [
  { key: 'foundation', label: 'Foundation', accent: 'TEAL' },
  { key: 'ascent', label: 'Ascent', accent: 'ORANGE' },
];

// Sections that are simple arrays of items with a label
const ITEM_SECTIONS = [
  { key: 'actions', label: 'Actions', labelField: 'label', selector: null,
    description: 'Free-form action items shown as a checklist for the leader.' },
  { key: 'contentItems', label: 'Content Items', labelField: 'contentItemLabel', selector: 'content',
    description: 'Videos, readings and other content (from Media Vault / Content Library).' },
  { key: 'coachingItems', label: 'Coaching Items', labelField: 'coachingItemLabel', selector: 'coaching',
    description: 'Coaching session types/templates available in this phase.' },
  { key: 'communityItems', label: 'Community Items', labelField: 'communityItemLabel', selector: 'community',
    description: 'Community session types/templates available in this phase.' },
  { key: 'tools', label: 'Tools', labelField: 'toolName', selector: 'content',
    description: 'Tools and worksheets the leader can use.' },
  { key: 'workouts', label: 'Workouts', labelField: 'workoutName', selector: 'content',
    description: 'Workout references for this phase.' },
  { key: 'dailyReps', label: 'Daily Reps', labelField: 'repName', selector: 'conditioning',
    description: 'Conditioning rep types featured in this phase.' },
];

// String-array sections
const STRING_SECTIONS = [
  { key: 'skills', label: 'Skills', placeholder: 'Leadership Identity, Self-Awareness, Feedback…' },
  { key: 'pillars', label: 'Pillars', placeholder: 'Lead Self, Lead Work, Lead People, Lead Others' },
];

// Predefined session-type vocabularies (keep aligned with the rest of the app)
const COACHING_SESSION_TYPE_OPTIONS = [
  'one_on_one', 'open_gym', 'leader_circle', 'workshop', 'live_workout',
];
const COMMUNITY_SESSION_TYPE_OPTIONS = [
  'leader_circle', 'community_event', 'accountability_pod', 'mastermind', 'networking',
];

// ---- Helpers ----
const ensureArray = (v) => (Array.isArray(v) ? v : []);

const clonePhaseDoc = (doc) => {
  if (!doc) {
    return {
      actions: [], coaching: [], community: [], reps: [], content: [], resources: [],
      contentItems: [], coachingItems: [], communityItems: [],
      tools: [], workouts: [], dailyReps: [],
      skills: [], pillars: [],
      coachingSessionTypes: [], communitySessionTypes: [],
    };
  }
  // Strip provenance and meta — we don't want to write _source on round-trip.
  // We DO preserve it by spreading it through, but it's harmless to overwrite.
  return JSON.parse(JSON.stringify(doc));
};

const labelOf = (item, fallback = 'Untitled') => {
  if (!item || typeof item !== 'object') return String(item || fallback);
  return (
    item.label ||
    item.contentItemLabel ||
    item.coachingItemLabel ||
    item.communityItemLabel ||
    item.toolName ||
    item.workoutName ||
    item.repName ||
    item.title ||
    item.id ||
    fallback
  );
};

// ---- Section rendering ----

const ItemSection = ({ section, items, onChange }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState(null);

  const handlePickerChange = (val) => {
    if (!val) {
      setPickerOpen(false);
      return;
    }
    // val is the resource picked — coerce into a phase-doc item shape
    const newItem = {
      [section.labelField]: val.title || val.name || val.label || labelOf(val),
      resourceId: val.id || val.resourceId || '',
      resourceType: val.resourceType || val.type || section.selector,
      contentItemId: val.id || '',
      isRequiredContent: false,
      _addedAt: new Date().toISOString(),
    };
    onChange([...items, newItem]);
    setPickerValue(null);
    setPickerOpen(false);
  };

  const addCustom = () => {
    const labelText = window.prompt(`Add ${section.label}: title?`);
    if (!labelText) return;
    onChange([...items, { [section.labelField]: labelText, _addedAt: new Date().toISOString() }]);
  };

  const removeAt = (idx) => {
    const next = items.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  const editLabelAt = (idx) => {
    const cur = labelOf(items[idx]);
    const next = window.prompt('Edit title:', cur);
    if (next == null) return;
    const updated = items.slice();
    updated[idx] = { ...updated[idx], [section.labelField]: next };
    onChange(updated);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 bg-white dark:bg-slate-800">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold text-corporate-navy dark:text-white">{section.label}</h3>
          {section.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{section.description}</p>
          )}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">Empty</p>
      ) : (
        <ul className="divide-y divide-slate-200 dark:divide-slate-700 mb-3">
          {items.map((item, idx) => (
            <li key={`${section.key}-${idx}`} className="py-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => editLabelAt(idx)}
                className="flex-1 text-left text-sm text-corporate-navy dark:text-white hover:underline truncate"
                title="Click to edit title"
              >
                {labelOf(item)}
              </button>
              {item.resourceId && (
                <span className="text-xs text-slate-400 truncate max-w-[150px]" title={item.resourceId}>
                  {item.resourceType || 'ref'}: {item.resourceId.slice(0, 8)}…
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="p-1 text-slate-400 hover:text-red-500"
                aria-label={`Remove ${labelOf(item)}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {section.selector && (
          <div className="inline-flex">
            {!pickerOpen ? (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="px-3 py-1.5 text-xs rounded-lg bg-corporate-teal hover:bg-corporate-teal/90 text-white inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Pick from library
              </button>
            ) : (
              <div className="inline-flex items-center gap-2">
                <ResourceSelector
                  value={pickerValue}
                  onChange={handlePickerChange}
                  resourceType={section.selector}
                />
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={addCustom}
          className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 inline-flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add custom
        </button>
      </div>
    </div>
  );
};

const StringListSection = ({ section, value, onChange }) => {
  const [text, setText] = useState((value || []).join(', '));

  // Sync local text when incoming value changes (after a save/refresh)
  useEffect(() => {
    setText((value || []).join(', '));
  }, [value]);

  const commit = () => {
    const next = text.split(',').map((s) => s.trim()).filter(Boolean);
    onChange(next);
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 bg-white dark:bg-slate-800">
      <h3 className="font-semibold text-corporate-navy dark:text-white mb-2">{section.label}</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        placeholder={section.placeholder}
        rows={2}
        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-corporate-navy dark:text-white"
      />
      <p className="text-xs text-slate-400 mt-1">Comma-separated. Click outside the box to commit changes.</p>
    </div>
  );
};

const MultiSelectSection = ({ label, options, value, onChange }) => {
  const set = new Set(value || []);
  const toggle = (opt) => {
    const next = new Set(set);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(Array.from(next));
  };
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 mb-4 bg-white dark:bg-slate-800">
      <h3 className="font-semibold text-corporate-navy dark:text-white mb-2">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = set.has(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                active
                  ? 'bg-corporate-teal text-white border-corporate-teal'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:border-corporate-teal'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ---- Main component ----

const PhaseContentManager = () => {
  const { updatePhaseContent } = useAppServices();
  const { foundationContent, ascentContent, isLoading } = useThreePhaseContent();

  const [activePhase, setActivePhase] = useState('foundation');
  const [draft, setDraft] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const incoming = activePhase === 'foundation' ? foundationContent : ascentContent;

  const sourceCount = useMemo(() => {
    const sources = incoming?._source?.docIds;
    return Array.isArray(sources) ? sources.length : 0;
  }, [incoming]);

  // When the phase changes, or fresh data lands, hydrate the draft (only if not dirty)
  useEffect(() => {
    if (!isDirty) {
      setDraft(clonePhaseDoc(incoming));
    }
  }, [incoming, activePhase, isDirty]);

  const switchPhase = (key) => {
    if (isDirty && !window.confirm('You have unsaved changes. Discard?')) return;
    setActivePhase(key);
    setIsDirty(false);
    setDraft(clonePhaseDoc(key === 'foundation' ? foundationContent : ascentContent));
  };

  const updateField = useCallback((field, value) => {
    setDraft((prev) => ({ ...(prev || {}), [field]: value }));
    setIsDirty(true);
  }, []);

  const reset = () => {
    if (!window.confirm('Discard all unsaved changes?')) return;
    setDraft(clonePhaseDoc(incoming));
    setIsDirty(false);
    setSaveError(null);
  };

  const save = async () => {
    if (!updatePhaseContent || !draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Build a clean payload — only the editable fields. We intentionally
      // drop _source and other server-managed fields.
      const payload = {
        actions: ensureArray(draft.actions),
        coaching: ensureArray(draft.coaching),
        community: ensureArray(draft.community),
        reps: ensureArray(draft.reps),
        content: ensureArray(draft.content),
        resources: ensureArray(draft.resources),
        contentItems: ensureArray(draft.contentItems),
        coachingItems: ensureArray(draft.coachingItems),
        communityItems: ensureArray(draft.communityItems),
        tools: ensureArray(draft.tools),
        workouts: ensureArray(draft.workouts),
        dailyReps: ensureArray(draft.dailyReps),
        skills: ensureArray(draft.skills),
        pillars: ensureArray(draft.pillars),
        coachingSessionTypes: ensureArray(draft.coachingSessionTypes),
        communitySessionTypes: ensureArray(draft.communitySessionTypes),
        updatedAt: new Date(),
        updatedBy: 'PhaseContentManager',
      };
      const ok = await updatePhaseContent(activePhase, payload, { merge: true });
      if (!ok) throw new Error('Write returned false');
      setIsDirty(false);
    } catch (err) {
      console.error('[PhaseContentManager] save failed:', err);
      setSaveError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !draft) {
    return (
      <Card title="Phase Content Manager" icon={Layers} accent="TEAL">
        <div className="flex items-center justify-center p-8">
          <Loader className="w-6 h-6 animate-spin text-corporate-teal" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Phase Content Manager" icon={Layers} accent="TEAL">
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
        Edit the curated content list for each phase. Items reference resources
        that live in <strong>Content Library</strong> and <strong>Media Vault</strong> —
        author the underlying resources there, then add them to a phase here.
      </p>

      {/* Phase tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700">
        {PHASE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => switchPhase(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activePhase === tab.key
                ? 'border-corporate-teal text-corporate-teal'
                : 'border-transparent text-slate-500 hover:text-corporate-navy dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {sourceCount > 0 && <span>Seeded from {sourceCount} legacy docs</span>}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
        <div className="text-sm">
          {isDirty ? (
            <span className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" /> Unsaved changes
            </span>
          ) : (
            <span className="text-slate-500 dark:text-slate-400">No unsaved changes</span>
          )}
          {saveError && (
            <span className="ml-3 text-red-600 dark:text-red-400">Save failed: {saveError}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            disabled={!isDirty || saving}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty || saving}
            className="px-3 py-1.5 text-sm rounded-lg bg-corporate-teal hover:bg-corporate-teal/90 text-white font-medium disabled:opacity-50 inline-flex items-center gap-1"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Sections */}
      {draft && (
        <>
          {ITEM_SECTIONS.map((section) => (
            <ItemSection
              key={section.key}
              section={section}
              items={ensureArray(draft[section.key])}
              onChange={(next) => updateField(section.key, next)}
            />
          ))}
          {STRING_SECTIONS.map((section) => (
            <StringListSection
              key={section.key}
              section={section}
              value={ensureArray(draft[section.key])}
              onChange={(next) => updateField(section.key, next)}
            />
          ))}
          <MultiSelectSection
            label="Coaching Session Types"
            options={COACHING_SESSION_TYPE_OPTIONS}
            value={ensureArray(draft.coachingSessionTypes)}
            onChange={(next) => updateField('coachingSessionTypes', next)}
          />
          <MultiSelectSection
            label="Community Session Types"
            options={COMMUNITY_SESSION_TYPE_OPTIONS}
            value={ensureArray(draft.communitySessionTypes)}
            onChange={(next) => updateField('communitySessionTypes', next)}
          />
        </>
      )}
    </Card>
  );
};

export default PhaseContentManager;
