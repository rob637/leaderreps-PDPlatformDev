import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import ErrorBoundary from './components/system/ErrorBoundary';
import ConfigGate from './components/system/ConfigGate';
import { onCLS, onINP, onLCP, onFCP, onTTFB } from 'web-vitals';

// === CORE WEB VITALS MONITORING ===
const reportWebVitals = (metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric.name, metric.value, metric.rating);
  }
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // You can send to Google Analytics, Firebase Analytics, or your analytics service
    // Example: gtag('event', metric.name, { value: metric.value });
    
    // For now, we'll log significant metrics
    if (metric.rating === 'poor') {
      console.warn(`[Web Vitals] Poor ${metric.name}:`, metric.value);
    }
  }
};

const initWebVitals = () => {
  onCLS(reportWebVitals);  // Cumulative Layout Shift
  onINP(reportWebVitals);  // Interaction to Next Paint
  onLCP(reportWebVitals);  // Largest Contentful Paint
  onFCP(reportWebVitals);  // First Contentful Paint
  onTTFB(reportWebVitals); // Time to First Byte
};
// === END CORE WEB VITALS MONITORING ===

// === PWA SERVICE WORKER REGISTRATION ===
const registerServiceWorker = () => {
  // Check if Service Workers are supported by the browser
  if ('serviceWorker' in navigator) {
    // Vite PWA plugin generates the worker as /sw.js in production build
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .catch((error) => {
        console.error('SW registration failed:', error);
      });
  }
};
// === END PWA SERVICE WORKER REGISTRATION ===

const App = lazy(() => import('./App'));

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ConfigGate>
        <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
          <App />
        </Suspense>
      </ConfigGate>
    </ErrorBoundary>
  </React.StrictMode>
);

// Initialize Web Vitals monitoring
initWebVitals();

// Register the service worker in production
if (process.env.NODE_ENV === 'production') {
  registerServiceWorker();
}