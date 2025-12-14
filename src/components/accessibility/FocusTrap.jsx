/**
 * FocusTrap - Traps focus within a container (modals, dialogs)
 */
import React, { useRef, useEffect } from 'react';
import { useFocusTrap } from './useFocusManagement';

const FocusTrap = ({
  children,
  active = true,
  autoFocus = true,
  restoreFocus = true,
  className = '',
  as: Component = 'div',
  onEscape,
  ...props
}) => {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Use focus trap hook
  useFocusTrap(containerRef, active);

  // Store previous focus for restoration
  useEffect(() => {
    if (active && restoreFocus) {
      previousFocusRef.current = document.activeElement;
    }

    return () => {
      if (restoreFocus && previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, restoreFocus]);

  // Handle escape key
  useEffect(() => {
    if (!active || !onEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onEscape(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [active, onEscape]);

  // Auto-focus first focusable element
  useEffect(() => {
    if (!active || !autoFocus || !containerRef.current) return;

    const focusable = containerRef.current.querySelector(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusable) {
      // Small delay to ensure element is rendered
      const timer = setTimeout(() => {
        focusable.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [active, autoFocus]);

  if (!active) {
    return <>{children}</>;
  }

  return (
    <Component
      ref={containerRef}
      className={className}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      {children}
    </Component>
  );
};

export default FocusTrap;
