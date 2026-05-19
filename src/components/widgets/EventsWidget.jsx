// src/components/widgets/EventsWidget.jsx
//
// Unified Events card for the Dashboard — replaces the separate
// MyEventsWidget + UpcomingEventsWidget pair with a single tabbed card.
// Tabs:
//   - "My Events"  → events the user is registered for (Join CTA in window)
//   - "Upcoming"   → events available to register (Register CTA)
//
// Mirrors the AskTrainerWidget tab pattern intentionally — the dashboard
// reads more cohesively when "things that are mine vs. things in the pool"
// uses one shape across cards.
//
// Default tab:
//   - 'mine' if the user has any registered upcoming events
//   - 'upcoming' otherwise (so the card is never empty when content exists)

import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
  AlertCircle,
  X,
  MapPin,
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices.jsx';
import { useEvents } from '../../providers/EventsProvider.jsx';
import { useCardMorph } from '../../hooks/useCardMorph';

const isJoinable = (event) => {
  if (!event?.startsAt) return false;
  const now = Date.now();
  const start = event.startsAt.getTime();
  const end = start + (event.durationMinutes || 60) * 60 * 1000;
  return now >= start - 15 * 60 * 1000 && now <= end;
};

const formatWhen = (event) => {
  if (!event?.startsAt) return event?.date || 'TBD';
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

const EventsWidget = () => {
  const { navigate } = useAppServices();
  const { events, loading, register } = useEvents();
  const [tab, setTab] = useState('mine');
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

  // Mine: registered + still upcoming, sorted soonest-first.
  const mine = useMemo(() => {
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

  // Upcoming: not registered, not cancelled, has spots, future-dated.
  const upcoming = useMemo(() => {
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

  // Pick the most useful default tab once data lands.
  // Only auto-switch on initial load — if the user manually flips tabs we
  // respect their choice from then on (tracked via `userPicked`).
  const [userPicked, setUserPicked] = useState(false);
  useEffect(() => {
    if (loading || userPicked) return;
    if (mine.length === 0 && upcoming.length > 0) setTab('upcoming');
    else setTab('mine');
  }, [loading, mine.length, upcoming.length, userPicked]);

  const goToEvents = () =>
    navigate?.('events') || navigate?.('community-hub');

  const handleRegister = async (event) => {
    setBusyId(event.id);
    setError(null);
    try {
      await register(event);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[EventsWidget] register failed', {
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

  const activeList = tab === 'mine' ? mine : upcoming;
  const layoutPrefix = tab === 'mine' ? 'ev-mine' : 'ev-up';

  return (
    <>
      <Card
        className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-teal relative overflow-hidden p-4 sm:p-5"
        aria-labelledby="events-widget-heading"
      >
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar
              className="w-5 h-5 text-corporate-teal"
              aria-hidden="true"
            />
            <h2
              id="events-widget-heading"
              className="text-base font-semibold text-corporate-navy dark:text-white"
            >
              Events
            </h2>
          </div>
          <button
            type="button"
            onClick={goToEvents}
            className="text-xs font-semibold text-corporate-teal-ink hover:underline inline-flex items-center gap-1"
          >
            Browse all
            <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </header>

        <div
          className="flex gap-1 mb-3 border-b border-slate-200 dark:border-slate-700"
          role="tablist"
          aria-label="Events tabs"
        >
          {[
            { id: 'mine', label: 'My Events', count: mine.length },
            { id: 'upcoming', label: 'Upcoming', count: upcoming.length },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setUserPicked(true);
                  setTab(t.id);
                }}
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

        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle
              className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" aria-label="Loading" />
          </div>
        ) : activeList.length === 0 ? (
          <div className="text-sm text-slate-600 dark:text-slate-300 py-3">
            {tab === 'mine' ? (
              <>
                You haven&apos;t registered for any upcoming events yet.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setUserPicked(true);
                    setTab('upcoming');
                  }}
                  className="font-semibold text-corporate-teal-ink hover:underline"
                >
                  See what&apos;s upcoming
                </button>
              </>
            ) : (
              'No upcoming events available right now.'
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {activeList.map((event) => {
              const layoutKey = `${layoutPrefix}-${event.id}`;
              const isExpanded = morphEnabled && expandedKey === layoutKey;
              const joinable = tab === 'mine' && isJoinable(event);

              const rowInner = (
                <>
                  <button
                    type="button"
                    onClick={() => morphEnabled && openMorph(layoutKey)}
                    className={`min-w-0 text-left flex-1 ${
                      morphEnabled
                        ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal rounded'
                        : 'cursor-default'
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

                  {tab === 'mine' ? (
                    joinable && event.link ? (
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
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRegister(event)}
                      disabled={busyId === event.id}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {busyId === event.id && (
                        <Loader2
                          className="w-3 h-3 animate-spin"
                          aria-hidden="true"
                        />
                      )}
                      Register
                    </button>
                  )}
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

      {/* Morphing event detail card (flag-gated). Same layoutId on both ends.
          See AskTrainerWidget for the canonical pattern + the layoutId/translate
          gotcha. */}
      <AnimatePresence>
        {morphEnabled &&
          expandedKey &&
          (() => {
            const ev = activeList.find(
              (e) => `${layoutPrefix}-${e.id}` === expandedKey,
            );
            if (!ev) return null;
            const showRegister = tab === 'upcoming';
            return (
              <>
                <motion.div
                  key="events-scrim"
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
                    key="events-expanded"
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
                      transition={{
                        delay: prefersReducedMotion ? 0 : 0.12,
                        duration: 0.15,
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-corporate-navy dark:text-white">
                          {ev.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          {formatWhen(ev)}
                        </p>
                        {showRegister &&
                          typeof ev.spotsLeft === 'number' &&
                          ev.spotsLeft > 0 && (
                            <p className="mt-1 text-[11px] font-semibold text-corporate-teal-ink">
                              {ev.spotsLeft} spot
                              {ev.spotsLeft === 1 ? '' : 's'} left
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
                      transition={{
                        delay: prefersReducedMotion ? 0 : 0.14,
                        duration: 0.18,
                      }}
                    >
                      {ev.description && (
                        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                          {ev.description}
                        </p>
                      )}
                      {ev.location && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">
                          <MapPin
                            className="w-4 h-4 text-slate-400"
                            aria-hidden="true"
                          />
                          {ev.location}
                        </p>
                      )}
                      {showRegister ? (
                        <button
                          type="button"
                          onClick={async () => {
                            await handleRegister(ev);
                            closeMorph();
                          }}
                          disabled={busyId === ev.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {busyId === ev.id && (
                            <Loader2
                              className="w-4 h-4 animate-spin"
                              aria-hidden="true"
                            />
                          )}
                          Register for this event
                        </button>
                      ) : (
                        ev.link && (
                          <a
                            href={ev.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90"
                          >
                            <ExternalLink
                              className="w-4 h-4"
                              aria-hidden="true"
                            />
                            {isJoinable(ev) ? 'Join now' : 'Open event link'}
                          </a>
                        )
                      )}
                      {!ev.description && !ev.location && !showRegister && !ev.link && (
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

export default React.memo(EventsWidget);
