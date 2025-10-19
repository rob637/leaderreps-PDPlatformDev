// src/App.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
  lazy,
} from 'react';

// Firebase
import { initializeApp, getApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut,
} from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';

// App services layer
import { AppServicesProvider } from './services/useAppServices';

// Icons (lucide-react)
import {
  Home, Zap, BarChart3, BookOpen, Settings, LogOut,
  Clock, Briefcase, Mic, User, Menu, Trello,
} from 'lucide-react';

/* =============================================================================
   Theme
============================================================================= */
const COLORS = {
  NAVY: '#002E47',
  TEAL: '#47A88D',
  ORANGE: '#E04E1B',
  LIGHT_GRAY: '#FCFCFA',
};

/* =============================================================================
   Lazy Screens (ensure paths match your repo)
   src/components/screens/*.jsx
============================================================================= */
const DashboardScreen         = lazy(() => import('./components/screens/Dashboard.jsx'));
const ProfDevPlanScreen       = lazy(() => import('./components/screens/DevPlan.jsx'));
const CoachingLabScreen       = lazy(() => import('./components/screens/Labs.jsx'));
const DailyPracticeScreen     = lazy(() => import('./components/screens/DailyPractice.jsx'));
const PlanningHubScreen       = lazy(() => import('./components/screens/PlanningHub.jsx'));
const BusinessReadingsScreen  = lazy(() => import('./components/screens/BusinessReadings.jsx'));
const QuickStartScreen        = lazy(() => import('./components/screens/QuickStartAccelerator.jsx'));
const ExecutiveReflection     = lazy(() => import('./components/screens/ExecutiveReflection.jsx'));

/* =============================================================================
   Small utilities
============================================================================= */
function ConfigError({ message }) {
  return (
    <div className="min-h-screen grid place-items-center bg-white">
      <div className="max-w-lg p-6 rounded-xl border shadow">
        <h1 className="text-xl font-bold mb-2" style={{ color: COLORS.NAVY }}>Configuration Error</h1>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{message}</pre>
      </div>
    </div>
  );
}

function LoginPanel({ auth, onSuccess, allowAnonymous = false }) {
  const [err, setErr] = useState('');
  const tryAnon = async () => {
    try {
      await signInAnonymously(auth);
      onSuccess?.();
    } catch (e) {
      setErr(e?.message || String(e));
    }
  };
  return (
    <div className="min-h-screen grid place-items-center bg-white">
      <div className="max-w-md w-full p-6 rounded-xl border shadow">
        <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.NAVY }}>Please sign in</h2>
        <p className="text-gray-600 mb-4">
          For quick debugging, enable a temporary anonymous login.
        </p>
        {allowAnonymous ? (
          <button
            onClick={tryAnon}
            className="px-4 py-2 rounded-lg text-white font-semibold hover:opacity-90"
            style={{ background: COLORS.TEAL }}
          >
            Continue (temporary anonymous)
          </button>
        ) : (
          <p className="text-sm text-gray-500">
            Add <code>?anon=1</code> to the URL to show an anonymous login button.
          </p>
        )}
        {err && <pre className="mt-3 p-3 bg-rose-50 text-rose-700 text-sm rounded">{err}</pre>}
      </div>
    </div>
  );
}

/* =============================================================================
   Sidebar
============================================================================= */
function NavSidebar({ currentScreen, setCurrentScreen, user, closeMobileMenu }) {
  const sections = [
    {
      title: 'CORE NAVIGATION',
      items: [
        { screen: 'dashboard', label: 'Dashboard', icon: Home },
        { screen: 'quick-start-accelerator', label: 'QuickStart Accelerator', icon: Zap },
        { screen: 'reflection', label: 'Executive Reflection', icon: BarChart3 },
        { screen: 'daily-practice', label: 'Daily Practice', icon: Clock },
      ],
    },
    {
      title: 'TOOLS & HUBS',
      items: [
        { screen: 'prof-dev-plan', label: 'Development Plan', icon: Briefcase },
        { screen: 'coaching-lab', label: 'Coaching Lab', icon: Mic },
        { screen: 'planning-hub', label: 'Planning Hub (OKRs)', icon: Trello },
        { screen: 'business-readings', label: 'Business Readings', icon: BookOpen },
      ],
    },
    {
      title: 'SYSTEM',
      items: [{ screen: 'app-settings', label: 'App Settings', icon: Settings }],
    },
  ];

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
    closeMobileMenu();
  };

  const handleSignOut = async () => {
    try {
      await signOut(getAuth());
      closeMobileMenu();
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen p-4 shadow-2xl sticky top-0"
      style={{ background: COLORS.NAVY, color: 'white' }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: `1px solid ${COLORS.TEAL}80`,
          marginBottom: 24,
        }}
      >
        <h1 style={{ fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center' }}>
          LeaderReps
        </h1>
      </div>

      <nav style={{ flex: 1 }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 16 }}>
            <div
              style={{
                color: '#A5B4FC',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 1,
                margin: '0 0 6px 12px',
              }}
            >
              {section.title}
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = currentScreen === item.screen;
                return (
                  <button
                    key={item.screen}
                    onClick={() => handleNavigate(item.screen)}
                    className="flex items-center w-full px-4 py-3 rounded-xl font-semibold transition-colors"
                    style={{
                      textAlign: 'left',
                      background: active ? COLORS.TEAL : 'transparent',
                      color: active ? COLORS.NAVY : '#E0E7FF',
                    }}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ borderTop: `1px solid ${COLORS.TEAL}80`, paddingTop: 12 }}>
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center"
          style={{ background: COLORS.ORANGE, color: '#fff' }}
          title={user?.email || 'User'}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

/* =============================================================================
   Router (switch)
============================================================================= */
function ScreenRouter({ currentScreen }) {
  switch (currentScreen) {
    case 'prof-dev-plan':            return <ProfDevPlanScreen />;
    case 'daily-practice':           return <DailyPracticeScreen />;
    case 'coaching-lab':             return <CoachingLabScreen />;
    case 'planning-hub':             return <PlanningHubScreen />;
    case 'business-readings':        return <BusinessReadingsScreen />;
    case 'quick-start-accelerator':  return <QuickStartScreen />;
    case 'app-settings':             return <div className="p-6">App Settings</div>;
    case 'reflection':               return <ExecutiveReflection />;
    case 'dashboard':
    default:                         return <DashboardScreen />;
  }
}

/* =============================================================================
   Env / Firebase init
============================================================================= */
const REQUIRED_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

const firebaseConfigFromEnv = () => ({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
});

/* =============================================================================
   App (wrapped with AppServicesProvider)
============================================================================= */
export default function App() {
  // URL toggles
  const params = new URLSearchParams(window.location.search);
  const allowAnon = params.get('anon') === '1';
  const initialScreenParam = params.get('screen');

  // Screen state
  const [currentScreen, setCurrentScreen] = useState(initialScreenParam || 'dashboard');
  const [isMobileOpen, setIsMobileOpen]   = useState(false);
  const navigate = useCallback((screen) => setCurrentScreen(screen), []);

  // Require Firebase by default (flip to false if you want to run without it)
  const missing = REQUIRED_ENV.filter((k) => !import.meta.env[k]);
  const usingFirebase = true;
  if (usingFirebase && missing.length) {
    return (
      <ConfigError
        message={
          `Missing environment variables:\n` +
          missing.join('\n') +
          `\n\nAdd in Netlify → Site settings → Environment variables (must start with VITE_)`
        }
      />
    );
  }

  // Firebase init
  const firebaseConfig = useMemo(firebaseConfigFromEnv, []);
  const app = useMemo(() => {
    try { return getApp(); } catch { return initializeApp(firebaseConfig); }
  }, [firebaseConfig]);

  const auth = useMemo(() => getAuth(app), [app]);
  const db   = useMemo(() => getFirestore(app), [app]);

  useEffect(() => setLogLevel('error'), []);

  // Auth gate
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setIsAuthReady(true);
    });
    return () => unsub();
  }, [auth]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 mx-auto mb-3"
            style={{ borderTopColor: COLORS.TEAL }}
          />
          <p style={{ color: COLORS.NAVY, fontWeight: 600 }}>Loading auth…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPanel auth={auth} allowAnonymous={allowAnon} onSuccess={() => window.location.reload()} />;
  }

  return (
    <AppServicesProvider app={app} auth={auth} db={db} user={user} navigate={navigate}>
      <div className="min-h-screen flex" style={{ background: COLORS.LIGHT_GRAY }}>
        {/* Top bar (mobile) */}
        <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-40 w-full">
          <h1 style={{ color: COLORS.NAVY, fontWeight: 800, fontSize: 18 }}>LeaderReps</h1>
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2"
            title="Open menu"
            style={{ color: COLORS.NAVY }}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar (desktop) */}
        <NavSidebar
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          user={user}
          closeMobileMenu={() => setIsMobileOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="p-8">
                <div
                  className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 mb-3"
                  style={{ borderTopColor: COLORS.TEAL }}
                />
                <p style={{ color: COLORS.NAVY, fontWeight: 600 }}>Loading Screen...</p>
              </div>
            }
          >
            <ScreenRouter currentScreen={currentScreen} />
          </Suspense>
        </main>
      </div>
    </AppServicesProvider>
  );
}
