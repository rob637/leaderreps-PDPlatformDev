const fs = require('fs');
const file = 'src/components/widgets/ThisWeeksActionsWidget.jsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `            } else if (!p && item.isInteractive) {
              // Interactive items (like Set Notifications) don't create action_progress docs.
              // If they are complete but ended up in Catch Up, they are mostly artifacts of the loading race condition.
              // We just hide them instantly upon completion.
              return false;
            }`;

const replaceStr = `            }`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replaceStr);
    fs.writeFileSync(file, content);
    console.log("Reverted exactly!");
} else {
    console.log("Nope.");
}
