#!/bin/bash
# Script to upload reading catalog to Firestore
# Run this after you've authenticated with Firebase

echo "📚 Uploading Reading Catalog to Firestore..."
echo ""
echo "This will upload 22 books across 4 categories:"
echo "  - Innovation & Change"
echo "  - People & Culture" 
echo "  - Self-Awareness & Growth"
echo "  - Strategy & Execution"
echo ""

# Check if logged in
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Firebase. Please run: firebase login"
    exit 1
fi

echo "✅ Firebase authenticated"
echo ""
echo "Creating upload script..."

# Create a temporary Node script that uses the Firebase CLI authentication
cat > /tmp/upload-catalog-temp.mjs << 'EOF'
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';

// Initialize with project ID (uses Firebase CLI credentials)
initializeApp({
  projectId: 'leaderreps-2024'
});

const db = getFirestore();

async function uploadCatalog() {
  try {
    const catalogData = JSON.parse(readFileSync('./pre_generated_book_catalog.json', 'utf8'));
    const totalBooks = Object.values(catalogData).reduce((sum, arr) => sum + arr.length, 0);
    
    console.log('📤 Uploading to Firestore: metadata/reading_catalog');
    
    await db.collection('metadata').doc('reading_catalog').set({
      items: catalogData,
      lastUpdated: new Date().toISOString(),
      version: '1.0',
      totalBooks: totalBooks
    });
    
    console.log('✅ Success! Uploaded', totalBooks, 'books');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

uploadCatalog();
EOF

# Run with Firebase authentication
GOOGLE_APPLICATION_CREDENTIALS="$HOME/.config/firebase/$(firebase use 2>&1 | grep -o 'leaderreps-[^)]*')*serviceAccountKey.json" \
node /tmp/upload-catalog-temp.mjs

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Reading catalog successfully uploaded!"
    echo ""
    echo "The books should now appear in the Reading & Reps section of your app."
else
    echo ""
    echo "⚠️  Upload failed. You may need to manually upload the data."
    echo ""
    echo "Manual upload instructions:"
    echo "1. Go to Firebase Console: https://console.firebase.google.com/project/leaderreps-2024/firestore"
    echo "2. Navigate to: metadata → reading_catalog"
    echo "3. Copy the contents of: reading-catalog-firestore.json"
    echo "4. Paste into the Firestore document"
fi

# Cleanup
rm /tmp/upload-catalog-temp.mjs 2>/dev/null
