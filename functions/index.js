/**
 * Firebase Cloud Functions for LeaderReps PD Platform
 * 
 * Includes:
 * - scheduledDailyRollover: Runs at 11:59 PM to archive daily data and reset for the new day
 */

const { setGlobalOptions } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Global options for cost control
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

/**
 * SCHEDULED DAILY ROLLOVER
 * Runs every night at 11:59 PM (America/Chicago timezone)
 * 
 * This function:
 * 1. Gets all users with active daily_practice data
 * 2. Archives the day's data to daily_logs/{date}
 * 3. Carries over uncompleted wins and reps
 * 4. Resets scorecard and reflections for the new day
 */
exports.scheduledDailyRollover = onSchedule(
  {
    schedule: "59 23 * * *", // 11:59 PM every day
    timeZone: "America/Chicago",
    retryCount: 3,
  },
  async () => {
    logger.info("🌙 Starting scheduled daily rollover at 11:59 PM");

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
    
    logger.info(`📅 Date calculation: today=${todayStr}, tomorrow=${tomorrow} (Chicago time)`);

    try {
      // Get all users
      const usersSnapshot = await db.collection("users").get();
      let processedCount = 0;
      let errorCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        try {
          // Get the user's current daily_practice data
          const currentRef = db.collection("users").doc(userId).collection("daily_practice").doc("current");
          const currentDoc = await currentRef.get();

          if (!currentDoc.exists) {
            logger.info(`User ${userId}: No daily_practice data, skipping`);
            continue;
          }

          const currentData = currentDoc.data();
          const dataDate = currentData.date;

          // Skip if already rolled over to tomorrow or no date
          if (!dataDate || dataDate === tomorrow) {
            logger.info(`User ${userId}: Already up to date (${dataDate}), skipping`);
            continue;
          }

          // === ARCHIVE TODAY'S DATA ===
          const archiveRef = db.collection("users").doc(userId).collection("daily_logs").doc(dataDate);
          await archiveRef.set({
            ...currentData,
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
            rolloverSource: "scheduled-function",
          }, { merge: true });

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
          // User maintains streak if they completed at least ONE of:
          // 1. Grounding Rep (groundingRepCompleted)
          // 2. Win the Day (at least one win completed)
          // 3. Daily Rep (at least one rep committed)
          const currentStreakCount = currentData.streakCount || 0;
          const lastStreakDate = currentData.lastStreakDate;
          
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
            logger.info(`User ${userId}: Activity detected (grounding=${groundingDone}, wins=${winsDone}, reps=${repsDone}). Streak: ${currentStreakCount} -> ${newStreakCount}`);
          } else if (isWeekend) {
            // Weekend with no activity - maintain streak (grace period)
            logger.info(`User ${userId}: Weekend with no activity. Streak maintained at ${currentStreakCount}`);
          } else {
            // Weekday with no activity - reset streak
            newStreakCount = 0;
            logger.info(`User ${userId}: Weekday with no activity. Streak reset: ${currentStreakCount} -> 0`);
          }

          // === PREPARE NEW STATE ===
          const newState = {
            ...currentData,
            date: tomorrow,
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

          processedCount++;
          logger.info(`✅ User ${userId}: Rolled over from ${dataDate} to ${tomorrow}`);
        } catch (userError) {
          errorCount++;
          logger.error(`❌ User ${userId}: Rollover failed`, userError);
        }
      }

      logger.info(`🌙 Daily rollover complete: ${processedCount} users processed, ${errorCount} errors`);
      return { success: true, processed: processedCount, errors: errorCount };
    } catch (error) {
      logger.error("🔥 Daily rollover failed:", error);
      throw error;
    }
  }
);