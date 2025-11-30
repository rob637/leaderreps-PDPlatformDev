// src/components/developmentplan/PlanTracker.jsx  
// Main view of current development plan with action buttons
// FIXED: Simplified UI to match Locker/Dashboard aesthetic (Corporate Colors only)

import React, { useState, useMemo } from 'react';
import { Target, TrendingUp, Calendar, Edit, ArrowLeft, Zap, Crosshair, Flag } from 'lucide-react';
import { Button, Card, ProgressBar } from './DevPlanComponents';
import { generatePlanSummary } from './devPlanUtils';
import ProgressBreakdown from './ProgressBreakdown';
import QuickPlanEditor from './QuickPlanEditor';
import WidgetRenderer from '../../admin/WidgetRenderer';
import { useFeatures } from '../../../providers/FeatureProvider';
import { ZONE_CONFIG } from '../../../config/zoneConfig';
import { NoWidgetsEnabled } from '../../ui';
import developmentPlan from '../../../data/developmentPlan.json';

const PlanTracker = ({ 
  plan, 
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

  // New Development Plan State
  const [currentWeekIndex] = useState(0);
  const [userProgress, setUserProgress] = useState({
    completedItems: [],
    reflectionResponse: ''
  });

  const currentWeek = developmentPlan[currentWeekIndex];

  const handleItemToggle = (itemId) => {
    setUserProgress(prev => {
      const isCompleted = prev.completedItems.includes(itemId);
      return {
        ...prev,
        completedItems: isCompleted 
          ? prev.completedItems.filter(id => id !== itemId)
          : [...prev.completedItems, itemId]
      };
    });
  };

  const handleReflectionUpdate = (text) => {
    setUserProgress(prev => ({
      ...prev,
      reflectionResponse: text
    }));
  };

  const sortedFeatures = useMemo(() => {
    const features = ZONE_CONFIG['development-plan'] || [];
    return features
      .filter(id => isFeatureEnabled(id))
      .sort((a, b) => getFeatureOrder(a) - getFeatureOrder(b));
  }, [isFeatureEnabled, getFeatureOrder]);

  // Generate summary with logging (safe check)
  const summary = plan ? generatePlanSummary(plan) : null;

  const scope = useMemo(() => ({
    plan,
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
  }), [plan, summary, cycle, onScan, onTimeline, onDetail, currentWeek, userProgress]);

  if (!plan && !sortedFeatures.includes('development-plan')) {
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
        plan={plan}
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
        <ProgressBreakdown plan={plan} globalMetadata={globalMetadata} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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