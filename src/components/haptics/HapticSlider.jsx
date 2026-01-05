/**
 * HapticSlider - Slider with haptic tick feedback
 */
import React, { useState, useRef, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { haptic } from './useHaptics';

const HapticSlider = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  tickInterval = 10, // How often to provide haptic tick (in value units)
  label,
  showValue = true,
  formatValue = (v) => v,
  disabled = false,
  className = '',
  ...props
}) => {
  // const reducedMotion = useReducedMotion();
  const sliderRef = useRef(null);
  const lastTickValue = useRef(value);
  const [isDragging, setIsDragging] = useState(false);

  // Provide haptic feedback at tick intervals
  const checkTick = useCallback((newValue) => {
    const lastTick = Math.floor(lastTickValue.current / tickInterval);
    const currentTick = Math.floor(newValue / tickInterval);
    
    if (currentTick !== lastTick) {
      haptic.tick();
      lastTickValue.current = newValue;
    }
  }, [tickInterval]);

  const handleChange = useCallback((e) => {
    if (disabled) return;
    
    const newValue = Number(e.target.value);
    checkTick(newValue);
    onChange?.(newValue);
  }, [disabled, onChange, checkTick]);

  // Calculate percentage for styling
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`w-full ${className}`} {...props}>
      {/* Label and value */}
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <label className="text-sm font-medium text-gray-700">
              {label}
            </label>
          )}
          {showValue && (
            <span className="text-sm font-semibold text-navy">
              {formatValue(value)}
            </span>
          )}
        </div>
      )}

      {/* Slider track */}
      <div className="relative h-12 flex items-center">
        {/* Background track */}
        <div className="absolute inset-x-0 h-2 bg-gray-200 rounded-full" />
        
        {/* Active track */}
        <motion.div
          className="absolute left-0 h-2 bg-teal rounded-full"
          style={{ width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        {/* Native input for accessibility */}
        <input
          ref={sliderRef}
          type="range"
          value={value}
          onChange={handleChange}
          onMouseDown={() => {
            setIsDragging(true);
            haptic.light();
          }}
          onMouseUp={() => {
            setIsDragging(false);
            haptic.medium();
          }}
          onTouchStart={() => {
            setIsDragging(true);
            haptic.light();
          }}
          onTouchEnd={() => {
            setIsDragging(false);
            haptic.medium();
          }}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="absolute inset-x-0 w-full h-12 opacity-0 cursor-pointer touch-manipulation z-10"
          aria-label={label}
        />

        {/* Custom thumb */}
        <motion.div
          className={`
            absolute w-6 h-6 bg-white rounded-full shadow-lg
            border-2 border-teal
            ${disabled ? 'opacity-50' : ''}
          `}
          style={{ left: `calc(${percentage}% - 12px)` }}
          animate={{ 
            scale: isDragging ? 1.2 : 1,
            boxShadow: isDragging 
              ? '0 0 0 8px rgba(71, 168, 141, 0.2)' 
              : '0 2px 8px rgba(0,0,0,0.15)',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      </div>

      {/* Tick marks (optional) */}
      {tickInterval && tickInterval > 0 && (
        <div className="relative h-2 mt-1">
          {Array.from({ length: Math.floor((max - min) / tickInterval) + 1 }).map((_, i) => {
            const tickValue = min + i * tickInterval;
            const tickPercent = ((tickValue - min) / (max - min)) * 100;
            return (
              <div
                key={i}
                className="absolute w-0.5 h-1.5 bg-gray-300 rounded-full -translate-x-1/2"
                style={{ left: `${tickPercent}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HapticSlider;
