
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Fallback if env vars are missing (common in some dev containers if not explicitly loaded)
if (!firebaseConfig.projectId) {
    console.log("Env vars missing, trying to load from .env.local or similar if possible, or just failing gracefully.");
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = {
  READINGS: 'content_readings',
  DOCUMENTS: 'content_documents',
  VIDEOS: 'content_videos',
  COURSES: 'content_courses',
  COMMUNITY: 'content_community',
  COACHING: 'content_coaching'
};

async function checkCounts() {
  console.log('Checking collection counts...');
  
  for (const [key, colName] of Object.entries(COLLECTIONS)) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`${key} (${colName}): ${snapshot.size} documents`);
      
      if (snapshot.size > 0 && key === 'DOCUMENTS') {
          console.log('Sample Document:', snapshot.docs[0].data());
      }
    } catch (error) {
      console.error(`Error checking ${key}:`, error.message);
    }
  }
}

checkCounts();
