import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Server,
  Clock,
  X,
  ChevronRight,
  ShieldCheck,
  Plus,
  Trash2,
  LayoutDashboard,
  UserPlus,
  LogIn,
  UserCheck,
  CheckCircle,
  Play,
  ClipboardCheck,
  Trophy,
  Flame,
  Shield,
  Settings,
  ToggleRight,
  Bell,
  Zap
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore';
import { ACTIVITY_TYPES, getActivityMeta, logActivity as logActivityService, getTodaysSummary, cleanupOldLogs } from '../../services/activityLogger';

const AdminDashboard = () => {
  const { db, user } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    contentItems: 0,
    pendingIssues: 0,
    systemStatus: 'Checking...'
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [activitySummary, setActivitySummary] = useState({ signups: 0, logins: 0, completions: 0, adminActions: 0, total: 0 });
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [detailData, setDetailData] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Admin Management State
  const [admins, setAdmins] = useState([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Icon map for activity types
  const ActivityIcon = ({ type, className }) => {
    const meta = getActivityMeta(type);
    const iconMap = {
      'UserPlus': UserPlus,
      'LogIn': LogIn,
      'UserCheck': UserCheck,
      'CheckCircle': CheckCircle,
      'Play': Play,
      'ClipboardCheck': ClipboardCheck,
      'Trophy': Trophy,
      'Flame': Flame,
      'Shield': Shield,
      'Settings': Settings,
      'ToggleRight': ToggleRight,
      'Bell': Bell,
      'AlertTriangle': AlertTriangle
    };
    const IconComponent = iconMap[meta.icon] || Zap;
    return <IconComponent className={className} />;
  };

  // Helper to log system activity (enhanced)
  const logActivity = async (action, details = '', activityType = ACTIVITY_TYPES.ADMIN_ACTION) => {
    try {
      await logActivityService(db, activityType, {
        action,
        details,
        userEmail: user?.email,
        userId: user?.uid
      });
      
      // Refresh logs locally
      setRecentActivity(prev => [
        { 
          id: 'temp-' + Date.now(), 
          action, 
          type: activityType.type,
          user: user?.email, 
          time: 'Just now' 
        },
        ...prev
      ].slice(0, 10));
      
      // Refresh summary
      const summary = await getTodaysSummary(db);
      setActivitySummary(summary);
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!db) return;
      
      try {
        // 1. Users
        const usersSnap = await getDocs(collection(db, 'users'));
        // Filter for real/active users (must have email AND displayName)
        const realUsers = usersSnap.docs.filter(doc => {
          const data = doc.data();
          return data.email && data.displayName;
        });
        const totalUsers = realUsers.length;
        
        // Calculate Active Today - check both lastActive and lastLogin fields
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let activeCount = 0;
        realUsers.forEach(doc => {
          const data = doc.data();
          // Check both lastActive and lastLogin fields
          const lastActiveField = data.lastActive || data.lastLogin;
          if (lastActiveField) {
            // Handle Firestore Timestamp, Date object, or string/number
            let lastActiveDate;
            if (typeof lastActiveField.toDate === 'function') {
              lastActiveDate = lastActiveField.toDate();
            } else if (typeof lastActiveField === 'string' || typeof lastActiveField === 'number') {
              lastActiveDate = new Date(lastActiveField);
            } else {
              lastActiveDate = new Date(0); // Invalid date
            }

            if (lastActiveDate >= today) {
              activeCount++;
            }
          }
        });

        // 2. Content
        // Check CMS Collections
        const readingsSnap = await getDocs(collection(db, 'content_readings'));
        const videosSnap = await getDocs(collection(db, 'content_videos'));
        const coursesSnap = await getDocs(collection(db, 'content_courses'));
        
        // Check Legacy Catalogs (metadata collection)
        let legacyCount = 0;
        try {
          const catalogs = ['reading_catalog', 'video_catalog', 'course_catalog'];
          for (const cat of catalogs) {
            const catDoc = await getDoc(doc(db, 'metadata', cat));
            if (catDoc.exists()) {
              const data = catDoc.data();
              if (data.items && typeof data.items === 'object') {
                legacyCount += Object.keys(data.items).length;
              }
            }
          }
        } catch (e) {
          console.warn('Error checking legacy catalogs:', e);
        }

        const totalContent = readingsSnap.size + videosSnap.size + coursesSnap.size + legacyCount;

        // 3. Issues (System Alerts)
        // We'll query a 'system_alerts' collection. If it doesn't exist, it returns 0.
        const alertsSnap = await getDocs(query(collection(db, 'system_alerts'), where('status', '==', 'open')));
        const pendingIssues = alertsSnap.size;

        // 4. Activity Logs - Fetch last 10 with enhanced display
        let activity = [];
        try {
          const logsQuery = query(collection(db, 'system_logs'), orderBy('timestamp', 'desc'), limit(10));
          const logsSnap = await getDocs(logsQuery);
          activity = logsSnap.docs.map(doc => {
            const data = doc.data();
            // Format timestamp
            let timeStr = 'Recently';
            if (data.timestamp) {
              const date = data.timestamp.toDate();
              const now = new Date();
              const diff = (now - date) / 1000; // seconds
              if (diff < 60) timeStr = 'Just now';
              else if (diff < 3600) timeStr = `${Math.floor(diff/60)}m ago`;
              else if (diff < 86400) timeStr = `${Math.floor(diff/3600)}h ago`;
              else if (diff < 604800) timeStr = `${Math.floor(diff/86400)}d ago`;
              else timeStr = date.toLocaleDateString();
            }
            
            return { 
              id: doc.id, 
              ...data,
              time: timeStr
            };
          });
        } catch (e) {
          console.log('No logs collection found or permission denied', e);
        }
        
        // 4b. Get today's activity summary
        try {
          const summary = await getTodaysSummary(db);
          setActivitySummary(summary);
        } catch (e) {
          console.log('Could not fetch activity summary', e);
        }
        
        // 5. Fetch Admins
        try {
          const metadataRef = doc(db, 'metadata', 'config');
          const metadataSnap = await getDoc(metadataRef);
          const DEFAULT_ADMINS = ['rob@sagecg.com', 'ryan@leaderreps.com', 'admin@leaderreps.com'];

          if (metadataSnap.exists()) {
            const data = metadataSnap.data();
            if (data.adminemails && Array.isArray(data.adminemails) && data.adminemails.length > 0) {
              setAdmins(data.adminemails);
            } else {
              setAdmins(DEFAULT_ADMINS);
            }
          } else {
            setAdmins(DEFAULT_ADMINS);
          }
        } catch (e) {
          console.error("Error fetching admins:", e);
          setAdmins(['rob@sagecg.com', 'ryan@leaderreps.com', 'admin@leaderreps.com']);
        }

        setStats({
          totalUsers,
          activeToday: activeCount,
          contentItems: totalContent,
          pendingIssues,
          systemStatus: pendingIssues > 0 ? 'Attention Needed' : 'Operational'
        });
        setRecentActivity(activity);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [db]);

  const handleCardClick = async (metric) => {
    if (selectedMetric === metric) {
      setSelectedMetric(null); // Toggle off
      return;
    }

    setSelectedMetric(metric);
    setDetailLoading(true);
    setDetailData([]);

    try {
      if (metric === 'users') {
        // Fetch all users (no orderBy to include users without createdAt)
        const usersSnap = await getDocs(collection(db, 'users'));
        
        const users = usersSnap.docs
          .filter(doc => {
            const data = doc.data();
            // Only include users with a displayName and email
            return data.displayName && data.email;
          })
          .map(doc => {
            const data = doc.data();
            
            // Helper function to format Firestore timestamps (MM/DD/YYYY)
            const formatDate = (field) => {
              if (!field) return null;
              let d;
              if (typeof field.toDate === 'function') {
                d = field.toDate();
              } else if (typeof field === 'string' || typeof field === 'number') {
                d = new Date(field);
              }
              if (!d || isNaN(d.getTime())) return null;
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              const year = d.getFullYear();
              return `${month}/${day}/${year}`;
            };
            
            // Try multiple fields for joined date
            const joinedDate = formatDate(data.createdAt) || formatDate(data.arenaEntryDate) || 'Unknown';
            
            // Try multiple fields for last active
            const lastActiveDate = formatDate(data.lastLogin) || formatDate(data.lastActive) || 'Never';
          
            return {
              id: doc.id,
              primary: (
                <div className="flex flex-col">
                  <span className="font-bold text-corporate-navy">{data.displayName}</span>
                  <span className="text-xs text-gray-500">{data.email}</span>
                </div>
              ),
              secondary: (
                <div className="text-xs text-gray-500">
                  <div>Joined: {joinedDate}</div>
                  <div>Active: {lastActiveDate}</div>
                </div>
              ),
              status: data.role || 'user',
              // Store raw data for sorting
              _createdAt: data.createdAt?.toDate?.() || data.arenaEntryDate?.toDate?.() || new Date(0)
            };
          })
          // Sort by created date (newest first)
          .sort((a, b) => b._createdAt - a._createdAt);
          
        setDetailData(users);
      } else if (metric === 'content') {
        // Show breakdown
        const readingsSnap = await getDocs(collection(db, 'content_readings'));
        const videosSnap = await getDocs(collection(db, 'content_videos'));
        const coursesSnap = await getDocs(collection(db, 'content_courses'));
        
        setDetailData([
          { id: 'readings', primary: 'Readings', secondary: `${readingsSnap.size} items`, status: 'Active' },
          { id: 'videos', primary: 'Videos', secondary: `${videosSnap.size} items`, status: 'Active' },
          { id: 'courses', primary: 'Courses', secondary: `${coursesSnap.size} items`, status: 'Active' }
        ]);
      } else if (metric === 'issues') {
        const alertsSnap = await getDocs(query(collection(db, 'system_alerts'), where('status', '==', 'open')));
        if (alertsSnap.empty) {
           setDetailData([{ id: 'no-issues', primary: 'No open issues', secondary: 'System is healthy', status: 'Green' }]);
        } else {
           setDetailData(alertsSnap.docs.map(doc => ({
             id: doc.id,
             primary: doc.data().title || 'Untitled Issue',
             secondary: doc.data().description || 'No description',
             status: doc.data().severity || 'Medium'
           })));
        }
      }
    } catch (error) {
      console.error("Error fetching details:", error);
    } finally {
      setDetailLoading(false);
    }
  };
  
  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminEmail.includes('@')) return;
    
    setIsAddingAdmin(true);
    try {
      const metadataRef = doc(db, 'metadata', 'config');
      // Use setDoc with merge to ensure document exists
      await setDoc(metadataRef, {
        adminemails: arrayUnion(newAdminEmail.toLowerCase())
      }, { merge: true });
      
      await logActivity('Added Admin', `Added ${newAdminEmail} to admin list`);
      
      setAdmins(prev => {
        // Avoid duplicates in local state
        if (prev.includes(newAdminEmail.toLowerCase())) return prev;
        return [...prev, newAdminEmail.toLowerCase()];
      });
      setNewAdminEmail('');
    } catch (error) {
      console.error("Error adding admin:", error);
      alert("Failed to add admin.");
    } finally {
      setIsAddingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (email) => {
    if (!confirm(`Are you sure you want to remove ${email} from admins?`)) return;
    
    try {
      const metadataRef = doc(db, 'metadata', 'config');
      
      // Calculate new list based on current state
      // This ensures that if we were viewing defaults, we save the modified list to DB
      const newAdmins = admins.filter(a => a !== email);

      await setDoc(metadataRef, {
        adminemails: newAdmins
      }, { merge: true });
      
      await logActivity('Removed Admin', `Removed ${email} from admin list`);
      
      setAdmins(newAdmins);
    } catch (error) {
      console.error("Error removing admin:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-gray-500">
        <div className="w-8 h-8 border-3 border-corporate-teal/30 border-t-corporate-teal rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - Matching PageLayout style */}
      <header className="text-center mb-8">
        <div className="flex items-center gap-3 justify-center mb-2">
          <LayoutDashboard className="w-8 h-8 text-corporate-teal" />
          <h1 className="text-2xl sm:text-3xl font-bold text-corporate-navy">
            Admin Command Center
          </h1>
        </div>
        <p className="text-slate-500 text-sm sm:text-base max-w-2xl mx-auto">
          Monitor system health, manage administrators, and view activity logs.
        </p>
      </header>

      {/* System Status Bar */}
      <div className="flex items-center justify-center">
        <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${stats.pendingIssues > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${stats.pendingIssues > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
          System Status: {stats.systemStatus}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Card */}
        <div 
          onClick={() => handleCardClick('users')}
          className={`bg-gray-50 p-6 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedMetric === 'users' ? 'border-corporate-teal ring-2 ring-corporate-teal/20' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Total Active Users</span>
          </div>
          <div className="text-3xl font-bold text-corporate-navy">{stats.totalUsers}</div>
          <div className="text-sm text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {stats.activeToday} active today
          </div>
        </div>

        {/* Content Card */}
        <div 
          onClick={() => handleCardClick('content')}
          className={`bg-gray-50 p-6 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedMetric === 'content' ? 'border-corporate-teal ring-2 ring-corporate-teal/20' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Content Items</span>
          </div>
          <div className="text-3xl font-bold text-corporate-navy">{stats.contentItems}</div>
          <div className="text-sm text-gray-500 mt-2">Readings, Videos, Courses</div>
        </div>

        {/* Issues Card */}
        <div 
          onClick={() => handleCardClick('issues')}
          className={`bg-gray-50 p-6 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedMetric === 'issues' ? 'border-corporate-teal ring-2 ring-corporate-teal/20' : 'border-gray-200'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Issues</span>
          </div>
          <div className="text-3xl font-bold text-corporate-navy">{stats.pendingIssues}</div>
          <div className={`text-sm mt-2 font-medium ${stats.pendingIssues > 0 ? 'text-orange-600' : 'text-green-600'}`}>
            {stats.pendingIssues > 0 ? 'Requires Attention' : 'All Clear'}
          </div>
        </div>

        {/* Database Card (Static for now as we can't easily get storage usage from client SDK) */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 opacity-75">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-teal-100 text-teal-600 rounded-lg">
              <Server className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-gray-400 uppercase">Database</span>
          </div>
          <div className="text-3xl font-bold text-corporate-navy">Online</div>
          <div className="text-sm text-gray-500 mt-2">Firestore Connected</div>
        </div>
      </div>

      {/* Detail View Section */}
      {selectedMetric && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-corporate-navy capitalize">{selectedMetric} Details</h3>
            <button onClick={() => setSelectedMetric(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-0">
            {detailLoading ? (
              <div className="p-8 text-center text-gray-500">Loading details...</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {detailData.length > 0 ? (
                  detailData.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-corporate-navy">{item.primary}</div>
                        <div className="text-sm text-gray-500">{item.secondary}</div>
                      </div>
                      <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                        {item.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">No data available.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Admin Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Admin List */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-corporate-navy font-serif flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-corporate-teal" />
              Authorized Admins
            </h3>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
              {admins.length} Users
            </span>
          </div>
          
          <div className="space-y-3 mb-6">
            {admins.map((email) => (
              <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-corporate-navy text-white flex items-center justify-center font-bold text-xs">
                    {email.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{email}</span>
                </div>
                {/* Prevent removing self */}
                {email !== user?.email && (
                  <button 
                    onClick={() => handleRemoveAdmin(email)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove Admin Access"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Enter email to grant access..." 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
            />
            <button 
              onClick={handleAddAdmin}
              disabled={isAddingAdmin || !newAdminEmail}
              className="px-4 py-2 bg-corporate-navy text-white rounded-lg text-sm font-bold hover:bg-opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Recent Activity - Enhanced */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-corporate-navy font-serif">Recent System Activity</h3>
            <button 
              onClick={async () => {
                if (window.confirm('Delete logs older than 30 days?')) {
                  const deleted = await cleanupOldLogs(db, 30);
                  alert(`Cleaned up ${deleted} old logs`);
                }
              }}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              title="Clean up old logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          {/* Today's Summary Stats */}
          <div className="grid grid-cols-4 gap-2 mb-4 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-100">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{activitySummary.signups}</div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Sign-ups</div>
            </div>
            <div className="text-center border-l border-slate-200">
              <div className="text-lg font-bold text-blue-600">{activitySummary.logins}</div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Logins</div>
            </div>
            <div className="text-center border-l border-slate-200">
              <div className="text-lg font-bold text-purple-600">{activitySummary.completions}</div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Completions</div>
            </div>
            <div className="text-center border-l border-slate-200">
              <div className="text-lg font-bold text-slate-600">{activitySummary.adminActions}</div>
              <div className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">Admin</div>
            </div>
          </div>
          
          {/* Activity Log List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => {
                const meta = getActivityMeta(activity.type);
                return (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${meta.bgColor} ${meta.textColor} flex items-center justify-center`}>
                        <ActivityIcon type={activity.type} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-corporate-navy text-sm">{activity.action || 'Unknown Action'}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <span>{activity.user || 'System'}</span>
                          {activity.details && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-gray-400 truncate max-w-[150px]">{activity.details}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {activity.time || 'Recently'}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-500 italic text-center py-8">
                <Zap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <div>No recent activity logs found.</div>
                <div className="text-xs mt-1">Activity will appear here as users interact with the platform.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
