#!/usr/bin/env node
/**
 * Seed carryover items for a user who missed the prep phase
 * Usage: node scripts/debug/seed-carryover.cjs <email> [--env=dev|test|prod]
 */

const admin = require('firebase-admin');
const path = require('path');

// Parse args
const args = process.argv.slice(2);
const email = args.find(a => !a.startsWith('--'));
const envArg = args.find(a => a.startsWith('--env='))?.split('=')[1] || 'dev';

if (!email) {
  console.log('Usage: node scripts/debug/seed-carryover.cjs <email> [--env=dev|test|prod]');
  process.exit(1);
}

// Get service account based on env
const serviceAccountPaths = {
  dev: 'leaderreps-pd-platform-firebase-adminsdk.json',
  test: 'leaderreps-test-firebase-adminsdk.json',
  prod: 'leaderreps-prod-firebase-adminsdk.json'
};

const saPath = path.resolve(__dirname, '../../', serviceAccountPaths[envArg]);
const serviceAccount = require(saPath);

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

(async () => {
  console.log(`\n🔧 Seeding carryover for ${email} in ${envArg.toUpperCase()}\n`);
  
  // Find user by email
  const usersSnap = await db.collection('users').where('email', '==', email).get();
  if (usersSnap.empty) {
    console.log('❌ User not found');
    process.exit(1);
  }
  const userDoc = usersSnap.docs[0];
  const uid = userDoc.id;
  console.log('Found user:', uid);
  
  // Check if carryover already exists
  const existingCarryover = await db.doc(`users/${uid}/action_progress/_carryover`).get();
  if (existingCarryover.exists) {
    const data = existingCarryover.data();
    console.log('\n⚠️  Carryover already exists with', data.items?.length || 0, 'items');
    console.log('   currentLevel:', data.currentLevel);
    console.log('\nItems:');
    (data.items || []).forEach(item => {
      const status = item.completedAt ? '✓' : '○';
      console.log(`   ${status} ${item.label}`);
    });
    
    console.log('\nTo overwrite, delete the existing doc first:');
    console.log(`   firebase firestore:delete users/${uid}/action_progress/_carryover --project=${envArg === 'prod' ? 'leaderreps-prod' : envArg === 'test' ? 'leaderreps-test' : 'leaderreps-pd-platform'}`);
    process.exit(0);
  }
  
  // Get the onboarding-config actions from daily_plan_v1
  const onboardingDoc = await db.doc('daily_plan_v1/onboarding-config').get();
  if (!onboardingDoc.exists) {
    console.log('❌ No onboarding-config found in daily_plan_v1!');
    process.exit(1);
  }
  
  const onboardingData = onboardingDoc.data();
  console.log('Found onboarding-config with', onboardingData.actions?.length || 0, 'actions');
  
  // Build carryover items from onboarding actions
  const carryoverItems = (onboardingData.actions || [])
    .filter(a => a.enabled !== false)
    .map(a => ({
      id: a.id,
      label: a.label || 'Preparation Item',
      category: 'Onboarding',
      prepSection: 'onboarding',
      type: a.type || 'content',
      handlerType: a.handlerType || null,
      isInteractive: ['leader-profile', 'baseline-assessment', 'notification-setup', 'foundation-commitment', 'conditioning-tutorial'].includes(a.handlerType),
      estimatedMinutes: a.estimatedMinutes || null,
      resourceId: a.resourceId || null,
      resourceType: a.resourceType || null,
      addedAt: new Date(),
      completedAt: null
    }));
  
  console.log('\nItems to seed:');
  carryoverItems.forEach(item => console.log(' -', item.label));
  
  // Create the carryover doc
  await db.doc(`users/${uid}/action_progress/_carryover`).set({
    items: carryoverItems,
    currentLevel: 1,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    initializedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('\n✅ Seeded carryover with', carryoverItems.length, 'items for Level 1');
  console.log('   User should now see these items in their Level 1 view');
  
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
