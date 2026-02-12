import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

const Select = React.forwardRef(({ 
  className, 
  options = [], 
  placeholder = 'Select...',
  value,
  onChange,
  disabled,
  size = 'md',
  ...props 
}, ref) => {

  const sizes = {
    sm: 'h-11 min-h-[44px] px-3 text-sm',
    md: 'h-12 min-h-[48px] px-4 text-base',
    lg: 'h-14 min-h-[56px] px-5 text-lg',
  };

  return (
    <div className="relative">
      <select
        ref={ref}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          'w-full appearance-none rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pr-10 font-medium text-corporate-navy',
          'transition-all duration-150 touch-manipulation',
          'focus:outline-none focus:ring-2 focus:ring-corporate-teal focus:border-transparent',
          'disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed',
          sizes[size],
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  );
});

Select.displayName = 'Select';

export { Select };
