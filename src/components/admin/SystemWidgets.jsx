import React from 'react';
import { Settings, Clock, Bell, RefreshCw, Info } from 'lucide-react';
import TimeTraveler from './TimeTraveler';
import { Card } from '../ui';
import { FEATURE_METADATA } from '../../config/widgetTemplates';

/**
 * SystemWidgets - Admin System Tools Panel
 * Contains system-level widgets for testing and administration
 */
const SystemWidgets = () => {
  // Get all system category widgets from metadata
  const systemWidgets = Object.entries(FEATURE_METADATA)
    .filter(([, meta]) => meta.category === 'System')
    .map(([id, meta]) => ({ id, ...meta }));

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
          </div>
        </div>
      </div>

      {/* Widget Grid */}
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
                Time Traveler widget is floating at the bottom-right corner ↘
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

            <p className="text-xs text-gray-400 italic">
              Add the System Reminders Controller widget to your dashboard via Widget Lab.
            </p>
          </div>
        </Card>

        {/* Future System Tools Placeholder */}
        <Card title="Coming Soon" icon={RefreshCw} accent="teal">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Additional system tools planned for future releases:
            </p>
            
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <ul className="text-sm text-teal-800 space-y-1">
                <li>• Data Migration Tools</li>
                <li>• Cache Management</li>
                <li>• Performance Monitoring</li>
                <li>• User Session Management</li>
                <li>• Feature Flag Testing</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemWidgets;
