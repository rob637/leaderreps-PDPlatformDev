// scripts/set-admin-claim.js
// Usage (PowerShell):
//   $env:GOOGLE_APPLICATION_CREDENTIALS="D:\\LeaderReps\\LR_PD_Plat_dev\\scripts\\serviceAccount.json"
//   node scripts\\set-admin-claim.js 18BmIs35txM4VkyfxiycGcDvXIA3
// Usage (Git Bash on Windows):
//   export GOOGLE_APPLICATION_CREDENTIALS="$(cygpath -w '/d/LeaderReps/LR_PD_Plat_dev/scripts/serviceAccount.json')"
//   node scripts/set-admin-claim.js 18BmIs35txM4VkyfxiycGcDvXIA3
//
// DO NOT COMMIT serviceAccount.json. Keep it locally and add to .gitignore.

const admin = require('firebase-admin');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS is not set. See comments at top for how to set it on Windows.');
  process.exit(1);
}

const uid = process.argv[2];
if (!uid) {
  console.error('Usage: node scripts/set-admin-claim.js <uid>');
  process.exit(1);
}

async function main() {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    const auth = admin.auth();

    console.log(`[claims] Setting { admin: true } for uid=${uid} ...`);
    await auth.setCustomUserClaims(uid, { admin: true });

    const user = await auth.getUser(uid);
    console.log('[claims] Success. Current custom claims:', user.customClaims || {});
    console.log('Note: The user must refresh their ID token (sign out/in) for the claim to take effect in the client.');
    process.exit(0);
  } catch (err) {
    console.error('[claims] Failed:', err);
    process.exit(1);
  }
}

main();
