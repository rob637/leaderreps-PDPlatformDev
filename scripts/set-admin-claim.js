// scripts/set-admin-claim.js
// Usage: node scripts/set-admin-claim.js <UID>

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json'); // <-- local file, same folder

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function main() {
  const uid = process.argv[2];
  if (!uid) {
    console.error('ERROR: Please supply a UID: node scripts/set-admin-claim.js <UID>');
    process.exit(1);
  }
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  const user = await admin.auth().getUser(uid);
  console.log('Custom claims now:', user.customClaims);
  console.log('Done. Sign out/in (or refresh ID token) to receive the new claim.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
