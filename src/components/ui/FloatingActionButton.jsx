import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * FloatingActionButton (FAB) - Primary action in thumb zone
 * 
 * Positioned at bottom-right for easy thumb access
 * Used for primary create/add actions on list screens
 */

const FloatingActionButton = React.forwardRef(({
  icon = <Plus className="h-6 w-6" />,
  label,
  onClick,
  variant = "primary",
  size = "md",
  position = "bottom-right",
  className,
  disabled,
  ...props
}, ref) => {
  const variantClasses = {
    primary: "bg-corporate-navy text-white hover:bg-corporate-navy/90 shadow-lg shadow-corporate-navy/25",
    secondary: "bg-white text-corporate-navy border-2 border-corporate-navy hover:bg-slate-50 shadow-lg",
    teal: "bg-corporate-teal text-white hover:bg-corporate-teal/90 shadow-lg shadow-corporate-teal/25",
    orange: "bg-corporate-orange text-white hover:bg-corporate-orange/90 shadow-lg shadow-corporate-orange/25",
  };

  const sizeClasses = {
    sm: "h-12 w-12 min-h-[48px] min-w-[48px]",
    md: "h-14 w-14 min-h-[56px] min-w-[56px]",
    lg: "h-16 w-16 min-h-[64px] min-w-[64px]",
  };

  const positionClasses = {
    "bottom-right": "fixed bottom-20 right-4 md:bottom-6 md:right-6",
    "bottom-center": "fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6",
    "bottom-left": "fixed bottom-20 left-4 md:bottom-6 md:left-6",
  };

  // Extended FAB (with label)
  if (label) {
    return (
      <button
        ref={ref}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-5 py-3 rounded-full",
          "font-medium text-sm",
          "transition-all duration-200 touch-manipulation",
          "active:scale-95",
          variantClasses[variant],
          positionClasses[position],
          disabled && "opacity-50 cursor-not-allowed",
          "z-40",
          className
        )}
        style={{ 
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        {...props}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  }

  // Standard circular FAB
  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center rounded-full",
        "transition-all duration-200 touch-manipulation",
        "active:scale-95",
        sizeClasses[size],
        variantClasses[variant],
        positionClasses[position],
        disabled && "opacity-50 cursor-not-allowed",
        "z-40",
        className
      )}
      style={{ 
        marginBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      aria-label={props['aria-label'] || 'Action button'}
      {...props}
    >
      {icon}
    </button>
  );
});

FloatingActionButton.displayName = "FloatingActionButton";

/**
 * SpeedDial - FAB with expandable actions
 */
const SpeedDial = React.forwardRef(({
  icon = <Plus className="h-6 w-6" />,
  actions = [],
  position = "bottom-right",
  className,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const positionClasses = {
    "bottom-right": "fixed bottom-20 right-4 md:bottom-6 md:right-6",
    "bottom-center": "fixed bottom-20 left-1/2 -translate-x-1/2 md:bottom-6",
    "bottom-left": "fixed bottom-20 left-4 md:bottom-6 md:left-6",
  };

  return (
    <div 
      ref={ref}
      className={cn(
        "flex flex-col-reverse items-center gap-3",
        positionClasses[position],
        "z-40",
        className
      )}
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      {...props}
    >
      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 min-h-[56px] min-w-[56px] flex items-center justify-center rounded-full",
          "bg-corporate-navy text-white hover:bg-corporate-navy/90",
          "shadow-lg shadow-corporate-navy/25",
          "transition-all duration-200 touch-manipulation",
          "active:scale-95",
          isOpen && "rotate-45"
        )}
      >
        {icon}
      </button>

      {/* Action buttons */}
      {isOpen && (
        <div className="flex flex-col-reverse items-center gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick?.();
                setIsOpen(false);
              }}
              className={cn(
                "h-12 w-12 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full",
                "bg-white text-slate-700 border border-slate-200",
                "shadow-md hover:shadow-lg",
                "transition-all duration-200 touch-manipulation",
                "active:scale-95",
                "animate-in fade-in slide-in-from-bottom-2"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              aria-label={action.label}
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}

      {/* Backdrop when open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
});

SpeedDial.displayName = "SpeedDial";

export { FloatingActionButton, SpeedDial };
