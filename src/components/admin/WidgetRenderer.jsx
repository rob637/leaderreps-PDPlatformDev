import React from 'react';
import { useFeatures } from '../../providers/FeatureProvider';
import { useWidgetEditor } from '../../providers/WidgetEditorProvider';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';
import { Edit3 } from 'lucide-react';
import { WIDGET_TEMPLATES } from '../../config/widgetTemplates';

const WidgetRenderer = ({ widgetId, children, scope = {} }) => {
  const { features, isFeatureEnabled } = useFeatures();
  const { isEditMode, openEditor } = useWidgetEditor();
  
  const feature = features[widgetId];
  
  // Robust check for explicitly disabled state (handles boolean or string)
  if (feature && (feature.enabled === false || feature.enabled === 'false')) {
    return null;
  }

  // Determine code to render: Custom DB code -> Template Default -> Empty
  const customCode = feature && feature.code;
  const templateCode = WIDGET_TEMPLATES[widgetId];
  
  // Priority: 
  // 1. Custom Code (User Override)
  // 2. Children (Hardcoded Component)
  // 3. Template Code (Default String)
  
  const shouldRenderDynamic = (customCode && customCode.trim().length > 0) || (!children && templateCode && templateCode.trim().length > 0);
  
  // [NUCLEAR FIX] Force 'win-the-day' to use template to bypass potential broken DB overrides
  let codeToRender = customCode || templateCode;
  if (widgetId === 'win-the-day') {
    console.log('[NUCLEAR] Forcing template for win-the-day. Ignoring custom DB code.');
    codeToRender = templateCode;
  }

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
      <div className={`widget-wrapper relative group ${isEditMode ? 'ring-2 ring-teal-500/50 rounded-xl' : ''}`}>
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
    <div className={`relative group ${isEditMode ? 'ring-2 ring-teal-500/50 rounded-xl' : ''}`}>
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
