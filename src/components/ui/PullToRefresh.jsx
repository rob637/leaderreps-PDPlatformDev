import * as React from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * PullToRefresh - Native pull-to-refresh pattern
 * 
 * Wrap scrollable content to enable pull-down refresh
 */

const PullToRefresh = React.forwardRef(({
  onRefresh,
  children,
  threshold = 80,
  refreshingText = "Refreshing...",
  pullText = "Pull to refresh",
  releaseText = "Release to refresh",
  className,
  disabled,
  ...props
}, ref) => {
  const containerRef = React.useRef(null);
  const [pullDistance, setPullDistance] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isPulling, setIsPulling] = React.useState(false);
  const startY = React.useRef(0);
  const scrollTop = React.useRef(0);

  const canPull = () => {
    if (!containerRef.current) return false;
    return containerRef.current.scrollTop <= 0;
  };

  const handleTouchStart = (e) => {
    if (disabled || isRefreshing) return;
    scrollTop.current = containerRef.current?.scrollTop || 0;
    if (canPull()) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  };

  const handleTouchMove = (e) => {
    if (!isPulling || disabled || isRefreshing) return;
    if (!canPull()) {
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0) {
      // Apply resistance as user pulls further
      const resistance = Math.min(1, 1 - diff / 500);
      const distance = diff * resistance;
      setPullDistance(Math.min(distance, threshold * 1.5));
      
      // Prevent default scroll when pulling
      if (diff > 10) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling || disabled) return;
    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // Keep indicator visible
      
      try {
        await onRefresh?.();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  const progress = Math.min(1, pullDistance / threshold);
  const shouldRelease = pullDistance >= threshold;

  return (
    <div 
      ref={ref}
      className={cn("relative", className)}
      {...props}
    >
      {/* Pull indicator */}
      <div 
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center",
          "transition-opacity duration-200",
          (pullDistance > 0 || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          top: -60,
          height: 60,
          transform: `translateY(${pullDistance}px)`
        }}
      >
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <RefreshCw 
            className={cn(
              "h-5 w-5 transition-transform duration-200",
              isRefreshing && "animate-spin",
              shouldRelease && !isRefreshing && "rotate-180"
            )}
            style={{ 
              transform: !isRefreshing && !shouldRelease 
                ? `rotate(${progress * 180}deg)` 
                : undefined 
            }}
          />
          <span>
            {isRefreshing 
              ? refreshingText 
              : shouldRelease 
                ? releaseText 
                : pullText
            }
          </span>
        </div>
      </div>

      {/* Scrollable content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="h-full overflow-y-auto overscroll-contain"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
});

PullToRefresh.displayName = "PullToRefresh";

export { PullToRefresh };
