import React from 'react';
import { CheckCircle, Circle, Play, BookOpen, Users, Video, FileText, Zap, AlertCircle } from 'lucide-react';
import { Card } from '../ui';
import { useDevPlan } from '../../hooks/useDevPlan';

const ThisWeeksActionsWidget = ({ scope }) => {
  // If scope is provided (e.g. from Widget Lab preview), use it.
  // Otherwise, use the real hook.
  const devPlanHook = useDevPlan();
  
  // Determine which data source to use
  const currentWeek = scope?.currentWeek || devPlanHook.currentWeek;
  const toggleItemComplete = scope?.toggleItemComplete || devPlanHook.toggleItemComplete;
  
  // If no current week data, show empty state
  if (!currentWeek) {
    return (
      <Card title="This Week's Actions" icon={CheckCircle} accent="TEAL">
        <div className="p-4 text-center text-slate-500 text-sm">
          No active plan found.
        </div>
      </Card>
    );
  }

  const { 
    content = [], 
    community = [], 
    coaching = [],
    userProgress 
  } = currentWeek;

  const completedItems = userProgress?.itemsCompleted || [];

  // Combine all actionable items
  const allActions = [
    ...content.map(i => ({ ...i, category: 'Content' })),
    ...community.map(i => ({ ...i, category: 'Community' })),
    ...coaching.map(i => ({ ...i, category: 'Coaching' }))
  ];

  // Helper to get icon based on type
  const getIcon = (type) => {
    const normalized = (type || '').toUpperCase();
    switch (normalized) {
      case 'WORKOUT': return Video;
      case 'PROGRAM': return Play;
      case 'SKILL': return Zap;
      case 'TOOL': return FileText;
      case 'READ_AND_REP': return BookOpen;
      case 'LEADER_CIRCLE': return Users;
      case 'OPEN_GYM': return Users;
      default: return Circle;
    }
  };

  const handleToggle = (id) => {
    const isComplete = !completedItems.includes(id);
    toggleItemComplete(id, isComplete);
  };

  return (
    <Card title="This Week's Actions" icon={CheckCircle} accent="TEAL">
      <div className="space-y-1">
        {allActions.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-sm italic">
            No actions scheduled for this week.
          </div>
        ) : (
          allActions.map((item, idx) => {
            const isCompleted = completedItems.includes(item.id);
            const Icon = getIcon(item.type);
            
            return (
              <div 
                key={item.id || idx}
                onClick={() => handleToggle(item.id)}
                className={`
                  group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer
                  ${isCompleted 
                    ? 'bg-teal-50 border-teal-100' 
                    : 'bg-white border-slate-100 hover:border-teal-200 hover:shadow-sm'
                  }
                `}
              >
                {/* Checkbox */}
                <div className={`
                  mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                  ${isCompleted 
                    ? 'bg-teal-500 border-teal-500' 
                    : 'bg-white border-slate-300 group-hover:border-teal-400'
                  }
                `}>
                  {isCompleted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm font-medium truncate ${isCompleted ? 'text-teal-900 line-through opacity-75' : 'text-slate-700'}`}>
                      {item.title || item.name || 'Untitled Action'}
                    </p>
                    {item.required !== false && !item.optional && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Required
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Icon className="w-3 h-3" />
                    <span className="capitalize">{item.type?.replace(/_/g, ' ').toLowerCase() || 'Action'}</span>
                    <span>•</span>
                    <span>{item.estimatedTime || '15m'}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default ThisWeeksActionsWidget;
