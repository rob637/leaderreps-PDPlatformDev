/**
 * Stagger - Container that staggers children animations
 */
import React, { forwardRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useReducedMotion } from './useAnimations';
// import { staggerChildren } from './springPresets';

const Stagger = forwardRef(({
  children,
  stagger = 0.05,
  delayStart = 0.1,
  className = '',
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
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: delayStart,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Stagger.displayName = 'Stagger';

/**
 * StaggerItem - Child component for Stagger
 */
export const StaggerItem = forwardRef(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <motion.div
      ref={ref}
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 30,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

StaggerItem.displayName = 'StaggerItem';

export default Stagger;
