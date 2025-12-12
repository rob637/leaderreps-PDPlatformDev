// src/routing/ScreenRouter.jsx

import React, { lazy, Suspense } from 'react';

const ScreenMap = {
  'roadmap-tracker': lazy(() =>
    import('../components/screens/RoadmapTracker.jsx')
  ),
  dashboard: lazy(() => import('../components/screens/Dashboard.jsx')),
  'development-plan': lazy(() =>
    import('../components/screens/DevelopmentPlan.jsx')
  ),
  'coaching-lab': lazy(() => import('../components/screens/CoachingHub.jsx')),
  'coaching-hub': lazy(() => import('../components/screens/CoachingHub.jsx')),
  'locker': lazy(() => import('../components/screens/Locker.jsx')),
  'labs': lazy(() => import('../components/screens/CoachingHub.jsx')), // Alias for backward compatibility
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
  'library': lazy(() =>
    import('../components/screens/Library.jsx')
  ),
  'programs-index': lazy(() =>
    import('../components/screens/library/ProgramsIndex.jsx')
  ),
  'program-detail': lazy(() =>
    import('../components/screens/library/ProgramDetail.jsx')
  ),
  'workouts-index': lazy(() =>
    import('../components/screens/library/WorkoutsIndex.jsx')
  ),
  'workout-detail': lazy(() =>
    import('../components/screens/library/WorkoutDetail.jsx')
  ),
  'skills-index': lazy(() =>
    import('../components/screens/library/SkillsIndex.jsx')
  ),
  'skill-detail': lazy(() =>
    import('../components/screens/library/SkillDetail.jsx')
  ),
  'tools-index': lazy(() =>
    import('../components/screens/library/ToolsIndex.jsx')
  ),
  'tool-detail': lazy(() =>
    import('../components/screens/library/ToolDetail.jsx')
  ),
  'read-reps-index': lazy(() =>
    import('../components/screens/library/ReadRepsIndex.jsx')
  ),
  'read-rep-detail': lazy(() =>
    import('../components/screens/library/ReadRepDetail.jsx')
  ),
  'admin-content-home': lazy(() =>
    import('../components/admin/ContentAdminHome.jsx')
  ),
  'admin-content-manager': lazy(() =>
    import('../components/admin/ContentManager.jsx')
  ),
  'admin-wrapper-document': lazy(() =>
    import('../components/admin/wrappers/DocumentWrapper.jsx')
  ),
  'admin-wrapper-video': lazy(() =>
    import('../components/admin/wrappers/VideoWrapper.jsx')
  ),
  'admin-wrapper-course': lazy(() =>
    import('../components/admin/wrappers/CourseWrapper.jsx')
  ),
  'admin-wrapper-readrep': lazy(() =>
    import('../components/admin/wrappers/ReadRepWrapper.jsx')
  ),
  'admin-wrapper-book': lazy(() =>
    import('../components/admin/wrappers/BookWrapper.jsx')
  ),
  'admin-portal': lazy(() =>
    import('../components/admin/AdminPortal.jsx')
  ),
  
  // Feature Lab Screens
  'reading-hub': lazy(() => import('../components/screens/features/ReadingHub.jsx')),
  'course-library': lazy(() => import('../components/screens/features/CourseLibrary.jsx')),
  'strat-templates': lazy(() => import('../components/screens/features/StrategicTemplates.jsx')),
  'mastermind': lazy(() => import('../components/screens/features/MastermindGroups.jsx')),
  'mentor-match': lazy(() => import('../components/screens/features/MentorMatch.jsx')),
  'live-events': lazy(() => import('../components/screens/features/LiveEvents.jsx')),
  'ai-roleplay': lazy(() => import('../components/screens/features/AIRoleplay.jsx')),
  '360-feedback': lazy(() => import('../components/screens/features/Feedback360.jsx')),
  'roi-report': lazy(() => import('../components/screens/features/ROIReport.jsx')),
  'admin-community-manager': lazy(() =>
    import('../components/admin/CommunityManager.jsx')
  ),
  'admin-coaching-manager': lazy(() =>
    import('../components/admin/CoachingManager.jsx')
  ),
  'admin-lov-manager': lazy(() =>
    import('../components/admin/LOVManager.jsx')
  ),
  'features-lab': lazy(() =>
    import('../components/screens/FeaturesLab.jsx')
  ),
};

const NotFoundScreen = () => (
  <div className="p-8 text-center">
    <h1 className="text-2xl font-bold text-red-600">Screen Not Found</h1>
    <p className="text-gray-700 mt-2">The requested screen does not exist.</p>
  </div>
);

const ScreenRouter = ({ currentScreen, navParams, navigate, isDeveloperMode }) => {
  console.log('🗺️ [ScreenRouter] Routing to screen:', { 
    currentScreen, 
    isDeveloperMode,
    hasComponent: !!ScreenMap[currentScreen]
  });
  
  const Component = ScreenMap[currentScreen] || NotFoundScreen;

  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <Component 
        key={currentScreen} 
        {...(navParams && typeof navParams === 'object' ? navParams : null)} 
        setCurrentScreen={navigate}
        isDeveloperMode={isDeveloperMode}
      />
    </Suspense>
  );
};


export default ScreenRouter;
