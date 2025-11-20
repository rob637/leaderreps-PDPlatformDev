// src/components/ui/UpdateNotification.jsx
// PWA Update Notification - Prompts users when new version is available
import React, { useState, useEffect } from 'react';
import { RefreshCw, X, AlertCircle } from 'lucide-react';

const COLORS = {
  NAVY: '#002E47',
  ORANGE: '#E04E1B',
  TEAL: '#47A88D',
  LIGHT_GRAY: '#FCFCFA',
};

const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);

        // Check for updates periodically (every 60 minutes)
        const interval = setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);

        // Listen for new service worker waiting
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              setUpdateAvailable(true);
              console.log('🔄 [UpdateNotification] New version available');
            }
          });
        });

        // Check if there's already a waiting service worker
        if (reg.waiting) {
          setUpdateAvailable(true);
        }

        return () => clearInterval(interval);
      });

      // Listen for controller change (service worker activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 [UpdateNotification] Controller changed, reloading...');
        window.location.reload();
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!registration?.waiting) return;

    setIsUpdating(true);

    // Tell the waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // The controllerchange event will trigger a reload
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
    // Store dismissal in sessionStorage so it doesn't show again this session
    sessionStorage.setItem('update-dismissed', 'true');
  };

  // Don't show if dismissed this session
  if (sessionStorage.getItem('update-dismissed') === 'true') {
    return null;
  }

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div
        className="rounded-lg shadow-2xl p-4 border-2"
        style={{
          backgroundColor: COLORS.LIGHT_GRAY,
          borderColor: COLORS.TEAL,
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.TEAL }}
          >
            <AlertCircle className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-bold text-base mb-1"
              style={{ color: COLORS.NAVY }}
            >
              Update Available
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              A new version of LeaderReps is ready. Update now for the latest features and improvements.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: COLORS.TEAL }}
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
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100"
                style={{ color: COLORS.NAVY }}
              >
                Later
              </button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" style={{ color: COLORS.NAVY }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateNotification;
