import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Target, TrendingUp, Calendar, Edit, ArrowLeft, Zap, Crosshair, Flag, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, ProgressBar } from './DevPlanComponents';
import ProgressBreakdown from './ProgressBreakdown';
import QuickPlanEditor from './QuickPlanEditor';
import WidgetRenderer from '../../admin/WidgetRenderer';
import { useFeatures } from '../../../providers/FeatureProvider';
import { ZONE_CONFIG } from '../../../config/zoneConfig';
import { NoWidgetsEnabled } from '../../ui';
import { useDailyPlan } from '../../../hooks/useDailyPlan'; // CHANGED
import { useAppServices } from '../../../services/useAppServices';

const PlanTracker = ({ 
  plan: legacyPlan, 
  cycle = 1, 
  globalMetadata, 
  onEditPlan,
  onScan,
  onDetail,
  onTimeline 
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const { isFeatureEnabled, getFeatureOrder } = useFeatures();
  const { updateDevelopmentPlanData } = useAppServices();

  // Use Daily Plan Hook (New Architecture)
  const { 
    dailyPlan,
    userState, 
    toggleItemComplete, 
    loading,
    currentPhase,
    phaseDayNumber
  } = useDailyPlan();

  // Calculate Current Week Number
  const currentWeekNumber = useMemo(() => {
    if (currentPhase?.id === 'pre-start') return 0;
    if (currentPhase?.id === 'start') {
      return Math.ceil(phaseDayNumber / 7);
    }
    return 1;
  }, [currentPhase, phaseDayNumber]);

  const [viewIndex, setViewIndex] = useState(0);

  // Sync viewIndex with user's current week on load
  useEffect(() => {
    if (currentWeekNumber > 0) {
      // viewIndex is 0-based, currentWeekNumber is 1-based
      setViewIndex(currentWeekNumber - 1);
    }
  }, [currentWeekNumber]);

  // Construct Virtual Master Plan from Daily Plan
  const masterPlan = useMemo(() => {
    if (!dailyPlan || dailyPlan.length === 0) return [];
    
    // Filter for Start Phase days (Development Plan)
    // Assuming Start Phase is days 15-70 (8 weeks)
    const startPhaseDays = dailyPlan.filter(d => d.phase === 'start' || (d.dayNumber >= 15 && d.dayNumber <= 70));
    
    // Group by week
    const weeks = [];
    const totalWeeks = 8; // Hardcoded for now, or derive from config
    
    for (let i = 1; i <= totalWeeks; i++) {
      const startDay = (i - 1) * 7 + 1;
      const endDay = i * 7;
      const phaseStartDbDay = 15;
      const absStartDay = phaseStartDbDay + startDay - 1;
      const absEndDay = phaseStartDbDay + endDay - 1;
      
      const weekDays = startPhaseDays.filter(d => 
        d.dayNumber >= absStartDay && 
        d.dayNumber <= absEndDay
      );
      
      // Aggregate content/actions
      const actions = [];
      const coachingItems = [];
      const communityItems = [];
      
      weekDays.forEach(day => {
        if (day.actions) {
          actions.push(...day.actions.map((a, idx) => ({
            ...a, 
            dayId: day.id,
            id: a.id || `daily-${day.id}-${idx}`,
            dayNumber: day.dayNumber
          })));
        }
        
        // Extract coaching items from weeklyResources (from first day of week)
        if (day.dayNumber === absStartDay && day.weeklyResources) {
          if (day.weeklyResources.weeklyCoaching) {
            day.weeklyResources.weeklyCoaching.forEach((item, idx) => {
              const label = item.coachingItemLabel || 'Coaching';
              coachingItems.push({
                id: item.coachingItemId || `weekly-coaching-week${i}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}-${idx}`,
                label: label,
                type: 'coaching',
                // CRITICAL: Optional items should NOT count toward required progress
                required: item.isOptionalCoachingItem === false,
                optional: item.isOptionalCoachingItem !== false,
                dayId: day.id,
                dayNumber: day.dayNumber
              });
            });
          }
          if (day.weeklyResources.weeklyCommunity) {
            day.weeklyResources.weeklyCommunity.forEach((item, idx) => {
              const label = item.communityItemLabel || 'Community';
              communityItems.push({
                id: item.communityItemId || `weekly-community-week${i}-${label.toLowerCase().replace(/\s+/g, '-').substring(0, 25)}-${idx}`,
                label: label,
                type: 'community',
                required: item.isRequiredCommunityItem === true,
                optional: item.isRequiredCommunityItem !== true,
                dayId: day.id,
                dayNumber: day.dayNumber
              });
            });
          }
        }
      });
      
      // Try to get week metadata from first day
      const firstDay = weekDays[0] || {};
      
      weeks.push({
        weekNumber: i,
        weekBlockId: `week-${String(i).padStart(2, '0')}`,
        title: `Week ${i}`,
        focus: firstDay.weekFocus || `Week ${i} Focus`,
        description: firstDay.weekDescription || 'Weekly development plan.',
        content: actions.filter(a => a.type !== 'daily_rep'), // Treat actions as content for the tracker
        coaching: coachingItems,
        community: communityItems,
        actions: actions
      });
    }
    
    return weeks;
  }, [dailyPlan]);

  // Determine the week to display
  const displayWeek = useMemo(() => {
    if (!masterPlan || masterPlan.length === 0) return null;
    const safeIndex = Math.min(Math.max(0, viewIndex), masterPlan.length - 1);
    return masterPlan[safeIndex];
  }, [masterPlan, viewIndex]);

  const isEditable = currentWeekNumber === (displayWeek?.weekNumber || 0);

  // Local state for reflection
  const [localReflection, setLocalReflection] = useState('');
  
  // Sync local reflection with DB when loaded
  useEffect(() => {
    if (displayWeek && userState) {
      const weekKey = displayWeek.weekBlockId;
      const progress = userState.weekProgress?.[weekKey] || {};
      setLocalReflection(progress.reflection || '');
    }
  }, [displayWeek, userState]);

  // Transform data for the widget
  const currentWeek = useMemo(() => {
    if (!displayWeek) return null;
    
    // Helper to normalize items (adapted for Daily Plan actions)
    const normalize = (items) => (items || []).map(item => ({
      id: item.id,
      resourceId: item.resourceId || item.id,
      label: item.label || item.title,
      type: item.type || 'content',
      required: item.required !== false && !item.optional,
      optional: item.optional === true,
      dayNumber: item.dayNumber
    }));

    return {
      ...displayWeek,
      content: normalize(displayWeek.content),
      // Use coaching and community from weeklyResources (extracted in masterPlan)
      community: normalize(displayWeek.community || []), 
      coaching: normalize(displayWeek.coaching || [])
    };
  }, [displayWeek]);

  const userProgress = useMemo(() => {
    if (!displayWeek) return { completedItems: [], reflectionResponse: '' };
    
    // Get completed items from userState.dailyProgress
    const completedSet = new Set();
    if (userState?.dailyProgress) {
      Object.values(userState.dailyProgress).forEach(dayProgress => {
        if (dayProgress.itemsCompleted) {
          dayProgress.itemsCompleted.forEach(id => completedSet.add(id));
        }
      });
    }
    
    return {
      completedItems: Array.from(completedSet),
      reflectionResponse: localReflection
    };
  }, [displayWeek, userState, localReflection]);

  const handleItemToggle = useCallback((itemId) => {
    // Find item to get dayId
    // We need to search in the current week's actions
    const item = displayWeek?.actions?.find(i => i.id === itemId);
    if (!item || !item.dayId) return;
    
    const isComplete = !userProgress.completedItems.includes(itemId);
    toggleItemComplete(item.dayId, itemId, isComplete);
  }, [displayWeek, userProgress.completedItems, toggleItemComplete]);

  const handleReflectionUpdate = useCallback((text) => {
    if (!isEditable) return;
    setLocalReflection(text);
  }, [isEditable]);

  // Effect to save reflection when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isEditable && displayWeek && localReflection !== (userState.weekProgress?.[displayWeek.weekBlockId]?.reflection || '')) {
        const weekKey = displayWeek.weekBlockId;
        updateDevelopmentPlanData({
          [`weekProgress.${weekKey}.reflection`]: localReflection
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [localReflection, displayWeek, isEditable, userState.weekProgress, updateDevelopmentPlanData]);


  const sortedFeatures = useMemo(() => {
    const features = ZONE_CONFIG['development-plan'] || [];
    return features
      .filter(id => isFeatureEnabled(id))
      .sort((a, b) => getFeatureOrder(a) - getFeatureOrder(b));
  }, [isFeatureEnabled, getFeatureOrder]);

  // Generate summary
  const summary = useMemo(() => {
    if (currentWeek) {
      const allItems = currentWeek.content || [];
      const requiredItems = allItems.filter(i => i.required);
      const completedCount = requiredItems.filter(i => userProgress.completedItems.includes(i.id)).length;
      const progress = requiredItems.length > 0 ? Math.round((completedCount / requiredItems.length) * 100) : 0;

      return {
        totalSkills: 0, // Skills might not be tracked in Daily Plan yet
        completedSkills: completedCount, 
        progress: progress, 
        currentWeek: currentWeek.weekNumber
      };
    }
    return null;
  }, [currentWeek, userProgress]);

  const scope = useMemo(() => ({
    plan: null, // Legacy plan is null
    summary,
    cycle,
    handleShowBreakdown: () => setShowBreakdown(true),
    handleScan: onScan,
    handleTimeline: onTimeline,
    handleDetail: onDetail,
    handleEdit: () => setShowEditor(true),
    Card, Button, ProgressBar,
    Target, TrendingUp, Calendar, Edit, Zap, Crosshair, Flag,
    // New Scope Props
    currentWeek,
    userProgress,
    handleItemToggle,
    handleReflectionUpdate
  }), [summary, cycle, onScan, onTimeline, onDetail, currentWeek, userProgress, handleItemToggle, handleReflectionUpdate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  if (!currentWeek && !sortedFeatures.includes('development-plan')) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <h3 className="text-lg font-semibold mb-2 text-corporate-navy">
          No plan available
        </h3>
        <p className="text-sm text-slate-500">
          Complete your baseline assessment to get started.
        </p>
      </div>
    );
  }

  const handleSaveEdit = async (updatedPlan) => {
    if (onEditPlan) {
      const success = await onEditPlan(updatedPlan);
      if (success) {
        setShowEditor(false);
      }
    }
  };

  if (showEditor) {
    return (
      <QuickPlanEditor
        plan={legacyPlan}
        onSave={handleSaveEdit}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  if (showBreakdown) {
    return (
      <div>
        <div className="p-3 sm:p-4 lg:p-6 mb-0">
          <Button onClick={() => setShowBreakdown(false)} variant="nav-back" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Tracker
          </Button>
        </div>
        <ProgressBreakdown plan={legacyPlan} globalMetadata={globalMetadata} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Controls */}
      {masterPlan && masterPlan.length > 0 && (
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setViewIndex(prev => Math.max(0, prev - 1))}
            disabled={viewIndex === 0}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-corporate-navy"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Viewing</div>
            <div className="font-bold text-corporate-navy">Week {displayWeek?.weekNumber}</div>
            {!isEditable && (
              <div className="text-[10px] font-bold text-orange-500 uppercase mt-0.5">Read Only</div>
            )}
          </div>

          <button 
            onClick={() => setViewIndex(prev => Math.min(masterPlan.length - 1, prev + 1))}
            disabled={viewIndex === masterPlan.length - 1}
            className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-corporate-navy"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {sortedFeatures.length > 0 ? (
        sortedFeatures.map(featureId => (
          <WidgetRenderer key={featureId} widgetId={featureId} scope={scope} />
        ))
      ) : (
        <NoWidgetsEnabled moduleName="Development Plan" />
      )}
    </div>
  );
};

export default PlanTracker;