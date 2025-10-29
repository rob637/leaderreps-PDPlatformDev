// src/components/developmentplan/DevPlanComponents.jsx
// Shared UI components for Development Plan screens

import React from 'react';
import { Loader } from 'lucide-react';
import { COLORS } from './devPlanUtils';

/* =========================================================
   STANDARDIZED BUTTON COMPONENT
========================================================= */
export const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  className = '', 
  size = 'md', 
  ...rest 
}) => {
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
  
  // Size variants
  if (size === 'sm') baseStyle += ' px-4 py-2 text-sm';
  else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg';
  else baseStyle += ' px-6 py-3 text-base';
  
  // Color variants
  if (variant === 'primary') 
    baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'secondary') 
    baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
  else if (variant === 'outline') 
    baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'ghost') 
    baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
  else if (variant === 'success')
    baseStyle += ` bg-[${COLORS.GREEN}] text-white shadow-lg hover:bg-[#0D9668] focus:ring-[${COLORS.GREEN}]/50`;
  else if (variant === 'danger')
    baseStyle += ` bg-[${COLORS.RED}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.RED}]/50`;
  
  if (disabled) 
    baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';
  
  return (
    <button 
      {...rest} 
      onClick={onClick} 
      disabled={disabled} 
      className={`${baseStyle} ${className}`}
    >
      {children}
    </button>
  );
};

/* =========================================================
   STANDARDIZED CARD COMPONENT
========================================================= */
export const Card = ({ 
  children, 
  title, 
  icon: Icon, 
  className = '', 
  accent = 'NAVY',
  actions = null,
}) => {
  const accentColor = COLORS[accent] || COLORS.NAVY;
  
  return (
    <div 
      className={`relative p-6 rounded-2xl border-2 shadow-xl hover:shadow-2xl transition-all duration-300 text-left ${className}`} 
      style={{ 
        background: 'linear-gradient(180deg, #FFFFFF, #FCFCFA)', 
        borderColor: COLORS.SUBTLE, 
        color: COLORS.NAVY 
      }}
    >
      {/* Accent bar */}
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
      
      {/* Header with icon and title */}
      {(Icon || title) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" 
                style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}
              >
                <Icon className="w-5 h-5" style={{ color: accentColor }} />
              </div>
            )}
            {title && (
              <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>
                {title}
              </h2>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      
      {/* Content */}
      <div>{children}</div>
    </div>
  );
};

/* =========================================================
   LOADING SPINNER
========================================================= */
export const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: COLORS.BG }}>
    <div className="flex flex-col items-center">
      <Loader className="animate-spin h-12 w-12 mb-3" style={{ color: COLORS.TEAL }} />
      <p className="font-semibold" style={{ color: COLORS.NAVY }}>{message}</p>
    </div>
  </div>
);

/* =========================================================
   PROGRESS BAR
========================================================= */
export const ProgressBar = ({ 
  progress, 
  color = COLORS.TEAL, 
  height = 8,
  showLabel = false,
  className = '',
}) => {
  return (
    <div className={className}>
      <div 
        className="w-full rounded-full overflow-hidden" 
        style={{ 
          height: `${height}px`, 
          background: COLORS.SUBTLE 
        }}
      >
        <div 
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{ 
            width: `${Math.min(100, Math.max(0, progress))}%`, 
            background: color 
          }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-600 mt-1 text-center">
          {Math.round(progress)}% Complete
        </p>
      )}
    </div>
  );
};

/* =========================================================
   BADGE COMPONENT
========================================================= */
export const Badge = ({ 
  children, 
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  let badgeStyle = 'inline-flex items-center justify-center font-semibold rounded-full';
  
  // Size
  if (size === 'sm') badgeStyle += ' px-2 py-0.5 text-xs';
  else if (size === 'lg') badgeStyle += ' px-4 py-1.5 text-sm';
  else badgeStyle += ' px-3 py-1 text-xs';
  
  // Color variants
  if (variant === 'primary') 
    badgeStyle += ' bg-blue-100 text-blue-800';
  else if (variant === 'success') 
    badgeStyle += ' bg-green-100 text-green-800';
  else if (variant === 'warning') 
    badgeStyle += ' bg-amber-100 text-amber-800';
  else if (variant === 'danger') 
    badgeStyle += ' bg-red-100 text-red-800';
  else if (variant === 'teal') 
    badgeStyle += ' bg-teal-100 text-teal-800';
  else if (variant === 'purple') 
    badgeStyle += ' bg-purple-100 text-purple-800';
  else 
    badgeStyle += ' bg-gray-100 text-gray-800';
  
  return (
    <span className={`${badgeStyle} ${className}`}>
      {children}
    </span>
  );
};

/* =========================================================
   STAT CARD
========================================================= */
export const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  trend,
  color = COLORS.NAVY,
  className = '',
}) => {
  return (
    <div 
      className={`p-4 rounded-xl border-2 ${className}`}
      style={{ 
        borderColor: COLORS.SUBTLE,
        background: 'white'
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold" style={{ color }}>
            {value}
          </p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        {Icon && (
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center"
            style={{ background: `${color}20` }}
          >
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
        )}
      </div>
    </div>
  );
};

/* =========================================================
   SECTION HEADER
========================================================= */
export const SectionHeader = ({ 
  title, 
  subtitle, 
  icon: Icon,
  actions,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: `${COLORS.TEAL}20` }}
          >
            <Icon className="w-5 h-5" style={{ color: COLORS.TEAL }} />
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold" style={{ color: COLORS.NAVY }}>
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */
export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className = '',
}) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center p-12 text-center ${className}`}
      style={{ background: COLORS.LIGHT_GRAY, borderRadius: 16 }}
    >
      {Icon && (
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ background: `${COLORS.TEAL}20` }}
        >
          <Icon className="w-8 h-8" style={{ color: COLORS.TEAL }} />
        </div>
      )}
      <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
        {title}
      </h3>
      <p className="text-gray-600 mb-6 max-w-md">{description}</p>
      {action}
    </div>
  );
};
