const admin = require('firebase-admin');

const INTERACTIVE_ITEMS = [
  {
    id: 'interactive-leader-profile',
    title: 'Complete Your Leader Profile',
    description: 'Tell us about yourself to personalize your leadership journey.',
    type: 'INTERACTIVE',
    handlerType: 'leader-profile',
    estimatedTime: 5,
    status: 'PUBLISHED'
  },
  {
    id: 'interactive-baseline-assessment',
    title: 'Take Leadership Skills Baseline',
    description: 'Assess your current leadership skills to track your growth.',
    type: 'INTERACTIVE', 
    handlerType: 'baseline-assessment',
    estimatedTime: 8,
    status: 'PUBLISHED'
  }
];

async function seedEnv(name, serviceAccountPath, projectId) {
  if (admin.apps.length) {
    await Promise.all(admin.apps.map(app => app.delete()));
  }
  
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId });
  const db = admin.firestore();
  
  console.log(`\n=== ${name} ===`);
  for (const item of INTERACTIVE_ITEMS) {
    const docRef = db.collection('content_library').doc(item.id);
    const existing = await docRef.get();
    if (existing.exists) {
      // Update estimatedTime if different
      const data = existing.data();
      console.log(`  ${item.id}: exists (estimatedTime=${data.estimatedTime})`);
    } else {
      await docRef.set({ ...item, updatedAt: new Date() });
      console.log(`  ${item.id}: CREATED`);
    }
  }
}

async function run() {
  console.log('=== CHECKING/SEEDING INTERACTIVE CONTENT ===');
  
  await seedEnv('DEV', '/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json', 'leaderreps-pd-platform');
  await seedEnv('TEST', '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json', 'leaderreps-test');
  await seedEnv('PROD', '/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'leaderreps-prod');
  
  console.log('\nDone!');
  process.exit(0);
}
run();
