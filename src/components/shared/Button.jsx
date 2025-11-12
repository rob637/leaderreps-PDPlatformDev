// src/components/shared/Button.jsx
// REFACTORED: Consistent button component using CSS classes instead of template literals

import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  size = 'md',
  className = '', 
  ...rest 
}) => {
  // Base classes that work with all variants
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-6 py-3 text-base rounded-lg', 
    lg: 'px-8 py-4 text-lg rounded-xl'
  };

  // Style variants using CSS classes from theme.css
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary', 
    outline: 'btn-outline',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
  };

  const combinedClasses = `
    ${baseClasses} 
    ${sizeClasses[size]} 
    ${variantClasses[variant]} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;