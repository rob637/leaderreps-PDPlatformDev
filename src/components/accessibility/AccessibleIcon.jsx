/**
 * AccessibleIcon - Icon with proper accessibility attributes
 */
import React from 'react';

const AccessibleIcon = ({
  icon: Icon,
  label,
  decorative = false,
  size = 20,
  className = '',
  ...props
}) => {
  // If decorative, hide from screen readers
  if (decorative) {
    return (
      <Icon
        size={size}
        className={className}
        aria-hidden="true"
        focusable="false"
        {...props}
      />
    );
  }

  // If meaningful, provide accessible label
  if (!label) {
    console.warn('AccessibleIcon: Non-decorative icons should have a label prop');
  }

  return (
    <span
      role="img"
      aria-label={label}
      className={`inline-flex ${className}`}
    >
      <Icon
        size={size}
        aria-hidden="true"
        focusable="false"
        {...props}
      />
    </span>
  );
};

/**
 * Icon button with proper accessibility
 */
export const IconButton = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const variantClasses = {
    ghost: 'hover:bg-gray-100 text-gray-600',
    primary: 'bg-[#47A88D] hover:bg-[#3d9178] text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        inline-flex items-center justify-center
        rounded-lg transition-colors
        focus:outline-none focus:ring-2 focus:ring-[#47A88D] focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      <Icon
        size={iconSizes[size]}
        aria-hidden="true"
        focusable="false"
      />
    </button>
  );
};

/**
 * SVG icon wrapper for custom SVGs
 */
export const SvgIcon = ({
  children,
  label,
  decorative = false,
  viewBox = '0 0 24 24',
  size = 24,
  className = '',
  ...props
}) => {
  const svgProps = {
    width: size,
    height: size,
    viewBox,
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    focusable: 'false',
    ...props,
  };

  if (decorative) {
    return (
      <svg {...svgProps} aria-hidden="true" className={className}>
        {children}
      </svg>
    );
  }

  return (
    <svg
      {...svgProps}
      role="img"
      aria-label={label}
      className={className}
    >
      {label && <title>{label}</title>}
      {children}
    </svg>
  );
};

export default AccessibleIcon;
