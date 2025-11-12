// src/components/shared/AccessibleComponents.jsx
// ACCESSIBILITY: WCAG 2.1 AA compliant components

import React from 'react';
import { COLORS, THEME } from '../../utils/constants.js';

export const AccessibleButton = ({ 
  children, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  ariaLabel,
  onClick,
  className = "",
  ...props 
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-medium transition-all
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `;

  const variants = {
    primary: `bg-[${COLORS.TEAL}] text-white hover:bg-[${COLORS.SUBTLE_TEAL}] focus:ring-[${COLORS.TEAL}]`,
    secondary: `bg-[${COLORS.ORANGE}] text-white hover:bg-[${COLORS.SUBTLE_TEAL}] focus:ring-[${COLORS.ORANGE}]`,
    outline: `border-2 border-[${COLORS.TEAL}] text-[${COLORS.TEAL}] hover:bg-[${COLORS.TEAL}] hover:text-white focus:ring-[${COLORS.TEAL}]`,
    ghost: `text-[${COLORS.TEXT}] hover:bg-gray-100 focus:ring-gray-300`
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-xl'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
          <path fill="currentColor" className="opacity-75" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

export const AccessibleInput = ({
  label,
  error,
  helpText,
  required = false,
  type = 'text',
  className = "",
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = helpText ? `${inputId}-help` : undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium"
          style={{ color: COLORS.TEXT }}
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      <input
        id={inputId}
        type={type}
        className={`
          w-full px-3 py-2 border rounded-lg transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-1
          ${error ? 
            'border-red-400 focus:ring-red-300' : 
            'border-gray-300 focus:ring-[' + COLORS.TEAL + ']'
          }
        `}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={[errorId, helpId].filter(Boolean).join(' ') || undefined}
        aria-required={required}
        {...props}
      />
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export const SkipLink = ({ href = "#main", children = "Skip to main content" }) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 z-50 px-4 py-2 rounded-lg font-medium text-white"
    style={{ backgroundColor: COLORS.NAVY }}
  >
    {children}
  </a>
);

// Screen reader only text
export const ScreenReaderOnly = ({ children }) => (
  <span className="sr-only">{children}</span>
);