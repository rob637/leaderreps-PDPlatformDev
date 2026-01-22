const admin = require('firebase-admin');
const sa = require('./leaderreps-test-firebase-adminsdk.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();

async function checkRules() {
  const rulesSnap = await db.collection('notification_rules').get();
  console.log('Notification Rules in test:', rulesSnap.size);
  rulesSnap.docs.forEach(doc => {
    const d = doc.data();
    console.log('\n---', doc.id, '---');
    console.log('Name:', d.name);
    console.log('Message:', d.message);
    console.log('Time:', d.time);
    console.log('Criteria:', d.criteria);
    console.log('Enabled:', d.enabled);
    console.log('LinkText:', d.linkText || '(none)');
    console.log('LinkUrl:', d.linkUrl || '(none)');
  });
  process.exit(0);
}

checkRules();
