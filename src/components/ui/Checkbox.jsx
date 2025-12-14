import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

const Checkbox = React.forwardRef(({ className, checked, onCheckedChange, label, subLabel, disabled, ...props }, ref) => {
  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 min-h-[48px] rounded-xl border-2 transition-all duration-150 cursor-pointer group touch-manipulation",
        "active:scale-[0.98] active:opacity-90",
        checked 
          ? "bg-teal-50 border-corporate-teal" 
          : "bg-white border-slate-200 hover:border-corporate-teal/50",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
    >
      {/* Visual checkbox is 20px but tap target is the full row */}
      <div 
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors",
          checked 
            ? "bg-corporate-teal border-corporate-teal text-white" 
            : "border-slate-300 bg-white group-hover:border-corporate-teal/50"
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" />}
      </div>
      <div className="flex-1">
        {label && (
          <p className={cn(
            "text-sm font-semibold leading-none select-none",
            checked ? "text-teal-900" : "text-slate-700"
          )}>
            {label}
          </p>
        )}
        {subLabel && (
          <p className="text-xs text-slate-500 mt-1 select-none">
            {subLabel}
          </p>
        )}
      </div>
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
