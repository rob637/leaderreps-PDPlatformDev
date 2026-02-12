// src/components/conditioning/ConditioningModal.jsx
// Unified modal wrapper for all conditioning layer modals
// Enforces consistent: navy gradient header, white close X, numbered steps,
// gray footer, focus trap, ESC handling, corporate color palette

import React from 'react';
import { cn } from '../../lib/utils';
import { X, Check } from 'lucide-react';

// ============================================
// MODAL OVERLAY — backdrop with blur
// ============================================
const Overlay = ({ onClick }) => (
  <div
    onClick={onClick}
    className="fixed inset-0 z-50 bg-corporate-navy/40 backdrop-blur-sm animate-in fade-in-0"
    aria-hidden="true"
  />
);

// ============================================
// STEP INDICATOR — numbered circles with green checks
// ============================================
export const StepIndicator = ({ currentStep, totalSteps, stepLabels = [] }) => {
  if (totalSteps <= 1) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center justify-center">
        {Array.from({ length: totalSteps }, (_, idx) => (
          <React.Fragment key={idx}>
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                idx === currentStep
                  ? 'bg-white text-corporate-navy shadow-sm'
                  : idx < currentStep
                  ? 'bg-corporate-teal text-white'
                  : 'bg-white/20 text-white/70'
              )}
            >
              {idx < currentStep ? <Check className="w-3.5 h-3.5" /> : idx + 1}
            </div>
            {idx < totalSteps - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-1 transition-colors',
                  idx < currentStep ? 'bg-corporate-teal' : 'bg-white/20'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      {stepLabels[currentStep] && (
        <div className="text-center text-xs text-white/80 mt-1.5 font-medium">
          {stepLabels[currentStep]}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN CONDITIONING MODAL
// ============================================
const ConditioningModal = ({
  isOpen,
  onClose,
  title,
  icon: Icon,
  subtitle,
  // Optional step indicator
  currentStep,
  totalSteps = 0,
  stepLabels = [],
  // Content slots
  children,
  footer,
  // Context bar (shown below header, e.g., rep person/type)
  contextBar,
  // Sizing
  className,
  maxWidth = 'max-w-lg',
}) => {
  if (!isOpen) return null;

  // Handle ESC key
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose?.();
    }
  };

  return (
    <>
      <Overlay onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-h-[90vh] overflow-hidden flex flex-col',
          'bg-white rounded-2xl shadow-2xl border border-slate-100',
          maxWidth,
          className
        )}
      >
        {/* ====== HEADER — Navy gradient, always consistent ====== */}
        <div className="p-5 pb-4 bg-gradient-to-r from-corporate-navy to-corporate-navy/90 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {Icon && <Icon className="w-5 h-5 text-white/90" />}
              <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 -mr-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle */}
          {subtitle && (
            <div className="mt-1 text-sm text-white/70">{subtitle}</div>
          )}

          {/* Step Indicator */}
          {totalSteps > 1 && (
            <StepIndicator
              currentStep={currentStep}
              totalSteps={totalSteps}
              stepLabels={stepLabels}
            />
          )}
        </div>

        {/* ====== CONTEXT BAR — optional gray bar below header ====== */}
        {contextBar && (
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
            {contextBar}
          </div>
        )}

        {/* ====== BODY — scrollable content ====== */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>

        {/* ====== FOOTER — consistent gray bar ====== */}
        {footer && (
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default ConditioningModal;
