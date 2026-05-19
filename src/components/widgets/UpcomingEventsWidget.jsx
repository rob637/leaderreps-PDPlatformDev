// src/components/widgets/UpcomingEventsWidget.jsx
//
// Ryan's revamped Dashboard — "Upcoming Events" section.
// Shows AVAILABLE (not yet registered) events the user can register for, with
// a one-tap Register CTA. Tap-through opens the full Events screen.

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, ChevronRight, Loader2, AlertCircle, X, MapPin } from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useEvents } from '../../providers/EventsProvider.jsx';
import { useCardMorph } from '../../hooks/useCardMorph';

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

const UpcomingEventsWidget = () => {
  const { navigate } = useAppServices();
  const { events, loading, register } = useEvents();
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);
  const {
    morphEnabled,
    expandedKey,
    openMorph,
    closeMorph,
    prefersReducedMotion,
    transition,
  } = useCardMorph();

  const available = useMemo(() => {
    const now = Date.now();
    return (events || [])
      .filter((e) => !e.isRegistered)
      .filter((e) => e.status !== 'cancelled')
      .filter((e) => e.spotsLeft !== 0)
      .filter((e) => {
        if (!e.startsAt) return true;
        return e.startsAt.getTime() >= now;
      })
      .sort(
        (a, b) =>
          (a.startsAt?.getTime?.() || 0) - (b.startsAt?.getTime?.() || 0),
      )
      .slice(0, 5);
  }, [events]);

  const handleRegister = async (event) => {
    setBusyId(event.id);
    setError(null);
    try {
      await register(event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AscentUpcomingEvents] register failed', {
        code: err?.code,
        message: err?.message,
        event,
        err,
      });
      const code = err?.message || '';
      if (code === 'SESSION_FULL') {
        setError(`"${event.title}" is now full.`);
      } else if (err?.code === 'permission-denied') {
        setError('Registration was blocked by a permissions check.');
      } else {
        setError(err?.message || 'Could not register. Try again.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const goToEvents = () =>
    navigate?.('events') || navigate?.('community-hub');

  return (
    <>
    <Card
      className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-orange relative overflow-hidden p-4 sm:p-5"
      aria-labelledby="ascent-upcoming-events-heading"
    >
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-corporate-orange" aria-hidden="true" />
          <h2
            id="ascent-upcoming-events-heading"
            className="text-base font-semibold text-corporate-navy dark:text-white"
          >
            Upcoming Events
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

      {error && (
        <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading" />
        </div>
      ) : available.length === 0 ? (
        <div className="text-sm text-slate-600 dark:text-slate-300 py-3">
          No upcoming events available right now.
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {available.map((event) => {
            const layoutKey = `ue-event-${event.id}`;
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
                <button
                  type="button"
                  onClick={() => handleRegister(event)}
                  disabled={busyId === event.id}
                  className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busyId === event.id && (
                    <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                  )}
                  Register
                </button>
              </>
            );

            if (isExpanded) {
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

    {/* Morphing event detail (flag-gated). See AskTrainerWidget for the
        canonical pattern + the layoutId/translate gotcha. */}
    <AnimatePresence>
      {morphEnabled && expandedKey && (() => {
        const ev = available.find((e) => `ue-event-${e.id}` === expandedKey);
        if (!ev) return null;
        return (
          <>
            <motion.div
              key="ue-scrim"
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
                key="ue-expanded"
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
                    {typeof ev.spotsLeft === 'number' && ev.spotsLeft > 0 && (
                      <p className="mt-1 text-[11px] font-semibold text-corporate-teal-ink">
                        {ev.spotsLeft} spot{ev.spotsLeft === 1 ? '' : 's'} left
                      </p>
                    )}
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
                  <button
                    type="button"
                    onClick={async () => { await handleRegister(ev); closeMorph(); }}
                    disabled={busyId === ev.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busyId === ev.id && (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    )}
                    Register for this event
                  </button>
                  {!ev.description && !ev.location && (
                    <p className="text-xs text-slate-500 italic">
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

export default React.memo(UpcomingEventsWidget);
