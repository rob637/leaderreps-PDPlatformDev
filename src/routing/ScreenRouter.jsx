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
  'labs': lazy(() => import('../components/screens/CoachingLabScreen.jsx')), // Alias for backward compatibility
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
  'membership-module': lazy(() =>
    import('../components/screens/MembershipUpgrade.jsx')
  ), // Alias for backward compatibility
  'admin-functions': lazy(() =>
    import('../components/screens/AdminFunctions.jsx')
  ),
  'data-maintenance': lazy(() =>
    import('../components/screens/AdminDataMaintenance.jsx')
  ),
  'debug-data': lazy(() => import('../components/screens/DebugDataViewer.jsx')),
  // 'membership-module': lazy(() =>
  //   import('../components/screens/MembershipModule.jsx')
  // ),
  'library': lazy(() =>
    import('../components/screens/Library.jsx')
  ),
  'admin-content-home': lazy(() =>
    import('../components/admin/ContentAdminHome.jsx')
  ),
  'admin-content-manager': lazy(() =>
    import('../components/admin/ContentManager.jsx')
  ),
};

const NotFoundScreen = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-red-600">Screen Not Found</h1>
    <p className="text-gray-700 mt-2">The requested screen does not exist.</p>
  </div>
);

const ScreenRouter = ({ currentScreen, navParams, navigate, isDeveloperMode, simulatedTier }) => {
  console.log('🗺️ [ScreenRouter] Routing to screen:', { 
    currentScreen, 
    simulatedTier, 
    isDeveloperMode,
    hasComponent: !!ScreenMap[currentScreen]
  });
  
  const Component = ScreenMap[currentScreen] || NotFoundScreen;

  const screenTierRequirements = {
    'business-readings': 'premium',
    'applied-leadership': 'premium',
    'coaching-lab': 'premium',
    'community': 'premium',
    'library': 'premium',
  };

  const requiredTier = screenTierRequirements[currentScreen];
  
  const componentElement = (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <Component 
        key={currentScreen} 
        {...(navParams && typeof navParams === 'object' ? navParams : null)} 
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
