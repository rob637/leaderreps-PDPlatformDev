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
  
  const variants = {
    primary: 'bg-corporate-teal text-white hover:bg-corporate-teal-dark shadow-md hover:shadow-lg border border-transparent',
    secondary: 'bg-corporate-orange text-white hover:bg-orange-700 shadow-md hover:shadow-lg border border-transparent',
    outline: 'bg-white text-corporate-teal border-2 border-corporate-teal hover:bg-teal-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-corporate-navy',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md',
    link: 'text-corporate-teal underline-offset-4 hover:underline p-0 h-auto font-normal',
    'nav-active': 'bg-corporate-teal text-white shadow-sm',
    'nav-inactive': 'text-gray-300 hover:bg-white/5 hover:text-white bg-transparent',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-8 text-base',
    icon: 'h-10 w-10 p-2 flex items-center justify-center',
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export { Button };
