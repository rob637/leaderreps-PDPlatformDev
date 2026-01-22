import React, { useState, useEffect } from 'react';
import { hasValidSession, clearSession } from './config/accessCode';
import AccessCodeScreen from './screens/AccessCodeScreen';
import DemoShell from './components/DemoShell';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing valid session
    if (hasValidSession()) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleAccessGranted = () => {
    // Session is already created in validateAccessCode
    setIsAuthenticated(true);
  };

  const handleExit = () => {
    clearSession();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-500 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AccessCodeScreen onAccessGranted={handleAccessGranted} />;
  }

  return <DemoShell onExit={handleExit} />;
}

export default App;
