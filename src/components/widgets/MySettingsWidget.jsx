import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Bell, ChevronDown, ChevronUp, 
  CheckCircle, Edit2, Mail, MessageSquare, Globe, 
  Save, AlertCircle, Check
} from 'lucide-react';
import { Card, Button, Input, Select } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import { useAppServices } from '../../services/useAppServices';
import LeaderProfileFormSimple from '../profile/LeaderProfileFormSimple';
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

/**
 * MySettingsWidget - Unified settings widget for the Locker
 * Combines Leader Profile and Notification Preferences in an expandable panel
 */
const MySettingsWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState(null); // 'profile' or 'notifications'
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  // Profile data
  const { profile, loading: profileLoading, isComplete: profileComplete, completionPercentage } = useLeaderProfile();
  
  // Notification settings
  const { user, db } = useAppServices();
  const [notifLoading, setNotifLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    enabled: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    channels: {
      email: true,
      sms: false
    },
    phoneNumber: ''
  });

  // Load notification settings
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
            const hasChannels = ns.channels?.email || ns.channels?.sms;
            const hasReminders = ns.reminders && Object.values(ns.reminders).some(r => r.enabled);
            const inferredEnabled = ns.enabled !== undefined ? ns.enabled : (hasChannels || hasReminders);
            
            setNotifSettings(prev => ({
              ...prev,
              ...ns,
              enabled: inferredEnabled
            }));
          }
        }
      } catch (error) {
        console.error("Error loading notification settings:", error);
      } finally {
        setNotifLoading(false);
      }
    };
    loadSettings();
  }, [user, db]);

  const handleSaveNotifications = async (newSettings = notifSettings) => {
    setSaving(true);
    setSaved(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationSettings: newSettings
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleMasterToggle = async (enabled) => {
    const newSettings = { ...notifSettings, enabled };
    setNotifSettings(newSettings);
    await handleSaveNotifications(newSettings);
  };

  const toggleChannel = (channel) => {
    setNotifSettings(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: !prev.channels[channel]
      }
    }));
  };

  const loading = profileLoading || notifLoading;

  if (loading) {
    return (
      <Card accent="TEAL" className="animate-pulse">
        <div className="h-16 bg-slate-100 rounded-lg" />
      </Card>
    );
  }

  return (
    <>
      <Card accent="TEAL" className="overflow-hidden">
        {/* Collapsed Header - Always Visible */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-corporate-teal/10 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-corporate-teal" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-corporate-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                My Settings
              </h3>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                {/* Profile Status */}
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {profileComplete ? (
                    <span className="text-green-600">Profile Complete</span>
                  ) : (
                    <span className="text-corporate-orange">{completionPercentage}% Complete</span>
                  )}
                </span>
                <span className="text-slate-300">|</span>
                {/* Notification Status */}
                <span className="flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5" />
                  {notifSettings.enabled ? (
                    <span className="text-green-600">Notifications On</span>
                  ) : (
                    <span className="text-slate-400">Notifications Off</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-slate-200 p-4 space-y-4 bg-slate-50/50">
            
            {/* Leader Profile Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profileComplete ? 'bg-green-100' : 'bg-corporate-orange/10'}`}>
                    {profileComplete ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <User className="w-4 h-4 text-corporate-orange" />
                    )}
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-corporate-navy">Leader Profile</h4>
                    <p className="text-xs text-slate-500">
                      {profileComplete 
                        ? `Welcome, ${profile?.firstName}!` 
                        : `${completionPercentage}% complete - helps personalize your experience`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span 
                    className="text-sm font-medium text-corporate-teal hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProfileForm(true);
                    }}
                  >
                    {profileComplete ? 'Edit' : 'Complete'}
                  </span>
                  {activeSection === 'profile' ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>
              
              {activeSection === 'profile' && (
                <div className="border-t border-slate-100 p-4 bg-slate-50">
                  <div className="space-y-2 text-sm">
                    {profile?.firstName && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name</span>
                        <span className="font-medium text-slate-700">{profile.firstName} {profile.lastName}</span>
                      </div>
                    )}
                    {profile?.company && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Company</span>
                        <span className="font-medium text-slate-700">{profile.company}</span>
                      </div>
                    )}
                    {profile?.title && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Title</span>
                        <span className="font-medium text-slate-700">{profile.title}</span>
                      </div>
                    )}
                    {profile?.teamSize && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Team Size</span>
                        <span className="font-medium text-slate-700">{profile.teamSize}</span>
                      </div>
                    )}
                  </div>
                  <Button 
                    variant="secondary" 
                    className="w-full mt-4"
                    onClick={() => setShowProfileForm(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {profileComplete ? 'Update Profile' : 'Complete Profile'}
                  </Button>
                </div>
              )}
            </div>

            {/* Notification Preferences Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setActiveSection(activeSection === 'notifications' ? null : 'notifications')}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notifSettings.enabled ? 'bg-green-100' : 'bg-slate-100'}`}>
                    <Bell className={`w-4 h-4 ${notifSettings.enabled ? 'text-green-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-corporate-navy">Notification Preferences</h4>
                    <p className="text-xs text-slate-500">
                      {notifSettings.enabled 
                        ? `${notifSettings.channels.email ? 'Email' : ''}${notifSettings.channels.email && notifSettings.channels.sms ? ' + ' : ''}${notifSettings.channels.sms ? 'SMS' : ''} enabled`
                        : 'Notifications disabled'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Quick toggle */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMasterToggle(!notifSettings.enabled);
                    }}
                  >
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={notifSettings.enabled}
                        onChange={() => {}}
                        disabled={saving}
                      />
                      <div className={`w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-corporate-teal ${saving ? 'opacity-50' : ''}`}></div>
                    </label>
                  </div>
                  {activeSection === 'notifications' ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </button>
              
              {activeSection === 'notifications' && notifSettings.enabled && (
                <div className="border-t border-slate-100 p-4 bg-slate-50 space-y-4">
                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Your Time Zone
                    </label>
                    <Select 
                      value={notifSettings.timezone}
                      onChange={(e) => setNotifSettings({...notifSettings, timezone: e.target.value})}
                      options={COMMON_TIMEZONES.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
                      placeholder="Select your timezone"
                    />
                  </div>

                  {/* Channels */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Delivery Channels</label>
                    
                    <div className={`flex items-center justify-between p-3 rounded-lg border ${notifSettings.channels.email ? 'border-corporate-teal/30 bg-corporate-teal/5' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <Mail className={`w-4 h-4 ${notifSettings.channels.email ? 'text-corporate-teal' : 'text-slate-400'}`} />
                        <span className="text-sm font-medium">Email</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={notifSettings.channels.email}
                        onChange={() => toggleChannel('email')}
                        className="h-4 w-4 text-corporate-teal rounded border-slate-300"
                      />
                    </div>

                    <div className={`flex items-center justify-between p-3 rounded-lg border ${notifSettings.channels.sms ? 'border-corporate-teal/30 bg-corporate-teal/5' : 'border-slate-200'}`}>
                      <div className="flex items-center gap-3">
                        <MessageSquare className={`w-4 h-4 ${notifSettings.channels.sms ? 'text-corporate-teal' : 'text-slate-400'}`} />
                        <span className="text-sm font-medium">SMS / Text</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={notifSettings.channels.sms}
                        onChange={() => toggleChannel('sms')}
                        className="h-4 w-4 text-corporate-teal rounded border-slate-300"
                      />
                    </div>
                  </div>

                  {/* Phone Number Input */}
                  {notifSettings.channels.sms && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number</label>
                      <Input 
                        type="tel" 
                        placeholder="+1 (555) 000-0000"
                        value={notifSettings.phoneNumber}
                        onChange={(e) => setNotifSettings({...notifSettings, phoneNumber: e.target.value})}
                      />
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Standard messaging rates may apply.
                      </p>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={() => handleSaveNotifications()}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : saved ? (
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4" /> Saved!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" /> Save Preferences
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Profile Form Modal */}
      {showProfileForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <LeaderProfileFormSimple 
              onComplete={() => setShowProfileForm(false)}
              onClose={() => setShowProfileForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MySettingsWidget;
