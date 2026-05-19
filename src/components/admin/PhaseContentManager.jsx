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
//   Content — single curated list of content references (videos, Read & Reps,
//             documents, tools, interactive forms, courses). Picker pulls from
//             Content Library + Media Vault.
//
// Note (May 2026): Actions, Events, and Workouts retired. Events live in
// Programs → Events and surface to leaders via per-event phase tagging.

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Save, Trash2, Plus, AlertCircle, Loader, RefreshCw, Layers,
  ArrowUp, ArrowDown, Star, FileText, Link2, AlertTriangle,
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { useThreePhaseContent } from '../../hooks/useThreePhaseContent';
import ResourceSelector from './ResourceSelector';
import { ARTIFACT_LIBRARY, ARTIFACT_KINDS } from '../../hooks/useArtifactCompletion';

const PHASE_TABS = [
  { key: 'foundation', label: 'Foundation', accent: 'TEAL' },
  { key: 'ascent', label: 'Ascent', accent: 'ORANGE' },
];

// Sections that are simple arrays of items with a label
const ITEM_SECTIONS = [
  { key: 'contentItems', label: 'Content', labelField: 'contentItemLabel', selector: 'content',
    description: 'Videos, Read & Reps, documents, tools, and interactive forms (from Content Library / Media Vault).' },
];

// ---- Helpers ----
const ensureArray = (v) => (Array.isArray(v) ? v : []);

const clonePhaseDoc = (doc) => {
  if (!doc) {
    return { contentItems: [] };
  }
  const cloned = JSON.parse(JSON.stringify(doc));
  if (!Array.isArray(cloned.contentItems)) cloned.contentItems = [];
  // Back-compat: pull legacy `tools` entries into the unified Content list
  // so they remain visible in the editor.
  if (Array.isArray(cloned.tools) && cloned.tools.length) {
    const promoted = cloned.tools.map((t) => ({
      ...t,
      contentItemLabel: t.toolName || t.label || t.title,
      resourceType: t.resourceType || 'tool',
    }));
    cloned.contentItems = cloned.contentItems.concat(promoted);
    delete cloned.tools;
  }
  return cloned;
};

const labelOf = (item, fallback = 'Untitled') => {
  if (!item || typeof item !== 'object') return String(item || fallback);
  return (
    item.label ||
    item.contentItemLabel ||
    item.eventLabel ||
    item.coachingItemLabel ||
    item.communityItemLabel ||
    item.toolName ||
    item.workoutName ||
    item.title ||
    item.id ||
    fallback
  );
};

// ---- Section rendering ----

const ItemSection = ({ section, items, onChange }) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState(null);

  // ResourceSelector calls onChange(id, resource); we need the full resource object.
  const handlePickerChange = (id, resource) => {
    const val = resource || (id && typeof id === 'object' ? id : null);
    if (!val) {
      setPickerOpen(false);
      return;
    }
    // val is the resource picked — coerce into a phase-doc item shape
    const resolvedId = val.id || val.resourceId || (typeof id === 'string' ? id : '');
    const newItem = {
      [section.labelField]: val.title || val.name || val.label || labelOf(val),
      resourceId: resolvedId,
      resourceType: val.resourceType || val.type || section.selector,
      contentItemId: resolvedId,
      required: false,
      order: items.length,
      _addedAt: new Date().toISOString(),
    };
    onChange([...items, newItem]);
    setPickerValue(null);
    setPickerOpen(false);
  };

  const addCustom = () => {
    const labelText = window.prompt(`Add ${section.label}: title?`);
    if (!labelText) return;
    onChange([...items, {
      [section.labelField]: labelText,
      required: false,
      order: items.length,
      _addedAt: new Date().toISOString(),
    }]);
  };

  const removeAt = (idx) => {
    const next = items.slice();
    next.splice(idx, 1);
    // re-normalize order so it stays contiguous
    next.forEach((item, i) => { item.order = i; });
    onChange(next);
  };

  const moveUp = (idx) => {
    if (idx <= 0) return;
    const next = items.slice();
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    next.forEach((item, i) => { item.order = i; });
    onChange(next);
  };

  const moveDown = (idx) => {
    if (idx >= items.length - 1) return;
    const next = items.slice();
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    next.forEach((item, i) => { item.order = i; });
    onChange(next);
  };

  const toggleRequired = (idx) => {
    const updated = items.slice();
    const cur = updated[idx];
    const isRequired = !!(cur.required || cur.isRequiredContent);
    const next = !isRequired;
    updated[idx] = { ...cur, required: next, isRequiredContent: next };
    onChange(updated);
  };

  const editLabelAt = (idx) => {
    const cur = labelOf(items[idx]);
    const next = window.prompt('Edit title:', cur);
    if (next == null) return;
    const updated = items.slice();
    updated[idx] = { ...updated[idx], [section.labelField]: next };
    onChange(updated);
  };

  // Per-row "attach / re-link" — opens the picker scoped to a single item
  // and replaces its resourceId/contentItemId/resourceType in place.
  const [relinkIdx, setRelinkIdx] = useState(null);
  // ResourceSelector calls onChange(id, resource); we need the full resource object.
  const handleRelink = (id, resource) => {
    const val = resource || (id && typeof id === 'object' ? id : null);
    if (val == null && id == null) {
      setRelinkIdx(null);
      return;
    }
    const idx = relinkIdx;
    if (idx == null) return;
    const resolvedId = (val && (val.id || val.resourceId)) || (typeof id === 'string' ? id : '');
    const updated = items.slice();
    const cur = updated[idx] || {};
    updated[idx] = {
      ...cur,
      resourceId: resolvedId,
      contentItemId: resolvedId,
      resourceType: (val && (val.resourceType || val.type)) || cur.resourceType || section.selector,
      // Keep the existing label unless the row was an empty placeholder
      [section.labelField]: cur[section.labelField] || (val && (val.title || val.name || labelOf(val))) || cur[section.labelField],
    };
    onChange(updated);
    setRelinkIdx(null);
  };

  const isLinked = (item) => {
    const rid = (item?.resourceId || '').trim();
    const cid = (item?.contentItemId || '').trim();
    return Boolean(rid || cid);
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
          {items.map((item, idx) => {
            const isRequired = !!(item.required || item.isRequiredContent);
            return (
              <li key={`${section.key}-${idx}`} className="py-2 flex items-center gap-2">
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="p-0.5 text-slate-400 hover:text-corporate-teal disabled:opacity-20 disabled:cursor-not-allowed"
                    aria-label="Move up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(idx)}
                    disabled={idx === items.length - 1}
                    className="p-0.5 text-slate-400 hover:text-corporate-teal disabled:opacity-20 disabled:cursor-not-allowed"
                    aria-label="Move down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleRequired(idx)}
                  className={`p-1 rounded ${isRequired ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}
                  title={isRequired ? 'Required — click to make optional' : 'Optional — click to mark required'}
                  aria-label={isRequired ? 'Required' : 'Optional'}
                >
                  <Star className={`w-4 h-4 ${isRequired ? 'fill-current' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => editLabelAt(idx)}
                  className="flex-1 text-left text-sm text-corporate-navy dark:text-white hover:underline truncate"
                  title="Click to edit title"
                >
                  {labelOf(item)}
                  {isRequired && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      Required
                    </span>
                  )}
                </button>
                {item.resourceId ? (
                  <span
                    className="text-xs text-slate-400 truncate max-w-[150px]"
                    title={`${item.resourceType || 'ref'}: ${item.resourceId}`}
                  >
                    {item.resourceType || 'ref'}: {item.resourceId.slice(0, 8)}…
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"
                    title="No content attached — leaders will see an error if they click this item."
                  >
                    <AlertTriangle className="w-3.5 h-3.5" /> Not linked
                  </span>
                )}
                {relinkIdx === idx ? (
                  <div className="inline-flex items-center gap-1">
                    <ResourceSelector
                      value={null}
                      onChange={handleRelink}
                      resourceType={section.selector}
                    />
                    <button
                      type="button"
                      onClick={() => setRelinkIdx(null)}
                      className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRelinkIdx(idx)}
                    className="p-1 text-slate-400 hover:text-corporate-teal"
                    title={isLinked(item) ? 'Re-link to a different resource' : 'Attach a content_library resource'}
                    aria-label="Attach or re-link content"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
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
            );
          })}
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
        {section.key === 'contentItems' && (
          <ArtifactPickerButton items={items} onAdd={(item) => onChange([...items, item])} />
        )}
      </div>
    </div>
  );
};

// ---- Artifact picker ----
//
// Surfaces the three built-in "artifact" content items (Leader Profile,
// Skills Baseline, Identity Statement). Each can only be added once per
// phase. Completion is auto-derived in the user widgets — no checkbox.

const ArtifactPickerButton = ({ items, onAdd }) => {
  const [open, setOpen] = useState(false);
  const usedIds = new Set(items.map((it) => it.resourceId));
  const available = ARTIFACT_LIBRARY.filter((a) => !usedIds.has(a.id));

  const handlePick = (artifact) => {
    onAdd({
      contentItemLabel: artifact.title,
      resourceId: artifact.id,
      resourceType: 'artifact',
      contentItemId: artifact.id,
      required: false,
      order: items.length,
      _addedAt: new Date().toISOString(),
    });
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={available.length === 0}
        className="px-3 py-1.5 text-xs rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        title={available.length === 0 ? 'All artifacts already added' : 'Add Leader Profile, Baseline, or Identity Statement'}
      >
        <FileText className="w-3 h-3" /> Add artifact
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 flex-wrap">
      {available.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => handlePick(a)}
          className="px-2 py-1 text-xs rounded border border-amber-300 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
          title={a.description}
        >
          {a.title}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="px-2 py-1 text-xs rounded border border-slate-300 dark:border-slate-600"
      >
        Cancel
      </button>
    </div>
  );
};

// (StringListSection / MultiSelectSection removed May 2026 — Skills, Pillars,
// and session-type fields were never consumed by widgets and have been retired
// from the phase content schema.)

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
        contentItems: ensureArray(draft.contentItems),
        // Legacy fields explicitly cleared (May 2026 cleanup):
        actions: [],
        events: [],
        tools: [],
        workouts: [],
        coachingItems: [],
        communityItems: [],
        dailyReps: [],
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
        Use the arrows to reorder, and the <Star className="inline w-3.5 h-3.5 text-amber-500" /> star
        to mark items as <strong>Required</strong> — required items appear in the leader's
        kickoff to-do list at the top of their dashboard until completed.
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
        </>
      )}
    </Card>
  );
};

export default PhaseContentManager;
