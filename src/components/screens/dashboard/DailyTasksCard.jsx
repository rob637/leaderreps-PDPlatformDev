// src/components/screens/dashboard/DailyTasksCard.jsx
// Arena v1.0 Scope: Daily Tasks component to replace Social Pod
import React, { useState } from 'react';
import { Check, Plus, X, Clock, Calendar } from 'lucide-react';

// LEADERREPS.COM OFFICIAL CORPORATE COLORS - VERIFIED 11/12/25
const COLORS = { 
  // === PRIMARY BRAND COLORS (from leaderreps.com) ===
  NAVY: '#002E47',        // Primary text, headers, navigation
  ORANGE: '#E04E1B',      // Call-to-action buttons, highlights, alerts  
  TEAL: '#47A88D',        // Secondary buttons, success states, accents
  LIGHT_GRAY: '#FCFCFA',  // Page backgrounds, subtle surfaces
  
  // === SEMANTIC MAPPINGS (using ONLY corporate colors) ===
  BLUE: '#002E47',        // Map to NAVY
  GREEN: '#47A88D',       // Map to TEAL  
  AMBER: '#E04E1B',       // Map to ORANGE
  RED: '#E04E1B',         // Map to ORANGE
  PURPLE: '#47A88D',      // Map to TEAL
  
  // === TEXT & BACKGROUNDS (corporate colors only) ===
  TEXT: '#002E47',        // NAVY for all text
  MUTED: '#47A88D',       // TEAL for muted text
  BG: '#FCFCFA',          // LIGHT_GRAY for backgrounds
  OFF_WHITE: '#FCFCFA',   // Same as BG
  SUBTLE: '#47A88D'       // TEAL for subtle elements
};

const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: `text-white hover:shadow-lg focus:ring-2 focus:ring-teal-500`,
    secondary: `text-white hover:opacity-90 focus:ring-2 focus:ring-blue-500`,
    outline: `border-2 text-teal-600 hover:text-white focus:ring-2 focus:ring-teal-500`,
    ghost: `text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500`,
    danger: `bg-red-600 text-white hover:opacity-90 focus:ring-2 focus:ring-red-500`
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={{
        background: variant === 'primary' ? `linear-gradient(135deg, ${COLORS.TEAL}, ${COLORS.BLUE})` : 
                   variant === 'outline' ? 'transparent' :
                   variant === 'secondary' ? COLORS.NAVY :
                   undefined,
        borderColor: variant === 'outline' ? COLORS.TEAL : undefined
      }}
    >
      {children}
    </button>
  );
};

const Card = ({ children, title, accent, className = '' }) => {
  const accentColors = {
    TEAL: COLORS.TEAL,
    NAVY: COLORS.NAVY,
    ORANGE: COLORS.ORANGE,
    BLUE: COLORS.BLUE,
    PURPLE: COLORS.PURPLE
  };
  
  const accentColor = accent ? accentColors[accent] : COLORS.TEAL;
  
  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border-l-4 p-6 ${className}`}
      style={{ borderLeftColor: accentColor }}
    >
      {title && (
        <h3 className="text-xl font-bold mb-4" style={{ color: COLORS.NAVY }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
};

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
      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: `${COLORS.BLUE}10` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold" style={{ color: COLORS.BLUE }}>
            Daily Progress
          </span>
          <span className="text-sm font-bold" style={{ color: COLORS.BLUE }}>
            {completedTasks.length} of {otherTasks.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${progressPercentage}%`,
              backgroundColor: COLORS.BLUE
            }}
          />
        </div>
      </div>

      {/* Today's WIN Display */}
      {morningWIN && (
        <div className="mb-4 p-3 rounded-lg border-2" style={{ 
          backgroundColor: winCompleted ? `${COLORS.GREEN}10` : `${COLORS.ORANGE}10`,
          borderColor: winCompleted ? `${COLORS.GREEN}30` : `${COLORS.ORANGE}30`
        }}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold mb-1" style={{ 
                color: winCompleted ? COLORS.GREEN : COLORS.ORANGE 
              }}>
                🏆 TODAY'S WIN:
              </p>
              <p className="text-sm" style={{ color: COLORS.TEXT }}>
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
          <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.MUTED }} />
          <p className="text-sm font-medium mb-1" style={{ color: COLORS.TEXT }}>
            No tasks for today
          </p>
          <p className="text-xs" style={{ color: COLORS.MUTED }}>
            Add your first task or set today's WIN to get started
          </p>
        </div>
      )}

    </Card>
  );
};

export default DailyTasksCard;