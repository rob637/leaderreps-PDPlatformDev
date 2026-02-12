// src/components/conditioning/TrainerNudgeNotification.jsx
// Phase 3: Display nudge notifications from trainer to leader

import React, { useState, useEffect, useCallback } from 'react';
import conditioningService from '../../services/conditioningService.js';
import { Card } from '../ui';
import { 
  MessageSquare, Clock, Heart, HelpCircle, AlertTriangle,
  X, Check, ChevronDown, ChevronUp, User
} from 'lucide-react';

// Nudge type config (same as panel)
const NUDGE_TYPES = {
  reminder: {
    label: 'Reminder',
    icon: Clock,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700',
    borderColor: 'border-l-blue-500'
  },
  encouragement: {
    label: 'From Your Trainer',
    icon: Heart,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700',
    borderColor: 'border-l-green-500'
  },
  check_in: {
    label: 'Check-In',
    icon: HelpCircle,
    bgColor: 'bg-sky-100',
    textColor: 'text-sky-700',
    borderColor: 'border-l-sky-500'
  },
  escalation: {
    label: 'Important',
    icon: AlertTriangle,
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700',
    borderColor: 'border-l-red-500'
  }
};

// ============================================
// SINGLE NUDGE NOTIFICATION
// ============================================
const NudgeCard = ({ nudge, onDismiss, onMarkRead }) => {
  const config = NUDGE_TYPES[nudge.type] || NUDGE_TYPES.reminder;
  const Icon = config.icon;
  const isUnread = nudge.status === 'unread';
  
  const sentDate = nudge.sentAt?.toDate?.() || new Date(nudge.sentAt);
  const timeAgo = getTimeAgo(sentDate);
  
  return (
    <Card className={`border-l-4 ${config.borderColor} ${isUnread ? 'bg-blue-50/30 dark:bg-blue-900/20/30' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${config.bgColor} flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${config.textColor}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-400">{timeAgo}</span>
              {isUnread && (
                <span className="w-2 h-2 bg-blue-500 rounded-full" />
              )}
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-200">{nudge.message}</p>
            
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <User className="w-3 h-3" />
                <span>From your trainer</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            {isUnread && onMarkRead && (
              <button
                onClick={() => onMarkRead(nudge.id)}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Mark as read"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
            {onDismiss && (
              <button
                onClick={() => onDismiss(nudge.id)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// NUDGE LIST
// ============================================
const TrainerNudgeNotification = ({ db, userId, showAll = false }) => {
  const [nudges, setNudges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(showAll);
  
  const loadNudges = useCallback(async () => {
    if (!db || !userId) return;
    
    try {
      setIsLoading(true);
      const userNudges = await conditioningService.getUserNudges(db, userId, false);
      setNudges(userNudges);
    } catch (err) {
      console.error('Error loading nudges:', err);
    } finally {
      setIsLoading(false);
    }
  }, [db, userId]);
  
  useEffect(() => {
    loadNudges();
  }, [loadNudges]);
  
  const handleMarkRead = async (notificationId) => {
    try {
      await conditioningService.markNudgeAsRead(db, userId, notificationId);
      setNudges(prev => prev.map(n => 
        n.id === notificationId ? { ...n, status: 'read', readAt: new Date() } : n
      ));
    } catch (err) {
      console.error('Error marking nudge as read:', err);
    }
  };
  
  const handleDismiss = async (notificationId) => {
    // For now, just mark as read
    await handleMarkRead(notificationId);
  };
  
  if (isLoading) {
    return null; // Don't show loading state for notifications
  }
  
  const unreadNudges = nudges.filter(n => n.status === 'unread');
  const readNudges = nudges.filter(n => n.status !== 'unread');
  
  // Only show if there are nudges
  if (nudges.length === 0) {
    return null;
  }
  
  // If not expanded, only show unread nudges
  const displayNudges = isExpanded ? nudges : unreadNudges;
  
  if (displayNudges.length === 0 && !isExpanded) {
    return null;
  }
  
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-corporate-navy" />
          <span className="text-sm font-medium text-corporate-navy">
            Messages from Trainer
          </span>
          {unreadNudges.length > 0 && (
            <span className="px-1.5 py-0.5 bg-blue-500 text-white rounded-full text-xs">
              {unreadNudges.length}
            </span>
          )}
        </div>
        
        {readNudges.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-corporate-navy flex items-center gap-1"
          >
            {isExpanded ? (
              <>Hide read <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>{readNudges.length} older <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>
      
      <div className="space-y-2">
        {displayNudges.map(nudge => (
          <NudgeCard
            key={nudge.id}
            nudge={nudge}
            onMarkRead={handleMarkRead}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// HELPER: Time ago
// ============================================
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

export default TrainerNudgeNotification;
