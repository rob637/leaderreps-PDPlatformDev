// src/components/developmentplan/PlanTracker.jsx  
// Main view of current development plan with action buttons
// FIXED: Added logging, works with adapted plan structure

import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, Edit, ArrowLeft } from 'lucide-react'; // REQ #4: Added ArrowLeft
import * as LucideIcons from 'lucide-react';
import { Button, Card, ProgressBar } from './DevPlanComponents';
import { COLORS, generatePlanSummary } from './devPlanUtils';
import ProgressBreakdown from './ProgressBreakdown';
import QuickPlanEditor from './QuickPlanEditor';
import WidgetRenderer from '../../admin/WidgetRenderer';

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

  if (!plan) {
    
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.MUTED }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: COLORS.NAVY }}>
          No plan available
        </h3>
        <p className="text-sm" style={{ color: COLORS.MUTED }}>
          Complete your baseline assessment to get started.
        </p>
      </div>
    );
  }

  // Generate summary with logging
  const summary = generatePlanSummary(plan);

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
          {/* REQ #4: Changed button text from "Back to Overview" to "Back to Tracker" */}
          <Button onClick={() => setShowBreakdown(false)} variant="nav-back" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Tracker
          </Button>
        </div>
        <ProgressBreakdown plan={plan} globalMetadata={globalMetadata} />
      </div>
    );
  }

  const scope = {
    ...LucideIcons,
    plan,
    cycle,
    summary,
    onEditPlan: () => setShowEditor(true),
    onScan,
    onDetail,
    onTimeline,
    setShowBreakdown,
    Card,
    Button,
    ProgressBar,
    Target,
    TrendingUp,
    Calendar,
    Edit,
    ArrowLeft,
    COLORS
  };

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Header */}
      <WidgetRenderer widgetId="dev-plan-header" scope={scope} />

      {/* Quick Stats */}
      <WidgetRenderer widgetId="dev-plan-stats" scope={scope} />

      {/* Actions */}
      <WidgetRenderer widgetId="dev-plan-actions" scope={scope} />

      {/* Focus Areas Summary */}
      <WidgetRenderer widgetId="dev-plan-focus-areas" scope={scope} />

      {/* Open-Ended Goal */}
      <WidgetRenderer widgetId="dev-plan-goal" scope={scope} />
    </div>
  );
};

export default PlanTracker;