/**
 * Gesture Hooks - Custom hooks for touch gesture detection
 */
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * useSwipe - Detect swipe gestures
 */
export const useSwipe = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.5,
} = {}) => {
  const touchStart = useRef({ x: 0, y: 0, time: 0 });
  const touchEnd = useRef({ x: 0, y: 0, time: 0 });
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!swiping) return;
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, [swiping]);

  const handleTouchEnd = useCallback(() => {
    if (!swiping) return;
    setSwiping(false);

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const deltaTime = (touchEnd.current.time - touchStart.current.time) / 1000;
    
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine if it's a horizontal or vertical swipe
    if (absX > absY && absX > threshold) {
      if (deltaX > 0 && velocityX > velocityThreshold) {
        onSwipeRight?.();
      } else if (deltaX < 0 && velocityX > velocityThreshold) {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > threshold) {
      if (deltaY > 0 && velocityY > velocityThreshold) {
        onSwipeDown?.();
      } else if (deltaY < 0 && velocityY > velocityThreshold) {
        onSwipeUp?.();
      }
    }
  }, [swiping, threshold, velocityThreshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    swiping,
  };
};

/**
 * usePinch - Detect pinch gestures for zoom
 */
export const usePinch = ({
  onPinchStart,
  onPinch,
  onPinchEnd,
  minScale = 0.5,
  maxScale = 4,
} = {}) => {
  const [scale, setScale] = useState(1);
  const initialDistance = useRef(null);
  const initialScale = useRef(1);
  const [isPinching, setIsPinching] = useState(false);

  const getDistance = (touches) => {
    const [t1, t2] = touches;
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches);
      initialScale.current = scale;
      setIsPinching(true);
      onPinchStart?.({ scale });
    }
  }, [scale, onPinchStart]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && initialDistance.current) {
      const currentDistance = getDistance(e.touches);
      const scaleFactor = currentDistance / initialDistance.current;
      const newScale = Math.min(maxScale, Math.max(minScale, initialScale.current * scaleFactor));
      
      setScale(newScale);
      onPinch?.({ scale: newScale });
    }
  }, [minScale, maxScale, onPinch]);

  const handleTouchEnd = useCallback(() => {
    if (isPinching) {
      setIsPinching(false);
      initialDistance.current = null;
      onPinchEnd?.({ scale });
    }
  }, [isPinching, scale, onPinchEnd]);

  const resetScale = useCallback(() => {
    setScale(1);
  }, []);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    scale,
    isPinching,
    resetScale,
  };
};

/**
 * useLongPress - Detect long press gestures
 */
export const useLongPress = ({
  onLongPress,
  onPress,
  duration = 500,
} = {}) => {
  const timerRef = useRef(null);
  const isLongPress = useRef(false);
  const [pressing, setPressing] = useState(false);

  const start = useCallback((e) => {
    isLongPress.current = false;
    setPressing(true);
    
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress?.(e);
    }, duration);
  }, [onLongPress, duration]);

  const stop = useCallback((e) => {
    setPressing(false);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (!isLongPress.current) {
      onPress?.(e);
    }
    
    isLongPress.current = false;
  }, [onPress]);

  const cancel = useCallback(() => {
    setPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    isLongPress.current = false;
  }, []);

  return {
    handlers: {
      onTouchStart: start,
      onTouchEnd: stop,
      onTouchCancel: cancel,
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: cancel,
    },
    pressing,
  };
};

/**
 * useDoubleTap - Detect double tap gestures
 */
export const useDoubleTap = ({
  onDoubleTap,
  onSingleTap,
  delay = 300,
} = {}) => {
  const lastTap = useRef(0);
  const [tapped, setTapped] = useState(false);

  const handleTap = useCallback((e) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTap.current;
    
    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      // Double tap
      setTapped(true);
      onDoubleTap?.(e);
      lastTap.current = 0;
      setTimeout(() => setTapped(false), 100);
    } else {
      // First tap - wait for potential second
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now) {
          onSingleTap?.(e);
        }
      }, delay);
    }
  }, [delay, onDoubleTap, onSingleTap]);

  return {
    handlers: {
      onClick: handleTap,
    },
    tapped,
  };
};

/**
 * useDrag - Detect drag gestures
 */
export const useDrag = ({
  onDragStart,
  onDrag,
  onDragEnd,
  axis, // 'x' | 'y' | undefined (both)
} = {}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const startPos = useRef({ x: 0, y: 0 });
  const startTouch = useRef({ x: 0, y: 0 });

  const handleStart = useCallback((e) => {
    const touch = e.touches?.[0] || e;
    startTouch.current = { x: touch.clientX, y: touch.clientY };
    startPos.current = { ...position };
    setIsDragging(true);
    onDragStart?.({ position });
  }, [position, onDragStart]);

  const handleMove = useCallback((e) => {
    if (!isDragging) return;
    
    const touch = e.touches?.[0] || e;
    const deltaX = axis === 'y' ? 0 : touch.clientX - startTouch.current.x;
    const deltaY = axis === 'x' ? 0 : touch.clientY - startTouch.current.y;
    
    const newPosition = {
      x: startPos.current.x + deltaX,
      y: startPos.current.y + deltaY,
    };
    
    setPosition(newPosition);
    onDrag?.({ position: newPosition, delta: { x: deltaX, y: deltaY } });
  }, [isDragging, axis, onDrag]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    onDragEnd?.({ position });
  }, [isDragging, position, onDragEnd]);

  const reset = useCallback(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  return {
    handlers: {
      onTouchStart: handleStart,
      onTouchMove: handleMove,
      onTouchEnd: handleEnd,
      onMouseDown: handleStart,
      onMouseMove: handleMove,
      onMouseUp: handleEnd,
    },
    position,
    isDragging,
    reset,
  };
};

/**
 * useEdgeSwipe - Detect edge swipes (for drawer navigation)
 */
export const useEdgeSwipe = ({
  onSwipeFromLeft,
  onSwipeFromRight,
  edgeWidth = 20,
  threshold = 50,
} = {}) => {
  const startX = useRef(0);
  const startEdge = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    
    if (touch.clientX < edgeWidth) {
      startX.current = touch.clientX;
      startEdge.current = 'left';
    } else if (touch.clientX > screenWidth - edgeWidth) {
      startX.current = touch.clientX;
      startEdge.current = 'right';
    } else {
      startEdge.current = null;
    }
  }, [edgeWidth]);

  const handleTouchEnd = useCallback((e) => {
    if (!startEdge.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX.current;
    
    if (startEdge.current === 'left' && deltaX > threshold) {
      onSwipeFromLeft?.();
    } else if (startEdge.current === 'right' && deltaX < -threshold) {
      onSwipeFromRight?.();
    }
    
    startEdge.current = null;
  }, [threshold, onSwipeFromLeft, onSwipeFromRight]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
};

export default {
  useSwipe,
  usePinch,
  useLongPress,
  useDoubleTap,
  useDrag,
  useEdgeSwipe,
};
