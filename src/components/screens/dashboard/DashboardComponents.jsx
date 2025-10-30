// src/components/screens/dashboard/DashboardComponents.jsx
// MODIFIED: 10/30/25 - Fixed SocialPodCard placeholder and Morning/Evening Bookend heights.

// ... (All imports remain the same)

/* =========================================================
   (Unchanged Components: COLORS, Button, Card, ModeSwitch, StreakTracker, TabButton, DynamicBookendContainer)
========================================================= */


/* =========================================================
   MORNING BOOKEND COMPONENT (WITH LAYOUT FIX)
========================================================= */
export const MorningBookend = ({ 
    dailyWIN, setDailyWIN, otherTasks, onAddTask, onToggleTask, onRemoveTask,
    showLIS, setShowLIS, identityStatement, onSave, isSaving, 
    onToggleWIN, onSaveWIN,
    completedAt, winCompleted
}) => {
    // ... (logic remains the same)
    
    // CHECKLIST MODE - After completion
    if (isChecklistMode) {
        return (
            <div className="space-y-4">
                {/* Header */}
                {/* ... (Header remains the same) ... */}
                
                {/* WIN Display with Checkbox */}
                {/* ... (WIN Display remains the same) ... */}
                
                {/* Tasks Display with Checkboxes - MIN-HEIGHT FIX APPLIED */}
                <div className="space-y-2" style={{ minHeight: '180px' }}> {/* INCREASED HEIGHT FOR STABILITY */}
                    <p className="text-xs font-semibold" style={{ color: COLORS.MUTED }}>
                        📋 OTHER TASKS:
                    </p>
                    {/* ... (Task rendering logic remains the same) ... */}
                    {otherTasks && otherTasks.length > 0 ? (
                        otherTasks.map((task, idx) => (
                           // ... (task JSX remains the same) ...
                           <div key={task.id || idx} 
                                 className="flex items-center gap-3 p-2 border rounded-lg"
                                 style={{ borderColor: task.completed ? COLORS.GREEN : COLORS.SUBTLE }}>
                                
                                {task.isSystem ? (
                                    <button 
                                        onClick={task.onClick}
                                        className="text-sm flex-1 text-left font-medium hover:text-teal-600 transition-colors"
                                        style={{ color: COLORS.NAVY }}
                                    >
                                        <span className="mr-2 text-red-500">→</span>
                                        {task.text}
                                    </button>
                                ) : (
                                  <>
                                    <input 
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => onToggleTask(task.id ?? idx)}
                                        className="w-4 h-4"
                                        style={{ accentColor: COLORS.TEAL }}
                                    />
                                    <span className={`text-sm flex-1 ${task.completed ? 'line-through opacity-60' : ''}`}
                                        style={{ color: COLORS.TEXT }}>
                                        {task.text}
                                    </span>
                                  </>
                                )}
                                {!task.isSystem && !task.completed && (
                                    <button 
                                        onClick={() => onRemoveTask(task.id ?? idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm italic pt-2" style={{ color: COLORS.MUTED }}>No tasks were set for today.</p>
                    )}
                </div>
                
                {/* ... (LIS Display and Completion Status remain the same) ... */}
            </div>
        );
    }
    
    // INPUT MODE - Before completion
    return (
        <div className="space-y-4">
            {/* ... (Header, Warnings, Why It Matters, WIN Input remain the same) ... */}
            
            {/* Tasks Input - MIN-HEIGHT FIX APPLIED */}
            <div style={{ minHeight: '180px' }}> {/* INCREASED HEIGHT FOR STABILITY */}
                <label className="text-sm font-semibold mb-2 flex items-center justify-between" style={{ color: COLORS.TEXT }}>
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" style={{ color: COLORS.TEAL }} />
                        Other Important Tasks ({otherTasks?.length || 0}/5)
                    </span>
                </label>
                
                {/* Existing Tasks */}
                {otherTasks && otherTasks.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {/* ... (Task rendering logic remains the same) ... */}
                        {otherTasks.map((task, idx) => (
                            <div key={task.id || idx} 
                                 className="flex items-center gap-2 p-2 border rounded-lg"
                                 style={{ borderColor: COLORS.SUBTLE, backgroundColor: COLORS.LIGHT_GRAY }}>
                                
                                {task.isSystem ? (
                                    <button 
                                        onClick={task.onClick}
                                        className="text-sm flex-1 text-left font-medium hover:text-teal-600 transition-colors"
                                        style={{ color: COLORS.NAVY }}
                                    >
                                        <span className="mr-2 text-red-500">→</span>
                                        {task.text}
                                    </button>
                                ) : (
                                    <span className="text-sm flex-1" style={{ color: COLORS.TEXT }}>{task.text}</span>
                                )}

                                {!task.isSystem && (
                                    <button 
                                        onClick={() => onRemoveTask(task.id ?? idx)}
                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Add New Task */}
                {(!otherTasks || otherTasks.length < 5) && (
                    <div className="flex gap-2">
                        <input 
                            type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyPress={handleKeyPress} placeholder="Add a task (auto-saves when you click +)..."
                            className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 transition-all"
                            style={{ borderColor: COLORS.SUBTLE }}
                        />
                        <button 
                            onClick={handleAddClick}
                            disabled={!newTaskText.trim() || (otherTasks && otherTasks.length >= 5)}
                            className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                            style={{ backgroundColor: COLORS.TEAL }}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* ... (LIS Toggle and Validation remain the same) ... */}
        </div>
    );
};

/* =========================================================
   EVENING BOOKEND COMPONENT (WITH LAYOUT FIX)
========================================================= */
export const EveningBookend = ({ 
    reflectionGood, setReflectionGood, reflectionBetter, setReflectionBetter,
    reflectionBest, setReflectionBest, habitsCompleted, onHabitToggle, onSave, isSaving,
    onNavigate, amWinCompleted, amTasksCompleted
}) => {
    // Determine the calculated stable height based on MorningBookend
    const minHeightStyle = { minHeight: '445px' }; // Height based on a stable MorningBookend height
    
    return (
        <div className="space-y-4" style={minHeightStyle}>
            {/* ... (All content remains the same) ... */}
            
            {/* ... (The rest of the component remains the same) ... */}
        </div>
    );
};

/* =========================================================
   SOCIAL POD CARD (FIXED Issue 1)
========================================================= */
export const SocialPodCard = ({ podMembers, activityFeed, onSendMessage, onFindPod }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  return (
    <Card title="🤝 Social Pod Feed" accent='PURPLE'>
      {/* ... (Pod Members and Activity Feed sections remain the same) ... */}

      {podMembers && podMembers.length > 0 ? (
        /* ... (Content for when members exist remains the same) ... */
        <div className="pt-3 border-t" style={{ borderColor: COLORS.SUBTLE }}>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Share your progress..."
              className="flex-1 p-2 border rounded-lg text-sm"
              style={{ borderColor: COLORS.SUBTLE }}
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: COLORS.PURPLE }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty State (FIX: Removed "FIX #8" comment) */
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.MUTED }} />
          <p className="text-sm font-semibold mb-2" style={{ color: COLORS.NAVY }}>
            No Pod Members Yet
          </p>
          <p className="text-xs mb-4" style={{ color: COLORS.MUTED }}>
            Connect with other leaders to build accountability
          </p>
          <Button onClick={onFindPod} variant="outline" size="sm">
            Find a Pod
          </Button>
        </div>
      )}
    </Card>
  );
};
// ... (The rest of DashboardComponents.jsx remains the same)