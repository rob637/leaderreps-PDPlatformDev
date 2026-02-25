// src/components/widgets/NotificationPreferencesWidget.jsx
// Enhanced notification preferences with smart escalation support
// Styled to match LeaderProfileFormSimple and BaselineAssessmentSimple
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Mail, MessageSquare, Smartphone, ChevronRight, 
  Check, AlertCircle, Globe, Zap, Shield, Volume2, VolumeX, X, CheckCircle, Loader
} from 'lucide-react';
import { Button, Input, Select } from '../ui';
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
      'Day 3+ missed: Push + Email reminder'
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
      'Push + Email always',
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

const NotificationPreferencesWidget = ({ onClose, onComplete }) => {
  const { user, db } = useAppServices();
  const formRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pushPermission, setPushPermission] = useState('default');
  const [phoneError, setPhoneError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const phoneInputRef = useRef(null);
  const emailInputRef = useRef(null);

  // Check if selected strategy requires SMS
  const strategyRequiresSMS = (strategy) => {
    return strategy === 'smart_escalation' || strategy === 'full_accountability';
  };

  // Check if selected strategy uses email
  const strategyUsesEmail = (strategy) => {
    return strategy === 'smart_escalation' || strategy === 'full_accountability' || strategy === 'email_only';
  };

  // Validate email
  const isValidEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Validate phone number - must have at least 10 digits
  const isValidPhoneNumber = (phone) => {
    if (!phone) return false;
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length >= 10;
  };

  // Format phone number to (xxx) xxx-xxxx
  const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10) return phone;
    const last10 = digitsOnly.slice(-10);
    return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6, 10)}`;
  };
  
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
    email: '',
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
        let existingPhoneNumber = '';
        // Get email from Firebase Auth first (always available)
        let existingEmail = user.email || '';
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          
          // Check for phone number and email in user doc
          existingPhoneNumber = data.phoneNumber || '';
          // User doc email overrides if present (in case they updated it)
          if (data.email) {
            existingEmail = data.email;
          }
          
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
            
            // Use phone/email from notification settings if set, otherwise from user doc
            const phoneFromSettings = ns.phoneNumber || '';
            const emailFromSettings = ns.email || '';
            
            setSettings(prev => ({
              ...prev,
              ...ns,
              strategy,
              phoneNumber: phoneFromSettings || existingPhoneNumber,
              email: emailFromSettings || existingEmail,
              channels: {
                push: ns.channels?.push ?? true,
                email: ns.channels?.email ?? true,
                sms: ns.channels?.sms ?? false
              },
              escalation: ns.escalation || prev.escalation
            }));
          } else {
            // No notification settings yet, but use available contact info
            setSettings(prev => ({
              ...prev,
              phoneNumber: existingPhoneNumber,
              email: existingEmail
            }));
          }
        } else {
          // No user doc yet, use Firebase Auth email
          setSettings(prev => ({
            ...prev,
            email: existingEmail
          }));
        }
        
        // Also check leader profile for phone/email if we don't have them
        try {
          const profileRef = doc(db, `user_data/${user.uid}/leader_profile/current`);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            setSettings(prev => ({
              ...prev,
              phoneNumber: prev.phoneNumber || profileData?.phoneNumber || '',
              email: prev.email || profileData?.email || ''
            }));
          }
        } catch (profileErr) {
          console.warn('Could not check leader profile:', profileErr);
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
  const requestPushPermission = async (silent = false) => {
    if (!('Notification' in window)) {
      if (!silent) {
        alert('Push notifications are not supported in this browser.');
      }
      return 'unsupported';
    }
    
    // If already denied, don't re-request (browser won't show dialog anyway)
    if (Notification.permission === 'denied') {
      setPushPermission('denied');
      return 'denied';
    }
    
    // If already granted, just ensure token is saved
    if (Notification.permission === 'granted') {
      setPushPermission('granted');
      if (user && db) {
        try {
          await requestNotificationPermission(db, user.uid);
        } catch (e) {
          console.warn('Could not save FCM token:', e);
        }
      }
      return 'granted';
    }
    
    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      
      if (permission === 'granted' && user && db) {
        // Request FCM token and save to Firestore
        await requestNotificationPermission(db, user.uid);
        console.log('Push notification permission granted and token saved');
      }
      return permission;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return 'error';
    }
  };

  // Check if strategy uses push notifications
  const strategyUsesPush = (strategyId) => {
    return strategyId !== 'disabled' && strategyId !== 'email_only';
  };

  // Handle strategy change
  const handleStrategyChange = async (strategyId) => {
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
    
    // Clear phone error when switching strategies
    if (!strategyRequiresSMS(strategyId)) {
      setPhoneError(null);
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
    
    // Auto-request push permission if selecting a push-enabled strategy
    if (strategyUsesPush(strategyId) && pushPermission === 'default') {
      // Small delay so user sees the selection first
      setTimeout(() => {
        requestPushPermission();
      }, 300);
    }
  };

  // Save settings
  const handleSave = async () => {
    if (!user || !db) return;
    
    // Validate phone number if SMS strategy is selected
    if (strategyRequiresSMS(settings.strategy)) {
      if (!settings.phoneNumber?.trim()) {
        setPhoneError('Phone number is required for SMS reminders. Add one or choose "Push Only" or "Email Only".');
        // Scroll to and focus the phone input
        phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => phoneInputRef.current?.focus(), 300);
        return;
      }
      if (!isValidPhoneNumber(settings.phoneNumber)) {
        setPhoneError('Please enter a valid phone number (at least 10 digits)');
        phoneInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => phoneInputRef.current?.focus(), 300);
        return;
      }
    }
    
    // Validate email if email strategy is selected
    if (strategyUsesEmail(settings.strategy)) {
      if (!settings.email?.trim()) {
        setEmailError('Email address is required for email notifications.');
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => emailInputRef.current?.focus(), 300);
        return;
      }
      if (!isValidEmail(settings.email)) {
        setEmailError('Please enter a valid email address');
        emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => emailInputRef.current?.focus(), 300);
        return;
      }
    }
    
    setPhoneError(null);
    setEmailError(null);
    setSaving(true);
    setSaved(false);
    
    try {
      const userRef = doc(db, 'users', user.uid);
      
      // Prepare settings for saving
      const settingsToSave = {
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      // Save notification settings and sync phone/email to user doc
      const userUpdate = {
        notificationSettings: settingsToSave,
        'prepStatus.notifications': true
      };
      
      // If phone number was entered, also save it to user doc for easy access
      if (settings.phoneNumber?.trim()) {
        userUpdate.phoneNumber = settings.phoneNumber;
      }
      
      // If email was entered, also save it to user doc
      if (settings.email?.trim()) {
        userUpdate.email = settings.email;
      }
      
      await updateDoc(userRef, userUpdate);
      
      // Also update leader profile for consistency
      try {
        const profileRef = doc(db, `user_data/${user.uid}/leader_profile/current`);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const profileUpdate = {
            'notificationSettings.strategy': settings.strategy,
            'notificationSettings.channels': settings.channels,
            'notificationSettings.timezone': settings.timezone,
            'notificationSettings.enabled': settings.enabled
          };
          // Sync phone number to leader profile too
          if (settings.phoneNumber?.trim()) {
            profileUpdate.phoneNumber = settings.phoneNumber;
          }
          // Sync email to leader profile too
          if (settings.email?.trim()) {
            profileUpdate.email = settings.email;
          }
          await updateDoc(profileRef, profileUpdate);
        }
      } catch (profileErr) {
        console.warn('Could not sync to leader profile:', profileErr);
      }
      
      // Show success state then close
      setShowSuccess(true);
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        } else if (onClose) {
          onClose();
        }
      }, 1500);
      
    } catch (error) {
      console.error("Error saving notification settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 bg-corporate-teal/10 rounded-full flex items-center justify-center mb-4">
            <Loader className="w-8 h-8 text-corporate-teal animate-spin" />
          </div>
          <h3 className="text-xl font-bold text-corporate-navy dark:text-white mb-2">Loading Settings...</h3>
          <p className="text-slate-600 dark:text-slate-300">Please wait</p>
        </div>
      </div>
    );
  }

  // Success state
  if (showSuccess) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700">
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-corporate-navy dark:text-white mb-2">Preferences Saved!</h3>
          <p className="text-slate-600 dark:text-slate-300">Your notification settings are ready.</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={formRef} className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col max-h-[70dvh] md:max-h-[85vh]">
      {/* Header — navy gradient, consistent with LeaderProfile and Baseline */}
      <div className="p-5 pb-4 bg-gradient-to-r from-corporate-navy to-corporate-navy/90 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-white/90" />
            <h3 className="text-lg font-bold text-white">Notification Preferences</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 -mr-1 bg-transparent hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="mt-1 text-sm text-white/70">Choose how you want to be reminded</div>
      </div>

      {/* Form Body — Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">

        {/* Strategy Selection */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Reminder Style</h3>
          <div className="space-y-3">
        
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
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-corporate-teal text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${isSelected ? 'text-corporate-navy' : 'text-slate-700 dark:text-slate-200'}`}>
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
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{strategy.description}</p>
                  
                  {/* Show details when selected */}
                  {isSelected && (
                    <ul className="mt-2 space-y-1">
                      {strategy.details.map((detail, idx) => (
                        <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
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
        </div>

        {/* Push Notification Permission Status */}
        {settings.strategy !== 'disabled' && settings.channels.push && (
          <div className={`p-4 rounded-xl border ${
          pushPermission === 'granted' 
            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20' 
            : pushPermission === 'denied'
            ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className={`w-5 h-5 ${
                pushPermission === 'granted' ? 'text-green-600' : 
                pushPermission === 'denied' ? 'text-red-600' : 'text-amber-600'
              }`} />
              <div>
                <p className="font-medium text-sm text-slate-800 dark:text-slate-200">
                  {pushPermission === 'granted' 
                    ? 'Push notifications enabled'
                    : pushPermission === 'denied'
                    ? 'Push notifications blocked'
                    : 'Enable push notifications'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {pushPermission === 'granted'
                    ? 'You\'ll receive notifications on this device'
                    : pushPermission === 'denied'
                    ? 'You\'ll need to enable notifications in your browser settings'
                    : 'Click to allow notifications on this device'}
                </p>
              </div>
            </div>
            {pushPermission === 'default' && (
              <Button 
                size="sm" 
                onClick={() => requestPushPermission()}
                className="bg-corporate-teal hover:bg-corporate-teal/90"
              >
                Enable
              </Button>
            )}
            {pushPermission === 'granted' && (
              <Check className="w-5 h-5 text-green-600" />
            )}
          </div>
          
          {/* Detailed instructions when permission is denied */}
          {pushPermission === 'denied' && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              <p className="text-sm font-medium text-red-800 mb-2">How to enable notifications:</p>
              <ol className="text-xs text-red-700 space-y-1.5 ml-4 list-decimal">
                <li>Click the <strong>lock icon</strong> (or site settings icon) in your browser's address bar</li>
                <li>Find <strong>"Notifications"</strong> in the permissions list</li>
                <li>Change it from "Block" to <strong>"Allow"</strong></li>
                <li>Refresh this page to apply the change</li>
              </ol>
              <p className="text-xs text-red-600 mt-2 italic">
                Or choose "Email Only" above if you prefer not to receive push notifications.
              </p>
            </div>
          )}
        </div>
      )}

        {/* Phone Number - SMS is disabled for go-live
        {strategyRequiresSMS(settings.strategy) && (
          <div className={`p-4 rounded-xl border ${phoneError ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'}`}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> 
            Mobile Number for SMS
            <span className="text-red-500">*</span>
          </label>
          <Input 
            ref={phoneInputRef}
            type="tel" 
            placeholder="+1 (555) 000-0000"
            value={settings.phoneNumber}
            onChange={(e) => {
              setSettings({...settings, phoneNumber: e.target.value});
              if (phoneError) setPhoneError(null);
            }}
            onBlur={() => {
              if (settings.phoneNumber && isValidPhoneNumber(settings.phoneNumber)) {
                setSettings({...settings, phoneNumber: formatPhoneNumber(settings.phoneNumber)});
              }
            }}
            className={phoneError ? 'border-red-300' : ''}
          />
          {phoneError ? (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {phoneError}
            </p>
          ) : (
            <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {settings.strategy === 'smart_escalation' 
                ? 'Required for Day 3+ escalation. SMS only sent if you miss multiple days.'
                : 'Required for Full Accountability mode. Standard messaging rates may apply.'}
            </p>
          )}
        </div>
      )}
        */}

        {/* Email Address - Show when email strategy is selected */}
        {strategyUsesEmail(settings.strategy) && (
          <div className={`p-4 rounded-xl border ${emailError ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'}`}>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4" /> 
            Email Address
            <span className="text-red-500">*</span>
          </label>
          <Input 
            ref={emailInputRef}
            type="email" 
            placeholder="your@email.com"
            value={settings.email}
            onChange={(e) => {
              setSettings({...settings, email: e.target.value});
              if (emailError) setEmailError(null);
            }}
            className={emailError ? 'border-red-300' : ''}
          />
          {emailError ? (
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {emailError}
            </p>
          ) : (
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {settings.strategy === 'email_only' 
                ? 'All notifications will be sent to this email address.'
                : 'Email reminders will be sent based on your selected strategy.'}
            </p>
          )}
        </div>
      )}

        {/* Timezone - show when notifications enabled */}
        {settings.strategy !== 'disabled' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Your Time Zone
            </label>
            <Select 
              value={settings.timezone}
              onChange={(e) => setSettings({...settings, timezone: e.target.value})}
              options={COMMON_TIMEZONES.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Notifications will be timed to your local time.</p>
          </div>
        )}

      </div>

      {/* Footer — consistent gray bar with action buttons */}
      <div className="px-5 py-4 border-t border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 flex-shrink-0">
        <div className="flex items-center justify-between gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          )}
          <div className="flex-1" />
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-corporate-teal hover:bg-corporate-teal/90"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferencesWidget;
