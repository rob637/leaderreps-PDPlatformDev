import * as React from "react";
import { X, GripHorizontal } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * BottomSheet - Native-feeling modal that slides up from bottom
 * 
 * Features:
 * - Drag to dismiss (swipe down)
 * - Snap points (partial/full height)
 * - Touch-optimized close button
 * - Backdrop tap to close
 * - Safe area padding for notched devices
 */

const BottomSheet = React.forwardRef(({
  open,
  onClose,
  title,
  children,
  snapPoints = ['50%', '90%'],
  initialSnap = 0,
  showHandle = true,
  showCloseButton = true,
  className,
  contentClassName,
  ...props
}, ref) => {
  const [currentSnap, setCurrentSnap] = React.useState(initialSnap);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState(0);
  const sheetRef = React.useRef(null);
  const startY = React.useRef(0);
  const startHeight = React.useRef(0);

  // Parse snap point to pixels
  const getSnapHeight = (snap) => {
    if (typeof snap === 'number') return snap;
    if (snap.endsWith('%')) {
      return (parseInt(snap) / 100) * window.innerHeight;
    }
    return parseInt(snap);
  };

  const currentHeight = getSnapHeight(snapPoints[currentSnap]);

  // Handle drag start
  const handleDragStart = (e) => {
    setIsDragging(true);
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    startY.current = clientY;
    startHeight.current = currentHeight;
  };

  // Handle drag move
  const handleDragMove = React.useCallback((e) => {
    if (!isDragging) return;
    
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const delta = clientY - startY.current;
    setDragOffset(Math.max(0, delta)); // Only allow dragging down
  }, [isDragging]);

  // Handle drag end
  const handleDragEnd = React.useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const threshold = 100; // pixels to trigger dismiss
    
    if (dragOffset > threshold) {
      // Check if we should snap to lower point or close
      if (currentSnap > 0) {
        setCurrentSnap(currentSnap - 1);
      } else {
        onClose?.();
      }
    } else if (dragOffset < -threshold && currentSnap < snapPoints.length - 1) {
      // Snap to higher point
      setCurrentSnap(currentSnap + 1);
    }
    
    setDragOffset(0);
  }, [isDragging, dragOffset, currentSnap, snapPoints.length, onClose]);

  // Add/remove event listeners
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Reset snap when closed
  React.useEffect(() => {
    if (!open) {
      setCurrentSnap(initialSnap);
      setDragOffset(0);
    }
  }, [open, initialSnap]);

  // Prevent body scroll when open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const sheetHeight = Math.max(0, currentHeight - dragOffset);

  return (
    <div className="fixed inset-0 z-50" ref={ref} {...props}>
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-300",
          isDragging ? "opacity-50" : "opacity-100"
        )}
        onClick={onClose}
        style={{ 
          opacity: Math.min(1, sheetHeight / getSnapHeight(snapPoints[0])) * 0.5 
        }}
      />
      
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl",
          "flex flex-col",
          !isDragging && "transition-all duration-300 ease-out",
          className
        )}
        style={{ 
          height: sheetHeight,
          maxHeight: '95vh',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Handle bar for dragging */}
        {showHandle && (
          <div 
            className="flex items-center justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-manipulation"
            onTouchStart={handleDragStart}
            onMouseDown={handleDragStart}
          >
            <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
          </div>
        )}
        
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
            {title && (
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  "p-2 min-h-[44px] min-w-[44px] flex items-center justify-center",
                  "rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100",
                  "transition-all duration-150 touch-manipulation active:scale-95",
                  !title && "ml-auto"
                )}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={cn(
          "flex-1 overflow-y-auto overscroll-contain px-4 py-4",
          contentClassName
        )}>
          {children}
        </div>
      </div>
    </div>
  );
});

BottomSheet.displayName = "BottomSheet";

/**
 * BottomSheetActions - Footer actions for BottomSheet
 * Positioned at thumb zone for easy reach
 */
const BottomSheetActions = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col gap-3 p-4 pt-3 border-t border-slate-100 bg-white dark:bg-slate-800",
      "sticky bottom-0",
      className
    )}
    style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
    {...props}
  >
    {children}
  </div>
));

BottomSheetActions.displayName = "BottomSheetActions";

export { BottomSheet, BottomSheetActions };
