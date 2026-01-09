#!/usr/bin/env node
/**
 * Test User Cleanup Script
 * 
 * PURPOSE: Remove ONLY dummy/test users (those with "test" in their name/email)
 * 
 * USAGE:
 *   1. DRY RUN (preview): node scripts/cleanup-test-users.cjs dev --dry-run
 *   2. EXECUTE:          node scripts/cleanup-test-users.cjs dev --execute
 * 
 * This script will ONLY delete documents where email, name, or displayName
 * contains "test" (case-insensitive).
 * 
 * WARNING: This is a destructive operation. Always run --dry-run first!
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Firebase project configurations
const FIREBASE_PROJECTS = {
  dev: {
    projectId: 'leaderreps-pd-platform',
    serviceAccountPath: './leaderreps-pd-platform-firebase-adminsdk.json'
  },
  test: {
    projectId: 'leaderreps-test',
    serviceAccountPath: './leaderreps-test-firebase-adminsdk.json'
  }
};

// Check if a document is a "test" user based on email, name, or displayName
function isTestUser(data, docId) {
  const fieldsToCheck = [
    data.email,
    data.name,
    data.displayName,
    docId
  ].filter(Boolean); // Remove undefined/null values
  
  return fieldsToCheck.some(field => 
    field.toLowerCase().includes('test')
  );
}

class TestCleanup {
  constructor(environment, dryRun = true) {
    this.environment = environment;
    this.config = FIREBASE_PROJECTS[environment];
    if (!this.config) {
      throw new Error(`Unknown environment: ${environment}. Use: dev or test`);
    }
    this.dryRun = dryRun;
    this.db = null;
    this.deletedCounts = {};
    this.skippedCounts = {};
  }

  async initialize() {
    console.log(`\n🔥 Connecting to ${this.environment.toUpperCase()} environment...`);
    
    if (!fs.existsSync(this.config.serviceAccountPath)) {
      throw new Error(`Service account not found: ${this.config.serviceAccountPath}`);
    }
    
    const serviceAccount = require(path.resolve(this.config.serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: this.config.projectId
    });
    
    this.db = admin.firestore();
    console.log(`✅ Connected to ${this.config.projectId}\n`);
  }

  async cleanupUsers() {
    console.log(`\n📦 Processing users collection...`);
    
    const collectionRef = this.db.collection('users');
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log(`   ⏭️  Collection empty, skipping`);
      return { deleted: 0, skipped: 0 };
    }

    const toDelete = [];
    const toKeep = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (isTestUser(data, doc.id)) {
        toDelete.push({ id: doc.id, data });
      } else {
        toKeep.push({ id: doc.id, data });
      }
    });

    console.log(`   Found ${snapshot.docs.length} total documents`);
    console.log(`   🗑️  TO DELETE (test users): ${toDelete.length}`);
    console.log(`   ✅ TO KEEP (real users): ${toKeep.length}`);
    
    // Show what will be deleted
    if (toDelete.length > 0) {
      console.log('\n   Documents to DELETE:');
      toDelete.forEach(({ id, data }) => {
        const identifier = data.email || data.displayName || data.name || id;
        console.log(`     ❌ ${identifier}`);
      });
    }
    
    // Show what will be kept
    if (toKeep.length > 0) {
      console.log('\n   Documents to KEEP:');
      toKeep.forEach(({ id, data }) => {
        const identifier = data.email || data.displayName || data.name || id;
        console.log(`     ✅ ${identifier}`);
      });
    }

    if (this.dryRun) {
      console.log(`\n   🔍 DRY RUN: Would delete ${toDelete.length} test users`);
      return { deleted: toDelete.length, skipped: toKeep.length };
    }

    // Actually delete
    let deletedCount = 0;
    for (const { id } of toDelete) {
      try {
        // Delete subcollections first
        const docRef = this.db.collection('users').doc(id);
        const subcollections = await docRef.listCollections();
        for (const subcol of subcollections) {
          const subDocs = await subcol.get();
          const batch = this.db.batch();
          subDocs.docs.forEach(subDoc => batch.delete(subDoc.ref));
          if (subDocs.docs.length > 0) await batch.commit();
        }
        // Delete main document
        await docRef.delete();
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Error deleting ${id}: ${error.message}`);
      }
    }

    console.log(`   ✅ Deleted ${deletedCount} test users`);
    return { deleted: deletedCount, skipped: toKeep.length };
  }

  async cleanupModules() {
    console.log(`\n📦 Processing modules collection...`);
    console.log(`   (Modules are keyed by user ID - will delete modules for test user IDs)`);
    
    // First get the list of test user IDs from the users collection
    const usersSnapshot = await this.db.collection('users').get();
    const testUserIds = new Set();
    
    usersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (isTestUser(data, doc.id)) {
        testUserIds.add(doc.id);
      }
    });
    
    console.log(`   Found ${testUserIds.size} test user IDs to check in modules`);
    
    const modulesRef = this.db.collection('modules');
    const modulesSnapshot = await modulesRef.get();
    
    if (modulesSnapshot.empty) {
      console.log(`   ⏭️  Collection empty, skipping`);
      return { deleted: 0, skipped: 0 };
    }

    const toDelete = [];
    const toKeep = [];
    
    modulesSnapshot.docs.forEach(doc => {
      if (testUserIds.has(doc.id)) {
        toDelete.push(doc.id);
      } else {
        toKeep.push(doc.id);
      }
    });

    console.log(`   🗑️  TO DELETE: ${toDelete.length} module docs`);
    console.log(`   ✅ TO KEEP: ${toKeep.length} module docs`);

    if (toDelete.length > 0) {
      console.log('\n   Module docs to DELETE:');
      toDelete.forEach(id => console.log(`     ❌ ${id}`));
    }

    if (this.dryRun) {
      console.log(`\n   🔍 DRY RUN: Would delete ${toDelete.length} module docs`);
      return { deleted: toDelete.length, skipped: toKeep.length };
    }

    // Actually delete
    let deletedCount = 0;
    for (const id of toDelete) {
      try {
        const docRef = modulesRef.doc(id);
        // Delete subcollections
        const subcollections = await docRef.listCollections();
        for (const subcol of subcollections) {
          const subDocs = await subcol.get();
          const batch = this.db.batch();
          subDocs.docs.forEach(subDoc => batch.delete(subDoc.ref));
          if (subDocs.docs.length > 0) await batch.commit();
        }
        await docRef.delete();
        deletedCount++;
      } catch (error) {
        console.error(`   ❌ Error deleting modules/${id}: ${error.message}`);
      }
    }

    console.log(`   ✅ Deleted ${deletedCount} module docs`);
    return { deleted: deletedCount, skipped: toKeep.length };
  }

  async cleanupInvitations() {
    console.log(`\n📦 Processing invitations collection...`);
    
    const collectionRef = this.db.collection('invitations');
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log(`   ⏭️  Collection empty, skipping`);
      return { deleted: 0, skipped: 0 };
    }

    const toDelete = [];
    const toKeep = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      // Check email field for invitations
      const email = data.email || '';
      if (email.toLowerCase().includes('test')) {
        toDelete.push({ id: doc.id, data });
      } else {
        toKeep.push({ id: doc.id, data });
      }
    });

    console.log(`   Found ${snapshot.docs.length} total invitations`);
    console.log(`   🗑️  TO DELETE: ${toDelete.length}`);
    console.log(`   ✅ TO KEEP: ${toKeep.length}`);

    if (toDelete.length > 0) {
      console.log('\n   Invitations to DELETE:');
      toDelete.forEach(({ data }) => {
        console.log(`     ❌ ${data.email || 'unknown'}`);
      });
    }

    if (this.dryRun) {
      console.log(`\n   🔍 DRY RUN: Would delete ${toDelete.length} invitations`);
      return { deleted: toDelete.length, skipped: toKeep.length };
    }

    // Actually delete
    let deletedCount = 0;
    const batch = this.db.batch();
    for (const { id } of toDelete) {
      batch.delete(collectionRef.doc(id));
      deletedCount++;
    }
    if (deletedCount > 0) await batch.commit();

    console.log(`   ✅ Deleted ${deletedCount} invitations`);
    return { deleted: deletedCount, skipped: toKeep.length };
  }

  async cleanupCohorts() {
    console.log(`\n📦 Processing cohorts collection...`);
    console.log(`   ⚠️  Cohorts will NOT be deleted - they are shared infrastructure.`);
    console.log(`   ℹ️  Cohort membership is stored in user documents (cohortId field).`);
    console.log(`   ℹ️  When test users are deleted, their cohort associations go with them.`);
    return { deleted: 0, skipped: 0, note: 'Preserved' };
  }

  async run() {
    console.log('═'.repeat(60));
    console.log(`🧹 TEST USER CLEANUP - ${this.environment.toUpperCase()} (${this.config.projectId})`);
    console.log(`   Deleting users with "test" in name/email`);
    console.log(`   Mode: ${this.dryRun ? '🔍 DRY RUN (no changes)' : '⚠️  EXECUTE (will delete!)'}`);
    console.log('═'.repeat(60));

    const results = {};

    try {
      results.users = await this.cleanupUsers();
    } catch (error) {
      console.error(`   ❌ Error processing users: ${error.message}`);
      results.users = { error: error.message };
    }

    try {
      results.modules = await this.cleanupModules();
    } catch (error) {
      console.error(`   ❌ Error processing modules: ${error.message}`);
      results.modules = { error: error.message };
    }

    try {
      results.invitations = await this.cleanupInvitations();
    } catch (error) {
      console.error(`   ❌ Error processing invitations: ${error.message}`);
      results.invitations = { error: error.message };
    }

    try {
      results.cohorts = await this.cleanupCohorts();
    } catch (error) {
      console.error(`   ❌ Error processing cohorts: ${error.message}`);
      results.cohorts = { error: error.message };
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('═'.repeat(60));
    
    let totalDeleted = 0;
    let totalKept = 0;
    
    for (const [collection, result] of Object.entries(results)) {
      if (result.error) {
        console.log(`   ${collection}: ERROR - ${result.error}`);
      } else if (result.note) {
        console.log(`   ${collection}: ${result.note}`);
      } else {
        const action = this.dryRun ? 'would delete' : 'deleted';
        console.log(`   ${collection}: ${action} ${result.deleted}, kept ${result.skipped}`);
        totalDeleted += result.deleted;
        totalKept += result.skipped;
      }
    }
    
    console.log(`\n   Total: ${totalDeleted} to delete, ${totalKept} to keep`);
    
    if (this.dryRun) {
      console.log('\n⚠️  This was a DRY RUN. No data was deleted.');
      console.log('   Run with --execute to perform the actual cleanup.');
    } else {
      console.log('\n✅ Cleanup complete!');
    }
    
    console.log('═'.repeat(60));
  }
}

// CLI Handler
async function main() {
  const args = process.argv.slice(2);
  
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Test User Cleanup Script (deletes "test" users)      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const environment = args[0];
  const hasExecute = args.includes('--execute');
  const hasDryRun = args.includes('--dry-run');

  if (!environment || !['dev', 'test'].includes(environment) || (!hasExecute && !hasDryRun)) {
    console.log(`
Usage:
  node scripts/cleanup-test-users.cjs <env> --dry-run    Preview what will be deleted
  node scripts/cleanup-test-users.cjs <env> --execute    Actually delete the data

Environments:
  dev     DEV environment (leaderreps-pd-platform)
  test    TEST environment (leaderreps-test)

Examples:
  node scripts/cleanup-test-users.cjs dev --dry-run
  node scripts/cleanup-test-users.cjs dev --execute

This script removes ONLY users with "test" in their email, name, or displayName.
Real users are preserved.

What gets deleted:
  - users where email/name/displayName contains "test" (case-insensitive)
  - modules for those test users
  - invitations to test email addresses

What is PRESERVED:
  - All users without "test" in their identifier
  - All cohorts (shared infrastructure)
  - All app data

⚠️  WARNING: --execute is a DESTRUCTIVE operation!
    Always run --dry-run first to preview changes.
`);
    return;
  }

  const dryRun = hasDryRun;
  
  if (!dryRun) {
    console.log(`\n⚠️  WARNING: You are about to DELETE test users from ${environment.toUpperCase()}!`);
    console.log('   Press Ctrl+C within 5 seconds to abort...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  try {
    const cleanup = new TestCleanup(environment, dryRun);
    await cleanup.initialize();
    await cleanup.run();
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main().then(() => process.exit(0)).catch(console.error);
