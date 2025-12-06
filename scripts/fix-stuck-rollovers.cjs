
const admin = require("firebase-admin");
// const serviceAccount = require("../service-account.json"); 

// Initialize Firebase Admin
// In the dev container, we might rely on Google Application Default Credentials
// or we might need to use 'firebase-admin/app' if we are running locally with `firebase use`.
// Let's try standard init.
if (admin.apps.length === 0) {
  admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: "leaderreps-pd-platform"
  });
}

const db = admin.firestore();

async function fixStuckRollovers() {
  console.log("🔍 Scanning for stuck rollovers (Date=Today but Data=Old)...");

  const today = "2025-12-06"; // Hardcoded for this specific fix
  const usersSnapshot = await db.collection("users").get();
  
  let fixedCount = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    const currentRef = db.collection("users").doc(userId).collection("daily_practice").doc("current");
    const currentDoc = await currentRef.get();

    if (!currentDoc.exists) continue;

    const data = currentDoc.data();
    
    // Check if date is today
    if (data.date === today) {
      // Check if it looks like old data (e.g. Evening Reflection is filled out)
      const hasReflection = data.eveningBookend?.good || data.eveningBookend?.better || data.eveningBookend?.best;
      const hasCompletedWins = data.morningBookend?.wins?.some(w => w.completed);
      
      // If it has reflection data, it's almost certainly stale data from yesterday
      if (hasReflection) {
        console.log(`⚠️ User ${userId}: Found stuck data! Date is ${today} but has reflection data.`);
        
        // Perform the cleanup (Reset to fresh day state)
        const updates = {
          // Reset Morning Bookend (keep wins structure but reset completion? 
          // Actually, if they are old wins, we should probably clear them or carry them over.
          // For safety, let's just reset completion status of wins, but keep text? 
          // No, if it's a new day, we usually want fresh wins or carried over ones.
          // Let's just reset the completion flags and the reflection.
          
          "morningBookend.winCompleted": false,
          "morningBookend.completedAt": null,
          // We won't touch the wins text to be safe, just uncheck them if they were checked?
          // Actually, the user complained "Win the Day" didn't update.
          // Let's reset the wins to empty/unchecked if they look like yesterday's.
          
          // Reset Evening Bookend
          "eveningBookend": {
            good: "",
            better: "",
            best: "",
            habits: {},
            completedAt: null,
          },

          // Reset Scorecard
          "scorecard": {
            reps: { done: 0, total: 0, pct: 0 },
            win: { done: 0, total: 0, pct: 0 },
            grounding: { done: 0, total: 1, pct: 0 },
          },
          
          // Reset Grounding Rep
          "groundingRepCompleted": false,
          
          // Reset Active Commitments (Daily Reps)
          "active_commitments": [], // Clear them so user can pick new ones
          "dailyTargetRepStatus": "Pending"
        };

        // Special handling for wins: uncheck them
        if (data.morningBookend?.wins) {
            const resetWins = data.morningBookend.wins.map(w => ({ ...w, completed: false, saved: false }));
            updates["morningBookend.wins"] = resetWins;
        }

        await currentRef.update(updates);
        console.log(`✅ User ${userId}: Fixed! Data reset for ${today}.`);
        fixedCount++;
      }
    }
  }

  console.log(`🏁 Scan complete. Fixed ${fixedCount} users.`);
}

fixStuckRollovers().catch(console.error);
