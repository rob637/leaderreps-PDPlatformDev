// src/components/ui/PWAInstall.jsx
// PWA Install Button Component with error handling
import React, { useState, useEffect } from 'react';
import { Download, X, Info, Smartphone, Monitor, ExternalLink } from 'lucide-react';

const COLORS = {
  NAVY: '#002E47',
  ORANGE: '#E04E1B',
  TEAL: '#47A88D',
  LIGHT_GRAY: '#FCFCFA',
  TEXT: '#002E47',
  MUTED: '#47A88D',
  BG: '#FCFCFA'
};

const PWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
        setShowInstructions(true);
      }
      
      // Clear the deferredPrompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Install failed:', error);
      setShowInstructions(true);
    }
  };

  const getDeviceInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !isChrome;
    
    if (isIOS && isSafari) {
      return {
        icon: <Smartphone className="w-5 h-5" />,
        title: "Install on iOS",
        steps: [
          "Tap the Share button at the bottom",
          "Scroll down and tap 'Add to Home Screen'",
          "Tap 'Add' to install the app"
        ]
      };
    }
    
    if (isChrome) {
      return {
        icon: <Monitor className="w-5 h-5" />,
        title: "Install on Chrome",
        steps: [
          "Click the menu (⋮) in the top right",
          "Select 'Apps' → 'Install LeaderReps'",
          "Or look for the install icon in the address bar"
        ]
      };
    }
    
    return {
      icon: <ExternalLink className="w-5 h-5" />,
      title: "Install Instructions",
      steps: [
        "Use Chrome or Safari for best experience",
        "Look for 'Install App' or 'Add to Home Screen'",
        "The app will work offline once installed"
      ]
    };
  };

  if (isInstalled) {
    return null; // Don't show install button if already installed
  }

  return (
    <>
      {/* Install Button */}
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1"
        style={{
          backgroundColor: COLORS.TEAL,
          color: 'white',
          border: 'none'
        }}
        title="Install LeaderReps App"
      >
        <Download className="w-4 h-4" />
        <span className="hidden sm:inline">Install App</span>
      </button>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6"
            style={{ backgroundColor: COLORS.BG }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getDeviceInstructions().icon}
                <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
                  {getDeviceInstructions().title}
                </h3>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: COLORS.MUTED }} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {getDeviceInstructions().steps.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: COLORS.ORANGE }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm" style={{ color: COLORS.TEXT }}>
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <div className="flex gap-2">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Why install the app?
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    • Works offline • Faster loading • Desktop/home screen access • Better performance
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-2 px-4 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: COLORS.NAVY,
                color: 'white'
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstall;