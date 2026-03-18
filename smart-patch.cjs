const fs = require('fs');
let code = fs.readFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', 'utf8');

const t2 = `            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⏳ Awaiting trainer confirmation
              </p>
            )}`;

const n2 = `            ) : (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <span>⏳ Awaiting trainer confirmation</span>
                {(item.estimatedMinutes || item.duration) && (
                  <span>• {item.estimatedMinutes || item.duration} min</span>
                )}
              </div>
            )}`;

if (code.includes(t2)) {
    code = code.replace(t2, n2);
    fs.writeFileSync('src/components/widgets/ThisWeeksActionsWidget.jsx', code);
    console.log("Replaced");
} else {
    console.log("Could not find");
}
