// src/components/conditioning/CommitFlowSelector.jsx
// V2 Entry point - lets users choose between Planned RR and In-the-Moment RR
// Used as the new commit modal entry point

import React, { useState } from 'react';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import ConditioningModal from './ConditioningModal';
import PlannedRepForm from './PlannedRepForm';
import InMomentRepForm from './InMomentRepForm';
import { Button } from '../ui';

// ============================================
// FLOW OPTION CARD
// ============================================
// eslint-disable-next-line no-unused-vars
const FlowOptionCard = ({ icon: Icon, title, description, onClick, color = 'teal' }) => {
  const colorClasses = {
    teal: {
      bg: 'bg-corporate-teal/10 dark:bg-corporate-teal/20',
      border: 'border-corporate-teal/30',
      icon: 'text-corporate-teal',
      hover: 'hover:border-corporate-teal hover:shadow-md'
    },
    navy: {
      bg: 'bg-corporate-navy/10 dark:bg-corporate-navy/20',
      border: 'border-corporate-navy/30',
      icon: 'text-corporate-navy',
      hover: 'hover:border-corporate-navy hover:shadow-md'
    }
  };
  
  const c = colorClasses[color] || colorClasses.teal;
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-xl border-2 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-left transition-all ${c.hover} active:scale-[0.98]`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${c.bg} border ${c.border}`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
          <div>
            <div className="font-semibold text-corporate-navy dark:text-white">{title}</div>
            <div className="text-sm text-gray-500 dark:text-slate-400">{description}</div>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-slate-500" />
      </div>
    </button>
  );
};

// ============================================
// MAIN SELECTOR COMPONENT
// ============================================
const CommitFlowSelector = ({ 
  onSubmit, 
  onClose, 
  isLoading,
  // Optional: start with a specific flow
  initialFlow = null
}) => {
  const [selectedFlow, setSelectedFlow] = useState(initialFlow);
  
  // If a flow is selected, render that form
  if (selectedFlow === 'planned') {
    return (
      <PlannedRepForm
        onSubmit={onSubmit}
        onClose={() => {
          if (initialFlow) {
            onClose();
          } else {
            setSelectedFlow(null);
          }
        }}
        isLoading={isLoading}
      />
    );
  }
  
  if (selectedFlow === 'in_moment') {
    return (
      <InMomentRepForm
        onSubmit={onSubmit}
        onClose={() => {
          if (initialFlow) {
            onClose();
          } else {
            setSelectedFlow(null);
          }
        }}
        isLoading={isLoading}
      />
    );
  }
  
  // Flow selection screen
  return (
    <ConditioningModal
      isOpen={true}
      onClose={onClose}
      title="Commit to a Real Rep"
      subtitle="Choose your flow"
      footer={
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-slate-400 mb-4">
          How would you like to log this rep?
        </p>
        
        <FlowOptionCard
          icon={Calendar}
          title="Plan a Real Rep"
          description="Commit to a rep you'll do in the future"
          onClick={() => setSelectedFlow('planned')}
          color="teal"
        />
        
        <FlowOptionCard
          icon={Clock}
          title="Log In-the-Moment"
          description="I just ran a rep — log it now"
          onClick={() => setSelectedFlow('in_moment')}
          color="navy"
        />
      </div>
    </ConditioningModal>
  );
};

export default CommitFlowSelector;
