#!/usr/bin/env node
/**
 * Migration: Fix Milestone 2 Coaching Session Types
 * 
 * Adds coachingSessionTypes: ['open_gym'] to milestone-2 so the
 * "Schedule an Open Gym Session" action appears during Level 2.
 * This was missing because fix-milestone-2-rep-links.cjs only updated actions.
 * 
 * Usage:
 *   node scripts/migrations/fix-milestone-2-coaching-types.cjs --env=dev
 *   node scripts/migrations/fix-milestone-2-coaching-types.cjs --env=test
 */

const admin = require('firebase-admin');

const args = process.argv.slice(2);
const envArg = args.find(a => a.startsWith('--env='));
const env = envArg ? envArg.split('=')[1] : 'dev';

if (!['dev', 'test', 'prod'].includes(env)) {
  console.error('Invalid environment. Use --env=dev, --env=test, or --env=prod');
  process.exit(1);
}

const envConfig = {
  dev: { projectId: 'leaderreps-pd-platform', credFile: 'leaderreps-pd-platform-firebase-adminsdk.json' },
  test: { projectId: 'leaderreps-test', credFile: 'leaderreps-test-firebase-adminsdk.json' },
  prod: { projectId: 'leaderreps-prod', credFile: 'leaderreps-prod-firebase-adminsdk.json' }
};

const config = envConfig[env];
const serviceAccount = require(`../../${config.credFile}`);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount), projectId: config.projectId });
const db = admin.firestore();

async function migrate() {
  console.log(`\n🔄 Adding coachingSessionTypes to milestone-2 in ${env.toUpperCase()}...\n`);

  const ref = db.collection('daily_plan_v1').doc('milestone-2');
  const doc = await ref.get();

  if (!doc.exists) {
    console.error('❌ milestone-2 document not found');
    process.exit(1);
  }

  const current = doc.data().coachingSessionTypes || [];
  console.log(`   Current coachingSessionTypes: ${JSON.stringify(current)}`);

  if (current.includes('open_gym')) {
    console.log('✅ Already has open_gym — no changes needed');
    process.exit(0);
  }

  await ref.update({
    coachingSessionTypes: ['open_gym'],
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log('✅ Set coachingSessionTypes: ["open_gym"] on milestone-2');
  process.exit(0);
}

migrate().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
