/**
 * PressableScale - Touch feedback with scale animation
 * Creates native-feeling press interactions
 */
import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from './useAnimations';
import { springSnappy } from './springPresets';

const PressableScale = forwardRef(({
  children,
  className = '',
  onClick,
  onLongPress,
  scale = 0.97,
  disabled = false,
  as = 'div',
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  // Long press handling
  const longPressTimer = React.useRef(null);
  const isLongPress = React.useRef(false);

  const handlePressStart = () => {
    if (disabled || !onLongPress) return;
    
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, 500);
  };

  const handlePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleClick = (e) => {
    if (disabled || isLongPress.current) return;
    onClick?.(e);
  };

  if (reducedMotion || disabled) {
    return (
      <div
        ref={ref}
        className={`${className} ${disabled ? 'opacity-60' : ''}`}
        onClick={disabled ? undefined : handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <Component
      ref={ref}
      className={`${className} ${disabled ? 'opacity-60' : ''} select-none touch-manipulation`}
      onClick={handleClick}
      onPointerDown={handlePressStart}
      onPointerUp={handlePressEnd}
      onPointerLeave={handlePressEnd}
      whileTap={{ scale }}
      transition={springSnappy}
      {...props}
    >
      {children}
    </Component>
  );
});

PressableScale.displayName = 'PressableScale';

/**
 * PressableOpacity - Touch feedback with opacity
 */
export const PressableOpacity = forwardRef(({
  children,
  className = '',
  onClick,
  opacity = 0.7,
  disabled = false,
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || disabled) {
    return (
      <div
        ref={ref}
        className={`${className} ${disabled ? 'opacity-60' : ''}`}
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
      className={`${className} ${disabled ? 'opacity-60' : ''} select-none touch-manipulation`}
      onClick={onClick}
      whileTap={{ opacity }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

PressableOpacity.displayName = 'PressableOpacity';

/**
 * PressableHighlight - Touch feedback with background highlight
 */
export const PressableHighlight = forwardRef(({
  children,
  className = '',
  onClick,
  highlightColor = 'rgba(0,0,0,0.05)',
  disabled = false,
  ...props
}, ref) => {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || disabled) {
    return (
      <div
        ref={ref}
        className={`${className} ${disabled ? 'opacity-60' : ''}`}
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
      className={`${className} ${disabled ? 'opacity-60' : ''} select-none touch-manipulation`}
      onClick={onClick}
      whileTap={{ backgroundColor: highlightColor }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

PressableHighlight.displayName = 'PressableHighlight';

export default PressableScale;
