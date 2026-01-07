import React, { useEffect, useRef } from 'react';
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
    {...props}
  />
));
ModalOverlay.displayName = 'ModalOverlay';

// --- Modal Content ---
const ModalContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const innerRef = useRef(null);
  const resolvedRef = ref || innerRef;
  
  // Scroll to top when modal content mounts
  useEffect(() => {
    if (resolvedRef.current) {
      resolvedRef.current.scrollTop = 0;
    }
  }, []);
  
  return (
    <div
      ref={resolvedRef}
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
    className={cn(
      'absolute right-3 top-3 p-2 min-h-[40px] min-w-[40px] flex items-center justify-center',
      'rounded-xl text-slate-400 transition-all duration-200 touch-manipulation',
      'hover:text-slate-600 hover:bg-slate-100',
      'active:scale-95',
      'focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2',
      className
    )}
    {...props}
  >
    <X className="h-5 w-5" />
    <span className="sr-only">Close</span>
  </button>
));
ModalClose.displayName = 'ModalClose';

// --- Main Modal Component ---
const Modal = ({ isOpen, onClose, children, className }) => {
  if (!isOpen) return null;

  return (
    <>
      <ModalOverlay onClick={onClose} />
      <ModalContent className={className}>
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
