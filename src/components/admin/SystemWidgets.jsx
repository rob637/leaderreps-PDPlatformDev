import React, { useMemo } from 'react';
import { Settings, Clock, Bell, RefreshCw, Info, Lightbulb } from 'lucide-react';
import TimeTraveler from './TimeTraveler';
import { Card } from '../ui';
import { FEATURE_METADATA } from '../../config/widgetTemplates';
import { useFeatures } from '../../providers/FeatureProvider';
import WidgetRenderer from './WidgetRenderer';
import { ENHANCEMENT_IDEAS } from '../../data/enhancementIdeas';

// List of system widget IDs
const SYSTEM_WIDGETS = ['system-reminders-controller', 'time-traveler'];

/**
 * SystemWidgets - Admin System Tools Panel
 * Contains system-level widgets for testing and administration
 */
const SystemWidgets = () => {
  const { isFeatureEnabled, getFeatureOrder } = useFeatures();

  // Get all system category widgets from metadata
  const systemWidgets = Object.entries(FEATURE_METADATA)
    .filter(([, meta]) => meta.category === 'System')
    .map(([id, meta]) => ({ id, ...meta }));

  // Get enabled and sorted system widgets
  const enabledWidgets = useMemo(() => {
    return SYSTEM_WIDGETS
      .filter(id => isFeatureEnabled(id))
      .sort((a, b) => {
        const orderA = getFeatureOrder(a);
        const orderB = getFeatureOrder(b);
        if (orderA === orderB) return SYSTEM_WIDGETS.indexOf(a) - SYSTEM_WIDGETS.indexOf(b);
        return orderA - orderB;
      });
  }, [isFeatureEnabled, getFeatureOrder]);

  // Build scope for widgets
  const scope = {
    Card,
    Settings,
    Clock,
    Bell,
    Info
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Settings className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-corporate-navy">System Tools</h2>
          <p className="text-sm text-gray-500">Administrative widgets for testing and system management</p>
        </div>
      </div>

      {/* System Widgets Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Available System Widgets</h3>
            <ul className="mt-2 space-y-1">
              {systemWidgets.map(widget => (
                <li key={widget.id} className="text-sm text-blue-800">
                  <span className="font-medium">{widget.name}</span> - {widget.purpose}
                </li>
              ))}
            </ul>
            <p className="text-xs text-blue-600 mt-2 italic">
              Enable widgets in the Widget Lab → System category to display them below.
            </p>
          </div>
        </div>
      </div>

      {/* Render Enabled System Widgets */}
      {enabledWidgets.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Active System Widgets</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {enabledWidgets.map(widgetId => (
              <WidgetRenderer key={widgetId} widgetId={widgetId} scope={scope} />
            ))}
          </div>
        </div>
      )}

      {/* Widget Details Grid - Always show for reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Time Traveler Section */}
        <Card title="Time Traveler" icon={Clock} accent="navy">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Test time-sensitive features by simulating different dates and times. 
              When active, a banner will appear at the top of the screen.
            </p>
            
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-2">Features:</h4>
              <ul className="text-sm text-indigo-800 space-y-1">
                <li>• Jump to specific dates and times</li>
                <li>• Test midnight rollover (Win the Day, Reflections, Scorecard)</li>
                <li>• Quick presets: Tonight 11:58 PM, Tomorrow 6 AM, +1 Week</li>
                <li>• Visual banner shows simulated time</li>
                <li>• Incomplete priorities carry over at midnight</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <div className="text-xs text-gray-400 italic">
                {isFeatureEnabled('time-traveler') 
                  ? '✓ Enabled - Widget shown above' 
                  : 'Enable in Widget Lab to activate'}
              </div>
            </div>
          </div>
        </Card>

        {/* System Reminders Section */}
        <Card title="System Reminders" icon={Bell} accent="orange">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Test and manage the notification system infrastructure.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-900 mb-2">Capabilities:</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Test push notification delivery</li>
                <li>• Check browser notification permissions</li>
                <li>• Monitor scheduled reminder status</li>
                <li>• Debug notification failures</li>
              </ul>
            </div>

            <p className="text-xs text-gray-400 italic text-center">
              {isFeatureEnabled('system-reminders-controller') 
                ? '✓ Enabled - Widget shown above' 
                : 'Enable in Widget Lab to activate'}
            </p>
          </div>
        </Card>
      </div>

      {/* Future Enhancements - Same pattern as FeatureManager */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Lightbulb className="w-6 h-6 text-yellow-500" />
          Future Enhancements: System
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ENHANCEMENT_IDEAS.system?.map((idea, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-bold text-slate-800 text-sm">{idea.title}</h4>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-wider">Planned</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{idea.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemWidgets;
