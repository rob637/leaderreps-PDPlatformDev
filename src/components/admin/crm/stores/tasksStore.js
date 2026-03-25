import { create } from 'zustand';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  where,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getCanonicalEmail } from '../config/team';

const COLLECTION = 'team_tasks';

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Low', color: '#64748b' },
  { id: 'medium', label: 'Medium', color: '#f59e0b' },
  { id: 'high', label: 'High', color: '#ef4444' },
];

export const TASK_TYPES = [
  { id: 'follow_up', label: 'Follow Up', icon: 'Phone' },
  { id: 'email', label: 'Send Email', icon: 'Mail' },
  { id: 'meeting', label: 'Schedule Meeting', icon: 'Calendar' },
  { id: 'linkedin', label: 'LinkedIn Outreach', icon: 'Linkedin' },
  { id: 'research', label: 'Research', icon: 'Search' },
  { id: 'other', label: 'Other', icon: 'CheckSquare' },
];

export const useTasksStore = create((set, get) => ({
  // State
  tasks: [],
  loading: true,
  error: null,

  // Subscribe to tasks for current user
  subscribeToTasks: (userEmail) => {
    set({ loading: true });
    
    // Use canonical email for consistent data access
    const canonicalEmail = getCanonicalEmail(userEmail);
    
    const q = query(
      collection(db, COLLECTION),
      where('ownerEmail', '==', canonicalEmail),
      orderBy('dueDate', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const tasks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        set({ tasks, loading: false, error: null });
      },
      (error) => {
        console.error('Error fetching tasks:', error);
        set({ error: error.message, loading: false });
      }
    );
    
    return unsubscribe;
  },

  // Get tasks for a specific prospect
  getTasksForProspect: (prospectId) => {
    return get().tasks.filter(t => t.prospectId === prospectId);
  },

  // Get overdue tasks
  getOverdueTasks: () => {
    const now = new Date().toISOString();
    return get().tasks.filter(t => !t.completed && t.dueDate < now);
  },

  // Get tasks due today
  getTodayTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(t => 
      !t.completed && t.dueDate?.startsWith(today)
    );
  },

  // Get upcoming tasks (next 7 days)
  getUpcomingTasks: () => {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return get().tasks.filter(t => {
      if (t.completed) return false;
      const dueDate = new Date(t.dueDate);
      return dueDate >= now && dueDate <= weekFromNow;
    });
  },

  // Add a new task
  addTask: async (taskData, userEmail) => {
    try {
      const canonicalEmail = getCanonicalEmail(userEmail);
      const newTask = {
        ...taskData,
        ownerEmail: canonicalEmail,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, COLLECTION), newTask);
      
      set(state => ({
        tasks: [...state.tasks, { id: docRef.id, ...newTask }].sort(
          (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
        )
      }));
      
      return { id: docRef.id, ...newTask };
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
  },

  // Update a task
  updateTask: async (id, updates) => {
    try {
      const docRef = doc(db, COLLECTION, id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, updateData);
      
      set(state => ({
        tasks: state.tasks.map(t => 
          t.id === id ? { ...t, ...updateData } : t
        )
      }));
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Toggle task completion
  toggleTaskComplete: async (id) => {
    const task = get().tasks.find(t => t.id === id);
    if (task) {
      await get().updateTask(id, { 
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : null
      });
    }
  },

  // Delete a task
  deleteTask: async (id) => {
    try {
      await deleteDoc(doc(db, COLLECTION, id));
      set(state => ({
        tasks: state.tasks.filter(t => t.id !== id)
      }));
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },
}));
