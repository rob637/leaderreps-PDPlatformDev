// src/services/notificationService.js

export const notificationService = {
  // Check if the browser supports notifications
  isSupported: () => {
    return 'Notification' in window;
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
