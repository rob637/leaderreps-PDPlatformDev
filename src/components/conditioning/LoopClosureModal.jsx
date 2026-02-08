// src/components/conditioning/LoopClosureModal.jsx
// Phase 5: Loop closure for completed reps
// Captures follow-up outcome to close the accountability loop

import React, { useState } from 'react';
import { Card, Button } from '../ui';
import VoiceInputButton from './VoiceInputButton';
import { 
  X, CheckCircle, RefreshCw, AlertTriangle, 
  Calendar, MessageSquare, ArrowRight
} from 'lucide-react';

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
const OutcomeSelector = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-corporate-navy">
        What happened after the conversation?
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Close the loop on this rep by recording the follow-up outcome.
      </p>
      <div className="space-y-2">
        {OUTCOME_OPTIONS.map(option => {
          const Icon = option.icon;
          const isSelected = value === option.id;
          const colorClasses = {
            green: isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300',
            amber: isSelected ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-amber-300',
            blue: isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300',
            red: isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300'
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
              className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${colorClasses[option.color]}`}
            >
              <Icon className={`w-5 h-5 mt-0.5 ${iconColorClasses[option.color]}`} />
              <div>
                <span className="text-sm font-medium">{option.label}</span>
                <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
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
  
  if (!isOpen || !rep) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold text-white">Close the Loop</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded transition-colors text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Rep Context */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{rep.person}</span>
            <span>•</span>
            <span>{rep.repType}</span>
          </div>
          {rep.debriefedAt && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <Calendar className="w-3 h-3" />
              <span>Debriefed {new Date(rep.debriefedAt.toDate?.() || rep.debriefedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Outcome Selection */}
          <OutcomeSelector value={outcome} onChange={setOutcome} />
          
          {/* Validation Error */}
          {showValidation && !outcome && (
            <p className="text-sm text-red-600">Please select an outcome</p>
          )}
          
          {/* Behavior Observed (for positive outcomes) */}
          {(outcome === 'behavior_changed' || outcome === 'commitment_held' || outcome === 'partial_change') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-corporate-navy">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                What did you observe? (Optional)
              </label>
              <div className="relative">
                <textarea
                  value={behaviorObserved}
                  onChange={(e) => setBehaviorObserved(e.target.value)}
                  placeholder="Describe the change you noticed..."
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <div className="absolute right-2 top-2">
                  <VoiceInputButton
                    onTranscription={(text) => setBehaviorObserved(prev => prev ? `${prev} ${text}` : text)}
                    onPartialTranscription={() => {}}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Notes for negative outcomes */}
          {(outcome === 'needs_another_rep' || outcome === 'no_change') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-corporate-navy">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                What will you do next? (Optional)
              </label>
              <div className="relative">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Next steps or follow-up plan..."
                  className="w-full p-3 pr-12 border border-gray-300 rounded-lg text-sm min-h-[80px] resize-none focus:ring-2 focus:ring-corporate-navy focus:border-transparent"
                />
                <div className="absolute right-2 top-2">
                  <VoiceInputButton
                    onTranscription={(text) => setNotes(prev => prev ? `${prev} ${text}` : text)}
                    onPartialTranscription={() => {}}
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Follow-up recommendation hint */}
          {outcome === 'needs_another_rep' && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <RefreshCw className="w-4 h-4 inline mr-1" />
                This will add a follow-up item to your action list
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Close Loop'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoopClosureModal;
