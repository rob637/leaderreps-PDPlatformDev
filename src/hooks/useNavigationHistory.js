// src/hooks/useNavigationHistory.js
import { useState, useEffect, useCallback } from 'react';

const useNavigationHistory = () => {
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isHandlingPopState, setIsHandlingPopState] = useState(false);

  // Push a new navigation state
  const pushNavigationState = useCallback((state) => {
    if (isHandlingPopState) return; // Don't add history during back/forward navigation

    setNavigationHistory(prev => {
      // Remove any forward history if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(state);
      
      // Update current index
      setCurrentIndex(newHistory.length - 1);
      
      // Push state to browser history to enable back/forward buttons
      window.history.pushState({ internalNav: true, index: newHistory.length - 1 }, '', window.location.href);
      
      return newHistory;
    });
  }, [currentIndex, isHandlingPopState]);

  // Handle browser back/forward events
  useEffect(() => {
    const handlePopState = (event) => {
      setIsHandlingPopState(true);
      
      if (event.state && event.state.internalNav) {
        // This is our internal navigation
        const targetIndex = event.state.index;
        setCurrentIndex(targetIndex);
      } else if (navigationHistory.length > 0) {
        // Browser navigation without our state - go back in our history
        const newIndex = Math.max(0, currentIndex - 1);
        setCurrentIndex(newIndex);
      }
      
      // Reset flag after a short delay
      setTimeout(() => setIsHandlingPopState(false), 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigationHistory.length, currentIndex]);

  // Get current navigation state
  const getCurrentState = useCallback(() => {
    return navigationHistory[currentIndex] || null;
  }, [navigationHistory, currentIndex]);

  // Check if we can go back
  const canGoBack = currentIndex > 0;
  
  // Check if we can go forward
  const canGoForward = currentIndex < navigationHistory.length - 1;

  // Manual back navigation (for internal back buttons)
  const goBack = useCallback(() => {
    if (canGoBack) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      window.history.back();
    }
  }, [canGoBack, currentIndex]);

  // Manual forward navigation (for internal forward buttons)
  const goForward = useCallback(() => {
    if (canGoForward) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      window.history.forward();
    }
  }, [canGoForward, currentIndex]);

  // Replace current state (for updates without adding to history)
  const replaceNavigationState = useCallback((state) => {
    if (currentIndex >= 0) {
      setNavigationHistory(prev => {
        const newHistory = [...prev];
        newHistory[currentIndex] = state;
        return newHistory;
      });
      
      window.history.replaceState(
        { internalNav: true, index: currentIndex }, 
        '', 
        window.location.href
      );
    }
  }, [currentIndex]);

  // Clear history (useful for logout or major navigation changes)
  const clearHistory = useCallback(() => {
    setNavigationHistory([]);
    setCurrentIndex(-1);
  }, []);

  return {
    pushNavigationState,
    replaceNavigationState,
    getCurrentState,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
    clearHistory,
    currentIndex,
    historyLength: navigationHistory.length
  };
};

export default useNavigationHistory;