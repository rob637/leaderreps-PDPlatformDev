// src/services/anchorsService.js
//
// Ascent v3 — Anchors + Pulse Checks + Worklist
//
// Vocabulary contract (LeaderReps-native):
//   Anchor       = a 90-day leadership priority owned by one leader (NOT "Rock")
//   Anchor Set   = the 1–3 anchors a leader holds for a quarter
//   Pulse Check  = weekly status ping per anchor (NOT "Scorecard")
//   Worklist     = queued issues for the next Open Gym Round (NOT "Issues List")
//
// Firestore layout (additive, no breaking changes):
//   users/{uid}/anchors/{anchorId}
//   users/{uid}/pulse_checks/{weekId}
//   cohorts/{cohortId}/worklist_inbox/{itemId}
//
// All writes use Firebase modular SDK. Subscriptions return unsubscribe fns.

import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// ---------- helpers ----------

/** ISO week id matching conditioningService.getCurrentWeekId() format: "YYYY-Www" */
export const getWeekId = (date = new Date()) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

/** Calendar quarter id, e.g. "2026-Q2" */
export const getQuarterId = (date = new Date()) => {
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
};

const anchorsCol = (db, uid) => collection(db, 'users', uid, 'anchors');
const pulseCol = (db, uid) => collection(db, 'users', uid, 'pulse_checks');
const worklistCol = (db, cohortId) => collection(db, 'cohorts', cohortId, 'worklist_inbox');

// ---------- Anchors ----------

/**
 * Subscribe to a user's anchors (active + historical).
 * Returns unsubscribe fn.
 */
export const subscribeAnchors = (db, uid, onChange) => {
  if (!db || !uid) return () => {};
  const q = query(anchorsCol(db, uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onChange(items);
    },
    (err) => {
      console.warn('[anchorsService] subscribeAnchors error:', err?.message || err);
      onChange([]);
    }
  );
};

/**
 * Create a new Anchor.
 *  payload: { title, description, quarter, pulseTargets[], createdInSessionId? }
 */
export const createAnchor = async (db, uid, payload) => {
  if (!db || !uid) throw new Error('createAnchor: db and uid required');
  const now = new Date();
  const quarter = payload.quarter || getQuarterId(now);
  const ref = await addDoc(anchorsCol(db, uid), {
    title: payload.title || 'Untitled Anchor',
    description: payload.description || '',
    quarter,
    startDate: Timestamp.fromDate(now),
    endDate: payload.endDate ? Timestamp.fromDate(payload.endDate) : null,
    status: 'active',
    pulseTargets: Array.isArray(payload.pulseTargets) ? payload.pulseTargets : [],
    createdInSessionId: payload.createdInSessionId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateAnchor = async (db, uid, anchorId, patch) => {
  if (!db || !uid || !anchorId) throw new Error('updateAnchor: missing args');
  await updateDoc(doc(db, 'users', uid, 'anchors', anchorId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
};

export const deleteAnchor = async (db, uid, anchorId) => {
  if (!db || !uid || !anchorId) throw new Error('deleteAnchor: missing args');
  await deleteDoc(doc(db, 'users', uid, 'anchors', anchorId));
};

// ---------- Pulse Checks ----------

/**
 * Subscribe to recent pulse check docs (one per ISO week).
 */
export const subscribePulseChecks = (db, uid, onChange) => {
  if (!db || !uid) return () => {};
  const q = query(pulseCol(db, uid), orderBy('weekId', 'desc'));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.warn('[anchorsService] subscribePulseChecks error:', err?.message || err);
      onChange([]);
    }
  );
};

/**
 * Set this week's status for a single anchor.
 *  status: 'on_track' | 'off_track' | 'needs_help'
 *  source: 'app' | 'sms' (default 'app')
 */
export const setPulseCheck = async (db, uid, anchorId, status, note = '', source = 'app') => {
  if (!db || !uid || !anchorId) throw new Error('setPulseCheck: missing args');
  const weekId = getWeekId();
  const ref = doc(db, 'users', uid, 'pulse_checks', weekId);
  await setDoc(
    ref,
    {
      weekId,
      perAnchor: { [anchorId]: { status, note, updatedAt: Timestamp.now() } },
      source,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

// ---------- Worklist (cohort-wide intake) ----------

export const subscribeWorklistInbox = (db, cohortId, onChange) => {
  if (!db || !cohortId) return () => {};
  const q = query(worklistCol(db, cohortId), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => {
      console.warn('[anchorsService] subscribeWorklistInbox error:', err?.message || err);
      onChange([]);
    }
  );
};

export const submitToWorklist = async (db, cohortId, uid, summary, tags = []) => {
  if (!db || !cohortId) throw new Error('submitToWorklist: cohortId required');
  const ref = await addDoc(worklistCol(db, cohortId), {
    submittedBy: uid || 'unknown',
    summary: (summary || '').trim().slice(0, 280),
    tags: Array.isArray(tags) ? tags : [],
    status: 'queued',
    routedToSessionId: null,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// ---------- Sample seed (dev preview only) ----------
//
// Used by AscentArena to make the screen feel alive on first load.
// Idempotent: only writes if the user has zero anchors AND opts in.

export const seedSampleAscent = async (db, uid, cohortId) => {
  if (!db || !uid) throw new Error('seedSampleAscent: missing args');
  const samples = [
    {
      title: 'Close every direct-report 1:1 loop weekly this quarter',
      description:
        'Every Friday, every direct has a clear "what changed and what we agreed" written back.',
      pulseTargets: [
        { metric: 'reps_closed_of_type', repType: 'one_on_one', target: 12 },
        { metric: 'streak_weeks', target: 10 },
      ],
    },
    {
      title: 'Run one cross-functional alignment conversation per week',
      description:
        'Pick the highest-friction interface this quarter and rehearse the conversation before having it.',
      pulseTargets: [{ metric: 'reps_closed_of_type', repType: 'cross_functional', target: 10 }],
    },
    {
      title: 'Hold the standard on late deliverables — no silent re-baselining',
      description:
        'When a commitment slips, name it within 24 hours and renegotiate explicitly.',
      pulseTargets: [{ metric: 'reps_closed_of_type', repType: 'holding_standards', target: 8 }],
    },
  ];
  for (const s of samples) {
    await createAnchor(db, uid, s);
  }
  if (cohortId) {
    const sampleIssues = [
      { summary: 'My VP keeps overriding my decisions in front of my team.', tags: ['authority'] },
      { summary: 'A peer keeps missing handoffs and it is breaking my sprint.', tags: ['peer'] },
    ];
    for (const i of sampleIssues) {
      await submitToWorklist(db, cohortId, uid, i.summary, i.tags);
    }
  }
};
