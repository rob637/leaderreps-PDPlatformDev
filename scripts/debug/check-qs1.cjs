const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('/workspaces/leaderreps-PDPlatformDev/leaderreps-pd-platform-firebase-adminsdk.json')) });
const db = admin.firestore();
(async () => {
  const s = await db.doc('content_library/xi2YwVB6yhOSscH9Fuv9').get();
  console.log(JSON.stringify(s.data(), null, 2));
  process.exit(0);
})();
