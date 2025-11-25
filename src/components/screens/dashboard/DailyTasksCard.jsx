// src/components/screens/dashboard/DailyTasksCard.jsx
// Arena v1.0 Scope: Daily Tasks component to replace Social Pod
import React, { useState } from 'react';
import { Check, Plus, X, Clock, Calendar } from 'lucide-react';
import { Button, Card } from '../../ui';

// Use CSS variables for corporate colors - see src/styles/global.css
// --corporate-navy, --corporate-orange, --corporate-teal, --corporate-light-gray

const TaskItem = ({ task, onToggle, onRemove, showRemove = true }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 ${
      task.completed 
        ? 'bg-green-50 border-green-200' 
        : 'bg-white border-gray-200 hover:border-gray-300'
    }`}>
      <button
        onClick={() => onToggle(task.id)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
          task.completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-teal-400'
        }`}
      >
        {task.completed && <Check className="w-3 h-3" />}
      </button>
      
      <div className="flex-1">
        <p className={`text-sm ${
          task.completed 
            ? 'text-green-700 line-through' 
            : 'text-gray-700'
        }`}>
          {task.text}
        </p>
        {task.isSystem && (
          <p className="text-xs text-gray-500 mt-1">
            System Task
          </p>
        )}
      </div>
      
      {showRemove && !task.isSystem && (
        <button
          onClick={() => onRemove(task.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const DailyTasksCard = ({ 
  otherTasks = [], 
  morningWIN = '', 
  winCompleted = false,
  onToggleTask, 
  onRemoveTask, 
  onAddTask,
  onToggleWIN
}) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      onAddTask(newTaskText.trim());
      setNewTaskText('');
      setShowAddTask(false);
    }
  };

  const completedTasks = otherTasks.filter(task => task.completed);
  const pendingTasks = otherTasks.filter(task => !task.completed);
  const progressPercentage = otherTasks.length > 0 ? (completedTasks.length / otherTasks.length) * 100 : 0;

  return (
    <Card title="📋 Daily Tasks" accent="BLUE">
      
      {/* Progress Overview */}
      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--corporate-navy-10)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-corporate-navy">
            Daily Progress
          </span>
          <span className="text-sm font-bold text-corporate-navy">
            {completedTasks.length} of {otherTasks.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500 bg-corporate-navy"
            style={{ 
              width: `${progressPercentage}%`
            }}
          />
        </div>
      </div>

      {/* Today's WIN Display */}
      {morningWIN && (
        <div className="mb-4 p-3 rounded-lg border-2" style={{ 
          backgroundColor: winCompleted ? 'var(--corporate-teal-10)' : 'var(--corporate-orange-10)',
          borderColor: winCompleted ? 'var(--corporate-teal-30)' : 'var(--corporate-orange-30)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold mb-1" style={{ 
                color: winCompleted ? 'var(--corporate-teal)' : 'var(--corporate-orange)' 
              }}>
                🏆 TODAY'S WIN:
              </p>
              <p className="text-sm text-corporate-navy">
                {morningWIN}
              </p>
            </div>
            <button
              onClick={onToggleWIN}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ml-3 ${
                winCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'border-orange-400 hover:border-orange-500'
              }`}
            >
              {winCompleted && <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-3 mb-4">
        {/* Pending Tasks First */}
        {pendingTasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggleTask}
            onRemove={onRemoveTask}
          />
        ))}
        
        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Completed ({completedTasks.length})
            </p>
            {completedTasks.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggleTask}
                onRemove={onRemoveTask}
                showRemove={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add New Task */}
      {showAddTask ? (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
            autoFocus
          />
          <Button
            onClick={handleAddTask}
            variant="primary"
            size="sm"
            disabled={!newTaskText.trim()}
          >
            Add
          </Button>
          <Button
            onClick={() => {
              setShowAddTask(false);
              setNewTaskText('');
            }}
            variant="ghost"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => setShowAddTask(true)}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Task
        </Button>
      )}

      {/* Empty State */}
      {otherTasks.length === 0 && !morningWIN && (
        <div className="text-center py-6">
          <Clock className="w-12 h-12 mx-auto mb-3 text-slate-500" />
          <p className="text-sm font-medium mb-1 text-corporate-navy">
            No tasks for today
          </p>
          <p className="text-xs text-slate-500">
            Add your first task or set today's WIN to get started
          </p>
        </div>
      )}

    </Card>
  );
};

export default DailyTasksCard;