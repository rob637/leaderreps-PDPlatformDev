// src/routing/ScreenRouter.jsx

import React, { lazy, Suspense } from 'react';
import { MembershipGate } from '../components/ui/MembershipGate.jsx';

const ScreenMap = {
  'roadmap-tracker': lazy(() =>
    import('../components/screens/RoadmapTracker.jsx')
  ),
  dashboard: lazy(() => import('../components/screens/Dashboard.jsx')),
  'development-plan': lazy(() =>
    import('../components/screens/DevelopmentPlan.jsx')
  ),
  'coaching-lab': lazy(() => import('../components/screens/CoachingLabScreen.jsx')),
  'daily-practice': lazy(() =>
    import('../components/screens/DailyPractice.jsx')
  ),
  'planning-hub': lazy(() => import('../components/screens/PlanningHub.jsx')),
  'business-readings': lazy(() =>
    import('../components/screens/BusinessReadings.jsx')
  ),
  'quick-start-accelerator': lazy(() =>
    import('../components/screens/QuickStartAccelerator.jsx')
  ),
  'executive-reflection': lazy(() =>
    import('../components/screens/ExecutiveReflection.jsx')
  ),
  community: lazy(() => import('../components/screens/CommunityScreen.jsx')),
  'applied-leadership': lazy(() =>
    import('../components/screens/AppliedLeadership.jsx')
  ),
  'leadership-videos': lazy(() =>
    import('../components/screens/LeadershipVideos.jsx')
  ),
  'app-settings': lazy(() => import('../components/screens/AppSettings.jsx')),
  'membership-upgrade': lazy(() =>
    import('../components/screens/MembershipUpgrade.jsx')
  ),
  'admin-functions': lazy(() =>
    import('../components/screens/AdminFunctions.jsx')
  ),
  'data-maintenance': lazy(() =>
    import('../components/screens/AdminDataMaintenance.jsx')
  ),
  'debug-data': lazy(() => import('../components/screens/DebugDataViewer.jsx')),
  'membership-module': lazy(() =>
    import('../components/screens/MembershipModule.jsx')
  ),
  'library': lazy(() =>
    import('../components/screens/Library.jsx')
  ),
};

const NotFoundScreen = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-red-600">Screen Not Found</h1>
    <p className="text-gray-700 mt-2">The requested screen does not exist.</p>
  </div>
);

const ScreenRouter = ({ currentScreen, navParams, navigate, isDeveloperMode, simulatedTier }) => {
  const Component = ScreenMap[currentScreen] || NotFoundScreen;
  
  // --- MORE DEBUGGING ---
  console.log(`[ScreenRouter] Rendering screen: '${currentScreen}'`);
  
  // 🔍 Let's inspect the lazy component itself before rendering
  if (ScreenMap[currentScreen]) {
    console.log(`[ScreenRouter]   -> Found lazy component in ScreenMap for '${currentScreen}'.`);
    console.log(`[ScreenRouter]   -> Component object:`, ScreenMap[currentScreen]);

    // This is a bit of a hack to inspect the inner promise of a lazy component
    // It might reveal if the import is failing.
    try {
      ScreenMap[currentScreen]._payload._result.then(module => {
        console.log(`[ScreenRouter] SUCCESS: Lazy import for '${currentScreen}' resolved to:`, module);
        if (!module.default) {
          console.error(`❌ [ScreenRouter] CRITICAL FAILURE: Module for '${currentScreen}' loaded but has NO DEFAULT EXPORT!`);
        }
      }).catch(err => {
        console.error(`❌ [ScreenRouter] CRITICAL FAILURE: Lazy import promise for '${currentScreen}' REJECTED with error:`, err);
      });
    } catch (e) {
      console.warn(`[ScreenRouter] Could not inspect lazy promise for '${currentScreen}'. This is not necessarily an error.`, e);
    }

  } else {
    console.warn(`[ScreenRouter]   -> No component found for '${currentScreen}'. Rendering NotFoundScreen.`);
  }
  // --- END MORE DEBUGGING ---

  const screenTierRequirements = {
    'business-readings': 'professional',
    'applied-leadership': 'professional',
    'coaching-lab': 'professional',
    'community': 'professional',
    'library': 'professional',
  };

  const requiredTier = screenTierRequirements[currentScreen];
  
  const componentElement = (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <Component 
        key={currentScreen} 
        {...(navParams || {})} 
        setCurrentScreen={navigate}
        isDeveloperMode={isDeveloperMode}
        simulatedTier={simulatedTier}
      />
    </Suspense>
  );

  if (requiredTier) {
    return (
      <MembershipGate 
        requiredTier={requiredTier} 
        featureName={currentScreen}
        simulatedTier={simulatedTier}
      >
        {componentElement}
      </MembershipGate>
    );
  }

  return componentElement;
};


export default ScreenRouter;
