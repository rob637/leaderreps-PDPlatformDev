/**
 * OfflineBanner - Full-width offline notification banner
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import useOffline from './useOffline';
import { useReducedMotion } from '../motion/useAnimations';

const OfflineBanner = ({
  position = 'top', // 'top' | 'bottom'
  showRetry = true,
  message = "You're offline",
  retryMessage = "Tap to retry",
  className = '',
  onRetry,
}) => {
  const { isOffline, pendingCount } = useOffline();
  const reducedMotion = useReducedMotion();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const positionClasses = {
    top: 'top-0 left-0 right-0',
    bottom: 'bottom-0 left-0 right-0',
  };

  const slideDirection = position === 'top' ? -100 : 100;

  if (reducedMotion) {
    if (!isOffline) return null;
    
    return (
      <div 
        className={`
          fixed ${positionClasses[position]} z-50
          bg-gray-900 text-white
          ${className}
        `}
      >
        <div className="safe-area-inset px-4 py-3">
          <div className="flex items-center justify-center gap-3">
            <WifiOff className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium">{message}</span>
            {pendingCount > 0 && (
              <span className="text-xs text-gray-400">
                ({pendingCount} pending)
              </span>
            )}
            {showRetry && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{retryMessage}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: slideDirection, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: slideDirection, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`
            fixed ${positionClasses[position]} z-50
            bg-gray-900 text-white
            ${className}
          `}
        >
          <div className="safe-area-inset px-4 py-3">
            <div className="flex items-center justify-center gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              >
                <WifiOff className="w-5 h-5 text-yellow-400" />
              </motion.div>
              <span className="text-sm font-medium">{message}</span>
              {pendingCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs bg-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-full"
                >
                  {pendingCount} pending
                </motion.span>
              )}
              {showRetry && (
                <motion.button
                  onClick={handleRetry}
                  className="flex items-center gap-1 text-sm text-yellow-400 hover:text-yellow-300"
                  whileTap={{ scale: 0.95 }}
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{retryMessage}</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
