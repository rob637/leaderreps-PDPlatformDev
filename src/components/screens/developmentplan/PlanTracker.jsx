import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Target, TrendingUp, Calendar, Edit, ArrowLeft, Zap, Crosshair, Flag, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button, Card, ProgressBar } from './DevPlanComponents';
import { generatePlanSummary } from './devPlanUtils';
import ProgressBreakdown from './ProgressBreakdown';
import QuickPlanEditor from './QuickPlanEditor';
import WidgetRenderer from '../../admin/WidgetRenderer';
import { useFeatures } from '../../../providers/FeatureProvider';
import { ZONE_CONFIG } from '../../../config/zoneConfig';
import { NoWidgetsEnabled } from '../../ui';
import { useDevPlan } from '../../../hooks/useDevPlan';
import debounce from 'lodash.debounce';

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

  // Use the new hook
  const { 
    masterPlan,
    userState, 
    toggleItemComplete, 
    completeWeek,
    updateDevelopmentPlanData,
    loading,
    simulatedNow
  } = useDevPlan();

  const [viewIndex, setViewIndex] = useState(0);

  // Sync viewIndex with user's current week on load AND when time travel changes
  useEffect(() => {
    if (userState && userState.currentWeekIndex !== undefined) {
      console.log('[PlanTracker] Syncing viewIndex to currentWeekIndex:', userState.currentWeekIndex);
      setViewIndex(userState.currentWeekIndex);
    }
  }, [userState?.currentWeekIndex]);

  // Determine the week to display
  const displayWeek = useMemo(() => {
    if (!masterPlan || masterPlan.length === 0) return null;
    const safeIndex = Math.min(Math.max(0, viewIndex), masterPlan.length - 1);
    return masterPlan[safeIndex];
  }, [masterPlan, viewIndex]);

  const isEditable = userState && viewIndex === userState.currentWeekIndex;

  // Local state for reflection
  const [localReflection, setLocalReflection] = useState('');
  
  // Sync local reflection with DB when loaded
  useEffect(() => {
    if (displayWeek && userState) {
      const weekKey = displayWeek.weekBlockId || `week-${String(displayWeek.weekNumber).padStart(2, '0')}`;
      const progress = userState.weekProgress?.[weekKey] || {};
      setLocalReflection(progress.reflection || '');
    }
  }, [displayWeek?.id, userState]);

  // Transform data for the widget
  const currentWeek = useMemo(() => {
    if (!displayWeek) return null;
    
    // Helper to normalize items
    const normalize = (items, typePrefix) => (items || []).map(item => ({
      id: item[`${typePrefix}Id`] || item.id,
      label: item[`${typePrefix}Label`] || item.label,
      type: item[`${typePrefix}Type`] || item.type,
      required: item.isRequiredContent ?? true,
      optional: item.isOptionalCoachingItem ?? false,
      recommendedWeekDay: item.recommendedWeekDay
    }));

    return {
      ...displayWeek,
      content: normalize(displayWeek.content, 'contentItem'),
      community: normalize(displayWeek.community, 'communityItem'),
      coaching: normalize(displayWeek.coaching, 'coachingItem')
    };
  }, [displayWeek]);

  const userProgress = useMemo(() => {
    if (!displayWeek) return { completedItems: [], reflectionResponse: '' };
    const weekKey = displayWeek.weekBlockId || `week-${String(displayWeek.weekNumber).padStart(2, '0')}`;
    const progress = userState.weekProgress?.[weekKey] || {};
    return {
      completedItems: progress.itemsCompleted || [],
      reflectionResponse: localReflection
    };
  }, [displayWeek, userState, localReflection]);

  const handleItemToggle = (itemId) => {
    if (!isEditable) return; // Prevent editing past/future weeks
    const isComplete = !userProgress.completedItems.includes(itemId);
    toggleItemComplete(itemId, isComplete);
  };

  const handleReflectionUpdate = (text) => {
    if (!isEditable) return; // Prevent editing past/future weeks
    setLocalReflection(text);
  };

  // Effect to save reflection when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isEditable && displayWeek && localReflection !== (userState.weekProgress?.[displayWeek.weekBlockId]?.reflection || '')) {
        const weekKey = displayWeek.weekBlockId || `week-${String(displayWeek.weekNumber).padStart(2, '0')}`;
        updateDevelopmentPlanData({
          [`weekProgress.${weekKey}.reflection`]: localReflection
        });
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [localReflection, displayWeek, isEditable]);


  const sortedFeatures = useMemo(() => {
    const features = ZONE_CONFIG['development-plan'] || [];
    return features
      .filter(id => isFeatureEnabled(id))
      .sort((a, b) => getFeatureOrder(a) - getFeatureOrder(b));
  }, [isFeatureEnabled, getFeatureOrder]);

  // Generate summary
  const summary = useMemo(() => {
    if (currentWeek) {
      // Calculate progress for the current week
      const allItems = [
        ...(currentWeek.content || []),
        ...(currentWeek.community || []),
        ...(currentWeek.coaching || [])
      ];
      
      const requiredItems = allItems.filter(i => i.required !== false && i.optional !== true);
      const completedCount = requiredItems.filter(i => userProgress.completedItems.includes(i.id)).length;
      const progress = requiredItems.length > 0 ? Math.round((completedCount / requiredItems.length) * 100) : 0;

      return {
        totalSkills: currentWeek.skills?.length || 0,
        completedSkills: completedCount, 
        progress: progress, 
        currentWeek: currentWeek.weekNumber
      };
    }
    return legacyPlan ? generatePlanSummary(legacyPlan) : null;
  }, [currentWeek, legacyPlan, userProgress]);

  const scope = useMemo(() => ({
    plan: legacyPlan,
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
  }), [legacyPlan, summary, cycle, onScan, onTimeline, onDetail, currentWeek, userProgress, localReflection]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  if (!currentWeek && !legacyPlan && !sortedFeatures.includes('development-plan')) {
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