// src/services/dataUtils.js
export const sanitizeTimestamps = (obj) => {
  if (!obj) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeTimestamps(item));
  }
  
  if (obj && typeof obj === 'object' && typeof obj.toDate === 'function') {
    try {
      return obj.toDate();
    } catch (error) {
      console.warn('[sanitizeTimestamps] Error converting timestamp:', error);
      return null;
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
  
  const isSentinel = (
    val.constructor?.name === 'FieldValue' ||
    val.constructor?.name === 'ServerTimestampTransform' ||
    val.constructor?.name === 'DeleteFieldValueImpl' ||
    val.constructor?.name === 'NumericIncrementFieldValueImpl' ||
    val.constructor?.name === 'ArrayUnionFieldValueImpl' ||
    val.constructor?.name === 'ArrayRemoveFieldValueImpl' ||
    (val._methodName && typeof val._methodName === 'string') ||
    val._methodName === 'serverTimestamp' ||
    val._methodName === 'delete' ||
    val._methodName === 'increment' ||
    val._methodName === 'arrayUnion' ||
    val._methodName === 'arrayRemove' ||
    (val.toJSON && 
     typeof val.toJSON === 'function' && 
     !val.toISOString &&
     !val.toDate)
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
      delete base[k];
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
