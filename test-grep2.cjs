const fs = require('fs');
const content = fs.readFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('.attended === true')) {
    console.log(i + 1, l);
  }
});
