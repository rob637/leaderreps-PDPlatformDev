import React, { Suspense, lazy } from 'react';
import { useFeatures } from '../../providers/FeatureProvider';
import { WIDGET_TEMPLATES } from '../../config/widgetTemplates';
import WinTheDayWidget from '../widgets/WinTheDayWidget';
import PMReflectionWidget from '../widgets/PMReflectionWidget';
import DevelopmentPlanWidget from '../widgets/DevelopmentPlanWidget';
import ThisWeeksActionsWidget from '../widgets/ThisWeeksActionsWidget';
import MyActionsWidget from '../widgets/MyActionsWidget';
import CoachingUpcomingSessionsWidget from '../widgets/CoachingUpcomingSessionsWidget';
import CoachingOnDemandWidget from '../widgets/CoachingOnDemandWidget';
import CoachingMySessionsWidget from '../widgets/CoachingMySessionsWidget';
import CommunityUpcomingSessionsWidget from '../widgets/CommunityUpcomingSessionsWidget';
import CommunityMyRegistrationsWidget from '../widgets/CommunityMyRegistrationsWidget';
import PrepWelcomeBanner from '../widgets/PrepWelcomeBanner';
import DailyPlanWidget from '../widgets/DailyPlanWidget';

// Heavy admin-only dependencies — lazy-loaded so they aren't bundled into
// the dashboard's eager critical path. DynamicWidgetRenderer pulls in
// react-live (Babel parser) and AdminAccessViewer is admin-only.
const DynamicWidgetRenderer = lazy(() => import('../admin/DynamicWidgetRenderer'));
const AdminAccessViewer = lazy(() => import('../admin/AdminAccessViewer'));

/**
 * WidgetRenderer - Renders widgets from templates defined in widgetTemplates.js
 * 
 * Priority:
 * 1. Hardcoded React components (for complex widgets with inputs)
 * 2. Template code from widgetTemplates.js
 * 3. Children fallback
 * 
 * All widget customization is done in code (widgetTemplates.js), not via DB.
 */
const WidgetRenderer = ({ widgetId, children, scope = {} }) => {
  const { features, getWidgetHelpText } = useFeatures();
  
  const feature = features[widgetId];
  
  // Get help text for this widget (if admin has configured it)
  const helpText = getWidgetHelpText(widgetId);
  
  // Check if feature is explicitly disabled
  if (feature && (feature.enabled === false || feature.enabled === 'false')) {
    return null;
  }

  // Enhanced scope with helpText
  const enhancedScope = { ...scope, widgetHelpText: helpText };

  // Hardcoded React components for complex widgets that need proper React state/inputs
  if (widgetId === 'win-the-day') {
    return <WinTheDayWidget scope={enhancedScope} helpText={helpText} />;
  }

  if (widgetId === 'development-plan') {
    return <DevelopmentPlanWidget scope={enhancedScope} helpText={helpText} />;
  }

  if (widgetId === 'this-weeks-actions') {
    return <ThisWeeksActionsWidget scope={enhancedScope} helpText={helpText} />;
  }

  if (widgetId === 'my-actions') {
    return <MyActionsWidget scope={enhancedScope} helpText={helpText} />;
  }

  if (widgetId === 'prep-welcome-banner') {
    return <PrepWelcomeBanner helpText={helpText} />;
  }

  if (widgetId === 'daily-plan') {
    return <DailyPlanWidget scope={enhancedScope} helpText={helpText} />;
  }

  if (widgetId === 'admin-access-viewer') {
    return (
      <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading admin viewer…</div>}>
        <AdminAccessViewer />
      </Suspense>
    );
  }

  // Coaching widgets
  if (widgetId === 'coaching-upcoming-sessions') {
    return <CoachingUpcomingSessionsWidget scope={enhancedScope} helpText={helpText} />;
  }

  if (widgetId === 'coaching-on-demand') {
    return <CoachingOnDemandWidget scope={enhancedScope} helpText={helpText} />;
  }

  if (widgetId === 'coaching-my-sessions') {
    return <CoachingMySessionsWidget scope={enhancedScope} helpText={helpText} />;
  }

  // Community widgets
  if (widgetId === 'community-upcoming-sessions') {
    return <CommunityUpcomingSessionsWidget scope={enhancedScope} helpText={helpText} />;
  }

  if (widgetId === 'community-my-registrations') {
    return <CommunityMyRegistrationsWidget scope={enhancedScope} helpText={helpText} />;
  }

  if (widgetId === 'pm-bookend') {
    return (
      <PMReflectionWidget 
        reflectionGood={scope.reflectionGood}
        setReflectionGood={scope.setReflectionGood}
        reflectionBetter={scope.reflectionBetter}
        setReflectionBetter={scope.setReflectionBetter}
        reflectionBest={scope.reflectionBest}
        setReflectionBest={scope.setReflectionBest}
        handleSaveEveningBookend={scope.handleSaveEveningBookend}
        isSavingBookend={scope.isSavingBookend}
        dailyPracticeData={scope.dailyPracticeData}
        helpText={helpText}
      />
    );
  }

  // Use template code from widgetTemplates.js
  const templateCode = WIDGET_TEMPLATES[widgetId];
  
  if (templateCode && templateCode.trim().length > 0) {
    return (
      <div id={`widget-${widgetId}`}>
        <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading widget…</div>}>
          <DynamicWidgetRenderer code={templateCode} scope={enhancedScope} />
        </Suspense>
      </div>
    );
  }

  // Fallback to children if no template exists
  if (children) {
    return <div id={`widget-${widgetId}`}>{children}</div>;
  }

  // No content available
  return null;
};

export default WidgetRenderer;
