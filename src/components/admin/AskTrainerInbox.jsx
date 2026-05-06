// src/components/admin/AskTrainerInbox.jsx
//
// Trainer/admin inbox for "Ask a Trainer" submissions (collection:
// `coach_questions`). Lets a responder browse open / answered / cancelled
// questions, post a written reply with an optional video URL, and reopen
// answered ones.
//
// Permissions are enforced by firestore.rules (`isAskCoachResponder`).

import React, { useEffect, useMemo, useState } from 'react';
import {
  Megaphone, Loader2, Send, Video, CheckCircle2, Clock, X,
  AlertCircle, RotateCcw, Tag, Mail, Library, Check,
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import {
  subscribeAllQuestions,
  respondToQuestion,
  reopenQuestion,
} from '../../services/coachQuestionsService';
import {
  createMediaAssetFromUrl,
  MEDIA_TYPES,
} from '../../services/mediaService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

const RR_TAG_LABEL = {
  DRF: 'Reinforcing Feedback',
  RED: 'Redirecting Feedback',
  FUW: 'Follow-Up on Work',
  SCE: 'Set Clear Expectations',
};

const STATUS_TABS = [
  { key: 'open', label: 'Open', icon: Clock, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'answered', label: 'Answered', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'cancelled', label: 'Cancelled', icon: X, cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  { key: 'all', label: 'All', icon: Megaphone, cls: 'bg-slate-100 text-slate-700 border-slate-200' },
];

const formatTimestamp = (ts) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const StatusPill = ({ status }) => {
  const meta = STATUS_TABS.find((s) => s.key === status) || STATUS_TABS[0];
  const Icon = meta.icon;
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${meta.cls}`}>
      <Icon className="w-3 h-3" />
      {meta.label}
    </span>
  );
};

const ReplyForm = ({ question, onSubmit, busy }) => {
  const [text, setText] = useState(question.responseText || '');
  const [videoUrl, setVideoUrl] = useState(question.responseVideoUrl || '');
  const alreadyPublished = !!question.publishedToLibraryId;
  const [publishToLibrary, setPublishToLibrary] = useState(false);
  const [libraryTitle, setLibraryTitle] = useState(
    question.title ? `Trainer answer: ${question.title}` : ''
  );
  const [libraryTags, setLibraryTags] = useState(
    question.rrTag ? question.rrTag : ''
  );
  const [error, setError] = useState(null);

  const canPublish = !!videoUrl.trim() && !alreadyPublished;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        responseText: text,
        responseVideoUrl: videoUrl,
        publishToLibrary: publishToLibrary && canPublish,
        libraryTitle: libraryTitle.trim(),
        libraryTags: libraryTags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError(err?.message || 'Could not send reply.');
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3"
    >
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
          Your reply
        </label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          placeholder="Write a thoughtful reply for the leader…"
          className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-corporate-teal focus:outline-none focus:ring-1 focus:ring-corporate-teal text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
          Video URL <span className="font-normal normal-case text-slate-400">(optional · Loom, YouTube, Vimeo)</span>
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          disabled={busy}
          placeholder="https://www.loom.com/share/..."
          className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-corporate-teal focus:outline-none focus:ring-1 focus:ring-corporate-teal text-sm"
        />
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3">
        {alreadyPublished ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Check className="w-4 h-4" />
            Already published to the Media Vault.
          </div>
        ) : (
          <>
            <label className={`flex items-start gap-2 text-sm ${canPublish ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
              <input
                type="checkbox"
                checked={publishToLibrary && canPublish}
                disabled={!canPublish || busy}
                onChange={(e) => setPublishToLibrary(e.target.checked)}
                className="mt-0.5 accent-corporate-teal"
              />
              <span className="flex-1">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Library className="w-4 h-4" /> Publish this video to the Media Vault
                </span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {canPublish
                    ? 'Adds the video URL as a Media Vault entry so other leaders & content editors can reuse it.'
                    : 'Add a video URL above to enable.'}
                </span>
              </span>
            </label>
            {publishToLibrary && canPublish && (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Library title</label>
                  <input
                    type="text"
                    value={libraryTitle}
                    onChange={(e) => setLibraryTitle(e.target.value)}
                    disabled={busy}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-corporate-teal focus:outline-none focus:ring-1 focus:ring-corporate-teal text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Tags <span className="font-normal normal-case text-slate-400">(comma-separated)</span></label>
                  <input
                    type="text"
                    value={libraryTags}
                    onChange={(e) => setLibraryTags(e.target.value)}
                    disabled={busy}
                    placeholder="e.g. RED, feedback, ask-a-trainer"
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-corporate-teal focus:outline-none focus:ring-1 focus:ring-corporate-teal text-sm"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {error && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy || (!text.trim() && !videoUrl.trim())}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {busy ? 'Sending…' : (question.status === 'answered' ? 'Update reply' : 'Send reply')}
        </button>
      </div>
    </form>
  );
};

const QuestionRow = ({ question, expanded, onToggle, onReply, onReopen, busy }) => {
  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <StatusPill status={question.status} />
          <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
            {formatTimestamp(question.createdAt)}
          </span>
        </div>

        {question.title && (
          <h3 className="text-base font-semibold text-corporate-navy dark:text-white mb-1">
            {question.title}
          </h3>
        )}

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Mail className="w-3 h-3" />
            {question.userName || question.userEmail || 'Unknown leader'}
          </span>
          {question.rrTag && RR_TAG_LABEL[question.rrTag] && (
            <span className="inline-flex items-center gap-1 text-corporate-teal">
              <Tag className="w-3 h-3" />
              {RR_TAG_LABEL[question.rrTag]}
            </span>
          )}
          {question.status === 'answered' && question.respondedAt && (
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Answered {formatTimestamp(question.respondedAt)}
              {question.respondedBy ? ` by ${question.respondedBy}` : ''}
            </span>
          )}
          {question.publishedToLibraryId && (
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Library className="w-3 h-3" />
              In Media Vault
            </span>
          )}
        </div>

        <p className={`text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap ${expanded ? '' : 'line-clamp-3'}`}>
          {question.question}
        </p>
      </button>

      {expanded && (
        <>
          {question.context && (
            <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Context from leader
              </div>
              {question.context}
            </div>
          )}

          {question.status === 'answered' && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="text-xs font-semibold uppercase tracking-wider text-corporate-teal mb-2">
                Current reply
              </div>
              {question.responseText && (
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-2">
                  {question.responseText}
                </p>
              )}
              {question.responseVideoUrl && (
                <a
                  href={question.responseVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-corporate-teal hover:underline"
                >
                  <Video className="w-4 h-4" />
                  {question.responseVideoUrl}
                </a>
              )}
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={onReopen}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-corporate-orange disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen
                </button>
              </div>
            </div>
          )}

          {(question.status === 'open' || question.status === 'answered') && (
            <ReplyForm question={question} onSubmit={onReply} busy={busy} />
          )}
        </>
      )}
    </article>
  );
};

const AskTrainerInbox = () => {
  const { db, user } = useAppServices();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [globalError, setGlobalError] = useState(null);

  useEffect(() => {
    if (!db) return undefined;
    setLoading(true);
    const opts = statusFilter === 'all' ? {} : { status: statusFilter };
    const unsub = subscribeAllQuestions(
      db,
      (items) => {
        setQuestions(items);
        setLoading(false);
      },
      opts
    );
    return unsub;
  }, [db, statusFilter]);

  const counts = useMemo(() => {
    // Counts only reflect the currently subscribed slice; for "all" we also
    // surface a per-status breakdown.
    const map = { open: 0, answered: 0, cancelled: 0 };
    questions.forEach((q) => {
      if (map[q.status] != null) map[q.status] += 1;
    });
    return map;
  }, [questions]);

  const handleReply = async (questionId, payload) => {
    setBusyId(questionId);
    setGlobalError(null);
    try {
      const {
        publishToLibrary,
        libraryTitle,
        libraryTags,
        ...replyPayload
      } = payload || {};
      await respondToQuestion(db, user, questionId, replyPayload);

      if (publishToLibrary && replyPayload.responseVideoUrl) {
        const q = questions.find((x) => x.id === questionId) || {};
        try {
          const asset = await createMediaAssetFromUrl(db, {
            url: replyPayload.responseVideoUrl,
            title: libraryTitle || `Trainer answer: ${q.title || 'Ask a Trainer'}`,
            type: MEDIA_TYPES.VIDEO,
            tags: libraryTags || [],
            description: replyPayload.responseText || '',
            source: 'external',
            sourceMeta: {
              kind: 'ask-a-trainer',
              questionId,
              questionTitle: q.title || null,
              rrTag: q.rrTag || null,
            },
            createdBy: user?.email || user?.uid || null,
          });
          // Backlink so the inbox knows it's been published.
          await updateDoc(doc(db, 'coach_questions', questionId), {
            publishedToLibraryId: asset.id,
            publishedToLibraryAt: serverTimestamp(),
            publishedToLibraryBy: user?.email || user?.uid || null,
            updatedAt: serverTimestamp(),
          });
        } catch (pubErr) {
          // Don't fail the whole reply if publish fails — surface error.
          setGlobalError(`Reply sent, but publishing to library failed: ${pubErr?.message || pubErr}`);
        }
      }

      setExpandedId(null);
    } catch (err) {
      setGlobalError(err?.message || 'Could not send reply.');
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  const handleReopen = async (questionId) => {
    setBusyId(questionId);
    setGlobalError(null);
    try {
      await reopenQuestion(db, questionId);
    } catch (err) {
      setGlobalError(err?.message || 'Could not reopen question.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-corporate-teal/10 rounded-lg">
            <Megaphone className="w-5 h-5 text-corporate-teal" />
          </div>
          <h1 className="text-2xl font-bold text-corporate-navy dark:text-white">
            Ask a Trainer — Inbox
          </h1>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Questions submitted by leaders through the &ldquo;Ask a Trainer&rdquo; flow.
          Open one, type a reply, and (optionally) drop in a Loom/Video link.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                isActive
                  ? 'bg-corporate-teal text-white border-corporate-teal'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {statusFilter === tab.key && tab.key !== 'all' && (
                <span className="ml-1 opacity-90">({questions.length})</span>
              )}
            </button>
          );
        })}
      </div>

      {globalError && (
        <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {!loading && questions.length === 0 && (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          {statusFilter === 'open'
            ? 'Inbox zero — no open questions.'
            : `No ${statusFilter === 'all' ? '' : statusFilter} questions to show.`}
        </div>
      )}

      <div className="space-y-3">
        {questions.map((q) => (
          <QuestionRow
            key={q.id}
            question={q}
            expanded={expandedId === q.id}
            onToggle={() => setExpandedId(expandedId === q.id ? null : q.id)}
            onReply={(payload) => handleReply(q.id, payload)}
            onReopen={() => handleReopen(q.id)}
            busy={busyId === q.id}
          />
        ))}
      </div>

      {statusFilter === 'all' && questions.length > 0 && (
        <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-right">
          {counts.open} open · {counts.answered} answered · {counts.cancelled} cancelled
        </div>
      )}
    </div>
  );
};

export default AskTrainerInbox;
