import React, { useState } from 'react';
import { 
  ClipboardCheck, CheckCircle, ChevronRight, Clock, Target, 
  BarChart2
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import BaselineAssessmentSimple from '../screens/developmentplan/BaselineAssessmentSimple';
import { logActivity, ACTIVITY_TYPES } from '../../services/activityLogger';

/**
 * Baseline Assessment Widget for Dashboard
 * Shows during Prep Phase to encourage assessment completion
 * Leverages existing BaselineAssessment component
 */
const BaselineAssessmentWidget = () => {
  const { developmentPlanData, updateDevelopmentPlanData, db, user } = useAppServices();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Check if assessment is complete
  const assessmentHistory = developmentPlanData?.assessmentHistory || [];
  const hasBaseline = assessmentHistory.length > 0;
  const latestAssessment = hasBaseline ? assessmentHistory[assessmentHistory.length - 1] : null;
  
  // Calculate completion based on existence of answers
  const isComplete = hasBaseline && latestAssessment?.answers && Object.keys(latestAssessment.answers).length > 0;

  // Handle assessment completion
  const handleAssessmentComplete = async (assessment) => {
    setSaving(true);
    try {
      // Save to development plan data
      const newHistory = [...assessmentHistory, assessment];
      await updateDevelopmentPlanData({
        assessmentHistory: newHistory,
        currentAssessment: assessment
      });
      
      // Log activity for admin visibility
      if (db && user) {
        logActivity(db, ACTIVITY_TYPES.ASSESSMENT_COMPLETE, {
          userId: user.uid,
          userEmail: user.email,
          action: 'Completed Baseline Assessment',
          details: `Cycle ${assessment.cycle || 1}`
        }).catch(() => {}); // silent fail
      }
      
      setShowModal(false);
      
      // Scroll to top after modal closes
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }, 100);
    } catch (err) {
      console.error('[BaselineAssessmentWidget] Error saving assessment:', err);
    } finally {
      setSaving(false);
    }
  };

  // Assessment is complete - show success state
  if (isComplete) {
    const completedDate = latestAssessment?.date 
      ? new Date(latestAssessment.date).toLocaleDateString() 
      : 'Recently';
    const goalCount = latestAssessment?.openEnded?.length || 0;
    
    return (
      <>
        <Card accent="TEAL">
          <div className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-corporate-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                Baseline Assessment Complete
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400" style={{ fontFamily: 'var(--font-body)' }}>
                Completed {completedDate} • {goalCount} goal{goalCount !== 1 ? 's' : ''} set
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm font-medium text-corporate-teal hover:text-corporate-teal/80 hover:underline transition-colors"
            >
              View or Update
            </button>
          </div>
        </Card>

        {/* Modal for viewing/updating */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative max-w-3xl w-full my-auto">
              <BaselineAssessmentSimple 
                onComplete={handleAssessmentComplete}
                onClose={() => setShowModal(false)}
                isLoading={saving}
                initialData={latestAssessment}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // Assessment incomplete - show CTA
  return (
    <>
      <Card accent="NAVY">
        <div className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-corporate-navy/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="w-6 h-6 text-corporate-navy" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-corporate-navy mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
                Complete Your Baseline Assessment
              </h3>
              
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3" style={{ fontFamily: 'var(--font-body)' }}>
                Assess your current leadership skills and set goals. This creates your personalized development plan.
              </p>

              {/* Benefits */}
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                  <Target className="w-3 h-3 text-corporate-teal" />
                  Set 1-3 goals
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                  <BarChart2 className="w-3 h-3 text-blue-500" />
                  Track progress
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                  <Clock className="w-3 h-3 text-amber-500" />
                  ~5 min
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 
                  bg-corporate-navy hover:bg-corporate-navy/90
                  text-white font-medium rounded-lg shadow-sm hover:shadow 
                  transition-all text-sm"
              >
                Start Assessment
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative max-w-3xl w-full my-auto">
            <BaselineAssessmentSimple 
              onComplete={handleAssessmentComplete}
              onClose={() => setShowModal(false)}
              isLoading={saving}
              initialData={null}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BaselineAssessmentWidget;
