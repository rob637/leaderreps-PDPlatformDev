/**
 * HorizontalScroll - Horizontal scrolling container with snap
 */
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from '../motion/useAnimations';

const HorizontalScroll = ({
  children,
  itemWidth = 280,
  gap = 16,
  showArrows = true,
  showScrollbar = false,
  snap = true,
  className = '',
  onScroll,
}) => {
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScrollState = useCallback(() => {
    if (!scrollRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    setScrollProgress(scrollLeft / (scrollWidth - clientWidth));
    onScroll?.(scrollProgress);
  }, [onScroll, scrollProgress]);

  useEffect(() => {
    updateScrollState();
    const element = scrollRef.current;
    if (element) {
      element.addEventListener('scroll', updateScrollState, { passive: true });
      return () => element.removeEventListener('scroll', updateScrollState);
    }
  }, [updateScrollState]);

  const scroll = useCallback((direction) => {
    if (!scrollRef.current) return;
    
    const scrollAmount = (itemWidth + gap) * (direction === 'left' ? -1 : 1);
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  }, [itemWidth, gap]);

  return (
    <div className={`relative group ${className}`}>
      {/* Scroll Container */}
      <div
        ref={scrollRef}
        className={`
          flex overflow-x-auto overscroll-x-contain
          ${snap ? 'snap-x snap-mandatory' : ''}
          ${showScrollbar ? '' : 'scrollbar-hide'}
          -mx-4 px-4
        `}
        style={{ 
          gap: `${gap}px`,
          WebkitOverflowScrolling: 'touch',
          scrollPaddingLeft: '16px',
          scrollPaddingRight: '16px',
        }}
      >
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            className={snap ? 'snap-start' : ''}
            style={{ 
              flexShrink: 0,
              width: typeof itemWidth === 'number' ? `${itemWidth}px` : itemWidth,
            }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && !reducedMotion && (
        <>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('left')}
              className="
                absolute left-0 top-1/2 -translate-y-1/2 z-10
                w-10 h-10 rounded-full bg-white shadow-lg
                flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity
                hover:bg-gray-50 active:scale-95
                hidden md:flex
              "
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}
          
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => scroll('right')}
              className="
                absolute right-0 top-1/2 -translate-y-1/2 z-10
                w-10 h-10 rounded-full bg-white shadow-lg
                flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity
                hover:bg-gray-50 active:scale-95
                hidden md:flex
              "
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </motion.button>
          )}
        </>
      )}

      {/* Scroll Progress Indicator (mobile) */}
      {!showScrollbar && React.Children.count(children) > 1 && (
        <div className="flex justify-center mt-3 gap-1.5 md:hidden">
          {React.Children.map(children, (_, i) => {
            const childCount = React.Children.count(children);
            const activeIndex = Math.round(scrollProgress * (childCount - 1));
            return (
              <div
                key={i}
                className={`
                  h-1.5 rounded-full transition-all duration-200
                  ${i === activeIndex ? 'w-4 bg-navy' : 'w-1.5 bg-gray-300'}
                `}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// Hide scrollbar CSS utility
const style = typeof document !== 'undefined' ? document.createElement('style') : null;
if (style && !document.querySelector('[data-horizontal-scroll-styles]')) {
  style.setAttribute('data-horizontal-scroll-styles', '');
  style.textContent = `
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `;
  document.head.appendChild(style);
}

export default HorizontalScroll;
