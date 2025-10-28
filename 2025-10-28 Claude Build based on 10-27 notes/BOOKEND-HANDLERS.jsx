/* =========================================================
   BOOKEND HANDLERS - Copy these into Dashboard.jsx
   Place around line ~1300 (after your existing handlers, before the return statement)
========================================================= */

  // --- BOOKEND: Save Morning Bookend ---
  const handleSaveMorningBookend = useCallback(async () => {
      if (!updateDailyPracticeData) {
          console.error("[Dashboard] Cannot save morning bookend");
          alert("Error: Unable to save. Please try again.");
          return;
      }
      
      setIsSavingBookend(true);
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
          if (!success) throw new Error("Update failed");
          console.log("[Dashboard] Morning bookend saved");
      } catch (error) {
          console.error("[Dashboard] Error saving morning bookend:", error);
          alert("Error saving morning plan. Please try again.");
      } finally {
          setIsSavingBookend(false);
      }
  }, [morningWIN, otherTasks, showLIS, updateDailyPracticeData]);

  // --- BOOKEND: Save Evening Bookend ---
  const handleSaveEveningBookend = useCallback(async () => {
      if (!updateDailyPracticeData) {
          console.error("[Dashboard] Cannot save evening bookend");
          alert("Error: Unable to save. Please try again.");
          return;
      }
      
      setIsSavingBookend(true);
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
          if (!success) throw new Error("Update failed");
          
          // Auto-check evening reflection habit
          setHabitsCompleted(prev => ({ ...prev, eveningReflection: true }));
          console.log("[Dashboard] Evening bookend saved");
      } catch (error) {
          console.error("[Dashboard] Error saving evening bookend:", error);
          alert("Error saving reflection. Please try again.");
      } finally {
          setIsSavingBookend(false);
      }
  }, [reflectionGood, reflectionBetter, reflectionBest, habitsCompleted, updateDailyPracticeData]);

  // --- BOOKEND: Task Management ---
  const handleAddTask = useCallback((taskText) => {
      if (!taskText.trim()) return;
      if (otherTasks.length >= 5) {
          alert("Maximum 5 tasks allowed");
          return;
      }
      setOtherTasks(prev => [...prev, { 
          id: `task-${Date.now()}`, 
          text: taskText, 
          completed: false 
      }]);
  }, [otherTasks]);

  const handleToggleTask = useCallback((taskId) => {
      setOtherTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, completed: !task.completed } : task
      ));
  }, []);

  const handleRemoveTask = useCallback((taskId) => {
      setOtherTasks(prev => prev.filter(task => task.id !== taskId));
  }, []);

  const handleHabitToggle = useCallback((habitKey, checked) => {
      setHabitsCompleted(prev => ({ ...prev, [habitKey]: checked }));
  }, []);
