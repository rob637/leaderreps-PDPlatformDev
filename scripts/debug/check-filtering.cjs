const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkFiltering() {
  const type = 'VIDEO';
  console.log(`Checking filtering for type: ${type}`);

  // Query 1: Items with primary type match
  const typeSnapshot = await db.collection('content_library')
    .where('type', '==', type)
    .where('status', '==', 'PUBLISHED')
    .get();

  const rawTypeItems = typeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  console.log(`Found ${rawTypeItems.length} items with type=${type}`);

  // Filter out items that have explicitly opted out of this library via visibility settings
  const typeItems = rawTypeItems.filter(item => {
    if (item.title && item.title.includes('QuickStart')) {
      console.log(`[DEBUG] Item: ${item.title}`);
      console.log(`[DEBUG] Visibility: ${JSON.stringify(item.visibility)}`);
      console.log(`[DEBUG] Is Array? ${Array.isArray(item.visibility)}`);
      if (item.visibility && Array.isArray(item.visibility)) {
        const includes = item.visibility.includes(type);
        console.log(`[DEBUG] Includes ${type}? ${includes}`);
        return includes;
      }
      console.log(`[DEBUG] Visibility not defined or not array. Keeping.`);
      return true;
    }
    
    if (item.visibility && Array.isArray(item.visibility)) {
      return item.visibility.includes(type);
    }
    return true;
  });

  console.log(`After filtering: ${typeItems.length} items`);
  
  const quickStartItems = typeItems.filter(item => item.title && item.title.includes('QuickStart'));
  console.log(`QuickStart items remaining: ${quickStartItems.length}`);
  quickStartItems.forEach(item => console.log(`- ${item.title}`));
}

checkFiltering();
