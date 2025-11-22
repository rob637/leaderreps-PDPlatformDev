import React from 'react';
import WidgetRenderer from './WidgetRenderer';
import { ZONE_CONFIG } from '../../config/zoneConfig';

const ZoneRenderer = ({ zoneId, scope = {}, className = "" }) => {
  const widgets = ZONE_CONFIG[zoneId] || [];

  if (widgets.length === 0) {
    return null; // Or render a placeholder for empty zones if in edit mode
  }

  return (
    <div className={`zone-container ${className}`}>
      {widgets.map((widgetId, index) => (
        <div key={`${zoneId}-${widgetId}-${index}`} className="zone-item mb-4 last:mb-0">
          <WidgetRenderer widgetId={widgetId} scope={scope} />
        </div>
      ))}
    </div>
  );
};

export default ZoneRenderer;
