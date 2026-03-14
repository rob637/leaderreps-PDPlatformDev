const admin = require('firebase-admin');

async function fixTemplate(projectId, credPath) {
  if (admin.apps.length) await admin.app().delete();
  
  const serviceAccount = require(credPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();
  
  console.log(`\nFixing templates in: ${projectId}`);
  
  // Get the coaching_registration_user template
  const templateRef = db.collection('communication_templates').doc('coaching_registration_user');
  const doc = await templateRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    console.log('  Current body:', data.body?.substring(0, 200));
    
    // Check if it has "Coach:" and replace with "Trainer:"
    if (data.body && data.body.includes('Coach:')) {
      const newBody = data.body.replace(/Coach:/g, 'Trainer:');
      await templateRef.update({ body: newBody });
      console.log('  ✅ Updated Coach: -> Trainer:');
    } else if (data.body && data.body.includes('Trainer:')) {
      console.log('  Already uses Trainer:');
    } else {
      console.log('  No Coach: or Trainer: found in body');
    }
  } else {
    console.log('  Template not found - using fallback');
  }
}

async function main() {
  const envs = [
    { id: 'leaderreps-pd-platform', cred: '/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json' },
    { id: 'leaderreps-test', cred: '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json' },
    { id: 'leaderreps-prod', cred: '/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json' }
  ];
  
  for (const env of envs) {
    try {
      await fixTemplate(env.id, env.cred);
    } catch (err) {
      console.error(`Error in ${env.id}:`, err.message);
    }
  }
  
  console.log('\n✅ Done!');
  process.exit(0);
}

main();
