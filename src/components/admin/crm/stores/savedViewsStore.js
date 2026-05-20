/**
 * Saved Views Store
 *
 * Per-user saved filter sets for ProspectsPage. Persisted to localStorage —
 * lightweight, no Firestore dependency. Each view captures the current
 * filters object plus an optional viewMode.
 *
 * Schema:
 *   {
 *     id: string,
 *     name: string,
 *     filters: { search, stage, owner, ... },
 *     viewMode: 'list' | 'kanban' | null,
 *     createdAt: ISO string
 *   }
 */

import { create } from 'zustand';

const STORAGE_KEY = 'crm_saved_views_v1';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persist(views) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch {
    /* ignore quota errors */
  }
}

export const useSavedViewsStore = create((set, get) => ({
  views: loadFromStorage(),
  activeViewId: null,

  setActiveViewId: (id) => set({ activeViewId: id }),

  addView: ({ name, filters, viewMode = null }) => {
    if (!name || !name.trim()) return null;
    const id = `sv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const view = {
      id,
      name: name.trim(),
      filters: { ...filters },
      viewMode,
      createdAt: new Date().toISOString(),
    };
    const next = [...get().views, view];
    persist(next);
    set({ views: next, activeViewId: id });
    return view;
  },

  removeView: (id) => {
    const next = get().views.filter((v) => v.id !== id);
    persist(next);
    const activeViewId = get().activeViewId === id ? null : get().activeViewId;
    set({ views: next, activeViewId });
  },

  renameView: (id, name) => {
    const next = get().views.map((v) =>
      v.id === id ? { ...v, name: name.trim() || v.name } : v
    );
    persist(next);
    set({ views: next });
  },

  getView: (id) => get().views.find((v) => v.id === id) || null,
}));
