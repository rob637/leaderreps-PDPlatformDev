import { useState, useEffect } from 'react';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { useAuth } from './hooks/useAuth.js';
import { NavigationProvider } from './providers/NavigationProvider.jsx';
import { SCREENS } from './config/navigation.js';
import ScreenRouter from './components/layout/ScreenRouter.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import LoginScreen from './components/screens/LoginScreen.jsx';
import OnboardingScreen from './components/screens/OnboardingScreen.jsx';

/**
 * Handles ?unlock=CODE magic links from SMS.
 * Shows a loading state while redeeming the code.
 */
function UnlockHandler({ code, onDone }) {
  const { signInWithUnlockCode } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await signInWithUnlockCode(code);
        // Clean up URL — remove the unlock param
        const url = new URL(window.location);
        url.searchParams.delete('unlock');
        window.history.replaceState({}, '', url.pathname);
        if (!cancelled) onDone();
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [code]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lab-navy px-6">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-bold text-white mb-3">Couldn't sign in</h1>
          <p className="text-stone-300 text-sm mb-6">{error}</p>
          <button
            onClick={() => {
              const url = new URL(window.location);
              url.searchParams.delete('unlock');
              window.history.replaceState({}, '', url.pathname);
              onDone();
            }}
            className="px-6 py-2.5 bg-lab-teal text-white rounded-xl text-sm font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-lab-navy">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Leadership Lab</h1>
        <p className="text-stone-400 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isOnboarded, isFacilitator, loading, viewAs } = useAuth();
  const [unlockCode, setUnlockCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('unlock');
  });

  // Handle magic link unlock
  if (unlockCode) {
    return <UnlockHandler code={unlockCode} onDone={() => setUnlockCode(null)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lab-navy">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Leadership Lab</h1>
          <p className="text-stone-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (!isOnboarded) {
    return <OnboardingScreen />;
  }

  // Facilitators/admins start on the Admin screen, participants on Feed
  const viewingAsFacilitator = isFacilitator && viewAs === 'facilitator';
  const initialScreen = viewingAsFacilitator ? SCREENS.ADMIN : SCREENS.FEED;

  return (
    <NavigationProvider initialScreen={initialScreen}>
      <div className="min-h-screen bg-lab-cream">
        <main className="max-w-lg mx-auto">
          <ScreenRouter />
        </main>
        <BottomNav />
      </div>
    </NavigationProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
