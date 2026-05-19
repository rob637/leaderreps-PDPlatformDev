// src/components/notifications/notificationPanelBus.js
//
// Minimal pub/sub so any component (the dashboard widget, a deep link, etc.)
// can request that the global NotificationBell open its panel without prop-
// drilling or a new context provider.

const EVENT = 'leaderreps:open-notifications';

export const openNotificationPanel = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT));
};

export const subscribeToOpenRequests = (handler) => {
  if (typeof window === 'undefined') return () => {};
  const fn = () => handler?.();
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
};
