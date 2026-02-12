/**
 * OfflineIndicator - Small offline status indicator
 */
import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import useOffline from './useOffline';
import { useReducedMotion } from '../motion/useAnimations';

const OfflineIndicator = ({
  showOnline = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  variant = 'icon', // 'icon' | 'dot' | 'badge'
  className = '',
}) => {
  const { isOnline, isOffline, pendingCount } = useOffline();
  const reducedMotion = useReducedMotion();

  const sizes = {
    sm: { icon: 'w-4 h-4', dot: 'w-2 h-2', badge: 'text-xs px-2 py-0.5' },
    md: { icon: 'w-5 h-5', dot: 'w-3 h-3', badge: 'text-sm px-2.5 py-1' },
    lg: { icon: 'w-6 h-6', dot: 'w-4 h-4', badge: 'text-base px-3 py-1.5' },
  };

  const currentSize = sizes[size] || sizes.md;

  // Don't show if online and showOnline is false
  if (isOnline && !showOnline) {
    return null;
  }

  // Icon variant
  if (variant === 'icon') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={isOnline ? 'online' : 'offline'}
          initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={reducedMotion ? {} : { scale: 0, opacity: 0 }}
          className={`flex items-center ${className}`}
        >
          {isOffline ? (
            <WifiOff className={`${currentSize.icon} text-yellow-500`} />
          ) : (
            <Wifi className={`${currentSize.icon} text-green-500`} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Dot variant
  if (variant === 'dot') {
    return (
      <motion.div
        animate={{
          backgroundColor: isOnline ? '#22c55e' : '#eab308',
          scale: isOffline ? [1, 1.2, 1] : 1,
        }}
        transition={{
          scale: { repeat: isOffline ? Infinity : 0, duration: 2 },
        }}
        className={`${currentSize.dot} rounded-full ${className}`}
      />
    );
  }

  // Badge variant
  if (variant === 'badge') {
    return (
      <AnimatePresence mode="wait">
        {(isOffline || showOnline) && (
          <motion.div
            key={isOnline ? 'online' : 'offline'}
            initial={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducedMotion ? {} : { scale: 0.8, opacity: 0 }}
            className={`
              inline-flex items-center gap-1.5 rounded-full font-medium
              ${currentSize.badge}
              ${isOnline 
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700' 
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700'
              }
              ${className}
            `}
          >
            {isOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
                {pendingCount > 0 && (
                  <span className="text-yellow-500">({pendingCount})</span>
                )}
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Online</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
};

export default OfflineIndicator;
