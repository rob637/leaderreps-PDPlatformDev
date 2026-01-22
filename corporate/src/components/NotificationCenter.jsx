import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, X, Eye, CheckCircle, Mail, Calendar, FileText, 
  Target, AlertCircle, Users, TrendingUp, Clock, ChevronRight
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Global Notification System
 * 
 * This component provides real-time notifications across the Command Center:
 * - Demo views from prospects
 * - Proposal status changes  
 * - Email bounces/replies (when tracking is implemented)
 * - Booking confirmations
 * - Goal completions
 * 
 * HOW IT WORKS:
 * 1. Polls Firestore collections for recent activity
 * 2. Aggregates into a unified notification feed
 * 3. Shows unread count in the bell icon
 * 4. Click to expand and see full activity feed
 * 
 * DATA SOURCES:
 * - corporate_demo_links: Demo view events
 * - corporate_proposals: Proposal status changes
 * - corporate_prospects: Sequence activity
 * - corporate_goals: Goal completions
 */

const NotificationCenter = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState(() => {
    // Persist last checked time in localStorage
    const stored = localStorage.getItem('lr_notifications_last_checked');
    return stored ? new Date(stored) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default: 7 days ago
  });

  // Fetch notifications from various sources
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const allNotifications = [];

    try {
      // 1. Demo Link Views
      const demoLinksQuery = query(
        collection(db, 'corporate_demo_links'),
        orderBy('lastViewed', 'desc'),
        limit(20)
      );
      const demoSnap = await getDocs(demoLinksQuery);
      demoSnap.forEach(doc => {
        const data = doc.data();
        if (data.lastViewed && data.views > 0) {
          allNotifications.push({
            id: `demo-${doc.id}`,
            type: 'demo_view',
            title: `${data.prospect || 'Someone'} viewed your demo`,
            description: `"${data.demoTitle}" was viewed ${data.views} time(s)`,
            timestamp: new Date(data.lastViewed),
            icon: Eye,
            color: 'blue',
            link: '/sales/demos'
          });
        }
      });

      // 2. Proposal Status Changes
      const proposalsQuery = query(
        collection(db, 'corporate_proposals'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      const proposalsSnap = await getDocs(proposalsQuery);
      proposalsSnap.forEach(doc => {
        const data = doc.data();
        if (data.updatedAt && data.status !== 'draft') {
          allNotifications.push({
            id: `proposal-${doc.id}`,
            type: 'proposal_update',
            title: `Proposal for ${data.clientName}`,
            description: `Status changed to ${data.status.toUpperCase()}`,
            timestamp: new Date(data.updatedAt),
            icon: FileText,
            color: data.status === 'accepted' ? 'green' : data.status === 'sent' ? 'blue' : 'slate',
            link: '/sales/proposals'
          });
        }
      });

      // 3. Sequence Completions
      const sequenceQuery = query(
        collection(db, 'corporate_prospects'),
        where('status', '==', 'sequence_completed'),
        orderBy('lastContacted', 'desc'),
        limit(10)
      );
      const sequenceSnap = await getDocs(sequenceQuery);
      sequenceSnap.forEach(doc => {
        const data = doc.data();
        if (data.lastContacted) {
          allNotifications.push({
            id: `sequence-${doc.id}`,
            type: 'sequence_complete',
            title: `Sequence completed for ${data.name}`,
            description: `All outreach steps finished for ${data.company}`,
            timestamp: new Date(data.lastContacted),
            icon: CheckCircle,
            color: 'green',
            link: '/sales/outreach'
          });
        }
      });

      // 4. Goal Completions
      const goalsQuery = query(
        collection(db, 'corporate_goals'),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(10)
      );
      const goalsSnap = await getDocs(goalsQuery);
      goalsSnap.forEach(doc => {
        const data = doc.data();
        if (data.completedAt) {
          allNotifications.push({
            id: `goal-${doc.id}`,
            type: 'goal_complete',
            title: 'Goal Achieved! 🎉',
            description: data.goalText ? data.goalText.substring(0, 50) + '...' : 'A goal was completed',
            timestamp: new Date(data.completedAt),
            icon: Target,
            color: 'purple',
            link: '/coaching/goals'
          });
        }
      });

      // Sort all notifications by timestamp (most recent first)
      allNotifications.sort((a, b) => b.timestamp - a.timestamp);
      
      setNotifications(allNotifications.slice(0, 50)); // Keep top 50

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Mark all as read when opening
  const handleOpen = () => {
    setIsOpen(true);
    const now = new Date();
    setLastChecked(now);
    localStorage.setItem('lr_notifications_last_checked', now.toISOString());
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => n.timestamp > lastChecked).length;

  // Format timestamp
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    red: 'bg-red-100 text-red-600',
    slate: 'bg-slate-100 text-slate-600'
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button 
        onClick={handleOpen}
        className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-corporate-navy flex items-center gap-2">
                <Bell size={16} />
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                <button 
                  onClick={fetchNotifications}
                  className="text-xs text-slate-500 hover:text-corporate-teal"
                >
                  Refresh
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-slate-300 border-t-corporate-teal rounded-full animate-spin mx-auto mb-2" />
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="font-medium">No notifications yet</p>
                  <p className="text-sm">Activity will appear here as you use the Command Center</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map(notification => {
                    const isUnread = notification.timestamp > lastChecked;
                    const IconComponent = notification.icon;
                    
                    return (
                      <a
                        key={notification.id}
                        href={notification.link}
                        className={`flex gap-3 p-4 hover:bg-slate-50 transition ${isUnread ? 'bg-blue-50/50' : ''}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClasses[notification.color]}`}>
                          <IconComponent size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium text-sm ${isUnread ? 'text-corporate-navy' : 'text-slate-700'}`}>
                              {notification.title}
                            </p>
                            {isUnread && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {notification.description}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock size={10} />
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 self-center" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-slate-200 bg-slate-50">
              <p className="text-[10px] text-slate-400 text-center">
                Showing activity from the last 7 days • Auto-refreshes every 30 seconds
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
