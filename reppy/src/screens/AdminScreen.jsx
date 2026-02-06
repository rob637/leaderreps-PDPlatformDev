import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase';
import { useAuth, useTheme, useProgress } from '../App';
import { FOCUSES } from '../data/focuses';
import { DETAILED_FOCUSES, SESSION_TYPES } from '../data/curriculumDetailed';
import { getTodayKey } from '../data/dailyTouchpoints';

// Seed admin emails (can bootstrap first admin, then use toggle for others)
const SEED_ADMIN_EMAILS = ['rob@sagecg.com', 'rob@leaderreps.com'];

export default function AdminScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { progress } = useProgress();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent, name, sessions, streak
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, onboarding, inactive
  
  // Invite user state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteIsAdmin, setInviteIsAdmin] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(null);
  
  // Curriculum editing state
  const [expandedFocus, setExpandedFocus] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [customCurriculum, setCustomCurriculum] = useState(null);
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  
  // Check admin status - seed emails OR profile.isAdmin flag
  const isAdmin = (user?.email && SEED_ADMIN_EMAILS.includes(user.email.toLowerCase())) || progress?.profile?.isAdmin === true;

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  // Load users
  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadCustomCurriculum();
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'reppy_users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomCurriculum = async () => {
    try {
      const curriculumRef = doc(db, 'reppy_config', 'curriculum');
      const snapshot = await getDoc(curriculumRef);
      if (snapshot.exists()) {
        setCustomCurriculum(snapshot.data().focuses || null);
      }
    } catch (error) {
      console.error('Error loading custom curriculum:', error);
    }
  };

  const saveCurriculumToFirestore = async (updatedFocuses) => {
    setSavingCurriculum(true);
    try {
      const curriculumRef = doc(db, 'reppy_config', 'curriculum');
      await setDoc(curriculumRef, {
        focuses: updatedFocuses,
        updatedAt: new Date().toISOString(),
        updatedBy: user.email,
      });
      setCustomCurriculum(updatedFocuses);
      alert('✅ Curriculum saved successfully!');
    } catch (error) {
      console.error('Error saving curriculum:', error);
      alert('Error saving: ' + error.message);
    } finally {
      setSavingCurriculum(false);
    }
  };

  const getActiveCurriculum = () => {
    return customCurriculum || DETAILED_FOCUSES;
  };

  const resetUserProgress = async (userId) => {
    setResettingUser(userId);
    try {
      const initialProgress = {
        currentSession: 1,
        completedSessions: [],
        onboardingComplete: false,
        profile: {},
        streakCount: 0,
        lastSessionDate: null,
        totalMinutes: 0,
        dailyTouchpoints: {},
        totalMorningSessions: 0,
        totalEveningSessions: 0,
        createdAt: new Date().toISOString(),
        resetAt: new Date().toISOString(),
        resetBy: user.email,
      };
      
      await setDoc(doc(db, 'reppy_users', userId), initialProgress);
      await loadUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error resetting user:', error);
      alert('Error: ' + error.message);
    } finally {
      setResettingUser(null);
    }
  };

  // Skip to next day (for testing) - clears today's dailyTouchpoints
  const skipToNextDay = async (userId) => {
    try {
      const userRef = doc(db, 'reppy_users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      const todayKey = getTodayKey();
      
      // Remove today's touchpoints so they can start fresh
      const { [todayKey]: _removed, ...remainingTouchpoints } = userData.dailyTouchpoints || {};
      
      await setDoc(userRef, {
        ...userData,
        dailyTouchpoints: remainingTouchpoints,
        // Optionally adjust streak to simulate day passing
        lastSessionDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      });
      
      await loadUsers();
      
      // If clearing your own progress, reload the page to refresh local state
      if (userId === user.uid) {
        alert('✅ Daily progress cleared! Page will reload...');
        window.location.reload();
      } else {
        alert('✅ Daily progress cleared for this user!');
      }
    } catch (error) {
      console.error('Error skipping day:', error);
      alert('Error: ' + error.message);
    }
  };

  // Enable test mode (unlocks all sessions regardless of time)
  const enableTestMode = async (userId) => {
    try {
      const userRef = doc(db, 'reppy_users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      
      await setDoc(userRef, {
        ...userData,
        testMode: true,
        testModeEnabledAt: new Date().toISOString(),
        testModeEnabledBy: user.email,
      });
      
      await loadUsers();
      alert('✅ Test Mode enabled! All time restrictions removed for this user.');
    } catch (error) {
      console.error('Error enabling test mode:', error);
      alert('Error: ' + error.message);
    }
  };

  const disableTestMode = async (userId) => {
    try {
      const userRef = doc(db, 'reppy_users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      
      await setDoc(userRef, {
        ...userData,
        testMode: false,
      });
      
      await loadUsers();
      alert('✅ Test Mode disabled. Normal time restrictions restored.');
    } catch (error) {
      console.error('Error disabling test mode:', error);
      alert('Error: ' + error.message);
    }
  };

  // Toggle admin status for a user
  const toggleAdminStatus = async (userId, currentIsAdmin) => {
    const newIsAdmin = !currentIsAdmin;
    const action = newIsAdmin ? 'grant admin access to' : 'remove admin access from';
    
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    try {
      const userRef = doc(db, 'reppy_users', userId);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      
      await setDoc(userRef, {
        ...userData,
        profile: {
          ...(userData.profile || {}),
          isAdmin: newIsAdmin,
          adminChangedAt: new Date().toISOString(),
          adminChangedBy: user.email,
        }
      });
      
      await loadUsers();
      alert(newIsAdmin 
        ? '✅ Admin access granted! User can now access admin features.' 
        : '✅ Admin access removed. User is now a regular user.');
    } catch (error) {
      console.error('Error toggling admin status:', error);
      alert('Error: ' + error.message);
    }
  };

  // Send invite to new user via Cloud Function (sends email)
  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      alert('Please enter an email address');
      return;
    }
    
    setSendingInvite(true);
    setInviteSuccess(null);
    
    try {
      // Call the Cloud Function to create invite and send email
      const sendReppyInvite = httpsCallable(functions, 'sendReppyInvite');
      const result = await sendReppyInvite({
        email: inviteEmail.trim(),
        name: inviteName.trim() || null,
        isAdmin: inviteIsAdmin
      });
      
      if (result.data.success) {
        setInviteSuccess({
          email: inviteEmail,
          emailSent: result.data.emailSent,
          message: result.data.message
        });
        
        setInviteEmail('');
        setInviteName('');
        setInviteIsAdmin(false);
      }
    } catch (error) {
      console.error('Error creating invite:', error);
      alert('Error: ' + (error.message || 'Failed to send invite'));
    } finally {
      setSendingInvite(false);
    }
  };

  // Filter and sort users
  const filteredUsers = users
    .filter(u => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (u.profile?.name?.toLowerCase().includes(searchLower)) ||
        (u.id.toLowerCase().includes(searchLower));
      
      // Status filter
      const isActive = u.onboardingComplete;
      const isInactive = u.lastSessionDate && 
        (Date.now() - new Date(u.lastSessionDate).getTime()) > 7 * 24 * 60 * 60 * 1000;
      
      if (filterStatus === 'active') return matchesSearch && isActive && !isInactive;
      if (filterStatus === 'onboarding') return matchesSearch && !isActive;
      if (filterStatus === 'inactive') return matchesSearch && isInactive;
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.profile?.name || 'ZZZ').localeCompare(b.profile?.name || 'ZZZ');
        case 'sessions':
          return (b.completedSessions?.length || 0) - (a.completedSessions?.length || 0);
        case 'streak':
          return (b.streakCount || 0) - (a.streakCount || 0);
        case 'recent':
        default:
          return new Date(b.lastSessionDate || 0) - new Date(a.lastSessionDate || 0);
      }
    });

  // Get user engagement status
  const getUserStatus = (u) => {
    if (!u.onboardingComplete) return { label: 'Onboarding', color: 'amber' };
    
    const lastSession = u.lastSessionDate ? new Date(u.lastSessionDate) : null;
    if (!lastSession) return { label: 'Never Active', color: 'red' };
    
    const daysSince = Math.floor((Date.now() - lastSession.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysSince === 0) return { label: 'Today', color: 'emerald' };
    if (daysSince === 1) return { label: 'Yesterday', color: 'emerald' };
    if (daysSince <= 3) return { label: `${daysSince}d ago`, color: 'teal' };
    if (daysSince <= 7) return { label: `${daysSince}d ago`, color: 'yellow' };
    return { label: `${daysSince}d ago`, color: 'red' };
  };

  // Get today's touchpoint status for a user
  const getTodayTouchpoints = (u) => {
    const todayKey = getTodayKey();
    const today = u.dailyTouchpoints?.[todayKey] || {};
    return {
      morning: !!today.morning,
      growth: !!today.growth,
      evening: !!today.evening,
      count: (today.morning ? 1 : 0) + (today.growth ? 1 : 0) + (today.evening ? 1 : 0),
    };
  };

  if (!isAdmin) return null;

  // Theme-aware classes - Professional Google-style
  const textPrimary = isDark ? 'text-white' : 'text-gray-900';
  const textSecondary = isDark ? 'text-gray-300' : 'text-gray-600';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const bgCard = isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm';
  const bgInput = isDark ? 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-500' : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400';

  return (
    <div className={`min-h-screen safe-area-top safe-area-bottom ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="relative z-10 px-6 pt-4 pb-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h1 className={`text-xl font-bold ${textPrimary} flex items-center gap-2`}>
            <span>🛠️</span> Admin
          </h1>
          <button
            onClick={loadUsers}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
          >
            <svg className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'users', label: 'Users', icon: '👥' },
            { id: 'curriculum', label: 'Curriculum', icon: '📚' },
            { id: 'stats', label: 'Stats', icon: '📊' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : isDark ? 'bg-gray-800 border border-gray-700 text-gray-300' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              <span className="mr-1">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 pb-24 overflow-y-auto" style={{ height: 'calc(100vh - 160px)' }}>
        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Invite Button */}
            <button
              onClick={() => setShowInviteModal(true)}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite New User
            </button>
            
            {/* Search and Filters */}
            <div className="space-y-3">
              {/* Search */}
              <div className="relative">
                <svg className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all ${bgInput}`}
                />
              </div>
              
              {/* Filter pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: '✓ Active' },
                  { id: 'onboarding', label: '⏳ Onboarding' },
                  { id: 'inactive', label: '💤 Inactive' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setFilterStatus(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                      filterStatus === filter.id
                        ? 'bg-blue-600 text-white'
                        : isDark ? 'bg-gray-800 border border-gray-700 text-gray-300' : 'bg-white border border-gray-200 text-gray-600'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              
              {/* Sort */}
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${textSecondary}`}>
                  {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`text-sm font-medium rounded-lg px-3 py-2 border-2 focus:border-blue-500 focus:outline-none ${bgInput}`}
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name A-Z</option>
                  <option value="sessions">Most Sessions</option>
                  <option value="streak">Best Streak</option>
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className={textMuted}>Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🔍</p>
                <p className={textMuted}>No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map(u => {
                  const status = getUserStatus(u);
                  const todayTouchpoints = getTodayTouchpoints(u);
                  
                  return (
                    <div key={u.id} className={`rounded-xl p-4 ${bgCard}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              u.profile?.isAdmin ? 'bg-red-600' : 'bg-blue-600'
                            }`}>
                              <span className="text-xl text-white font-bold">
                                {u.profile?.name?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className={`font-semibold ${textPrimary} truncate`}>
                                  {u.profile?.name || 'Unknown'}
                                </h3>
                                {u.profile?.isAdmin && (
                                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">
                                    ADMIN
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${textMuted} truncate`}>
                                {u.profile?.role ? u.profile.role.replace('_', ' ') : 'No role set'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Quick stats row */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {/* Status badge */}
                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                              status.color === 'emerald' ? 'bg-green-100 text-green-700' :
                              status.color === 'teal' ? 'bg-teal-100 text-teal-700' :
                              status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                              status.color === 'amber' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {status.label}
                            </span>
                            
                            {/* Sessions count */}
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              📚 {u.completedSessions?.length || 0}
                            </span>
                            
                            {/* Streak */}
                            {(u.streakCount || 0) > 0 && (
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                🔥 {u.streakCount}
                              </span>
                            )}
                            
                            {/* Today's touchpoints */}
                            {u.onboardingComplete && todayTouchpoints.count > 0 && (
                              <span className="px-2 py-1 bg-blue-100 rounded-lg text-xs text-blue-700 font-semibold">
                                Today: {todayTouchpoints.count}/3
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setSelectedUser(selectedUser === u.id ? null : u.id)}
                          className={`p-2 rounded-lg ml-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                        >
                          <svg className={`w-4 h-4 transition-transform ${selectedUser === u.id ? 'rotate-180' : ''} ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Expanded user details */}
                      {selectedUser === u.id && (
                        <div className={`mt-4 pt-4 space-y-4 ${isDark ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
                          {/* Profile details */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className={`text-xs font-medium ${textMuted}`}>Role</p>
                              <p className={`font-medium ${textPrimary}`}>{u.profile?.role?.replace('_', ' ') || 'Not set'}</p>
                            </div>
                            <div>
                              <p className={`text-xs font-medium ${textMuted}`}>Challenge</p>
                              <p className={`font-medium ${textPrimary}`}>{u.profile?.challenge?.replace('_', ' ') || 'Not set'}</p>
                            </div>
                            <div>
                              <p className={`text-xs font-medium ${textMuted}`}>Joined</p>
                              <p className={`font-medium ${textPrimary}`}>
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs font-medium ${textMuted}`}>Last Active</p>
                              <p className={`font-medium ${textPrimary}`}>
                                {u.lastSessionDate ? new Date(u.lastSessionDate).toLocaleDateString() : 'Never'}
                              </p>
                            </div>
                            <div>
                              <p className={`text-xs font-medium ${textMuted}`}>Total Minutes</p>
                              <p className={`font-medium ${textPrimary}`}>{u.totalMinutes || 0} min</p>
                            </div>
                            <div>
                              <p className={`text-xs font-medium ${textMuted}`}>Morning/Evening</p>
                              <p className={`font-medium ${textPrimary}`}>{u.totalMorningSessions || 0} / {u.totalEveningSessions || 0}</p>
                            </div>
                          </div>
                          
                          {/* Goal */}
                          {u.profile?.goal && (
                            <div>
                              <p className={`text-xs font-medium ${textMuted} mb-1`}>Goal</p>
                              <p className={`text-sm ${textSecondary} italic`}>"{u.profile.goal}"</p>
                            </div>
                          )}
                          
                          {/* Today's touchpoints visual */}
                          {u.onboardingComplete && (
                            <div>
                              <p className={`text-xs font-medium ${textMuted} mb-2`}>Today's Progress</p>
                              <div className="flex gap-2">
                                <div className={`flex-1 p-3 rounded-lg text-center ${todayTouchpoints.morning ? 'bg-green-100' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <span className="text-lg">{todayTouchpoints.morning ? '✅' : '☀️'}</span>
                                  <p className={`text-xs font-medium ${todayTouchpoints.morning ? 'text-green-700' : textMuted}`}>Morning</p>
                                </div>
                                <div className={`flex-1 p-3 rounded-lg text-center ${todayTouchpoints.growth ? 'bg-green-100' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <span className="text-lg">{todayTouchpoints.growth ? '✅' : '📚'}</span>
                                  <p className={`text-xs font-medium ${todayTouchpoints.growth ? 'text-green-700' : textMuted}`}>Growth</p>
                                </div>
                                <div className={`flex-1 p-3 rounded-lg text-center ${todayTouchpoints.evening ? 'bg-green-100' : isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                  <span className="text-lg">{todayTouchpoints.evening ? '✅' : '🌙'}</span>
                                  <p className={`text-xs font-medium ${todayTouchpoints.evening ? 'text-green-700' : textMuted}`}>Evening</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* User ID */}
                          <div>
                            <p className={`text-xs font-medium ${textMuted} mb-1`}>User ID</p>
                            <p className={`text-xs font-mono p-2 rounded-lg break-all ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                              {u.id}
                            </p>
                          </div>
                          
                          {/* Reset button */}
                          <button
                            onClick={() => resetUserProgress(u.id)}
                            disabled={resettingUser === u.id}
                            className="w-full p-3 rounded-xl bg-orange-100 border border-orange-200 text-orange-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-orange-200 transition-colors"
                          >
                            {resettingUser === u.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                                Resetting...
                              </>
                            ) : (
                              <>🔄 Reset This User</>
                            )}
                          </button>
                          
                          {/* Skip to next day button (for testing) */}
                          <button
                            onClick={() => skipToNextDay(u.id)}
                            className="w-full p-3 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors"
                          >
                            ⏭️ Clear Today (Test Next Day)
                          </button>
                          
                          {/* Test Mode toggle */}
                          <button
                            onClick={() => u.testMode ? disableTestMode(u.id) : enableTestMode(u.id)}
                            className={`w-full p-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                              u.testMode 
                                ? 'bg-green-100 border border-green-200 text-green-700 hover:bg-green-200'
                                : 'bg-purple-100 border border-purple-200 text-purple-700 hover:bg-purple-200'
                            }`}
                          >
                            {u.testMode ? '✅ Test Mode ON - Click to Disable' : '🧪 Enable Test Mode (No Time Limits)'}
                          </button>
                          
                          {/* Admin Role Toggle */}
                          <button
                            onClick={() => toggleAdminStatus(u.id, u.profile?.isAdmin)}
                            className={`w-full p-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                              u.profile?.isAdmin 
                                ? 'bg-red-100 border border-red-300 text-red-700 hover:bg-red-200'
                                : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {u.profile?.isAdmin ? '🛡️ ADMIN - Click to Remove' : '👤 Make Admin'}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Curriculum Tab */}
        {activeTab === 'curriculum' && (
          <div className="space-y-4">
            {/* Header with status */}
            <div className="flex items-center justify-between">
              <h2 className={`text-sm uppercase tracking-wider ${textSecondary}`}>
                {getActiveCurriculum().length} Detailed Focuses
              </h2>
              {customCurriculum && (
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-600 text-xs rounded-full font-medium">
                  ✓ Custom
                </span>
              )}
            </div>
            
            {/* Detailed Focuses with expansion */}
            <div className="space-y-3">
              {getActiveCurriculum().map((focus, index) => (
                <div key={focus.id} className={`rounded-2xl overflow-hidden ${bgCard}`}>
                  {/* Focus Header - clickable */}
                  <button
                    onClick={() => setExpandedFocus(expandedFocus === focus.id ? null : focus.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${focus.gradient} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-xl">{focus.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${textPrimary}`}>{focus.title}</h3>
                      <p className={`text-sm ${textMuted}`}>{focus.subtitle}</p>
                      <p className={`text-xs ${textMuted} mt-1`}>
                        {focus.sessions?.length || 0} sessions • ~{focus.estimatedDays} days
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${textMuted}`}>#{index + 1}</span>
                      <svg className={`w-5 h-5 transition-transform ${expandedFocus === focus.id ? 'rotate-180' : ''} ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  
                  {/* Expanded Focus Content */}
                  {expandedFocus === focus.id && (
                    <div className={`px-4 pb-4 space-y-4 ${isDark ? 'border-t border-white/10' : 'border-t border-slate-200'}`}>
                      {/* Focus description */}
                      <div className="pt-4">
                        <p className={`text-sm ${textSecondary}`}>{focus.description}</p>
                      </div>
                      
                      {/* Learning objectives */}
                      {focus.learningObjectives && (
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                          <p className={`text-xs uppercase tracking-wider ${textMuted} mb-2`}>Learning Objectives</p>
                          <ul className="space-y-1">
                            {focus.learningObjectives.map((obj, i) => (
                              <li key={i} className={`text-sm ${textSecondary} flex items-start gap-2`}>
                                <span className="text-emerald-500">✓</span>
                                {obj}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Sessions list */}
                      <div>
                        <p className={`text-xs uppercase tracking-wider ${textMuted} mb-3`}>Sessions</p>
                        <div className="space-y-2">
                          {focus.sessions?.map((session) => (
                            <div 
                              key={session.id}
                              className={`rounded-xl overflow-hidden ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}
                            >
                              {/* Session header */}
                              <button
                                onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                                className="w-full p-3 flex items-center gap-3 text-left"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                  <span>{getSessionIcon(session.type)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${textPrimary} truncate`}>{session.title}</p>
                                  <p className={`text-xs ${textMuted}`}>
                                    {session.type} • ~{session.estimatedMinutes || 5} min
                                  </p>
                                </div>
                                <svg className={`w-4 h-4 transition-transform ${expandedSession === session.id ? 'rotate-180' : ''} ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              
                              {/* Expanded session content */}
                              {expandedSession === session.id && (
                                <div className={`px-3 pb-3 space-y-3 ${isDark ? 'border-t border-white/10' : 'border-t border-slate-200'}`}>
                                  {renderSessionContent(session, focus.id, textPrimary, textSecondary, textMuted, isDark, bgInput, customCurriculum, saveCurriculumToFirestore, getActiveCurriculum, editingContent, setEditingContent, savingCurriculum)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Reset to default curriculum */}
            {customCurriculum && (
              <button
                onClick={async () => {
                  if (confirm('Reset to default curriculum? This will delete your custom edits.')) {
                    try {
                      await setDoc(doc(db, 'reppy_config', 'curriculum'), { focuses: null });
                      setCustomCurriculum(null);
                      alert('Reset to default curriculum');
                    } catch (e) {
                      alert('Error: ' + e.message);
                    }
                  }
                }}
                className={`w-full p-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'} ${textMuted} text-sm`}
              >
                🔄 Reset to Default Curriculum
              </button>
            )}
            
            {/* Info note */}
            <div className={`rounded-xl p-4 ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
              <p className={`text-sm ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                💡 <strong>How to edit:</strong> Expand any focus, then expand a session to see and edit its content. 
                Changes are saved to Firestore and will be used by the AI coach.
              </p>
            </div>
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className={`text-sm uppercase tracking-wider ${textSecondary}`}>Platform Stats</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-2xl p-5 text-center ${bgCard}`}>
                <p className={`text-3xl font-bold ${textPrimary}`}>{users.length}</p>
                <p className={`text-sm ${textMuted}`}>Total Users</p>
              </div>
              <div className={`rounded-2xl p-5 text-center ${bgCard}`}>
                <p className="text-3xl font-bold text-emerald-500">
                  {users.filter(u => u.onboardingComplete).length}
                </p>
                <p className={`text-sm ${textMuted}`}>Active Users</p>
              </div>
              <div className={`rounded-2xl p-5 text-center ${bgCard}`}>
                <p className={`text-3xl font-bold ${textPrimary}`}>
                  {users.reduce((sum, u) => sum + (u.completedSessions?.length || 0), 0)}
                </p>
                <p className={`text-sm ${textMuted}`}>Total Sessions</p>
              </div>
              <div className={`rounded-2xl p-5 text-center ${bgCard}`}>
                <p className="text-3xl font-bold text-amber-500">
                  {Math.max(...users.map(u => u.streakCount || 0), 0)}
                </p>
                <p className={`text-sm ${textMuted}`}>Best Streak</p>
              </div>
            </div>
            
            {/* Today's engagement */}
            <div className={`rounded-2xl p-5 ${bgCard}`}>
              <h3 className={`font-semibold mb-4 ${textPrimary}`}>Today's Engagement</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-amber-500">
                    {users.filter(u => getTodayTouchpoints(u).morning).length}
                  </p>
                  <p className={`text-xs ${textMuted}`}>☀️ Morning</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-indigo-500">
                    {users.filter(u => getTodayTouchpoints(u).growth).length}
                  </p>
                  <p className={`text-xs ${textMuted}`}>📚 Growth</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-500">
                    {users.filter(u => getTodayTouchpoints(u).evening).length}
                  </p>
                  <p className={`text-xs ${textMuted}`}>🌙 Evening</p>
                </div>
              </div>
            </div>
            
            {/* Session completion by focus */}
            <div className={`rounded-2xl p-5 ${bgCard}`}>
              <h3 className={`font-semibold mb-4 ${textPrimary}`}>Sessions by Focus</h3>
              <div className="space-y-3">
                {FOCUSES.slice(0, 5).map(focus => {
                  const sessionsInFocus = users.reduce((sum, u) => 
                    sum + (u.completedSessions?.filter(s => s.focusId === focus.id).length || 0), 0
                  );
                  return (
                    <div key={focus.id} className="flex items-center gap-3">
                      <span className="text-lg">{focus.icon}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className={textSecondary}>{focus.title}</span>
                          <span className={textMuted}>{sessionsInFocus}</span>
                        </div>
                        <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                          <div 
                            className={`h-full rounded-full bg-gradient-to-r ${focus.gradient}`}
                            style={{ width: `${Math.min((sessionsInFocus / 10) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className={`text-xl font-bold ${textPrimary}`}>Invite New User</h2>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteSuccess(null);
                  setInviteEmail('');
                  setInviteName('');
                  setInviteIsAdmin(false);
                }}
                className={`p-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {inviteSuccess ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl ${isDark ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
                  <p className={`font-semibold ${isDark ? 'text-green-400' : 'text-green-700'} mb-2`}>
                    ✓ Invitation Sent!
                  </p>
                  <p className={`text-sm ${textSecondary}`}>
                    {inviteSuccess.emailSent 
                      ? `An email invitation has been sent to ${inviteSuccess.email}`
                      : `Invitation created for ${inviteSuccess.email} (email not configured)`
                    }
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setInviteSuccess(null);
                  }}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                >
                  Invite Another User
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all ${bgInput}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="John Smith"
                    className={`w-full px-4 py-3 rounded-xl border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all ${bgInput}`}
                  />
                </div>
                
                {/* User/Admin Role Toggle */}
                <div>
                  <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                    Role
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteIsAdmin(false)}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                        !inviteIsAdmin
                          ? 'bg-blue-600 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      👤 User
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteIsAdmin(true)}
                      className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                        inviteIsAdmin
                          ? 'bg-red-600 text-white'
                          : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      🛠️ Admin
                    </button>
                  </div>
                  {inviteIsAdmin && (
                    <p className={`text-xs mt-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                      ⚠️ Admin users can manage other users and access admin features
                    </p>
                  )}
                </div>
                
                <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
                  <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    📧 An invitation email will be sent to this address with a link to sign up.
                  </p>
                </div>
                
                <button
                  onClick={sendInvite}
                  disabled={sendingInvite || !inviteEmail.trim()}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {sendingInvite ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending Invite...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Invitation Email
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getSessionIcon(type) {
  const icons = {
    quote: '💬',
    lesson: '📚',
    scenario: '🎭',
    book: '📖',
    video: '🎬',
    reflection: '🪞',
    challenge: '🎯',
    integration: '✨',
    win: '🏆',
    pm: '🌙',
  };
  return icons[type] || '📍';
}

// Helper to render session content with editing capabilities
function renderSessionContent(session, focusId, textPrimary, textSecondary, textMuted, isDark, bgInput, customCurriculum, saveCurriculumToFirestore, getActiveCurriculum, editingContent, setEditingContent, savingCurriculum) {
  const content = session.content || {};
  
  // Edit handler
  const handleEdit = async (field, value) => {
    const focuses = JSON.parse(JSON.stringify(getActiveCurriculum())); // Deep clone
    const focusIndex = focuses.findIndex(f => f.id === focusId);
    if (focusIndex === -1) return;
    
    const sessionIndex = focuses[focusIndex].sessions.findIndex(s => s.id === session.id);
    if (sessionIndex === -1) return;
    
    // Navigate to the field and update it
    const keys = field.split('.');
    let obj = focuses[focusIndex].sessions[sessionIndex];
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    
    await saveCurriculumToFirestore(focuses);
    setEditingContent(null);
  };
  
  // Editable field component
  const EditableField = ({ label, value, field, multiline = false }) => {
    const isEditing = editingContent === `${session.id}.${field}`;
    const [localValue, setLocalValue] = useState(value || '');
    
    if (isEditing) {
      return (
        <div className="space-y-2 pt-2">
          <label className={`text-xs ${textMuted}`}>{label}</label>
          {multiline ? (
            <textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              rows={4}
              className={`w-full p-2 rounded-lg border text-sm ${bgInput}`}
            />
          ) : (
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className={`w-full p-2 rounded-lg border text-sm ${bgInput}`}
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleEdit(`content.${field}`, localValue)}
              disabled={savingCurriculum}
              className="px-3 py-1 bg-emerald-500 text-white text-xs rounded-lg"
            >
              {savingCurriculum ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditingContent(null)}
              className={`px-3 py-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'} ${textMuted} text-xs rounded-lg`}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="group pt-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className={`text-xs ${textMuted}`}>{label}</p>
            <p className={`text-sm ${textSecondary} whitespace-pre-wrap`}>{value || '(empty)'}</p>
          </div>
          <button
            onClick={() => setEditingContent(`${session.id}.${field}`)}
            className={`opacity-0 group-hover:opacity-100 p-1 rounded ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'} transition-opacity`}
          >
            <svg className={`w-4 h-4 ${textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      </div>
    );
  };
  
  // Render based on session type
  switch (session.type) {
    case 'quote':
      return (
        <div className="space-y-2 pt-3">
          <div className={`p-3 rounded-lg border-l-4 border-amber-500 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
            <p className={`text-sm italic ${textPrimary}`}>"{content.quote}"</p>
            <p className={`text-xs ${textMuted} mt-2`}>— {content.author}</p>
            {content.source && <p className={`text-xs ${textMuted}`}>{content.source}</p>}
          </div>
          <EditableField label="Quote" value={content.quote} field="quote" multiline />
          <EditableField label="Author" value={content.author} field="author" />
          <EditableField label="Source" value={content.source} field="source" />
          <EditableField label="Context" value={content.context} field="context" multiline />
          <EditableField label="Why It Matters" value={content.whyItMatters} field="whyItMatters" multiline />
          
          {content.reflectionPrompts && (
            <div className="pt-2">
              <p className={`text-xs ${textMuted} mb-1`}>Reflection Prompts</p>
              <ul className="space-y-1">
                {content.reflectionPrompts.map((prompt, i) => (
                  <li key={i} className={`text-sm ${textSecondary}`}>• {prompt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
      
    case 'lesson':
      return (
        <div className="space-y-2 pt-3">
          <EditableField label="Opening" value={content.opening} field="opening" multiline />
          <EditableField label="Key Insight" value={content.keyInsight} field="keyInsight" multiline />
          
          {content.framework && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'} space-y-2 mt-2`}>
              <p className={`text-sm font-medium ${textPrimary}`}>📐 {content.framework.name}</p>
              {content.framework.formula && (
                <p className={`text-xs font-mono ${isDark ? 'bg-white/10' : 'bg-slate-100'} p-2 rounded`}>
                  {content.framework.formula}
                </p>
              )}
              <p className={`text-sm ${textSecondary}`}>{content.framework.description}</p>
              
              {content.framework.steps && (
                <div className="space-y-2 mt-2">
                  {content.framework.steps.map((step, i) => (
                    <div key={i} className={`p-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <p className={`text-xs font-medium ${textPrimary}`}>{step.part || step.letter}: {step.name || step.prompt}</p>
                      <p className={`text-xs ${textSecondary}`}>{step.description}</p>
                      {step.example && <p className={`text-xs italic ${textMuted} mt-1`}>Example: {step.example}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {content.coachingPrompts && (
            <div className="pt-2">
              <p className={`text-xs ${textMuted} mb-1`}>Coaching Prompts</p>
              <ul className="space-y-1">
                {content.coachingPrompts.map((prompt, i) => (
                  <li key={i} className={`text-sm ${textSecondary}`}>• {prompt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
      
    case 'book': {
      const book = content.book || content;
      return (
        <div className="space-y-2 pt-3">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
            <p className={`text-sm font-medium ${textPrimary}`}>📖 {book.title}</p>
            <p className={`text-xs ${textMuted}`}>by {book.author} • {book.published}</p>
          </div>
          <EditableField label="One-Sentence Summary" value={book.oneSentenceSummary} field="book.oneSentenceSummary" multiline />
          <EditableField label="Big Idea" value={book.bigIdea} field="book.bigIdea" multiline />
          <EditableField label="Leadership Application" value={book.leadershipApplication} field="book.leadershipApplication" multiline />
          
          {book.keyQuotes && (
            <div className="pt-2">
              <p className={`text-xs ${textMuted} mb-1`}>Key Quotes</p>
              {book.keyQuotes.map((quote, i) => (
                <p key={i} className={`text-sm italic ${textSecondary} py-1`}>"{quote}"</p>
              ))}
            </div>
          )}
          
          {content.watchInstead && (
            <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-50'} mt-2`}>
              <p className={`text-xs ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>
                🎬 Alternative: {content.watchInstead.title} ({content.watchInstead.duration})
              </p>
            </div>
          )}
        </div>
      );
    }
      
    case 'scenario':
      return (
        <div className="space-y-2 pt-3">
          {content.setup && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textMuted} mb-2`}>The Situation</p>
              <p className={`text-sm ${textSecondary}`}>{content.setup.situation}</p>
              {content.setup.complication && (
                <>
                  <p className={`text-xs uppercase tracking-wider ${textMuted} mt-3 mb-2`}>The Complication</p>
                  <p className={`text-sm ${textSecondary}`}>{content.setup.complication}</p>
                </>
              )}
            </div>
          )}
          
          <EditableField label="Situation" value={content.setup?.situation} field="setup.situation" multiline />
          <EditableField label="Complication" value={content.setup?.complication} field="setup.complication" multiline />
          
          {content.responseOptions && (
            <div className="pt-2 space-y-2">
              <p className={`text-xs ${textMuted}`}>Response Options</p>
              {content.responseOptions.map((opt, i) => (
                <div key={i} className={`p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
                  <p className={`text-sm font-medium ${textPrimary}`}>{opt.option}</p>
                  <p className={`text-xs ${textSecondary} mt-1`}>{opt.analysis}</p>
                </div>
              ))}
            </div>
          )}
          
          <EditableField label="Principle" value={content.principle} field="principle" multiline />
        </div>
      );
      
    case 'challenge':
      return (
        <div className="space-y-2 pt-3">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
            <p className={`text-sm font-medium ${textPrimary}`}>🎯 {content.challenge?.title}</p>
            <p className={`text-sm ${textSecondary} mt-2`}>{content.challenge?.description}</p>
          </div>
          <EditableField label="Challenge Title" value={content.challenge?.title} field="challenge.title" />
          <EditableField label="Challenge Description" value={content.challenge?.description} field="challenge.description" multiline />
          <EditableField label="Why This Works" value={content.whyThisWorks} field="whyThisWorks" multiline />
          
          {content.rules && (
            <div className="pt-2">
              <p className={`text-xs ${textMuted} mb-1`}>Rules</p>
              <ul className="space-y-1">
                {content.rules.map((rule, i) => (
                  <li key={i} className={`text-sm ${textSecondary}`}>• {rule}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
      
    case 'reflection':
      return (
        <div className="space-y-2 pt-3">
          <EditableField label="Opening" value={content.opening} field="opening" multiline />
          <EditableField label="Concept" value={content.concept} field="concept" multiline />
          <EditableField label="Closing Insight" value={content.closingInsight} field="closingInsight" multiline />
          
          {content.reflectionExercise && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
              <p className={`text-sm font-medium ${textPrimary}`}>🪞 {content.reflectionExercise.name}</p>
              {content.reflectionExercise.steps?.map((step, i) => (
                <div key={i} className={`mt-2 p-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <p className={`text-xs font-medium ${textPrimary}`}>Step {step.step}</p>
                  <p className={`text-sm ${textSecondary}`}>{step.prompt}</p>
                  {step.followUp && <p className={`text-xs ${textMuted} mt-1`}>{step.followUp}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      );
      
    case 'integration':
      return (
        <div className="space-y-2 pt-3">
          <EditableField label="Opening" value={content.opening} field="opening" multiline />
          <EditableField label="Closing" value={content.closing} field="closing" multiline />
          
          {content.synthesis?.recap && (
            <div className="pt-2">
              <p className={`text-xs ${textMuted} mb-1`}>Recap Points</p>
              {content.synthesis.recap.map((point, i) => (
                <p key={i} className={`text-sm ${textSecondary}`}>• {point}</p>
              ))}
            </div>
          )}
          
          {content.synthesis?.guidingQuestions && (
            <div className="pt-2">
              <p className={`text-xs ${textMuted} mb-1`}>Guiding Questions</p>
              {content.synthesis.guidingQuestions.map((q, i) => (
                <p key={i} className={`text-sm ${textSecondary}`}>• {q}</p>
              ))}
            </div>
          )}
        </div>
      );
      
    case 'video':
      return (
        <div className="space-y-2 pt-3">
          {content.video && (
            <div className={`p-3 rounded-lg ${isDark ? 'bg-white/5' : 'bg-white'}`}>
              <p className={`text-sm font-medium ${textPrimary}`}>🎬 {content.video.title}</p>
              <p className={`text-xs ${textMuted}`}>by {content.video.presenter} • {content.video.duration}</p>
              <p className={`text-sm ${textSecondary} mt-2`}>{content.video.keyIdea}</p>
            </div>
          )}
          <EditableField label="Key Idea" value={content.video?.keyIdea} field="video.keyIdea" multiline />
          <EditableField label="Leadership Application" value={content.video?.leadershipApplication} field="video.leadershipApplication" multiline />
          <EditableField label="Practice Challenge" value={content.practiceChallenge} field="practiceChallenge" multiline />
        </div>
      );
      
    default:
      return (
        <div className="pt-3">
          <p className={`text-sm ${textMuted}`}>Session type: {session.type}</p>
          <pre className={`text-xs ${textMuted} mt-2 overflow-auto max-h-40 p-2 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            {JSON.stringify(content, null, 2)}
          </pre>
        </div>
      );
  }
}
