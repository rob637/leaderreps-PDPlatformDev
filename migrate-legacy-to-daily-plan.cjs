// migrate-legacy-to-daily-plan.cjs
// Migrates Legacy Plan (development_plan_v1) data to Daily Plan (daily_plan_v1)
// Run with: node migrate-legacy-to-daily-plan.cjs

const admin = require('firebase-admin');
const serviceAccount = require('./leaderreps-pd-platform-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Day mapping:
// Prep Phase: Days 1-14 (Weeks -2 to 0)
// Dev Phase: Days 15-70 (Weeks 1-8) - 7 days per week
// Post Phase: Days 71+ (Weeks 9+)

// Week N in legacy plan → Day 15 + (N-1)*7 to Day 14 + N*7
// Week 1: Days 15-21
// Week 2: Days 22-28
// etc.

function getWeekStartDay(weekNumber) {
  if (weekNumber <= 0) {
    // Prep phase
    return 1 + (weekNumber + 2) * 7;
  }
  // Dev/Post phase
  return 15 + (weekNumber - 1) * 7;
}

async function migrateData() {
  console.log('🚀 Starting Legacy Plan → Daily Plan Migration\n');
  
  try {
    // 1. Load all legacy weeks
    const legacySnap = await db.collection('development_plan_v1')
      .orderBy('weekNumber', 'asc')
      .get();
    
    console.log(`📚 Found ${legacySnap.size} legacy weeks\n`);
    
    // 2. Load existing daily plan days
    const dailySnap = await db.collection('daily_plan_v1')
      .orderBy('dayNumber', 'asc')
      .get();
    
    const existingDays = new Map();
    dailySnap.docs.forEach(doc => {
      existingDays.set(doc.data().dayNumber, { id: doc.id, ...doc.data() });
    });
    
    console.log(`📅 Found ${existingDays.size} existing daily plan days\n`);
    
    // 3. Process each legacy week
    const batch = db.batch();
    let updateCount = 0;
    
    for (const legacyDoc of legacySnap.docs) {
      const weekData = legacyDoc.data();
      const weekNumber = weekData.weekNumber;
      
      console.log(`\n📋 Processing Week ${weekNumber}: "${weekData.title}"`);
      console.log(`   Focus: ${weekData.focus || 'N/A'}`);
      console.log(`   Phase: ${weekData.phase || 'N/A'}`);
      
      // Calculate first day of this week
      const firstDayNumber = getWeekStartDay(weekNumber);
      
      // Get or create the first day of the week to attach weekly resources
      const firstDayKey = firstDayNumber;
      let firstDay = existingDays.get(firstDayKey);
      
      if (!firstDay) {
        console.log(`   ⚠️ Day ${firstDayKey} doesn't exist - will create`);
        firstDay = {
          dayNumber: firstDayKey,
          weekNumber: weekNumber,
          title: `Day ${firstDayKey}`,
          focus: '',
          isWeekend: false,
          actions: [],
          dashboard: {}
        };
      }
      
      // Build weekly resources from legacy data
      const weeklyResources = {
        // From legacy week
        weekTitle: weekData.title,
        weekFocus: weekData.focus,
        weekPhase: weekData.phase,
        weekDescription: weekData.description,
        
        // Content arrays
        weeklyContent: weekData.content || [],
        weeklyCommunity: weekData.community || [],
        weeklyCoaching: weekData.coaching || [],
        weeklyWorkouts: weekData.workouts || [],
        weeklyTools: weekData.tools || [],
        
        // Daily reps (these should be daily tasks)
        weeklyDailyReps: weekData.dailyReps || [],
        
        // Skills & pillars
        weekSkills: weekData.skills || [],
        weekPillars: weekData.pillars || [],
        
        // Metadata
        difficultyLevel: weekData.difficultyLevel,
        estimatedTimeMinutes: weekData.estimatedTimeMinutes
      };
      
      // Count resources
      const resourceCount = 
        weeklyResources.weeklyContent.length +
        weeklyResources.weeklyCommunity.length +
        weeklyResources.weeklyCoaching.length +
        weeklyResources.weeklyWorkouts.length +
        weeklyResources.weeklyTools.length;
      
      console.log(`   📦 Resources: ${resourceCount} total`);
      console.log(`      - Content: ${weeklyResources.weeklyContent.length}`);
      console.log(`      - Community: ${weeklyResources.weeklyCommunity.length}`);
      console.log(`      - Coaching: ${weeklyResources.weeklyCoaching.length}`);
      console.log(`      - Workouts: ${weeklyResources.weeklyWorkouts.length}`);
      console.log(`      - Tools: ${weeklyResources.weeklyTools.length}`);
      
      // Update all 7 days in this week with weekly context
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const dayNumber = firstDayNumber + dayOffset;
        const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][dayOffset];
        const isWeekend = dayOffset >= 5;
        
        let dayData = existingDays.get(dayNumber);
        const isNew = !dayData;
        
        if (isNew) {
          // Create new day
          dayData = {
            dayNumber,
            weekNumber,
            title: isWeekend ? `${dayOfWeek} (Rest)` : `Day ${dayNumber}`,
            focus: '',
            isWeekend,
            actions: [],
            dashboard: {
              'prep-welcome-banner': false,
              'am-bookend-header': true,
              'weekly-focus': true,
              'grounding-rep': true,
              'win-the-day': true,
              'daily-reps': true,
              'pm-bookend-header': true,
              'pm-bookend': true,
              'habit-stack': true
            }
          };
        }
        
        // Add weekly context to ALL days in the week
        dayData.weeklyResources = weeklyResources;
        
        // For the FIRST day of the week, also update the title/focus to reflect the week start
        if (dayOffset === 0 && weekData.title) {
          dayData.title = dayData.title || `Week ${weekNumber} Start: ${weekData.title}`;
          dayData.focus = dayData.focus || weekData.focus || '';
        }
        
        // Create actions from weekly content on the first day
        if (dayOffset === 0 && resourceCount > 0) {
          const existingActions = dayData.actions || [];
          
          // Add content as actions (if not already present)
          weeklyResources.weeklyContent.forEach((item, idx) => {
            // Handle both object and string formats
            const itemObj = typeof item === 'string' ? { name: item } : item;
            const actionId = `week${weekNumber}-content-${idx}`;
            if (!existingActions.find(a => a.id === actionId)) {
              existingActions.push({
                id: actionId,
                type: 'content',
                label: itemObj.title || itemObj.name || `Content ${idx + 1}`,
                resourceId: itemObj.id || null,
                resourceTitle: itemObj.title || itemObj.name || null,
                resourceType: itemObj.type || 'video',
                enabled: true,
                required: itemObj.required !== false
              });
            }
          });
          
          // Add workouts as actions
          weeklyResources.weeklyWorkouts.forEach((item, idx) => {
            const itemObj = typeof item === 'string' ? { name: item } : item;
            const actionId = `week${weekNumber}-workout-${idx}`;
            if (!existingActions.find(a => a.id === actionId)) {
              existingActions.push({
                id: actionId,
                type: 'workout',
                label: itemObj.title || itemObj.name || `Workout ${idx + 1}`,
                resourceId: itemObj.id || null,
                resourceTitle: itemObj.title || itemObj.name || null,
                resourceType: 'workout',
                enabled: true,
                required: true
              });
            }
          });
          
          // Add tools as actions
          weeklyResources.weeklyTools.forEach((item, idx) => {
            const itemObj = typeof item === 'string' ? { name: item } : item;
            const actionId = `week${weekNumber}-tool-${idx}`;
            if (!existingActions.find(a => a.id === actionId)) {
              existingActions.push({
                id: actionId,
                type: 'tool',
                label: itemObj.title || itemObj.name || `Tool ${idx + 1}`,
                resourceId: itemObj.id || null,
                resourceTitle: itemObj.title || itemObj.name || null,
                resourceType: 'tool',
                enabled: true,
                required: false
              });
            }
          });
          
          dayData.actions = existingActions;
        }
        
        // Save to batch
        const dayDocId = `day-${String(dayNumber).padStart(3, '0')}`;
        const ref = db.collection('daily_plan_v1').doc(dayDocId);
        
        batch.set(ref, {
          ...dayData,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        updateCount++;
      }
      
      console.log(`   ✅ Created/updated 7 days (Day ${firstDayNumber} - ${firstDayNumber + 6})`);
    }
    
    // 4. Commit the batch
    console.log(`\n💾 Committing ${updateCount} day updates...`);
    await batch.commit();
    
    console.log('\n✅ Migration complete!');
    console.log(`   - ${legacySnap.size} weeks processed`);
    console.log(`   - ${updateCount} days created/updated`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateData();
