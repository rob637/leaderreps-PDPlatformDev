const fs = require('fs');
const path = './src/components/widgets/CoachingMySessionsWidget.jsx';
let content = fs.readFileSync(path, 'utf8');

const search = `const formatSessionDate = (dateString) => {
  if (!dateString) return 'TBD';
  const date = new Date(dateString);`;

const replace = `// Helper to parse YYYY-MM-DD as local date instead of UTC
const parseLocalDate = (dateString) => {
  if (!dateString) return null;
  if (typeof dateString === 'string' && dateString.includes('-') && dateString.length === 10) {
    const [year, month, day] = dateString.split('-');
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  }
  return new Date(dateString);
};

const formatSessionDate = (dateString) => {
  if (!dateString) return 'TBD';
  const date = parseLocalDate(dateString);`;

// Also need to fix the 'isToday' check in RegistrationCard if it uses new Date(registration.sessionDate)
// 'const isToday = registration.sessionDate && new Date(registration.sessionDate).toDateString() === new Date().toDateString();'
const search2 = `const isToday = registration.sessionDate && new Date(registration.sessionDate).toDateString() === new Date().toDateString();`;
const replace2 = `const isToday = registration.sessionDate && parseLocalDate(registration.sessionDate).toDateString() === new Date().toDateString();`;

if (content.includes(search)) content = content.replace(search, replace);
if (content.includes(search2)) content = content.replace(search2, replace2);

fs.writeFileSync(path, content);
