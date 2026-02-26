const admin = require('firebase-admin');

const saPath = '/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json';
const sa = require(saPath);

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

async function main() {
  const db = admin.firestore();
  
  const featuresDoc = await db.collection('config').doc('features').get();
  
  if (featuresDoc.exists) {
    const data = featuresDoc.data();
    
    // Get all features with order
    const ordered = Object.entries(data)
      .filter(([k, v]) => typeof v === 'object' && v.enabled)
      .map(([id, v]) => ({ id, order: v.order ?? 999, enabled: v.enabled }))
      .sort((a, b) => a.order - b.order);
    
    console.log('Features by order (top 15):');
    ordered.slice(0, 15).forEach(f => {
      console.log(`  ${f.order}: ${f.id}`);
    });
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
