import { useMemo } from 'react';
import { useDailyPlan } from './useDailyPlan';

/**
 * Hook to determine if content items are unlocked for the current user.
 * Implements the "Vault & Key" logic using day-based content access.
 */
export const useContentAccess = () => {
  const { unlockedContentIds } = useDailyPlan();

  // Calculate the set of all unlocked resource IDs based on the user's current day
  const unlockedResourceIds = useMemo(() => {
    if (!unlockedContentIds || unlockedContentIds.length === 0) return new Set();
    // Normalize to lowercase for comparison
    return new Set(unlockedContentIds.map(id => String(id).toLowerCase()));
  }, [unlockedContentIds]);

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
