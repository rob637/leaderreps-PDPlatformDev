// src/components/admin/LabReviewStrip.jsx
// Tiny per-tool review widget for LeaderReps Lab.
// Each admin votes red / yellow / green plus a one-line note.
// Votes are visible to all admins so disagreement surfaces immediately.
//
// Firestore shape:
//   lab-reviews/{toolId}/votes/{voterKey} -> { vote, note, voterEmail, voterName, updatedAt }
//   voterKey is the voter's email lowercased with '@' and '.' swapped for '_'
//     so it forms a safe document id.

import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase.js';
import { useAppServices } from '../../services/useAppServices';

const VOTE_META = {
  green:  { label: 'Like', dot: 'bg-emerald-500', ring: 'ring-emerald-500', text: 'text-emerald-700' },
  yellow: { label: 'OK',   dot: 'bg-amber-500',   ring: 'ring-amber-500',   text: 'text-amber-700' },
  red:    { label: 'Meh',  dot: 'bg-red-500',     ring: 'ring-red-500',     text: 'text-red-700' },
};

function emailToKey(email) {
  return String(email || '').toLowerCase().replace(/[@.]/g, '_');
}

function shortName(email, displayName) {
  if (displayName) return displayName.split(' ')[0];
  if (!email) return 'Reviewer';
  return email.split('@')[0].split('.')[0].replace(/^./, (c) => c.toUpperCase());
}

export default function LabReviewStrip({ toolId }) {
  const { user } = useAppServices();
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftNote, setDraftNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!toolId) return undefined;
    const ref = collection(db, 'lab-reviews', toolId, 'votes');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const next = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Stable sort: most-recent first.
        next.sort((a, b) => {
          const ta = a.updatedAt?.toMillis?.() ?? 0;
          const tb = b.updatedAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
        setVotes(next);
        setLoading(false);
      },
      (err) => {
        console.warn('[LabReviewStrip] subscribe error', toolId, err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [toolId]);

  const myKey = user?.email ? emailToKey(user.email) : null;
  const myVote = useMemo(
    () => (myKey ? votes.find((v) => v.id === myKey) : null),
    [votes, myKey],
  );

  // Seed the note input from the existing vote whenever it changes from elsewhere.
  useEffect(() => {
    if (myVote && draftNote === '' ) setDraftNote(myVote.note || '');
    // intentionally not depending on draftNote — only react to incoming vote
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myVote?.note]);

  async function cast(vote) {
    if (!toolId || !user?.email) return;
    setSaving(true);
    try {
      const ref = doc(db, 'lab-reviews', toolId, 'votes', myKey);
      await setDoc(
        ref,
        {
          vote,
          note: draftNote.trim().slice(0, 200),
          voterEmail: user.email,
          voterName: user.displayName || null,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      console.error('[LabReviewStrip] save error', err);
    } finally {
      setSaving(false);
    }
  }

  async function saveNote() {
    if (!myVote) return; // need a vote first
    await cast(myVote.vote);
  }

  return (
    <div className="mt-1 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
          Reviewer votes
        </div>
        {!loading && (
          <span className="text-[10px] text-slate-400">
            {votes.length === 0 ? 'no votes yet' : `${votes.length} vote${votes.length === 1 ? '' : 's'}`}
          </span>
        )}
      </div>

      {votes.length > 0 && (
        <ul className="space-y-1">
          {votes.map((v) => {
            const meta = VOTE_META[v.vote] || VOTE_META.yellow;
            return (
              <li key={v.id} className="flex items-start gap-2 text-xs">
                <span
                  title={meta.label}
                  className={`mt-0.5 inline-block w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`}
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200 min-w-[60px]">
                  {shortName(v.voterEmail, v.voterName)}
                </span>
                <span className="text-slate-500 dark:text-slate-400 flex-1 break-words">
                  {v.note || <em className="opacity-60">no note</em>}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {user?.email && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-1.5">
            {Object.entries(VOTE_META).map(([key, meta]) => {
              const active = myVote?.vote === key;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={saving}
                  onClick={() => cast(key)}
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors ${
                    active
                      ? `${meta.text} bg-white dark:bg-slate-900 border-current ring-1 ${meta.ring}`
                      : 'text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 hover:text-slate-700 hover:border-slate-300'
                  }`}
                  title={`Vote: ${meta.label}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
              onBlur={saveNote}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.currentTarget.blur();
                }
              }}
              maxLength={200}
              placeholder={myVote ? 'Add a one-line reason (enter to save)' : 'Vote first, then add a note'}
              disabled={!myVote || saving}
              className="flex-1 text-[11px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-corporate-teal"
            />
          </div>
        </div>
      )}
    </div>
  );
}
