
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAdminConfig() {
  const docRef = doc(db, 'metadata', 'config');
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    console.log('Current Admin Config:', docSnap.data());
  } else {
    console.log('No admin config found. Creating one...');
    await setDoc(docRef, {
      adminemails: ['rob@sagecg.com', 'ryan@leaderreps.com', 'admin@leaderreps.com']
    });
    console.log('Created default admin config.');
  }
}

checkAdminConfig();
