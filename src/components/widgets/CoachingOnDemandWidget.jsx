// src/components/widgets/CoachingOnDemandWidget.jsx
import React from 'react';
import { BrainCircuit, MessageSquare, Target, Clock, ChevronRight, Play } from 'lucide-react';
import { Card } from '../ui';

/**
 * Coaching On-Demand Widget
 * 
 * Displays AI roleplay scenarios and self-paced practice exercises.
 * Users can practice feedback, difficult conversations, coaching, etc.
 */

// Practice categories with icons and colors
const PRACTICE_CATEGORIES = {
  feedback: {
    label: 'Feedback',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-800',
    description: 'Practice giving constructive feedback'
  },
  difficult_conversations: {
    label: 'Difficult Conversations',
    icon: Target,
    color: 'bg-red-100 text-red-800',
    description: 'Navigate challenging discussions'
  },
  coaching: {
    label: 'Coaching',
    icon: BrainCircuit,
    color: 'bg-teal-100 text-teal-800',
    description: 'Develop your coaching skills'
  },
  delegation: {
    label: 'Delegation',
    icon: Target,
    color: 'bg-green-100 text-green-800',
    description: 'Practice effective delegation'
  }
};

// Practice Card Component
const PracticeCard = ({ scenario, onClick }) => {
  const category = PRACTICE_CATEGORIES[scenario.category] || PRACTICE_CATEGORIES.feedback;
  const Icon = category.icon;
  
  return (
    <button
      onClick={() => onClick?.(scenario)}
      className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-corporate-teal hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${category.color}`}>
              {category.label}
            </span>
            {scenario.duration && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {scenario.duration}
              </span>
            )}
          </div>
          
          <h4 className="font-bold text-slate-800 mb-1 group-hover:text-corporate-teal transition-colors">
            {scenario.title}
          </h4>
          
          {scenario.description && (
            <p className="text-sm text-slate-500 line-clamp-2">{scenario.description}</p>
          )}
        </div>
        
        <div className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-corporate-teal group-hover:text-white transition-colors">
          <Play className="w-4 h-4" />
        </div>
      </div>
    </button>
  );
};

// Quick Practice Button
const QuickPracticeButton = ({ category, onClick }) => {
  const config = PRACTICE_CATEGORIES[category] || PRACTICE_CATEGORIES.feedback;
  const Icon = config.icon;
  
  return (
    <button
      onClick={() => onClick?.(category)}
      className="flex flex-col items-center p-3 bg-white rounded-xl border border-slate-200 hover:border-corporate-teal hover:shadow-md transition-all"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.color} mb-2`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-medium text-slate-700">{config.label}</span>
    </button>
  );
};

const CoachingOnDemandWidget = ({ scope = {}, helpText }) => {
  const { 
    scenarios = [],
    navigate,
    startPractice
  } = scope;
  
  // Default scenarios if none provided
  const displayScenarios = scenarios.length > 0 ? scenarios : [
    {
      id: 'feedback-positive',
      title: 'Delivering Positive Feedback',
      description: 'Practice reinforcing great work while maintaining authenticity.',
      category: 'feedback',
      duration: '10 min'
    },
    {
      id: 'feedback-constructive',
      title: 'Constructive Feedback',
      description: 'Learn to deliver improvement-focused feedback with empathy.',
      category: 'feedback',
      duration: '15 min'
    },
    {
      id: 'difficult-performance',
      title: 'Performance Concern',
      description: 'Address underperformance while maintaining relationship.',
      category: 'difficult_conversations',
      duration: '20 min'
    },
    {
      id: 'coaching-grow',
      title: 'GROW Model Practice',
      description: 'Apply the GROW coaching framework in a realistic scenario.',
      category: 'coaching',
      duration: '25 min'
    }
  ];
  
  const handleStartPractice = (scenario) => {
    if (startPractice) {
      startPractice(scenario);
    } else if (navigate) {
      navigate('ai-roleplay', { scenarioId: scenario.id });
    }
  };
  
  const handleQuickStart = (category) => {
    if (navigate) {
      navigate('ai-roleplay', { category });
    }
  };
  
  return (
    <Card title="On-Demand Practice" icon={BrainCircuit} accent="PURPLE" helpText={helpText}>
      {/* Quick Start Grid */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Quick Start</p>
        <div className="grid grid-cols-4 gap-2">
          {Object.keys(PRACTICE_CATEGORIES).map(category => (
            <QuickPracticeButton 
              key={category} 
              category={category} 
              onClick={handleQuickStart}
            />
          ))}
        </div>
      </div>
      
      {/* Featured Scenarios */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Featured Scenarios</p>
        <div className="space-y-2">
          {displayScenarios.slice(0, 3).map(scenario => (
            <PracticeCard 
              key={scenario.id}
              scenario={scenario}
              onClick={handleStartPractice}
            />
          ))}
        </div>
        
        {displayScenarios.length > 3 && (
          <button 
            onClick={() => navigate?.('ai-roleplay')}
            className="w-full mt-3 py-2 text-sm text-corporate-teal font-medium hover:bg-teal-50 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            Browse all scenarios
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </Card>
  );
};

export default CoachingOnDemandWidget;
