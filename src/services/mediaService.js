// src/services/mediaService.js
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
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
    let q = query(mediaRef, orderBy('createdAt', 'desc'));

    if (typeFilter && typeFilter !== 'ALL') {
      q = query(q, where('type', '==', typeFilter));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
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
