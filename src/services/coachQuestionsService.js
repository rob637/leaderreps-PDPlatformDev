// src/services/coachQuestionsService.js
//
// Ascent Revamp WS-4 — Ask a Coach service.
// Lets a leader submit a question (optional video URL) and surfaces the
// coach's response (text + optional video). One collection, no migration.
//
// Doc shape `/coach_questions/{id}`:
//   {
//     id, userId, userName, userEmail,
//     question (text, required), context (text, optional),
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

export const submitQuestion = async (db, user, payload) => {
  if (!db || !user?.uid) throw new Error('db + user required');
  if (!payload?.question || payload.question.trim().length < 10) {
    throw new Error('Please write a longer question (at least 10 characters).');
  }

  const docRef = await addDoc(collection(db, COLLECTION), {
    userId: user.uid,
    userName: user.displayName || '',
    userEmail: user.email || '',
    question: payload.question.trim(),
    context: (payload.context || '').trim() || null,
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

export default {
  subscribeUserQuestions,
  submitQuestion,
  cancelQuestion,
};
