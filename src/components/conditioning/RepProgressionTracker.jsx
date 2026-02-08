// src/components/conditioning/RepProgressionTracker.jsx
// Visual rep progression tracker showing state workflow
// Sprint 2: States + Progression (020726)

import React, { useMemo } from 'react';
import { 
  Clock, FileText, Calendar, Play, CheckCircle, 
  XCircle, AlertCircle, ChevronRight, Lock, Unlock
} from 'lucide-react';
import { STATE_TRANSITIONS, REP_STATUS } from '../../services/conditioningService.js';
import { isPrepRequired, getRepType, RISK_LEVELS } from '../../services/repTaxonomy.js';

// ============================================
// STATE DEFINITIONS
// ============================================
const STATE_CONFIG = {
  committed: {
    label: 'Committed',
    shortLabel: 'Set',
    icon: Clock,
    color: 'blue',
    description: 'Rep committed, ready for prep or execution'
  },
  prepared: {
    label: 'Prepared',
    shortLabel: 'Prep',
    icon: FileText,
    color: 'indigo',
    description: 'Prep work completed, ready to execute'
  },
  scheduled: {
    label: 'Scheduled',
    shortLabel: 'Sched',
    icon: Calendar,
    color: 'purple',
    description: 'Time/meeting scheduled for rep'
  },
  executed: {
    label: 'Executed',
    shortLabel: 'Done',
    icon: Play,
    color: 'teal',
    description: 'Rep executed, awaiting debrief'
  },
  debriefed: {
    label: 'Complete',
    shortLabel: 'Done',
    icon: CheckCircle,
    color: 'green',
    description: 'Fully complete with debrief'
  },
  missed: {
    label: 'Missed',
    shortLabel: 'Miss',
    icon: AlertCircle,
    color: 'amber',
    description: 'Past deadline without execution'
  },
  canceled: {
    label: 'Canceled',
    shortLabel: 'X',
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
    indigo: {
      default: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      active: 'bg-indigo-600 text-white border-indigo-700',
      muted: 'bg-indigo-50 text-indigo-400 border-indigo-200'
    },
    purple: {
      default: 'bg-purple-100 text-purple-700 border-purple-300',
      active: 'bg-purple-600 text-white border-purple-700',
      muted: 'bg-purple-50 text-purple-400 border-purple-200'
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
// PROGRESSION PATH - Main workflow states
// ============================================
const PROGRESSION_PATH = ['committed', 'prepared', 'scheduled', 'executed', 'debriefed'];

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
      color: 'bg-indigo-600 hover:bg-indigo-700',
      priority: 2
    },
    scheduled: {
      label: 'Mark as Scheduled',
      icon: Calendar,
      color: 'bg-purple-600 hover:bg-purple-700',
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
export const PrepRequirementBadge = ({ repType, riskLevel, size = 'default' }) => {
  const required = isPrepRequired(repType, riskLevel);
  
  const sizeClasses = size === 'small' 
    ? 'text-xs px-1.5 py-0.5 gap-0.5' 
    : 'text-sm px-2 py-1 gap-1';
  
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
