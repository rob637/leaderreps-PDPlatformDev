import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Megaphone, Info, AlertTriangle, CheckCircle, X, ExternalLink, ArrowRight } from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { useDailyPlan, phaseKey } from '../../hooks/useDailyPlan';
import { useSafeNavigation } from '../../providers/NavigationProvider';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import KickoffNotifications from './KickoffNotifications';

const NotificationsWidget = () => {
  const { db, user } = useAppServices();
  const { currentPhase } = useDailyPlan();
  const userPhaseKey = phaseKey(currentPhase);
  const nav = useSafeNavigation();
  const navigate = nav?.navigate;
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [kickoffCount, setKickoffCount] = useState(0);

  // Fetch active announcements
  useEffect(() => {
    if (!db) return;

    const now = new Date();
    const announcementsRef = collection(db, 'announcements');
    
    // Query for active announcements (startDate <= now, endDate >= now or null)
    const q = query(
      announcementsRef,
      where('active', '==', true),
      orderBy('priority', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      const userCohortId = user?.cohortId || null;
      const userId = user?.uid || null;
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const startDate = data.startDate?.toDate?.() || data.startDate;
        const endDate = data.endDate?.toDate?.() || data.endDate;
        
        // Filter by date range
        if (startDate && new Date(startDate) > now) return;
        if (endDate && new Date(endDate) < now) return;

        // Targeting: if either targetCohortId or targetUserIds is set, the
        // user must match at least one (OR semantics). If neither is set,
        // the notification is broadcast to all users.
        const hasCohortTarget = !!data.targetCohortId;
        const hasUserTarget = Array.isArray(data.targetUserIds) && data.targetUserIds.length > 0;
        if (hasCohortTarget || hasUserTarget) {
          const cohortMatch = hasCohortTarget && data.targetCohortId === userCohortId;
          const userMatch = hasUserTarget && userId && data.targetUserIds.includes(userId);
          if (!cohortMatch && !userMatch) return;
        }

        // Phase targeting (AND with cohort/user filter above). Missing
        // targetPhase = broadcast to all phases.
        if (data.targetPhase && data.targetPhase !== userPhaseKey) return;

        items.push({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt
        });
      });
      setAnnouncements(items);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching announcements:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, user?.cohortId, user?.uid, userPhaseKey]);

  // Load dismissed announcements from user doc
  useEffect(() => {
    if (!db || !user?.uid) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDismissedIds(data.dismissedAnnouncements || []);
      }
    });

    return () => unsubscribe();
  }, [db, user?.uid]);

  // Handle dismiss
  const handleDismiss = async (announcementId) => {
    if (!db || !user?.uid) return;
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        dismissedAnnouncements: arrayUnion(announcementId)
      });
    } catch (error) {
      console.error('Error dismissing announcement:', error);
    }
  };

  // Filter out dismissed announcements
  const visibleAnnouncements = announcements.filter(a => 
    !dismissedIds.includes(a.id) || !a.dismissible
  );

  // Get icon for announcement type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'alert': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'info': return Info;
      default: return Megaphone;
    }
  };

  // Get color classes for announcement type
  const getTypeColors = (type) => {
    switch (type) {
      case 'alert':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          icon: 'text-red-500 dark:text-red-400',
          text: 'text-red-800 dark:text-red-200'
        };
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          border: 'border-emerald-200 dark:border-emerald-800',
          icon: 'text-emerald-500 dark:text-emerald-400',
          text: 'text-emerald-800 dark:text-emerald-200'
        };
      case 'info':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          icon: 'text-blue-500 dark:text-blue-400',
          text: 'text-blue-800 dark:text-blue-200'
        };
      default:
        return {
          bg: 'bg-corporate-orange/10 dark:bg-corporate-orange/20',
          border: 'border-corporate-orange/30 dark:border-corporate-orange/40',
          icon: 'text-corporate-orange',
          text: 'text-slate-800 dark:text-slate-200'
        };
    }
  };

  return (
    <Card className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-orange relative overflow-hidden p-4 sm:p-5">
      <header className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-corporate-orange flex-shrink-0" aria-hidden="true" />
        <h2 className="text-base font-semibold text-corporate-navy dark:text-white">
          Notifications
        </h2>
      </header>

      <div className="space-y-3">
        <KickoffNotifications onCountChange={setKickoffCount} />
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-pulse flex items-center gap-2 text-slate-400">
              <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        ) : visibleAnnouncements.length === 0 && kickoffCount === 0 ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
            <div className="mt-0.5 text-slate-400">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">You&apos;re all caught up!</p>
            </div>
          </div>
        ) : (
          visibleAnnouncements.map((announcement) => {
            const TypeIcon = getTypeIcon(announcement.type);
            const colors = getTypeColors(announcement.type);

            return (
              <div
                key={announcement.id}
                className={`relative p-3 rounded-lg border ${colors.bg} ${colors.border}`}
              >
                {announcement.dismissible && (
                  <button
                    onClick={() => handleDismiss(announcement.id)}
                    className="absolute top-2 right-2 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                    title="Dismiss"
                    aria-label={`Dismiss notification: ${announcement.title || 'announcement'}`}
                  >
                    <X size={14} className="text-slate-500 dark:text-slate-300" aria-hidden="true" />
                  </button>
                )}

                <div className="flex items-start gap-3 pr-6">
                  <div className={`mt-0.5 ${colors.icon}`}>
                    <TypeIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${colors.text}`}>
                      {announcement.title}
                    </p>
                    {announcement.message && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                        {announcement.message}
                      </p>
                    )}
                    {(() => {
                      // Resolve link: prefer structured linkTarget; fall back to
                      // legacy `link` string (always treated as external URL).
                      const lt = announcement.linkTarget;
                      const legacy = typeof announcement.link === 'string' ? announcement.link.trim() : '';
                      const kind = lt?.kind || (legacy ? 'external' : null);
                      if (!kind) return null;
                      const label = lt?.label || 'Learn more';
                      if (kind === 'external') {
                        const url = lt?.url || legacy;
                        if (!url) return null;
                        return (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-corporate-teal-ink hover:underline mt-2"
                          >
                            {label} <ExternalLink size={12} />
                          </a>
                        );
                      }
                      // Internal nav (screen | content | event)
                      const handleInternal = () => {
                        if (!navigate) return;
                        if (kind === 'screen' && lt.screen) {
                          const params = lt.targetId ? { targetId: lt.targetId } : {};
                          navigate(lt.screen, params);
                        } else if (kind === 'content' && lt.targetId) {
                          navigate('library', { contentItemId: lt.targetId });
                        } else if (kind === 'event' && lt.targetId) {
                          navigate('community-hub', { sessionId: lt.targetId });
                        }
                      };
                      return (
                        <button
                          type="button"
                          onClick={handleInternal}
                          className="inline-flex items-center gap-1 text-xs text-corporate-teal-ink hover:underline mt-2"
                        >
                          {label} <ArrowRight size={12} />
                        </button>
                      );
                    })()}
                      {announcement.createdAt && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                          {new Date(announcement.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
    </Card>
  );
};

export default React.memo(NotificationsWidget);
