/**
 * useKeyboardNav - Keyboard navigation utilities
 */
import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook for escape key handler (closing modals, dropdowns, etc.)
 */
export const useEscapeKey = (handler, isActive = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handler(e);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [handler, isActive]);
};

/**
 * Hook for enter key handler
 */
export const useEnterKey = (handler, isActive = true) => {
  useEffect(() => {
    if (!isActive) return;

    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        handler(e);
      }
    };

    document.addEventListener('keydown', handleEnter);
    return () => document.removeEventListener('keydown', handleEnter);
  }, [handler, isActive]);
};

/**
 * Hook for custom keyboard shortcuts
 */
export const useKeyboardShortcut = (keys, handler, options = {}) => {
  const {
    isActive = true,
    preventDefault = true,
    target = document,
  } = options;

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      const normalizedKeys = Array.isArray(keys) ? keys : [keys];
      
      const pressedKey = e.key.toLowerCase();
      const hasCtrl = e.ctrlKey || e.metaKey;
      const hasShift = e.shiftKey;
      const hasAlt = e.altKey;

      const matchesShortcut = normalizedKeys.some(shortcut => {
        const parts = shortcut.toLowerCase().split('+');
        const mainKey = parts[parts.length - 1];
        const needsCtrl = parts.includes('ctrl') || parts.includes('cmd');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');

        return (
          pressedKey === mainKey &&
          hasCtrl === needsCtrl &&
          hasShift === needsShift &&
          hasAlt === needsAlt
        );
      });

      if (matchesShortcut) {
        if (preventDefault) {
          e.preventDefault();
        }
        handler(e);
      }
    };

    target.addEventListener('keydown', handleKeyDown);
    return () => target.removeEventListener('keydown', handleKeyDown);
  }, [keys, handler, isActive, preventDefault, target]);
};

/**
 * Arrow key navigation for menus and lists
 */
export const useArrowKeyNavigation = (itemCount, options = {}) => {
  const {
    initialIndex = 0,
    loop = true,
    orientation = 'vertical',
    onSelect,
    isActive = true,
  } = options;

  const currentIndexRef = useRef(initialIndex);

  const handleKeyDown = useCallback((e) => {
    if (!isActive) return;

    let nextIndex = currentIndexRef.current;
    const maxIndex = itemCount - 1;

    const upKeys = orientation === 'horizontal' ? ['ArrowLeft'] : ['ArrowUp'];
    const downKeys = orientation === 'horizontal' ? ['ArrowRight'] : ['ArrowDown'];

    if (upKeys.includes(e.key)) {
      e.preventDefault();
      nextIndex = currentIndexRef.current - 1;
      if (nextIndex < 0) nextIndex = loop ? maxIndex : 0;
    } else if (downKeys.includes(e.key)) {
      e.preventDefault();
      nextIndex = currentIndexRef.current + 1;
      if (nextIndex > maxIndex) nextIndex = loop ? 0 : maxIndex;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = maxIndex;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(currentIndexRef.current);
      return;
    }

    if (nextIndex !== currentIndexRef.current) {
      currentIndexRef.current = nextIndex;
    }

    return nextIndex;
  }, [itemCount, loop, orientation, onSelect, isActive]);

  return {
    handleKeyDown,
    currentIndex: currentIndexRef.current,
    setCurrentIndex: (index) => { currentIndexRef.current = index; },
  };
};

/**
 * Tab panel navigation
 */
export const useTabNavigation = (tabCount, options = {}) => {
  const { 
    onTabChange, 
    initialTab = 0,
    orientation = 'horizontal',
  } = options;

  const activeTabRef = useRef(initialTab);

  const handleKeyDown = useCallback((e, currentTab) => {
    let newTab = currentTab;

    const prevKey = orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';

    switch (e.key) {
      case prevKey:
        e.preventDefault();
        newTab = currentTab - 1;
        if (newTab < 0) newTab = tabCount - 1;
        break;
      case nextKey:
        e.preventDefault();
        newTab = currentTab + 1;
        if (newTab >= tabCount) newTab = 0;
        break;
      case 'Home':
        e.preventDefault();
        newTab = 0;
        break;
      case 'End':
        e.preventDefault();
        newTab = tabCount - 1;
        break;
      default:
        return;
    }

    if (newTab !== currentTab) {
      activeTabRef.current = newTab;
      onTabChange?.(newTab);
    }
  }, [tabCount, onTabChange, orientation]);

  // Get ARIA props for tab
  const getTabProps = useCallback((index, id) => ({
    role: 'tab',
    id: `tab-${id}-${index}`,
    'aria-selected': index === activeTabRef.current,
    'aria-controls': `tabpanel-${id}-${index}`,
    tabIndex: index === activeTabRef.current ? 0 : -1,
    onKeyDown: (e) => handleKeyDown(e, index),
  }), [handleKeyDown]);

  // Get ARIA props for tab panel
  const getTabPanelProps = useCallback((index, id) => ({
    role: 'tabpanel',
    id: `tabpanel-${id}-${index}`,
    'aria-labelledby': `tab-${id}-${index}`,
    tabIndex: 0,
    hidden: index !== activeTabRef.current,
  }), []);

  return {
    activeTab: activeTabRef.current,
    setActiveTab: (index) => { activeTabRef.current = index; },
    getTabProps,
    getTabPanelProps,
    handleKeyDown,
  };
};

/**
 * Main keyboard navigation hook
 */
const useKeyboardNav = (options = {}) => {
  const { onEscape, onEnter, shortcuts = {} } = options;

  // Setup escape handler
  useEscapeKey(onEscape, !!onEscape);

  // Setup enter handler  
  useEnterKey(onEnter, !!onEnter);

  // Setup custom shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      Object.entries(shortcuts).forEach(([key, handler]) => {
        const parts = key.toLowerCase().split('+');
        const mainKey = parts[parts.length - 1];
        const needsCtrl = parts.includes('ctrl') || parts.includes('cmd');
        const needsShift = parts.includes('shift');
        const needsAlt = parts.includes('alt');

        const pressedKey = e.key.toLowerCase();
        const hasCtrl = e.ctrlKey || e.metaKey;
        const hasShift = e.shiftKey;
        const hasAlt = e.altKey;

        if (
          pressedKey === mainKey &&
          hasCtrl === needsCtrl &&
          hasShift === needsShift &&
          hasAlt === needsAlt
        ) {
          e.preventDefault();
          handler(e);
        }
      });
    };

    if (Object.keys(shortcuts).length > 0) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [shortcuts]);

  return {
    useEscapeKey,
    useEnterKey,
    useKeyboardShortcut,
    useArrowKeyNavigation,
    useTabNavigation,
  };
};

export default useKeyboardNav;
