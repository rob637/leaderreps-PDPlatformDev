const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function main() {
  // Check content catalog for prep items
  const catalog = await db.collection('metadata').doc('content-catalog').get();
  const data = catalog.data();
  
  if (data?.items) {
    console.log('Total items in catalog:', data.items.length);
    const prepItems = data.items.filter(i => i.phase === 'prep' || i.phase === 'preparation');
    console.log('\nPrep phase items:', prepItems.length);
    prepItems.forEach(item => {
      console.log(`  ${item.id}: ${item.title} (group: ${item.group})`);
    });
  }

  // Also check content-groups 
  const groups = await db.collection('content-groups').get();
  console.log('\n--- content-groups (prep) ---');
  groups.docs.forEach(doc => {
    const data = doc.data();
    if (data.phase === 'prep' || data.phase === 'preparation') {
      console.log(`${doc.id}:`);
      console.log(`  title: ${data.title}`);
      console.log(`  phase: ${data.phase}`);
      console.log(`  items: ${data.items?.length || 0}`);
      data.items?.forEach(item => {
        console.log(`    - ${item.id}: ${item.title}`);
      });
    }
  });

  // Check metadata/arenaConfig for prep structure
  const arenaConfig = await db.collection('metadata').doc('arenaConfig').get();
  if (arenaConfig.exists) {
    const ac = arenaConfig.data();
    console.log('\n--- arenaConfig prep phases ---');
    if (ac.phases) {
      ac.phases.forEach(phase => {
        if (phase.id === 'prep' || phase.id === 'preparation') {
          console.log(JSON.stringify(phase, null, 2).slice(0, 1500));
        }
      });
    }
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
