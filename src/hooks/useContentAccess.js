import { useMemo } from 'react';
import { useDevPlan } from './useDevPlan';

/**
 * Hook to determine if content items are unlocked for the current user.
 * Implements the "Vault & Key" logic.
 */
export const useContentAccess = () => {
  const { masterPlan, currentWeek } = useDevPlan();

  // Calculate the set of all unlocked resource IDs based on the user's current week
  const unlockedResourceIds = useMemo(() => {
    if (!masterPlan || masterPlan.length === 0) return new Set();
    const ids = new Set();
    const currentWeekNum = currentWeek?.weekNumber || 1;

    masterPlan.forEach(week => {
      // Only include content from weeks up to the current week
      if (week.weekNumber <= currentWeekNum) {
        if (week.content && Array.isArray(week.content)) {
          week.content.forEach(item => {
            if (!item) return;
            // Add all possible ID references
            if (item.resourceId) ids.add(String(item.resourceId).toLowerCase());
            if (item.contentItemId) ids.add(String(item.contentItemId).toLowerCase());
            if (item.id) ids.add(String(item.id).toLowerCase());
          });
        }
      }
    });
    return ids;
  }, [masterPlan, currentWeek]);

  /**
   * Check if a specific item is accessible.
   * @param {object} item - The content item (must have id and isHiddenUntilUnlocked)
   * @returns {boolean} - True if accessible, False if locked
   */
  const isContentUnlocked = (item) => {
    if (!item) return false;
    
    // If explicitly marked as "Hidden Until Unlocked" (Protected)
    if (item.isHiddenUntilUnlocked) {
      // Check if the user holds the key (is in unlockedResourceIds)
      return unlockedResourceIds.has(String(item.id).toLowerCase());
    }

    // Default: Publicly accessible
    return true;
  };

  return {
    unlockedResourceIds,
    isContentUnlocked
  };
};
