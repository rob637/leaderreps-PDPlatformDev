// src/services/dataUtils.js
export const sanitizeTimestamps = (obj) => {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeTimestamps(item));
  }
  
  // Handle Firestore Timestamp with toDate method
  if (obj && typeof obj === 'object' && typeof obj.toDate === 'function') {
    try {
      return obj.toDate();
    } catch (error) {
      console.warn('[sanitizeTimestamps] Error converting timestamp:', error);
      return null;
    }
  }
  
  // Handle serialized Firestore Timestamp {seconds, nanoseconds} format
  // Only convert if it's a pure timestamp object (has seconds, optionally nanoseconds, and no other meaningful keys)
  if (obj && typeof obj === 'object' && typeof obj.seconds === 'number') {
    const keys = Object.keys(obj);
    const isTimestampLike = keys.every(k => k === 'seconds' || k === 'nanoseconds');
    if (isTimestampLike && keys.length <= 2) {
      try {
        const nanoseconds = typeof obj.nanoseconds === 'number' ? obj.nanoseconds : 0;
        return new Date(obj.seconds * 1000 + nanoseconds / 1000000);
      } catch (error) {
        console.warn('[sanitizeTimestamps] Error converting seconds/nanoseconds:', error, obj);
        return null;
      }
    }
  }
  
  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeTimestamps(obj[key]);
      }
    }
    return sanitized;
  }
  
  return obj;
};

export const stripSentinels = (val) => {
  if (!val || typeof val !== 'object') {
    return val;
  }
  
  // Check if this is a PURE sentinel object (has _methodName but ONLY sentinel-related keys)
  // True Firebase sentinels typically ONLY have _methodName and maybe operand/delegate
  const isPureSentinel = () => {
    // Must have _methodName
    if (!val._methodName || typeof val._methodName !== 'string') {
      return false;
    }
    // Check if it ONLY has sentinel-related keys (not a real data object with _methodName leftover)
    const keys = Object.keys(val);
    const sentinelOnlyKeys = ['_methodName', 'operand', 'delegate', '_delegate'];
    const hasOnlySentinelKeys = keys.every(k => sentinelOnlyKeys.includes(k));
    // If it has other keys like 'wins', 'otherTasks', etc., it's NOT a pure sentinel
    return hasOnlySentinelKeys;
  };
  
  const isSentinel = (
    val.constructor?.name === 'FieldValue' ||
    val.constructor?.name === 'ServerTimestampTransform' ||
    val.constructor?.name === 'DeleteFieldValueImpl' ||
    val.constructor?.name === 'NumericIncrementFieldValueImpl' ||
    val.constructor?.name === 'ArrayUnionFieldValueImpl' ||
    val.constructor?.name === 'ArrayRemoveFieldValueImpl' ||
    isPureSentinel() ||  // Only treat as sentinel if it's a PURE sentinel object
    (val.toJSON && 
     typeof val.toJSON === 'function' && 
     !val.toISOString &&
     !val.toDate &&
     Object.keys(val).length <= 2)  // Pure sentinels have few keys
  );
  
  if (isSentinel) {
    return null;
  }
  
  if (val instanceof Date) {
    return val;
  }
  
  if (val.toDate && typeof val.toDate === 'function') {
    return val;
  }
  
  if (Array.isArray(val)) {
    return val
      .map(item => stripSentinels(item))
      .filter(item => item !== null && item !== undefined);
  }
  
  if (val && typeof val === 'object') {
    const cleaned = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        // Skip _methodName properties that are leftover from migrations
        if (key === '_methodName') {
          continue;
        }
        const cleanedValue = stripSentinels(val[key]);
        if (cleanedValue !== null && cleanedValue !== undefined) {
          cleaned[key] = cleanedValue;
        }
      }
    }
    return cleaned;
  }
  
  return val;
};

const isFirestoreSentinel = (v) =>
  v && typeof v === 'object' && typeof v._methodName === 'string';

export function applyPatchDeleteAware(prev, patch) {
  if (patch === null || typeof patch !== 'object') return patch;

  if (Array.isArray(patch)) {
    return stripSentinels(patch);
  }

  const base =
    prev && typeof prev === 'object' && !Array.isArray(prev) ? { ...prev } : {};

  for (const [k, v] of Object.entries(patch)) {
    if (isFirestoreSentinel(v)) {
      if (v._methodName === 'deleteField') {
        delete base[k];
      }
      // For other sentinels (serverTimestamp, arrayUnion, etc.), 
      // we preserve the existing local value rather than deleting it.
      // This prevents UI flashing/data loss during optimistic updates.
      continue;
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      base[k] = applyPatchDeleteAware(base[k], v);
    } else {
      base[k] = v;
    }
  }
  return base;
}
