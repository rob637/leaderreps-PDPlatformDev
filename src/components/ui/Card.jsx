import React from 'react';
import { cn } from '../../lib/utils';

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
  // These must be full class names to be picked up by the scanner
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

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      ref={ref}
      onClick={onClick}
      className={cn(
        'rounded-2xl overflow-hidden text-left w-full',
        variants[variant],
        accents[accent],
        className
      )}
      {...props}
    >
      {(title || Icon) && (
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            {Icon && <Icon className={cn("w-6 h-6", iconColors[accent])} />}
            {title && (
              <h3 className="text-lg font-bold text-corporate-navy tracking-tight">
                {title}
              </h3>
            )}
          </div>
        </div>
      )}
      <div className="p-6 pt-4">
        {children}
      </div>
    </Component>
  );
});

Card.displayName = 'Card';

export { Card };
