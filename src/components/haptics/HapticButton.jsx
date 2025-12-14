/**
 * HapticButton - Button with haptic feedback
 */
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { haptic } from './useHaptics';
import { springSnappy } from '../motion/springPresets';
import { useReducedMotion } from '../motion/useAnimations';

const HapticButton = forwardRef(({
  children,
  onClick,
  hapticType = 'medium', // 'light' | 'medium' | 'heavy' | 'success' | 'error'
  variant = 'primary', // 'primary' | 'secondary' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();

  const handleClick = (e) => {
    if (disabled || loading) return;
    
    // Trigger haptic feedback
    haptic.trigger(hapticType);
    
    onClick?.(e);
  };

  const baseClasses = `
    inline-flex items-center justify-center font-medium
    rounded-xl transition-colors
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    select-none touch-manipulation
  `;

  const variantClasses = {
    primary: 'bg-navy text-white hover:bg-navy/90 focus:ring-navy/50 active:bg-navy/80',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300 active:bg-gray-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-200 active:bg-gray-200',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 active:bg-red-700',
    teal: 'bg-teal text-white hover:bg-teal/90 focus:ring-teal/50 active:bg-teal/80',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-2.5 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
  };

  const classes = `
    ${baseClasses}
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (reducedMotion || disabled) {
    return (
      <button
        ref={ref}
        className={classes}
        onClick={handleClick}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }

  return (
    <motion.button
      ref={ref}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
});

HapticButton.displayName = 'HapticButton';

export default HapticButton;
