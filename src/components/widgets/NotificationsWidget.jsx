import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Megaphone, Info, AlertTriangle, CheckCircle, X, ExternalLink } from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';

const NotificationsWidget = () => {
  const { db, user } = useAppServices();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);

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
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const startDate = data.startDate?.toDate?.() || data.startDate;
        const endDate = data.endDate?.toDate?.() || data.endDate;
        
        // Filter by date range
        if (startDate && new Date(startDate) > now) return;
        if (endDate && new Date(endDate) < now) return;

        // Filter by cohort — show if no target set, or if user matches target
        if (data.targetCohortId && data.targetCohortId !== userCohortId) return;
        
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
  }, [db, user?.cohortId]);

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
    <Card className="shadow-pop bg-white dark:bg-slate-800 border-l-4 border-l-corporate-orange relative overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-corporate-orange/10 flex items-center justify-center text-corporate-orange">
            <Bell size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Announcements
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Updates from your trainers</p>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-pulse flex items-center gap-2 text-slate-400">
                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            </div>
          ) : visibleAnnouncements.length === 0 ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700">
              <div className="mt-0.5 text-slate-400">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No announcements</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">You're all caught up!</p>
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
                    >
                      <X size={14} className="text-slate-400" />
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
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {announcement.message}
                        </p>
                      )}
                      {announcement.link && (
                        <a 
                          href={announcement.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-corporate-teal hover:underline mt-2"
                        >
                          Learn more <ExternalLink size={12} />
                        </a>
                      )}
                      {announcement.createdAt && (
                        <p className="text-[10px] text-slate-400 mt-1.5">
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
      </div>
    </Card>
  );
};

export default NotificationsWidget;
