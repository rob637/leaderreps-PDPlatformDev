import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useProgress, useTheme } from '../App';
import { THEME_OPTIONS } from '../contexts/ThemeContext';
import { getThemeClasses } from '../theme';

// Admin emails that can access dev tools
const ADMIN_EMAILS = ['rob@sagecg.com', 'rob@leaderreps.com'];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, updateProgress, loadProgress } = useProgress();
  const { themePreference, setThemePreference, isDark } = useTheme();
  const theme = getThemeClasses(isDark);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(progress?.profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');
  
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(progress?.settings?.notifications || false);
    }
  }, [progress?.settings?.notifications]);

  // Handle notification toggle
  const handleNotificationToggle = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications');
      return;
    }

    if (Notification.permission === 'denied') {
      alert('Notifications are blocked. Please enable them in your browser settings.');
      return;
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        return;
      }
    }

    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await updateProgress({
      settings: { ...(progress?.settings || {}), notifications: newValue },
    });

    // Show a test notification if enabling
    if (newValue && Notification.permission === 'granted') {
      new Notification('Reppy Reminders Enabled! 🎉', {
        body: "I'll remind you to check in each morning and evening.",
        icon: '/icon-192.png'
      });
    }
  };

  // Handle theme change
  const handleThemeChange = async (newTheme) => {
    setThemePreference(newTheme);
    await updateProgress({
      settings: { ...(progress?.settings || {}), theme: newTheme },
    });
  };

  // Reset user progress (for testing)
  const handleResetProgress = async () => {
    if (!user) return;
    setResetting(true);
    
    try {
      const initialProgress = {
        currentSession: 1,
        completedSessions: [],
        onboardingComplete: false,
        profile: {},
        streakCount: 0,
        lastSessionDate: null,
        totalMinutes: 0,
        createdAt: new Date().toISOString(),
        resetAt: new Date().toISOString(),
      };
      
      const progressRef = doc(db, 'reppy_users', user.uid);
      await setDoc(progressRef, initialProgress);
      await loadProgress(user.uid);
      
      setShowResetConfirm(false);
      navigate('/onboarding');
    } catch (error) {
      console.error('Error resetting progress:', error);
      alert('Error resetting progress: ' + error.message);
    } finally {
      setResetting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/auth');
  };

  const handleSave = async () => {
    setSaving(true);
    await updateProgress({
      profile: { ...progress?.profile, name },
    });
    setSaving(false);
    setIsEditing(false);
  };

  const roleLabels = {
    team_lead: 'Team Lead',
    manager: 'Manager',
    director: 'Director/VP',
    executive: 'Executive',
    aspiring: 'Aspiring Leader',
    entrepreneur: 'Entrepreneur',
  };

  const roleIcons = {
    team_lead: '👥',
    manager: '📊',
    director: '🎯',
    executive: '🏛️',
    aspiring: '🌱',
    entrepreneur: '🚀',
  };

  const challengeLabels = {
    confidence: 'Building Confidence',
    communication: 'Communication',
    difficult_people: 'Difficult Conversations',
    time: 'Time & Priorities',
    delegation: 'Delegation',
    influence: 'Influence',
  };

  const challengeIcons = {
    confidence: '💪',
    communication: '💬',
    difficult_people: '🔥',
    time: '⏰',
    delegation: '🤝',
    influence: '✨',
  };

  // Coaching style options
  const coachingStyleLabels = {
    guide: 'Guide Me',
    coach: 'Coach Me',
    challenge: 'Challenge Me',
  };
  
  const coachingStyleIcons = {
    guide: '🧭',
    coach: '💬',
    challenge: '🔥',
  };
  
  const coachingStyleDescriptions = {
    guide: 'Quick suggestions & examples',
    coach: 'Balanced questions & guidance',
    challenge: 'Deep thinking, maximum growth',
  };

  // Handle coaching style change
  const handleCoachingStyleChange = async (newStyle) => {
    await updateProgress({
      profile: { ...progress?.profile, coachingStyle: newStyle },
    });
  };

  return (
    <div className={`min-h-screen safe-area-top safe-area-bottom relative overflow-hidden page-enter-subtle ${isDark ? 'gradient-focus' : 'theme-bg'}`}>
      {/* Ambient background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 -right-20 w-60 h-60 rounded-full blur-3xl ${
          isDark ? 'bg-gradient-to-br from-indigo-600/30 to-purple-600/20' : 'bg-gradient-to-br from-indigo-400/20 to-purple-400/10'
        }`} />
        <div className={`absolute bottom-40 -left-20 w-48 h-48 rounded-full blur-3xl ${
          isDark ? 'bg-gradient-to-br from-violet-600/20 to-indigo-600/20' : 'bg-gradient-to-br from-violet-400/10 to-indigo-400/10'
        }`} />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-4 pb-8">
        <div className="mb-8">
          <h1 className={`text-xl font-bold ${theme.textPrimary} text-center`}>Profile</h1>
        </div>

        {/* Avatar and name */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <span className="text-4xl">
              {progress?.profile?.name?.[0]?.toUpperCase() || '👤'}
            </span>
          </div>
          
          {isEditing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-glass text-center text-xl font-semibold max-w-xs mx-auto"
              placeholder="Your name"
              autoFocus
            />
          ) : (
            <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>
              {progress?.profile?.name || 'Leader'}
            </h2>
          )}
          <p className={`text-sm mt-1 ${theme.textMuted}`}>{user?.email}</p>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 pb-24">
        {/* Edit/Save button */}
        <div className="flex justify-center mb-6">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={() => { setIsEditing(false); setName(progress?.profile?.name || ''); }}
                className="btn-glass px-6"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary px-6"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-glass px-6"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Profile info */}
        <div className="glass-card p-6 mb-6">
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
            <span>📋</span> About You
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${theme.textMuted}`}>Role</span>
              <div className="flex items-center gap-2">
                <span>{roleIcons[progress?.profile?.role] || '👤'}</span>
                <span className={`font-medium ${theme.textPrimary}`}>
                  {roleLabels[progress?.profile?.role] || 'Not set'}
                </span>
              </div>
            </div>
            
            <div className={`h-px ${theme.divider}`} />
            
            <div className="flex items-center justify-between">
              <span className={`text-sm ${theme.textMuted}`}>Challenge</span>
              <div className="flex items-center gap-2">
                <span>{challengeIcons[progress?.profile?.challenge] || '🎯'}</span>
                <span className={`font-medium ${theme.textPrimary}`}>
                  {challengeLabels[progress?.profile?.challenge] || 'Not set'}
                </span>
              </div>
            </div>
            
            <div className={`h-px ${theme.divider}`} />
            
            <div>
              <span className={`text-sm block mb-2 ${theme.textMuted}`}>
                🌟 Leadership Vision
              </span>
              <p className={`text-sm leading-relaxed italic ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                "{progress?.profile?.goal || 'No goal set yet'}"
              </p>
            </div>
          </div>
        </div>

        {/* Coaching Style */}
        <div className="glass-card p-6 mb-6">
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
            <span>🎯</span> Coaching Style
          </h3>
          
          <p className={`text-xs mb-4 ${theme.textMuted}`}>
            How do you want Reppy to coach you?
          </p>
          
          <div className="space-y-2">
            {['guide', 'coach', 'challenge'].map((style) => {
              const isSelected = (progress?.profile?.coachingStyle || 'challenge') === style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => handleCoachingStyleChange(style)}
                  className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                    isSelected
                      ? isDark 
                        ? 'bg-blue-600/30 border border-blue-500' 
                        : 'bg-blue-50 border border-blue-300'
                      : isDark 
                        ? 'bg-gray-800 border border-gray-700 hover:bg-gray-700' 
                        : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">{coachingStyleIcons[style]}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${theme.textPrimary}`}>
                        {coachingStyleLabels[style]}
                      </span>
                      {style === 'coach' && !isSelected && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-blue-600/50 text-blue-200' : 'bg-blue-100 text-blue-600'}`}>
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${theme.textMuted}`}>
                      {coachingStyleDescriptions[style]}
                    </p>
                  </div>
                  {isSelected && (
                    <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="glass-card p-6 mb-6">
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
            <span>📊</span> Your Journey
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${theme.textPrimary}`}>
                {progress?.completedSessions?.length || 0}
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">
                {progress?.streakCount || 0}
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Day Streak</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${theme.textPrimary}`}>
                {progress?.totalMinutes || 0}
              </div>
              <div className={`text-xs ${theme.textMuted}`}>Minutes</div>
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="glass-card p-6 mb-6">
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
            <span>🔔</span> Reminders
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium text-sm ${theme.textPrimary}`}>
                  Daily Reminders
                </p>
                <p className={`text-xs ${theme.textMuted}`}>
                  Get reminded to check in
                </p>
              </div>
              <button
                type="button"
                onClick={handleNotificationToggle}
                aria-label={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
                className={`w-12 h-7 rounded-full transition-all relative ${
                  notificationsEnabled 
                    ? 'bg-blue-600' 
                    : isDark ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              >
                <span 
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
                    notificationsEnabled ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
            
            {notificationPermission === 'denied' && (
              <p className="text-xs text-amber-400 bg-amber-500/10 p-2 rounded-lg">
                ⚠️ Notifications blocked. Enable in browser settings.
              </p>
            )}
            
            {notificationsEnabled && notificationPermission === 'granted' && (
              <p className={`text-xs ${theme.textFaint}`}>
                ✅ You'll get reminders at 7am and 7pm
              </p>
            )}
          </div>
        </div>

        {/* About Reppy */}
        <div className="glass-card p-6 mb-6">
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
            <span>ℹ️</span> About Reppy
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className={theme.textMuted}>Version</span>
              <span className={theme.textPrimary}>2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className={theme.textMuted}>Made by</span>
              <span className={theme.textPrimary}>LeaderReps</span>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="glass-card p-6 mb-6">
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${theme.textPrimary}`}>
            <span>🎨</span> Appearance
          </h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Auto */}
              <button
                type="button"
                onClick={() => handleThemeChange('auto')}
                className={`p-3 rounded-xl text-center transition-all ${
                  themePreference === 'auto'
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white ring-2 ring-white/30'
                    : isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <span className="text-xl block mb-1">🌓</span>
                <span className="text-xs font-medium">Auto</span>
              </button>
              
              {/* Light */}
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-xl text-center transition-all ${
                  themePreference === 'light'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white ring-2 ring-white/30'
                    : isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <span className="text-xl block mb-1">☀️</span>
                <span className="text-xs font-medium">Light</span>
              </button>
              
              {/* Dark */}
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-xl text-center transition-all ${
                  themePreference === 'dark'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white ring-2 ring-white/30'
                    : isDark 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <span className="text-xl block mb-1">🌙</span>
                <span className="text-xs font-medium">Dark</span>
              </button>
            </div>
            
            <p className={`text-xs text-center ${theme.textMuted}`}>
              {themePreference === 'auto' 
                ? '☀️ Light during day (6am-6pm), 🌙 dark at night'
                : themePreference === 'light'
                  ? 'Always use light theme'
                  : 'Always use dark theme'
              }
            </p>
          </div>
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 font-medium hover:bg-rose-500/20 transition-colors"
        >
          Sign Out
        </button>

        {/* Version info */}
        <p className={`text-center text-xs ${theme.textMuted} mt-6`}>
          Reppy v1.0.0 • Made with ❤️ by LeaderReps
        </p>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 animate-fade-in">
          <div className="glass-card p-8 max-w-sm w-full animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <span className="text-3xl">🔄</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Reset Progress?</h2>
              <p className="text-gray-400 text-sm">
                This will clear all your sessions, streaks, and profile data. You'll go through onboarding again.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleResetProgress}
                disabled={resetting}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Everything'}
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="w-full btn-glass"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
