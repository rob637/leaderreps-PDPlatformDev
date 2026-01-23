// src/components/widgets/DevelopmentJourneyWidget.jsx
// A comprehensive, visually stunning journey overview widget
// Shows the ENTIRE journey: Preparation, Foundation (8 weeks), and Ascent (indefinite)
// Fully dynamic - adapts to whatever is in the daily plan data

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Map, ChevronLeft, ChevronRight, CheckCircle, Circle, Lock,
  Target, Trophy, Star, Zap, Calendar, Clock, BookOpen,
  Play, Video, Users, MessageSquare, FileText, ArrowRight,
  Sparkles, TrendingUp, Award, Flag, Rocket, GraduationCap,
  Briefcase, Heart, Shield, Lightbulb, Compass, Mountain
} from 'lucide-react';
import { Card } from '../ui';
import { useDailyPlan, PHASES } from '../../hooks/useDailyPlan';
import { useActionProgress } from '../../hooks/useActionProgress';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import { useAppServices } from '../../services/useAppServices';

// Phase themes - different visual treatment for each phase
const PHASE_THEMES = {
  'pre-start': {
    title: 'Preparation',
    subtitle: 'Get Ready',
    icon: Rocket,
    color: 'from-slate-600 to-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-300',
    textColor: 'text-slate-700',
    iconBg: 'bg-slate-100',
    accentColor: 'slate'
  },
  'start': {
    title: 'Foundation',
    subtitle: 'Your Journey',
    icon: Mountain,
    color: 'from-corporate-teal to-emerald-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-700',
    iconBg: 'bg-teal-100',
    accentColor: 'teal'
  },
  'post-start': {
    title: 'Ascent',
    subtitle: 'Continue Growing',
    icon: GraduationCap,
    color: 'from-corporate-navy to-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-corporate-navy/20',
    textColor: 'text-corporate-navy',
    iconBg: 'bg-corporate-navy/10',
    accentColor: 'navy'
  }
};

// Dynamic week themes - all weeks use corporate-teal for brand consistency
const WEEK_THEME_CYCLE = [
  { icon: Target, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: MessageSquare, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: Users, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: Zap, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: TrendingUp, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: Award, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: Sparkles, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: Trophy, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: Lightbulb, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: Shield, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: Heart, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
  { icon: Compass, color: 'from-corporate-teal to-emerald-600', bgColor: 'bg-corporate-teal/5', borderColor: 'border-corporate-teal/20', textColor: 'text-corporate-teal', iconBg: 'bg-corporate-teal/10' },
];

// Helper to get theme for a week (cycles through colors)
const getWeekTheme = (weekIndex, weekData) => {
  const cycleTheme = WEEK_THEME_CYCLE[weekIndex % WEEK_THEME_CYCLE.length];
  return {
    ...cycleTheme,
    title: weekData?.weekFocus || weekData?.title || `Week ${weekIndex + 1}`,
    subtitle: weekData?.weekTheme || weekData?.subtitle || 'Leadership Growth'
  };
};

// Circular Progress Ring Component
const ProgressRing = ({ progress, size = 80, strokeWidth = 6, color = 'stroke-corporate-teal' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-200"
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={color}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{
          strokeDasharray: circumference,
        }}
      />
    </svg>
  );
};

// Week Card Component - The visual representation of each week
const WeekCard = ({ 
  weekNumber, 
  theme, 
  progress, 
  isCurrentWeek, 
  isPastWeek, 
  isFutureWeek,
  isSelected,
  onClick,
  totalActions,
  completedActions,
  daysInWeek
}) => {
  const Icon = theme.icon;
  const isLocked = isFutureWeek;
  const isComplete = progress === 100;
  
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: isLocked ? 1 : 1.02 }}
      whileTap={{ scale: isLocked ? 1 : 0.98 }}
      className={`
        relative flex-shrink-0 w-[140px] cursor-pointer transition-all duration-300
        ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
        ${isSelected ? 'z-10' : ''}
      `}
    >
      {/* Current Week Indicator */}
      {isCurrentWeek && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10"
        >
          <span className="px-2 py-0.5 bg-corporate-teal text-white text-[10px] font-bold rounded-full shadow-lg">
            CURRENT
          </span>
        </motion.div>
      )}
      
      {/* Card */}
      <div className={`
        relative rounded-2xl p-4 transition-all duration-300 border-2
        ${isSelected 
          ? `${theme.bgColor} ${theme.borderColor} shadow-lg` 
          : 'bg-white border-slate-200 hover:border-slate-300'
        }
        ${isComplete ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}
      `}>
        {/* Complete Badge */}
        {isComplete && (
          <div className="absolute -top-2 -right-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
        
        {/* Lock Badge for Future Weeks */}
        {isLocked && (
          <div className="absolute -top-2 -right-2">
            <div className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center shadow">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
        )}
        
        {/* Week Number & Progress Ring */}
        <div className="flex flex-col items-center mb-3">
          <div className="relative">
            <ProgressRing 
              progress={isLocked ? 0 : progress} 
              size={64} 
              strokeWidth={5}
              color={isComplete ? 'stroke-emerald-500' : `stroke-current ${theme.textColor}`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-12 h-12 rounded-full ${theme.iconBg} flex items-center justify-center`}>
                {isLocked ? (
                  <Lock className="w-5 h-5 text-slate-400" />
                ) : (
                  <Icon className={`w-5 h-5 ${theme.textColor}`} />
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Week Info */}
        <div className="text-center">
          <div className="text-xs font-medium text-slate-400 mb-0.5">WEEK {weekNumber}</div>
          <div className={`text-sm font-bold ${isSelected ? theme.textColor : 'text-slate-700'}`}>
            {theme.title}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{theme.subtitle}</div>
        </div>
        
        {/* Progress Stats */}
        {!isLocked && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>{completedActions}/{totalActions}</span>
              <span className="font-semibold">{progress}%</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Connection Line */}
      {weekNumber < 8 && (
        <div className={`
          absolute top-1/2 -right-2 w-4 h-0.5 
          ${isPastWeek || isCurrentWeek ? 'bg-corporate-teal' : 'bg-slate-200'}
        `} />
      )}
    </motion.div>
  );
};

// Week/Segment Detail Panel - Shows detailed info for selected segment
const WeekDetailPanel = ({ 
  weekNumber, 
  theme, 
  weekData, 
  completedItems, 
  isCurrentWeek, 
  segmentLabel, 
  segmentType,
  leaderProfileComplete = false,
  baselineAssessmentComplete = false
}) => {
  const Icon = theme?.icon || Calendar;
  const actions = weekData?.actions || [];
  
  // Helper to check if an action is completed (handles interactive items)
  const isActionCompleted = (action) => {
    // If the action has explicit isCompleted flag (from required prep items), use it
    if (action.isCompleted !== undefined) {
      return action.isCompleted;
    }
    
    // Check if this is an interactive item by handler type OR label pattern
    const handlerType = action.handlerType || '';
    const labelLower = (action.label || '').toLowerCase();
    
    // Leader Profile - check by handlerType OR label
    if (handlerType === 'leader-profile' || labelLower.includes('leader profile')) {
      return leaderProfileComplete;
    }
    // Baseline Assessment - check by handlerType OR label
    if (handlerType === 'baseline-assessment' || labelLower.includes('baseline assessment')) {
      return baselineAssessmentComplete;
    }
    // Standard check for other items
    return completedItems.has(action.id);
  };
  
  const completedCount = actions.filter(a => isActionCompleted(a)).length;
  const progress = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;
  
  // Use segmentLabel if provided, otherwise generate from weekNumber
  const displayLabel = segmentLabel || (weekNumber ? `Week ${weekNumber}` : 'Journey Stage');
  const isPhaseSegment = segmentType === 'phase';
  
  // Group actions by type
  const actionsByType = useMemo(() => {
    const groups = {};
    actions.forEach(action => {
      const type = action.type || action.resourceType || 'content';
      if (!groups[type]) groups[type] = [];
      groups[type].push(action);
    });
    return groups;
  }, [actions]);
  
  const getTypeIcon = (type) => {
    const normalized = (type || '').toLowerCase();
    switch (normalized) {
      case 'video': return Video;
      case 'workout': return Play;
      case 'coaching': case 'call': return MessageSquare;
      case 'community': case 'leader_circle': case 'open_gym': return Users;
      case 'document': case 'tool': return FileText;
      case 'reading': case 'read_rep': return BookOpen;
      default: return Circle;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
      className={`mt-6 rounded-2xl border-2 overflow-hidden ${theme?.borderColor || 'border-slate-200'} ${theme?.bgColor || 'bg-slate-50'}`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${theme?.color || 'from-slate-500 to-slate-600'} text-white p-5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-white/70 text-xs font-medium uppercase">
                {isPhaseSegment ? 'Phase' : `Week ${weekNumber}`}
              </div>
              <h3 className="text-xl font-bold">{displayLabel}</h3>
              <p className="text-white/80 text-sm">
                {weekData?.description || theme?.subtitle || 'Leadership Development'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{progress}%</div>
            <div className="text-white/70 text-xs">Complete</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/70 mt-1">
            <span>{completedCount} completed</span>
            <span>{actions.length - completedCount} remaining</span>
          </div>
        </div>
      </div>
      
      {/* Actions List */}
      <div className="p-5">
        {actions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No actions scheduled for this week</p>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.slice(0, 6).map((action, idx) => {
              const isCompleted = isActionCompleted(action);
              const TypeIcon = getTypeIcon(action.type || action.resourceType);
              
              return (
                <motion.div
                  key={action.id || idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${isCompleted 
                      ? 'bg-emerald-50 border-emerald-200' 
                      : 'bg-white border-slate-200'
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isCompleted ? 'bg-emerald-100' : theme?.iconBg || 'bg-slate-100'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <TypeIcon className={`w-4 h-4 ${theme?.textColor || 'text-slate-600'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isCompleted ? 'text-emerald-700 line-through' : 'text-slate-700'}`}>
                      {action.label || action.title || 'Action Item'}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {(action.type || action.resourceType || 'content').replace(/_/g, ' ')}
                    </p>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  )}
                </motion.div>
              );
            })}
            
            {actions.length > 6 && (
              <div className="text-center pt-2">
                <span className="text-sm text-slate-500">
                  +{actions.length - 6} more actions
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Current Week CTA */}
        {isCurrentWeek && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className={`flex items-center justify-center gap-2 text-sm font-medium ${theme?.textColor || 'text-slate-700'}`}>
              <Flag className="w-4 h-4" />
              <span>{isPhaseSegment ? 'You are currently in this phase' : 'This is your current week'}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Main Widget Component
const DevelopmentJourneyWidget = () => {
  const scrollContainerRef = useRef(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  // Get data from hooks
  const { developmentPlanData } = useAppServices();
  const { 
    dailyPlan, 
    currentPhase, 
    phaseDayNumber,
    userState,
    prepRequirementsComplete // Get the required prep items status (dynamic count)
  } = useDailyPlan();
  
  const { getItemProgress } = useActionProgress();
  const { isComplete: leaderProfileComplete } = useLeaderProfile();
  
  // Check baseline assessment completion - use developmentPlanData directly for real-time updates
  const baselineAssessmentComplete = useMemo(() => {
    if (!developmentPlanData?.assessmentHistory || developmentPlanData.assessmentHistory.length === 0) return false;
    return developmentPlanData.assessmentHistory.length > 0;
  }, [developmentPlanData?.assessmentHistory]);
  
  // Determine current segment
  const currentSegmentId = useMemo(() => {
    if (currentPhase?.id === 'pre-start') return 'prep';
    if (currentPhase?.id === 'post-start') return 'post';
    if (currentPhase?.id === 'start') {
      const weekNum = Math.ceil(phaseDayNumber / 7);
      return `week-${weekNum}`;
    }
    return null;
  }, [currentPhase, phaseDayNumber]);
  
  // Track if user has manually selected a segment
  const hasUserSelected = useRef(false);
  
  // Set initial selected segment to current - only on mount or when no selection
  useEffect(() => {
    if (currentSegmentId && !hasUserSelected.current) {
      setSelectedSegment(currentSegmentId);
    }
  }, [currentSegmentId]);
  
  // Wrapper to track user selections
  const handleSelectSegment = (segmentId) => {
    hasUserSelected.current = true;
    setSelectedSegment(segmentId);
  };
  
  // Get completed items set
  const completedItems = useMemo(() => {
    const completedSet = new Set();
    if (userState?.dailyProgress) {
      Object.values(userState.dailyProgress).forEach(dayProgress => {
        if (dayProgress?.itemsCompleted) {
          dayProgress.itemsCompleted.forEach(id => completedSet.add(id));
        }
      });
    }
    return completedSet;
  }, [userState?.dailyProgress]);
  
  // Dynamically calculate journey segments from actual daily plan data
  const journeyData = useMemo(() => {
    if (!dailyPlan || dailyPlan.length === 0) return { segments: [], totalWeeks: 0 };
    
    const segments = [];
    
    // Get the actual day range from the data
    const dayNumbers = dailyPlan.map(d => d.dayNumber).filter(Boolean);
    const minDay = Math.min(...dayNumbers);
    const maxDay = Math.max(...dayNumbers);
    
    // =================== PREP PHASE ===================
    // Get all prep phase days from daily plan (phase-based, not time-based)
    const prepDays = dailyPlan.filter(d => d.phase === 'pre-start');
    
    // Collect ALL prep actions from the daily plan
    const allPrepActions = [];
    prepDays.forEach(day => {
      if (day.actions) {
        day.actions.forEach((action, idx) => {
          allPrepActions.push({
            ...action,
            dayId: day.id,
            dayNumber: day.dayNumber,
            id: action.id || `daily-${day.id}-${idx}`
          });
        });
      }
    });
    
    // Filter to get only REQUIRED prep actions (required !== false AND optional !== true)
    // Also exclude daily_rep type as those are not progress items
    const requiredPrepActions = allPrepActions.filter(action => {
      // Skip daily reps - they're not milestone items
      if (action.type === 'daily_rep') return false;
      // Check if explicitly marked as required or not optional
      const isRequired = action.required === true || (action.required !== false && action.optional !== true);
      return isRequired;
    });
    
    // Helper to check completion for each action type
    const checkActionComplete = (action) => {
      const handlerType = action.handlerType || '';
      const labelLower = (action.label || '').toLowerCase();
      
      // Leader Profile - check by handlerType OR label
      if (handlerType === 'leader-profile' || labelLower.includes('leader profile')) {
        return leaderProfileComplete;
      }
      // Baseline Assessment - check by handlerType OR label
      if (handlerType === 'baseline-assessment' || labelLower.includes('baseline assessment')) {
        return baselineAssessmentComplete;
      }
      // Check action progress
      const progress = getItemProgress(action.id);
      if (progress.status === 'completed') return true;
      // Check completed items set
      if (completedItems.has(action.id)) return true;
      return false;
    };
    
    // Build required prep actions with completion status
    const requiredPrepActionsWithStatus = requiredPrepActions.map(action => ({
      ...action,
      isCompleted: checkActionComplete(action),
      isRequired: true
    }));
    
    const completedRequiredCount = requiredPrepActionsWithStatus.filter(a => a.isCompleted).length;
    const totalRequiredCount = requiredPrepActionsWithStatus.length;
    
    segments.push({
      id: 'prep',
      type: 'phase',
      phaseId: 'pre-start',
      label: 'Preparation',
      shortLabel: 'Prep',
      theme: PHASE_THEMES['pre-start'],
      actions: requiredPrepActionsWithStatus,
      totalActions: totalRequiredCount,
      completedActions: completedRequiredCount,
      progress: totalRequiredCount > 0 ? Math.round((completedRequiredCount / totalRequiredCount) * 100) : 0,
      daysCount: prepDays.length,
      icon: 'rocket',
      description: 'Get ready for your leadership journey'
    });
    
    // =================== DEVELOPMENT PHASE (WEEKS) ===================
    // Dynamically calculate weeks based on START phase data
    const devDays = dailyPlan.filter(d => 
      d.dayNumber >= PHASES.START.dbDayStart && 
      d.dayNumber <= PHASES.START.dbDayEnd
    );
    
    if (devDays.length > 0) {
      const devDayNumbers = devDays.map(d => d.dayNumber);
      const devMinDay = Math.min(...devDayNumbers);
      const devMaxDay = Math.max(...devDayNumbers);
      
      // Calculate number of weeks dynamically
      const totalDevDays = devMaxDay - devMinDay + 1;
      const numWeeks = Math.ceil(totalDevDays / 7);
      
      for (let week = 1; week <= numWeeks; week++) {
        const weekStartDay = PHASES.START.dbDayStart + (week - 1) * 7;
        const weekEndDay = PHASES.START.dbDayStart + week * 7 - 1;
        
        const weekDays = dailyPlan.filter(d => 
          d.dayNumber >= weekStartDay && 
          d.dayNumber <= weekEndDay
        );
        
        if (weekDays.length === 0) continue;
        
        const actions = [];
        weekDays.forEach(day => {
          if (day.actions) {
            actions.push(...day.actions.map((a, idx) => ({
              ...a,
              dayId: day.id,
              dayNumber: day.dayNumber,
              id: a.id || `daily-${day.id}-${(a.label || '').toLowerCase().replace(/\s+/g, '-').substring(0, 20)}-${idx}`
            })));
          }
        });
        
        const mainActions = actions.filter(a => a.type !== 'daily_rep');
        
        // Check completion status for each action and store it
        const mainActionsWithStatus = mainActions.map(a => {
          const progress = getItemProgress(a.id);
          const isCompleted = progress.status === 'completed' || completedItems.has(a.id);
          return { ...a, isCompleted };
        });
        
        const completedCount = mainActionsWithStatus.filter(a => a.isCompleted).length;
        
        // Get theme from cycle (loops if more than 8 weeks)
        const themeIndex = (week - 1) % WEEK_THEME_CYCLE.length;
        const themeKey = WEEK_THEME_CYCLE[themeIndex];
        
        segments.push({
          id: `week-${week}`,
          type: 'week',
          phaseId: 'start',
          weekNumber: week,
          label: `Week ${week}`,
          shortLabel: `W${week}`,
          theme: PHASE_THEMES[themeKey] || PHASE_THEMES.start,
          actions: mainActionsWithStatus,
          totalActions: mainActionsWithStatus.length,
          completedActions: completedCount,
          progress: mainActionsWithStatus.length > 0 ? Math.round((completedCount / mainActionsWithStatus.length) * 100) : 0,
          daysCount: weekDays.length,
          icon: 'calendar',
          description: `Week ${week} of your development journey`
        });
      }
    }
    
    // =================== POST PHASE ===================
    const postDays = dailyPlan.filter(d => 
      d.dayNumber >= PHASES.POST_START.dbDayStart
    );
    
    if (postDays.length > 0) {
      const postActions = [];
      postDays.forEach(day => {
        if (day.actions) {
          postActions.push(...day.actions.map((a, idx) => ({
            ...a,
            dayId: day.id,
            dayNumber: day.dayNumber,
            id: a.id || `daily-${day.id}-${(a.label || '').toLowerCase().replace(/\s+/g, '-').substring(0, 20)}-${idx}`
          })));
        }
      });
      
      const mainPostActions = postActions.filter(a => a.type !== 'daily_rep');
      
      // Check completion status for each action and store it
      const mainPostActionsWithStatus = mainPostActions.map(a => {
        const progress = getItemProgress(a.id);
        const isCompleted = progress.status === 'completed' || completedItems.has(a.id);
        return { ...a, isCompleted };
      });
      
      const completedPostCount = mainPostActionsWithStatus.filter(a => a.isCompleted).length;
      
      segments.push({
        id: 'post',
        type: 'phase',
        phaseId: 'post-start',
        label: 'Ascent',
        shortLabel: 'Ascent',
        theme: PHASE_THEMES['post-start'],
        actions: mainPostActionsWithStatus,
        totalActions: mainPostActionsWithStatus.length,
        completedActions: completedPostCount,
        progress: mainPostActionsWithStatus.length > 0 ? Math.round((completedPostCount / mainPostActionsWithStatus.length) * 100) : 0,
        daysCount: postDays.length,
        icon: 'trophy',
        description: 'Continue growing as a leader',
        isIndefinite: true // Subscription-based indefinite phase
      });
    }
    
    // Count development weeks
    const totalWeeks = segments.filter(s => s.type === 'week').length;
    
    return { segments, totalWeeks };
  }, [dailyPlan, getItemProgress, completedItems, leaderProfileComplete, baselineAssessmentComplete, prepRequirementsComplete]);
  
  // Overall progress across entire journey
  const overallProgress = useMemo(() => {
    const { segments } = journeyData;
    if (!segments || segments.length === 0) return 0;
    const totalActions = segments.reduce((sum, s) => sum + s.totalActions, 0);
    const completedActions = segments.reduce((sum, s) => sum + s.completedActions, 0);
    return totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
  }, [journeyData]);
  
  // Scroll handling
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Add small threshold (5px) to avoid showing button for tiny scroll amounts
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };
  
  const scrollTo = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  // Always start scrolled to the left on mount - user can scroll to see later segments
  useEffect(() => {
    if (scrollContainerRef.current && journeyData.segments.length > 0) {
      // Explicitly scroll to start
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({ left: 0, behavior: 'auto' });
        handleScroll();
      }, 100);
    }
  }, [journeyData.segments.length]);
  
  // Calculate initial scroll state on mount and when segments change
  useEffect(() => {
    // Small delay to ensure layout is complete
    const timer = setTimeout(() => {
      handleScroll();
    }, 100);
    return () => clearTimeout(timer);
  }, [journeyData.segments.length]);
  
  // Get selected segment data
  const selectedSegmentData = selectedSegment 
    ? journeyData.segments.find(s => s.id === selectedSegment) 
    : null;
    
  // Check if segment is past, current, or future
  const getSegmentState = (segment) => {
    const currentIndex = journeyData.segments.findIndex(s => s.id === currentSegmentId);
    const segmentIndex = journeyData.segments.findIndex(s => s.id === segment.id);
    
    if (segment.id === currentSegmentId) return 'current';
    if (segmentIndex < currentIndex) return 'past';
    return 'future';
  };
  
  // Generate dynamic title
  const journeyTitle = 'Your Journey';
  
  // If no segments, show placeholder
  if (journeyData.segments.length === 0) {
    return (
      <Card 
        title="Your Leadership Journey" 
        icon={Map} 
        accent="TEAL"
      >
        <div className="text-center py-8 text-slate-500">
          <Map className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>Your journey will appear here once you begin.</p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card 
      title={journeyTitle}
      icon={Map} 
      accent="TEAL"
      headerRight={
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-xs text-slate-500">Overall Progress</div>
            <div className="text-lg font-bold text-corporate-teal">{overallProgress}%</div>
          </div>
          <div className="w-10 h-10 relative">
            <ProgressRing progress={overallProgress} size={40} strokeWidth={4} />
          </div>
        </div>
      }
    >
      {/* Journey Timeline */}
      <div className="relative">
        {/* Scrollable Segment Cards */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4 pt-2 pl-2 pr-4 scrollbar-hide"
        >
          {journeyData.segments.map((segment, idx) => {
            const segmentState = getSegmentState(segment);
            const isClickable = true; // Allow viewing all segments including future
            const theme = segment.type === 'week' 
              ? WEEK_THEME_CYCLE[(segment.weekNumber - 1) % WEEK_THEME_CYCLE.length]
              : segment.theme;
            const Icon = segment.type === 'week' ? theme.icon : segment.theme.icon;
            
            return (
              <motion.div 
                key={segment.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div
                  onClick={() => isClickable && handleSelectSegment(segment.id)}
                  className={`
                    relative w-[140px] flex-shrink-0 rounded-2xl p-4 cursor-pointer transition-all duration-300
                    ${segment.id === selectedSegment ? 'ring-2 ring-corporate-teal ring-offset-2' : ''}
                    ${segmentState === 'current' ? `${theme.bgColor} border-2 ${theme.borderColor} shadow-lg` : ''}
                    ${segmentState === 'past' ? 'bg-white border-2 border-slate-200' : ''}
                    ${segmentState === 'future' ? `${theme.bgColor} border-2 border-dashed ${theme.borderColor} opacity-80` : ''}
                    hover:shadow-md hover:-translate-y-1
                  `}
                >
                  {/* Current indicator */}
                  {segmentState === 'current' && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="px-2 py-0.5 bg-corporate-teal text-white text-xs font-medium rounded-full shadow-sm">
                        NOW
                      </span>
                    </div>
                  )}
                  
                  {/* Completed badge */}
                  {segment.progress === 100 && (
                    <div className="absolute -top-2 -right-2">
                      <CheckCircle className="w-6 h-6 text-emerald-500 bg-white rounded-full" />
                    </div>
                  )}
                  
                  {/* Future indicator - show "UPCOMING" instead of lock */}
                  {segmentState === 'future' && segment.progress === 0 && (
                    <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                      <span className="px-2 py-0.5 bg-slate-400 text-white text-[10px] font-medium rounded-full shadow-sm">
                        UPCOMING
                      </span>
                    </div>
                  )}
                  
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3
                    ${segmentState === 'current' ? `bg-gradient-to-br ${theme.color}` : ''}
                    ${segmentState === 'past' && segment.progress === 100 ? 'bg-emerald-100' : ''}
                    ${segmentState === 'past' && segment.progress < 100 ? theme.iconBg : ''}
                    ${segmentState === 'future' ? theme.iconBg : ''}
                  `}>
                    <Icon className={`
                      w-6 h-6
                      ${segmentState === 'current' ? 'text-white' : ''}
                      ${segmentState === 'past' && segment.progress === 100 ? 'text-emerald-600' : ''}
                      ${segmentState === 'past' && segment.progress < 100 ? theme.textColor : ''}
                      ${segmentState === 'future' ? theme.textColor : ''}
                    `} />
                  </div>
                  
                  {/* Label */}
                  <div className="text-center mb-3">
                    <div className="font-semibold text-sm text-slate-700">
                      {segment.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {segment.completedActions} of {segment.totalActions} complete
                    </div>
                  </div>
                  
                  {/* Progress */}
                  <div className="relative">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          segment.progress === 100 ? 'bg-emerald-500' : `bg-gradient-to-r ${theme.color}`
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${segment.progress}%` }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                      />
                    </div>
                    <div className="text-center mt-1">
                      <span className={`text-xs font-medium ${theme.textColor}`}>
                        {segmentState === 'future' ? '0%' : `${segment.progress}%`}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Selected Segment Detail */}
      <AnimatePresence mode="wait">
        {selectedSegmentData && (
          <motion.div
            key={selectedSegment}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4"
          >
            <WeekDetailPanel
              weekNumber={selectedSegmentData.weekNumber || selectedSegmentData.id}
              theme={selectedSegmentData.type === 'week' 
                ? WEEK_THEME_CYCLE[(selectedSegmentData.weekNumber - 1) % WEEK_THEME_CYCLE.length]
                : selectedSegmentData.theme
              }
              weekData={selectedSegmentData}
              completedItems={completedItems}
              isCurrentWeek={selectedSegment === currentSegmentId}
              segmentLabel={selectedSegmentData.label}
              segmentType={selectedSegmentData.type}
              leaderProfileComplete={leaderProfileComplete}
              baselineAssessmentComplete={baselineAssessmentComplete}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Journey Stats - Following methodology: Preparation → Foundation (8 weeks) → Ascent */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {/* Current Phase */}
        <div className="text-center p-4 bg-slate-50 rounded-xl">
          <div className="text-lg font-bold text-corporate-navy">
            {currentPhase?.id === 'pre-start' ? 'Preparation' 
              : currentPhase?.id === 'start' ? 'Foundation'
              : currentPhase?.id === 'post-start' ? 'Ascent'
              : '-'
            }
          </div>
          <div className="text-xs text-slate-500 mt-1">Current Phase</div>
        </div>
        {/* Foundation Progress */}
        <div className="text-center p-4 bg-emerald-50 rounded-xl">
          <div className="text-2xl font-bold text-emerald-600">
            {journeyData.segments.filter(s => s.type === 'week' && s.progress === 100).length}
            <span className="text-sm font-normal text-slate-500"> of {journeyData.totalWeeks || 8}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">Foundation Weeks</div>
        </div>
        {/* Actions Done */}
        <div className="text-center p-4 bg-corporate-teal/10 rounded-xl">
          <div className="text-2xl font-bold text-corporate-teal">
            {journeyData.segments.reduce((sum, s) => sum + s.completedActions, 0)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Actions Done</div>
        </div>
      </div>
    </Card>
  );
};

export default DevelopmentJourneyWidget;
