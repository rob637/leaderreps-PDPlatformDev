/**
 * LR-Instantly - Sequence Engine Store
 * 
 * LeaderReps' native email sequence engine - an Instantly.ai replacement.
 * Manages email sequence enrollments, processing queue, and automation.
 * Works with Gmail OAuth for sending and syncs with Firebase for state.
 * 
 * @module LR-Instantly
 * @see docs/SEQUENCE-ENGINE-PLAN.md
 */

import { create } from 'zustand';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

// Enrollment status types
export const ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused', 
  COMPLETED: 'completed',
  REPLIED: 'replied',
  BOUNCED: 'bounced',
  ERROR: 'error',
  CANCELLED: 'cancelled'
};

// Status display config
export const STATUS_CONFIG = {
  active: { label: 'Active', color: 'emerald', icon: 'Zap' },
  paused: { label: 'Paused', color: 'amber', icon: 'Pause' },
  completed: { label: 'Completed', color: 'blue', icon: 'CheckCircle' },
  replied: { label: 'Replied', color: 'green', icon: 'MessageSquare' },
  bounced: { label: 'Bounced', color: 'red', icon: 'AlertTriangle' },
  error: { label: 'Error', color: 'red', icon: 'XCircle' },
  cancelled: { label: 'Cancelled', color: 'slate', icon: 'XCircle' }
};

// Helper to add days to a timestamp
function addDaysToDate(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper for variable substitution
export function substituteVariables(text, variables) {
  if (!text || !variables) return text;
  
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(regex, value || '');
  }
  return result;
}

export const useSequenceStore = create((set, get) => ({
  // Enrollments state
  enrollments: [],
  enrollmentsLoading: false,
  
  // Sequences with steps (enhanced from outreachStore)
  sequencesWithSteps: [],
  
  // Unsubscribers
  unsubscribers: [],
  
  /**
   * Initialize real-time subscriptions
   */
  initialize: () => {
    const { unsubscribers } = get();
    
    // Clean up existing listeners
    unsubscribers.forEach(unsub => unsub());
    
    const newUnsubscribers = [];
    
    // Subscribe to enrollments
    set({ enrollmentsLoading: true });
    const enrollmentsQuery = query(
      collection(db, 'sequence_enrollments'),
      orderBy('enrolledAt', 'desc')
    );
    
    const unsubEnrollments = onSnapshot(enrollmentsQuery, (snapshot) => {
      const enrollments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ enrollments, enrollmentsLoading: false });
    }, (error) => {
      console.error('Enrollments listener error:', error);
      set({ enrollmentsLoading: false });
    });
    newUnsubscribers.push(unsubEnrollments);
    
    set({ unsubscribers: newUnsubscribers });
  },
  
  cleanup: () => {
    const { unsubscribers } = get();
    unsubscribers.forEach(unsub => unsub());
    set({ unsubscribers: [] });
  },
  
  /**
   * Enroll a prospect in a sequence
   * @param {Object} params - Enrollment parameters
   */
  enrollProspect: async ({ 
    prospect, 
    sequence, 
    variables = {},
    ownerId, 
    ownerName,
    startImmediately = true 
  }) => {
    try {
      // Validate required fields
      if (!prospect?.id || !prospect?.email) {
        throw new Error('Prospect with email required');
      }
      if (!sequence?.id || !sequence?.steps?.length) {
        throw new Error('Sequence with steps required');
      }
      
      // Check if already enrolled in this sequence
      const existingQuery = query(
        collection(db, 'sequence_enrollments'),
        where('prospectId', '==', prospect.id),
        where('sequenceId', '==', sequence.id),
        where('status', '==', 'active')
      );
      const existing = await getDocs(existingQuery);
      
      if (!existing.empty) {
        toast.error('Prospect already enrolled in this sequence');
        return null;
      }
      
      // Build personalization variables from prospect
      const mergedVariables = {
        firstName: prospect.firstName || prospect.name?.split(' ')[0] || '',
        lastName: prospect.lastName || prospect.name?.split(' ').slice(1).join(' ') || '',
        name: prospect.name || '',
        email: prospect.email || '',
        company: prospect.company || '',
        title: prospect.title || '',
        phone: prospect.phone || '',
        ...variables // Custom overrides
      };
      
      // Calculate when to send first email
      const now = new Date();
      const firstStep = sequence.steps[0];
      const nextSendAt = firstStep.day === 0 && startImmediately
        ? now // Send immediately
        : addDaysToDate(now, firstStep.day);
      
      const enrollment = {
        // Prospect info
        prospectId: prospect.id,
        prospectEmail: prospect.email.toLowerCase(),
        prospectName: prospect.name || prospect.email,
        
        // Sequence info  
        sequenceId: sequence.id,
        sequenceName: sequence.name,
        
        // Owner (sales rep)
        ownerId,
        ownerName,
        
        // Progress
        currentStep: 0,
        status: 'active',
        
        // Scheduling
        nextSendAt: Timestamp.fromDate(nextSendAt),
        enrolledAt: serverTimestamp(),
        completedAt: null,
        
        // Personalization
        variables: mergedVariables,
        
        // Error tracking
        lastError: null,
        retryCount: 0,
        
        // Stats
        emailsSent: 0,
        lastSentAt: null
      };
      
      const docRef = await addDoc(collection(db, 'sequence_enrollments'), enrollment);
      
      // Update sequence stats
      await updateDoc(doc(db, 'outreach_sequences', sequence.id), {
        activeEnrollments: (sequence.activeEnrollments || 0) + 1,
        totalEnrolled: (sequence.totalEnrolled || 0) + 1,
        updatedAt: serverTimestamp()
      });
      
      toast.success(`${prospect.name || prospect.email} enrolled in ${sequence.name}`);
      return docRef.id;
      
    } catch (error) {
      console.error('Error enrolling prospect:', error);
      toast.error(error.message || 'Failed to enroll prospect');
      return null;
    }
  },
  
  /**
   * Pause/Resume an enrollment
   */
  toggleEnrollmentPause: async (enrollmentId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await updateDoc(doc(db, 'sequence_enrollments', enrollmentId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast.success(`Enrollment ${newStatus === 'paused' ? 'paused' : 'resumed'}`);
    } catch (error) {
      console.error('Error toggling enrollment pause:', error);
      toast.error('Failed to update enrollment');
    }
  },
  
  /**
   * Cancel an enrollment
   */
  cancelEnrollment: async (enrollmentId, sequenceId) => {
    try {
      await updateDoc(doc(db, 'sequence_enrollments', enrollmentId), {
        status: 'cancelled',
        completedAt: serverTimestamp()
      });
      
      // Update sequence stats
      if (sequenceId) {
        const sequenceRef = doc(db, 'outreach_sequences', sequenceId);
        const sequenceSnap = await getDocs(query(
          collection(db, 'sequence_enrollments'),
          where('sequenceId', '==', sequenceId),
          where('status', '==', 'active')
        ));
        await updateDoc(sequenceRef, {
          activeEnrollments: sequenceSnap.size,
          updatedAt: serverTimestamp()
        });
      }
      
      toast.success('Enrollment cancelled');
    } catch (error) {
      console.error('Error cancelling enrollment:', error);
      toast.error('Failed to cancel enrollment');
    }
  },
  
  /**
   * Mark as replied (manual trigger)
   */
  markAsReplied: async (enrollmentId, sequenceId) => {
    try {
      await updateDoc(doc(db, 'sequence_enrollments', enrollmentId), {
        status: 'replied',
        completedAt: serverTimestamp()
      });
      
      // Update sequence stats
      if (sequenceId) {
        const sequenceRef = doc(db, 'outreach_sequences', sequenceId);
        const snap = await getDocs(query(
          collection(db, 'sequence_enrollments'),
          where('sequenceId', '==', sequenceId),
          where('status', '==', 'active')
        ));
        // Get current sequence data
        const currentSeq = await getDocs(query(
          collection(db, 'outreach_sequences'),
          where('__name__', '==', sequenceId)
        ));
        if (!currentSeq.empty) {
          const seqData = currentSeq.docs[0].data();
          await updateDoc(sequenceRef, {
            activeEnrollments: snap.size,
            totalReplied: (seqData.totalReplied || 0) + 1,
            updatedAt: serverTimestamp()
          });
        }
      }
      
      toast.success('Marked as replied');
    } catch (error) {
      console.error('Error marking as replied:', error);
      toast.error('Failed to update enrollment');
    }
  },
  
  /**
   * Delete an enrollment
   */
  deleteEnrollment: async (enrollmentId) => {
    try {
      await deleteDoc(doc(db, 'sequence_enrollments', enrollmentId));
      toast.success('Enrollment deleted');
    } catch (error) {
      console.error('Error deleting enrollment:', error);
      toast.error('Failed to delete enrollment');
    }
  },
  
  /**
   * Get enrollments for a specific prospect
   */
  getProspectEnrollments: (prospectId) => {
    const { enrollments } = get();
    return enrollments.filter(e => e.prospectId === prospectId);
  },
  
  /**
   * Get enrollments by sequence
   */
  getSequenceEnrollments: (sequenceId) => {
    const { enrollments } = get();
    return enrollments.filter(e => e.sequenceId === sequenceId);
  },
  
  /**
   * Get enrollment stats
   */
  getEnrollmentStats: () => {
    const { enrollments } = get();
    
    const stats = {
      total: enrollments.length,
      active: enrollments.filter(e => e.status === 'active').length,
      paused: enrollments.filter(e => e.status === 'paused').length,
      completed: enrollments.filter(e => e.status === 'completed').length,
      replied: enrollments.filter(e => e.status === 'replied').length,
      bounced: enrollments.filter(e => e.status === 'bounced').length,
      error: enrollments.filter(e => e.status === 'error').length,
      
      // Today's scheduled sends
      dueToday: enrollments.filter(e => {
        if (e.status !== 'active' || !e.nextSendAt) return false;
        const next = e.nextSendAt.toDate ? e.nextSendAt.toDate() : new Date(e.nextSendAt);
        const today = new Date();
        return next.toDateString() === today.toDateString();
      }).length,
      
      // Emails sent overall
      totalEmailsSent: enrollments.reduce((sum, e) => sum + (e.emailsSent || 0), 0)
    };
    
    return stats;
  },
  
  /**
   * Get enrollments grouped by status
   */
  getEnrollmentsByStatus: () => {
    const { enrollments } = get();
    return {
      active: enrollments.filter(e => e.status === 'active'),
      paused: enrollments.filter(e => e.status === 'paused'),
      completed: enrollments.filter(e => e.status === 'completed'),
      replied: enrollments.filter(e => e.status === 'replied'),
      bounced: enrollments.filter(e => e.status === 'bounced'),
      error: enrollments.filter(e => e.status === 'error'),
      cancelled: enrollments.filter(e => e.status === 'cancelled')
    };
  }
}));
