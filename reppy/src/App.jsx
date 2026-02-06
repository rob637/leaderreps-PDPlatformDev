import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, logEvent } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';

import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import SessionScreen from './screens/SessionScreen';
import ProgressScreen from './screens/ProgressScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';
import CommunityScreen from './screens/CommunityScreen';
import JournalScreen from './screens/JournalScreen';
import Layout from './components/Layout';

// Auth Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Progress Context
const ProgressContext = createContext(null);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used within ProgressProvider');
  return context;
};

// Re-export useTheme for convenience
export { useTheme } from './contexts/ThemeContext';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Load progress data
        await loadProgress(firebaseUser.uid);
      } else {
        setProgress(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Load progress from Firestore
  const loadProgress = async (userId) => {
    try {
      const progressRef = doc(db, 'reppy_users', userId);
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        setProgress(progressDoc.data());
      } else {
        // Initialize new user
        const initialProgress = {
          currentSession: 1,
          completedSessions: [],
          onboardingComplete: false,
          profile: {},
          streakCount: 0,
          lastSessionDate: null,
          totalMinutes: 0,
          dailyTouchpoints: {}, // { '2024-01-15': { morning: {...}, growth: {...}, evening: {...} } }
          totalMorningSessions: 0,
          totalEveningSessions: 0,
          createdAt: new Date().toISOString(),
        };
        await setDoc(progressRef, initialProgress);
        setProgress(initialProgress);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  // Update progress
  const updateProgress = async (updates) => {
    if (!user) return;
    
    try {
      const progressRef = doc(db, 'reppy_users', user.uid);
      const newProgress = { ...progress, ...updates };
      await setDoc(progressRef, newProgress, { merge: true });
      setProgress(newProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  // Complete a session
  const completeSession = async (sessionNumber, data = {}) => {
    if (!user) return;
    
    const now = new Date();
    const lastDate = progress?.lastSessionDate ? new Date(progress.lastSessionDate) : null;
    const isConsecutiveDay = lastDate && 
      now.toDateString() !== lastDate.toDateString() &&
      (now - lastDate) < 48 * 60 * 60 * 1000; // Within 48 hours
    
    const updates = {
      currentSession: sessionNumber + 1,
      completedSessions: [...(progress?.completedSessions || []), {
        session: sessionNumber,
        completedAt: now.toISOString(),
        ...data,
      }],
      lastSessionDate: now.toISOString(),
      streakCount: isConsecutiveDay ? (progress?.streakCount || 0) + 1 : 1,
      totalMinutes: (progress?.totalMinutes || 0) + (data.duration || 5),
    };
    
    // Log analytics event
    logEvent('session_complete', {
      session_number: sessionNumber,
      session_type: data.touchpointType || 'growth',
      streak_count: updates.streakCount,
    });
    
    await updateProgress(updates);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 md:flex md:items-start md:justify-center md:py-4">
        <div className="min-h-screen md:min-h-0 md:h-[calc(100vh-2rem)] md:w-[430px] md:rounded-3xl md:shadow-2xl gradient-focus flex items-center justify-center overflow-hidden">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden animate-pulse-soft">
              <img 
                src="/reppy-icon-192.png" 
                alt="Reppy" 
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-white/60 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <AuthContext.Provider value={{ user, loading }}>
        <ProgressContext.Provider value={{ progress, updateProgress, completeSession, loadProgress }}>
          <ThemeProvider preference={progress?.settings?.theme || 'auto'}>
            <OfflineBanner />
            <AppContent progress={progress} user={user} />
          </ThemeProvider>
        </ProgressContext.Provider>
      </AuthContext.Provider>
    </ErrorBoundary>
  );
}

// Separate component to access theme context
function AppContent({ progress, user }) {
  const { activeTheme } = useTheme();
  
  return (
    <BrowserRouter>
      {/* Desktop: centered mobile-width container with shadow */}
      <div className={`min-h-screen md:flex md:items-start md:justify-center md:py-4 ${
        activeTheme === 'light' ? 'bg-slate-200' : 'bg-slate-900'
      }`}>
        <div className={`min-h-screen md:min-h-0 md:h-[calc(100vh-2rem)] md:w-[430px] md:rounded-3xl md:shadow-2xl md:overflow-hidden md:border ${
          activeTheme === 'light' ? 'md:border-black/10' : 'md:border-white/10'
        }`}>
          <div className="h-full md:overflow-y-auto">
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={
                user ? <Navigate to="/" replace /> : <AuthScreen />
              } />
              
              {/* Full screen routes (no nav) */}
              <Route path="/onboarding" element={
                !user ? <Navigate to="/auth" replace /> :
                progress?.onboardingComplete ? <Navigate to="/" replace /> :
                <OnboardingScreen />
              } />
              
              <Route path="/session" element={
                !user ? <Navigate to="/auth" replace /> :
                !progress?.onboardingComplete ? <Navigate to="/onboarding" replace /> :
                <SessionScreen />
              } />

              {/* Protected routes with Navigation */}
              <Route element={<Layout />}>
                <Route path="/" element={
                  !user ? <Navigate to="/auth" replace /> :
                  !progress?.onboardingComplete ? <Navigate to="/onboarding" replace /> :
                  <HomeScreen />
                } />
                
                <Route path="/progress" element={
                  !user ? <Navigate to="/auth" replace /> :
                  !progress?.onboardingComplete ? <Navigate to="/onboarding" replace /> :
                  <ProgressScreen />
                } />
                
                <Route path="/profile" element={
                  !user ? <Navigate to="/auth" replace /> :
                  !progress?.onboardingComplete ? <Navigate to="/onboarding" replace /> :
                  <ProfileScreen />
                } />
                
                <Route path="/community" element={
                  !user ? <Navigate to="/auth" replace /> :
                  !progress?.onboardingComplete ? <Navigate to="/onboarding" replace /> :
                  <CommunityScreen />
                } />
                
                <Route path="/journal" element={
                  !user ? <Navigate to="/auth" replace /> :
                  !progress?.onboardingComplete ? <Navigate to="/onboarding" replace /> :
                  <JournalScreen />
                } />
                
                <Route path="/admin" element={
                  !user ? <Navigate to="/auth" replace /> :
                  !progress?.onboardingComplete ? <Navigate to="/onboarding" replace /> :
                  <AdminScreen />
                } />
              </Route>
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
