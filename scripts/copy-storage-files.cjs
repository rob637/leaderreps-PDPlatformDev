#!/usr/bin/env node
/**
 * Copy Storage Files Between Environments
 * 
 * ⚠️  DEPRECATED — DO NOT USE for content syncs.
 * 
 * All environments should read media from prod storage directly.
 * Content URLs in Firestore point to prod storage and include signed URLs
 * or download tokens that are only valid for the prod bucket.
 * 
 * This script is kept for one-off operations only.
 * 
 * Usage: node scripts/copy-storage-files.cjs <source> <target> [--force]
 */

const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');
const os = require('os');

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

// Folders to copy
const FOLDERS_TO_COPY = ['vault', 'public'];

class StorageCopier {
  constructor(sourceEnv, targetEnv, { force = false } = {}) {
    this.sourceConfig = FIREBASE_PROJECTS[sourceEnv];
    this.targetConfig = FIREBASE_PROJECTS[targetEnv];
    
    if (!this.sourceConfig) throw new Error(`Unknown source: ${sourceEnv}`);
    if (!this.targetConfig) throw new Error(`Unknown target: ${targetEnv}`);
    
    this.sourceEnv = sourceEnv;
    this.targetEnv = targetEnv;
    this.force = force;
    this.stats = { copied: 0, skipped: 0, failed: 0 };
  }

  async initialize() {
    console.log('\n🔥 Initializing storage clients...');
    
    // Initialize source storage
    const sourceSA = require(path.resolve(this.sourceConfig.serviceAccountPath));
    this.sourceStorage = new Storage({
      projectId: this.sourceConfig.projectId,
      credentials: sourceSA
    });
    this.sourceBucket = this.sourceStorage.bucket(this.sourceConfig.bucket);
    console.log(`   Source: ${this.sourceConfig.bucket}`);
    
    // Initialize target storage
    const targetSA = require(path.resolve(this.targetConfig.serviceAccountPath));
    this.targetStorage = new Storage({
      projectId: this.targetConfig.projectId,
      credentials: targetSA
    });
    this.targetBucket = this.targetStorage.bucket(this.targetConfig.bucket);
    console.log(`   Target: ${this.targetConfig.bucket}`);
    
    console.log('✅ Storage clients initialized\n');
  }

  async copyFile(filePath) {
    const tempPath = path.join(os.tmpdir(), path.basename(filePath));
    
    try {
      const sourceFile = this.sourceBucket.file(filePath);
      
      // Get source metadata (content type + download token)
      const [sourceMetadata] = await sourceFile.getMetadata();
      
      // Download from source
      await sourceFile.download({ destination: tempPath });
      
      // Upload to target, preserving content type and download token
      const uploadMetadata = {
        contentType: sourceMetadata.contentType,
        cacheControl: 'public, max-age=31536000',
      };
      
      // Preserve the Firebase download token so existing URLs work
      if (sourceMetadata.metadata && sourceMetadata.metadata.firebaseStorageDownloadTokens) {
        uploadMetadata.metadata = {
          firebaseStorageDownloadTokens: sourceMetadata.metadata.firebaseStorageDownloadTokens,
        };
      }
      
      await this.targetBucket.upload(tempPath, {
        destination: filePath,
        metadata: uploadMetadata,
      });
      
      // Cleanup temp file
      fs.unlinkSync(tempPath);
      
      this.stats.copied++;
      return true;
    } catch (error) {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      throw error;
    }
  }

  async copyFolder(folder) {
    console.log(`📁 Copying /${folder}/...`);
    
    try {
      const [files] = await this.sourceBucket.getFiles({ prefix: `${folder}/` });
      
      if (files.length === 0) {
        console.log(`   ⏭️  No files in /${folder}/`);
        return;
      }
      
      console.log(`   Found ${files.length} files`);
      
      for (const file of files) {
        const filePath = file.name;
        const fileName = path.basename(filePath);
        
        try {
          // Check if file already exists in target (skip unless --force)
          if (!this.force) {
            const [exists] = await this.targetBucket.file(filePath).exists();
            
            if (exists) {
              console.log(`   ⏭️  ${fileName} (exists, use --force to overwrite)`);
              this.stats.skipped++;
              continue;
            }
          }
          
          await this.copyFile(filePath);
          console.log(`   ✅ ${fileName}`);
        } catch (error) {
          console.log(`   ❌ ${fileName}: ${error.message}`);
          this.stats.failed++;
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Error listing ${folder}: ${error.message}`);
    }
  }

  async run() {
    console.log('═'.repeat(60));
    console.log(`📦 COPYING Storage Files: ${this.sourceEnv.toUpperCase()} → ${this.targetEnv.toUpperCase()}`);
    console.log('═'.repeat(60));

    for (const folder of FOLDERS_TO_COPY) {
      await this.copyFolder(folder);
    }

    console.log('\n' + '═'.repeat(60));
    console.log('✅ Storage Copy Complete!');
    console.log(`   Files copied:  ${this.stats.copied}`);
    console.log(`   Files skipped: ${this.stats.skipped} (already exist)`);
    console.log(`   Files failed:  ${this.stats.failed}`);
    console.log('═'.repeat(60));
    console.log('\nNext step: Run URL rewriter to update Firestore references:');
    console.log(`  node scripts/rewrite-storage-urls.cjs ${this.targetEnv}`);
  }
}

async function main() {
  const sourceEnv = process.argv[2];
  const targetEnv = process.argv[3];
  
  if (!sourceEnv || !targetEnv) {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║       LeaderReps Storage File Copier                       ║
╚════════════════════════════════════════════════════════════╝

Usage: node scripts/copy-storage-files.cjs <source> <target>

Copies video/document files from one Firebase Storage bucket to another.

Examples:
  node scripts/copy-storage-files.cjs dev test
  node scripts/copy-storage-files.cjs dev prod

This copies:
  - /vault/ (videos, protected documents)
  - /public/ (public assets)
`);
    process.exit(1);
  }
  
  if (sourceEnv === targetEnv) {
    console.error('❌ Source and target cannot be the same');
    process.exit(1);
  }

  const copier = new StorageCopier(sourceEnv, targetEnv, { force: process.argv.includes('--force') });
  await copier.initialize();
  await copier.run();
  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
