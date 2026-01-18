const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAdmin() {
  // Check rob@sagecg.com admin status
  const usersSnap = await db.collection('users').where('email', '==', 'rob@sagecg.com').get();
  
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    console.log('=== USER ADMIN STATUS ===');
    console.log('User ID:', doc.id);
    console.log('Email:', data.email);
    console.log('isAdmin:', data.isAdmin);
    console.log('role:', data.role);
    console.log('roles:', data.roles);
    console.log('adminLevel:', data.adminLevel);
  }
  
  // Check global metadata for admin emails
  const metaSnap = await db.collection('global').doc('metadata').get();
  if (metaSnap.exists) {
    const meta = metaSnap.data();
    console.log('\n=== GLOBAL ADMIN EMAILS ===');
    console.log('adminEmails:', meta.adminEmails);
  }
}

checkAdmin().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
