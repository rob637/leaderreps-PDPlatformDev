/**
 * Migration: Add type, description, and time estimates to all action items
 * This brings session prep and milestone actions up to the same standard as onboarding items
 */

const admin = require('firebase-admin');
const sa = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

try { admin.app().delete(); } catch {}
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

// Metadata definitions for all action items
const SESSION_PREP_METADATA = {
  // Session 2 prep
  'action-s2-download-guide': {
    resourceType: 'document',
    resourceTitle: 'Session 2 Preparation Guide',
    estimatedMinutes: 2
  },
  'action-s2-watch-video': {
    resourceType: 'video', 
    resourceTitle: 'Session 2 Overview',
    estimatedMinutes: 10
  },
  'action-1773320767771': { // S2 Tool: One-on-Ones
    resourceType: 'document',
    resourceTitle: '1:1 Meeting Framework',
    estimatedMinutes: 5
  },
  
  // Session 3 prep
  'action-s3-download-guide': {
    resourceType: 'document',
    resourceTitle: 'Session 3 Preparation Guide',
    estimatedMinutes: 2
  },
  'action-s3-watch-video': {
    resourceType: 'video',
    resourceTitle: 'Session 3 Overview', 
    estimatedMinutes: 10
  },
  'action-1773320887928': { // Session 3: Open Gym: Feedback
    resourceType: 'session',
    resourceTitle: 'Open Gym Feedback Practice',
    estimatedMinutes: 60
  },
  
  // Session 4 prep
  'action-s4-download-guide': {
    resourceType: 'document',
    resourceTitle: 'Session 4 Preparation Guide',
    estimatedMinutes: 2
  },
  'action-s4-watch-video': {
    resourceType: 'video',
    resourceTitle: 'Session 4 Overview',
    estimatedMinutes: 10
  },
  'action-1773320896415': { // Session 4: Open Gym: Pushback
    resourceType: 'session',
    resourceTitle: 'Open Gym Pushback Practice',
    estimatedMinutes: 60
  },
  
  // Session 5 prep
  'action-s5-download-guide': {
    resourceType: 'document',
    resourceTitle: 'Session 5 Preparation Guide',
    estimatedMinutes: 2
  },
  'action-s5-watch-video': {
    resourceType: 'video',
    resourceTitle: 'Session 5 Overview',
    estimatedMinutes: 10
  }
};

const MILESTONE_METADATA = {
  // Milestone 1
  'action-s1-deliberate-practice': {
    resourceType: 'session',
    resourceTitle: 'Live Deliberate Practice Session',
    estimatedMinutes: 60
  },
  'action-s1-clear-expectations': {
    resourceType: 'conditioning-rep',
    resourceTitle: 'Set Clear Expectations with a team member',
    estimatedMinutes: 20
  },
  'action-s1-reinforcing-feedback': {
    resourceType: 'conditioning-rep',
    resourceTitle: 'Deliver Reinforcing Feedback to a team member',
    estimatedMinutes: 20
  },
  'action-1773103039642': { // Conditioning Tool Demo
    resourceType: 'video',
    resourceTitle: 'How to Use the Conditioning Tool',
    estimatedMinutes: 5
  },
  
  // Milestone 2
  'action-s2-lead-with-vulnerability': {
    resourceType: 'conditioning-rep',
    resourceTitle: 'Lead with Vulnerability in a team conversation',
    estimatedMinutes: 20
  },
  'action-s2-follow-up-work': {
    resourceType: 'conditioning-rep',
    resourceTitle: 'Follow Up on Work you previously delegated',
    estimatedMinutes: 20
  },
  
  // Milestone 3
  'action-s3-deliver-redirecting-feedback': {
    resourceType: 'conditioning-rep',
    resourceTitle: 'Deliver Redirecting Feedback to a team member',
    estimatedMinutes: 20
  },
  'action-s3-close-the-loop': {
    resourceType: 'conditioning-rep',
    resourceTitle: 'Close the Loop on a previous conversation',
    estimatedMinutes: 20
  },
  
  // Milestone 4
  'action-1772196849783': { // Optional: 1:1 Coaching
    resourceType: 'coaching',
    resourceTitle: 'Optional 1:1 Coaching Session',
    estimatedMinutes: 30
  },
  'action-s4-handle-pushback': {
    resourceType: 'conditioning-rep',
    resourceTitle: 'Handle Pushback in a team conversation',
    estimatedMinutes: 20
  },
  'action-s4-hold-the-line': {
    resourceType: 'conditioning-rep',
    resourceTitle: 'Hold the Line on a decision or boundary',
    estimatedMinutes: 20
  },
  
  // Milestone 5
  'action-1772196889839': { // S5 Tool: Leadership Identity Statement
    resourceType: 'document',
    resourceTitle: 'Leadership Identity Statement Worksheet',
    estimatedMinutes: 30
  },
  'action-1772196896732': { // Session 5: Graduation
    resourceType: 'session',
    resourceTitle: 'Foundation Program Graduation',
    estimatedMinutes: 60
  },
  'action-s5-be-curious': {
    resourceType: 'conditioning-rep',
    resourceTitle: 'Be Curious in a challenging conversation',
    estimatedMinutes: 20
  }
};

async function updateSessionConfigs() {
  console.log('\n=== UPDATING SESSION CONFIGS ===\n');
  
  for (let s = 2; s <= 5; s++) {
    const docId = `session${s}-config`;
    const ref = db.doc(`daily_plan_v1/${docId}`);
    const snap = await ref.get();
    
    if (!snap.exists) {
      console.log(`${docId}: NOT FOUND`);
      continue;
    }
    
    const data = snap.data();
    const actions = data.actions || [];
    let updated = false;
    
    const newActions = actions.map(action => {
      const metadata = SESSION_PREP_METADATA[action.id];
      if (metadata) {
        console.log(`  ${action.id}: Adding metadata`);
        updated = true;
        return {
          ...action,
          resourceType: metadata.resourceType,
          resourceTitle: metadata.resourceTitle,
          estimatedMinutes: metadata.estimatedMinutes
        };
      }
      return action;
    });
    
    if (updated) {
      await ref.update({ 
        actions: newActions,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`${docId}: UPDATED`);
    } else {
      console.log(`${docId}: No changes needed`);
    }
  }
}

async function updateMilestones() {
  console.log('\n=== UPDATING MILESTONES ===\n');
  
  for (let m = 1; m <= 5; m++) {
    const docId = `milestone-${m}`;
    const ref = db.doc(`daily_plan_v1/${docId}`);
    const snap = await ref.get();
    
    if (!snap.exists) {
      console.log(`${docId}: NOT FOUND`);
      continue;
    }
    
    const data = snap.data();
    const actions = data.actions || [];
    let updated = false;
    
    const newActions = actions.map(action => {
      const metadata = MILESTONE_METADATA[action.id];
      if (metadata) {
        console.log(`  ${action.id}: Adding metadata`);
        updated = true;
        return {
          ...action,
          resourceType: metadata.resourceType,
          resourceTitle: metadata.resourceTitle,
          estimatedMinutes: metadata.estimatedMinutes
        };
      }
      return action;
    });
    
    if (updated) {
      await ref.update({ 
        actions: newActions,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`${docId}: UPDATED`);
    } else {
      console.log(`${docId}: No changes needed`);
    }
  }
}

async function main() {
  console.log('Starting metadata migration...\n');
  
  await updateSessionConfigs();
  await updateMilestones();
  
  console.log('\n=== MIGRATION COMPLETE ===\n');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
