import React from 'react';
import { BookOpen, CheckCircle, Circle, MessageSquare, Users, Video } from 'lucide-react';
import { Card } from '../ui';

const DevelopmentPlanWidget = ({ scope }) => {
  const { 
    currentWeek,
    userProgress,
    handleItemToggle,
    handleReflectionUpdate
  } = scope;

  if (!currentWeek) return null;

  const { 
    title, 
    focus, 
    phase, 
    description, 
    content = [], 
    community = [], 
    coaching = [],
    reflectionPrompt
  } = currentWeek;

  const {
    completedItems = [],
    reflectionResponse = ''
  } = userProgress || {};

  const allItems = [...content, ...community, ...coaching];
  // The spec says: requiredItemsCount – total required items in this week.
  // So let's filter by required.
  
  const requiredItems = allItems.filter(i => i.required !== false && i.optional !== true);
  const requiredCompletedCount = requiredItems.filter(i => completedItems.includes(i.id)).length;
  const progressPercent = requiredItems.length > 0 ? (requiredCompletedCount / requiredItems.length) * 100 : 0;

  const getItemIcon = (type) => {
    switch (type) {
      case 'workout': return Video;
      case 'read_and_rep': return BookOpen;
      case 'leader_circle': return Users;
      case 'open_gym': return Users; // Or another icon
      default: return Circle;
    }
  };

  return (
    <Card title={phase} subtitle={title} icon={BookOpen} accent="BLUE">
      <div className="space-y-4">
        {/* Header Info */}
        <div>
          <h3 className="text-lg font-bold text-slate-800">{focus}</h3>
          <p className="text-sm text-slate-600">{description}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-medium text-slate-500">
            <span>Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Items */}
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            This Week's Actions
          </p>
          
          {allItems.map((item) => {
            const isCompleted = completedItems.includes(item.id);
            const Icon = getItemIcon(item.type);
            
            return (
              <div 
                key={item.id} 
                className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer border ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
                onClick={() => handleItemToggle(item.id)}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  <Icon size={16} />
                </div>
                
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isCompleted ? 'text-slate-500' : 'text-slate-800'}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">
                    {item.type.replace(/_/g, ' ')} • {item.required === false || item.optional ? 'Optional' : 'Required'}
                  </p>
                </div>

                {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
              </div>
            );
          })}
        </div>

        {/* Reflection */}
        {reflectionPrompt && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-700">
              Reflection
            </p>
            <p className="text-xs text-slate-500 italic">
              {reflectionPrompt}
            </p>
            <textarea
              value={reflectionResponse}
              onChange={(e) => handleReflectionUpdate(e.target.value)}
              placeholder="Type your reflection here..."
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
              rows={3}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default DevelopmentPlanWidget;
