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

async function checkLogins() {
  console.log('Checking login data in PROD...\n');
  
  for (const email of emails) {
    const usersSnap = await db.collection('users').where('email', '==', email).get();
    
    if (usersSnap.empty) {
      console.log(email, '- NOT IN DB');
      continue;
    }
    
    const userData = usersSnap.docs[0].data();
    const lastLogin = userData.lastLogin?.toDate?.() || userData.lastLoginAt?.toDate?.() || null;
    const createdAt = userData.createdAt?.toDate?.() || null;
    const onboardingComplete = userData.onboardingComplete;
    const displayName = userData.displayName || userData.name || 'No name';
    
    console.log(email.padEnd(40), '|',
      'Created:', createdAt ? createdAt.toISOString().slice(0,10) : 'N/A',
      '| LastLogin:', lastLogin ? lastLogin.toISOString().slice(0,10) : 'NEVER',
      '| Onboarding:', onboardingComplete ? 'YES' : 'NO',
      '| Name:', displayName
    );
  }
  
  process.exit(0);
}

checkLogins().catch(e => { console.error(e); process.exit(1); });
