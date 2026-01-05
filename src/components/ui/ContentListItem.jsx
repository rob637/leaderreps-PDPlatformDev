import React from 'react';
import { ChevronRight, Lock, Clock, BarChart, User, Tag } from 'lucide-react';

export const ContentListItem = ({ 
  title, 
  description, 
  icon: Icon, 
  onClick, 
  color, 
  bgColor, 
  badge, 
  // count,
  isUnlocked = true,
  metadata = {},
  skills = []
}) => {
  
  // Helper to format duration
  const formatDuration = (min) => {
    if (!min) return null;
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      className={`w-full text-left transition-all duration-150 rounded-xl border p-4 flex items-center gap-4 group relative
        ${isUnlocked 
          ? 'bg-white hover:shadow-md cursor-pointer border-slate-200 hover:border-corporate-teal/50 active:scale-[0.99] active:bg-slate-50' 
          : 'bg-slate-50 border-slate-200 opacity-75 cursor-not-allowed'
        } mb-3`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
          ${isUnlocked ? (bgColor || 'bg-corporate-teal/10') : 'bg-slate-200'} 
          ${isUnlocked ? (color || 'text-corporate-teal') : 'text-slate-400'} 
          ${isUnlocked && 'group-hover:bg-opacity-80'}`}
      >
        {Icon && <Icon className="w-6 h-6" />}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={`text-base font-bold truncate ${isUnlocked ? 'text-corporate-navy' : 'text-slate-500'}`}>
            {title}
          </h3>
          
          {/* Badges */}
          {badge && (
            <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full bg-corporate-orange/10 text-corporate-orange">
              {badge}
            </span>
          )}
          
          {/* Lock Icon */}
          {!isUnlocked && (
            <Lock className="w-3 h-3 text-slate-400" />
          )}
        </div>
        
        <p className="text-sm text-slate-600 line-clamp-1 mb-2">
          {description}
        </p>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {/* Duration */}
          {(metadata.durationMin || metadata.durationWeeks) && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {metadata.durationWeeks 
                  ? `${metadata.durationWeeks} weeks` 
                  : formatDuration(metadata.durationMin)
                }
              </span>
            </div>
          )}

          {/* Difficulty */}
          {metadata.difficulty && (
            <div className="flex items-center gap-1">
              <BarChart className="w-3 h-3" />
              <span className="capitalize">{metadata.difficulty.toLowerCase()}</span>
            </div>
          )}

          {/* Author/Speaker */}
          {(metadata.author || metadata.speaker) && (
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{metadata.author || metadata.speaker}</span>
            </div>
          )}

          {/* Skills (First 2) */}
          {skills && skills.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>
                {skills.slice(0, 2).map(s => (typeof s === 'string' ? s.replace('skill_', '') : s.title)).join(', ')}
                {skills.length > 2 && ` +${skills.length - 2}`}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Chevron */}
      {isUnlocked && (
        <div className="flex-shrink-0 text-slate-400 group-hover:text-corporate-teal transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      )}
    </button>
  );
};
