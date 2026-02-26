import { useState, useEffect, useCallback } from 'react';
import { useAppServices } from '../services/useAppServices';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';

/**
 * Action Progress Tracking Hook
 * 
 * Provides comprehensive tracking for "This Week's Actions" items with:
 * - Persistent completion status in Firestore
 * - Carry-over logic for incomplete items
 * - Progress statistics and streaks
 * - Gamification badges and points
 * 
 * Data stored in: users/{userId}/action_progress/{itemId}
 */

// Badge definitions for gamification
export const BADGES = {
  FIRST_ACTION: {
    id: 'first_action',
    name: 'First Steps',
    description: 'Complete your first action item',
    icon: '🎯',
    requirement: (stats) => stats.totalCompleted >= 1
  },
  WEEK_CHAMPION: {
    id: 'week_champion',
    name: 'Week Champion',
    description: 'Complete all items in a single week',
    icon: '🏆',
    requirement: (stats) => stats.perfectWeeks >= 1
  },
  STREAK_3: {
    id: 'streak_3',
    name: 'On Fire',
    description: 'Complete items 3 days in a row',
    icon: '🔥',
    requirement: (stats) => stats.longestStreak >= 3
  },
  STREAK_7: {
    id: 'streak_7',
    name: 'Unstoppable',
    description: 'Complete items 7 days in a row',
    icon: '⚡',
    requirement: (stats) => stats.longestStreak >= 7
  },
  EARLY_BIRD: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete an action before noon',
    icon: '🌅',
    requirement: (stats) => stats.earlyCompletions >= 1
  },
  CONTENT_MASTER: {
    id: 'content_master',
    name: 'Content Master',
    description: 'Complete 10 content items',
    icon: '📚',
    requirement: (stats) => stats.contentCompleted >= 10
  },
  COMMUNITY_BUILDER: {
    id: 'community_builder',
    name: 'Community Builder',
    description: 'Complete 10 community items',
    icon: '🤝',
    requirement: (stats) => stats.communityCompleted >= 10
  },
  COACHING_CHAMPION: {
    id: 'coaching_champion',
    name: 'Coaching Champion',
    description: 'Complete 10 coaching items',
    icon: '🎓',
    requirement: (stats) => stats.coachingCompleted >= 10
  },
  PERFECT_MONTH: {
    id: 'perfect_month',
    name: 'Perfect Month',
    description: 'Complete 4 weeks in a row with all items done',
    icon: '👑',
    requirement: (stats) => stats.consecutivePerfectWeeks >= 4
  },
  COMEBACK_KID: {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Complete a carried-over item',
    icon: '💪',
    requirement: (stats) => stats.carriedOverCompleted >= 1
  }
};

// Points configuration
export const POINTS = {
  COMPLETE_ITEM: 10,
  COMPLETE_ON_TIME: 5,
  COMPLETE_EARLY: 3,
  PERFECT_WEEK: 50,
  CARRY_OVER_COMPLETE: 15,
  STREAK_BONUS_PER_DAY: 2
};

// Helper function: Calculate consecutive days streak
const calculateStreak = (completedItems) => {
  if (completedItems.length === 0) return { currentStreak: 0, longestStreak: 0 };
  
  const dates = completedItems
    .filter(i => i.completedAt)
    .map(i => {
      const d = i.completedAt?.toDate?.() || new Date(i.completedAt);
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    })
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort((a, b) => b - a);
  
  if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };
  
  const today = new Date();
  const todayTimestamp = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const yesterdayTimestamp = todayTimestamp - 86400000;
  const isCurrentStreak = dates[0] === todayTimestamp || dates[0] === yesterdayTimestamp;
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  for (let i = 0; i < dates.length - 1; i++) {
    const diff = dates[i] - dates[i + 1];
    if (diff === 86400000) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak);
  currentStreak = isCurrentStreak ? tempStreak : 0;
  
  return { currentStreak, longestStreak };
};

// Helper function: Calculate perfect weeks
const calculatePerfectWeeks = (data) => {
  const weeklyItems = {};
  Object.values(data).forEach(item => {
    const weekKey = `${item.originalWeek || item.weekNumber}`;
    if (!weeklyItems[weekKey]) {
      weeklyItems[weekKey] = { total: 0, completed: 0 };
    }
    weeklyItems[weekKey].total++;
    if (item.status === 'completed') {
      weeklyItems[weekKey].completed++;
    }
  });
  
  const weeks = Object.values(weeklyItems);
  const perfectWeeks = weeks.filter(w => w.total > 0 && w.completed === w.total).length;
  const consecutivePerfectWeeks = perfectWeeks;
  
  return { perfectWeeks, consecutivePerfectWeeks };
};

// Helper function: Calculate total points
const calculatePoints = (items) => {
  let points = 0;
  
  items.forEach(item => {
    if (item.status === 'completed') {
      points += POINTS.COMPLETE_ITEM;
      
      if (!item.carriedOver) {
        points += POINTS.COMPLETE_ON_TIME;
      } else {
        points += POINTS.CARRY_OVER_COMPLETE;
      }
      
      if (item.completedAt) {
        const date = item.completedAt?.toDate?.() || new Date(item.completedAt);
        if (date.getHours() < 12) {
          points += POINTS.COMPLETE_EARLY;
        }
      }
    }
  });
  
  const { currentStreak } = calculateStreak(items.filter(i => i.status === 'completed'));
  points += currentStreak * POINTS.STREAK_BONUS_PER_DAY;
  
  return points;
};

export const useActionProgress = () => {
  const { db, user } = useAppServices();
  const [progressData, setProgressData] = useState({});
  const [stats, setStats] = useState({
    totalCompleted: 0,
    totalSkipped: 0,
    totalCarriedOver: 0,
    currentStreak: 0,
    longestStreak: 0,
    perfectWeeks: 0,
    consecutivePerfectWeeks: 0,
    totalPoints: 0,
    contentCompleted: 0,
    communityCompleted: 0,
    coachingCompleted: 0,
    earlyCompletions: 0,
    carriedOverCompleted: 0,
    badges: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Collection reference helper
  const getProgressCollection = useCallback(() => {
    if (!db || !user?.uid) return null;
    return collection(db, 'users', user.uid, 'action_progress');
  }, [db, user?.uid]);

  // Calculate statistics from progress data
  const calculateStats = useCallback((data) => {
    const items = Object.values(data);
    
    const completed = items.filter(i => i.status === 'completed');
    const skipped = items.filter(i => i.status === 'skipped');
    const carriedOver = items.filter(i => i.carriedOver);
    const carriedOverCompleted = items.filter(i => i.carriedOver && i.status === 'completed');
    
    const contentCompleted = completed.filter(i => i.category === 'content').length;
    const communityCompleted = completed.filter(i => i.category === 'community').length;
    const coachingCompleted = completed.filter(i => i.category === 'coaching').length;
    
    const earlyCompletions = completed.filter(i => {
      if (!i.completedAt) return false;
      const date = i.completedAt?.toDate?.() || new Date(i.completedAt);
      return date.getHours() < 12;
    }).length;
    
    const { currentStreak, longestStreak } = calculateStreak(completed);
    const { perfectWeeks, consecutivePerfectWeeks } = calculatePerfectWeeks(data);
    const totalPoints = calculatePoints(items);
    
    const newStats = {
      totalCompleted: completed.length,
      totalSkipped: skipped.length,
      totalCarriedOver: carriedOver.length,
      currentStreak,
      longestStreak,
      perfectWeeks,
      consecutivePerfectWeeks,
      totalPoints,
      contentCompleted,
      communityCompleted,
      coachingCompleted,
      earlyCompletions,
      carriedOverCompleted: carriedOverCompleted.length,
      badges: []
    };
    
    newStats.badges = Object.values(BADGES)
      .filter(badge => badge.requirement(newStats))
      .map(b => b.id);
    
    setStats(newStats);
  }, []);

  // Fetch all progress data on mount
  useEffect(() => {
    if (!db || !user?.uid) {
      setLoading(false);
      return;
    }

    const progressRef = getProgressCollection();
    if (!progressRef) return;

    const unsubscribe = onSnapshot(
      progressRef,
      (snapshot) => {
        const data = {};
        snapshot.forEach((docSnap) => {
          data[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });
        setProgressData(data);
        setLoading(false);
        calculateStats(data);
      },
      (err) => {
        console.error('[useActionProgress] Error fetching progress:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, user?.uid, getProgressCollection, calculateStats]);

  // Mark an item as complete
  const completeItem = useCallback(async (itemId, itemData = {}) => {
    if (!db || !user?.uid) return;
    if (!itemId) {
      console.error('[useActionProgress] completeItem called with undefined itemId');
      return;
    }
    
    const progressRef = doc(db, 'users', user.uid, 'action_progress', itemId);
    
    const updateData = {
      status: 'completed',
      completedAt: serverTimestamp(),
      completedInWeek: itemData.currentWeek || null,
      originalWeek: itemData.originalWeek || itemData.currentWeek || null,
      weekNumber: itemData.weekNumber || null,
      category: itemData.category || 'content',
      label: itemData.label || itemData.title || '',
      carriedOver: itemData.carriedOver || false,
      carryCount: itemData.carryCount || 0,
      updatedAt: serverTimestamp()
    };
    
    await setDoc(progressRef, updateData, { merge: true });
    console.log('[useActionProgress] Item completed:', itemId, updateData);
  }, [db, user?.uid]);

  // Mark an item as incomplete (undo completion)
  const uncompleteItem = useCallback(async (itemId) => {
    if (!db || !user?.uid) return;
    if (!itemId) {
      console.error('[useActionProgress] uncompleteItem called with undefined itemId');
      return;
    }
    
    const progressRef = doc(db, 'users', user.uid, 'action_progress', itemId);
    
    await setDoc(progressRef, {
      status: 'pending',
      completedAt: null,
      completedInWeek: null,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('[useActionProgress] Item uncompleted:', itemId);
  }, [db, user?.uid]);

  // Skip an item (won't carry over)
  const skipItem = useCallback(async (itemId, itemData = {}) => {
    if (!db || !user?.uid) return;
    
    const progressRef = doc(db, 'users', user.uid, 'action_progress', itemId);
    
    await setDoc(progressRef, {
      status: 'skipped',
      skippedAt: serverTimestamp(),
      skippedReason: itemData.reason || '',
      originalWeek: itemData.originalWeek || itemData.currentWeek || null,
      weekNumber: itemData.weekNumber || null,
      category: itemData.category || 'content',
      label: itemData.label || itemData.title || '',
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('[useActionProgress] Item skipped:', itemId);
  }, [db, user?.uid]);

  // Carry over an item to current week
  const carryOverItem = useCallback(async (itemId, fromWeek, toWeek, itemData = {}) => {
    if (!db || !user?.uid) return;
    
    const progressRef = doc(db, 'users', user.uid, 'action_progress', itemId);
    const existingDoc = await getDoc(progressRef);
    const existing = existingDoc.data() || {};
    
    const carryCount = (existing.carryCount || 0) + 1;
    
    if (carryCount >= 3) {
      await setDoc(progressRef, {
        status: 'archived',
        archivedAt: serverTimestamp(),
        archivedReason: 'auto_archive_max_carry',
        originalWeek: existing.originalWeek || fromWeek,
        carryCount,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      console.log('[useActionProgress] Item auto-archived after 3 carries:', itemId);
      return { archived: true, carryCount };
    }
    
    await setDoc(progressRef, {
      status: 'pending',
      carriedOver: true,
      carriedFromWeek: fromWeek,
      currentWeek: toWeek,
      originalWeek: existing.originalWeek || fromWeek,
      weekNumber: itemData.weekNumber || null,
      category: itemData.category || 'content',
      label: itemData.label || itemData.title || '',
      carryCount,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('[useActionProgress] Item carried over:', itemId, 'count:', carryCount);
    return { archived: false, carryCount };
  }, [db, user?.uid]);

  // Batch carry over all incomplete items from previous week
  const carryOverIncompleteItems = useCallback(async (fromWeekItems, fromWeek, toWeek) => {
    if (!db || !user?.uid || !fromWeekItems.length) return [];
    
    const results = [];
    
    for (const item of fromWeekItems) {
      const itemId = item.id || `${item.category}-${item.resourceId || item.contentItemId}`;
      const progress = progressData[itemId];
      
      if (progress?.status === 'completed' || progress?.status === 'skipped') {
        continue;
      }
      
      const result = await carryOverItem(itemId, fromWeek, toWeek, item);
      results.push({ itemId, ...result });
    }
    
    return results;
  }, [db, user?.uid, progressData, carryOverItem]);

  // Get progress for a specific item
  const getItemProgress = useCallback((itemId) => {
    return progressData[itemId] || { status: 'pending' };
  }, [progressData]);

  // Get all items for a specific week
  const getWeekItems = useCallback((weekNumber) => {
    return Object.values(progressData).filter(
      item => item.weekNumber === weekNumber || item.currentWeek === weekNumber
    );
  }, [progressData]);

  // Get carried over items for current week
  const getCarriedOverItems = useCallback((currentWeekNumber) => {
    return Object.values(progressData).filter(
      item => item.carriedOver && 
              item.currentWeek === currentWeekNumber &&
              item.status !== 'completed' &&
              item.status !== 'skipped' &&
              item.status !== 'archived'
    );
  }, [progressData]);

  // Get incomplete items from previous week
  const getPreviousWeekIncomplete = useCallback((previousWeekNumber) => {
    return Object.values(progressData).filter(
      item => (item.originalWeek === previousWeekNumber || item.weekNumber === previousWeekNumber) &&
              item.status !== 'completed' &&
              item.status !== 'skipped' &&
              item.status !== 'archived' &&
              !item.carriedOver
    );
  }, [progressData]);

  // Check if item is completed
  const isItemCompleted = useCallback((itemId) => {
    return progressData[itemId]?.status === 'completed';
  }, [progressData]);

  // Get week completion percentage
  const getWeekCompletionPercent = useCallback((weekNumber, totalItems) => {
    if (!totalItems) return 0;
    const weekItems = getWeekItems(weekNumber);
    const completed = weekItems.filter(i => i.status === 'completed').length;
    return Math.round((completed / totalItems) * 100);
  }, [getWeekItems]);

  // Get all accomplishments (completed items) grouped by week
  const getAccomplishments = useCallback(() => {
    const completed = Object.values(progressData).filter(i => i.status === 'completed');
    
    const byWeek = {};
    completed.forEach(item => {
      const week = item.completedInWeek || item.originalWeek || 'unknown';
      if (!byWeek[week]) {
        byWeek[week] = [];
      }
      byWeek[week].push(item);
    });
    
    return Object.entries(byWeek)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([week, items]) => ({
        weekNumber: Number(week),
        items: items.sort((a, b) => {
          const dateA = a.completedAt?.toDate?.() || new Date(a.completedAt || 0);
          const dateB = b.completedAt?.toDate?.() || new Date(b.completedAt || 0);
          return dateB - dateA;
        })
      }));
  }, [progressData]);

  // Get outstanding (incomplete) items
  const getOutstandingItems = useCallback(() => {
    return Object.values(progressData).filter(
      item => item.status !== 'completed' && 
              item.status !== 'skipped' && 
              item.status !== 'archived'
    );
  }, [progressData]);

  // Get badge details
  const getEarnedBadges = useCallback(() => {
    return Object.values(BADGES).filter(badge => stats.badges.includes(badge.id));
  }, [stats.badges]);

  return {
    loading,
    error,
    progressData,
    stats,
    completeItem,
    uncompleteItem,
    skipItem,
    carryOverItem,
    carryOverIncompleteItems,
    getItemProgress,
    getWeekItems,
    getCarriedOverItems,
    getPreviousWeekIncomplete,
    isItemCompleted,
    getWeekCompletionPercent,
    getAccomplishments,
    getOutstandingItems,
    getEarnedBadges,
    BADGES,
    POINTS
  };
};

export default useActionProgress;
