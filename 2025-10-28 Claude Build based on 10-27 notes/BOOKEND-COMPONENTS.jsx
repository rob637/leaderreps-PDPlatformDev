/* =========================================================
   BOOKEND COMPONENTS - Copy these into Dashboard.jsx
   Place after line ~150 (after StreakTracker, before main Dashboard component)
========================================================= */

/* Morning Bookend Component */
const MorningBookendInline = ({ 
    dailyWIN, setDailyWIN, otherTasks, onAddTask, onToggleTask, onRemoveTask,
    showLIS, setShowLIS, identityStatement, onSave, isSaving
}) => {
    const [newTaskText, setNewTaskText] = useState('');
    
    const handleAddClick = () => {
        if (newTaskText.trim()) { onAddTask(newTaskText); setNewTaskText(''); }
    };
    const handleKeyPress = (e) => { if (e.key === 'Enter') handleAddClick(); };
    
    return (
        <Card title="☀️ Morning Bookend" icon={Sunrise} accent='ORANGE'>
            <div className="mb-6">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.TEXT }}>
                    <Target className="w-4 h-4 mr-1" style={{ color: COLORS.ORANGE }} />
                    Today's WIN (What's Important Now)
                </label>
                <textarea 
                    value={dailyWIN} onChange={(e) => setDailyWIN(e.target.value)}
                    placeholder="What is the ONE thing that must get done today?"
                    className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: COLORS.SUBTLE }} rows={2}
                />
            </div>

            <div className="mb-6">
                <label className="text-sm font-semibold mb-2 flex items-center justify-between" style={{ color: COLORS.TEXT }}>
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" style={{ color: COLORS.TEAL }} />
                        Other Important Tasks ({otherTasks.length}/5)
                    </span>
                </label>
                
                <div className="space-y-2 mb-3">
                    {otherTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 border" style={{ borderColor: COLORS.SUBTLE }}>
                            <input type="checkbox" checked={task.completed} onChange={() => onToggleTask(task.id)}
                                className="w-4 h-4 flex-shrink-0" style={{ accentColor: COLORS.TEAL }}
                            />
                            <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                {task.text}
                            </span>
                            <button onClick={() => onRemoveTask(task.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Remove task">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                
                {otherTasks.length < 5 && (
                    <div className="flex gap-2">
                        <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyPress={handleKeyPress} placeholder="Add another task..."
                            className="flex-1 p-2 text-sm border rounded-lg focus:ring-2 transition-all"
                            style={{ borderColor: COLORS.SUBTLE }}
                        />
                        <Button onClick={handleAddClick} variant="outline" size="sm" disabled={!newTaskText.trim()}>
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <button onClick={() => setShowLIS(!showLIS)}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80 w-full"
                    style={{ color: COLORS.TEAL }}>
                    <User className="w-4 h-4" />
                    {showLIS ? 'Hide' : 'Read'} Leadership Identity Statement
                    {showLIS ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showLIS && (
                    <div className="mt-3 p-4 rounded-lg border" 
                         style={{ backgroundColor: `${COLORS.TEAL}10`, borderColor: `${COLORS.TEAL}30` }}>
                        <p className="text-sm italic" style={{ color: COLORS.TEXT }}>{identityStatement}</p>
                    </div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <Button onClick={onSave} disabled={isSaving} variant="primary" size="md" className="w-full">
                    {isSaving ? <><Loader className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 
                               <><Save className="w-5 h-5 mr-2" />Save Morning Plan</>}
                </Button>
            </div>
        </Card>
    );
};

/* Evening Bookend Component */
const EveningBookendInline = ({ 
    reflectionGood, setReflectionGood, reflectionBetter, setReflectionBetter,
    reflectionBest, setReflectionBest, habitsCompleted, onHabitToggle, onSave, isSaving
}) => {
    return (
        <Card title="🌙 Evening Bookend" icon={Moon} accent='NAVY'>
            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.GREEN }}>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Good - What went well today?
                </label>
                <textarea value={reflectionGood} onChange={(e) => setReflectionGood(e.target.value)}
                    placeholder="Celebrate your wins..." className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: `${COLORS.GREEN}40` }} rows={2}
                />
            </div>

            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.AMBER }}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Better - What needs improvement?
                </label>
                <textarea value={reflectionBetter} onChange={(e) => setReflectionBetter(e.target.value)}
                    placeholder="Areas for growth..." className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: `${COLORS.AMBER}40` }} rows={2}
                />
            </div>

            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: COLORS.BLUE }}>
                    <Star className="w-4 h-4 mr-1" />
                    Best - What do I need to do to show up as my best tomorrow?
                </label>
                <textarea value={reflectionBest} onChange={(e) => setReflectionBest(e.target.value)}
                    placeholder="Tomorrow's commitment..." className="w-full p-3 border rounded-lg focus:ring-2 transition-all"
                    style={{ borderColor: `${COLORS.BLUE}40` }} rows={2}
                />
            </div>

            <div className="pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <p className="text-sm font-semibold mb-3" style={{ color: COLORS.TEXT }}>Daily Habits Tracker</p>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={habitsCompleted.readLIS}
                            onChange={(e) => onHabitToggle('readLIS', e.target.checked)}
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Read LIS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={habitsCompleted.completedDailyRep}
                            onChange={(e) => onHabitToggle('completedDailyRep', e.target.checked)}
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Complete Daily Rep</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input type="checkbox" checked={habitsCompleted.eveningReflection}
                            onChange={(e) => onHabitToggle('eveningReflection', e.target.checked)}
                            className="w-4 h-4" style={{ accentColor: COLORS.TEAL }}
                        />
                        <span className="text-sm" style={{ color: COLORS.TEXT }}>Evening Reflection</span>
                    </label>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t" style={{ borderColor: COLORS.SUBTLE }}>
                <Button onClick={onSave} disabled={isSaving} variant="primary" size="md" className="w-full">
                    {isSaving ? <><Loader className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 
                               <><Save className="w-5 h-5 mr-2" />Save Reflection</>}
                </Button>
            </div>
        </Card>
    );
};
