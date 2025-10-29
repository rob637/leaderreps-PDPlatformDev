// src/components/screens/developmentplan/DevPlanComponents.jsx
// Reconstructed component library for the Development Plan screen.
// FIXED: Removed stray lines of code that were causing build errors.

import React from 'react';
import { 
  CheckCircle, ArrowRight, Loader, 
  TrendingUp, Target, Award, Clock, BarChart3, 
  Edit, RefreshCw, Calendar, Save, X, Plus, Trash2 
} from 'lucide-react';

/* =========================================================
   COLORS
   (Shared with DashboardComponents)
========================================================= */
export const COLORS = { 
  NAVY: '#002E47', TEAL: '#47A88D', BLUE: '#2563EB', ORANGE: '#E04E1B', 
  GREEN: '#10B981', AMBER: '#F5A800', RED: '#E04E1B', LIGHT_GRAY: '#FCFCFA', 
  OFF_WHITE: '#FFFFFF', SUBTLE: '#E5E7EB', TEXT: '#374151', MUTED: '#4B5563', 
  PURPLE: '#7C3AED', BG: '#F9FAFB' 
};

/* =========================================================
   Standardized Button Component
   (Shared with DashboardComponents)
========================================================= */
export const Button = ({ children, onClick, disabled = false, variant = 'primary', className = '', size = 'md', ...rest }) => {
  let baseStyle = `inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed`;

  if (size === 'sm') baseStyle += ' px-4 py-2 text-sm';
  else if (size === 'lg') baseStyle += ' px-8 py-4 text-lg';
  else baseStyle += ' px-6 py-3 text-base';

  if (variant === 'primary') baseStyle += ` bg-[${COLORS.TEAL}] text-white shadow-lg hover:bg-[#349881] focus:ring-[${COLORS.TEAL}]/50`;
  else if (variant === 'secondary') baseStyle += ` bg-[${COLORS.ORANGE}] text-white shadow-lg hover:bg-[#C33E12] focus:ring-[${COLORS.ORANGE}]/50`;
  else if (variant === 'outline') baseStyle += ` bg-[${COLORS.OFF_WHITE}] text-[${COLORS.TEAL}] border-2 border-[${COLORS.TEAL}] shadow-md hover:bg-[${COLORS.TEAL}]/10 focus:ring-[${COLORS.TEAL}]/50`;
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
  const accentColor = COLORS[accent] || COLORS.NAVY;
  const handleKeyDown = (e) => { if (interactive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick?.(); } };

  return (
    <Tag
      {...(interactive ? { type: 'button' } : {})}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={handleKeyDown}
      className={`relative rounded-2xl border-2 shadow-xl transition-all duration-300 text-left ${className}`}
      style={{
          background: 'linear-gradient(180deg,#FFFFFF, #FCFCFA)',
          borderColor: COLORS.SUBTLE,
          color: COLORS.NAVY
      }}
      onClick={onClick}
    >
      <span style={{ position:'absolute', top:0, left:0, right:0, height:6, background: accentColor, borderTopLeftRadius:14, borderTopRightRadius:14 }} />
      
      {(title || actions) && (
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0" style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}>
                  <Icon className="w-5 h-5" style={{ color: accentColor }} />
              </div>
            )}
            {title && (
              <h2 className="text-xl font-extrabold" style={{ color: COLORS.NAVY }}>{title}</h2>
            )}
          </div>
          {actions && (
            <div className="flex-shrink-0">{actions}</div>
          )}
        </div>
      )}
      
      <div className={title || actions ? "p-6 pt-0" : "p-6"}>
        {children}
      </div>
    </Tag>
  );
};

/* =========================================================
   ProgressBar Component (FIXED: NOW EXPORTED)
   (Used in BaselineAssessment, ProgressScan, QuickPlanEditor)
========================================================= */
export const ProgressBar = ({ progress = 0, color, height = 8, showLabel = false }) => {
  const progressPercent = Math.max(0, Math.min(100, progress));
  const barColor = color || COLORS.TEAL;
  
  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <div 
        className="w-full h-full rounded-full"
        style={{ backgroundColor: COLORS.SUBTLE }}
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
  else if (size == 'lg') baseStyle += ' px-3.5 py-1.5 text-sm'; // This line was in your file
  else baseStyle += ' px-3 py-1 text-sm';
  
  // Variant
  if (variant === 'primary') baseStyle += ` bg-[${COLORS.BLUE}20] text-[${COLORS.BLUE}]`;
  else if (variant === 'success') baseStyle += ` bg-[${COLORS.GREEN}20] text-[${COLORS.GREEN}]`;
  else if (variant === 'warning') baseStyle += ` bg-[${COLORS.AMBER}20] text-[${COLORS.AMBER}]`;
  else if (variant === 'purple') baseStyle += ` bg-[${COLORS.PURPLE}20] text-[${COLORS.PURPLE}]`; // Added purple variant here
  else baseStyle += ` bg-[${COLORS.SUBTLE}] text-[${COLORS.MUTED}]`;
  
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
export const StatCard = ({ label, value, icon: Icon, color, trend }) => {
  const accentColor = color || COLORS.TEAL;

  return (
    <div 
      className="p-4 rounded-xl border-2"
      style={{ borderColor: COLORS.SUBTLE, background: 'white' }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}20` }}
        >
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
        <div>
          <p className="text-xs font-semibold" style={{ color: COLORS.MUTED }}>
            {label}
          </p>
        </div>
      </div>
      <p className="text-3xl font-extrabold" style={{ color: COLORS.NAVY }}>
        {value}
      </p>
      {trend && (
        <p className="text-xs mt-1" style={{ color: COLORS.MUTED }}>
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
        style={{ borderColor: COLORS.TEAL }} 
      />
      <p style={{ color: COLORS.TEXT }}>
        {message || 'Loading...'}
      </p>
    </div>
  </div>
);

/* =========================================================
   EmptyState Component
   (Used in PlanTracker)
========================================================= */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center p-12 my-12 border-2 border-dashed rounded-2xl" style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.LIGHT_GRAY }}>
    <Icon 
      className="w-12 h-12 mx-auto mb-4" 
      style={{ color: COLORS.MUTED }} 
    />
    <h3 className="text-xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
      {title}
    </h3>
    <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: COLORS.TEXT }}>
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
export const SectionHeader = ({ title, icon: Icon, accent = 'NAVY' }) => {
  const accentColor = COLORS[accent] || COLORS.NAVY;
  
  return (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b-2" style={{ borderColor: COLORS.SUBTLE }}>
      <Icon className="w-6 h-6" style={{ color: accentColor }} />
      <h2 className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
        {title}
      </h2>
    </div>
  );
};