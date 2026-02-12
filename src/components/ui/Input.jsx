import React from 'react';
import { cn } from '../../lib/utils';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 min-h-[48px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base touch-manipulation",
        "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal/50 focus-visible:border-corporate-teal",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
        "transition-all duration-200 hover:border-slate-300",
        className
      )}
      style={{ fontFamily: 'var(--font-body)' }}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-base touch-manipulation",
        "ring-offset-white placeholder:text-slate-400",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-corporate-teal/50 focus-visible:border-corporate-teal",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
        "transition-all duration-200 hover:border-slate-300 resize-none",
        className
      )}
      style={{ fontFamily: 'var(--font-body)' }}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Input, Textarea };
