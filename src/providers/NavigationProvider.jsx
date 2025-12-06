// src/providers/NavigationProvider.jsx
import React, { createContext, useContext, useMemo } from 'react';
import { getBreadcrumbs } from '../config/breadcrumbConfig';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ 
  children, 
  navigate, 
  canGoBack, 
  goBack, 
  currentScreen, 
  navParams 
}) => {
  
  const breadcrumbs = useMemo(() => {
    return getBreadcrumbs(currentScreen, navParams);
  }, [currentScreen, navParams]);

  const value = {
    navigate,
    canGoBack,
    goBack,
    currentScreen,
    navParams,
    breadcrumbs
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

export default NavigationProvider;