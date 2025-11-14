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
  console.log(`[MOCK SET] Path: ${docRefPath}`, data); 
  return true;
};

const mockGetDoc = async (docPath) => {
  const d = __firestore_mock_store[docPath];
  console.log(`[MOCK GET] Path: ${docPath}`, d ? '(Found)' : '(Not Found)'); 
  return createMockSnapshot(docPath, d || {}, !!d);
};

const cleanUndefinedValues = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;
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
      console.log(`[setDocEx] Attempting write to ${path}`, {
        merge,
        dataKeys: Object.keys(dataWithTimestamp),
        dataPreview: JSON.stringify(dataWithTimestamp, null, 2).substring(0, 500)
      });
      await fsSetDoc(docRef, dataWithTimestamp, merge ? { merge: true } : undefined);
      console.log(`[setDocEx SUCCESS] Path: ${path}`);
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
