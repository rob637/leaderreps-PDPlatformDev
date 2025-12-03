import React, { useState, useEffect } from 'react';
import { useAppServices } from '../../services/useAppServices';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Search, User, Lock, Unlock } from 'lucide-react';

const AdminAccessViewer = () => {
  const { db } = useAppServices();
  const [targetUserId, setTargetUserId] = useState('');
  const [userData, setUserData] = useState(null);
  const [accessReport, setAccessReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [masterPlan, setMasterPlan] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Load Master Plan and Users once
  useEffect(() => {
    const loadData = async () => {
      // Load Plan
      const weeksRef = collection(db, 'development_plan_v1');
      const q = query(weeksRef, orderBy('weekNumber', 'asc'));
      const snapshot = await getDocs(q);
      setMasterPlan(snapshot.docs.map(d => d.data()));

      // Load Users
      try {
        const usersRef = collection(db, 'users');
        const userSnapshot = await getDocs(usersRef);
        const users = userSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Sort by name or email
        users.sort((a, b) => {
            const nameA = a.displayName || a.email || '';
            const nameB = b.displayName || b.email || '';
            return nameA.localeCompare(nameB);
        });
        setUsersList(users);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    };
    loadData();
  }, [db]);

  const handleSearch = async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      // 1. Get User Profile (optional, for name)
      // Assuming 'users' collection
      const userDoc = await getDoc(doc(db, 'users', targetUserId));
      const userProfile = userDoc.exists() ? userDoc.data() : { displayName: 'Unknown' };

      // 2. Get Dev Plan Data
      // TRY NEW PATH FIRST: modules/{userId}/development_plan/current
      let planDoc = await getDoc(doc(db, 'modules', targetUserId, 'development_plan', 'current'));
      
      if (!planDoc.exists()) {
          // Fallback to old path: users/{userId}/program_data/development_plan
          planDoc = await getDoc(doc(db, 'users', targetUserId, 'program_data', 'development_plan'));
      }
      
      if (planDoc.exists()) {
        const planData = planDoc.data();
        setUserData({ id: targetUserId, ...userProfile, ...planData });
        generateReport(planData);
      } else {
        alert('User has no development plan data (checked both modules/ and users/ paths).');
        setUserData(null);
        setAccessReport(null);
      }
    } catch (e) {
      console.error(e);
      alert('Error fetching user data');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = (userPlan) => {
    // Logic from useAccessControl
    // Calculate current week index based on startDate or manual index
    let currentWeekIndex = userPlan.currentWeekIndex || 0;
    
    // (Simplified time logic for viewer - just use stored index or 0)
    // If we wanted exact parity, we'd duplicate the time calc from useDevPlan
    
    const unlockedWeeks = masterPlan.filter((_, index) => index <= currentWeekIndex);
    
    // Aggregate
    const report = {
      currentWeek: currentWeekIndex + 1,
      contentCount: 0,
      repsCount: 0,
      items: []
    };

    unlockedWeeks.forEach(week => {
      if (week.reps) {
        week.reps.forEach(r => {
          report.items.push({ type: 'Rep', ...r, week: week.weekNumber });
          report.repsCount++;
        });
      }
      if (week.content) {
        week.content.forEach(c => {
          report.items.push({ type: 'Content', ...c, week: week.weekNumber });
          report.contentCount++;
        });
      }
      // ... others
    });
    
    setAccessReport(report);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <User className="w-5 h-5" /> Admin Access Viewer
      </h3>
      
      <div className="flex gap-2 mb-6">
        <select
            value={targetUserId}
            onChange={e => setTargetUserId(e.target.value)}
            className="border p-2 rounded flex-1 bg-white text-sm"
        >
            <option value="">Select a User...</option>
            {usersList.map(user => (
                <option key={user.id} value={user.id}>
                    {user.displayName || 'No Name'} ({user.email || 'No Email'})
                </option>
            ))}
        </select>
        <button 
            onClick={handleSearch} 
            disabled={!targetUserId || loading}
            className="bg-corporate-teal text-white px-4 py-2 rounded font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="w-4 h-4" /> Check Access
        </button>
      </div>

      {loading && <p>Loading...</p>}

      {userData && accessReport && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded border">
            <p><strong>User:</strong> {userData.displayName || userData.id}</p>
            <p><strong>Current Week:</strong> {accessReport.currentWeek}</p>
            <p><strong>Unlocked Items:</strong> {accessReport.items.length}</p>
          </div>

          <div className="h-64 overflow-y-auto border rounded">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="p-2">Week</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Label</th>
                  <th className="p-2">ID</th>
                </tr>
              </thead>
              <tbody>
                {accessReport.items.map((item, i) => (
                  <tr key={i} className="border-b hover:bg-slate-50">
                    <td className="p-2">{item.week}</td>
                    <td className="p-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.type === 'Rep' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="p-2">{item.repLabel || item.contentItemLabel}</td>
                    <td className="p-2 font-mono text-xs text-slate-500">{item.repId || item.contentItemId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccessViewer;
