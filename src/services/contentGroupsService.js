// src/services/contentGroupsService.js
// Service for managing Content Groups (Programs, Workouts, Skills) stored in system_lovs

import { 
  doc, 
  getDoc, 
  setDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { UNIFIED_COLLECTION } from './unifiedContentService';

// Collection and document paths
const LOV_COLLECTION = 'system_lovs';

// Group Types
export const GROUP_TYPES = {
  PROGRAMS: 'content_programs',
  WORKOUTS: 'content_workouts', 
  SKILLS: 'content_skills'
};

// Default structure for a group item
const createGroupItem = (overrides = {}) => ({
  id: `grp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  label: '',
  description: '',
  thumbnail: '',
  displayOrder: 0,
  isActive: true,
  isHiddenUntilUnlocked: false,
  unlockDay: null,
  contentOrder: [], // Optional: ordered list of content IDs for this group
  createdAt: new Date().toISOString(),
  ...overrides
});

/**
 * Get all groups of a specific type (Programs, Workouts, or Skills)
 * @param {object} db - Firestore instance
 * @param {string} groupType - One of GROUP_TYPES values
 * @returns {Array} Array of group items
 */
export const getContentGroups = async (db, groupType) => {
  try {
    const docRef = doc(db, LOV_COLLECTION, groupType);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      // Return items sorted by displayOrder, filtering inactive if needed
      const items = data.items || [];
      return items
        .filter(item => item.isActive !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching ${groupType}:`, error);
    return [];
  }
};

/**
 * Get all groups of a specific type (including inactive) for admin
 * @param {object} db - Firestore instance
 * @param {string} groupType - One of GROUP_TYPES values
 * @returns {Array} Array of all group items
 */
export const getAllContentGroupsAdmin = async (db, groupType) => {
  try {
    const docRef = doc(db, LOV_COLLECTION, groupType);
    const snapshot = await getDoc(docRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      const items = data.items || [];
      return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching ${groupType} for admin:`, error);
    return [];
  }
};

/**
 * Get a single group by ID
 * @param {object} db - Firestore instance
 * @param {string} groupType - One of GROUP_TYPES values
 * @param {string} groupId - The group's ID
 * @returns {object|null} The group item or null
 */
export const getContentGroupById = async (db, groupType, groupId) => {
  try {
    const groups = await getAllContentGroupsAdmin(db, groupType);
    return groups.find(g => g.id === groupId) || null;
  } catch (error) {
    console.error(`Error fetching group ${groupId}:`, error);
    return null;
  }
};

/**
 * Add a new group
 * @param {object} db - Firestore instance
 * @param {string} groupType - One of GROUP_TYPES values
 * @param {object} groupData - The group data (label, description, etc.)
 * @returns {object} The created group item
 */
export const addContentGroup = async (db, groupType, groupData) => {
  try {
    const docRef = doc(db, LOV_COLLECTION, groupType);
    const snapshot = await getDoc(docRef);
    
    const newItem = createGroupItem(groupData);
    let items = [];
    
    if (snapshot.exists()) {
      items = snapshot.data().items || [];
    }
    
    // Set displayOrder to be at the end
    newItem.displayOrder = items.length;
    items.push(newItem);
    
    await setDoc(docRef, {
      title: getGroupTypeTitle(groupType),
      description: `List of ${getGroupTypeTitle(groupType)} for content organization`,
      items,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return newItem;
  } catch (error) {
    console.error(`Error adding group to ${groupType}:`, error);
    throw error;
  }
};

/**
 * Update an existing group
 * @param {object} db - Firestore instance
 * @param {string} groupType - One of GROUP_TYPES values
 * @param {string} groupId - The group's ID
 * @param {object} updates - The fields to update
 */
export const updateContentGroup = async (db, groupType, groupId, updates) => {
  try {
    const docRef = doc(db, LOV_COLLECTION, groupType);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error(`Group type ${groupType} not found`);
    }
    
    const data = snapshot.data();
    const items = data.items || [];
    const index = items.findIndex(g => g.id === groupId);
    
    if (index === -1) {
      throw new Error(`Group ${groupId} not found`);
    }
    
    items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
    
    await setDoc(docRef, {
      ...data,
      items,
      updatedAt: serverTimestamp()
    });
    
    return items[index];
  } catch (error) {
    console.error(`Error updating group ${groupId}:`, error);
    throw error;
  }
};

/**
 * Delete a group (soft delete by setting isActive: false)
 * @param {object} db - Firestore instance
 * @param {string} groupType - One of GROUP_TYPES values
 * @param {string} groupId - The group's ID
 */
export const deleteContentGroup = async (db, groupType, groupId) => {
  return updateContentGroup(db, groupType, groupId, { isActive: false });
};

/**
 * Get all content items that belong to a specific group
 * @param {object} db - Firestore instance
 * @param {string} groupType - One of GROUP_TYPES values ('content_programs', 'content_workouts', 'content_skills')
 * @param {string} groupId - The group's ID
 * @returns {Array} Array of content items in this group
 */
export const getContentForGroup = async (db, groupType, groupId) => {
  try {
    // Map group type to the field name on content items
    const fieldMap = {
      [GROUP_TYPES.PROGRAMS]: 'programs',
      [GROUP_TYPES.WORKOUTS]: 'workouts',
      [GROUP_TYPES.SKILLS]: 'skills'
    };
    
    const fieldName = fieldMap[groupType];
    if (!fieldName) {
      throw new Error(`Invalid group type: ${groupType}`);
    }
    
    const contentRef = collection(db, UNIFIED_COLLECTION);
    const q = query(
      contentRef,
      where(fieldName, 'array-contains', groupId),
      orderBy('updatedAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error fetching content for group ${groupId}:`, error);
    return [];
  }
};

/**
 * Get ordered content for a group (uses contentOrder from group definition)
 * @param {object} db - Firestore instance
 * @param {string} groupType - One of GROUP_TYPES values
 * @param {string} groupId - The group's ID
 * @returns {Array} Ordered array of content items
 */
export const getOrderedContentForGroup = async (db, groupType, groupId) => {
  try {
    // 1. Get the group definition for its contentOrder
    const group = await getContentGroupById(db, groupType, groupId);
    if (!group) return [];
    
    // 2. Get all content for this group
    const content = await getContentForGroup(db, groupType, groupId);
    
    // 3. If group has contentOrder, sort by it
    if (group.contentOrder && group.contentOrder.length > 0) {
      const orderMap = {};
      group.contentOrder.forEach((id, index) => {
        orderMap[id] = index;
      });
      
      return content.sort((a, b) => {
        const orderA = orderMap[a.id] ?? 999;
        const orderB = orderMap[b.id] ?? 999;
        return orderA - orderB;
      });
    }
    
    // 4. Fallback: return as-is (sorted by updatedAt from query)
    return content;
  } catch (error) {
    console.error(`Error fetching ordered content for group ${groupId}:`, error);
    return [];
  }
};

// Helper to get display title for group types
const getGroupTypeTitle = (groupType) => {
  switch (groupType) {
    case GROUP_TYPES.PROGRAMS: return 'Programs';
    case GROUP_TYPES.WORKOUTS: return 'Workouts';
    case GROUP_TYPES.SKILLS: return 'Skills';
    default: return 'Groups';
  }
};

// Export for convenience
export const ContentGroupsService = {
  GROUP_TYPES,
  getContentGroups,
  getAllContentGroupsAdmin,
  getContentGroupById,
  addContentGroup,
  updateContentGroup,
  deleteContentGroup,
  getContentForGroup,
  getOrderedContentForGroup
};

export default ContentGroupsService;
