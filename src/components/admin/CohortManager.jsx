import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Plus, Edit, Trash2, Save, X, ChevronRight, UserPlus, Search, Check, Loader
} from 'lucide-react';
import { useAppServices } from '../../services/useAppServices';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy, writeBatch
} from 'firebase/firestore';
import { Card } from '../ui';

const CohortManager = () => {
  const { db } = useAppServices();
  const [cohorts, setCohorts] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [currentCohort, setCurrentCohort] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  // Fetch Cohorts and Users
  useEffect(() => {
    const fetchData = async () => {
      if (!db) return;
      try {
        // Fetch cohorts
        const cohortQuery = query(collection(db, 'cohorts'), orderBy('startDate', 'desc'));
        const cohortSnapshot = await getDocs(cohortQuery);
        setCohorts(cohortSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setAllUsers(usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [db]);

  const handleSave = async (cohort) => {
    try {
      const id = cohort.id || `cohort-${Date.now()}`;
      const data = {
        ...cohort,
        updatedAt: serverTimestamp()
      };
      if (!cohort.id) {
        data.createdAt = serverTimestamp();
      }
      
      await setDoc(doc(db, 'cohorts', id), data);
      
      // Refresh
      const q = query(collection(db, 'cohorts'), orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);
      setCohorts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      
      setIsEditing(false);
      setCurrentCohort(null);
    } catch (error) {
      console.error("Error saving cohort:", error);
      alert("Error saving cohort");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This will not delete the users, but will unlink them.")) return;
    try {
      await deleteDoc(doc(db, 'cohorts', id));
      setCohorts(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error("Error deleting cohort:", error);
    }
  };

  // Open user assignment modal
  const openAssignModal = (cohort) => {
    setCurrentCohort(cohort);
    setSelectedUsers(cohort.memberIds || []);
    setUserSearch('');
    setIsAssigning(true);
  };

  // Save user assignments
  const handleSaveAssignments = async () => {
    if (!currentCohort?.id) return;
    setSavingAssignments(true);
    
    try {
      const batch = writeBatch(db);
      const oldMembers = currentCohort.memberIds || [];
      const newMembers = selectedUsers;
      
      // Users to add to cohort
      const toAdd = newMembers.filter(id => !oldMembers.includes(id));
      // Users to remove from cohort
      const toRemove = oldMembers.filter(id => !newMembers.includes(id));
      
      // Update user documents - ADD
      for (const userId of toAdd) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, { 
          cohortId: currentCohort.id,
          startDate: currentCohort.startDate // Inherit cohort start date
        });
      }
      
      // Update user documents - REMOVE
      for (const userId of toRemove) {
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, { 
          cohortId: null,
          // Keep their startDate so they don't lose progress
        });
      }
      
      // Update cohort document
      const cohortRef = doc(db, 'cohorts', currentCohort.id);
      batch.update(cohortRef, { 
        memberIds: newMembers,
        updatedAt: serverTimestamp()
      });
      
      await batch.commit();
      
      // Refresh cohorts
      const q = query(collection(db, 'cohorts'), orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);
      setCohorts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      
      // Refresh users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setAllUsers(usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      
      setIsAssigning(false);
      setCurrentCohort(null);
    } catch (error) {
      console.error("Error saving assignments:", error);
      alert("Error saving assignments: " + error.message);
    } finally {
      setSavingAssignments(false);
    }
  };

  // Filter users for search
  const filteredUsers = allUsers.filter(user => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (user.displayName || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q)
    );
  });

  // Get users currently in this cohort
  const getCohortUsers = (cohortId) => {
    return allUsers.filter(u => u.cohortId === cohortId);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-corporate-navy flex items-center gap-2">
            <Users className="w-8 h-8 text-corporate-teal" />
            Cohort Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage user groups and start dates.</p>
        </div>
        <button 
          onClick={() => { setCurrentCohort({}); setIsEditing(true); }}
          className="bg-corporate-teal text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-teal-700"
        >
          <Plus className="w-5 h-5" /> New Cohort
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading cohorts...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cohorts.map(cohort => (
            <Card key={cohort.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <Calendar className="w-6 h-6 text-corporate-navy" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setCurrentCohort(cohort); setIsEditing(true); }}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 dark:text-slate-400"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cohort.id)}
                    className="p-2 hover:bg-red-50 rounded-full text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-bold text-lg text-corporate-navy mb-1">{cohort.name}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Starts: {cohort.startDate ? new Date(cohort.startDate.seconds * 1000).toLocaleDateString() : 'Not set'}
              </p>
              
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t pt-3">
                <button 
                  onClick={() => openAssignModal(cohort)}
                  className="flex items-center gap-1 text-corporate-teal hover:text-teal-700 font-medium"
                >
                  <UserPlus className="w-3 h-3" />
                  {getCohortUsers(cohort.id).length} Members
                </button>
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 px-2 py-0.5 rounded-full">
                  Active
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-corporate-navy">
                {currentCohort.id ? 'Edit Cohort' : 'New Cohort'}
              </h3>
              <button onClick={() => setIsEditing(false)} className="p-1 hover:bg-slate-200 rounded-full">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Cohort Name</label>
                <input 
                  type="text" 
                  value={currentCohort.name || ''} 
                  onChange={e => setCurrentCohort({...currentCohort, name: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal"
                  placeholder="e.g. January 2026 Alpha"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={currentCohort.startDate ? new Date(currentCohort.startDate.seconds * 1000).toISOString().split('T')[0] : ''} 
                  onChange={e => {
                    const date = new Date(e.target.value);
                    // Set to noon to avoid timezone issues for now, or midnight UTC
                    date.setUTCHours(12,0,0,0);
                    setCurrentCohort({
                        ...currentCohort, 
                        startDate: { seconds: Math.floor(date.getTime() / 1000) }
                    });
                  }}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This date corresponds to Day 1 of the program.
                </p>
              </div>
            </div>
            
            <div className="p-4 border-t bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleSave(currentCohort)}
                className="px-4 py-2 bg-corporate-teal text-white font-bold rounded-lg hover:bg-teal-700"
              >
                Save Cohort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {isAssigning && currentCohort && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <div>
                <h3 className="font-bold text-corporate-navy">Manage Members</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{currentCohort.name}</p>
              </div>
              <button onClick={() => setIsAssigning(false)} className="p-1 hover:bg-slate-200 rounded-full">
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>
            
            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-corporate-teal"
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {selectedUsers.length} users selected
              </p>
            </div>
            
            {/* User List */}
            <div className="flex-1 overflow-y-auto p-2">
              {filteredUsers.length === 0 ? (
                <p className="text-center text-slate-400 py-8">No users found</p>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map(user => {
                    const isSelected = selectedUsers.includes(user.id);
                    const isInOtherCohort = user.cohortId && user.cohortId !== currentCohort.id;
                    
                    return (
                      <div 
                        key={user.id}
                        onClick={() => {
                          if (isInOtherCohort) return;
                          setSelectedUsers(prev => 
                            isSelected 
                              ? prev.filter(id => id !== user.id)
                              : [...prev, user.id]
                          );
                        }}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors
                          ${isSelected ? 'bg-corporate-teal/10 border border-corporate-teal' : 'bg-slate-50 dark:bg-slate-800 border border-transparent hover:bg-slate-100'}
                          ${isInOtherCohort ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center
                          ${isSelected ? 'bg-corporate-teal border-corporate-teal' : 'border-slate-300 dark:border-slate-600'}
                        `}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {user.displayName || 'No Name'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                        </div>
                        {isInOtherCohort && (
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 px-2 py-1 rounded">
                            In other cohort
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsAssigning(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAssignments}
                disabled={savingAssignments}
                className="px-4 py-2 bg-corporate-teal text-white font-bold rounded-lg hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
              >
                {savingAssignments ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CohortManager;
