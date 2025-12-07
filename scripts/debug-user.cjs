
const admin = require("firebase-admin");
const serviceAccount = require("../leaderreps-pd-platform-firebase-adminsdk.json"); 

// Initialize with service account if available, otherwise try default
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    admin.initializeApp({
        projectId: 'leaderreps-pd-platform'
    });
}

const db = admin.firestore();

async function inspectUser(email) {
    console.log(`🔍 Inspecting user: ${email}`);
    const usersSnapshot = await db.collection("users").where("email", "==", email).get();
    
    if (usersSnapshot.empty) {
        console.log("❌ User not found");
        return;
    }

    const userDoc = usersSnapshot.docs[0];
    console.log(`✅ Found User ID: ${userDoc.id}`);
    
    const currentRef = db.collection("users").doc(userDoc.id).collection("daily_practice").doc("current");
    const currentDoc = await currentRef.get();
    
    if (!currentDoc.exists) {
        console.log("❌ No daily_practice/current doc found");
    } else {
        console.log("📄 Current Data:", JSON.stringify(currentDoc.data(), null, 2));
    }
}

inspectUser("rob@sagecg.com");
