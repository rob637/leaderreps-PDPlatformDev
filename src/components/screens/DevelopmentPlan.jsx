// src/components/screens/DevelopmentPlan.jsx
// Parent container for the Development Plan flow (no-regression, single-CTA per screen)
// Wires: BaselineAssessment → PlanTracker → ProgressScan (+ optional Detail/Timeline/Quick Edit inside children)

import React, { useMemo, useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import BaselineAssessment from './developmentplan/BaselineAssessment';
import PlanTracker from './developmentplan/PlanTracker';
import ProgressScan from './developmentplan/ProgressScan';
import DetailedPlanView from './developmentplan/DetailedPlanView';
import MilestoneTimeline from './developmentplan/MilestoneTimeline';
import { Button, Card, EmptyState } from './developmentplan/DevPlanComponents';
import { generatePlanFromAssessment, normalizeSkillCatalog } from './developmentplan/devPlanUtils';

// Simple guard wrapper
const LoadingBlock = ({ title = 'Loading…', description = 'Preparing your development plan...' }) => (
  <div className="max-w-3xl mx-auto p-6">
    <Card accent="TEAL">
      <h2 className="text-xl font-extrabold mb-2"> {title} </h2>
      <p className="text-gray-600">{description}</p>
    </Card>
  </div>
);

export default function DevelopmentPlan() {
  const services = useAppServices();
  const {
    db, userId, isAuthReady, isLoading: isServicesLoading, navigate,
    developmentPlanData, updateDevelopmentPlanData, metadata: globalMetadata
  } = services || {};

  // Local view-state (router-in-component)
  // tracker | baseline | scan | detail | timeline
  const hasCurrentPlan = !!(developmentPlanData && developmentPlanData.currentPlan);
  const [view, setView] = useState(hasCurrentPlan ? 'tracker' : 'baseline');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Sync view with live snapshots as they arrive
  useEffect(() => {
    if (developmentPlanData?.currentPlan && view === 'baseline') setView('tracker');
    if (!developmentPlanData?.currentPlan && view === 'tracker') setView('baseline');
  }, [developmentPlanData?.currentPlan]);

  // Helpers
  const skillCatalog = useMemo(() => normalizeSkillCatalog(globalMetadata), [globalMetadata]);

  const writeDevPlan = async (payload, { merge = true } = {}) => {
    setIsSaving(true);
    setError(null);
    try {
      if (typeof updateDevelopmentPlanData === 'function') {
        const ok = await updateDevelopmentPlanData(payload, { merge });
        if (ok === false) {
          console.warn('[DevelopmentPlan] updateDevelopmentPlanData returned false; continuing as best-effort.');
        }
      } else if (db && userId) {
        // Fallback best-effort path if writer not provided
        const path = `users/${userId}/development/plan`; // <-- adjust if your path differs
        await db.doc(path).set(payload, { merge });
      } else {
        throw new Error('No writer (updateDevelopmentPlanData) and no db/user available.');
      }
    } catch (e) {
      console.error('[DevelopmentPlan] Write failed:', e);
      setError(e);
      setIsSaving(false);
      return false;
    }
    setIsSaving(false);
    return true;
  };

  // ===== FLOW ACTIONS =====

  // Baseline → Generate new plan then route to tracker
  const handleCompleteBaseline = async (assessment) => {
    const date = new Date().toISOString();
    const newAssessment = { ...assessment, date };
    const newPlanRaw = generatePlanFromAssessment(newAssessment, skillCatalog);

    // If an existing plan exists, bump cycle for the new plan & archive the old
    const prevPlan = developmentPlanData?.currentPlan;
    const prevCycle = prevPlan?.cycle || developmentPlanData?.cycle || 0;
    const newPlan = { ...newPlanRaw, cycle: (prevCycle || 0) + 1 };

    // Build history arrays
    const prevPlans = Array.isArray(developmentPlanData?.previousPlans) ? developmentPlanData.previousPlans.slice() : [];
    if (prevPlan) {
      prevPlans.push({
        ...prevPlan,
        endDate: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        status: 'archived'
      });
    }

    const assessmentHistory = Array.isArray(developmentPlanData?.assessmentHistory)
      ? developmentPlanData.assessmentHistory.slice()
      : [];
    assessmentHistory.push(newAssessment);

    const ok = await writeDevPlan({
      currentPlan: newPlan,
      assessment: newAssessment,
      previousPlans: prevPlans,
      assessmentHistory,
      latestScenario: null,
      cycle: newPlan.cycle,
      _updatedAt: date,
      _source: 'baseline_generator'
    }, { merge: true });

    if (ok) setView('tracker');
  };

  // PlanTracker → Quick edits come back here via onUpdatePlan
  const handleUpdatePlan = async (updatedPlan) => {
    const safePlan = {
      ...(developmentPlanData?.currentPlan || {}),
      ...(updatedPlan || {}),
      cycle: (developmentPlanData?.currentPlan?.cycle || updatedPlan?.cycle || 1),
      status: updatedPlan?.status || 'active',
      _updatedAt: new Date().toISOString(),
      _source: 'quick_edit'
    };
    const ok = await writeDevPlan({ currentPlan: safePlan }, { merge: true });
    if (ok) setView('tracker');
  };

  // PlanTracker → Start Progress Scan
  const handleStartProgressScan = () => setView('scan');

  // ProgressScan → Save scan (+ optional adjusted plan) then back to tracker
  const handleCompleteScan = async (newPlan, newAssessment) => {
    const date = new Date().toISOString();
    // Keep same cycle; scan adjusts weeks/phases, not cycle rollover
    const cycle = developmentPlanData?.currentPlan?.cycle || 1;
    const nextPlan = { ...newPlan, cycle, _updatedAt: date, _source: 'progress_scan' };

    const assessmentHistory = Array.isArray(developmentPlanData?.assessmentHistory)
      ? developmentPlanData.assessmentHistory.slice()
      : [];
    if (newAssessment) assessmentHistory.push({ ...newAssessment, date });

    const progressScans = Array.isArray(developmentPlanData?.progressScans)
      ? developmentPlanData.progressScans.slice()
      : [];
    progressScans.push({
      id: `ps_${Date.now()}`,
      cycle,
      at: date,
      notes: newAssessment?.notes || '',
    });

    const ok = await writeDevPlan({
      currentPlan: nextPlan,
      assessmentHistory,
      progressScans,
      _updatedAt: date
    }, { merge: true });

    if (ok) setView('tracker');
  };

  // Start Over → send to Baseline (generation will handle archive + cycle)
  const handleStartOver = () => setView('baseline');

  // View toggles
  const handleOpenDetail = () => setView('detail');
  const handleOpenTimeline = () => setView('timeline');
  const handleBackToTracker = () => setView('tracker');

  // Cross-app navigation for CTA
  const handleNavigateToDailyPractice = () => {
    if (typeof navigate === 'function') {
      navigate('daily-practice');
    }
  };

  // ===== RENDER =====
  if (!isAuthReady || isServicesLoading) {
    return <LoadingBlock />;
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card accent="RED">
          <h2 className="text-xl font-extrabold mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-3">{String(error?.message || error)}</p>
          <Button onClick={() => setError(null)}>Try Again</Button>
        </Card>
      </div>
    );
  }

  if (view === 'baseline') {
    return (
      <BaselineAssessment
        onComplete={handleCompleteBaseline}
      />
    );
  }

  if (view === 'scan') {
    return (
      <ProgressScan
        developmentPlanData={developmentPlanData}
        globalMetadata={globalMetadata}
        onCompleteScan={handleCompleteScan}
      />
    );
  }

  if (view === 'detail') {
    return (
      <DetailedPlanView
        developmentPlanData={developmentPlanData}
        globalMetadata={globalMetadata}
        onNavigateToTracker={handleBackToTracker}
        onStartProgressScan={handleStartProgressScan}
        onUpdatePlan={handleUpdatePlan}
      />
    );
  }

  if (view === 'timeline') {
    const plan = developmentPlanData?.currentPlan;
    if (!plan) {
      return (
        <EmptyState
          title="No Development Plan Yet"
          description="Start with the baseline assessment to create your 90‑day plan."
          action={<Button onClick={() => setView('baseline')}>Start Baseline</Button>}
        />
      );
    }
    return (
      <div className="max-w-5xl mx-auto p-6">
        <MilestoneTimeline plan={plan} />
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={handleBackToTracker}>Back to Tracker</Button>
        </div>
      </div>
    );
  }

  // Default: tracker
  return (
    <PlanTracker
      developmentPlanData={developmentPlanData}
      globalMetadata={globalMetadata}
      onStartProgressScan={handleStartProgressScan}
      onUpdatePlan={handleUpdatePlan}
      onNavigateToDailyPractice={handleNavigateToDailyPractice}
    />
  );
}
