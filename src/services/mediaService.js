// src/services/mediaService.js
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  doc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

export const MEDIA_COLLECTION = 'media_assets';

export const MEDIA_TYPES = {
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  DOCUMENT: 'DOCUMENT',
  OTHER: 'OTHER'
};

/**
 * Determine media type from mime type
 */
const getMediaType = (mimeType) => {
  if (mimeType.startsWith('image/')) return MEDIA_TYPES.IMAGE;
  if (mimeType.startsWith('video/')) return MEDIA_TYPES.VIDEO;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('msword')) return MEDIA_TYPES.DOCUMENT;
  return MEDIA_TYPES.OTHER;
};

/**
 * Upload a file to Storage and create a record in Firestore
 * @param {object} services - { storage, db }
 * @param {File} file - The file object
 * @param {string} folder - Storage folder path (default: 'vault')
 * @param {function} onProgress - Callback for upload progress (0-100)
 */
export const uploadMediaAsset = async ({ storage, db }, file, folder = 'vault', onProgress) => {
  try {
    // 1. Upload to Firebase Storage
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `${folder}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // 2. Create Record in Firestore
            const mediaType = getMediaType(file.type);
            const assetData = {
              title: file.name,
              fileName: safeName,
              storagePath: storagePath,
              url: downloadURL,
              type: mediaType,
              mimeType: file.type,
              size: file.size,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              tags: []
            };

            const docRef = await addDoc(collection(db, MEDIA_COLLECTION), assetData);
            resolve({ id: docRef.id, ...assetData });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in uploadMediaAsset:', error);
    throw error;
  }
};

/**
 * Get all media assets
 */
export const getMediaAssets = async (db, typeFilter = null) => {
  try {
    const mediaRef = collection(db, MEDIA_COLLECTION);
    // Use client-side filtering to avoid composite index requirements for now
    const q = query(mediaRef, orderBy('createdAt', 'desc'));

    const snapshot = await getDocs(q);
    const allAssets = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (typeFilter && typeFilter !== 'ALL') {
      return allAssets.filter(asset => asset.type === typeFilter);
    }

    return allAssets;
  } catch (error) {
    console.error('Error fetching media assets:', error);
    throw error;
  }
};

/**
 * Delete a media asset
 */
export const deleteMediaAsset = async ({ storage, db }, asset) => {
  try {
    // 1. Delete from Storage
    if (asset.storagePath) {
      const storageRef = ref(storage, asset.storagePath);
      await deleteObject(storageRef).catch(err => {
        console.warn('Could not delete file from storage (might not exist):', err);
      });
    }

    // 2. Delete from Firestore
    await deleteDoc(doc(db, MEDIA_COLLECTION, asset.id));
    return true;
  } catch (error) {
    console.error('Error deleting media asset:', error);
    throw error;
  }
};

/**
 * Update a media asset
 */
export const updateMediaAsset = async (db, assetId, updates) => {
  try {
    const assetRef = doc(db, MEDIA_COLLECTION, assetId);
    await updateDoc(assetRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating media asset:', error);
    throw error;
  }
};

/**
 * Replace a media asset file and update references
 */
export const replaceMediaAsset = async ({ storage, db }, oldAsset, newFile, onProgress) => {
  try {
    // 1. Upload new file
    const timestamp = Date.now();
    const safeName = newFile.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `vault/${timestamp}_${safeName}`;
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytesResumable(storageRef, newFile);

    const newUrl = await new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });

    // 2. Update Media Asset Doc
    const mediaType = getMediaType(newFile.type);
    await updateMediaAsset(db, oldAsset.id, {
      url: newUrl,
      storagePath: storagePath,
      type: mediaType,
      mimeType: newFile.type,
      size: newFile.size,
      fileName: safeName
      // Keep original title unless user changed it separately
    });

    // 3. Delete old file from storage (optional, but good for cleanup)
    if (oldAsset.storagePath) {
      const oldRef = ref(storage, oldAsset.storagePath);
      await deleteObject(oldRef).catch(err => console.warn('Failed to delete old file:', err));
    }

    return newUrl;
  } catch (error) {
    console.error('Error replacing media asset:', error);
    throw error;
  }
};

/**
 * Scan content collections and update references to the old URL
 */
export const updateAssetReferences = async (db, oldUrl, newUrl) => {
  const collections = [
    'content_readings', 
    'content_documents', 
    'content_videos', 
    'content_courses',
    'content_library',
    'content_community',
    'content_coaching'
  ];
  const fieldsToCheck = ['url', 'pdfUrl', 'videoUrl', 'thumbnail', 'image', 'coverImage', 'photoURL'];
  
  let updateCount = 0;
  
  try {
    for (const colName of collections) {
      for (const field of fieldsToCheck) {
        const q = query(collection(db, colName), where(field, '==', oldUrl));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { [field]: newUrl });
            updateCount++;
          });
          await batch.commit();
        }
      }
    }
    return updateCount;
  } catch (error) {
    console.error('Error updating references:', error);
    throw error;
  }
};
