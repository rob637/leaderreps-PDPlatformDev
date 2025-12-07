
const admin = require("firebase-admin");

// Initialize Firebase Admin
// We try to use application default credentials
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } else {
        admin.initializeApp({
            projectId: 'leaderreps-pd-platform'
        });
    }
} catch (e) {
    console.error("Error initializing app:", e);
}

const db = admin.firestore();

async function runRolloverForUser(email) {
    console.log(`🔍 Looking for user with email: ${email}`);

    // 1. Find User ID
    const usersSnapshot = await db.collection("users").where("email", "==", email).get();
    
    if (usersSnapshot.empty) {
        console.error("❌ User not found!");
        // Try searching by checking all users if email field isn't indexed or is in a sub-object (unlikely but possible)
        // Or maybe the email is the ID? No, usually it's a UID.
        // Let's try to list a few users to see the structure if this fails.
        return;
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    console.log(`✅ Found user: ${userId} (${userDoc.data().firstName} ${userDoc.data().lastName})`);

    // 2. Run Rollover Logic (Copied from functions/index.js)
    console.log("🌙 Starting manual rollover...");

    // Calculate dates in Chicago timezone (must match schedule timezone)
    const chicagoFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const now = new Date();
    const todayStr = chicagoFormatter.format(now); // YYYY-MM-DD in Chicago time
    
    // Calculate tomorrow in Chicago timezone
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const tomorrow = chicagoFormatter.format(tomorrowDate);
    
    console.log(`📅 Date calculation: today=${todayStr}, tomorrow=${tomorrow} (Chicago time)`);

    try {
        // Get the user's current daily_practice data
        const currentRef = db.collection("modules").doc(userId).collection("daily_practice").doc("current");
        const currentDoc = await currentRef.get();

        if (!currentDoc.exists) {
            console.log(`User ${userId}: No daily_practice data, skipping`);
            return;
        }

        const currentData = currentDoc.data();
        const dataDate = currentData.date;

        console.log(`Current Data Date: ${dataDate}`);

        // Skip if already rolled over to today
        if (dataDate === todayStr) {
            console.log(`⚠️ User ${userId}: Already up to date (${dataDate}).`);
            return;
        }

        // === ARCHIVE TODAY'S DATA ===
        const archiveRef = db.collection("users").doc(userId).collection("daily_logs").doc(dataDate);
        await archiveRef.set({
            ...currentData,
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
            rolloverSource: "manual-script",
        }, { merge: true });
        console.log(`✅ Archived data to daily_logs/${dataDate}`);

        // === CALCULATE CARRY-OVERS ===
        
        // Wins: Keep uncompleted
        const currentWins = currentData.morningBookend?.wins || [];
        const carriedWins = currentWins
            .filter((w) => !w.completed && w.text && w.text.trim().length > 0)
            .map((w) => ({ ...w, completed: false, saved: true }));

        // Wins History
        const completedWins = currentWins.filter((w) => w.completed && w.text);
        const newWinsHistoryEntry = completedWins.map((w, i) => ({
            id: w.id || `win-${dataDate}-${i}`,
            date: dataDate,
            text: w.text,
            completed: true,
        }));
        const existingWinsList = currentData.winsList || [];

        // Reps: Keep uncommitted (Pending)
        const currentReps = currentData.active_commitments || [];
        const carriedReps = currentReps.filter((r) => r.status !== "Committed");

        // Reps History
        const completedReps = currentReps.filter((r) => r.status === "Committed");
        const newRepsHistoryEntry = {
            date: dataDate,
            completedCount: completedReps.length,
            items: completedReps.map((r) => ({ id: r.id, text: r.text })),
        };
        const existingRepsHistory = currentData.repsHistory || [];

        // Reflection History
        const reflection = currentData.eveningBookend || {};
        const hasReflection = reflection.good || reflection.better || reflection.best;
        const newReflectionEntry = hasReflection
            ? {
                id: `ref-${dataDate}`,
                date: dataDate,
                reflectionGood: reflection.good,
                reflectionWork: reflection.better,
                reflectionTomorrow: reflection.best,
            }
            : null;
        const existingReflectionHistory = currentData.reflectionHistory || [];

        // Scorecard History
        const scorecard = currentData.scorecard || {
            reps: { done: 0, total: 0 },
            win: { done: 0, total: 0 },
            grounding: { done: 0, total: 1 },
        };
        const newScorecardEntry = {
            date: dataDate,
            score: `${(scorecard.reps?.done || 0) + (scorecard.win?.done || 0) + (scorecard.grounding?.done || 0)}/${(scorecard.reps?.total || 0) + (scorecard.win?.total || 0) + (scorecard.grounding?.total || 1)}`,
            details: scorecard,
        };
        const existingScorecardHistory = currentData.scorecardHistory || currentData.commitmentHistory || [];

        // === STREAK CALCULATION ===
        const currentStreakCount = currentData.streakCount || 0;
        
        const groundingDone = currentData.groundingRepCompleted ? 1 : 0;
        const winsDone = scorecard.win?.done || 0;
        const repsDone = scorecard.reps?.done || completedReps.length;
        
        const didActivity = groundingDone > 0 || winsDone > 0 || repsDone > 0;
        
        // Check if today is a weekend (Saturday=6, Sunday=0)
        const todayDate = new Date(dataDate + 'T12:00:00'); // Parse date at noon to avoid timezone issues
        const dayOfWeek = todayDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        let newStreakCount = currentStreakCount;
        
        if (didActivity) {
            // User did at least one activity - increment streak
            newStreakCount = currentStreakCount + 1;
            console.log(`User ${userId}: Activity detected (grounding=${groundingDone}, wins=${winsDone}, reps=${repsDone}). Streak: ${currentStreakCount} -> ${newStreakCount}`);
        } else if (isWeekend) {
            // Weekend with no activity - maintain streak (grace period)
            console.log(`User ${userId}: Weekend with no activity. Streak maintained at ${currentStreakCount}`);
        } else {
            // Weekday with no activity - reset streak
            newStreakCount = 0;
            console.log(`User ${userId}: Weekday with no activity. Streak reset: ${currentStreakCount} -> 0`);
        }

        // === PREPARE NEW STATE ===
        const newState = {
            ...currentData,
            date: todayStr,
            lastUpdated: new Date().toISOString(),

            // Update Streak
            streakCount: newStreakCount,
            lastStreakDate: dataDate,
            streakHistory: [
                { date: dataDate, streak: newStreakCount, didActivity, isWeekend },
                ...(currentData.streakHistory || []).slice(0, 29) // Keep last 30 days
            ],

            // Update Histories (dedup by date/id)
            winsList: [...newWinsHistoryEntry, ...existingWinsList].filter(
                (v, i, a) => a.findIndex((t) => t.id === v.id) === i
            ),
            repsHistory: [newRepsHistoryEntry, ...existingRepsHistory].filter(
                (v, i, a) => a.findIndex((t) => t.date === v.date) === i
            ),
            reflectionHistory: newReflectionEntry
                ? [newReflectionEntry, ...existingReflectionHistory].filter(
                    (v, i, a) => a.findIndex((t) => t.date === v.date) === i
                )
                : existingReflectionHistory,
            scorecardHistory: [newScorecardEntry, ...existingScorecardHistory].filter(
                (v, i, a) => a.findIndex((t) => t.date === v.date) === i
            ),

            // Reset Morning Bookend with carried wins
            morningBookend: {
                ...currentData.morningBookend,
                wins: [
                    ...carriedWins,
                    ...Array(3).fill(null),
                ]
                .slice(0, 3)
                .map((w, i) => w || { id: `win-${Date.now()}-${i}`, text: "", completed: false, saved: false }),
                winCompleted: false,
                completedAt: null,
                otherTasks: [],
            },

            // Reset Reps
            active_commitments: carriedReps,
            dailyTargetRepStatus: "Pending",

            // Reset Evening Bookend
            eveningBookend: {
                good: "",
                better: "",
                best: "",
                habits: {},
                completedAt: null,
            },

            // Reset Scorecard
            scorecard: {
                reps: { done: 0, total: 0, pct: 0 },
                win: { done: 0, total: 0, pct: 0 },
                grounding: { done: 0, total: 1, pct: 0 },
            },

            // Reset grounding rep state
            groundingRepCompleted: false,
        };

        // === UPDATE FIRESTORE ===
        await currentRef.set(newState);

        console.log(`✅ User ${userId}: Rolled over from ${dataDate} to ${tomorrow}`);
    } catch (userError) {
        console.error(`❌ User ${userId}: Rollover failed`, userError);
    }
}

// Run
runRolloverForUser("ryan@leaderreps.com").then(() => {
    console.log("Done.");
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
