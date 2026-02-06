// src/components/ui/MobilePWABanner.jsx
// Smart PWA install banner for mobile users
import React, { useState, useEffect } from 'react';
import { Download, X, Share, Plus, Smartphone } from 'lucide-react';

const MobilePWABanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const isIOSSafari = isIOS && isSafari;

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    setIsInstalled(isStandalone);
    
    // Check if user dismissed the banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedAt = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
    
    // Show banner if not installed, not dismissed, or dismissed more than 7 days ago
    if (!isStandalone && (daysSinceDismissed > 7 || !dismissed)) {
      // Delay showing banner to not overwhelm user on first load
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOSSafari) {
      setShowIOSInstructions(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowBanner(false);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install failed:', error);
      }
    } else {
      // Show instructions for browsers without prompt support
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  // Don't show if installed or on desktop
  if (isInstalled || !showBanner) return null;
  
  // Only show on mobile (screen width check)
  const isMobile = window.innerWidth < 768;
  if (!isMobile) return null;

  return (
    <>
      {/* Main Install Banner */}
      <div 
        className="fixed bottom-[72px] left-4 right-4 z-40 animate-in slide-in-from-bottom duration-500"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <div className="bg-gradient-to-r from-corporate-navy to-corporate-navy/95 rounded-2xl shadow-2xl p-4 border border-white/10">
          <div className="flex items-start gap-3">
            {/* App Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-corporate-teal/20 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-corporate-teal" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold text-sm">
                Add to Home Screen
              </h3>
              <p className="text-white/70 text-xs mt-0.5">
                Install LeaderReps for quick access & offline use
              </p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 -mt-1 -mr-1 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Install Button */}
          <button
            onClick={handleInstall}
            className="w-full mt-3 py-2.5 px-4 bg-corporate-teal hover:bg-corporate-teal/90 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Install App
          </button>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
            onClick={() => setShowIOSInstructions(false)}
          />
          <div className="fixed inset-x-4 bottom-4 z-[10000]">
            <div 
              className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm mx-auto"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-corporate-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                  Install LeaderReps
                </h3>
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {isIOSSafari ? (
                <div className="space-y-4">
                  {/* Step 1 */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-corporate-teal flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">
                        Tap the <span className="font-semibold">Share</span> button
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
                        <Share className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-slate-600">at the bottom of Safari</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-corporate-teal flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">
                        Scroll and tap <span className="font-semibold">"Add to Home Screen"</span>
                      </p>
                      <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-lg">
                        <Plus className="w-4 h-4 text-slate-600" />
                        <span className="text-xs text-slate-600">Add to Home Screen</span>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-corporate-teal flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">
                        Tap <span className="font-semibold">"Add"</span> in the top right
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Look for the "Install" or "Add to Home Screen" option in your browser menu.
                  </p>
                  <p className="text-xs text-slate-500">
                    For the best experience, use Safari on iOS or Chrome on Android.
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full mt-5 py-2.5 bg-corporate-navy hover:bg-corporate-navy/90 text-white font-medium text-sm rounded-xl transition-colors"
              >
                Got it!
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MobilePWABanner;
