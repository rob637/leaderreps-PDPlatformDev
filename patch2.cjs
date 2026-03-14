const fs = require('fs');
let code = fs.readFileSync('src/components/widgets/DevelopmentJourneyWidget.jsx', 'utf8');

// Patch 1: line 363 (action)
const old1 = `    if (action.id && sessionAttendance[action.id]?.attended === true) {
      return true;
    }`;
const new1 = `    if (action.id) {
      let possibleIds = [action.id];
      if (action.type === 'coaching' && action.id.includes('one_on_one')) {
        possibleIds.push('action-s2-deliberate-practice');
      } else if (action.title?.includes('Session 1')) {
        possibleIds.push('action-s1-deliberate-practice');
      } else if (action.title?.includes('Session 3')) {
        possibleIds.push('action-s3-deliberate-practice');
      }
      for (const pid of possibleIds) {
        if (sessionAttendance[pid]?.attended === true) {
          return true;
        }
      }
    }`;

// Patch 2: line 729 (action inside another func)
const old2 = `      if (action.id && sessionAttendance[action.id]?.attended === true) {
        return true;
      }`;
const new2 = `      if (action.id) {
        let possibleIds = [action.id];
        if (action.type === 'coaching' && action.id.includes('one_on_one')) {
          possibleIds.push('action-s2-deliberate-practice');
        } else if (action.title?.includes('Session 1')) {
          possibleIds.push('action-s1-deliberate-practice');
        } else if (action.title?.includes('Session 3')) {
          possibleIds.push('action-s3-deliberate-practice');
        }
        for (const pid of possibleIds) {
          if (sessionAttendance[pid]?.attended === true) {
            return true;
          }
        }
      }`;

// Patch 3: line 895 (a inside map)
const old3 = `        // Check facilitator-controlled session attendance (Deliberate Practice sessions)
        if (a.id && sessionAttendance[a.id]?.attended === true) {
          return { ...a, isCompleted: true };
        }`;
const new3 = `        // Check facilitator-controlled session attendance (Deliberate Practice sessions)
        if (a.id) {
          let possibleIds = [a.id];
          if (a.type === 'coaching' && a.id.includes('one_on_one')) {
            possibleIds.push('action-s2-deliberate-practice');
          } else if (a.title?.includes('Session 1')) {
            possibleIds.push('action-s1-deliberate-practice');
          } else if (a.title?.includes('Session 3')) {
            possibleIds.push('action-s3-deliberate-practice');
          }
          let isAttended = false;
          for (const pid of possibleIds) {
            if (sessionAttendance[pid]?.attended === true) {
              isAttended = true;
              break;
            }
          }
          if (isAttended) {
            return { ...a, isCompleted: true };
          }
        }`;

code = code.replace(old1, new1);
code = code.replace(old2, new2);
code = code.replace(old3, new3);

fs.writeFileSync('src/components/widgets/DevelopmentJourneyWidget.jsx', code);
console.log('Patched DevelopmentJourneyWidget.jsx');
