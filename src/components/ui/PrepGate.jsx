import React from 'react';
import { useAccessControlContext } from '../../providers/AccessControlProvider';
import { AlertTriangle, CheckCircle, User, ClipboardList, ArrowRight, Lock } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';

/**
 * PrepGate Component
 * Displays when user hasn't completed prep phase requirements.
 * Shows what's missing and provides navigation to complete items.
 */
const PrepGate = ({ children, showStatus = true }) => {
  const { prepStatus, isPrepComplete, loading } = useAccessControlContext();
  const { navigate } = useAppServices();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse text-slate-400">Loading...</div>
      </div>
    );
  }

  if (isPrepComplete) {
    return <>{children}</>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 sm:p-8 shadow-lg">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-corporate-navy mb-2">
                Complete Your Prep Work
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                Before starting the program, please complete these essential setup items.
              </p>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {/* Leader Profile */}
            <div 
              onClick={() => navigate('development-plan')}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                prepStatus.hasLeaderProfile 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-corporate-teal hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                prepStatus.hasLeaderProfile ? 'bg-emerald-100' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {prepStatus.hasLeaderProfile ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <User className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-corporate-navy">Leader Profile</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {prepStatus.hasLeaderProfile 
                    ? 'Completed' 
                    : 'Tell us about yourself and your leadership journey'}
                </p>
              </div>
              {!prepStatus.hasLeaderProfile && (
                <ArrowRight className="w-5 h-5 text-corporate-teal" />
              )}
            </div>

            {/* Baseline Assessment */}
            <div 
              onClick={() => navigate('development-plan')}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                prepStatus.hasBaselineAssessment 
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-corporate-teal hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                prepStatus.hasBaselineAssessment ? 'bg-emerald-100' : 'bg-slate-100 dark:bg-slate-700'
              }`}>
                {prepStatus.hasBaselineAssessment ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ClipboardList className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-corporate-navy">Baseline Assessment</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {prepStatus.hasBaselineAssessment 
                    ? 'Completed' 
                    : 'Complete the assessment to generate your development plan'}
                </p>
              </div>
              {!prepStatus.hasBaselineAssessment && (
                <ArrowRight className="w-5 h-5 text-corporate-teal" />
              )}
            </div>
          </div>

          {showStatus && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100/50 dark:bg-amber-900/30/50 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Complete {prepStatus.missingItems.length === 1 ? 'the item' : 'both items'} above to unlock the full program.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrepGate;
