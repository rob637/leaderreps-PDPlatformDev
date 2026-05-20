// src/services/notificationActionsService.js
//
// Per-user inbox mutation helpers for the unified notifications redesign.
// All writes target `users/{uid}/notifications/{id}` — owner-scoped under
// existing wildcard Firestore rules.
//
// Behaviors:
//   markRead       — set read=true, stamp readAt. Idempotent.
//   markUnread     — set read=false, clear readAt.
//   markAllRead    — batched mark-read across an explicit id list.
//   snoozeUntil    — set snoozedUntil to a future timestamp; clears read so
//                    the item nags again when it surfaces.
//   snoozePreset   — convenience for '1h' | 'tomorrow' | 'nextWeek'.
//   dismiss        — set dismissedAt (soft delete). Honored by the hook.
//   undismiss      — clear dismissedAt (recovery).

import {
  doc, updateDoc, writeBatch, serverTimestamp, Timestamp,
} from 'firebase/firestore';

const notifRef = (db, uid, id) => doc(db, 'users', uid, 'notifications', id);

export const markRead = async (db, uid, id) => {
  if (!db || !uid || !id) return;
  await updateDoc(notifRef(db, uid, id), {
    read: true,
    readAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch((e) => console.warn('[notif] markRead failed', e?.message || e));
};

export const markUnread = async (db, uid, id) => {
  if (!db || !uid || !id) return;
  await updateDoc(notifRef(db, uid, id), {
    read: false,
    readAt: null,
    updatedAt: serverTimestamp(),
  }).catch((e) => console.warn('[notif] markUnread failed', e?.message || e));
};

export const markAllRead = async (db, uid, ids = []) => {
  if (!db || !uid || ids.length === 0) return;
  // Firestore batches are limited to 500 ops; chunk to be safe.
  for (let i = 0; i < ids.length; i += 400) {
    const slice = ids.slice(i, i + 400);
    const batch = writeBatch(db);
    slice.forEach((id) => {
      batch.update(notifRef(db, uid, id), {
        read: true,
        readAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit().catch((e) => console.warn('[notif] markAllRead chunk failed', e?.message || e));
  }
};

export const snoozeUntil = async (db, uid, id, when) => {
  if (!db || !uid || !id || !when) return;
  const ts = when instanceof Date ? Timestamp.fromDate(when) : Timestamp.fromMillis(when);
  await updateDoc(notifRef(db, uid, id), {
    snoozedUntil: ts,
    // When the snooze elapses we want the item to re-grab attention.
    read: false,
    readAt: null,
    updatedAt: serverTimestamp(),
  }).catch((e) => console.warn('[notif] snooze failed', e?.message || e));
};

export const snoozePresets = {
  '1h': () => new Date(Date.now() + 60 * 60 * 1000),
  tomorrow: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  },
  nextWeek: () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
    return d;
  },
};

export const snoozeBy = async (db, uid, id, preset) => {
  const fn = snoozePresets[preset];
  if (!fn) return;
  return snoozeUntil(db, uid, id, fn());
};

export const dismiss = async (db, uid, id) => {
  if (!db || !uid || !id) return;
  await updateDoc(notifRef(db, uid, id), {
    dismissedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch((e) => console.warn('[notif] dismiss failed', e?.message || e));
};

export const undismiss = async (db, uid, id) => {
  if (!db || !uid || !id) return;
  await updateDoc(notifRef(db, uid, id), {
    dismissedAt: null,
    updatedAt: serverTimestamp(),
  }).catch((e) => console.warn('[notif] undismiss failed', e?.message || e));
};

// Bulk dismiss — used by "Archive read" / "Dismiss all" in the slide-over
// panel. Batched the same way markAllRead is.
export const dismissMany = async (db, uid, ids = []) => {
  if (!db || !uid || ids.length === 0) return;
  for (let i = 0; i < ids.length; i += 400) {
    const slice = ids.slice(i, i + 400);
    const batch = writeBatch(db);
    slice.forEach((id) => {
      batch.update(notifRef(db, uid, id), {
        dismissedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    await batch.commit().catch((e) => console.warn('[notif] dismissMany chunk failed', e?.message || e));
  }
};

// ---------------------------------------------------------------------------
// Lightweight telemetry — stamps first-view and click timestamps on the
// per-user inbox doc itself so we don't need a new collection or new rules.
// `shownAt` / `clickedAt` are only ever set once (first occurrence wins) so
// the same row scrolling in/out of view doesn't double-count.
// ---------------------------------------------------------------------------

export const markShown = async (db, uid, id, alreadyShown = false) => {
  if (!db || !uid || !id || alreadyShown) return;
  await updateDoc(notifRef(db, uid, id), {
    shownAt: serverTimestamp(),
  }).catch((e) => console.warn('[notif] markShown failed', e?.message || e));
  notificationTelemetry.emit('notification_shown', { id });
};

export const recordClick = async (db, uid, id, alreadyClicked = false) => {
  if (!db || !uid || !id) return;
  if (!alreadyClicked) {
    await updateDoc(notifRef(db, uid, id), {
      clickedAt: serverTimestamp(),
    }).catch((e) => console.warn('[notif] recordClick failed', e?.message || e));
  }
  notificationTelemetry.emit('notification_clicked', { id });
};

// Tiny pub/sub so we can wire Google Analytics / Mixpanel later without
// touching call sites. For now it's a debug-only console log.
const DEBUG = typeof import.meta !== 'undefined'
  && import.meta.env?.VITE_ENABLE_DEBUG_MODE === 'true';

export const notificationTelemetry = {
  _handlers: [],
  on(handler) { this._handlers.push(handler); return () => { this._handlers = this._handlers.filter((h) => h !== handler); }; },
  emit(event, payload) {
    if (DEBUG) console.debug('[telemetry]', event, payload);
    this._handlers.forEach((h) => { try { h(event, payload); } catch { /* never throw */ } });
  },
};

