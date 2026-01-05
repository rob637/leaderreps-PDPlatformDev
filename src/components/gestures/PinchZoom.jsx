/**
 * PinchZoom - Pinch to zoom component
 */
import React, { useRef, useState, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { usePinch, useDoubleTap } from './useGestures';
import { useReducedMotion } from '../motion/useAnimations';

const PinchZoom = ({
  children,
  minScale = 1,
  maxScale = 4,
  doubleTapScale = 2,
  className = '',
  onScaleChange,
  disabled = false,
}) => {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  
  const handlePinchStart = useCallback(() => {
    // Could capture initial position here
  }, []);

  const handlePinch = useCallback(({ scale: newScale }) => {
    setScale(newScale);
    onScaleChange?.(newScale);
  }, [onScaleChange]);

  const handlePinchEnd = useCallback(() => {
    // Snap back if below minScale
    if (scale < minScale) {
      setScale(minScale);
      setPosition({ x: 0, y: 0 });
    }
  }, [scale, minScale]);

  const { handlers: pinchHandlers } = usePinch({
    onPinchStart: handlePinchStart,
    onPinch: handlePinch,
    onPinchEnd: handlePinchEnd,
    minScale,
    maxScale,
  });

  const { handlers: doubleTapHandlers } = useDoubleTap({
    onDoubleTap: (e) => {
      if (disabled) return;
      
      // Toggle between 1x and doubleTapScale
      if (scale > 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setOrigin({ x: 50, y: 50 });
        onScaleChange?.(1);
      } else {
        // Zoom into tap position
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          setOrigin({ x, y });
        }
        setScale(doubleTapScale);
        onScaleChange?.(doubleTapScale);
      }
    },
  });

  // Handle panning when zoomed
  /*
  const handlePan = useCallback((e) => {
    if (scale <= 1 || disabled) return;
    
    const touch = e.touches?.[0];
    if (!touch) return;
    
    // Simple pan - could be enhanced with momentum
    setPosition(prev => ({
      x: prev.x + e.movementX || 0,
      y: prev.y + e.movementY || 0,
    }));
  }, [scale, disabled]);
  */

  if (reducedMotion || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      ref={containerRef}
      className={`overflow-hidden touch-manipulation ${className}`}
      {...pinchHandlers}
      {...doubleTapHandlers}
    >
      <motion.div
        animate={{
          scale,
          x: position.x,
          y: position.y,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
        style={{
          transformOrigin: `${origin.x}% ${origin.y}%`,
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PinchZoom;
