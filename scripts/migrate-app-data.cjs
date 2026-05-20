#!/usr/bin/env node
/**
 * Application Data Migration Script
 * 
 * PURPOSE: Migrate application/system data between Firebase environments
 *          WITHOUT migrating user data.
 * 
 * USAGE:
 *   1. Export from source: node scripts/migrate-app-data.js export dev
 *   2. Import to target:   node scripts/migrate-app-data.js import test
 * 
 * This script handles:
 *   ✅ development_plan_v1 (26-week master plan)
 *   ✅ daily_plan_v1 (Day-by-Day Daily Plan)
 *   ✅ system_lovs (Lists of Values)
 *   ✅ content_readings (Reading library)
 *   ✅ content_videos (Video library)
 *   ✅ content_courses (Course catalog)
 *   ✅ content_coaching (Coaching scenarios)
 *   ✅ metadata/* (App config)
 *   ✅ config/* (Feature flags)
 *   ✅ global/* (Global metadata)
 * 
 * This script EXCLUDES:
 *   ❌ users/{userId}/* (User profiles)
 *   ❌ modules/{userId}/* (User progress)
 *   ❌ content_community (User-generated posts)
 *   ❌ artifacts/* (User artifacts)
 *   ❌ invitations/* (User invitations)
 *   ❌ cohorts/* (Contains user references - facilitator, memberIds)
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Collections that contain APPLICATION data (should migrate)
const APP_DATA_COLLECTIONS = [
  'development_plan_v1',
  'daily_plan_v1',           // Day-by-Day Daily Plan (includes prep phase)
  'daily_plan_v2',           // Three-Phase Content (foundation-content, ascent-content)
  'system_lovs',
  'content_readings',
  'content_videos',
  'content_courses',
  'content_coaching',
  'community_sessions',      // Community Hub Sessions
  'community_session_types', // Community Hub Session Types
  'coaching_sessions',       // Coaching Live Sessions
  'coaching_session_types',  // Coaching Session Types
  'daily_reps_library',      // Daily Reps Library
  'media_assets',            // Media Vault
  'content_documents',       // Document Wrappers
  'content',                 // Unified Content Library (Legacy/Migration)
  'content_library',         // Unified Content Library (Canonical)
  'unified-content',         // Unified Content (Admin CMS)
  'content-groups',          // Content Groups (Session/Week groupings)
  'skills',                  // Skills Taxonomy
  'video_series',            // Video Series (multi-video playlists)
  // NOTE: 'cohorts' removed - contains user data (facilitator, memberIds)
  'metadata',
  'config',
  'global'
];

// Collections that contain USER data (should NOT migrate)
const USER_DATA_COLLECTIONS = [
  'users',
  'modules',
  'artifacts',
  'content_community',  // User-generated content
  'invitations',        // User invitations
  'cohorts'             // Contains user refs (facilitator, memberIds)
];

// Firebase project configurations
const FIREBASE_PROJECTS = {
  dev: {
    projectId: 'leaderreps-pd-platform',
    serviceAccountPath: './leaderreps-pd-platform-firebase-adminsdk.json'
  },
  test: {
    projectId: 'leaderreps-test',
    serviceAccountPath: './leaderreps-test-firebase-adminsdk.json'
  },
  prod: {
    projectId: 'leaderreps-prod',
    serviceAccountPath: './leaderreps-prod-firebase-adminsdk.json'
  }
};

const EXPORT_DIR = './data-exports';

class AppDataMigration {
  constructor(environment) {
    this.environment = environment;
    this.config = FIREBASE_PROJECTS[environment];
    if (!this.config) {
      throw new Error(`Unknown environment: ${environment}. Use: dev, test, or prod`);
    }
    this.db = null;
    this.exportData = {};
  }

  async initialize() {
    console.log(`\n🔥 Initializing Firebase for ${this.environment.toUpperCase()}...`);
    
    // Check for service account file
    if (fs.existsSync(this.config.serviceAccountPath)) {
      const serviceAccount = require(path.resolve(this.config.serviceAccountPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: this.config.projectId
      });
    } else {
      // Try application default credentials
      console.log(`   Service account not found, using default credentials...`);
      admin.initializeApp({
        projectId: this.config.projectId
      });
    }
    
    this.db = admin.firestore();
    console.log(`✅ Connected to ${this.config.projectId}\n`);
  }

  async exportCollection(collectionName) {
    console.log(`📤 Exporting ${collectionName}...`);
    const collectionRef = this.db.collection(collectionName);
    const snapshot = await collectionRef.get();
    
    const data = {};
    let count = 0;
    
    for (const doc of snapshot.docs) {
      data[doc.id] = this.serializeDoc(doc.data());
      count++;
      
      // Also export subcollections if they exist
      const subcollections = await doc.ref.listCollections();
      if (subcollections.length > 0) {
        data[doc.id]._subcollections = {};
        for (const subcol of subcollections) {
          const subSnapshot = await subcol.get();
          data[doc.id]._subcollections[subcol.id] = {};
          subSnapshot.docs.forEach(subDoc => {
            data[doc.id]._subcollections[subcol.id][subDoc.id] = this.serializeDoc(subDoc.data());
          });
        }
      }
    }
    
    console.log(`   ✅ ${count} documents`);
    return data;
  }

  serializeDoc(data) {
    // Convert Firestore Timestamps to ISO strings
    const serialized = {};
    for (const [key, value] of Object.entries(data)) {
      if (value && value._seconds !== undefined) {
        // Firestore Timestamp
        serialized[key] = {
          _type: 'timestamp',
          _value: new Date(value._seconds * 1000).toISOString()
        };
      } else if (value && typeof value.toDate === 'function') {
        // Firestore Timestamp (alternative format)
        serialized[key] = {
          _type: 'timestamp',
          _value: value.toDate().toISOString()
        };
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        serialized[key] = this.serializeDoc(value);
      } else if (Array.isArray(value)) {
        serialized[key] = value.map(item => 
          typeof item === 'object' ? this.serializeDoc(item) : item
        );
      } else {
        serialized[key] = value;
      }
    }
    return serialized;
  }

  deserializeDoc(data) {
    // Convert serialized timestamps back to Firestore Timestamps
    const deserialized = {};
    for (const [key, value] of Object.entries(data)) {
      if (key === '_subcollections') continue; // Handle separately
      
      if (value && value._type === 'timestamp') {
        deserialized[key] = admin.firestore.Timestamp.fromDate(new Date(value._value));
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        deserialized[key] = this.deserializeDoc(value);
      } else if (Array.isArray(value)) {
        deserialized[key] = value.map(item =>
          typeof item === 'object' && item !== null ? this.deserializeDoc(item) : item
        );
      } else {
        deserialized[key] = value;
      }
    }
    return deserialized;
  }

  async export() {
    console.log('═'.repeat(60));
    console.log(`📦 EXPORTING Application Data from ${this.environment.toUpperCase()}`);
    console.log('═'.repeat(60));

    this.exportData = {
      _metadata: {
        exportedAt: new Date().toISOString(),
        sourceEnvironment: this.environment,
        sourceProject: this.config.projectId,
        collections: APP_DATA_COLLECTIONS
      }
    };

    for (const collection of APP_DATA_COLLECTIONS) {
      try {
        this.exportData[collection] = await this.exportCollection(collection);
      } catch (error) {
        console.log(`   ⚠️  Error exporting ${collection}: ${error.message}`);
        this.exportData[collection] = {};
      }
    }

    // Ensure export directory exists
    if (!fs.existsSync(EXPORT_DIR)) {
      fs.mkdirSync(EXPORT_DIR, { recursive: true });
    }

    const filename = `app-data-${this.environment}-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(EXPORT_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.exportData, null, 2));
    
    console.log('\n' + '═'.repeat(60));
    console.log(`✅ Export Complete!`);
    console.log(`📁 Saved to: ${filepath}`);
    console.log('═'.repeat(60));
    
    // Summary
    console.log('\n📊 Export Summary:');
    for (const [key, value] of Object.entries(this.exportData)) {
      if (key !== '_metadata') {
        const count = Object.keys(value).length;
        console.log(`   ${key}: ${count} documents`);
      }
    }
    
    return filepath;
  }

  async import(filepath) {
    console.log('═'.repeat(60));
    console.log(`📥 IMPORTING Application Data to ${this.environment.toUpperCase()}`);
    console.log('═'.repeat(60));

    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filepath}`);
    }

    const importData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    
    console.log(`\n📄 Source: ${importData._metadata?.sourceEnvironment || 'unknown'}`);
    console.log(`📅 Exported: ${importData._metadata?.exportedAt || 'unknown'}`);
    console.log(`📁 File: ${filepath}\n`);

    // Confirm before importing
    console.log('⚠️  This will OVERWRITE existing data in the following collections:');
    APP_DATA_COLLECTIONS.forEach(c => console.log(`   - ${c}`));
    console.log('\n');

    for (const collection of APP_DATA_COLLECTIONS) {
      const data = importData[collection];
      if (!data || Object.keys(data).length === 0) {
        console.log(`⏭️  Skipping ${collection} (no data)`);
        continue;
      }

      console.log(`📥 Importing ${collection}...`);
      let count = 0;

      for (const [docId, docData] of Object.entries(data)) {
        const { _subcollections, ...mainData } = docData;
        
        // Import main document
        const deserializedData = this.deserializeDoc(mainData);
        await this.db.collection(collection).doc(docId).set(deserializedData);
        count++;

        // Import subcollections
        if (_subcollections) {
          for (const [subcolName, subcolData] of Object.entries(_subcollections)) {
            for (const [subDocId, subDocData] of Object.entries(subcolData)) {
              const deserializedSubData = this.deserializeDoc(subDocData);
              await this.db
                .collection(collection)
                .doc(docId)
                .collection(subcolName)
                .doc(subDocId)
                .set(deserializedSubData);
            }
          }
        }
      }

      console.log(`   ✅ ${count} documents imported`);
    }

    console.log('\n' + '═'.repeat(60));
    console.log(`✅ Import Complete!`);
    console.log(`🌐 Target: ${this.config.projectId}`);
    console.log('═'.repeat(60));
  }

  async listExports() {
    console.log('\n📂 Available Export Files:\n');
    
    if (!fs.existsSync(EXPORT_DIR)) {
      console.log('   No exports found. Run export first.');
      return;
    }

    const files = fs.readdirSync(EXPORT_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.log('   No exports found. Run export first.');
      return;
    }

    files.forEach((file, index) => {
      const filepath = path.join(EXPORT_DIR, file);
      const stats = fs.statSync(filepath);
      const size = (stats.size / 1024).toFixed(1);
      console.log(`   ${index + 1}. ${file} (${size} KB)`);
    });
  }
}

// CLI Handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const environment = args[1];
  const filepath = args[2];

  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       LeaderReps Application Data Migration Tool           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  if (!command) {
    console.log(`
Usage:
  node scripts/migrate-app-data.js <command> [environment] [filepath]

Commands:
  export <env>           Export app data from environment
  import <env> <file>    Import app data to environment
  list                   List available export files

Environments:
  dev                    Development (leaderreps-pd-platform)
  test                   Test (leaderreps-test)
  prod                   Production (coming soon)

Examples:
  node scripts/migrate-app-data.js export dev
  node scripts/migrate-app-data.js import test ./data-exports/app-data-dev-2024-12-03.json
  node scripts/migrate-app-data.js list

Data Migrated:
  ✅ development_plan_v1  - 26-week master plan
  ✅ daily_plan_v1        - Day-by-Day Daily Plan
  ✅ system_lovs          - Lists of Values (dropdowns)
  ✅ content_readings     - Reading library
  ✅ content_videos       - Video library
  ✅ content_courses      - Course catalog
  ✅ content_coaching     - Coaching scenarios
  ✅ metadata/*           - App configuration
  ✅ config/*             - Feature flags
  ✅ global/*             - Global metadata

Data NOT Migrated (user-specific):
  ❌ users/*              - User profiles
  ❌ modules/*            - User progress
  ❌ content_community    - User-generated posts
  ❌ artifacts/*          - User artifacts
  ❌ invitations/*        - User invitations
  ❌ cohorts/*            - Contains user refs (facilitator, memberIds)
`);
    return;
  }

  if (command === 'list') {
    const migration = new AppDataMigration('dev');
    await migration.listExports();
    return;
  }

  if (!environment) {
    console.error('❌ Error: Environment required (dev, test, or prod)');
    return;
  }

  try {
    const migration = new AppDataMigration(environment);
    await migration.initialize();

    switch (command) {
      case 'export':
        await migration.export();
        break;
      
      case 'import':
        if (!filepath) {
          console.error('❌ Error: File path required for import');
          console.log('   Run "node scripts/migrate-app-data.js list" to see available exports');
          return;
        }
        await migration.import(filepath);
        break;
      
      default:
        console.error(`❌ Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main().then(() => process.exit(0)).catch(console.error);
