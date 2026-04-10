import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { SCREENS } from '../config/navigation.js';

const NavigationContext = createContext(null);

export function NavigationProvider({ children, initialScreen }) {
  const [currentScreen, setCurrentScreen] = useState(initialScreen || SCREENS.FEED);
  const [screenParams, setScreenParams] = useState({});
  const [history, setHistory] = useState([]);

  // Use refs so navigate/goBack have stable references
  const currentRef = useRef({ screen: currentScreen, params: screenParams });
  currentRef.current = { screen: currentScreen, params: screenParams };

  const navigate = useCallback((screen, params = {}, { replace = false } = {}) => {
    if (!replace) {
      const cur = currentRef.current;
      setHistory((prev) => [...prev, { screen: cur.screen, params: cur.params }]);
    }
    setCurrentScreen(screen);
    setScreenParams(params);
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const last = newHistory.pop();
      setCurrentScreen(last.screen);
      setScreenParams(last.params);
      return newHistory;
    });
  }, []);

  const value = {
    currentScreen,
    screenParams,
    navigate,
    goBack,
    canGoBack: history.length > 0,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
