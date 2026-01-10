const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function check() {
  // 1. Check feature flags
  console.log('=== 1. FEATURE FLAGS ===');
  const flagsDoc = await db.collection('metadata').doc('featureFlags').get();
  console.log('Exists:', flagsDoc.exists);
  if (flagsDoc.exists) console.log('Data:', flagsDoc.data());

  // 2. Check VIDEO type - what fields do they have?
  console.log('\n=== 2. VIDEO CONTENT ===');
  const videoSnap = await db.collection('content_library').where('type', '==', 'VIDEO').get();
  console.log('Total VIDEO items:', videoSnap.docs.length);
  videoSnap.docs.forEach(d => {
    const data = d.data();
    const hasUrl = data.details?.videoUrl || data.details?.url || data.videoUrl || data.url || data.youtubeId;
    console.log('ID:', d.id, '| Title:', data.title, '| hasUrl:', !!hasUrl, '| details.videoUrl:', data.details?.videoUrl);
  });

  // 3. Check orphaned content links
  console.log('\n=== 3. CONTENT LINKS ===');
  const weeksSnap = await db.collection('development_plan_v1').get();
  const referencedIds = new Set();
  weeksSnap.docs.forEach(d => {
    const data = d.data();
    (data.content || []).forEach(item => {
      if (item.resourceId) referencedIds.add(item.resourceId);
    });
  });
  console.log('Referenced IDs:', [...referencedIds]);
  
  const contentSnap = await db.collection('content_library').get();
  const existingIds = new Set();
  contentSnap.docs.forEach(d => existingIds.add(d.id));
  
  const orphaned = [...referencedIds].filter(id => !existingIds.has(id));
  console.log('Orphaned:', orphaned);

  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
