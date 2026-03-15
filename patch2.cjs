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
              return false;
            }`;

// Need to also re-apply the previous fix for trainer controlled.
const t3 = `            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⏳ Awaiting trainer confirmation
              </p>
            )}`;

const n3 = `            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <span>⏳ Awaiting trainer confirmation</span>
                {(item.estimatedMinutes || item.duration) && (
                  <span>• {item.estimatedMinutes || item.duration} min</span>
                )}
              </div>
            )}`;

if (code.includes(t2)) code = code.replace(t2, n2);
if (code.includes(t3)) code = code.replace(t3, n3);

fs.writeFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', code);
console.log("Patched");
