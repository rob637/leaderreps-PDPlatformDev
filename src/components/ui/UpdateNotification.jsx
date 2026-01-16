// src/components/ui/UpdateNotification.jsx
// PWA Update Notification - Google-style update prompt
// Features:
// - Periodic background checks for updates (every 5 minutes)
// - Non-intrusive centered toast notification
// - Version comparison display
// - Graceful update flow with user control

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X, Sparkles, Download } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

// Check for updates every 5 minutes when app is in focus
const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000;

const UpdateNotification = () => {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('✅ [PWA] Service Worker Registered');
      
      // Set up periodic update checks (Google-style background refresh)
      if (registration) {
        setInterval(() => {
          console.log('[PWA] Checking for updates...');
          registration.update();
        }, UPDATE_CHECK_INTERVAL);
      }
    },
    onRegisterError(error) {
      console.error('❌ [PWA] Service Worker Registration Error:', error);
    },
    onNeedRefresh() {
      console.log('[PWA] New content available, waiting for user action');
    },
  });

  const [isUpdating, setIsUpdating] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [newVersion, setNewVersion] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  // Check version when update is available
  useEffect(() => {
    if (needRefresh && !dismissed) {
      // Fetch the new version info with cache bust
      // Use relative path to support subdirectories
      const versionUrl = new URL('version.json', window.location.href).href;
      
      fetch(`${versionUrl}?t=${Date.now()}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log(`[PWA] Current: v${APP_VERSION}, Available: v${data.version}`);
          if (data.version !== APP_VERSION) {
            setNewVersion(data.version);
            setShowNotification(true);
          }
        })
        .catch(err => {
          console.warn('[PWA] Version check failed, showing generic update prompt:', err);
          // Still show notification even if version check fails
          setShowNotification(true);
        });
    }
  }, [needRefresh, dismissed]);

  // Handle controller change - LOG only, don't auto-reload
  // User should click "Update Now" to reload and get the new version
  useEffect(() => {
    const onControllerChange = () => {
      console.log('[PWA] New service worker controller detected');
      // Don't auto-reload - let user decide via the update notification
      // The update prompt will appear if needRefresh is true
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

  const handleUpdate = useCallback(async () => {
    setIsUpdating(true);

    // Safety timeout - force reload after 8 seconds if SW update hangs
    const timeoutId = setTimeout(() => {
      console.log('[PWA] Update timeout, forcing reload...');
      window.location.reload();
    }, 8000);

    try {
      console.log('[PWA] Activating new service worker...');
      await updateServiceWorker(true);
      // The controllerchange event will trigger the reload
    } catch (error) {
      console.error('[PWA] Update failed:', error);
      clearTimeout(timeoutId);
      // Fallback: just reload
      window.location.reload();
    }
  }, [updateServiceWorker]);

  const handleDismiss = useCallback(() => {
    setShowNotification(false);
    setDismissed(true);
    // Re-show after 30 minutes if still needed
    setTimeout(() => setDismissed(false), 30 * 60 * 1000);
  }, []);

  const handleForceReset = useCallback(async () => {
    if (!confirm('This will clear all cached data and reload. Continue?')) return;
    
    // Unregister all service workers
    if (navigator.serviceWorker) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
    
    // Clear caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    window.location.reload();
  }, []);

  if (!showNotification) {
    return null;
  }

  return (
    <>
      {/* Backdrop blur for emphasis */}
      <div 
        className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[99] animate-fade-in"
        onClick={handleDismiss}
      />
      
      {/* Google-style centered bottom toast */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-corporate-teal to-emerald-400" />
          
          <div className="p-5">
            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-corporate-teal to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-slate-900 mb-1">
                  Update Available
                </h3>
                
                {newVersion && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                      v{APP_VERSION}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="text-xs font-mono bg-corporate-teal/10 text-corporate-teal px-2 py-0.5 rounded font-bold">
                      v{newVersion}
                    </span>
                  </div>
                )}
                
                <p className="text-sm text-slate-500 leading-relaxed">
                  A new version with improvements is ready.
                </p>
              </div>
              
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-corporate-teal text-white font-bold rounded-xl hover:bg-teal-700 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Update Now
                  </>
                )}
              </button>
              
              <button
                onClick={handleDismiss}
                className="px-5 py-3 text-slate-600 font-medium rounded-xl hover:bg-slate-100 transition-colors"
              >
                Later
              </button>
            </div>
            
            {/* Subtle force reset link */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <button 
                onClick={handleForceReset}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Having issues? Force refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UpdateNotification;
