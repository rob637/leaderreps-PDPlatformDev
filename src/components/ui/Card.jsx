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
  
  // Premium variants with softer shadows and no hard borders
  const variants = {
    default: 'bg-white shadow-sm hover:shadow-md border-0',
    elevated: 'bg-white shadow-lg border-0',
    flat: 'bg-slate-50/80 shadow-none border-0',
    interactive: 'bg-white shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200 border-0',
    soft: 'bg-white/90 backdrop-blur-sm shadow-md border-0',
    glass: 'bg-white/80 backdrop-blur-md shadow-md border border-white/50',
  };

  // Subtle accent indicators - use left border instead of top for elegance
  const accents = {
    none: '',
    navy: 'border-l-4 border-l-corporate-navy',
    teal: 'border-l-4 border-l-corporate-teal',
    orange: 'border-l-4 border-l-corporate-orange',
    
    // Remap standard colors to Corporate Palette
    red: 'border-l-4 border-l-corporate-orange',
    green: 'border-l-4 border-l-corporate-teal',
    blue: 'border-l-4 border-l-corporate-navy',
    yellow: 'border-l-4 border-l-corporate-orange',
    purple: 'border-l-4 border-l-corporate-navy',
    indigo: 'border-l-4 border-l-corporate-navy',
    pink: 'border-l-4 border-l-corporate-orange',
    gray: 'border-l-4 border-l-slate-300',

    // Support uppercase too
    NAVY: 'border-l-4 border-l-corporate-navy',
    TEAL: 'border-l-4 border-l-corporate-teal',
    ORANGE: 'border-l-4 border-l-corporate-orange',
    
    // Remap uppercase standard colors
    RED: 'border-l-4 border-l-corporate-orange',
    GREEN: 'border-l-4 border-l-corporate-teal',
    BLUE: 'border-l-4 border-l-corporate-navy',
    YELLOW: 'border-l-4 border-l-corporate-orange',
    PURPLE: 'border-l-4 border-l-corporate-navy',
    INDIGO: 'border-l-4 border-l-corporate-navy',
    PINK: 'border-l-4 border-l-corporate-orange',
    GRAY: 'border-l-4 border-l-slate-300',
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
        'rounded-2xl overflow-hidden text-left w-full transition-all duration-200',
        variants[variant],
        accents[accent],
        onClick && 'touch-manipulation active:scale-[0.98] cursor-pointer',
        className
      )}
      {...props}
    >
      {isSmartMode ? (
        <>
          <div className={cn("p-5 sm:p-6", hasContent ? "pb-3" : "")}>
            <div className="flex items-center gap-3">
              {Icon && <Icon className={cn("w-5 h-5 flex-shrink-0", iconColors[accent])} />}
              {title && (
                <h3 className="text-lg font-semibold text-corporate-navy tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  {title}
                </h3>
              )}
            </div>
          </div>
          {hasContent && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
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
