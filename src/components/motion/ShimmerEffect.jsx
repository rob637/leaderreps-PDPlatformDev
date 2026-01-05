/**
 * ShimmerEffect - Loading shimmer/skeleton animation
 */
import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { useReducedMotion } from './useAnimations';

const ShimmerEffect = ({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className = '',
  ...props
}) => {
  const reducedMotion = useReducedMotion();

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full',
  };

  if (reducedMotion) {
    return (
      <div
        className={`bg-gray-200 ${roundedClasses[rounded]} ${className}`}
        style={{ width, height }}
        {...props}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-gray-200 ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
      {...props}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
        }}
        animate={{
          translateX: ['0%', '200%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

/**
 * ShimmerCard - Card-shaped shimmer
 */
export const ShimmerCard = ({
  lines = 3,
  showImage = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-4 bg-white rounded-xl shadow-sm ${className}`} {...props}>
      {showImage && (
        <ShimmerEffect
          width="100%"
          height="150px"
          rounded="lg"
          className="mb-4"
        />
      )}
      <ShimmerEffect width="60%" height="1.5rem" className="mb-3" />
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerEffect
          key={i}
          width={i === lines - 1 ? '80%' : '100%'}
          height="1rem"
          className="mb-2"
        />
      ))}
    </div>
  );
};

/**
 * ShimmerList - List of shimmer items
 */
export const ShimmerList = ({
  count = 5,
  showAvatar = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          {showAvatar && (
            <ShimmerEffect width="40px" height="40px" rounded="full" />
          )}
          <div className="flex-1">
            <ShimmerEffect width="70%" height="1rem" className="mb-2" />
            <ShimmerEffect width="50%" height="0.875rem" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * ShimmerText - Inline text shimmer
 */
export const ShimmerText = ({
  width = '100px',
  className = '',
  ...props
}) => {
  return (
    <ShimmerEffect
      width={width}
      height="1em"
      rounded="sm"
      className={`inline-block ${className}`}
      {...props}
    />
  );
};

/**
 * ShimmerCircle - Circular shimmer (avatars, icons)
 */
export const ShimmerCircle = ({
  size = '40px',
  className = '',
  ...props
}) => {
  return (
    <ShimmerEffect
      width={size}
      height={size}
      rounded="full"
      className={className}
      {...props}
    />
  );
};

export default ShimmerEffect;
