const fs = require('fs');
const path = './src/components/widgets/ThisWeeksActionsWidget.jsx';
let content = fs.readFileSync(path, 'utf8');

const search = `const dateStr = reg?.sessionDate ? new Date(reg.sessionDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';`;

const replace = `let dateStr = '';
              if (reg?.sessionDate) {
                let d;
                if (typeof reg.sessionDate === 'string' && reg.sessionDate.includes('-') && reg.sessionDate.length === 10) {
                  const [y, m, day] = reg.sessionDate.split('-');
                  d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(day, 10));
                } else {
                  d = new Date(reg.sessionDate);
                }
                dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
              }`;

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync(path, content);
} else {
    console.log("Not found.");
}
