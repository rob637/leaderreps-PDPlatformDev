// src/components/conditioning/RepProgressionTracker.jsx
// Visual rep progression tracker showing state workflow
// Sprint 2: States + Progression (020726)
// Phase 5: Added Loop Closure states

import React, { useMemo } from 'react';
import { 
  Clock, FileText, Calendar, Play, CheckCircle, Check,
  XCircle, AlertCircle, ChevronRight, Lock, Unlock, RefreshCw, CircleCheck
} from 'lucide-react';
import { STATE_TRANSITIONS, REP_STATUS } from '../../services/conditioningService.js';
import { isPrepRequired, getRepType, RISK_LEVELS } from '../../services/repTaxonomy.js';

// ============================================
// STATE DEFINITIONS
// V1 UX: Updated labels for clarity (Delivered ≠ Closed)
// Phase 5: Added follow-up and loop closure states
// ============================================
const STATE_CONFIG = {
  committed: {
    label: 'Planned',
    shortLabel: 'Planned',
    icon: Clock,
    color: 'blue',
    description: 'Rep committed, ready for prep or execution'
  },
  prepared: {
    label: 'Prepared',
    shortLabel: 'Prepped',
    icon: FileText,
    color: 'slate',
    description: 'Prep work completed, ready to execute'
  },
  scheduled: {
    label: 'Scheduled',
    shortLabel: 'Sched',
    icon: Calendar,
    color: 'sky',
    description: 'Time/meeting scheduled for rep'
  },
  executed: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    icon: Play,
    color: 'teal',
    description: 'Conversation happened, awaiting debrief'
  },
  debriefed: {
    label: 'Debriefed',
    shortLabel: 'Debriefed',
    icon: CheckCircle,
    color: 'green',
    description: 'Reflection complete, awaiting loop closure'
  },
  follow_up_pending: {
    label: 'Follow-Up',
    shortLabel: 'Follow-Up',
    icon: RefreshCw,
    color: 'orange',
    description: 'Tracking behavior change'
  },
  loop_closed: {
    label: 'Loop Closed',
    shortLabel: 'Closed',
    icon: CircleCheck,
    color: 'emerald',
    description: 'Rep complete - loop closed'
  },
  missed: {
    label: 'Missed',
    shortLabel: 'Missed',
    icon: AlertCircle,
    color: 'amber',
    description: 'Past deadline without execution'
  },
  canceled: {
    label: 'Canceled',
    shortLabel: 'Canceled',
    icon: XCircle,
    color: 'gray',
    description: 'Canceled with reason'
  }
};

// Color utility for Tailwind classes
const getColorClasses = (color, variant = 'default') => {
  const colors = {
    blue: {
      default: 'bg-blue-100 text-blue-700 border-blue-300',
      active: 'bg-blue-600 text-white border-blue-700',
      muted: 'bg-blue-50 text-blue-400 border-blue-200'
    },
    slate: {
      default: 'bg-slate-100 text-slate-700 border-slate-300',
      active: 'bg-slate-600 text-white border-slate-700',
      muted: 'bg-slate-50 text-slate-400 border-slate-200'
    },
    sky: {
      default: 'bg-sky-100 text-sky-700 border-sky-300',
      active: 'bg-sky-600 text-white border-sky-700',
      muted: 'bg-sky-50 text-sky-400 border-sky-200'
    },
    teal: {
      default: 'bg-teal-100 text-teal-700 border-teal-300',
      active: 'bg-teal-600 text-white border-teal-700',
      muted: 'bg-teal-50 text-teal-400 border-teal-200'
    },
    green: {
      default: 'bg-green-100 text-green-700 border-green-300',
      active: 'bg-green-600 text-white border-green-700',
      muted: 'bg-green-50 text-green-400 border-green-200'
    },
    orange: {
      default: 'bg-orange-100 text-orange-700 border-orange-300',
      active: 'bg-orange-600 text-white border-orange-700',
      muted: 'bg-orange-50 text-orange-400 border-orange-200'
    },
    emerald: {
      default: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      active: 'bg-emerald-600 text-white border-emerald-700',
      muted: 'bg-emerald-50 text-emerald-400 border-emerald-200'
    },
    amber: {
      default: 'bg-amber-100 text-amber-700 border-amber-300',
      active: 'bg-amber-600 text-white border-amber-700',
      muted: 'bg-amber-50 text-amber-400 border-amber-200'
    },
    gray: {
      default: 'bg-gray-100 text-gray-600 border-gray-300',
      active: 'bg-gray-600 text-white border-gray-700',
      muted: 'bg-gray-50 text-gray-400 border-gray-200'
    }
  };
  return colors[color]?.[variant] || colors.gray[variant];
};

// ============================================
// PROGRESSION PATH - Main workflow states (including loop closure)
// ============================================
const PROGRESSION_PATH = ['committed', 'prepared', 'scheduled', 'executed', 'debriefed', 'loop_closed'];

// ============================================
// STATE NODE COMPONENT
// ============================================
const StateNode = ({ 
  state, 
  currentState, 
  isReachable, 
  isPrepLocked, 
  onClick,
  compact = false 
}) => {
  const config = STATE_CONFIG[state];
  if (!config) return null;
  
  const Icon = config.icon;
  const isCurrent = currentState === state;
  const isPast = getStateIndex(currentState) > getStateIndex(state);
  // Note: isFuture calculated but not currently used - reserved for future styling
  
  // Determine visual state
  let variant = 'muted';
  let clickable = false;
  
  if (isCurrent) {
    variant = 'active';
  } else if (isPast) {
    variant = 'default';
  } else if (isReachable && !isPrepLocked) {
    variant = 'default';
    clickable = true;
  }
  
  const colorClasses = getColorClasses(config.color, variant);
  
  if (compact) {
    return (
      <div 
        className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all ${colorClasses} ${
          clickable ? 'cursor-pointer hover:scale-110' : ''
        }`}
        onClick={clickable ? onClick : undefined}
        title={config.label}
      >
        {isPrepLocked && state === 'executed' ? (
          <Lock className="w-4 h-4" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
      </div>
    );
  }
  
  return (
    <div 
      className={`flex flex-col items-center gap-1 ${clickable ? 'cursor-pointer group' : ''}`}
      onClick={clickable ? onClick : undefined}
    >
      <div 
        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${colorClasses} ${
          clickable ? 'group-hover:scale-110' : ''
        }`}
      >
        {isPrepLocked && state === 'executed' ? (
          <Lock className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      <span className={`text-xs font-medium ${
        isCurrent ? 'text-corporate-navy' : isPast ? 'text-gray-600' : 'text-gray-400'
      }`}>
        {config.shortLabel}
      </span>
    </div>
  );
};

// Get index of state in progression path
const getStateIndex = (state) => {
  const index = PROGRESSION_PATH.indexOf(state);
  return index >= 0 ? index : -1;
};

// ============================================
// CONNECTOR LINE BETWEEN STATES
// ============================================
const StateConnector = ({ toState, currentState }) => {
  const toIndex = getStateIndex(toState);
  const currentIndex = getStateIndex(currentState);
  
  const isComplete = currentIndex >= toIndex;
  
  return (
    <div className={`flex-1 h-0.5 mx-1 transition-colors ${
      isComplete ? 'bg-green-400' : 'bg-gray-200'
    }`} />
  );
};

// ============================================
// MAIN PROGRESSION TRACKER COMPONENT
// ============================================
const RepProgressionTracker = ({ 
  rep,
  onStateChange,
  showActions = true,
  compact = false
}) => {
  const { status, repType, riskLevel = 'medium', prepRequired } = rep;
  
  // Get allowed next states
  const allowedTransitions = useMemo(() => {
    return STATE_TRANSITIONS[status] || [];
  }, [status]);
  
  // Check if prep is required before execution
  const needsPrep = useMemo(() => {
    return isPrepRequired(repType, riskLevel) && !rep.preparedAt && prepRequired !== false;
  }, [repType, riskLevel, rep.preparedAt, prepRequired]);
  
  // Check if execution is locked (needs prep first)
  const executionLocked = useMemo(() => {
    if (status !== 'committed') return false;
    return needsPrep;
  }, [status, needsPrep]);
  
  // Handle state transition
  const handleTransition = (newState) => {
    if (onStateChange && allowedTransitions.includes(newState)) {
      onStateChange(rep.id, newState);
    }
  };
  
  // Render the main progression path states
  const mainStates = PROGRESSION_PATH.filter(s => {
    // Hide scheduled if not a scheduling-type rep
    if (s === 'scheduled') {
      const repTypeConfig = getRepType(repType);
      return repTypeConfig?.schedulable !== false;
    }
    return true;
  });
  
  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {mainStates.map((state, idx) => (
          <React.Fragment key={state}>
            <StateNode
              state={state}
              currentState={status}
              isReachable={allowedTransitions.includes(state)}
              isPrepLocked={executionLocked && state === 'executed'}
              onClick={() => handleTransition(state)}
              compact={true}
            />
            {idx < mainStates.length - 1 && (
              <ChevronRight className="w-3 h-3 text-gray-300" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Progress Line */}
      <div className="flex items-center mb-4">
        {mainStates.map((state, idx) => (
          <React.Fragment key={state}>
            <StateNode
              state={state}
              currentState={status}
              isReachable={allowedTransitions.includes(state)}
              isPrepLocked={executionLocked && state === 'executed'}
              onClick={() => handleTransition(state)}
            />
            {idx < mainStates.length - 1 && (
              <StateConnector 
                toState={mainStates[idx + 1]}
                currentState={status}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      
      {/* Current State Info */}
      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-corporate-navy">
              Current: {STATE_CONFIG[status]?.label || status}
            </span>
            <p className="text-xs text-gray-500 mt-0.5">
              {STATE_CONFIG[status]?.description}
            </p>
          </div>
          
          {/* Prep Lock Warning */}
          {executionLocked && (
            <div className="flex items-center gap-1 text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded">
              <Lock className="w-3 h-3" />
              <span>Prep required first</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      {showActions && (
        <StateActionButtons
          allowedTransitions={allowedTransitions}
          executionLocked={executionLocked}
          onTransition={handleTransition}
        />
      )}
    </div>
  );
};

// ============================================
// STATE ACTION BUTTONS
// ============================================
const StateActionButtons = ({ 
  allowedTransitions, 
  executionLocked,
  onTransition 
}) => {
  // Define action button configs
  const actionConfigs = {
    prepared: {
      label: 'Mark as Prepared',
      icon: FileText,
      color: 'bg-slate-600 hover:bg-slate-700',
      priority: 2
    },
    scheduled: {
      label: 'Mark as Scheduled',
      icon: Calendar,
      color: 'bg-sky-600 hover:bg-sky-700',
      priority: 3
    },
    executed: {
      label: 'Mark as Executed',
      icon: Play,
      color: 'bg-teal-600 hover:bg-teal-700',
      priority: 1
    },
    debriefed: {
      label: 'Add Debrief',
      icon: CheckCircle,
      color: 'bg-green-600 hover:bg-green-700',
      priority: 1
    },
    follow_up_pending: {
      label: 'Track Follow-Up',
      icon: RefreshCw,
      color: 'bg-orange-600 hover:bg-orange-700',
      priority: 2
    },
    loop_closed: {
      label: 'Close Loop',
      icon: CircleCheck,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      priority: 1
    }
  };
  
  // Get available actions sorted by priority
  const availableActions = allowedTransitions
    .filter(t => actionConfigs[t])
    .filter(t => !(executionLocked && t === 'executed'))
    .sort((a, b) => actionConfigs[a].priority - actionConfigs[b].priority);
  
  if (availableActions.length === 0) return null;
  
  return (
    <div className="border-t border-gray-100 pt-3 mt-3">
      <div className="flex flex-wrap gap-2">
        {availableActions.map(action => {
          const config = actionConfigs[action];
          const Icon = config.icon;
          
          return (
            <button
              key={action}
              onClick={() => onTransition(action)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-white transition-colors ${config.color}`}
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </button>
          );
        })}
        
        {/* Show prep first message if execution is locked */}
        {executionLocked && allowedTransitions.includes('executed') && (
          <button
            onClick={() => onTransition('prepared')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm bg-amber-600 hover:bg-amber-700 text-white transition-colors"
          >
            <Lock className="w-4 h-4" />
            Complete Prep First
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================
// PREP REQUIREMENT INDICATOR
// ============================================
export const PrepRequirementBadge = ({ repType, riskLevel, prepCompleted = false, size = 'default' }) => {
  const required = isPrepRequired(repType, riskLevel);
  
  const sizeClasses = size === 'small' 
    ? 'text-xs px-1.5 py-0.5 gap-0.5' 
    : 'text-sm px-2 py-1 gap-1';
  
  // If prep was required and is now complete, show success badge
  if (required && prepCompleted) {
    return (
      <span className={`inline-flex items-center rounded font-medium bg-green-100 text-green-700 ${sizeClasses}`}>
        <Check className={size === 'small' ? 'w-3 h-3' : 'w-4 h-4'} />
        Prep Complete
      </span>
    );
  }
  
  if (required) {
    return (
      <span className={`inline-flex items-center rounded font-medium bg-amber-100 text-amber-700 ${sizeClasses}`}>
        <Lock className={size === 'small' ? 'w-3 h-3' : 'w-4 h-4'} />
        Prep Required
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center rounded font-medium bg-gray-100 text-gray-600 ${sizeClasses}`}>
      <Unlock className={size === 'small' ? 'w-3 h-3' : 'w-4 h-4'} />
      Prep Optional
    </span>
  );
};

// ============================================
// EXPORTS
// ============================================
export default RepProgressionTracker;
export { STATE_CONFIG, PROGRESSION_PATH, getStateIndex };
