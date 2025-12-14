/**
 * HapticToggle - Toggle switch with haptic feedback
 */
import React from 'react';
import { motion } from 'framer-motion';
import { haptic } from './useHaptics';
import { springSnappy } from '../motion/springPresets';
import { useReducedMotion } from '../motion/useAnimations';

const HapticToggle = ({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
  ...props
}) => {
  const reducedMotion = useReducedMotion();

  const handleToggle = () => {
    if (disabled) return;
    
    // Haptic feedback
    haptic.impact('medium');
    
    onChange?.(!checked);
  };

  const sizes = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-4 h-4',
      translate: checked ? 'translateX(16px)' : 'translateX(2px)',
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translate: checked ? 'translateX(20px)' : 'translateX(2px)',
    },
    lg: {
      track: 'w-14 h-8',
      thumb: 'w-7 h-7',
      translate: checked ? 'translateX(24px)' : 'translateX(2px)',
    },
  };

  const currentSize = sizes[size] || sizes.md;

  const Toggle = () => {
    if (reducedMotion) {
      return (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={handleToggle}
          disabled={disabled}
          className={`
            relative inline-flex flex-shrink-0 
            ${currentSize.track} rounded-full
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal
            ${checked ? 'bg-teal' : 'bg-gray-200'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          {...props}
        >
          <span
            className={`
              ${currentSize.thumb}
              rounded-full bg-white shadow-md
              transition-transform duration-200
            `}
            style={{ transform: currentSize.translate }}
          />
        </button>
      );
    }

    return (
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative inline-flex flex-shrink-0 
          ${currentSize.track} rounded-full
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        animate={{
          backgroundColor: checked ? '#47A88D' : '#E5E7EB',
        }}
        transition={{ duration: 0.2 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        {...props}
      >
        <motion.span
          className={`
            ${currentSize.thumb}
            rounded-full bg-white shadow-md
          `}
          animate={{ 
            x: checked ? (size === 'sm' ? 16 : size === 'lg' ? 24 : 20) : 2,
          }}
          transition={springSnappy}
        />
      </motion.button>
    );
  };

  // Simple toggle without label
  if (!label && !description) {
    return <Toggle />;
  }

  // Toggle with label
  return (
    <label 
      className={`
        flex items-start gap-3 cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      <div className="flex-shrink-0 pt-0.5">
        <Toggle />
      </div>
      <div className="flex-1 min-w-0">
        {label && (
          <span className="block text-sm font-medium text-gray-900">
            {label}
          </span>
        )}
        {description && (
          <span className="block text-sm text-gray-500 mt-0.5">
            {description}
          </span>
        )}
      </div>
    </label>
  );
};

export default HapticToggle;
