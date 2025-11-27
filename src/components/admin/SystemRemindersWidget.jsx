import React from 'react';
import { WidgetCard } from '../ui';
import { useNotifications } from '../../providers/NotificationProvider';
import { Bell, Shield, Radio, RefreshCw } from 'lucide-react';

const SystemRemindersWidget = () => {
  const { 
    permission, 
    requestPermission, 
    sendTestNotification,
    isSupported 
  } = useNotifications();

  return (
    <WidgetCard 
      title="System Reminders Controller" 
      icon={Shield} 
      accent="navy"
      className="mb-6"
    >
      <div className="space-y-6">
        {/* Status Section */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              permission === 'granted' ? 'bg-green-100 text-green-600' : 
              permission === 'denied' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Notification Permission</p>
              <p className="text-xs text-slate-500 capitalize">{permission || 'Unknown'}</p>
            </div>
          </div>
          
          {permission !== 'granted' && (
            <button
              onClick={requestPermission}
              className="px-3 py-1.5 text-xs font-medium text-white bg-corporate-navy rounded hover:bg-navy-700"
            >
              Request Access
            </button>
          )}
        </div>

        {/* Controls Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-corporate-teal" />
              Test Channel
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              Send a test notification to verify the browser's delivery system.
            </p>
            <button
              onClick={sendTestNotification}
              disabled={permission !== 'granted'}
              className="w-full px-4 py-2 text-sm font-medium text-corporate-teal bg-teal-50 rounded hover:bg-teal-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Test Notification
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg">
            <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-corporate-orange" />
              System Status
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Browser Support:</span>
                <span className={isSupported ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {isSupported ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Service Worker:</span>
                <span className="font-mono">
                  {navigator.serviceWorker ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
};

export default SystemRemindersWidget;
