// src/services/notificationService.js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// VAPID key from Firebase Console > Project Settings > Cloud Messaging
// This is public and safe to include in client code
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';

export const notificationService = {
  messaging: null,
  
  // Initialize Firebase Cloud Messaging
  initMessaging: (app) => {
    try {
      if ('Notification' in window && navigator.serviceWorker) {
        notificationService.messaging = getMessaging(app);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error initializing messaging:', error);
      return false;
    }
  },

  // Check if the browser supports notifications
  isSupported: () => {
    return 'Notification' in window;
  },

  // Check if FCM is supported
  isFCMSupported: () => {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  },

  // Get current permission state
  getPermission: () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  // Request permission
  requestPermission: async () => {
    if (!('Notification' in window)) return 'unsupported';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  },

  // Get FCM token and register it for the user
  registerForPushNotifications: async (db, userId) => {
    if (!notificationService.messaging) {
      console.warn('FCM not initialized');
      return null;
    }

    if (!VAPID_KEY) {
      console.warn('VAPID_KEY not configured');
      return null;
    }

    try {
      // First request permission
      const permission = await notificationService.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Get the FCM token
      const token = await getToken(notificationService.messaging, { 
        vapidKey: VAPID_KEY 
      });

      if (token) {
        // Save the token to the user's document
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(token),
          notificationsEnabled: true,
          lastTokenRefresh: new Date().toISOString()
        });
        console.log('FCM token registered successfully');
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  },

  // Unregister a token
  unregisterToken: async (db, userId, token) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(token),
        notificationsEnabled: false
      });
      console.log('FCM token unregistered');
      return true;
    } catch (error) {
      console.error('Error unregistering token:', error);
      return false;
    }
  },

  // Set up listener for foreground messages
  onForegroundMessage: (callback) => {
    if (!notificationService.messaging) return null;
    return onMessage(notificationService.messaging, callback);
  },

  // Send a notification
  sendNotification: (title, options = {}) => {
    if (!('Notification' in window)) return null;
    if (Notification.permission !== 'granted') return null;

    try {
      // Try to use Service Worker registration if available (for mobile PWA support)
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-96x96.png',
            vibrate: [100, 50, 100],
            ...options
          });
        });
      } else {
        // Fallback to standard Notification API
        return new Notification(title, {
          icon: '/icons/icon-192x192.png',
          ...options
        });
      }
    } catch (e) {
      console.error("Notification failed", e);
      return null;
    }
  }
};
