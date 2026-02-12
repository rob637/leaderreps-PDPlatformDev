// src/components/ui/StatWidget.jsx
// Standardized Statistic Display Component
// Use this for all stat cards, metrics, KPIs on dashboards

import React from 'react';
import { cn } from '../../lib/utils';
import { TrendingUp, TrendingDown, Minus, CornerRightUp } from 'lucide-react';

/**
 * StatWidget - Standardized statistic display for dashboards
 * 
 * @example Basic usage
 * <StatWidget 
 *   label="Total Users" 
 *   value="1,234" 
 *   icon={Users}
 * />
 * 
 * @example With trend
 * <StatWidget 
 *   label="Revenue" 
 *   value="$45,000" 
 *   icon={DollarSign}
 *   trend={12.5}
 *   trendLabel="vs last month"
 * />
 * 
 * @example Clickable stat
 * <StatWidget 
 *   label="Tasks Completed" 
 *   value="8/10" 
 *   icon={CheckCircle}
 *   onClick={() => navigate('/tasks')}
 *   accent="teal"
 * />
 * 
 * @example Compact variant
 * <StatWidget 
 *   label="Streak" 
 *   value="7 days" 
 *   icon={Flame}
 *   variant="compact"
 * />
 */
const StatWidget = React.forwardRef(({
  // Core props
  label,
  value,
  icon: Icon,
  
  // Trend
  trend,
  trendLabel,
  
  // Styling
  accent = 'navy',
  variant = 'default',
  className,
  
  // Interaction
  onClick,
  
  ...props
}, ref) => {
  
  // Accent color mapping
  const accentColors = {
    navy: {
      border: 'border-t-corporate-navy',
      icon: 'text-corporate-navy',
      bg: 'bg-corporate-navy/10',
      bgVar: 'var(--corporate-navy-10)',
    },
    teal: {
      border: 'border-t-corporate-teal',
      icon: 'text-corporate-teal',
      bg: 'bg-corporate-teal/10',
      bgVar: 'var(--corporate-teal-10)',
    },
    orange: {
      border: 'border-t-corporate-orange',
      icon: 'text-corporate-orange',
      bg: 'bg-corporate-orange/10',
      bgVar: 'var(--corporate-orange-10)',
    },
    red: {
      border: 'border-t-red-500',
      icon: 'text-red-500',
      bg: 'bg-red-500/10',
      bgVar: 'rgba(239,68,68,0.1)',
    },
    green: {
      border: 'border-t-green-500',
      icon: 'text-green-500',
      bg: 'bg-green-500/10',
      bgVar: 'rgba(34,197,94,0.1)',
    },
    blue: {
      border: 'border-t-blue-500',
      icon: 'text-blue-500',
      bg: 'bg-blue-500/10',
      bgVar: 'rgba(59,130,246,0.1)',
    },
    purple: {
      border: 'border-t-purple-500',
      icon: 'text-purple-500',
      bg: 'bg-purple-500/10',
      bgVar: 'rgba(168,85,247,0.1)',
    },
    yellow: {
      border: 'border-t-yellow-500',
      icon: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
      bgVar: 'rgba(234,179,8,0.1)',
    },
    amber: {
      border: 'border-t-amber-500',
      icon: 'text-amber-500',
      bg: 'bg-amber-500/10',
      bgVar: 'rgba(245,158,11,0.1)',
    },
  };

  const colors = accentColors[accent] || accentColors.navy;
  
  // Trend display
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : trend < 0 ? 'text-red-600 bg-red-50' : 'text-slate-400 bg-slate-50 dark:bg-slate-800';
  const showTrend = typeof trend === 'number';

  const Component = onClick ? 'button' : 'div';

  // Variant styles
  const variantStyles = {
    default: 'p-5',
    compact: 'p-4',
    large: 'p-6',
  };

  return (
    <Component
      ref={ref}
      onClick={onClick}
      className={cn(
        'relative rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-left w-full',
        'border-t-4',
        colors.border,
        onClick && 'hover:shadow-md cursor-pointer transition-shadow group',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {/* Click indicator */}
      {onClick && (
        <CornerRightUp 
          className="absolute top-4 right-4 w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" 
        />
      )}
      
      {/* Content */}
      <div className="flex items-start gap-4">
        {/* Icon */}
        {Icon && (
          <div 
            className={cn(
              "flex-shrink-0 rounded-xl flex items-center justify-center",
              variant === 'compact' ? 'w-10 h-10' : 'w-12 h-12'
            )}
            style={{ backgroundColor: colors.bgVar }}
          >
            <Icon className={cn(
              colors.icon,
              variant === 'compact' ? 'w-5 h-5' : 'w-6 h-6'
            )} />
          </div>
        )}
        
        {/* Text */}
        <div className="flex-1 min-w-0">
          {/* Value */}
          <p className={cn(
            "font-extrabold text-corporate-navy leading-tight",
            variant === 'compact' ? 'text-xl' : 'text-2xl sm:text-3xl'
          )}>
            {value}
          </p>
          
          {/* Label */}
          <p className={cn(
            "font-medium text-slate-500 dark:text-slate-400 truncate mt-1",
            variant === 'compact' ? 'text-xs' : 'text-sm'
          )}>
            {label}
          </p>
          
          {/* Trend */}
          {showTrend && (
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold",
                trendColor
              )}>
                <TrendIcon className="w-3 h-3" strokeWidth={3} />
                {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-xs text-slate-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Component>
  );
});

StatWidget.displayName = 'StatWidget';

/**
 * StatWidgetGrid - Responsive grid specifically for stat widgets
 * 
 * @example
 * <StatWidgetGrid>
 *   <StatWidget label="Users" value="1,234" />
 *   <StatWidget label="Revenue" value="$45K" />
 *   <StatWidget label="Orders" value="890" />
 * </StatWidgetGrid>
 */
const StatWidgetGrid = React.forwardRef(({ 
  children, 
  columns = 'auto',
  className,
  ...props 
}, ref) => {
  const columnClasses = {
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'grid gap-4',
        columnClasses[columns] || columnClasses.auto,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

StatWidgetGrid.displayName = 'StatWidgetGrid';

export { StatWidget, StatWidgetGrid };
