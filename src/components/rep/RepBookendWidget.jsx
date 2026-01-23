// src/components/rep/RepBookendWidget.jsx
// Embedded bookend experience within Rep conversation

import React, { useState } from 'react';
import { Sun, Moon, Sparkles, Check, ChevronRight } from 'lucide-react';

/**
 * RepBookendWidget - Morning/Evening bookend embedded in Rep flow
 * Simplified, focused experience
 */
const RepBookendWidget = ({ 
  type = 'morning', // 'morning' | 'evening'
  onComplete,
  userName = 'Leader'
}) => {
  const [step, setStep] = useState(0);
  const [intentions, setIntentions] = useState(['', '', '']);
  const [gratitude, setGratitude] = useState('');
  const [reflection, setReflection] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const isMorning = type === 'morning';

  const prompts = isMorning 
    ? {
        title: 'Morning Intentions',
        icon: Sun,
        iconColor: 'text-amber-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        subtitle: "Set your intentions for today",
        fields: [
          { label: 'What will you focus on today?', placeholder: 'My main focus today is...' },
          { label: 'What leadership skill will you practice?', placeholder: 'I will practice...' },
          { label: 'Who will you serve today?', placeholder: 'I will help...' },
        ]
      }
    : {
        title: 'Evening Reflection',
        icon: Moon,
        iconColor: 'text-indigo-500',
        bgColor: 'bg-indigo-50',
        borderColor: 'border-indigo-200',
        subtitle: "Reflect on your day",
        fields: [
          { label: 'What went well today?', placeholder: 'Today I...' },
          { label: 'What did you learn?', placeholder: 'I learned...' },
          { label: "What will you do differently tomorrow?", placeholder: 'Tomorrow I will...' },
        ]
      };

  const Icon = prompts.icon;

  const handleIntentionChange = (index, value) => {
    const newIntentions = [...intentions];
    newIntentions[index] = value;
    setIntentions(newIntentions);
  };

  const handleComplete = () => {
    setIsComplete(true);
    if (onComplete) {
      onComplete({
        type,
        intentions: isMorning ? intentions : undefined,
        gratitude: !isMorning ? gratitude : undefined,
        reflection: !isMorning ? reflection : undefined,
        completedAt: new Date().toISOString()
      });
    }
  };

  const isValid = isMorning 
    ? intentions.some(i => i.trim().length > 0)
    : reflection.trim().length > 0 || gratitude.trim().length > 0;

  if (isComplete) {
    return (
      <div className={`${prompts.bgColor} rounded-xl p-6 text-center border ${prompts.borderColor}`}>
        <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center mb-3 shadow-sm">
          <Check className="w-6 h-6 text-corporate-teal" />
        </div>
        <h3 className="font-semibold text-rep-text-primary mb-1">
          {isMorning ? 'Intentions Set!' : 'Day Complete!'}
        </h3>
        <p className="text-sm text-rep-text-secondary">
          {isMorning 
            ? "You're ready to lead today." 
            : "Great reflection. Rest well."}
        </p>
      </div>
    );
  }

  return (
    <div className={`${prompts.bgColor} rounded-xl overflow-hidden border ${prompts.borderColor}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/50 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Icon className={`w-5 h-5 ${prompts.iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-rep-text-primary">{prompts.title}</h3>
          <p className="text-xs text-rep-text-secondary">{prompts.subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {prompts.fields.map((field, index) => (
          <div key={index}>
            <label className="block text-sm font-medium text-rep-text-primary mb-1.5">
              {field.label}
            </label>
            <input
              type="text"
              value={intentions[index]}
              onChange={(e) => handleIntentionChange(index, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm 
                         placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-corporate-teal/30
                         focus:border-corporate-teal transition-all"
            />
          </div>
        ))}

        {/* Complete Button */}
        <button
          onClick={handleComplete}
          disabled={!isValid}
          className={`
            w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2
            transition-all duration-200
            ${isValid 
              ? 'bg-corporate-teal text-white hover:bg-corporate-teal-dark shadow-sm' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          <Sparkles className="w-4 h-4" />
          {isMorning ? 'Set My Intentions' : 'Complete Reflection'}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RepBookendWidget;
