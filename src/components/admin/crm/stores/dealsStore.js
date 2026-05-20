// src/components/admin/crm/stores/dealsStore.js
//
// Deal = revenue opportunity tied to an account + primary contact. Drives
// pipeline forecasting, win-rate analytics, and activity rollups.

import { create } from 'zustand';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCanonicalEmail, isSameUser, isAdmin } from '../config/team';
import {
  DEAL_STAGES,
  OPEN_DEAL_STAGES,
  CLOSED_DEAL_STAGES,
  getDealStage,
} from '../config/dealMeta';

const COLLECTION = 'crm_deals';

export const useDealsStore = create((set, get) => ({
  // State
  deals: [],
  loading: true,
  error: null,
  selectedDeal: null,
  currentUserEmail: null,
  filters: {
    search: '',
    stage: 'all',
    owner: 'me',
    accountId: null, // when set, scope to a single account
  },

  setCurrentUser: (email) => set({ currentUserEmail: getCanonicalEmail(email) }),

  // Computed selectors
  getFilteredDeals: () => {
    const { deals, filters, currentUserEmail } = get();
    return deals.filter((d) => {
      if (filters.accountId && d.accountId !== filters.accountId) return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!(d.name?.toLowerCase().includes(s))) return false;
      }
      if (filters.stage === 'open') {
        if (!OPEN_DEAL_STAGES.includes(d.stage)) return false;
      } else if (filters.stage === 'closed') {
        if (!CLOSED_DEAL_STAGES.includes(d.stage)) return false;
      } else if (filters.stage !== 'all' && d.stage !== filters.stage) {
        return false;
      }
      if (filters.owner === 'me') {
        if (!isSameUser(d.ownerEmail, currentUserEmail)) return false;
      } else if (filters.owner === 'unassigned') {
        if (d.ownerEmail) return false;
      } else if (filters.owner !== 'all' && filters.owner) {
        if (!isSameUser(d.ownerEmail, filters.owner)) return false;
      }
      return true;
    });
  },

  getDealsByAccount: (accountId) =>
    get().deals.filter((d) => d.accountId === accountId),

  getDealsByContact: (contactId) =>
    get().deals.filter((d) => d.primaryContactId === contactId),

  getOpenDeals: () =>
    get().deals.filter((d) => OPEN_DEAL_STAGES.includes(d.stage)),

  // Forecast helpers
  getPipelineValue: () =>
    get()
      .getOpenDeals()
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0),

  getWeightedForecast: () =>
    get()
      .getOpenDeals()
      .reduce(
        (sum, d) =>
          sum + ((Number(d.amount) || 0) * (Number(d.probability) || 0)) / 100,
        0
      ),

  // Actions
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  setSelectedDeal: (deal) => set({ selectedDeal: deal }),
  clearSelectedDeal: () => set({ selectedDeal: null }),

  // Firestore subscription
  subscribeToDeals: () => {
    set({ loading: true });
    const q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const deals = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        set({ deals, loading: false, error: null });
      },
      (error) => {
        console.error('Error fetching deals:', error);
        set({ error: error.message, loading: false });
      }
    );
    return unsubscribe;
  },

  addDeal: async (data) => {
    const ownerEmail = data.ownerEmail
      ? getCanonicalEmail(data.ownerEmail)
      : null;
    const stage = data.stage || 'prospect';
    const stageInfo = getDealStage(stage);
    const deal = {
      name: data.name || 'Untitled Deal',
      accountId: data.accountId || null,
      primaryContactId: data.primaryContactId || null,
      stage,
      amount: Number(data.amount) || 0,
      probability:
        data.probability != null ? Number(data.probability) : stageInfo.probability,
      closeDate: data.closeDate || null,
      ownerEmail,
      source: data.source || '',
      description: data.description || '',
      lostReason: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      closedAt: CLOSED_DEAL_STAGES.includes(stage)
        ? new Date().toISOString()
        : null,
      createdBy: data.createdBy || ownerEmail,
    };
    const docRef = await addDoc(collection(db, COLLECTION), deal);
    return { id: docRef.id, ...deal };
  },

  updateDeal: async (id, updates) => {
    const docRef = doc(db, COLLECTION, id);
    const current = get().deals.find((d) => d.id === id);
    const normalized = { ...updates };
    if (updates.ownerEmail) {
      normalized.ownerEmail = getCanonicalEmail(updates.ownerEmail);
    }
    // Auto-update probability when stage changes (unless caller overrides)
    if (
      updates.stage &&
      updates.stage !== current?.stage &&
      updates.probability == null
    ) {
      normalized.probability = getDealStage(updates.stage).probability;
    }
    // Stamp closedAt when transitioning into a closed stage
    if (
      updates.stage &&
      CLOSED_DEAL_STAGES.includes(updates.stage) &&
      (!current?.closedAt || !CLOSED_DEAL_STAGES.includes(current?.stage))
    ) {
      normalized.closedAt = new Date().toISOString();
    }
    const updateData = { ...normalized, updatedAt: new Date().toISOString() };
    await updateDoc(docRef, updateData);
    set((state) => ({
      deals: state.deals.map((d) => (d.id === id ? { ...d, ...updateData } : d)),
      selectedDeal:
        state.selectedDeal?.id === id
          ? { ...state.selectedDeal, ...updateData }
          : state.selectedDeal,
    }));
  },

  updateDealStage: async (id, newStage) => get().updateDeal(id, { stage: newStage }),

  deleteDeal: async (id) => {
    const { currentUserEmail } = get();
    if (!isAdmin(currentUserEmail)) {
      throw new Error('Only admins can delete deals');
    }
    await deleteDoc(doc(db, COLLECTION, id));
    set((state) => ({
      deals: state.deals.filter((d) => d.id !== id),
      selectedDeal:
        state.selectedDeal?.id === id ? null : state.selectedDeal,
    }));
  },
}));

// Re-export stage metadata for convenience
export { DEAL_STAGES, OPEN_DEAL_STAGES, CLOSED_DEAL_STAGES };
