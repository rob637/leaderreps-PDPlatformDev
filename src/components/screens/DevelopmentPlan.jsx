// src/components/screens/DevelopmentPlan.jsx
// Parent container for the Development Plan flow (no-regression, single-CTA per screen)
// Wires: BaselineAssessment → PlanTracker → ProgressScan (+ optional Detail/Timeline/Quick Edit inside children)
// FIXED: Added adapter layer to transform Firebase focusAreas ↔ component coreReps
// FIXED (10/30/25): Removed manual setView('tracker') to fix race condition (Req #16)
// FINAL FIX (10/30/25): Added robust logic to auto-set first target rep on new plan creation (Issue 4).
// SENTINEL FIX (10/30/25): Sentinels are stripped in useAppServices.jsx listeners, NOT in write operations
// 🛑 CRITICAL FIX (10/30/25): Refactored writeDevPlan to only adapt the currentPlan sub-object.

import React, { useMemo, useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices.jsx';
import BaselineAssessment from './developmentplan/BaselineAssessment';
import PlanTracker from './developmentplan/PlanTracker';
import ProgressScan from './developmentplan/ProgressScan';
import DetailedPlanView from './developmentplan/DetailedPlanView';
import MilestoneTimeline from './developmentplan/MilestoneTimeline';
import { Button, Card, EmptyState } from './developmentplan/DevPlanComponents';
import { generatePlanFromAssessment, normalizeSkillCatalog } from './developmentplan/devPlanUtils';

// FIXED: Import adapter utilities
import { 
  adaptDevelopmentPlanData,
  adaptComponentPlanToFirebase,
  buildVirtualSkillCatalog
} from '../../utils/devPlanAdapter';
import { doc, getDoc } from 'firebase/firestore';

// Simple guard wrapper
const LoadingBlock = ({ title = 'Loading…', description = 'Preparing your development plan...' }) => (
  <div className="max-w-3xl mx-auto p-6">
    <Card accent="TEAL">
      <h2 className="text-xl font-extrabold mb-2"> {title} </h2>
      <p className="text-gray-600">{description}</p>
    </Card>
  </div>
);

// --- NEW HELPER (10/30/25) ---
// Finds the first rep matching the plan's first focus area and saves it
const findAndSetTargetRep = async (newPlan, metadata, writer) => {
  if (!newPlan || !newPlan.focusAreas || newPlan.focusAreas.length === 0) {
    console.log('[DevPlan] No focus areas in new plan, cannot set target rep.');
    return;
  }
  // Use REP_LIBRARY (from image_b9f3bd.png)
  if (!metadata || !metadata.REP_LIBRARY || !metadata.REP_LIBRARY.items) {
    console.warn('[DevPlan] REP_LIBRARY not found in metadata, cannot set target rep.');
    return;
  }
  if (typeof writer !== 'function') {
    console.warn('[DevPlan] Daily practice writer function not available.');
    return;
  }

  try {
    // 1. Get the category from the first focus area
    // NOTE: This assumes the focusAreas array contains objects with a 'category' key.
    // The simplified format from generatePlanFromAssessment returns an array of strings (e.g., ['People Development'])
    const firstFocusAreaCategory = newPlan.focusAreas[0];
    
    // DEBUG LOGGING ADDED FOR ISSUE 4
    console.log(`[DevPlan Target Rep] Searching for category: ${firstFocusAreaCategory}`);
    console.log(`[DevPlan Target Rep] REP_LIBRARY size: ${metadata.REP_LIBRARY.items.length}`);
    
    if (!firstFocusAreaCategory) {
      console.warn('[DevPlan] First focus area has no category. Cannot find rep. Check skill_catalog data.');
      return;
    }

    // 2. Find a rep in the library that matches that category
    const repLibrary = metadata.REP_LIBRARY.items;
    const matchingRep = repLibrary.find(rep => rep.category === firstFocusAreaCategory);

    // 3. Save that rep's ID to dailyPracticeData
    if (matchingRep) {
      const newRepId = matchingRep.id || matchingRep.repId; // 'id' is seen in image_b9f3bd.png
      if (newRepId) {
        console.log(`[DevPlan] Setting new dailyTargetRepId: ${newRepId}`);
        // Reset status to pending when a new rep is assigned
        await writer({ 
          dailyTargetRepId: newRepId,
          dailyTargetRepStatus: 'Pending',
          dailyTargetRepDate: null,
        });
        console.log('[DevPlan] Target rep set successfully.');
      } else {
        console.warn('[DevPlan] Matching rep found but has no ID.');
      }
    } else {
      console.warn(`[DevPlan] No rep found in REP_LIBRARY with category: ${firstFocusAreaCategory}`);
    }
  } catch (e) {
    console.error('[DevPlan] Error setting target rep:', e);
  }
};


export default function DevelopmentPlan() {
  const services = useAppServices();
  const {
    db, userId, isAuthReady, isLoading: isServicesLoading,
    developmentPlanData, updateDevelopmentPlanData, 
    // FIXED: Add writer for dailyPracticeData
    updateDailyPracticeData: updateDailyPracticeWriter,
    metadata: globalMetadata
  } = services || {};

  // Helpers
  const skillCatalog = useMemo(() => normalizeSkillCatalog(globalMetadata), [globalMetadata]);

  // FIXED: Adapt Firebase data to component format
  const adaptedDevelopmentPlanData = useMemo(() => {
    if (!developmentPlanData) return null;
    
    console.log('[DevelopmentPlan] Adapting Firebase data:', {
      hasCurrentPlan: !!developmentPlanData.currentPlan,
      hasFocusAreas: !!developmentPlanData.currentPlan?.focusAreas,
      assessmentCount: developmentPlanData.assessmentHistory?.length || 0
    });
    
    const adapted = adaptDevelopmentPlanData(developmentPlanData);
    
    console.log('[DevelopmentPlan] Adapted data:', {
      hasCurrentPlan: !!adapted?.currentPlan,
      hasCoreReps: !!adapted?.currentPlan?.coreReps,
      coreRepsCount: adapted?.currentPlan?.coreReps?.length || 0
    });
    
    return adapted;
  }, [developmentPlanData]);

  // Build virtual skill catalog from current plan
  const virtualSkillCatalog = useMemo(() => {
    if (!adaptedDevelopmentPlanData?.currentPlan) return [];
    const focusAreas = adaptedDevelopmentPlanData.currentPlan._originalFocusAreas 
      || adaptedDevelopmentPlanData.currentPlan.focusAreas;
    return focusAreas ? buildVirtualSkillCatalog({ focusAreas }) : [];
  }, [adaptedDevelopmentPlanData?.currentPlan]);

  // Combine actual and virtual skill catalogs
  const combinedSkillCatalog = useMemo(() => {
    if (skillCatalog.length > 0 && virtualSkillCatalog.length > 0) {
      console.log('[DevelopmentPlan] Merging skill catalogs:', {
        actual: skillCatalog.length,
        virtual: virtualSkillCatalog.length
      });
      // Prefer virtual (from plan) since it's current
      return virtualSkillCatalog;
    }
    return virtualSkillCatalog.length > 0 ? virtualSkillCatalog : skillCatalog;
  }, [skillCatalog, virtualSkillCatalog]);

  // Local view-state (router-in-component)
  // tracker | baseline | scan | detail | timeline
  const hasCurrentPlan = !!(adaptedDevelopmentPlanData && adaptedDevelopmentPlanData.currentPlan);
  const [view, setView] = useState(hasCurrentPlan ? 'tracker' : 'baseline');
  const [isSaving, setIsSaving] = useState(false); // Used to detect in-progress save
  const [error, setError] = useState(null);

  // Sync view with live snapshots as they arrive
  useEffect(() => {
    // This effect now correctly handles the navigation *after* data is received
    if (adaptedDevelopmentPlanData?.currentPlan && view === 'baseline') {
      console.log('[DevelopmentPlan] Data updated, switching view to tracker.');
      setView('tracker');
      return;
    }
    
    // FIX: Add !isSaving condition to prevent race condition reversion.
    if (!adaptedDevelopmentPlanData?.currentPlan && view === 'tracker' && !isSaving) {
      console.log('[DevelopmentPlan] No current plan, switching view to baseline.');
      setView('baseline');
    }
  }, [adaptedDevelopmentPlanData?.currentPlan, view, isSaving]); // ADDED 'isSaving' to dependencies

  const writeDevPlan = async (payload, { merge = true } = {}) => {
    setIsSaving(true);
    setError(null);
    try {
      // 🛑 CRITICAL FIX: Ensure only the currentPlan sub-object is adapted if needed.
      // We start with the payload and modify currentPlan if it is an existing/edited plan.
      let firebasePayload = { ...payload }; 
      
      if (firebasePayload.currentPlan) {
        if (firebasePayload.currentPlan._source === 'generation') {
          // New plan: It's already in the Firebase focusAreas format. We use it as-is.
          console.log('[DevelopmentPlan] Skipping adapter for new plan, using direct format.');
          // We must remove the temporary flag before saving.
          delete firebasePayload.currentPlan._source;
        } else if (firebasePayload.currentPlan.coreReps) {
          // Edited plan: It's in component (coreReps) format and needs conversion back.
          console.log('[DevelopmentPlan] Converting existing plan (coreReps) to Firebase format.');
          // The adapter is now correctly applied to the sub-object only.
          firebasePayload.currentPlan = adaptComponentPlanToFirebase(firebasePayload.currentPlan);
        }
      }
      
      // NOTE: Do NOT strip sentinels here! Firebase needs them to process server-side operations.
      // Sentinels are stripped in the listeners (useAppServices.jsx) when data comes back.
      
      if (typeof updateDevelopmentPlanData === 'function') {
        // Now updateDevelopmentPlanData receives the correctly structured top-level object
        const ok = await updateDevelopmentPlanData(firebasePayload, { merge });
        if (ok === false) {
          console.warn('[DevelopmentPlan] updateDevelopmentPlanData returned false; continuing as best-effort.');
        }
      } else {
        console.error('[DevelopmentPlan] updateDevelopmentPlanData is not available.');
        setError(new Error('Writer unavailable.'));
        setIsSaving(false);
        return false;
      }
    } catch (e) {
      console.error('[DevelopmentPlan] Write failed:', e);
      setError(e);
      setIsSaving(false);
      return false;
    }
    // IMPORTANT: Set isSaving to false AFTER the write is complete (success or fail)
    // This allows the useEffect to run and re-check the data.
    setIsSaving(false); 
    return true;
  };


// Read-after-write confirmation: check Firestore a few times for 'currentPlan'
async function confirmPlanPersisted(db, userId, retries = 4, delayMs = 250) {
  try {
    if (!db || !userId) return false;
    // NOTE: This uses the direct path to the document
    const ref = doc(db, `modules/${userId}/development_plan/current`); 
    for (let i = 0; i < retries; i++) {
      const snap = await getDoc(ref);
      // Check for document existence AND the currentPlan field inside it
      if (snap.exists() && !!snap.data()?.currentPlan) return true; 
      await new Promise(r => setTimeout(r, delayMs));
    }
  } catch (e) {
    console.warn('[DevelopmentPlan] confirmPlanPersisted error:', e);
  }
  return false;
}

  // ===== FLOW ACTIONS =====

  // Baseline → Generate new plan then route to tracker
  const handleCompleteBaseline = async (assessment) => {
    const date = new Date().toISOString();
    const newAssessment = { ...assessment, date };
    
    // Assumes generatePlanFromAssessment uses the *corrected* skill catalog
    const newPlanRaw = generatePlanFromAssessment(newAssessment, combinedSkillCatalog);

    // If an existing plan exists, bump cycle for the new plan & archive the old
    const prevPlan = adaptedDevelopmentPlanData?.currentPlan;
    const prevCycle = prevPlan?.cycle || adaptedDevelopmentPlanData?.cycle || 0;
    
    // 🛑 FIX: Flag the new plan so we can bypass the faulty adapter during save.
    const newPlan = { 
        ...newPlanRaw, 
        cycle: (prevCycle || 0) + 1,
        _source: 'generation' // <-- CRITICAL FLAG
    };

    // Build history arrays
    const prevPlans = Array.isArray(adaptedDevelopmentPlanData?.previousPlans) ? adaptedDevelopmentPlanData.previousPlans.slice() : [];
    if (prevPlan) {
      prevPlans.push({
        ...prevPlan,
        endDate: new Date().toISOString(),
        archivedAt: new Date().toISOString(),
        status: 'archived'
      });
    }

    const assessmentHistory = Array.isArray(adaptedDevelopmentPlanData?.assessmentHistory)
      ? adaptedDevelopmentPlanData.assessmentHistory.slice()
      : [];
    assessmentHistory.push(newAssessment);

    const payload = {
      currentPlan: newPlan,
      cycle: newPlan.cycle,
      previousPlans: prevPlans,
      assessmentHistory,
      updatedAt: date
    };

    // The writeDevPlan sets isSaving=true, then to false after Firestore ACK.
    const ok = await writeDevPlan(payload, { merge: true });
    
    if (ok) {
      // FINAL FIX (Issue 4): Set the target rep
      console.log('[DevelopmentPlan] Baseline saved. Setting target rep...');
      await findAndSetTargetRep(newPlan, globalMetadata, updateDailyPracticeWriter);
      
      // REQ #16: FIX - Do not manually set view. Let the useEffect handle it.
      setIsSaving(true);
      const okPersisted = await confirmPlanPersisted(db, userId);
      if (okPersisted) {
        console.log('[DevelopmentPlan] Confirmed currentPlan via read-after-write. Switching to tracker.');
        setView('tracker');
      } else {
        // NOTE: This optimistic switch is dangerous but necessary if the listener is slow.
        console.warn('[DevelopmentPlan] Listener/read didn’t show currentPlan in time; switching to tracker optimistically.');
        setView('tracker');
      }
      setIsSaving(false);
    }
  };

  // ProgressScan → same pattern as baseline, but we show comparisons
  const handleCompleteScan = async (newPlan, newAssessment) => {
    const date = new Date().toISOString();
    const withDate = { ...newAssessment, date };

    const prevPlan = adaptedDevelopmentPlanData?.currentPlan;
    const prevCycle = prevPlan?.cycle || adaptedDevelopmentPlanData?.cycle || 0;
    
    // 🛑 FLAG the new plan here as well
    const withCycle = { 
        ...newPlan, 
        cycle: prevCycle + 1, 
        _source: 'generation' // <-- CRITICAL FLAG
    }; // This is the new plan

    const prevPlans = Array.isArray(adaptedDevelopmentPlanData?.previousPlans) ? adaptedDevelopmentPlanData.previousPlans.slice() : [];
    if (prevPlan) {
      prevPlans.push({
        ...prevPlan,
        endDate: date,
        archivedAt: date,
        status: 'archived'
      });
    }

    const assessmentHistory = Array.isArray(adaptedDevelopmentPlanData?.assessmentHistory) ? adaptedDevelopmentPlanData.assessmentHistory.slice() : [];
    assessmentHistory.push(withDate);

    const payload = {
      currentPlan: withCycle,
      cycle: withCycle.cycle,
      previousPlans: prevPlans,
      assessmentHistory,
      updatedAt: date
    };

    const ok = await writeDevPlan(payload, { merge: true });
    
    if (ok) {
      // FINAL FIX (Issue 4): Set the target rep
      console.log('[DevelopmentPlan] Scan saved. Setting target rep...');
      await findAndSetTargetRep(withCycle, globalMetadata, updateDailyPracticeWriter);
      
      // REQ #16: FIX - Do not manually set view. Let the useEffect handle it.
      console.log('[DevelopmentPlan] Waiting for data listener to switch view.');
    }
  };

  const handleEditPlan = async (updatedPlan) => {
    // NOTE: This plan is assumed to be in the component's 'coreReps' format,
    // so it will hit the 'else if (coreReps)' conversion logic in writeDevPlan.
    const payload = { currentPlan: updatedPlan, updatedAt: new Date().toISOString() };
    const ok = await writeDevPlan(payload, { merge: true });
    return ok;
  };

  // ===== GUARDS =====
  if (!isAuthReady) return <LoadingBlock title="Authenticating…" description="Connecting securely..." />;
  if (isServicesLoading) return <LoadingBlock title="Loading..." />;
  if (!services || !userId) return <LoadingBlock title="Services unavailable" description="Please refresh or contact support." />;

  // ===== RENDER =====
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #F9FAFB 0%, #EEF2F6 100%)' }}>
      {error && (
        <div className="max-w-3xl mx-auto p-4 pt-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-800 shadow-lg">
            <strong className="font-bold">Error:</strong> {error.message || String(error)}
          </div>
        </div>
      )}

      {view === 'baseline' && (
        <BaselineAssessment
          onComplete={handleCompleteBaseline}
          isLoading={isSaving}
        />
      )}

      {view === 'scan' && (
        <ProgressScan
          developmentPlanData={adaptedDevelopmentPlanData}
          globalMetadata={globalMetadata}
          skillCatalog={combinedSkillCatalog}
          onCompleteScan={handleCompleteScan}
          onBack={() => setView('tracker')}
          isLoading={isSaving}
        />
      )}

      {/* REQ #4 (BUG FIX): Updated props passed to DetailedPlanView */}
      {view === 'detail' && (
        <DetailedPlanView
          developmentPlanData={adaptedDevelopmentPlanData}
          globalMetadata={globalMetadata}
          onUpdatePlan={handleEditPlan}
          onNavigateToTracker={() => setView('tracker')}
          onStartProgressScan={() => setView('scan')}
        />
      )}

      {view === 'timeline' && (
        <MilestoneTimeline
          plan={adaptedDevelopmentPlanData?.currentPlan}
          globalMetadata={globalMetadata}
          onBack={() => setView('tracker')}
        />
      )}

      {view === 'tracker' && (
        <PlanTracker
          plan={adaptedDevelopmentPlanData?.currentPlan}
          cycle={adaptedDevelopmentPlanData?.cycle || 1}
          globalMetadata={globalMetadata}
          skillCatalog={combinedSkillCatalog}
          onEditPlan={handleEditPlan}
          onScan={() => setView('scan')}
          onDetail={() => setView('detail')}
          onTimeline={() => setView('timeline')}
        />
      )}
    </div>
  );
}