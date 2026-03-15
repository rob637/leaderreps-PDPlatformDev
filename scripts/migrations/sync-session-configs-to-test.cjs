#!/usr/bin/env node
/**
 * Migration: Sync session prep configs from Dev to Test
 * 
 * Copies session2-config through session5-config from Dev's daily_plan_v1
 * to Test's daily_plan_v1, preserving all action items, content URLs, etc.
 * 
 * Usage:
 *   node scripts/migrations/sync-session-configs-to-test.cjs
 *   node scripts/migrations/sync-session-configs-to-test.cjs --dry-run
 */

const admin = require('firebase-admin');
const path = require('path');

const isDryRun = process.argv.includes('--dry-run');

// Initialize Dev app
const devCred = require(path.resolve(__dirname, '../../leaderreps-pd-platform-firebase-adminsdk.json'));
const devApp = admin.initializeApp({
  credential: admin.credential.cert(devCred),
  projectId: 'leaderreps-pd-platform'
}, 'dev');
const devDb = devApp.firestore();

// Initialize Test app
const testCred = require(path.resolve(__dirname, '../../leaderreps-test-firebase-adminsdk.json'));
const testApp = admin.initializeApp({
  credential: admin.credential.cert(testCred),
  projectId: 'leaderreps-test'
}, 'test');
const testDb = testApp.firestore();

const SESSION_CONFIG_IDS = [
  'session2-config',
  'session3-config',
  'session4-config',
  'session5-config'
];

async function sync() {
  console.log(`\n🔄 Syncing session prep configs from Dev → Test`);
  console.log(`   Dry Run: ${isDryRun ? 'YES' : 'NO'}\n`);

  for (const docId of SESSION_CONFIG_IDS) {
    const devDoc = await devDb.collection('daily_plan_v1').doc(docId).get();
    
    if (!devDoc.exists) {
      console.log(`⚠️  ${docId} not found on Dev — skipping`);
      continue;
    }

    const devData = devDoc.data();
    const actions = devData.actions || [];
    console.log(`📋 ${docId} (Dev): ${actions.length} actions`);
    actions.forEach((a, i) => {
      console.log(`   ${i + 1}. [${a.handlerType || a.type}] ${a.label}${a.estimatedMinutes ? ` (${a.estimatedMinutes}m)` : ''}`);
    });

    // Check Test
    const testDoc = await testDb.collection('daily_plan_v1').doc(docId).get();
    if (testDoc.exists) {
      const testData = testDoc.data();
      const testActions = testData.actions || [];
      console.log(`   Test currently has ${testActions.length} actions`);
    } else {
      console.log(`   Test: document does not exist`);
    }

    if (!isDryRun) {
      // Remove Firestore Timestamps (they can't be copied directly)
      const cleanData = { ...devData };
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      
      await testDb.collection('daily_plan_v1').doc(docId).set({
        ...cleanData,
        syncedFromDev: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`   ✅ Synced to Test\n`);
    } else {
      console.log(`   [DRY RUN] Would sync to Test\n`);
    }
  }

  console.log('✅ Done!');
  process.exit(0);
}

sync().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
