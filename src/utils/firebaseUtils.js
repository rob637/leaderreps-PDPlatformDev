// src/utils/firebaseUtils.js
// Utility functions for Firebase integration
// CRITICAL: Strips Firebase FieldValue sentinels that cause React Error #31

/**
 * Recursively strips Firebase FieldValue sentinels from data
 * 
 * Firebase sentinels like serverTimestamp() are special objects that:
 * - Get converted to timestamps on the server
 * - Return as sentinel objects in client callbacks
 * - Cannot be rendered by React (causes Error #31)
 * - Must be stripped before entering React state
 * 
 * @param {any} obj - Data that may contain sentinels
 * @returns {any} - Clean data with sentinels removed
 */
export const stripFirebaseSentinels = (obj) => {
  // Handle null, undefined, primitives
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Check if this is a Firebase sentinel
  // Sentinels have specific constructor names or method signatures
  const isSentinel = (
    obj.constructor?.name === 'FieldValue' ||
    obj.constructor?.name === 'ServerTimestampTransform' ||
    obj.constructor?.name === 'DeleteFieldValueImpl' ||
    obj.constructor?.name === 'NumericIncrementFieldValueImpl' ||
    obj.constructor?.name === 'ArrayUnionFieldValueImpl' ||
    obj.constructor?.name === 'ArrayRemoveFieldValueImpl' ||
    obj._methodName === 'serverTimestamp' ||
    obj._methodName === 'delete' ||
    obj._methodName === 'increment' ||
    obj._methodName === 'arrayUnion' ||
    obj._methodName === 'arrayRemove' ||
    // Additional check: has toJSON but not a Date
    (obj.toJSON && typeof obj.toJSON === 'function' && !obj.toISOString)
  );
  
  if (isSentinel) {
    console.warn('[stripSentinels] Removing Firebase sentinel:', {
      constructor: obj.constructor?.name,
      method: obj._methodName,
      type: typeof obj
    });
    return null; // Remove the sentinel entirely
  }
  
  // Handle Date objects (preserve them)
  if (obj instanceof Date) {
    return obj;
  }
  
  // Handle Firestore Timestamp objects (convert to Date)
  if (obj.toDate && typeof obj.toDate === 'function') {
    try {
      return obj.toDate();
    } catch (e) {
      console.warn('[stripSentinels] Failed to convert Timestamp:', e);
      return null;
    }
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .map(item => stripFirebaseSentinels(item))
      .filter(item => item !== null && item !== undefined);
  }
  
  // Handle plain objects
  const cleaned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = stripFirebaseSentinels(obj[key]);
      // Only add non-null values
      if (value !== null && value !== undefined) {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
};

/**
 * Creates a Firestore converter that automatically strips sentinels
 * Use with: doc(db, path).withConverter(createCleanConverter())
 */
export const createCleanConverter = () => ({
  toFirestore: (data) => data,
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return stripFirebaseSentinels(data);
  }
});

/**
 * Wraps a Firestore onSnapshot callback to auto-strip sentinels
 * 
 * @param {Function} callback - Your snapshot handler
 * @returns {Function} - Wrapped callback that strips sentinels
 * 
 * Usage:
 * onSnapshot(docRef, withSentinelStripping((snap) => {
 *   if (snap.exists()) {
 *     const data = snap.data(); // Already cleaned!
 *     setState(data);
 *   }
 * }))
 */
export const withSentinelStripping = (callback) => {
  return (snapshot) => {
    if (snapshot.exists && snapshot.exists()) {
      // Get raw data
      const rawData = snapshot.data();
      
      // Strip sentinels
      const cleanData = stripFirebaseSentinels(rawData);
      
      // Create a proxy snapshot with clean data
      const cleanSnapshot = {
        ...snapshot,
        data: () => cleanData,
        _originalData: rawData
      };
      
      return callback(cleanSnapshot);
    }
    
    return callback(snapshot);
  };
};

/**
 * Validates that data is clean (no sentinels)
 * Useful for debugging
 * 
 * @param {any} data - Data to validate
 * @param {string} context - Description for logging
 * @returns {boolean} - True if clean, false if sentinels found
 */
export const validateNoSentinels = (data, context = 'unknown') => {
  const sentinels = findSentinels(data);
  
  if (sentinels.length > 0) {
    console.error(`[validateNoSentinels] Found ${sentinels.length} sentinel(s) in ${context}:`, sentinels);
    return false;
  }
  
  console.log(`[validateNoSentinels] ✓ ${context} is clean`);
  return true;
};

/**
 * Internal: Recursively finds all sentinels in data
 * Used by validateNoSentinels
 */
const findSentinels = (obj, path = 'root') => {
  if (!obj || typeof obj !== 'object') {
    return [];
  }
  
  const sentinels = [];
  
  // Check if current object is a sentinel
  const isSentinel = (
    obj.constructor?.name === 'FieldValue' ||
    obj.constructor?.name?.includes('Transform') ||
    obj._methodName ||
    (obj.toJSON && typeof obj.toJSON === 'function' && !obj.toISOString && !obj.toDate)
  );
  
  if (isSentinel) {
    sentinels.push({
      path,
      constructor: obj.constructor?.name,
      method: obj._methodName
    });
  }
  
  // Recursively check children
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      sentinels.push(...findSentinels(item, `${path}[${index}]`));
    });
  } else {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sentinels.push(...findSentinels(obj[key], `${path}.${key}`));
      }
    }
  }
  
  return sentinels;
};

/**
 * Safely converts Firestore Timestamp to ISO string
 * Handles both Firestore Timestamps and Date objects
 */
export const toISOString = (timestamp) => {
  if (!timestamp) return null;
  
  // Already a string
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  
  // Firestore Timestamp
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    try {
      return timestamp.toDate().toISOString();
    } catch (e) {
      console.warn('[toISOString] Failed to convert Timestamp:', e);
      return null;
    }
  }
  
  // Date object
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  console.warn('[toISOString] Unknown timestamp format:', timestamp);
  return null;
};

export default {
  stripFirebaseSentinels,
  createCleanConverter,
  withSentinelStripping,
  validateNoSentinels,
  toISOString
};
