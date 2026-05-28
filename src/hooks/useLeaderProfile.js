import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useAppServices } from '../services/useAppServices';
import { syncCompletionToCarryover } from '../services/carryoverService';

/**
 * Hook to manage Leader Profile data
 * Stored in user_data/{userId}/leader_profile/current
 */
// Default profile structure
const DEFAULT_LEADER_PROFILE = {
  // Personal Info
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  preferSMS: false,
  
  // Professional Info
  department: '',
  jobTitle: '',
  companyName: '',
  companySize: '',
  industry: '',
  yearsInRole: '',
  directReports: '',
  roleResponsibility: '',
  yearsManaging: '',
  
  // Leadership Context
  biggestChallenge: '',
  primaryGoal: '',
  leadershipStyle: '',
  leadershipStyleDescription: '',
  currentHabit: '',
  successDefinition: '',
  feedbackReceptionScore: 0,
  feedbackGivingScore: 0,
  feedbackPreference: '',
  
  // Preferences
  preferredLearningTime: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  
  // Meta
  isComplete: false,
  completedAt: null,
  updatedAt: null,
  version: 1
};

export const useLeaderProfile = () => {
  const { db, user } = useAppServices();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load profile with real-time subscription
  useEffect(() => {
    if (!db || !user?.uid) {
      setLoading(false);
      return;
    }

    const profileRef = doc(db, `user_data/${user.uid}/leader_profile/current`);
    
    // Use onSnapshot for real-time updates across all hook instances
    const unsubscribe = onSnapshot(profileRef, (snap) => {
      if (snap.exists()) {
        setProfile({ ...DEFAULT_LEADER_PROFILE, ...snap.data() });
      } else {
        // Pre-fill from user auth if available
        setProfile({
          ...DEFAULT_LEADER_PROFILE,
          firstName: user.displayName?.split(' ')[0] || '',
          lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
          email: user.email || ''
        });
      }
      setLoading(false);
    }, (err) => {
      console.error('[useLeaderProfile] Error loading profile:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, user]);

  // Save profile
  const saveProfile = useCallback(async (profileData, markComplete = false) => {
    if (!db || !user?.uid) {
      setError('Not authenticated');
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const profileRef = doc(db, `user_data/${user.uid}/leader_profile/current`);
      
      const dataToSave = {
        ...profileData,
        updatedAt: serverTimestamp(),
        ...(markComplete ? { 
          isComplete: true, 
          completedAt: serverTimestamp() 
        } : {})
      };

      await setDoc(profileRef, dataToSave, { merge: true });

      // Mirror displayed identity (email / displayName) to users/{uid} so
      // admin views and other features that read users/{uid} stay in sync.
      // NOTE: This does NOT update the Firebase Auth login email — that
      // requires email verification and is done from App Settings via
      // services/userEmailService.js. The login email may temporarily lag
      // behind the displayed email until the user verifies.
      try {
        const userRef = doc(db, 'users', user.uid);
        const identityUpdate = {};
        if (profileData.email && profileData.email.trim()) {
          identityUpdate.email = profileData.email.trim();
        }
        const firstName = (profileData.firstName || '').trim();
        const lastName = (profileData.lastName || '').trim();
        const fullName = [firstName, lastName].filter(Boolean).join(' ');
        if (fullName) {
          identityUpdate.displayName = fullName;
        }
        if (Object.keys(identityUpdate).length > 0) {
          identityUpdate.emailUpdatedAt = serverTimestamp();
          await updateDoc(userRef, identityUpdate).catch(async (err) => {
            // Fall back to setDoc with merge if the user doc doesn't exist yet.
            if (err?.code === 'not-found') {
              await setDoc(userRef, identityUpdate, { merge: true });
            } else {
              throw err;
            }
          });
        }
      } catch (e) {
        console.warn('[useLeaderProfile] Failed to mirror identity to users/{uid}:', e);
      }

      // Set prepStatus flag on user doc for unified tracking
      if (markComplete) {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, { 'prepStatus.leaderProfile': true }).catch(e => console.warn('Could not set prepStatus:', e));
        
        // Sync to carryover storage immediately - eliminates race conditions
        // NOTE: Label must match content definition exactly for deduplication to work
        await syncCompletionToCarryover(db, user.uid, 'leader-profile', {
          label: 'Complete Leader Profile',
          category: 'Preparation',
          prepSection: 'onboarding',
          handlerType: 'leader-profile'
        });
      }

      // Sync notification settings to main user doc (used by NotificationSettingsWidget in Locker)
      if (profileData.notificationSettings || profileData.phoneNumber || profileData.timezone) {
        const userRef = doc(db, 'users', user.uid);
        
        // Build complete notification settings object that matches NotificationSettingsWidget format
        const strategy = profileData.notificationSettings?.strategy || 'smart_escalation';
        const pushEnabled = profileData.notificationSettings?.channels?.push ?? true;
        const emailEnabled = profileData.notificationSettings?.channels?.email ?? true;
        const smsEnabled = profileData.notificationSettings?.channels?.sms ?? false;
        const isDisabled = strategy === 'disabled';
        
        const notificationSettings = {
          enabled: !isDisabled, // Disabled strategy means notifications are off
          strategy: strategy,
          timezone: profileData.notificationSettings?.timezone || profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
          channels: {
            push: pushEnabled,
            email: emailEnabled,
            sms: smsEnabled
          },
          phoneNumber: profileData.phoneNumber || '',
          updatedAt: new Date().toISOString()
        };

        await updateDoc(userRef, { notificationSettings }).catch(err => console.warn("Failed to sync user settings", err));
      }
      
      setProfile(prev => ({
        ...prev,
        ...profileData,
        ...(markComplete ? { isComplete: true } : {})
      }));

      console.log('[useLeaderProfile] Profile saved successfully');
      return true;
    } catch (err) {
      console.error('[useLeaderProfile] Error saving profile:', err);
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  }, [db, user]);

  // Calculate completion percentage
  const completionPercentage = useCallback(() => {
    if (!profile) return 0;
    
    const requiredFields = [
      'firstName', 'lastName', 'email', 'department', 
      'companyName', 'companySize'
    ];
    
    const optionalFields = [
      'phoneNumber', 'jobTitle', 'industry', 'yearsInRole',
      'directReports', 'biggestChallenge', 'primaryGoal'
    ];
    
    let score = 0;
    let total = requiredFields.length * 2 + optionalFields.length; // Required fields worth 2x
    
    requiredFields.forEach(field => {
      if (profile[field] && profile[field].toString().trim()) score += 2;
    });
    
    optionalFields.forEach(field => {
      if (profile[field] && profile[field].toString().trim()) score += 1;
    });
    
    return Math.round((score / total) * 100);
  }, [profile]);

  return {
    profile,
    loading,
    saving,
    error,
    saveProfile,
    completionPercentage: completionPercentage(),
    isComplete: profile?.isComplete || false
  };
};

export default useLeaderProfile;
