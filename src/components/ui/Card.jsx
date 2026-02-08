import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { Info, X } from 'lucide-react';

// --- INFO TOOLTIP COMPONENT ---
const InfoTooltip = ({ text, onClose }) => (
  <div className="absolute top-full left-0 right-0 mt-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
    <div className="bg-blue-50 text-slate-700 text-sm rounded-xl p-4 shadow-lg border border-blue-200 mx-2 relative">
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 p-1 hover:bg-blue-100 rounded-full transition-colors bg-transparent"
        aria-label="Close"
      >
        <X className="w-3.5 h-3.5 text-slate-500" />
      </button>
      <p className="pr-6 leading-relaxed">{text}</p>
    </div>
  </div>
);

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
  helpText, // New: Optional help text for info icon
  children,
  onClick,
  ...props 
}, ref) => {
  const [showHelp, setShowHelp] = useState(false);
  
  // Premium variants with softer shadows and no hard borders
  // Use border-y-0 + border-r-0 to preserve accent border-l when present
  const variants = {
    default: 'bg-white dark:bg-slate-800 shadow-sm hover:shadow-md border-y-0 border-r-0',
    elevated: 'bg-white dark:bg-slate-800 shadow-lg border-y-0 border-r-0',
    flat: 'bg-slate-50/80 dark:bg-slate-800/80 shadow-none border-y-0 border-r-0',
    interactive: 'bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg cursor-pointer transition-all duration-200 border-y-0 border-r-0',
    soft: 'bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md border-y-0 border-r-0',
    glass: 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-md border border-white/50 dark:border-slate-600/50',
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
    GOLD: 'border-l-4 border-l-corporate-gold',
    gold: 'border-l-4 border-l-corporate-gold',
    
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
    GOLD: 'text-corporate-gold',
    gold: 'text-corporate-gold',
    
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
        'rounded-2xl text-left w-full transition-all duration-200',
        onClick && 'appearance-none border-none', // Reset button defaults
        variants[variant],
        accents[accent],
        onClick && 'touch-manipulation active:scale-[0.98] cursor-pointer',
        className
      )}
      {...props}
    >
      {isSmartMode ? (
        <>
          <div className={cn("p-5 sm:p-6 relative", hasContent ? "pb-3" : "")}>
            <div className="flex items-center gap-3">
              {Icon && <Icon className={cn("w-5 h-5 flex-shrink-0", iconColors[accent])} />}
              {title && (
                <h3 className="text-lg font-semibold text-corporate-navy dark:text-white tracking-tight flex-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  {title}
                </h3>
              )}
              {helpText && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowHelp(!showHelp); }}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                  aria-label="Widget information"
                >
                  <Info className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            {showHelp && helpText && (
              <InfoTooltip text={helpText} onClose={() => setShowHelp(false)} />
            )}
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
