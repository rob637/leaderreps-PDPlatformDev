/**
 * AnimatedToast - Animated notification toasts
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';
import { springSnappy } from './springPresets';
import { useReducedMotion } from './useAnimations';

const ToastContext = createContext(null);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800',
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

/**
 * Toast Component
 */
const Toast = ({ id, message, type = 'info', onDismiss, duration = 4000 }) => {
  const reducedMotion = useReducedMotion();
  const Icon = icons[type];

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => onDismiss(id), duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -10, scale: 0.95 }}
      transition={springSnappy}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg
        min-w-[280px] max-w-md backdrop-blur-sm
        ${colors[type]}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColors[type]}`} />
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

/**
 * ToastContainer - Renders toast stack
 */
const ToastContainer = ({ toasts, onDismiss, position = 'top-center' }) => {
  const positions = {
    'top-left': 'top-4 left-4 items-start',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'top-right': 'top-4 right-4 items-end',
    'bottom-left': 'bottom-4 left-4 items-start',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-4 right-4 items-end',
  };

  return (
    <div 
      className={`fixed z-50 flex flex-col gap-2 pointer-events-none ${positions[position]}`}
      style={{ maxWidth: 'calc(100vw - 2rem)' }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * ToastProvider - Provides toast context
 */
export const ToastProvider = ({ 
  children, 
  position = 'top-center',
  maxToasts = 5 
}) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => {
      const newToasts = [...prev, { id, message, type, duration }];
      // Limit number of toasts
      return newToasts.slice(-maxToasts);
    });
    return id;
  }, [maxToasts]);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((message, options = {}) => {
    return addToast(message, options.type || 'info', options.duration);
  }, [addToast]);

  // Convenience methods
  toast.success = (message, duration) => addToast(message, 'success', duration);
  toast.error = (message, duration) => addToast(message, 'error', duration);
  toast.warning = (message, duration) => addToast(message, 'warning', duration);
  toast.info = (message, duration) => addToast(message, 'info', duration);

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <ToastContainer 
        toasts={toasts} 
        onDismiss={dismissToast}
        position={position}
      />
    </ToastContext.Provider>
  );
};

/**
 * useToast - Hook to show toasts
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export default Toast;
