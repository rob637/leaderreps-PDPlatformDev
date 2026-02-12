import * as React from "react";
import { ChevronRight, MoreVertical } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * MobileCard - Card pattern for mobile list items
 * Replaces table rows with touch-friendly cards
 * 
 * Features:
 * - Full-width tap target
 * - Pressed state feedback
 * - Optional swipe actions (future)
 * - Avatar/icon support
 * - Multi-line content
 */

const MobileCard = React.forwardRef(({
  children,
  onClick,
  onLongPress,
  className,
  pressedClassName,
  disabled,
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = React.useState(false);
  const longPressTimer = React.useRef(null);
  
  const handleTouchStart = () => {
    if (disabled) return;
    setIsPressed(true);
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        setIsPressed(false);
      }, 500);
    }
  };
  
  const handleTouchEnd = () => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <div
      ref={ref}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={!disabled ? onClick : undefined}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      className={cn(
        "bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100",
        "transition-all duration-150 touch-manipulation",
        onClick && !disabled && [
          "cursor-pointer",
          "hover:border-slate-200 hover:shadow-sm",
          "active:scale-[0.98] active:bg-slate-50"
        ],
        isPressed && "scale-[0.98] bg-slate-50 dark:bg-slate-800",
        disabled && "opacity-50 cursor-not-allowed",
        className,
        isPressed && pressedClassName
      )}
      {...props}
    >
      {children}
    </div>
  );
});

MobileCard.displayName = "MobileCard";

/**
 * MobileCardHeader - Top section with title and optional actions
 */
const MobileCardHeader = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn("flex items-start justify-between gap-3 mb-2", className)}
    {...props}
  >
    {children}
  </div>
));

MobileCardHeader.displayName = "MobileCardHeader";

/**
 * MobileCardTitle - Main title text
 */
const MobileCardTitle = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold text-slate-900 dark:text-white leading-tight", className)}
    {...props}
  >
    {children}
  </h3>
));

MobileCardTitle.displayName = "MobileCardTitle";

/**
 * MobileCardDescription - Secondary text/subtitle
 */
const MobileCardDescription = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-slate-500 dark:text-slate-400 mt-1", className)}
    {...props}
  >
    {children}
  </p>
));

MobileCardDescription.displayName = "MobileCardDescription";

/**
 * MobileCardContent - Main content area
 */
const MobileCardContent = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
  >
    {children}
  </div>
));

MobileCardContent.displayName = "MobileCardContent";

/**
 * MobileCardFooter - Bottom section with metadata/actions
 */
const MobileCardFooter = React.forwardRef(({ 
  className, 
  children,
  ...props 
}, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100",
      className
    )}
    {...props}
  >
    {children}
  </div>
));

MobileCardFooter.displayName = "MobileCardFooter";

/**
 * MobileCardIcon - Leading icon/avatar container
 */
const MobileCardIcon = React.forwardRef(({ 
  className, 
  children,
  color = "slate",
  ...props 
}, ref) => {
  const colorClasses = {
    slate: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600",
    green: "bg-green-100 dark:bg-green-900/30 text-green-600",
    orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600",
    red: "bg-red-100 dark:bg-red-900/30 text-red-600",
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600",
    navy: "bg-corporate-navy/10 text-corporate-navy",
    teal: "bg-corporate-teal/10 text-corporate-teal",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
        colorClasses[color],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

MobileCardIcon.displayName = "MobileCardIcon";

/**
 * MobileCardBadge - Status badge/tag
 */
const MobileCardBadge = React.forwardRef(({ 
  className, 
  children,
  variant = "default",
  ...props 
}, ref) => {
  const variantClasses = {
    default: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    success: "bg-green-100 dark:bg-green-900/30 text-green-700",
    warning: "bg-orange-100 dark:bg-orange-900/30 text-orange-700",
    error: "bg-red-100 dark:bg-red-900/30 text-red-700",
    info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    premium: "bg-gradient-to-r from-corporate-navy to-corporate-teal text-white",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
});

MobileCardBadge.displayName = "MobileCardBadge";

/**
 * MobileCardChevron - Navigation indicator
 */
const MobileCardChevron = React.forwardRef(({ 
  className, 
  ...props 
}, ref) => (
  <ChevronRight
    ref={ref}
    className={cn("h-5 w-5 text-slate-400 flex-shrink-0", className)}
    {...props}
  />
));

MobileCardChevron.displayName = "MobileCardChevron";

/**
 * MobileCardMenu - More actions button
 */
const MobileCardMenu = React.forwardRef(({ 
  className,
  onClick,
  ...props 
}, ref) => (
  <button
    ref={ref}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(e);
    }}
    className={cn(
      "p-2 min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center",
      "rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100",
      "transition-all duration-150 touch-manipulation active:scale-95",
      className
    )}
    {...props}
  >
    <MoreVertical className="h-5 w-5" />
  </button>
));

MobileCardMenu.displayName = "MobileCardMenu";

/**
 * MobileCardRow - Horizontal layout with icon, content, and action
 */
const MobileCardRow = React.forwardRef(({ 
  icon,
  iconColor,
  title,
  description,
  badge,
  badgeVariant,
  showChevron = true,
  onClick,
  className,
  children,
  ...props 
}, ref) => (
  <MobileCard ref={ref} onClick={onClick} className={className} {...props}>
    <div className="flex items-center gap-3">
      {icon && (
        <MobileCardIcon color={iconColor}>
          {icon}
        </MobileCardIcon>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <MobileCardTitle className="truncate">{title}</MobileCardTitle>
          {badge && (
            <MobileCardBadge variant={badgeVariant}>{badge}</MobileCardBadge>
          )}
        </div>
        {description && (
          <MobileCardDescription className="truncate">{description}</MobileCardDescription>
        )}
        {children}
      </div>
      {showChevron && onClick && <MobileCardChevron />}
    </div>
  </MobileCard>
));

MobileCardRow.displayName = "MobileCardRow";

/**
 * MobileCardStack - Vertical stack of cards with consistent spacing
 */
const MobileCardStack = React.forwardRef(({ 
  className, 
  children,
  gap = "sm",
  ...props 
}, ref) => {
  const gapClasses = {
    xs: "space-y-2",
    sm: "space-y-3",
    md: "space-y-4",
    lg: "space-y-6",
  };

  return (
    <div
      ref={ref}
      className={cn(gapClasses[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
});

MobileCardStack.displayName = "MobileCardStack";

export {
  MobileCard,
  MobileCardHeader,
  MobileCardTitle,
  MobileCardDescription,
  MobileCardContent,
  MobileCardFooter,
  MobileCardIcon,
  MobileCardBadge,
  MobileCardChevron,
  MobileCardMenu,
  MobileCardRow,
  MobileCardStack,
};
