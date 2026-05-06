// src/components/screens/AskCoach.jsx
//
// Ascent Revamp WS-4 — Ask a Coach.
// Submit a question (title + question + optional RR tag), see the coach's
// short video reply. One open question at a time encouraged but not enforced.
//
// Per spec: response area is video-only — we do not render a text reply.

import React, { useEffect, useState } from 'react';
import {
  Megaphone, Send, Loader2, CheckCircle2,
  Clock, Video, X, AlertCircle, Tag,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { PageLayout } from '../ui/PageLayout';
import VoiceTextarea from '../conditioning/VoiceTextarea';
import {
  subscribeUserQuestions,
  submitQuestion,
  cancelQuestion,
} from '../../services/coachQuestionsService';

const RR_TAG_OPTIONS = [
  { value: '',    label: 'None / not sure' },
  { value: 'DRF', label: 'Reinforcing Feedback' },
  { value: 'RED', label: 'Redirecting Feedback' },
  { value: 'FUW', label: 'Follow-Up on Work' },
  { value: 'SCE', label: 'Set Clear Expectations' },
];
const RR_TAG_LABEL = RR_TAG_OPTIONS.reduce((acc, o) => {
  if (o.value) acc[o.value] = o.label;
  return acc;
}, {});

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
  const { db, user, navigate } = useAppServices();
  const userId = user?.uid;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Derive a short title from the first sentence (or first ~60 chars) of the
  // question. Trainers use the title in the inbox to scan submissions.
  const deriveTitle = (text) => {
    const clean = (text || '').trim().replace(/\s+/g, ' ');
    if (!clean) return '';
    // Prefer the first sentence if it's a reasonable length.
    const firstSentence = clean.split(/(?<=[.?!])\s/)[0] || clean;
    const candidate = firstSentence.length <= 80 ? firstSentence : clean;
    return candidate.length <= 80 ? candidate : `${candidate.slice(0, 77).trimEnd()}…`;
  };

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
        title: deriveTitle(questionText) || 'Question for trainer',
        question: questionText,
        context: '',
        rrTag: null,
      });
      setQuestionText('');
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
    <PageLayout
      title="Ask a Trainer"
      icon={Megaphone}
      subtitle="Stuck on something? Send a question. A trainer will reply with a short video or written response."
      navigate={navigate}
      breadcrumbs={[
        { label: 'Home', path: 'dashboard' },
        { label: 'Ask a Trainer', path: null },
      ]}
    >

      {/* Submit form */}
      <form
        onSubmit={onSubmit}
        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 mb-8"
      >
        <label
          htmlFor="ask-question"
          className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          What do you want to ask?
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
          Type or tap the mic. Include any context that helps a trainer answer well.
        </p>
        <VoiceTextarea
          id="ask-question"
          rows={6}
          value={questionText}
          onChange={setQuestionText}
          disabled={submitting}
          placeholder="e.g. I'm about to give a tough RED to a peer who outranks me. How do I open it without putting them on the defensive?"
          className="mb-3"
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
            <span>Sent. A trainer will reply shortly.</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || questionText.trim().length < 10}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Sending…' : 'Send to Trainer'}
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

            {q.title && (
              <h3 className="text-base font-semibold text-corporate-navy dark:text-white mb-1">
                {q.title}
              </h3>
            )}
            {q.rrTag && RR_TAG_LABEL[q.rrTag] && (
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-corporate-teal bg-corporate-teal/10 border border-corporate-teal/30 rounded-full px-2 py-0.5 mb-2">
                <Tag className="w-3 h-3" />
                {RR_TAG_LABEL[q.rrTag]}
              </div>
            )}

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
                  Trainer&apos;s reply
                  {q.respondedAt && (
                    <span className="ml-2 font-normal text-slate-500">
                      · {formatTimestamp(q.respondedAt)}
                    </span>
                  )}
                </div>
                {q.responseText && (
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap mb-2">
                    {q.responseText}
                  </p>
                )}
                {q.responseVideoUrl ? (
                  <a
                    href={q.responseVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-corporate-teal hover:underline"
                  >
                    <Video className="w-4 h-4" />
                    Watch video reply
                  </a>
                ) : (
                  !q.responseText && (
                    <p className="text-sm text-slate-500 italic">
                      Reply not available.
                    </p>
                  )
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </PageLayout>
  );
};

export default AskCoach;
