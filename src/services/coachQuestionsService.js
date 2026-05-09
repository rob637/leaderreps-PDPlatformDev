// src/services/coachQuestionsService.js
//
// Ascent Revamp WS-4 — Ask a Coach service.
// Lets a leader submit a question (with title + optional RR tag) and surfaces
// the coach's video reply. One collection, no migration.
//
// Doc shape `/coach_questions/{id}`:
//   {
//     id, userId, userName, userEmail,
//     title (text, required), question (text, required), context (text, optional),
//     rrTag: 'DRF' | 'RED' | 'FUW' | 'SCE' | null,
//     videoUrl (optional, user attachment),
//     status: 'open' | 'answered' | 'cancelled',
//     responseText, responseVideoUrl, respondedBy, respondedAt,
//     createdAt, updatedAt, cancelledAt,
//   }

import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  where,
} from 'firebase/firestore';

const COLLECTION = 'coach_questions';
const VALID_RR_TAGS = ['DRF', 'RED', 'FUW', 'SCE'];

export const subscribeUserQuestions = (db, userId, callback) => {
  if (!db || !userId) throw new Error('db + userId required');
  const q = query(
    collection(db, COLLECTION),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.warn('[coachQuestions] subscribe error', err);
    }
  );
};

/**
 * Subscribe to ANSWERED questions across the cohort/community.
 * Firestore rules expose `status == 'answered'` docs to all authenticated
 * users so they can be surfaced as a curated public Q&A on the dashboard.
 *
 * @param {object} db
 * @param {(items: Array) => void} callback
 * @param {object} [opts]
 * @param {number} [opts.limit] - cap result size client-side
 * @returns {() => void} unsubscribe
 */
export const subscribeAnsweredQuestions = (db, callback, opts = {}) => {
  if (!db) throw new Error('db required');
  const max = typeof opts.limit === 'number' ? opts.limit : null;
  const q = query(
    collection(db, COLLECTION),
    where('status', '==', 'answered'),
    orderBy('respondedAt', 'desc')
  );
  return onSnapshot(
    q,
    (snap) => {
      let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (max && items.length > max) items = items.slice(0, max);
      callback(items);
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.warn('[coachQuestions] answered subscribe error', err);
    }
  );
};

export const submitQuestion = async (db, user, payload) => {
  if (!db || !user?.uid) throw new Error('db + user required');
  if (!payload?.title || payload.title.trim().length < 3) {
    throw new Error('Please add a short title (at least 3 characters).');
  }
  if (payload.title.trim().length > 80) {
    throw new Error('Title is too long (max 80 characters).');
  }
  if (!payload?.question || payload.question.trim().length < 10) {
    throw new Error('Please write a longer question (at least 10 characters).');
  }
  const rrTag = payload?.rrTag && VALID_RR_TAGS.includes(payload.rrTag)
    ? payload.rrTag
    : null;

  const docRef = await addDoc(collection(db, COLLECTION), {
    userId: user.uid,
    userName: user.displayName || '',
    userEmail: user.email || '',
    title: payload.title.trim(),
    question: payload.question.trim(),
    context: (payload.context || '').trim() || null,
    rrTag,
    videoUrl: payload.videoUrl || null,
    status: 'open',
    responseText: null,
    responseVideoUrl: null,
    respondedBy: null,
    respondedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const cancelQuestion = async (db, questionId) => {
  if (!db || !questionId) throw new Error('db + questionId required');
  await updateDoc(doc(db, COLLECTION, questionId), {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
  });
};

// ---------------------------------------------------------------------------
// Admin / responder (trainer) helpers
// ---------------------------------------------------------------------------

/**
 * Subscribe to ALL questions (admin / Ask-a-Trainer responder view).
 * Optionally filter by status. Caller is responsible for permissions —
 * Firestore rules enforce that only `isAskCoachResponder()` (admins +
 * `metadata/config.askCoachResponders` array) can read across users.
 */
export const subscribeAllQuestions = (db, callback, opts = {}) => {
  if (!db) throw new Error('db required');
  let q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
  if (opts.status) {
    q = query(
      collection(db, COLLECTION),
      where('status', '==', opts.status),
      orderBy('createdAt', 'desc')
    );
  }
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(items);
    },
    (err) => {
      // eslint-disable-next-line no-console
      console.warn('[coachQuestions] admin subscribe error', err);
    }
  );
};

/**
 * Trainer/admin posts a written + optional video reply.
 * Marks the question 'answered' and stamps respondedBy / respondedAt.
 */
export const respondToQuestion = async (db, user, questionId, payload) => {
  if (!db || !questionId) throw new Error('db + questionId required');
  if (!user?.uid) throw new Error('user required');
  const responseText = (payload?.responseText || '').trim();
  const responseVideoUrl = (payload?.responseVideoUrl || '').trim() || null;
  if (!responseText && !responseVideoUrl) {
    throw new Error('Add a written reply or a video URL before sending.');
  }
  await updateDoc(doc(db, COLLECTION, questionId), {
    status: 'answered',
    responseText: responseText || null,
    responseVideoUrl,
    respondedBy: user.email || user.uid,
    respondedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Reopen an answered question (e.g. follow-up needed).
 */
export const reopenQuestion = async (db, questionId) => {
  if (!db || !questionId) throw new Error('db + questionId required');
  await updateDoc(doc(db, COLLECTION, questionId), {
    status: 'open',
    updatedAt: serverTimestamp(),
  });
};

export default {
  subscribeUserQuestions,
  submitQuestion,
  cancelQuestion,
  subscribeAllQuestions,
  respondToQuestion,
  reopenQuestion,
};
