import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Bell, CheckCircle, Edit2
} from 'lucide-react';
import { Card } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import { useAppServices } from '../../services/useAppServices';
import LeaderProfileFormSimple from '../profile/LeaderProfileFormSimple';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';

/**
 * MySettingsWidget - Unified settings widget for the Locker
 * Combines Leader Profile and Notification toggle in an expandable panel
 * 
 * Notification settings are stored in TWO places and must be synced:
 * 1. users/{uid}.notificationSettings - used by cloud functions for sending
 * 2. user_data/{uid}/leader_profile/current.notificationSettings - user preferences
 */
const MySettingsWidget = () => {
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  // Profile data
  const { profile, loading: profileLoading, isComplete: profileComplete } = useLeaderProfile();
  
  // Use stored isComplete flag - profile is complete once user saves it
  const isProfileComplete = profileComplete;
  
  // Notification settings
  const { user, db } = useAppServices();
  const [notifLoading, setNotifLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    enabled: false,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    channels: {
      email: true,
      sms: false
    },
    phoneNumber: ''
  });

  // Load notification settings from BOTH sources and merge
  useEffect(() => {
    const loadSettings = async () => {
      if (!user || !db) return;
      try {
        // Load from main user doc
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        let userSettings = null;
        if (userSnap.exists() && userSnap.data().notificationSettings) {
          userSettings = userSnap.data().notificationSettings;
        }
        
        // Load from leader profile
        const profileRef = doc(db, `user_data/${user.uid}/leader_profile/current`);
        const profileSnap = await getDoc(profileRef);
        let profileSettings = null;
        if (profileSnap.exists() && profileSnap.data().notificationSettings) {
          profileSettings = profileSnap.data().notificationSettings;
        }
        
        // Merge: prefer user doc for enabled state, merge channels from both
        const mergedChannels = {
          email: profileSettings?.channels?.email ?? userSettings?.channels?.email ?? true,
          sms: profileSettings?.channels?.sms ?? userSettings?.channels?.sms ?? false
        };
        
        const hasAnyEnabled = mergedChannels.email || mergedChannels.sms;
        const enabled = userSettings?.enabled ?? hasAnyEnabled;
        
        setNotifSettings({
          enabled,
          timezone: profileSettings?.timezone || userSettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
          channels: mergedChannels,
          phoneNumber: userSettings?.phoneNumber || profileSnap.data()?.phoneNumber || ''
        });
        
      } catch (error) {
        console.error("Error loading notification settings:", error);
      } finally {
        setNotifLoading(false);
      }
    };
    loadSettings();
  }, [user, db]);

  // Sync notification settings to BOTH locations
  const syncNotificationSettings = async (newSettings) => {
    if (!user || !db) return;
    
    try {
      // 1. Update main user doc (used by cloud functions)
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationSettings: newSettings
      });
      
      // 2. Update leader profile (user preferences)
      const profileRef = doc(db, `user_data/${user.uid}/leader_profile/current`);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        await updateDoc(profileRef, {
          'notificationSettings.channels.email': newSettings.channels.email,
          'notificationSettings.channels.sms': newSettings.channels.sms,
          'notificationSettings.timezone': newSettings.timezone
        });
      }
      
      console.log('[MySettingsWidget] Synced notification settings to both locations');
    } catch (error) {
      console.error("Error syncing notification settings:", error);
    }
  };

  const handleMasterToggle = async (enabled) => {
    setSaving(true);
    
    // When ENABLING: restore user's channel preferences (or default to email if none)
    // When DISABLING: turn off all channels
    const newChannels = enabled 
      ? {
          // If both were off, default to email on
          email: (notifSettings.channels.email || notifSettings.channels.sms) ? notifSettings.channels.email : true,
          sms: notifSettings.channels.sms
        }
      : { email: false, sms: false };
    
    const newSettings = { 
      ...notifSettings, 
      enabled,
      channels: newChannels
    };
    
    setNotifSettings(newSettings);
    await syncNotificationSettings(newSettings);
    setSaving(false);
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
      <Card title="My Settings" icon={Settings} accent="TEAL">
        {/* Settings Rows */}
        <div className="space-y-2">
          {/* Leader Profile Row - Clickable to edit */}
          <button
            onClick={() => setShowProfileForm(true)}
            className="w-full p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between hover:bg-slate-50 hover:border-corporate-teal/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isProfileComplete ? 'bg-green-100' : 'bg-corporate-orange/10'}`}>
                {isProfileComplete ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <User className="w-4 h-4 text-corporate-orange" />
                )}
              </div>
              <div className="text-left">
                <h4 className="font-medium text-corporate-navy text-sm">Leader Profile</h4>
                <p className="text-xs text-slate-500">
                  {isProfileComplete 
                    ? `Welcome, ${profile?.firstName}!` 
                    : 'Tell us about yourself'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-corporate-teal">
              <span className="text-xs font-medium">{isProfileComplete ? 'Edit' : 'Complete'}</span>
              <Edit2 className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Notifications Row - Inline toggle */}
          <div className="w-full p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notifSettings.enabled ? 'bg-green-100' : 'bg-slate-100'}`}>
                <Bell className={`w-4 h-4 ${notifSettings.enabled ? 'text-green-600' : 'text-slate-400'}`} />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-corporate-navy text-sm">Notifications</h4>
                <p className="text-xs text-slate-500">
                  {notifSettings.enabled 
                    ? (() => {
                        const channels = [];
                        if (notifSettings.channels.email) channels.push('Email');
                        if (notifSettings.channels.sms) channels.push('SMS');
                        return channels.length > 0 ? channels.join(' + ') : 'Enabled';
                      })()
                    : 'Disabled'}
                </p>
              </div>
            </div>
            <div 
              onClick={() => !saving && handleMasterToggle(!notifSettings.enabled)}
              className="cursor-pointer"
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
          </div>
        </div>
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
