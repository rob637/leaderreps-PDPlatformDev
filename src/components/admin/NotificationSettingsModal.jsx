import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { X, Save, RefreshCw, Bell, Mail, MessageSquare, Globe, CheckCircle, AlertTriangle, AtSign, TestTube } from 'lucide-react';

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC"
];

const NotificationSettingsModal = ({ isOpen, onClose, userId, userName }) => {
  const { db } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [isTestUser, setIsTestUser] = useState(false);
  const [testNotificationRecipient, setTestNotificationRecipient] = useState('');
  const [settings, setSettings] = useState({
    enabled: false,
    timezone: "America/New_York",
    channels: {
      email: true,
      sms: false
    },
    phoneNumber: ''
  });

  const fetchNotificationSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        
        // Get user email and test user status
        setUserEmail(data.email || '');
        setIsTestUser(data.isTestUser === true);
        setTestNotificationRecipient(data.testNotificationRecipient || '');
        
        if (data.notificationSettings) {
          // Derive enabled state: if no explicit 'enabled' field, infer from channels/reminders
          const ns = data.notificationSettings;
          const hasChannels = ns.channels?.email || ns.channels?.sms;
          const hasReminders = ns.reminders && Object.values(ns.reminders).some(r => r.enabled);
          const inferredEnabled = ns.enabled !== undefined ? ns.enabled : (hasChannels || hasReminders);
          
          setSettings(prev => ({
            ...prev,
            ...ns,
            enabled: inferredEnabled
          }));
        }
      }
    } catch (err) {
      console.error("Error fetching notification settings:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [db, userId]);

  useEffect(() => {
    if (isOpen && userId) {
      fetchNotificationSettings();
    }
  }, [isOpen, userId, fetchNotificationSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const userRef = doc(db, 'users', userId);
      const updateData = {
        notificationSettings: settings
      };
      
      // If test user, also update the notification recipient
      if (isTestUser) {
        updateData.testNotificationRecipient = testNotificationRecipient;
      }
      
      await updateDoc(userRef, updateData);
      onClose();
    } catch (err) {
      console.error("Error saving notification settings:", err);
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = (channel) => {
    setSettings(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel]
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Bell className="w-5 h-5 text-corporate-teal" />
            Notification Settings
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin text-corporate-teal" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-sm text-blue-800">
                  Managing notifications for <span className="font-bold">{userName}</span>
                </p>
              </div>

              {/* Notification Email Section */}
              <div className={`p-4 rounded-lg border ${isTestUser ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {isTestUser ? (
                    <TestTube className="w-4 h-4 text-amber-600" />
                  ) : (
                    <AtSign className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  )}
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    {isTestUser ? 'Test User - Override Email' : 'Notification Email'}
                  </label>
                  {isTestUser && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">TEST</span>
                  )}
                </div>
                
                {isTestUser ? (
                  <>
                    <input
                      type="email"
                      value={testNotificationRecipient}
                      onChange={(e) => setTestNotificationRecipient(e.target.value)}
                      placeholder="Enter override email address"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-400 text-sm bg-white dark:bg-slate-800"
                    />
                    <p className="text-xs text-amber-700 mt-2">
                      ⚠️ This is a test user. All notifications will be redirected to the email above instead of <span className="font-medium">{userEmail}</span>.
                    </p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-200">{userEmail || 'No email set'}</span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 flex items-center gap-2 text-red-700 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <h4 className="font-medium text-slate-900 dark:text-white">Enable Notifications</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Allow the system to send reminders</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-corporate-teal"></div>
                </label>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Time Zone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal text-sm"
                >
                  {COMMON_TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Delivery Channels */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Delivery Channels</label>
                
                <div 
                  onClick={() => toggleChannel('email')}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    settings.channels.email 
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {settings.channels.email ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Mail className="w-5 h-5 text-slate-400" />
                    )}
                    <span className={`text-sm font-medium ${settings.channels.email ? 'text-emerald-800' : 'text-slate-700 dark:text-slate-200'}`}>
                      Email
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => toggleChannel('sms')}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    settings.channels.sms 
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {settings.channels.sms ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-slate-400" />
                    )}
                    <span className={`text-sm font-medium ${settings.channels.sms ? 'text-emerald-800' : 'text-slate-700 dark:text-slate-200'}`}>
                      SMS / Text
                    </span>
                  </div>
                </div>
              </div>

              {/* Phone Number Input (Conditional) */}
              {settings.channels.sms && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={settings.phoneNumber}
                    onChange={(e) => setSettings({...settings, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-corporate-teal focus:border-corporate-teal text-sm"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Standard messaging rates may apply.</p>
                </div>
              )}

              {/* Summary */}
              <div className={`p-4 rounded-lg border ${settings.enabled ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center gap-2">
                  {settings.enabled ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Bell className="w-5 h-5 text-slate-400" />
                  )}
                  <span className={`font-medium ${settings.enabled ? 'text-emerald-800' : 'text-slate-600 dark:text-slate-300'}`}>
                    {settings.enabled ? 'Notifications Enabled' : 'Notifications Disabled'}
                  </span>
                </div>
                {settings.enabled && (
                  <>
                    <p className="text-xs text-emerald-700 mt-1">
                      {[
                        settings.channels.email && 'Email',
                        settings.channels.sms && 'SMS'
                      ].filter(Boolean).join(' & ') || 'No channels selected'} • {settings.timezone.replace(/_/g, ' ')}
                    </p>
                    {settings.channels.email && (
                      <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Sending to: <span className="font-medium">{isTestUser ? (testNotificationRecipient || 'No override set') : userEmail}</span>
                        {isTestUser && <span className="text-amber-600">(override)</span>}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Update Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsModal;
