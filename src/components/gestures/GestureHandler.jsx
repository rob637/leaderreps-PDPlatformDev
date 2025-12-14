/**
 * GestureHandler - Generic gesture recognition component
 */
import React, { forwardRef } from 'react';
import { useSwipe, useLongPress, useDoubleTap } from './useGestures';

const GestureHandler = forwardRef(({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onLongPress,
  onDoubleTap,
  onSingleTap,
  swipeThreshold = 50,
  longPressDuration = 500,
  doubleTapDelay = 300,
  className = '',
  ...props
}, ref) => {
  // Swipe detection
  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold: swipeThreshold,
  });

  // Long press detection
  const { handlers: longPressHandlers } = useLongPress({
    onLongPress,
    duration: longPressDuration,
  });

  // Double tap detection
  const { handlers: doubleTapHandlers } = useDoubleTap({
    onDoubleTap,
    onSingleTap,
    delay: doubleTapDelay,
  });

  // Merge all handlers
  const mergedHandlers = {
    onTouchStart: (e) => {
      swipeHandlers.onTouchStart?.(e);
      longPressHandlers.onTouchStart?.(e);
    },
    onTouchMove: (e) => {
      swipeHandlers.onTouchMove?.(e);
      longPressHandlers.onTouchCancel?.(e); // Cancel long press on move
    },
    onTouchEnd: (e) => {
      swipeHandlers.onTouchEnd?.(e);
      longPressHandlers.onTouchEnd?.(e);
    },
    onClick: doubleTapHandlers.onClick,
  };

  // If only using single gesture type, use that handler directly
  const hasSwipe = onSwipeLeft || onSwipeRight || onSwipeUp || onSwipeDown;
  const hasLongPress = !!onLongPress;
  const hasTap = onDoubleTap || onSingleTap;

  let handlers = {};
  
  if (hasSwipe && !hasLongPress && !hasTap) {
    handlers = swipeHandlers;
  } else if (hasLongPress && !hasSwipe && !hasTap) {
    handlers = longPressHandlers;
  } else if (hasTap && !hasSwipe && !hasLongPress) {
    handlers = doubleTapHandlers;
  } else {
    handlers = mergedHandlers;
  }

  return (
    <div
      ref={ref}
      className={`touch-manipulation ${className}`}
      {...handlers}
      {...props}
    >
      {children}
    </div>
  );
});

GestureHandler.displayName = 'GestureHandler';

export default GestureHandler;
