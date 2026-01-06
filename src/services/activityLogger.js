// src/services/activityLogger.js
// Centralized activity logging service for system-wide event tracking

import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, orderBy, limit } from 'firebase/firestore';

/**
 * Activity Types with metadata for display
 */
export const ACTIVITY_TYPES = {
  // User Events
  USER_SIGNUP: { 
    type: 'user_signup', 
    label: 'User Sign-up', 
    icon: 'UserPlus', 
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-600'
  },
  USER_LOGIN: { 
    type: 'user_login', 
    label: 'User Login', 
    icon: 'LogIn', 
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600'
  },
  PROFILE_COMPLETE: { 
    type: 'profile_complete', 
    label: 'Profile Completed', 
    icon: 'UserCheck', 
    color: 'teal',
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-600'
  },
  
  // Content Events
  CONTENT_COMPLETE: { 
    type: 'content_complete', 
    label: 'Content Completed', 
    icon: 'CheckCircle', 
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-600'
  },
  VIDEO_WATCHED: { 
    type: 'video_watched', 
    label: 'Video Watched', 
    icon: 'Play', 
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-600'
  },
  ASSESSMENT_COMPLETE: { 
    type: 'assessment_complete', 
    label: 'Assessment Completed', 
    icon: 'ClipboardCheck', 
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-600'
  },
  
  // Progress Events
  WEEK_COMPLETE: { 
    type: 'week_complete', 
    label: 'Week Completed', 
    icon: 'Trophy', 
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-600'
  },
  STREAK_MILESTONE: { 
    type: 'streak_milestone', 
    label: 'Streak Milestone', 
    icon: 'Flame', 
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600'
  },
  
  // Admin Events
  ADMIN_ACTION: { 
    type: 'admin_action', 
    label: 'Admin Action', 
    icon: 'Shield', 
    color: 'slate',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600'
  },
  CONFIG_CHANGE: { 
    type: 'config_change', 
    label: 'Config Changed', 
    icon: 'Settings', 
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600'
  },
  WIDGET_TOGGLE: { 
    type: 'widget_toggle', 
    label: 'Widget Toggled', 
    icon: 'ToggleRight', 
    color: 'cyan',
    bgColor: 'bg-cyan-100',
    textColor: 'text-cyan-600'
  },
  
  // Notification Events
  NOTIFICATION_SENT: { 
    type: 'notification_sent', 
    label: 'Notification Sent', 
    icon: 'Bell', 
    color: 'pink',
    bgColor: 'bg-pink-100',
    textColor: 'text-pink-600'
  },
  
  // System Events
  SYSTEM_ERROR: { 
    type: 'system_error', 
    label: 'System Error', 
    icon: 'AlertTriangle', 
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-600'
  }
};

/**
 * Get activity type metadata by type string
 */
export const getActivityMeta = (typeStr) => {
  const found = Object.values(ACTIVITY_TYPES).find(t => t.type === typeStr);
  return found || ACTIVITY_TYPES.ADMIN_ACTION; // Default fallback
};

/**
 * Log an activity event to Firestore
 * 
 * @param {Object} db - Firestore database instance
 * @param {Object} activityType - One of ACTIVITY_TYPES
 * @param {Object} options - Additional options
 * @param {string} options.action - Description of the action
 * @param {string} options.details - Additional details
 * @param {string} options.userEmail - User's email
 * @param {string} options.userId - User's UID
 * @param {string} options.targetUser - User affected (if different from actor)
 * @param {Object} options.metadata - Any additional metadata
 */
export const logActivity = async (db, activityType, options = {}) => {
  if (!db) {
    console.warn('[ActivityLogger] No database instance provided');
    return null;
  }

  try {
    const logEntry = {
      type: activityType.type,
      action: options.action || activityType.label,
      details: options.details || '',
      user: options.userEmail || 'System',
      userId: options.userId || 'system',
      targetUser: options.targetUser || null,
      metadata: options.metadata || {},
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString() // Backup timestamp for queries
    };

    const docRef = await addDoc(collection(db, 'system_logs'), logEntry);
    return docRef.id;
  } catch (error) {
    // Silent fail - logging should never break the app
    console.error('[ActivityLogger] Failed to log activity:', error);
    return null;
  }
};

/**
 * Get recent activity logs
 * 
 * @param {Object} db - Firestore database instance
 * @param {number} limitCount - Number of logs to fetch (default 10)
 * @returns {Array} Array of activity logs
 */
export const getRecentActivity = async (db, limitCount = 10) => {
  if (!db) return [];

  try {
    const logsQuery = query(
      collection(db, 'system_logs'), 
      orderBy('timestamp', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(logsQuery);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        time: formatTimeAgo(data.timestamp)
      };
    });
  } catch (error) {
    console.error('[ActivityLogger] Failed to fetch logs:', error);
    return [];
  }
};

/**
 * Get activity summary for today
 * 
 * @param {Object} db - Firestore database instance
 * @returns {Object} Summary counts by type
 */
export const getTodaysSummary = async (db) => {
  if (!db) return {};

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const logsQuery = query(
      collection(db, 'system_logs'),
      where('createdAt', '>=', today.toISOString())
    );
    const snapshot = await getDocs(logsQuery);
    
    const summary = {
      signups: 0,
      logins: 0,
      completions: 0,
      adminActions: 0,
      total: snapshot.size
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      switch (data.type) {
        case 'user_signup':
          summary.signups++;
          break;
        case 'user_login':
          summary.logins++;
          break;
        case 'content_complete':
        case 'video_watched':
        case 'assessment_complete':
        case 'week_complete':
          summary.completions++;
          break;
        case 'admin_action':
        case 'config_change':
        case 'widget_toggle':
          summary.adminActions++;
          break;
        default:
          break;
      }
    });
    
    return summary;
  } catch (error) {
    console.error('[ActivityLogger] Failed to get summary:', error);
    return { signups: 0, logins: 0, completions: 0, adminActions: 0, total: 0 };
  }
};

/**
 * Clean up old logs (retention policy)
 * Call this periodically (e.g., via Cloud Function)
 * 
 * @param {Object} db - Firestore database instance
 * @param {number} daysToKeep - Number of days to retain logs (default 30)
 * @returns {number} Number of deleted logs
 */
export const cleanupOldLogs = async (db, daysToKeep = 30) => {
  if (!db) return 0;

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const oldLogsQuery = query(
      collection(db, 'system_logs'),
      where('createdAt', '<', cutoffDate.toISOString())
    );
    const snapshot = await getDocs(oldLogsQuery);
    
    let deletedCount = 0;
    const deletePromises = snapshot.docs.map(async (doc) => {
      await deleteDoc(doc.ref);
      deletedCount++;
    });
    
    await Promise.all(deletePromises);
    
    console.log(`[ActivityLogger] Cleaned up ${deletedCount} old logs`);
    return deletedCount;
  } catch (error) {
    console.error('[ActivityLogger] Failed to cleanup logs:', error);
    return 0;
  }
};

/**
 * Format timestamp to relative time string
 */
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Recently';
  
  try {
    const date = typeof timestamp.toDate === 'function' 
      ? timestamp.toDate() 
      : new Date(timestamp);
    
    const now = new Date();
    const diff = (now - date) / 1000; // seconds
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
};

export default {
  ACTIVITY_TYPES,
  getActivityMeta,
  logActivity,
  getRecentActivity,
  getTodaysSummary,
  cleanupOldLogs
};
