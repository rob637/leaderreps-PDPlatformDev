// src/components/conditioning/LoopClosureModal.jsx
// Phase 5: Loop closure for completed reps
// Captures follow-up outcome to close the accountability loop
// UX v2: Uses ConditioningModal + VoiceTextarea, consistent look

import React, { useState } from 'react';
import { Button } from '../ui';
import { 
  CheckCircle, RefreshCw, AlertTriangle, 
  Calendar, ArrowRight
} from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import VoiceTextarea from './VoiceTextarea';

// ============================================
// OUTCOME OPTIONS
// ============================================
const OUTCOME_OPTIONS = [
  { 
    id: 'behavior_changed', 
    label: 'Behavior changed', 
    description: 'Saw the change I was looking for',
    icon: CheckCircle,
    color: 'green'
  },
  { 
    id: 'commitment_held', 
    label: 'Commitment held', 
    description: 'They followed through on their commitment',
    icon: CheckCircle,
    color: 'green'
  },
  { 
    id: 'partial_change', 
    label: 'Partial change', 
    description: 'Some progress, not complete',
    icon: ArrowRight,
    color: 'amber'
  },
  { 
    id: 'needs_another_rep', 
    label: 'Needs another conversation', 
    description: 'Follow-up rep required',
    icon: RefreshCw,
    color: 'blue'
  },
  { 
    id: 'no_change', 
    label: 'No change observed', 
    description: 'Behavior/commitment not maintained',
    icon: AlertTriangle,
    color: 'red'
  }
];

// ============================================
// OUTCOME SELECTOR
// ============================================
const OutcomeSelector = ({ value, onChange, showError = false }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        What happened after the conversation? <span className="text-red-500">*</span>
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Close the loop on this rep by recording the follow-up outcome.
      </p>
      <div className="space-y-2">
        {OUTCOME_OPTIONS.map(option => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          const colorClasses = {
            green: isSelected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-green-300',
            amber: isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-amber-300',
            blue: isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-blue-300',
            red: isSelected ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-red-300'
          };
          const iconColorClasses = {
            green: isSelected ? 'text-green-600' : 'text-gray-400',
            amber: isSelected ? 'text-amber-600' : 'text-gray-400',
            blue: isSelected ? 'text-blue-600' : 'text-gray-400',
            red: isSelected ? 'text-red-600' : 'text-gray-400'
          };
          
          return (
            <button
              key={option.id}
              onClick={() => onChange(option.id)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${colorClasses[option.color]}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 ${iconColorClasses[option.color]}`} />
              <div>
                <span className="text-sm font-medium">{option.label}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{option.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// MAIN MODAL COMPONENT
// ============================================
const LoopClosureModal = ({ 
  isOpen, 
  onClose, 
  rep, 
  onSubmit, 
  isLoading = false 
}) => {
  const [outcome, setOutcome] = useState('');
  const [behaviorObserved, setBehaviorObserved] = useState('');
  const [notes, setNotes] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  
  const isValid = outcome !== '';
  
  const handleSubmit = () => {
    if (!isValid) {
      setShowValidation(true);
      return;
    }
    
    onSubmit({
      repId: rep.id,
      outcome,
      behavior_observed: behaviorObserved.trim() || null,
      notes: notes.trim() || null,
      recommend_follow_up: outcome === 'needs_another_rep' || outcome === 'no_change'
    });
  };
  
  if (!rep) return null;
  
  return (
    <ConditioningModal
      isOpen={isOpen}
      onClose={onClose}
      title="Close the Loop"
      icon={CheckCircle}
      subtitle={`${rep?.person || ''} • ${rep?.repType || ''}`}
      contextBar={
        rep.debriefedAt ? (
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>Debriefed {new Date(rep.debriefedAt.toDate?.() || rep.debriefedAt).toLocaleDateString()}</span>
          </div>
        ) : null
      }
      footer={
        <div className="flex items-center gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            className="flex-1 bg-corporate-teal hover:bg-corporate-teal-dark text-white disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Close Loop'}
          </Button>
        </div>
      }
    >
      {/* Outcome Selection */}
      <OutcomeSelector value={outcome} onChange={setOutcome} showError={showValidation} />
      
      {/* Validation Error */}
      {showValidation && !outcome && (
        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          Please select an outcome
        </p>
      )}
      
      {/* Behavior Observed (for positive outcomes) */}
      {(outcome === 'behavior_changed' || outcome === 'commitment_held' || outcome === 'partial_change') && (
        <div className="mt-4">
          <VoiceTextarea
            label="What did you observe? (Optional)"
            value={behaviorObserved}
            onChange={setBehaviorObserved}
            placeholder="Describe the change you noticed..."
            rows={3}
          />
        </div>
      )}
      
      {/* Notes for negative outcomes */}
      {(outcome === 'needs_another_rep' || outcome === 'no_change') && (
        <div className="mt-4">
          <VoiceTextarea
            label="What will you do next? (Optional)"
            value={notes}
            onChange={setNotes}
            placeholder="Next steps or follow-up plan..."
            rows={3}
          />
        </div>
      )}
      
      {/* Follow-up recommendation hint */}
      {outcome === 'needs_another_rep' && (
        <div className="mt-4 p-3 bg-corporate-navy/5 border border-corporate-navy/10 rounded-xl">
          <p className="text-sm text-corporate-navy">
            <RefreshCw className="w-4 h-4 inline mr-1" />
            This will add a follow-up item to your action list
          </p>
        </div>
      )}
    </ConditioningModal>
  );
};

export default LoopClosureModal;
