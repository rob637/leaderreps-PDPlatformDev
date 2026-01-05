/**
 * AnimatedCard - Card with hover/tap animations
 */
import React, { forwardRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useReducedMotion } from './useAnimations';
import { springSnappy } from './springPresets';

const AnimatedCard = forwardRef(({
  children,
  className = '',
  onClick,
  hoverScale = 1.02,
  tapScale = 0.98,
  hoverShadow = true,
  disabled = false,
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();

  const baseClasses = `
    rounded-xl bg-white shadow-sm
    transition-shadow
    ${onClick && !disabled ? 'cursor-pointer' : ''}
    ${disabled ? 'opacity-60' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  if (reducedMotion || disabled) {
    return (
      <div 
        ref={ref} 
        className={baseClasses} 
        onClick={disabled ? undefined : onClick}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={baseClasses}
      onClick={onClick}
      whileHover={onClick ? { 
        scale: hoverScale,
        boxShadow: hoverShadow ? '0 10px 30px rgba(0,0,0,0.1)' : undefined,
      } : undefined}
      whileTap={onClick ? { scale: tapScale } : undefined}
      transition={springSnappy}
      {...props}
    >
      {children}
    </motion.div>
  );
});

AnimatedCard.displayName = 'AnimatedCard';

export default AnimatedCard;
