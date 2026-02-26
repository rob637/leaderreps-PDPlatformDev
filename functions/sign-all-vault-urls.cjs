const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

const env = process.argv[2] || 'test';
console.log(`Signing ALL vault URLs for: ${env}\n`);

const saPath = env === 'prod' 
  ? '/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json'
  : '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';

const bucketName = env === 'prod'
  ? 'leaderreps-prod.firebasestorage.app'
  : 'leaderreps-test.firebasestorage.app';

const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const storage = new Storage({ credentials: sa });
const bucket = storage.bucket(bucketName);

// Fields that might contain URLs
const URL_FIELDS = ['url', 'videoUrl', 'pdfUrl', 'externalUrl'];

async function extractFilePath(url) {
  if (!url || !url.includes('/vault/')) return null;
  if (url.includes('GoogleAccessId')) return null; // Already signed
  
  const match = url.match(/\/vault\/[^?]+/);
  if (!match) return null;
  return match[0].substring(1); // Remove leading /
}

async function signUrl(filePath) {
  try {
    const file = bucket.file(filePath);
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
    });
    return signedUrl;
  } catch (err) {
    console.error(`  Error signing ${filePath}:`, err.message);
    return null;
  }
}

async function processCollection(collectionName) {
  const db = admin.firestore();
  const snapshot = await db.collection(collectionName).get();
  
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};
    
    // Check top-level URL fields
    for (const field of URL_FIELDS) {
      const url = data[field];
      const filePath = await extractFilePath(url);
      if (filePath) {
        const signedUrl = await signUrl(filePath);
        if (signedUrl) {
          updates[field] = signedUrl;
          console.log(`  ${doc.id}: ${field} -> signed`);
        }
      }
    }
    
    // Check details object
    if (data.details) {
      for (const field of URL_FIELDS) {
        const url = data.details[field];
        const filePath = await extractFilePath(url);
        if (filePath) {
          const signedUrl = await signUrl(filePath);
          if (signedUrl) {
            updates[`details.${field}`] = signedUrl;
            console.log(`  ${doc.id}: details.${field} -> signed`);
          }
        }
      }
    }
    
    // Check metadata object  
    if (data.metadata) {
      for (const field of URL_FIELDS) {
        const url = data.metadata[field];
        const filePath = await extractFilePath(url);
        if (filePath) {
          const signedUrl = await signUrl(filePath);
          if (signedUrl) {
            updates[`metadata.${field}`] = signedUrl;
            console.log(`  ${doc.id}: metadata.${field} -> signed`);
          }
        }
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      updated++;
    }
  }
  
  return updated;
}

async function main() {
  const collections = ['content_library', 'media_assets', 'video_series', 'content'];
  let total = 0;
  
  for (const collection of collections) {
    console.log(`\n=== Processing ${collection} ===`);
    const count = await processCollection(collection);
    total += count;
    console.log(`Updated ${count} documents in ${collection}`);
  }
  
  console.log(`\n✅ Total: ${total} documents updated`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
