// src/components/ui/Tabs.jsx
// Standardized Tab Navigation Component
// Use this for all tabbed interfaces

import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

/**
 * Tabs Context for managing tab state
 */
const TabsContext = createContext(null);

/**
 * Tabs - Container for tabbed interface
 * 
 * @example Basic usage
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">First Tab</TabsTrigger>
 *     <TabsTrigger value="tab2">Second Tab</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">First content</TabsContent>
 *   <TabsContent value="tab2">Second content</TabsContent>
 * </Tabs>
 * 
 * @example Controlled mode
 * <Tabs value={activeTab} onValueChange={setActiveTab}>
 *   ...
 * </Tabs>
 */
const Tabs = React.forwardRef(({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}, ref) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;
  
  const handleValueChange = (newValue) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
});

Tabs.displayName = 'Tabs';

/**
 * TabsList - Container for tab triggers
 */
const TabsList = React.forwardRef(({
  children,
  className,
  variant = 'default',
  ...props
}, ref) => {
  const variants = {
    default: 'bg-slate-100 p-1 rounded-xl',
    underline: 'border-b border-slate-200',
    pills: 'gap-2',
  };

  return (
    <div
      ref={ref}
      role="tablist"
      className={cn(
        'flex items-center',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

TabsList.displayName = 'TabsList';

/**
 * TabsTrigger - Individual tab button
 */
const TabsTrigger = React.forwardRef(({
  value,
  children,
  className,
  disabled = false,
  icon: Icon,
  badge,
  variant = 'default',
  ...props
}, ref) => {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  const variants = {
    default: cn(
      'px-4 py-2 text-sm font-medium rounded-lg transition-all',
      isActive
        ? 'bg-white text-corporate-navy shadow-sm'
        : 'text-slate-600 hover:text-corporate-navy hover:bg-white/50',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    underline: cn(
      'px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
      isActive
        ? 'border-corporate-teal text-corporate-navy'
        : 'border-transparent text-slate-500 hover:text-corporate-navy hover:border-slate-300',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
    pills: cn(
      'px-4 py-2 text-sm font-medium rounded-full transition-all',
      isActive
        ? 'bg-corporate-teal text-white'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      disabled && 'opacity-50 cursor-not-allowed'
    ),
  };

  return (
    <button
      ref={ref}
      role="tab"
      type="button"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && context?.onValueChange(value)}
      className={cn(
        'flex items-center gap-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {children}
      {badge && (
        <span className={cn(
          'ml-1.5 px-1.5 py-0.5 text-xs font-bold rounded-full',
          isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
        )}>
          {badge}
        </span>
      )}
    </button>
  );
});

TabsTrigger.displayName = 'TabsTrigger';

/**
 * TabsContent - Content panel for each tab
 */
const TabsContent = React.forwardRef(({
  value,
  children,
  className,
  ...props
}, ref) => {
  const context = useContext(TabsContext);
  const isActive = context?.value === value;

  if (!isActive) return null;

  return (
    <div
      ref={ref}
      role="tabpanel"
      className={cn('mt-4 focus:outline-none', className)}
      tabIndex={0}
      {...props}
    >
      {children}
    </div>
  );
});

TabsContent.displayName = 'TabsContent';

/**
 * Simple TabButton - Standalone tab button for simpler use cases
 * (Backward compatible with existing TabButton)
 */
const TabButton = React.forwardRef(({
  active,
  onClick,
  label,
  icon: Icon,
  minimized = false,
  className,
  ...props
}, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={cn(
      'px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2',
      active
        ? 'bg-corporate-teal text-white shadow-sm'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
      minimized && 'px-3',
      className
    )}
    {...props}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {!minimized && label}
  </button>
));

TabButton.displayName = 'TabButton';

export { Tabs, TabsList, TabsTrigger, TabsContent, TabButton };
