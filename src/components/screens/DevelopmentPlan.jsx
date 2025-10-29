// src/components/screens/DevelopmentPlan.jsx
// ENHANCED VERSION with Detailed 18-Month Plan View (FIX #4)

import React, { useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import { LoadingSpinner } from './developmentplan/DevPlanComponents';
import { generatePlanFromAssessment } from './developmentplan/devPlanUtils';

// Import sub-components
import BaselineAssessment from './developmentplan/BaselineAssessment';
import ProgressScan from './developmentplan/ProgressScan';
import PlanTracker from './developmentplan/PlanTracker';

// FIX #4: Import the detailed plan view component
import DetailedPlanView from './developmentplan/DetailedPlanView';

const DevelopmentPlanScreen = () => {
  const {
    isLoading: isAppLoading,
    error: appError,
    developmentPlanData,
    globalMetadata,
    updateDevelopmentPlanData,
    updateDailyPracticeData,
    syncPlanToDailyPractice,
  } = useAppServices();

  const [view, setView] = useState('loading');
  const [isSaving, setIsSaving] = useState(false);

  // Determine which view to show based on data state
  useEffect(() => {
    if (isAppLoading) {
      setView('loading');
      return;
    }

    if (appError) {
      setView('error');
      return;
    }

    if (!updateDevelopmentPlanData || !updateDailyPracticeData) {
      console.error('[DevPlan] Critical services missing');
      setView('error');
      return;
    }

    // Determine view based on plan state
    if (!developmentPlanData || !developmentPlanData.currentPlan) {
      setView('assessment');
    } else {
      // FIX #4: Default to detailed view after plan is created
      setView('detailed');
    }
  }, [isAppLoading, appError, developmentPlanData, updateDevelopmentPlanData, updateDailyPracticeData]);

  // Handler for completing initial assessment
  const handleAssessmentComplete = useCallback(async (assessment) => {
    console.log('[DevPlan] Processing completed assessment...');
    setIsSaving(true);

    if (!updateDevelopmentPlanData) {
      alert('Development Plan update service is missing. Cannot save.');
      setIsSaving(false);
      return;
    }

    try {
      // Generate plan from assessment
      const skillCatalog = globalMetadata?.config?.catalog?.SKILL_CATALOG || [];
      const plan = generatePlanFromAssessment(assessment, skillCatalog);

      // Prepare data structure
      const newDevPlanData = {
        currentPlan: plan,
        currentCycle: plan.cycle,
        lastAssessmentDate: assessment.date,
        assessmentHistory: [assessment],
        planHistory: [plan],
        createdAt: new Date().toISOString(),
      };

      // Save to Firestore
      const success = await updateDevelopmentPlanData(newDevPlanData);
      if (!success) throw new Error('updateDevelopmentPlanData returned false');

      console.log('[DevPlan] Initial plan saved');

      // Sync to Daily Practice
      await syncPlanToDailyPractice(plan);
      console.log('[DevPlan] Synced to Daily Practice');

      setIsSaving(false);
      // FIX #4: Navigate to detailed view after creating plan
      setView('detailed');
    } catch (error) {
      console.error('[DevPlan] Error saving assessment:', error);
      alert('There was an error saving your assessment. Please try again.');
      setIsSaving(false);
    }
  }, [updateDevelopmentPlanData, syncPlanToDailyPractice, globalMetadata]);

  // Handler for completing progress scan
  const handleScanComplete = useCallback(async (newPlan, newAssessment) => {
    console.log('[DevPlan] Processing completed progress scan...');
    setIsSaving(true);

    if (!updateDevelopmentPlanData) {
      alert('Development Plan update service is missing. Cannot save.');
      setIsSaving(false);
      return;
    }

    try {
      const currentHistory = developmentPlanData?.assessmentHistory || [];
      const currentPlanHistory = developmentPlanData?.planHistory || [];

      const updatedDevPlanData = {
        currentPlan: newPlan,
        currentCycle: newPlan.cycle,
        lastAssessmentDate: newAssessment.date,
        assessmentHistory: [...currentHistory, newAssessment],
        planHistory: [...currentPlanHistory, newPlan],
        createdAt: developmentPlanData?.createdAt || new Date().toISOString(),
      };

      const success = await updateDevelopmentPlanData(updatedDevPlanData);
      if (!success) throw new Error('updateDevelopmentPlanData returned false');

      console.log('[DevPlan] Progress scan saved');

      await syncPlanToDailyPractice(newPlan);
      console.log('[DevPlan] Synced to Daily Practice');

      setIsSaving(false);
      // FIX #4: Return to detailed view after scan
      setView('detailed');
    } catch (error) {
      console.error('[DevPlan] Error saving progress scan:', error);
      alert('There was an error saving your progress scan. Please try again.');
      setIsSaving(false);
    }
  }, [developmentPlanData, updateDevelopmentPlanData, syncPlanToDailyPractice]);

  // Handler for updating plan (from QuickPlanEditor)
  const handleUpdatePlan = useCallback(async (updatedPlan) => {
    console.log('[DevPlan] Updating plan...');
    setIsSaving(true);

    try {
      const updatedDevPlanData = {
        ...developmentPlanData,
        currentPlan: updatedPlan,
      };

      const success = await updateDevelopmentPlanData(updatedDevPlanData);
      if (!success) throw new Error('Failed to update plan');

      console.log('[DevPlan] Plan updated');

      await syncPlanToDailyPractice(updatedPlan);
      console.log('[DevPlan] Synced to Daily Practice');

      setIsSaving(false);
    } catch (error) {
      console.error('[DevPlan] Error updating plan:', error);
      alert('Failed to update plan. Please try again.');
      setIsSaving(false);
    }
  }, [developmentPlanData, updateDevelopmentPlanData, syncPlanToDailyPractice]);

  // Render appropriate view
  if (view === 'loading' || isAppLoading || isSaving) {
    if (!isAppLoading && (!updateDevelopmentPlanData || !updateDailyPracticeData)) {
      console.error('[DevPlan] Critical functions failed to load');
      return <LoadingSpinner message="A critical service failed to load. Please contact support." />;
    }
    return <LoadingSpinner message={isSaving ? "Saving Plan..." : "Loading Development Plan..."} />;
  }

  if (view === 'error' || appError) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Loading Error</h2>
        <p className="text-gray-600">Could not load development plan data or critical services failed. Please try refreshing.</p>
        {appError && <pre className="mt-4 text-xs text-left bg-red-50 p-2 border border-red-200 rounded">{appError.message}</pre>}
      </div>
    );
  }

  switch (view) {
    case 'assessment':
      return <BaselineAssessment onComplete={handleAssessmentComplete} />;
    
    case 'scan':
      if (!developmentPlanData) return <LoadingSpinner message="Loading previous plan data..." />;
      return (
        <ProgressScan
          developmentPlanData={developmentPlanData}
          globalMetadata={globalMetadata}
          onCompleteScan={handleScanComplete}
        />
      );
    
    // FIX #4: Added detailed view as primary view
    case 'detailed':
      if (!developmentPlanData) return <LoadingSpinner message="Loading plan details..." />;
      return (
        <DetailedPlanView
          developmentPlanData={developmentPlanData}
          globalMetadata={globalMetadata}
          onNavigateToTracker={() => setView('tracker')}
          onStartProgressScan={() => setView('scan')}
          onUpdatePlan={handleUpdatePlan}
        />
      );
    
    case 'tracker':
      if (!developmentPlanData) return <LoadingSpinner message="Loading plan details..." />;
      return (
        <PlanTracker
          developmentPlanData={developmentPlanData}
          globalMetadata={globalMetadata}
          onStartProgressScan={() => setView('scan')}
          onUpdatePlan={handleUpdatePlan}
          onViewDetailedPlan={() => setView('detailed')}
          onNavigateToDailyPractice={() => {
            console.log('[DevPlan] Navigate to Daily Practice');
          }}
        />
      );
    
    default:
      return (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600">Unknown State</h2>
          <p className="text-gray-600">Could not determine view state ({view}). Please try refreshing.</p>
        </div>
      );
  }
};

export default DevelopmentPlanScreen;
