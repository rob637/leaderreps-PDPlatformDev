const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const userId = '18BmIs35txM4VkyfxiycGcDvXIA3';

async function fixAdmin() {
  // Update user document with admin flag
  await db.collection('users').doc(userId).update({
    isAdmin: true,
    role: 'admin',
    adminLevel: 'super'
  });
  console.log('✅ Updated user with admin flags');
  
  // Verify
  const snap = await db.collection('users').doc(userId).get();
  const data = snap.data();
  console.log('\nVerified:');
  console.log('isAdmin:', data.isAdmin);
  console.log('role:', data.role);
  console.log('adminLevel:', data.adminLevel);
}

fixAdmin().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
