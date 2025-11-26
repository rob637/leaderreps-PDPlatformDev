// src/components/ui/UpdateNotification.jsx
// PWA Update Notification - Prompts users when new version is available
import React, { useState, useEffect } from 'react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const UpdateNotification = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ [PWA] Service Worker Registered');
    },
    onRegisterError(error) {
      console.error('❌ [PWA] Service Worker Registration Error:', error);
    },
  });

  const [isUpdating, setIsUpdating] = useState(false);

  // Handle controller change to reload the page when the new SW takes over
  useEffect(() => {
    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    }

    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      }
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await updateServiceWorker(true);
      // Fallback: If the controller change event doesn't fire within 1 second,
      // force a reload. This handles cases where the event might be missed
      // or the browser behaves unexpectedly.
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to update service worker:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[100] animate-slide-up">
      <div
        className="rounded-xl shadow-2xl p-5 border-2 backdrop-blur-sm"
        style={{
          backgroundColor: 'rgba(252, 252, 250, 0.95)',
          borderColor: 'var(--corporate-teal)',
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg animate-bounce"
            style={{ backgroundColor: '#47A88D' }}
          >
            <RefreshCw className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-lg mb-1"
              style={{ color: 'var(--corporate-navy)' }}
            >
              New Version Available!
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              We've improved the app. Update now to get the latest features and speed enhancements.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: '#47A88D' }}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Update Now
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                style={{ color: 'var(--corporate-navy)' }}
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
