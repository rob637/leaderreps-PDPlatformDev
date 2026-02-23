// Firebase Cloud Messaging Service Worker
// This file must be at the root of the domain for FCM to work
/* eslint-env serviceworker */
/* global firebase, importScripts, clients */

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
// Detect environment from the hostname and use appropriate config
const hostname = self.location.hostname;

let firebaseConfig;
if (hostname.includes('leaderreps-prod')) {
  // Production
  firebaseConfig = {
    apiKey: "AIzaSyAy21Tmhwjy4jAPrZYxd5STaGpK8Asfmu0",
    authDomain: "leaderreps-prod.firebaseapp.com",
    projectId: "leaderreps-prod",
    storageBucket: "leaderreps-prod.firebasestorage.app",
    messagingSenderId: "334757526342",
    appId: "1:334757526342:web:f3447420fb477c43010347"
  };
} else if (hostname.includes('leaderreps-test')) {
  // Test
  firebaseConfig = {
    apiKey: "AIzaSyDYYBM9GEcCLUxEnE0z4V4FcVBmDZHjCY0",
    authDomain: "leaderreps-test.firebaseapp.com",
    projectId: "leaderreps-test",
    storageBucket: "leaderreps-test.firebasestorage.app",
    messagingSenderId: "1098765432109",
    appId: "1:1098765432109:web:testappid123456"
  };
} else {
  // Development (default)
  firebaseConfig = {
    apiKey: "AIzaSyC2lIWg-Gf3UjHPnC3Ml5cNZvM4w-eIxLI",
    authDomain: "leaderreps-pd-platform.firebaseapp.com",
    projectId: "leaderreps-pd-platform",
    storageBucket: "leaderreps-pd-platform.appspot.com",
    messagingSenderId: "549665220381",
    appId: "1:549665220381:web:c0a1b2c3d4e5f6a7b8c9d0"
  };
}

firebase.initializeApp(firebaseConfig);

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
