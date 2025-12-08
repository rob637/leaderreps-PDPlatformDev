
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

async function fixDevPlanFeatures() {
  try {
    console.log('Fetching config/features...');
    const docRef = db.collection('config').doc('features');
    
    const updates = {
      'dev-plan-tracker': {
        enabled: true,
        group: 'development-plan',
        name: 'Plan Tracker',
        description: 'Main Plan Tracker',
        order: 10
      },
      'dev-plan-timeline': {
        enabled: true,
        group: 'development-plan',
        name: 'Plan Timeline',
        description: 'Visual timeline',
        order: 11
      },
      'dev-plan-details': {
        enabled: true,
        group: 'development-plan',
        name: 'Plan Details',
        description: 'Detailed view',
        order: 12
      }
    };

    console.log('Applying updates:', JSON.stringify(updates, null, 2));
    await docRef.update(updates);
    console.log('Successfully updated config/features');

  } catch (error) {
    console.error('Error fixing features:', error);
  }
}

fixDevPlanFeatures();
