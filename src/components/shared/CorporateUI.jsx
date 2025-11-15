// src/components/shared/CorporateUI.jsx
// Standardized UI components for consistent look across all screens

import React from 'react';
import { CORPORATE_COLORS, CORPORATE_CLASSES, CORPORATE_STYLES } from '../../styles/corporateConstants.js';

/* =========================================================
   STANDARDIZED BUTTON COMPONENT
========================================================= */
export const Button = ({ children, onClick, disabled = false, variant = 'primary', size = 'md', className = '', ...rest }) => {
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;

  // Size variants
  if (size === 'sm') baseStyle += ' px-4 py-2 text-sm';
  else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg';
  else baseStyle += ' px-6 py-3 text-base'; // Default 'md'

  // Style variants
  if (variant === 'primary') {
    baseStyle += ` text-white shadow-lg hover:opacity-90 focus:ring-opacity-50`;
  } else if (variant === 'secondary') {
    baseStyle += ` text-white shadow-lg hover:opacity-90 focus:ring-opacity-50`;
  } else if (variant === 'outline') {
    baseStyle += ` border-2 hover:text-white focus:ring-opacity-50 bg-white`;
  } else if (variant === 'nav-back') {
    baseStyle += ` border-2 border-gray-300 text-gray-700 hover:bg-gray-100`;
  } else if (variant === 'ghost') {
    baseStyle += ` text-gray-700 hover:bg-gray-100`;
  }

  if (disabled) {
    baseStyle = "px-6 py-3 rounded-xl font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-inner transition-none flex items-center justify-center";
  }

  const buttonStyle = {
    ...(variant === 'primary' && { backgroundColor: CORPORATE_COLORS.TEAL, '--tw-ring-color': CORPORATE_COLORS.TEAL }),
    ...(variant === 'secondary' && { backgroundColor: CORPORATE_COLORS.ORANGE, '--tw-ring-color': CORPORATE_COLORS.ORANGE }),
    ...(variant === 'outline' && { 
      borderColor: CORPORATE_COLORS.TEAL, 
      color: CORPORATE_COLORS.TEAL,
      '--tw-ring-color': CORPORATE_COLORS.TEAL 
    })
  };

  return (
    <button 
      {...rest} 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${className}`}
      style={buttonStyle}
    >
      {children}
    </button>
  );
};

/* =========================================================
   STANDARDIZED CARD COMPONENT
========================================================= */
export const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'TEAL' }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = CORPORATE_COLORS[accent] || CORPORATE_COLORS.TEAL;

  const handleKeyDown = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Tag
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative p-4 sm:p-6 rounded-2xl border-2 shadow-lg transition-all duration-300 text-left ${
        interactive ? 'hover:shadow-xl cursor-pointer' : ''
      } ${className}`}
      style={{
        background: 'linear-gradient(180deg, #FFFFFF, #FCFCFA)',
        borderColor: '#E5E7EB',
        color: CORPORATE_COLORS.NAVY
      }}
      onClick={onClick}
    >
      <span 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: 6, 
          background: accentColor, 
          borderTopLeftRadius: 14, 
          borderTopRightRadius: 14 
        }} 
      />

      {Icon && title && (
        <div className="flex items-center gap-3 mb-4">
          <Icon className="w-6 h-6 flex-shrink-0" style={{ color: accentColor }} />
          <h2 className={CORPORATE_CLASSES.HEADING_LG} style={{ color: CORPORATE_COLORS.NAVY }}>
            {title}
          </h2>
        </div>
      )}

      {children}
    </Tag>
  );
};

/* =========================================================
   STANDARDIZED PAGE HEADER
========================================================= */
export const PageHeader = ({ title, subtitle, icon: Icon }) => (
  <div className="text-center mb-8">
    {Icon && (
      <div className="flex items-center justify-center gap-2 mb-4">
        <Icon className="w-8 h-8" style={{ color: CORPORATE_COLORS.TEAL }} />
        <h1 className={CORPORATE_CLASSES.HEADING_XL} style={CORPORATE_STYLES.MAIN_HEADER}>
          {title}
        </h1>
        <Icon className="w-8 h-8" style={{ color: CORPORATE_COLORS.TEAL }} />
      </div>
    )}
    {!Icon && (
      <h1 className={CORPORATE_CLASSES.HEADING_XL} style={CORPORATE_STYLES.MAIN_HEADER}>
        {title}
      </h1>
    )}
    {subtitle && (
      <p className={`${CORPORATE_CLASSES.TEXT_BODY} text-gray-600 mt-2`}>
        {subtitle}
      </p>
    )}
  </div>
);

/* =========================================================
   STANDARDIZED BACK BUTTON
========================================================= */
export const BackButton = ({ onClick, children = "Back to The Arena" }) => (
  <div className={CORPORATE_CLASSES.BACK_BUTTON} onClick={onClick}>
    <ArrowLeft className="w-4 h-4" />
    <span className="text-sm font-medium">{children}</span>
  </div>
);

// Import ArrowLeft for BackButton
import { ArrowLeft } from 'lucide-react';