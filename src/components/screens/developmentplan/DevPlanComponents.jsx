// src/components/screens/developmentplan/DevPlanComponents.jsx
// Reconstructed component library for the Development Plan screen.
// ADDED: LikertScaleInput component for the new single-page assessment.

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, ArrowRight, Loader, 
  TrendingUp, Target, Award, Clock, BarChart3, 
  Edit, RefreshCw, Calendar, Save, X, Plus, Trash2, FileX
} from 'lucide-react';
import { COLORS } from './devPlanConstants.js';

/* =========================================================
   Standardized Button Component
   (Shared with DashboardComponents)
========================================================= */
export const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const variantStyles = {
    primary: "bg-corporate-teal text-white shadow-sm hover:bg-teal-700 focus:ring-teal-500/50",
    secondary: "bg-corporate-orange text-white shadow-sm hover:bg-orange-700 focus:ring-orange-500/50",
    outline: "bg-white text-corporate-teal border-2 border-corporate-teal shadow-sm hover:bg-teal-50 focus:ring-teal-500/50",
    'nav-back': "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 focus:ring-slate-200/50 px-4 py-2 text-sm",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200/50 px-3 py-1.5 text-sm"
  };

  const disabledStyle = "bg-slate-200 text-slate-400 shadow-none border-transparent hover:bg-slate-200 cursor-not-allowed";

  const finalClassName = `
    ${baseStyle} 
    ${sizeStyles[size] || sizeStyles.md} 
    ${disabled ? disabledStyle : (variantStyles[variant] || variantStyles.primary)} 
    ${className}
  `.trim();

  return <button {...rest} onClick={onClick} disabled={disabled} className={finalClassName}>{children}</button>;
};

/* =========================================================
   Standardized Card Component
   (Shared with DashboardComponents)
========================================================= */
export const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY', actions }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };

  // Map accent names to Tailwind border classes
  const accentMap = {
    'TEAL': 'border-corporate-teal',
    'ORANGE': 'border-corporate-orange',
    'NAVY': 'border-corporate-navy',
    'BLUE': 'border-blue-500',
    'GREEN': 'border-green-500',
    'PURPLE': 'border-purple-500',
    'YELLOW': 'border-yellow-500',
    'RED': 'border-red-500',
    'GRAY': 'border-slate-500',
    'PINK': 'border-pink-500',
    'INDIGO': 'border-indigo-500',
  };

  const borderClass = accentMap[accent] || 'border-corporate-navy';

  const textClassMap = {
    'TEAL': 'text-corporate-teal',
    'ORANGE': 'text-corporate-orange',
    'NAVY': 'text-corporate-navy',
    'BLUE': 'text-blue-600',
    'GREEN': 'text-green-600',
    'PURPLE': 'text-purple-600',
    'YELLOW': 'text-yellow-600',
    'RED': 'text-red-600',
    'GRAY': 'text-slate-600',
    'PINK': 'text-pink-600',
    'INDIGO': 'text-indigo-600',
  };

  const iconClass = textClassMap[accent] || 'text-corporate-navy';

  return (
    <Tag
      {...(interactive ? { type: 'button' } : {})}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 text-left border-t-4 ${borderClass} ${className} ${interactive ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {(title || actions || Icon) && (
        <div className="flex items-center justify-between p-5 pb-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon size={20} className={iconClass} />
            )}
            {title && (
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">{actions}</div>
          )}
        </div>
      )}
      
      <div className={title || actions || Icon ? "p-5 pt-2" : "p-5"}>
        {children}
      </div>
    </Tag>
  );
};

/* =========================================================
   ProgressBar Component
   (Used in BaselineAssessment, ProgressScan, QuickPlanEditor)
========================================================= */
export const ProgressBar = ({ progress = 0, color, height = 8, showLabel = false }) => {
  const progressPercent = Math.max(0, Math.min(100, progress));
  
  const isHex = color && color.startsWith('#');
  const bgClass = !color ? 'bg-corporate-teal' : (isHex ? '' : color);
  const style = isHex ? { backgroundColor: color, width: `${progressPercent}%` } : { width: `${progressPercent}%` };
  
  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <div 
        className="w-full h-full rounded-full bg-slate-100 overflow-hidden"
      >
        <div 
          className={`h-full rounded-full transition-all duration-500 ${bgClass}`}
          style={style}
        />
      </div>
      {showLabel && (
        <span 
          className="absolute right-0 -top-5 text-xs font-semibold text-slate-600"
        >
          {Math.round(progressPercent)}%
        </span>
      )}
    </div>
  );
};

/* =========================================================
   Badge Component
   (Used in ProgressBreakdown, ProgressScan, QuickPlanEditor)
========================================================= */
export const Badge = ({ children, variant = 'default', size = 'md', color }) => {
  let baseStyle = 'font-semibold rounded-full inline-block';

  // Size
  if (size === 'sm') baseStyle += ' px-2.5 py-0.5 text-xs';
  else if (size == 'lg') baseStyle += ' px-3.5 py-1.5 text-sm';
  else baseStyle += ' px-3 py-1 text-sm';
  
  const isHex = color && color.startsWith('#');
  let colorStyle = {};

  if (isHex) {
      baseStyle += " bg-opacity-10";
      colorStyle = { backgroundColor: `${color}1A`, color: color };
  } else {
      const variants = {
          default: "bg-slate-100 text-slate-600",
          primary: "bg-blue-50 text-blue-700",
          success: "bg-green-50 text-green-700",
          warning: "bg-yellow-50 text-yellow-700",
          danger: "bg-red-50 text-red-700",
          info: "bg-blue-50 text-blue-700",
          teal: "bg-teal-50 text-teal-700",
          purple: "bg-purple-50 text-purple-700"
      };
      baseStyle += ` ${variants[variant] || variants.default}`;
  }
  
  return (
    <span className={baseStyle} style={colorStyle}>
      {children}
    </span>
  );
};

/* =========================================================
   StatCard Component
   (Used in ProgressBreakdown, PlanTracker)
========================================================= */
export const StatCard = ({ label, value, color, trend }) => {
  const accentColor = color || COLORS.TEAL;

  return (
    <div 
      className="p-4 rounded-xl border border-slate-200 bg-white"
    >
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <TrendingUp className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500">
            {label}
          </p>
        </div>
      </div>
      <p className="text-xl sm:text-2xl sm:text-3xl font-extrabold text-slate-800">
        {value}
      </p>
      {trend && (
        <p className="text-xs mt-1 text-slate-500">
          {trend}
        </p>
      )}
    </div>
  );
};

/* =========================================================
   LoadingSpinner Component
   (Used in DevelopmentPlan)
========================================================= */
export const LoadingSpinner = ({ message }) => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="text-center">
      <div 
        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 border-corporate-teal" 
      />
      <p className="text-slate-600">
        {message || 'Loading...'}
      </p>
    </div>
  </div>
);

/* =========================================================
   PlanGenerationLoader Component - COOL ANIMATION!
   (Used in BaselineAssessment and ProgressScan during plan generation)
========================================================= */
export const PlanGenerationLoader = ({ message = 'Crafting Your Development Plan' }) => {
  const [dots, setDots] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: '🎯', text: 'Analyzing your assessment', color: COLORS.TEAL },
    { icon: '🧠', text: 'Identifying growth areas', color: COLORS.BLUE },
    { icon: '💡', text: 'Mapping practice reps', color: COLORS.ORANGE },
    { icon: '📅', text: 'Structuring your 90-day plan', color: COLORS.GREEN },
    { icon: '✨', text: 'Finalizing recommendations', color: COLORS.PURPLE }
  ];
  
  useEffect(() => {
    // Animate dots
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    // Cycle through steps
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 1600);
    
    return () => {
      clearInterval(dotsInterval);
      clearInterval(stepInterval);
    };
  }, [steps.length]);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" 
         style={{ background: 'rgba(0, 0, 0, 0.75)' }}>
      <div className="relative">
        {/* Animated Background Circles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="absolute w-64 h-64 rounded-full animate-pulse"
            style={{ 
              background: `radial-gradient(circle, ${COLORS.TEAL}20 0%, transparent 70%)`,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
          <div 
            className="absolute w-48 h-48 rounded-full animate-ping"
            style={{ 
              background: `radial-gradient(circle, ${COLORS.ORANGE}15 0%, transparent 70%)`,
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            }}
          />
        </div>
        
        {/* Main Content Card */}
        <div 
          className="relative bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4"
          style={{ 
            border: `3px solid ${COLORS.TEAL}40`,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {/* Spinning Icon */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ 
                background: `linear-gradient(135deg, ${COLORS.TEAL}20, ${COLORS.BLUE}20)`,
                animation: 'spin 3s linear infinite'
              }}
            >
              {steps[currentStep].icon}
            </div>
          </div>
          
          {/* Main Message */}
          <h3 
            className="text-xl sm:text-2xl font-extrabold text-center mb-2 text-slate-800"
          >
            {message}{dots}
          </h3>
          
          {/* Current Step */}
          <div className="mt-6 p-4 rounded-xl transition-all duration-500"
               style={{ 
                 background: `${steps[currentStep].color}10`,
                 border: `2px solid ${steps[currentStep].color}30`
               }}>
            <div className="flex items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                style={{ background: `${steps[currentStep].color}20` }}
              >
                {steps[currentStep].icon}
              </div>
              <p className="text-sm font-semibold" style={{ color: steps[currentStep].color }}>
                {steps[currentStep].text}
              </p>
            </div>
          </div>
          
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {steps.map((_, index) => (
              <div
                key={index}
                className="transition-all duration-300"
                style={{
                  width: index === currentStep ? '32px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: index === currentStep ? COLORS.TEAL : COLORS.SUBTLE
                }}
              />
            ))}
          </div>
          
          {/* Encouraging Message */}
          <p className="text-center text-xs mt-6 text-slate-400">
            This usually takes 5-8 seconds...
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

/* =========================================================
   EmptyState Component
   (Used in PlanTracker)
========================================================= */
export const EmptyState = ({ title, description, action }) => (
  <div className="text-center p-12 my-12 border-2 border-dashed rounded-2xl border-slate-200 bg-slate-50">
    <FileX 
      className="w-12 h-12 mx-auto mb-4 text-slate-400" 
    />
    <h3 className="text-xl font-bold mb-2 text-slate-800">
      {title}
    </h3>
    <p className="text-sm mb-6 max-w-sm mx-auto text-slate-600">
      {description}
    </p>
    {action && (
      <div>{action}</div>
    )}
  </div>
);

/* =========================================================
   SectionHeader Component
   (Used in PlanTracker)
========================================================= */
export const SectionHeader = ({ title, accent = 'NAVY' }) => {
  const accentColor = COLORS[accent] || COLORS.NAVY;
  
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
      <BarChart3 className="w-6 h-6" style={{ color: accentColor }} />
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
        {title}
      </h2>
    </div>
  );
};

/* =========================================================
   LikertScaleInput Component (NEW)
   (Replaces the old full-width button layout in assessments)
========================================================= */
export const LikertScaleInput = ({ question, options, value, onChange }) => {
  return (
    <div 
      className="p-3 sm:p-4 lg:p-6 rounded-2xl border-2" 
      style={{ 
        borderColor: value ? COLORS.TEAL : COLORS.SUBTLE, 
        backgroundColor: value ? `${COLORS.TEAL}05` : COLORS.OFF_WHITE,
        transition: 'border-color 0.3s'
      }}
    >
      <p className="text-base font-semibold mb-4 text-slate-800">
        {question.text}
      </p>
      <div 
        className="flex flex-col sm:flex-row rounded-lg overflow-hidden border border-slate-200" 
      >
        {options.map((option, index) => (
          <button
            key={option.value}
            onClick={() => onChange(question.id, option.value)}
            className={`flex-1 p-3 text-center text-sm font-medium transition-all ${
              value === option.value
                ? '' // Active state is handled by style
                : 'hover:bg-gray-100'
            }`}
            style={{ 
              backgroundColor: value === option.value ? COLORS.TEAL : COLORS.OFF_WHITE,
              color: value === option.value ? 'white' : COLORS.TEXT,
              borderRight: index < options.length - 1 ? `1px solid ${COLORS.SUBTLE}` : 'none',
              borderBottom: `1px solid ${COLORS.SUBTLE}`,
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

