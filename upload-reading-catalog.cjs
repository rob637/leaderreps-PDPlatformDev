// upload-reading-catalog.js
// Uploads the pre_generated_book_catalog.json to Firestore at metadata/reading_catalog

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account-key.json';

try {
  const serviceAccount = require(path.resolve(KEY_PATH));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  console.log('✅ Firebase Admin initialized');
} catch (e) {
  console.error(`❌ Cannot read service account JSON at ${KEY_PATH}:`, e.message);
  process.exit(1);
}

const db = admin.firestore();

// Read the catalog file
const catalogPath = './pre_generated_book_catalog.json';
let catalogData;

try {
  const raw = fs.readFileSync(catalogPath, 'utf8');
  catalogData = JSON.parse(raw);
  console.log('✅ Loaded catalog with categories:', Object.keys(catalogData));
} catch (e) {
  console.error(`❌ Cannot read ${catalogPath}:`, e.message);
  process.exit(1);
}

// Upload to Firestore
async function uploadCatalog() {
  try {
    const docRef = db.collection('metadata').doc('reading_catalog');
    
    await docRef.set({
      items: catalogData,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      version: '1.0',
      totalBooks: Object.values(catalogData).reduce((sum, arr) => sum + arr.length, 0)
    });
    
    console.log('✅ Successfully uploaded reading catalog to Firestore!');
    console.log(`📚 Total books: ${Object.values(catalogData).reduce((sum, arr) => sum + arr.length, 0)}`);
    console.log('📂 Categories:', Object.keys(catalogData).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error uploading catalog:', error);
    process.exit(1);
  }
}

uploadCatalog();
