// src/components/developmentplan/PlanTracker.jsx
// Main plan tracker view integrating timeline, progress breakdown, and quick actions

import React, { useState } from 'react';
import { RefreshCw, Edit, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { Button, Card, StatCard, SectionHeader, EmptyState } from './DevPlanComponents';
import { generatePlanSummary, COLORS } from './devPlanUtils';
import MilestoneTimeline from './MilestoneTimeline';
import ProgressBreakdown from './ProgressBreakdown';
import QuickPlanEditor from './QuickPlanEditor';

const PlanTracker = ({ 
  developmentPlanData, 
  globalMetadata,
  onStartProgressScan,
  onUpdatePlan,
  onNavigateToDailyPractice,
}) => {
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  
  const plan = developmentPlanData?.currentPlan;
  
  if (!plan) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No Development Plan"
        description="Complete your baseline assessment to generate your personalized development plan."
        action={
          <Button variant="primary" onClick={onStartProgressScan}>
            Start Assessment
          </Button>
        }
      />
    );
  }

  const summary = generatePlanSummary(plan);

  const handleSavePlan = async (updatedPlan) => {
    await onUpdatePlan(updatedPlan);
    setShowQuickEdit(false);
  };

  // Quick Edit Mode
  if (showQuickEdit) {
    return (
      <QuickPlanEditor
        plan={plan}
        globalMetadata={globalMetadata}
        onSave={handleSavePlan}
        onCancel={() => setShowQuickEdit(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card accent="TEAL">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold mb-2" style={{ color: COLORS.NAVY }}>
              Development Journey
            </h1>
            <p className="text-gray-600 mb-4">
              Cycle {summary.cycle} • Focus: {typeof summary.focusArea === 'object' && summary.focusArea?.name ? summary.focusArea.name : summary.focusArea || 'Not Set'}
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Started {new Date(summary.startDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {summary.totalReps} Active Skills
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickEdit(true)}
            >
              <Edit size={16} />
              Quick Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onStartProgressScan}
            >
              <RefreshCw size={16} />
              Progress Scan
            </Button>
          </div>
        </div>
      </Card>

      {/* Key Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Current Week"
          value={`Week ${summary.currentWeek}`}
          icon={Calendar}
          trend={summary.currentPhase}
          color={COLORS.TEAL}
        />
        <StatCard
          label="Overall Progress"
          value={`${summary.progress}%`}
          icon={TrendingUp}
          trend={`${100 - summary.progress}% remaining`}
          color={COLORS.BLUE}
        />
        <StatCard
          label="Active Skills"
          value={summary.totalReps}
          icon={BarChart3}
          trend="Core development areas"
          color={COLORS.PURPLE}
        />
        <StatCard
          label="Days Practiced"
          value="--"
          icon={Calendar}
          trend="This cycle"
          color={COLORS.GREEN}
        />
      </div>

      {/* Timeline */}
      <MilestoneTimeline plan={plan} />

      {/* Progress Breakdown */}
      <ProgressBreakdown 
        plan={plan}
        globalMetadata={globalMetadata}
      />

      {/* Quick Actions */}
      <Card title="Quick Actions" accent="ORANGE">
        <div className="grid grid-cols-2 gap-4">
          <ActionCard
            title="Daily Practice"
            description="Complete today's reps and track progress"
            onClick={onNavigateToDailyPractice}
            variant="primary"
          />
          <ActionCard
            title="Update Progress"
            description="Quick edit weeks completed for each skill"
            onClick={() => setShowQuickEdit(true)}
            variant="outline"
          />
        </div>
      </Card>

      {/* Historical Data (if available) */}
      {developmentPlanData?.planHistory && developmentPlanData.planHistory.length > 0 && (
        <Card title="Previous Cycles" accent="PURPLE">
          <div className="space-y-2">
            {developmentPlanData.planHistory.map((historicalPlan, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border"
                style={{ borderColor: COLORS.SUBTLE, background: COLORS.LIGHT_GRAY }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold" style={{ color: COLORS.NAVY }}>
                      Cycle {historicalPlan.cycle}
                    </span>
                    <p className="text-xs text-gray-600">
                      {typeof historicalPlan.focusArea === 'object' && historicalPlan.focusArea?.name ? historicalPlan.focusArea.name : historicalPlan.focusArea || 'Not Set'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(historicalPlan.startDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// Quick Action Card Component
const ActionCard = ({ title, description, onClick, variant = 'primary' }) => {
  return (
    <button
      onClick={onClick}
      className="p-4 rounded-xl border-2 text-left transition-all hover:shadow-md hover:scale-105"
      style={{
        borderColor: variant === 'primary' ? COLORS.TEAL : COLORS.SUBTLE,
        background: variant === 'primary' ? `${COLORS.TEAL}10` : 'white',
      }}
    >
      <h4 className="font-bold text-sm mb-1" style={{ color: COLORS.NAVY }}>
        {title}
      </h4>
      <p className="text-xs text-gray-600">{description}</p>
    </button>
  );
};

export default PlanTracker;
