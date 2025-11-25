import React, { createContext, useContext, useState, useEffect } from 'react';

const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export const LayoutProvider = ({ children }) => {
  const [layoutMode, setLayoutMode] = useState(() => {
    return localStorage.getItem('arena-layout-mode') || '2-col';
  });

  useEffect(() => {
    localStorage.setItem('arena-layout-mode', layoutMode);
  }, [layoutMode]);

  const toggleLayoutMode = () => {
    setLayoutMode(prev => prev === '2-col' ? '1-col' : '2-col');
  };

  const value = {
    layoutMode,
    setLayoutMode,
    toggleLayoutMode
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
