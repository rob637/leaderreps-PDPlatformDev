import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Bell, CheckCircle, Edit2
} from 'lucide-react';
import { Card } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import { useAppServices } from '../../services/useAppServices';
import LeaderProfileFormSimple from '../profile/LeaderProfileFormSimple';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

/**
 * MySettingsWidget - Unified settings widget for the Locker
 * Combines Leader Profile and Notification toggle in an expandable panel
 */
const MySettingsWidget = () => {
  const [showProfileForm, setShowProfileForm] = useState(false);
  
  // Profile data
  const { profile, loading: profileLoading, isComplete: profileComplete, completionPercentage } = useLeaderProfile();
  
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
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        notificationSettings: newSettings
      });
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
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${profileComplete ? 'bg-green-100' : 'bg-corporate-orange/10'}`}>
                {profileComplete ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <User className="w-4 h-4 text-corporate-orange" />
                )}
              </div>
              <div className="text-left">
                <h4 className="font-medium text-corporate-navy text-sm">Leader Profile</h4>
                <p className="text-xs text-slate-500">
                  {profileComplete 
                    ? `Welcome, ${profile?.firstName}!` 
                    : `${completionPercentage}% complete`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-corporate-teal">
              <span className="text-xs font-medium">{profileComplete ? 'Edit' : 'Complete'}</span>
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
                    ? `${notifSettings.channels.email ? 'Email' : ''}${notifSettings.channels.email && notifSettings.channels.sms ? ' + ' : ''}${notifSettings.channels.sms ? 'SMS' : ''} enabled`
                    : 'Disabled'}
                </p>
              </div>
            </div>
            <div 
              onClick={() => handleMasterToggle(!notifSettings.enabled)}
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
