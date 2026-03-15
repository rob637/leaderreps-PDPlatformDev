/**
 * fix-milestone-3-4-5-rep-links.cjs
 * 
 * Fixes milestone-3, milestone-4, and milestone-5 action configurations.
 * Ensures conditioning rep actions have:
 * - type: 'conditioning-rep'
 * - handlerType: 'conditioning-rep'
 * - repTypeId: the appropriate rep type ID
 * 
 * Session 3 (Level 3): deliver_redirecting_feedback, close_the_loop
 * Session 4 (Level 4): handle_pushback, hold_the_line
 * Session 5 (Level 5): be_curious
 */

const admin = require('firebase-admin');
const path = require('path');

// Determine environment from args or default to dev
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const env = args.find(a => ['--dev', '--test', '--prod'].includes(a))?.replace('--', '') || 'dev';

// Load appropriate service account
const saPath = {
  dev: path.join(__dirname, '../../leaderreps-pd-platform-firebase-adminsdk.json'),
  test: path.join(__dirname, '../../leaderreps-test-firebase-adminsdk.json'),
  prod: path.join(__dirname, '../../leaderreps-prod-firebase-adminsdk.json')
}[env];

const serviceAccount = require(saPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Milestone configurations
const MILESTONE_CONFIGS = {
  3: {
    label: 'Session 3: Open Gym Feedback',
    reps: [
      { id: 'action-s3-deliver-redirecting-feedback', repTypeId: 'deliver_redirecting_feedback', label: 'S3 Real Rep: Deliver Redirecting Feedback' },
      { id: 'action-s3-close-the-loop', repTypeId: 'close_the_loop', label: 'S3 Real Rep: Close the Loop' }
    ],
    coachingSessionTypes: ['open_gym']
  },
  4: {
    label: 'Session 4: Open Gym Pushback',
    reps: [
      { id: 'action-s4-handle-pushback', repTypeId: 'handle_pushback', label: 'S4 Real Rep: Handle Pushback' },
      { id: 'action-s4-hold-the-line', repTypeId: 'hold_the_line', label: 'S4 Real Rep: Hold the Line' }
    ],
    coachingSessionTypes: ['open_gym']
  },
  5: {
    label: 'Session 5: Graduation',
    reps: [
      { id: 'action-s5-be-curious', repTypeId: 'be_curious', label: 'S5 Real Rep: Be Curious' }
    ],
    coachingSessionTypes: []
  }
};

async function migrate() {
  console.log(`\n🔄 Fixing milestone-3, 4, 5 rep links in ${env.toUpperCase()} environment...\n`);
  console.log(`   Project: ${serviceAccount.project_id}`);
  console.log(`   Dry Run: ${isDryRun ? 'YES (no changes will be made)' : 'NO'}`);

  for (const [milestoneNum, milestoneConfig] of Object.entries(MILESTONE_CONFIGS)) {
    const docId = `milestone-${milestoneNum}`;
    const milestoneRef = db.collection('daily_plan_v1').doc(docId);
    const milestoneDoc = await milestoneRef.get();
    
    console.log(`\n📋 ${docId}:`);
    
    if (!milestoneDoc.exists) {
      console.log(`   ⚠️  Document does not exist. Creating...`);
    }
    
    const existing = milestoneDoc.exists ? milestoneDoc.data() : {};
    const existingActions = existing.actions || [];
    
    // Log current state
    console.log(`   Current actions (${existingActions.length}):`);
    existingActions.forEach((a, i) => {
      console.log(`     ${i+1}. [${a.type || 'unknown'}] ${a.label} ${a.repTypeId ? '→ ' + a.repTypeId : ''}`);
    });
    
    // Build corrected actions array
    // Keep non-rep actions, replace/add rep actions with correct structure
    const nonRepActions = existingActions.filter(a => {
      const label = (a.label || '').toLowerCase();
      // Filter out anything that looks like a rep action
      if (label.includes('real rep')) return false;
      if (label.includes('redirecting feedback')) return false;
      if (label.includes('closing the loop') || label.includes('close the loop')) return false;
      if (label.includes('handling pushback') || label.includes('handle pushback')) return false;
      if (label.includes('holding the line') || label.includes('hold the line')) return false;
      if (label.includes('be curious')) return false;
      if (a.type === 'conditioning-rep') return false;
      if (a.repTypeId) return false;
      return true;
    });
    
    const repActions = milestoneConfig.reps.map(rep => ({
      id: rep.id,
      type: 'conditioning-rep',
      label: rep.label,
      enabled: true,
      isCompleted: false,
      required: true,
      handlerType: 'conditioning-rep',
      repTypeId: rep.repTypeId,
      completesWhen: 'loop_closed'
    }));
    
    const correctedActions = [...nonRepActions, ...repActions];
    
    console.log(`   Corrected actions (${correctedActions.length}):`);
    correctedActions.forEach((a, i) => {
      console.log(`     ${i+1}. [${a.type}] ${a.label} ${a.repTypeId ? '→ repTypeId: ' + a.repTypeId : ''}`);
    });
    
    // Update document
    const updateData = {
      ...existing,
      id: docId,
      milestone: parseInt(milestoneNum),
      title: milestoneConfig.label,
      phase: 'foundation',
      actions: correctedActions,
      coachingSessionTypes: milestoneConfig.coachingSessionTypes || existing.coachingSessionTypes || []
    };
    
    if (!isDryRun) {
      await milestoneRef.set(updateData, { merge: true });
      console.log(`   ✅ Updated ${docId}`);
    } else {
      console.log(`   [DRY RUN] Would update ${docId}`);
    }
  }
  
  console.log('\n✅ Migration complete!\n');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
