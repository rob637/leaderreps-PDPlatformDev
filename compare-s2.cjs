const admin = require('firebase-admin');

const saTest = require('./leaderreps-test-firebase-adminsdk.json');
const appTest = admin.initializeApp({ credential: admin.credential.cert(saTest) }, 'test');
const dbTest = appTest.firestore();

const saProd = require('./leaderreps-prod-firebase-adminsdk.json');
const appProd = admin.initializeApp({ credential: admin.credential.cert(saProd) }, 'prod');
const dbProd = appProd.firestore();

async function run() {
  const [testSnap, prodSnap] = await Promise.all([
    dbTest.doc('daily_plan_v1/session2-config').get(),
    dbProd.doc('daily_plan_v1/session2-config').get(),
  ]);

  console.log("TEST:", JSON.stringify(testSnap.data(), null, 2));
  console.log("\nPROD:", JSON.stringify(prodSnap.data(), null, 2));
}

run().then(() => process.exit(0));
