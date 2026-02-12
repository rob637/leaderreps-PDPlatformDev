import React from 'react';
import { cn } from '../../lib/utils';
import { Loader } from 'lucide-react';

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  isLoading = false, 
  disabled, 
  children, 
  type = 'button',
  ...props 
}, ref) => {
  
  // Premium button variants with subtle shadows and refined colors
  const variants = {
    primary: 'bg-corporate-teal text-white hover:bg-corporate-subtle-teal shadow-sm hover:shadow-md border-0',
    secondary: 'bg-corporate-orange text-white hover:bg-orange-700 shadow-sm hover:shadow-md border-0',
    outline: 'bg-white dark:bg-slate-800 text-corporate-teal border-2 border-corporate-teal/30 hover:border-corporate-teal hover:bg-teal-50/50',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 hover:text-corporate-navy',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    link: 'text-corporate-teal underline-offset-4 hover:underline p-0 h-auto font-medium',
    'nav-active': 'bg-corporate-teal text-white shadow-sm',
    'nav-inactive': 'text-gray-300 hover:bg-white/5 hover:text-white bg-transparent',
    'nav-back': 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:bg-slate-50 hover:shadow-md',
    soft: 'bg-slate-100/80 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 border-0',
  };

  const sizes = {
    sm: 'h-10 min-h-[40px] px-4 text-sm',
    md: 'h-11 min-h-[44px] px-5 py-2 text-sm',
    lg: 'h-12 min-h-[48px] px-6 text-base',
    icon: 'h-10 w-10 min-h-[40px] min-w-[40px] p-2 flex items-center justify-center',
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all duration-200 touch-manipulation',
        'active:scale-[0.97]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal/50 focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      style={{ fontFamily: 'var(--font-body)' }}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
      {isLoading && <span className="sr-only">Loading...</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
