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
  VIDEO: 'VIDEO',
  TOOL: 'TOOL',
  DOCUMENT: 'DOCUMENT',
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

// Role Levels
export const ROLE_LEVELS = {
  ALL: 'ALL',
  INDIVIDUAL_CONTRIBUTOR: 'INDIVIDUAL_CONTRIBUTOR',
  NEW_MANAGER: 'NEW_MANAGER',
  EXPERIENCED_MANAGER: 'EXPERIENCED_MANAGER',
  EXECUTIVE: 'EXECUTIVE'
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
    let q = contentRef;
    
    if (type && type !== 'ALL') {
      q = query(q, where('type', '==', type));
    }

    // Optional Filters
    if (options.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    // Default ordering by title or updatedAt
    q = query(q, orderBy('updatedAt', 'desc'));

    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // If type is provided, also check 'visibility' array for items that might be cross-listed
    // This is a client-side merge because Firestore doesn't support OR queries across different fields easily in this context
    if (type && type !== 'ALL') {
      const visibilityQuery = query(
        collection(db, UNIFIED_COLLECTION), 
        where('visibility', 'array-contains', type),
        orderBy('updatedAt', 'desc')
      );
      
      const visibilitySnapshot = await getDocs(visibilityQuery);
      const visibilityResults = visibilitySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Merge and deduplicate
      const existingIds = new Set(results.map(r => r.id));
      visibilityResults.forEach(item => {
        if (!existingIds.has(item.id)) {
          results.push(item);
        }
      });
    }

    return results;
  } catch (error) {
    console.error(`Error getting unified content for type ${type}:`, error);
    throw error;
  }
};

/**
 * Helper to push content to parent containers (Programs/Workouts)
 */
const pushContentToParents = async (db, contentId, contentData, pushTargets) => {
  if (!pushTargets) return;

  const { programs, workouts } = pushTargets;
  const batchUpdates = [];

  // 1. Push to Programs
  if (programs && programs.length > 0) {
    for (const programId of programs) {
      const programRef = doc(db, UNIFIED_COLLECTION, programId);
      const programSnap = await getDoc(programRef);
      
      if (programSnap.exists()) {
        const programData = programSnap.data();
        const currentModules = programData.details?.modules || programData.details?.workouts || [];
        
        // Check if already exists
        if (!currentModules.find(m => m.id === contentId)) {
          const newModule = {
            id: contentId,
            title: contentData.title,
            type: contentData.type, // Use primary type
            description: contentData.description || ''
          };
          
          const updatedModules = [...currentModules, newModule];
          
          batchUpdates.push(
            updateDoc(programRef, {
              'details.modules': updatedModules,
              updatedAt: serverTimestamp()
            })
          );
        }
      }
    }
  }

  // 2. Push to Workouts
  if (workouts && workouts.length > 0) {
    for (const workoutId of workouts) {
      const workoutRef = doc(db, UNIFIED_COLLECTION, workoutId);
      const workoutSnap = await getDoc(workoutRef);
      
      if (workoutSnap.exists()) {
        const workoutData = workoutSnap.data();
        const currentExercises = workoutData.details?.exercises || [];
        
        // Check if already exists
        if (!currentExercises.find(e => e.id === contentId)) {
           // Note: Workouts typically contain Exercises, but can now contain other content types in this flexible model
           // We'll treat them as "exercises" or "blocks"
           const newBlock = {
            id: contentId,
            title: contentData.title,
            type: contentData.type,
            description: contentData.description || ''
          };

          const updatedExercises = [...currentExercises, newBlock];
          
          batchUpdates.push(
            updateDoc(workoutRef, {
              'details.exercises': updatedExercises,
              updatedAt: serverTimestamp()
            })
          );
        }
      }
    }
  }

  await Promise.all(batchUpdates);
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
 * @param {object} pushTargets - Optional { programs: [], workouts: [] } to add this content to
 */
export const addUnifiedContent = async (db, data, pushTargets = null) => {
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
    
    // Handle Push to Parents
    if (pushTargets) {
      await pushContentToParents(db, docRef.id, payload, pushTargets);
    }

    return { id: docRef.id, ...payload };
  } catch (error) {
    console.error('Error adding unified content:', error);
    throw error;
  }
};

/**
 * Update an existing content item
 */
export const updateUnifiedContent = async (db, id, data, pushTargets = null) => {
  try {
    const docRef = doc(db, UNIFIED_COLLECTION, id);
    
    const payload = {
      ...data,
      updatedAt: serverTimestamp()
    };

    await updateDoc(docRef, payload);

    // Handle Push to Parents
    if (pushTargets) {
      await pushContentToParents(db, id, payload, pushTargets);
    }

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
