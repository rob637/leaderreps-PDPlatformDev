import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { Loader, Download, Search } from 'lucide-react';

const LeaderProfileReports = () => {
  const { db } = useAppServices();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredProfiles = profiles.filter(p => 
    p.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = [
      'Name', 'Email', 'Company', 'Role', 'Dept', 
      'Years Managing', 'Direct Reports', 'Leadership Style', 
      'Current Habit', 'Success Definition', 'Feedback Reception', 'Feedback Giving'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredProfiles.map(p => [
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-corporate-navy">Leader Profile Reports</h2>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-corporate-teal/90"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Experience</th>
                <th className="px-4 py-3">Feedback (R/G)</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredProfiles.map(profile => (
                <tr key={profile.userId} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-corporate-navy">{profile.userName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{profile.userEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{profile.companyName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{profile.companySize}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{profile.jobTitle}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{profile.department}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{profile.yearsManaging} managing</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{profile.directReports} reports</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 rounded text-xs" title="Receiving">
                        R: {profile.feedbackReceptionScore || '-'}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 rounded text-xs" title="Giving">
                        G: {profile.feedbackGivingScore || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                    {profile.updatedAt?.toDate ? profile.updatedAt.toDate().toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
              {filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No profiles found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderProfileReports;
