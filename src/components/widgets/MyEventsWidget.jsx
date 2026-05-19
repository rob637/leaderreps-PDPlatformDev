// src/components/widgets/MyEventsWidget.jsx
//
// Ryan's revamped Dashboard — "My Events" section.
// Shows the user's REGISTERED upcoming events in chronological order with a
// Join CTA when the event is in the join window. Tap-through opens the full
// Events screen.

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ExternalLink, ChevronRight, Loader2, X, MapPin } from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useEvents } from '../../providers/EventsProvider.jsx';
import { useCardMorph } from '../../hooks/useCardMorph';

const isJoinable = (event) => {
  if (!event.startsAt) return false;
  const now = Date.now();
  const start = event.startsAt.getTime();
  const end = start + (event.durationMinutes || 60) * 60 * 1000;
  return now >= start - 15 * 60 * 1000 && now <= end;
};

const formatWhen = (event) => {
  if (!event.startsAt) return event.date || 'TBD';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(event.startsAt);
  d.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  const dateLabel =
    diff === 0
      ? 'Today'
      : diff === 1
        ? 'Tomorrow'
        : event.startsAt.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
  const timeLabel = event.time ? ` · ${event.time}` : '';
  const dur = event.durationMinutes ? ` · ${event.durationMinutes}m` : '';
  return `${dateLabel}${timeLabel}${dur}`;
};

const MyEventsWidget = () => {
  const { navigate } = useAppServices();
  const { events, loading } = useEvents();
  const {
    morphEnabled,
    expandedKey,
    openMorph,
    closeMorph,
    prefersReducedMotion,
    transition,
  } = useCardMorph();

  const myUpcoming = useMemo(() => {
    const now = Date.now();
    return (events || [])
      .filter((e) => e.isRegistered)
      .filter((e) => {
        if (!e.startsAt) return true;
        const end =
          e.startsAt.getTime() + (e.durationMinutes || 60) * 60 * 1000;
        return end >= now;
      })
      .sort(
        (a, b) =>
          (a.startsAt?.getTime?.() || 0) - (b.startsAt?.getTime?.() || 0),
      )
      .slice(0, 5);
  }, [events]);

  const goToEvents = () =>
    navigate?.('events') || navigate?.('community-hub');

  return (
    <>
    <Card
      className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-teal relative overflow-hidden p-4 sm:p-5"
      aria-labelledby="ascent-my-events-heading"
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-corporate-teal" aria-hidden="true" />
          <h2
            id="ascent-my-events-heading"
            className="text-base font-semibold text-corporate-navy dark:text-white"
          >
            My Events
          </h2>
        </div>
        <button
          type="button"
          onClick={goToEvents}
          className="text-xs font-semibold text-corporate-teal-ink hover:underline inline-flex items-center gap-1"
        >
          View all <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading" />
        </div>
      ) : myUpcoming.length === 0 ? (
        <div className="text-sm text-slate-600 dark:text-slate-300 py-3">
          You haven&apos;t registered for any upcoming events yet.{' '}
          <button
            type="button"
            onClick={goToEvents}
            className="font-semibold text-corporate-teal-ink hover:underline"
          >
            Browse events
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {myUpcoming.map((event) => {
            const joinable = isJoinable(event);
            const layoutKey = `me-event-${event.id}`;
            const isExpanded = morphEnabled && expandedKey === layoutKey;
            const rowInner = (
              <>
                <button
                  type="button"
                  onClick={() => morphEnabled && openMorph(layoutKey)}
                  className={`min-w-0 text-left flex-1 ${
                    morphEnabled ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal rounded' : 'cursor-default'
                  }`}
                  tabIndex={morphEnabled ? 0 : -1}
                  aria-expanded={morphEnabled ? isExpanded : undefined}
                >
                  <p className="text-sm font-semibold text-corporate-navy dark:text-white truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {formatWhen(event)}
                  </p>
                </button>
                {joinable && event.link ? (
                  <a
                    href={event.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-corporate-orange text-white hover:bg-corporate-orange/90"
                  >
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    Join
                  </a>
                ) : (
                  <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Registered
                  </span>
                )}
              </>
            );

            if (isExpanded) {
              // Invisible clone preserves row height during morph
              return (
                <li
                  key={event.id}
                  aria-hidden="true"
                  style={{ visibility: 'hidden' }}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  {rowInner}
                </li>
              );
            }

            if (!morphEnabled) {
              return (
                <li
                  key={event.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  {rowInner}
                </li>
              );
            }

            return (
              <motion.li
                key={event.id}
                layoutId={layoutKey}
                transition={transition}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                {rowInner}
              </motion.li>
            );
          })}
        </ul>
      )}
    </Card>

    {/* Morphing event detail card (flag-gated). Same layoutId on both ends.
        See AskTrainerWidget for the canonical pattern + the layoutId/translate
        gotcha. */}
    <AnimatePresence>
      {morphEnabled && expandedKey && (() => {
        const ev = myUpcoming.find((e) => `me-event-${e.id}` === expandedKey);
        if (!ev) return null;
        return (
          <>
            <motion.div
              key="me-scrim"
              className="fixed inset-0 z-50 bg-corporate-navy/40 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.18 }}
              onClick={closeMorph}
              aria-hidden="true"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                key="me-expanded"
                layoutId={expandedKey}
                transition={transition}
                role="dialog"
                aria-modal="true"
                aria-label={ev.title}
                className="w-full max-w-xl max-h-[85vh] overflow-hidden bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 shadow-2xl flex flex-col pointer-events-auto"
              >
                <motion.div
                  className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 shrink-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.12, duration: 0.15 }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-corporate-navy dark:text-white">
                      {ev.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      {formatWhen(ev)}
                    </p>
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
                <motion.div
                  className="overflow-y-auto flex-1 p-5 space-y-4"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.14, duration: 0.18 }}
                >
                  {ev.description && (
                    <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                      {ev.description}
                    </p>
                  )}
                  {ev.location && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      {ev.location}
                    </p>
                  )}
                  {ev.link && (
                    <a
                      href={ev.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90"
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      {isJoinable(ev) ? 'Join now' : 'Open event link'}
                    </a>
                  )}
                  {!ev.description && !ev.location && !ev.link && (
                    <p className="text-sm text-slate-500 italic">
                      No additional details for this event.
                    </p>
                  )}
                </motion.div>
              </motion.div>
            </div>
          </>
        );
      })()}
    </AnimatePresence>
    </>
  );
};

export default React.memo(MyEventsWidget);
