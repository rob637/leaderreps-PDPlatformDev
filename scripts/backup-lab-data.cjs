#!/usr/bin/env node
/**
 * Leadership Lab — Data Backup Script
 *
 * Exports all ll-users docs + subcollections (leadershipProfile, conversations,
 * evidence, reveals, reflections, challenges) to a timestamped JSON file.
 *
 * USAGE:
 *   node scripts/backup-lab-data.cjs              # Backs up dev environment
 *   node scripts/backup-lab-data.cjs test          # Backs up test environment
 *   node scripts/backup-lab-data.cjs prod          # Backs up prod environment
 *
 * OUTPUT: data-exports/lab-backup-{env}-{date}.json
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const env = process.argv[2] || 'dev';

const SERVICE_ACCOUNT_FILES = {
  dev: 'leaderreps-pd-platform-firebase-adminsdk.json',
  test: 'leaderreps-test-firebase-adminsdk.json',
  prod: 'leaderreps-prod-firebase-adminsdk.json',
};

const saFile = SERVICE_ACCOUNT_FILES[env];
if (!saFile) {
  console.error(`Unknown environment: ${env}. Use: dev, test, or prod`);
  process.exit(1);
}

const saPath = path.join(__dirname, '..', saFile);
if (!fs.existsSync(saPath)) {
  console.error(`Service account file not found: ${saPath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const LL_PREFIX = 'll-';

const SUBCOLLECTIONS = [
  'leadershipProfile',
  'conversations',
  'evidence',
  'reveals',
  'reflections',
  'challenges',
];

function serializeDoc(doc) {
  const data = doc.data();
  // Convert Firestore Timestamps to ISO strings for JSON serialization
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val.toDate === 'function') {
      data[key] = val.toDate().toISOString();
    }
  }
  return data;
}

async function backupLabData() {
  console.log(`\n🔒 Leadership Lab Backup — ${env.toUpperCase()} environment`);
  console.log(`${'─'.repeat(50)}`);

  const usersSnap = await db.collection(`${LL_PREFIX}users`).get();
  console.log(`Found ${usersSnap.size} Lab users`);

  const backup = {
    metadata: {
      env,
      exportedAt: new Date().toISOString(),
      userCount: usersSnap.size,
    },
    users: {},
  };

  let totalDocs = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = serializeDoc(userDoc);
    // Mask phone number in backup metadata (full data preserved in userData)
    const maskedPhone = userData.phone
      ? userData.phone.slice(0, -4).replace(/./g, '*') + userData.phone.slice(-4)
      : 'N/A';
    console.log(`  📋 ${userData.firstName || uid} (${maskedPhone})`);

    backup.users[uid] = {
      profile: userData,
      subcollections: {},
    };
    totalDocs++;

    for (const subName of SUBCOLLECTIONS) {
      const subSnap = await db
        .collection(`${LL_PREFIX}users/${uid}/${subName}`)
        .get();

      if (!subSnap.empty) {
        backup.users[uid].subcollections[subName] = {};
        subSnap.forEach((doc) => {
          backup.users[uid].subcollections[subName][doc.id] = serializeDoc(doc);
          totalDocs++;
        });
        console.log(`    └─ ${subName}: ${subSnap.size} docs`);
      }
    }
  }

  // Also backup ll-cohorts
  const cohortsSnap = await db.collection(`${LL_PREFIX}cohorts`).get();
  if (!cohortsSnap.empty) {
    backup.cohorts = {};
    cohortsSnap.forEach((doc) => {
      backup.cohorts[doc.id] = serializeDoc(doc);
      totalDocs++;
    });
    console.log(`\n  📦 Cohorts: ${cohortsSnap.size}`);
  }

  // Also backup ll-processed-sms (idempotency records)
  const smsSnap = await db.collection(`${LL_PREFIX}processed-sms`).limit(1000).get();
  if (!smsSnap.empty) {
    backup.processedSms = {};
    smsSnap.forEach((doc) => {
      backup.processedSms[doc.id] = serializeDoc(doc);
    });
    console.log(`  📱 Processed SMS records: ${smsSnap.size}`);
  }

  backup.metadata.totalDocs = totalDocs;

  // Write to file
  const dateStr = new Date().toISOString().slice(0, 10);
  const outDir = path.join(__dirname, '..', 'data-exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `lab-backup-${env}-${dateStr}.json`);
  fs.writeFileSync(outFile, JSON.stringify(backup, null, 2));

  console.log(`\n✅ Backup complete: ${totalDocs} docs → ${path.basename(outFile)}`);
  console.log(`   File size: ${(fs.statSync(outFile).size / 1024).toFixed(1)} KB\n`);

  process.exit(0);
}

backupLabData().catch((err) => {
  console.error('Backup failed:', err.message);
  process.exit(1);
});
