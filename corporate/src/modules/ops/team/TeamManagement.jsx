import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Mail, MoreHorizontal, 
  Check, X, Edit2, Trash2, Clock, Activity,
  Crown, Eye, Settings, Search, Filter, Download,
  AlertCircle, CheckCircle, RefreshCw, Copy
} from 'lucide-react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * Team Management & Permissions
 * 
 * Multi-user support with role-based access:
 * - Invite team members via email
 * - Assign roles: Admin, Manager, Sales Rep, Viewer
 * - Track activity per user
 * - Manage permissions
 */

const ROLES = {
  admin: { label: 'Admin', color: 'purple', description: 'Full access to all features', permissions: ['all'] },
  manager: { label: 'Manager', color: 'blue', description: 'Can manage team and view reports', permissions: ['view', 'edit', 'manage_team'] },
  sales_rep: { label: 'Sales Rep', color: 'green', description: 'Can manage prospects and proposals', permissions: ['view', 'edit'] },
  viewer: { label: 'Viewer', color: 'slate', description: 'Read-only access', permissions: ['view'] }
};

const TeamManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('sales_rep');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTeamData();
  }, []);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Fetch team members
      const membersSnap = await getDocs(query(collection(db, 'corporate_team'), orderBy('joinedAt', 'desc')));
      const members = membersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTeamMembers(members);

      // Fetch pending invitations
      const invitesSnap = await getDocs(query(
        collection(db, 'corporate_invitations'),
        where('status', '==', 'pending')
      ));
      const invites = invitesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvitations(invites);

      // Fetch activity log
      const activitySnap = await getDocs(query(
        collection(db, 'corporate_activity_log'),
        orderBy('timestamp', 'desc')
      ));
      const activities = activitySnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 50);
      setActivityLog(activities);

    } catch (err) {
      console.error("Error fetching team data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;

    try {
      await addDoc(collection(db, 'corporate_invitations'), {
        email: inviteEmail.toLowerCase().trim(),
        role: inviteRole,
        invitedBy: user?.uid,
        invitedByName: user?.displayName,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Log activity
      await addDoc(collection(db, 'corporate_activity_log'), {
        type: 'invitation_sent',
        userId: user?.uid,
        userName: user?.displayName,
        details: `Invited ${inviteEmail} as ${ROLES[inviteRole].label}`,
        timestamp: new Date().toISOString()
      });

      setInviteEmail('');
      setShowInviteModal(false);
      fetchTeamData();
    } catch (err) {
      console.error("Error sending invitation:", err);
      alert("Failed to send invitation");
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await updateDoc(doc(db, 'corporate_team', memberId), { role: newRole });
      setTeamMembers(teamMembers.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    try {
      await deleteDoc(doc(db, 'corporate_team', memberId));
      setTeamMembers(teamMembers.filter(m => m.id !== memberId));
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleCancelInvite = async (inviteId) => {
    try {
      await deleteDoc(doc(db, 'corporate_invitations', inviteId));
      setInvitations(invitations.filter(i => i.id !== inviteId));
    } catch (err) {
      console.error("Error canceling invitation:", err);
    }
  };

  const filteredMembers = teamMembers.filter(m => {
    const matchesSearch = m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || m.role === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-corporate-teal" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-corporate-navy">Team Management</h1>
          <p className="text-slate-500 mt-1">Manage team members, roles, and permissions</p>
        </div>
        <button 
          onClick={() => setShowInviteModal(true)}
          className="bg-corporate-teal text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-teal-600"
        >
          <UserPlus size={16} /> Invite Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{teamMembers.length}</div>
              <div className="text-xs text-slate-500">Team Members</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Crown className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {teamMembers.filter(m => m.role === 'admin').length}
              </div>
              <div className="text-xs text-slate-500">Admins</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{invitations.length}</div>
              <div className="text-xs text-slate-500">Pending Invites</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{activityLog.length}</div>
              <div className="text-xs text-slate-500">Activities Today</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Team Members List */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-bold text-corporate-navy">Team Members</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm w-48"
                  />
                </div>
                <select 
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="all">All Roles</option>
                  {Object.entries(ROLES).map(([key, role]) => (
                    <option key={key} value={key}>{role.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No team members yet</p>
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="mt-3 text-corporate-teal text-sm hover:underline"
                >
                  Invite your first team member
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-4 p-4 hover:bg-slate-50">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-corporate-navy to-corporate-teal flex items-center justify-center text-white font-bold">
                      {member.name?.charAt(0) || member.email?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{member.name || 'No name'}</h4>
                      <p className="text-xs text-slate-500">{member.email}</p>
                    </div>
                    <select 
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border-0 ${
                        ROLES[member.role]?.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                        ROLES[member.role]?.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        ROLES[member.role]?.color === 'green' ? 'bg-green-100 text-green-700' :
                        'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {Object.entries(ROLES).map(([key, role]) => (
                        <option key={key} value={key}>{role.label}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => setShowActivityModal(member)}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="View Activity"
                    >
                      <Activity size={16} />
                    </button>
                    <button 
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-6">
              <div className="p-4 border-b border-slate-200">
                <h2 className="font-bold text-corporate-navy flex items-center gap-2">
                  <Mail size={16} className="text-amber-500" />
                  Pending Invitations
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {invitations.map((invite) => (
                  <div key={invite.id} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800">{invite.email}</h4>
                      <p className="text-xs text-slate-500">
                        Invited as {ROLES[invite.role]?.label} by {invite.invitedByName}
                      </p>
                    </div>
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                      Pending
                    </span>
                    <button 
                      onClick={() => handleCancelInvite(invite.id)}
                      className="p-2 text-slate-400 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="col-span-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm sticky top-6">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-bold text-corporate-navy flex items-center gap-2">
                <Activity size={16} />
                Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {activityLog.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No activity recorded</p>
                </div>
              ) : (
                activityLog.slice(0, 20).map((activity) => (
                  <div key={activity.id} className="p-3 hover:bg-slate-50">
                    <p className="text-sm text-slate-700">{activity.details}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {activity.userName} • {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInviteModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-xl font-bold text-corporate-navy flex items-center gap-2">
                <UserPlus size={20} />
                Invite Team Member
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input 
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <select 
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                >
                  {Object.entries(ROLES).map(([key, role]) => (
                    <option key={key} value={key}>{role.label} - {role.description}</option>
                  ))}
                </select>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-xs text-slate-500">
                  An invitation email will be sent to this address. They'll need to create an account 
                  or sign in to join your team.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex gap-3">
              <button 
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600"
              >
                Cancel
              </button>
              <button 
                onClick={handleInvite}
                className="flex-1 px-4 py-2 bg-corporate-teal text-white rounded-lg font-bold hover:bg-teal-600"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Detail Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4" onClick={() => setShowActivityModal(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-corporate-navy to-corporate-teal flex items-center justify-center text-white font-bold text-lg">
                {showActivityModal.name?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="text-xl font-bold text-corporate-navy">{showActivityModal.name}</h3>
                <p className="text-slate-500 text-sm">{showActivityModal.email}</p>
              </div>
              <button onClick={() => setShowActivityModal(null)} className="ml-auto text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <h4 className="font-bold text-slate-700 mb-3">Recent Activity</h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {activityLog.filter(a => a.userId === showActivityModal.userId).length === 0 ? (
                  <p className="text-slate-400 text-sm">No recorded activity for this user</p>
                ) : (
                  activityLog.filter(a => a.userId === showActivityModal.userId).slice(0, 10).map((activity) => (
                    <div key={activity.id} className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-700">{activity.details}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
