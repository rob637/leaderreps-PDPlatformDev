// src/components/admin/crm/components/prospects/ProspectTasksSection.jsx
//
// Tasks panel extracted from ProspectDetailPanel. Pure presentational —
// all state and handlers live in the parent and are passed in as props.

import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, Circle, X, Plus } from 'lucide-react';
import { TASK_TYPES, TASK_PRIORITIES } from '../../stores/tasksStore';

export default function ProspectTasksSection({
  tasks,
  expanded,
  showAddTask,
  newTask,
  onToggleSection,
  onSetShowAddTask,
  onSetNewTask,
  onAddTask,
  onToggleTaskComplete,
  onDeleteTask,
  SectionHeader,
  Bell,
}) {
  const openCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-1">
      <SectionHeader
        title="Follow-up Tasks"
        section="tasks"
        icon={Bell}
        badge={openCount || null}
      />

      {expanded && (
        <div className="space-y-2 mt-2">
          {tasks.length === 0 && !showAddTask ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">No tasks yet</p>
          ) : (
            <div className="space-y-1">
              {tasks.map((task) => {
                const isOverdue =
                  !task.completed && task.dueDate && new Date(task.dueDate) < new Date();
                const priority = TASK_PRIORITIES.find((p) => p.id === task.priority);
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-2 p-2 rounded-lg ${
                      task.completed
                        ? 'bg-slate-50 dark:bg-slate-700/50 opacity-60'
                        : isOverdue
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-slate-50 dark:bg-slate-700'
                    }`}
                  >
                    <button onClick={() => onToggleTaskComplete(task.id)} className="mt-0.5">
                      {task.completed ? (
                        <CheckCircle className="w-4 h-4 text-brand-teal" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 dark:text-slate-500 hover:text-brand-teal" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          task.completed
                            ? 'line-through text-slate-500 dark:text-slate-500'
                            : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {task.dueDate && (
                          <span
                            className={`text-xs ${
                              isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'
                            }`}
                          >
                            {format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        )}
                        {priority && (
                          <span
                            className="text-xs px-1.5 rounded"
                            style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
                          >
                            {priority.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded"
                    >
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Task Form */}
          {showAddTask ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg space-y-2">
              <input
                value={newTask.title}
                onChange={(e) => onSetNewTask({ ...newTask, title: e.target.value })}
                className="w-full text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                placeholder="Task description..."
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newTask.type}
                  onChange={(e) => onSetNewTask({ ...newTask, type: e.target.value })}
                  className="text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-2 py-1.5 text-slate-900 dark:text-slate-100 outline-none"
                >
                  {TASK_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <select
                  value={newTask.priority}
                  onChange={(e) => onSetNewTask({ ...newTask, priority: e.target.value })}
                  className="text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-2 py-1.5 text-slate-900 dark:text-slate-100 outline-none"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="date"
                value={newTask.dueDate}
                onChange={(e) => onSetNewTask({ ...newTask, dueDate: e.target.value })}
                className="w-full text-sm bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSetShowAddTask(false)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 dark:border-slate-500 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={onAddTask}
                  className="flex-1 px-3 py-1.5 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90"
                >
                  Add Task
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => onSetShowAddTask(true)}
              className="flex items-center gap-2 text-sm text-brand-teal hover:text-brand-teal/80"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
