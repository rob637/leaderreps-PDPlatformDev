// src/components/developmentplan/PlanTracker.jsx  
// Main view of current development plan with action buttons
// FIXED: Simplified UI to match Locker/Dashboard aesthetic (Corporate Colors only)

import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, Edit, ArrowLeft, Zap, Crosshair, Flag } from 'lucide-react';
import { Button, Card, ProgressBar } from './DevPlanComponents';
import { generatePlanSummary } from './devPlanUtils';
import ProgressBreakdown from './ProgressBreakdown';
import QuickPlanEditor from './QuickPlanEditor';

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
        <Target className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <h3 className="text-lg font-semibold mb-2 text-[#002E47]">
          No plan available
        </h3>
        <p className="text-sm text-slate-500">
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
      {/* Header Section */}
      <Card title="Development Plan" icon={Target} accent="TEAL">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <p className="text-slate-600 font-medium">
              Cycle {cycle} • {summary.totalSkills} skills
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {summary.progress}% complete
            </p>
          </div>
          <Button
            onClick={() => setShowEditor(true)}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <Edit size={16} />
            Quick Edit
          </Button>
        </div>
        <ProgressBar progress={summary.progress} color="#47A88D" />
      </Card>

      {/* Stats Grid - Simplified to single card with grid inside */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#002E47]/10 flex items-center justify-center text-[#002E47]">
            <Target size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#002E47]">
              {summary.totalSkills}
            </div>
            <div className="text-sm text-slate-600">Total Skills</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#47A88D]/10 flex items-center justify-center text-[#47A88D]">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#002E47]">
              {summary.completedSkills}
            </div>
            <div className="text-sm text-slate-600">Completed</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#E04E1B]/10 flex items-center justify-center text-[#E04E1B]">
            <Calendar size={24} />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#002E47]">
              {summary.currentWeek || 0}
            </div>
            <div className="text-sm text-slate-600">Current Week</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <Card title="Actions" icon={Zap} accent="NAVY">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              variant="outline"
              className="flex items-center justify-center gap-2"
            >
              <TrendingUp size={16} />
              Start Progress Scan
            </Button>
          )}
          
          {onTimeline && (
            <Button
              onClick={onTimeline}
              variant="ghost"
              className="flex items-center justify-center gap-2"
            >
              <Calendar size={16} />
              View Timeline
            </Button>
          )}
          
          {onDetail && (
            <Button
              onClick={onDetail}
              variant="ghost"
              className="flex items-center justify-center gap-2"
            >
              View Detailed Plan
            </Button>
          )}
        </div>
      </Card>

      {/* Focus Areas - Clean List */}
      <Card title="Focus Areas" icon={Crosshair} accent="TEAL">
        <div className="space-y-3">
          {plan.focusAreas && plan.focusAreas.map((area, index) => (
            <div key={index} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h3 className="font-bold text-[#002E47] mb-1">
                {area.name}
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                {area.why}
              </p>
              <div className="flex items-center gap-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <span>{area.reps?.length || 0} REPS</span>
                <span>•</span>
                <span>{area.courses?.length || 0} COURSES</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Goal - Simple Card */}
      <Card title="Your Goal" icon={Flag} accent="ORANGE">
        <p className="text-slate-700 italic border-l-4 border-[#E04E1B] pl-4 py-1">
          "{plan.openEndedAnswer}"
        </p>
      </Card>
    </div>
  );
};

export default PlanTracker;