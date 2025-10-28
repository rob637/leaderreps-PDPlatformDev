/* =========================================================
   BOOKEND STATE & EFFECTS - Copy into Dashboard.jsx
========================================================= */

// ===== STEP 1: ADD STATE VARIABLES =====
// Place around line ~920 (where your other useState declarations are)

  // --- BOOKEND STATE (10/28/25) ---
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


// ===== STEP 2: ADD USEEFFECT HOOKS =====
// Place around line ~950 (after your existing useEffect declarations)

  // --- BOOKEND: Load Morning Data ---
  useEffect(() => {
      if (dailyPracticeData?.morningBookend) {
          const mb = dailyPracticeData.morningBookend;
          setMorningWIN(mb.dailyWIN || '');
          setOtherTasks(mb.otherTasks || []);
      }
  }, [dailyPracticeData?.morningBookend]);

  // --- BOOKEND: Load Evening Data ---
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
