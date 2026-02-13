import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PIPELINE_STAGES, isAdmin, TEAM_MEMBERS, getCanonicalEmail, isSameUser } from '../config/team';

// Re-export for convenience
export { PIPELINE_STAGES };

// Firestore collection name (shared with Corporate Command Center)
const COLLECTION = 'corporate_prospects';

export const useProspectsStore = create((set, get) => ({
  // State
  prospects: [],
  loading: true,
  error: null,
  selectedProspect: null,
  currentUserEmail: null, // Set by the component
  filters: {
    search: '',
    stage: 'all',
    owner: 'me', // Default to showing own prospects; 'me' | 'all' | specific email
  },
  viewMode: 'list', // 'list' | 'kanban'
  
  // Set current user (called on mount) - store canonical email
  setCurrentUser: (email) => set({ currentUserEmail: getCanonicalEmail(email) }),
  
  // Check if current user is admin
  isCurrentUserAdmin: () => isAdmin(get().currentUserEmail),
  
  // Computed - get filtered prospects with ownership logic
  getFilteredProspects: () => {
    const { prospects, filters, currentUserEmail } = get();
    // Note: Could use isAdmin(currentUserEmail) for admin-specific filtering in future
    
    return prospects.filter(p => {
      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase();
        const matchesSearch = 
          p.name?.toLowerCase().includes(search) ||
          p.company?.toLowerCase().includes(search) ||
          p.email?.toLowerCase().includes(search) ||
          p.title?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Stage filter
      if (filters.stage !== 'all' && p.stage !== filters.stage) {
        return false;
      }
      
      // Owner filter
      if (filters.owner === 'me') {
        // Show only current user's prospects (using alias-aware comparison)
        const ownerEmail = p.owner || p.ownerEmail;
        if (!isSameUser(ownerEmail, currentUserEmail)) {
          return false;
        }
      } else if (filters.owner === 'all') {
        // Show all - only admins should use this, but we allow it since
        // the filter option visibility is controlled by the UI
      } else if (filters.owner) {
        // Specific team member filter (using alias-aware comparison)
        const ownerEmail = p.owner || p.ownerEmail;
        if (!isSameUser(ownerEmail, filters.owner)) {
          return false;
        }
      }
      
      return true;
    });
  },
  
  getProspectsByStage: (stage) => {
    return get().getFilteredProspects().filter(p => p.stage === stage);
  },
  
  // Get prospects by specific team member
  getProspectsByOwner: (email) => {
    return get().prospects.filter(p => {
      const ownerEmail = p.owner || p.ownerEmail;
      return isSameUser(ownerEmail, email);
    });
  },
  
  // Get team statistics (admin only)
  getTeamStats: () => {
    const { prospects, currentUserEmail } = get();
    if (!isAdmin(currentUserEmail)) return null;
    
    const stats = {};
    TEAM_MEMBERS.forEach(member => {
      const memberProspects = prospects.filter(p => {
        const ownerEmail = p.owner || p.ownerEmail;
        return isSameUser(ownerEmail, member.email);
      });
      stats[member.email] = {
        total: memberProspects.length,
        byStage: PIPELINE_STAGES.reduce((acc, stage) => {
          acc[stage.id] = memberProspects.filter(p => p.stage === stage.id).length;
          return acc;
        }, {}),
        value: memberProspects.reduce((sum, p) => sum + (p.value || 0), 0)
      };
    });
    return stats;
  },

  // Actions
  setFilter: (key, value) => {
    set(state => ({
      filters: { ...state.filters, [key]: value }
    }));
  },
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setSelectedProspect: (prospect) => set({ selectedProspect: prospect }),
  
  clearSelectedProspect: () => set({ selectedProspect: null }),

  // Firestore operations
  subscribeToProspects: () => {
    set({ loading: true });
    
    const q = query(
      collection(db, COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const prospects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure stage has a default value
          stage: doc.data().stage || 'new'
        }));
        set({ prospects, loading: false, error: null });
      },
      (error) => {
        console.error('Error fetching prospects:', error);
        set({ error: error.message, loading: false });
      }
    );
    
    return unsubscribe;
  },

  fetchProspects: async () => {
    set({ loading: true });
    try {
      const q = query(
        collection(db, COLLECTION),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const prospects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        stage: doc.data().stage || 'new'
      }));
      set({ prospects, loading: false, error: null });
    } catch (error) {
      console.error('Error fetching prospects:', error);
      set({ error: error.message, loading: false });
    }
  },

  addProspect: async (prospectData) => {
    try {
      // Normalize owner email to canonical form
      const ownerEmail = prospectData.owner || prospectData.ownerEmail;
      const canonicalOwner = ownerEmail ? getCanonicalEmail(ownerEmail) : null;
      
      const newProspect = {
        ...prospectData,
        owner: canonicalOwner,
        ownerEmail: canonicalOwner,
        stage: prospectData.stage || 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, COLLECTION), newProspect);
      
      // Optimistically update local state
      set(state => ({
        prospects: [{ id: docRef.id, ...newProspect }, ...state.prospects]
      }));
      
      return { id: docRef.id, ...newProspect };
    } catch (error) {
      console.error('Error adding prospect:', error);
      throw error;
    }
  },

  updateProspect: async (id, updates) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      
      // Normalize owner email if being updated
      let normalizedUpdates = { ...updates };
      if (updates.owner || updates.ownerEmail) {
        const ownerEmail = updates.owner || updates.ownerEmail;
        const canonicalOwner = getCanonicalEmail(ownerEmail);
        normalizedUpdates.owner = canonicalOwner;
        normalizedUpdates.ownerEmail = canonicalOwner;
      }
      
      const updateData = {
        ...normalizedUpdates,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, updateData);
      
      // Optimistically update local state
      set(state => ({
        prospects: state.prospects.map(p => 
          p.id === id ? { ...p, ...updateData } : p
        ),
        selectedProspect: state.selectedProspect?.id === id 
          ? { ...state.selectedProspect, ...updateData }
          : state.selectedProspect
      }));
    } catch (error) {
      console.error('Error updating prospect:', error);
      throw error;
    }
  },

  updateProspectStage: async (id, newStage) => {
    return get().updateProspect(id, { stage: newStage });
  },

  deleteProspect: async (id) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      
      // Optimistically update local state
      set(state => ({
        prospects: state.prospects.filter(p => p.id !== id),
        selectedProspect: state.selectedProspect?.id === id 
          ? null 
          : state.selectedProspect
      }));
    } catch (error) {
      console.error('Error deleting prospect:', error);
      throw error;
    }
  },
}));
