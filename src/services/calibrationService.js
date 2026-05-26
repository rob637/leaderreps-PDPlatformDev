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

// Defensive coercion: `situation` may be a plain string, or a structured
// object like `{ selected, customContext, isRequired }` from the rep wizard.
// Always return a string so React doesn't try to render a raw object.
const extractSituationText = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.customContext || val.selected || val.text || '';
  }
  return String(val);
};

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
      situationContext: extractSituationText(data.context?.situation) || extractSituationText(data.situation) || '',
    });
  });
  return reps.slice(0, limitCount);
};

export const getCalibration = async (db, userId, repId) => {
  if (!db || !userId || !repId) return null;
  const snap = await getDoc(doc(db, COLLECTION, calId(userId, repId)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Pretty-print a snake_case or camelCase key as a section header.
const humanizeKey = (k) => String(k || '')
  .replace(/[_-]+/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, (c) => c.toUpperCase())
  .trim();

// Recursively walk an evidence value and append any non-empty string
// leaves to `parts` as `Label: value` lines. Skips known noise keys
// (timestamps, ids, booleans, numbers without context).
const NOISE_KEYS = new Set([
  'submittedAt', 'createdAt', 'updatedAt', 'savedAt',
  'level', 'inputMethod', 'isRequired',
]);
const walkEvidence = (val, parts, labelPath = []) => {
  if (val == null) return;
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return;
    const label = labelPath.length ? labelPath.map(humanizeKey).join(' › ') : 'Evidence';
    parts.push(`${label}: ${s}`);
    return;
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    // Only include scalars when we have a meaningful label path.
    if (labelPath.length) {
      parts.push(`${labelPath.map(humanizeKey).join(' › ')}: ${val}`);
    }
    return;
  }
  if (Array.isArray(val)) {
    val.forEach((item, i) => walkEvidence(item, parts, [...labelPath, String(i + 1)]));
    return;
  }
  if (typeof val === 'object') {
    Object.entries(val).forEach(([k, v]) => {
      if (NOISE_KEYS.has(k)) return;
      walkEvidence(v, parts, [...labelPath, k]);
    });
  }
};

// Build a human-readable rep text from any of the known rep schemas:
//   - Conditioning Light: `transcript` / `transcriptText`
//   - Legacy V1: `evidence.structured` (string or object) + `evidence.reflection`
//   - V2 generic: `evidence.whatYouSaid` / `howTheyResponded` / `responses` /
//                 `reflection.{whatWentWell,whatDifferent}` / `notes`
//   - V2 typed:   `evidence.{sceEvidence,drfEvidence,fuwEvidence,redEvidence,
//                            lwvEvidence}.responses` plus `selfAssessment.responses`,
//                 `responseType`, `outcome`, `notes`
//   - Prep:       `prep.{rubricResponses,riskResponses}`
//   - Top-level:  `situation.customContext`, `person`, `scenario`
const buildRepText = (data) => {
  const parts = [];

  // Conditioning Light voice / direct transcript.
  if (typeof data.transcript === 'string' && data.transcript.trim()) {
    parts.push(`Transcript: ${data.transcript.trim()}`);
  } else if (typeof data.transcriptText === 'string' && data.transcriptText.trim()) {
    parts.push(`Transcript: ${data.transcriptText.trim()}`);
  }

  // Top-level context the leader chose at commit time.
  const sit = extractSituationText(data.situation);
  if (sit) parts.push(`Situation: ${sit}`);
  if (typeof data.person === 'string' && data.person.trim()) {
    parts.push(`Person: ${data.person.trim()}`);
  } else if (data.person && typeof data.person === 'object') {
    const pn = data.person.name || data.person.label || data.person.role;
    if (pn) parts.push(`Person: ${pn}`);
  }
  const scenario = extractSituationText(data.scenario);
  if (scenario && scenario !== sit) parts.push(`Scenario: ${scenario}`);

  // Prep responses (what they planned to say).
  if (data.prep && typeof data.prep === 'object') {
    const before = parts.length;
    walkEvidence(data.prep.rubricResponses, parts, ['Prep', 'Rubric']);
    walkEvidence(data.prep.riskResponses, parts, ['Prep', 'Risks']);
    if (parts.length === before && data.prep.notes) {
      parts.push(`Prep notes: ${data.prep.notes}`);
    }
  }

  // Evidence — walk every known shape.
  if (data.evidence && typeof data.evidence === 'object') {
    const ev = data.evidence;
    // Generic V2 fields first (clearer labels than recursion).
    if (typeof ev.whatYouSaid === 'string' && ev.whatYouSaid.trim()) {
      parts.push(`What you said: ${ev.whatYouSaid.trim()}`);
    }
    if (typeof ev.howTheyResponded === 'string' && ev.howTheyResponded.trim()) {
      parts.push(`Their response: ${ev.howTheyResponded.trim()}`);
    }
    if (ev.reflection && typeof ev.reflection === 'object') {
      if (ev.reflection.whatWentWell) parts.push(`What went well: ${ev.reflection.whatWentWell}`);
      if (ev.reflection.whatDifferent) parts.push(`What I'd do differently: ${ev.reflection.whatDifferent}`);
    } else if (typeof ev.reflection === 'string' && ev.reflection.trim()) {
      parts.push(`Reflection: ${ev.reflection.trim()}`);
    }
    if (typeof ev.responseType === 'string' && ev.responseType.trim()) {
      parts.push(`Response type: ${ev.responseType.trim()}`);
    }
    if (typeof ev.outcome === 'string' && ev.outcome.trim()) {
      parts.push(`Outcome: ${ev.outcome.trim()}`);
    }
    if (typeof ev.otherResponseText === 'string' && ev.otherResponseText.trim()) {
      parts.push(`Other response: ${ev.otherResponseText.trim()}`);
    }
    if (typeof ev.notes === 'string' && ev.notes.trim()) {
      parts.push(`Notes: ${ev.notes.trim()}`);
    }

    // Structured (V1 legacy + free-form).
    const s = ev.structured;
    if (typeof s === 'string' && s.trim()) {
      parts.push(`Structured: ${s.trim()}`);
    } else if (s && typeof s === 'object') {
      walkEvidence(s, parts, ['Structured']);
    }

    // Typed V2 evidence blocks (SCE/DRF/FUW/RED/LWV).
    const typedKeys = ['sceEvidence', 'drfEvidence', 'fuwEvidence', 'redEvidence', 'lwvEvidence'];
    typedKeys.forEach((tk) => {
      const block = ev[tk];
      if (!block || typeof block !== 'object') return;
      const tag = tk.replace(/Evidence$/, '').toUpperCase();
      if (block.situationBranch) parts.push(`${tag} branch: ${block.situationBranch}`);
      if (block.responses && typeof block.responses === 'object') {
        walkEvidence(block.responses, parts, [`${tag} responses`]);
      }
      // Catch any other string fields on the block.
      Object.entries(block).forEach(([k, v]) => {
        if (k === 'responses' || k === 'situationBranch') return;
        if (typeof v === 'string' && v.trim()) {
          parts.push(`${tag} ${humanizeKey(k)}: ${v.trim()}`);
        }
      });
    });

    // Self-assessment responses.
    if (ev.selfAssessment && typeof ev.selfAssessment === 'object') {
      walkEvidence(ev.selfAssessment.responses, parts, ['Self-assessment']);
    }

    // Generic `responses` map (some rep types stash answers here).
    if (ev.responses && typeof ev.responses === 'object') {
      walkEvidence(ev.responses, parts, ['Responses']);
    }
  }

  // De-duplicate consecutive identical lines (e.g. when situation appears
  // in both top-level and structured).
  const seen = new Set();
  const deduped = parts.filter((p) => {
    if (seen.has(p)) return false;
    seen.add(p);
    return true;
  });
  return deduped.join('\n\n');
};

/**
 * Fetch the underlying rep doc (and its leader-submitted text) from
 * whichever collection it lives in. Returns `{ data, path, repText }` or
 * null. `repText` is normalized across all known rep schemas so trainers
 * always have something to read — see `buildRepText` for the full list.
 */
export const getRepDoc = async (db, userId, repId) => {
  if (!db || !userId || !repId) return null;
  for (const path of REP_PATHS) {
    try {
      const snap = await getDoc(doc(db, 'users', userId, path, repId));
      if (!snap.exists()) continue;
      const data = snap.data() || {};
      const repText = buildRepText(data);
      return { path, data, repText };
    } catch {
      // try next path
    }
  }
  return null;
};

/**
 * Fetch a user's display info (name + email) for the calibration queue.
 * Returns `{ name, email }` — `name` falls back to email local-part, then
 * to a short id. Never throws.
 */
export const getUserDisplayInfo = async (db, userId) => {
  if (!db || !userId) return { name: '', email: '' };
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    if (!snap.exists()) {
      return { name: `${userId.slice(0, 8)}…`, email: '' };
    }
    const d = snap.data() || {};
    const profile = (d.profile && typeof d.profile === 'object') ? d.profile : {};
    const first = profile.firstName || d.firstName || '';
    const last = profile.lastName || d.lastName || '';
    const combined = `${first} ${last}`.trim();
    const email = d.email || profile.email || '';
    const name = d.displayName
      || profile.displayName
      || combined
      || (email ? email.split('@')[0] : '')
      || `${userId.slice(0, 8)}…`;
    return { name, email };
  } catch {
    return { name: `${userId.slice(0, 8)}…`, email: '' };
  }
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
  getRepDoc,
  getUserDisplayInfo,
  saveCalibration,
  getCalibrationStats,
  getFewShotFlag,
  setFewShotFlag,
  getRrAddendum,
  setRrAddendum,
};
