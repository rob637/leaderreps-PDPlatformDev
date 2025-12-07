// src/services/unifiedContentService.js
// Service for the Unified Content Library (Canonical Model)

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

// Collection Name
export const UNIFIED_COLLECTION = 'content_library';

// Content Types Enum
export const CONTENT_TYPES = {
  PROGRAM: 'PROGRAM',
  WORKOUT: 'WORKOUT',
  EXERCISE: 'EXERCISE',
  REP: 'REP',
  READ_REP: 'READ_REP',
  TOOL: 'TOOL',
  SKILL: 'SKILL'
};

// Content Status Enum
export const CONTENT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
};

// Difficulty Levels
export const DIFFICULTY_LEVELS = {
  FOUNDATION: 'FOUNDATION',
  PRO: 'PRO',
  ADVANCED: 'ADVANCED'
};

/**
 * Get content items filtered by type and other options
 * @param {object} db - Firestore instance
 * @param {string} type - Content Type (from CONTENT_TYPES)
 * @param {object} options - { status, category, limit }
 */
export const getUnifiedContent = async (db, type, options = {}) => {
  try {
    const contentRef = collection(db, UNIFIED_COLLECTION);
    let q = query(contentRef, where('type', '==', type));

    // Optional Filters
    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    // Default ordering by title or updatedAt
    q = query(q, orderBy('updatedAt', 'desc'));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting unified content for type ${type}:`, error);
    throw error;
  }
};

/**
 * Get a single content item by ID
 */
export const getUnifiedContentById = async (db, id) => {
  try {
    const docRef = doc(db, UNIFIED_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting content item ${id}:`, error);
    throw error;
  }
};

/**
 * Add a new content item
 * @param {object} db 
 * @param {object} data - Content data object
 */
export const addUnifiedContent = async (db, data) => {
  try {
    const contentRef = collection(db, UNIFIED_COLLECTION);
    
    // Ensure required fields
    const payload = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: data.status || CONTENT_STATUS.DRAFT
    };

    const docRef = await addDoc(contentRef, payload);
    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error('Error adding unified content:', error);
    throw error;
  }
};

/**
 * Update an existing content item
 */
export const updateUnifiedContent = async (db, id, data) => {
  try {
    const docRef = doc(db, UNIFIED_COLLECTION, id);
    
    const payload = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, payload);
    return { id, ...payload };
  } catch (error) {
    console.error(`Error updating content ${id}:`, error);
    throw error;
  }
};

/**
 * Soft delete (archive) a content item
 */
export const archiveUnifiedContent = async (db, id) => {
  return updateUnifiedContent(db, id, { status: CONTENT_STATUS.ARCHIVED });
};

/**
 * Hard delete a content item (Admin only)
 */
export const deleteUnifiedContent = async (db, id) => {
  try {
    await deleteDoc(doc(db, UNIFIED_COLLECTION, id));
    return true;
  } catch (error) {
    console.error(`Error deleting content ${id}:`, error);
    throw error;
  }
};
