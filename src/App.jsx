// src/App.jsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  createContext,
  useContext,
  Suspense,
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

// Icons (from lucide-react)
import {
  Home, Zap, BarChart3, BookOpen, Settings, LogOut,
  Clock, Briefcase, Mic, User, Menu,
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
   App Context (lightweight service hub)
============================================================================= */
const AppServiceContext = createContext(null);
export const useAppServices = () => useContext(AppServiceContext) ?? {
  navigate: () => {},
  user: null,
  db: null,
  auth: null,
  userId: null,
  isAuthReady: false,
  isLoading: false,
  error: null,
};

/* =============================================================================
   Placeholder Screens (safe defaults; replace with your real screens later)
   This avoids build failures if some imports don’t exist yet.
============================================================================= */
const ScreenWrapper = ({ title, children }) => (
  <div style={{ padding: 24 }}>
    <h1 style={{ color: COLORS.NAVY, fontSize: 28, fontWeight: 800 }}>{title}</h1>
    <div style={{ marginTop: 8, color: '#374151' }}>{children}</div>
  </div>
);

const DashboardScreen        = () => <ScreenWrapper title="Dashboard">Welcome to LeaderReps.</ScreenWrapper>;
const ProfDevPlanScreen      = () => <ScreenWrapper title="Development Plan">(Placeholder) Your PDP content.</ScreenWrapper>;
const CoachingLabScreen      = () => <ScreenWrapper title="Coaching Lab">(Placeholder) Coaching tools & exercises.</ScreenWrapper>;
const DailyPracticeScreen    = () => <ScreenWrapper title="Daily Practice">(Placeholder) Practice queue & habits.</ScreenWrapper>;
const PlanningHubScreen      = () => <ScreenWrapper title="Planning Hub (OKRs)">(Placeholder) OKRs & goals.</ScreenWrapper>;
const BusinessReadingsScreen = () => <ScreenWrapper title="Business Readings">(Placeholder) Reading list.</ScreenWrapper>;
const QuickStartScreen       = () => <ScreenWrapper title="QuickStart Accelerator">(Placeholder) Quick start flow.</ScreenWrapper>;
const ExecutiveReflection    = () => <ScreenWrapper title="Executive Reflection">(Placeholder) Reflection dashboards.</ScreenWrapper>;
const AppSettingsScreen      = () => <ScreenWrapper title="App Settings">(Placeholder) Configure app options.</ScreenWrapper>;

/* =============================================================================
   Sidebar Navigation
============================================================================= */
function NavSidebar({ currentScreen, setCurrentScreen, user, isMobileOpen, closeMobileMenu }) {
  const { auth } = useAppServices();

  const sections = [
    {
      title: 'CORE NAVIGATION',
      items: [
        { screen: 'dashboard', label: 'Dashboard', icon: Home },
        { screen: 'quick-start-accelerator', label: 'QuickStart Accelerator', icon: Zap },
        { screen: 'reflection', label: 'Executive Reflection', icon: BarChart3 },
        { screen: 'daily-practice', label: 'Daily Practice', icon: Clock, notify: false },
      ],
    },
    {
      title: 'TOOLS & HUBS',
      items: [
        { screen: 'prof-dev-plan', label: 'Development Plan', icon: Briefcase },
        { screen: 'coaching-lab', label: 'Coaching Lab', icon: Mic },
        { screen: 'planning-hub', label: 'Planning Hub (OKRs)', icon: Briefcase },
        { screen: 'business-readings', label: 'Business Readings', icon: BookOpen },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { screen: 'app-settings', label: 'App Settings', icon: Settings },
      ],
    },
  ];

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
    closeMobileMenu();
  };

  const handleSignOut = async () => {
    try {
      if (auth) await signOut(auth);
      closeMobileMenu();
    } catch (e) {
      console.error('Sign out failed:', e);
    }
  };

  // Desktop sidebar
  return (
    <aside
      className="hidden md:flex flex-col w-64 min-h-screen p-4 shadow-2xl sticky top-0"
      style={{ background: COLORS.NAVY, color: 'white' }}
    >
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: `1px solid ${COLORS.TEAL}80`, marginBottom: 24 }}>
        <h1 style={{ fontWeight: 900, fontSize: 22, display: 'flex', alignItems: 'center' }}>LeaderReps</h1>
      </div>

      <nav style={{ flex: 1 }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 16 }}>
            <div style={{ color: '#A5B4FC', fontSize: 12, fontWeight: 700, letterSpacing: 1, margin: '0 0 6px 12px' }}>
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
                    {item.notify && (
                      <span
                        style={{
                          display: 'inline-block',
                          width: 10, height: 10, borderRadius: 9999,
                          background: COLORS.ORANGE, marginLeft: 8,
                          boxShadow: '0 0 0 2px #fff',
                        }}
                        title="Pending item"
                      />
                    )}
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
   Router (simple switch)
============================================================================= */
function ScreenRouter({ currentScreen }) {
  switch (currentScreen) {
    case 'prof-dev-plan':          return <ProfDevPlanScreen />;
    case 'daily-practice':         return <DailyPracticeScreen />;
    case 'coaching-lab':           return <CoachingLabScreen />;
    case 'planning-hub':           return <PlanningHubScreen />;
    case 'business-readings':      return <BusinessReadingsScreen />;
    case 'quick-start-accelerator':return <QuickStartScreen />;
    case 'app-settings':           return <AppSettingsScreen />;
    case 'reflection':             return <ExecutiveReflection />;
    case 'dashboard':
    default:                       return <DashboardScreen />;
  }
}

/* =============================================================================
   Data Provider (stubbed – replace with your real hooks later)
============================================================================= */
function DataProvider({ children, firebaseServices, userId, isAuthReady, navigate, user }) {
  const services = useMemo(() => ({
    navigate,
    user,
    ...firebaseServices,
    userId,
    isAuthReady,
    // Stubs (replace with your real data functions)
    isLoading: false,
    error: null,
  }), [navigate, user, firebaseServices, userId, isAuthReady]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 mx-auto mb-3" style={{ borderTopColor: COLORS.TEAL }}></div>
          <p style={{ color: COLORS.NAVY, fontWeight: 600 }}>Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <AppServiceContext.Provider value={services}>
      {children}
    </AppServiceContext.Provider>
  );
}

/* =============================================================================
   Small helpers
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
        <p className="text-gray-600 mb-4">For quick debugging, enable a temporary anonymous login.</p>
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
   Main App
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

function App() {
  // URL toggles
  const params = new URLSearchParams(window.location.search);
  const allowAnon = params.get('anon') === '1';
  const initialScreenParam = params.get('screen');

  // Screen & mobile menu state
  const [currentScreen, setCurrentScreen] = useState(initialScreenParam || 'dashboard');
  const [isMobileOpen, setIsMobileOpen]   = useState(false);

  const navigate = useCallback((screen) => setCurrentScreen(screen), []);

  // Env check
  const missing = REQUIRED_ENV.filter(k => !import.meta.env[k]);
  if (missing.length) {
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
      // console.log('Auth ready:', !!u);
    });
    return () => unsub();
  }, [auth]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 mx-auto mb-3" style={{ borderTopColor: COLORS.TEAL }}></div>
          <p style={{ color: COLORS.NAVY, fontWeight: 600 }}>Loading auth…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPanel auth={auth} allowAnonymous={allowAnon} onSuccess={() => window.location.reload()} />;
  }

  const firebaseServices = { app, auth, db };

  return (
    <DataProvider
      firebaseServices={firebaseServices}
      userId={user.uid}
      isAuthReady={true}
      navigate={navigate}
      user={user}
    >
      <div className="min-h-screen flex" style={{ background: COLORS.LIGHT_GRAY }}>
        {/* Top bar (mobile) */}
        <div className="md:hidden sticky top-0 bg-white/95 backdrop-blur-sm shadow-md p-4 flex justify-between items-center z-40 w-full">
          <h1 style={{ color: COLORS.NAVY, fontWeight: 800, fontSize: 18 }}>LeaderReps</h1>
          <button onClick={() => setIsMobileOpen(true)} className="p-2" title="Open menu" style={{ color: COLORS.NAVY }}>
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar (desktop) */}
        <NavSidebar
          currentScreen={currentScreen}
          setCurrentScreen={setCurrentScreen}
          user={user}
          isMobileOpen={isMobileOpen}
          closeMobileMenu={() => setIsMobileOpen(false)}
        />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <Suspense
            fallback={
              <div className="p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-gray-200 mb-3" style={{ borderTopColor: COLORS.TEAL }}></div>
                <p style={{ color: COLORS.NAVY, fontWeight: 600 }}>Loading Screen...</p>
              </div>
            }
          >
            <ScreenRouter currentScreen={currentScreen} />
          </Suspense>
        </main>
      </div>
    </DataProvider>
  );
}

export default function Root(props) {
  return <App {...props} />;
}
