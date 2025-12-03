import React from 'react';
import { useFeatures } from '../../providers/FeatureProvider';
import { useWidgetEditor } from '../../providers/WidgetEditorProvider';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';
import { Edit3 } from 'lucide-react';
import { WIDGET_TEMPLATES } from '../../config/widgetTemplates';
import WinTheDayWidget from '../widgets/WinTheDayWidget';
import PMReflectionWidget from '../widgets/PMReflectionWidget';
import DevelopmentPlanWidget from '../widgets/DevelopmentPlanWidget';
import GroundingRepWidget from '../widgets/GroundingRepWidget';
import AdminAccessViewer from './AdminAccessViewer';

const WidgetRenderer = ({ widgetId, children, scope = {} }) => {
  const { features, isFeatureEnabled } = useFeatures();
  const { isEditMode, openEditor } = useWidgetEditor();
  
  const feature = features[widgetId];
  
  // Robust check for explicitly disabled state (handles boolean or string)
  if (feature && (feature.enabled === false || feature.enabled === 'false')) {
    return null;
  }

  // [NUCLEAR FIX] Bypass Dynamic Renderer for complex input widgets to prevent focus loss
  if (widgetId === 'win-the-day') {
    return <WinTheDayWidget scope={scope} />;
  }

  if (widgetId === 'development-plan') {
    return <DevelopmentPlanWidget scope={scope} />;
  }

  if (widgetId === 'admin-access-viewer') {
    return <AdminAccessViewer />;
  }

  // NOTE: grounding-rep now uses the NUCLEAR template system below (not the hardcoded GroundingRepWidget)

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
      />
    );
  }

  // Determine code to render: Custom DB code -> Template Default -> Empty
  const customCode = feature && feature.code;
  const templateCode = WIDGET_TEMPLATES[widgetId];
  
  // Priority: 
  // 1. Custom Code (User Override)
  // 2. Children (Hardcoded Component)
  // [NUCLEAR FIX] Force certain widgets to use template to bypass potential broken DB overrides
  let codeToRender = customCode || templateCode;
  if (widgetId === 'win-the-day' || widgetId === 'weekly-focus' || widgetId === 'time-traveler' || widgetId === 'locker-controller' || widgetId === 'grounding-rep' || widgetId === 'scorecard' || widgetId === 'daily-leader-reps' || widgetId === 'baseline-assessment' || widgetId === 'development-plan') {
    console.log(`[NUCLEAR] Forcing template for ${widgetId}. Ignoring custom DB code.`);
    codeToRender = templateCode;
  }

  const shouldRenderDynamic = (codeToRender && codeToRender.trim().length > 0) || (!children && templateCode && templateCode.trim().length > 0);

  const handleEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    openEditor({
      widgetId,
      widgetName: feature?.name || widgetId,
      scope,
      initialCode: codeToRender || ''
    });
  };

  // If we have code for this widget, render it
  if (shouldRenderDynamic) {
    return (
      <div id={`widget-${widgetId}`} className={`widget-wrapper relative group ${isEditMode ? 'ring-2 ring-teal-500/50 rounded-xl' : ''}`}>
        {isEditMode && (
          <div className="absolute -top-3 -right-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleEdit}
              className="bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700 hover:scale-110 transition-all"
              title={`Edit ${feature?.name || widgetId}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}
        <DynamicWidgetRenderer code={codeToRender} scope={scope} />
      </div>
    );
  }

  // Fallback to the hardcoded component (children)
  return (
    <div id={`widget-${widgetId}`} className={`relative group ${isEditMode ? 'ring-2 ring-teal-500/50 rounded-xl' : ''}`}>
       {isEditMode && (
          <div className="absolute -top-3 -right-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleEdit}
              className="bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700 hover:scale-110 transition-all"
              title={`Edit ${widgetId} (Create Override)`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}
      {children}
    </div>
  );
};

export default WidgetRenderer;
