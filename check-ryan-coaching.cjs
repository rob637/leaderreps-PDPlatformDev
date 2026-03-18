const admin = require('firebase-admin');

// Initialize with prod credentials
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-prod'
});

const db = admin.firestore();

async function checkRyanCoaching() {
  console.log('=== Checking Ryan Yeoman Coaching Registrations in PROD ===\n');
  
  // Find Ryan's user record
  const usersSnap = await db.collection('users')
    .where('email', '==', 'ryan.yeoman@gmail.com')
    .get();
  
  if (usersSnap.empty) {
    // Try case variations
    const allUsers = await db.collection('users').get();
    const ryan = allUsers.docs.find(d => {
      const email = (d.data().email || '').toLowerCase();
      return email.includes('yeoman') || email.includes('ryan');
    });
    if (ryan) {
      console.log('Found Ryan:', ryan.id, ryan.data().email);
    } else {
      console.log('Ryan not found by email search');
    }
  } else {
    console.log('Found Ryan:', usersSnap.docs[0].id);
  }
  
  // Check all coaching registrations
  const regsSnap = await db.collection('coaching_registrations').get();
  console.log(`\nTotal coaching registrations: ${regsSnap.size}\n`);
  
  // Find Ryan's registrations
  const ryanRegs = regsSnap.docs.filter(d => {
    const data = d.data();
    const id = d.id.toLowerCase();
    const email = (data.userEmail || '').toLowerCase();
    return id.includes('yeoman') || email.includes('yeoman') || 
           id.includes('ryan') || email.includes('ryan');
  });
  
  console.log(`Ryan's registrations found: ${ryanRegs.length}\n`);
  
  ryanRegs.forEach(doc => {
    const data = doc.data();
    console.log('Registration ID:', doc.id);
    console.log('  Status:', data.status);
    console.log('  Session:', data.sessionTitle || data.sessionId);
    console.log('  Session Type:', data.sessionType);
    console.log('  Session Date:', data.sessionDate);
    console.log('  Registered At:', data.registeredAt?.toDate?.() || data.registeredAt);
    console.log('  Updated At:', data.updatedAt?.toDate?.() || data.updatedAt);
    console.log('');
  });
  
  process.exit(0);
}

checkRyanCoaching().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
