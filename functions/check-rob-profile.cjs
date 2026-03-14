const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'leaderreps-prod'
  });
}
const db = admin.firestore();

async function check() {
  const userId = 'xaD3ow0KR4NVe4rkSm3DeEHo6tO2'; // rob@sagecg.com
  
  // Get user doc
  const userSnap = await db.collection('users').doc(userId).get();
  const userData = userSnap.data();
  
  // Check profile fields
  console.log('=== USER PROFILE ===');
  console.log(`displayName: ${userData.displayName}`);
  console.log(`email: ${userData.email}`);
  console.log(`jobTitle: ${userData.jobTitle || 'N/A'}`);
  console.log(`company: ${userData.company || 'N/A'}`);
  console.log(`leadershipRole: ${userData.leadershipRole || 'N/A'}`);
  console.log(`bio: ${userData.bio?.substring(0,50) || 'N/A'}`);
  
  // Check if profile is complete
  console.log(`\nprofileComplete: ${userData.profileComplete || 'N/A'}`);
  console.log(`profileCompletedAt: ${userData.profileCompletedAt?.toDate?.() || 'N/A'}`);
  
  // Check assessment
  console.log('\n=== ASSESSMENTS ===');
  console.log(`assessmentResults: ${userData.assessmentResults ? 'EXISTS' : 'N/A'}`);
  console.log(`baselineCompletedAt: ${userData.baselineCompletedAt?.toDate?.() || 'N/A'}`);
  
  // Check commitments
  console.log('\n=== COMMITMENTS ===');
  console.log(`foundationCommitment: ${userData.foundationCommitment ? 'ACCEPTED' : 'N/A'}`);
  console.log(`notificationsEnabled: ${userData.notificationsEnabled}`);
  console.log(`notificationsSetupAt: ${userData.notificationsSetupAt?.toDate?.() || 'N/A'}`);
  
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
