const fs = require('fs');
let code = fs.readFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', 'utf8');

const targetStr = `    if (item.id && sessionAttendance[item.id]?.attended === true) {
      isCompleted = true;
    } else if (isCoachingCertified) {`;

const newStr = `    let isAttended = false;
    if (item.id) {
      let possibleIds = [item.id];
      if (item.type === 'coaching' && item.id.includes('one_on_one')) possibleIds.push('action-s2-deliberate-practice');
      if (item.title?.includes('Session 1') || item.label?.includes('Session 1')) possibleIds.push('action-s1-deliberate-practice');
      if (item.title?.includes('Session 2') || item.label?.includes('Session 2')) possibleIds.push('action-s2-deliberate-practice');
      if (item.title?.includes('Session 3') || item.label?.includes('Session 3')) possibleIds.push('action-s3-deliberate-practice');
      
      for (const pid of possibleIds) {
        if (sessionAttendance[pid]?.attended === true) {
          isAttended = true;
          break;
        }
      }
    }

    if (isAttended) {
      isCompleted = true;
    } else if (isCoachingCertified) {`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', code);
  console.log('Successfully patched ThisWeeksActionsWidget.jsx again.');
} else {
  console.log('Could not find target string. Here is the block:');
  const lines = code.split('\n');
  for(let i=2360-5; i<2360+5; i++) console.log(lines[i]);
}
