const fs = require('fs');
const filePath = 'src/components/admin/SessionAttendanceQueue.jsx';
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  `    name: 'Session 3: Open Gym',`,
  `    name: 'Session 3: Open Gym Redirecting Feedback',`
);

code = code.replace(
  `    name: 'Session 4: Open Gym',`,
  `    name: 'Session 4: Open Gym Handling Pushback',`
);

fs.writeFileSync(filePath, code);
console.log('Patched SessionAttendanceQueue.jsx');
