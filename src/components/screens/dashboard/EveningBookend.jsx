// src/components/dashboard/EveningBookend.jsx
// Evening Bookend Component for PM Reflection
// Added 10/28/25 per boss feedback

import React, { useState } from 'react';
import {
  CheckCircle, TrendingUp, Star, Save, Loader, Moon, Clock, Plus, X
} from 'lucide-react';
import { Button, Card } from '../../ui';

/* =========================================================
   COLORS - Now using CSS variables from global.css
   --corporate-navy, --corporate-teal, --corporate-orange, etc.
========================================================= */

/* =========================================================
   Task Section Component (Simplified for Evening)
========================================================= */
const TaskSection = ({ otherTasks, onAddTask, onToggleTask, onRemoveTask }) => {
    const [newTaskText, setNewTaskText] = useState('');
    
    const handleAddClick = () => {
        if (newTaskText.trim()) {
            onAddTask(newTaskText);
            setNewTaskText('');
        }
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleAddClick();
    };
    
    return (
        <div>
            <label className="text-sm font-semibold mb-2 flex items-center justify-between" className="text-corporate-navy">
                <span className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" className="text-corporate-teal" />
                    Daily Tasks ({otherTasks?.length || 0}/5)
                </span>
            </label>
            
            {/* Existing Tasks */}
            {otherTasks && otherTasks.length > 0 && (
                <div className="space-y-2 mb-3">
                    {otherTasks.map((task, idx) => (
                        <div key={task.id || idx} 
                             className="flex items-center gap-2 p-2 border rounded-lg"
                             style={{ borderColor: '#E5E7EB', backgroundColor: 'var(--corporate-light-gray)' }}>
                            
                            {/* Checkbox for task completion */}
                            <input
                                type="checkbox"
                                checked={task.completed || false}
                                onChange={() => onToggleTask(task.id || idx)}
                                className="w-4 h-4"
                                style={{ accentColor: 'var(--corporate-teal)' }}
                            />
                            
                            <span className={`text-sm flex-1 ${task.completed ? 'line-through opacity-60' : ''}`} 
                                  className="text-corporate-navy">
                                {task.text}
                            </span>
                            
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
                        type="text" 
                        value={newTaskText} 
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyPress={handleKeyPress} 
                        placeholder="Add a task..."
                        className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 transition-all"
                        className="border-slate-200"
                    />
                    <button 
                        onClick={handleAddClick}
                        disabled={!newTaskText.trim() || (otherTasks && otherTasks.length >= 5)}
                        className="px-4 py-2 rounded-lg font-semibold text-white transition-all disabled:opacity-50"
                        className="bg-corporate-teal"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

/* =========================================================
   Evening Bookend Component
========================================================= */
export const EveningBookend = ({ 
    reflectionGood,
    setReflectionGood,
    reflectionBetter,
    setReflectionBetter,
    reflectionBest,
    setReflectionBest,
    habitsCompleted = { readLIS: false, completedDailyRep: false, eveningReflection: false },
    onHabitToggle,
    onSave,
    isSaving,
    // Task management props
    otherTasks = [],
    onAddTask,
    onToggleTask,
    onRemoveTask
}) => {
    // Defensive check to ensure habitsCompleted is always an object
    const safeHabitsCompleted = habitsCompleted || { readLIS: false, completedDailyRep: false, eveningReflection: false };
    
    return (
        // REQ #1: Increased min-height
        <Card title="Evening Bookend - Daily Reflection" icon={Moon} accent='NAVY'>
            {/* Good - What went well */}
            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" className="text-corporate-teal">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Good - What went well today?
                </label>
                <textarea 
                    value={reflectionGood}
                    onChange={(e) => setReflectionGood(e.target.value)}
                    placeholder="Celebrate your wins..."
                    className="w-full p-3 border rounded-lg focus:ring-2 transition-all outline-none"
                    style={{ 
                        borderColor: 'var(--corporate-teal-20)'
                    }}
                    rows={2}
                />
            </div>

            {/* Better - What needs improvement */}
            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" style={{ color: 'var(--corporate-orange)' }}>
                    <TrendingUp className="w-4 h-4 mr-1" />
                    Better - What needs improvement?
                </label>
                <textarea 
                    value={reflectionBetter}
                    onChange={(e) => setReflectionBetter(e.target.value)}
                    placeholder="Areas for growth..."
                    className="w-full p-3 border rounded-lg focus:ring-2 transition-all outline-none"
                    style={{ 
                        borderColor: 'var(--corporate-orange-20)'
                    }}
                    rows={2}
                />
            </div>

            {/* Best - What to do tomorrow */}
            <div className="mb-4">
                <label className="text-sm font-semibold mb-2 flex items-center" className="text-corporate-navy">
                    <Star className="w-4 h-4 mr-1" />
                    Best - What do I need to do to show up as my best tomorrow?
                </label>
                <textarea 
                    value={reflectionBest}
                    onChange={(e) => setReflectionBest(e.target.value)}
                    placeholder="Tomorrow's commitment..."
                    className="w-full p-3 border rounded-lg focus:ring-2 transition-all outline-none"
                    style={{ 
                        borderColor: 'var(--corporate-navy-20)'
                    }}
                    rows={2}
                />
            </div>

            {/* Daily Tasks Section */}
            {onAddTask && (
                <div className="pt-4 border-t" className="border-slate-200">
                    <TaskSection 
                        otherTasks={otherTasks}
                        onAddTask={onAddTask}
                        onToggleTask={onToggleTask}
                        onRemoveTask={onRemoveTask}
                    />
                </div>
            )}

            {/* Daily Habits Tracker */}
            <div className="pt-4 border-t" className="border-slate-200">
                <p className="text-sm font-semibold mb-3" className="text-corporate-navy">Daily Habits Tracker</p>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={safeHabitsCompleted.readLIS}
                            onChange={(e) => onHabitToggle('readLIS', e.target.checked)}
                            className="w-4 h-4"
                            style={{ accentColor: 'var(--corporate-teal)' }}
                        />
                        <span className="text-sm text-corporate-navy">Read LIS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={safeHabitsCompleted.completedDailyRep}
                            onChange={(e) => onHabitToggle('completedDailyRep', e.target.checked)}
                            className="w-4 h-4"
                            style={{ accentColor: 'var(--corporate-teal)' }}
                        />
                        <span className="text-sm text-corporate-navy">Complete Daily Rep</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                        <input 
                            type="checkbox" 
                            checked={safeHabitsCompleted.eveningReflection}
                            onChange={(e) => onHabitToggle('eveningReflection', e.target.checked)}
                            className="w-4 h-4"
                            style={{ accentColor: 'var(--corporate-teal)' }}
                        />
                        <span className="text-sm text-corporate-navy">Evening Reflection</span>
                    </label>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t" className="border-slate-200">
                <Button
                    onClick={() => {
                        if (onSave) onSave();
                    }}
                    disabled={isSaving}
                    variant="primary"
                    size="md"
                    className="w-full"
                >
                    {isSaving ? (
                        <>
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5 mr-2" />
                            Save Reflection
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default EveningBookend;