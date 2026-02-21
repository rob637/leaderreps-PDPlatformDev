import React, { useEffect, useState } from 'react';
import { useTasksStore, TASK_TYPES, TASK_PRIORITIES } from '../stores/tasksStore';
import { useProspectsStore } from '../stores/prospectsStore';
import { useAuthStore } from '../stores/authStore';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  Circle,
  Clock,
  Calendar,
  User,
  Plus,
  Trash2,
  Filter,
  AlertTriangle,
  Bell
} from 'lucide-react';

const TasksPage = () => {
  const { user } = useAuthStore();
  const { 
    tasks, 
    loading, 
    subscribeToTasks, 
    toggleTaskComplete, 
    deleteTask,
    addTask
  } = useTasksStore();
  const { prospects, setSelectedProspect } = useProspectsStore();
  
  const [filter, setFilter] = useState('all'); // all, today, upcoming, overdue, completed
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    type: 'follow_up',
    priority: 'medium',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    prospectId: '',
    prospectName: ''
  });

  useEffect(() => {
    if (user?.email) {
      const unsubscribe = subscribeToTasks(user.email);
      return () => unsubscribe();
    }
  }, [user?.email, subscribeToTasks]);

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      switch (filter) {
        case 'today':
          return !task.completed && task.dueDate && isToday(new Date(task.dueDate));
        case 'upcoming':
          return !task.completed && task.dueDate && !isPast(new Date(task.dueDate));
        case 'overdue':
          return !task.completed && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
        case 'completed':
          return task.completed;
        default:
          return !task.completed;
      }
    });
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('Task title is required');
      return;
    }
    if (!newTask.dueDate) {
      toast.error('Due date is required');
      return;
    }
    
    try {
      await addTask({
        ...newTask,
        dueDate: newTask.dueDate
      }, user.email);
      toast.success('Task created');
      setNewTask({
        title: '',
        type: 'follow_up',
        priority: 'medium',
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        prospectId: '',
        prospectName: ''
      });
      setShowAddTask(false);
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleProspectSelect = (prospectId) => {
    const prospect = prospects.find(p => p.id === prospectId);
    setNewTask({
      ...newTask,
      prospectId,
      prospectName: prospect?.name || ''
    });
  };

  const filteredTasks = getFilteredTasks();
  const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
  const todayTasks = tasks.filter(t => !t.completed && t.dueDate && isToday(new Date(t.dueDate)));

  const formatDueDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getTaskIcon = (type) => {
    const taskType = TASK_TYPES.find(t => t.id === type);
    return taskType?.label || type;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-brand-teal border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Tasks</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your follow-up tasks and reminders
            </p>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90 transition"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex gap-4">
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {overdueTasks.length} overdue
            </div>
          )}
          {todayTasks.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-medium">
              <Bell className="w-4 h-4" />
              {todayTasks.length} due today
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          {[
            { id: 'all', label: 'Active' },
            { id: 'today', label: 'Today' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'completed', label: 'Completed' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filter === f.id 
                  ? 'bg-brand-teal text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-1">
              {filter === 'completed' ? 'No completed tasks' : 'No tasks'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filter === 'completed' 
                ? 'Completed tasks will appear here' 
                : 'Create a task to stay on top of your follow-ups'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map(task => {
              const isOverdue = !task.completed && task.dueDate && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));
              const priority = TASK_PRIORITIES.find(p => p.id === task.priority);
              const prospect = prospects.find(p => p.id === task.prospectId);
              
              return (
                <div 
                  key={task.id}
                  className={`flex items-start gap-3 p-4 rounded-lg border transition ${
                    task.completed 
                      ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60' 
                      : isOverdue 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-brand-teal/30'
                  }`}
                >
                  <button
                    onClick={() => toggleTaskComplete(task.id)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle className="w-5 h-5 text-brand-teal" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300 hover:text-brand-teal transition" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-medium ${task.completed ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {task.title}
                        </p>
                        {prospect && (
                          <button
                            onClick={() => setSelectedProspect(prospect)}
                            className="text-sm text-brand-teal hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <User className="w-3 h-3" />
                            {prospect.name}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2">
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 text-xs ${
                          isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {formatDueDate(task.dueDate)}
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {getTaskIcon(task.type)}
                      </span>
                      {priority && (
                        <span 
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${priority.color}20`, color: priority.color }}
                        >
                          {priority.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddTask(false)}
          />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-elevated p-6 animate-in">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">New Task</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Task <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
                    placeholder="Follow up with..."
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Linked Prospect
                  </label>
                  <select
                    value={newTask.prospectId}
                    onChange={(e) => handleProspectSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none bg-white"
                  >
                    <option value="">No prospect linked</option>
                    {prospects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.company}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select
                      value={newTask.type}
                      onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white"
                    >
                      {TASK_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none bg-white"
                    >
                      {TASK_PRIORITIES.map(p => (
                        <option key={p.id} value={p.id}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="flex-1 px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-medium hover:bg-brand-teal/90"
                  >
                    Create Task
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
