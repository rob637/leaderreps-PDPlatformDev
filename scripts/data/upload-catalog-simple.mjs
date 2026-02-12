// Simple script to upload reading catalog using Firebase Admin with default credentials
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize with project ID
initializeApp({
  projectId: 'leaderreps-2024'
});

const db = getFirestore();

async function uploadCatalog() {
  try {
    // Read the catalog
    const catalogData = JSON.parse(readFileSync('./pre_generated_book_catalog.json', 'utf8'));
    
    const totalBooks = Object.values(catalogData).reduce((sum, arr) => sum + arr.length, 0);
    
    console.log('📚 Uploading reading catalog...');
    console.log(`   Total books: ${totalBooks}`);
    console.log(`   Categories: ${Object.keys(catalogData).join(', ')}`);
    
    // Upload to Firestore
    await db.collection('metadata').doc('reading_catalog').set({
      items: catalogData,
      lastUpdated: new Date().toISOString(),
      version: '1.0',
      totalBooks: totalBooks
    });
    
    console.log('✅ Successfully uploaded reading catalog to Firestore!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

uploadCatalog();
