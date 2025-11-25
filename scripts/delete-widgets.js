// Script to delete specific widgets from Firestore
// Run with: node scripts/delete-widgets.js

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, deleteField } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyALTLnU7J4txA8cdVsP0iv1IhC8GicUtIs",
  authDomain: "leaderreps-pd-platform.firebaseapp.com",
  projectId: "leaderreps-pd-platform",
  storageBucket: "leaderreps-pd-platform.firebasestorage.app",
  messagingSenderId: "851890032842",
  appId: "1:851890032842:web:de39b60a8ccfc9e6f63628",
  measurementId: "G-K3X9KWHJ86"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const WIDGETS_TO_DELETE = [
  'dev-plan-header-v2',
  'dev-plan-actions-v3',
  'scorecard-v2',
  'daily-quote-v2',
  'notifications-v2'
];

async function deleteWidgets() {
  const featureDocRef = doc(db, 'config', 'features');
  
  const deleteFields = {};
  WIDGETS_TO_DELETE.forEach(id => {
    deleteFields[id] = deleteField();
  });
  
  try {
    await updateDoc(featureDocRef, deleteFields);
    console.log('✅ Successfully deleted widgets:', WIDGETS_TO_DELETE);
  } catch (error) {
    console.error('❌ Error deleting widgets:', error);
  }
  
  process.exit(0);
}

deleteWidgets();
