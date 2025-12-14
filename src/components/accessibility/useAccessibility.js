/**
 * useAccessibility - Core accessibility hooks and utilities
 */
import { useEffect, useCallback, useState, useRef } from 'react';

/**
 * Detects if user is using keyboard navigation
 */
export const useKeyboardUser = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
};

/**
 * Detects user's motion preferences
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

/**
 * Detects user's color scheme preference
 */
export const useColorScheme = () => {
  const [colorScheme, setColorScheme] = useState('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setColorScheme(mediaQuery.matches ? 'dark' : 'light');

    const handler = (e) => setColorScheme(e.matches ? 'dark' : 'light');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return colorScheme;
};

/**
 * Detects high contrast mode preference
 */
export const useHighContrast = () => {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setPrefersHighContrast(mediaQuery.matches);

    const handler = (e) => setPrefersHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersHighContrast;
};

/**
 * Announces content to screen readers
 */
export const useAnnounce = () => {
  const announce = useCallback((message, priority = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    
    document.body.appendChild(announcer);
    
    // Delay to ensure screen reader picks up the change
    setTimeout(() => {
      announcer.textContent = message;
    }, 100);
    
    // Cleanup after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }, []);

  const announcePolite = useCallback((message) => announce(message, 'polite'), [announce]);
  const announceAssertive = useCallback((message) => announce(message, 'assertive'), [announce]);

  return { announce, announcePolite, announceAssertive };
};

/**
 * Creates a unique ID for accessibility attributes
 */
export const useAccessibleId = (prefix = 'a11y') => {
  const idRef = useRef(`${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return idRef.current;
};

/**
 * Main accessibility hook combining common utilities
 */
const useAccessibility = () => {
  const isKeyboardUser = useKeyboardUser();
  const prefersReducedMotion = useReducedMotion();
  const colorScheme = useColorScheme();
  const prefersHighContrast = useHighContrast();
  const { announce, announcePolite, announceAssertive } = useAnnounce();

  return {
    // User preferences
    isKeyboardUser,
    prefersReducedMotion,
    colorScheme,
    prefersHighContrast,
    
    // Announcement utilities
    announce,
    announcePolite,
    announceAssertive,
    
    // Computed states
    shouldReduceMotion: prefersReducedMotion,
    shouldHighContrast: prefersHighContrast,
    isDarkMode: colorScheme === 'dark',
  };
};

export default useAccessibility;
