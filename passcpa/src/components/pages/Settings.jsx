import { useState } from 'react';
import { 
  User, 
  Bell, 
  Moon, 
  Sun,
  Target,
  Calendar,
  BookOpen,
  Shield,
  LogOut,
  ChevronRight,
  Loader2,
  Check
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { CPA_SECTIONS, DAILY_GOAL_PRESETS } from '../../config/examConfig';
import clsx from 'clsx';

const Settings = () => {
  const { user, userProfile, signOut, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [examSection, setExamSection] = useState(userProfile?.examSection || 'REG');
  const [dailyGoal, setDailyGoal] = useState(userProfile?.dailyGoal || 50);
  const [examDate, setExamDate] = useState(
    userProfile?.examDate?.toDate?.()?.toISOString().split('T')[0] || ''
  );
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklyReport: true,
    streakReminder: true,
    newContent: false
  });
  const [darkMode, setDarkMode] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName,
        examSection,
        dailyGoal,
        examDate: examDate ? new Date(examDate) : null
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'study', label: 'Study Plan', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'account', label: 'Account', icon: Shield },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Settings</h1>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="md:w-56 flex-shrink-0">
          <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors whitespace-nowrap",
                  activeTab === tab.id
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="card">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="card-body space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Profile Information</h2>
                  
                  {/* Avatar */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                      {userProfile?.photoURL ? (
                        <img 
                          src={userProfile.photoURL} 
                          alt="" 
                          className="w-16 h-16 rounded-full"
                        />
                      ) : (
                        <span className="text-2xl font-bold text-primary-600">
                          {displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <button className="btn-secondary text-sm">
                      Change Photo
                    </button>
                  </div>

                  {/* Name */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Study Plan Tab */}
            {activeTab === 'study' && (
              <div className="card-body space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Study Plan Settings</h2>

                  {/* Exam Section */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Current Exam Section
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {Object.entries(CPA_SECTIONS).map(([key, section]) => (
                        <button
                          key={key}
                          onClick={() => setExamSection(key)}
                          className={clsx(
                            "p-3 rounded-xl border-2 text-left transition-all",
                            examSection === key 
                              ? "border-primary-500 bg-primary-50"
                              : "border-slate-200 hover:border-primary-300"
                          )}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs mb-2"
                            style={{ backgroundColor: section.color }}
                          >
                            {section.shortName}
                          </div>
                          <div className="text-sm font-medium text-slate-900">
                            {section.shortName}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exam Date */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Target Exam Date
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Daily Goal */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Daily Point Goal
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {DAILY_GOAL_PRESETS.map((preset) => (
                        <button
                          key={preset.points}
                          onClick={() => setDailyGoal(preset.points)}
                          className={clsx(
                            "p-3 rounded-xl border-2 text-center transition-all",
                            dailyGoal === preset.points 
                              ? "border-primary-500 bg-primary-50"
                              : "border-slate-200 hover:border-primary-300"
                          )}
                        >
                          <div className="text-xl font-bold text-slate-900">{preset.points}</div>
                          <div className="text-xs text-slate-500">{preset.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="card-body space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Notification Preferences</h2>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'dailyReminder', label: 'Daily Study Reminder', desc: 'Get reminded to study each day' },
                      { key: 'weeklyReport', label: 'Weekly Progress Report', desc: 'Receive a summary of your progress' },
                      { key: 'streakReminder', label: 'Streak at Risk Alert', desc: 'Warning when you might lose your streak' },
                      { key: 'newContent', label: 'New Content Updates', desc: 'Be notified when new lessons are added' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                          <div className="font-medium text-slate-900">{item.label}</div>
                          <div className="text-sm text-slate-500">{item.desc}</div>
                        </div>
                        <button
                          onClick={() => setNotifications(prev => ({ 
                            ...prev, 
                            [item.key]: !prev[item.key] 
                          }))}
                          className={clsx(
                            "w-12 h-6 rounded-full transition-colors relative",
                            notifications[item.key] ? "bg-primary-500" : "bg-slate-300"
                          )}
                        >
                          <div className={clsx(
                            "w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow",
                            notifications[item.key] ? "translate-x-6" : "translate-x-0.5"
                          )} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Appearance */}
                <div className="pt-6 border-t border-slate-200">
                  <h3 className="font-medium text-slate-900 mb-4">Appearance</h3>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      {darkMode ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
                      <div>
                        <div className="font-medium text-slate-900">Dark Mode</div>
                        <div className="text-sm text-slate-500">Coming soon</div>
                      </div>
                    </div>
                    <button
                      disabled
                      className="w-12 h-6 rounded-full bg-slate-200 relative opacity-50 cursor-not-allowed"
                    >
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 translate-x-0.5 shadow" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="card-body space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Account Settings</h2>

                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-slate-600" />
                        <span className="font-medium text-slate-900">Change Password</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-slate-600" />
                        <span className="font-medium text-slate-900">Export Study Data</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-6 border-t border-slate-200">
                  <h3 className="font-medium text-red-600 mb-4">Danger Zone</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={signOut}
                      className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <LogOut className="w-5 h-5 text-slate-600" />
                        <span className="font-medium text-slate-900">Sign Out</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>

                    <button className="w-full flex items-center justify-between p-4 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
                      <div className="flex items-center gap-3 text-red-600">
                        <Shield className="w-5 h-5" />
                        <span className="font-medium">Delete Account</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            {(activeTab === 'profile' || activeTab === 'study') && (
              <div className="card-footer flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
