import React, { useState, useEffect } from 'react';
import { 
  Settings, User, Bell, CheckCircle, Edit2, Zap, Mail, Smartphone, VolumeX, Shield,
  Download, LogOut, AlertTriangle, Sun, Moon, Monitor, ChevronRight, KeyRound
} from 'lucide-react';
import { Card } from '../ui';
import { useLeaderProfile } from '../../hooks/useLeaderProfile';
import { useAppServices } from '../../services/useAppServices';
import { useTheme } from '../../providers/ThemeProvider';
import LeaderProfileFormSimple from '../profile/LeaderProfileFormSimple';
import NotificationPreferencesWidget from './NotificationPreferencesWidget';
import PWAInstall from '../ui/PWAInstall';
import { doc, getDoc } from 'firebase/firestore';

// Strategy display names and icons
const STRATEGY_DISPLAY = {
  smart_escalation: { name: 'Smart Escalation', icon: Zap, color: 'text-corporate-teal' },
  push_only: { name: 'Push Only', icon: Smartphone, color: 'text-blue-500' },
  email_only: { name: 'Email Only', icon: Mail, color: 'text-amber-500' },
  full_accountability: { name: 'Full Accountability', icon: Shield, color: 'text-green-500' },
  disabled: { name: 'Off', icon: VolumeX, color: 'text-slate-400' }
};

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
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  
  // Profile data
  const { profile, loading: profileLoading, isComplete: profileComplete } = useLeaderProfile();
  
  // Theme
  const { theme, setTheme } = useTheme();
  
  // Use stored isComplete flag - profile is complete once user saves it
  const isProfileComplete = profileComplete;
  
  // Notification settings
  const { user, db, logout, navigate } = useAppServices();
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSettings, setNotifSettings] = useState({
    enabled: true,
    strategy: 'smart_escalation',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
    channels: {
      push: true,
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
        
        // Merge settings, prefer user doc
        const mergedChannels = {
          push: userSettings?.channels?.push ?? true,
          email: userSettings?.channels?.email ?? profileSettings?.channels?.email ?? true,
          sms: userSettings?.channels?.sms ?? profileSettings?.channels?.sms ?? false
        };
        
        // Determine strategy - default to smart_escalation
        let strategy = userSettings?.strategy || profileSettings?.strategy || 'smart_escalation';
        const enabled = userSettings?.enabled ?? true;
        
        // If disabled, set strategy accordingly
        if (!enabled) {
          strategy = 'disabled';
        }
        
        setNotifSettings({
          enabled,
          strategy,
          timezone: userSettings?.timezone || profileSettings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
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
  }, [user, db, showNotificationSettings]); // Re-load when settings modal closes

  const loading = profileLoading || notifLoading;

  if (loading) {
    return (
      <Card accent="TEAL" className="animate-pulse">
        <div className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg" />
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
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-corporate-teal/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isProfileComplete ? 'bg-green-100 dark:bg-green-900/40' : 'bg-corporate-orange/10 dark:bg-corporate-orange/20'}`}>
                {isProfileComplete ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <User className="w-4 h-4 text-corporate-orange" />
                )}
              </div>
              <div className="text-left">
                <h4 className="font-medium text-corporate-navy dark:text-white text-sm">Leader Profile</h4>
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

          {/* Notifications Row - Clickable to open settings */}
          <button
            onClick={() => setShowNotificationSettings(true)}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-corporate-teal/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${notifSettings.strategy !== 'disabled' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                {(() => {
                  const strategyInfo = STRATEGY_DISPLAY[notifSettings.strategy] || STRATEGY_DISPLAY.smart_escalation;
                  const Icon = strategyInfo.icon;
                  return <Icon className={`w-4 h-4 ${notifSettings.strategy !== 'disabled' ? 'text-green-600' : 'text-slate-400'}`} />;
                })()}
              </div>
              <div className="text-left">
                <h4 className="font-medium text-corporate-navy dark:text-white text-sm">Notifications</h4>
                <p className="text-xs text-slate-500">
                  {STRATEGY_DISPLAY[notifSettings.strategy]?.name || 'Smart Escalation'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-corporate-teal">
              <span className="text-xs font-medium">Edit</span>
              <Edit2 className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Appearance / Theme Row - Visible on all devices */}
          <div className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/40">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                ) : theme === 'light' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Monitor className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                )}
              </div>
              <div className="text-left">
                <h4 className="font-medium text-corporate-navy dark:text-white text-sm">Appearance</h4>
              </div>
            </div>
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'system', icon: Monitor, label: 'System' },
                { value: 'dark', icon: Moon, label: 'Dark' },
              ].map(({ value, icon: ThemeIcon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`p-1.5 rounded-md transition-all duration-200 ${
                    theme === value
                      ? 'bg-white dark:bg-slate-600 shadow-sm text-corporate-navy dark:text-white'
                      : 'bg-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                  title={label}
                  aria-label={`${label} theme`}
                >
                  <ThemeIcon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Install App & Sign Out - Mobile Only (hidden on desktop since they're in the sidebar) */}
          <div className="md:hidden space-y-2">
            {/* Install App Row - Uses PWAInstall component (only shows if not installed) */}
            <div className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-corporate-teal/10">
                  <Download className="w-4 h-4 text-corporate-teal" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-corporate-navy dark:text-white text-sm">Install App</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add to home screen</p>
                </div>
              </div>
              <PWAInstall collapsed={true} />
            </div>

            {/* Account & Security Row */}
            <button
              onClick={() => navigate('app-settings')}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-corporate-teal/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                  <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-corporate-navy dark:text-white text-sm">Account & Security</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Password, notifications, integrations</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Sign Out Row */}
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700">
                  <LogOut className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-corporate-navy dark:text-white text-sm">Sign Out</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Exit the app</p>
                </div>
              </div>
            </button>
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

      {/* Notification Settings Modal */}
      {showNotificationSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <NotificationPreferencesWidget 
              onClose={() => setShowNotificationSettings(false)}
            />
          </div>
        </div>
      )}

      {/* Sign Out Confirmation Dialog */}
      {showSignOutConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999]" 
            onClick={() => setShowSignOutConfirm(false)} 
          />
          <div className="fixed inset-0 flex items-center justify-center z-[10000] p-4">
            <div 
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-100 dark:border-slate-700"
              style={{ fontFamily: 'var(--font-body)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-lg text-slate-800 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                  Sign Out?
                </h3>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-6">
                Are you sure you want to sign out of LeaderReps?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSignOutConfirm(false);
                    if (logout) logout();
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-corporate-navy hover:bg-corporate-navy/90 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default MySettingsWidget;
