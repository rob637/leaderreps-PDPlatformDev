import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Mail, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Copy,
  Trash2
} from 'lucide-react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { useAppServices } from '../../services/useAppServices';
import { buildModulePath } from '../../services/pathUtils';

const UserManagement = () => {
  const { db } = useAppServices();
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'invites', 'cohorts'
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [cohorts, setCohorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Invite Form State
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    role: 'user',
    cohortId: '',
    customMessage: "You're invited to join the LeaderReps Arena!"
  });
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);

  // Cohort Form State
  const [cohortForm, setCohortForm] = useState({
    name: '',
    startDate: ''
  });
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [savingCohort, setSavingCohort] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, orderBy('email'));
        const snapshot = await getDocs(q);
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } else if (activeTab === 'invites') {
        const invitesRef = collection(db, 'invitations');
        const q = query(invitesRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const invitesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInvites(invitesList);
      } else if (activeTab === 'cohorts') {
        // Already fetched in separate effect, but refresh here
        const cohortsRef = collection(db, 'cohorts');
        const q = query(cohortsRef, orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        const cohortsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCohorts(cohortsList);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [db, activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch Cohorts on mount regardless of tab, for dropdowns
  useEffect(() => {
    const fetchCohorts = async () => {
      try {
        const cohortsRef = collection(db, 'cohorts');
        const q = query(cohortsRef, orderBy('startDate', 'desc'));
        const snapshot = await getDocs(q);
        const cohortsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCohorts(cohortsList);
      } catch (error) {
        console.error("Error fetching cohorts:", error);
      }
    };
    fetchCohorts();
  }, [db]);

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'enable' : 'disable'} this user?`)) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        disabled: !currentStatus
      });
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, disabled: !currentStatus } : u
      ));
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Failed to update user status");
    }
  };

  const handleAssignCohort = async (userId, cohortId) => {
    if (!cohortId) return;
    const cohort = cohorts.find(c => c.id === cohortId);
    if (!cohort) return;

    if (!window.confirm(`Assign user to cohort "${cohort.name}"? This will reset their start date to ${new Date(cohort.startDate.seconds * 1000).toLocaleDateString()}.`)) return;

    try {
      // 1. Update User Profile
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { cohortId });

      // 2. Update Development Plan Start Date
      // Path: modules/{userId}/development_plan/current
      const devPlanPath = buildModulePath(userId, 'development_plan', 'current');
      const devPlanRef = doc(db, devPlanPath);
      
      await updateDoc(devPlanRef, {
        startDate: cohort.startDate
      });

      // Optimistic Update
      setUsers(users.map(u => 
        u.id === userId ? { ...u, cohortId } : u
      ));
      
      alert("User assigned to cohort successfully.");
    } catch (error) {
      console.error("Error assigning cohort:", error);
      alert("Failed to assign cohort. Ensure the user has initialized their account.");
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setSendingInvite(true);
    
    try {
      const existingInvite = invites.find(i => i.email.toLowerCase() === inviteForm.email.toLowerCase());
      if (existingInvite) {
        alert("An invitation has already been sent to this email.");
        setSendingInvite(false);
        return;
      }

      const inviteData = {
        email: inviteForm.email,
        name: inviteForm.name,
        role: inviteForm.role,
        cohortId: inviteForm.cohortId || null,
        customMessage: inviteForm.customMessage,
        status: 'pending',
        createdAt: serverTimestamp(),
        token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        createdBy: 'admin'
      };

      await addDoc(collection(db, 'invitations'), inviteData);
      
      alert(`Invitation created for ${inviteForm.email}`);
      setIsInviteModalOpen(false);
      setInviteForm({
        email: '',
        name: '',
        role: 'user',
        cohortId: '',
        customMessage: "You're invited to join the LeaderReps Arena!"
      });
      fetchData();
    } catch (error) {
      console.error("Error sending invite:", error);
      alert("Failed to create invitation");
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCreateCohort = async (e) => {
    e.preventDefault();
    setSavingCohort(true);

    try {
      const startDate = new Date(cohortForm.startDate);
      // Set to noon to avoid timezone edge cases
      startDate.setHours(12, 0, 0, 0);

      await addDoc(collection(db, 'cohorts'), {
        name: cohortForm.name,
        startDate: Timestamp.fromDate(startDate),
        createdAt: serverTimestamp()
      });

      setIsCohortModalOpen(false);
      setCohortForm({ name: '', startDate: '' });
      fetchData();
    } catch (error) {
      console.error("Error creating cohort:", error);
      alert("Failed to create cohort");
    } finally {
      setSavingCohort(false);
    }
  };

  const handleDeleteInvite = async (inviteId) => {
    if (!window.confirm("Are you sure you want to delete this invitation?")) return;
    try {
      await deleteDoc(doc(db, 'invitations', inviteId));
      setInvites(invites.filter(i => i.id !== inviteId));
    } catch (error) {
      console.error("Error deleting invite:", error);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvites = invites.filter(invite => 
    invite.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invite.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500">Manage users, cohorts, and invitations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCohortModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Users className="w-4 h-4" />
            New Cohort
          </button>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Invite User
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-corporate-teal text-corporate-teal'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Active Users
        </button>
        <button
          onClick={() => setActiveTab('cohorts')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'cohorts'
              ? 'border-corporate-teal text-corporate-teal'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Cohorts
        </button>
        <button
          onClick={() => setActiveTab('invites')}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'invites'
              ? 'border-corporate-teal text-corporate-teal'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Invitations
        </button>
      </div>

      {/* Search Bar */}
      {activeTab !== 'cohorts' && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/20 focus:border-corporate-teal"
          />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Loading data...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {activeTab === 'users' ? (
                  <>
                    <th className="px-6 py-3 font-semibold text-slate-700">User</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Role</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Cohort</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 text-right">Actions</th>
                  </>
                ) : activeTab === 'cohorts' ? (
                  <>
                    <th className="px-6 py-3 font-semibold text-slate-700">Cohort Name</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Start Date</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Members</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 font-semibold text-slate-700">Recipient</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Role</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Cohort</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'users' && (
                filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-corporate-navy/10 flex items-center justify-center text-corporate-navy font-bold">
                            {user.displayName?.[0] || user.email?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.displayName || 'No Name'}</p>
                            <p className="text-slate-500 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role || 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={user.cohortId || ''}
                          onChange={(e) => handleAssignCohort(user.id, e.target.value)}
                          className="text-xs border-slate-200 rounded-md focus:ring-corporate-teal focus:border-corporate-teal"
                        >
                          <option value="">No Cohort</option>
                          {cohorts.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {user.disabled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3" /> Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(user.id, user.disabled)}
                          className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
                            user.disabled 
                              ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {user.disabled ? 'Enable' : 'Disable'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No users found matching your search.
                    </td>
                  </tr>
                )
              )}

              {activeTab === 'cohorts' && (
                cohorts.length > 0 ? (
                  cohorts.map((cohort) => (
                    <tr key={cohort.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {cohort.name}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {cohort.startDate?.toDate ? cohort.startDate.toDate().toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          {users.filter(u => u.cohortId === cohort.id).length} Users
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {/* Add edit/delete actions if needed */}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">
                      No cohorts defined. Create one to get started.
                    </td>
                  </tr>
                )
              )}

              {activeTab === 'invites' && (
                filteredInvites.length > 0 ? (
                  filteredInvites.map((invite) => (
                    <tr key={invite.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{invite.name || 'No Name'}</p>
                            <p className="text-slate-500 text-xs">{invite.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {invite.role || 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {cohorts.find(c => c.id === invite.cohortId)?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invite.status === 'accepted' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {invite.status === 'accepted' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                          {invite.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/register?token=${invite.token}`);
                              alert("Invite link copied to clipboard!");
                            }}
                            className="p-1 text-slate-400 hover:text-corporate-teal transition-colors"
                            title="Copy Invite Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteInvite(invite.id)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Delete Invite"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                      No invitations found.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Invite New User</h3>
              <button 
                onClick={() => setIsInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSendInvite} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={e => setInviteForm({...inviteForm, email: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="colleague@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name (Optional)</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={e => setInviteForm({...inviteForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="John Doe"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={inviteForm.role}
                    onChange={e => setInviteForm({...inviteForm, role: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="coach">Coach</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cohort</label>
                  <select
                    value={inviteForm.cohortId}
                    onChange={e => setInviteForm({...inviteForm, cohortId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  >
                    <option value="">No Cohort</option>
                    {cohorts.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom Message</label>
                <textarea
                  rows="3"
                  value={inviteForm.customMessage}
                  onChange={e => setInviteForm({...inviteForm, customMessage: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                ></textarea>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInvite}
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {sendingInvite ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Cohort Modal */}
      {isCohortModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800">Create New Cohort</h3>
              <button 
                onClick={() => setIsCohortModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateCohort} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cohort Name</label>
                <input
                  type="text"
                  required
                  value={cohortForm.name}
                  onChange={e => setCohortForm({...cohortForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                  placeholder="e.g., Spring 2025"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={cohortForm.startDate}
                  onChange={e => setCohortForm({...cohortForm, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-corporate-teal/50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  All users in this cohort will have their Development Plan start on this date.
                </p>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCohortModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCohort}
                  className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {savingCohort ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Create Cohort
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
