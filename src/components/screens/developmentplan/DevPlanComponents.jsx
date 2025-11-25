// src/components/screens/developmentplan/DevPlanComponents.jsx
// Component library for the Development Plan screen.

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, ArrowRight,
  TrendingUp, Target, Award, Clock, BarChart3, 
  Edit, RefreshCw, Calendar, Save, X, Plus, Trash2, FileX
} from 'lucide-react';

// Re-export Button and Card from canonical UI for backwards compatibility
export { Button, Card, LoadingSpinner, LoadingState } from '../../ui';

/* =========================================================
   ProgressBar Component
   (Used in BaselineAssessment, ProgressScan, QuickPlanEditor)
========================================================= */
export const ProgressBar = ({ progress = 0, color, height = 8, showLabel = false }) => {
  const progressPercent = Math.max(0, Math.min(100, progress));
  const barColor = color || 'var(--corporate-teal)';
  
  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <div 
        className="w-full h-full rounded-full"
        style={{ backgroundColor: 'var(--corporate-teal-20)' }}
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
  if (variant === 'primary') baseStyle += ` bg-corporate-navy20 text-corporate-navy`;
  else if (variant === 'success') baseStyle += ` bg-corporate-teal20 text-corporate-teal`;
  else if (variant === 'warning') baseStyle += ` bg-corporate-orange20 text-corporate-orange`;
  else if (variant === 'purple') baseStyle += ` bg-corporate-teal20 text-corporate-teal`;
  else baseStyle += ` bg-corporate-teal text-corporate-teal`;
  
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
  const accentColor = color || 'var(--corporate-teal)';

  return (
    <div 
      className="p-4 rounded-xl border-2"
      style={{ borderColor: 'var(--corporate-teal)', background: 'white' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--corporate-teal-20)' }}
        >
          <TrendingUp className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: 'var(--corporate-teal)' }}>
            {label}
          </p>
        </div>
      </div>
      <p className="text-xl sm:text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--corporate-navy)' }}>
        {value}
      </p>
      {trend && (
        <p className="text-xs mt-1" style={{ color: 'var(--corporate-teal)' }}>
          {trend}
        </p>
      )}
    </div>
  );
};

/* =========================================================
   PlanGenerationLoader Component - COOL ANIMATION!
   (Used in BaselineAssessment and ProgressScan during plan generation)
========================================================= */
export const PlanGenerationLoader = ({ message = 'Crafting Your Development Plan' }) => {
  const [dots, setDots] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { icon: '🎯', text: 'Analyzing your assessment', color: 'var(--corporate-teal)' },
    { icon: '🧠', text: 'Identifying growth areas', color: 'var(--corporate-navy)' },
    { icon: '💡', text: 'Mapping practice reps', color: 'var(--corporate-orange)' },
    { icon: '📅', text: 'Structuring your 90-day plan', color: 'var(--corporate-teal)' },
    { icon: '✨', text: 'Finalizing recommendations', color: 'var(--corporate-teal)' }
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
              background: `radial-gradient(circle, var(--corporate-teal-20) 0%, transparent 70%)`,
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}
          />
          <div 
            className="absolute w-48 h-48 rounded-full animate-ping"
            style={{ 
              background: `radial-gradient(circle, var(--corporate-orange-10) 0%, transparent 70%)`,
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite'
            }}
          />
        </div>
        
        {/* Main Content Card */}
        <div 
          className="relative bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-4"
          style={{ 
            border: `3px solid var(--corporate-teal-40)`,
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          {/* Spinning Icon */}
          <div className="flex justify-center mb-6">
            <div 
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
              style={{ 
                background: `linear-gradient(135deg, var(--corporate-teal-20), var(--corporate-navy-20))`,
                animation: 'spin 3s linear infinite'
              }}
            >
              {steps[currentStep].icon}
            </div>
          </div>
          
          {/* Main Message */}
          <h3 
            className="text-xl sm:text-2xl font-extrabold text-center mb-2"
            style={{ color: 'var(--corporate-navy)' }}
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
                  background: 'var(--corporate-teal)'
                }}
              />
            ))}
          </div>
          
          {/* Encouraging Message */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--corporate-teal)' }}>
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
  <div className="text-center p-12 my-12 border-2 border-dashed rounded-2xl" style={{ borderColor: 'var(--corporate-teal)', backgroundColor: '#FCFCFA' }}>
    <FileX 
      className="w-12 h-12 mx-auto mb-4" 
      style={{ color: 'var(--corporate-teal)' }} 
    />
    <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--corporate-navy)' }}>
      {title}
    </h3>
    <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--corporate-navy)' }}>
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
  const accentColor = accent === 'ORANGE' ? 'var(--corporate-orange)' : accent === 'TEAL' ? 'var(--corporate-teal)' : 'var(--corporate-navy)';
  
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2" style={{ borderColor: 'var(--corporate-teal)' }}>
      <BarChart3 className="w-6 h-6" style={{ color: accentColor }} />
      <h2 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--corporate-navy)' }}>
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
        borderColor: value ? 'var(--corporate-teal)' : 'var(--corporate-teal)', 
        backgroundColor: value ? 'var(--corporate-teal-10)' : 'var(--corporate-light-gray)',
        transition: 'border-color 0.3s'
      }}
    >
      <p className="text-base font-semibold mb-4" style={{ color: 'var(--corporate-navy)' }}>
        {question.text}
      </p>
      <div 
        className="flex flex-col sm:flex-row rounded-lg overflow-hidden border" 
        style={{ borderColor: 'var(--corporate-teal)' }}
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
              backgroundColor: value === option.value ? 'var(--corporate-teal)' : 'var(--corporate-light-gray)',
              color: value === option.value ? 'white' : 'var(--corporate-navy)',
              borderRight: index < options.length - 1 ? `1px solid var(--corporate-teal)` : 'none',
              borderBottom: `1px solid var(--corporate-teal)`,
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

