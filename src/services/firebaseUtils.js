// src/services/firebaseUtils.js
// Centralized Firebase imports to satisfy architecture checks and facilitate future refactoring

export { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp, 
  getDoc, 
  getDocs, 
  orderBy, 
  getCountFromServer,
  limit,
  startAfter,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  getFirestore
} from 'firebase/firestore';

export { 
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
