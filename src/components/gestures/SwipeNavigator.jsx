/**
 * SwipeNavigator - Swipe between pages/tabs
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useReducedMotion } from '../motion/useAnimations';
import { springPage } from '../motion/springPresets';

const SwipeNavigator = ({
  children,
  currentIndex = 0,
  onIndexChange,
  threshold = 50,
  className = '',
  showIndicators = true,
  indicatorPosition = 'bottom', // 'top' | 'bottom'
  allowLoop = false,
}) => {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef(null);
  const touchStart = useRef({ x: 0, y: 0 });
  const [direction, setDirection] = useState(0);
  const controls = useAnimation();
  
  const pages = React.Children.toArray(children);
  const totalPages = pages.length;

  const goToIndex = useCallback((newIndex) => {
    if (newIndex < 0) {
      if (allowLoop) {
        onIndexChange?.(totalPages - 1);
      }
    } else if (newIndex >= totalPages) {
      if (allowLoop) {
        onIndexChange?.(0);
      }
    } else {
      onIndexChange?.(newIndex);
    }
  }, [totalPages, allowLoop, onIndexChange]);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        setDirection(-1);
        goToIndex(currentIndex - 1);
      } else {
        setDirection(1);
        goToIndex(currentIndex + 1);
      }
    }
  }, [threshold, currentIndex, goToIndex]);

  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  if (reducedMotion) {
    return (
      <div className={`relative ${className}`}>
        {pages[currentIndex]}
        {showIndicators && totalPages > 1 && (
          <div className={`absolute left-1/2 -translate-x-1/2 flex gap-2 ${indicatorPosition === 'top' ? 'top-4' : 'bottom-4'}`}>
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => onIndexChange?.(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-navy' : 'bg-gray-300'
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={springPage}
          className="w-full"
        >
          {pages[currentIndex]}
        </motion.div>
      </AnimatePresence>

      {/* Page Indicators */}
      {showIndicators && totalPages > 1 && (
        <div className={`absolute left-1/2 -translate-x-1/2 flex gap-2 ${indicatorPosition === 'top' ? 'top-4' : 'bottom-4'}`}>
          {pages.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => {
                setDirection(i > currentIndex ? 1 : -1);
                onIndexChange?.(i);
              }}
              className="w-2 h-2 rounded-full"
              animate={{
                backgroundColor: i === currentIndex ? '#002E47' : '#D1D5DB',
                scale: i === currentIndex ? 1.2 : 1,
              }}
              transition={{ duration: 0.2 }}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SwipeNavigator;
