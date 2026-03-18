const fs = require('fs');
let code = fs.readFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', 'utf8');

const targetStr = `            ) : isSchedulableCoaching ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>Click to schedule your coaching session • 5 min</span>
              </div>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⏳ Awaiting trainer confirmation
              </p>
            )}
          </div>`;

const newStr = `            ) : isSchedulableCoaching ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Calendar className="w-3 h-3" />
                <span>Click to schedule your coaching session • 5 min</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <span>⏳ Awaiting trainer confirmation</span>
                {(item.estimatedMinutes || item.duration) && (
                  <span>• {item.estimatedMinutes || item.duration} min</span>
                )}
              </div>
            )}
          </div>`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, newStr);
  fs.writeFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', code);
  console.log('Successfully patched trainer-controlled time display.');
} else {
  console.log('Could not find target string in ThisWeeksActionsWidget.jsx');
}
