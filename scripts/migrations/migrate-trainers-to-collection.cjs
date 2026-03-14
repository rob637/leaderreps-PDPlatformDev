#!/usr/bin/env node
/**
 * Migration: Extract trainers from cohorts into the facilitators collection
 * 
 * Background:
 * - Previously, trainers were stored embedded directly in cohorts (cohort.facilitator or cohort.facilitators)
 * - The new system expects trainers in a separate 'facilitators' collection
 * - This script extracts unique trainers from all cohorts and adds them to the facilitators collection
 * 
 * Usage:
 *   node scripts/migrations/migrate-trainers-to-collection.cjs [env]
 * 
 * Where env is: dev (default), test, or prod
 */

const admin = require('firebase-admin');
const path = require('path');

const ENV_CONFIG = {
  dev: {
    serviceAccountPath: './leaderreps-pd-platform-firebase-adminsdk.json',
    projectId: 'leaderreps-pd-platform'
  },
  test: {
    serviceAccountPath: './leaderreps-test-firebase-adminsdk.json',
    projectId: 'leaderreps-test'
  },
  prod: {
    serviceAccountPath: './leaderreps-prod-firebase-adminsdk.json',
    projectId: 'leaderreps-prod'
  }
};

async function migrateTrainers(env = 'dev') {
  const config = ENV_CONFIG[env];
  if (!config) {
    console.error(`Unknown environment: ${env}`);
    console.log('Valid environments: dev, test, prod');
    process.exit(1);
  }

  console.log(`\n=== Migrating Trainers to facilitators collection ===`);
  console.log(`Environment: ${env.toUpperCase()}`);
  console.log(`Project: ${config.projectId}\n`);

  // Initialize Firebase Admin
  const app = admin.initializeApp({
    credential: admin.credential.cert(require(path.resolve(config.serviceAccountPath))),
    projectId: config.projectId
  });

  const db = app.firestore();

  try {
    // 1. Check existing facilitators collection
    const existingFacilitators = await db.collection('facilitators').get();
    console.log(`Existing facilitators in collection: ${existingFacilitators.size}`);
    
    const existingEmails = new Set();
    existingFacilitators.forEach(doc => {
      const email = doc.data().email?.toLowerCase().trim();
      if (email) existingEmails.add(email);
    });
    
    // 2. Get all cohorts
    const cohortsSnap = await db.collection('cohorts').get();
    console.log(`Found ${cohortsSnap.size} cohorts to scan\n`);

    // 3. Extract unique trainers from cohorts
    const trainersMap = new Map(); // email -> trainer data

    cohortsSnap.forEach(doc => {
      const cohort = doc.data();
      const cohortName = cohort.name || doc.id;

      // Extract from new format (facilitators array)
      if (cohort.facilitators && Array.isArray(cohort.facilitators)) {
        cohort.facilitators.forEach(f => {
          if (f.email) {
            const email = f.email.toLowerCase().trim();
            if (!trainersMap.has(email)) {
              trainersMap.set(email, {
                email: f.email,
                displayName: f.name || f.displayName || 'Unknown',
                title: f.title || 'Leadership Trainer',
                bio: f.bio || '',
                photoUrl: f.photoUrl || '',
                phone: f.phone || '',
                linkedIn: f.linkedIn || '',
                source: cohortName
              });
              console.log(`  Found trainer: ${f.name || f.email} (from ${cohortName})`);
            }
          }
        });
      }

      // Extract from legacy format (single facilitator)
      if (cohort.facilitator && cohort.facilitator.email) {
        const f = cohort.facilitator;
        const email = f.email.toLowerCase().trim();
        if (!trainersMap.has(email)) {
          trainersMap.set(email, {
            email: f.email,
            displayName: f.name || f.displayName || 'Unknown',
            title: f.title || 'Leadership Trainer',
            bio: f.bio || '',
            photoUrl: f.photoUrl || '',
            phone: f.phone || '',
            linkedIn: f.linkedIn || '',
            source: cohortName
          });
          console.log(`  Found trainer: ${f.name || f.email} (legacy format from ${cohortName})`);
        }
      }
    });

    console.log(`\nTotal unique trainers found in cohorts: ${trainersMap.size}`);
    
    // 4. Filter out trainers that already exist in collection
    const newTrainers = [];
    for (const [email, trainer] of trainersMap.entries()) {
      if (!existingEmails.has(email)) {
        newTrainers.push(trainer);
      } else {
        console.log(`  Skipping ${trainer.displayName} - already exists in collection`);
      }
    }

    console.log(`New trainers to add: ${newTrainers.length}\n`);

    if (newTrainers.length === 0) {
      console.log('No new trainers to migrate.');
      process.exit(0);
    }

    // 5. Add new trainers to facilitators collection
    console.log('Adding trainers to facilitators collection...\n');
    
    for (const trainer of newTrainers) {
      const docData = {
        email: trainer.email,
        displayName: trainer.displayName,
        title: trainer.title,
        bio: trainer.bio,
        photoUrl: trainer.photoUrl,
        phone: trainer.phone,
        linkedIn: trainer.linkedIn,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        migratedFrom: 'cohort',
        migrationDate: new Date().toISOString()
      };

      const docRef = await db.collection('facilitators').add(docData);
      console.log(`  ✓ Added: ${trainer.displayName} (${trainer.email}) → ${docRef.id}`);
    }

    console.log(`\n✅ Migration complete! Added ${newTrainers.length} trainers to facilitators collection.`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run migration
const env = process.argv[2] || 'dev';
migrateTrainers(env);
