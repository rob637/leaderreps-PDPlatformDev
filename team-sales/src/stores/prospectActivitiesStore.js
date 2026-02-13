import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCanonicalEmail } from '../config/team';

const COLLECTION = 'prospect_activities';

export const useActivitiesStore = create((set, get) => ({
  // State - activities keyed by prospectId
  activitiesByProspect: {},
  loadingProspects: new Set(),
  error: null,
  recentActivities: [],

  // Subscribe to activities for a specific prospect
  subscribeToProspectActivities: (prospectId) => {
    set(state => ({
      loadingProspects: new Set([...state.loadingProspects, prospectId])
    }));
    
    const q = query(
      collection(db, COLLECTION),
      where('prospectId', '==', prospectId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        set(state => {
          const newLoadingProspects = new Set(state.loadingProspects);
          newLoadingProspects.delete(prospectId);
          return {
            activitiesByProspect: {
              ...state.activitiesByProspect,
              [prospectId]: activities
            },
            loadingProspects: newLoadingProspects
          };
        });
      },
      (error) => {
        console.error('Error fetching activities:', error);
        set(state => {
          const newLoadingProspects = new Set(state.loadingProspects);
          newLoadingProspects.delete(prospectId);
          return {
            error: error.message,
            loadingProspects: newLoadingProspects
          };
        });
      }
    );
    
    return unsubscribe;
  },

  // Subscribe to recent activities across all prospects for a user
  subscribeToRecentActivities: (userEmail, limitCount = 20) => {
    const canonicalEmail = getCanonicalEmail(userEmail);
    const q = query(
      collection(db, COLLECTION),
      where('userEmail', '==', canonicalEmail),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const activities = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        set({ recentActivities: activities });
      },
      (error) => {
        console.error('Error fetching recent activities:', error);
      }
    );
    
    return unsubscribe;
  },

  // Get activities for a prospect from local state
  getActivitiesForProspect: (prospectId) => {
    return get().activitiesByProspect[prospectId] || [];
  },

  // Add an activity/comment
  addActivity: async (activityData, userEmail, userName) => {
    try {
      const canonicalEmail = getCanonicalEmail(userEmail);
      const newActivity = {
        ...activityData,
        userEmail: canonicalEmail,
        userName: userName || userEmail.split('@')[0],
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, COLLECTION), newActivity);
      
      // Optimistically update local state
      const prospectId = activityData.prospectId;
      set(state => ({
        activitiesByProspect: {
          ...state.activitiesByProspect,
          [prospectId]: [
            { id: docRef.id, ...newActivity },
            ...(state.activitiesByProspect[prospectId] || [])
          ]
        }
      }));
      
      return { id: docRef.id, ...newActivity };
    } catch (error) {
      console.error('Error adding activity:', error);
      throw error;
    }
  },

  // Delete an activity
  deleteActivity: async (activityId, prospectId) => {
    try {
      await deleteDoc(doc(db, COLLECTION, activityId));
      
      set(state => ({
        activitiesByProspect: {
          ...state.activitiesByProspect,
          [prospectId]: (state.activitiesByProspect[prospectId] || [])
            .filter(a => a.id !== activityId)
        }
      }));
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error;
    }
  },
}));
