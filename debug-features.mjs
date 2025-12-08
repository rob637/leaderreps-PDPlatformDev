import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.dev' });

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function debugFeatures() {
  try {
    const docRef = db.collection('config').doc('features');
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data();
      const keysToCheck = [
        'this-weeks-actions',
        'dev-plan-header',
        'dev-plan-stats',
        'dev-plan-actions',
        'dev-plan-focus-areas',
        'dev-plan-goal',
        'development-plan'
      ];

      console.log('Checking specific keys:');
      keysToCheck.forEach(key => {
        console.log(`${key}:`, data[key] ? (data[key].enabled ? 'ENABLED' : 'DISABLED') : 'MISSING');
      });
      
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error getting document:', error);
  }
}

debugFeatures();
