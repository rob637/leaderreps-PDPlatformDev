// src/components/widgets/AskTrainerWidget.jsx
//
// Ryan's revamped Dashboard — "Ask a Trainer" section.
// Two tabs: My Questions (private) and Other Questions (publicly curated,
// answered-only — see Firestore rules on coach_questions).

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices.jsx';
import {
  subscribeUserQuestions,
  subscribeAnsweredQuestions,
} from '../../services/coachQuestionsService';
import { useCardMorph } from '../../hooks/useCardMorph';

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

// Inline-accordion fallback used when the `dashboard-card-morph` flag is OFF.
// Each row tracks its own open/closed state and reveals the coach response
// directly underneath — no portal, no scrim, no shared-element transition.
const QuestionRowInline = ({ item, showAuthor }) => {
  const hasResponse = !!(item.responseText || item.responseVideoUrl);
  const [open, setOpen] = useState(false);
  return (
    <li className="py-2.5">
      <button
        type="button"
        onClick={() => hasResponse && setOpen((v) => !v)}
        className={`w-full text-left flex items-start justify-between gap-3 ${
          hasResponse ? 'cursor-pointer' : 'cursor-default'
        } focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal rounded`}
        aria-expanded={hasResponse ? open : undefined}
        tabIndex={hasResponse ? 0 : -1}
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
            className={`w-4 h-4 mt-1 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`}
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
              className="inline-flex items-center gap-1 text-sm font-semibold text-corporate-teal-ink hover:underline mb-2"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              Watch coach reply
            </a>
          )}
          {item.responseText && (
            <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
              {item.responseText}
            </p>
          )}
        </div>
      )}
    </li>
  );
};

const QuestionRow = ({ item, showAuthor, layoutKey, isExpanded, onOpen, transition }) => {
  const hasResponse = !!(item.responseText || item.responseVideoUrl);

  // Inner content shared by the morph source AND the placeholder so the row
  // height stays identical when the card "lifts" out — no layout jump.
  const rowInner = (
    <button
      type="button"
      onClick={() => hasResponse && onOpen(layoutKey)}
      className={`w-full text-left flex items-start justify-between gap-3 ${
        hasResponse ? 'cursor-pointer' : 'cursor-default'
      } focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal rounded`}
      aria-expanded={hasResponse ? isExpanded : undefined}
      tabIndex={hasResponse ? 0 : -1}
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
        <ChevronRight className="w-4 h-4 mt-1 text-slate-400" aria-hidden="true" />
      )}
    </button>
  );

  if (isExpanded) {
    // Render an invisible clone so the list reserves the row's exact height
    // while the "real" card lives in the centered overlay via shared layoutId.
    return (
      <li className="py-2.5" style={{ visibility: 'hidden' }} aria-hidden="true">
        {rowInner}
      </li>
    );
  }

  // Only morph rows that have a coach response — questions still awaiting a
  // reply have nothing to expand into.
  if (!hasResponse) {
    return <li className="py-2.5">{rowInner}</li>;
  }

  return (
    <motion.li
      layoutId={layoutKey}
      transition={transition}
      className="py-2.5"
    >
      {rowInner}
    </motion.li>
  );
};

const AskTrainerWidget = () => {
  const { db, user, navigate } = useAppServices();
  const {
    morphEnabled,
    expandedKey,
    openMorph,
    closeMorph,
    prefersReducedMotion,
    transition,
  } = useCardMorph();
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

  // Resolve the currently-expanded item from whichever list it belongs to so
  // the overlay can render its full coach response.
  const expandedItem = expandedKey
    ? [...mine, ...other].find((q) => {
        const k = `atw-q-${tab}-${q.id}`;
        return k === expandedKey || expandedKey.endsWith(`-${q.id}`);
      })
    : null;

  const goAsk = () => navigate?.('ask-coach');
  const goArchive = () => navigate?.('ask-trainer-archive');

  return (
    <>
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
        <div className="text-sm text-slate-600 dark:text-slate-300 py-3">
          {tab === 'mine'
            ? 'You haven\u2019t asked anything yet. Tap “Ask” to send your first question.'
            : 'No answered questions yet. Be the first to ask one.'}
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {items.slice(0, DASHBOARD_LIMIT).map((q) => {
            if (!morphEnabled) {
              return (
                <QuestionRowInline
                  key={q.id}
                  item={q}
                  showAuthor={tab === 'other'}
                />
              );
            }
            const layoutKey = `atw-q-${tab}-${q.id}`;
            return (
              <QuestionRow
                key={q.id}
                item={q}
                showAuthor={tab === 'other'}
                layoutKey={layoutKey}
                isExpanded={expandedKey === layoutKey}
                onOpen={openMorph}
                transition={transition}
              />
            );
          })}
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

    {/* Morphing answer card — same layoutId as the clicked row → framer
        interpolates position, size, and corner radius between them.
        Only mounted when the `dashboard-card-morph` flag is ON. */}
    <AnimatePresence>
      {morphEnabled && expandedKey && expandedItem && (
        <>
          <motion.div
            key="atw-scrim"
            className="fixed inset-0 z-50 bg-corporate-navy/40 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
            onClick={closeMorph}
            aria-hidden="true"
          />

          {/* Centering wrapper — framer-motion writes to `transform` for the
              layout animation, so we must NOT use Tailwind's translate-* utilities
              on the morphed card itself. Flex centering avoids the collision. */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="atw-expanded"
              layoutId={expandedKey}
              transition={transition}
              role="dialog"
              aria-modal="true"
              aria-label={expandedItem.title || 'Trainer response'}
              className="w-full max-w-2xl max-h-[85vh] overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 shadow-2xl flex flex-col pointer-events-auto"
            >
            {/* Header — title + close. Fades in after the morph settles so
                it doesn't fight the layout interpolation. */}
            <motion.div
              className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.12, duration: 0.15 }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-corporate-navy dark:text-white">
                  {expandedItem.title || expandedItem.question?.slice(0, 80) || 'Untitled question'}
                </p>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <StatusPill status={expandedItem.status} />
                  {expandedItem.respondedBy && (
                    <span className="text-[11px] text-slate-500">
                      · Coach {expandedItem.respondedBy.split(' ')[0]}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={closeMorph}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Body — full question + coach response */}
            <motion.div
              className="overflow-y-auto flex-1 p-5 space-y-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.14, duration: 0.18 }}
            >
              {expandedItem.question && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">
                    Your question
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                    {expandedItem.question}
                  </p>
                </div>
              )}
              {(expandedItem.responseText || expandedItem.responseVideoUrl) && (
                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-corporate-teal mb-2">
                    Coach response
                  </p>
                  {expandedItem.responseVideoUrl && (
                    <a
                      href={expandedItem.responseVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-corporate-teal-ink hover:underline mb-2"
                    >
                      <Play className="w-4 h-4" aria-hidden="true" />
                      Watch coach reply
                    </a>
                  )}
                  {expandedItem.responseText && (
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                      {expandedItem.responseText}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};

export default React.memo(AskTrainerWidget);
