/**
 * SlideIn - Slide animation from any direction
 */
import React, { forwardRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useReducedMotion } from './useAnimations';
import { springDefault } from './springPresets';

const directions = {
  up: { y: 30, x: 0 },
  down: { y: -30, x: 0 },
  left: { y: 0, x: 30 },
  right: { y: 0, x: -30 },
};

const SlideIn = forwardRef(({
  children,
  direction = 'up',
  distance,
  delay = 0,
  className = '',
  spring = springDefault,
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div ref={ref} className={className} {...props}>{children}</div>;
  }

  const offset = distance 
    ? { 
        y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
        x: direction === 'left' ? distance : direction === 'right' ? -distance : 0,
      }
    : directions[direction];

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, ...offset }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...offset }}
      transition={{ ...spring, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

SlideIn.displayName = 'SlideIn';

export default SlideIn;
