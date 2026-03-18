const admin = require('firebase-admin');
const sa = require('./leaderreps-pd-platform-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(sa) });
const db = admin.firestore();

(async () => {
  const uid = '3pq6VRq3I9djqgy5TA762HaCxP82';
  
  // Get session2-config actions to find incomplete items
  const s2 = await db.collection('daily_plan_v1').doc('session2-config').get();
  const s2Actions = s2.data().actions || [];
  
  // Get user's completed items
  const progressSnap = await db.collection('users/' + uid + '/action_progress').get();
  const completed = new Set();
  progressSnap.docs.forEach(d => {
    if (d.data().status === 'completed') completed.add(d.id);
  });
  
  // Find incomplete session2 items
  const incompleteS2 = s2Actions.filter(a => !completed.has(a.id));
  
  // Build carryover items
  const items = [
    {
      id: 'interactive-baseline-assessment',
      label: 'Complete Leadership Skills Baseline',
      category: 'Onboarding',
      prepSection: 'onboarding',
      type: 'interactive',
      handlerType: 'baseline-assessment',
      isInteractive: true,
      addedAtLevel: 1,
      completedAt: null,
      completedAtLevel: null,
      resourceId: 'interactive-baseline-assessment',
      resourceType: 'interactive'
    }
  ];
  
  // Add incomplete session2 items
  incompleteS2.forEach(a => {
    items.push({
      id: a.id,
      label: a.label,
      category: 'Session 2 Prep',
      prepSection: 'session2',
      type: a.type || 'content',
      handlerType: null,
      isInteractive: false,
      addedAtLevel: 2,
      completedAt: null,
      completedAtLevel: null,
      resourceId: a.resourceId || null,
      resourceType: a.resourceType || null,
      url: a.url || null
    });
  });
  
  // Write to carryover
  await db.doc('users/' + uid + '/action_progress/_carryover').set({
    items: items,
    currentLevel: 2,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
  
  console.log('Created carryover with', items.length, 'items:');
  items.forEach(i => console.log(' -', i.label, '(session:', i.prepSection + ')'));
  
  process.exit(0);
})();
