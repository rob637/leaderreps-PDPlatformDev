// src/services/contentMetricsService.js
//
// Content metrics — silent collection of opens/views/completions/coach-asks
// /shares per content piece, used later for social proof ("read by 143
// leaders", "completed by 89 leaders") and for an admin insight dashboard.
//
// Event-kind model:
//   - `open`       — content viewed.  Per-user-per-day dedup via id
//                     `${uid}_${YYYYMMDD}_open`. Drives `opens`.
//   - `first_open` — auto-fired alongside every `open`, with id
//                     `${uid}_first_open`. Per-user-forever dedup, so the
//                     trigger increments `uniqueOpens` exactly once per user.
//   - `complete`   — content marked complete.  Per-user-forever dedup via id
//                     `${uid}_complete`. Drives `completions` /
//                     `uniqueCompletions`.
//   - `coach_ask`  — AI coach question on this content.  No dedup
//                     (`${uid}_${YYYYMMDD}_${rand}_ask`). Drives `coachAsks`.
//   - `share`      — share link / mailto / copy.   No dedup
//                     (`${uid}_${YYYYMMDD}_${rand}_share`). Drives `shares`.
//
// Frontend responsibilities (this file):
//   - Fire-and-forget event writes (never throw, never block UI).
//   - Subscribe to a single aggregate doc (for SocialProofBadge).
//   - Admin reads/writes for the dashboard.
//
// Backend (`functions/index.js` → `aggregateContentMetricEvent`):
//   - Trigger on event create. Branch on `kind`. Increment counters,
//     including `byCohort.{cohortId}.{counter}` slices. Exclude admins.
//
// Data shape:
//   config/contentMetrics
//     { collectionEnabled: boolean, displayEnabled: boolean,
//       displayThreshold: number }
//
//   content_metrics/{contentId}
//     { contentId,
//       opens, uniqueOpens,
//       completions, uniqueCompletions,
//       coachAsks, shares,
//       firstOpenAt, lastOpenAt, lastEventAt,
//       displayPublicly: boolean,
//       bySurface: { [surfaceKey]: count },
//       byWeek:    { [YYYY-Www]:  count },
//       byCohort:  { [cohortId]:  { opens, uniqueOpens, completions } },
//       // optional admin-edited metadata for the dashboard:
//       label?: string, contentType?: string, route?: string }
//
//   content_metrics/{contentId}/events/{eventId}
//     { kind: 'open'|'first_open'|'complete'|'coach_ask'|'share',
//       userId, userEmail?, cohortId?, surface, ts (serverTimestamp),
//       processedAt?, excluded?, excludedReason? }

import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const COLLECTION = 'content_metrics';
const CONFIG_DOC_PATH = ['config', 'contentMetrics'];

const DEFAULT_CONFIG = Object.freeze({
  collectionEnabled: true,
  displayEnabled: false,
  displayThreshold: 25,
});

const todayYYYYMMDD = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
};

const safeContentId = (raw) => {
  if (typeof raw !== 'string') return null;
  // Firestore doc ids: no slashes, no empty, no '.'/'..'. Replace risky chars.
  const cleaned = raw.trim().replace(/[/.#$[\]]/g, '_');
  if (!cleaned || cleaned === '.' || cleaned === '..') return null;
  return cleaned.slice(0, 1500);
};

/**
 * Create a contentMetricsService bound to a Firestore `db`. Mirrors the shape
 * of other services in this codebase (factory function that closes over db).
 */
export const createContentMetricsService = (db) => {
  if (!db) {
    // Allow services to be constructed before db is ready; methods just no-op.
    return makeNoopService();
  }

  // -------------------------------------------------------------------------
  // Tracking — fire-and-forget event writers
  // -------------------------------------------------------------------------

  /**
   * Internal: write one event doc. Never throws. The Cloud Function trigger
   * does the aggregation; per-kind dedup is enforced by Firestore `create`
   * semantics on a deterministic doc id.
   */
  const writeEvent = async (kind, contentId, eventId, opts) => {
    try {
      const cid = safeContentId(contentId);
      if (!cid || !eventId) return;
      const ref = doc(db, COLLECTION, cid, 'events', eventId);
      await setDoc(ref, {
        kind,
        userId: opts.userId,
        userEmail: opts.userEmail || null,
        cohortId: opts.cohortId || null,
        surface: opts.surface || 'unknown',
        ts: serverTimestamp(),
      });
    } catch (_err) {
      // Expected on dedup (already-exists) or any other failure. Silent.
    }
  };

  const randomToken = () =>
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 6);

  /**
   * Record an open of a piece of content. Fire-and-forget — never throws,
   * never blocks the UI. Writes two events:
   *   - `${uid}_${YYYYMMDD}_open` → per-user-per-day dedup → drives `opens`.
   *   - `${uid}_first_open`       → per-user-forever dedup → drives
   *                                  `uniqueOpens` (true distinct users).
   *
   * @param {string} contentId       Stable id for the content piece.
   * @param {object} opts
   * @param {string} opts.userId     Required; auth uid of current user.
   * @param {string} [opts.userEmail] Optional; used by backend for admin
   *                                  exclusion (saves an admin auth lookup).
   * @param {string} [opts.cohortId] Optional cohort association.
   * @param {string} [opts.surface]  Where the open happened (e.g.
   *                                 'field-guide', 'video-player',
   *                                 'daily-practice'). Free-form label.
   */
  const trackOpen = async (contentId, opts = {}) => {
    const uid = opts.userId;
    if (!uid) return;
    const day = todayYYYYMMDD();
    // Both writes intentionally not awaited together — they're independent
    // and we want either to succeed even if the other fails.
    writeEvent('open', contentId, `${uid}_${day}_open`, opts);
    writeEvent('first_open', contentId, `${uid}_first_open`, opts);
  };

  /**
   * Record that a user marked the content complete. One-shot per user, ever.
   * Drives `completions` / `uniqueCompletions`.
   */
  const trackComplete = async (contentId, opts = {}) => {
    const uid = opts.userId;
    if (!uid) return;
    writeEvent('complete', contentId, `${uid}_complete`, opts);
  };

  /**
   * Record an AI coach question asked in the context of this content. No
   * dedup — every question counts. Drives `coachAsks`.
   */
  const trackCoachAsk = async (contentId, opts = {}) => {
    const uid = opts.userId;
    if (!uid) return;
    const id = `${uid}_${todayYYYYMMDD()}_${randomToken()}_ask`;
    writeEvent('coach_ask', contentId, id, opts);
  };

  /**
   * Record that a user shared this content (copy link, mailto, etc).
   * No dedup. Drives `shares`.
   */
  const trackShare = async (contentId, opts = {}) => {
    const uid = opts.userId;
    if (!uid) return;
    const id = `${uid}_${todayYYYYMMDD()}_${randomToken()}_share`;
    writeEvent('share', contentId, id, opts);
  };

  // -------------------------------------------------------------------------
  // Reads — public-ish (any authed user)
  // -------------------------------------------------------------------------

  const getAggregate = async (contentId) => {
    const cid = safeContentId(contentId);
    if (!cid) return null;
    try {
      const snap = await getDoc(doc(db, COLLECTION, cid));
      return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    } catch (_err) {
      return null;
    }
  };

  const subscribeAggregate = (contentId, callback) => {
    const cid = safeContentId(contentId);
    if (!cid || typeof callback !== 'function') return () => {};
    try {
      return onSnapshot(
        doc(db, COLLECTION, cid),
        (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
        () => callback(null)
      );
    } catch (_err) {
      return () => {};
    }
  };

  const getConfig = async () => {
    try {
      const snap = await getDoc(doc(db, ...CONFIG_DOC_PATH));
      if (!snap.exists()) return { ...DEFAULT_CONFIG };
      const data = snap.data() || {};
      return {
        collectionEnabled: data.collectionEnabled !== false,
        displayEnabled: !!data.displayEnabled,
        displayThreshold:
          typeof data.displayThreshold === 'number'
            ? data.displayThreshold
            : DEFAULT_CONFIG.displayThreshold,
      };
    } catch (_err) {
      return { ...DEFAULT_CONFIG };
    }
  };

  const subscribeConfig = (callback) => {
    if (typeof callback !== 'function') return () => {};
    try {
      return onSnapshot(
        doc(db, ...CONFIG_DOC_PATH),
        (snap) => {
          if (!snap.exists()) {
            callback({ ...DEFAULT_CONFIG });
            return;
          }
          const data = snap.data() || {};
          callback({
            collectionEnabled: data.collectionEnabled !== false,
            displayEnabled: !!data.displayEnabled,
            displayThreshold:
              typeof data.displayThreshold === 'number'
                ? data.displayThreshold
                : DEFAULT_CONFIG.displayThreshold,
          });
        },
        () => callback({ ...DEFAULT_CONFIG })
      );
    } catch (_err) {
      return () => {};
    }
  };

  // -------------------------------------------------------------------------
  // Admin operations
  // -------------------------------------------------------------------------

  const listAllAggregates = async () => {
    try {
      const q = query(collection(db, COLLECTION), orderBy('opens', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      // Falling back without orderBy in case some docs lack the field.
      try {
        const snap = await getDocs(collection(db, COLLECTION));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (_err) {
        throw err;
      }
    }
  };

  const setDisplayPublicly = async (contentId, value) => {
    const cid = safeContentId(contentId);
    if (!cid) return;
    await updateDoc(doc(db, COLLECTION, cid), {
      displayPublicly: !!value,
      displayUpdatedAt: serverTimestamp(),
    });
  };

  const updateMetricMetadata = async (contentId, patch) => {
    const cid = safeContentId(contentId);
    if (!cid || !patch || typeof patch !== 'object') return;
    const allowed = {};
    if (typeof patch.label === 'string') allowed.label = patch.label;
    if (typeof patch.contentType === 'string') allowed.contentType = patch.contentType;
    if (typeof patch.route === 'string') allowed.route = patch.route;
    if (Object.keys(allowed).length === 0) return;
    await setDoc(
      doc(db, COLLECTION, cid),
      { ...allowed, updatedAt: serverTimestamp() },
      { merge: true }
    );
  };

  const bulkEnableDisplay = async (contentIds = []) => {
    if (!Array.isArray(contentIds) || contentIds.length === 0) return 0;
    const batch = writeBatch(db);
    let count = 0;
    contentIds.forEach((rawId) => {
      const cid = safeContentId(rawId);
      if (!cid) return;
      batch.set(
        doc(db, COLLECTION, cid),
        { displayPublicly: true, displayUpdatedAt: serverTimestamp() },
        { merge: true }
      );
      count += 1;
    });
    if (count === 0) return 0;
    await batch.commit();
    return count;
  };

  const saveConfig = async (next) => {
    const safe = {};
    if (typeof next.collectionEnabled === 'boolean')
      safe.collectionEnabled = next.collectionEnabled;
    if (typeof next.displayEnabled === 'boolean')
      safe.displayEnabled = next.displayEnabled;
    if (typeof next.displayThreshold === 'number' && next.displayThreshold >= 0)
      safe.displayThreshold = Math.floor(next.displayThreshold);
    if (Object.keys(safe).length === 0) return;
    safe.updatedAt = serverTimestamp();
    await setDoc(doc(db, ...CONFIG_DOC_PATH), safe, { merge: true });
  };

  return {
    DEFAULT_CONFIG,
    trackOpen,
    trackComplete,
    trackCoachAsk,
    trackShare,
    getAggregate,
    subscribeAggregate,
    getConfig,
    subscribeConfig,
    // Admin:
    listAllAggregates,
    setDisplayPublicly,
    updateMetricMetadata,
    bulkEnableDisplay,
    saveConfig,
  };
};

const makeNoopService = () => ({
  DEFAULT_CONFIG,
  trackOpen: async () => {},
  trackComplete: async () => {},
  trackCoachAsk: async () => {},
  trackShare: async () => {},
  getAggregate: async () => null,
  subscribeAggregate: () => () => {},
  getConfig: async () => ({ ...DEFAULT_CONFIG }),
  subscribeConfig: () => () => {},
  listAllAggregates: async () => [],
  setDisplayPublicly: async () => {},
  updateMetricMetadata: async () => {},
  bulkEnableDisplay: async () => 0,
  saveConfig: async () => {},
});

export default createContentMetricsService;
