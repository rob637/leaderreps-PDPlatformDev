
import admin from 'firebase-admin';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.dev' });

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function fixFeatures() {
  try {
    console.log('Fetching config/features...');
    const docRef = db.collection('config').doc('features');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.error('config/features document not found!');
      return;
    }

    const currentFeatures = docSnap.data();
    const updates = {};

    // 1. Fix 'this-weeks-actions' for Dashboard
    if (!currentFeatures['this-weeks-actions'] || !currentFeatures['this-weeks-actions'].enabled) {
      console.log('Enabling this-weeks-actions...');
      updates['this-weeks-actions'] = {
        enabled: true,
        group: 'dashboard',
        name: "This Week's Actions",
        description: "Checklist of this week's content and tasks",
        order: 8 // Approximate order
      };
    }

    // 2. Fix Development Plan widgets
    const devPlanWidgets = [
      { id: 'dev-plan-header', name: 'DP Header', order: 1 },
      { id: 'dev-plan-stats', name: 'DP Stats', order: 2 },
      { id: 'dev-plan-actions', name: 'DP Actions', order: 3 },
      { id: 'dev-plan-focus-areas', name: 'DP Focus Areas', order: 4 },
      { id: 'dev-plan-goal', name: 'DP Goal', order: 5 },
      { id: 'development-plan', name: 'DP Weekly Plan', order: 6 }
    ];

    for (const widget of devPlanWidgets) {
      if (!currentFeatures[widget.id] || !currentFeatures[widget.id].enabled) {
        console.log(`Enabling ${widget.id}...`);
        updates[widget.id] = {
          ...(currentFeatures[widget.id] || {}),
          enabled: true,
          group: 'development-plan',
          name: widget.name,
          order: widget.order
        };
      }
    }

    if (Object.keys(updates).length > 0) {
      console.log('Applying updates:', JSON.stringify(updates, null, 2));
      await docRef.update(updates);
      console.log('Successfully updated config/features');
    } else {
      console.log('No updates needed.');
    }

  } catch (error) {
    console.error('Error fixing features:', error);
  }
}

fixFeatures();
