// src/hooks/useReppyProgress.js
// Reppy AI Coach - User Progress & Memory System
// Tracks curriculum progress, conversation history, and user insights

import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { useAppServices } from '../services/useAppServices';
import { getSessionByNumber, getTotalSessions, getPhaseForWeek } from '../data/reppy/curriculum';

/**
 * REPPY USER DATA STRUCTURE (Firestore)
 * 
 * Collection: users/{userId}/reppy/progress
 * 
 * {
 *   // Progress tracking
 *   currentSession: 1,              // Current session number (1-indexed)
 *   completedSessions: [1, 2, 3],   // Array of completed session numbers
 *   startedAt: Timestamp,           // When user started Reppy
 *   lastSessionAt: Timestamp,       // Last session completed
 *   
 *   // User profile (built through conversations)
 *   profile: {
 *     leadershipWhy: "...",         // Their purpose statement
 *     strengths: ["...", "..."],    // Identified strengths
 *     growthAreas: ["...", "..."],  // Areas to develop
 *     industry: "...",              // For context
 *     teamSize: "...",              // For relevant examples
 *     biggestChallenge: "...",      // Current focus
 *   },
 *   
 *   // Conversation memory
 *   conversations: [
 *     {
 *       sessionNumber: 1,
 *       date: Timestamp,
 *       checkInResponse: "...",
 *       reflectionResponse: "...",
 *       practiceCommitment: "...",
 *       notes: "...",               // AI observations
 *     }
 *   ],
 *   
 *   // Key insights collected over time
 *   insights: [
 *     { date: Timestamp, insight: "User struggles with delegation...", source: "Week 11" }
 *   ],
 *   
 *   // Bookmarks & favorites
 *   bookmarks: [3, 15, 22],         // Session numbers bookmarked
 *   
 *   // Streak tracking
 *   currentStreak: 5,
 *   longestStreak: 12,
 *   lastActiveDate: "2024-01-15",
 * }
 */

const REPPY_COLLECTION = 'reppy';
const PROGRESS_DOC = 'progress';

export const useReppyProgress = () => {
  const { user, db } = useAppServices();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState(null);

  const userId = user?.uid;

  // Load progress data from Firestore
  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    const loadProgress = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'users', userId, REPPY_COLLECTION, PROGRESS_DOC);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProgressData(docSnap.data());
        } else {
          // Initialize new user - onboarding not complete
          const initialData = {
            currentSession: 1,
            completedSessions: [],
            startedAt: Timestamp.now(),
            lastSessionAt: null,
            onboardingComplete: false,  // New users need onboarding
            profile: {},
            conversations: [],
            insights: [],
            bookmarks: [],
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
          };
          await setDoc(docRef, initialData);
          setProgressData(initialData);
        }
      } catch (err) {
        console.error('[Reppy] Error loading progress:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [userId, db]);

  // Get current session data
  const currentSessionData = useMemo(() => {
    if (!progressData) return null;
    return getSessionByNumber(progressData.currentSession || 1);
  }, [progressData]);

  // Calculate overall progress
  const progress = useMemo(() => {
    if (!progressData) return { percent: 0, completed: 0, total: 0 };
    const total = getTotalSessions();
    const completed = progressData.completedSessions?.length || 0;
    return {
      percent: Math.round((completed / total) * 100),
      completed,
      total,
      currentWeek: currentSessionData?.week || 1,
      currentPhase: currentSessionData?.phase || getPhaseForWeek(1),
    };
  }, [progressData, currentSessionData]);

  // Save progress to Firestore
  const saveProgress = useCallback(async (updates) => {
    if (!userId || !db) return;
    
    try {
      const docRef = doc(db, 'users', userId, REPPY_COLLECTION, PROGRESS_DOC);
      await updateDoc(docRef, updates);
      setProgressData(prev => ({ ...prev, ...updates }));
    } catch (err) {
      console.error('[Reppy] Error saving progress:', err);
      throw err;
    }
  }, [userId, db]);

  // Complete current session and advance
  const completeSession = useCallback(async (sessionData = {}) => {
    if (!userId || !progressData || !db) return;

    const currentSession = progressData.currentSession || 1;
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate streak
    let newStreak = progressData.currentStreak || 0;
    const lastDate = progressData.lastActiveDate;
    
    if (lastDate) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastDate === today) {
        // Same day, no streak change
      } else if (lastDate === yesterdayStr) {
        // Consecutive day
        newStreak += 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updates = {
      currentSession: currentSession + 1,
      completedSessions: arrayUnion(currentSession),
      lastSessionAt: Timestamp.now(),
      lastActiveDate: today,
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, progressData.longestStreak || 0),
    };

    // Add conversation record if provided
    if (sessionData.checkInResponse || sessionData.reflectionResponse) {
      updates.conversations = arrayUnion({
        sessionNumber: currentSession,
        date: Timestamp.now(),
        ...sessionData,
      });
    }

    await saveProgress(updates);
    return currentSession + 1;
  }, [userId, progressData, saveProgress, db]);

  // Update user profile (built through conversations)
  const updateProfile = useCallback(async (profileUpdates) => {
    if (!userId || !db) return;
    
    const currentProfile = progressData?.profile || {};
    await saveProgress({
      profile: { ...currentProfile, ...profileUpdates }
    });
  }, [userId, db, progressData, saveProgress]);

  // Complete onboarding and set profile
  const completeOnboarding = useCallback(async (profileData) => {
    if (!userId || !db) return;
    
    await saveProgress({
      onboardingComplete: true,
      profile: profileData,
    });
  }, [userId, db, saveProgress]);

  // Add insight (AI observations about the user)
  const addInsight = useCallback(async (insight, source) => {
    if (!userId || !db) return;
    
    await saveProgress({
      insights: arrayUnion({
        date: Timestamp.now(),
        insight,
        source,
      })
    });
  }, [userId, db, saveProgress]);

  // Toggle bookmark on a session
  const toggleBookmark = useCallback(async (sessionNumber) => {
    if (!userId || !progressData || !db) return;
    
    const bookmarks = progressData.bookmarks || [];
    const newBookmarks = bookmarks.includes(sessionNumber)
      ? bookmarks.filter(b => b !== sessionNumber)
      : [...bookmarks, sessionNumber];
    
    await saveProgress({ bookmarks: newBookmarks });
  }, [userId, db, progressData, saveProgress]);

  // Jump to a specific session (for revisiting)
  const goToSession = useCallback(async (sessionNumber) => {
    if (!userId || !db) return;
    await saveProgress({ currentSession: sessionNumber });
  }, [userId, db, saveProgress]);

  // Get conversation history for context
  const getConversationContext = useCallback((limit = 5) => {
    if (!progressData?.conversations) return [];
    return progressData.conversations.slice(-limit);
  }, [progressData]);

  // Check if a session is completed
  const isSessionCompleted = useCallback((sessionNumber) => {
    return progressData?.completedSessions?.includes(sessionNumber) || false;
  }, [progressData]);

  return {
    loading,
    error,
    progressData,
    currentSessionData,
    progress,
    
    // Actions
    completeSession,
    completeOnboarding,
    updateProfile,
    addInsight,
    toggleBookmark,
    goToSession,
    
    // Utilities
    getConversationContext,
    isSessionCompleted,
    
    // Direct data access
    onboardingComplete: progressData?.onboardingComplete ?? false,
    profile: progressData?.profile || {},
    conversations: progressData?.conversations || [],
    insights: progressData?.insights || [],
    bookmarks: progressData?.bookmarks || [],
    streak: {
      current: progressData?.currentStreak || 0,
      longest: progressData?.longestStreak || 0,
    },
  };
};

export default useReppyProgress;
