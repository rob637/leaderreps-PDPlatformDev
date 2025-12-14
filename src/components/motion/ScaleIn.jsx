/**
 * ScaleIn - Scale animation with spring physics
 */
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useAnimations';
import { springDefault } from './springPresets';

const ScaleIn = forwardRef(({
  children,
  from = 0.9,
  delay = 0,
  className = '',
  spring = springDefault,
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
      initial={{ opacity: 0, scale: from }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: from }}
      transition={{ ...spring, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

ScaleIn.displayName = 'ScaleIn';

export default ScaleIn;
