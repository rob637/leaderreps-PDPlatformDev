/**
 * Firebase Cloud Functions for LeaderReps PD Platform
 * 
 * Includes:
 * - scheduledDailyRollover: Runs at 11:59 PM to archive daily data and reset for the new day
 * - manualRollover: HTTP endpoint to manually trigger rollover for a specific user (catch-up)
 * - geminiProxy: Secure proxy for Gemini AI API calls
 */

const { setGlobalOptions } = require("firebase-functions");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Global options for cost control
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

/**
 * GEMINI AI PROXY
 * Secure endpoint for making Gemini API calls from the frontend
 * Keeps the API key secure on the server side
 * 
 * Set the API key using: firebase functions:config:set gemini.apikey="YOUR_API_KEY"
 */
exports.geminiProxy = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    // Only allow POST requests
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { prompt, model = "gemini-1.5-flash", systemInstruction } = req.body;

      if (!prompt) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }

      // Get the API key from environment variable or functions config
      const apiKey = process.env.GEMINI_API_KEY || 
                    (require("firebase-functions").config().gemini?.apikey);
      
      if (!apiKey) {
        logger.error("GEMINI_API_KEY is not configured. Set with: firebase functions:config:set gemini.apikey=\"YOUR_KEY\"");
        res.status(500).json({ error: "AI service not configured" });
        return;
      }

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const genModel = genAI.getGenerativeModel({ 
        model,
        systemInstruction: systemInstruction || "You are a helpful assistant for the LeaderReps leadership development platform."
      });

      // Generate content
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      logger.info(`Gemini API call successful, model: ${model}`);
      
      res.status(200).json({ 
        success: true, 
        text,
        model 
      });

    } catch (error) {
      logger.error("Gemini API error:", error);
      res.status(500).json({ 
        error: "Failed to generate content", 
        details: error.message 
      });
    }
  }
);

/**
 * MANUAL ROLLOVER (HTTP Trigger)
 * Allows manually triggering the rollover for a specific user.
 * Useful for debugging or fixing missed rollovers.
 * 
 * Usage: POST /manualRollover?email=rob@sagecg.com
 */
exports.manualRollover = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    const email = req.query.email || req.body.email;
    
    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    logger.info(`🔧 Starting manual rollover for ${email}`);

    try {
      // Find user by email
      const usersSnapshot = await db.collection("users").where("email", "==", email).limit(1).get();
      
      if (usersSnapshot.empty) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const userDoc = usersSnapshot.docs[0];
      const userId = userDoc.id;
      
      // Calculate dates
      const chicagoFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      
      const now = new Date();
      const todayStr = chicagoFormatter.format(now); // Target date for manual run is TODAY
      
      // Get current data from MODULES collection (Correct Path)
      const currentRef = db.collection("modules").doc(userId).collection("daily_practice").doc("current");
      const currentDoc = await currentRef.get();

      if (!currentDoc.exists) {
        res.status(404).json({ error: "No daily_practice data found for user" });
        return;
      }

      const currentData = currentDoc.data();
      const dataDate = currentData.date;

      if (dataDate === todayStr) {
        res.json({ message: "User is already on today's date", date: dataDate });
        return;
      }

      // === ARCHIVE OLD DATA ===
      // Archive to USERS collection (Legacy/History Path)
      const archiveRef = db.collection("users").doc(userId).collection("daily_logs").doc(dataDate);
      await archiveRef.set({
        ...currentData,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        rolloverSource: "manual-function",
      }, { merge: true });

      // === CALCULATE CARRY-OVERS ===
      const currentWins = currentData.morningBookend?.wins || [];
      const carriedWins = currentWins
        .filter((w) => !w.completed && w.text && w.text.trim().length > 0)
        .map((w) => ({ ...w, completed: false, saved: true }));

      const completedWins = currentWins.filter((w) => w.completed && w.text);
      const newWinsHistoryEntry = completedWins.map((w, i) => ({
        id: w.id || `win-${dataDate}-${i}`,
        date: dataDate,
        text: w.text,
        completed: true,
      }));
      const existingWinsList = currentData.winsList || [];

      const currentReps = currentData.active_commitments || [];
      const carriedReps = currentReps.filter((r) => r.status !== "Committed");

      const completedReps = currentReps.filter((r) => r.status === "Committed");
      const newRepsHistoryEntry = {
        date: dataDate,
        completedCount: completedReps.length,
        items: completedReps.map((r) => ({ id: r.id, text: r.text })),
      };
      const existingRepsHistory = currentData.repsHistory || [];

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

      // Streak
      const currentStreakCount = currentData.streakCount || 0;
      const groundingDone = currentData.groundingRepCompleted ? 1 : 0;
      const winsDone = scorecard.win?.done || 0;
      const repsDone = scorecard.reps?.done || completedReps.length;
      const didActivity = groundingDone > 0 || winsDone > 0 || repsDone > 0;
      
      const todayDateObj = new Date(dataDate + 'T12:00:00');
      const dayOfWeek = todayDateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      let newStreakCount = currentStreakCount;
      if (didActivity) {
        newStreakCount = currentStreakCount + 1;
      } else if (!isWeekend) {
        newStreakCount = 0;
      }

      // === PREPARE NEW STATE ===
      const newState = {
        ...currentData,
        date: todayStr, // Set to TODAY
        lastUpdated: new Date().toISOString(),
        streakCount: newStreakCount,
        lastStreakDate: dataDate,
        streakHistory: [
          { date: dataDate, streak: newStreakCount, didActivity, isWeekend },
          ...(currentData.streakHistory || []).slice(0, 29)
        ],
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
        morningBookend: {
          ...currentData.morningBookend,
          wins: [...carriedWins, ...Array(3).fill(null)].slice(0, 3).map((w, i) => w || { id: `win-${Date.now()}-${i}`, text: "", completed: false, saved: false }),
          winCompleted: false,
          completedAt: null,
          otherTasks: [],
        },
        active_commitments: carriedReps,
        dailyTargetRepStatus: "Pending",
        eveningBookend: {
          good: "",
          better: "",
          best: "",
          habits: {},
          completedAt: null,
          otherTasks: [],
        },
        scorecard: {
          reps: { done: 0, total: 0, pct: 0 },
          win: { done: 0, total: 0, pct: 0 },
          grounding: { done: 0, total: 1, pct: 0 },
        },
        groundingRepCompleted: false,
      };

      await currentRef.set(newState);

      logger.info(`✅ Manual rollover complete for ${email}`);
      res.json({ success: true, message: `Rolled over from ${dataDate} to ${todayStr}` });

    } catch (error) {
      logger.error("Manual rollover failed:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * SCHEDULED DAILY ROLLOVER
 * Runs every night at 11:59 PM (America/Chicago timezone)
 */
exports.scheduledDailyRollover = onSchedule(
  {
    schedule: "59 23 * * *", // 11:59 PM every day
    timeZone: "America/Chicago",
    retryCount: 3,
  },
  async () => {
    logger.info("🌙 Starting scheduled daily rollover at 11:59 PM");

    const chicagoFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const now = new Date();
    const todayStr = chicagoFormatter.format(now);
    
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const tomorrow = chicagoFormatter.format(tomorrowDate);
    
    logger.info(`📅 Date calculation: today=${todayStr}, tomorrow=${tomorrow} (Chicago time)`);

    try {
      const usersSnapshot = await db.collection("users").get();
      let processedCount = 0;
      let errorCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        logger.info(`👤 User found: ${userData.email} (${userId})`);

        try {
          // FIX: Use 'modules' collection for daily_practice
          const currentRef = db.collection("modules").doc(userId).collection("daily_practice").doc("current");
          const currentDoc = await currentRef.get();

          if (!currentDoc.exists) {
            logger.info(`User ${userId}: No daily_practice data, skipping`);
            continue;
          }

          const currentData = currentDoc.data();
          const dataDate = currentData.date;

          if (!dataDate || dataDate === tomorrow) {
            logger.info(`User ${userId}: Already up to date (${dataDate}), skipping`);
            continue;
          }

          // Archive to 'users' collection (Legacy/History Path)
          const archiveRef = db.collection("users").doc(userId).collection("daily_logs").doc(dataDate);
          await archiveRef.set({
            ...currentData,
            archivedAt: admin.firestore.FieldValue.serverTimestamp(),
            rolloverSource: "scheduled-function",
          }, { merge: true });

          // === CALCULATE CARRY-OVERS ===
          const currentWins = currentData.morningBookend?.wins || [];
          const carriedWins = currentWins
            .filter((w) => !w.completed && w.text && w.text.trim().length > 0)
            .map((w) => ({ ...w, completed: false, saved: true }));

          const completedWins = currentWins.filter((w) => w.completed && w.text);
          const newWinsHistoryEntry = completedWins.map((w, i) => ({
            id: w.id || `win-${dataDate}-${i}`,
            date: dataDate,
            text: w.text,
            completed: true,
          }));
          const existingWinsList = currentData.winsList || [];

          const currentReps = currentData.active_commitments || [];
          const carriedReps = currentReps.filter((r) => r.status !== "Committed");

          const completedReps = currentReps.filter((r) => r.status === "Committed");
          const newRepsHistoryEntry = {
            date: dataDate,
            completedCount: completedReps.length,
            items: completedReps.map((r) => ({ id: r.id, text: r.text })),
          };
          const existingRepsHistory = currentData.repsHistory || [];

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

          // Streak
          const currentStreakCount = currentData.streakCount || 0;
          const groundingDone = currentData.groundingRepCompleted ? 1 : 0;
          const winsDone = scorecard.win?.done || 0;
          const repsDone = scorecard.reps?.done || completedReps.length;
          const didActivity = groundingDone > 0 || winsDone > 0 || repsDone > 0;
          
          const todayDateObj = new Date(dataDate + 'T12:00:00');
          const dayOfWeek = todayDateObj.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          
          let newStreakCount = currentStreakCount;
          if (didActivity) {
            newStreakCount = currentStreakCount + 1;
            logger.info(`User ${userId}: Activity detected. Streak: ${currentStreakCount} -> ${newStreakCount}`);
          } else if (isWeekend) {
            logger.info(`User ${userId}: Weekend with no activity. Streak maintained.`);
          } else {
            newStreakCount = 0;
            logger.info(`User ${userId}: Weekday with no activity. Streak reset.`);
          }

          // === PREPARE NEW STATE ===
          const newState = {
            ...currentData,
            date: tomorrow,
            lastUpdated: new Date().toISOString(),
            streakCount: newStreakCount,
            lastStreakDate: dataDate,
            streakHistory: [
              { date: dataDate, streak: newStreakCount, didActivity, isWeekend },
              ...(currentData.streakHistory || []).slice(0, 29)
            ],
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
            morningBookend: {
              ...currentData.morningBookend,
              wins: [...carriedWins, ...Array(3).fill(null)].slice(0, 3).map((w, i) => w || { id: `win-${Date.now()}-${i}`, text: "", completed: false, saved: false }),
              winCompleted: false,
              completedAt: null,
              otherTasks: [],
            },
            active_commitments: carriedReps,
            dailyTargetRepStatus: "Pending",
            eveningBookend: {
              good: "",
              better: "",
              best: "",
              habits: {},
              completedAt: null,
              otherTasks: [],
            },
            scorecard: {
              reps: { done: 0, total: 0, pct: 0 },
              win: { done: 0, total: 0, pct: 0 },
              grounding: { done: 0, total: 1, pct: 0 },
            },
            groundingRepCompleted: false,
          };

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

/**
 * DEBUG USER DATA
 * Dumps the user's daily_practice/current data for inspection.
 * Usage: GET /debugUser
 */
exports.debugUser = onRequest(
  {
    cors: true,
    invoker: "public",
  },
  async (req, res) => {
    try {
      const usersSnapshot = await db.collection("users").get();
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        email: doc.data().email,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName
      }));
      
      res.json({
        count: users.length,
        users
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);
