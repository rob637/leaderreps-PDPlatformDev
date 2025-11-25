import React from 'react';
import { cn } from '../../lib/utils';

const Badge = ({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-800',
    primary: 'bg-corporate-teal/10 text-corporate-teal',
    secondary: 'bg-corporate-orange/10 text-corporate-orange',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    outline: 'bg-transparent border border-slate-200 text-slate-600',
  };

  return (
    <div className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      variants[variant],
      className
    )} {...props}>
      {children}
    </div>
  );
};

export { Badge };
