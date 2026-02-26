const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

const env = process.argv[2] || 'test';
console.log(`Signing content_library URLs for: ${env}\n`);

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

async function signUrls() {
  const db = admin.firestore();
  const snapshot = await db.collection('content_library').get();
  
  let updated = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Check if this has a vault URL that needs signing
    const currentUrl = data.url || data.details?.url || data.details?.pdfUrl;
    if (!currentUrl || !currentUrl.includes('/vault/')) continue;
    if (currentUrl.includes('GoogleAccessId')) continue; // Already signed
    
    // Extract file path from URL
    const match = currentUrl.match(/\/vault\/[^?]+/);
    if (!match) continue;
    const filePath = match[0].substring(1); // Remove leading /
    
    console.log(`Signing: ${doc.id} (${data.title})`);
    console.log(`  File: ${filePath}`);
    
    try {
      const file = bucket.file(filePath);
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
      });
      
      // Update the document - put signed URL in details.url
      const updates = {};
      if (data.details?.url) {
        updates['details.url'] = signedUrl;
      } else if (data.url) {
        updates['url'] = signedUrl;
      } else if (data.details?.pdfUrl) {
        updates['details.pdfUrl'] = signedUrl;
      }
      
      await doc.ref.update(updates);
      updated++;
      console.log(`  ✓ Signed and updated`);
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }
  }
  
  console.log(`\nUpdated ${updated} content_library documents`);
}

signUrls().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
