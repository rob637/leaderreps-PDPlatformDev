// Test the ACTUAL getCurrentWeekId from conditioningService
const now = new Date();
console.log('Current date:', now.toISOString());

// Copy of actual getCurrentWeekId from conditioningService.js (lines 206-221)
const getCurrentWeekId = (date = null) => {
  const d = date || now;
  
  // Get the Sunday of the current week
  const sunday = new Date(d);
  const dayOfWeek = sunday.getDay(); // 0 = Sunday
  sunday.setDate(sunday.getDate() - dayOfWeek);
  sunday.setHours(0, 0, 0, 0);
  
  // Calculate ISO week number (adjusted for Sunday start)
  const startOfYear = new Date(sunday.getFullYear(), 0, 1);
  const days = Math.floor((sunday - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${sunday.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

console.log('Actual getCurrentWeekId():', getCurrentWeekId());

// Also test for March 9 (when reps were created)
const march9 = new Date('2026-03-09T12:00:00Z');
console.log('getCurrentWeekId(March 9):', getCurrentWeekId(march9));
