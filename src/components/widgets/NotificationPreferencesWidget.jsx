// src/components/widgets/NotificationPreferencesWidget.jsx
// Enhanced notification preferences with smart escalation support
import React, { useState, useEffect } from 'react';
import { 
  Bell, Mail, MessageSquare, Smartphone, ChevronRight, 
  Check, AlertCircle, Globe, Zap, Shield, Volume2, VolumeX
} from 'lucide-react';
import { Card, Button, Input, Select } from '../ui';
import { useAppServices } from '../../services/useAppServices';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { requestNotificationPermission } from '../../services/pushNotificationService';

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

// Notification strategy presets
const NOTIFICATION_STRATEGIES = {
  smart_escalation: {
    id: 'smart_escalation',
    name: 'Smart Escalation',
    description: 'Starts gentle, escalates if you miss days',
    icon: Zap,
    details: [
      'Day 1 missed: Push notification only',
      'Day 2 missed: Push + Email',
      'Day 3+ missed: Push + Email + SMS'
    ],
    default: true
  },
  push_only: {
    id: 'push_only',
    name: 'Push Only',
    description: 'Quiet notifications on your device',
    icon: Smartphone,
    details: [
      'App notifications only',
      'No emails or texts',
      'Least intrusive option'
    ]
  },
  full_accountability: {
    id: 'full_accountability',
    name: 'Full Accountability',
    description: 'All channels, every reminder',
    icon: Shield,
    details: [
      'Push + Email + SMS always',
      'Maximum accountability',
      'Best for building habits'
    ]
  },
  email_only: {
    id: 'email_only',
    name: 'Email Only',
    description: 'Traditional email reminders',
    icon: Mail,
    details: [
      'Email notifications only',
      'No push or SMS',
      'Check at your own pace'
    ]
  },
  disabled: {
    id: 'disabled',
    name: 'All Notifications Off',
    description: 'No reminders (not recommended)',
    icon: VolumeX,
    details: [
      'No notifications of any kind',
      'You\'ll need to remember on your own'
    ]
  }
};

const NotificationPreferencesWidget = ({ onClose }) => {
  const { user, db } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  
  const [settings, setSettings] = useState({
    enabled: true,
    strategy: 'smart_escalation',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    channels: {
      push: true,
      email: true,
      sms: false
    },
    phoneNumber: '',
    // Escalation tracking (used by cloud function)
    escalation: {
      enabled: true,
      currentLevel: 0, // 0 = push, 1 = push+email, 2 = push+email+sms
      missedDays: 0,
      lastNotificationDate: null
    }
  });

  // Check push notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !db) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.notificationSettings) {
            const ns = data.notificationSettings;
            
            // Migrate old settings to new format
            let strategy = ns.strategy || 'smart_escalation';
            
            // Infer strategy from old channel settings if no strategy set
            if (!ns.strategy && ns.channels) {
              if (!ns.enabled) {
                strategy = 'disabled';
              } else if (ns.channels.email && ns.channels.sms) {
                strategy = 'full_accountability';
              } else if (ns.channels.email && !ns.channels.sms) {
                strategy = 'smart_escalation';
              } else if (!ns.channels.email && !ns.channels.sms) {
                strategy = 'push_only';
              }
            }
            
            setSettings(prev => ({
              ...prev,
              ...ns,
              strategy,
              channels: {
                push: ns.channels?.push ?? true,
                email: ns.channels?.email ?? true,
                sms: ns.channels?.sms ?? false
              },
              escalation: ns.escalation || prev.escalation
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

  // Request push notification permission
  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted' && user && db) {
        // Request FCM token and save to Firestore
        await requestNotificationPermission(db, user.uid);
        console.log('Push notification permission granted and token saved');
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
    }
  };

  // Handle strategy change
  const handleStrategyChange = (strategyId) => {
    let newChannels = { push: true, email: true, sms: false };
    let enabled = true;
    
    switch (strategyId) {
      case 'disabled':
        enabled = false;
        newChannels = { push: false, email: false, sms: false };
        break;
      case 'push_only':
        newChannels = { push: true, email: false, sms: false };
        break;
      case 'email_only':
        newChannels = { push: false, email: true, sms: false };
        break;
      case 'full_accountability':
        newChannels = { push: true, email: true, sms: true };
        break;
      case 'smart_escalation':
      default:
        newChannels = { push: true, email: true, sms: true };
        break;
    }
    
    setSettings(prev => ({
      ...prev,
      enabled,
      strategy: strategyId,
      channels: newChannels,
      escalation: {
        ...prev.escalation,
        enabled: strategyId === 'smart_escalation'
      }
    }));
  };

  // Save settings
  const handleSave = async () => {
    if (!user || !db) return;
    
    setSaving(true);
    setSaved(false);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Prepare settings for saving
      const settingsToSave = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userRef, {
        notificationSettings: settingsToSave
      });
      
      // Also update leader profile for consistency
      try {
        const profileRef = doc(db, `user_data/${user.uid}/leader_profile/current`);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          await updateDoc(profileRef, {
            'notificationSettings.strategy': settings.strategy,
            'notificationSettings.channels': settings.channels,
            'notificationSettings.timezone': settings.timezone,
            'notificationSettings.enabled': settings.enabled
          });
        }
      } catch (profileErr) {
        console.warn('Could not sync to leader profile:', profileErr);
      }
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      
    } catch (error) {
      console.error("Error saving notification settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-100 rounded w-1/3" />
          <div className="h-20 bg-slate-100 rounded" />
          <div className="h-20 bg-slate-100 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-corporate-teal/10 rounded-lg">
          <Bell className="w-6 h-6 text-corporate-teal" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-corporate-navy" style={{ fontFamily: 'var(--font-heading)' }}>
            Notification Preferences
          </h3>
          <p className="text-sm text-slate-500">Choose how you want to be reminded</p>
        </div>
      </div>

      {/* Strategy Selection */}
      <div className="space-y-3 mb-6">
        <label className="block text-sm font-medium text-corporate-navy mb-2">
          Reminder Style
        </label>
        
        {Object.values(NOTIFICATION_STRATEGIES).map((strategy) => {
          const Icon = strategy.icon;
          const isSelected = settings.strategy === strategy.id;
          
          return (
            <button
              key={strategy.id}
              onClick={() => handleStrategyChange(strategy.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                isSelected 
                  ? 'border-corporate-teal bg-corporate-teal/5' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-corporate-teal text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${isSelected ? 'text-corporate-navy' : 'text-slate-700'}`}>
                      {strategy.name}
                    </h4>
                    {strategy.default && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-corporate-teal/10 text-corporate-teal rounded font-medium">
                        RECOMMENDED
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-corporate-teal ml-auto" />
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{strategy.description}</p>
                  
                  {/* Show details when selected */}
                  {isSelected && (
                    <ul className="mt-2 space-y-1">
                      {strategy.details.map((detail, idx) => (
                        <li key={idx} className="text-xs text-slate-600 flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-corporate-teal rounded-full" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Push Notification Permission */}
      {settings.strategy !== 'disabled' && settings.channels.push && (
        <div className={`p-4 rounded-xl border mb-4 ${
          pushPermission === 'granted' 
            ? 'border-green-200 bg-green-50' 
            : pushPermission === 'denied'
            ? 'border-red-200 bg-red-50'
            : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className={`w-5 h-5 ${
                pushPermission === 'granted' ? 'text-green-600' : 
                pushPermission === 'denied' ? 'text-red-600' : 'text-amber-600'
              }`} />
              <div>
                <p className="font-medium text-sm text-slate-800">
                  {pushPermission === 'granted' 
                    ? 'Push notifications enabled'
                    : pushPermission === 'denied'
                    ? 'Push notifications blocked'
                    : 'Enable push notifications'}
                </p>
                <p className="text-xs text-slate-600">
                  {pushPermission === 'granted'
                    ? 'You\'ll receive notifications on this device'
                    : pushPermission === 'denied'
                    ? 'Check your browser settings to enable'
                    : 'Get gentle reminders right on your device'}
                </p>
              </div>
            </div>
            {pushPermission === 'default' && (
              <Button 
                size="sm" 
                onClick={requestPushPermission}
                className="bg-corporate-teal hover:bg-corporate-teal/90"
              >
                Enable
              </Button>
            )}
            {pushPermission === 'granted' && (
              <Check className="w-5 h-5 text-green-600" />
            )}
          </div>
        </div>
      )}

      {/* Advanced Settings Toggle */}
      {settings.strategy !== 'disabled' && (
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between p-3 text-sm text-slate-600 hover:text-corporate-navy hover:bg-slate-50 rounded-lg transition-colors"
        >
          <span>Advanced Settings</span>
          <ChevronRight className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} />
        </button>
      )}

      {/* Advanced Settings Panel */}
      {showAdvanced && settings.strategy !== 'disabled' && (
        <div className="mt-4 p-4 bg-slate-50 rounded-xl space-y-4">
          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Your Time Zone
            </label>
            <Select 
              value={settings.timezone}
              onChange={(e) => setSettings({...settings, timezone: e.target.value})}
              options={COMMON_TIMEZONES.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
            />
            <p className="text-xs text-slate-500 mt-1">Notifications will be timed to your local time.</p>
          </div>

          {/* Phone Number for SMS */}
          {(settings.strategy === 'full_accountability' || settings.strategy === 'smart_escalation') && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Mobile Number (for SMS)
              </label>
              <Input 
                type="tel" 
                placeholder="+1 (555) 000-0000"
                value={settings.phoneNumber}
                onChange={(e) => setSettings({...settings, phoneNumber: e.target.value})}
              />
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {settings.strategy === 'smart_escalation' 
                  ? 'SMS only sent after 3+ missed days'
                  : 'Standard messaging rates may apply'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-3">
        <Button 
          className="flex-1 bg-corporate-navy hover:bg-corporate-navy/90" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? (
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4" /> Saved!
            </span>
          ) : 'Save Preferences'}
        </Button>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>

      {/* Info Footer */}
      <p className="text-xs text-center text-slate-400 mt-4">
        You can change these settings anytime from your Locker.
      </p>
    </Card>
  );
};

export default NotificationPreferencesWidget;
