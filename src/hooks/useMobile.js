import { useState, useEffect } from 'react';

/**
 * useMobileDetect - Detect mobile screen size and touch capability
 * 
 * Returns reactive values that update on resize
 */
export const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [hasTouch, setHasTouch] = useState(false);
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setHasTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    hasTouch,
    screenWidth,
  };
};

/**
 * useResponsive - Get responsive breakpoint info
 */
export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState('lg');

  useEffect(() => {
    const getBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) return 'xs';
      if (width < 768) return 'sm';
      if (width < 1024) return 'md';
      if (width < 1280) return 'lg';
      return 'xl';
    };

    const handleResize = () => setBreakpoint(getBreakpoint());
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    isMobileBreakpoint: ['xs', 'sm'].includes(breakpoint),
    isTabletBreakpoint: breakpoint === 'md',
    isDesktopBreakpoint: ['lg', 'xl'].includes(breakpoint),
  };
};

/**
 * useThumbZone - Calculate if element is in thumb-reachable zone
 * 
 * On mobile, the bottom 40% of screen is easiest to reach with thumb
 */
export const useThumbZone = () => {
  const [thumbZoneTop, setThumbZoneTop] = useState(0);

  useEffect(() => {
    const calculateThumbZone = () => {
      // Bottom 40% of viewport is easy thumb zone
      setThumbZoneTop(window.innerHeight * 0.6);
    };

    calculateThumbZone();
    window.addEventListener('resize', calculateThumbZone);
    
    return () => window.removeEventListener('resize', calculateThumbZone);
  }, []);

  return {
    thumbZoneTop,
    isInThumbZone: (elementTop) => elementTop >= thumbZoneTop,
  };
};

/**
 * useOrientation - Detect device orientation
 */
export const useOrientation = () => {
  const [orientation, setOrientation] = useState('portrait');

  useEffect(() => {
    const getOrientation = () => {
      if (window.matchMedia('(orientation: portrait)').matches) {
        return 'portrait';
      }
      return 'landscape';
    };

    const handleChange = () => setOrientation(getOrientation());
    
    handleChange();
    
    // Listen to orientation change
    const mql = window.matchMedia('(orientation: portrait)');
    mql.addEventListener('change', handleChange);
    
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return {
    orientation,
    isPortrait: orientation === 'portrait',
    isLandscape: orientation === 'landscape',
  };
};

/**
 * useSafeArea - Get safe area insets for notched devices
 */
export const useSafeArea = () => {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);
    
    const getInset = (property) => {
      const value = computedStyle.getPropertyValue(property);
      return parseInt(value, 10) || 0;
    };

    setInsets({
      top: getInset('--sat') || parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)'), 10) || 0,
      right: getInset('--sar') || parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)'), 10) || 0,
      bottom: getInset('--sab') || parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)'), 10) || 0,
      left: getInset('--sal') || parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)'), 10) || 0,
    });
  }, []);

  return insets;
};

export default {
  useMobileDetect,
  useResponsive,
  useThumbZone,
  useOrientation,
  useSafeArea,
};
