import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAppServices } from '../services/useAppServices';

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

  // Load profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!db || !user?.uid) {
        setLoading(false);
        return;
      }

      try {
        const profileRef = doc(db, `user_data/${user.uid}/leader_profile/current`);
        const snap = await getDoc(profileRef);
        
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
      } catch (err) {
        console.error('[useLeaderProfile] Error loading profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
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

      // Sync notification settings to main user doc (used by NotificationSettingsWidget in Locker)
      if (profileData.notificationSettings || profileData.phoneNumber || profileData.timezone) {
        const userRef = doc(db, 'users', user.uid);
        
        // Build complete notification settings object that matches NotificationSettingsWidget format
        const notificationSettings = {
          enabled: true, // If they're setting preferences, enable notifications
          timezone: profileData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
          channels: {
            email: profileData.notificationSettings?.channels?.email ?? true,
            sms: profileData.notificationSettings?.channels?.sms ?? false
          },
          phoneNumber: profileData.phoneNumber || ''
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
