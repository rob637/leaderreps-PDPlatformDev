/**
 * SyncIndicator - Shows sync status for pending actions
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import useOffline from './useOffline';
import { useReducedMotion } from '../motion/useAnimations';

const SyncIndicator = ({
  variant = 'icon', // 'icon' | 'badge' | 'toast'
  showWhenSynced = false,
  className = '',
}) => {
  const { 
    isOnline, 
    syncStatus, 
    pendingCount, 
    hasPendingActions,
    lastSyncTime,
  } = useOffline();
  const reducedMotion = useReducedMotion();

  // Format last sync time
  const formatSyncTime = () => {
    if (!lastSyncTime) return null;
    const diff = Date.now() - lastSyncTime;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const getIcon = () => {
    if (!isOnline) return CloudOff;
    if (syncStatus === 'syncing') return RefreshCw;
    if (syncStatus === 'error') return AlertCircle;
    if (hasPendingActions) return Cloud;
    return Check;
  };

  const getColor = () => {
    if (!isOnline) return 'text-gray-400';
    if (syncStatus === 'syncing') return 'text-blue-500';
    if (syncStatus === 'error') return 'text-red-500';
    if (hasPendingActions) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getLabel = () => {
    if (!isOnline) return 'Offline';
    if (syncStatus === 'syncing') return 'Syncing...';
    if (syncStatus === 'error') return 'Sync failed';
    if (hasPendingActions) return `${pendingCount} pending`;
    return 'Synced';
  };

  const Icon = getIcon();
  const color = getColor();
  const label = getLabel();

  // Don't show if synced and showWhenSynced is false
  if (!hasPendingActions && !showWhenSynced && syncStatus === 'idle' && isOnline) {
    return null;
  }

  // Icon variant
  if (variant === 'icon') {
    return (
      <motion.div
        className={`relative ${className}`}
        animate={syncStatus === 'syncing' ? { rotate: 360 } : {}}
        transition={{ repeat: syncStatus === 'syncing' ? Infinity : 0, duration: 1, ease: 'linear' }}
      >
        <Icon className={`w-5 h-5 ${color}`} />
        {hasPendingActions && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {pendingCount}
          </motion.span>
        )}
      </motion.div>
    );
  }

  // Badge variant
  if (variant === 'badge') {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={syncStatus + hasPendingActions}
          initial={reducedMotion ? {} : { y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reducedMotion ? {} : { y: 10, opacity: 0 }}
          className={`
            inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
            ${!isOnline 
              ? 'bg-gray-100 text-gray-600' 
              : syncStatus === 'error'
                ? 'bg-red-100 text-red-700'
                : syncStatus === 'syncing'
                  ? 'bg-blue-100 text-blue-700'
                  : hasPendingActions
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
            }
            ${className}
          `}
        >
          <motion.div
            animate={syncStatus === 'syncing' ? { rotate: 360 } : {}}
            transition={{ repeat: syncStatus === 'syncing' ? Infinity : 0, duration: 1, ease: 'linear' }}
          >
            <Icon className="w-4 h-4" />
          </motion.div>
          <span>{label}</span>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Toast variant
  if (variant === 'toast') {
    return (
      <AnimatePresence>
        {(syncStatus === 'syncing' || syncStatus === 'error' || hasPendingActions) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`
              fixed bottom-4 left-4 right-4 mx-auto max-w-sm
              flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg
              ${syncStatus === 'error'
                ? 'bg-red-500 text-white'
                : syncStatus === 'syncing'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-800 text-white'
              }
              ${className}
            `}
          >
            <motion.div
              animate={syncStatus === 'syncing' ? { rotate: 360 } : {}}
              transition={{ repeat: syncStatus === 'syncing' ? Infinity : 0, duration: 1, ease: 'linear' }}
            >
              <Icon className="w-5 h-5" />
            </motion.div>
            <div className="flex-1">
              <p className="font-medium">{label}</p>
              {formatSyncTime() && (
                <p className="text-sm opacity-80">Last sync: {formatSyncTime()}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return null;
};

export default SyncIndicator;
