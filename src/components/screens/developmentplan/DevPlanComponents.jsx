// src/components/screens/developmentplan/DevPlanComponents.jsx
// Reconstructed component library for the Development Plan screen.
// ADDED: LikertScaleInput component for the new single-page assessment.

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, ArrowRight, Loader, 
  TrendingUp, Target, Award, Clock, BarChart3, 
  Edit, RefreshCw, Calendar, Save, X, Plus, Trash2, FileX
} from 'lucide-react';

/* =========================================================
   Standardized Button Component
   (Shared with DashboardComponents)
========================================================= */
export const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md'
, ...rest }) => {
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;
  if (size === 'sm') baseStyle += ' px-4 py-2 text-sm';
  else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg';
  else baseStyle += ' px-6 py-3 text-base';

  if (variant === 'primary') baseStyle += ` bg-[#47A88D] text-white shadow-lg hover:bg-[#47A88D] focus:ring-[#47A88D]/50`;
  else if (variant === 'secondary') baseStyle += ` bg-[#E04E1B] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[#E04E1B]/50`;
  else if (variant === 'outline') baseStyle += ` bg-[#FCFCFA] text-[#47A88D] border-2 border-[#47A88D] shadow-md hover:bg-[#47A88D]/10 focus:ring-[#47A88D]/50`;
  else if (variant === 'nav-back') baseStyle += ` bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 focus:ring-gray-300/50 px-4 py-2 text-sm`;
  else if (variant === 'ghost') baseStyle += ` bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300/50 px-3 py-1.5 text-sm`;
  if (disabled) baseStyle += ' bg-gray-300 text-gray-500 shadow-inner border-transparent hover:bg-gray-300';

  return <button {...rest} onClick={onClick} disabled={disabled} className={`${baseStyle} ${className}`}>{children}</button>;
};

/* =========================================================
   Standardized Card Component
   (Shared with DashboardComponents)
========================================================= */
export const Card = ({ children, title, icon: Icon, className = '', onClick, accent = 'NAVY', actions }) => {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'div';
  const accentColor = accent === 'ORANGE' ? '#E04E1B' : accent === 'TEAL' ? '#47A88D' : '#002E47';
  const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };
  return (
    <Tag
      {...(interactive ? { type: 'button' } : {})}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative rounded-2xl bg-white shadow-sm border border-slate-200 text-left transition-all duration-300 ${className}`}
      style={{
          borderTopWidth: '4px',
          borderTopColor: accentColor,
      }}
      onClick={onClick}
    >
      {(title || actions || Icon) && (
        <div className="flex items-center justify-between p-4 sm:p-6 pb-2">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex items-center justify-center">
                <Icon size={20} color={accentColor} />
              </div>
            )}
            {title && (
              <h2 className="text-lg font-bold text-[#002E47]">{title}</h2>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">{actions}</div>
          )}
        </div>
      )}
      
      <div className={title || actions || Icon ? "p-4 sm:p-6 pt-2" : "p-4 sm:p-6"}>
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
  const barColor = color || '#47A88D';
  
  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <div 
        className="w-full h-full rounded-full"
        style={{ backgroundColor: '#47A88D' }}
      >
        <div 
          className="h-full rounded-full transition-all duration-500"
          style={{ 
            width: `${progressPercent}%`, 
            backgroundColor: barColor 
          }}
        />
      </div>
      {showLabel && (
        <span 
          className="absolute right-0 -top-5 text-xs font-semibold"
          style={{ color: barColor }}
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
export const Badge = ({ children, variant = 'default', size = 'md' }) => {
  let baseStyle = 'font-semibold rounded-full inline-block';

  // Size
  if (size === 'sm') baseStyle += ' px-2.5 py-0.5 text-xs';
  else if (size == 'lg') baseStyle += ' px-3.5 py-1.5 text-sm';
  else baseStyle += ' px-3 py-1 text-sm';
  
  // Variant
  if (variant === 'primary') baseStyle += ` bg-[#002E47]20 text-[#002E47]`;
  else if (variant === 'success') baseStyle += ` bg-[#47A88D]20 text-[#47A88D]`;
  else if (variant === 'warning') baseStyle += ` bg-[#E04E1B]20 text-[#E04E1B]`;
  else if (variant === 'purple') baseStyle += ` bg-[#47A88D]20 text-[#47A88D]`;
  else baseStyle += ` bg-[#47A88D] text-[#47A88D]`;
  
  return (
    <span className={baseStyle}>
      {children}
    </span>
  );
};

/* =========================================================
   StatCard Component
   (Used in ProgressBreakdown, PlanTracker)
========================================================= */
export const StatCard = ({ label, value, color, trend }) => {
  const accentColor = color || '#47A88D';

  return (
    <div 
      className="p-4 rounded-xl border-2"
      style={{ borderColor: '#47A88D', background: 'white' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <TrendingUp className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: '#47A88D' }}>
            {label}
          </p>
        </div>
      </div>
      <p className="text-xl sm:text-2xl sm:text-3xl font-extrabold" style={{ color: '#002E47' }}>
        {value}
      </p>
      {trend && (
        <p className="text-xs mt-1" style={{ color: '#47A88D' }}>
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
        className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" 
        style={{ borderColor: '#47A88D' }} 
      />
      <p style={{ color: '#002E47' }}>
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
    { icon: '🎯', text: 'Analyzing your assessment', color: '#47A88D' },
    { icon: '🧠', text: 'Identifying growth areas', color: '#002E47' },
    { icon: '💡', text: 'Mapping practice reps', color: '#E04E1B' },
    { icon: '📅', text: 'Structuring your 90-day plan', color: '#47A88D' },
    { icon: '✨', text: 'Finalizing recommendations', color: '#47A88D' }
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
              background: `radial-gradient(circle, #47A88D20 0%, transparent 70%)`,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
          <div 
            className="absolute w-48 h-48 rounded-full animate-ping"
            style={{ 
              background: `radial-gradient(circle, #E04E1B15 0%, transparent 70%)`,
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            }}
          />
        </div>
        
        {/* Main Content Card */}
        <div 
          className="relative bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4"
          style={{ 
            border: `3px solid #47A88D40`,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {/* Spinning Icon */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ 
                background: `linear-gradient(135deg, #47A88D20, #002E4720)`,
                animation: 'spin 3s linear infinite'
              }}
            >
              {steps[currentStep].icon}
            </div>
          </div>
          
          {/* Main Message */}
          <h3 
            className="text-xl sm:text-2xl font-extrabold text-center mb-2"
            style={{ color: '#002E47' }}
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
                  background: index === currentStep ? '#47A88D' : '#47A88D'
                }}
              />
            ))}
          </div>
          
          {/* Encouraging Message */}
          <p className="text-center text-xs mt-6" style={{ color: '#47A88D' }}>
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
  <div className="text-center p-12 my-12 border-2 border-dashed rounded-2xl" style={{ borderColor: '#47A88D', backgroundColor: '#FCFCFA' }}>
    <FileX 
      className="w-12 h-12 mx-auto mb-4" 
      style={{ color: '#47A88D' }} 
    />
    <h3 className="text-xl font-bold mb-2" style={{ color: '#002E47' }}>
      {title}
    </h3>
    <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: '#002E47' }}>
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
  const accentColor = accent === 'ORANGE' ? '#E04E1B' : accent === 'TEAL' ? '#47A88D' : '#002E47';
  
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2" style={{ borderColor: '#47A88D' }}>
      <BarChart3 className="w-6 h-6" style={{ color: accentColor }} />
      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: '#002E47' }}>
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
        borderColor: value ? '#47A88D' : '#47A88D', 
        backgroundColor: value ? '#47A88D05' : '#FCFCFA',
        transition: 'border-color 0.3s'
      }}
    >
      <p className="text-base font-semibold mb-4" style={{ color: '#002E47' }}>
        {question.text}
      </p>
      <div 
        className="flex flex-col sm:flex-row rounded-lg overflow-hidden border" 
        style={{ borderColor: '#47A88D' }}
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
              backgroundColor: value === option.value ? '#47A88D' : '#FCFCFA',
              color: value === option.value ? 'white' : '#002E47',
              borderRight: index < options.length - 1 ? `1px solid #47A88D` : 'none',
              borderBottom: `1px solid #47A88D`,
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

