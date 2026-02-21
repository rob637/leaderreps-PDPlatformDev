const admin = require('firebase-admin');
const serviceAccount = require('/workspaces/leaderreps-PDPlatformDev/leaderreps-test-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkTokens() {
  try {
    const accountsRef = db.collection('team_settings').doc('gmail_accounts').collection('accounts');
    const snapshot = await accountsRef.get();
    
    console.log(`Found ${snapshot.size} Gmail accounts:\n`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Email: ${data.email}`);
      console.log(`  Has accessToken: ${!!data.accessToken} (${data.accessToken?.length || 0} chars)`);
      console.log(`  Has refreshToken: ${!!data.refreshToken} (${data.refreshToken?.length || 0} chars)`);
      console.log(`  Connected at: ${data.connectedAt}`);
      console.log(`  Token updated: ${data.tokenUpdatedAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkTokens();
