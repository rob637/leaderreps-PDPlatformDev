import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  ClipboardCheck, CheckCircle, ChevronRight, Clock, Target, 
  BarChart2, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { useNavigation } from '../../providers/NavigationProvider';
import BaselineAssessmentSimple from '../screens/developmentplan/BaselineAssessmentSimple';
import { buildLatestSummary, diffAssessments, enrichAssessment } from '../../services/assessmentScoring';
import { logActivity, ACTIVITY_TYPES } from '../../services/activityLogger';

/**
 * Baseline Assessment Widget for Dashboard
 * Shows during Prep Phase to encourage assessment completion
 * Leverages existing BaselineAssessment component
 */
const BaselineAssessmentWidget = () => {
  const { developmentPlanData, updateDevelopmentPlanData, db, user } = useAppServices();
  const { navigate } = useNavigation();
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
        currentAssessment: assessment,
        latestAssessmentSummary: buildLatestSummary(assessment)
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

    // Growth snapshot: first → latest
    const enrichedLatest = enrichAssessment(latestAssessment);
    const firstAssessment = assessmentHistory.length > 1 ? enrichAssessment(assessmentHistory[0]) : null;
    const growth = firstAssessment ? diffAssessments(firstAssessment, enrichedLatest) : null;
    let topImproved = null;
    if (growth) {
      const entries = Object.entries(growth.byCategory);
      if (entries.length > 0) {
        topImproved = entries.reduce((best, cur) => (cur[1].delta > best[1].delta ? cur : best));
      }
    }
    const overallDelta = growth?.overall.delta ?? 0;
    const DeltaIcon = overallDelta > 0 ? TrendingUp : overallDelta < 0 ? TrendingDown : Minus;
    const deltaColor = overallDelta > 0
      ? 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
      : overallDelta < 0
        ? 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
        : 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300';
    
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
                {enrichedLatest?.scores?.overall ? ` • Overall ${enrichedLatest.scores.overall.toFixed(2)}/4` : ''}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="text-sm font-medium text-corporate-teal-ink hover:text-corporate-teal/80 hover:underline transition-colors"
            >
              Retake
            </button>
          </div>

          {/* Growth snapshot — shown once a second assessment exists */}
          {growth && (
            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${deltaColor}`}>
                  <DeltaIcon className="w-3 h-3" />
                  {overallDelta > 0 ? '+' : ''}{overallDelta.toFixed(2)} overall
                </span>
                {topImproved && topImproved[1].delta !== 0 && (
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    Biggest shift: <span className="font-medium text-corporate-navy dark:text-white">{topImproved[0]}</span>
                    {' '}({topImproved[1].delta > 0 ? '+' : ''}{topImproved[1].delta.toFixed(2)})
                  </span>
                )}
              </div>
              <button
                onClick={() => navigate('assessment-history')}
                className="flex-shrink-0 text-xs font-medium text-corporate-teal-ink hover:underline whitespace-nowrap"
              >
                See growth →
              </button>
            </div>
          )}

          {!growth && assessmentHistory.length === 1 && (
            <div className="border-t border-slate-200 dark:border-slate-700 px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Take this again later to see your growth over time.</span>
              <button
                onClick={() => navigate('assessment-history')}
                className="flex-shrink-0 text-xs font-medium text-corporate-teal-ink hover:underline whitespace-nowrap"
              >
                View history →
              </button>
            </div>
          )}
        </Card>

        {/* Modal for retake (blank form, continues cycle counter) */}
        {showModal && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="relative max-w-xl w-full my-auto">
              <BaselineAssessmentSimple 
                onComplete={handleAssessmentComplete}
                onClose={() => setShowModal(false)}
                isLoading={saving}
                initialData={{ cycle: latestAssessment?.cycle ?? assessmentHistory.length }}
              />
            </div>
          </div>,
          document.body,
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
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-8 pb-safe bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative max-w-xl w-full my-auto">
            <BaselineAssessmentSimple 
              onComplete={handleAssessmentComplete}
              onClose={() => setShowModal(false)}
              isLoading={saving}
              initialData={null}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
};

export default BaselineAssessmentWidget;
