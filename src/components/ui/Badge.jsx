import React from 'react';
import { cn } from '../../lib/utils';

const Badge = ({ 
  className, 
  variant = 'default', 
  children, 
  ...props 
}) => {
  const variants = {
    default: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
    primary: 'bg-corporate-teal/10 text-corporate-teal',
    secondary: 'bg-corporate-orange/10 text-corporate-orange',
    navy: 'bg-corporate-navy/10 text-corporate-navy',
    success: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700',
    warning: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700',
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-700',
    outline: 'bg-transparent border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400',
    premium: 'bg-gradient-to-r from-corporate-teal/10 to-corporate-orange/10 text-corporate-navy',
  };

  return (
    <div className={cn(
      'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors',
      variants[variant],
      className
    )} style={{ fontFamily: 'var(--font-body)' }} {...props}>
      {children}
    </div>
  );
};

export { Badge };
