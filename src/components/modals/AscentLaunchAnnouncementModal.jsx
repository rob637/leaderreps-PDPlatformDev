// src/components/modals/AscentLaunchAnnouncementModal.jsx
//
// Ascent Revamp WS-1.5 — One-time in-app announcement.
// Shown the first time a leader sees the revamped UI. Persists dismissal to
// `users/{uid}/profile.seenAnnouncements.ascentLaunch = true` so it never
// shows again for that user, even across devices.
//
// Trigger conditions (all required):
//   - revampEnabled (cohort flag)
//   - profile.seenAnnouncements.ascentLaunch !== true

import React, { useEffect, useState } from 'react';
import { Sparkles, X, Calendar, Zap, MessageCircleQuestion, Library } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { useRevampFlag } from '../../hooks/useRevampFlag';

const HIGHLIGHTS = [
  { Icon: Calendar, title: 'Events', body: 'All your live coaching and community sessions in one calendar.' },
  { Icon: Zap, title: 'Conditioning', body: 'One field, one rep at a time. Get a verdict — pass or not yet.' },
  { Icon: MessageCircleQuestion, title: 'Ask a Trainer', body: 'Send a question, get a thoughtful written or video reply.' },
  { Icon: Library, title: 'Content', body: 'Explore the full library on your own schedule.' },
];

const AscentLaunchAnnouncementModal = () => {
  const { db, user } = useAppServices();
  const revampEnabled = useRevampFlag();
  const [seen, setSeen] = useState(null); // null = unknown
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (!db || !user?.uid) return undefined;
    return onSnapshot(doc(db, 'users', user.uid), (snap) => {
      const v = !!snap.data()?.profile?.seenAnnouncements?.ascentLaunch;
      setSeen(v);
    });
  }, [db, user?.uid]);

  const dismiss = async () => {
    if (!db || !user?.uid) return;
    setDismissing(true);
    try {
      await setDoc(
        doc(db, 'users', user.uid),
        { profile: { seenAnnouncements: { ascentLaunch: true } } },
        { merge: true }
      );
    } finally {
      setDismissing(false);
    }
  };

  if (!revampEnabled || seen !== false) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevated max-w-lg w-full p-6 sm:p-8 relative">
        <button
          type="button"
          onClick={dismiss}
          disabled={dismissing}
          aria-label="Dismiss announcement"
          className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-corporate-orange" />
          <span className="text-xs font-semibold uppercase tracking-wider text-corporate-orange">
            Welcome to Ascent
          </span>
        </div>
        <h2
          className="text-2xl sm:text-3xl font-bold text-corporate-navy dark:text-white mb-3"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          A simpler, sharper LeaderReps.
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-5">
          We&apos;ve streamlined the experience around what matters most:
          practicing reps and getting coached.
        </p>

        <ul className="space-y-3 mb-6">
          {HIGHLIGHTS.map(({ Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-9 h-9 rounded-lg bg-corporate-teal/10 text-corporate-teal flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-corporate-navy dark:text-white">
                  {title}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {body}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={dismiss}
          disabled={dismissing}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-corporate-teal text-white hover:bg-corporate-teal/90 disabled:opacity-50"
        >
          {dismissing ? 'Saving…' : 'Take Me In'}
        </button>
      </div>
    </div>
  );
};

export default AscentLaunchAnnouncementModal;
