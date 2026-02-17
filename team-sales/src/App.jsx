import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import { useThemeStore } from './stores/themeStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import ProspectsPage from './pages/ProspectsPage';
import ApolloSearchPage from './pages/ApolloSearchPage';
import TasksPage from './pages/TasksPage';
import SettingsPage from './pages/SettingsPage';
import InstantlyPushModal from './components/instantly/InstantlyPushModal';
import LinkedHelperPushModal from './components/linkedhelper/LinkedHelperPushModal';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading, isAuthorized } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-teal border-t-transparent"></div>
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/prospects" replace />} />
        <Route path="prospects" element={<ProspectsPage />} />
        <Route path="apollo" element={<ApolloSearchPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Catch-all redirect to prospects */}
        <Route path="*" element={<Navigate to="/prospects" replace />} />
      </Route>
    </Routes>
  );
}

function App() {
  const initAuth = useAuthStore(state => state.initAuth);
  const initTheme = useThemeStore(state => state.initTheme);

  // Initialize auth listener and theme on mount
  useEffect(() => {
    const unsubscribe = initAuth();
    initTheme();
    return () => unsubscribe();
  }, [initAuth, initTheme]);

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#fff',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#47A88D',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      {/* Global Push Modals */}
      <InstantlyPushModal />
      <LinkedHelperPushModal />
    </>
  );
}

export default App;
