/**
 * FadeIn - Simple fade animation
 */
import React, { forwardRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useReducedMotion } from './useAnimations';
import { tweenStandard } from './springPresets';

const FadeIn = forwardRef(({
  children,
  duration = 0.3,
  delay = 0,
  className = '',
  once = true,
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div ref={ref} className={className} {...props}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ ...tweenStandard, duration, delay }}
      viewport={{ once }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

FadeIn.displayName = 'FadeIn';

export default FadeIn;
