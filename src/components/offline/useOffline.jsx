/**
 * useOffline - Offline state management hook and context
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const OfflineContext = createContext(null);

/**
 * useOnlineStatus - Raw online/offline detection
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * OfflineProvider - Provides offline context to the app
 */
export const OfflineProvider = ({ children }) => {
  const isOnline = useOnlineStatus();
  const [pendingActions, setPendingActions] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle' | 'syncing' | 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncInProgress = useRef(false);

  // Load pending actions from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('offlinePendingActions');
      if (stored) {
        setPendingActions(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load pending actions:', e);
    }
  }, []);

  // Save pending actions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('offlinePendingActions', JSON.stringify(pendingActions));
    } catch (e) {
      console.error('Failed to save pending actions:', e);
    }
  }, [pendingActions]);

  // Queue an action for when online
  const queueAction = useCallback((action) => {
    const newAction = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      ...action,
    };
    setPendingActions(prev => [...prev, newAction]);
    return newAction.id;
  }, []);

  // Remove an action from queue
  const removeAction = useCallback((actionId) => {
    setPendingActions(prev => prev.filter(a => a.id !== actionId));
  }, []);

  // Process pending actions when coming online
  const syncPendingActions = useCallback(async (processAction) => {
    if (syncInProgress.current || pendingActions.length === 0) return;
    
    syncInProgress.current = true;
    setSyncStatus('syncing');

    const results = [];
    for (const action of pendingActions) {
      try {
        await processAction(action);
        results.push({ id: action.id, success: true });
      } catch (error) {
        results.push({ id: action.id, success: false, error });
      }
    }

    // Remove successful actions
    const successIds = results.filter(r => r.success).map(r => r.id);
    setPendingActions(prev => prev.filter(a => !successIds.includes(a.id)));

    syncInProgress.current = false;
    setSyncStatus(results.some(r => !r.success) ? 'error' : 'idle');
    setLastSyncTime(Date.now());

    return results;
  }, [pendingActions]);

  // Clear all pending actions
  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
    setSyncStatus('idle');
  }, []);

  const value = {
    isOnline,
    isOffline: !isOnline,
    pendingActions,
    pendingCount: pendingActions.length,
    hasPendingActions: pendingActions.length > 0,
    syncStatus,
    lastSyncTime,
    queueAction,
    removeAction,
    syncPendingActions,
    clearPendingActions,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

/**
 * useOffline - Hook to access offline context
 */
const useOffline = () => {
  const context = useContext(OfflineContext);
  const isOnlineFallback = useOnlineStatus();
  
  // If used outside provider, return basic online status
  if (!context) {
    return {
      isOnline: isOnlineFallback,
      isOffline: !isOnlineFallback,
      pendingActions: [],
      pendingCount: 0,
      hasPendingActions: false,
      syncStatus: 'idle',
      lastSyncTime: null,
      queueAction: () => {},
      removeAction: () => {},
      syncPendingActions: async () => [],
      clearPendingActions: () => {},
    };
  }
  
  return context;
};

export default useOffline;
