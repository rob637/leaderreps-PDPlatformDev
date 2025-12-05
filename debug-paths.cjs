
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Assuming this exists or I can use default creds

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (e) {
    console.log("Could not init with default creds, trying no-arg init (for emulator or environment vars)");
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function checkPath(path) {
  console.log(`Checking path: ${path}`);
  const segments = path.split('/');
  
  if (segments.length % 2 === 0) {
    // Document
    const docRef = db.doc(path);
    const doc = await docRef.get();
    console.log(`  Type: Document`);
    console.log(`  Exists: ${doc.exists}`);
    if (doc.exists) {
        // Check for subcollections
        const collections = await docRef.listCollections();
        console.log(`  Subcollections: ${collections.map(c => c.id).join(', ')}`);
    }
  } else {
    // Collection
    const colRef = db.collection(path);
    const snapshot = await colRef.limit(1).get();
    console.log(`  Type: Collection`);
    console.log(`  Empty: ${snapshot.empty}`);
  }
}

async function run() {
  try {
    await checkPath('metadata/config');
    await checkPath('metadata/config/catalog/rep_library');
    await checkPath('metadata/reading_catalog');
    await checkPath('system_lovs/system_quotes');
    
    // Check if 'metadata' is a collection
    await checkPath('metadata');
    
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
