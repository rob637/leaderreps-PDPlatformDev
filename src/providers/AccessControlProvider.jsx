import React, { createContext, useContext } from 'react';
import { useDayBasedAccessControl } from '../hooks/useDayBasedAccessControl';

const AccessControlContext = createContext(null);

/**
 * AccessControlProvider - Day-by-Day Architecture
 * Provides day-based access control for all zones:
 * - Content Library
 * - Community
 * - Coaching
 * - Dashboard Widgets
 * - Locker
 * 
 * Also implements the Prep Gate to ensure users complete
 * Leader Profile and Baseline Assessment before Day 1.
 */
export const AccessControlProvider = ({ children }) => {
  const accessControl = useDayBasedAccessControl();

  return (
    <AccessControlContext.Provider value={accessControl}>
      {children}
    </AccessControlContext.Provider>
  );
};

export const useAccessControlContext = () => {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error('useAccessControlContext must be used within an AccessControlProvider');
  }
  return context;
};
