// src/services/globalMetadataWriter.js
import { serverTimestamp } from 'firebase/firestore';
import { setDocEx } from './firestoreUtils';
import { mockDoc } from './pathUtils';

export const updateGlobalMetadata = async (
  db,
  data,
  { merge = true, source = 'Unknown', userId = 'N/A', forceDocument = 'config' } 
) => {
  if (!db) {
    console.warn(`[GLOBAL WRITE MOCK] Skipping write (source: ${source})`);
    return data; 
  }

  let path;
  let payload = { ...data }; 

  const catalogKeys = [
    'REP_LIBRARY', 'EXERCISE_LIBRARY', 'WORKOUT_LIBRARY', 'COURSE_LIBRARY', 
    'SKILL_CATALOG', 'IDENTITY_ANCHOR_CATALOG', 'HABIT_ANCHOR_CATALOG', 
    'WHY_CATALOG', 'READING_CATALOG', 'VIDEO_CATALOG', 'SCENARIO_CATALOG',
    'MEMBERSHIP_PLANS'
  ];
  
  const catalogKeyToUpdate = catalogKeys.find(key => Object.prototype.hasOwnProperty.call(data, key));

  if (catalogKeyToUpdate === 'MEMBERSHIP_PLANS' && forceDocument === 'config') {
      path = 'metadata/config/catalog/membership_plans';
      const body = Array.isArray(payload.MEMBERSHIP_PLANS) ? { items: payload.MEMBERSHIP_PLANS } : payload.MEMBERSHIP_PLANS;
      payload = body;
  } else if (forceDocument === 'reading_catalog') {
      path = mockDoc(db, 'metadata', 'reading_catalog');
      if (!payload || !payload.items || !Array.isArray(payload.items)) {
           const potentialArray = Object.values(payload).find(Array.isArray);
           payload = { items: potentialArray || (Array.isArray(payload) ? payload : []) };
           console.warn(`[GLOBAL WRITE] Auto-wrapping payload for reading_catalog into { items: [...] }`);
      }
  } else {
      path = mockDoc(db, 'metadata', 'config');
      catalogKeys.forEach(key => delete payload[key]); 
      delete payload.RESOURCE_LIBRARY; delete payload.RESOURCE_LIBRARY_ITEMS; delete payload.catalog; 
  }

   if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
       console.warn(`[GLOBAL WRITE SKIPPED] Payload for ${path} became empty after cleaning. Source: ${source}`);
       return {}; 
   }

  try {
    const finalPayload = {
        ...payload,
        _updatedAt: serverTimestamp(), 
        _updatedBy: userId,
        _source: source
    };

    const success = await setDocEx(db, path, finalPayload, merge);

    if (success) {
        console.log(`[GLOBAL WRITE SUCCESS] Document: ${path}. Merge: ${merge}. Keys Updated: ${Object.keys(payload).join(', ')}. Source: ${source}`);
        return { ...payload, _updatedBy: userId, _source: source };
    } else {
        throw new Error(`setDocEx failed for path ${path}`);
    }

  } catch (e) {
    console.error(`[GLOBAL WRITE FAILED] Document: ${path}`, e);
    throw new Error(`Failed to update global metadata for ${path}: ${e.message}`);
  }
};

export const updateCatalogDoc = async (db, docName, payload, { merge = true, userId = 'N/A' } = {}) => {
  const path = `metadata/config/catalog/${docName}`;
  const body = Array.isArray(payload) ? { items: payload } : payload;
  const finalPayload = { ...body, _updatedAt: serverTimestamp(), _updatedBy: userId, _source: 'updateCatalogDoc' };
  return setDocEx(db, path, finalPayload, merge);
};
