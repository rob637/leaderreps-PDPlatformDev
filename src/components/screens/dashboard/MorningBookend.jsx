// src/components/dashboard/MorningBookend.jsx
// Morning Bookend Component for AM Planning
// Added 10/28/25 per boss feedback

import React, { useState } from 'react';
import {
  Target, Clock, User, Save, Loader, ChevronDown, ChevronUp, Plus, X
} from 'lucide-react';
import { Button, Card } from '../../ui';

/* =========================================================
   COLORS - Now using CSS variables from global.css
   --corporate-navy, --corporate-teal, --corporate-orange, etc.
========================================================= */

/* =========================================================
   Morning Bookend Component
========================================================= */
export const MorningBookend = ({ 
    dailyWIN, 
    setDailyWIN,
    otherTasks,
    onAddTask,
    onToggleTask,
    onRemoveTask,
    showLIS,
    setShowLIS,
    identityStatement,
    onSave,
    isSaving
}) => {
    const [newTaskText, setNewTaskText] = useState('');
    
    const handleAddClick = () => {
        if (newTaskText.trim()) {
            onAddTask(newTaskText);
            setNewTaskText('');
        }
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddClick();
        }
    };
    
    return (
        // REQ #1: Increased min-height
        <Card title="Morning Bookend" icon={Target} accent='ORANGE' className="min-h-[680px]">
            {/* Daily WIN */}
            <div className="mb-6">
                <label className="text-sm font-semibold mb-2 flex items-center" className="text-corporate-navy">
                    <Target className="w-4 h-4 mr-1" className="text-corporate-orange" />
                    Today's WIN (What's Important Now - #1 Priority)
                </label>
                <textarea 
                    value={dailyWIN}
                    onChange={(e) => setDailyWIN(e.target.value)}
                    placeholder="What is the ONE thing that must get done today?"
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 transition-all outline-none"
                    rows={2}
                />
            </div>

            {/* Other Important Tasks */}
            <div className="mb-6">
                <label className="text-sm font-semibold mb-2 flex items-center justify-between" className="text-corporate-navy">
                    <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" className="text-corporate-teal" />
                        Other Important Tasks ({otherTasks.length}/5)
                    </span>
                </label>
                
                {/* Task List */}
                <div className="space-y-2 mb-3">
                    {otherTasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 p-2 rounded bg-gray-50 border" className="border-slate-200">
                            <input 
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => onToggleTask(task.id)}
                                className="w-4 h-4 flex-shrink-0"
                                style={{ accentColor: 'var(--corporate-teal)' }}
                            />
                            <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                {task.text}
                            </span>
                            <button
                                onClick={() => onRemoveTask(task.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove task"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
                
                {/* Add Task Input */}
                {otherTasks.length < 5 && (
                    <div className="flex gap-2">
                        <input 
                            type="text"
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Add another task..."
                            className="flex-1 p-2 text-sm border border-slate-200 rounded-lg focus:ring-2 transition-all outline-none"
                        />
                        <Button 
                            onClick={handleAddClick}
                            variant="outline"
                            size="sm"
                            disabled={!newTaskText.trim()}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            {/* Leadership Identity Statement (Expandable) */}
            <div className="pt-4 border-t" className="border-slate-200">
                <button 
                    onClick={() => setShowLIS(!showLIS)}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80 w-full"
                    className="text-corporate-teal"
                >
                    <User className="w-4 h-4" />
                    {showLIS ? 'Hide' : 'Read'} Leadership Identity Statement
                    {showLIS ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showLIS && (
                    <div className="mt-3 p-4 rounded-lg border" 
                         style={{ 
                             backgroundColor: 'var(--corporate-teal-10)',
                             borderColor: 'var(--corporate-teal-20)'
                         }}>
                        <p className="text-sm italic text-corporate-navy">{identityStatement}</p>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t" className="border-slate-200">
                <Button
                    onClick={onSave}
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
                            Save Morning Plan
                        </>
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default MorningBookend;