const admin = require('firebase-admin');

async function fixFooter(projectId, credPath) {
  if (admin.apps.length) await admin.app().delete();
  
  const serviceAccount = require(credPath);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();
  
  console.log(`\nFixing footer in: ${projectId}`);
  
  const templateRef = db.collection('communication_templates').doc('coaching_registration_user');
  const doc = await templateRef.get();
  
  if (doc.exists) {
    const data = doc.data();
    console.log('  Current footer:', data.footerText);
    
    if (data.footerText && data.footerText.includes('coach')) {
      const newFooter = data.footerText.replace(/coach/g, 'trainer');
      await templateRef.update({ footerText: newFooter });
      console.log('  ✅ Updated to:', newFooter);
    } else {
      console.log('  Already correct');
    }
  }
}

async function main() {
  const envs = [
    { id: 'leaderreps-pd-platform', cred: '/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json' },
    { id: 'leaderreps-test', cred: '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json' },
    { id: 'leaderreps-prod', cred: '/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json' }
  ];
  
  for (const env of envs) {
    await fixFooter(env.id, env.cred);
  }
  
  console.log('\n✅ Done!');
  process.exit(0);
}

main();
