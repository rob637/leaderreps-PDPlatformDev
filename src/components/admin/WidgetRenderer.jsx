import React from 'react';
import { useFeatures } from '../../providers/FeatureProvider';
import { useWidgetEditor } from '../../providers/WidgetEditorProvider';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';
import { Edit3 } from 'lucide-react';

const WidgetRenderer = ({ widgetId, children, scope = {} }) => {
  const { features, isFeatureEnabled } = useFeatures();
  const { isEditMode, openEditor } = useWidgetEditor();
  
  const feature = features[widgetId];
  const isEnabled = isFeatureEnabled(widgetId);

  // If feature is disabled, render nothing (or maybe children if we want fallback behavior?)
  if (!isEnabled) {
      if (feature && feature.enabled === false) return null;
  }

  const handleEdit = (e) => {
    e.stopPropagation();
    e.preventDefault();
    openEditor({
      widgetId,
      widgetName: feature?.name || widgetId,
      scope,
      initialCode: feature?.code || ''
    });
  };

  // If we have custom code for this widget, render it
  if (feature && feature.code && feature.code.trim().length > 0) {
    return (
      <div className={`widget-wrapper mb-6 relative group ${isEditMode ? 'ring-2 ring-teal-500/50 rounded-xl' : ''}`}>
        {isEditMode && (
          <div className="absolute -top-3 -right-3 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={handleEdit}
              className="bg-teal-600 text-white p-2 rounded-full shadow-lg hover:bg-teal-700 hover:scale-110 transition-all"
              title={`Edit ${feature.name || widgetId}`}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        )}
        <DynamicWidgetRenderer code={feature.code} scope={scope} />
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
