import * as React from "react";
import { Trash2, Edit, Star, Archive, MoreHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * SwipeableRow - Row with swipe-to-reveal actions
 * 
 * Common pattern in native apps for contextual actions
 * Swipe left to reveal delete/archive, swipe right for quick actions
 */

const SwipeableRow = React.forwardRef(({
  children,
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  threshold = 80,
  className,
  disabled,
  ...props
}, ref) => {
  const rowRef = React.useRef(null);
  const [translateX, setTranslateX] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const startX = React.useRef(0);
  const currentX = React.useRef(0);

  const maxLeftSwipe = rightActions.length > 0 ? rightActions.length * 80 : 0;
  const maxRightSwipe = leftActions.length > 0 ? leftActions.length * 80 : 0;

  const handleTouchStart = (e) => {
    if (disabled) return;
    setIsDragging(true);
    startX.current = e.touches[0].clientX - translateX;
  };

  const handleTouchMove = (e) => {
    if (!isDragging || disabled) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    
    // Limit the swipe distance with rubber band effect
    let newTranslate = diff;
    if (diff > maxRightSwipe) {
      newTranslate = maxRightSwipe + (diff - maxRightSwipe) * 0.2;
    } else if (diff < -maxLeftSwipe) {
      newTranslate = -maxLeftSwipe + (diff + maxLeftSwipe) * 0.2;
    }
    
    setTranslateX(newTranslate);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    // Snap to reveal actions or reset
    if (translateX < -threshold && rightActions.length > 0) {
      setTranslateX(-maxLeftSwipe);
      onSwipeLeft?.();
    } else if (translateX > threshold && leftActions.length > 0) {
      setTranslateX(maxRightSwipe);
      onSwipeRight?.();
    } else {
      setTranslateX(0);
    }
  };

  const resetPosition = () => {
    setTranslateX(0);
  };

  // Click outside to reset
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (rowRef.current && !rowRef.current.contains(e.target) && translateX !== 0) {
        resetPosition();
      }
    };

    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [translateX]);

  return (
    <div 
      ref={rowRef}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {/* Left actions (revealed by swiping right) */}
      {leftActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex">
          {leftActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick?.();
                resetPosition();
              }}
              className={cn(
                "w-20 flex flex-col items-center justify-center gap-1",
                "text-white text-xs font-medium",
                "transition-colors touch-manipulation",
                action.color || "bg-corporate-teal"
              )}
            >
              {action.icon}
              {action.label && <span>{action.label}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Right actions (revealed by swiping left) */}
      {rightActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex">
          {rightActions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick?.();
                resetPosition();
              }}
              className={cn(
                "w-20 flex flex-col items-center justify-center gap-1",
                "text-white text-xs font-medium",
                "transition-colors touch-manipulation",
                action.color || "bg-red-500"
              )}
            >
              {action.icon}
              {action.label && <span>{action.label}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      <div
        ref={ref}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative bg-white",
          !isDragging && "transition-transform duration-200 ease-out"
        )}
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {children}
      </div>
    </div>
  );
});

SwipeableRow.displayName = "SwipeableRow";

/**
 * Pre-configured swipe action presets
 */
const SwipeActions = {
  delete: (onClick) => ({
    icon: <Trash2 className="h-5 w-5" />,
    label: "Delete",
    color: "bg-red-500",
    onClick,
  }),
  edit: (onClick) => ({
    icon: <Edit className="h-5 w-5" />,
    label: "Edit",
    color: "bg-blue-500",
    onClick,
  }),
  archive: (onClick) => ({
    icon: <Archive className="h-5 w-5" />,
    label: "Archive",
    color: "bg-slate-500",
    onClick,
  }),
  favorite: (onClick) => ({
    icon: <Star className="h-5 w-5" />,
    label: "Favorite",
    color: "bg-yellow-500",
    onClick,
  }),
  more: (onClick) => ({
    icon: <MoreHorizontal className="h-5 w-5" />,
    label: "More",
    color: "bg-slate-400",
    onClick,
  }),
};

export { SwipeableRow, SwipeActions };
