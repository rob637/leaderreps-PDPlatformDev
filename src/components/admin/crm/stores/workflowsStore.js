/**
 * crm_workflows — automation rules.
 *
 * Schema:
 *   name: string
 *   enabled: boolean
 *   trigger: {
 *     type: 'on_stage_change' | 'on_deal_created' | 'on_no_activity'
 *     params: {
 *       fromStage?: string, toStage?: string,
 *       daysSinceActivity?: number,
 *     }
 *   }
 *   action: {
 *     type: 'create_task' | 'notify' | 'set_field'
 *     params: {
 *       title?: string, dueInDays?: number, assignToOwner?: boolean,
 *       message?: string, recipientField?: 'ownerEmail' | string,
 *       field?: string, value?: any,
 *     }
 *   }
 *   createdAt, updatedAt, createdBy
 *
 * Rule evaluation lives in the Cloud Function `crmWorkflowDispatcher`.
 */

import { create } from 'zustand';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

const COLLECTION = 'crm_workflows';

export const TRIGGER_TYPES = [
  { id: 'on_stage_change', label: 'When deal stage changes' },
  { id: 'on_deal_created', label: 'When a new deal is created' },
  { id: 'on_no_activity', label: 'When no activity for N days' },
];

export const ACTION_TYPES = [
  { id: 'create_task', label: 'Create a task' },
  { id: 'notify', label: 'Send in-app notification' },
  { id: 'set_field', label: 'Set a field on the record' },
];

export const useWorkflowsStore = create((set) => ({
  workflows: [],
  loading: false,
  error: null,

  subscribeToWorkflows: () => {
    set({ loading: true });
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        set({
          workflows: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
          loading: false,
        });
      },
      (error) => set({ error: error.message, loading: false })
    );
  },

  addWorkflow: async (data) =>
    addDoc(collection(db, COLLECTION), {
      enabled: true,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),

  updateWorkflow: async (id, updates) =>
    updateDoc(doc(db, COLLECTION, id), {
      ...updates,
      updatedAt: new Date().toISOString(),
    }),

  toggleWorkflow: async (id, enabled) =>
    updateDoc(doc(db, COLLECTION, id), {
      enabled,
      updatedAt: new Date().toISOString(),
    }),

  deleteWorkflow: async (id) => deleteDoc(doc(db, COLLECTION, id)),
}));
