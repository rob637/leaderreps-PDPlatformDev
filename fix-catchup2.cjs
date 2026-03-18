const fs = require('fs');
const path = './src/components/widgets/ThisWeeksActionsWidget.jsx';
let code = fs.readFileSync(path, 'utf8');

// Find the line with allCarriedOverComplete
const startIdx = code.indexOf('const allCarriedOverComplete = completedCarriedOver.length === displayedCarriedOverItems.length;');
if (startIdx === -1) {
    console.error("Could not find start index");
    process.exit(1);
}

// Find the end of that block. 
const endStr = `            {/* Current Week Items */}`;
const endIdx = code.indexOf(endStr, startIdx);
if (endIdx === -1) {
    console.error("Could not find end index");
    process.exit(1);
}

const originalBlock = code.substring(startIdx, endIdx);

const newBlock = `const allCarriedOverComplete = completedCarriedOver.length === displayedCarriedOverItems.length;
              
              return (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="flex items-center gap-2">
                      {allCarriedOverComplete ? (
                        <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      )}
                      <span className={\`text-sm font-bold uppercase tracking-wider \${allCarriedOverComplete ? 'text-emerald-800 dark:text-emerald-400' : 'text-teal-800 dark:text-teal-400'}\`}>
                        {allCarriedOverComplete ? 'Catch Up Complete!' : 'Catch Up'}
                      </span>
                    </div>
                    <div className={\`flex-1 h-px \${allCarriedOverComplete ? 'bg-emerald-200 dark:bg-emerald-700' : 'bg-teal-200 dark:bg-teal-700'}\`}></div>
                    <span className={\`text-xs font-medium px-2 py-0.5 rounded-full \${allCarriedOverComplete ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40' : 'text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/40'}\`}>
                      {completedCarriedOver.length}/{displayedCarriedOverItems.length} complete
                    </span>
                  </div>
                  <div className={\`space-y-1 p-3 rounded-xl border \${allCarriedOverComplete ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200/60 dark:border-emerald-700/40' : 'bg-teal-50/50 dark:bg-teal-900/20 border-teal-200/60 dark:border-teal-700/40'}\`}>
                    {displayedCarriedOverItems.map((item, idx) => (
                      <ActionItem key={item.id || \`carried-\${idx}\`} item={item} idx={idx} isCarriedOver={true} />
                    ))}
                  </div>
                </div>
              );
            })()}

`;

code = code.substring(0, startIdx) + newBlock + code.substring(endIdx);
fs.writeFileSync(path, code);
console.log("Successfully patched the file!");
