// src/components/widgets/PracticeRepsHistoryWidget.jsx
// Locker widget: shows Practice a Rep (Conditioning Light) history.
// Reads from /users/{uid}/reps_light written by the evaluateRep cloud function.

import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { Zap, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';

const RR_LABELS = {
  DRF: 'Reinforcing Feedback',
  RED: 'Redirecting Feedback',
  SCE: 'Set Clear Expectations',
  FUW: 'Follow-Up on the Work',
};

const formatDate = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const PracticeRepsHistoryWidget = ({ helpText }) => {
  const { user, db } = useAppServices();
  const userId = user?.uid;

  const [reps, setReps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState(new Set());

  useEffect(() => {
    if (!userId || !db) {
      setIsLoading(false);
      return undefined;
    }

    const q = query(
      collection(db, 'users', userId, 'reps_light'),
      orderBy('createdAt', 'desc'),
      limit(50),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setReps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setIsLoading(false);
      },
      (err) => {
        console.error('PracticeRepsHistoryWidget: load failed', err);
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, [userId, db]);

  const passCount = useMemo(
    () => reps.filter((r) => r.result === 'pass').length,
    [reps],
  );

  const toggle = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-corporate-teal" />
          <h3 className="text-lg font-bold text-corporate-navy">
            Practice Reps
          </h3>
        </div>
        {!isLoading && reps.length > 0 && (
          <div className="text-xs font-semibold text-slate-500">
            {passCount} of {reps.length} passed
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-sm text-slate-500 mb-3">{helpText}</p>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : reps.length === 0 ? (
        <p className="text-sm text-slate-500">
          No Practice Reps yet. Try one from Practice a Rep.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {reps.map((rep) => {
            const isOpen = expanded.has(rep.id);
            const isPass = rep.result === 'pass';
            const Icon = isPass ? CheckCircle : AlertCircle;
            const tone = isPass
              ? 'text-emerald-600'
              : 'text-amber-600';
            const label = RR_LABELS[rep.rrType] || rep.rrType || 'Rep';
            return (
              <li key={rep.id} className="py-3">
                <button
                  type="button"
                  onClick={() => toggle(rep.id)}
                  className="w-full flex items-start gap-3 text-left hover:bg-slate-50 rounded-md px-2 py-1 -mx-2 -my-1 transition"
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${tone}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-corporate-navy">
                        {label}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wide ${tone}`}>
                        {isPass ? 'Pass' : 'Not Yet'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatDate(rep.createdAt)}
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                  )}
                </button>

                {isOpen && (
                  <div className="mt-3 ml-8 space-y-3 text-sm">
                    {rep.transcript && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Your Rep
                        </div>
                        <p className="text-slate-700 whitespace-pre-wrap">
                          {rep.transcript}
                        </p>
                      </div>
                    )}
                    {rep.observation && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          Observation
                        </div>
                        <p className="text-slate-700">{rep.observation}</p>
                      </div>
                    )}
                    {rep.question && (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                          {isPass ? 'Try Next' : 'Try Next Time'}
                        </div>
                        <p className="text-slate-700">{rep.question}</p>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default PracticeRepsHistoryWidget;
