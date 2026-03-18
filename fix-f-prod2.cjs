const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-prod-firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  const cRef = db.collection('users').doc('1jBf9Cj5yWNYTIs0FqYxZ0iM7n32').collection('action_progress').doc('_carried_over_prep');
  // wait, what is the ID of rob0315f? Let's just query by email
  const users = await db.collection('users').where('email', '==', 'rob0315f@sagecg.com').get();
  for (const doc of users.docs) {
      const dbRef = db.collection('users').doc(doc.id).collection('action_progress').doc('_carried_over_prep');
      const c = await dbRef.get();
      if (c.exists) {
        const data = c.data();
        console.log("Current items:", data.items.map(i=>i.label));
        const newItems = data.items.filter(item => {
           if (item.label && item.label.includes('Set Notifications')) return false;
           if (item.label && item.label.includes('Accept Foundation Expectation')) return false;
           return true; 
        });
        console.log("Remaining:", newItems.length, "Started with:", data.items.length);
        if (newItems.length !== data.items.length) {
            await dbRef.update({ items: newItems });
            console.log("Updated!");
        }
      }
  }
}
run().then(() => process.exit(0));
