import React from 'react';
import { WidgetCard } from '../../ui';
import { useNotifications } from '../../../providers/NotificationProvider';
import { Bell, Clock, AlertCircle, CheckCircle } from 'lucide-react';

const RemindersWidget = () => {
  const { 
    permission, 
    requestPermission, 
    reminders, 
    updateReminder,
    isSupported 
  } = useNotifications();

  if (!isSupported) {
    return (
      <WidgetCard title="Daily Reminders" icon={Bell} accent="orange">
        <div className="p-4 text-center text-slate-500">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
          <p>Notifications are not supported in this browser.</p>
        </div>
      </WidgetCard>
    );
  }

  if (permission !== 'granted') {
    return (
      <WidgetCard title="Daily Reminders" icon={Bell} accent="orange">
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-3 bg-orange-100 rounded-full">
            <Bell className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Enable Notifications</h3>
            <p className="text-sm text-slate-600 mt-1">
              Get timely nudges for your AM/PM bookends and to seize the day.
            </p>
          </div>
          <button
            onClick={requestPermission}
            className="px-4 py-2 bg-corporate-teal text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Allow Notifications
          </button>
          {permission === 'denied' && (
            <p className="text-xs text-red-500">
              Notifications are blocked. Please enable them in your browser settings.
            </p>
          )}
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard title="Daily Reminders" icon={Bell} accent="teal">
      <div className="space-y-4">
        {Object.values(reminders).map((reminder) => (
          <div key={reminder.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-semibold ${reminder.enabled ? 'text-slate-900' : 'text-slate-400'}`}>
                  {reminder.label}
                </p>
                {reminder.enabled && (
                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                    Active
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <input
                  type="time"
                  value={reminder.time}
                  onChange={(e) => updateReminder(reminder.id, { time: e.target.value })}
                  disabled={!reminder.enabled}
                  className="bg-transparent border-none p-0 text-sm text-slate-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => updateReminder(reminder.id, { enabled: !reminder.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
                reminder.enabled ? 'bg-corporate-teal' : 'bg-slate-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  reminder.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 text-center">
          Reminders are sent only if the task is not yet completed.
        </p>
      </div>
    </WidgetCard>
  );
};

export default RemindersWidget;
