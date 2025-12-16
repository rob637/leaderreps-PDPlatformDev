import React, { useState } from 'react';
import { 
  ClipboardCheck, CheckCircle, ChevronRight, Clock, Target, 
  Sparkles, BarChart2, Loader
} from 'lucide-react';
import { Card } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import BaselineAssessment from '../screens/developmentplan/BaselineAssessment';

/**
 * Baseline Assessment Widget for Dashboard
 * Shows during Prep Phase to encourage assessment completion
 * Leverages existing BaselineAssessment component
 */
const BaselineAssessmentWidget = () => {
  const { developmentPlanData, updateDevelopmentPlanData } = useAppServices();
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
      setShowModal(false);
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
      <Card accent="TEAL">
        <div className="flex items-center gap-4 p-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-corporate-navy">Baseline Assessment Complete</h3>
            <p className="text-sm text-slate-500">
              Completed {completedDate} • {goalCount} goal{goalCount !== 1 ? 's' : ''} set
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="text-sm text-corporate-teal hover:underline"
          >
            View Results
          </button>
        </div>
      </Card>
    );
  }

  // Assessment incomplete - show CTA
  return (
    <>
      <Card accent="NAVY" className="overflow-hidden">
        <div className="relative">
          {/* Decorative background */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-corporate-navy/20 to-transparent rounded-bl-full" />
          
          <div className="p-5 relative">
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="w-14 h-14 bg-gradient-to-br from-corporate-navy to-corporate-navy/80 rounded-2xl flex items-center justify-center shadow-lg">
                <ClipboardCheck className="w-7 h-7 text-white" />
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-corporate-navy">Complete Your Baseline Assessment</h3>
                  <span className="px-2 py-0.5 bg-corporate-navy/10 text-corporate-navy text-xs font-bold rounded-full">
                    Day 1 Task
                  </span>
                </div>
                
                <p className="text-sm text-slate-600 mb-4">
                  Assess your current leadership skills and set goals. This creates your personalized development plan.
                </p>

                {/* Benefits */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                    <Target className="w-3 h-3 text-corporate-teal" />
                    Set 1-3 goals
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                    <BarChart2 className="w-3 h-3 text-blue-500" />
                    Track progress
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3 text-amber-500" />
                    ~5 min
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => setShowModal(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 
                    bg-gradient-to-r from-corporate-navy to-corporate-navy/90 
                    hover:from-corporate-navy/90 hover:to-corporate-navy/80
                    text-white font-semibold rounded-xl shadow-md hover:shadow-lg 
                    transition-all transform hover:-translate-y-0.5"
                >
                  Start Assessment
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center z-10">
              <div>
                <h2 className="text-xl font-bold text-corporate-navy">Baseline Assessment</h2>
                <p className="text-sm text-slate-500">Rate your current skills and set your goals</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Assessment Form */}
            <div className="p-4">
              <BaselineAssessment 
                onComplete={handleAssessmentComplete}
                isLoading={saving}
                initialData={latestAssessment}
                mode={hasBaseline ? 'edit' : 'create'}
                isWidget={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BaselineAssessmentWidget;
