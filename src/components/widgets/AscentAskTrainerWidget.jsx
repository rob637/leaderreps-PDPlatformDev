// src/components/widgets/AscentAskTrainerWidget.jsx
//
// Ryan's revamped Dashboard — "Ask a Trainer" section.
// Two tabs: My Questions (private) and Other Questions (publicly curated,
// answered-only — see Firestore rules on coach_questions).

import React, { useEffect, useState } from 'react';
import {
  MessageCircleQuestion,
  ChevronRight,
  Loader2,
  Plus,
  Play,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices.jsx';
import {
  subscribeUserQuestions,
  subscribeAnsweredQuestions,
} from '../../services/coachQuestionsService';

const StatusPill = ({ status }) => {
  if (status === 'answered') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
        Answered
      </span>
    );
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      <Clock3 className="w-3 h-3" aria-hidden="true" />
      Awaiting reply
    </span>
  );
};

const QuestionRow = ({ item, showAuthor }) => {
  const [open, setOpen] = useState(false);
  const hasResponse = !!(item.responseText || item.responseVideoUrl);
  return (
    <li className="py-2.5">
      <button
        type="button"
        onClick={() => hasResponse && setOpen((v) => !v)}
        className={`w-full text-left flex items-start justify-between gap-3 ${
          hasResponse ? 'cursor-pointer' : 'cursor-default'
        }`}
        aria-expanded={hasResponse ? open : undefined}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-corporate-navy dark:text-white truncate">
            {item.title || item.question?.slice(0, 60) || 'Untitled question'}
          </p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <StatusPill status={item.status} />
            {showAuthor && item.userName && (
              <span className="text-[11px] text-slate-500">
                — {item.userName.split(' ')[0]}
              </span>
            )}
            {item.respondedBy && (
              <span className="text-[11px] text-slate-500">
                · Coach {item.respondedBy.split(' ')[0]}
              </span>
            )}
          </div>
        </div>
        {hasResponse && (
          <ChevronRight
            className={`w-4 h-4 mt-1 text-slate-400 transition-transform ${
              open ? 'rotate-90' : ''
            }`}
            aria-hidden="true"
          />
        )}
      </button>

      {open && hasResponse && (
        <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700">
          {item.responseVideoUrl && (
            <a
              href={item.responseVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-corporate-teal-ink hover:underline mb-2"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              Watch coach reply
            </a>
          )}
          {item.responseText && (
            <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {item.responseText}
            </p>
          )}
        </div>
      )}
    </li>
  );
};

const AscentAskTrainerWidget = () => {
  const { db, user, navigate } = useAppServices();
  const [tab, setTab] = useState('mine');
  const [mine, setMine] = useState([]);
  const [other, setOther] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingOther, setLoadingOther] = useState(true);
  const [errorMine, setErrorMine] = useState(null);
  const [errorOther, setErrorOther] = useState(null);

  // Dashboard is a synopsis — show only the most recent few. Full history +
  // search lives on the dedicated 'ask-trainer-archive' screen.
  const DASHBOARD_LIMIT = 3;

  useEffect(() => {
    if (!db || !user?.uid) return undefined;
    setLoadingMine(true);
    setErrorMine(null);
    const unsub = subscribeUserQuestions(
      db,
      user.uid,
      (items) => {
        setMine(items || []);
        setLoadingMine(false);
      },
      {
        onError: (err) => {
          setErrorMine(err?.message || 'Failed to load your questions.');
          setLoadingMine(false);
        },
      },
    );
    return unsub;
  }, [db, user?.uid]);

  useEffect(() => {
    if (!db) return undefined;
    setLoadingOther(true);
    setErrorOther(null);
    const unsub = subscribeAnsweredQuestions(
      db,
      (items) => {
        // Hide the current user's questions from "Other" tab — they appear
        // in "My Questions" already.
        setOther((items || []).filter((q) => q.userId !== user?.uid));
        setLoadingOther(false);
      },
      {
        // Pull a small buffer so filtering out self-questions still leaves
        // enough for the dashboard synopsis.
        limit: DASHBOARD_LIMIT * 4,
        onError: (err) => {
          setErrorOther(
            err?.code === 'failed-precondition'
              ? 'Index still building — please retry in a moment.'
              : err?.message || 'Failed to load community questions.',
          );
          setLoadingOther(false);
        },
      },
    );
    return unsub;
  }, [db, user?.uid]);

  const items = tab === 'mine' ? mine : other;
  const loading = tab === 'mine' ? loadingMine : loadingOther;
  const errorMsg = tab === 'mine' ? errorMine : errorOther;

  const goAsk = () => navigate?.('ask-coach');
  const goArchive = () => navigate?.('ask-trainer-archive');

  return (
    <Card
      className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-orange relative overflow-hidden p-4 sm:p-5"
      aria-labelledby="ascent-ask-trainer-heading"
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageCircleQuestion
            className="w-5 h-5 text-corporate-orange"
            aria-hidden="true"
          />
          <h2
            id="ascent-ask-trainer-heading"
            className="text-base font-semibold text-corporate-navy dark:text-white"
          >
            Ask a Trainer
          </h2>
        </div>
        <button
          type="button"
          onClick={goAsk}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90"
        >
          <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          Ask
        </button>
      </header>

      <div
        className="flex gap-1 mb-3 border-b border-slate-200 dark:border-slate-700"
        role="tablist"
        aria-label="Ask a Trainer tabs"
      >
        {[
          { id: 'mine', label: 'My Questions', count: mine.length },
          { id: 'other', label: 'Other Questions', count: other.length },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-corporate-teal text-corporate-navy dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-corporate-navy'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className="ml-1 text-[10px] text-slate-400">
                  ({t.count})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading" />
        </div>
      ) : errorMsg ? (
        <div
          className="flex items-start gap-2 py-3 text-sm text-rose-700 dark:text-rose-300"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{errorMsg}</span>
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-500 dark:text-slate-400 py-3">
          {tab === 'mine'
            ? 'You haven\u2019t asked anything yet. Tap “Ask” to send your first question.'
            : 'No answered questions yet. Be the first to ask one.'}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {items.slice(0, DASHBOARD_LIMIT).map((q) => (
            <QuestionRow key={q.id} item={q} showAuthor={tab === 'other'} />
          ))}
        </ul>
      )}

      {/* Archive link — always visible so users can find old answers */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
        <button
          type="button"
          onClick={goArchive}
          className="inline-flex items-center gap-1 text-xs font-semibold text-corporate-teal-ink hover:underline"
        >
          <Search className="w-3.5 h-3.5" aria-hidden="true" />
          Search archive
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
};

export default AscentAskTrainerWidget;
