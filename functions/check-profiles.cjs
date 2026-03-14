const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = JSON.parse(fs.readFileSync('/workspaces/leaderreps-PDPlatformDev/leaderreps-prod-firebase-adminsdk.json', 'utf8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'leaderreps-prod'
});

const db = admin.firestore();

const emails = [
  'bvokurka@sasholdings.us',
  'cristina@leaderreps.com',
  'hsmith@equity.net',
  'in2focus@gmail.com',
  'jesse.spates@voicebrook.com',
  'laurenmaffeo8@gmail.com',
  'lydia@irvinpr.com',
  'matt.kruckenberg@josephgroup.com',
  'mnicol@buildwithmarker.com'
];

async function checkProfiles() {
  console.log('Checking leader profiles in PROD...\n');
  
  for (const email of emails) {
    const usersSnap = await db.collection('users').where('email', '==', email).get();
    
    if (usersSnap.empty) {
      console.log(email, '- NOT IN DB');
      continue;
    }
    
    const userDoc = usersSnap.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    // Check leader_profile subcollection
    const profileSnap = await db.collection('users').doc(userId).collection('leader_profile').get();
    const hasProfile = !profileSnap.empty;
    let profileUpdated = null;
    if (hasProfile) {
      const profileData = profileSnap.docs[0].data();
      profileUpdated = profileData.updatedAt?.toDate?.() || profileData.createdAt?.toDate?.() || null;
    }
    
    // Check if leaderProfileComplete flag exists
    const leaderProfileComplete = userData.leaderProfileComplete;
    
    // Check daily_plan_v1
    const dailyPlanSnap = await db.collection('users').doc(userId).collection('daily_plan_v1').get();
    
    console.log(email.padEnd(40), '|',
      'Profile:', hasProfile ? 'YES' : 'NO',
      '| ProfileFlag:', leaderProfileComplete ? 'YES' : 'NO',
      '| Updated:', profileUpdated ? profileUpdated.toISOString().slice(0,10) : 'N/A',
      '| DailyPlan:', dailyPlanSnap.size
    );
  }
  
  process.exit(0);
}

checkProfiles().catch(e => { console.error(e); process.exit(1); });
