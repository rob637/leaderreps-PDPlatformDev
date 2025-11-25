// src/components/ui/WidgetCard.jsx
// Standardized Widget Layout Component
// Use this for all dashboard widgets, feature cards, and content blocks

import React from 'react';
import { cn } from '../../lib/utils';
import { Loader, AlertCircle, ChevronRight } from 'lucide-react';

/**
 * WidgetCard - Standardized widget container for dashboards and feature displays
 * 
 * @example Basic usage
 * <WidgetCard title="Daily Tasks" icon={CheckCircle} accent="teal">
 *   <TaskList tasks={tasks} />
 * </WidgetCard>
 * 
 * @example With action button
 * <WidgetCard 
 *   title="Recent Activity" 
 *   icon={Activity} 
 *   accent="navy"
 *   action={{ label: "View All", onClick: () => navigate('/activity') }}
 * >
 *   <ActivityList />
 * </WidgetCard>
 * 
 * @example Loading state
 * <WidgetCard title="Stats" icon={BarChart} isLoading>
 *   {content}
 * </WidgetCard>
 * 
 * @example Empty state
 * <WidgetCard 
 *   title="Notifications" 
 *   icon={Bell}
 *   isEmpty={notifications.length === 0}
 *   emptyMessage="No new notifications"
 * >
 *   <NotificationList />
 * </WidgetCard>
 */
const WidgetCard = React.forwardRef(({
  // Core props
  title,
  subtitle,
  icon: Icon,
  children,
  className,
  
  // Styling
  accent = 'navy',
  variant = 'default',
  noPadding = false,
  
  // States
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available',
  emptyIcon: EmptyIcon,
  error = null,
  
  // Action
  action,
  onClick,
  
  ...props
}, ref) => {
  
  // Accent color mapping (matches Card.jsx)
  const accents = {
    none: '',
    navy: 'border-t-4 border-t-corporate-navy',
    teal: 'border-t-4 border-t-corporate-teal',
    orange: 'border-t-4 border-t-corporate-orange',
    red: 'border-t-4 border-t-red-500',
    green: 'border-t-4 border-t-green-500',
    blue: 'border-t-4 border-t-blue-500',
    yellow: 'border-t-4 border-t-yellow-500',
    purple: 'border-t-4 border-t-purple-500',
  };
  
  const iconColors = {
    none: 'text-corporate-navy',
    navy: 'text-corporate-navy',
    teal: 'text-corporate-teal',
    orange: 'text-corporate-orange',
    red: 'text-red-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
    purple: 'text-purple-500',
  };

  const variants = {
    default: 'bg-white border border-slate-200 shadow-sm',
    elevated: 'bg-white border-none shadow-lg',
    flat: 'bg-slate-50 border border-slate-200 shadow-none',
    interactive: 'bg-white border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-shadow',
  };

  const Component = onClick ? 'button' : 'div';
  const actualVariant = onClick ? 'interactive' : variant;

  return (
    <Component
      ref={ref}
      onClick={onClick}
      className={cn(
        'rounded-2xl overflow-hidden text-left w-full',
        variants[actualVariant],
        accents[accent],
        className
      )}
      {...props}
    >
      {/* Header */}
      {(title || Icon || action) && (
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                `bg-${accent === 'navy' ? 'corporate-navy' : accent === 'teal' ? 'corporate-teal' : accent === 'orange' ? 'corporate-orange' : accent}-100`,
                "bg-opacity-10"
              )}
              style={{ backgroundColor: `var(--corporate-${accent}-10, rgba(0,0,0,0.05))` }}
              >
                <Icon className={cn("w-5 h-5", iconColors[accent])} />
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-base font-bold text-corporate-navy">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          {action && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                action.onClick?.();
              }}
              className="text-sm font-medium text-corporate-teal hover:text-corporate-navy transition-colors flex items-center gap-1"
            >
              {action.label}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className={cn(noPadding ? '' : 'px-5 pb-5')}>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 text-corporate-teal animate-spin" />
          </div>
        )}
        
        {/* Error State */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        {/* Empty State */}
        {!isLoading && !error && isEmpty && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            {EmptyIcon && <EmptyIcon className="w-8 h-8 text-slate-300 mb-2" />}
            <p className="text-sm text-slate-400">{emptyMessage}</p>
          </div>
        )}
        
        {/* Normal Content */}
        {!isLoading && !error && !isEmpty && children}
      </div>
    </Component>
  );
});

WidgetCard.displayName = 'WidgetCard';

/**
 * WidgetHeader - Standalone header for custom widget layouts
 */
const WidgetHeader = React.forwardRef(({ 
  title, 
  subtitle,
  icon: Icon, 
  accent = 'navy',
  action,
  className,
  ...props 
}, ref) => {
  const iconColors = {
    navy: 'text-corporate-navy',
    teal: 'text-corporate-teal',
    orange: 'text-corporate-orange',
    red: 'text-red-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
  };

  return (
    <div 
      ref={ref}
      className={cn("flex items-center justify-between mb-4", className)}
      {...props}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `var(--corporate-${accent}-10, rgba(0,0,0,0.05))` }}
          >
            <Icon className={cn("w-5 h-5", iconColors[accent])} />
          </div>
        )}
        <div>
          {title && <h3 className="text-base font-bold text-corporate-navy">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-corporate-teal hover:text-corporate-navy transition-colors flex items-center gap-1"
        >
          {action.label}
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
});

WidgetHeader.displayName = 'WidgetHeader';

/**
 * WidgetGrid - Responsive grid layout for widget collections
 * 
 * @example
 * <WidgetGrid columns={3}>
 *   <WidgetCard title="Widget 1" />
 *   <WidgetCard title="Widget 2" />
 *   <WidgetCard title="Widget 3" />
 * </WidgetGrid>
 */
const WidgetGrid = React.forwardRef(({ 
  children, 
  columns = 2, 
  gap = 'default',
  className,
  ...props 
}, ref) => {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    none: 'gap-0',
    sm: 'gap-2',
    default: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'grid',
        columnClasses[columns] || columnClasses[2],
        gapClasses[gap] || gapClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

WidgetGrid.displayName = 'WidgetGrid';

export { WidgetCard, WidgetHeader, WidgetGrid };
