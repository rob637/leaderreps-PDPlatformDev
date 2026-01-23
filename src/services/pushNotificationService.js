// src/services/pushNotificationService.js
// Service for handling push notifications via Firebase Cloud Messaging
import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';

let messaging = null;

// VAPID key for web push - this needs to be generated in Firebase Console
// Go to: Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || null;

/**
 * Initialize Firebase Cloud Messaging
 * Call this early in app lifecycle
 */
export const initializeMessaging = async (app) => {
  if (typeof window === 'undefined') return null;
  
  // Check if messaging is supported
  if (!('Notification' in window)) {
    console.log('[PushService] Notifications not supported in this browser');
    return null;
  }
  
  if (!('serviceWorker' in navigator)) {
    console.log('[PushService] Service workers not supported');
    return null;
  }
  
  try {
    const { getMessaging } = await import('firebase/messaging');
    messaging = getMessaging(app);
    console.log('[PushService] Firebase Messaging initialized');
    return messaging;
  } catch (error) {
    console.warn('[PushService] Could not initialize messaging:', error.message);
    return null;
  }
};

/**
 * Request notification permission and get FCM token
 * @param {Object} db - Firestore instance
 * @param {string} userId - Current user's ID
 * @returns {Promise<string|null>} FCM token or null
 */
export const requestNotificationPermission = async (db, userId) => {
  if (!messaging) {
    console.log('[PushService] Messaging not initialized');
    return null;
  }
  
  if (!VAPID_KEY) {
    console.warn('[PushService] VAPID key not configured. Set VITE_FIREBASE_VAPID_KEY.');
    return null;
  }
  
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('[PushService] Notification permission denied');
      return null;
    }
    
    // Get registration token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    
    if (token) {
      console.log('[PushService] FCM token obtained');
      
      // Save token to user's Firestore document
      if (db && userId) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmToken: token,
          fcmTokenUpdatedAt: new Date().toISOString()
        });
        console.log('[PushService] FCM token saved to Firestore');
      }
      
      return token;
    } else {
      console.log('[PushService] No registration token available');
      return null;
    }
  } catch (error) {
    console.error('[PushService] Error getting FCM token:', error);
    return null;
  }
};

/**
 * Set up foreground message handler
 * @param {Function} callback - Function to call when message received
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    console.log('[PushService] Messaging not initialized');
    return () => {};
  }
  
  return onMessage(messaging, (payload) => {
    console.log('[PushService] Foreground message received:', payload);
    
    // Show notification manually for foreground messages
    if (Notification.permission === 'granted') {
      const notificationTitle = payload.notification?.title || 'LeaderReps';
      const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        data: payload.data || {}
      };
      
      // Create notification
      new Notification(notificationTitle, notificationOptions);
    }
    
    // Call the callback for in-app handling
    if (callback) {
      callback(payload);
    }
  });
};

/**
 * Check if push notifications are supported and enabled
 */
export const getPushNotificationStatus = () => {
  if (typeof window === 'undefined') {
    return { supported: false, permission: 'default', reason: 'Not in browser' };
  }
  
  if (!('Notification' in window)) {
    return { supported: false, permission: 'default', reason: 'Notifications not supported' };
  }
  
  if (!('serviceWorker' in navigator)) {
    return { supported: false, permission: 'default', reason: 'Service workers not supported' };
  }
  
  return {
    supported: true,
    permission: Notification.permission,
    reason: null
  };
};

/**
 * Delete FCM token (e.g., on logout)
 * @param {Object} db - Firestore instance
 * @param {string} userId - User's ID
 */
export const deleteFcmToken = async (db, userId) => {
  if (!messaging) return;
  
  try {
    // Note: deleteToken() is not always necessary - tokens auto-expire
    // But we should clear it from Firestore
    if (db && userId) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmToken: null,
        fcmTokenUpdatedAt: null
      });
      console.log('[PushService] FCM token cleared from Firestore');
    }
  } catch (error) {
    console.error('[PushService] Error deleting FCM token:', error);
  }
};

export default {
  initializeMessaging,
  requestNotificationPermission,
  onForegroundMessage,
  getPushNotificationStatus,
  deleteFcmToken
};
