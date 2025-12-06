// src/components/ui/ContentBadges.jsx
// Reusable metadata badge components for content cards

import React from 'react';
import { Clock, BarChart, Lock, Sparkles, Users, Target } from 'lucide-react';

// ============================================
// DIFFICULTY BADGE
// ============================================
export const DifficultyBadge = ({ level, size = 'sm' }) => {
  const configs = {
    'FOUNDATION': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Foundation' },
    'CORE': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Core' },
    'PRO': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pro' },
    'MASTERY': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Mastery' },
    // Aliases
    'Intro': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Foundation' },
    'Intermediate': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Core' },
    'Advanced': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Pro' },
    'Expert': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Mastery' },
  };

  const config = configs[level] || configs['FOUNDATION'];
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full uppercase tracking-wide ${config.bg} ${config.text} ${sizeClasses}`}>
      <BarChart className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {config.label}
    </span>
  );
};

// ============================================
// DURATION BADGE
// ============================================
export const DurationBadge = ({ minutes, size = 'sm' }) => {
  if (!minutes) return null;
  
  const formatDuration = (mins) => {
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remaining = mins % 60;
      return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const sizeClasses = size === 'xs' ? 'text-[10px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1 text-slate-500 ${sizeClasses}`}>
      <Clock className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {formatDuration(minutes)}
    </span>
  );
};

// ============================================
// TIER BADGE (Free/Premium)
// ============================================
export const TierBadge = ({ tier, size = 'sm' }) => {
  const isPremium = tier === 'premium' || tier === 'PREMIUM';
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  if (isPremium) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white ${sizeClasses}`}>
        <Sparkles className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
        Premium
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-slate-100 text-slate-600 ${sizeClasses}`}>
      Free
    </span>
  );
};

// ============================================
// SKILL TAG
// ============================================
export const SkillTag = ({ skill, size = 'sm', onClick }) => {
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors ${sizeClasses} ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <Target className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {skill}
    </button>
  );
};

// ============================================
// ENROLLMENT COUNT
// ============================================
export const EnrollmentBadge = ({ count, size = 'sm' }) => {
  if (!count) return null;
  
  const formatCount = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const sizeClasses = size === 'xs' ? 'text-[10px]' : 'text-xs';

  return (
    <span className={`inline-flex items-center gap-1 text-slate-500 ${sizeClasses}`}>
      <Users className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {formatCount(count)} enrolled
    </span>
  );
};

// ============================================
// LOCKED BADGE
// ============================================
export const LockedBadge = ({ size = 'sm' }) => {
  const sizeClasses = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center gap-1 font-bold rounded-full bg-slate-200 text-slate-500 ${sizeClasses}`}>
      <Lock className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      Locked
    </span>
  );
};

// ============================================
// METADATA ROW (Convenience component)
// ============================================
export const MetadataRow = ({ 
  difficulty, 
  duration, 
  tier, 
  skills = [], 
  enrollment,
  size = 'sm',
  onSkillClick 
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {difficulty && <DifficultyBadge level={difficulty} size={size} />}
      {duration && <DurationBadge minutes={duration} size={size} />}
      {tier && <TierBadge tier={tier} size={size} />}
      {enrollment && <EnrollmentBadge count={enrollment} size={size} />}
      {skills.slice(0, 2).map(skill => (
        <SkillTag 
          key={skill} 
          skill={skill} 
          size={size} 
          onClick={onSkillClick ? () => onSkillClick(skill) : undefined}
        />
      ))}
    </div>
  );
};

export default MetadataRow;
