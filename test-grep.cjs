const fs = require('fs');
const content = fs.readFileSync('src/components/widgets/DevelopmentJourneyWidget.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('if (action.id && sessionAttendance[action.id]?.attended === true) {')) {
    console.log(i + 1, l);
  }
  if (l.includes('if (a.id && sessionAttendance[a.id]?.attended === true) {')) {
    console.log(i + 1, l);
  }
});
