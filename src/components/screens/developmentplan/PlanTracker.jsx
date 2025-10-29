// src/components/developmentplan/PlanTracker.jsx  
// Main view of current development plan with action buttons
// FIXED: Added logging, works with adapted plan structure

import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, Edit } from 'lucide-react';
import { Button, Card, ProgressBar } from './DevPlanComponents';
import { COLORS, generatePlanSummary } from './devPlanUtils';
import ProgressBreakdown from './ProgressBreakdown';
import QuickPlanEditor from './QuickPlanEditor';

const PlanTracker = ({ 
  plan, 
  cycle = 1, 
  globalMetadata, 
  skillCatalog = [],
  onEditPlan,
  onScan,
  onDetail,
  onTimeline 
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  if (!plan) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card accent="TEAL">
          <p className="text-gray-600">No plan available. Complete your baseline assessment to get started.</p>
        </Card>
      </div>
    );
  }

  // Generate summary with logging
  const summary = generatePlanSummary(plan);
  console.log('[PlanTracker] Plan summary:', {
    hasCoreReps: !!plan?.coreReps,
    coreRepsCount: plan?.coreReps?.length,
    progress: summary.progress,
    cycle
  });

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
        <div className="max-w-4xl mx-auto p-6 mb-4">
          <Button onClick={() => setShowBreakdown(false)} variant="secondary">
            Back to Overview
          </Button>
        </div>
        <ProgressBreakdown plan={plan} globalMetadata={globalMetadata} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card accent="TEAL">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: COLORS.NAVY }}>
              Development Plan
            </h1>
            <p className="text-gray-600">
              Cycle {cycle} • {summary.totalSkills} skills • {summary.progress}% complete
            </p>
          </div>
          <Button
            onClick={() => setShowEditor(true)}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Edit size={16} />
            Quick Edit
          </Button>
        </div>

        <ProgressBar progress={summary.progress} color={COLORS.TEAL} />
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card accent="BLUE">
          <div className="flex items-center gap-3">
            <Target size={32} style={{ color: COLORS.BLUE }} />
            <div>
              <div className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                {summary.totalSkills}
              </div>
              <div className="text-sm text-gray-600">Total Skills</div>
            </div>
          </div>
        </Card>

        <Card accent="GREEN">
          <div className="flex items-center gap-3">
            <TrendingUp size={32} style={{ color: COLORS.GREEN }} />
            <div>
              <div className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                {summary.completedSkills}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </Card>

        <Card accent="ORANGE">
          <div className="flex items-center gap-3">
            <Calendar size={32} style={{ color: COLORS.ORANGE }} />
            <div>
              <div className="text-2xl font-bold" style={{ color: COLORS.NAVY }}>
                {summary.currentWeek || 0}
              </div>
              <div className="text-sm text-gray-600">Current Week</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card accent="TEAL">
        <h2 className="font-bold mb-4" style={{ color: COLORS.NAVY }}>
          Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            onClick={() => setShowBreakdown(true)}
            variant="primary"
            className="flex items-center justify-center gap-2"
          >
            <Target size={16} />
            View Progress Breakdown
          </Button>
          
          {onScan && (
            <Button
              onClick={onScan}
              variant="primary"
              className="flex items-center justify-center gap-2"
            >
              <TrendingUp size={16} />
              Start Progress Scan
            </Button>
          )}
          
          {onTimeline && (
            <Button
              onClick={onTimeline}
              variant="secondary"
              className="flex items-center justify-center gap-2"
            >
              <Calendar size={16} />
              View Timeline
            </Button>
          )}
          
          {onDetail && (
            <Button
              onClick={onDetail}
              variant="secondary"
              className="flex items-center justify-center gap-2"
            >
              View Detailed Plan
            </Button>
          )}
        </div>
      </Card>

      {/* Focus Areas Summary */}
      {plan.focusAreas && (
        <Card accent="PURPLE">
          <h2 className="font-bold mb-4" style={{ color: COLORS.NAVY }}>
            Focus Areas
          </h2>
          <div className="space-y-3">
            {plan.focusAreas.map((area, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2" style={{ color: COLORS.NAVY }}>
                  {area.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {area.why}
                </p>
                <div className="text-xs text-gray-500">
                  {area.reps?.length || 0} practice reps • {area.courses?.length || 0} courses
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Open-Ended Goal */}
      {plan.openEndedAnswer && (
        <Card accent="GOLD">
          <h3 className="font-bold mb-2" style={{ color: COLORS.NAVY }}>
            Your Goal
          </h3>
          <p className="text-gray-700">{plan.openEndedAnswer}</p>
        </Card>
      )}
    </div>
  );
};

export default PlanTracker;
