import React, { createContext, useContext } from 'react';
import { useAccessControl } from '../hooks/useAccessControl';

const AccessControlContext = createContext(null);

export const AccessControlProvider = ({ children }) => {
  const accessControl = useAccessControl();

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
