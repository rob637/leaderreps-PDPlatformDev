import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { 
  Loader, Download, Search, ChevronUp, ChevronDown, X,
  User, Building2, Briefcase, Calendar, Users, Target,
  MessageSquare, TrendingUp, Award, Heart
} from 'lucide-react';

// ============================================
// SORT CONFIGURATION
// ============================================
const SORTABLE_COLUMNS = [
  { key: 'userName', label: 'Leader' },
  { key: 'companyName', label: 'Company' },
  { key: 'jobTitle', label: 'Role' },
  { key: 'yearsManaging', label: 'Experience' },
  { key: 'feedbackReceptionScore', label: 'Feedback (R/G)' },
  { key: 'updatedAt', label: 'Updated' },
];

// ============================================
// LEADER PROFILE DETAIL MODAL
// ============================================
const LeaderProfileModal = ({ profile, onClose }) => {
  if (!profile) return null;

  const Section = ({ icon: Icon, title, children, color = 'slate' }) => (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <div className={`flex items-center gap-2 px-4 py-2 bg-${color}-50 dark:bg-${color}-900/20 border-b border-slate-200 dark:border-slate-700`}>
        <Icon className={`w-4 h-4 text-${color}-600`} />
        <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{value || '—'}</span>
    </div>
  );

  const ScoreBar = ({ label, score, maxScore = 10, color = 'corporate-teal' }) => {
    const percentage = score ? (score / maxScore) * 100 : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">{label}</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">{score || '—'}/10</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-${color} rounded-full transition-all`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-corporate-navy to-corporate-navy/90">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profile.userName}</h2>
              <p className="text-sm text-white/70">{profile.userEmail}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Professional Info */}
          <Section icon={Briefcase} title="Professional Background" color="blue">
            <div className="grid grid-cols-2 gap-x-6">
              <InfoRow label="Company" value={profile.companyName} />
              <InfoRow label="Company Size" value={profile.companySize} />
              <InfoRow label="Job Title" value={profile.jobTitle} />
              <InfoRow label="Department" value={profile.department} />
              <InfoRow label="Years Managing" value={profile.yearsManaging} />
              <InfoRow label="Direct Reports" value={profile.directReports} />
            </div>
          </Section>

          {/* Leadership Style */}
          {profile.leadershipStyleDescription && (
            <Section icon={Award} title="Leadership Style" color="purple">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {profile.leadershipStyleDescription}
              </p>
              {profile.leadershipStyle && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    {profile.leadershipStyle}
                  </span>
                </div>
              )}
            </Section>
          )}

          {/* Feedback Scores */}
          <Section icon={MessageSquare} title="Feedback Assessment" color="green">
            <div className="space-y-4">
              <ScoreBar 
                label="Receiving Feedback" 
                score={profile.feedbackReceptionScore} 
                color="blue-500"
              />
              <ScoreBar 
                label="Giving Feedback" 
                score={profile.feedbackGivingScore}
                color="green-500" 
              />
            </div>
          </Section>

          {/* Goals & Development */}
          <Section icon={Target} title="Development Focus" color="orange">
            {profile.currentHabit && (
              <div className="mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Current Habit Focus
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                  {profile.currentHabit}
                </p>
              </div>
            )}
            {profile.successDefinition && (
              <div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Definition of Success
                </span>
                <p className="text-sm text-slate-700 dark:text-slate-200 mt-1">
                  {profile.successDefinition}
                </p>
              </div>
            )}
            {!profile.currentHabit && !profile.successDefinition && (
              <p className="text-sm text-slate-500 italic">No development goals captured yet.</p>
            )}
          </Section>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
            <span>Profile ID: {profile.userId?.slice(0, 8)}...</span>
            <span>Last Updated: {profile.updatedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SORTABLE TABLE HEADER
// ============================================
const SortableHeader = ({ column, currentSort, onSort }) => {
  const isActive = currentSort.key === column.key;
  const isAsc = currentSort.direction === 'asc';

  return (
    <button
      onClick={() => onSort(column.key)}
      className="flex items-center gap-1 hover:text-corporate-teal transition-colors group"
    >
      <span>{column.label}</span>
      <div className="flex flex-col">
        <ChevronUp 
          className={`w-3 h-3 -mb-1 ${isActive && isAsc ? 'text-corporate-teal' : 'text-slate-300 group-hover:text-slate-400'}`} 
        />
        <ChevronDown 
          className={`w-3 h-3 ${isActive && !isAsc ? 'text-corporate-teal' : 'text-slate-300 group-hover:text-slate-400'}`} 
        />
      </div>
    </button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
const LeaderProfileReports = () => {
  const { db } = useAppServices();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'userName', direction: 'asc' });

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        // 1. Fetch all users
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Fetch profiles for each user
        const profilePromises = users.map(async (user) => {
          const profileRef = doc(db, `user_data/${user.id}/leader_profile/current`);
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            return {
              userId: user.id,
              userName: user.displayName || user.name || 'Unknown',
              userEmail: user.email,
              ...profileSnap.data()
            };
          }
          return null;
        });

        const results = await Promise.all(profilePromises);
        setProfiles(results.filter(p => p !== null));
      } catch (error) {
        console.error("Error fetching profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [db]);

  // Handle sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort profiles
  const processedProfiles = useMemo(() => {
    let result = profiles.filter(p => 
      p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle special cases
      if (sortConfig.key === 'updatedAt') {
        aVal = aVal?.toDate?.() || new Date(0);
        bVal = bVal?.toDate?.() || new Date(0);
        return sortConfig.direction === 'asc' 
          ? aVal - bVal 
          : bVal - aVal;
      }

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle strings
      aVal = (aVal || '').toString().toLowerCase();
      bVal = (bVal || '').toString().toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aVal.localeCompare(bVal);
      }
      return bVal.localeCompare(aVal);
    });

    return result;
  }, [profiles, searchTerm, sortConfig]);

  const exportCSV = () => {
    const headers = [
      'Name', 'Email', 'Company', 'Role', 'Dept', 
      'Years Managing', 'Direct Reports', 'Leadership Style', 
      'Current Habit', 'Success Definition', 'Feedback Reception', 'Feedback Giving'
    ];
    
    const csvContent = [
      headers.join(','),
      ...processedProfiles.map(p => [
        `"${p.userName}"`,
        `"${p.userEmail}"`,
        `"${p.companyName || ''}"`,
        `"${p.jobTitle || ''}"`,
        `"${p.department || ''}"`,
        `"${p.yearsManaging || ''}"`,
        `"${p.directReports || ''}"`,
        `"${(p.leadershipStyleDescription || '').replace(/"/g, '""')}"`,
        `"${(p.currentHabit || '').replace(/"/g, '""')}"`,
        `"${(p.successDefinition || '').replace(/"/g, '""')}"`,
        p.feedbackReceptionScore || '',
        p.feedbackGivingScore || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'leader_profiles.csv';
    link.click();
  };

  if (loading) return <div className="flex justify-center p-8"><Loader className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-corporate-navy dark:text-white">Leader Profiles</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {processedProfiles.length} leader{processedProfiles.length !== 1 ? 's' : ''} • Click a row to view full profile
          </p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search leaders by name, email, or company..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 bg-white dark:bg-slate-800"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                {SORTABLE_COLUMNS.map(column => (
                  <th key={column.key} className="px-4 py-3">
                    <SortableHeader 
                      column={column} 
                      currentSort={sortConfig}
                      onSort={handleSort}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {processedProfiles.map(profile => (
                <tr 
                  key={profile.userId} 
                  onClick={() => setSelectedProfile(profile)}
                  className="hover:bg-corporate-teal/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-corporate-navy/10 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-corporate-navy" />
                      </div>
                      <div>
                        <div className="font-medium text-corporate-navy dark:text-white hover:text-corporate-teal transition-colors">
                          {profile.userName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{profile.userEmail}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{profile.companyName || '—'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{profile.companySize}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{profile.jobTitle || '—'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{profile.department}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{profile.yearsManaging ? `${profile.yearsManaging} yrs` : '—'}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {profile.directReports ? `${profile.directReports} reports` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium" title="Receiving">
                        R: {profile.feedbackReceptionScore || '—'}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium" title="Giving">
                        G: {profile.feedbackGivingScore || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {profile.updatedAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                </tr>
              ))}
              {processedProfiles.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No leader profiles found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <LeaderProfileModal 
          profile={selectedProfile} 
          onClose={() => setSelectedProfile(null)} 
        />
      )}
    </div>
  );
};

export default LeaderProfileReports;
