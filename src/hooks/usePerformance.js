import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * usePerformance - Performance monitoring utilities for mobile optimization
 */

/**
 * useRenderCount - Track component render counts (dev only)
 */
export const useRenderCount = (componentName) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Perf] ${componentName} rendered ${renderCount.current} times`);
    }
  });
  
  return renderCount.current;
};

/**
 * useDebounce - Debounce a value for performance
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useThrottle - Throttle a callback for scroll/resize handlers
 */
export const useThrottle = (callback, delay = 100) => {
  const lastCall = useRef(0);
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall.current;

    if (timeSinceLastCall >= delay) {
      lastCall.current = now;
      callback(...args);
    } else {
      // Schedule for later if not called yet
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        lastCall.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastCall);
    }
  }, [callback, delay]);
};

/**
 * useIntersectionObserver - Lazy load content when visible
 */
export const useIntersectionObserver = (options = {}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once visible, stop observing
          observer.unobserve(element);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return [elementRef, isVisible];
};

/**
 * useNetworkStatus - Monitor network conditions for adaptive loading
 */
export const useNetworkStatus = () => {
  const [status, setStatus] = useState({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    effectiveType: '4g',
    saveData: false,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      setStatus({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType || '4g',
        saveData: connection?.saveData || false,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      });
    };

    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return status;
};

/**
 * usePrefetch - Prefetch screen data on hover/focus
 */
export const usePrefetch = (screenId) => {
  const prefetched = useRef(new Set());

  const prefetch = useCallback(() => {
    if (prefetched.current.has(screenId)) return;
    
    // Mark as prefetched
    prefetched.current.add(screenId);
    
    // Dynamically import the screen module
    // This warms up the browser cache
    const screenImports = {
      'dashboard': () => import('../components/screens/Dashboard.jsx'),
      'library': () => import('../components/screens/Library.jsx'),
      'locker': () => import('../components/screens/Locker.jsx'),
      'coaching-hub': () => import('../components/screens/CoachingHub.jsx'),
      'community': () => import('../components/screens/CommunityScreen.jsx'),
    };

    const importFn = screenImports[screenId];
    if (importFn) {
      importFn().catch(() => {
        // Silent fail - just a prefetch attempt
      });
    }
  }, [screenId]);

  return { prefetch };
};

/**
 * useReducedMotion - Respect user's motion preferences
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event) => setPrefersReducedMotion(event.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

/**
 * useMemoryPressure - Detect memory pressure for cleanup
 */
export const useMemoryPressure = (onPressure) => {
  useEffect(() => {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = performance.memory;
        const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usedRatio > 0.9) {
          onPressure?.('critical');
        } else if (usedRatio > 0.7) {
          onPressure?.('warning');
        }
      };

      const interval = setInterval(checkMemory, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [onPressure]);
};

export default {
  useRenderCount,
  useDebounce,
  useThrottle,
  useIntersectionObserver,
  useNetworkStatus,
  usePrefetch,
  useReducedMotion,
  useMemoryPressure,
};
