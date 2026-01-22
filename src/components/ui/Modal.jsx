import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

// --- Modal Overlay ---
const ModalOverlay = React.forwardRef(({ className, onClick, ...props }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className={cn(
      'fixed inset-0 z-50 bg-corporate-navy/40 backdrop-blur-md',
      'animate-in fade-in-0',
      className
    )}
    aria-hidden="true"
    {...props}
  />
));
ModalOverlay.displayName = 'ModalOverlay';

// --- Modal Content with Focus Trap ---
const ModalContent = React.forwardRef(({ className, children, onClose, ...props }, ref) => {
  const innerRef = useRef(null);
  const resolvedRef = ref || innerRef;
  const previousFocusRef = useRef(null);
  
  // Store previous focus and restore on unmount
  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    
    return () => {
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus();
      }
    };
  }, []);
  
  // Scroll to top when modal content mounts
  useEffect(() => {
    if (resolvedRef.current) {
      resolvedRef.current.scrollTop = 0;
    }
  }, []);
  
  // Focus trap logic
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
      return;
    }
    
    if (e.key !== 'Tab' || !resolvedRef.current) return;
    
    const focusableElements = resolvedRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, [onClose]);
  
  // Auto-focus first focusable element
  useEffect(() => {
    if (!resolvedRef.current) return;
    
    const timer = setTimeout(() => {
      const focusable = resolvedRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div
      ref={resolvedRef}
      role="dialog"
      aria-modal="true"
      onKeyDown={handleKeyDown}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'w-full max-w-lg max-h-[90vh] overflow-y-auto',
        'bg-white rounded-2xl shadow-2xl border border-slate-100',
        'animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]',
        className
      )}
      style={{ fontFamily: 'var(--font-body)' }}
      {...props}
    >
      {children}
    </div>
  );
});
ModalContent.displayName = 'ModalContent';

// --- Modal Header ---
const ModalHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-2 p-6 pb-5 border-b border-slate-100',
      className
    )}
    {...props}
  />
));
ModalHeader.displayName = 'ModalHeader';

// --- Modal Title ---
const ModalTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-none tracking-tight text-corporate-navy',
      className
    )}
    style={{ fontFamily: 'var(--font-heading)' }}
    {...props}
  />
));
ModalTitle.displayName = 'ModalTitle';

// --- Modal Body ---
const ModalBody = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('p-6', className)}
    {...props}
  />
));
ModalBody.displayName = 'ModalBody';

// --- Modal Footer ---
const ModalFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-3 p-6 pt-5 border-t border-slate-100 bg-slate-50/50',
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = 'ModalFooter';

// --- Modal Close Button ---
const ModalClose = React.forwardRef(({ className, onClick, ...props }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    aria-label="Close modal"
    className={cn(
      'absolute right-3 top-3 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center',
      'rounded-xl text-slate-400 transition-all duration-200 touch-manipulation',
      'hover:text-slate-600 hover:bg-slate-100',
      'active:scale-95',
      'focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2',
      className
    )}
    {...props}
  >
    <X className="h-5 w-5" aria-hidden="true" />
    <span className="sr-only">Close</span>
  </button>
));
ModalClose.displayName = 'ModalClose';

// --- Main Modal Component ---
const Modal = ({ isOpen, onClose, children, className, ariaLabel, ariaDescribedBy }) => {
  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay onClick={onClose} />
      <ModalContent 
        className={className} 
        onClose={onClose}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        <ModalClose onClick={onClose} />
        {children}
      </ModalContent>
    </>
  );
};

Modal.displayName = 'Modal';

export { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalTitle, 
  ModalBody, 
  ModalFooter, 
  ModalClose 
};
