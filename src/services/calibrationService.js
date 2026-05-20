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
// L1 is storage + UI only — L2 (few-shot prompt injection into geminiProxy
// assessors) and L3 (per-dimension bias correction) wait until 10-20
// calibrations per rep type have accrued.

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
    updatedAt: serverTimestamp(),
    ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
  };
  await setDoc(ref, payload, { merge: true });
  return { id, ...payload };
};

/**
 * Per-rep-type calibration stats — used to decide when L2 (few-shot prompt
 * injection) is worth turning on. Returns
 *   { [repType]: { count, avgEngine, avgTrainer, avgDelta, passRateEngine,
 *                  passRateTrainer } }
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
      };
    }
    const b = byType[t];
    b.count += 1;
    if (typeof c.engineScore === 'number') { b.engineSum += c.engineScore; b.engineN += 1; }
    if (typeof c.trainerScore === 'number') { b.trainerSum += c.trainerScore; b.trainerN += 1; }
    if (typeof c.delta === 'number') { b.deltaSum += c.delta; b.deltaN += 1; }
    if (typeof c.enginePassed === 'boolean') { b.engineTrue += c.enginePassed ? 1 : 0; b.engineBoolN += 1; }
    if (typeof c.trainerPassed === 'boolean') { b.trainerTrue += c.trainerPassed ? 1 : 0; b.trainerBoolN += 1; }
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
    };
  });
  return out;
};

export default {
  listReps,
  getCalibration,
  saveCalibration,
  getCalibrationStats,
};
