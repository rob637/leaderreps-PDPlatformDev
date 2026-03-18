/**
 * Carryover Service
 * =================
 * Manages persistent storage of incomplete prep/session items that carry over between levels.
 * 
 * KEY DESIGN:
 * - Items are stored in Firestore: users/{uid}/action_progress/_carryover
 * - When entering a new level, incomplete items are snapshotted to this table
 * - LAST MINUTE CHECK: Before adding items, verify against action_progress
 * - Completed items stay VISIBLE until the next level transition
 * - At level transition: completed items are purged, new incomplete items are added
 * 
 * This avoids race conditions and dynamic recomputation issues.
 */

import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';

const CARRYOVER_DOC_ID = '_carryover';

/**
 * LAST MINUTE CHECK: Query action_progress directly to verify item completion
 * This is called before adding items to carryover to filter out any that are actually complete
 */
const getCompletedItemsFromActionProgress = async (db, userId) => {
  const completedIds = new Set();
  const completedLabels = new Set();
  
  try {
    const progressRef = collection(db, 'users', userId, 'action_progress');
    const snapshot = await getDocs(progressRef);
    
    snapshot.forEach(docSnap => {
      if (docSnap.id === '_carryover') return; // Skip carryover doc itself
      
      const data = docSnap.data();
      if (data.status === 'completed') {
        completedIds.add(docSnap.id);
        if (data.label) {
          completedLabels.add(data.label.toLowerCase().trim());
        }
      }
    });
    
    console.log('[CarryoverService] Last-minute check found', completedIds.size, 'completed items in action_progress');
  } catch (err) {
    console.error('[CarryoverService] Error in last-minute check:', err);
  }
  
  return { completedIds, completedLabels };
};

/**
 * SYNC COMPLETION TO CARRYOVER
 * Called when ANY prep item is completed to immediately mark it in carryover storage.
 * This eliminates race conditions - the completion is recorded the moment it happens.
 * 
 * If the item exists in carryover, marks it complete.
 * If carryover doesn't exist or item isn't in it, creates/adds with completed status.
 * 
 * DEDUPLICATION: Uses stable identifiers (handlerType, resourceId) not labels.
 * This prevents duplicates even if labels change in content.
 * 
 * @param {Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} itemId - Item ID being completed
 * @param {Object} itemData - Item metadata (label, category, handlerType, resourceId, etc.)
 * @returns {Promise<boolean>} - Success
 */
export const syncCompletionToCarryover = async (db, userId, itemId, itemData = {}) => {
  if (!db || !userId || !itemId) return false;
  
  try {
    const ref = doc(db, 'users', userId, 'action_progress', CARRYOVER_DOC_ID);
    const snap = await getDoc(ref);
    const now = new Date().toISOString();
    
    // Helper to find matching item by stable identifiers (not labels!)
    // Priority: 1) exact ID, 2) handlerType match, 3) resourceId match
    const findMatchingItemIndex = (items) => {
      // First try exact ID match
      const idMatch = items.findIndex(i => i.id === itemId);
      if (idMatch >= 0) return idMatch;
      
      // Then try handlerType match (stable identifier for interactive items)
      if (itemData.handlerType) {
        const handlerMatch = items.findIndex(i => 
          i.handlerType === itemData.handlerType ||
          // Also match resourceId pattern (interactive-leader-profile -> leader-profile)
          i.resourceId === `interactive-${itemData.handlerType}`
        );
        if (handlerMatch >= 0) return handlerMatch;
      }
      
      // Then try resourceId match
      if (itemData.resourceId) {
        const resourceMatch = items.findIndex(i => i.resourceId === itemData.resourceId);
        if (resourceMatch >= 0) return resourceMatch;
      }
      
      return -1;
    };
    
    if (snap.exists()) {
      const data = snap.data();
      const items = data.items || [];
      const existingIndex = findMatchingItemIndex(items);
      
      if (existingIndex >= 0) {
        // Item exists IN CARRY OVER - mark it complete
        const updated = [...items];
        updated[existingIndex] = {
          ...updated[existingIndex],
          completedAt: now,
          completedAtLevel: data.currentLevel || 0
        };
        await updateDoc(ref, { items: updated, lastUpdated: serverTimestamp() });
        console.log('[CarryoverService] Synced completion for existing item:', items[existingIndex].id, '(matched via', itemId, ')');
      } else {
        // Item not in carryover - DO NOT ADD IT!
        // Requirement: Only INCOMPLETE items carry over. If a user completes a CURRENT level item, it shouldn't go to carryover.
        // Carryover is ONLY for items that were incomplete in PREVIOUS levels.
        console.log('[CarryoverService] Item completed but not in carryover (current level item) - skipping add:', itemId);
      }
    } else {
      // No carryover doc - DO NOT CREATE ONE for a current level item!
      // Carryover is initialized at level transition.
      console.log('[CarryoverService] No carryover doc and current level item completed - skipping create:', itemId);
    }
    
    return true;
  } catch (err) {
    console.error('[CarryoverService] Error syncing completion:', err);
    return false;
  }
};

/**
 * Get the current carryover state for a user
 * @param {Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Carryover state: { items: [], currentLevel: number, lastUpdated: Timestamp }
 */
export const getCarryoverState = async (db, userId) => {
  if (!db || !userId) return { items: [], currentLevel: 0 };
  
  try {
    const ref = doc(db, 'users', userId, 'action_progress', CARRYOVER_DOC_ID);
    const snap = await getDoc(ref);
    
    if (snap.exists()) {
      const data = snap.data();
      return {
        items: data.items || [],
        currentLevel: data.currentLevel || 0,
        lastUpdated: data.lastUpdated
      };
    }
    
    return { items: [], currentLevel: 0 };
  } catch (err) {
    console.error('[CarryoverService] Error getting carryover state:', err);
    return { items: [], currentLevel: 0 };
  }
};

/**
 * Initialize carryover for a new level (called at level transition)
 * This snapshots incomplete items and prepares the carryover list
 * 
 * RECONCILIATION LOGIC (handles testers changing dates):
 * - If already at this level, reconcile existing items with current reality
 * - Items that were incomplete but are now complete get marked as complete
 * - Items that are still incomplete stay in the list
 * - This allows testers to go back to prep, complete items, and see correct state
 * 
 * @param {Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @param {number} newLevel - The level the user is entering (1 = L1, 2 = L2, etc.)
 * @param {Array} incompleteItems - Array of CURRENTLY incomplete items
 * @returns {Promise<Object>} - Updated carryover state
 */
export const initializeCarryoverForLevel = async (db, userId, newLevel, incompleteItems) => {
  if (!db || !userId) return { items: [], currentLevel: newLevel };
  
  try {
    // LAST MINUTE CHECK: Query action_progress directly to verify completion status
    // This catches any race conditions where items appear incomplete but are actually done
    const { completedIds, completedLabels } = await getCompletedItemsFromActionProgress(db, userId);
    
    // Filter out any items that are actually complete
    const verifiedIncompleteItems = incompleteItems.filter(item => {
      // Check by ID
      if (completedIds.has(item.id)) {
        console.log('[CarryoverService] Last-minute filter: removing completed item (by ID):', item.label);
        return false;
      }
      // Check by label (handles ID mismatches)
      if (item.label && completedLabels.has(item.label.toLowerCase().trim())) {
        console.log('[CarryoverService] Last-minute filter: removing completed item (by label):', item.label);
        return false;
      }
      return true;
    });
    
    console.log('[CarryoverService] After last-minute check:', verifiedIncompleteItems.length, 'of', incompleteItems.length, 'items are truly incomplete');
    
    const ref = doc(db, 'users', userId, 'action_progress', CARRYOVER_DOC_ID);
    const currentState = await getCarryoverState(db, userId);
    
    // Build set of currently incomplete item IDs for fast lookup
    const stillIncompleteIds = new Set(verifiedIncompleteItems.map(i => i.id));
    // Build map for looking up source item data (for filling missing fields)
    const verifiedItemsMap = new Map(verifiedIncompleteItems.map(i => [i.id, i]));
    
    // Helper: Get stable key for deduplication (NOT label-based!)
    // Uses handlerType or resourceId which are stable identifiers
    const getStableKey = (item) => {
      if (item.handlerType) return `handler:${item.handlerType}`;
      if (item.resourceId) return `resource:${item.resourceId}`;
      return `id:${item.id}`; // Fallback to ID
    };
    
    // Helper: Check if two items represent the same logical item
    const isSameItem = (a, b) => {
      if (a.id === b.id) return true;
      if (a.handlerType && a.handlerType === b.handlerType) return true;
      if (a.resourceId && a.resourceId === b.resourceId) return true;
      // Also check cross-matching (handlerType to resourceId pattern)
      if (a.handlerType && b.resourceId === `interactive-${a.handlerType}`) return true;
      if (b.handlerType && a.resourceId === `interactive-${b.handlerType}`) return true;
      return false;
    };
    
    // If already at this level, RECONCILE with current reality
    if (currentState.currentLevel === newLevel && currentState.items.length > 0) {
      console.log('[CarryoverService] Reconciling carryover for level', newLevel);
      
      // Update existing items: mark as complete if no longer in verifiedIncompleteItems
      // ALSO update items missing resource fields (fixes legacy carryover docs)
      const reconciledItems = currentState.items.map(item => {
        const sourceItem = verifiedItemsMap.get(item.id);
        
        if (item.completedAt) {
          // Already marked complete, keep as is
          return item;
        }
        if (!stillIncompleteIds.has(item.id)) {
          // Was incomplete in carryover, but now complete - mark it
          console.log('[CarryoverService] Item completed outside carryover:', item.id);
          return {
            ...item,
            completedAt: new Date().toISOString(),
            completedAtLevel: newLevel
          };
        }
        // Still incomplete - also fill in any missing resource fields from source
        if (sourceItem && (!item.resourceId || !item.resourceType)) {
          console.log('[CarryoverService] Updating item with missing resource fields:', item.id);
          return {
            ...item,
            resourceId: item.resourceId || sourceItem.resourceId || null,
            resourceType: item.resourceType || sourceItem.resourceType || null,
            url: item.url || sourceItem.url || null,
            description: item.description || sourceItem.description || null
          };
        }
        return item;
      });
      
      // Check for any new incomplete items not in carryover yet
      // DEDUPLICATION: Use stable identifiers (handlerType, resourceId), NOT labels
      const brandNewItems = verifiedIncompleteItems
        .filter(item => {
          // Check if this item already exists by stable identifier
          const alreadyExists = reconciledItems.some(existing => isSameItem(existing, item));
          return !alreadyExists;
        })
        .map(item => ({
          id: item.id,
          label: item.label || 'Action Item',
          category: item.category || 'Preparation',
          prepSection: item.prepSection || null,
          type: item.type || 'content',
          handlerType: item.handlerType || null,
          resourceId: item.resourceId || null,
          addedAtLevel: newLevel,
          completedAt: null,
          completedAtLevel: null,
          estimatedMinutes: item.estimatedMinutes || null,
          isInteractive: item.isInteractive || false,
          // Resource info for navigation
          resourceType: item.resourceType || null,
          url: item.url || null,
          description: item.description || null
        }));
      
      // Merge and then DEDUPE by stable identifier (NOT label!)
      const mergedRaw = [...reconciledItems, ...brandNewItems];
      const seenKeys = new Set();
      const finalItems = mergedRaw.filter(item => {
        const key = getStableKey(item);
        if (seenKeys.has(key)) {
          console.log('[CarryoverService] Reconciliation: removing duplicate by stable key:', key, item.label);
          return false;
        }
        seenKeys.add(key);
        return true;
      });
      
      // Only update if something changed
      const hasChanges = JSON.stringify(finalItems) !== JSON.stringify(currentState.items);
      if (hasChanges) {
        await updateDoc(ref, {
          items: finalItems,
          lastUpdated: serverTimestamp()
        });
        console.log('[CarryoverService] Reconciled carryover:', finalItems.length, 'items');
      }
      
      return { items: finalItems, currentLevel: newLevel };
    }
    
    // FRESH INITIALIZATION for level
    // Two scenarios:
    // 1. RECOVERY: currentLevel is null/undefined (first-time) → keep ALL items
    // 2. ACTUAL LEVEL TRANSITION: level-1 → level-2 → purge completed items per requirement
    //
    // REQUIREMENT: "Completed items stay VISIBLE until the next level transition"
    // REQUIREMENT: "At level transition: completed items are purged, new incomplete items added"
    // NOTE: We check undefined/null because 0 is a valid level (Prep)
    
    const hasStoredLevel = currentState.currentLevel !== undefined && currentState.currentLevel !== null;
    const isActualLevelTransition = hasStoredLevel && currentState.currentLevel !== newLevel;
    
    // Decide which items to keep
    let previousItems;
    if (isActualLevelTransition) {
      // Actual level transition: purge completed items per requirements
      console.log('[CarryoverService] Level transition:', currentState.currentLevel, '→', newLevel, '- purging completed items');
      previousItems = currentState.items.filter(item => !item.completedAt);
    } else {
      // Recovery or first init: keep ALL items (don't lose user's completed work)
      // This path is taken if levels match (should be handled by reconciliation above, but just in case)
      // OR if we don't have a stored level (recovery)
      console.log('[CarryoverService] Init/recovery at level:', newLevel, '- keeping all items');
      previousItems = currentState.items;
    }
    
    // Also mark any items that are now complete (in case user completed via other mechanism)
    const previousItemsReconciled = previousItems.map(item => {
      if (item.completedAt) return item; // Already complete
      
      // Check if it was completed via action_progress
      if (completedIds.has(item.id) || (item.label && completedLabels.has(item.label.toLowerCase().trim()))) {
        console.log('[CarryoverService] Marking item complete during init:', item.label);
        return {
          ...item,
          completedAt: new Date().toISOString(),
          completedAtLevel: newLevel
        };
      }
      return item;
    });
    
    // Add new incomplete items - DEDUPLICATION by stable identifiers (NOT labels!)
    const newItems = verifiedIncompleteItems
      .filter(item => {
        // Check if this item already exists by stable identifier
        const alreadyExists = previousItemsReconciled.some(existing => isSameItem(existing, item));
        return !alreadyExists;
      })
      .map(item => ({
        id: item.id,
        label: item.label || 'Action Item',
        category: item.category || 'Preparation',
        prepSection: item.prepSection || null,
        type: item.type || 'content',
        handlerType: item.handlerType || null,
        resourceId: item.resourceId || null,
        resourceType: item.resourceType || null,
        addedAtLevel: newLevel,
        completedAt: null,
        completedAtLevel: null,
        estimatedMinutes: item.estimatedMinutes || null,
        description: item.description || null,
        url: item.url || null,
        isInteractive: item.isInteractive || false
      }));
    
    // Merge and DEDUPE by stable identifier (NOT label!)
    const mergedRaw = [...previousItemsReconciled, ...newItems];
    const seenKeys = new Set();
    const mergedItems = mergedRaw.filter(item => {
      const key = getStableKey(item);
      if (seenKeys.has(key)) {
        console.log('[CarryoverService] Removing duplicate by stable key:', key, item.label);
        return false;
      }
      seenKeys.add(key);
      return true;
    });
    
    const newState = {
      items: mergedItems,
      currentLevel: newLevel,
      lastUpdated: serverTimestamp()
    };
    
    await setDoc(ref, newState);
    
    console.log('[CarryoverService] Initialized carryover for level', newLevel, ':', mergedItems.length, 'items');
    return newState;
  } catch (err) {
    console.error('[CarryoverService] Error initializing carryover:', err);
    return { items: [], currentLevel: newLevel };
  }
};

/**
 * Mark a carryover item as complete
 * The item stays in the list (visible) but is marked with completion info
 * ALSO marks the original action_progress/{itemId} so Dev Plan shows completion
 * 
 * @param {Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @param {string} itemId - ID of the item to mark complete
 * @param {number} currentLevel - The level where it was completed
 * @returns {Promise<boolean>} - Success
 */
export const markCarryoverItemComplete = async (db, userId, itemId, currentLevel) => {
  if (!db || !userId || !itemId) return false;
  
  try {
    // 1. Update the carryover document
    const carryoverRef = doc(db, 'users', userId, 'action_progress', CARRYOVER_DOC_ID);
    const currentState = await getCarryoverState(db, userId);
    
    // Find the item to get its metadata
    const carryoverItem = currentState.items.find(item => item.id === itemId);
    
    const updatedItems = currentState.items.map(item => {
      if (item.id === itemId && !item.completedAt) {
        return {
          ...item,
          completedAt: new Date().toISOString(),
          completedAtLevel: currentLevel
        };
      }
      return item;
    });
    
    await updateDoc(carryoverRef, {
      items: updatedItems,
      lastUpdated: serverTimestamp()
    });
    
    // 2. ALSO mark the original action_progress/{itemId} as complete
    // This ensures the Dev Plan shows the item as completed
    const actionProgressRef = doc(db, 'users', userId, 'action_progress', itemId);
    await setDoc(actionProgressRef, {
      status: 'completed',
      completedAt: serverTimestamp(),
      completedInWeek: currentLevel, // Use level as week for tracking
      carriedOver: true,
      carryCount: 1,
      category: carryoverItem?.category || 'prep',
      label: carryoverItem?.label || '',
      prepSection: carryoverItem?.prepSection || null,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log('[CarryoverService] Marked item complete in both carryover and action_progress:', itemId);
    return true;
  } catch (err) {
    console.error('[CarryoverService] Error marking item complete:', err);
    return false;
  }
};

/**
 * Purge completed items from carryover (called at level transition)
 * This removes items that were completed in the previous level
 * 
 * @param {Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Number of items purged
 */
export const purgeCompletedItems = async (db, userId) => {
  if (!db || !userId) return 0;
  
  try {
    const ref = doc(db, 'users', userId, 'action_progress', CARRYOVER_DOC_ID);
    const currentState = await getCarryoverState(db, userId);
    
    const incompleteItems = currentState.items.filter(item => !item.completedAt);
    const purgedCount = currentState.items.length - incompleteItems.length;
    
    await updateDoc(ref, {
      items: incompleteItems,
      lastUpdated: serverTimestamp()
    });
    
    console.log('[CarryoverService] Purged', purgedCount, 'completed items');
    return purgedCount;
  } catch (err) {
    console.error('[CarryoverService] Error purging completed items:', err);
    return 0;
  }
};

/**
 * Add new items to carryover (for mid-level additions like session prep)
 * 
 * @param {Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @param {Array} newItems - New items to add
 * @param {number} currentLevel - Current level
 * @returns {Promise<number>} - Number of items added
 */
export const addCarryoverItems = async (db, userId, newItems, currentLevel) => {
  if (!db || !userId || !newItems?.length) return 0;
  
  try {
    const ref = doc(db, 'users', userId, 'action_progress', CARRYOVER_DOC_ID);
    const currentState = await getCarryoverState(db, userId);
    
    // Avoid duplicates
    const existingIds = new Set(currentState.items.map(i => i.id));
    const itemsToAdd = newItems
      .filter(item => !existingIds.has(item.id))
      .map(item => ({
        id: item.id,
        label: item.label || 'Action Item',
        category: item.category || 'Preparation',
        prepSection: item.prepSection || null,
        type: item.type || 'content',
        handlerType: item.handlerType || null,
        resourceId: item.resourceId || null,
        resourceType: item.resourceType || null,
        addedAtLevel: currentLevel,
        completedAt: null,
        completedAtLevel: null,
        estimatedMinutes: item.estimatedMinutes || null,
        description: item.description || null,
        url: item.url || null,
        isInteractive: item.isInteractive || false
      }));
    
    if (itemsToAdd.length === 0) return 0;
    
    const mergedItems = [...currentState.items, ...itemsToAdd];
    
    await updateDoc(ref, {
      items: mergedItems,
      lastUpdated: serverTimestamp()
    });
    
    console.log('[CarryoverService] Added', itemsToAdd.length, 'new items');
    return itemsToAdd.length;
  } catch (err) {
    console.error('[CarryoverService] Error adding carryover items:', err);
    return 0;
  }
};

/**
 * Check if carryover needs initialization for a level
 * 
 * @param {Firestore} db - Firestore instance
 * @param {string} userId - User ID
 * @param {number} currentLevel - The level to check
 * @returns {Promise<boolean>} - True if initialization is needed
 */
export const needsCarryoverInit = async (db, userId, currentLevel) => {
  if (!db || !userId) return false;
  
  const state = await getCarryoverState(db, userId);
  
  // Needs init if:
  // 1. No current state exists and we're entering L1+
  // 2. We've advanced to a new level
  return currentLevel > 0 && (state.currentLevel < currentLevel || state.items.length === 0);
};

export default {
  getCarryoverState,
  initializeCarryoverForLevel,
  markCarryoverItemComplete,
  purgeCompletedItems,
  addCarryoverItems,
  needsCarryoverInit
};
