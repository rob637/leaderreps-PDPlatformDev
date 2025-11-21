import React from 'react';
import { LiveProvider, LiveError, LivePreview } from 'react-live';
import * as LucideIcons from 'lucide-react';
import { COLORS } from '../screens/dashboard/dashboardConstants';
import SafeWidgetWrapper from './SafeWidgetWrapper';

const DynamicWidgetRenderer = ({ code, scope = {} }) => {
  // Trim code to avoid leading/trailing whitespace issues
  const cleanCode = code ? code.trim() : '';

  // Default scope includes React, Lucide Icons, and common constants
  const defaultScope = {
    React,
    ...LucideIcons,
    COLORS,
    ...scope
  };

  // Determine if the code is using the "render()" pattern (noInline=true)
  // or the simple expression pattern (noInline=false)
  const noInline = cleanCode && cleanCode.includes('render(');

  return (
    <LiveProvider code={cleanCode} scope={defaultScope} noInline={noInline}>
      <div className="dynamic-widget-preview h-full w-full overflow-auto">
        <LiveError className="bg-red-100 text-red-800 p-4 rounded-lg mb-4 font-mono text-sm whitespace-pre-wrap" />
        <SafeWidgetWrapper showDetails={true}>
          <LivePreview />
        </SafeWidgetWrapper>
      </div>
    </LiveProvider>
  );
};

export default DynamicWidgetRenderer;
