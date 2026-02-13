import { create } from 'zustand';
import { collection, doc, addDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

// Outreach channel types
export const CHANNELS = [
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { value: 'call', label: 'Call', icon: 'Phone' },
  { value: 'text', label: 'Text', icon: 'MessageSquare' },
];

// Activity outcomes
export const OUTCOMES = [
  { value: 'sent', label: 'Sent' },
  { value: 'opened', label: 'Opened' },
  { value: 'clicked', label: 'Clicked' },
  { value: 'replied', label: 'Replied' },
  { value: 'meeting_booked', label: 'Meeting Booked' },
  { value: 'not_interested', label: 'Not Interested' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'voicemail', label: 'Left Voicemail' },
  { value: 'connected', label: 'Connected' },
];

export const useOutreachStore = create((set, get) => ({
  // Templates
  templates: [],
  templatesLoading: false,
  
  // Sequences
  sequences: [],
  sequencesLoading: false,
  
  // Activities
  activities: [],
  activitiesLoading: false,
  
  // Unsubscribe functions
  unsubscribers: [],
  
  // Initialize real-time subscriptions
  initialize: () => {
    const { unsubscribers } = get();
    
    // Clean up existing listeners
    unsubscribers.forEach(unsub => unsub());
    
    const newUnsubscribers = [];
    
    // Subscribe to templates
    set({ templatesLoading: true });
    const templatesQuery = query(
      collection(db, 'outreach_templates'),
      orderBy('createdAt', 'desc')
    );
    const unsubTemplates = onSnapshot(templatesQuery, (snapshot) => {
      const templates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ templates, templatesLoading: false });
    }, (error) => {
      console.error('Templates listener error:', error);
      set({ templatesLoading: false });
    });
    newUnsubscribers.push(unsubTemplates);
    
    // Subscribe to sequences
    set({ sequencesLoading: true });
    const sequencesQuery = query(
      collection(db, 'outreach_sequences'),
      orderBy('createdAt', 'desc')
    );
    const unsubSequences = onSnapshot(sequencesQuery, (snapshot) => {
      const sequences = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ sequences, sequencesLoading: false });
    }, (error) => {
      console.error('Sequences listener error:', error);
      set({ sequencesLoading: false });
    });
    newUnsubscribers.push(unsubSequences);
    
    // Subscribe to recent activities (last 100)
    set({ activitiesLoading: true });
    const activitiesQuery = query(
      collection(db, 'outreach_activities'),
      orderBy('createdAt', 'desc')
    );
    const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ activities, activitiesLoading: false });
    }, (error) => {
      console.error('Activities listener error:', error);
      set({ activitiesLoading: false });
    });
    newUnsubscribers.push(unsubActivities);
    
    set({ unsubscribers: newUnsubscribers });
  },
  
  cleanup: () => {
    const { unsubscribers } = get();
    unsubscribers.forEach(unsub => unsub());
    set({ unsubscribers: [] });
  },
  
  // Template actions
  createTemplate: async (templateData, userId, userName) => {
    try {
      await addDoc(collection(db, 'outreach_templates'), {
        ...templateData,
        ownerId: userId,
        ownerName: userName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Template created');
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create template');
    }
  },
  
  updateTemplate: async (templateId, updates) => {
    try {
      await updateDoc(doc(db, 'outreach_templates', templateId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      toast.success('Template updated');
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Failed to update template');
    }
  },
  
  deleteTemplate: async (templateId) => {
    try {
      await deleteDoc(doc(db, 'outreach_templates', templateId));
      toast.success('Template deleted');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  },
  
  // Sequence actions
  createSequence: async (sequenceData, userId, userName) => {
    try {
      await addDoc(collection(db, 'outreach_sequences'), {
        ...sequenceData,
        ownerId: userId,
        ownerName: userName,
        activeProspects: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Sequence created');
    } catch (error) {
      console.error('Error creating sequence:', error);
      toast.error('Failed to create sequence');
    }
  },
  
  updateSequence: async (sequenceId, updates) => {
    try {
      await updateDoc(doc(db, 'outreach_sequences', sequenceId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      toast.success('Sequence updated');
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast.error('Failed to update sequence');
    }
  },
  
  deleteSequence: async (sequenceId) => {
    try {
      await deleteDoc(doc(db, 'outreach_sequences', sequenceId));
      toast.success('Sequence deleted');
    } catch (error) {
      console.error('Error deleting sequence:', error);
      toast.error('Failed to delete sequence');
    }
  },
  
  // Activity actions
  logActivity: async (activityData, userId, userName) => {
    try {
      const docRef = await addDoc(collection(db, 'outreach_activities'), {
        ...activityData,
        ownerId: userId,
        ownerName: userName,
        createdAt: serverTimestamp(),
      });
      
      // Update prospect's lastContactedAt
      if (activityData.prospectId) {
        try {
          await updateDoc(doc(db, 'corporate_prospects', activityData.prospectId), {
            lastContactedAt: new Date().toISOString(),
            lastOutreachChannel: activityData.channel,
            lastOutreachOutcome: activityData.outcome,
          });
        } catch (e) {
          // Prospect might not exist
        }
      }
      
      toast.success('Activity logged');
      return docRef.id;
    } catch (error) {
      console.error('Error logging activity:', error);
      toast.error('Failed to log activity');
      return null;
    }
  },
  
  updateActivity: async (activityId, updates) => {
    try {
      await updateDoc(doc(db, 'outreach_activities', activityId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      toast.success('Activity updated');
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    }
  },
  
  deleteActivity: async (activityId) => {
    try {
      await deleteDoc(doc(db, 'outreach_activities', activityId));
      toast.success('Activity deleted');
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  },
  
  // Get activities for a specific prospect
  getProspectActivities: (prospectId) => {
    const { activities } = get();
    return activities.filter(a => a.prospectId === prospectId);
  },
  
  // Get activity stats
  getActivityStats: () => {
    const { activities } = get();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const todayActivities = activities.filter(a => {
      const date = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return date >= today;
    });
    
    const thisWeekActivities = activities.filter(a => {
      const date = a.createdAt?.toDate?.() || new Date(a.createdAt);
      return date >= thisWeekStart;
    });
    
    const replies = activities.filter(a => a.outcome === 'replied' || a.outcome === 'meeting_booked');
    const meetings = activities.filter(a => a.outcome === 'meeting_booked');
    
    return {
      today: todayActivities.length,
      thisWeek: thisWeekActivities.length,
      total: activities.length,
      replies: replies.length,
      meetings: meetings.length,
      replyRate: activities.length > 0 ? ((replies.length / activities.length) * 100).toFixed(1) : 0,
    };
  },
}));
