const fs = require('fs');
const file = 'src/components/widgets/ThisWeeksActionsWidget.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      const MILESTONE_SESSION_LABELS = {
        2: 'Attend 1:1 Coaching',
        3: 'Session 3: Attend Open Gym Redirecting Feedback',
        4: 'Session 4: Attend Open Gym Handling Pushback',
        5: 'Session 5: Graduation'
      };`;

const replacement = `      const MILESTONE_SESSION_LABELS = {
        2: '1:1 Coaching',
        3: 'Open Gym: Redirecting Feedback',
        4: 'Open Gym: Handling Pushback',
        5: 'Graduation'
      };`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacement);
    fs.writeFileSync(file, content);
    console.log("Patched ThisWeeksActionsWidget.jsx");
} else {
    console.log("Could not find the target string!");
}
