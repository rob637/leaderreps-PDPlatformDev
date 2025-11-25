import React from 'react';
import { cn } from '../../lib/utils';

const ProgressBar = React.forwardRef(({ 
  progress = 0, 
  variant = 'default',
  size = 'md',
  showLabel = false, 
  className, 
  ...props 
}, ref) => {
  const progressPercent = Math.max(0, Math.min(100, progress));
  
  const variants = {
    default: 'bg-corporate-teal',
    success: 'bg-green-500',
    warning: 'bg-corporate-orange',
    danger: 'bg-red-500',
    navy: 'bg-corporate-navy',
  };

  const trackColors = {
    default: 'bg-slate-200',
    success: 'bg-green-100',
    warning: 'bg-orange-100',
    danger: 'bg-red-100',
    navy: 'bg-slate-200',
  };

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
    xl: 'h-4',
  };

  return (
    <div ref={ref} className={cn('relative w-full', className)} {...props}>
      <div className={cn('w-full rounded-full overflow-hidden', trackColors[variant], sizes[size])}>
        <div 
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variants[variant])}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn(
          'absolute right-0 -top-5 text-xs font-semibold',
          progressPercent >= 100 ? 'text-green-600' : 'text-corporate-teal'
        )}>
          {Math.round(progressPercent)}%
        </span>
      )}
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

export { ProgressBar };
