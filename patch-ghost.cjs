const fs = require('fs');
let code = fs.readFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', 'utf8');

const t2 = `            if (p?.status === 'completed') {
              const completedInPrepPhase = (p.completedInWeek == null || p.completedInWeek === 0) && p.carriedOver !== true;
              if (completedInPrepPhase) return false; // Hide it (it's a prep-phase ghost)
            }`;

const n2 = `            if (p?.status === 'completed') {
              const completedInPrepPhase = (p.completedInWeek == null || p.completedInWeek === 0) && p.carriedOver !== true;
              if (completedInPrepPhase) return false; // Hide it (it's a prep-phase ghost)
            } else if (!p && (item.type === 'interactive' || item.type === 'form' || 
                       ['leader-profile', 'baseline-assessment', 'notification-setup', 'foundation-commitment', 'conditioning-tutorial'].includes(item.handlerType))) {
              // Custom onboarding items do not use progressData, so we can't tell if they were
              // completed in Prep or Catch Up. To prevent permanent ghosts, we must hide them.
              return false;
            }`;

if (code.includes(t2)) {
    code = code.replace(t2, n2);
    fs.writeFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', code);
    console.log("Replaced");
} else {
    console.log("Could not find block");
}
