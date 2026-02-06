import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckCircle, Circle, ArrowRight, X, Sparkles, 
  Users, Presentation, GitMerge, Mail, Zap
} from 'lucide-react';

/**
 * QuickStartWizard - Dripify-inspired onboarding wizard
 * 
 * A step-by-step guide to help new users get started quickly.
 * Shows a progress checklist with actionable steps.
 */

const QUICK_START_STEPS = [
  {
    id: 'create-prospect',
    title: 'Add your first prospect',
    description: 'Import or manually add a contact to target',
    link: '/sales/prospects',
    icon: Users,
    action: 'Add Prospect',
    color: 'blue'
  },
  {
    id: 'setup-campaign',
    title: 'Create an outreach campaign',
    description: 'Set up a multi-step sequence to engage prospects',
    link: '/sales/sequences',
    icon: GitMerge,
    action: 'Create Campaign',
    color: 'fuchsia'
  },
  {
    id: 'create-demo',
    title: 'Build a demo experience',
    description: 'Create a shareable demo link for prospects',
    link: '/sales/demos',
    icon: Presentation,
    action: 'Create Demo',
    color: 'emerald'
  },
  {
    id: 'send-email',
    title: 'Send your first outreach',
    description: 'Use templates to personalize your first email',
    link: '/sales/outreach',
    icon: Mail,
    action: 'Start Outreach',
    color: 'purple'
  },
  {
    id: 'connect-integration',
    title: 'Connect an integration',
    description: 'Link LinkedIn, Calendly, or your CRM',
    link: '/integration',
    icon: Zap,
    action: 'Connect',
    color: 'amber'
  }
];

const QuickStartWizard = ({ visible = true, onToggle }) => {
  const [completedSteps, setCompletedSteps] = useState([]);
  
  // Load completed steps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('quickstart_completed');
    if (saved) {
      setCompletedSteps(JSON.parse(saved));
    }
  }, []);

  const markComplete = (stepId) => {
    const updated = [...completedSteps, stepId];
    setCompletedSteps(updated);
    localStorage.setItem('quickstart_completed', JSON.stringify(updated));
  };

  const progress = Math.round((completedSteps.length / QUICK_START_STEPS.length) * 100);

  // If not visible, don't render anything
  if (!visible) {
    return null;
  }

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' }
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl p-6 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-corporate-teal/10 rounded-xl">
            <Sparkles className="w-6 h-6 text-corporate-teal" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-corporate-navy">Get Started in Minutes</h2>
            <p className="text-sm text-slate-500">Complete these steps to unlock your sales potential</p>
          </div>
        </div>
        {onToggle && (
          <button 
            onClick={onToggle}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Hide Quick Start"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-slate-500">{completedSteps.length} of {QUICK_START_STEPS.length} complete</span>
          <span className="font-medium text-corporate-teal">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-corporate-teal to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {QUICK_START_STEPS.map((step, index) => {
          const isComplete = completedSteps.includes(step.id);
          const colors = colorMap[step.color];
          const Icon = step.icon;
          
          return (
            <div 
              key={step.id}
              className={`relative rounded-xl border p-4 transition-all ${
                isComplete 
                  ? 'bg-slate-50 border-slate-200 opacity-60' 
                  : `${colors.bg} ${colors.border} hover:shadow-md`
              }`}
            >
              {/* Step Number Badge */}
              <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isComplete ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}>
                {isComplete ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>

              <div className={`p-2 rounded-lg w-fit mb-3 ${isComplete ? 'bg-slate-200' : colors.bg}`}>
                <Icon className={`w-5 h-5 ${isComplete ? 'text-slate-400' : colors.text}`} />
              </div>
              
              <h3 className={`font-semibold text-sm mb-1 ${isComplete ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                {step.title}
              </h3>
              <p className={`text-xs mb-3 ${isComplete ? 'text-slate-400' : 'text-slate-500'}`}>
                {step.description}
              </p>
              
              {!isComplete ? (
                <Link 
                  to={step.link}
                  onClick={() => markComplete(step.id)}
                  className={`inline-flex items-center gap-1 text-xs font-semibold ${colors.text} hover:underline`}
                >
                  {step.action} <ArrowRight className="w-3 h-3" />
                </Link>
              ) : (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Done
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickStartWizard;
