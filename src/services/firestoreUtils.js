// src/services/firestoreUtils.js
import {
  doc as fsDoc,
  setDoc as fsSetDoc,
  onSnapshot as fsOnSnapshot,
  getDoc as fsGetDoc,
  serverTimestamp
} from 'firebase/firestore';

const __firestore_mock_store =
  typeof window !== 'undefined'
    ? window.__firestore_mock_store || (window.__firestore_mock_store = {})
    : {};

const createMockSnapshot = (docPath, data, exists = true) => ({
  exists: () => exists,
  data: () => data,
  docRef: docPath, 
  _md: { fromCache: false, pendingWrites: false },
});

const mockSetDoc = async (docRefPath, data) => {
  __firestore_mock_store[docRefPath] = data;
  return true;
};

const mockGetDoc = async (docPath) => {
  const d = __firestore_mock_store[docPath]; 
  return createMockSnapshot(docPath, d || {}, !!d);
};

// Helper to detect Firebase field value sentinels (serverTimestamp, increment, etc.)
const isFirebaseFieldValue = (value) => {
  if (!value || typeof value !== 'object') return false;
  // Firebase field values have _methodName property
  return value._methodName !== undefined || 
         (value.constructor && value.constructor.name === 'FieldValue');
};

const cleanUndefinedValues = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  // Preserve Firebase field value sentinels (serverTimestamp, increment, etc.)
  if (isFirebaseFieldValue(obj)) return obj;
  
  if (Array.isArray(obj)) return obj.map(cleanUndefinedValues);
  
  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== undefined) {
        newObj[key] = cleanUndefinedValues(value);
      } else {
        console.warn(`[cleanUndefinedValues] Removed 'undefined' from key: ${key}`);
      }
    }
  }
  return newObj;
};

const toDocRef = (db, path) => fsDoc(db, ...path.split('/'));

export const onSnapshotEx = (db, path, cb) => {
  if (!db) {
      console.warn(`[onSnapshotEx] No Firestore DB instance provided for path: ${path}. Using mock (no-op).`);
      return () => {}; 
  }
  console.log(`[onSnapshotEx] Setting up listener for: ${path}`);
  try {
      return fsOnSnapshot(
          toDocRef(db, path),
          { includeMetadataChanges: true },
          (snap) =>
          cb({
              exists: () => snap.exists(),
              data: () => snap.data(),
              docRef: path,
              _md: {
                  fromCache: snap.metadata.fromCache,
                  pendingWrites: snap.metadata.hasPendingWrites,
              },
          }),
          (error) => { 
              console.error(`[onSnapshotEx ERROR] Path: ${path}`, error);
          }
      );
  } catch (error) {
      console.error(`[onSnapshotEx SETUP FAILED] Path: ${path}`, error);
      return () => {}; 
  }
};

export const getDocEx = async (db, path) => {
  if (!db) {
      console.warn(`[getDocEx] No Firestore DB instance provided for path: ${path}. Using mock.`);
      return mockGetDoc(path);
  }
  try {
      const snap = await fsGetDoc(toDocRef(db, path));
      return {
          exists: () => snap.exists(),
          data: () => snap.data(),
          docRef: path,
      };
  } catch (error) {
      console.error(`[getDocEx FAILED] Path: ${path}`, error);
      return createMockSnapshot(path, {}, false);
  }
};

export const setDocEx = async (db, path, data, merge = false) => {
  if (!db) {
      console.warn(`[setDocEx] No Firestore DB instance provided for path: ${path}. Using mock.`);
      return mockSetDoc(path, data);
  }
  
  try {
      const cleanedData = cleanUndefinedValues(data);
      const dataWithTimestamp = { ...cleanedData, _updatedAt: serverTimestamp() };
      const docRef = toDocRef(db, path);
      await fsSetDoc(docRef, dataWithTimestamp, merge ? { merge: true } : undefined);
      return true; 
  } catch (error) {
      console.error(`[setDocEx FAILED] Path: ${path}`, error);
      console.error(`[setDocEx FAILED] Error details:`, {
        name: error.name,
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      // Only show alert in developer mode
      const isDeveloperMode = localStorage.getItem('arena-developer-mode') === 'true';
      if (isDeveloperMode) {
        alert(`❌ Firestore write failed!\nPath: ${path}\nError: ${error.message}\nCode: ${error.code}`);
      }
      return false; 
  }
};
