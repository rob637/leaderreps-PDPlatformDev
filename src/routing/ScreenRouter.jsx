// src/routing/ScreenRouter.jsx

import React, { lazy } from 'react';
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
};

const NotFoundScreen = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-red-600">Screen Not Found</h1>
    <p className="text-gray-700 mt-2">The requested screen does not exist.</p>
  </div>
);

const ScreenRouter = ({ currentScreen, navParams }) => {
  const Component = ScreenMap[currentScreen] || NotFoundScreen;
  
  // --- DEBUGGING ---
  console.log(`[ScreenRouter] Rendering screen: '${currentScreen}'`);
  if (Component) {
    console.log(`[ScreenRouter]   -> Component found:`, Component);
    if (typeof Component === 'undefined') {
      console.error(`❌ [ScreenRouter] CRITICAL: Component for '${currentScreen}' is UNDEFINED.`);
    }
  } else {
    console.warn(`[ScreenRouter]   -> No component found for '${currentScreen}'. Rendering NotFoundScreen.`);
  }
  // --- END DEBUGGING ---

  const screenTierRequirements = {
    'development-plan': 'basic',
    'business-readings': 'professional',
    'applied-leadership': 'professional',
  };

  const requiredTier = screenTierRequirements[currentScreen];
  const componentElement = (
    <Component key={currentScreen} {...(navParams || {})} />
  );

  if (requiredTier) {
    return (
      <MembershipGate requiredTier={requiredTier} featureName={currentScreen}>
        {componentElement}
      </MembershipGate>
    );
  }

  return componentElement;
};

export default ScreenRouter;
