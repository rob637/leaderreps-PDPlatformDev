// src/services/useAppServices.jsx
import React, { createContext, useContext } from 'react';

const AppServicesContext = createContext(null);

export function AppServicesProvider({ value, children }) {
  return (
    <AppServicesContext.Provider value={value}>
      {children}
    </AppServicesContext.Provider>
  );
}

export function useAppServices() {
  const ctx = useContext(AppServicesContext);
  if (!ctx) {
    throw new Error('useAppServices must be used within <AppServicesProvider>');
  }
  return ctx;
}
