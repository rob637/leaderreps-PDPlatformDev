const fs = require('fs');

// File 1: DevelopmentJourneyWidget.jsx
let f1 = 'src/components/widgets/DevelopmentJourneyWidget.jsx';
let code1 = fs.readFileSync(f1, 'utf8');

code1 = code1.replace(
  /if \(action\.type === 'coaching' && action\.id\.includes\('one_on_one'\)\)/g,
  "if (action.type === 'coaching' && (action.id.includes('one_on_one') || action.id.includes('1:1') || action.label?.includes('1:1')))"
);
code1 = code1.replace(
  /if \(a\.type === 'coaching' && a\.id\.includes\('one_on_one'\)\)/g,
  "if (a.type === 'coaching' && (a.id.includes('one_on_one') || a.id.includes('1:1') || a.label?.includes('1:1')))"
);

fs.writeFileSync(f1, code1);


// File 2: ThisWeeksActionsWidget.jsx
let f2 = 'src/components/widgets/ThisWeeksActionsWidget.jsx';
let code2 = fs.readFileSync(f2, 'utf8');

code2 = code2.replace(
  /if \(actionId\.includes\('one_on_one'\)\)/g,
  "if (actionId.includes('one_on_one') || actionId.includes('1:1'))"
);
code2 = code2.replace(
  /if \(item\.type === 'coaching' && item\.id\.includes\('one_on_one'\)\)/g,
  "if (item.type === 'coaching' && (item.id.includes('one_on_one') || item.id.includes('1:1') || item.label?.includes('1:1')))"
);

fs.writeFileSync(f2, code2);
console.log('Fixed ID checks in both widgets');

