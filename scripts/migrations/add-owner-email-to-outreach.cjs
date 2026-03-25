/**
 * Migration: Add ownerEmail to outreach data
 * 
 * Adds ownerEmail field to:
 * - outreach_templates
 * - outreach_sequences  
 * - outreach_activities
 * 
 * Run with: node scripts/migrations/add-owner-email-to-outreach.cjs
 */

const admin = require('firebase-admin');
const serviceAccount = require('../../leaderreps-prod-firebase-adminsdk.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function migrate() {
  console.log('Starting migration: Add ownerEmail to outreach data\n');
  
  let totalUpdates = 0;

  // Templates - default to rob@sagecg.com 
  console.log('Processing templates...');
  const templates = await db.collection('outreach_templates').get();
  console.log(`  Found ${templates.size} templates`);
  
  for (const doc of templates.docs) {
    const data = doc.data();
    if (!data.ownerEmail) {
      await doc.ref.update({ ownerEmail: 'rob@sagecg.com' });
      totalUpdates++;
      console.log(`  Updated template: ${doc.id}`);
    }
  }

  // Sequences - same
  console.log('\nProcessing sequences...');
  const sequences = await db.collection('outreach_sequences').get();
  console.log(`  Found ${sequences.size} sequences`);
  
  for (const doc of sequences.docs) {
    const data = doc.data();
    if (!data.ownerEmail) {
      await doc.ref.update({ ownerEmail: 'rob@sagecg.com' });
      totalUpdates++;
      console.log(`  Updated sequence: ${doc.id}`);
    }
  }

  // Activities - use userEmail if present
  console.log('\nProcessing activities...');
  const activities = await db.collection('outreach_activities').get();
  console.log(`  Found ${activities.size} activities`);
  
  for (const doc of activities.docs) {
    const data = doc.data();
    if (!data.ownerEmail) {
      const email = data.userEmail || 'rob@sagecg.com';
      await doc.ref.update({ ownerEmail: email });
      totalUpdates++;
      console.log(`  Updated activity: ${doc.id} -> ${email}`);
    }
  }

  console.log(`\n✓ Migration complete! Updated ${totalUpdates} documents.`);
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
