const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (uses default credentials)
if (!admin.apps.length) {
  const serviceAccount = require('../../leaderreps-pd-platform-firebase-adminsdk.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = getFirestore();

const INTERACTIVE_ITEMS = [
  {
    id: 'interactive-notification-setup',
    title: 'Setup Notifications',
    description: 'Configure your notification preferences to ensure you never miss a beat.',
    type: 'INTERACTIVE',
    handlerType: 'notification-setup',
    metadata: {
      category: 'Onboarding',
      estimatedTime: '2 min'
    },
    searchTokens: ['setup', 'notifications', 'preferences', 'alert']
  },
  {
    id: 'interactive-conditioning-tutorial',
    title: 'Conditioning App Tutorial',
    description: 'Learn how to use the Conditioning App (Real Reps) to build your leadership habits.',
    type: 'INTERACTIVE',
    handlerType: 'conditioning-tutorial',
    metadata: {
      category: 'Onboarding',
      estimatedTime: '5 min'
    },
    searchTokens: ['conditioning', 'tutorial', 'real', 'reps', 'app']
  },
  // Re-seeding existing ones to ensure consistency
  {
    id: 'interactive-leader-profile',
    title: 'Complete Your Leader Profile',
    description: 'Tell us about yourself to personalize your leadership journey.',
    type: 'INTERACTIVE',
    handlerType: 'leader-profile',
    metadata: {
        category: 'Onboarding',
        estimatedTime: '5 min'
    },
    searchTokens: ['leader', 'profile', 'complete', 'personalize']
  },
  {
    id: 'interactive-baseline-assessment',
    title: 'Take Baseline Assessment',
    description: 'Assess your current leadership skills to track your growth.',
    type: 'INTERACTIVE',
    handlerType: 'baseline-assessment',
    metadata: {
        category: 'Assessment',
        estimatedTime: '10 min'
    },
    searchTokens: ['baseline', 'assessment', 'skills', 'track']
  }
];

async function seedInteractiveItems() {
  console.log('🌱 Seeding interactive content items to "content_library"...');
  
  // Clean up incorrect location (unified-content) just in case
  const wrongRef = db.collection('unified-content');
  for (const item of INTERACTIVE_ITEMS) {
    try {
      await wrongRef.doc(item.id).delete();
    } catch (e) {
      // Ignore
    }
  }

  // Seed to correct location (content_library)
  const unifiedRef = db.collection('content_library');

  for (const item of INTERACTIVE_ITEMS) {
    try {
      await unifiedRef.doc(item.id).set({
        ...item,
        status: 'PUBLISHED', // Ensure it's published for visibility
        updatedAt: new Date()
      }, { merge: true });
      console.log(`✅ Seeded: ${item.title} (${item.id})`);
    } catch (error) {
      console.error(`❌ Error seeding ${item.title}:`, error);
    }
  }

  console.log('✨ Interactive content seeding complete!');
}

seedInteractiveItems().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
