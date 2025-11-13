// src/routing/ScreenRouter.jsx

import React, { lazy } from 'react';
import { MembershipGate } from '../components/ui/MembershipGate.jsx';

const ScreenMap = {
  dashboard: lazy(() => import('../components/screens/Dashboard.jsx')),
  'development-plan': lazy(() =>
    import('../components/screens/DevelopmentPlan.jsx')
  ),
  'coaching-lab': lazy(() => import('../components/screens/Labs.jsx')),
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

const ScreenRouter = ({ currentScreen, navParams, navigate }) => {
  const Component = ScreenMap[currentScreen] || ScreenMap.dashboard;
  console.log(`[ScreenRouter] Rendering screen: ${currentScreen}`);

  const screenTierRequirements = {
    'development-plan': 'basic',
    'business-readings': 'professional',
    'applied-leadership': 'professional',
  };

  const requiredTier = screenTierRequirements[currentScreen];
  const componentElement = (
    <Component key={currentScreen} {...(navParams || {})} navigate={navigate} />
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
