#!/usr/bin/env node
/**
 * Rewrite Storage URLs in Firestore
 * 
 * After copying files between storage buckets, this script updates
 * all Firestore documents to use the correct bucket URL for the target environment.
 * 
 * Usage: node scripts/rewrite-storage-urls.cjs <environment>
 *        npm run data:rewrite-urls test
 *        npm run data:rewrite-urls prod
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const FIREBASE_PROJECTS = {
  dev: {
    projectId: 'leaderreps-pd-platform',
    bucket: 'leaderreps-pd-platform.firebasestorage.app',
    serviceAccountPath: './leaderreps-pd-platform-firebase-adminsdk.json'
  },
  test: {
    projectId: 'leaderreps-test',
    bucket: 'leaderreps-test.firebasestorage.app',
    serviceAccountPath: './leaderreps-test-firebase-adminsdk.json'
  },
  prod: {
    projectId: 'leaderreps-prod',
    bucket: 'leaderreps-prod.firebasestorage.app',
    serviceAccountPath: './leaderreps-prod-firebase-adminsdk.json'
  }
};

// Collections that may contain storage URLs
const COLLECTIONS_WITH_URLS = [
  'media_assets',
  'video_series',
  'content',
  'content_library',
  'content_documents',
  'daily_reps_library'
];

// All possible source bucket patterns to replace
const SOURCE_BUCKETS = [
  'leaderreps-pd-platform.firebasestorage.app',
  'leaderreps-test.firebasestorage.app',
  'leaderreps-prod.firebasestorage.app'
];

class UrlRewriter {
  constructor(environment) {
    this.environment = environment;
    this.config = FIREBASE_PROJECTS[environment];
    if (!this.config) {
      throw new Error(`Unknown environment: ${environment}. Use: dev, test, or prod`);
    }
    this.targetBucket = this.config.bucket;
    this.db = null;
    this.stats = { checked: 0, updated: 0 };
  }

  async initialize() {
    console.log(`\n🔥 Initializing Firebase for ${this.environment.toUpperCase()}...`);
    
    if (fs.existsSync(this.config.serviceAccountPath)) {
      const serviceAccount = require(path.resolve(this.config.serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: this.config.projectId
      });
    } else {
      throw new Error(`Service account not found: ${this.config.serviceAccountPath}`);
    }
    
    this.db = admin.firestore();
    console.log(`✅ Connected to ${this.config.projectId}\n`);
  }

  rewriteUrl(url) {
    if (!url || typeof url !== 'string') return url;
    
    // Check if URL contains a storage bucket that needs rewriting
    for (const sourceBucket of SOURCE_BUCKETS) {
      if (url.includes(sourceBucket) && sourceBucket !== this.targetBucket) {
        return url.replace(sourceBucket, this.targetBucket);
      }
    }
    return url;
  }

  rewriteObject(obj) {
    if (!obj || typeof obj !== 'object') return { obj, changed: false };
    
    let changed = false;
    const result = Array.isArray(obj) ? [] : {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && value.includes('storage.googleapis.com')) {
        const newValue = this.rewriteUrl(value);
        if (newValue !== value) {
          changed = true;
          result[key] = newValue;
        } else {
          result[key] = value;
        }
      } else if (value && typeof value === 'object') {
        const nested = this.rewriteObject(value);
        result[key] = nested.obj;
        if (nested.changed) changed = true;
      } else {
        result[key] = value;
      }
    }
    
    return { obj: result, changed };
  }

  async processCollection(collectionName) {
    console.log(`📝 Processing ${collectionName}...`);
    
    const snapshot = await this.db.collection(collectionName).get();
    let collectionUpdates = 0;
    
    const batch = this.db.batch();
    let batchCount = 0;
    
    for (const doc of snapshot.docs) {
      this.stats.checked++;
      const data = doc.data();
      const { obj: rewritten, changed } = this.rewriteObject(data);
      
      if (changed) {
        batch.set(doc.ref, rewritten);
        batchCount++;
        collectionUpdates++;
        this.stats.updated++;
        
        // Commit every 400 docs (Firestore limit is 500)
        if (batchCount >= 400) {
          await batch.commit();
          batchCount = 0;
        }
      }
    }
    
    // Commit remaining
    if (batchCount > 0) {
      await batch.commit();
    }
    
    if (collectionUpdates > 0) {
      console.log(`   ✅ Updated ${collectionUpdates} documents`);
    } else {
      console.log(`   ⏭️  No URL updates needed`);
    }
  }

  async run() {
    console.log('═'.repeat(60));
    console.log(`📝 REWRITING Storage URLs for ${this.environment.toUpperCase()}`);
    console.log('═'.repeat(60));
    console.log(`\nTarget bucket: ${this.targetBucket}\n`);

    for (const collection of COLLECTIONS_WITH_URLS) {
      try {
        await this.processCollection(collection);
      } catch (error) {
        console.log(`   ⚠️  Error: ${error.message}`);
      }
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ URL Rewrite Complete!');
    console.log(`   Documents checked: ${this.stats.checked}`);
    console.log(`   Documents updated: ${this.stats.updated}`);
    console.log('═'.repeat(60));
  }
}

async function main() {
  const env = process.argv[2];
  
  if (!env) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║       LeaderReps Storage URL Rewriter                      ║
╚════════════════════════════════════════════════════════════╝

Usage: node scripts/rewrite-storage-urls.cjs <environment>

This rewrites all storage URLs in Firestore to use the correct
bucket for the target environment.

Examples:
  node scripts/rewrite-storage-urls.cjs test
  node scripts/rewrite-storage-urls.cjs prod

NOTE: Run this AFTER copying storage files with sync-storage.sh
`);
    process.exit(1);
  }

  const rewriter = new UrlRewriter(env);
  await rewriter.initialize();
  await rewriter.run();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
