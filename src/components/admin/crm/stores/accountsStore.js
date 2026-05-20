// src/components/admin/crm/stores/accountsStore.js
//
// Account = company-level CRM record. Aggregates contacts (corporate_prospects)
// and deals (crm_deals) by accountId. Created/updated alongside prospects via
// the migration script and account-creation flow.

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
import { extractDomain, normalizeCompanyName } from '../config/dealMeta';

const COLLECTION = 'crm_accounts';

export const useAccountsStore = create((set, get) => ({
  // State
  accounts: [],
  loading: true,
  error: null,
  selectedAccount: null,
  currentUserEmail: null,
  filters: {
    search: '',
    tier: 'all',
    owner: 'me',
  },

  setCurrentUser: (email) => set({ currentUserEmail: getCanonicalEmail(email) }),

  // Computed selectors
  getFilteredAccounts: () => {
    const { accounts, filters, currentUserEmail } = get();
    return accounts.filter((a) => {
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (
          !(
            a.name?.toLowerCase().includes(s) ||
            a.domain?.toLowerCase().includes(s) ||
            a.industry?.toLowerCase().includes(s)
          )
        ) {
          return false;
        }
      }
      if (filters.tier !== 'all' && a.tier !== filters.tier) return false;
      if (filters.owner === 'me') {
        if (!isSameUser(a.ownerEmail, currentUserEmail)) return false;
      } else if (filters.owner === 'unassigned') {
        if (a.ownerEmail) return false;
      } else if (filters.owner !== 'all' && filters.owner) {
        if (!isSameUser(a.ownerEmail, filters.owner)) return false;
      }
      return true;
    });
  },

  getAccountById: (id) => get().accounts.find((a) => a.id === id),

  // Find an existing account that matches by name or domain (case-insensitive,
  // suffix-stripped). Returns the account or null.
  findMatchingAccount: ({ name, domain }) => {
    const accounts = get().accounts;
    const normName = normalizeCompanyName(name);
    const normDomain = (domain || '').toLowerCase();
    return (
      accounts.find((a) => {
        if (normDomain && a.domain && a.domain.toLowerCase() === normDomain) {
          return true;
        }
        if (normName && normalizeCompanyName(a.name) === normName) return true;
        return false;
      }) || null
    );
  },

  // Actions
  setFilter: (key, value) =>
    set((state) => ({ filters: { ...state.filters, [key]: value } })),

  setSelectedAccount: (account) => set({ selectedAccount: account }),
  clearSelectedAccount: () => set({ selectedAccount: null }),

  // Firestore subscription
  subscribeToAccounts: () => {
    set({ loading: true });
    const q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const accounts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        set({ accounts, loading: false, error: null });
      },
      (error) => {
        console.error('Error fetching accounts:', error);
        set({ error: error.message, loading: false });
      }
    );
    return unsubscribe;
  },

  addAccount: async (data) => {
    const ownerEmail = data.ownerEmail
      ? getCanonicalEmail(data.ownerEmail)
      : null;
    const account = {
      name: data.name || 'Untitled Account',
      domain: data.domain || extractDomain(data.website || data.email || ''),
      industry: data.industry || '',
      employeeCount: data.employeeCount || null,
      website: data.website || '',
      location: data.location || '',
      linkedin: data.linkedin || '',
      description: data.description || '',
      tier: data.tier || 'standard',
      ownerEmail,
      tags: data.tags || [],
      contactCount: 0,
      openDealCount: 0,
      openDealValue: 0,
      lastActivityAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: data.createdBy || ownerEmail,
    };
    const docRef = await addDoc(collection(db, COLLECTION), account);
    return { id: docRef.id, ...account };
  },

  updateAccount: async (id, updates) => {
    const docRef = doc(db, COLLECTION, id);
    const normalized = { ...updates };
    if (updates.ownerEmail) {
      normalized.ownerEmail = getCanonicalEmail(updates.ownerEmail);
    }
    const updateData = { ...normalized, updatedAt: new Date().toISOString() };
    await updateDoc(docRef, updateData);
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, ...updateData } : a
      ),
      selectedAccount:
        state.selectedAccount?.id === id
          ? { ...state.selectedAccount, ...updateData }
          : state.selectedAccount,
    }));
  },

  deleteAccount: async (id) => {
    const { currentUserEmail } = get();
    if (!isAdmin(currentUserEmail)) {
      throw new Error('Only admins can delete accounts');
    }
    await deleteDoc(doc(db, COLLECTION, id));
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      selectedAccount:
        state.selectedAccount?.id === id ? null : state.selectedAccount,
    }));
  },
}));
