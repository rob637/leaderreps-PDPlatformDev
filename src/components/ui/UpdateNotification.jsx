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
  const [showPopup, setShowPopup] = useState(false);
  const [newVersion, setNewVersion] = useState(null);
  const currentVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

  // Check version when update is available
  useEffect(() => {
    if (needRefresh) {
      fetch('/version.json')
        .then(res => res.json())
        .then(data => {
          console.log(`[PWA] Current: ${currentVersion}, Available: ${data.version}`);
          if (data.version !== currentVersion) {
            setNewVersion(data.version);
            setShowPopup(true);
          } else {
            console.log('[PWA] Version match. Skipping popup.');
          }
        })
        .catch(err => {
          console.error('[PWA] Failed to check version:', err);
          // Fallback: show popup if version check fails
          setShowPopup(true);
        });
    }
  }, [needRefresh, currentVersion]);

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

    // 1. Set a safety timeout immediately. 
    // If the update process hangs or the controller change event is missed,
    // this ensures we force a reload after 3 seconds no matter what.
    setTimeout(() => {
      console.log('[PWA] Update timeout reached. Forcing reload...');
      window.location.reload();
    }, 3000);

    try {
      // 2. Attempt to activate the waiting service worker
      await updateServiceWorker(true);
    } catch (error) {
      console.error('Failed to update service worker:', error);
      // If it fails, the timeout above will still trigger a reload, 
      // which is often the best way to clear a stuck state anyway.
    }
  };

  const handleDismiss = () => {
    setNeedRefresh(false);
    setShowPopup(false);
  };

  if (!showPopup) {
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
            {newVersion && (
              <p className="text-xs font-mono text-gray-500 mb-1">
                v{currentVersion} → v{newVersion}
              </p>
            )}
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
