/**
 * crm_notifications — per-user inbox.
 *
 * Schema:
 *   recipientEmail: string (canonical lowercase)
 *   type: 'workflow' | 'mention' | 'task' | 'system'
 *   title: string
 *   message: string
 *   link: { tab: 'prospects'|'tasks'|..., entityId?: string } | null
 *   read: boolean
 *   createdAt: ISO string
 *   createdBy: string ('system' for CF-generated)
 */

import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCanonicalEmail } from '../config/team';

const COLLECTION = 'crm_notifications';

export const useNotificationsStore = create((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  currentUserEmail: null,

  setCurrentUser: (email) => set({ currentUserEmail: getCanonicalEmail(email) }),

  subscribeToNotifications: (userEmail, max = 50) => {
    if (!userEmail) return () => {};
    const canonical = getCanonicalEmail(userEmail);
    set({ loading: true, currentUserEmail: canonical });
    const q = query(
      collection(db, COLLECTION),
      where('recipientEmail', '==', canonical),
      orderBy('createdAt', 'desc'),
      limit(max)
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        set({ notifications, loading: false });
      },
      (error) => {
        console.error('Error fetching notifications:', error);
        set({ error: error.message, loading: false });
      }
    );
    return unsubscribe;
  },

  getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

  addNotification: async ({ recipientEmail, type, title, message, link = null }) => {
    const canonical = getCanonicalEmail(recipientEmail);
    return addDoc(collection(db, COLLECTION), {
      recipientEmail: canonical,
      type,
      title,
      message: message || '',
      link,
      read: false,
      createdAt: new Date().toISOString(),
      createdBy: get().currentUserEmail || 'system',
    });
  },

  markAsRead: async (id) => {
    await updateDoc(doc(db, COLLECTION, id), { read: true });
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllAsRead: async () => {
    const email = get().currentUserEmail;
    if (!email) return;
    const q = query(
      collection(db, COLLECTION),
      where('recipientEmail', '==', email),
      where('read', '==', false),
      limit(200)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
    await batch.commit();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
}));
