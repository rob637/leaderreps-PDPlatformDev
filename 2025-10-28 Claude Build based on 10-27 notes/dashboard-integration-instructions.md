# Dashboard.jsx Integration Instructions

## Step 1: Add Imports at Top of File (after line 16)

Add these import statements after the existing lucide-react imports:

```javascript
// NEW: Import Bookend Components (added 10/28/25)
import { MorningBookend } from './dashboard/MorningBookend';
import { EveningBookend } from './dashboard/EveningBookend';
```

## Step 2: Add State Variables (around line 907, after existing useState declarations)

Add these new state variables for bookend functionality:

```javascript
  // --- NEW: Bookend State (added 10/28/25 for AM/PM Bookends) ---
  const [morningWIN, setMorningWIN] = useState('');
  const [otherTasks, setOtherTasks] = useState([]);
  const [showLIS, setShowLIS] = useState(false);
  const [reflectionGood, setReflectionGood] = useState('');
  const [reflectionBetter, setReflectionBetter] = useState('');
  const [reflectionBest, setReflectionBest] = useState('');
  const [habitsCompleted, setHabitsCompleted] = useState({
      readLIS: false,
      completedDailyRep: false,
      eveningReflection: false
  });
  const [isSavingBookend, setIsSavingBookend] = useState(false);
```

## Step 3: Add useEffect Hooks to Load Data (around line 950, after existing useEffects)

```javascript
  // --- NEW: Load Morning Bookend data from Firestore ---
  useEffect(() => {
      if (dailyPracticeData?.morningBookend) {
          const mb = dailyPracticeData.morningBookend;
          setMorningWIN(mb.dailyWIN || '');
          setOtherTasks(mb.otherTasks || []);
      }
  }, [dailyPracticeData?.morningBookend]);

  // --- NEW: Load Evening Bookend data from Firestore ---
  useEffect(() => {
      if (dailyPracticeData?.eveningBookend) {
          const eb = dailyPracticeData.eveningBookend;
          setReflectionGood(eb.good || '');
          setReflectionBetter(eb.better || '');
          setReflectionBest(eb.best || '');
          setHabitsCompleted(eb.habits || {
              readLIS: false,
              completedDailyRep: false,
              eveningReflection: false
          });
      }
  }, [dailyPracticeData?.eveningBookend]);
```

## Step 4: Add Handler Functions (around line 1300, after existing handlers)

```javascript
  // --- NEW: Save Morning Bookend (added 10/28/25) ---
  const handleSaveMorningBookend = useCallback(async () => {
      if (!updateDailyPracticeData) {
          console.error("[Dashboard] Cannot save morning bookend: update function missing");
          alert("Error: Unable to save. Please try again.");
          return;
      }
      
      setIsSavingBookend(true);
      console.log("[Dashboard] Saving morning bookend...");
      
      try {
          const updates = {
              morningBookend: {
                  dailyWIN: morningWIN,
                  otherTasks: otherTasks,
                  readLIS: showLIS,
                  completedAt: serverTimestamp()
              }
          };
          
          const success = await updateDailyPracticeData(updates);
          if (success) {
              console.log("[Dashboard] Morning bookend saved successfully");
              // Optional: Trigger a small celebration or toast notification
          } else {
              throw new Error("Update returned false");
          }
      } catch (error) {
          console.error("[Dashboard] Failed to save morning bookend:", error);
          alert("Error saving morning plan. Please try again.");
      } finally {
          setIsSavingBookend(false);
      }
  }, [morningWIN, otherTasks, showLIS, updateDailyPracticeData]);

  // --- NEW: Save Evening Bookend (added 10/28/25) ---
  const handleSaveEveningBookend = useCallback(async () => {
      if (!updateDailyPracticeData) {
          console.error("[Dashboard] Cannot save evening bookend: update function missing");
          alert("Error: Unable to save. Please try again.");
          return;
      }
      
      setIsSavingBookend(true);
      console.log("[Dashboard] Saving evening bookend...");
      
      try {
          const updates = {
              eveningBookend: {
                  good: reflectionGood,
                  better: reflectionBetter,
                  best: reflectionBest,
                  habits: habitsCompleted,
                  completedAt: serverTimestamp()
              }
          };
          
          const success = await updateDailyPracticeData(updates);
          if (success) {
              console.log("[Dashboard] Evening bookend saved successfully");
              // Optional: Update the habits tracker with actual completion
              // Auto-check 'eveningReflection' habit since they just completed it
              setHabitsCompleted(prev => ({
                  ...prev,
                  eveningReflection: true
              }));
          } else {
              throw new Error("Update returned false");
          }
      } catch (error) {
          console.error("[Dashboard] Failed to save evening bookend:", error);
          alert("Error saving reflection. Please try again.");
      } finally {
          setIsSavingBookend(false);
      }
  }, [reflectionGood, reflectionBetter, reflectionBest, habitsCompleted, updateDailyPracticeData]);

  // --- NEW: Task Management Handlers (added 10/28/25) ---
  const handleAddTask = useCallback((taskText) => {
      if (!taskText.trim()) return;
      if (otherTasks.length >= 5) {
          alert("Maximum 5 tasks allowed");
          return;
      }
      
      const newTask = {
          id: `task-${Date.now()}`,
          text: taskText,
          completed: false
      };
      
      setOtherTasks(prev => [...prev, newTask]);
  }, [otherTasks]);

  const handleToggleTask = useCallback((taskId) => {
      setOtherTasks(prev => prev.map(task => 
          task.id === taskId 
              ? { ...task, completed: !task.completed }
              : task
      ));
  }, []);

  const handleRemoveTask = useCallback((taskId) => {
      setOtherTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const handleHabitToggle = useCallback((habitKey, checked) => {
      setHabitsCompleted(prev => ({
          ...prev,
          [habitKey]: checked
      }));
  }, []);
```

## Step 5: Update Main Render Section (around line 1502)

Find the main content grid section and ADD the bookend components. Here's how the structure should look:

```javascript
{/* 2. Main Content Grid */}
<div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

  {/* --- Left Column (Wider) --- */}
  <div className="lg:col-span-3 space-y-6">
    
     {/* NEW: Morning Bookend (controlled by feature flag) */}
     {(featureFlags?.enableBookends || isAdmin) && (
       <MorningBookend 
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
     
     {/* EXISTING: Strategic Focus Card (Target Rep) - KEEP AS IS */}
     <Card title="🎯 Today's Focus Rep" icon={Flag} accent='NAVY'>
        {/* ... existing code ... */}
     </Card>

     {/* EXISTING: Why & Habit Cards - KEEP AS IS */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       <WhyItMattersCard ... />
       <HabitAnchorCard ... />
     </div>

     {/* EXISTING: Additional Daily Reps Card - KEEP AS IS */}
     <Card title={`⏳ Additional Daily Reps ...`} ...>
        {/* ... existing code ... */}
     </Card>

     {/* EXISTING: Social Pod Card - KEEP AS IS */}
     <SocialPodFeed ... />
  </div>

  {/* --- Right Column (Narrower) --- */}
  <div className="lg:col-span-2 space-y-6">
       
       {/* NEW: Evening Bookend (controlled by feature flag) */}
       {(featureFlags?.enableBookends || isAdmin) && (
           <EveningBookend 
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
       
       {/* EXISTING: Embedded Reflection Form - KEEP FOR NOW */}
       {/* Boss wants to discuss if this stays - for now keep both */}
       <EmbeddedReflectionForm ... />
       
       {/* EXISTING: AI Coach Nudge - KEEP AS IS */}
       <AICoachNudge ... />
  </div>
</div>
```

## Important Notes:

1. **Feature Flag Control**: The bookends are controlled by `enableBookends` flag
   - When `enableBookends: false`, regular users don't see them
   - Admins always see them regardless of flag
   
2. **No Deletions**: All existing functionality remains intact

3. **Data Persistence**: 
   - Bookend data saves to Firestore `daily_practice/{userId}/user_state/state`
   - Uses the same update function as other daily practice features
   
4. **Mobile Layout**: On mobile, bookends stack vertically with other cards

5. **Testing**: 
   - Test as admin first (you'll see everything)
   - Toggle `enableBookends` flag in Firestore to test user experience
   - Verify saves are working in Firestore console

## File Structure:

Your components directory should now have:
```
src/
  components/
    screens/
      Dashboard.jsx (modified)
    dashboard/ (NEW folder)
      MorningBookend.jsx (NEW)
      EveningBookend.jsx (NEW)
```

## Firestore Flag Configuration:

To enable/disable bookends for users, update `metadata/config`:

```javascript
{
  featureFlags: {
    enableDevPlan: true,
    enableReadings: true,
    enableCourses: true,
    enableBookends: true,  // <-- Set this to control visibility
    
    // v2 features
    enablePlanningHub: false,
    enableVideos: false,
    enableLabs: false,
    enableRoiReport: false,
    enableCommunity: false
  }
}
```
