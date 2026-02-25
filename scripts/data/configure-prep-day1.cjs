/**
 * Configure Prep Phase Day 1 with Leader Profile and Leadership Skills Baseline actions
 * Run: node configure-prep-day1.cjs
 */
const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

async function configurePrepDay1() {
  const dayRef = db.collection('daily_plan_v1').doc('day-001');
  
  const dayData = {
    // Basic Info
    dayNumber: 1,
    weekNumber: -2,  // Prep Week 1 (2 weeks before start)
    title: 'Set Up Your Leadership Journey',
    focus: 'Complete your profile and Leadership Skills Baseline to personalize your experience',
    isWeekend: false,
    
    // Actions for Day 1
    actions: [
      {
        id: 'action-leader-profile',
        type: 'task',
        label: 'Complete Your Leader Profile',
        description: 'Share your background, role, and goals so we can personalize your QuickStart journey.',
        resourceId: null, // No external resource - handled by in-app form
        isCompleted: false,
        priority: 'high',
        estimatedMinutes: 3
      },
      {
        id: 'action-baseline-assessment',
        type: 'task',
        label: 'Complete Your Leadership Skills Baseline',
        description: 'Assess your current leadership skills and set 1-3 development goals. This creates your personalized plan.',
        resourceId: null, // No external resource - handled by in-app assessment
        isCompleted: false,
        priority: 'high',
        estimatedMinutes: 5
      },
      {
        id: 'action-explore-dashboard',
        type: 'task',
        label: 'Explore Your Dashboard',
        description: 'Take a quick tour of your Dashboard - this is your daily command center.',
        resourceId: null,
        isCompleted: false,
        priority: 'medium',
        estimatedMinutes: 3
      }
    ],
    
    // Dashboard Widget Visibility (Lock & Key)
    dashboard: {
      'program-status-debug': true,
      // 'leader-profile' and 'baseline-assessment' REMOVED - now handled as INTERACTIVE content in this-weeks-actions
      'prep-welcome-banner': true,    // SHOW - Welcome message
      'welcome-message': true,        // SHOW - Greeting
      'daily-quote': true,            // SHOW - Inspirational
      'weekly-focus': true,           // SHOW - Today's focus
      'this-weeks-actions': true,     // SHOW - Contains Leader Profile & Leadership Skills Baseline as INTERACTIVE items
      
      // Hide during Prep Phase
      'am-bookend-header': false,
      'win-the-day': false,
      'daily-leader-reps': false,
      'grounding-rep': false,
      'pm-bookend-header': false,
      'pm-bookend': false,
      'scorecard': false,
      'progress-feedback': false
    },
    
    // Meta
    phase: 'pre-start',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  console.log('Configuring Prep Day 1 (day-001)...');
  await dayRef.set(dayData, { merge: true });
  console.log('✅ Day 1 configured successfully!');
  
  // Also verify the document
  const doc = await dayRef.get();
  console.log('\nVerification:');
  console.log('- Document exists:', doc.exists);
  console.log('- Title:', doc.data().title);
  console.log('- Actions:', doc.data().actions?.length || 0);
  doc.data().actions?.forEach((a, i) => {
    console.log(`  ${i+1}. ${a.label}`);
  });
  console.log('- Dashboard widgets configured:', Object.keys(doc.data().dashboard || {}).length);
}

configurePrepDay1()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
