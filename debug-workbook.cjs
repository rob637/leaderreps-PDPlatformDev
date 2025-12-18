const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(sa)
  });
}

const db = admin.firestore();

async function findWorkbook() {
  console.log('Searching for "Workbook" in content/resources...');
  
  const collections = ['content', 'resources', 'content_library'];
  
  for (const colName of collections) {
    try {
      const snapshot = await db.collection(colName).get();
      snapshot.forEach(doc => {
        const data = doc.data();
        const title = data.title || data.label || '';
        if (title.toLowerCase().includes('workbook')) {
          console.log(`Found in ${colName} [${doc.id}]:`, title);
          console.log('URL:', data.url);
        }
      });
    } catch (e) {
      console.log(`Error accessing ${colName}:`, e.message);
    }
  }
}

findWorkbook();
