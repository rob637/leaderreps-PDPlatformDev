const fs = require('fs');
const path = './src/hooks/useDailyPlan.js';
let code = fs.readFileSync(path, 'utf8');

// 1. Extract isLoading from useAppServices
code = code.replace(
  'const { db, user, developmentPlanData, updateDevelopmentPlanData } = useAppServices();',
  'const { db, user, developmentPlanData, updateDevelopmentPlanData, isLoading } = useAppServices();'
);

// 2. Include it in loadingValue
code = code.replace(
  'const loadingValue = loadingPlan || developmentPlanData == null;',
  'const loadingValue = loadingPlan || developmentPlanData == null || isLoading;'
);

fs.writeFileSync(path, code);
console.log("Patched hook!");
