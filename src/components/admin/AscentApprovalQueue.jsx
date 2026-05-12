// src/components/admin/AscentApprovalQueue.jsx
//
// Ascent Approval Queue (May 2026 three-phase model)
// ==================================================
// Lists leaders who have foundationCompleted === true but have NOT yet
// been granted Ascent access. Trainer clicks "Approve Ascent" → sets:
//   ascentApproved: true
//   ascentApprovedAt: serverTimestamp()
//   ascentApprovedBy: <admin email>
//
// Per spec, Ascent access is indefinite once approved.

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award, User, Loader, Search, Info, X, CheckCircle2,
} from 'lucide-react';
import {
  collection, getDocs, doc, updateDoc, serverTimestamp,
  query, orderBy, where,
} from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { Card } from '../ui';

const Info_Panel = ({ onClose }) => (
  <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-4">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
            What is Ascent Approval?
          </h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
            Ascent is the ongoing leadership-development phase that follows
            Foundation. A leader appears here once a trainer has marked them
            <code className="mx-1">foundationCompleted</code>; a separate
            approval step grants Ascent access.
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-300">
            Approval is indefinite — once granted, the leader retains Ascent
            access. Use Undo only to correct mistakes.
          </p>
        </div>
      </div>
      <button onClick={onClose} className="text-amber-400 hover:text-amber-600 p-1" aria-label="Dismiss info panel">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const AscentApprovalQueue = () => {
  const { db, user } = useAppServices();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [showInfo, setShowInfo] = useState(true);
  const [search, setSearch] = useState('');
  const [showApproved, setShowApproved] = useState(false);

  const loadParticipants = async () => {
    if (!db) return;
    setLoading(true);
    try {
      // Only foundation-complete users are eligible.
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('foundationCompleted', '==', true),
        orderBy('email')
      );
      const snap = await getDocs(q);
      const list = [];
      snap.forEach((d) => {
        const data = d.data() || {};
        list.push({
          id: d.id,
          email: data.email || '',
          displayName: data.displayName || data.email || '(no name)',
          cohortId: data.cohortId || null,
          foundationCompleted: data.foundationCompleted === true,
          foundationCompletedAt: data.foundationCompletedAt || null,
          ascentApproved: data.ascentApproved === true,
          ascentApprovedAt: data.ascentApprovedAt || null,
          graduated: data.graduated === true,
        });
      });
      setParticipants(list);
    } catch (err) {
      console.error('[AscentApprovalQueue] load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const handleApprove = async (participant) => {
    if (!db || !user) return;
    setProcessingId(participant.id);
    try {
      const userRef = doc(db, 'users', participant.id);
      await updateDoc(userRef, {
        ascentApproved: true,
        ascentApprovedAt: serverTimestamp(),
        ascentApprovedBy: user.email || null,
        // Reset welcome flag so the Ascent intro can show on next login
        ascentWelcomeShown: false,
      });
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participant.id
            ? { ...p, ascentApproved: true, ascentApprovedAt: new Date() }
            : p
        )
      );
    } catch (err) {
      console.error('[AscentApprovalQueue] approve failed:', err);
      alert(`Failed to approve: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleUndo = async (participant) => {
    if (!db || !user) return;
    if (!window.confirm(`Revoke Ascent approval for ${participant.displayName}?`)) return;
    setProcessingId(participant.id);
    try {
      const userRef = doc(db, 'users', participant.id);
      await updateDoc(userRef, {
        ascentApproved: false,
        ascentApprovedAt: null,
      });
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === participant.id
            ? { ...p, ascentApproved: false, ascentApprovedAt: null }
            : p
        )
      );
    } catch (err) {
      console.error('[AscentApprovalQueue] undo failed:', err);
      alert(`Failed to undo: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return participants.filter((p) => {
      if (!showApproved && p.ascentApproved) return false;
      if (!term) return true;
      return (
        p.email.toLowerCase().includes(term) ||
        p.displayName.toLowerCase().includes(term)
      );
    });
  }, [participants, search, showApproved]);

  return (
    <Card title="Ascent Approval Queue" icon={Award} accent="ORANGE">
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
            checked={showApproved}
            onChange={(e) => setShowApproved(e.target.checked)}
          />
          Show already approved
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
          No foundation-complete leaders awaiting Ascent approval.
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
                    <span className="ml-2 inline-flex items-center gap-1 text-corporate-teal">
                      <CheckCircle2 className="w-3 h-3" /> Foundation complete
                    </span>
                    {p.ascentApproved && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-600">
                        <Award className="w-3 h-3" /> Ascent approved
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {p.ascentApproved ? (
                    <button
                      onClick={() => handleUndo(p)}
                      disabled={processing}
                      className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      {processing ? 'Working…' : 'Undo'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(p)}
                      disabled={processing}
                      className="px-3 py-1.5 text-xs rounded-lg bg-corporate-orange hover:bg-corporate-orange/90 text-white font-medium disabled:opacity-50"
                    >
                      {processing ? 'Working…' : 'Approve Ascent'}
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

export default AscentApprovalQueue;
