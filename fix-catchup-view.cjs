const fs = require('fs');
const path = './src/components/widgets/ThisWeeksActionsWidget.jsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `              const allCarriedOverComplete = completedCarriedOver.length === displayedCarriedOverItems.length;
              
              return allCarriedOverComplete ? (
                <div className="mb-4">
                  <button
                    onClick={() => setPriorWeekExpanded(!priorWeekExpanded)}
                    className="w-full group flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-800/50 transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Carry Forward Complete!</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        All {displayedCarriedOverItems.length} carried-over {displayedCarriedOverItems.length === 1 ? 'task' : 'tasks'} finished
                      </p>
                    </div>
                    <div className="flex-shrink-0 p-2 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                      {priorWeekExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  {priorWeekExpanded && (
                    <div className="mt-2 space-y-1 p-3 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                      {displayedCarriedOverItems.map((item, idx) => (
                        <ActionItem key={item.id || \`carried-\${idx}\`} item={item} idx={idx} isCarriedOver={true} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span className="text-sm font-bold text-teal-800 dark:text-teal-400 uppercase tracking-wider">Catch Up</span>
                    </div>
                    <div className="flex-1 h-px bg-teal-200 dark:bg-teal-700"></div>
                    <span className="text-xs font-medium text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-900/40 px-2 py-0.5 rounded-full">
                      {completedCarriedOver.length}/{displayedCarriedOverItems.length} complete
                    </span>
                  </div>
                  <div className="space-y-1 p-3 bg-teal-50/50 dark:bg-teal-900/20 rounded-xl border border-teal-200/60 dark:border-teal-700/40">
                    {displayedCarriedOverItems.map((item, idx) => (
                      <ActionItem key={item.id || \`carried-\${idx}\`} item={item} idx={idx} isCarriedOver={true} />
                    ))}
                  </div>
                </div>
              );`;

const replacement = `              const allCarriedOverComplete = completedCarriedOver.length === displayedCarriedOverItems.length;
              
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
              );`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacement);
  fs.writeFileSync(path, code);
  console.log("Successfully patched Catch Up UI!");
} else {
  console.error("Target string not found. Please review the file content.");
}
