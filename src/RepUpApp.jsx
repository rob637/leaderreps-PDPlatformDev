// src/RepUpApp.jsx
// Standalone RepUp PWA - Leadership Conditioning + AI Coach
// Shares Firebase backend and services with main LeaderReps app

import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { Loader, Sparkles, Dumbbell, MessageSquare, LogOut } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Shared services and providers
import { ensureUserDocs } from './services/ensureUserDocs.js';
import DataProvider from './providers/DataProvider.jsx';
import { FeatureProvider } from './providers/FeatureProvider.jsx';
import { TimeProvider } from './providers/TimeProvider.jsx';
import { ThemeProvider } from './providers/ThemeProvider.jsx';
import { OfflineProvider } from './components/offline/useOffline.jsx';
import { OfflineBanner } from './components/offline';
import AuthPanel from './components/auth/AuthPanel.jsx';
import ConfigError from './components/system/ConfigError.jsx';
import UpdateNotification from './components/ui/UpdateNotification.jsx';

// RepUp-specific screens (reusing existing components)
import Conditioning from './components/screens/Conditioning.jsx';

// RepUp AI Coach component
import RepUpCoach from './components/rep/RepUpCoach.jsx';

/* =========================================================
   REPUP STANDALONE APP
========================================================= */

function RepUpApp() {
  const [firebaseConfig, setFirebaseConfig] = useState(null);
  const [firebaseServices, setFirebaseServices] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('reps'); // 'reps' or 'coach'

  // Initialize Firebase
  useEffect(() => {
    const config = typeof window.__FIREBASE_CONFIG__ !== 'undefined' 
      ? window.__FIREBASE_CONFIG__ 
      : window.__firebase_config;
    
    if (config && config.apiKey) {
      setFirebaseConfig(config);
      const app = initializeApp(config);
      const auth = getAuth(app);
      const db = getFirestore(app);
      const storage = getStorage(app);
      const functions = getFunctions(app, 'us-central1');
      setLogLevel('error');
      setFirebaseServices({ app, auth, db, storage, functions });
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    if (!firebaseServices) return;
    
    const unsubscribe = onAuthStateChanged(firebaseServices.auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (user) {
        ensureUserDocs(firebaseServices.db, user);
      }
    });
    
    return () => unsubscribe();
  }, [firebaseServices]);

  // Navigate function (simplified for RepUp)
  const navigate = useCallback((screen, params = {}) => {
    // RepUp only has two main views, handled by tabs
    console.log('[RepUp] Navigate:', screen, params);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    if (firebaseServices?.auth) {
      await signOut(firebaseServices.auth);
    }
  };

  // Error state
  if (!firebaseConfig && isAuthReady) {
    return <ConfigError message="Firebase configuration is missing." />;
  }

  // Loading state
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-corporate-navy to-corporate-teal flex flex-col items-center justify-center text-white">
        <Loader className="animate-spin h-10 w-10" />
        <p className="mt-4 font-semibold">RepUp</p>
        <p className="mt-1 text-sm opacity-80">Loading...</p>
      </div>
    );
  }

  // Auth required
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-corporate-navy to-corporate-teal">
        {/* RepUp branding header */}
        <div className="pt-8 pb-4 text-center">
          <div className="inline-flex items-center gap-2 text-white">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-2xl font-bold">RepUp</h1>
          </div>
          <p className="text-white/80 text-sm mt-1">Your Coach in the Pocket</p>
        </div>
        
        {/* Auth Panel */}
        <AuthPanel 
          auth={firebaseServices.auth} 
          db={firebaseServices.db}
          functions={firebaseServices.functions}
          onSuccess={() => {}}
        />
      </div>
    );
  }

  // Main RepUp Experience
  return (
    <ThemeProvider>
      <TimeProvider>
        <OfflineProvider>
          <DataProvider
            firebaseServices={firebaseServices}
            userId={user?.uid}
            isAuthReady={isAuthReady}
            navigate={navigate}
            user={user}
          >
            <FeatureProvider db={firebaseServices?.db}>
              <div className="min-h-screen bg-slate-50 flex flex-col">
                {/* Offline Banner */}
                <OfflineBanner position="top" />
                
                {/* Header */}
                <header className="bg-gradient-to-r from-corporate-navy to-corporate-teal text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    <h1 className="text-lg font-bold">RepUp</h1>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-white/80 hidden sm:block">
                      {user.displayName || user.email}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                      title="Sign out"
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </header>

                {/* Tab Navigation */}
                <nav className="bg-white border-b border-slate-200 flex sticky top-[52px] z-40">
                  <button
                    onClick={() => setActiveTab('reps')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      activeTab === 'reps'
                        ? 'text-corporate-teal border-b-2 border-corporate-teal bg-corporate-teal/5'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <Dumbbell className="w-4 h-4" />
                    <span>Reps</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('coach')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                      activeTab === 'coach'
                        ? 'text-corporate-teal border-b-2 border-corporate-teal bg-corporate-teal/5'
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Coach</span>
                  </button>
                </nav>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto" id="main-content">
                  <AnimatePresence mode="wait">
                    {activeTab === 'reps' && (
                      <motion.div
                        key="reps"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Conditioning embedded={true} showFloatingAction={true} />
                      </motion.div>
                    )}
                    
                    {activeTab === 'coach' && (
                      <motion.div
                        key="coach"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <RepUpCoach userId={user?.uid} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </main>

                {/* PWA Update Notification */}
                <UpdateNotification />
              </div>
            </FeatureProvider>
          </DataProvider>
        </OfflineProvider>
      </TimeProvider>
    </ThemeProvider>
  );
}

export default RepUpApp;
