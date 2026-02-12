
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Manually load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const firstEquals = line.indexOf('=');
    if (firstEquals > -1) {
      const key = line.substring(0, firstEquals).trim();
      const value = line.substring(firstEquals + 1).trim();
      process.env[key] = value;
    }
  });
}

let firebaseConfig;
if (process.env.VITE_FIREBASE_CONFIG) {
  try {
    firebaseConfig = JSON.parse(process.env.VITE_FIREBASE_CONFIG);
  } catch (e) {
    console.error("Error parsing VITE_FIREBASE_CONFIG:", e);
  }
}

if (!firebaseConfig) {
  firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  };
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkUserStructure() {
  try {
    const q = query(collection(db, 'users'), limit(5));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        console.log("No users found.");
        return;
    }

    querySnapshot.forEach((doc) => {
      console.log(`User ID: ${doc.id}`);
      console.log("Data:", JSON.stringify(doc.data(), null, 2));
      console.log("-----------------------------------");
    });
  } catch (error) {
    console.error("Error fetching users:", error);
  }
}

checkUserStructure();
