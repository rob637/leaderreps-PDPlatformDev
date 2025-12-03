// src/services/contentService.js
// Generic Content Management Service for Firestore
// Supports any content type: readings, videos, courses, etc.

import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

/**
 * Content Schema (for all content types):
 * {
 *   title: string
 *   description: string
 *   url: string (for readings/videos) or null (for courses with modules)
 *   tier: 'free' | 'premium'
 *   category: string (e.g., 'leadership', 'management', 'communication')
 *   isActive: boolean
 *   thumbnail: string (optional - URL to image)
 *   dateAdded: timestamp
 *   dateModified: timestamp
 *   order: number (for sorting)
 *   metadata: object (type-specific fields)
 * }
 */

// Collection names (easily extendable)
export const CONTENT_COLLECTIONS = {
  READINGS: 'content_readings',
  VIDEOS: 'content_videos',
  COURSES: 'content_courses',
  COMMUNITY: 'content_community',
  COACHING: 'content_coaching',
  LOV: 'system_lovs'
};

// Tier hierarchy for filtering (dev has unlimited access)
const TIER_LEVELS = {
  free: 0,
  premium: 1,
  dev: 999
};

/**
 * Generic function to get all content from a collection
 * @param {object} db - Firestore instance
 * @param {string} collectionName - Name of the collection
 * @param {object} options - Query options
 * @returns {array} Array of content items
 */
export const getContent = async (db, collectionName, options = {}) => {
  try {
    const {
      userTier = 'free',
      category = null,
      activeOnly = true,
      orderByField = 'order'
    } = options;

    const contentRef = collection(db, collectionName);
    let q = query(contentRef);

    // Filter by active status
    if (activeOnly) {
      q = query(contentRef, where('isActive', '==', true));
    }

    // Filter by category if specified
    if (category) {
      q = query(q, where('category', '==', category));
    }

    // Add ordering (indexes are now enabled in Firebase)
    q = query(q, orderBy(orderByField, 'asc'));

    const snapshot = await getDocs(q);
    let allContent = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Filter by tier access (client-side for now)
    const userTierLevel = TIER_LEVELS[userTier] || 0;
    const accessibleContent = allContent.filter(item => {
      const itemTierLevel = TIER_LEVELS[item.tier] || 0;
      return userTierLevel >= itemTierLevel;
    });

    return accessibleContent;
  } catch (error) {
    console.error(`Error fetching content from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Get all content (admin view - no tier filtering)
 */
export const getAllContentAdmin = async (db, collectionName) => {
  try {
    const contentRef = collection(db, collectionName);
    const q = query(contentRef, orderBy('dateAdded', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error fetching admin content from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Add new content item
 */
export const addContent = async (db, collectionName, contentData) => {
  try {
    const contentRef = collection(db, collectionName);
    
    const newContent = {
      ...contentData,
      isActive: contentData.isActive ?? true,
      dateAdded: serverTimestamp(),
      dateModified: serverTimestamp(),
      order: contentData.order ?? 999
    };

    const docRef = await addDoc(contentRef, newContent);
    
    console.log(`✅ Content added to ${collectionName}:`, docRef.id);
    return { id: docRef.id, ...newContent };
  } catch (error) {
    console.error(`Error adding content to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update existing content item
 */
export const updateContent = async (db, collectionName, contentId, updates) => {
  try {
    const contentRef = doc(db, collectionName, contentId);
    
    const updatedData = {
      ...updates,
      dateModified: serverTimestamp()
    };

    await updateDoc(contentRef, updatedData);
    
    console.log(`✅ Content updated in ${collectionName}:`, contentId);
    return { id: contentId, ...updatedData };
  } catch (error) {
    console.error(`Error updating content in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete content item
 */
export const deleteContent = async (db, collectionName, contentId) => {
  try {
    const contentRef = doc(db, collectionName, contentId);
    await deleteDoc(contentRef);
    
    console.log(`✅ Content deleted from ${collectionName}:`, contentId);
    return true;
  } catch (error) {
    console.error(`Error deleting content from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Soft delete (set isActive to false instead of deleting)
 */
export const deactivateContent = async (db, collectionName, contentId) => {
  return updateContent(db, collectionName, contentId, { isActive: false });
};

/**
 * Helper: Get readings for a specific user tier
 */
export const getReadings = async (db, userTier = 'free') => {
  return getContent(db, CONTENT_COLLECTIONS.READINGS, { userTier });
};

/**
 * Helper: Get videos for a specific user tier
 */
export const getVideos = async (db, userTier = 'free') => {
  return getContent(db, CONTENT_COLLECTIONS.VIDEOS, { userTier });
};

/**
 * Helper: Get courses for a specific user tier
 */
export const getCourses = async (db, userTier = 'free') => {
  return getContent(db, CONTENT_COLLECTIONS.COURSES, { userTier });
};

/**
 * Upload a resource file to Firebase Storage
 * @param {File} file - The file object to upload
 * @param {string} folder - The folder path in storage (e.g., 'resources/videos')
 * @returns {Promise<{url: string, metadata: object}>} - The download URL and metadata
 */
export const uploadResourceFile = async (file, folder = 'resources') => {
  try {
    const storage = getStorage();
    // Create a unique filename: timestamp_originalName
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const storageRef = ref(storage, `${folder}/${filename}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    return {
      url,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        fullPath: snapshot.metadata.fullPath,
        timeCreated: snapshot.metadata.timeCreated
      }
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export default {
  getContent,
  getAllContentAdmin,
  addContent,
  updateContent,
  deleteContent,
  deactivateContent,
  uploadResourceFile,
  getReadings,
  getVideos,
  getCourses,
  CONTENT_COLLECTIONS
};
