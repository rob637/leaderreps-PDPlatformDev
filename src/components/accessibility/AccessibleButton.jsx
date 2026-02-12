/**
 * AccessibleButton - Button with full accessibility support
 */
import React, { forwardRef } from 'react';
import { useKeyboardUser } from './useAccessibility';

const AccessibleButton = forwardRef(({
  children,
  onClick,
  disabled = false,
  loading = false,
  type = 'button',
  variant = 'primary',
  size = 'md',
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  ariaPressed,
  ariaHaspopup,
  className = '',
  ...props
}, ref) => {
  const isKeyboardUser = useKeyboardUser();

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  // Variant classes
  const variantClasses = {
    primary: `
      bg-corporate-teal text-white
      hover:bg-corporate-teal-dark
      disabled:bg-gray-300 disabled:text-gray-500
    `,
    secondary: `
      bg-white dark:bg-slate-800 text-corporate-navy border border-corporate-navy
      hover:bg-gray-50
      disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300
    `,
    danger: `
      bg-red-600 text-white
      hover:bg-red-700
      disabled:bg-gray-300 disabled:text-gray-500
    `,
    ghost: `
      bg-transparent text-corporate-navy
      hover:bg-gray-100
      disabled:text-gray-400
    `,
  };

  // Focus ring only for keyboard users
  const focusClasses = isKeyboardUser
    ? 'focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:ring-offset-2'
    : 'focus:outline-none';

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick?.(e);
  };

  const handleKeyDown = (e) => {
    // Activate button on Enter or Space
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-pressed={ariaPressed}
      aria-haspopup={ariaHaspopup}
      aria-busy={loading}
      aria-disabled={disabled}
      className={`
        inline-flex items-center justify-center
        font-medium rounded-lg
        transition-colors duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${focusClasses}
        ${disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {loading ? (
        <span className="sr-only">Loading...</span>
      ) : null}
      {children}
    </button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
