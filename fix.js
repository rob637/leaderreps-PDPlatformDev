const fs = require('fs');
const path = './src/components/widgets/ThisWeeksActionsWidget.jsx';
let c = fs.readFileSync(path, 'utf8');
const search = 'const reg = getRegistrationForCoachingItem(item.id);';
const repl = `let lookupId = item.id;
              if (item.id && ((!item.id.includes('milestone') || item.id.startsWith('daily')) && item.sessionType === 'one_on_one')) {
                // HOTFIX: Daily plan often generates ids like 'daily-milestone-1-...' but registrations map to 'milestone-1-coaching-one_on_one'
                // Use a regex to extract the milestone number from the daily plan id if possible
                const mMatch = item.id.match(/milestone-(\\d+)/);
                const mNum = mMatch ? mMatch[1] : (currentMilestone || 1);
                lookupId = \`milestone-\${mNum}-coaching-one_on_one\`;
              }
              const reg = getRegistrationForCoachingItem(lookupId) || getRegistrationForCoachingItem(item.id);`;

c = c.replace(search, repl);
c = c.replace(search, repl);
fs.writeFileSync(path, c);
