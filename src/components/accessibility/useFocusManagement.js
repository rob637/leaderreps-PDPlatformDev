/**
 * useFocusManagement - Focus management utilities for accessibility
 */
import { useEffect, useCallback, useRef } from 'react';

/**
 * Trap focus within a container (useful for modals, dialogs)
 */
export const useFocusTrap = (containerRef, isActive = true) => {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isActive || !containerRef?.current) return;

    // Store previous focus
    previousFocusRef.current = document.activeElement;

    // Get focusable elements
    const getFocusableElements = () => {
      const container = containerRef.current;
      if (!container) return [];
      
      return Array.from(container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(el => !el.disabled && el.offsetParent !== null);
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle tab key
    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore previous focus
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [containerRef, isActive]);
};

/**
 * Auto-focus an element on mount
 */
export const useAutoFocus = (ref, shouldFocus = true) => {
  useEffect(() => {
    if (shouldFocus && ref?.current) {
      // Small delay to ensure element is rendered
      const timer = setTimeout(() => {
        ref.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [ref, shouldFocus]);
};

/**
 * Focus first error in a form
 */
export const useFocusError = (errors, containerRef) => {
  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) return;
    if (!containerRef?.current) return;

    const firstErrorKey = Object.keys(errors)[0];
    const errorElement = containerRef.current.querySelector(
      `[name="${firstErrorKey}"], #${firstErrorKey}`
    );
    
    if (errorElement) {
      errorElement.focus();
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [errors, containerRef]);
};

/**
 * Roving tabindex for keyboard navigation in lists
 */
export const useRovingTabindex = (items, options = {}) => {
  const { 
    orientation = 'vertical', // 'vertical' | 'horizontal' | 'both'
    loop = true,
    initialIndex = 0 
  } = options;
  
  const currentIndexRef = useRef(initialIndex);
  const itemRefs = useRef([]);

  // Set refs for items
  const setItemRef = useCallback((index) => (el) => {
    itemRefs.current[index] = el;
  }, []);

  // Get tabindex for an item
  const getTabIndex = useCallback((index) => {
    return index === currentIndexRef.current ? 0 : -1;
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e, index) => {
    let nextIndex = index;
    const maxIndex = items.length - 1;

    const prevKeys = orientation === 'horizontal' 
      ? ['ArrowLeft'] 
      : orientation === 'vertical' 
        ? ['ArrowUp'] 
        : ['ArrowLeft', 'ArrowUp'];

    const nextKeys = orientation === 'horizontal' 
      ? ['ArrowRight'] 
      : orientation === 'vertical' 
        ? ['ArrowDown'] 
        : ['ArrowRight', 'ArrowDown'];

    if (prevKeys.includes(e.key)) {
      e.preventDefault();
      nextIndex = index - 1;
      if (nextIndex < 0) {
        nextIndex = loop ? maxIndex : 0;
      }
    } else if (nextKeys.includes(e.key)) {
      e.preventDefault();
      nextIndex = index + 1;
      if (nextIndex > maxIndex) {
        nextIndex = loop ? 0 : maxIndex;
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = maxIndex;
    }

    if (nextIndex !== index) {
      currentIndexRef.current = nextIndex;
      itemRefs.current[nextIndex]?.focus();
    }
  }, [items.length, orientation, loop]);

  // Get props for each item
  const getItemProps = useCallback((index) => ({
    ref: setItemRef(index),
    tabIndex: getTabIndex(index),
    onKeyDown: (e) => handleKeyDown(e, index),
  }), [setItemRef, getTabIndex, handleKeyDown]);

  return {
    getItemProps,
    currentIndex: currentIndexRef.current,
    focusItem: (index) => {
      currentIndexRef.current = index;
      itemRefs.current[index]?.focus();
    },
  };
};

/**
 * Focus restoration when component unmounts
 */
export const useFocusRestore = () => {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;

    return () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, []);

  return {
    restoreFocus: () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    },
    previousElement: previousFocusRef.current,
  };
};

/**
 * Main focus management hook
 */
const useFocusManagement = (containerRef) => {
  const { restoreFocus } = useFocusRestore();

  const focusFirst = useCallback(() => {
    if (!containerRef?.current) return;
    
    const focusable = containerRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [containerRef]);

  const focusLast = useCallback(() => {
    if (!containerRef?.current) return;
    
    const focusables = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length > 0) {
      focusables[focusables.length - 1].focus();
    }
  }, [containerRef]);

  const focusById = useCallback((id) => {
    const element = document.getElementById(id);
    element?.focus();
  }, []);

  return {
    focusFirst,
    focusLast,
    focusById,
    restoreFocus,
  };
};

export default useFocusManagement;
