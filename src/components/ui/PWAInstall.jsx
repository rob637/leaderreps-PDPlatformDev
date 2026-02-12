// src/components/ui/PWAInstall.jsx
// PWA Install Button Component with error handling
import React, { useState, useEffect } from 'react';
import { Download, X, Info, Smartphone, Monitor, ExternalLink } from 'lucide-react';

const PWAInstall = ({ collapsed = false }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  // const [isInstallable, setIsInstallable] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    // Check if prompt was already captured globally (before component mounted)
    if (window.deferredPWAPrompt) {
      setDeferredPrompt(window.deferredPWAPrompt);
    }

    // Listen for prompt becoming available (if it fires after mount)
    const handlePromptAvailable = () => {
      if (window.deferredPWAPrompt) {
        setDeferredPrompt(window.deferredPWAPrompt);
      }
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('pwa-installed', handleAppInstalled);
    // Also keep the original listeners as fallback
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Try to get prompt from local state or global storage
    const prompt = deferredPrompt || window.deferredPWAPrompt;
    
    if (!prompt) {
      setShowInstructions(true);
      return;
    }

    try {
      // Show the install prompt
      prompt.prompt();
      
      // Wait for the user's response
      const { outcome } = await prompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA Install accepted');
      } else {
        setShowInstructions(true);
      }
      
      // Clear the deferredPrompt both locally and globally
      setDeferredPrompt(null);
      window.deferredPWAPrompt = null;
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

  // Show button if not installed, even if deferredPrompt isn't ready (for iOS instructions)
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Button */}
      <button
        onClick={handleInstallClick}
        className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1 ${collapsed ? 'w-full' : ''}`}
        style={{
          backgroundColor: '#47A88D',
          color: 'white',
          border: 'none'
        }}
        title="Install LeaderReps App"
      >
        <Download className="w-4 h-4" />
        {!collapsed && <span className="hidden sm:inline">Install App</span>}
      </button>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getDeviceInstructions().icon}
                <h3 className="text-lg font-bold text-corporate-navy dark:text-white">
                  {getDeviceInstructions().title}
                </h3>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="p-1 bg-transparent hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" style={{ color: 'var(--corporate-teal)' }} />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {getDeviceInstructions().steps.map((step, index) => (
                <div key={index} className="flex gap-3">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: '#E04E1B' }}
                  >
                    {index + 1}
                  </div>
                  <p className="text-sm text-corporate-navy dark:text-slate-200">
                    {step}
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
              <div className="flex gap-2">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Why install the app?
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    • Works offline • Faster loading • Desktop/home screen access • Better performance
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full py-2 px-4 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: '#002E47',
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