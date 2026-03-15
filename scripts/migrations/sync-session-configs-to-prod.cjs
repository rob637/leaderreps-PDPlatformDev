#!/usr/bin/env node
/**
 * Migration: Sync session prep configs from Dev to Prod
 * 
 * Copies session2-config through session5-config from Dev's daily_plan_v1
 * to Prod's daily_plan_v1, preserving all action items, content URLs, etc.
 * 
 * Usage:
 *   node scripts/migrations/sync-session-configs-to-prod.cjs
 *   node scripts/migrations/sync-session-configs-to-prod.cjs --dry-run
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

// Initialize Prod app
const prodCred = require(path.resolve(__dirname, '../../leaderreps-prod-firebase-adminsdk.json'));
const prodApp = admin.initializeApp({
  credential: admin.credential.cert(prodCred),
  projectId: 'leaderreps-prod'
}, 'prod');
const prodDb = prodApp.firestore();

const SESSION_CONFIG_IDS = [
  'session2-config',
  'session3-config',
  'session4-config',
  'session5-config'
];

async function sync() {
  console.log(`\n🔄 Syncing session prep configs from Dev → PROD`);
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

    // Check Prod
    const prodDoc = await prodDb.collection('daily_plan_v1').doc(docId).get();
    if (prodDoc.exists) {
      const prodData = prodDoc.data();
      const prodActions = prodData.actions || [];
      console.log(`   Prod currently has ${prodActions.length} actions`);
    } else {
      console.log(`   Prod: document does not exist`);
    }

    if (!isDryRun) {
      const cleanData = { ...devData };
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      
      await prodDb.collection('daily_plan_v1').doc(docId).set({
        ...cleanData,
        syncedFromDev: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      console.log(`   ✅ Synced to Prod\n`);
    } else {
      console.log(`   [DRY RUN] Would sync to Prod\n`);
    }
  }

  console.log('✅ Done!');
  process.exit(0);
}

sync().catch(err => { console.error('❌ Failed:', err); process.exit(1); });
