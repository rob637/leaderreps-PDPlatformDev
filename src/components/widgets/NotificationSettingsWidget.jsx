import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select } from '../ui';
import { Bell, Mail, MessageSquare, Globe, Save, AlertCircle } from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

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

const NotificationSettingsWidget = () => {
  const { user, db } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    channels: {
      email: true,
      sms: false
    },
    phoneNumber: ''
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !db) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.notificationSettings) {
            setSettings(prev => ({
              ...prev,
              ...data.notificationSettings
            }));
          } else {
            // Initialize with defaults if not present
             setSettings(prev => ({
              ...prev,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
            }));
          }
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, [user, db]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationSettings: settings
      });
      // Show success feedback?
    } catch (error) {
      console.error("Error saving settings:", error);
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

  if (loading) return <Card className="p-6"><div className="animate-pulse h-20 bg-gray-100 rounded"></div></Card>;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Notification Preferences</h3>
          <p className="text-sm text-gray-500">Manage how and when you receive updates</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div>
            <h4 className="font-medium text-gray-900">Enable Notifications</h4>
            <p className="text-xs text-gray-500">Allow the system to send you reminders</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={settings.enabled}
              onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {settings.enabled && (
          <>
            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4" /> Your Time Zone
              </label>
              <Select 
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                options={COMMON_TIMEZONES.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
                placeholder="Select your timezone"
              />
              <p className="text-xs text-gray-500 mt-1">Notifications will be sent based on this time.</p>
            </div>

            {/* Channels */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Delivery Channels</label>
              
              <div className={`flex items-center justify-between p-3 rounded-lg border ${settings.channels.email ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <Mail className={`w-5 h-5 ${settings.channels.email ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.channels.email}
                  onChange={() => toggleChannel('email')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>

              <div className={`flex items-center justify-between p-3 rounded-lg border ${settings.channels.sms ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <MessageSquare className={`w-5 h-5 ${settings.channels.sms ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">SMS / Text</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.channels.sms}
                  onChange={() => toggleChannel('sms')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
              </div>
            </div>

            {/* Phone Number Input (Conditional) */}
            {settings.channels.sms && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                <Input 
                  type="tel" 
                  placeholder="+1 (555) 000-0000"
                  value={settings.phoneNumber}
                  onChange={(e) => setSettings({...settings, phoneNumber: e.target.value})}
                />
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Standard messaging rates may apply.
                </p>
              </div>
            )}

            <Button 
              className="w-full mt-4" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default NotificationSettingsWidget;
