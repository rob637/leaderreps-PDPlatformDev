import React from 'react';
import { useFeatures } from '../../providers/FeatureProvider';
import DynamicWidgetRenderer from './DynamicWidgetRenderer';

const WidgetRenderer = ({ widgetId, children, scope = {} }) => {
  const { features, isFeatureEnabled } = useFeatures();
  
  const feature = features[widgetId];
  const isEnabled = isFeatureEnabled(widgetId);

  // If feature is disabled, render nothing (or maybe children if we want fallback behavior?)
  // Usually if a feature is disabled in the manager, it should hide.
  if (!isEnabled) {
      // If the user explicitly disabled it, we hide it.
      // But if it's just not in the DB yet, we might want to show the hardcoded fallback.
      // Let's assume "enabled" defaults to true if missing, or we check if it exists.
      if (feature && feature.enabled === false) return null;
  }

  // If we have custom code for this widget, render it
  if (feature && feature.code && feature.code.trim().length > 0) {
    return (
      <div className="widget-wrapper mb-6">
        <DynamicWidgetRenderer code={feature.code} scope={scope} />
      </div>
    );
  }

  // Fallback to the hardcoded component (children)
  return children;
};

export default WidgetRenderer;
