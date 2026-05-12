// src/components/admin/FoundationCompletionQueue.jsx
//
// Foundation Completion Queue (May 2026 three-phase model)
// ========================================================
// Lists all leaders who have NOT yet been marked foundationCompleted.
// Trainer clicks "Mark Foundation Complete" → sets:
//   foundationCompleted: true
//   foundationCompletedAt: serverTimestamp()
//   foundationCompletedBy: <admin email>
//
// This is the first half of the new two-step graduation: Foundation
// completion does NOT auto-grant Ascent access. Ascent access is
// granted separately via AscentApprovalQueue.

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2, User, Loader, Search, Info, X, Award,
} from 'lucide-react';
import {
  collection, getDocs, doc, updateDoc, serverTimestamp,
  query, orderBy,
} from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { Card } from '../ui';

const Info_Panel = ({ onClose }) => (
  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-4">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
            What is Foundation Completion?
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
            In the May 2026 self-paced model, Foundation is the four-rep
            core program. A leader has &quot;completed Foundation&quot; when
            they have demonstrated all four foundational reps to a trainer&apos;s
            satisfaction. Completion is at trainer discretion.
          </p>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Marking complete here sets <code>foundationCompleted: true</code>.
            It does <em>not</em> grant Ascent access — that is a separate
            approval (see Ascent Approval Queue).
          </p>
        </div>
      </div>
      <button onClick={onClose} className="text-blue-400 hover:text-blue-600 p-1" aria-label="Dismiss info panel">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const FoundationCompletionQueue = () => {
  const { db, user } = useAppServices();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const loadParticipants = async () => {
    if (!db) return;
    setLoading(true);
    try {
      // Query users whose foundationCompleted is not true. Firestore can't
      // do a "not equals" easily, so we pull the filtered cohort users and
      // filter client-side. Cohort size is small (<200 across all cohorts).
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('email'));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        // Skip admin/internal users without a cohort if any
        list.push({
          id: d.id,
          email: data.email || '',
          displayName: data.displayName || data.email || '(no name)',
          cohortId: data.cohortId || null,
          foundationCompleted: data.foundationCompleted === true,
          foundationCompletedAt: data.foundationCompletedAt || null,
          ascentApproved: data.ascentApproved === true,
          graduated: data.graduated === true,
        });
      });
      setParticipants(list);
    } catch (err) {
      console.error('[FoundationCompletionQueue] load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const handleMarkComplete = async (participant) => {
    if (!db || !user) return;
    setProcessingId(participant.id);
    try {
      const userRef = doc(db, 'users', participant.id);
      await updateDoc(userRef, {
        foundationCompleted: true,
        foundationCompletedAt: serverTimestamp(),
        foundationCompletedBy: user.email || null,
      });
      // Optimistic update
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participant.id
            ? { ...p, foundationCompleted: true, foundationCompletedAt: new Date() }
            : p
        )
      );
    } catch (err) {
      console.error('[FoundationCompletionQueue] mark complete failed:', err);
      alert(`Failed to mark complete: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUndo = async (participant) => {
    if (!db || !user) return;
    if (!window.confirm(`Reverse Foundation completion for ${participant.displayName}?`)) return;
    setProcessingId(participant.id);
    try {
      const userRef = doc(db, 'users', participant.id);
      await updateDoc(userRef, {
        foundationCompleted: false,
        foundationCompletedAt: null,
      });
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participant.id
            ? { ...p, foundationCompleted: false, foundationCompletedAt: null }
            : p
        )
      );
    } catch (err) {
      console.error('[FoundationCompletionQueue] undo failed:', err);
      alert(`Failed to undo: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return participants.filter((p) => {
      if (!showCompleted && p.foundationCompleted) return false;
      if (!term) return true;
      return (
        p.email.toLowerCase().includes(term) ||
        p.displayName.toLowerCase().includes(term)
      );
    });
  }, [participants, search, showCompleted]);

  return (
    <Card title="Foundation Completion Queue" icon={Award} accent="TEAL">
      {showInfo && <Info_Panel onClose={() => setShowInfo(false)} />}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
          />
          Show already completed
        </label>
        <button
          onClick={loadParticipants}
          className="px-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-corporate-navy dark:text-white"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader className="w-6 h-6 animate-spin text-corporate-teal" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center">
          No participants match the current filter.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {filtered.map((p) => {
            const processing = processingId === p.id;
            return (
              <div key={p.id} className="py-3 flex items-center gap-3">
                <User className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-corporate-navy dark:text-white truncate">
                    {p.displayName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {p.email}
                    {p.foundationCompleted && (
                      <span className="ml-2 inline-flex items-center gap-1 text-corporate-teal">
                        <CheckCircle2 className="w-3 h-3" /> Foundation complete
                      </span>
                    )}
                    {p.ascentApproved && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                        <Award className="w-3 h-3" /> Ascent approved
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {p.foundationCompleted ? (
                    <button
                      onClick={() => handleUndo(p)}
                      disabled={processing}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      {processing ? 'Working…' : 'Undo'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleMarkComplete(p)}
                      disabled={processing}
                      className="px-3 py-1.5 text-xs rounded-lg bg-corporate-teal hover:bg-corporate-teal/90 text-white font-medium disabled:opacity-50"
                    >
                      {processing ? 'Working…' : 'Mark Foundation Complete'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default FoundationCompletionQueue;
