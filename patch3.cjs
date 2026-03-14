const fs = require('fs');
let code = fs.readFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', 'utf8');

const old1 = `      if (actionId && sessionAttendance[actionId]?.attended === true) {
        return true;
      }`;
const new1 = `      if (actionId) {
        let possibleIds = [actionId];
        if (actionId.includes('one_on_one')) possibleIds.push('action-s2-deliberate-practice');
        if (actionId.includes('practice-session-1')) possibleIds.push('action-s1-deliberate-practice');
        for (const pid of possibleIds) {
          if (sessionAttendance[pid]?.attended === true) return true;
        }
      }`;

const old2 = `      if (item.id && sessionAttendanceData[item.id]?.attended === true) {
        return true;
      }`;
const new2 = `      if (item.id) {
        let possibleIds = [item.id];
        if (item.type === 'coaching' && item.id.includes('one_on_one')) possibleIds.push('action-s2-deliberate-practice');
        if (item.title?.includes('Session 1')) possibleIds.push('action-s1-deliberate-practice');
        if (item.title?.includes('Session 3')) possibleIds.push('action-s3-deliberate-practice');
        for (const pid of possibleIds) {
          if (sessionAttendanceData[pid]?.attended === true) return true;
        }
      }`;

const old3 = `                if (item.id && sessionAttendanceData[item.id]?.attended === true) {
                  isCompleted = true;
                }`;
const new3 = `                if (item.id) {
                  let possibleIds = [item.id];
                  if (item.type === 'coaching' && item.id.includes('one_on_one')) possibleIds.push('action-s2-deliberate-practice');
                  if (item.title?.includes('Session 1')) possibleIds.push('action-s1-deliberate-practice');
                  if (item.title?.includes('Session 3')) possibleIds.push('action-s3-deliberate-practice');
                  for (const pid of possibleIds) {
                    if (sessionAttendanceData[pid]?.attended === true) {
                      isCompleted = true;
                      break;
                    }
                  }
                }`;

code = code.replace(old1, new1);
code = code.replace(old2, new2);
code = code.replace(old3, new3);

fs.writeFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', code);
console.log('Patched ThisWeeksActionsWidget.jsx');
