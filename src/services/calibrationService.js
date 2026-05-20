// src/services/calibrationService.js
//
// Rep Calibration L1 — storage + read helpers for trainer side-by-side
// rating of completed reps against the engine's automated assessment.
//
// Collection: `rep_calibrations/{calibrationId}` (top-level, admin-only).
// Document id = `${userId}__${repId}` so re-opening the same rep idempotently
// upserts the same calibration row.
//
// Schema:
//   repId, userId, userEmail?, repType, cohortId?, trainerId,
//   trainerEmail, engineScore (0-100 or null), enginePassed (bool|null),
//   trainerScore (1-5), trainerPassed (bool), delta (engineScore -
//   trainerScore-scaled, optional), dimensionScores (object of rubricId ->
//   1-5), feedback (string), tags (string[]), status ('draft'|'submitted'),
//   createdAt, updatedAt.
//
// L1 is storage + UI; L2 (few-shot prompt injection into evaluateRep
// scorer) is gated behind `config/features.calibrationFewShot.enabled` and
// activates once a rep type has ≥10 submitted calibrations. L3 (per-
// dimension bias correction) is future work.
//
// adminReview block (Slice 1):
// Whenever a trainer submits a calibration, we ALSO merge a small
// `adminReview` block onto the rep doc itself (`users/{uid}/conditioning_reps/{repId}`
// and best-effort `users/{uid}/reps_light/{repId}`). This is what the leader
// sees in their rep history when a trainer has reviewed their AI verdict
// and (optionally) overridden it or added a personal note.

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

const COLLECTION = 'rep_calibrations';
const REP_PATHS = ['conditioning_reps', 'reps_light'];

const calId = (userId, repId) => `${userId}__${repId}`;

/**
 * List recent reps across all users in a cohort, suitable for the trainer
 * calibration queue. Uses collectionGroup query on conditioning_reps and
 * filters in memory (volumes are small — single cohort, recent window).
 * Returns the most recent `limitCount` reps not yet calibrated first, then
 * the rest.
 */
export const listReps = async (db, { cohortId = null, limitCount = 50 } = {}) => {
  if (!db) return [];
  const repsQ = query(
    collectionGroup(db, 'conditioning_reps'),
    orderBy('updatedAt', 'desc'),
    limit(limitCount * 2), // overscan; we'll filter
  );
  const snap = await getDocs(repsQ);
  const reps = [];
  snap.forEach((d) => {
    const data = d.data();
    // Path is users/{uid}/conditioning_reps/{repId}
    const segs = d.ref.path.split('/');
    if (segs.length !== 4 || segs[0] !== 'users') return;
    const userId = segs[1];
    if (cohortId && data.cohortId !== cohortId) return;
    // Only completed reps with an engine assessment are calibratable.
    if (!data.qualityAssessment) return;
    reps.push({
      id: d.id,
      userId,
      repType: data.repType,
      cohortId: data.cohortId || null,
      status: data.status,
      updatedAt: data.updatedAt || null,
      engineScore: typeof data.qualityAssessment?.score === 'number'
        ? data.qualityAssessment.score
        : null,
      enginePassed: typeof data.qualityAssessment?.meetsStandard === 'boolean'
        ? data.qualityAssessment.meetsStandard
        : null,
      engineSummary: data.qualityAssessment?.feedback || data.qualityAssessment?.summary || '',
      situationContext: data.context?.situation || data.situation || '',
    });
  });
  return reps.slice(0, limitCount);
};

export const getCalibration = async (db, userId, repId) => {
  if (!db || !userId || !repId) return null;
  const snap = await getDoc(doc(db, COLLECTION, calId(userId, repId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * Upsert a calibration row. `payload` should include trainerScore,
 * dimensionScores, feedback, tags, status. The trainer + rep identifiers
 * are passed separately to keep the call site explicit.
 */
export const saveCalibration = async (db, {
  userId,
  repId,
  repType,
  cohortId = null,
  engineScore = null,
  enginePassed = null,
  trainerId,
  trainerEmail = null,
  trainerScore,
  trainerPassed,
  dimensionScores = {},
  feedback = '',
  tags = [],
  status = 'submitted',
  // adminReview fields (Slice 1) — written back to the rep doc so leaders
  // can see when a trainer has reviewed their AI verdict.
  aiAccuracy = null,            // 'correct' | 'partial' | 'incorrect' | null
  correctedResult = null,       // 'pass' | 'notYet' | null  (null = AI stands)
  trainerNote = '',             // public-facing note to the leader
  shareWithLeader = true,       // if false, adminReview is internal only
}) => {
  if (!db || !userId || !repId || !trainerId) {
    throw new Error('saveCalibration: missing required ids');
  }
  const id = calId(userId, repId);
  const ref = doc(db, COLLECTION, id);
  const existing = await getDoc(ref);
  // engineScore is 0-100; trainerScore is 1-5. Normalize trainer to 0-100
  // for an apples-to-apples delta (engine - trainer_scaled).
  const trainerScaled = typeof trainerScore === 'number' ? ((trainerScore - 1) / 4) * 100 : null;
  const delta = (typeof engineScore === 'number' && typeof trainerScaled === 'number')
    ? Math.round(engineScore - trainerScaled)
    : null;
  const payload = {
    repId,
    userId,
    repType: repType || null,
    cohortId,
    engineScore,
    enginePassed,
    trainerId,
    trainerEmail,
    trainerScore: typeof trainerScore === 'number' ? trainerScore : null,
    trainerPassed: !!trainerPassed,
    delta,
    dimensionScores,
    feedback,
    tags,
    status,
    aiAccuracy,
    correctedResult,
    trainerNote,
    shareWithLeader: !!shareWithLeader,
    updatedAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
  };
  await setDoc(ref, payload, { merge: true });

  // Slice 1: merge adminReview onto the rep doc (best-effort across both
  // possible rep paths). Only written when status === 'submitted' so that
  // draft calibrations don't leak partial reviews to leaders.
  if (status === 'submitted') {
    const adminReview = {
      reviewed: true,
      aiAccuracy: aiAccuracy || null,
      correctedResult: correctedResult || null,
      trainerNote: typeof trainerNote === 'string' ? trainerNote : '',
      shareWithLeader: !!shareWithLeader,
      trainerId,
      trainerEmail,
      reviewedAt: serverTimestamp(),
      calibrationId: id,
    };
    await Promise.all(
      REP_PATHS.map(async (path) => {
        try {
          const repRef = doc(db, 'users', userId, path, repId);
          const repSnap = await getDoc(repRef);
          if (repSnap.exists()) {
            await setDoc(repRef, { adminReview }, { merge: true });
          }
        } catch (err) {
          // Best-effort; the calibration row is the source of truth.
          console.warn(`[calibrationService] adminReview merge failed (${path}):`, err?.message);
        }
      })
    );
  }

  return { id, ...payload };
};

/**
 * Per-rep-type calibration stats — used to decide when L2 (few-shot prompt
 * injection) is worth turning on. Returns
 *   { [repType]: { count, avgEngine, avgTrainer, avgDelta, passRateEngine,
 *                  passRateTrainer, tagCounts, accuracyCounts, overrideCount,
 *                  lastUpdated } }
 */
export const getCalibrationStats = async (db) => {
  if (!db) return {};
  const snap = await getDocs(query(collection(db, COLLECTION), where('status', '==', 'submitted')));
  const byType = {};
  snap.forEach((d) => {
    const c = d.data();
    const t = c.repType || 'unknown';
    if (!byType[t]) {
      byType[t] = {
        count: 0,
        engineSum: 0, engineN: 0,
        trainerSum: 0, trainerN: 0,
        deltaSum: 0, deltaN: 0,
        engineTrue: 0, engineBoolN: 0,
        trainerTrue: 0, trainerBoolN: 0,
        tagCounts: {},
        accuracyCounts: { correct: 0, partial: 0, incorrect: 0 },
        overrideCount: 0,
        lastUpdated: null,
      };
    }
    const b = byType[t];
    b.count += 1;
    if (typeof c.engineScore === 'number') { b.engineSum += c.engineScore; b.engineN += 1; }
    if (typeof c.trainerScore === 'number') { b.trainerSum += c.trainerScore; b.trainerN += 1; }
    if (typeof c.delta === 'number') { b.deltaSum += c.delta; b.deltaN += 1; }
    if (typeof c.enginePassed === 'boolean') { b.engineTrue += c.enginePassed ? 1 : 0; b.engineBoolN += 1; }
    if (typeof c.trainerPassed === 'boolean') { b.trainerTrue += c.trainerPassed ? 1 : 0; b.trainerBoolN += 1; }
    if (Array.isArray(c.tags)) {
      c.tags.forEach((tag) => { b.tagCounts[tag] = (b.tagCounts[tag] || 0) + 1; });
    }
    if (c.aiAccuracy && b.accuracyCounts[c.aiAccuracy] != null) {
      b.accuracyCounts[c.aiAccuracy] += 1;
    }
    if (c.correctedResult) b.overrideCount += 1;
    const ts = c.updatedAt?.toMillis ? c.updatedAt.toMillis() : null;
    if (ts && (!b.lastUpdated || ts > b.lastUpdated)) b.lastUpdated = ts;
  });
  const out = {};
  Object.entries(byType).forEach(([t, b]) => {
    out[t] = {
      count: b.count,
      avgEngine: b.engineN ? Math.round(b.engineSum / b.engineN) : null,
      avgTrainer: b.trainerN ? Math.round((b.trainerSum / b.trainerN) * 10) / 10 : null,
      avgDelta: b.deltaN ? Math.round(b.deltaSum / b.deltaN) : null,
      passRateEngine: b.engineBoolN ? Math.round((b.engineTrue / b.engineBoolN) * 100) : null,
      passRateTrainer: b.trainerBoolN ? Math.round((b.trainerTrue / b.trainerBoolN) * 100) : null,
      tagCounts: b.tagCounts,
      accuracyCounts: b.accuracyCounts,
      overrideCount: b.overrideCount,
      lastUpdated: b.lastUpdated,
    };
  });
  return out;
};

/**
 * Read the few-shot feature flag from `config/features.calibrationFewShot`.
 * Returns { enabled: boolean, maxExamples: number }.
 */
export const getFewShotFlag = async (db) => {
  if (!db) return { enabled: false, maxExamples: 3 };
  try {
    const snap = await getDoc(doc(db, 'config', 'features'));
    const data = snap.exists() ? snap.data() : null;
    const f = data && data.calibrationFewShot;
    return {
      enabled: !!(f && f.enabled),
      maxExamples: (f && Number(f.maxExamples)) || 3,
    };
  } catch {
    return { enabled: false, maxExamples: 3 };
  }
};

/**
 * Toggle the few-shot feature flag. Admin-only (enforced by firestore.rules
 * on the config collection).
 */
export const setFewShotFlag = async (db, { enabled, maxExamples = 3 }) => {
  if (!db) throw new Error('setFewShotFlag: db required');
  await setDoc(
    doc(db, 'config', 'features'),
    {
      calibrationFewShot: {
        enabled: !!enabled,
        maxExamples: Math.max(1, Math.min(5, Number(maxExamples) || 3)),
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
  return { enabled: !!enabled, maxExamples };
};

/**
 * Admin scorer addendum (Slice 4) — free-form per-rrType rubric guidance
 * that gets appended to the scorer's user prompt at evaluation time. Stored
 * at `metadata/conditioning/rrAddendums/{rrType}`. Admin-only writes
 * (firestore.rules `metadata/{document=**}`), public reads.
 */
const ADDENDUM_PATH = (rrType) => ['metadata', 'conditioning', 'rrAddendums', rrType];

export const getRrAddendum = async (db, rrType) => {
  if (!db || !rrType) return { text: '', updatedAt: null, updatedBy: null };
  try {
    const snap = await getDoc(doc(db, ...ADDENDUM_PATH(rrType)));
    if (!snap.exists()) return { text: '', updatedAt: null, updatedBy: null };
    const d = snap.data() || {};
    return {
      text: typeof d.text === 'string' ? d.text : '',
      updatedAt: d.updatedAt || null,
      updatedBy: d.updatedBy || null,
      version: d.version || 0,
    };
  } catch {
    return { text: '', updatedAt: null, updatedBy: null };
  }
};

export const setRrAddendum = async (db, rrType, { text = '', trainerId, trainerEmail }) => {
  if (!db) throw new Error('setRrAddendum: db required');
  if (!rrType) throw new Error('setRrAddendum: rrType required');
  const ref = doc(db, ...ADDENDUM_PATH(rrType));
  const prev = await getDoc(ref);
  const version = (prev.exists() && Number(prev.data()?.version)) || 0;
  await setDoc(
    ref,
    {
      text: String(text || '').slice(0, 4000),
      updatedAt: serverTimestamp(),
      updatedBy: trainerEmail || trainerId || null,
      version: version + 1,
    },
    { merge: true }
  );
  return { ok: true, version: version + 1 };
};

export default {
  listReps,
  getCalibration,
  saveCalibration,
  getCalibrationStats,
  getFewShotFlag,
  setFewShotFlag,
  getRrAddendum,
  setRrAddendum,
};
