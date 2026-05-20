import React, { useState, useEffect, useMemo } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, query, orderBy, onSnapshot, getDocs,
  doc, setDoc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { UNIFIED_COLLECTION } from '../../services/unifiedContentService';
import { COMMUNITY_SESSIONS_COLLECTION } from '../../data/Constants';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Card, Button } from '../ui';
import { 
  Megaphone, Plus, Edit2, Trash2, Save, X, 
  AlertTriangle, Info, CheckCircle, Bell,
  Calendar, Eye, EyeOff, ExternalLink, Users, User as UserIcon,
  RefreshCw, BookOpen, PartyPopper
} from 'lucide-react';

/**
 * AnnouncementsManager — Admin interface for posting Notifications to the dashboard.
 *
 * Notifications appear in the NotificationsWidget on user dashboards. Supports
 * different types (alert, info, success, announcement), date ranges, priority
 * ordering, dismissibility, and targeting by cohort and/or specific users.
 *
 * (File name retained as `AnnouncementsManager.jsx` for diff hygiene; the
 * underlying Firestore collection is still `announcements` for backwards
 * compatibility with existing data.)
 */

const ANNOUNCEMENT_TYPES = [
  { id: 'announcement', label: 'Announcement', icon: Megaphone, color: 'orange' },
  { id: 'event', label: 'Event', icon: Calendar, color: 'blue' },
  { id: 'content', label: 'Content', icon: BookOpen, color: 'purple' },
  { id: 'celebration', label: 'Celebration', icon: PartyPopper, color: 'green' },
  { id: 'alert', label: 'Alert', icon: AlertTriangle, color: 'red' },
];

// Legacy type ids that pre-date the May 2026 cleanup. Older Firestore
// docs may still carry these; map them to the closest current type so
// listings render with a sensible icon/color.
const LEGACY_TYPE_MAP = {
  info: 'announcement',
  success: 'celebration',
};

// Tier drives sort order + visual treatment in the per-user inbox.
// Independent of `type` (which is a legacy banner style hint).
const TIER_OPTIONS = [
  { id: 'critical', label: 'Critical (orange, top of list)' },
  { id: 'action', label: 'Action needed (teal)' },
  { id: 'update', label: 'Update (default)' },
  { id: 'celebration', label: 'Celebration (amber)' },
];

// Phase targeting options. Empty value = broadcast to all phases.
const PHASE_OPTIONS = [
  { id: '', label: 'All Phases' },
  { id: 'foundation', label: 'Foundation' },
  { id: 'ascent', label: 'Ascent' },
];

// Link target options. Notifications can deep-link into the app rather than
// only opening an external URL. The `linkTarget` object is read by
// NotificationsWidget when rendering the CTA; the legacy `link` string is
// preserved when kind === 'external' for backward compatibility.
const LINK_KIND_OPTIONS = [
  { id: 'none', label: 'No link' },
  { id: 'external', label: 'External URL' },
  { id: 'screen', label: 'App Screen' },
  { id: 'content', label: 'Content Item' },
  { id: 'event', label: 'Event / Session' },
];

// Curated subset of screen keys that make sense as notification deep-links.
// Mirror of entries in src/routing/ScreenRouter.jsx.
const SCREEN_LINK_OPTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'community-hub', label: 'Community / Events' },
  { id: 'community-feed', label: 'Community Feed' },
  { id: 'library', label: 'Library (all content)' },
  { id: 'leadership-videos', label: 'Leadership Videos' },
  { id: 'business-readings', label: 'Business Readings' },
  { id: 'applied-leadership', label: 'Applied Leadership' },
  { id: 'daily-practice', label: 'Daily Practice' },
  { id: 'conditioning', label: 'Conditioning' },
  { id: 'coaching-hub', label: 'Coaching Hub' },
  { id: 'ask-coach', label: 'Ask Coach' },
  { id: 'rep-coach', label: 'Rep AI Coach' },
  { id: 'development-plan', label: 'Development Plan' },
  { id: 'identity-statement', label: 'Identity Statement' },
  { id: 'locker', label: 'Locker' },
  { id: 'ascent-arena', label: 'Ascent Arena' },
  { id: 'app-settings', label: 'App Settings' },
];

// Re-fans out every active announcement to all targeted users' inboxes.
// Lives at the top of the file so the header can render it inline without
// dragging extra prop plumbing through the main component.
const BackfillButton = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleClick = async () => {
    if (running) return;
    const ok = window.confirm(
      'Re-fan out every active announcement to all targeted users? '
      + "This won't duplicate items (idempotent), but it will refresh content "
      + 'and recompute targeting for any user/cohort changes.'
    );
    if (!ok) return;
    setRunning(true);
    setResult(null);
    try {
      const fn = httpsCallable(getFunctions(), 'backfillAnnouncementNotifications');
      const res = await fn({});
      const data = res?.data || {};
      setResult({
        ok: true,
        text: `Backfill complete — ${data.processed ?? '?'} announcements → ${data.totalWritten ?? '?'} inbox writes.`,
      });
    } catch (e) {
      console.error('[backfill] failed', e);
      setResult({ ok: false, text: `Backfill failed: ${e?.message || e}` });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={running}
        className="inline-flex items-center gap-2"
      >
        <RefreshCw size={14} className={running ? 'animate-spin' : ''} />
        {running ? 'Backfilling…' : 'Backfill inboxes'}
      </Button>
      {result && (
        <p className={`text-xs ${result.ok ? 'text-corporate-teal-ink dark:text-corporate-teal' : 'text-rose-600 dark:text-rose-400'}`}>
          {result.text}
        </p>
      )}
    </div>
  );
};

const AnnouncementsManager = () => {
  const { db } = useAppServices();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [cohorts, setCohorts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement',
    tier: 'update',
    priority: 0,
    active: true,
    dismissible: true,
    link: '',
    linkKind: 'none', // 'none' | 'external' | 'screen' | 'content' | 'event'
    linkScreen: '',
    linkTargetId: '',
    linkLabel: '',
    startDate: '',
    endDate: '',
    targetCohortId: '',
    targetPhase: '',
    targetUserIds: [],
  });
  const [saving, setSaving] = useState(false);

  // Lazy-loaded option lists for the link-target picker. Populated the first
  // time the admin selects linkKind === 'content' or 'event' so we don't pay
  // the read cost for every notification create.
  const [contentItems, setContentItems] = useState(null); // null = not loaded
  const [contentLoading, setContentLoading] = useState(false);
  const [eventItems, setEventItems] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [eventsShowAll, setEventsShowAll] = useState(false);

  // Fetch announcements
  useEffect(() => {
    if (!db) return;

    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          startDate: data.startDate?.toDate?.() || data.startDate,
          endDate: data.endDate?.toDate?.() || data.endDate
        });
      });
      setAnnouncements(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Fetch cohorts for targeting
  useEffect(() => {
    if (!db) return;
    const loadCohorts = async () => {
      try {
        const cohortsRef = collection(db, 'cohorts');
        const q = query(cohortsRef, orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        const items = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() });
        });
        setCohorts(items);
      } catch (err) {
        console.error('Error loading cohorts:', err);
      }
    };
    loadCohorts();
  }, [db]);

  // Fetch users for per-user targeting
  useEffect(() => {
    if (!db) return;
    const loadUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        const items = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const email = data.email || '';
          const displayName =
            data.displayName ||
            data.name ||
            [data.firstName, data.lastName].filter(Boolean).join(' ');
          // Skip orphan/incomplete user docs that have neither an email nor a
          // name — they show up as raw UIDs and aren't useful to target.
          if (!email && !displayName) return;
          items.push({ id: docSnap.id, email, displayName });
        });
        items.sort((a, b) =>
          (a.displayName || a.email).localeCompare(b.displayName || b.email)
        );
        setAllUsers(items);
      } catch (err) {
        console.error('Error loading users:', err);
      }
    };
    loadUsers();
  }, [db]);

  // Lazy-load content items the first time the admin picks 'content' as the
  // link kind. Cached for the lifetime of the manager session.
  useEffect(() => {
    if (formData.linkKind !== 'content' || contentItems !== null || !db) return;
    // NOTE: do NOT include contentLoading in deps — toggling it inside the
    // effect would cause the cleanup to fire (cancelled=true) before the
    // async work finishes, leaving the spinner stuck on forever.
    let cancelled = false;
    setContentLoading(true);
    (async () => {
      try {
        const snap = await getDocs(collection(db, UNIFIED_COLLECTION));
        const items = [];
        snap.forEach((d) => {
          const data = d.data() || {};
          // Exclude archived items from the picker — they're not user-visible.
          if (data.status === 'ARCHIVED') return;
          items.push({
            id: d.id,
            title: data.title || data.name || d.id,
            type: data.type || '',
            phase: data.phase || data.targetPhase || '',
          });
        });
        items.sort((a, b) => a.title.localeCompare(b.title));
        if (!cancelled) setContentItems(items);
      } catch (err) {
        console.error('[AnnouncementsManager] load content failed:', err);
        if (!cancelled) setContentItems([]);
      } finally {
        if (!cancelled) setContentLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.linkKind, contentItems, db]);

  // Lazy-load events (community/coaching sessions) on first 'event' selection.
  useEffect(() => {
    if (formData.linkKind !== 'event' || eventItems !== null || !db) return;
    // NOTE: do NOT include eventsLoading in deps — see content loader above.
    let cancelled = false;
    setEventsLoading(true);
    (async () => {
      try {
        // Plain collection read + client-side sort. We intentionally drop the
        // orderBy('date') here because Firestore silently excludes documents
        // missing the indexed field, which would hide events with no date.
        const snap = await getDocs(collection(db, COMMUNITY_SESSIONS_COLLECTION));
        const items = [];
        snap.forEach((d) => {
          const data = d.data() || {};
          if (data.status === 'cancelled') return;
          items.push({
            id: d.id,
            title: data.title || data.name || data.topic || d.id,
            date: data.date || '',
            sessionType: data.sessionType || '',
            host: data.host || '',
          });
        });
        // Sort newest-first by date string (ISO sorts lexicographically).
        items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        if (!cancelled) setEventItems(items);
      } catch (err) {
        console.error('[AnnouncementsManager] load events failed:', err);
        if (!cancelled) setEventItems([]);
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.linkKind, eventItems, db]);

  // Reset the search box whenever the link kind switches so the previous
  // query doesn't bleed into the new picker.
  useEffect(() => {
    setLinkSearch('');
  }, [formData.linkKind]);

  // Derived filtered lists for the pickers.
  const filteredContent = useMemo(() => {
    if (!contentItems) return [];
    const q = linkSearch.trim().toLowerCase();
    return contentItems.filter((c) => {
      if (!q) return true;
      return c.title.toLowerCase().includes(q)
        || c.id.toLowerCase().includes(q)
        || (c.type || '').toLowerCase().includes(q);
    }).slice(0, 100);
  }, [contentItems, linkSearch]);

  const filteredEvents = useMemo(() => {
    if (!eventItems) return [];
    const today = new Date().toISOString().split('T')[0];
    const q = linkSearch.trim().toLowerCase();
    return eventItems
      .filter((e) => eventsShowAll || (e.date && e.date >= today))
      .filter((e) => {
        if (!q) return true;
        return e.title.toLowerCase().includes(q)
          || e.id.toLowerCase().includes(q)
          || (e.sessionType || '').toLowerCase().includes(q);
      })
      .slice(0, 100);
  }, [eventItems, linkSearch, eventsShowAll]);

  const selectedContentLabel = useMemo(() => {
    if (formData.linkKind !== 'content' || !formData.linkTargetId) return '';
    const found = (contentItems || []).find((c) => c.id === formData.linkTargetId);
    return found ? found.title : formData.linkTargetId;
  }, [contentItems, formData.linkKind, formData.linkTargetId]);

  const selectedEventLabel = useMemo(() => {
    if (formData.linkKind !== 'event' || !formData.linkTargetId) return '';
    const found = (eventItems || []).find((e) => e.id === formData.linkTargetId);
    if (!found) return formData.linkTargetId;
    return found.date ? `${found.title} — ${found.date}` : found.title;
  }, [eventItems, formData.linkKind, formData.linkTargetId]);

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'announcement',
      tier: 'update',
      priority: 0,
      active: true,
      dismissible: true,
      link: '',
      linkKind: 'none',
      linkScreen: '',
      linkTargetId: '',
      linkLabel: '',
      startDate: '',
      endDate: '',
      targetCohortId: '',
      targetPhase: '',
      targetUserIds: [],
    });
    setEditingId(null);
    setUserPickerOpen(false);
    setUserSearch('');
  };

  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    // Hydrate linkKind from saved linkTarget; fall back to legacy `link` string.
    const lt = announcement.linkTarget || null;
    let linkKind = 'none';
    let linkScreen = '';
    let linkTargetId = '';
    let linkLabel = '';
    let legacyLink = announcement.link || '';
    if (lt && lt.kind) {
      linkKind = lt.kind;
      linkScreen = lt.screen || '';
      linkTargetId = lt.targetId || '';
      linkLabel = lt.label || '';
      if (lt.kind === 'external') legacyLink = lt.url || legacyLink;
    } else if (legacyLink) {
      linkKind = 'external';
    }
    setFormData({
      title: announcement.title || '',
      message: announcement.message || '',
      type: announcement.type || 'announcement',
      tier: announcement.tier || 'update',
      priority: announcement.priority || 0,
      active: announcement.active !== false,
      dismissible: announcement.dismissible !== false,
      link: legacyLink,
      linkKind,
      linkScreen,
      linkTargetId,
      linkLabel,
      startDate: announcement.startDate ? new Date(announcement.startDate).toISOString().split('T')[0] : '',
      endDate: announcement.endDate ? new Date(announcement.endDate).toISOString().split('T')[0] : '',
      targetCohortId: announcement.targetCohortId || '',
      targetPhase: announcement.targetPhase || '',
      targetUserIds: Array.isArray(announcement.targetUserIds) ? announcement.targetUserIds : [],
    });
  };

  const handleSave = async () => {
    if (!db || !formData.title.trim()) return;

    setSaving(true);
    try {
      // Build linkTarget from the kind selector. Keep legacy `link` (string)
      // populated when kind === 'external' so older clients still render the
      // CTA correctly.
      const kind = formData.linkKind || 'none';
      const trimmedUrl = (formData.link || '').trim();
      const trimmedTargetId = (formData.linkTargetId || '').trim();
      const trimmedLabel = (formData.linkLabel || '').trim();
      let linkTarget = null;
      let legacyLinkStr = null;
      if (kind === 'external' && trimmedUrl) {
        linkTarget = { kind: 'external', url: trimmedUrl };
        legacyLinkStr = trimmedUrl;
      } else if (kind === 'screen' && formData.linkScreen) {
        linkTarget = { kind: 'screen', screen: formData.linkScreen };
        if (trimmedTargetId) linkTarget.targetId = trimmedTargetId;
      } else if (kind === 'content' && trimmedTargetId) {
        linkTarget = { kind: 'content', targetId: trimmedTargetId };
      } else if (kind === 'event' && trimmedTargetId) {
        linkTarget = { kind: 'event', targetId: trimmedTargetId };
      }
      if (linkTarget && trimmedLabel) linkTarget.label = trimmedLabel;

      const data = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        tier: formData.tier || 'update',
        priority: parseInt(formData.priority) || 0,
        active: formData.active,
        dismissible: formData.dismissible,
        link: legacyLinkStr,
        linkTarget,
        startDate: formData.startDate ? new Date(formData.startDate) : null,
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        targetCohortId: formData.targetCohortId || null,
        targetPhase: formData.targetPhase || null,
        targetUserIds: Array.isArray(formData.targetUserIds) && formData.targetUserIds.length > 0
          ? formData.targetUserIds
          : null,
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        // Update existing
        await updateDoc(doc(db, 'announcements', editingId), data);
      } else {
        // Create new
        const newId = `ann_${Date.now()}`;
        await setDoc(doc(db, 'announcements', newId), {
          ...data,
          createdAt: serverTimestamp()
        });
      }

      resetForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('Error saving announcement: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('Error deleting: ' + error.message);
    }
  };

  const handleToggleActive = async (announcement) => {
    try {
      await updateDoc(doc(db, 'announcements', announcement.id), {
        active: !announcement.active,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const getTypeConfig = (typeId) => {
    const resolved = LEGACY_TYPE_MAP[typeId] || typeId;
    return ANNOUNCEMENT_TYPES.find(t => t.id === resolved) || ANNOUNCEMENT_TYPES[0];
  };

  const getTypeColorClasses = (color) => {
    const colors = {
      orange: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
      blue: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      purple: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      green: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
      red: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    };
    return colors[color] || colors.orange;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-corporate-orange/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-corporate-orange" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Notifications</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Post notifications to user dashboards. Target everyone, a specific cohort, and/or specific users.
            </p>
          </div>
        </div>
        <BackfillButton />
      </div>

      {/* Create/Edit Form */}
      <Card className="p-5 bg-white dark:bg-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
          {editingId ? 'Edit Notification' : 'Create New Notification'}
        </h3>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief announcement title"
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                       bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                       focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Message (optional)
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Additional details..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                       bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                       focus:ring-2 focus:ring-corporate-teal focus:border-transparent resize-none"
            />
          </div>

          {/* Type & Tier & Cohort & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              >
                {ANNOUNCEMENT_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tier
              </label>
              <select
                value={formData.tier}
                onChange={(e) => setFormData(prev => ({ ...prev, tier: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              >
                {TIER_OPTIONS.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Target Cohort
              </label>
              <select
                value={formData.targetCohortId}
                onChange={(e) => setFormData(prev => ({ ...prev, targetCohortId: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              >
                <option value="">All Cohorts</option>
                {cohorts.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.id}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority (higher = shown first)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              />
            </div>
          </div>

          {/* Target Phase */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Phase
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Limit this notification to users in a specific program phase. Combined with cohort/user targeting using AND.
            </p>
            <select
              value={formData.targetPhase}
              onChange={(e) => setFormData(prev => ({ ...prev, targetPhase: e.target.value }))}
              className="w-full sm:w-64 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                       bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                       focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
            >
              {PHASE_OPTIONS.map(opt => (
                <option key={opt.id || 'all'} value={opt.id}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date Range Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date (optional)
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date (optional)
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg 
                         bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                         focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
              />
            </div>
          </div>

          {/* Per-user targeting */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Specific Users (optional)
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              If set, only these users see the notification (combined with the cohort filter above using OR — i.e. anyone in the target cohort OR in this list will see it). Leave empty to broadcast.
            </p>

            {/* Selected user chips */}
            {formData.targetUserIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {formData.targetUserIds.map((uid) => {
                  const u = allUsers.find((x) => x.id === uid);
                  const label = u ? (u.displayName || u.email || uid) : uid;
                  return (
                    <span
                      key={uid}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-corporate-teal/10 text-corporate-teal-ink text-xs"
                    >
                      <UserIcon className="w-3 h-3" />
                      {label}
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({
                          ...prev,
                          targetUserIds: prev.targetUserIds.filter((x) => x !== uid),
                        }))}
                        className="ml-0.5 hover:text-red-500"
                        aria-label={`Remove ${label}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Picker toggle */}
            {!userPickerOpen ? (
              <button
                type="button"
                onClick={() => setUserPickerOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Plus className="w-3 h-3" /> Add user
              </button>
            ) : (
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setUserPickerOpen(false); setUserSearch(''); }}
                    className="px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-600"
                  >
                    Done
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                  {allUsers
                    .filter((u) => {
                      const q = userSearch.trim().toLowerCase();
                      if (!q) return true;
                      return (u.displayName || '').toLowerCase().includes(q)
                        || (u.email || '').toLowerCase().includes(q);
                    })
                    .slice(0, 50)
                    .map((u) => {
                      const selected = formData.targetUserIds.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setFormData((prev) => ({
                            ...prev,
                            targetUserIds: selected
                              ? prev.targetUserIds.filter((x) => x !== u.id)
                              : [...prev.targetUserIds, u.id],
                          }))}
                          className={`w-full text-left flex items-center justify-between gap-2 px-2 py-1.5 text-xs hover:bg-white dark:hover:bg-slate-800 ${
                            selected ? 'bg-corporate-teal/5' : ''
                          }`}
                        >
                          <span className="truncate">
                            <span className="font-medium text-slate-800 dark:text-white">
                              {u.displayName || u.email || u.id}
                            </span>
                            {u.displayName && u.email && (
                              <span className="text-slate-400 ml-1">{u.email}</span>
                            )}
                          </span>
                          {selected && <CheckCircle className="w-3.5 h-3.5 text-corporate-teal" />}
                        </button>
                      );
                    })}
                  {allUsers.length === 0 && (
                    <p className="text-xs text-slate-400 italic px-2 py-2">No users loaded.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Link target */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/30">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Link Target (optional)
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Where the &ldquo;Learn more&rdquo; CTA should send the user. App
              screens stay in-app; content/event open the related item.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Link type
                </label>
                <select
                  value={formData.linkKind}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkKind: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg
                           bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                           focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
                >
                  {LINK_KIND_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {formData.linkKind !== 'none' && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    CTA label (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.linkLabel}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkLabel: e.target.value }))}
                    placeholder="Learn more"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg
                             bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                             focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {formData.linkKind === 'external' && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg
                           bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                           focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
                />
              </div>
            )}

            {formData.linkKind === 'screen' && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Screen
                  </label>
                  <select
                    value={formData.linkScreen}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkScreen: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg
                             bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                             focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
                  >
                    <option value="">— Select a screen —</option>
                    {SCREEN_LINK_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Target ID (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.linkTargetId}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkTargetId: e.target.value }))}
                    placeholder="passed as ?targetId="
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg
                             bg-white dark:bg-slate-900 text-slate-800 dark:text-white
                             focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {(formData.linkKind === 'content' || formData.linkKind === 'event') && (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {formData.linkKind === 'content' ? 'Content item' : 'Event / Session'}
                  </label>
                  {formData.linkKind === 'event' && (
                    <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eventsShowAll}
                        onChange={(e) => setEventsShowAll(e.target.checked)}
                        className="w-3 h-3 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
                      />
                      Show past events
                    </label>
                  )}
                </div>

                {/* Currently selected */}
                {formData.linkTargetId && (
                  <div className="flex items-center justify-between gap-2 mb-2 px-3 py-2 rounded-lg bg-corporate-teal/10 border border-corporate-teal/30">
                    <span className="text-xs text-corporate-teal-ink truncate">
                      <span className="font-medium">Selected:</span>{' '}
                      {formData.linkKind === 'content' ? selectedContentLabel : selectedEventLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, linkTargetId: '' }))}
                      className="text-corporate-teal-ink hover:text-rose-500"
                      aria-label="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Search box */}
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder={
                    formData.linkKind === 'content'
                      ? 'Search content by title, type, or ID…'
                      : 'Search events by title, type, or ID…'
                  }
                  className="w-full px-3 py-2 mb-2 border border-slate-200 dark:border-slate-700 rounded-lg
                           bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-sm
                           focus:ring-2 focus:ring-corporate-teal focus:border-transparent"
                />

                {/* Results */}
                <div className="max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                  {formData.linkKind === 'content' && (
                    <>
                      {contentLoading && (
                        <p className="text-xs text-slate-400 italic px-3 py-2">Loading content…</p>
                      )}
                      {!contentLoading && filteredContent.length === 0 && (
                        <p className="text-xs text-slate-400 italic px-3 py-2">
                          {contentItems && contentItems.length > 0 ? 'No matches.' : 'No content items found.'}
                        </p>
                      )}
                      {filteredContent.map((c) => {
                        const selected = c.id === formData.linkTargetId;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, linkTargetId: c.id }))}
                            className={`w-full text-left flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 ${
                              selected ? 'bg-corporate-teal/5' : ''
                            }`}
                          >
                            <span className="truncate">
                              <span className="font-medium text-slate-800 dark:text-white">{c.title}</span>
                              {c.type && (
                                <span className="text-[10px] uppercase tracking-wide text-slate-400 ml-2">
                                  {c.type}
                                </span>
                              )}
                            </span>
                            {selected && <CheckCircle className="w-3.5 h-3.5 text-corporate-teal flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </>
                  )}

                  {formData.linkKind === 'event' && (
                    <>
                      {eventsLoading && (
                        <p className="text-xs text-slate-400 italic px-3 py-2">Loading events…</p>
                      )}
                      {!eventsLoading && filteredEvents.length === 0 && (
                        <p className="text-xs text-slate-400 italic px-3 py-2">
                          {eventItems && eventItems.length > 0
                            ? (eventsShowAll ? 'No matches.' : 'No upcoming events — toggle "Show past events" to broaden.')
                            : 'No events found.'}
                        </p>
                      )}
                      {filteredEvents.map((ev) => {
                        const selected = ev.id === formData.linkTargetId;
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, linkTargetId: ev.id }))}
                            className={`w-full text-left flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800 ${
                              selected ? 'bg-corporate-teal/5' : ''
                            }`}
                          >
                            <span className="truncate">
                              <span className="font-medium text-slate-800 dark:text-white">{ev.title}</span>
                              {ev.date && (
                                <span className="text-[10px] text-slate-500 ml-2">{ev.date}</span>
                              )}
                              {ev.sessionType && (
                                <span className="text-[10px] uppercase tracking-wide text-slate-400 ml-2">
                                  {ev.sessionType}
                                </span>
                              )}
                            </span>
                            {selected && <CheckCircle className="w-3.5 h-3.5 text-corporate-teal flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {formData.linkKind === 'content'
                    ? 'Opens the Library and surfaces this content item.'
                    : 'Opens the Events screen and highlights this session.'}
                </p>
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Active (visible to users)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.dismissible}
                onChange={(e) => setFormData(prev => ({ ...prev, dismissible: e.target.checked }))}
                className="w-4 h-4 rounded border-slate-300 text-corporate-teal focus:ring-corporate-teal"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Users can dismiss</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg
                       hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create Notification'}
            </button>
            {editingId && (
              <button
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600
                         text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Existing Announcements */}
      <Card className="p-5 bg-white dark:bg-slate-800">
        <h3 className="font-semibold text-slate-800 dark:text-white mb-4">
          All Notifications ({announcements.length})
        </h3>

        {loading ? (
          <div className="text-center py-8 text-slate-500">Loading...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            No notifications yet. Create one above!
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => {
              const typeConfig = getTypeConfig(announcement.type);
              const TypeIcon = typeConfig.icon;
              const isActive = announcement.active;
              
              return (
                <div 
                  key={announcement.id}
                  className={`p-4 rounded-xl border ${
                    isActive 
                      ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700' 
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${getTypeColorClasses(typeConfig.color)}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-medium text-slate-800 dark:text-white">
                            {announcement.title}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            isActive 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                              : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          }`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                          {announcement.priority > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Priority: {announcement.priority}
                            </span>
                          )}
                          {announcement.targetCohortId && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {cohorts.find(c => c.id === announcement.targetCohortId)?.name || announcement.targetCohortId}
                            </span>
                          )}
                          {announcement.targetPhase && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 uppercase">
                              {announcement.targetPhase}
                            </span>
                          )}
                          {Array.isArray(announcement.targetUserIds) && announcement.targetUserIds.length > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-corporate-teal/15 text-corporate-teal-ink flex items-center gap-1">
                              <UserIcon className="w-3 h-3" />
                              {announcement.targetUserIds.length} user{announcement.targetUserIds.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </div>
                        {announcement.message && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                            {announcement.message}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-500">
                          {announcement.createdAt && (
                            <span>
                              Created: {new Date(announcement.createdAt).toLocaleDateString()}
                            </span>
                          )}
                          {announcement.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              From: {new Date(announcement.startDate).toLocaleDateString()}
                            </span>
                          )}
                          {announcement.endDate && (
                            <span>
                              Until: {new Date(announcement.endDate).toLocaleDateString()}
                            </span>
                          )}
                          {announcement.link && (
                            <a 
                              href={announcement.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-corporate-teal-ink hover:underline"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleActive(announcement)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title={isActive ? 'Deactivate' : 'Activate'}
                      >
                        {isActive ? (
                          <Eye className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AnnouncementsManager;
