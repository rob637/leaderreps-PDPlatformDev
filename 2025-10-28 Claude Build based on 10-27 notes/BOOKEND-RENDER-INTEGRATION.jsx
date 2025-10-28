/* =========================================================
   BOOKEND RENDER INTEGRATION - Update your main return statement
========================================================= */

// In your Dashboard component's return statement, find the main content grid.
// It should look something like this around line ~1500:

<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

  {/* --- Left Column (Wider) --- */}
  <div className="lg:col-span-3 space-y-6">
    
     {/* ============ ADD THIS FIRST (Morning Bookend) ============ */}
     {(featureFlags?.enableBookends !== false) && (
       <MorningBookendInline 
           dailyWIN={morningWIN}
           setDailyWIN={setMorningWIN}
           otherTasks={otherTasks}
           onAddTask={handleAddTask}
           onToggleTask={handleToggleTask}
           onRemoveTask={handleRemoveTask}
           showLIS={showLIS}
           setShowLIS={setShowLIS}
           identityStatement={identityStatement}
           onSave={handleSaveMorningBookend}
           isSaving={isSavingBookend}
       />
     )}
     {/* ============ END MORNING BOOKEND ============ */}
     
     {/* Your existing Strategic Focus Card (Target Rep) stays here */}
     <Card title="🎯 Today's Focus Rep" icon={Flag} accent='NAVY'>
        {/* ... existing code ... */}
     </Card>

     {/* Your existing Why It Matters and Habit Anchor cards stay here */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       {/* WhyItMattersCard */}
       {/* HabitAnchorCard */}
     </div>

     {/* Your existing Additional Daily Reps card stays here */}
     <Card title={`⏳ Additional Daily Reps ...`}>
        {/* ... existing code ... */}
     </Card>

     {/* Your existing Social Pod Feed stays here */}
     {/* SocialPodFeed component */}
  </div>

  {/* --- Right Column (Narrower) --- */}
  <div className="lg:col-span-2 space-y-6">
       
       {/* ============ ADD THIS FIRST (Evening Bookend) ============ */}
       {(featureFlags?.enableBookends !== false) && (
           <EveningBookendInline 
               reflectionGood={reflectionGood}
               setReflectionGood={setReflectionGood}
               reflectionBetter={reflectionBetter}
               setReflectionBetter={setReflectionBetter}
               reflectionBest={reflectionBest}
               setReflectionBest={setReflectionBest}
               habitsCompleted={habitsCompleted}
               onHabitToggle={handleHabitToggle}
               onSave={handleSaveEveningBookend}
               isSaving={isSavingBookend}
           />
       )}
       {/* ============ END EVENING BOOKEND ============ */}
       
       {/* Your existing Embedded Reflection Form stays here */}
       <EmbeddedReflectionForm ... />
       
       {/* Your existing AI Coach Nudge stays here */}
       <AICoachNudge ... />
  </div>
</div>


/* =========================================================
   IMPORTANT NOTES:
========================================================= */

1. **Feature Flag Control**: 
   - Bookends show when `enableBookends` is true (or undefined)
   - Set to false in Firestore to hide them: metadata/config → featureFlags.enableBookends = false

2. **Data Persistence**:
   - Morning bookend saves to: dailyPracticeData.morningBookend
   - Evening bookend saves to: dailyPracticeData.eveningBookend
   - Uses your existing updateDailyPracticeData function

3. **Identity Statement**:
   - Uses your existing `identityStatement` variable
   - Should already be available from dailyPracticeData

4. **No Deletions**:
   - All your existing cards remain exactly as they are
   - Bookends are additive only

5. **Mobile Layout**:
   - On mobile, everything stacks vertically
   - Morning bookend will be first
   - Evening bookend in the middle
   - Existing cards after
