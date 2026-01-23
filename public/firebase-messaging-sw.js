// Firebase Cloud Messaging Service Worker
// This file must be at the root of the domain for FCM to work
/* eslint-env serviceworker */
/* global firebase, importScripts, clients */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Config is fetched dynamically from the main app or uses defaults
// The actual config values will be injected at build time via Vite
firebase.initializeApp({
  apiKey: "AIzaSyC2lIWg-Gf3UjHPnC3Ml5cNZvM4w-eIxLI",
  authDomain: "leaderreps-pd-platform.firebaseapp.com",
  projectId: "leaderreps-pd-platform",
  storageBucket: "leaderreps-pd-platform.appspot.com",
  messagingSenderId: "549665220381",
  appId: "1:549665220381:web:abcdef123456" // Placeholder - actual app ID from Firebase Console
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'LeaderReps';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [100, 50, 100],
    data: payload.data || {},
    tag: payload.data?.tag || 'default',
    requireInteraction: payload.data?.requireInteraction === 'true',
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') {
    return;
  }

  // Open the app when notification is clicked
  const urlToOpen = data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there's already a window/tab open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: data
          });
          return client.focus();
        }
      }
      // No window open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
