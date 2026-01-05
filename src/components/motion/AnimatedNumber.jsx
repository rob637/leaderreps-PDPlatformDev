/**
 * AnimatedNumber - Smooth number transitions
 */
import React, { useEffect, useState, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, useSpring, useTransform } from 'framer-motion';
import { useReducedMotion } from './useAnimations';

const AnimatedNumber = ({
  value,
  duration = 1,
  format = (n) => Math.round(n).toLocaleString(),
  className = '',
  prefix = '',
  suffix = '',
  ...props
}) => {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  
  // Spring animation
  const spring = useSpring(previousValue.current, {
    stiffness: 100,
    damping: 30,
    duration: reducedMotion ? 0 : duration * 1000,
  });

  // Update spring target when value changes
  useEffect(() => {
    previousValue.current = value;
    spring.set(value);
  }, [value, spring]);

  // Subscribe to spring changes
  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(latest);
    });
    return () => unsubscribe();
  }, [spring]);

  if (reducedMotion) {
    return (
      <span className={className} {...props}>
        {prefix}{format(value)}{suffix}
      </span>
    );
  }

  return (
    <motion.span className={className} {...props}>
      {prefix}{format(displayValue)}{suffix}
    </motion.span>
  );
};

/**
 * AnimatedPercentage - Percentage with progress bar
 */
export const AnimatedPercentage = ({
  value,
  className = '',
  // barClassName = '',
  showBar = true,
  barColor = 'bg-teal-500',
  ...props
}) => {
  const reducedMotion = useReducedMotion();
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={className} {...props}>
      <AnimatedNumber
        value={clampedValue}
        suffix="%"
        className="font-semibold"
      />
      {showBar && (
        <div className="w-full h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
          <motion.div
            className={`h-full ${barColor} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${clampedValue}%` }}
            transition={{
              type: 'spring',
              stiffness: 100,
              damping: 20,
              duration: reducedMotion ? 0 : undefined,
            }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * AnimatedCounter - Counting up/down animation
 */
export const AnimatedCounter = ({
  from = 0,
  to,
  duration = 2,
  delay = 0,
  className = '',
  format = (n) => Math.round(n).toLocaleString(),
  onComplete,
  ...props
}) => {
  const reducedMotion = useReducedMotion();
  const [count, setCount] = useState(from);
  const frameRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    if (reducedMotion) {
      setCount(to);
      onComplete?.();
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp + delay * 1000;
      }

      const elapsed = timestamp - startTimeRef.current;
      
      if (elapsed < 0) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      
      setCount(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [from, to, duration, delay, reducedMotion, onComplete]);

  return (
    <span className={className} {...props}>
      {format(count)}
    </span>
  );
};

export default AnimatedNumber;
