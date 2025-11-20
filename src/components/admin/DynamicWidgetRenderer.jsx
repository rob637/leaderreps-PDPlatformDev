import React from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as LucideIcons from 'lucide-react';
import { COLORS } from '../screens/dashboard/dashboardConstants';

const DynamicWidgetRenderer = ({ code, scope = {} }) => {
  // Default scope includes React, Lucide Icons, and common constants
  const defaultScope = {
    React,
    ...LucideIcons,
    COLORS,
    ...scope
  };

  return (
    <LiveProvider code={code} scope={defaultScope} noInline={false}>
      <div className="dynamic-widget-preview h-full w-full overflow-auto">
        <LiveError className="bg-red-100 text-red-800 p-4 rounded-lg mb-4 font-mono text-sm whitespace-pre-wrap" />
        <LivePreview />
      </div>
    </LiveProvider>
  );
};

export default DynamicWidgetRenderer;
