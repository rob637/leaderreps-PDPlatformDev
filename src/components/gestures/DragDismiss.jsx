/**
 * DragDismiss - Drag to dismiss modal/sheet
 */
import React, { useRef, useState, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, useAnimation } from 'framer-motion';
import { useReducedMotion } from '../motion/useAnimations';
import { springModal } from '../motion/springPresets';

const DragDismiss = ({
  children,
  onDismiss,
  direction = 'down', // 'up' | 'down' | 'left' | 'right'
  threshold = 100,
  className = '',
  showHandle = true,
  disabled = false,
}) => {
  const reducedMotion = useReducedMotion();
  const controls = useAnimation();
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  const axis = direction === 'up' || direction === 'down' ? 'y' : 'x';
  const multiplier = direction === 'down' || direction === 'right' ? 1 : -1;

  const handleDragStart = useCallback((e) => {
    if (disabled) return;
    
    const touch = e.touches?.[0] || e;
    startPos.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  }, [disabled]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || disabled) return;
    
    const touch = e.touches?.[0] || e;
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    
    currentPos.current = { x: deltaX, y: deltaY };
    
    // Only allow movement in the dismiss direction
    const value = axis === 'y' ? deltaY : deltaX;
    const constrainedValue = multiplier > 0 ? Math.max(0, value) : Math.min(0, value);
    
    controls.set({ [axis]: constrainedValue });
  }, [isDragging, disabled, axis, multiplier, controls]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    
    const value = axis === 'y' ? currentPos.current.y : currentPos.current.x;
    const shouldDismiss = multiplier > 0 ? value > threshold : value < -threshold;
    
    if (shouldDismiss) {
      // Animate out
      const exitValue = multiplier > 0 ? 500 : -500;
      controls.start({ 
        [axis]: exitValue, 
        opacity: 0,
        transition: { duration: 0.2 } 
      }).then(() => {
        onDismiss?.();
      });
    } else {
      // Snap back
      controls.start({ 
        [axis]: 0,
        transition: springModal,
      });
    }
    
    currentPos.current = { x: 0, y: 0 };
  }, [isDragging, disabled, axis, multiplier, threshold, controls, onDismiss]);

  if (reducedMotion || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={controls}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      onMouseDown={handleDragStart}
      onMouseMove={isDragging ? handleDragMove : undefined}
      onMouseUp={handleDragEnd}
      onMouseLeave={isDragging ? handleDragEnd : undefined}
      style={{ touchAction: axis === 'y' ? 'pan-x' : 'pan-y' }}
    >
      {/* Drag Handle */}
      {showHandle && (direction === 'up' || direction === 'down') && (
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
      )}
      
      {children}
    </motion.div>
  );
};

export default DragDismiss;
