const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function checkApolloKey() {
  const usersSnap = await db.collection('users').where('email', '==', 'rob@sagecg.com').get();
  if (usersSnap.empty) {
    console.log('User not found');
    return;
  }
  const userId = usersSnap.docs[0].id;
  console.log('Found user:', userId);
  
  const apolloRef = db.collection('users').doc(userId).collection('settings').doc('apollo');
  const apolloSnap = await apolloRef.get();
  if (apolloSnap.exists) {
    const data = apolloSnap.data();
    console.log('Apollo settings found:');
    console.log('  apiKey exists:', Boolean(data.apiKey));
    console.log('  apiKey length:', data.apiKey ? data.apiKey.length : 0);
    if (data.apiKey) {
      console.log('  apiKey prefix:', data.apiKey.substring(0, 10) + '...');
    }
  } else {
    console.log('No Apollo settings found for user');
  }
  process.exit(0);
}
checkApolloKey();
