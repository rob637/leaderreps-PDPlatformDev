const admin = require('firebase-admin');

const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'leaderreps-pd-platform.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function fixGuideUrl() {
  // Use the file that exists in dev storage
  const filePath = 'vault/1772189574660_Session_1__Prep_Guide_v2.pdf';
  
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  
  if (!exists) {
    console.log('File still not found!');
    return;
  }
  
  console.log('File exists! Generating signed URL...');
  
  // Generate signed URL valid for 10 years
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
  });
  
  console.log('New signed URL generated.');
  
  // Update the document
  await db.collection('content_library').doc('NUhMcboyoxHMWjJN5CMU').update({
    'details.url': signedUrl
  });
  
  console.log('Updated Session 1 Guide document with new dev URL!');
}

fixGuideUrl().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
