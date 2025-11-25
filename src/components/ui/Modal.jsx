import React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';

// --- Modal Overlay ---
const ModalOverlay = React.forwardRef(({ className, onClick, ...props }, ref) => (
  <div
    ref={ref}
    onClick={onClick}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'animate-in fade-in-0',
      className
    )}
    {...props}
  />
));
ModalOverlay.displayName = 'ModalOverlay';

// --- Modal Content ---
const ModalContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
      'w-full max-w-lg max-h-[90vh] overflow-y-auto',
      'bg-white rounded-2xl shadow-xl',
      'animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%]',
      className
    )}
    {...props}
  >
    {children}
  </div>
));
ModalContent.displayName = 'ModalContent';

// --- Modal Header ---
const ModalHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-1.5 p-6 pb-4 border-b border-slate-200',
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
      'text-xl font-bold leading-none tracking-tight text-corporate-navy',
      className
    )}
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
      'flex items-center justify-end gap-3 p-6 pt-4 border-t border-slate-200',
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
      'absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity',
      'hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2',
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
