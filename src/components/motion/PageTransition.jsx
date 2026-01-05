/**
 * PageTransition - Screen transition animations
 */
import React, { forwardRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from './useAnimations';
import { springPage } from './springPresets';

const variants = {
  // iOS-style slide
  slideLeft: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-30%', opacity: 0 },
  },
  slideRight: {
    initial: { x: '-100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '30%', opacity: 0 },
  },
  slideUp: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '-20%', opacity: 0 },
  },
  slideDown: {
    initial: { y: '-100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '20%', opacity: 0 },
  },
  // Fade
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  // Scale
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 1.05 },
  },
  // Combined
  slideUpFade: {
    initial: { y: 30, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -15, opacity: 0 },
  },
};

const PageTransition = forwardRef(({
  children,
  variant = 'slideUpFade',
  className = '',
  // mode = 'wait',
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();
  const selectedVariant = variants[variant] || variants.slideUpFade;

  if (reducedMotion) {
    return <div ref={ref} className={className} {...props}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={selectedVariant.initial}
      animate={selectedVariant.animate}
      exit={selectedVariant.exit}
      transition={springPage}
      {...props}
    >
      {children}
    </motion.div>
  );
});

PageTransition.displayName = 'PageTransition';

/**
 * PageTransitionWrapper - Wraps content with AnimatePresence
 */
export const PageTransitionWrapper = ({ children, mode = 'wait' }) => {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  );
};

export default PageTransition;
