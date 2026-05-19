// src/components/widgets/AscentMyEventsWidget.jsx
//
// Ryan's revamped Dashboard — "My Events" section.
// Shows the user's REGISTERED upcoming events in chronological order with a
// Join CTA when the event is in the join window. Tap-through opens the full
// Events screen.

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, ExternalLink, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices.jsx';
import { subscribeUpcomingEvents } from '../../services/eventsService';

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

const AscentMyEventsWidget = () => {
  const { db, user, navigate } = useAppServices();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user?.uid) return undefined;
    setLoading(true);
    const unsub = subscribeUpcomingEvents(db, user.uid, (items) => {
      setEvents(items || []);
      setLoading(false);
    });
    return unsub;
  }, [db, user?.uid]);

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
        <div className="text-sm text-slate-500 dark:text-slate-400 py-3">
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
            return (
              <li
                key={event.id}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-corporate-navy dark:text-white truncate">
                    {event.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    {formatWhen(event)}
                  </p>
                </div>
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
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default AscentMyEventsWidget;
