import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth, useProgress, useTheme } from '../App';
import { THEME_OPTIONS } from '../contexts/ThemeContext';

// Admin emails that can access dev tools
const ADMIN_EMAILS = ['rob@sagecg.com', 'rob@leaderreps.com'];

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, updateProgress, loadProgress } = useProgress();
  const { themePreference, setThemePreference, activeTheme, isDark } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(progress?.profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());

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

  return (
    <div className={`min-h-screen safe-area-top safe-area-bottom relative overflow-hidden ${isDark ? 'gradient-focus' : 'theme-bg'}`}>
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
      <div className="relative z-10 px-6 pt-6 pb-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-black/5'}`}
          >
            <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Profile</h1>
          <div className="w-10" />
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
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {progress?.profile?.name || 'Leader'}
            </h2>
          )}
          <p className={`text-sm mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{user?.email}</p>
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
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <span>📋</span> About You
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Role</span>
              <div className="flex items-center gap-2">
                <span>{roleIcons[progress?.profile?.role] || '👤'}</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {roleLabels[progress?.profile?.role] || 'Not set'}
                </span>
              </div>
            </div>
            
            <div className={`h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Challenge</span>
              <div className="flex items-center gap-2">
                <span>{challengeIcons[progress?.profile?.challenge] || '🎯'}</span>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {challengeLabels[progress?.profile?.challenge] || 'Not set'}
                </span>
              </div>
            </div>
            
            <div className={`h-px ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
            
            <div>
              <span className={`text-sm block mb-2 ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Goal</span>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                {progress?.profile?.goal || 'No goal set yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="glass-card p-6 mb-6">
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <span>📊</span> Your Journey
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {progress?.completedSessions?.length || 0}
              </div>
              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">
                {progress?.streakCount || 0}
              </div>
              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Day Streak</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {progress?.totalMinutes || 0}
              </div>
              <div className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Minutes</div>
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="glass-card p-6 mb-6">
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <span>ℹ️</span> About Reppy
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-white/50' : 'text-slate-500'}>Version</span>
              <span className={isDark ? 'text-white' : 'text-slate-800'}>2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-white/50' : 'text-slate-500'}>Made by</span>
              <span className={isDark ? 'text-white' : 'text-slate-800'}>LeaderReps</span>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="glass-card p-6 mb-6">
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
            <span>🎨</span> Appearance
          </h3>
          
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {/* Auto */}
              <button
                onClick={() => handleThemeChange('auto')}
                className={`p-3 rounded-xl text-center transition-all ${
                  themePreference === 'auto'
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white ring-2 ring-white/30'
                    : isDark 
                      ? 'bg-white/10 text-white/70 hover:bg-white/20' 
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <span className="text-xl block mb-1">🌓</span>
                <span className="text-xs font-medium">Auto</span>
              </button>
              
              {/* Light */}
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-3 rounded-xl text-center transition-all ${
                  themePreference === 'light'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white ring-2 ring-white/30'
                    : isDark 
                      ? 'bg-white/10 text-white/70 hover:bg-white/20' 
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <span className="text-xl block mb-1">☀️</span>
                <span className="text-xs font-medium">Light</span>
              </button>
              
              {/* Dark */}
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-3 rounded-xl text-center transition-all ${
                  themePreference === 'dark'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white ring-2 ring-white/30'
                    : isDark 
                      ? 'bg-white/10 text-white/70 hover:bg-white/20' 
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <span className="text-xl block mb-1">🌙</span>
                <span className="text-xs font-medium">Dark</span>
              </button>
            </div>
            
            <p className={`text-xs text-center ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
              {themePreference === 'auto' 
                ? '☀️ Light during day (6am-6pm), 🌙 dark at night'
                : themePreference === 'light'
                  ? 'Always use light theme'
                  : 'Always use dark theme'
              }
            </p>
          </div>
        </div>

        {/* Admin/Dev Tools - only for admin emails */}
        {isAdmin && (
          <div className="glass-card p-6 mb-6 border border-amber-500/30">
            <h3 className="font-semibold text-amber-400 mb-4 flex items-center gap-2">
              <span>🛠️</span> Dev Tools
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full p-3 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-medium flex items-center justify-center gap-2"
              >
                <span>🔄</span> Reset My Progress
              </button>
              
              <p className="text-xs text-white/40 text-center">
                Clears all progress and restarts onboarding. Great for testing!
              </p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 font-medium"
        >
          Sign Out
        </button>
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
              <p className="text-white/60 text-sm">
                This will clear all your sessions, streaks, and profile data. You'll go through onboarding again.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleResetProgress}
                disabled={resetting}
                className="w-full p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset Everything'}
              </button>
              <button
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
