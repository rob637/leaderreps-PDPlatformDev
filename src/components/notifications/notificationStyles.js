// src/components/notifications/notificationStyles.js
//
// Single source of truth for notification tier visuals so the dashboard
// card and bell panel look identical.

import { AlertTriangle, ArrowRightCircle, Megaphone, Sparkles } from 'lucide-react';

export const TIER_META = {
  critical: {
    label: 'Urgent',
    Icon: AlertTriangle,
    // Tailwind class fragments — kept loose so the consumer can compose them.
    rail: 'bg-corporate-orange',
    iconText: 'text-corporate-orange',
    chipBg: 'bg-corporate-orange/10 text-corporate-orange',
    weight: 1000,
  },
  action: {
    label: 'Action needed',
    Icon: ArrowRightCircle,
    rail: 'bg-corporate-teal',
    iconText: 'text-corporate-teal',
    chipBg: 'bg-corporate-teal/10 text-corporate-teal-ink dark:text-corporate-teal',
    weight: 500,
  },
  update: {
    label: 'Update',
    Icon: Megaphone,
    rail: 'bg-slate-300 dark:bg-slate-600',
    iconText: 'text-slate-500 dark:text-slate-400',
    chipBg: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    weight: 100,
  },
  celebration: {
    label: 'Celebration',
    Icon: Sparkles,
    rail: 'bg-amber-400',
    iconText: 'text-amber-500',
    chipBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    weight: 50,
  },
};

export const getTier = (n) => TIER_META[n?.tier] || TIER_META.update;

const toMillis = (v) => {
  if (!v) return null;
  if (typeof v?.toMillis === 'function') return v.toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  return null;
};

export const formatRelative = (value) => {
  const ms = toMillis(value);
  if (!ms) return '';
  const diff = Date.now() - ms;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};
