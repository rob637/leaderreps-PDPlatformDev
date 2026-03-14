const admin = require('firebase-admin');

const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'leaderreps-pd-platform.firebasestorage.app'
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

async function fixGuideUrl() {
  const filePath = 'vault/1772191138084_Session_1__Prep_Guide_v2.pdf';
  
  // Check if file exists in dev storage
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  
  if (!exists) {
    console.log('File does NOT exist in dev storage. Need to upload it.');
    console.log('For now, listing files in vault/ to see what we have...');
    
    const [files] = await bucket.getFiles({ prefix: 'vault/' });
    console.log('Files in vault/:', files.map(f => f.name).slice(0, 20));
    return;
  }
  
  console.log('File exists in dev storage! Generating new signed URL...');
  
  // Generate signed URL valid for 10 years
  const [signedUrl] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000 // 10 years
  });
  
  console.log('New signed URL:', signedUrl.substring(0, 100) + '...');
  
  // Update the document
  await db.collection('content_library').doc('NUhMcboyoxHMWjJN5CMU').update({
    'details.url': signedUrl
  });
  
  console.log('Updated document with new URL!');
}

fixGuideUrl().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
