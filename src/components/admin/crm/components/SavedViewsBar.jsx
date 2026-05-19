/**
 * SavedViewsBar — chips of saved filter presets for ProspectsPage.
 *
 * Reads/writes the saved views store (localStorage-backed) and operates on
 * the shared prospects filter state. Saving captures the current filters
 * + viewMode; selecting a chip applies them. Long-press or × removes.
 */

import React, { useState } from 'react';
import { Bookmark, Plus, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

import { useSavedViewsStore } from '../stores/savedViewsStore';
import { useProspectsStore } from '../stores/prospectsStore';

const SavedViewsBar = () => {
  const { views, activeViewId, setActiveViewId, addView, removeView } =
    useSavedViewsStore();
  const filters = useProspectsStore((s) => s.filters);
  const viewMode = useProspectsStore((s) => s.viewMode);
  const setFilter = useProspectsStore((s) => s.setFilter);
  const setViewMode = useProspectsStore((s) => s.setViewMode);

  const [showSaveInput, setShowSaveInput] = useState(false);
  const [name, setName] = useState('');

  const applyView = (view) => {
    if (!view) return;
    Object.entries(view.filters || {}).forEach(([k, v]) => setFilter(k, v));
    if (view.viewMode) setViewMode(view.viewMode);
    setActiveViewId(view.id);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const v = addView({ name, filters, viewMode });
    if (v) {
      toast.success(`Saved view "${v.name}"`);
      setName('');
      setShowSaveInput(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Bookmark className="w-4 h-4 text-slate-400" />
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        Saved Views
      </span>

      {views.length === 0 && !showSaveInput && (
        <span className="text-xs text-slate-400 italic">
          No saved views yet
        </span>
      )}

      {views.map((v) => {
        const isActive = v.id === activeViewId;
        return (
          <span
            key={v.id}
            className={`inline-flex items-center gap-1 rounded-full text-xs border transition ${
              isActive
                ? 'bg-corporate-teal/10 border-corporate-teal text-corporate-teal'
                : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            <button
              onClick={() => applyView(v)}
              className="pl-3 pr-1 py-1 truncate max-w-[160px]"
              title={v.name}
            >
              {isActive && <Check className="w-3 h-3 inline mr-1" />}
              {v.name}
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete saved view "${v.name}"?`))
                  removeView(v.id);
              }}
              className="pr-2 pl-0.5 py-1 text-slate-400 hover:text-red-500"
              title="Delete view"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        );
      })}

      {showSaveInput ? (
        <div className="flex items-center gap-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') {
                setShowSaveInput(false);
                setName('');
              }
            }}
            placeholder="View name…"
            autoFocus
            className="px-2 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-corporate-teal/40"
          />
          <button
            onClick={handleSave}
            className="px-2 py-1 text-xs bg-corporate-teal text-white rounded hover:bg-corporate-teal/90"
          >
            Save
          </button>
          <button
            onClick={() => {
              setShowSaveInput(false);
              setName('');
            }}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowSaveInput(true)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:text-slate-700 hover:border-slate-400 transition"
          title="Save current filters as a view"
        >
          <Plus className="w-3 h-3" />
          Save current
        </button>
      )}
    </div>
  );
};

export default SavedViewsBar;
