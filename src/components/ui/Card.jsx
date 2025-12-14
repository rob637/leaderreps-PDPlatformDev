import React from 'react';
import { cn } from '../../lib/utils';

// --- COMPOSABLE COMPONENTS ---
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, icon: Icon, iconColor, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold leading-none tracking-tight flex items-center gap-2", className)}
    {...props}
  >
    {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// --- SMART CARD (Legacy/Convenience Wrapper) ---
const Card = React.forwardRef(({ 
  className, 
  variant = 'default', 
  accent = 'none',
  title,
  icon: Icon,
  children,
  onClick,
  ...props 
}, ref) => {
  
  const variants = {
    default: 'bg-white border border-slate-200 shadow-sm',
    elevated: 'bg-white border-none shadow-xl',
    flat: 'bg-slate-50 border border-slate-200 shadow-none',
    interactive: 'bg-white border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-shadow',
  };

  // Map accents to specific border-top colors using Tailwind classes
  const accents = {
    none: '',
    navy: 'border-t-4 border-t-corporate-navy',
    teal: 'border-t-4 border-t-corporate-teal',
    orange: 'border-t-4 border-t-corporate-orange',
    
    // Remap standard colors to Corporate Palette
    red: 'border-t-4 border-t-corporate-orange',
    green: 'border-t-4 border-t-corporate-teal',
    blue: 'border-t-4 border-t-corporate-navy',
    yellow: 'border-t-4 border-t-corporate-orange',
    purple: 'border-t-4 border-t-corporate-navy',
    indigo: 'border-t-4 border-t-corporate-navy',
    pink: 'border-t-4 border-t-corporate-orange',
    gray: 'border-t-4 border-t-slate-400',

    // Support uppercase too
    NAVY: 'border-t-4 border-t-corporate-navy',
    TEAL: 'border-t-4 border-t-corporate-teal',
    ORANGE: 'border-t-4 border-t-corporate-orange',
    
    // Remap uppercase standard colors
    RED: 'border-t-4 border-t-corporate-orange',
    GREEN: 'border-t-4 border-t-corporate-teal',
    BLUE: 'border-t-4 border-t-corporate-navy',
    YELLOW: 'border-t-4 border-t-corporate-orange',
    PURPLE: 'border-t-4 border-t-corporate-navy',
    INDIGO: 'border-t-4 border-t-corporate-navy',
    PINK: 'border-t-4 border-t-corporate-orange',
    GRAY: 'border-t-4 border-t-slate-400',
  };

  const iconColors = {
    none: 'text-corporate-navy',
    navy: 'text-corporate-navy',
    teal: 'text-corporate-teal',
    orange: 'text-corporate-orange',
    
    // Remap standard colors
    red: 'text-corporate-orange',
    green: 'text-corporate-teal',
    blue: 'text-corporate-navy',
    yellow: 'text-corporate-orange',
    purple: 'text-corporate-navy',
    indigo: 'text-corporate-navy',
    pink: 'text-corporate-orange',
    gray: 'text-slate-400',
    
    NAVY: 'text-corporate-navy',
    TEAL: 'text-corporate-teal',
    ORANGE: 'text-corporate-orange',
    
    // Remap uppercase standard colors
    RED: 'text-corporate-orange',
    GREEN: 'text-corporate-teal',
    BLUE: 'text-corporate-navy',
    YELLOW: 'text-corporate-orange',
    PURPLE: 'text-corporate-navy',
    INDIGO: 'text-corporate-navy',
    PINK: 'text-corporate-orange',
    GRAY: 'text-slate-400',
  };

  const Component = onClick ? 'button' : 'div';

  // Strategy: If title or Icon is provided, use the "Smart" layout.
  // If not, just render children inside the container (acting as a wrapper).
  
  const isSmartMode = !!(title || Icon);
  const hasContent = React.Children.count(children) > 0;

  return (
    <Component
      ref={ref}
      onClick={onClick}
      className={cn(
        'rounded-2xl overflow-hidden text-left w-full',
        variants[variant],
        accents[accent],
        onClick && 'touch-manipulation active:scale-[0.99] transition-transform',
        className
      )}
      {...props}
    >
      {isSmartMode ? (
        <>
          <div className={cn("p-4 sm:p-4", hasContent ? "pb-2" : "")}>
            <div className="flex items-center gap-2">
              {Icon && <Icon className={cn("w-5 h-5", iconColors[accent])} />}
              {title && (
                <h3 className="text-lg font-bold text-corporate-navy tracking-tight">
                  {title}
                </h3>
              )}
            </div>
          </div>
          {hasContent && (
            <div className="p-4 sm:p-4 pt-2">
              {children}
            </div>
          )}
        </>
      ) : (
        children
      )}
    </Component>
  );
});

Card.displayName = 'Card';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
