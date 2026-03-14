const now = new Date();
console.log('Current date (ISO):', now.toISOString());
console.log('Current date (local):', now.toString());
console.log('');

// Method used when CREATING reps (from earlier output showing 2026-W11)
function creationWeekId() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now - startOfYear;
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const weekNumber = Math.ceil((diff / oneWeek) + startOfYear.getDay() / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Method from simulate-dashboard (getCurrentWeekId from conditioningService)
function dashboardWeekId() {
  const now = new Date();
  const jan4 = new Date(now.getFullYear(), 0, 4);
  const daysSinceJan4 = Math.floor((now - jan4) / 86400000);
  const weekNumber = Math.ceil((daysSinceJan4 + jan4.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

console.log('Creation method weekId:', creationWeekId());
console.log('Dashboard method weekId:', dashboardWeekId());
