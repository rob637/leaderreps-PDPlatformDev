#!/usr/bin/env node
/**
 * Set CORS Configuration on Firebase Storage Buckets
 * 
 * Run this after setting up a new environment or if videos/files aren't loading.
 * 
 * Usage: node scripts/set-storage-cors.cjs <environment>
 *        node scripts/set-storage-cors.cjs test
 *        node scripts/set-storage-cors.cjs prod
 *        node scripts/set-storage-cors.cjs all
 */

const { Storage } = require('@google-cloud/storage');
const path = require('path');

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

// CORS configuration that allows cross-origin video/file access
const CORS_CONFIG = [
  {
    origin: ['*'],
    method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    responseHeader: [
      'Content-Type',
      'Access-Control-Allow-Origin',
      'Authorization',
      'Content-Length',
      'User-Agent',
      'x-goog-resumable',
      'Range',
      'Accept-Ranges',
      'Content-Range'
    ],
    maxAgeSeconds: 3600
  }
];

async function setCorsForEnv(env) {
  const config = FIREBASE_PROJECTS[env];
  if (!config) {
    console.error(`Unknown environment: ${env}`);
    return false;
  }

  const saPath = path.resolve(__dirname, '..', config.serviceAccountPath);
  let credentials;
  try {
    credentials = require(saPath);
  } catch {
    console.error(`❌ Service account not found: ${saPath}`);
    return false;
  }

  const storage = new Storage({
    projectId: config.projectId,
    credentials
  });

  const bucket = storage.bucket(config.bucket);

  try {
    await bucket.setCorsConfiguration(CORS_CONFIG);
    console.log(`✅ CORS set on ${config.bucket}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to set CORS on ${config.bucket}: ${err.message}`);
    return false;
  }
}

async function main() {
  const env = process.argv[2];

  if (!env) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║       LeaderReps Storage CORS Configuration                ║
╚════════════════════════════════════════════════════════════╝

Usage: node scripts/set-storage-cors.cjs <environment>

This sets CORS configuration on Firebase Storage buckets to allow
cross-origin video/file loading in the browser.

Environments:
  dev   - leaderreps-pd-platform.firebasestorage.app
  test  - leaderreps-test.firebasestorage.app
  prod  - leaderreps-prod.firebasestorage.app
  all   - Configure all environments

Example:
  node scripts/set-storage-cors.cjs test
  node scripts/set-storage-cors.cjs all
`);
    process.exit(1);
  }

  console.log('═'.repeat(60));
  console.log('📦 Setting Storage CORS Configuration');
  console.log('═'.repeat(60));
  console.log();

  if (env === 'all') {
    for (const e of ['dev', 'test', 'prod']) {
      await setCorsForEnv(e);
    }
  } else {
    await setCorsForEnv(env);
  }

  console.log();
  console.log('Done!');
  process.exit(0);
}

main();
