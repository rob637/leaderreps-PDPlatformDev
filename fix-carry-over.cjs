const fs = require('fs');
let code = fs.readFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', 'utf8');

code = code.replace(
  `  const { \n    dailyPlan, \n    currentPhase, \n    phaseDayNumber, \n    toggleItemComplete: toggleDailyItem,\n    userState,\n    prepRequirementsComplete\n  } = useDailyPlan();`,
  `  const { \n    loading: planLoading,\n    dailyPlan, \n    currentPhase, \n    phaseDayNumber, \n    toggleItemComplete: toggleDailyItem,\n    userState,\n    prepRequirementsComplete\n  } = useDailyPlan();`
);

code = code.replace(
  `  const carriedOverItems = useMemo(() => {\n    // No carryover in Prep Phase\n    if (currentPhase?.id === 'pre-start') return [];`,
  `  const carriedOverItems = useMemo(() => {\n    // No carryover if data is still loading (prevents capturing ghosts due to race condition!)\n    if (planLoading) return [];\n    // No carryover in Prep Phase\n    if (currentPhase?.id === 'pre-start') return [];`
);

code = code.replace(
  `prepRequirementsComplete?.items]);`,
  `prepRequirementsComplete?.items, planLoading]);`
);

fs.writeFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', code);
console.log("Patched");
