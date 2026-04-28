// src/components/screens/AskCoach.jsx
//
// Ascent Revamp WS-4 — Ask a Coach.
// Submit a question, see the coach's text + (optional) video reply.
// One open question at a time encouraged but not enforced.

import React, { useEffect, useState } from 'react';
import {
  MessageCircleQuestion, Send, Loader2, CheckCircle2,
  Clock, Video, X, AlertCircle,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import {
  subscribeUserQuestions,
  submitQuestion,
  cancelQuestion,
} from '../../services/coachQuestionsService';

const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const StatusPill = ({ status }) => {
  const map = {
    open: { label: 'Awaiting reply', cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Clock },
    answered: { label: 'Answered', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', cls: 'bg-slate-100 text-slate-500 border-slate-200', Icon: X },
  };
  const m = map[status] || map.open;
  const Icon = m.Icon;
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${m.cls}`}>
      <Icon className="w-3 h-3" />
      {m.label}
    </span>
  );
};

const AskCoach = () => {
  const { db, user } = useAppServices();
  const userId = user?.uid;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [contextText, setContextText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!db || !userId) return undefined;
    setLoading(true);
    const unsub = subscribeUserQuestions(db, userId, (items) => {
      setQuestions(items);
      setLoading(false);
    });
    return unsub;
  }, [db, userId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await submitQuestion(db, user, {
        question: questionText,
        context: contextText,
      });
      setQuestionText('');
      setContextText('');
      setSuccess(true);
    } catch (err) {
      setError(err?.message || 'Could not submit your question. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async (id) => {
    setBusyId(id);
    try {
      await cancelQuestion(db, id);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('cancel failed', err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-[860px] mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircleQuestion className="w-7 h-7 text-corporate-teal" />
          <h1
            className="text-3xl font-bold text-corporate-navy dark:text-white"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Ask a Coach
          </h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400">
          Stuck on something? Send a question. A coach will reply with text
          and (when helpful) a short video.
        </p>
      </header>

      {/* Submit form */}
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-8"
      >
        <label
          htmlFor="ask-question"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Your question
        </label>
        <textarea
          id="ask-question"
          rows={4}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          disabled={submitting}
          placeholder="What do you want a coach's perspective on?"
          className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-corporate-teal focus:outline-none focus:ring-1 focus:ring-corporate-teal mb-3"
        />

        <label
          htmlFor="ask-context"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Context <span className="font-normal text-slate-400">(optional)</span>
        </label>
        <textarea
          id="ask-context"
          rows={3}
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          disabled={submitting}
          placeholder="Any background that helps the coach answer well."
          className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-corporate-teal focus:outline-none focus:ring-1 focus:ring-corporate-teal mb-3"
        />

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>Sent. A coach will reply shortly.</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || questionText.trim().length < 10}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Sending…' : 'Send to Coach'}
          </button>
        </div>
      </form>

      {/* Question list */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        Your Questions
      </h2>

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="text-center py-10 text-slate-500 dark:text-slate-400">
          You haven&apos;t asked anything yet.
        </div>
      )}

      <div className="space-y-4">
        {questions.map((q) => (
          <article
            key={q.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <StatusPill status={q.status} />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatTimestamp(q.createdAt)}
              </span>
            </div>

            <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap mb-2">
              {q.question}
            </p>
            {q.context && (
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap mb-2">
                {q.context}
              </p>
            )}

            {q.status === 'open' && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => onCancel(q.id)}
                  disabled={busyId === q.id}
                  className="text-xs font-medium text-slate-500 hover:text-rose-600 disabled:opacity-50"
                >
                  Cancel question
                </button>
              </div>
            )}

            {q.status === 'answered' && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <div className="text-xs font-semibold uppercase tracking-wider text-corporate-teal mb-2">
                  Coach&apos;s reply
                  {q.respondedAt && (
                    <span className="ml-2 font-normal text-slate-500">
                      · {formatTimestamp(q.respondedAt)}
                    </span>
                  )}
                </div>
                {q.responseText && (
                  <p className="text-slate-900 dark:text-slate-100 whitespace-pre-wrap mb-3">
                    {q.responseText}
                  </p>
                )}
                {q.responseVideoUrl && (
                  <a
                    href={q.responseVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-corporate-teal hover:underline"
                  >
                    <Video className="w-4 h-4" />
                    Watch video reply
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};

export default AskCoach;
